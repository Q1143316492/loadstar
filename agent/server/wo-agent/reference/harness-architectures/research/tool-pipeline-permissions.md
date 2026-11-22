# 工具执行、权限与沙箱：dsh、pi、wo-agent 对照

> 出自地图 `harness-evolution` 的对应研究票（规划产物，路线走完后可删）。
> 结论视图：[tool-pipeline 卡片](../tool-pipeline.md)
>
> 只列事实与选项，不做取舍；排序与是否进入路线留给后续 HITL 票。

## 来源与约定

路径前缀代表一个工作树，路径本身相对该工作树根：

- `dsh:` = `d:\Unity\Src\DSH\deepseek-harness` @ `0a53fb55be`
- `pi:` = `d:\Unity\Src\DSH\pi-agent` @ `853a80d26`
- `wo-agent:` = 本仓（调查时 HEAD `b9a96d6`）

本机观察（威胁模型一节会用到）：Windows 11，Git Bash 5.2.26（MSYS），Python 3.12.0；当前 shell 以 Medium 完整性级别运行，账号在 `BUILTIN\Administrators` 组内但未提权。

---

## 0. 事实速览

- **dsh** 的工具执行是一条分阶段管线：`tool/call` 先落日志 → `tools/pre-execute` waterfall（allow/deny/ask）→ 单调 guard（只能拒绝）→ `ask` 经 `ctx.approval` 解析 → `tools/execute` around waterfall（timeout/retry/metrics）→ 工具 body → `tools/post-execute` waterfall（accept/block/replace/附加上下文）→ 注册表规范化 → `finalizeContent` → `tools/result` 通知 → `tool/result` 落日志。`tools` 还要求每个工具声明 canonical output schema 与 renderer；`presentCall` / `presentResult` 把 UI 呈现从核心解耦。审批、权限 preset、sandbox 是三件独立的事，不是一条链。
- **pi** 明确不带权限系统：进程以启动它的用户权限运行，项目 trust 只控制是否加载项目资源，不是 sandbox。工具调用前后各有一个 hook：`beforeToolCall` 只能 block/reason/terminate，`afterToolCall` 可部分覆盖结果；coding-agent 的扩展层另有 `tool_call` / `tool_result` 事件，`tool_call` 可直接改动参数且不重新校验。工具默认并行，`executionMode: "sequential"` 可按工具退回串行。输出是 `content + details`，没有强制 output schema；UI 呈现由工具自己的 `renderCall` / `renderResult` 提供。
- **wo-agent** 已有注册表、守卫、错误转 `is_error`、取消事件与进程树终止；`bash` 自己已有默认 30s / 上限 300s 的超时、尾部截断（2000 行或 50KB）和进程树终止，`grep` / `glob` 也走同一套 timeout 与截断。缺的是**管线级**的审批、任意工具的超时、并发调度、canonical output、核心 presentation 契约。
- 票面说「缺少审批、超时、并发、输出规范化、presentation」需要校正：**超时和输出截断在 `workspace` 的进程工具里已经存在**；缺的是通用执行器的 deadline 和统一输出契约。**presentation 在 CLI 宿主里存在**（`cli/observe.py` 按工具名做预览与折叠），缺的是核心层可声明的呈现契约。

---

## 1. dsh 的形状

### 1.1 管线阶段与每段能改什么

`dsh:docs/tool-execution-pipeline.md` 给出一张完整的 Mermaid 流程图；`dsh:docs/subsystems/tools.md` 给出每个阶段能返回的 Decision 类型。按执行顺序：

| 阶段 | 语义 | 能改变什么 | 失败/拒绝语义 |
|---|---|---|---|
| `tool/call` 落日志 | 模型请求的工具调用先持久化 | 无 | 日志是审计与回放的事实源；UI 可先画 pending card |
| `tools/pre-execute` waterfall | 可扩展的 allow / deny / ask 策略 | 决策，不改参数 | `deny` 生成错误结果；`ask` 交给 `ctx.approval`，没有审批通道则 deny |
| 注册 guard | 单调的最终前置策略 | 只能 deny，不能 allow | 任一 guard 返回 reason 即拒绝，且后续 listener 不能翻回允许 |
| `ctx.approval` | 一次性人工/机器决策 | 无 | 只有 `allowed-once` 放行；`rejected` / `cancelled` / `unavailable` 全部 fail closed |
| `tools/execute` waterfall | around-dispatch：timeout、retry、metrics | 可以替换 `exec.signal`，不能替换调用身份 | wrapper 抛错会变成结构化错误结果 |
| 工具 body | 真正的执行 | 返回 canonical value | 抛错变成 `isError` 结果，不终止 turn |
| `tools/post-execute` waterfall | accept / block / replace / 附加上下文 | 可替换 `content` 或 `value`（不能同时），可 block 为错误，可加 `additionalContexts` | listener 抛错变成 `isError` |
| 注册表规范化 | 校验/渲染/冻结结果 | 把 body 值校验成 canonical value，再渲染 content | schema/render 失败变成 `isError` |
| `finalizeContent` | 定义自有的、同步的、内容-only 的最后变换 | 只能替换 content | 必须 total、不能抛 |
| `tools/result` | 同步通知冻结后的权威结果 | 只观察 | listener 失败被包含 |
| `tool/result` 落日志 | 模型可见结果持久化 | 无 | 批次按模型顺序提交 |

关键语义：

- **waterfall 是 around-middleware**：listener 收到 `(...args, next)`，调用 `next()` 委托，返回而不调用则短路；`dsh:docs/cordis-primer.md`。所以 `pre-execute` 的 listener 可以拥有决策，也可以只观察后委托。
- **pre-execute 不允许改参数**。参数在进入策略前已经被无损 JSON 快照并冻结；`dsh:docs/subsystems/tools.md` 明确说「Arguments cannot be rewritten because history, audit, UI, and execution must agree」。这一点与 pi 的扩展 `tool_call` 可改参数形成直接对照。
- **guard 是单调的**：`ToolGuard` 返回 `undefined` 表示保持上游决定，返回字符串表示拒绝；没有 allow 返回值，因此 listener 顺序不能把拒绝翻回允许（`dsh:docs/subsystems/tools.md`，`dsh:packages/core/tools/src/index.ts` 的 `ToolGuard` 类型）。
- **取消是管线的一等结果**：调用进入前已取消返回 `ABORTED_BEFORE_DISPATCH`；body 已启动后取消会等 body 到达静止，再把成功结果替换为 `ABORTED`；取消不会丢弃已启动的 promise（`dsh:packages/core/tools/src/index.ts` 的 `cancelResult` / `dispatchToolBody`）。

### 1.2 超时：工具声明预算，wrapper 协作式触发

- `ToolDefinition.timeoutMs` 是可选字段，声明在工具定义上，永不进入模型 schema；`dsh:docs/subsystems/tools.md`。
- 真正执行 deadline 的是 `@deepseek-ai/dsh-tool-call-timeout-policy`：一个 `tools/execute` wrapper，读取当前可见工具的 `timeoutMs`，用 `deadline(exec.signal, timeoutMs, 'TOOL_TIMEOUT')` 派生 signal，再在 `finally` 恢复上游 signal；自己的计时器触发时，把结果替换为 `Error: tool call timed out after <ms>ms`，错误码 `TOOL_TIMEOUT`（`dsh:packages/guard/timeout-policy/README.md`，`dsh:packages/guard/timeout-policy/src/index.ts`）。
- 它是**协作式**的，不是硬杀：工具忽略 `exec.signal` 就一直不返回，wrapper 也一直等在 `next()` 里；`dsh:packages/guard/timeout-policy/README.md` 的 Known Limitations 明确写「Cooperative, never a hard kill」。
- 没有全局默认预算：只有声明了 `timeoutMs` 的工具才有 deadline；dsh 自带的 `bash`、`read`、`write`、`edit` 都没有声明 `ToolDefinition.timeoutMs`（`dsh:packages/guard/timeout-policy/README.md`）。
- `bash` 走另一条路：超时属于 shell executor。`dsh-bash-local` 默认 `timeoutMs: 120000`、`maxTimeoutMs: 600000`，由 executor 用 `deadline` + `BASH_TIMEOUT` 分类，超时会终止进程树；`dsh:packages/shell/bash-local/README.md`。`dsh-tool-bash` 的 Known Limitations 明确说它 opt out 了 `timeout-policy`（`dsh:packages/shell/tool-bash/README.md`）。

