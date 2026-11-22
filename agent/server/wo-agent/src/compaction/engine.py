"""按上下文窗口比例的压缩后端。

压力用 `session.usage.context_pressure` 估：最近一次 provider `usage` 作锚点，
其后追加的消息按字符数粗估。阈值与尾部保留都是窗口比例，对齐 dsh 默认
（阈值 = 窗口 × 0.8，尾部 = 窗口 × 0.16）。切分遵守工具配对边界。

成功路径与 dsh 相同：``compaction/start`` → 摘要 → ``compaction/summary``
→ ``user/message`` ``replace`` → ``compaction/end``。崩溃锁（未匹配 start）
视为 busy，不自动清除。
"""

from __future__ import annotations

import asyncio
import math
import uuid
from dataclasses import dataclass

from llm.types import TextBlock, create_message
from session import (
    DEFAULT_CHARS_PER_TOKEN,
    Session,
    context_pressure,
    derive_event_message,
    fold_surface,
    message_chars,
)
from session.events import (
    CompactionEnd,
    CompactionStart,
    CompactionSummary,
    SurfaceReplace,
    UserMessageEvent,
)

from .pairing import tool_pairing_balanced_after, tool_pairing_balanced_before
from .protocol import CompactionBusy, CompactionResult, CompactionTrigger, Summarizer, compact_checkpoint_source
from .summarizer import frame_summary


@dataclass(frozen=True)
class CompactionOptions:
    """窗口比例与粗估系数。

    ``context_window`` 是模型的 token 窗口；现在由宿主手写（DeepSeek 128K）。
    模型能力协商还没做，等第二个 provider 出现后改成 provider 声明的元数据。
    """

    context_window: int = 131_072
    threshold_ratio: float = 0.8
    retain_ratio: float = 0.16
    chars_per_token: float = DEFAULT_CHARS_PER_TOKEN

    @property
    def threshold_tokens(self) -> int:
        return math.floor(self.context_window * self.threshold_ratio)

    @property
    def retain_tokens(self) -> int:
        return math.floor(self.context_window * self.retain_ratio)

    @property
    def retain_chars(self) -> int:
        """尾部保留预算，换算回字符。"""
        return math.floor(self.retain_tokens * self.chars_per_token)


def unmatched_compaction_start(session: Session):
    """从尾部找未匹配的 ``compaction/start``；已有对应 ``end`` 则不是锁。"""
    for entry in reversed(session.events):
        if entry.event.type == "compaction/start":
            return entry
        if entry.event.type == "compaction/end":
            return None
    return None


def select_compactable_range(
    session: Session,
    retain_chars: int,
) -> tuple[int, int] | None:
    """头锚一段可压范围：从尾部累加直到 ``retain_chars``，再对齐到平衡切。"""
    nodes = fold_surface(session.events)
    if not nodes:
        return None
    sizes = [message_chars(message) for _, message in nodes]
    accumulated = 0
    keep_from = len(nodes)
    for index in range(len(nodes) - 1, -1, -1):
        accumulated += sizes[index]
        keep_from = index
        if accumulated >= retain_chars:
            break
    if keep_from == 0:
        return None
    seqs = [seq for seq, _ in nodes]
    while keep_from > 0:
        if tool_pairing_balanced_before(session, seqs[keep_from]):
            break
        keep_from -= 1
    if keep_from == 0:
        return None
    start = seqs[0]
    end = seqs[keep_from - 1]
    if not tool_pairing_balanced_after(session, end):
        return None
    return start, end


