# 会话续接

wo-agent 的会话落在 `WO_AGENT_SESSIONS` 指向的目录（默认 `./.wo-sessions/`），一个会话一个 JSONL。`/resume` 列出已有会话，`/new` 换一个新的，`/name` 给当前会话起名。

## Sub-features

- `resume-list` `/resume` 列出该目录下的会话，新→旧
- `resume-open` `/resume <id>` 续上指定会话
- `new` `/new` 换一个新会话
- `name` `/name <标题>` 给当前会话起名，写进 JSONL 头

## How to get to it (user POV)

- 启动时自动新建一个会话
- 在 composer 敲 `/resume`、`/new`、`/name <标题>`

## Driving it with Textual run_test

Preconditions:

- 仓库根，`.venv` 可用
- `WO_AGENT_SESSIONS=/tmp/wo-verify-$RUN_ID`，**必须是空目录**
- 不设这一条时，`/resume` 会读到用户真实会话，见 Gotchas

- **空目录下的 `/resume`。** 设 `composer.value = "/resume"`，跑 `pilot.press("enter")`。
  出现一个 `NoteLine`，内容为 `还没有会话。`（实测）
- **起名落盘。** 设 `composer.value = "/name 测试会话"`，跑 `pilot.press("enter")`。
  出现 `NoteLine` 内容为 `已命名为 测试会话`；此时 `WO_AGENT_SESSIONS` 目录下出现
  `<32位session-id>.jsonl`，首行为
  `{"type": "session_header", "version": 1, "id": "...", "title": "测试会话"}`（实测）
- **有会话时的 `/resume`。** 新开一个 app 实例，同样指向该目录，敲 `/resume`。
  出现一个 `NoteLine`，内容为：
  ```text
  会话（新→旧）：
    6b2ed46a  测试会话
  输入 /resume <id> 续上。
  ```
  注意新实例自己拿了一个**新**会话 id（`MetaLine` 显示 `1d058258`），不会自动续上旧的。
- **取证。** 从文件系统只读确认 JSONL 存在且首行是 `session_header`；这是「从第二个视图确认」，
  不能只看屏幕上的 `已命名为`。

## Gotchas

- **不设 `WO_AGENT_SESSIONS` 就会碰真实数据。** 实测：默认为 `./.wo-sessions/`，里面有用户的
  `7348d4fa…`、`f8041df2…`。`/resume` 会把它们列出来，`/resume <id>` 会续上并改动它们。
  每次验证都必须显式指定一个可丢弃目录。
- **启动只建目录，不写文件。** 只 `run_test()` 走一遍、什么都不敲时，目录被创建但是空的。
  文件在 `/name` 之后才出现。
- **`/new` 不产生说明行。** 屏幕上看不到反馈，只有 `MetaLine` 里的会话 id 变了。
  断言要看 `MetaLine`，不要看 `NoteLine`。
- **`/resume` 不带参数时是只读的**，带 id 才会切换会话。验证「列出」时不要顺手带上 id。
- **会话 id 是 8 位前缀。** 屏上显示 `7ebafe91`，磁盘文件名是完整的 32 位十六进制。
  两步之间不要直接字符串相等比较。
- **`/clear` 不删 JSONL。** 它只清屏。想验证「会话还在」，去读文件，不要看屏幕。