### 1.3 并发：工具声明安全分类，循环做屏障与滚动池

- `ToolDefinition.isConcurrencySafe?(args): boolean` 是纯同步分类器；只有返回**精确的 `true`** 才算 parallel；省略、抛错、非 `true`、非法参数都按 exclusive 处理（fail closed）；`dsh:docs/subsystems/tools.md`，`dsh:packages/core/tools/src/index.ts` 的 `executionMode`。
- `ctx.tools.executionMode(exec)` 返回 `{ kind: 'parallel' }` 或 `{ kind: 'exclusive' }`；`exclusive` 单独执行并形成排序屏障（`dsh:docs/subsystems/tools.md`）。
- 循环调度在 `dsh:packages/core/agent-loop/src/tool-calls.ts`：
  - 每个 assistant step 的 tool calls 按模型顺序计划；
  - `exclusive` 组只跑一个调用；
  - `parallel` 组使用 `maxParallelToolCalls` 限制的滚动池；
  - 每个调用**启动前**重新读一次 `executionMode`，注册表变化可以在批次中插入新的屏障；
  - `pre-execute` 是顺序 await 的，只有 dispatch/body 重叠；结果与附加 context 仍按模型顺序提交；
  - 取消时停止补充新调用，排空已启动调用，并为未启动调用写合成的 `aborted before dispatch` 结果。
- 默认 `maxParallelToolCalls` 是 10（`dsh:packages/core/agent-loop/src/constants.ts`，`dsh:packages/core/agent-loop/README.md`）。dsh 自带工具里 `read` / `read_image` / `web_search` / `web_fetch` / `subagent` 声明了 `isConcurrencySafe: () => true`；`write` / `edit` 保持 exclusive（`dsh:packages/fs/tool-fs/README.md`，`dsh:packages/fs/tool-fs/src/read.ts` 等）。

### 1.4 输出：强制 canonical schema，value 与 content 分离

- 每个 `ToolDefinition` 必须有 `output: { schema, render, presentationMeta? }`：
  - `schema` 是受支持子集的 JSON Schema；
  - `render(args, value)` 是纯投影，把校验后的 canonical value 变成模型可见 `ContentBlock[]`；
  - `presentationMeta?(args, value)` 是纯的、可重放的呈现投影，只对顶层调用计算。
  （`dsh:docs/subsystems/tools.md`）
- 工具 body 只返回 canonical JSON value，不直接拼模型文本。注册表在 `createSuccessResult` 里做：无损快照 → JSON Schema 校验 → 深冻结 → `output.render` → 快照/冻结 content → 可选 `presentationMeta`（`dsh:packages/core/tools/src/index.ts`）。
- 成功结果形状是 `{ isError: false, value, content, meta? }`；失败是 `{ isError: true, error: { message, info? }, content, meta? }`。`value` 是**执行局部**的，不进入持久事件；持久化的只有 `content`、`error`、`meta`，所以回放能重建呈现，但不能重建 canonical 中间值（`dsh:docs/subsystems/tools.md`）。
- 输出校验失败、renderer 抛错、presentationMeta 抛错都会被规范化成 JSON-safe 的 `isError`，不会炸掉循环（`dsh:packages/core/tools/src/index.ts`）。

### 1.5 呈现：工具声明 render intent，UI 负责映射

- `presentCall?(args): ToolCallView` 描述 pending 状态，`presentResult?(args, result): ToolResultView` 描述完成状态；两者都是纯函数，可以同时被实时流和 session 回放调用（`dsh:docs/subsystems/tools.md`）。
- `ToolCallView` 是 `card` 判别联合：`generic` / `terminal` / `diff`；`ToolResultView` 是 `generic` / `terminal` / `diff` / `search` / `read` / `web`（`dsh:packages/core/tools/src/presentation.ts`）。
- UI 不需要 special-case 工具名：有对应 card 就渲染，没有就退回原始 `tool/result` content。`read` 的结构化字段（`path`、`offset`、`lines`、`totalLines`、`lang`）不能从模型文本无损重建，所以通过 `output.presentationMeta` 持久化，再由 `presentResult` 读回；`search` / `web` 同理（`dsh:packages/core/tools/src/presentation.ts`）。
- `schemas()` 只投影 `name` / `description` / `parameters`，`output`、`execute`、`timeoutMs`、`isConcurrencySafe`、`presentCall`、`presentResult` 都不会泄漏到模型请求（`dsh:docs/subsystems/tools.md`）。

### 1.6 审批：一次性、封闭结果、fail closed

- `ctx.approval.request(req)` 只回答一个问题：**这一个具体动作能否继续**。结果词汇是封闭的：`allowed-once` / `rejected` / `cancelled` / `unavailable`；只有 `allowed-once` 是允许，其余在调用方一律按拒绝处理（`dsh:docs/subsystems/approval.md`）。
- 每个请求有独立的 `ApprovalRequestId`，并在请求所属 session 里追加一对 log-only 审计事件 `approval/asked` / `approval/decided`；它们不进入模型 transcript（`dsh:docs/subsystems/approval.md`）。
- `ApprovalRequest` 只带 `agent`、`toolName`、可选 `callId`、可选 `reason`、可选 `signal`，**故意不带工具参数**：UI 可以通过 `callId` 把提示挂到已经流式展示的工具调用上，避免出现第二份可能漂移的参数副本（`dsh:docs/subsystems/approval.md`）。
- 每会话策略只有 `ask` / `never`：`ask` 交给组合的 answerer 链，没有 answerer 就是 `unavailable`；`never` 在 waterfall 之前就确定性返回 `rejected`，后注册的 listener 也不能绕过（`dsh:docs/subsystems/approval.md`）。
- 审批只支持一次性授权，没有 allow-always、记住规则、撤销列表或 grant store（`dsh:packages/interaction/user-approval/README.md` 的 Known Limitations）。
- `tools/pre-execute` 返回 `ask` 时，`ctx.tools` 在 guard 之前调用 approval；没有 `ctx.approval`、没有 agent、agent 不在开放 turn 内，都会 deny（`dsh:packages/core/tools/src/index.ts` 的 `serviceAsk`）。
- **dsh 核心没有「bash 必须审批」的默认策略**。`dsh-tool-bash` 源码里仍留有 `TODO(permissions): deployment policy belongs in tools/pre-execute`（`dsh:packages/shell/tool-bash/src/index.ts`）。dsh 自带的审批消费方主要是：sandbox 升权重试、fs 写升权重试，以及 Claude Code hooks 桥接的 `PreToolUse` ask（`dsh:packages/hooks/hooks-claude-code/src/index.ts`）。

### 1.7 权限 preset：把 sandbox 与 approval 两个旋钮打包

- `dsh-permission-presets` 是面向用户的 Permissions 选择器：每个 preset 是一个 `{ sandbox, approval }` bundle；它**不拥有任何执行逻辑**，切换时只通过两个 canonical setter 写 `sandbox/mode` 和 `approval/policy`（`dsh:docs/subsystems/permission-presets.md`）。
- 默认表是 `workspace-write` = `workspace-write` + `ask`，`danger-full-access` = `danger-full-access` + `never`；`custom` 是派生状态，不能作为切换目标（`dsh:docs/subsystems/permission-presets.md`）。
- 挂载要求一个 confining 的 bash executor 和 approval service；没有 sandbox 能力的组合不能挂（`dsh:docs/subsystems/permission-presets.md`，`dsh:packages/interaction/permission-presets/README.md`）。

