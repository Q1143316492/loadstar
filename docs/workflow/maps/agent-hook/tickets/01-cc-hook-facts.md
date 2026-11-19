# Claude Code 钩子的事实边界

## 问题

查清 Claude Code 钩子能提供什么、限制在哪，够后续「预警通道」「事件协议」「安装」三张票直接引用。要钉的事实：

1. 可用事件全集（PreToolUse / PostToolUse / Stop / SubagentStop / Notification / SessionStart / SessionEnd / UserPromptSubmit / PreCompact 等）及各自输入 JSON 的字段（`session_id`、`tool_name`、`tool_input`、`transcript_path`、`cwd`、`hook_event_name`）。
2. 钩子 stdout 的 JSON 能做什么：给用户看的一条消息、注入模型上下文、阻断工具、给权限决定——各自的**确切字段名**。
3. 钩子超时、退出码、输出非法 JSON 时对会话的影响；默认超时多少。
4. 钩子能否自己维护跨调用的状态（持久化到哪），还是必须由客户端判。
5. 插件能渲染的 UI 面（band / panel / 状态栏 / toast / 斜杠命令）分别渲染在哪；能否浮在操作系统桌面其他窗口之上。
6. VS Code 扩展是否有额外可用的集成面。

类型：research
状态：已解决
阻塞于：无

## 答案

事实清单见 [`research/cc-hook-facts.md`](../research/cc-hook-facts.md)。六条要点：

1. 引擎共接受 33 个事件；本图用得上的是 `PreToolUse` / `PostToolUse` / `PostToolBatch` / `UserPromptSubmit` / `SessionStart` / `SessionEnd` / `Stop`。
2. **能注入模型上下文**：`hookSpecificOutput.additionalContext`（`PostToolUse` 等支持）；给人看的消息用 `systemMessage`。
3. 超时按秒计，工具事件默认 15 秒，到点杀进程、丢弃输出、**不阻塞会话**。
4. 引擎不做任何计数与状态，**必须由客户端自己持久化**——与「状态归桌宠」的已定决策一致。
5. 插件 UI 面全部在宿主窗口内部，**无法浮在操作系统桌面之上**——桌宠必须独立成程序，Electron 路线得到确认。
6. 发现 `type: "http"` 的钩子可直接把输入 JSON POST 给外部服务，可能省掉发送端脚本；交由「事件协议」票比较。

局限：公开文档抓不到（网络门禁），事实取自本机 CLI 2.1.283 的内嵌注册表，升级后需复核。
