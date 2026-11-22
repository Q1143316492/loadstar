"""RegistryToolExecutor 测试：注册、执行、守卫、带码的失败处理。"""

import json

from llm.types import TextBlock
from tools import RegistryToolExecutor, ToolDefinition, ToolError


def _echo() -> ToolDefinition:
    async def execute(args):
        return [TextBlock(text=f'echoed: {args["text"]}')]

    return ToolDefinition(
        name="echo", description="原样返回文本",
        parameters={"type": "object", "properties": {"text": {"type": "string"}}},
        execute=execute,
    )


async def test_register_and_execute():
    executor = RegistryToolExecutor()
    executor.register(_echo())
    result = await executor.execute("echo", '{"text":"hi"}')
    assert result.is_error is False
    assert result.content[0].text == "echoed: hi"


async def test_schemas_returns_model_facing_declaration():
    executor = RegistryToolExecutor()
    executor.register(_echo())
    schemas = executor.schemas()
    assert len(schemas) == 1
    assert schemas[0].name == "echo"
    assert schemas[0].parameters["properties"]["text"]["type"] == "string"


async def test_unknown_tool_is_error():
    executor = RegistryToolExecutor()
    result = await executor.execute("nope", "{}")
    assert result.is_error is True
    assert result.failure.code == "UNKNOWN_TOOL"


async def test_guard_denies_monotonically():
    class DenyEcho:
        async def check(self, name, arguments):
            return "echo 被禁用" if name == "echo" else None

    executor = RegistryToolExecutor()
    executor.register(_echo())
    executor.add_guard(DenyEcho())
    result = await executor.execute("echo", '{"text":"hi"}')
    assert result.is_error is True
    assert result.failure.code == "TOOL_DENIED"
    assert "denied" in result.content[0].text


async def test_execute_error_becomes_is_error_result():
    async def boom(args):
        raise RuntimeError("工具内部炸了")

    executor = RegistryToolExecutor()
    executor.register(ToolDefinition(name="boom", description="", parameters={}, execute=boom))
    result = await executor.execute("boom", "{}")
    assert result.is_error is True
    assert result.failure.code == "TOOL_FAILED"
    assert "工具内部炸了" in result.content[0].text


async def test_tool_error_code_survives_the_pipeline():
    async def refuse(args):
        raise ToolError("bad input", "MY_CODE")

    executor = RegistryToolExecutor()
    executor.register(ToolDefinition(name="refuse", description="", parameters={}, execute=refuse))
    result = await executor.execute("refuse", "{}")
    assert result.failure.code == "MY_CODE"
    # 模型看到的是结构化失败，不只是消息文本
    assert json.loads(result.content[0].text) == {"error": "bad input", "code": "MY_CODE"}


async def test_invalid_arguments_are_reported_as_error():
    executor = RegistryToolExecutor()
    executor.register(_echo())
    result = await executor.execute("echo", "{not json")
    assert result.is_error is True
    assert result.failure.code == "INVALID_ARGUMENTS"


async def test_empty_arguments_parses_to_empty_dict():
    async def execute(args):
        return [TextBlock(text=f"keys={sorted(args)}")]

    executor = RegistryToolExecutor()
    executor.register(ToolDefinition(name="t", description="", parameters={}, execute=execute))
    result = await executor.execute("t", "")
    assert result.content[0].text == "keys=[]"


async def test_execute_binds_cancel_event():
    import asyncio

    from tools.cancel import tool_cancel

    seen: list[bool] = []

    async def execute(args):
        ev = tool_cancel()
        seen.append(ev is not None and ev.is_set() is False)
        return [TextBlock(text="ok")]

    executor = RegistryToolExecutor()
    executor.register(ToolDefinition(name="t", description="", parameters={}, execute=execute))
    cancel = asyncio.Event()
    await executor.execute("t", "{}", cancel=cancel)
    assert seen == [True]
    assert tool_cancel() is None
