# 多 agent 运行时事件模型：源码事实调查

只读事实，不含 schema 设计。三份源码均按本机工作区当前提交阅读：

| 代号 | 源码根 | HEAD |
| --- | --- | --- |
| DSH | `d:/Unity/Src/DSH/deepseek-harness` | `0a53fb55be` |
| PIA | `d:/Unity/Src/DSH/pi-agent` | `853a80d26` |
| PIM | `d:/Workspace/CodeView/test-repos/pi-mono` | `f10993b` |
| WO（基线） | `d:/Unity/Src/DSH/wo-agent` | `bd40a9b` |

下文路径均相对于上表源码根；`path:line` 指该行所在的代码。代码块是最短摘录，`...` 与合并的联合分支表示省略，不是逐字源码。

---

## 1. 各家运行时事件/消息模型

### 1.1 deepseek-harness（DSH）

DSH 是一个 append-only 的会话事件日志：每条事件带 `type` / `seq` / `time` / `data`，消息历史从日志投影出来，不是独立维护的富消息数组。

`packages/core/session/src/types.ts:216-320` 的 `SessionEventMap` 定义核心事件。核心集（计入压缩插件合并的 `compaction/*`）：

| 事件 | data 关键字段 | 粒度/含义 |
| --- | --- | --- |
| `turn/start` | `turn` | 轮次开始；一轮可含多个 step |
| `turn/end` | `turn`, `reason: TurnEndReason` | 轮次结束；reason 是判别联合 |
| `step/start` | `turn`, `step` | 一次模型调用 + 它请求的工具执行 |
| `step/end` | `turn`, `step` | 步骤结束 |
| `user/message` | `UserMessage`（含 `id`/`role`/`content`/`source`） | 进入模型可见表层的 user 消息 |
| `assistant/chunk` | `turn`, `step`, `chunk: StreamChunk` | 原始流分片，token 级 |
| `assistant/message` | `turn`, `step`, `message`, `usage?`, `interrupted?: true` | 一步组装后的 assistant 消息 |
| `tool/call` | `turn`, `step`, `callId`, `name`, `arguments`（原始 JSON 字符串） | 模型请求一次工具调用 |
| `tool/result` | `turn`, `step`, `message: ToolResultMessage`, `error?: {name, code}`, `meta?` | 一次已完成调用的模型可见结果 |
| `request/header` | `header: EpochHeader`, `reason`, `startsSeries?` | 下一次请求的完整调用配置 |
| `request/context` | `provider`, `model`, `contextWindow?` | 路由/容量元数据 |
| `compaction/start` | `compactionId`, `turn: number \| null` | 压缩事务开始 |
| `compaction/summary` | `compactionId`, `summary`, `shadowedRange`, `shadowedSeqs`, `usage?` | 摘要与压缩输入 |
| `compaction/end` | `compactionId`, `turn: number \| null`, `error?` | 压缩事务结束 |
| `session/end-seed` | 空 | 构造 seed 的边界标记 |

```ts
// packages/core/session/src/types.ts:223-236
'turn/start': { turn: number }
'turn/end': { turn: number; reason: TurnEndReason }
'step/start': { turn: number; step: number }
'step/end': { turn: number; step: number }
```

运行/轮次结束原因是结构化联合，不是字符串：

```ts
// packages/core/session/src/types.ts:150-169
completed: { kind: 'completed' }
aborted: { kind: 'aborted'; reason: TurnEndCancelCause }
error: { kind: 'error'; error: LlmFailure }
interrupted: { kind: 'interrupted' }
```

事件信封带单调序号与毫秒时间，并允许插件扩展事件类型：

```ts
// packages/core/session/src/types.ts:391-409
type: K; seq: number; time: number
data: SessionEventMap[K]
ignorable?: true
```

`assistant/chunk` 的 chunk 是判别联合，包含文本/推理/工具参数增量、块边界、用量和 finish：

```ts
// packages/llm/llm/src/types.ts:364-380
| { type: 'text-delta'; index: number; text: string }
| { type: 'tool-call-delta'; index; id; name?; argumentsDelta }
| { type: 'usage'; usage: TokenUsage }
| { type: 'finish'; reason: FinishReason; replayState?: ReplayEnvelope }
```

`user/message`、`assistant/message`、`tool/result` 是唯一能进模型可见表层的三种事件；其余是日志事件：

```ts
// packages/core/session/src/types.ts:330-334
export type SurfaceEventType =
  | 'user/message'
  | 'assistant/message'
  | 'tool/result'
```

表层事件可带 `surfaceOp: 'append' | { op: 'replace'; start; end }` 和 `sourceEventSeqs`；压缩用 replace 遮蔽旧表层节点。`packages/core/session/src/types.ts:344-376`。

事件类型不限于核心集：`packages/core/session/src/known-event-types.ts:22-74` 列出本仓库认识的 51 个类型，除核心事件外还包括：

- 运行/输入：`agent/inbox/spliced`、`agent-preset/selected`、`model/selection`、`permission/preset`
- 审批/交互：`approval/asked`、`approval/decided`、`approval/policy`
- 重试/用量相关：`llm/retry`、`llm/retry-started`
- 压缩：`compaction/prune`
- 工具扩展：`tool/code-dispatch`、`tool/code-dispatch-start`、`tool-workflow/*`、`todo/write`
- 子智能体：`subagent/descriptor`
- 钩子：`hook/invoked`、`hook/result`
- 会话元数据：`session/title`、`session/title-llm-request`、`session/end-seed`
- 团队/计划/沙箱/调度：`team/*`、`plan/mode`、`sandbox/mode`、`schedule/change`
- 其他：`command/run`、`command/done`、`feedback/record`、`goal/change`、`web/deepseek-search-llm-request`

