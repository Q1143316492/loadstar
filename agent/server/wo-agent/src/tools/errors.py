"""工具失败的稳定词汇：code + message。

失败从工具的抛出点一路带到执行结果、模型可见文本与 ``tool/result`` 日志，
每一层只做投影，不再各自把异常压成字符串。``code`` 是机器路由用的稳定
标识；``message`` 给模型看。
"""

from __future__ import annotations

from dataclasses import dataclass

# 执行管线自己产生的失败码。
UNKNOWN_TOOL = "UNKNOWN_TOOL"  # 模型调了没有注册的工具名
TOOL_DENIED = "TOOL_DENIED"  # 守卫拒绝
INVALID_ARGUMENTS = "INVALID_ARGUMENTS"  # 参数不是合法的 JSON 对象
TOOL_FAILED = "TOOL_FAILED"  # 工具实现抛了未分类的异常


@dataclass(frozen=True)
class ToolFailure:
    """一次工具失败的结构化值。"""

    code: str
    message: str


class ToolError(Exception):
    """带稳定 ``code`` 的工具失败。

    工具实现（含工作区）抛它，执行管线原样保留 code；抛其他异常时归为
    ``TOOL_FAILED``。
    """

    def __init__(self, message: str, code: str = TOOL_FAILED) -> None:
        super().__init__(message)
        self.code = code

    @property
    def failure(self) -> ToolFailure:
        return ToolFailure(code=self.code, message=str(self))
