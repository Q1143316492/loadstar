"""工作区错误：带稳定码的工具失败。

执行管线把 ``ToolError`` 原样投影成 is_error 结果与日志；工作区只负责给出
``code`` 与给模型看的 ``message``。
"""

from tools import ToolError


class WorkspaceError(ToolError):
    """带稳定码的文件系统失败。``message`` 给模型看。"""

    def __init__(self, message: str, code: str) -> None:
        super().__init__(message, code)