压缩是显式事务，且 summary 本身不直接改表层；真正的表层替换是一条紧随其后的 `user/message` replace：

```ts
// packages/compaction/compaction/src/types.ts:69-76
'compaction/summary': { compactionId; summary: ContentBlock[]; shadowedRange; shadowedSeqs; usage?: TokenUsage }
'compaction/end': { compactionId; turn: number | null; error?: string }
```

订阅/回调：会话对象在提交后发出进程内的 `session/event`，监听器失败被隔离；另有等待持久化的 `session/flush` 和 `session/disposed`：

```ts
// packages/core/session/src/index.ts:63-83
'session/event'(this: Scoped<Session>, session: Session, event: SessionEvent): void
'session/flush'(this: Scoped<Session>, session: Session): Promise<void> | void
'session/disposed'(this: Scoped<Session>, session: Session): void
```

```ts
// packages/core/session/src/index.ts:639-645
callbacks = collectSessionCallbacks(entry.emitCtx, [entry.carrier, 'session/event', ...callbackArgs])
this.log.push(event as SessionEvent)
...
invokeContainedSessionObservers(entry.emitCtx, 'session/event', entry.id, callbackArgs, callbacks)
```

粒度：工具调用逐次记录（一个 `tool/call` 对应一个 `tool/result`），并行调用也按模型顺序提交结果；DSH 没有“工具执行中”事件：

```ts
// packages/core/agent-loop/src/tool-calls.ts:146-159
while (committed < group.length) {
  ...
  appendToolResult(session, turn, step, call!.block, result, callSeqs[committed]!)
```

### 1.2 pi-agent（PIA）

PIA 的核心运行时事件是 `AgentEvent`，10 种（`packages/agent/src/types.ts:429-444`），挂在 `Agent.subscribe()` 上；没有会话日志信封上的 `seq`：

```ts
| { type: "agent_start" }  | { type: "agent_end"; messages: AgentMessage[] }
| { type: "turn_start" }   | { type: "turn_end"; message; toolResults }
| { type: "message_start" | "message_end"; message: AgentMessage }
| { type: "message_update"; message; assistantMessageEvent: AssistantMessageEvent }
| { type: "tool_execution_start" | "tool_execution_update" | "tool_execution_end"; ... }
```

关键语义：

- `turn` 是“一次 assistant 响应 + 它请求的工具/结果”，不是 wo-agent 那种可含多 step 的 turn；事件里也没有 turn 编号。`packages/agent/src/types.ts:433-435`。
- 没有独立 `step` 事件。PIA 的持久化层另有一个 `step_attempt` 记录，但它的 `step` 是 `"assistant" | "branch_summary" | "compaction"` 的“可重试尝试”，不是对话步骤号。`packages/agent/src/harness/session/types.ts:129-148`。
- 用户消息、模型消息、工具结果共用 `message_start` / `message_end`，靠消息 `role` 区分（`user` / `assistant` / `toolResult`）；只有 assistant 在流式期间另有 `message_update`。`packages/ai/src/types.ts:421-467`、`packages/agent/src/types.ts:436-440`。
- 模型流式增量由 `message_update.assistantMessageEvent` 承载，是文本/推理/工具调用的 delta，而不是 provider 原始 chunk：
  ```ts
  // packages/ai/src/types.ts:535-545
  | { type: "text_delta"; contentIndex: number; delta: string; partial: AssistantMessage }
  | { type: "thinking_delta"; contentIndex: number; delta: string; partial: AssistantMessage }
  | { type: "toolcall_delta"; contentIndex: number; delta: string; partial: AssistantMessage }
  | { type: "toolcall_end"; contentIndex: number; toolCall: ToolCall; partial: AssistantMessage }
  ```
- 工具结果消息带 `isError`；工具调用参数是已解析对象：`arguments: Record<string, any>`。`packages/ai/src/types.ts:372-380`、`449-465`。
- 默认并行执行工具；`tool_execution_end` 按完成顺序发，而工具结果消息随后按 assistant 源顺序发。`packages/agent/src/types.ts:39-41`、`263-266`。

订阅是真正的回调，监听器按订阅顺序 await，`agent_end` 的监听器结算后才算 idle：

```ts
// packages/agent/src/agent.ts:250-252
subscribe(listener: (event: AgentEvent, signal: AbortSignal) => Promise<void> | void): () => void {
  this.listeners.add(listener);
  return () => this.listeners.delete(listener);
}
```

PIA 另有一套 `harness` 持久化模型，但没有可用的公开事件总线：

- `HarnessEvent` 只定义了 `run_start` / `run_end`；`Events.on()` 设计为订阅未来事件。`packages/agent/src/harness/events.ts:1-29`、`37-73`。
- `AgentHarness` 的 `hooks` 和 `events` 实际被绑到 `UnavailableRegistry`，调用会抛 `HarnessNotImplemented`。`packages/agent/src/harness/agent-harness.ts:326-327`。
- 持久化日志有 Entry 与 LaneRecord 两套词表：Entry 是对话/压缩/分支摘要，LaneRecord 是运行、abort、步骤尝试、工具启动、队列、用量等。`packages/agent/src/harness/session/types.ts:22-74`、`80-212`。
- `step_attempt`、`tool_started`、`usage` 等是日志记录，不是运行时事件。`packages/agent/src/harness/session/types.ts:129-201`。
- 遥测 schema 里还列了 29 个事件名（`run_start`、`turn_start`、`tool_start`、`compaction_start`、`usage` 等），这是 telemetry 词汇，不等于已实现的 event bus。`packages/agent/src/harness/telemetry.ts:161-191`。