### 1.8 sandbox：只管文件效果，按调用携带策略

- `SandboxMode = 'read-only' | 'workspace-write' | 'danger-full-access'`；它只治理文件效果，网络与进程可见性不在这个词汇里（`dsh:docs/subsystems/sandbox.md`）。
- 策略按**每次调用**解析并携带：`mode`、`workspaceRoot`、可选 `sessionId`；`workspaceRoot` 来自调用 session 的不可变 cwd，经文件系统语义规范化（`dsh:docs/subsystems/sandbox.md`）。
- `ctx.sandbox.confine(argv, policy)` 返回要执行的替代 argv、enforcement 事实、denial 方言和 runner failure 规则；没有可用 backend 时抛 `SANDBOX_UNAVAILABLE`，**不允许静默无约束透传**（`dsh:docs/subsystems/sandbox.md`）。
- enforcement 是报告事实：`full` 或 `partial`。Windows ACL restricted-token 后端会因为 Everyone / hard-link 边界报 `partial`；旧 Landlock ABI 也可能 partial（`dsh:docs/subsystems/sandbox.md`）。
- 只有前两种 mode 会交给 provider；`danger-full-access` 的消费者直接 spawn 原 argv，不调用 `ctx.sandbox`（`dsh:docs/subsystems/sandbox.md`）。
- bash 与 fs 的升权是同一套 fail-closed 流程：必须严格比当前 mode 更宽、必须有 justification、必须经 `ctx.approval` 的 `allowed-once`；拒绝/取消/通道不可用都会抛错，命令不会执行（`dsh:packages/sandbox/sandbox/src/escalation.ts`，`dsh:packages/shell/tool-bash/README.md`，`dsh:packages/fs/tool-fs/src/sandbox.ts`）。

### 1.9 三道防线各自管什么

| 机制 | 管什么 | 不管什么 | 谁消费 |
|---|---|---|---|
| `tools/pre-execute` + guard | 每次工具调用是否允许、是否要问、是否被最终拒绝 | 不改参数；不直接执行审批 | 工具管线；hooks、deployment policy |
| approval | 一个具体动作的一次性人工/机器决策 | 不记得规则；不审计参数；不是所有工具都会问 | pre-execute 的 `ask`、sandbox/fs 升权 |
| permission preset | 把 sandbox mode 与 approval policy 打包成用户可选的名字 | 不执行、不拦截、不审计 | 客户端 Permissions 选择器、`/permission` |
| sandbox | 进程能写哪些文件系统位置 | 网络、进程可见性、读权限、凭据 | bash executor、fs 写/改 |

一个容易误读的点：dsh 的「三道防线」不是每个工具都默认经过三层。**sandbox 是执行层的文件效果边界；approval 只在有人调用 `ask` 或升权时出现；preset 只是 UI 打包。** 普通 `bash` 在 `danger-full-access` 下既不 sandbox 也不审批。

### 1.10 dsh 自己承认的限制

- 工具超时是协作式的，工具不响应 signal 就不会停；没有全局默认预算（`dsh:packages/guard/timeout-policy/README.md`）。
- `bash` 不受 `ToolDefinition.timeoutMs` 管，走 executor 的 `BASH_TIMEOUT`；后台进程没有 executor timeout，只能 `job_kill`（`dsh:packages/shell/tool-bash/README.md`）。
- approval 只支持 open turn 内、一次性授权；请求不带参数；没有内置 answerer（`dsh:docs/subsystems/approval.md`，`dsh:packages/interaction/user-approval/README.md`）。
- sandbox 在 Windows 上是 partial enforcement，且不覆盖网络/进程（`dsh:docs/subsystems/sandbox.md`）。
- `ToolDefinition.timeoutMs` 只对声明了它的工具生效；`bash`、`read`、`write`、`edit` 都没有声明（`dsh:packages/guard/timeout-policy/README.md`）。

---

## 2. pi 的形状

### 2.1 定位：核心不带权限系统

- README 的 Permissions & Containerization 一节直接写：pi 不包含限制文件系统、进程、网络或凭据访问的内置权限系统；默认以启动它的用户和进程权限运行（`pi:README.md`）。
- `docs/security.md` 进一步区分：Project Trust 只控制是否加载项目本地 settings / resources / packages / extensions，**不是 sandbox**，也不限制模型启动后让工具做什么；pi 把用户可写的文件视为同一个本地信任边界（`pi:packages/coding-agent/docs/security.md`）。
- pi 的设计判断是：部分 in-process sandbox 容易被误解为安全边界，真正的隔离应来自 OS / 容器 / VM；因此提供三种容器化模式：Gondolin micro-VM 扩展、整进程 Docker、OpenShell（`pi:packages/coding-agent/docs/containerization.md`）。
- extensions 以完整系统权限运行；项目本地 extensions 只有在项目被信任后才加载（`pi:packages/coding-agent/docs/security.md`，`pi:packages/coding-agent/docs/extensions.md`）。

### 2.2 `beforeToolCall` / `afterToolCall`

- `beforeToolCall(context, signal)` 在参数通过 schema 校验之后、工具执行之前调用；返回 `{ block: true, reason?, terminate? }` 可以阻止执行，loop 生成错误 tool result（`pi:packages/agent/src/types.ts`）。
- `beforeToolCall` 只负责 block，不提供 allow/ask 词汇；如果要弹确认框，由扩展/宿主自己在 hook 里做，然后用 block 表达拒绝。示例 `permission-gate.ts` 就是匹配危险命令后 `ctx.ui.select`，非 UI 环境直接 block（`pi:packages/coding-agent/examples/extensions/permission-gate.ts`）。
- `afterToolCall(context, signal)` 在工具完成后、结果事件发出前调用；返回 `AfterToolCallResult` 可逐字段覆盖 `content`、`details`、`isError`、`usage`、`terminate`；省略的字段保留原值，没有 deep merge（`pi:packages/agent/src/types.ts`）。
- hook 抛错时：`beforeToolCall` 抛错会变成错误结果（`prepareToolCall` 的 catch）；`afterToolCall` 抛错会把结果替换为错误结果（`finalizeExecutedToolCall` 的 catch）（`pi:packages/agent/src/agent-loop.ts`）。

### 2.3 扩展层：`tool_call` / `tool_result`

- coding-agent 把 `beforeToolCall` / `afterToolCall` 接到扩展事件：`tool_call` 可 block，`tool_result` 可修改结果（`pi:packages/coding-agent/src/core/agent-session.ts`）。
- `tool_call` **在参数已经校验之后**触发，但 `event.input` 是 mutable 的；扩展可以原地改参数，后续 handler 看到改动，**不会重新做 schema 校验**（`pi:packages/coding-agent/docs/extensions.md`）。这与 dsh 的「参数不可改写」是根本分歧。
- `tool_result` 的 handler 像 middleware 一样链式执行，后一个看到前一个改过的结果，返回 partial patch（`pi:packages/coding-agent/docs/extensions.md`）。
- 扩展也可以直接替换内置工具（`registerTool` 覆盖 `read` 等），渲染和执行可以分开继承（`pi:packages/coding-agent/docs/extensions.md`）。

### 2.4 并发：默认并行，按工具退回串行

- `AgentLoopConfig.toolExecution` 默认 `"parallel"`：调用先顺序 preflight，再并发执行；`tool_execution_end` 按完成顺序发出，最终 tool-result 消息仍按 assistant 源顺序发出（`pi:packages/agent/src/types.ts`，`pi:packages/agent/src/agent-loop.ts`）。
- 每个工具可以设 `executionMode?: "sequential" | "parallel"`；如果同一个 assistant message 里**任意一个**工具是 `sequential`，整个 batch 都走串行路径（`pi:packages/agent/src/types.ts`，`pi:packages/agent/src/agent-loop.ts`）。
- 并行路径是“顺序 prepare，然后 `Promise.all` 执行”；该实现没有显式并发上限，batch 内的可并行调用会全部同时启动（`pi:packages/agent/src/agent-loop.ts` 的 `executeToolCallsParallel`）。
- 与 dsh 相比：pi 没有 exclusive barrier 之间的滚动池、没有启动前重新分类；一个 sequential 工具会把整个 batch 降级为串行。

