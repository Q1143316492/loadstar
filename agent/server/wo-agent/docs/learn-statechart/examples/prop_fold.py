"""用固定种子的手写随机序列压 fold_surface。

不依赖 hypothesis：随机序列、失败报告、路径打印都自己写，约四十行。
只依赖仓库里已有的包，从仓库根运行：

    .venv/Scripts/python docs/learn-statechart/examples/prop_fold.py
"""

from __future__ import annotations

import random
import sys
from pathlib import Path

# 让脚本能从仓库根 import src/ 下的包
sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "src"))

from llm.types import TextBlock, create_user_message  # noqa: E402
from session.events import SurfaceReplace, UserMessageEvent  # noqa: E402
from session.session import SessionEvent, fold_surface  # noqa: E402


def user(text: str, op=None, sources=()):
    """一条上表层的事件。op 为空表示 append。"""
    return UserMessageEvent(
        message=create_user_message([TextBlock(text=text)]),
        surface_op=op if op is not None else "append",
        source_event_seqs=tuple(sources),
    )


def gen_events(rng: random.Random, n: int) -> list:
    """生成 n 条事件：随机 append，或对一个已知 seq 做 replace。"""
    events = []
    for i in range(n):
        if events and rng.random() < 0.3:
            seqs = list(range(len(events)))
            start = rng.choice(seqs)
            end = rng.choice([s for s in seqs if s >= start] or [start])
            events.append(user(f"r{i}", SurfaceReplace(start=start, end=end), sources=[start, end]))
        else:
            events.append(user(f"m{i}"))
    return events


def fold(events):
    """折叠；返回 (表层 seq 列表, 是否抛错)。"""
    entries = [SessionEvent(seq=i, time=0, event=e) for i, e in enumerate(events)]
    try:
        return [seq for seq, _ in fold_surface(entries)], None
    except ValueError as exc:
        return None, str(exc)


def check(surface_seqs, events):
    """不变量。返回违反说明，或 None。

    TODO(你来写)：补两条。
      1. 表层里不能有重复的 seq。
      2. 表层里的每个 seq 都必须小于事件总数（即指向一条真实存在的事件）。

    提示（第 03 篇会用到）：还可以补一条关于 replace 的——
      「replace(s, e) 之后，s 与 e 都不该再留在表层」。
    注意不要写成「[s, e] 区间内的 seq 都消失」：replace 之后表层顺序可以
    不等于 seq 顺序，数值落在区间里的节点可能本来就不在 s..e 之间。
    """
    return None


def main(seed: int = 0, rounds: int = 2000) -> int:
    rng = random.Random(seed)
    failures = 0
    for r in range(rounds):
        n = rng.randint(1, 8)
        events = gen_events(rng, n)
        surface, err = fold(events)
        if err is not None:
            continue  # 代码里的校验把它拦住了，这不算不变量被违反
        problem = check(surface, events)
        if problem:
            failures += 1
            print(f"[round {r}] {problem}")
            print(f"  事件: {[type(e).__name__ for e in events]}")
            print(f"  表层: {surface}")
            if failures >= 5:
                break
    print(f"共 {rounds} 轮，违反 {failures} 次")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
