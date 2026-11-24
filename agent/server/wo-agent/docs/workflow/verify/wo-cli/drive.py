"""驱动 wo-agent 的 TUI，抓回显作为证据。

跑法（仓库根 agent/server/wo-agent）：

    PYTHONIOENCODING=utf-8 WO_AGENT_SESSIONS=/tmp/wo-verify-$RUN_ID \
        .venv/Scripts/python docs/workflow/verify/wo-cli/drive.py

产物写到同目录的 artifacts/。`WO_AGENT_SESSIONS` 必须指向可丢弃目录，
否则 `/resume` 会读用户的真实会话。
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
ARTIFACTS = HERE / "artifacts"
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src"))


def snapshot(app) -> dict:
    """TUI 的「ARIA 快照」等价物：抓当前渲染出的结构化内容。"""
    from cli.tui.banner import Banner
    from cli.tui.widgets import MetaLine, NoteLine

    thread = app.query_one("#thread")
    lines = []
    for child in thread.children:
        text = getattr(child, "content", None)
        if text is None and isinstance(child, Banner):
            text = str(child.query_one("#blurb").content)
        lines.append(f"{type(child).__name__}: {text if text is not None else ''}")
    return {
        "status": str(app.query_one("#status").content),
        "meta": str(app.query_one(MetaLine).content),
        "notes": [str(n.content) for n in app.query(NoteLine)],
        "thread": lines,
        "composer": app.query_one("#composer").value,
        "composer_has_focus": app.query_one("#composer").has_focus,
    }


async def run_cmd(app, pilot, cmd: str) -> dict:
    app.query_one("#composer").value = cmd
    await pilot.press("enter")
    await pilot.pause()
    return snapshot(app)


async def drive() -> dict:
    from cli.tui.app import WoCli

    steps = []

    app = WoCli()
    async with app.run_test() as pilot:
        steps.append({"step": "launch", "state": snapshot(app)})

        await pilot.press("/")
        menu = app.query_one("#slash")
        steps.append({
            "step": "slash menu",
            "display": menu.display,
            "option_count": menu.option_count,
        })

        await pilot.press("c")
        menu = app.query_one("#slash")
        steps.append({
            "step": "filter c",
            "option_count": menu.option_count,
            "highlighted": menu.highlighted_option.id if menu.highlighted_option else None,
        })

        await pilot.press("tab")
        steps.append({"step": "tab complete", "composer": app.query_one("#composer").value})

        steps.append({"step": "run /clear", "state": await run_cmd(app, pilot, "/clear")})
        steps.append({"step": "run /help", "state": await run_cmd(app, pilot, "/help")})
        steps.append({"step": "run /resume (empty dir)", "state": await run_cmd(app, pilot, "/resume")})
        steps.append({"step": "run /name", "state": await run_cmd(app, pilot, "/name 测试会话")})

    app2 = WoCli()
    async with app2.run_test() as pilot2:
        steps.append({"step": "run /resume (has session)", "state": await run_cmd(app2, pilot2, "/resume")})

    sessions_dir = os.environ.get("WO_AGENT_SESSIONS", "")
    files = sorted(Path(sessions_dir).glob("*.jsonl")) if sessions_dir and Path(sessions_dir).is_dir() else []
    return {
        "steps": steps,
        "side_effects": {
            "sessions_dir": sessions_dir,
            "files": [f.name for f in files],
            "headers": [f.read_text(encoding="utf-8").splitlines()[0] for f in files],
        },
    }


def main() -> int:
    if not os.environ.get("WO_AGENT_SESSIONS"):
        print("必须先设 WO_AGENT_SESSIONS 指向可丢弃目录", file=sys.stderr)
        return 2
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    result = asyncio.run(drive())
    out = ARTIFACTS / "drive.json"
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    for step in result["steps"]:
        if "state" in step:
            s = step["state"]
            notes = " | ".join(s["notes"]) if s["notes"] else "—"
            print(f"[{step['step']}] meta={s['meta'].split('·')[0].strip()}  notes={notes}")
        else:
            print(f"[{step['step']}] { {k: v for k, v in step.items() if k != 'step'} }")
    se = result["side_effects"]
    print(f"\n落盘: {se['files']}")
    print(f"证据: {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
