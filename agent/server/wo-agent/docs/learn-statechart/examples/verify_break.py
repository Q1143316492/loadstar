"""验证：把 session.py 的校验改坏之后，不变量真的会失败。

本脚本不修改仓库文件，而是把 fold_surface 的行为抄一份「改坏版」：
让 replace 的 start/end 被当成下标切片，而不是表层节点的 seq。
"""

from __future__ import annotations

import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "src"))

from llm.types import TextBlock, create_user_message  # noqa: E402
from session.events import SurfaceReplace, UserMessageEvent  # noqa: E402
from session.session import SessionEvent, derive_event_message, fold_surface  # noqa: E402


def user(text, op=None, sources=()):
    return UserMessageEvent(
        message=create_user_message([TextBlock(text=text)]),
        surface_op=op if op is not None else "append",
        source_event_seqs=tuple(sources),
    )


def fold_broken(events):
    """改坏版：把 start/end 当表层下标切片，而不是按 seq 查找。"""
    nodes = []
    for entry in events:
        msg = derive_event_message(entry.event)
        if msg is None:
            continue
        op = getattr(entry.event, "surface_op", "append")
        if op == "append":
            nodes.append((entry.seq, msg))
            continue
        # 错误：直接当索引用
        nodes[op.start : op.end + 1] = [(entry.seq, msg)]
    return nodes


def gen(rng, n):
    events = []
    for i in range(n):
        if events and rng.random() < 0.45:
            seqs = list(range(len(events)))
            start = rng.choice(seqs)
            end = rng.choice([s for s in seqs if s >= start] or [start])
            # 原版要求 source 覆盖所有被遮蔽的节点；这里给全，让规格合法
            sources = [s for s in seqs if start <= s <= end]
            events.append(user(f"r{i}", SurfaceReplace(start=start, end=end), sources=sources))
        else:
            events.append(user(f"m{i}"))
    return events


def check(events, folder, name):
    """对每个前缀检查：没有重复 seq；replace 之后其区间内的 seq 不残留。"""
    for k in range(1, len(events) + 1):
        prefix = events[:k]
        entries = [SessionEvent(seq=i, time=0, event=e) for i, e in enumerate(prefix)]
        try:
            nodes = folder(entries)
        except ValueError:
            return None
        seqs = [s for s, _ in nodes]
        if len(seqs) != len(set(seqs)):
            return f"{name}: 前缀 {k} 出现重复 seq {seqs}"
        ev = prefix[-1]
        if isinstance(getattr(ev, "surface_op", None), SurfaceReplace):
            # 正确的措辞：replace(s, e) 之后，s 与 e 这两个节点必须已经不在表层。
            # 不能写「[s,e] 区间内的 seq 都消失」——replace 之后表层顺序可以
            # 不等于 seq 顺序，数值落在区间里的节点可能本来就不在 s..e 之间。
            still = [s for s in (ev.surface_op.start, ev.surface_op.end) if s in seqs]
            if still:
                return f"{name}: 前缀 {k} replace[{ev.surface_op.start},{ev.surface_op.end}] 之后仍残留 {still}"
    return None


def run(folder, name, rounds=3000, seed=7):
    rng = random.Random(seed)
    bad = 0
    for _ in range(rounds):
        events = gen(rng, rng.randint(2, 8))
        problem = check(events, folder, name)
        if problem:
            bad += 1
            if bad <= 3:
                print(" ", problem)
    print(f"{name}: {rounds} 轮，违反 {bad} 次")
    return bad


def fold_ok(events):
    return fold_surface(events)


if __name__ == "__main__":
    print("== 原版（含校验）")
    run(fold_ok, "原版")
    print("== 改坏版（start/end 当索引）")
    run(fold_broken, "改坏版")
