# Claude Code 钩子事实边界

> 服务对象：本图 02 阈值 / 03 协议 / 06 回灌 agent / 07 安装 四张票。
> 采集方式：**公开文档抓不到**（本机网络门禁把 `code.claude.com` 等一律拦成「无法验证域名安全」），因此事实全部取自本机已安装的一手产物——CLI `@anthropic-ai/claude-code` **2.1.283** 里的内嵌事件注册表、输入 schema、退出码契约与超时表，VS Code 扩展 **2.1.327**，以及官方 marketplace 插件源码。
> **因此这些事实是版本相关的**：升级 Claude Code 后值得复核一次。要对照公开文档，需解除网络门禁后抓 `https://code.claude.com/docs/en/hooks` 与 `.../plugins-reference`。

---

## 1. 事件全集与输入字段

运行引擎实际接受的钩子事件名（33 个，未列出的名字会被忽略并提示 Unknown hook event）：

`PreToolUse, PostToolUse, PostToolUseFailure, PostToolBatch, Notification, UserPromptSubmit, UserPromptExpansion, SessionStart, SessionEnd, Stop, StopFailure, SubagentStart, SubagentStop, PreCompact, PostCompact, PreModelSwitch, PostModelSwitch, PermissionRequest, PermissionDenied, Setup, TeammateIdle, TaskCreated, TaskCompleted, Elicitation, ElicitationResult, ConfigChange, WorktreeCreate, WorktreeRemove, InstructionsLoaded, CwdChanged, FileChanged, DirectoryAdded, MessageDisplay`

> 注意：官方 `plugin-dev` 钩子技能与 `update-config` 技能里只列了 10 个事件，**那份清单是陈旧的**；引擎接受的是上面 33 个。

### 所有事件的公共输入字段（stdin JSON）

`hook_event_name`、`session_id`、`transcript_path`、`cwd`、`permission_mode?`、`prompt_id?`（同一轮用户提示下所有事件的关联 UUID）、`scratchpad_dir?`、`agent_id?` / `agent_type?`（在子智能体里触发时）。

### 本图用得到的事件专属字段

| 事件 | matcher 字段 | 额外输入 |
|---|---|---|
| `PreToolUse` | `tool_name` | `tool_name`, `tool_input`, `tool_use_id`, `mcp_server?` |
| `PostToolUse` | `tool_name` | 同上 + `tool_response`, `duration_ms?` |
| `PostToolUseFailure` | `tool_name` | 同上 + `error`, `is_interrupt?` |
| `PostToolBatch` | 无 | `tool_calls[]`（每个 `{tool_name, tool_input, tool_use_id, tool_response?}`），**一批工具调用后只触发一次** |
| `UserPromptSubmit` | 无 | `prompt`, `source?`（`user`/`sdk`/`system`/`loop_wakeup`…） |
| `SessionStart` | `source` | `source`（`startup`/`resume`/`clear`/`compact`/`fork`）, `agent_type?`, `model?`, `session_title?` |
| `SessionEnd` | `reason` | `reason`（`clear`/`resume`/`logout`/`prompt_input_exit`/`other`） |
| `Stop` | 无 | `stop_hook_active`, `last_assistant_message?`, `background_tasks?` |
| `SubagentStart` / `SubagentStop` | `agent_type` | `agent_id`, `agent_type`, `agent_transcript_path`（Stop 侧） |
| `Notification` | `notification_type` | `message`, `title?`, `notification_type` |

**对本图最有用的一条**：`PostToolBatch` 在一批工具调用完成后才触发一次，天然比逐次 `PostToolUse` 少一大截事件量——但它是**批量**语义，单次要精确计数时可能不够细。

## 2. 钩子的返回契约

stdout 打印 JSON（也可由 `command` 钩子输出）：

```json
{
  "continue": true,
  "suppressOutput": false,
  "stopReason": "...",
  "decision": "approve|block",
  "reason": "...",
  "systemMessage": "...",
  "terminalSequence": "...",
  "hookSpecificOutput": { "hookEventName": "...", "additionalContext": "..." }
}
```

按本图关心的四件事归类：

- **给人看一条消息**：`systemMessage`，所有事件通用。
- **注入模型上下文**：`hookSpecificOutput.additionalContext`。**`PostToolUse` 支持**，另有 `PostToolUseFailure`、`PostToolBatch`、`Stop`、`SubagentStop`、`SessionStart`、`Setup`、`Notification`、`PostModelSwitch` 也支持。`UserPromptSubmit` / `SessionStart` 还有「exit 0 的 stdout 直接给 Claude 看」这第二条路。
- **阻断**：`decision: "block"` + `reason`（限 PostToolUse / Stop / UserPromptSubmit / SubagentStop），或 `continue: false` + `stopReason`，或退出码 2。
- **权限决定**：`PreToolUse` 用 `hookSpecificOutput.permissionDecision`（`allow`/`deny`/`ask`）+ `permissionDecisionReason` + `updatedInput`；`PermissionRequest` 用 `hookSpecificOutput.decision: {behavior: "allow"|"deny", ...}`。

## 3. 超时、退出码、坏输出

