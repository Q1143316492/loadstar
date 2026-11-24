# 斜杠命令

用户可以在 composer 里敲 `/` 打开补全菜单，选中命令回车执行。命令不走模型，直接由 `cli/commands/` 处理，结果以说明行（`NoteLine`）写进屏幕。

## Sub-features

- `slash-menu` 敲 `/` 弹出补全菜单，列出全部命令
- `slash-filter` 继续输入字母，菜单按前缀过滤
- `slash-complete` Tab 把高亮的命令写进 composer，再敲空格
- `help` `/help` 输出命令清单
- `clear` `/clear` 清空屏幕，保留横幅与元信息行，不删会话日志

## How to get to it (user POV)

- 在 composer 敲 `/`
- 继续敲字母缩小范围，按 `tab` 补全，按 `enter` 执行

## Driving it with Textual run_test

Preconditions:

- 仓库根，`.venv` 可用
- `WO_AGENT_SESSIONS` 指向可丢弃目录
- 无 API key 亦可

- **开菜单。** 跑 `await pilot.press("/")`。`app.query_one("#slash").display` 为 `True`，`option_count` 为 `6`。
- **过滤。** 再跑 `await pilot.press("c")`。`option_count` 变为 `1`，`highlighted_option.id` 为 `clear`。
- **补全。** 再跑 `await pilot.press("tab")`。`composer.value` 为 `"/clear "`，菜单隐藏，composer 保持焦点。
- **执行 /clear。** 跑 `await pilot.press("enter")`。`#thread` 的子节点只剩 `Banner` 与 `MetaLine`，没有任何 `NoteLine`。
- **执行 /help。** 设 `composer.value = "/help"`，跑 `await pilot.press("enter")`。出现一个 `NoteLine`，内容含 `/help`、`/clear`、`/quit`、`/resume`、`/new`、`/name` 六行说明。
- **取证。** `drive.py` 写出 `artifacts/drive.json`，其中 `run /help` 那一步的 `notes` 数组就是证据。

## Gotchas

- **管道驱动不了。** `echo "/help" | python -m cli` 不产生任何响应——Textual 从 TTY 读输入，不看 stdin 管道。必须用 `run_test()` 或真实 PTY。
- **Windows 没有 PTY。** `import pty` 会因缺 `termios` 失败。驱动只能走 `run_test()`。
- **`/clear` 不删日志。** 它只清屏，会话 JSONL 不动。想验证「真的没写盘」，要另外看文件 mtime。
- **菜单计数会随命令增加而变。** `option_count == 6` 只在当前 `mount_core` + `mount_session` 都挂上时成立。新增命令后这条断言要跟着改。
- **补全只补名字，不带光标停在末尾。** `composer.value` 结尾有一个空格，断言要包含它。
