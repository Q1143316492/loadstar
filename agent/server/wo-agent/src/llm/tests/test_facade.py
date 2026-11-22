"""门面边界：导包不拖入适配器与 HTTP 客户端。"""

import subprocess
import sys

import llm


def test_facade_exports_no_adapter():
    assert not hasattr(llm, "DeepSeekProvider")
    assert not hasattr(llm, "DeepSeekConfig")


def test_importing_llm_does_not_load_adapters():
    # 已在 pytest 进程里 import 过，只能在干净子进程里验证导入副作用。
    code = (
        "import sys, llm;"
        "assert 'llm.deepseek' not in sys.modules, 'facade imported the adapter';"
        "assert 'httpx' not in sys.modules, 'facade imported httpx'"
    )
    subprocess.run([sys.executable, "-c", code], check=True)