- `"timeout"` 单位是**秒**，引擎在截止后再加 5 秒宽限。
- 本版本的默认值：`PreToolUse` / `PostToolUse` / `PostToolUseFailure` / `PostToolBatch` / `PermissionDenied` / `SubagentStart` 均 **15 秒**；`UserPromptSubmit` / `UserPromptExpansion` 30 秒；`Stop` / `StopFailure` / `SubagentStop` 120 秒。表外的事件**没有默认值**，必须显式给。
- **挂住的钩子**：到截止即被杀死、输出丢弃，记为 `timeout` 且 `blocked: false`——**只推迟该事件，不阻塞会话**。（例外：宿主/SDK 注入的 `PreToolUse` 在截止前不答复会被记成「工具未执行」，那条路径是 fail-closed。）
- **退出码**：只有 **2** 是阻断信号，且各事件语义不同（`PreToolUse` 拦工具并把 stderr 给模型；`PostToolUse` 只把 stderr 给模型、不拦；`SessionEnd` / `Notification` 等不阻断）。其余非零退出码只把 stderr 给用户，事件照常继续。
- **非法 JSON**：schema 校验失败只产生一条告警，**不是阻断**；非 JSON 的 stdout 按各事件的文本契约处理。
- 匹配的多个钩子**并行执行**；每个 `command` 钩子是一次独立进程。

## 4. 「连续只读」计数只能由客户端做

- 引擎**不提供**计数器、历史或调用序号。每次调用只拿到当前事件的 JSON；`prompt_id` 只把同一轮提示下的事件归组。
- 钩子拿得到 `transcript_path`，但文档不保证每个事件触发时当前调用已落盘，**从 transcript 反推计数不可靠**。
- 官方示例明确由客户端自己持久化（按 PID 的临时文件、缓存文件），本图多会话场景下应按 `session_id` 分键。→ **与「状态归桌宠」的已定决策一致**。
- 引擎里也没有跨会话广播总线；观察者必须自己收各次调用并合并。

## 5. 钩子的种类与配置

- 类型：`command`、`prompt`、`agent`、`http`。`prompt`/`agent` 只用于工具事件；**`http` 把输入 JSON 直接 POST 到 `url`**（可带 `headers`）。可选字段还有 `async`、`asyncRewake`、`statusMessage`、`if`。
- 配置位置：用户级 `~/.claude/settings.json`、项目 `.claude/settings.json`、`.claude/settings.local.json`、插件 `hooks/hooks.json`；`/hooks` 可查看当前配置。
- matcher 按各事件自己的字段匹配（见上表），支持精确、`A|B`、`*`、`mcp__.*__delete.*` 这类正则。
- **钩子配置在会话启动时加载，改完不热更，要重启会话。**

## 6. 插件能渲染哪些 UI 面

- 这些 UI 面属于**函数钩子引擎**（`hooks/hooks.json` 里放 `"modules"`，`register(on, options)`），不是经典的 shell 钩子。官方标注为早期访问，需 `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1` 启动。
- 可用面：`AbovePrompt`（提示框上方的一条带）、`PromptHint`、`SessionMode`、`Pane`（聊天侧栏）、`Spinner`、`ToolProgress`、`InfoNotice`、`Backdrop`（画在 Claude Desktop 窗口聊天区**背后**）、以及命令式的 `$.ui.toast()` / `$.ui.status()` / `$.ui.notice()` / `$.ui.ask()` / `$.ui.open(pane)`。
- **全部位于宿主应用内部的槽位，没有任何创建系统窗口的能力**，也没有 `alwaysOnTop` 一类路径。→ **「始终在前台的桌宠」必须是独立程序，插件路线走不通。** 这为「Electron 独立 app」的决策提供了支撑。
- 另有设置项 `statusLine`（终端状态栏命令），同样只在宿主内。

## 7. VS Code 扩展

- 扩展启动的会话正常触发同样的钩子，可用 `CLAUDE_CODE_ENTRYPOINT=claude-vscode` 识别宿主。
- 函数钩子的 `ui.render` 能收到 `e.surface === "vscode"` 并分支。
- 扩展提供的 MCP 工具（`openDiff`、`getDiagnostics`、`executeCode`、`close_tab`…）都是 Claude→IDE 的动作，**没有向外部应用推送会话状态的公开通道**。
- → 桌面宠物只能吃**钩子事件流**，与第 6 节的结论一致。

---

## 对本图的直接结论

1. **06「预警回到 agent 自己」可行**：`PostToolUse` 返回 `hookSpecificOutput.additionalContext` 即把话送进模型上下文；`systemMessage` 同时能给人看。
2. **03 多出一条更简的路径**：`type: "http"` 的钩子可以把输入 JSON 直接 POST 给桌宠，**可能省掉整个发送端脚本**（代价：字段形状受引擎控制，可能需要在桌宠侧做映射；`http` 钩子能否自定义请求体/鉴权未验证）。这条要与「命令钩子跑一个薄客户端」摆在一起比。
3. **02 的阈值可以放心用**：钩子不阻塞会话，15 秒默认超时也远超本图所需的 1 秒自设上限。
4. **07 安装票记一条**：改完 `settings.json` 要重启会话才生效。
5. 事实版本基线：CLI 2.1.283 / 扩展 2.1.327；升级后复核。