### 2.5 输出与呈现

- 工具返回 `AgentToolResult<TDetails>`：`content` 是文本/图片块，`details` 是给日志或 UI 的任意结构化数据，`usage`、`addedToolNames`、`terminate` 可选（`pi:packages/agent/src/types.ts`）。
- 工具用 **throw** 表示失败，而不是在 content 里编码错误；`execute` 返回对象本身不会设置 `isError`（`pi:packages/coding-agent/docs/extensions.md`）。
- 没有强制的 output schema，也没有 registry 侧的 value 校验/render 分离；`details` 的类型由工具和 UI 自行约定（`pi:packages/agent/src/types.ts`，`pi:packages/coding-agent/docs/extensions.md`）。
- 呈现由工具定义的 `renderCall(args, theme, context)` / `renderResult(result, options, theme, context)` 返回 TUI `Component`；这是 coding-agent UI 的契约，不是 provider-neutral 的 render intent（`pi:packages/coding-agent/src/core/extensions/types.ts`）。
- 扩展可以覆盖 `renderCall` / `renderResult`；覆盖执行不等于覆盖渲染，省略的 slot 继承内置 renderer（`pi:packages/coding-agent/docs/extensions.md`）。

### 2.6 bash 工具

- schema 是 `command` + 可选 `timeout`（秒）；**没有默认 timeout**，不传就不设 timer（`pi:packages/coding-agent/src/core/tools/bash.ts`）。
- 超时或 abort 会 `killProcessTree(pid)`；Windows 上 shell 不开 detached，Unix 上 `detached: true` 以便杀进程组（`pi:packages/coding-agent/src/core/tools/bash.ts`）。
- 输出尾部截断到 2000 行或 50KB，取先到者；被截断时把完整输出保存到临时文件，并在结果里报告路径（`pi:packages/coding-agent/src/core/tools/bash.ts`，`pi:packages/coding-agent/src/core/tools/truncate.ts`）。
- 非零退出码是正常结果，不是工具错误；工具只对生命周期错误（spawn、timeout、abort）抛错（`pi:packages/coding-agent/src/core/tools/bash.ts`）。
- 与 dsh 一样，bash 本身没有 sandbox；隔离靠把整个 pi 或工具执行路由到容器/VM（`pi:packages/coding-agent/docs/containerization.md`）。

### 2.7 项目 trust 与容器化

- trust 的触发条件是项目里存在 `.pi/settings.json`、`.pi/extensions`、`.pi/skills`、`.pi/SYSTEM.md`、`.agents/skills` 等；默认 `defaultProjectTrust: "ask"`，保存的决定按目录落在 `~/.pi/agent/trust.json`（`pi:packages/coding-agent/docs/security.md`）。
- 非交互模式（`-p`、JSON、RPC）不弹 trust prompt；`ask` / `never` 会忽略需要 trust 的资源，`always` 会信任（`pi:packages/coding-agent/docs/security.md`）。
- trust 不能阻止模型让工具做越界操作，也不能让不可信代码/提示/模型输出变安全；pi 明确把 repo 文件、注释、文档、构建输出里的 prompt injection 视为本地 agent 的预期风险（`pi:packages/coding-agent/docs/security.md`）。
- 容器化三种模式：Gondolin 扩展把内置工具和 `!` 命令路由进本地 Linux micro-VM；Plain Docker 把整个 pi 进程放进容器；OpenShell 用策略控制的 sandbox 运行整个进程（`pi:packages/coding-agent/docs/containerization.md`）。

### 2.8 pi 自己承认的限制

- 没有内置权限系统、没有内置 sandbox；Project Trust 只是加载期 guard（`pi:README.md`，`pi:packages/coding-agent/docs/security.md`）。
- `beforeToolCall` 只有 block，没有 ask/allow 语义；需要确认流时由扩展自己实现（`pi:packages/agent/src/types.ts`，`pi:packages/coding-agent/examples/extensions/permission-gate.ts`）。
- `tool_call` 改参数后不重新校验，审计/回放看到的是改动后的参数；没有 dsh 那种「参数不可改写」的不变量（`pi:packages/coding-agent/docs/extensions.md`）。
- 并行 batch 没有上限；一个 sequential 工具会让整个 batch 串行（`pi:packages/agent/src/agent-loop.ts`）。
- 没有强制 output schema；`details` 的形状靠工具和 UI 约定（`pi:packages/agent/src/types.ts`）。

---

## 3. wo-agent 现状

### 3.1 `RegistryToolExecutor` 的管线

`wo-agent:src/tools/executor.py`：

1. 查注册表；未知工具 → `is_error` 结果。
2. 依次跑 `ToolGuard.check(name, arguments)`；第一个返回 reason 的守卫拒绝，后面的不跑。
3. `json.loads(arguments)`；非 object 包成 `{"value": ...}`；空字符串变成 `{}`。
4. 调 `tool.execute(parsed)`。
5. `except Exception` → 把 `str(error)` 包成 `{"error": ...}` 文本，`is_error=True`。

它没有：参数 JSON Schema 校验、pre-execute 的 allow/deny/ask、post-execute、canonical output、presentation、executor 级 timeout、并发调度、结构化 error info。

### 3.2 守卫：单调拒绝，但只有拒绝

- `ToolGuard` 协议是 `async check(name, arguments) -> str | None`；返回 reason 即拒绝，返回 `None` 表示不表态（`wo-agent:src/tools/executor.py`）。
- 守卫按 `add_guard` 顺序追加，没有作用域、没有 disposer、没有优先级；第一个拒绝即返回（`wo-agent:src/tools/executor.py`）。
- 守卫看到的是**原始 JSON 字符串**，不是已解析、已校验的参数；它不能附加上下文，也不能要求审批（`wo-agent:src/tools/executor.py`）。
- CLI 的 `boot()` 没有注册任何 guard（`wo-agent:cli/boot.py`），所以当前产品形态下守卫是空列表。

### 3.3 错误：全部变成 `is_error` 结果

- 未知工具、守卫拒绝、参数解析失败、工具抛错都返回 `ToolResult(content=[TextBlock(text=json.dumps({"error": message}))], is_error=True)`（`wo-agent:src/tools/executor.py`）。
- 没有错误分类/错误码；`ToolResult` 只有 `content` 与 `is_error`（`wo-agent:src/tools/executor.py`）。
- `ToolResultEvent` 有一个 `error: str | None` 字段，但循环只构造 `message`，没有传 `error`（`wo-agent:src/agent/loop.py`，`wo-agent:src/session/events.py`）。

### 3.4 取消：contextvar 事件 + 工具自觉

- 循环把当前轮的 `asyncio.Event` 传给 `execute(..., cancel=...)`；`RegistryToolExecutor` 把它绑进 contextvar，`bash` / `grep` / `glob` 通过 `tool_cancel()` 读取（`wo-agent:src/tools/cancel.py`，`wo-agent:src/tools/executor.py`，`wo-agent:src/workspace/tools.py`）。
- 会起进程的 runner 在 spawn 前检查已取消，在等待时 `asyncio.wait` 同时等进程结束、超时和取消；超时/取消都 `kill_process_tree`；Windows 用 `taskkill /F /T`，Unix 用 `killpg`（`wo-agent:src/workspace/shell.py`）。
- executor 不把取消转成专门的错误码/结果；取消是工具自己的事。`except Exception` 也不会捕获 `CancelledError`（Python 3.12 中它继承 `BaseException`），所以一个工具若主动抛 `CancelledError`，它会继续向上传播，不会变成 `is_error`（`wo-agent:src/tools/executor.py`）。
- 没有 dsh 那种「进入管线前已取消 → `ABORTED_BEFORE_DISPATCH`；body 已启动 → 等静止后替换为 `ABORTED`」的统一语义。