PIA 的 `coding-agent` 在核心 `AgentEvent` 之上扩展出 `AgentSessionEvent`，增加压缩、重试、队列、条目追加等（`packages/coding-agent/src/core/agent-session.ts:144-172`）：

```ts
| { type: "agent_settled" }
| { type: "compaction_start" | "compaction_end"; reason: "manual" | "threshold" | "overflow"; ... }
| { type: "auto_retry_start" | "auto_retry_end"; attempt; ... }
| { type: "queue_update"; steering: readonly string[]; followUp: readonly string[] }
| { type: "entry_appended"; entry: SessionEntry }
```

### 1.3 pi-mono（PIM）

PIM 的 `agent` 包核心事件与 PIA 同形（`AgentEvent` 10 种，`packages/agent/src/types.ts:516-539`），差别主要在后续字段：

```ts
| { type: "agent_start" }  | { type: "agent_end"; messages: AgentMessage[] }
| { type: "turn_start" }   | { type: "turn_end"; message; toolResults }
| { type: "message_start" | "message_end"; message: AgentMessage }
| { type: "message_update"; message; assistantMessageEvent: AssistantMessageEvent }
| { type: "tool_execution_end"; ...; isError: boolean; durationMs?: number }
```

PIM 比 PIA 多出的核心字段/能力（均为代码事实）：

- `tool_execution_end.durationMs`；`ToolResultMessage` 有 `durationMs` 和 `nestedCalls`。`packages/agent/src/types.ts:531-539`、`packages/ai/src/types.ts:607-624`。
- `onProviderStreamEvent` 回调，能在归一化前拿到 provider 原始流事件。`packages/agent/src/agent.ts:122`、`473-475`。
- 循环配置有 `finishTurn` 和 `prepareRequest`（PIA 没有这两个）。`packages/agent/src/types.ts:256-271`。

`AgentSessionEvent` 除 PIA 那些扩展外，还带 `WithParentToolCallId`，用于标记工具内部通过 `ctx.executeTool()` 发起的嵌套工具调用：

```ts
// packages/coding-agent/src/core/agent-session.ts:188-197
type WithParentToolCallId<E> = E extends { type: "tool_execution_start" | ... }
  ? E & { parentToolCallId?: string }
  : E
```

PIM 另有一个 `durable` 兄弟包（不在 `agent` 包内），定义了实验性的、更接近会话日志的 `AgentEvent`：`run_start/end`、`turn_start/end`、`message_start/update/end`、`tool_execution_start/update/end`、`inbox_update`、`auto_retry_start/end`、`entry_appended`、`usage_changed`、`compaction_start/end` 等，并提供带 snapshot 的 `watchEvents` 提交流。`packages/durable/src/harness/events.ts:55-98`、`136-182`。这是 sibling package 的事实，不应误记为 `agent` 包事件。

订阅：核心 `Agent.subscribe()` 同 PIA；`coding-agent` 的 `AgentSession.subscribe()` 暴露扩展事件。`packages/agent/src/agent.ts:266-268`、`packages/coding-agent/src/core/agent-session.ts:1366-1372`。`durable` 的提交流同时提供 snapshot 与增量批次，溢出时用新 snapshot 替代未交付批次。`packages/durable/src/harness/events.ts:91-98`、`136-158`。

### 1.4 与 wo-agent 基线的事件模型对照

WO 的模型（`src/session/events.py:153-167`）是封闭的 13 种 dataclass 联合，`Session.append` 只接受 `SessionEventData`；事件带 `seq`/`time`，没有运行级 `agent_start/end`，没有工具执行中事件，没有独立 usage 事件，用量挂在 `assistant/message.usage`。`src/session/session.py:126-133`、`src/session/usage.py:37-54`。

```python
SessionEventData = Union[
    TurnStart, TurnEnd, StepStart, StepEnd, UserMessageEvent, AssistantChunk,
    AssistantMessageEvent, ToolCallEvent, ToolResultEvent, RequestHeaderEvent,
    CompactionStart, CompactionSummary, CompactionEnd,
]
```

---

## 2. 与 wo-agent 13 种事件的差集

按用户给的七类逐条对比。“等价”指语义可映射，不表示字段同名。

