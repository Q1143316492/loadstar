"""循环按 ``AgentOptions.provider`` 从注册表选路：名字决定用哪个 provider。"""

import pytest

from agent import AgentOptions, ReactLoopAgent
from llm.registry import ModelRegistry, ProviderNotRegistered
from llm.types import (
    BlockStart,
    FinishChunk,
    FinishReason,
    TextBlock,
    TextDelta,
)
from session import Session
from tools import ToolResult


class RecordingProvider:
    def __init__(self, text: str) -> None:
        self._text = text
        self.calls = 0

    async def stream(self, request, signal=None):
        self.calls += 1
        yield BlockStart(index=0, block_type="text")
        yield TextDelta(index=0, text=self._text)
        yield FinishChunk(reason=FinishReason(kind="stop"))


class FakeTools:
    def schemas(self):
        return []

    async def execute(self, name, arguments, cancel=None):
        return ToolResult(content=[TextBlock(text="ok")])


def _agent(registry: ModelRegistry, provider_name: str) -> ReactLoopAgent:
    return ReactLoopAgent(
        Session(),
        None,
        AgentOptions(provider=provider_name, model="m"),
        FakeTools(),
        providers=registry,
    )


async def test_registry_selects_provider_by_options_name():
    chosen = RecordingProvider("chosen")
    other = RecordingProvider("other")
    registry = ModelRegistry()
    registry.register("chosen", chosen)
    registry.register("other", other)

    await _agent(registry, "chosen").followup("hi")

    assert chosen.calls == 1
    assert other.calls == 0


def test_unknown_provider_fails_at_construction_not_mid_turn():
    # 请求期才发现会先写 turn/start 与 request/header，再补一个假的 turn/end。
    with pytest.raises(ProviderNotRegistered):
        _agent(ModelRegistry(), "missing")


def test_needs_provider_or_registry():
    with pytest.raises(ValueError):
        ReactLoopAgent(
            Session(),
            None,
            AgentOptions(provider="fake", model="m"),
            FakeTools(),
        )
