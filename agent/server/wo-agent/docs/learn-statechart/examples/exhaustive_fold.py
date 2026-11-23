"""穷举所有事件序列，而不是随机采样。

这是第 02 篇「随机撞」与第 04 篇「穷举所有顺序」之间的桥：
不装 Java、不学 TLA+，先把「覆盖」这件事本身做出来给你看。

    PYTHONIOENCODING=utf-8 .venv/Scripts/python docs/learn-statechart/examples/exhaustive_fold.py
"""

from __future__ import annotations

import sys
from collections import deque
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "src"))

from llm.types import TextBlock, create_user_message  # noqa: E402
from session.events import SurfaceReplace, UserMessageEvent  # noqa: E402
from session.session import SessionEvent, derive_event_message, fold_surface  # noqa: E402

DEPTH = 5


def make_event(op, idx):
    """op: "append" 或 (start, end, sources)。"""
    if op == "append":
        return UserMessageEvent(message=create_user_message([TextBlock(text=f"m{idx}")]))
    s, e, sources = op
    return UserMessageEvent(
        message=create_user_message([TextBlock(text=f"r{idx}")]),
        surface_op=SurfaceReplace(start=s, end=e),
        source_event_seqs=tuple(sources),
    )


def fold(ops):
    entries = [SessionEvent(seq=i, time=0, event=make_event(op, i)) for i, op in enumerate(ops)]
    return fold_surface(entries)


def fold_broken(ops):
    """把 start/end 当索引用的改坏版。"""
    nodes = []
    for i, op in enumerate(ops):
        entry = SessionEvent(seq=i, time=0, event=make_event(op, i))
        msg = derive_event_message(entry.event)
        if msg is None:
            continue
        if op == "append":
            nodes.append((entry.seq, msg))
            continue
        s, e, _ = op
        nodes[s : e + 1] = [(entry.seq, msg)]
    return nodes


def surface_of(ops):
    """当前表层的 seq 列表；出错返回 None。"""
    try:
        return [s for s, _ in fold(ops)]
    except ValueError:
        return None


def violates(ops, folder):
    """返回违反说明，或 None。"""
    try:
        nodes = folder(ops)
    except ValueError as exc:
        return f"抛错: {exc}"
    seqs = [s for s, _ in nodes]
    if len(seqs) != len(set(seqs)):
        return f"重复 seq: {seqs}"
    if any(s < 0 or s >= len(ops) for s in seqs):
        return f"指向不存在的 seq: {seqs}"
    if ops[-1] != "append":
        s, e, _ = ops[-1]
        still = [x for x in (s, e) if x in seqs]
        if still:
            return f"replace({s},{e}) 之后仍残留 {still}"
    return None


def successors(ops):
    """当前状态下所有合法动作。

    replace 的 source 必须覆盖表层 s..e 之间的**每一个**节点——不是数值区间。
    这正是第一次跑这个脚本时抓到的错误。
    """
    yield ops + ("append",)
    surface = surface_of(ops)
    if not surface:
        return
    for i, s in enumerate(surface):
        for e in surface[i:]:
            sources = surface[i : surface.index(e) + 1] if e in surface else ()
            yield ops + ((s, e, tuple(sources)),)


def enumerate_all(folder, name):
    """广度优先，去重，返回 (检查过的状态数, 找到的最短违反路径)。"""
    seen = {()}
    queue = deque([()])
    count = 0
    while queue:
        ops = queue.popleft()
        count += 1
        if ops:
            problem = violates(ops, folder)
            if problem:
                return count, ops, problem
        if len(ops) >= DEPTH:
            continue
        for nxt in successors(ops):
            if nxt not in seen:
                seen.add(nxt)
                queue.append(nxt)
    return count, None, None


def report(folder, name):
    count, path, problem = enumerate_all(folder, name)
    if problem:
        print(f"  [{name}] 检查了 {count} 个状态，找到违反（长度 {len(path)}）：{problem}")
        print(f"     最短路径: {' → '.join(str(o) for o in path)}")
    else:
        print(f"  [{name}] 穷举完了：{count} 个状态，零违反")


if __name__ == "__main__":
    print(f"深度上限 {DEPTH} 条事件")
    print("== 原版（含校验）")
    report(fold, "原版")
    print("== 改坏版（start/end 当索引）")
    report(fold_broken, "改坏版")