| 类别 | WO 基线 | DSH | PIA | PIM（agent 包 / 兄弟包） |
| --- | --- | --- | --- | --- |
| 工具调用 | `tool/call` + `tool/result`，逐次；顺序执行 | 同两类，逐次；并行调用按模型顺序提交；无执行中事件 | `tool_execution_start` / `_update` / `_end`，逐次；并行；另有 toolResult 的 `message_start/end` | 同 PIA；`_end` 多 `durationMs` |
| 轮次 | `turn/start` + `turn/end`（可含多 step，带 turn 号与 reason） | 同形，reason 为结构化联合 | `turn_start` / `turn_end`，无语义编号；一轮 = 一次 assistant 响应 + 工具批 | 同 PIA |
| 步骤 | `step/start` + `step/end`（turn 内模型调用序号） | 同形 | **核心无**；harness 的 `step_attempt` 是重试尝试，不是步骤号；telemetry 有 `pi.harness.step` span | **agent 包无**；durable 包也没有 step 事件 |
| 用户消息 | `user/message` | `user/message`（带 `source`） | 无独立类型；`message_start/end` 且 `role: "user"` | 同 PIA |
| 模型最终消息 | `assistant/message` | `assistant/message`（可带 `interrupted`） | `message_end` 且 `role: "assistant"`；error/aborted 也是 assistant 消息 | 同 PIA |
| 模型流式分片 | `assistant/chunk`（原始 `StreamChunk`，token 级） | 同左 | `message_update.assistantMessageEvent`（归一化 delta，token 级） | 同 PIA；另有 provider 原始流回调 |
| 压缩 | `compaction/start` + `summary` + `end` | 同三类，另有 `compaction/prune`；summary 后紧跟表层 replace | 核心无；coding-agent 有 `compaction_start/end`；harness 有 `CompactionEntry`（summary/retainedTail/tokensBefore/usage） | 核心无；coding-agent 有 `compaction_start/end`；durable 有 `compaction_start/end` 与只带 `reason` 的 `CompactionEntry`，摘要以 UserMessage entry 写入 |
| 用量 | 无独立事件；`assistant/message.usage` | 无独立事件；`assistant/message.usage?`、`compaction/summary.usage?` | `AssistantMessage.usage` 必填；`message_update` 带 usage；harness 另有 `UsageRecord` | 同 PIA；durable 另有 `usage_changed` 事件 |
| 请求配置（补充） | `request/header` | `request/header`（EpochHeader，reason 为 initial/resume/change/series）+ `request/context` | 无事件；配置经 model/thinking 状态与回调传递 | 无事件；配置经 `prepareRequest` 与 telemetry 属性传递 |
| 会话/运行边界（补充） | 无显式事件 | 会话日志无 start/end；有 `session/end-seed`；SDK 另发 `session.status` | `agent_start` / `agent_end`；coding-agent 另有 `agent_settled` | 同 PIA |

差集结论（按“谁有而谁没有”）：

- **DSH 是 WO 13 种的超集**：13 种全部存在且语义相近；额外有 `request/context`、`compaction/prune`、结构化 `turn/end.reason`、`assistant/message.interrupted`、`tool/result.error/meta`，以及大量插件事件（子智能体、审批、钩子、计划、沙箱等）。DSH 也有 WO 没有的 `ignorable` 未知事件标记。
- **PIA/PIM 相对 WO 缺少**：wo 式多 step 轮次、`step/start|end`、`request/header`、独立 `user/message`、独立 `assistant/chunk`（原始 chunk）、独立 `compaction/summary`（摘要是 entry 字段）、任何 dedicated usage 事件。
- **PIA/PIM 相对 WO 多出**：`agent_start` / `agent_end`、`message_start`/`message_end` 加 assistant 的 `message_update` 三阶段消息生命周期、`tool_execution_update`（执行中增量）、`tool_execution_end.isError`、工具结果消息带的 duration/nested calls（PIM）、provider 原始流回调（PIM）、压缩/自动重试/队列事件（coding-agent）。
- **同名不同义**：PIA/PIM 的 `turn` 对应 WO/DSH 的 `step`（一次模型调用 + 工具批），不是 WO/DSH 的 `turn`（可含多个 step）。PIA harness 的 `step` 又是“重试尝试”，与 WO/DSH 的步骤号无关。`packages/agent/src/types.ts:433-435`、`packages/agent/src/harness/session/types.ts:129-148`。

---

## 3. 三件事在各家如何表达

### 3.1 工具失败

| 来源 | 表达 | 证据 |
| --- | --- | --- |
| WO | 只有 `tool/result`；失败在 `message.content[0].is_error`，无顶层 error 字段。取消发生在两次工具之间时，未开始的调用根本不会记录 | `src/agent/loop.py:310-327`；`src/llm/types.py:137-146` |
| DSH | `tool/result.message` 的 `ToolResultBlock.isError?`，加可选的 `tool/result.error: {name, code}` 和私有 `meta`；取消时对未 dispatch 的调用补一条 `tool/call` + `tool/result`（`AbortError` / `tool call aborted before dispatch`） | `packages/llm/llm/src/types.ts:88-93`；`packages/core/session/src/types.ts:275-281`；`packages/core/agent-loop/src/tool-calls.ts:249-259` |
| PIA | `tool_execution_end.isError: boolean`，同时 toolResult 消息带 `isError`。execute 抛错、工具不存在、被 beforeToolCall 拦截、响应被 token 上限截断、运行被 abort，都会生成 `isError: true` 的结果；`afterToolCall` 可覆盖 `isError` | `packages/ai/src/types.ts:449-465`；`packages/agent/src/agent-loop.ts:379-401`、`627-633`、`720-774` |
| PIM | 同 PIA；另在 ToolResultMessage 上带 `durationMs`、`nestedCalls`。`afterToolCall` 可返回 `isError` 覆盖 | `packages/ai/src/types.ts:607-624`；`packages/agent/src/agent-loop.ts:912-927` |

DSH 的工具失败有两种“事实来源”：模型可见的 tool-result 内容（`isError`）和内部失败身份（`error.name/code`）。两者都存在，但不是同一字段。`packages/core/session/src/types.ts:275-281`。

```ts
// DSH packages/core/session/src/types.ts:275-281
'tool/result': { turn; step; message: ToolResultMessage
  error?: { name: string; code: string }; meta?: JsonValue }
```

```ts
// PIA packages/ai/src/types.ts:463；PIM packages/ai/src/types.ts:618
isError: boolean;
```

### 3.2 被中断/取消

