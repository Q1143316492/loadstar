"""注册表按名选 provider；未注册是组合期错误。"""

import pytest

from llm.registry import ModelRegistry, ProviderNotRegistered


class StubProvider:
    async def stream(self, request, signal=None):
        if False:  # pragma: no cover - 只为满足异步生成器语法
            yield


def test_register_and_require():
    registry = ModelRegistry()
    provider = StubProvider()
    registry.register("deepseek", provider)

    assert registry.require("deepseek") is provider
    assert registry.get("deepseek") is provider
    assert "deepseek" in registry
    assert registry.names() == ["deepseek"]


def test_missing_provider_names_what_is_registered():
    registry = ModelRegistry()
    registry.register("deepseek", StubProvider())

    with pytest.raises(ProviderNotRegistered) as excinfo:
        registry.require("openai")

    assert "openai" in str(excinfo.value)
    assert "deepseek" in str(excinfo.value)
