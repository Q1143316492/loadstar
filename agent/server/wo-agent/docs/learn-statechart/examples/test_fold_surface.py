"""fold_surface 的穷举测试。

跑法（仓库根）：

    .venv/Scripts/python -m pytest docs/learn-statechart/examples/test_fold_surface.py -v

它和普通单元测试的区别：普通测试从空状态出发，测你想到的用例；这个测
**所有长度不超过 DEPTH 的事件序列**，包括你没想到的组合。
"""

from __future__ import annotations

import sys
from collections import deque
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "src"))

from llm.types import TextBlock, create_user_message  # noqa: E402
from session.events import SurfaceReplace, UserMessageEvent  # noqa: E402
from session.session import SessionEvent, fold_surface  # noqa: E402

DEPTH = 5


def _event(op, idx):
    if op == "append":
        return UserMessageEvent(message=create_user_message([TextBlock(text=f"m{idx}")]))
    start, end, sources = op
    return UserMessageEvent(
        message=create_user_message([TextBlock(text=f"r{idx}")]),
        surface_op=SurfaceReplace(start=start, end=end),
        source_event_seqs=tuple(sources),
    )


def _entries(ops):
    return [SessionEvent(seq=i, time=0, event=_event(op, i)) for i, op in enumerate(ops)]


def _surface(ops):
    try:
        return tuple(seq for seq, _ in fold_surface(_entries(ops)))
    except ValueError:
        return None


def _successors(ops):
    """所有合法动作。replace 的 source 必须覆盖表层 start..end 之间的每个节点。"""
    yield ops + ("append",)
    surface = _surface(ops)
    if not surface:
        return
    for i in range(len(surface)):
        for j in range(i, len(surface)):
            yield ops + ((surface[i], surface[j], surface[i : j + 1]),)


def _violation(ops):
    """一个状态之后必须成立的性质。返回说明或 None。"""
    nodes = fold_surface(_entries(ops))
    seqs = [seq for seq, _ in nodes]

    if len(seqs) != len(set(seqs)):
        return f"表层出现重复 seq：{seqs}"
    if any(seq < 0 or seq >= len(ops) for seq in seqs):
        return f"表层指向不存在的事件：{seqs}"
    if ops[-1] != "append":
        start, end, _ = ops[-1]
        leftover = [s for s in (start, end) if s in seqs]
        if leftover:
            return f"replace({start},{end}) 之后仍残留 {leftover}"
    return None


def test_all_sequences_up_to_depth():
    """所有长度 ≤ DEPTH 的合法序列：不变量处处成立。"""
    seen = {()}
    queue = deque([()])
    checked = 0
    while queue:
        ops = queue.popleft()
        if ops:
            checked += 1
            problem = _violation(ops)
            assert problem is None, f"序列 {ops} 违反：{problem}"
        if len(ops) >= DEPTH:
            continue
        for nxt in _successors(ops):
            if nxt not in seen:
                seen.add(nxt)
                queue.append(nxt)
    assert checked > 100, f"只检查了 {checked} 个状态，搜索没生效"