| 来源 | 表达 | 证据 |
| --- | --- | --- |
| WO | `Agent.cancel(cause: str, keep_inbox=False)` 置 `asyncio.Event`；步骤返回 `"aborted"`，`turn/end.reason = "aborted"`；`assistant/message` 可能完全不写（失败/中断不写）；取消原因字符串只用于内部，不进入事件 | `src/agent/loop.py:128-132`、`220-238`、`272-280`；`src/session/events.py:32-36` |
| DSH | `Agent.cancel(cause: AgentCancelCause)`，cause 是 `user` / `parent` / `hook` / `disposed`；`turn/end.reason = {kind:'aborted', reason}`；中断时若有已交付内容，写 `assistant/message` 并带 `interrupted: true`；未 dispatch 的工具补合成错误结果；崩溃遗留的开放 turn 在加载时补 `turn/end.reason = {kind:'interrupted'}` | `packages/core/session/src/types.ts:137-145`、`250-257`；`packages/core/agent-loop/src/agent.ts:311-331`、`373-386`；`packages/core/agent-loop/src/tool-calls.ts:238-242`；`packages/core/session/src/repair.ts:28-40` |
| PIA | `Agent.abort()` abort 当前 run 的 `AbortController`；provider 流最终产 `stopReason: "aborted"` 的 assistant 消息；循环发 `turn_end` + `agent_end`；在途工具变 `isError: true` 的 `"Operation aborted"` 结果；`AgentState.errorMessage` 记录最近错误。没有结构化 cancel cause | `packages/agent/src/agent.ts:314-321`；`packages/ai/src/types.ts:405`；`packages/agent/src/agent-loop.ts:215-218`、`627-633` |
| PIM | 同 PIA。核心 agent 没有持久化 abort 记录；durable 兄弟包没有独立 abort 事件，`run_end` / `turn_end` 可观察，fault/orphan 走 `task_failed` | `packages/agent/src/agent.ts:336-343`；`packages/durable/src/harness/events.ts:58-61`、`317-320` |

要点：三种实现都区分“正常完成”与“被 abort”，但只有 DSH 持久化 cancel cause，并区分 `aborted`（主动取消）与 `interrupted`（崩溃遗留）。PIA/PIM 的 abort 也不同于“模型返回 `stopReason: error`”：前者是外部取消，后者是请求失败，但两者在消息层都表现为 assistant 终态。`packages/agent/src/agent-loop.ts:215-218`。

```ts
// DSH packages/core/session/src/types.ts:153
aborted: { kind: 'aborted'; reason: TurnEndCancelCause }
```

```ts
// PIA/PIM packages/ai/src/types.ts:405 / :456
export type StopReason = "pending" | "stop" | "length" | "toolUse" | "error" | "aborted" | "deferred";
```

### 3.3 子智能体（subagent）

| 来源 | 表达 | 证据 |
| --- | --- | --- |
| DSH | 一等公民：子会话 header 带 `parentSession`、`origin: 'subagent'`、`delegationDepth`；子会话内写 `subagent/descriptor`；运行时发 `subagent/start` / `subagent/end`（带 `runId`、`provider`、`id`、`local`、`stopReason`、`lastAssistantMessage`）；SDK 转成 `subagent.started` / `subagent.finished` 通知 | `packages/core/session/src/types.ts:56-93`；`packages/subagent/subagent/src/child-agent.ts:148-153`；`packages/subagent/subagent/src/index.ts:169-178`；`packages/subagent/subagent/src/types.ts:32-70`、`208-222`；`packages/sdk/protocol/src/types.ts:73-105` |
| PIA | agent 包无 subagent 概念；harness session 元数据只有 `parentSessionId`；coding-agent 只带一个示例扩展，它 spawn 独立 `pi` 进程（`--mode json -p --no-session`）并把结果作为普通工具结果返回，没有 subagent 事件 | `packages/agent/src/harness/session/types.ts:259-263`；`packages/coding-agent/examples/extensions/subagent/index.ts:294-303` |
| PIM | agent 包无 subagent 概念；`coding-agent` 的 experimental durable 扩展把子智能体实现为“子 conversation + 子工具任务”，对外仍是普通工具调用/结果；另有 `WithParentToolCallId` 标记嵌套工具调用。`AgentSessionEvent` 没有 subagent 生命周期事件 | `packages/coding-agent/src/experimental/durable/subagent.ts:20-48`；`packages/coding-agent/src/core/agent-session.ts:188-197` |

DSH 的子智能体有独立生命周期的起止事件和持久 lineage；PIA/PIM 若监控到子智能体，只能从“工具调用 + 另一会话/进程”推断。

```ts
// DSH packages/subagent/subagent/src/types.ts:32-40
export interface SubagentRunInfo {
  readonly runId: SubagentRunId; readonly provider: string
  readonly id: SessionId; readonly local: boolean
```

```ts
// PIM packages/coding-agent/src/experimental/durable/subagent.ts:28-31
name: "subagent",
description: "Delegate a self-contained task to a subagent with the same tools and get its answer back."
```

```ts
// PIA packages/coding-agent/examples/extensions/subagent/index.ts:300
const args: string[] = ["--mode", "json", "-p", "--no-session"];
```

---

## 4. 进程外可用接口

### 4.1 DSH

- **会话日志**：JSONL（可选 zstd）与 SQLite 持久化，日志就是事件本身，可离线读。
  ```ts
  // packages/session/session-persistence-jsonl/src/format.ts:225
  return records.map(record => JSON.stringify(encodeProvenanceForStorage(record))).join('\n')
  ```
  两条存储路径：`packages/session/session-persistence-jsonl/src/index.ts:142-175`、`packages/session/session-persistence-sqlite/src/index.ts:56`。
- **JSON-RPC stdio SDK**：进程外客户端可通过 `session/prompt`、`initialize`、`shutdown` 操作，并收到 `session.event`、`session.status`、`subagent.started`、`subagent.finished` 通知。
  ```ts
  // packages/sdk/server/src/server.ts:95-98
  ctx.on('session/event', (session, event) => {
    const payload: SessionEventNotification = { sessionId: String(session.id), event }
    this.transport.notify('session.event', payload)
  })
  ```
  `packages/sdk/protocol/src/types.ts:92-105`；stdio 说明 `packages/sdk/server/src/index.ts:1-9`。
