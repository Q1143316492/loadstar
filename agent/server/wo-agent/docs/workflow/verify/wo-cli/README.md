# wo-agent 验证地图

这个目录是验证 wo-agent 终端（`python -m cli`）用户可见行为的维护中事实源。驱动之前先读索引，再按对应的功能文件走。

## 覆盖范围

覆盖：终端启动与首屏、斜杠命令（`/help`、`/clear`、`/resume`、`/new`、`/name`）、斜杠补全菜单。

不覆盖：`bash` / `read` 等工具链、会话压缩、`.wo-sessions/` 的 JSONL 格式、`src/` 下任何库层行为。这些有各自的单元测试（255 个），不归这份手册。

需要真实模型的对话（发一条提示词、等回复）也不覆盖——它需要 API key，且回复不确定，不适合当验证证据。

## 基线前提

- 在仓库根 `agent/server/wo-agent` 运行。
- `.venv` 存在且已 `pip install -e ".[dev]"`。
- **设 `WO_AGENT_SESSIONS` 指向一个可丢弃目录**，例如 `/tmp/wo-verify-$RUN_ID`。不设时应用读 `.wo-sessions/` 里的真实用户会话，`/resume` 会列出并可能改动它们。
- 不需要 API key：TUI 能启动，斜杠命令能用。发真实提示词才需要。
- 驱动用 Textual 的 `run_test()`，不依赖 TTY。Windows 上没有 `pty`/`termios`，PTY 驱动不可用。

## 驱动约定

- 用同目录的 [`drive.py`](drive.py) 作为驱动脚手架；它已经处理了隔离检查、快照与产物落盘。

  ```sh
  PYTHONIOENCODING=utf-8 WO_AGENT_SESSIONS=/tmp/wo-verify-$RUN_ID \
      .venv/Scripts/python docs/workflow/verify/wo-cli/drive.py
  ```

- 「快照」= 读 `#status`、`MetaLine`、`NoteLine`、`#thread` 子节点的文本，不是截图。TUI 的等价物。
- 命令输入走 `composer.value = "..."` 然后 `pilot.press("enter")`，不要用管道：Textual 不读 stdin 管道。
- 断言用快照里的文本，不用 ANSI 原始输出。
- 证据落在 `artifacts/`；它是一次运行的产物，不进版本管理。

## 证明标准

- 抓用户动作和它造成的结果，不是只抓最后一屏。
- TUI 证据 = `drive.json` 里对应步骤的快照对象（`status` / `notes` / `thread`）。
- 副作用（会话目录里新增/删除的 JSONL）单独列一次，从文件系统只读确认。
- 每个证据记录用了哪个功能 id、哪个入口。
- 路径到不了时，报出尝试过的命令和未满足的前置条件。
- 不用一个入口的报告冒充另一个入口已验证。

## 功能索引

- [斜杠命令](./slash-commands.md) —— `/help`、`/clear`、`/new`、`/name` 的输入与结果，以及斜杠补全菜单
- [会话续接](./sessions.md) —— `/resume` 列出、续上、空目录行为，以及隔离要求
