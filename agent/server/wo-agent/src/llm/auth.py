"""按 provider 名解析凭据。

只做「名字 → 密钥」这一步；构造 provider 仍由宿主完成。显式 override 优先于
环境变量；都找不到就抛带 ``AUTH`` code 的 ``LlmError``，让调用方在启动期
失败，而不是带着空密钥发出请求。
"""

from __future__ import annotations

import os
from collections.abc import Mapping

from .errors import AUTH, LlmError

# provider 名 → 依次尝试的环境变量。一个 provider 可以保留历史别名；
# 顺序即优先级，沿用 CLI 既有的 `UTAGENT_API_KEY` 优先行为。
DEFAULT_ENV_NAMES: dict[str, tuple[str, ...]] = {
    "deepseek": ("UTAGENT_API_KEY", "DEEPSEEK_API_KEY"),
}


def env_names(provider: str) -> tuple[str, ...]:
    """这个 provider 会读的环境变量名，按优先级。"""
    return DEFAULT_ENV_NAMES.get(provider, (f"{provider.upper()}_API_KEY",))


def find_api_key(
    provider: str,
    *,
    override: str | None = None,
    environ: Mapping[str, str] | None = None,
) -> str | None:
    """返回解析到的密钥；找不到返回 None，供启动期探测使用。"""
    if override:
        return override
    env = os.environ if environ is None else environ
    for name in env_names(provider):
        value = env.get(name)
        if value:
            return value
    return None


def resolve_api_key(
    provider: str,
    *,
    override: str | None = None,
    environ: Mapping[str, str] | None = None,
) -> str:
    """返回密钥；缺失即抛 ``LlmError(AUTH)``。"""
    key = find_api_key(provider, override=override, environ=environ)
    if key is None:
        tried = " 或 ".join(env_names(provider))
        raise LlmError(f"没有 {provider!r} 的凭据；请设置 {tried}", AUTH)
    return key