- **ACP（Agent Client Protocol）JSON-RPC stdio**：把提交后的会话事件转成标准 `sessionUpdate`（`agent_message_chunk`、`agent_thought_chunk`、`tool_call`、`tool_call_update`、`usage_update`）；工具失败映射为 `status: 'failed'`。
  ```ts
  // packages/acp/acp/src/updates.ts:87-90
  return {
    sessionUpdate: 'tool_call_update',
    toolCallId: result.toolCallId,
    status: result.isError === true ? 'failed' : 'completed',
  ```
  `packages/acp/acp/src/index.ts:1-6`。
- **HTTP/WebSocket 网关**：Gateway 有 WebSocket 路由 `/api/remote.mux`，转发应用选择的 Cordis 事件。
  ```ts
  // packages/api/gateway/src/stream-protocol.ts:6-8
  export const REMOTE_STREAM_MUX_PATH = '/api/remote.mux'
  export const REMOTE_EVENT_STREAM_ENDPOINT = '$events'
  ```
  `packages/api/gateway/src/stream-protocol.ts:1-10`、`32-47`。
- **headless CLI**：一次性直接驱动 Agent，把 reasoning 流到 stderr、最终 assistant 文本流到 stdout；本身不是完整事件流。
  ```ts
  // packages/bundle/headless/src/index.ts:2-6
  The bundle patch rides over dsh-base without Host, HTTP, or browser plugins;
  this runner creates one Agent ... streams provider reasoning to stderr,
  flushes its Session, prints the final assistant text to stdout, and exits.
  ```
  `packages/bundle/headless/src/index.ts:1-9`、`84-100`。
- **外部命令钩子**：DSH 的 Claude Code 钩子桥通过 shell 运行外部 command hook，JSON 写 stdin，支持 `SessionStart`、`UserPromptSubmit`、`PreToolUse`、`PostToolUse`、`Stop`、`SubagentStart`、`SubagentStop`；每次调用在会话日志里留下 `hook/invoked` + `hook/result`。
  ```ts
  // packages/hooks/hooks-claude-code/src/config.ts:11-19
  const CLAUDE_EVENTS = [
    'SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse',
    'Stop', 'SubagentStart', 'SubagentStop',
  ] as const
  ```
  `packages/hooks/hook-protocol/src/runner.ts:70-90`；`packages/hooks/hook-protocol/src/types.ts:19-46`。

DSH 既支持进程内 `session/event` 订阅，也支持进程外读取日志、stdio JSON-RPC、ACP、WebSocket 和外部钩子进程。

### 4.2 pi-agent

- **进程内**：`Agent.subscribe`、`AgentSession.subscribe`；harness 的 `Events.on` 目前不可用（见 1.2）。
- **Unix domain socket 服务**：`PiServer` + `createUnixServer`，长度前缀 CBOR 帧，客户端发命令、服务端回 `server_snapshot` / `session_snapshot` / `session_progress` / `session_removed`。
  ```ts
  // packages/protocol/src/schemas.ts:400-407
  StrictObject({ type: Type.Literal("session_progress"), sessionId: IdSchema,
    progress: TranscriptProgressSchema }),
  ```
  `packages/server/src/types.ts:36-50`；`packages/server/src/sessions.ts:248-258`；`packages/server/src/transports/unix/preset.ts:1-12`；帧格式 `packages/protocol/src/framing.ts:1-30`。
- **stdout JSON/RPC 模式**：coding-agent 的 `--mode json` / `--mode rpc` 把 `AgentSessionEvent` 变成 stdout JSON 行，命令从 stdin 进；`message_update` 会剥掉累积快照，只留 delta。
  ```ts
  // packages/coding-agent/src/modes/json-event.ts:1-6
  Commands are sent as JSON lines on stdin.
  Responses and events are emitted as JSON lines on stdout.
  ```
  `packages/coding-agent/src/modes/rpc/rpc-types.ts:1-6`。
- **持久化日志**：harness 的 JSONL codec（Entry/LaneRecord）与 SQLite session backend。`packages/agent/src/harness/session/jsonl/codec.ts:9-27`；`packages/session-backends/sqlite-node/src/index.ts:1-10`。
  ```ts
  // packages/agent/src/harness/session/jsonl/codec.ts:9-16
  const ENTRY_TYPES = new Set<Entry["type"]>([
    "message", "model_change", "thinking_level_change", "active_tools_change",
    "compaction", "branch_summary", "custom",
  ])
  ```

PiServer 进程外可见的是 **transcript snapshot + 增量 progress**（`item_started`、`assistant_delta`、`item_updated`、`item_finished`），不是完整的原始 `AgentEvent` 流；`--mode json` / `--mode rpc` 则输出扩展后的 `AgentSessionEvent` JSON 行。`packages/protocol/src/schemas.ts:204-231`、`packages/coding-agent/src/modes/json-event.ts:1-20`。

### 4.3 pi-mono

- **进程内**：核心 `Agent.subscribe`、coding-agent `AgentSession.subscribe`；durable 兄弟包的 `watchEvents` 提交流（snapshot + 批次）。
- **Unix domain socket 服务**：`Server` + 通用 service call / service subscription 协议；帧是长度前缀 CBOR（`packages/protocol/src/protocol.ts:88-110`、`packages/server/src/transports/unix/preset.ts:1-12`）。协议是 contract-agnostic 的 `ServiceCall`，不是固定 transcript 事件类型。`packages/server/src/types.ts:1-30`。
  ```ts
  // packages/protocol/src/protocol.ts:88-92
  const ServiceEventEnvelopeSchema = StrictObject({
    type: Type.Literal("service_update"),
    subscriptionId: IdSchema,
    update: OpaqueJsonValueSchema,
  })
  ```
