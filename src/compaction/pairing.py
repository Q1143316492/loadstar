"""工具调用/结果配对：压缩切分不能拆开尚未闭合的 assistant 工具步。

对齐 dsh ``toolPairingBalancedBefore`` / ``After``，不做 generation cache。
平衡状态按*当前表层顺序*累计：assistant 的每个 tool-call +1，每个
tool-result -1；切点处 in-progress 为 0 才安全。
"""

from __future__ import annotations

from session import Session, fold_surface, message_chars
from session.events import SessionEventData


def _delta(event: SessionEventData) -> int:
    if event.type == "assistant/message":
        return sum(1 for block in event.message.content if block.type == "tool-call")
    if event.type == "tool/result":
        return -1
    return 0


def _cut_balanced(session: Session) -> tuple[list[int], list[bool]]:
    """返回表层 seq 列表，以及每个节点*之后*那条切是否平衡。

    长度为 N 的表层有 N 条 after-cuts；before 节点 0 的切永远平衡。
    """
    nodes = fold_surface(session.events)
    seqs = [seq for seq, _ in nodes]
    events_by_seq = {entry.seq: entry.event for entry in session.events}
    in_progress = 0
    after: list[bool] = []
    for seq in seqs:
        event = events_by_seq.get(seq)
        if event is None:
            raise ValueError(f"tool-pairing: surface seq {seq} has no matching session event")
        in_progress += _delta(event)
        if in_progress < 0:
            raise ValueError(f"tool-pairing: tool/result at seq {seq} has no matching tool-call")
        after.append(in_progress == 0)
    return seqs, after


def tool_pairing_balanced_before(session: Session, seq: int) -> bool:
    """切在该表层节点之前是否平衡（不会拆开一对 tool-call/result）。"""
    seqs, after = _cut_balanced(session)
    try:
        index = seqs.index(seq)
    except ValueError:
        raise ValueError(f"tool-pairing: seq {seq} is not a current surface node") from None
    if index == 0:
        return True
    return after[index - 1]


def tool_pairing_balanced_after(session: Session, seq: int) -> bool:
    """切在该表层节点之后是否平衡。"""
    seqs, after = _cut_balanced(session)
    try:
        index = seqs.index(seq)
    except ValueError:
        raise ValueError(f"tool-pairing: seq {seq} is not a current surface node") from None
    return after[index]
