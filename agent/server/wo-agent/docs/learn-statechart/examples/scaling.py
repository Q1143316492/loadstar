"""两个实验：为什么穷举能扩展到复杂系统。

实验一：按「路径」去重 vs 按「状态」去重——同样的搜索，状态数差多少。
实验二：多加一个独立变量，状态数怎么涨。

    PYTHONIOENCODING=utf-8 .venv/Scripts/python docs/learn-statechart/examples/scaling.py
"""

from __future__ import annotations

import sys
from collections import deque
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "src"))

from llm.types import TextBlock, create_user_message  # noqa: E402
from session.events import SurfaceReplace, UserMessageEvent  # noqa: E402
from session.session import SessionEvent, fold_surface  # noqa: E402


def make_event(op, idx):
    if op == "append":
        return UserMessageEvent(message=create_user_message([TextBlock(text=f"m{idx}")]))
    s, e, sources = op
    return UserMessageEvent(
        message=create_user_message([TextBlock(text=f"r{idx}")]),
        surface_op=SurfaceReplace(start=s, end=e),
        source_event_seqs=tuple(sources),
    )


def fold(ops):
    return fold_surface([SessionEvent(seq=i, time=0, event=make_event(op, i)) for i, op in enumerate(ops)])


def surface_of(ops):
    try:
        return tuple(s for s, _ in fold(ops))
    except ValueError:
        return None


def successors(ops):
    yield ops + ("append",)
    surface = surface_of(ops)
    if not surface:
        return
    for i, s in enumerate(surface):
        for j in range(i, len(surface)):
            yield ops + ((s, surface[j], surface[i : j + 1]),)


def explore(depth, dedupe_by_state):
    """去重键：按路径 = ops 本身；按状态 = (日志形状, 表层)。"""
    start = ()
    seen = {start}
    queue = deque([start])
    paths = 0
    while queue:
        ops = queue.popleft()
        paths += 1
        if len(ops) >= depth:
            continue
        for nxt in successors(ops):
            if dedupe_by_state:
                surface = surface_of(nxt)
                if surface is None:
                    continue
                # 状态 = 表层内容 + 日志里还有多少节点没被遮蔽
                key = (surface, len(nxt))
            else:
                key = nxt
            if key in seen:
                continue
            seen.add(key)
            queue.append(nxt)
    return paths, len(seen)


if __name__ == "__main__":
    print("实验一：同一深度，按路径去重 vs 按状态去重")
    print(f"{'深度':<6}{'路径去重':>12}{'状态去重':>12}{'倍数':>10}")
    for d in (4, 5, 6, 7, 8):
        p, _ = explore(d, dedupe_by_state=False)
        _, s = explore(d, dedupe_by_state=True)
        print(f"{d:<6}{p:>12,}{s:>12,}{p/max(s,1):>9.1f}x")

    print()
    print("实验二：独立变量每加一个，状态数怎么涨（深度 6）")
    print("  fold_surface 的表层最多 6 个节点，每个节点可能被遮蔽与否")
    print("  → 每加一个布尔变量，上界翻一倍；每加一个 0..2 的计数器，上界 ×3")
    for vars_ in (1, 2, 3, 4):
        base = 687
        print(f"  {vars_} 个布尔变量: {base * (2 ** vars_):>12,}")
