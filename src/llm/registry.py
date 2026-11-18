"""按名登记 provider，供循环在请求期选择。

注册表只存「名字 → 已构造好的 provider」。密钥解析见 ``auth``；组合哪几家
provider 由宿主决定。
"""

from __future__ import annotations

from .protocol import LLMProvider


class ProviderNotRegistered(LookupError):
    """按名取 provider 失败。这是组合期错误，不是请求期失败。"""


class ModelRegistry:
    def __init__(self) -> None:
        self._providers: dict[str, LLMProvider] = {}

    def register(self, name: str, provider: LLMProvider) -> None:
        self._providers[name] = provider

    def get(self, name: str) -> LLMProvider | None:
        return self._providers.get(name)

    def require(self, name: str) -> LLMProvider:
        provider = self._providers.get(name)
        if provider is None:
            known = "、".join(self._providers) or "无"
            raise ProviderNotRegistered(
                f"provider {name!r} 未注册；已注册：{known}"
            )
        return provider

    def names(self) -> list[str]:
        return list(self._providers)

    def __contains__(self, name: object) -> bool:
        return name in self._providers
