# 钩子与桌宠之间的事件协议

## 问题

钉死 `POST /event` 的载荷形状与语义，做到「协议中立」——不带 Claude Code 特有字段，别的 runtime 以后加发送端即可。

要定：

- 事件类型的最小全集：工具调用、用户发消息、会话开始 / 结束、心跳（可选）。
- 字段集：会话标识怎么来（直接复用 `session_id` 还是客户端另生成）、工作目录、工具名、时间戳，以及「写 / 读 / 其他」这个分类由发送端判还是在桌宠判。
- 会话结束怎么发：钩子里有没有可靠的会话结束事件，没有时靠什么兜底（超时淘汰？）。
- 幂等与乱序：重发、并发的两个会话同时 POST 时桌宠怎么处理。
- 日志落盘的形状（每会话一文件，字段与协议同构还是另起一份可见性更好的格式）。
- 桌宠除 `/event` 外还需要哪些端点（健康检查、状态查询，供 curl 与调试）。

产出是一份带示例 JSON 的协议说明，放进本图的 `research/` 或独立文件，从票里链接。

**已知事实**（见 [research/cc-hook-facts.md](../research/cc-hook-facts.md)）：

- 会话结束有可靠事件：`SessionEnd` 带 `reason`（`clear`/`resume`/`logout`/`prompt_input_exit`/`other`），不必只靠超时淘汰。
- 引擎支持 `type: "http"` 的钩子，**把输入 JSON 直接 POST 到 url**。这条要与「命令钩子跑一个薄客户端」摆在一起比：http 路线省掉整个发送端，但请求体形状由引擎决定、可能要在桌宠侧做字段映射，能否自定义 body/鉴权未验证。
- 逐次 `PostToolUse` 事件量大；`PostToolBatch` 每批只触发一次，但粒度粗。协议要说明选哪个、还是两个都要。

类型：grilling
状态：已解决
阻塞于：01

## 答案

### 发送端：命令钩子 + 薄客户端脚本

`http` 钩子被否决，理由实测（CLI 2.1.283 源码）：http 钩子失败（连接被拒 / 非 2xx / 响应非 JSON）会被引擎汇总进回合的 `hookErrors` 展示给用户——**宠物没开时每次工具调用都会刷告警**，与「连不上静默放弃」直接冲突。命令钩子可以用统一 `exit 0` 吞掉一切失败。

因此发送端是一个约 30 行的 Node 脚本：

1. 从 stdin 读钩子输入 JSON；
2. 提炼字段，POST 本机 `127.0.0.1:47900/event`，自设 1 秒超时；
3. **无论成功失败一律 `exit 0`**，stdout 只输出桌宠响应体（见下）；
4. 桌宠没开时什么都不输出、静默退出。

### 回话通道：桌宠的 HTTP 响应体原样透传 stdout

钩子协议确认：命令钩子 stdout 的 `hookSpecificOutput.additionalContext` 会进模型上下文。所以：

- 桌宠在 `/event` 的响应里放 `{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"<话术>"}}`（仅在需要喊话时）；
- 脚本把它原样打到 stdout；
- 话术由桌宠决定——**效果与后端逻辑的分离因此落在响应体这一侧**，脚本是一根不含判断的管子。

### 事件与粒度

挂载事件：`PostToolUse`（逐次，判据要精确计数，`PostToolBatch` 粒度太粗不采用）、`SessionStart`、`SessionEnd`、`UserPromptSubmit`（解除预警）、`Stop`（回合结束的可观测停顿）。

分类在**桌宠侧**做：脚本只转发引擎原始字段，桌宠按 02 票的表归类；协议因此保持中立。

### 载荷

请求体 = 引擎原始输入 JSON 的子集，脚本只挑这些字段：

```json
{ "event": "PostToolUse", "session_id": "...", "cwd": "...", "tool_name": "Read", "tool_input": { }, "ts": 1763600000000 }
```

- `event` ← 输入的 `hook_event_name`；`ts` 由脚本补（毫秒 Unix 时间）；`tool_input` 只挑小字段（`file_path`、`command`、`pattern`、`query`），不传大文本。
- 非工具事件（`SessionStart` / `SessionEnd` / `UserPromptSubmit` / `Stop`）不带 `tool_name` / `tool_input`，只带公共字段。
- 幂等：桌宠按 `(session_id, ts, event, tool_name)` 去重；两个会话并发 POST 各自独立成桶，无共享状态。
- 会话结束：`SessionEnd` 可靠送达即销毁该会话桶，不必只靠超时淘汰；桌宠另设「30 分钟无事件」的兜底过期。

### 端点

- `POST /event` —— 收事件，返回可选的回话体。
- `GET /state` —— 当前各会话状态 JSON（「效果与后端分离」的核心观测面）。
- `GET /health` —— 存在性探测。

端口 47900；被占时桌宠报错退出，不静默换端口（换了钩子找不到）。不做反向控制端点。

### 日志

每会话一个 JSONL：`logs/<session_id>.jsonl`，每行 `{ts, kind: "event"|"transition", ...}`，原始事件与状态迁移同流，事后能对上「为什么亮 / 为什么没亮」。保留 7 天，桌宠启动时清旧文件。端口、日志目录、保留天数进 `pet.config.json`。

## 后补：`POST /quit`

日常操作需要一个「干净关闭」的入口：`POST /quit` 先回 `{"ok":true,"closing":true}` 再退出，供技能与脚本重启前先停干净。这属于进程生命周期控制，不是反向驱动 agent，与原「不做反向控制端点」的边界不冲突；`/event`、`/state`、`/health`、`/mute` 的语义不变。