### 3.5 bash 已有能力

`wo-agent:src/workspace/shell.py`、`wo-agent:src/workspace/tools.py`：

- 默认 timeout 30s，模型可在参数里覆盖，最大 300s；`grep` / `glob` 用同一个默认 30s，但没有模型可覆盖的 `timeout` 参数（`wo-agent:src/workspace/tools.py` 的 `_run_search`）。
- 输出按尾部截断到 2000 行或 50KB；`bash` 结果头部带 `exit` / `cwd` / 可选 `timed_out` / `aborted`（`wo-agent:src/workspace/shell.py`）。
- 超时退出码 124，取消退出码 130；非零退出码不是管线错误，仍然是成功结果（`wo-agent:src/workspace/shell.py`，`wo-agent:src/workspace/tools.py`）。
- bash 的 `cwd` 钉在工作区根，但**没有 chroot/namespace/ACL**；命令可以读、写根外路径。文件围栏只在 `read` / `write` / `edit` 的 `WorkspacePaths.resolve` 里（`wo-agent:src/workspace/paths.py`，`wo-agent:src/workspace/shell.py`，`wo-agent:CLAUDE.md`）。
- 没有 output spill 文件；截断只保留尾部，完整输出丢弃（`wo-agent:src/workspace/shell.py`）。对照：`dsh-bash-local` 每个流默认 64KB 内存上限，溢出写 spill 文件（上限 64MB），并在结果里报告路径（`dsh:packages/shell/bash-local/README.md`，`dsh:docs/subsystems/subprocess.md`）。
- 没有后台 job runtime；命令可以自己 `&` / `nohup`，但没有 job id、完成通知、`job_kill`。

### 3.6 输出规范化：各工具各自拼文本

- `bash` / `grep` / `glob` 有统一的尾部截断与 header；`read` 有行号窗口、`READ_LIMIT`；`write` / `edit` 返回固定句子（`wo-agent:src/workspace/tools.py`，`wo-agent:src/workspace/read_render.py`，`wo-agent:src/workspace/shell.py`，`wo-agent:src/workspace/search.py`）。
- 没有 canonical value / render 分离；工具直接返回 `list[ContentBlock]`（`wo-agent:src/tools/definition.py`）。
- 没有 output schema，也没有对工具返回值的校验；工具返回什么就写什么（`wo-agent:src/tools/executor.py`）。

### 3.7 presentation：宿主侧按工具名硬编码

- `cli/observe.py` 的 `ObservingToolExecutor` 在内部 executor 外面包一层，开始/结束各回调一次；结果仍是原样转交（`wo-agent:cli/observe.py`）。
- `argument_preview` 按工具名取字段：`bash` 取 `command`，`grep` / `glob` 取 `pattern` + `path`，`read` / `write` / `edit` 取 `file_path`；其他工具返回空串（`wo-agent:cli/observe.py`）。
- `format_tool_card` 生成 `●  name preview`，未展开时只保留结果尾部 8 行，预览 80 字符（`wo-agent:cli/observe.py`）。
- TUI 只消费这些字符串；`ctrl+o` 切换展开（`wo-agent:cli/tui/app.py`，`wo-agent:cli/tui/widgets.py`）。
- 这是**宿主侧呈现**，不是核心契约：换一个宿主（Unity / UE）就没有这套卡片；工具也无法声明自己的 pending/diff/terminal 视图。

### 3.8 缺口对照

| 环节 | dsh | pi | wo-agent 现状 | 缺口性质 |
|---|---|---|---|---|
| 参数校验 | `defineTool` / JSON Schema，`ToolArgsError` | `validateToolArguments` | 只 `json.loads`，非 object 包 `{"value": ...}` | 无 schema 校验 |
| 前置策略 | pre-execute allow/deny/ask + guard | `beforeToolCall` block | guard 只能拒绝 | 缺 ask/审批 |
| 审批 | `ctx.approval` 封闭结果、审计事件 | 无内置，扩展自做 | 无 | 缺审批 seam |
| 超时 | 工具声明 `timeoutMs` + wrapper；bash executor 超时 | bash 可选 timeout，无默认 | bash/grep/glob 有 timeout；任意工具无 deadline | 缺通用 deadline |
| 并发 | `isConcurrencySafe` + 屏障 + 滚动池 | 默认并行，按工具串行 | 循环严格串行 | 缺调度 |
| 输出 | 强制 schema + value/render 分离 | content/details 约定 | 各工具拼文本 | 缺 canonical 契约 |
| 呈现 | `presentCall` / `presentResult` 纯 render intent | 工具自带 `renderCall` / `renderResult` | 宿主按工具名硬编码 | 缺核心契约 |
| 错误 | `Error: msg` + `error.info` code | throw → `isError` | `{"error": msg}` | 缺结构化错误码 |
| 取消 | 管线一等结果 | AbortSignal 传给 hook/tool | contextvar 事件，工具自觉 | 缺统一取消语义 |

### 3.9 票面假设校正

- **不是「缺超时」**：`bash` 有 30s/300s 的 timeout，`grep` / `glob` 也有 30s timeout；缺的是**executor 级**的通用 deadline，以及非进程工具（未来可能有的 web fetch、子 agent）的超时策略。
- **不是「缺输出规范化」到零**：`bash` / `grep` / `glob` 已有尾部截断和 header，`read` 已有行号窗口；缺的是统一 canonical output（schema、value、render、meta）和跨工具一致的错误/呈现词汇。
- **不是「缺 presentation」到零**：CLI 已有 `cli/observe.py` 的预览/折叠；缺的是核心可声明的呈现契约，以及回放时能重建结构化卡片（read/search 的行号、匹配分组等）。
- **并发**：`ReactLoopAgent._run_step` 对 `tool_calls` 是 `for` 循环顺序 `await`，没有 batch 调度（`wo-agent:src/agent/loop.py`）。
- **审批**：完全没有；`boot()` 不注册 guard，也没有 approval 通道（`wo-agent:cli/boot.py`）。

---

## 4. 个人机器上 `bash` 的真实威胁模型

### 4.1 运行事实

- `bash` 由 `LocalBashRunner` 用 `asyncio.create_subprocess_exec(str(bash), "-c", command, cwd=workspace)` 启动；Windows 上找 Git Bash 的 `bash.exe`，不回退 `cmd`（`wo-agent:src/workspace/shell.py`）。
- 没有 `env=` 参数，所以子进程继承父进程的完整环境，包括 `UTAGENT_API_KEY` / `DEEPSEEK_API_KEY`（`wo-agent:src/workspace/shell.py`，`wo-agent:cli/boot.py`）。
- 当前 shell 是 Medium 完整性；账号虽在 Administrators 组，但进程未提权。因此不能静默写 `C:\Windows` / `Program Files`，但可以读写当前用户拥有的全部文件、用户注册表、用户级启动项、`~/.ssh`、浏览器配置、项目里的 `.env` 等。提权需要 UAC 交互，不是静默。
- 网络不受限；`curl` / `Invoke-WebRequest` / `git push` 都可以发出去。
- 文件围栏只在 `WorkspacePaths.resolve`，`bash` 不经过它；`bash` 的 cwd 只是默认目录，不是边界（`wo-agent:src/workspace/paths.py`，`wo-agent:src/workspace/shell.py`）。
- `AGENTS.md` / `CLAUDE.md` 会从工作区一路向上扫描，默认到 home 为止（工作区不在 home 下时到文件系统根），全部塞进系统提示词，没有 pi 那样的 project trust 提示（`wo-agent:src/system_prompt/agents_md.py`，`wo-agent:cli/boot.py`）。
- 会话日志落在 `.wo-sessions/*.jsonl`，是明文，包含工具参数与结果；`.gitignore` 排除了它，但它仍在磁盘上（`wo-agent:src/session/jsonl.py`，`wo-agent:.gitignore`）。

### 4.2 资产