class BasicCompaction:
    def __init__(self, summarizer: Summarizer, options: CompactionOptions | None = None) -> None:
        self._summarizer = summarizer
        self._options = options or CompactionOptions()

    @property
    def options(self) -> CompactionOptions:
        """宿主读窗口与比例用（状态栏显示压力）。"""
        return self._options

    async def compact_if_needed(
        self,
        session: Session,
        *,
        trigger: CompactionTrigger,
        signal: asyncio.Event | None = None,
        turn: int | None = None,
    ) -> CompactionResult | None:
        if unmatched_compaction_start(session) is not None:
            return None
        if trigger == "pressure":
            pressure = context_pressure(session, chars_per_token=self._options.chars_per_token)
            if pressure.tokens < self._options.threshold_tokens:
                return None
        selected = select_compactable_range(session, self._options.retain_chars)
        if selected is None:
            return None
        try:
            return await self._compact_region(session, selected[0], selected[1], signal=signal, turn=turn)
        except Exception:
            # 自动路径：失败已写 compaction/end{error}，循环继续用未压缩历史。
            return None

    async def compact_now(
        self,
        session: Session,
        signal: asyncio.Event | None = None,
    ) -> CompactionResult | None:
        if unmatched_compaction_start(session) is not None:
            raise CompactionBusy("compaction already in progress")
        selected = select_compactable_range(session, self._options.retain_chars)
        if selected is None:
            return None
        return await self._compact_region(session, selected[0], selected[1], signal=signal, turn=None)

    async def _compact_region(
        self,
        session: Session,
        start: int,
        end: int,
        *,
        signal: asyncio.Event | None,
        turn: int | None,
    ) -> CompactionResult:
        if unmatched_compaction_start(session) is not None:
            raise CompactionBusy("compaction already in progress")
        seqs = session.surface_seqs()
        try:
            start_idx = seqs.index(start)
            end_idx = seqs.index(end)
        except ValueError as exc:
            raise ValueError(f"compact region: start {start} or end {end} not on surface") from exc
        if start_idx > end_idx:
            raise ValueError(f"compact region: start {start} is after end {end} on surface")
        if not tool_pairing_balanced_before(session, start):
            raise ValueError(f"compact region: start seq {start} is not a balanced boundary")
        if not tool_pairing_balanced_after(session, end):
            raise ValueError(f"compact region: end seq {end} is not a balanced boundary")

        shadowed_seqs = tuple(seqs[start_idx : end_idx + 1])
        region_messages = []
        events = session.events
        for seq in shadowed_seqs:
            message = derive_event_message(events[seq].event)
            if message is not None:
                region_messages.append(message)
        shadowed_chars = sum(message_chars(message) for message in region_messages)

        compaction_id = uuid.uuid4().hex
        start_entry = session.append(CompactionStart(compaction_id=compaction_id, turn=turn))
        try:
            summary = await self._summarizer.summarize(region_messages, signal=signal)
            framed = frame_summary(summary)
            if len(framed) >= shadowed_chars:
                raise RuntimeError(
                    f"summary is not smaller than the shadowed content "
                    f"({len(framed)} chars >= {shadowed_chars})"
                )
            # 摘要期间表层被改过则放弃提交（自动压缩要求 span 仍在）。
            current = session.surface_seqs()
            if current[start_idx : end_idx + 1] != list(shadowed_seqs):
                raise RuntimeError("compaction: the selected span changed during summarization")

            summary_entry = session.append(
                CompactionSummary(
                    compaction_id=compaction_id,
                    summary=summary,
                    shadowed_start=start,
                    shadowed_end=end,
                    shadowed_seqs=shadowed_seqs,
                    shadowed_chars=shadowed_chars,
                )
            )
            checkpoint = create_message(
                "user",
                [TextBlock(text=framed)],
                compact_checkpoint_source(compaction_id),
            )
            session.append(
                UserMessageEvent(
                    message=checkpoint,
                    surface_op=SurfaceReplace(start=start, end=end),
                    source_event_seqs=(start_entry.seq, summary_entry.seq, *shadowed_seqs),
                )
            )
            end_entry = session.append(CompactionEnd(compaction_id=compaction_id, turn=turn))
            return CompactionResult(
                compaction_id=compaction_id,
                start_seq=start_entry.seq,
                summary_seq=summary_entry.seq,
                end_seq=end_entry.seq,
                summary=summary,
                shadowed_range=(start, end),
                shadowed_seqs=shadowed_seqs,
                shadowed_chars=shadowed_chars,
            )
        except Exception as exc:
            session.append(
                CompactionEnd(compaction_id=compaction_id, turn=turn, error=str(exc))
            )
            raise