- **stdout JSON/RPC 模式**：与 PIA 同形的 `--mode json` / `--mode rpc`，命令 JSON 行 stdin、事件 JSON 行 stdout。`packages/coding-agent/src/modes/json-event.ts:1-6`、`packages/coding-agent/src/modes/rpc/rpc-types.ts:1-6`。
- **持久化**：durable 包有 JSONL 与 SQLite 存储目录。
  ```ts
  // packages/durable/src/storage/jsonl/storage.ts:111
  const jsonLine = (value: MainMarker | SidecarRecord): string => `${JSON.stringify(value)}\n`;
  ```
  `packages/durable/src/storage/jsonl/storage.ts:109-111`、`packages/durable/src/storage/sqlite/migrations.ts:10-28`。

`agent` 包本身只有进程内 import/订阅；进程外能力来自兄弟包 `server`、`coding-agent`、`durable`。

---

## 5. 对统一 schema 的约束

以下只列由上面事实推出、统一 schema 必须能容纳的东西，不给出字段设计。

1. **事件身份与顺序**：必须能容纳每条事件的来源、会话标识、单调序号、毫秒时间；不能假设跨 lane/跨子智能体/跨进程全局有序。DSH 用 `seq`/`time`；PIA 的 harness 用 `seq`/`timestamp` + `lane`；PIM 的 durable 用 conversation/task 维度；PIA/PIM 的核心 `AgentEvent` 没有信封序号。`packages/core/session/src/types.ts:391-423`；`packages/agent/src/harness/session/types.ts:14-20`；`packages/ai/src/types.ts:421-447`（消息自带 `timestamp`）。

2. **层级与语义映射**：必须同时容纳“会话 / 运行 / 轮次 / 步骤 / 工具调用 / 消息 / 压缩事务”这些层级，并允许某些来源缺少某一层。尤其不能把各家的 `turn` / `step` 按名字等同：WO/DSH 的 turn 可含多个 step，PIA/PIM 的 turn 等价于一次模型调用 + 工具批，PIA harness 的 step 是重试尝试。`packages/agent/src/types.ts:433-435`；`packages/agent/src/harness/session/types.ts:129-148`；`src/agent/loop.py:208-241`。

3. **逐次工具调用与乱序结果**：schema 必须以 `toolCallId` 关联调用与结果，不能依赖事件相邻或完成顺序。DSH 并行执行但按模型顺序提交结果；PIA/PIM 的 `tool_execution_end` 按完成顺序、结果消息随后按源顺序。`packages/core/agent-loop/src/tool-calls.ts:113-121`、`146-160`；`packages/agent/src/types.ts:39-41`、`263-266`。

4. **工具参数的双形态**：必须能容纳“模型产出的原始 JSON 字符串”（WO/DSH）与“已解析对象”（PIA/PIM）；PIM 在 `toolcall_start` 时参数还是 provider-specific 的部分值。不能假设参数总是可解析 JSON。`packages/core/session/src/types.ts:258-263`；`packages/ai/src/types.ts:372-380`；`packages/ai/src/types.ts:788-805`。

5. **工具执行中状态**：PIA/PIM 有 `tool_execution_update`（部分结果/输出流），WO/DSH 没有。schema 必须能表达“调用已开始、结果未定”的中间态，并且允许该态缺席。`packages/agent/src/types.ts:441-444`。

6. **失败的多层表达**：必须同时容纳布尔失败标志（`isError`）、结构化错误身份（DSH 的 `{name, code}`）、仅存在于消息内容里的失败（WO）、以及“未 dispatch/被跳过”的合成失败。不能只靠一个字符串错误字段。`packages/llm/llm/src/types.ts:88-93`；`packages/core/session/src/types.ts:275-281`；`packages/core/agent-loop/src/tool-calls.ts:249-259`；`packages/ai/src/types.ts:449-465`。

7. **中断与崩溃的区分**：必须能表达“主动取消”（含来源：用户/父智能体/钩子/销毁）、“模型请求失败”、“崩溃遗留的开放 turn”，以及部分输出（`interrupted` 的 assistant 消息）和取消后补写的合成工具结果。WO 只有字符串 `"aborted"`，DSH 有结构化 cause，PIA/PIM 只有 aborted 终态。`packages/core/session/src/types.ts:137-169`、`250-257`；`packages/core/session/src/repair.ts:28-40`；`src/agent/loop.py:220-238`；`packages/agent/src/agent-loop.ts:215-218`。

8. **轮次/步骤终态独立于消息存在**：WO 在 error/中断时不写 `assistant/message`；PIA/PIM 把失败写进 assistant 消息的 `stopReason`/`errorMessage`；DSH 用 `turn/end.reason`。schema 必须允许“有终态、无最终消息”以及“有最终消息、终态是 error/aborted”。`src/agent/loop.py:248-306`；`packages/agent/src/agent-loop.ts:215-256`；`packages/core/session/src/types.ts:150-169`。

9. **消息的三种角色与生命周期**：必须容纳独立 `user` / `assistant` / `toolResult` 消息；PIA/PIM 用同一组 `message_start/end`（assistant 流式期间另有 `message_update`），WO/DSH 用类型区分。必须区分“部分/流式快照”与“最终权威消息”，并允许 usage-only 的空 assistant 消息（WO 明确不投影空消息）。`src/session/session.py:34-58`；`packages/agent/src/types.ts:436-440`；`packages/ai/src/types.ts:421-467`。