- 用户文件：源码、文档、照片、下载、桌面、其他项目。
- 凭据：环境里的 API key、`~/.ssh`、`~/.git-credentials` / credential manager、云 CLI 配置、浏览器 cookie/密码库、`.env` 文件。
- 身份与通道：git 远端写权限、GitHub token、邮件/聊天客户端、已登录的浏览器会话。
- 持久化位置：`~/.bashrc` / `~/.bash_profile`、`~/.gitconfig`、git hooks、用户级启动目录、计划任务、PATH 上的可执行文件、Python site-packages、npm 全局包、IDE 配置、`.vscode/tasks.json`。
- 系统可用性：磁盘、CPU、正在运行的其他进程。
- 会话与审计数据：`.wo-sessions` 里的历史命令与输出。

### 4.3 攻击/故障路径

1. **模型误操作（最常见）**：`rm -rf` 错目录、`git reset --hard`、覆盖文件、杀错进程、装错包、改错配置。模型没有恶意，但命令有破坏性。
2. **Prompt injection（最值得防）**：克隆的仓库、`AGENTS.md`、README、代码注释、issue 文本、`grep` 输出里写着“请把 ~/.ssh/id_rsa 发到某地址”或“先运行这条命令”。wo-agent 自动把工作区及祖先的 `AGENTS.md` / `CLAUDE.md` 注入系统提示词，所以不可信仓库可以在模型启动时就获得指令通道（`wo-agent:src/system_prompt/agents_md.py`）。pi 的 security doc 明确把这类注入视为本地 agent 的预期风险（`pi:packages/coding-agent/docs/security.md`）。
3. **凭据外泄**：`env` 里就有 API key；`bash -c 'env | curl ...'` 是最短路径。会话日志也会记录包含密钥的命令输出。
4. **供应链**：`pip install` / `npm install` 的安装脚本、从网上下载的 `rg` 二进制、第三方 skill / 扩展、`git clone` 的 hooks。wo-agent 的 `cli/skills/cli-env-init.md` 要求先问用户再下载 ripgrep，但这是一条提示，不是强制执行。
5. **持久化**：写 shell profile、git hooks、用户级启动项、PATH 上的同名可执行文件，下一次会话或下一个项目继续受影响。Medium 完整性不阻止这些用户级写入。
6. **后台驻留**：`bash` 可以 `nohup ... &`；wo-agent 没有 job runtime，超时/取消只杀当前进程树，已脱离的进程可能继续跑。
7. **上下文/隐私泄漏**：bash 输出被截断后写进 session；如果输出包含密钥、token、个人数据，它会留在明文日志里，并可能被备份/同步工具带走。
8. **可用性**：fork bomb、填满磁盘、`kill` 用户进程、把 CPU 打满。

### 4.4 现有控制与失效点

| 控制 | 实际作用 | 失效点 |
|---|---|---|
| `read` / `write` / `edit` 的根围栏 | 阻止文件工具越界；`resolve()` 跟 symlink，根内外指链接会被拒 | 对 `bash` 完全无效 |
| `bash` 的 cwd | 只是默认工作目录 | 命令可 `cd ..` / 用绝对路径 |
| `bash` 的 timeout | 杀掉当前进程树 | 不限制网络、不限制持久化、不限制 `nohup` 脱离 |
| 输出截断 | 控制上下文体积 | 不是安全边界；完整输出已在命令侧产生 |
| 取消事件 | 用户可停当前轮 | 只对读同一个 event 的工具生效 |
| 会话日志 | 事后审计 | 明文、含敏感输出、不是预防 |
| `AGENTS.md` 注入 | 提供项目约定 | 没有 trust 提示，本身就是注入通道 |
| 无 approval | 无 | 模型可以直接跑任何命令 |
| 无 sandbox | 无 | 进程拥有用户全部权限 |
| 无 env scrub | 无 | API key 直接暴露给子进程 |

### 4.5 风险量级

- **可能性**：模型误操作是高频事件；prompt injection 在不可信仓库/网页内容上是中高频；有针对性的供应链攻击在个人机器上是低频，但一旦命中影响大。
- **影响**：个人机器上不是多租户横向移动，而是个人账号、个人文件、个人凭据；最坏情况是凭据被窃、代码/数据被改、持久化后门。
- **是否可接受**：取决于是否有人看着、是否在不可信仓库里跑、是否无人值守。有人盯着、只跑自己的仓库、能随时 Ctrl-C，风险显著低；无人值守 + 不可信内容，风险高。
- **关键结论**：在这个场景里，**文件围栏不是安全边界，bash 才是真正的权限面**；OS sandbox 是唯一能真正限制 bash 文件/网络效果的东西，但成本高；审批是成本最低的人工闸门。

### 4.6 教学价值高但个人使用过度 vs 刚需

**教学价值高、个人使用过度（除非有明确无人值守/不可信代码场景）**：

- dsh 的完整 sandbox seam：bwrap / Landlock / Seatbelt / Windows ACL restricted-token；Windows 后端还是 partial，且不覆盖网络/进程（`dsh:docs/subsystems/sandbox.md`）。为一个本地学习型 harness 实现多平台 sandbox provider，改动面和维护成本都很大。
- sandbox 升权阶梯 + `sandbox_permissions` + `justification`：只有先有 sandbox 才有意义；没有 sandbox 时这套字段是空的。
- permission preset + `/permission` + session policy + audit pair：面向多会话/多用户产品体验；一个人用一台机器时，直接问一次更直接。
- allow-always / remembered grants / grant store：dsh 自己都没有；个人使用容易变成“一路允许”，反而稀释审批价值。
- 每个工具都强制 output schema + presentationMeta + provider-neutral card union：教学价值很高，但小工具集（read/write/edit/bash/grep/glob）用少量约定就能覆盖；全套 card 词汇是 UI 产品工程。
- 完整 post-execute 生态（repeat-tool-reminder、hooks、additionalContexts）：属于“模型行为治理”，不是个人机器的安全刚需；但 post-execute 这个缝本身很便宜。
- 有上限的滚动池 + 启动前重新分类 + 独占屏障：dsh 的调度器是为多工具、多 agent、长会话设计的；wo-agent 当前工具少、模型一次通常只发少量调用，完整调度器是过度设计。并发安全标记本身很便宜。

**刚需（按“个人机器 + 本机 bash”场景）**：

- **bash 的人工闸门**：至少在非交互/无人值守/不可信仓库时，能对 bash 调用做 allow/deny，并默认 fail closed。形式可以是“每次 bash 问一次”，也可以是“危险命令问、其他放行”；前者更安全但更吵，后者更可用但依赖模式匹配的覆盖度。
- **凭据清洗**：spawn bash 时不要把 `UTAGENT_API_KEY` / `DEEPSEEK_API_KEY` 等敏感变量传下去。这是低成本、高收益，且不依赖 UI。
- **进程树超时/取消**：已有，保留；这是防止模型跑飞的最低成本控制。
- **文件工具围栏**：已有；继续保留，但不要把它宣传成 sandbox。
- **可审计**：已有的 session 日志保留；如果加审批，审批结果也应落日志（至少 `tool/call` + 决策 + `tool/result` 能串起来）。
- **明确的“不沙箱”提示**：当前 tool description 和 system prompt 已经写“not sandboxed”；保留，并让模型知道它不能假装有沙箱。
- **输出截断**：已有，保留；它主要保护上下文和误泄漏面，不是安全边界。
- **取消/停止**：已有；保留。

**介于两者之间（取决于使用方式）**：

- **审批范围**：只审批 bash，还是审批所有写操作？只审批 bash 能覆盖最大权限面；审批 write/edit 能防止误改文件，但文件围栏已经限制了范围。
- **危险命令模式**：`rm -rf`、`sudo`、`chmod 777`、`git reset --hard`、`curl | sh` 等。实现便宜，但可绕过（变量拼接、别名、脚本文件），只能算“提醒”，不能算边界。
- **环境隔离**：只清 API key，还是连 `~/.ssh`、云配置一起隔离？后者需要容器/独立用户，成本上升。
- **无人值守模式**：如果 wo-agent 会被脚本/定时器驱动，审批必须能自动拒绝（类似 dsh 的 `never`），而不是等人。

