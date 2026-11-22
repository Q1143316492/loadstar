"""工具执行：注册表 + 守卫管线，实现 `ToolExecutor` 缝。

管线（对齐 dsh-tools 的结构）：注册表查找 → 守卫（单调拒绝，只能拒绝不能
放行）→ 解析参数 → 执行 → 错误处理。错误不抛出，而是变成 is_error 结果，
由循环包装成持久的 tool-result 消息。失败值带稳定 ``code``，从抛出点一路
带到结果与日志。
"""

from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from typing import Protocol

from llm.types import ContentBlock, TextBlock, ToolSchema

from .cancel import bind_tool_cancel, reset_tool_cancel
from .definition import ToolDefinition
from .errors import (
    INVALID_ARGUMENTS,
    TOOL_DENIED,
    TOOL_FAILED,
    UNKNOWN_TOOL,
    ToolError,
    ToolFailure,
)


@dataclass(frozen=True)
class ToolResult:
    """一次工具调用的模型可见结果。``failure`` 非空时 ``is_error`` 必为真。"""

    content: list[ContentBlock]
    is_error: bool = False
    failure: ToolFailure | None = None


class ToolGuard(Protocol):
    """执行前守卫：返回拒绝理由或 None。单调性——只能拒绝，不能放行。"""

    async def check(self, name: str, arguments: str) -> str | None: ...


class ToolExecutor(Protocol):
    """工具执行缝：给模型看 schema，执行时跑管线。"""

    def schemas(self) -> list[ToolSchema]: ...
    async def execute(
        self, name: str, arguments: str, cancel: asyncio.Event | None = None
    ) -> ToolResult: ...


def _error_block(failure: ToolFailure) -> list[ContentBlock]:
    payload = {"error": failure.message, "code": failure.code}
    return [TextBlock(text=json.dumps(payload, ensure_ascii=False))]


def _failed(failure: ToolFailure) -> ToolResult:
    return ToolResult(content=_error_block(failure), is_error=True, failure=failure)


class RegistryToolExecutor:
    """持有工具定义与守卫，按管线执行。"""

    def __init__(self) -> None:
        self._tools: dict[str, ToolDefinition] = {}
        self._guards: list[ToolGuard] = []

    def register(self, tool: ToolDefinition) -> None:
        self._tools[tool.name] = tool

    def add_guard(self, guard: ToolGuard) -> None:
        self._guards.append(guard)

    def schemas(self) -> list[ToolSchema]:
        return [tool.schema for tool in self._tools.values()]

    async def execute(
        self,
        name: str,
        arguments: str,
        cancel: asyncio.Event | None = None,
    ) -> ToolResult:
        token = bind_tool_cancel(cancel)
        try:
            return await self._execute(name, arguments)
        finally:
            reset_tool_cancel(token)

    async def _execute(self, name: str, arguments: str) -> ToolResult:
        tool = self._tools.get(name)
        if tool is None:
            return _failed(ToolFailure(UNKNOWN_TOOL, f"unknown tool: {name}"))

        for guard in self._guards:
            reason = await guard.check(name, arguments)
            if reason is not None:
                return _failed(ToolFailure(TOOL_DENIED, f"denied: {reason}"))

        try:
            parsed = json.loads(arguments) if arguments else {}
        except json.JSONDecodeError as error:
            return _failed(ToolFailure(INVALID_ARGUMENTS, f"invalid tool arguments: {error}"))
        if not isinstance(parsed, dict):
            parsed = {"value": parsed}

        try:
            content = await tool.execute(parsed)
            return ToolResult(content=content)
        except ToolError as error:
            return _failed(error.failure)
        except Exception as error:
            return _failed(ToolFailure(TOOL_FAILED, str(error)))