10. **token 级数据的可选性与双形态**：WO/DSH 有原始 `StreamChunk`（文本/推理/工具参数 delta、usage、finish 分片）；PIA/PIM 有归一化 `AssistantMessageEvent` delta，PIM 还能从 provider 原始回调拿另一套事件。schema 必须能把 token 级数据标为可选，或按来源保留原样，不能假设两种 chunk 形状一致。`packages/llm/llm/src/types.ts:364-380`；`packages/ai/src/types.ts:535-551`；`packages/ai/src/types.ts:788-805`；`packages/agent/src/agent.ts:122`。

11. **压缩事务与表层替换**：必须容纳“压缩开始/摘要/结束”的事务身份，以及摘要是否真正替换了模型可见历史。DSH 是 `compaction/start|summary|end` + 紧随其后的 `user/message` replace；PIA harness 是 `CompactionEntry`（summary、retainedTail、tokensBefore、usage）+ coding-agent `compaction_start/end`；PIM durable 的 `CompactionEntry` 只带 `reason`，摘要以一条 UserMessage entry 写入并带首个保留 entry 的 `head`，coding-agent 另有 `compaction_start/end`。不能假设每条压缩都有三事件，也不能假设摘要一定在压缩事件里。`packages/compaction/compaction/src/types.ts:17-77`；`packages/agent/src/harness/session/types.ts:44-51`；`packages/coding-agent/src/core/agent-session.ts:209-220`；`packages/durable/src/entries.ts:31-34`。

12. **用量挂载点不唯一**：用量可能挂在 assistant 消息、压缩摘要、工具结果，或作为单独的 usage 记录/事件（PIA harness、PIM durable）。schema 必须允许用量按作用域出现，而不是只放在一个全局 usage 事件。`packages/core/session/src/types.ts:257`、`packages/compaction/compaction/src/types.ts:64-76`；`packages/ai/src/types.ts:433-454`；`packages/agent/src/harness/session/types.ts:190-201`；`packages/durable/src/harness/events.ts:85`。

13. **子智能体的独立生命周期与 lineage**：必须能表达父会话、子会话、run id、provider、启动/结束、结束原因、最后的 assistant 输出，以及 delegation depth；也要允许 PIA 只能把它看成普通工具调用、PIM 只能看到子 conversation + 工具调用而没有 subagent 生命周期事件。只靠工具调用无法还原 subagent 层级。`packages/core/session/src/types.ts:56-93`；`packages/subagent/subagent/src/types.ts:32-70`、`208-222`；`packages/subagent/subagent/src/index.ts:169-178`；`packages/sdk/protocol/src/types.ts:73-105`。

14. **未知事件与扩展词汇**：必须定义未知事件是“可跳过”还是“必须拒绝重建”。DSH 用 `ignorable?: true`，未标记且不认识的事件必须让读者拒绝重建；PIA/PIM 有 `custom` entry / declaration-merging 的消息扩展；WO 的 `SessionEventData` 是封闭联合，未知类型会在反序列化时报错。schema 不能静默丢弃可能影响历史重建的事件。`packages/core/session/src/types.ts:399-409`；`packages/core/session/src/known-event-types.ts:8-21`；`packages/agent/src/harness/session/types.ts:61-65`；`src/session/serialize.py:174-235`。

15. **日志事件 vs 快照/增量**：进程外接口可能只给 snapshot，也可能给增量 progress；PIA 的 `session_progress` 是归一化增量，snapshot 才是权威；PIM durable 的流在溢出时用新 snapshot 替代未交付批次。schema 必须区分“权威快照/最终事件”与“可丢的增量/进度”，并允许重放和重复交付。`packages/protocol/src/schemas.ts:203-231`、`400-409`；`packages/durable/src/harness/events.ts:91-98`。

16. **进程外传输的载荷约束**：事件需要能无损地走 JSONL、JSON-RPC、CBOR 帧和 stdout JSON 行；DSH 明确要求事件 data 是 lossless JSON（拒绝 BigInt/函数/Map 等），PIA/PIM 的 CBOR 帧有长度前缀和上限。schema 不能依赖不可序列化的运行时对象。`packages/core/session/src/index.ts:588-615`；`packages/protocol/src/framing.ts:1-20`（PIA）；`packages/protocol/src/framing.ts:1-30`（PIM）。

17. **钩子调用是独立事实**：DSH 的钩子桥把每次外部 command hook 记为 `hook/invoked` + `hook/result`（point、dialect、matcher、handlerId、decision、exitCode、stderrSummary、durationMs），并把 SessionStart/PostToolUse/Stop 等 hook 点作为独立词汇。统一 schema 必须能同时容纳“agent 自身事件”和“hook 调用记录”，不能按同名事件直接合并或重复计数。`packages/hooks/hook-protocol/src/types.ts:19-46`；`packages/hooks/hooks-claude-code/src/config.ts:11-19`；`packages/hooks/hook-protocol/src/runner.ts:70-90`。

18. **不假设所有来源都有请求配置**：WO 有 `request/header`，DSH 有 `request/header` + `request/context`，PIA/PIM 没有对应的持久化事件（配置在 model/thinking 状态、`prepareNextTurn` 回调、PIM 另有 `prepareRequest` 回调，以及 telemetry 属性里）。schema 必须允许请求配置字段缺失，且不把它当作所有会话的必需事实。`packages/core/session/src/types.ts:200-208`、`282-296`；`src/session/events.py:107-119`；`packages/agent/src/types.ts:225-232`（PIA）、`packages/agent/src/types.ts:256-271`（PIM）、`packages/agent/src/harness/telemetry.ts:45-116`。
