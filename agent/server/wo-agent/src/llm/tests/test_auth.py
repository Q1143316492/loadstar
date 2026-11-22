"""凭据解析：override 优先，环境变量按 provider 约定，缺失以 AUTH 失败。"""

import pytest

from llm.auth import env_names, find_api_key, resolve_api_key
from llm.errors import AUTH, LlmError


def test_override_wins_over_environment():
    env = {"DEEPSEEK_API_KEY": "from-env"}
    assert find_api_key("deepseek", override="from-override", environ=env) == "from-override"


def test_deepseek_keeps_utagent_priority():
    assert find_api_key("deepseek", environ={"DEEPSEEK_API_KEY": "a"}) == "a"
    assert find_api_key("deepseek", environ={"UTAGENT_API_KEY": "b"}) == "b"
    assert find_api_key("deepseek", environ={"UTAGENT_API_KEY": "b", "DEEPSEEK_API_KEY": "a"}) == "b"


def test_unknown_provider_uses_conventional_name():
    assert env_names("acme") == ("ACME_API_KEY",)
    assert find_api_key("acme", environ={"ACME_API_KEY": "c"}) == "c"


def test_missing_key_raises_auth_with_names_to_set():
    with pytest.raises(LlmError) as excinfo:
        resolve_api_key("deepseek", environ={})
    assert excinfo.value.code == AUTH
    assert "UTAGENT_API_KEY" in str(excinfo.value)
    assert "DEEPSEEK_API_KEY" in str(excinfo.value)


def test_empty_values_do_not_count():
    assert find_api_key("deepseek", override="", environ={"DEEPSEEK_API_KEY": ""}) is None
    with pytest.raises(LlmError):
        resolve_api_key("deepseek", override="", environ={})
