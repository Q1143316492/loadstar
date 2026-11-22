"""面向模型的 ``skill`` 工具（dsh ``tool-skill`` 消费方）。

只通过 SkillRegistry 取正文，不直接读盘。未知名 / 非法名变成 is_error 结果，
由循环写成持久的 tool/result。
"""

from __future__ import annotations

from llm.types import TextBlock
from tools import ToolDefinition, ToolError

from .registry import SkillRegistry, is_skill_name


def make_skill_tool(registry: SkillRegistry) -> ToolDefinition:
    async def execute(args: dict) -> list:
        name = str(args.get("name") or "").strip()
        if not name:
            raise ToolError("skill name required", "SKILL_NAME_REQUIRED")
        if not is_skill_name(name):
            raise ToolError(f"invalid skill name: {name}", "SKILL_NAME_INVALID")
        found = registry.get(name)
        if found is None:
            raise ToolError(f"skill not found: {name}", "SKILL_NOT_FOUND")
        return [TextBlock(text=found.content)]

    return ToolDefinition(
        name="skill",
        description=(
            "Load a skill by exact kebab-case name from the session catalog. "
            "Call this before following a skill's instructions. "
            "Do not load names that are not listed."
        ),
        parameters={
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Exact skill name from <available_skills>.",
                }
            },
            "required": ["name"],
        },
        execute=execute,
    )
