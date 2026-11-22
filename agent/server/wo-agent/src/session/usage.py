"""用量与上下文压力的只读投影。

日志仍是唯一事实源：这里只从事件折叠，不写事件、不另建计量存储。

压力估算分两段。最近一次请求的 provider ``usage`` 是锚点；它之后追加的
消息按字符数粗估。锚点必须晚于最后一次压缩：压缩改变了真正会发出的上下文，
压缩之前的 usage 不再代表当前请求。没有可用锚点时整段按字符数估。
有真实 tokenizer 之前，粗估系数是显式参数，不做隐藏魔法。
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from llm.types import LLMMessage, TokenUsage

from .catalog import event_usage, spec_of
from .session import Session, fold_surface

DEFAULT_CHARS_PER_TOKEN = 2.0
"""中英混排的粗估系数；只用于锚点之后的增量或整段估算。"""


def message_chars(message: LLMMessage) -> int:
    """一条消息的字符数：粗估 token 的共同底数。"""
    total = 0
    for block in message.content:
        if block.type in ("text", "reasoning"):
            total += len(block.text)
        elif block.type == "image":
            total += len(block.url)
        elif block.type == "tool-call":
            total += len(block.id) + len(block.name) + len(block.arguments)
        elif block.type == "tool-result":
            total += len(block.tool_call_id)
            for inner in block.content:
                if inner.type in ("text", "reasoning"):
                    total += len(inner.text)
                elif inner.type == "image":
                    total += len(inner.url)
    return total


def _usage_total(usage: TokenUsage) -> int:
    """一次请求涉及的 token 总量：未缓存输入 + 缓存读写 + 输出。"""
    return usage.input + usage.cache_read + usage.cache_write + usage.output


def sum_usage(session: Session) -> TokenUsage:
    """整本日志的累计用量，按字段相加。"""
    total = TokenUsage()
    for entry in session.events:
        u = event_usage(entry.event)
        if u is None:
            continue
        total = TokenUsage(
            input=total.input + u.input,
            output=total.output + u.output,
            cache_read=total.cache_read + u.cache_read,
            cache_write=total.cache_write + u.cache_write,
            reasoning=total.reasoning + u.reasoning,
        )
    return total


@dataclass(frozen=True)
class ContextPressure:
    """当前上下文大小的估计。``anchored`` 表示有 provider ``usage`` 作锚点。"""

    tokens: int
    anchored: bool


def context_pressure(
    session: Session,
    *,
    chars_per_token: float = DEFAULT_CHARS_PER_TOKEN,
) -> ContextPressure:
    """估计下一次请求将携带的上下文大小。

    锚点扫事件日志而不是表层：空内容的 ``assistant/message``（max-tokens 步
    只带 usage）不进表层，但它的 usage 仍是有效计量。锚点还必须在最后一次
    ``compaction/end`` 之后；否则它度量的是压缩前的上下文。
    """
    events = session.events
    last_compaction_end = -1
    anchor_seq = -1
    anchor_tokens = 0
    for entry in events:
        event = entry.event
        if spec_of(event.type).resets_usage_anchor:
            last_compaction_end = entry.seq
            continue
        usage = event_usage(event)
        if usage is not None:
            anchor_seq = entry.seq
            anchor_tokens = _usage_total(usage)

    nodes = fold_surface(events)
    if anchor_seq < 0 or anchor_seq < last_compaction_end:
        total_chars = sum(message_chars(message) for _, message in nodes)
        return ContextPressure(tokens=_ceil_div(total_chars, chars_per_token), anchored=False)
    tail_chars = sum(message_chars(message) for seq, message in nodes if seq > anchor_seq)
    return ContextPressure(
        tokens=anchor_tokens + _ceil_div(tail_chars, chars_per_token),
        anchored=True,
    )


def _ceil_div(chars: int, chars_per_token: float) -> int:
    if chars <= 0:
        return 0
    return math.ceil(chars / chars_per_token)