### 4.7 个人使用的最小可行权限形态（选项，不决策）

| 选项 | 形状 | 成本 | 覆盖的威胁 | 不覆盖 |
|---|---|---|---|---|
| A. 现状 | 无 approval，无 sandbox，只有围栏 + timeout | 零 | 文件工具越界、跑飞 | bash 的任何越界/注入/外泄 |
| B. bash 审批门 | `pre-execute` 对 `bash` 返回 `ask`，宿主 UI 确认；无 UI 时 deny | 低-中 | 模型误操作、部分注入（人能看见命令） | 用户点“允许”、用户看不懂命令、无人值守 |
| C. 审批 + 凭据清洗 + 危险命令提示 | B + spawn 前删敏感 env + 对高危模式额外提示 | 中 | 大部分误操作、最直接的 key 外泄 | 复杂注入、持久化、网络外传 |
| D. 审批 + OS/容器隔离 | C + 把 bash 放进容器/受限用户/独立 VM | 高 | 文件/网络/凭据边界 | 仍需正确配置；Windows 上 dsh 的 ACL 只是 partial |
| E. dsh 全套 | pre-execute + approval + presets + sandbox + escalation + hooks | 很高 | 最完整 | 仍不覆盖网络/进程（除非容器/VM） |

研究观察：在“个人机器、有人看着、只跑自己仓库”的默认场景里，B/C 的前置最少、收益最直接；D 的真实收益取决于是否经常跑不可信仓库或无人值守；E 更适合作为架构学习目标，而不是个人日常的最小闭环。这个观察不是决策，最终取舍留给 HITL 票。

---

## 5. 候选机制清单

下表按“前置依赖 → 改动面 → 最小验收”给出可搬机制。排序不代表决策优先级。

从改动面与收益看，可以分成三组（这是研究观察，不是取舍）：

- **最小闭环**：5.1 前置决策三态 + approval、5.2 执行器级超时、5.6 结构化错误码。三者都不要求重写工具的输出形状，能直接补上安全与稳定性缺口。
- **结构性升级**：5.3 并发调度、5.4 canonical output、5.5 presentation。它们会改变 `ToolDefinition` 与工具实现，收益是管线一致性和 UI/回放能力。
- **架构卡片**：5.7 post-execute、5.8 sandbox seam、5.9 permission presets。教学价值高，但个人使用场景下前置和成本都更高。

### 5.1 前置决策三态：allow / deny / ask + approval seam

- **上游依据**：dsh `PreToolDecision` + `ctx.approval`（`dsh:docs/subsystems/tools.md`，`dsh:docs/subsystems/approval.md`）；pi 只有 block，没有 ask，可作为反例（`pi:packages/agent/src/types.ts`）。
- **前置依赖**：
  - 一个宿主可实现的 `ApprovalChannel` 协议（CLI 用 confirm，宿主可注入 auto-deny / auto-allow）；
  - 工具调用已经在执行前落日志（wo-agent 已满足：`ToolCallEvent` 先 append，再 execute，`wo-agent:src/agent/loop.py`）；
  - 当前 turn 是开放的（wo-agent 的 tool call 总在 turn/step 内，天然满足）。
- **改动面**：
  - `src/tools/executor.py`：在 guard 之前加 pre-execute 决策；`ask` 走 `ApprovalChannel`；保持 guard 的单调拒绝；
  - `src/tools/definition.py` 或新协议文件：决策类型、审批结果类型；
  - `src/session/events.py`：可选地记录 `approval/asked` / `approval/decided`（log-only）；
  - `cli/boot.py` + `cli/tui`：注册 CLI 审批通道；
  - `cli/observe.py`：pending 卡片可以显示“等待审批”。
- **最小验收**：
  - 无审批通道时，`ask` 变成 `is_error`，工具 body 不被调用；
  - 审批拒绝/取消时，工具 body 不被调用，结果为 `is_error`；
  - `allowed-once` 时工具执行一次，且只对这一次有效；
  - guard 仍然可以在审批通过后拒绝；
  - 测试用 fake channel，不依赖真实 UI。

### 5.2 执行器级协作超时 + `TOOL_TIMEOUT`

- **上游依据**：dsh `timeoutMs` + `tools/execute` wrapper（`dsh:packages/guard/timeout-policy/README.md`，`dsh:docs/subsystems/tools.md`）；pi 的 bash timeout 是工具内部计时（`pi:packages/coding-agent/src/core/tools/bash.ts`）。
- **前置依赖**：
  - 工具要能观察取消（wo-agent 已有 `tool_cancel()` contextvar；新工具应遵守）；
  - 要接受“协作式”语义：工具不响应就停不下来；不能假装是硬超时；
  - 每个工具要有自己的预算声明（默认可以不给）。
- **改动面**：
  - `src/tools/definition.py`：加可选 `timeout_s`；
  - `src/tools/executor.py`：在 `execute` 外层用 `asyncio.wait` 同时等工具任务、超时、取消；超时后返回结构化 `is_error`（带 `TOOL_TIMEOUT` 之类 code）；
  - `src/tools/executor.py` / `ToolResult`：补 error code 字段（见 5.6）；
  - `bash` 已有自己的 timeout，可保持工具内实现，或改为声明预算 + 共用 wrapper；两条路都可行，需在决策票里选。
- **最小验收**：
  - 一个永不返回但响应 cancel 的 fake tool，在 `timeout_s` 后返回 `is_error`，code 可识别；
  - 一个不响应 cancel 的 fake tool，超时后调用方仍等待（明确记录这个限制，不假装能硬杀）；
  - 工具内 timeout（bash）与 executor timeout 的优先级/错误码不冲突；
  - 取消事件不被超时路径吞掉。

### 5.3 并发安全标记 + 批次调度

- **上游依据**：dsh `isConcurrencySafe` + exclusive barrier + 滚动池（`dsh:docs/subsystems/tools.md`，`dsh:packages/core/agent-loop/src/tool-calls.ts`）；pi 的 batch 级并行/串行（`pi:packages/agent/src/agent-loop.ts`）。
- **前置依赖**：
  - 循环能拿到一批 tool calls（wo-agent 已拿到 `tool_calls` 列表，`wo-agent:src/agent/loop.py`）；
  - 每个工具能声明/默认“独占”；
  - 结果必须按模型顺序落日志（否则 session 派生历史会错位）；
  - 取消要能停止补充新调用并排空已启动调用。
- **改动面**：
  - `src/tools/definition.py`：加 `is_concurrency_safe(args) -> bool`（默认 False/省略）；
  - `src/tools/executor.py`：暴露 `execution_mode(name, args)`，fail closed 到 exclusive；
  - `src/agent/loop.py`：把顺序 `for` 改成 batch 调度；最小版本可以只做“全 exclusive 时顺序、全 parallel 时 `asyncio.gather`、混合时按屏障分组”；
  - `src/session/events.py`：结果仍按模型顺序 append；
  - 测试：用 event 控制两个 fake tool 的重叠/不重叠。
- **最小验收**：
  - 未声明 `is_concurrency_safe` 的工具永远不重叠；
  - 两个声明 safe 的工具可以重叠（用 `asyncio.Event` 证明）；
  - 一个 exclusive 调用前后的 safe 调用形成屏障；
  - 结果顺序与模型调用顺序一致；
  - 取消时已启动调用被排空，未启动调用得到合成错误结果（或至少不丢结果）。

### 5.4 canonical output：schema + value + render + meta

