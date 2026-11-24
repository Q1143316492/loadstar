"""把 TLC 的 `-dump dot` 输出转成可读的 Mermaid 状态图。

statechart 那个技能的简化版：不生成 view 模块，直接把每个状态的变量值
压缩成一个短标签，按深度裁剪后画出来。

    java -cp .vendor/tla/tla2tools.jar tlc2.TLC -config Inbox.cfg \
         -workers 1 -dump dot out/inbox.dot Inbox.tla
    python dot2mermaid.py out/inbox.dot --depth 3 --out out/inbox.mmd
"""

from __future__ import annotations

import argparse
import re
from collections import deque
from pathlib import Path

NODE = re.compile(r'^(-?\d+) \[label="((?:[^"\\]|\\.)*)"')
EDGE = re.compile(r"^(-?\d+) -> (-?\d+)")


def parse(path: Path) -> tuple[dict[str, list[tuple[str, str]]], str]:
    nodes: dict[str, list[tuple[str, str]]] = {}
    edges: list[tuple[str, str]] = []
    initial: str | None = None
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if m := NODE.match(line):
            raw = m.group(2)
            pairs = []
            for part in raw.split("\\n"):
                part = part.replace("\\/", "/").strip().lstrip("\\/").strip()
                if "=" in part:
                    k, v = part.split("=", 1)
                    pairs.append((k.strip(), v.strip()))
            nodes[m.group(1)] = pairs
            if "style = filled" in line and initial is None:
                initial = m.group(1)
        elif m := EDGE.match(line):
            edges.append((m.group(1), m.group(2)))
    if initial is None:
        targets = {b for _, b in edges}
        initial = next(k for k in nodes if k not in targets)
    return {"nodes": nodes, "edges": edges, "initial": initial}, initial


def short(counts: list[tuple[str, str]]) -> str:
    """把一个状态的变量值压成人看的短语。"""
    v = {k: val.strip() for k, val in counts}
    if not v:
        return "?"
    nt = v.get("nextTurn", "").lstrip("\/").strip().replace("<<", "").replace(">>", "")
    ns = v.get("nextStep", "").lstrip("\/").strip().replace("<<", "").replace(">>", "")
    c = v.get("claimed", "").replace("{", "").replace("}", "").strip()
    nt_list = [x.strip() for x in nt.split(",") if x.strip()]
    ns_list = [x.strip() for x in ns.split(",") if x.strip()]
    parts = []
    parts.append(f"待下一轮 {len(nt_list)}" if nt_list else "无排队")
    if ns_list:
        parts.append(f"待下一步 {len(ns_list)}")
    if c:
        parts.append(f"已认领 {len([x for x in c.split(',') if x.strip()])}")
    return " · ".join(parts)


def to_mermaid(graph: dict, depth: int, max_nodes: int) -> tuple[str, int]:
    nodes, edges, initial = graph["nodes"], graph["edges"], graph["initial"]
    adj: dict[str, list[str]] = {}
    for a, b in edges:
        adj.setdefault(a, []).append(b)

    order: list[str] = []
    seen = {initial: 0}
    q = deque([(initial, 0)])
    while q and len(order) < max_nodes:
        cur, d = q.popleft()
        order.append(cur)
        if d >= depth:
            continue
        for nxt in adj.get(cur, []):
            if nxt not in seen:
                seen[nxt] = d + 1
                q.append((nxt, d + 1))

    index = {n: f"s{i}" for i, n in enumerate(order)}
    lines = ["stateDiagram-v2", f"    [*] --> {index[initial]}"]
    for n in order:
        label = short(nodes[n]).replace('"', "'")
        lines.append(f'    {index[n]} : {label}')
    drawn = set()
    for a, b in edges:
        if a in index and b in index:
            key = (index[a], index[b])
            if key in drawn:
                continue
            drawn.add(key)
            lines.append(f"    {index[a]} --> {index[b]}")
    return "\n".join(lines) + "\n", len(order)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("dot")
    ap.add_argument("--depth", type=int, default=3)
    ap.add_argument("--max-nodes", type=int, default=30)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    graph, _ = parse(Path(args.dot))
    mmd, n = to_mermaid(graph, args.depth, args.max_nodes)
    Path(args.out).write_text(mmd, encoding="utf-8")
    print(f"{len(graph['nodes'])} 个状态，画了 {n} 个（深度 {args.depth}）→ {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