- **上游依据**：dsh `ToolOutputDefinition`（`dsh:docs/subsystems/tools.md`，`dsh:packages/core/tools/src/index.ts`）；pi 只有 `content + details`（`pi:packages/agent/src/types.ts`）。
- **前置依赖**：
  - 一个 JSON Schema 校验器。wo-agent 运行时只依赖 `httpx`；引入 `jsonschema` 是新增运行时依赖，或者手写一个受支持子集（dsh 自己也是受支持子集，不是完整 JSON Schema）；
  - 工具 body 改为返回 canonical value，而不是直接拼 `ContentBlock`；
  - session 持久化只存 content/meta，不存 value（与 dsh 的取舍一致）。
- **改动面**：
  - `src/tools/definition.py`：`ToolDefinition` 加 `output_schema`、`render(args, value)`、可选 `presentation_meta(args, value)`；
  - `src/tools/executor.py`：成功后校验 value、调用 render、规范化失败为 `is_error`；
  - `src/workspace/tools.py`：六个工具逐个改成“返回 value + render”；
  - `src/session/events.py`：`ToolResultEvent` 可加 `meta`（可选）；
  - `pyproject.toml`：如果引入校验器，加依赖。
- **最小验收**：
  - 一个返回非法 value 的 fake tool 变成 `is_error`，不炸循环；
  - 合法 value 经 render 后得到预期 `ContentBlock`；
  - `presentation_meta` 只对顶层调用计算（如果有嵌套调用）；
  - 成功结果不把 value 写进 session 日志；
  - 现有 `read` / `bash` 的模型可见文本保持不变（回归测试）。

### 5.5 presentation 契约：工具声明 render intent，宿主负责映射

- **上游依据**：dsh `presentCall` / `presentResult` + card union（`dsh:docs/subsystems/tools.md`，`dsh:packages/core/tools/src/presentation.ts`）；pi 的工具自带 `renderCall` / `renderResult`（`pi:packages/coding-agent/src/core/extensions/types.ts`）。
- **前置依赖**：
  - 5.4 的 `presentation_meta`（如果要做 read/search 的结构化卡片）；
  - 宿主侧有 UI 桥（wo-agent 是 Textual，未来可能是 Unity / UE）；
  - 呈现函数必须是纯的，能在实时与回放两条路径调用。
- **改动面**：
  - `src/tools/definition.py`：加可选 `present_call(args)` / `present_result(args, result)`，返回 provider-neutral 的小型 dict/union（至少 `generic` / `terminal` / `diff` / `read` / `search`）；
  - `cli/observe.py`：从按工具名 hardcode 改成优先用工具声明、没有就 fallback 到现有 `argument_preview` / 纯文本；
  - `cli/tui/widgets.py`：按 card 类型渲染；
  - `src/session/events.py`：如果回放要重建 read/search 卡片，需要持久化 `meta`。
- **最小验收**：
  - 没有 `present_call` 的工具仍然用现有 fallback，不回归；
  - `bash` 声明 terminal card，pending/result 都能显示 command/cwd/output/exit；
  - `read` 声明 read card，回放时能从 session 重建行号/offset（如果做 meta）；
  - 工具名不再是 UI 的分支条件；
  - 呈现函数抛错不会影响工具结果（fallback 到原始 content）。

### 5.6 结构化错误码 / error info

- **上游依据**：dsh `ToolFailure { message, info? }` + `ToolErrorInfo`（`dsh:docs/subsystems/tools.md`）；pi 用 throw + `isError`（`pi:packages/coding-agent/docs/extensions.md`）。
- **前置依赖**：`ToolResult` 增加字段；工具用带 code 的异常类型。
- **改动面**：
  - `src/tools/executor.py`：`ToolResult` 加 `error: ToolError | None`（message + code + 可选 name）；
  - `src/session/events.py`：`ToolResultEvent.error` 真正填上（现在有字段但没传）；
  - `cli/observe.py`：错误卡片可以显示 code；
  - 现有 `WorkspaceError` 已经有 code（`wo-agent:src/workspace/errors.py`），可以复用。
- **最小验收**：
  - 未知工具、参数错误、守卫拒绝、工具抛错各有稳定 code；
  - session 日志能读到 code；
  - 模型可见文本仍然可读（不必暴露内部 code，或按需暴露）。

### 5.7 post-execute 缝 + `additionalContexts`

- **上游依据**：dsh `tools/post-execute` + `PostToolDecision`（`dsh:docs/subsystems/tools.md`）；`repeat-tool-reminder` 是现成例子（`dsh:packages/guard/repeat-tool-reminder/README.md`）。
- **前置依赖**：执行结果已经规范化；循环能把附加上下文写成一条 sourced user message。
- **改动面**：
  - `src/tools/executor.py`：执行后跑一组 post-execute listener，支持 accept/block/replace/context；
  - `src/agent/loop.py`：把 `additionalContexts` 在 tool result 之后落成消息；
  - `src/tools/definition.py`：可选 `finalize_content`（如果要做工具自有的内容上限）。
- **最小验收**：
  - listener 可以把成功结果 block 成 `is_error`；
  - listener 可以替换 content 而不改 is_error；
  - 附加上下文按顺序落在 tool result 之后；
  - listener 抛错不影响主结果。
- **备注**：这条对“模型行为治理”有价值，但对个人机器的安全不是刚需；如果只做一条，5.1 的收益更直接。

### 5.8 sandbox seam / escalation（只作为架构卡片，不建议直接搬）

- **上游依据**：dsh `ctx.sandbox`、`SandboxMode`、`ConfinedArgv`、`approveEscalation`（`dsh:docs/subsystems/sandbox.md`，`dsh:packages/sandbox/sandbox/src/escalation.ts`）。
- **前置依赖**：平台后端（Linux bwrap/Landlock、macOS Seatbelt、Windows ACL restricted token）、argv 包装、denial 方言、enforcement 事实、fail-closed 策略。
- **改动面**：新增 `src/sandbox/` 或 `src/workspace/sandbox.py`；`LocalBashRunner` 改成“先 confine 再 spawn”；二进制/平台探测；测试矩阵。
- **最小验收（如果做）**：
  - 无可用 backend 时抛错，不静默无约束运行；
  - `read-only` 拒绝写、`workspace-write` 只允许根内写；
  - denial 与 runner failure 能区分；
  - Windows 上明确报告 `partial`。
- **研究观察**：在 wo-agent 的定位（可控 Python 内核 + 极窄宿主）下，这更像“参考卡片”而不是第一轮移植项；如果目标只是本机 bash 的个人使用，审批 + 凭据清洗的性价比更高。

### 5.9 permission presets（只作为架构卡片）

- **上游依据**：dsh `PresetSpec` + `PermissionPresetService`（`dsh:docs/subsystems/permission-presets.md`）。
- **前置依赖**：sandbox mode 与 approval policy 两个独立旋钮；客户端 selector；按 session 的持久化。
- **改动面**：新增服务 + 设置命名空间 + `/permission` 命令；没有 sandbox 时只能打包 approval，价值有限。
- **最小验收（如果做）**：切换 preset 只写两个 knob；`custom` 是派生状态；replay 能重建选择。
- **研究观察**：wo-agent 目前没有 sandbox，preset 只能打包 approval，收益不足以支撑一个服务；更适合放在“学 dsh 架构”的卡片里。

---

## 6. 留给 HITL 票的问题

1. wo-agent 的 approval 通道由谁提供：CLI 自带 confirm，还是宿主注入？无 UI 时默认 deny 还是允许？
2. 审批范围：所有 bash、仅危险模式、所有写操作，还是仅在无人值守/不可信仓库时启用？
3. 是否接受协作式超时（工具不响应就停不下来），还是只为进程工具保留硬超时？
4. 并发调度做到哪一层：只做“默认串行 + 显式 safe 才并行”，还是完整 exclusive barrier + 滚动池？
5. canonical output 是否引入 JSON Schema 依赖，还是手写受支持子集？
6. presentation 是否进入核心，还是继续留在 CLI 宿主；如果进入核心，回放需要持久化多少 meta？
7. sandbox 只做架构卡片，还是选定一个平台（Windows ACL / Docker）做最小验证？
8. 凭据清洗是否作为独立机制先于审批落地（它不需要 UI，收益直接）？
