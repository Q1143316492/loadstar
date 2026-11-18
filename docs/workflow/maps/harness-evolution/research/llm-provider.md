# LLM 接入层研究：dsh、pi-agent 与 wo-agent

> 票：[03-research-llm-provider-layer.md](../tickets/03-research-llm-provider-layer.md)
> 地图：[map.md](../map.md)
>
> 本文只记录事实与可选方案，不做取舍；取舍留给后续 HITL 票。

## 0. 范围与路径约定

- 参考实现一：dsh，`d:\Unity\Src\DSH\deepseek-harness` @ `0a53fb55be`。
- 参考实现二：pi-agent，`d:\Unity\Src\DSH\pi-agent` @ `853a80d26`。
- 被规划系统：wo-agent，`d:\Unity\Src\DSH\wo-agent`。
- 路径均为各仓相对路径，仓名用 `dsh:` / `pi:` / `wo-agent:` 前缀区分。
- 票中提到的「`docs/subsystems/core.md` 里 usage 相关部分」在核对的 commit 上并不存在独立 usage 段落：`core.md` 只在 `AgentOptions.maxTokens` 一带提到 token。usage 的权威描述实际落在 `dsh:docs/subsystems/session.md`、`dsh:docs/subsystems/llm-streaming.md` 与 `dsh:docs/subsystems/token-meter.md`，本文按后三处取证。

## 1. 三层对照速览

| 维度 | pi-agent | dsh | wo-agent 现状 |
|---|---|---|---|
| 接入单元 | `Provider`（身份、目录、auth、stream） + `Api`（线协议） + `Models`（集合与分发）。`pi:packages/ai/src/models.ts`、`pi:packages/ai/src/types.ts` | Cordis seam：`ctx.llm` 是 Service Definition，provider adapter 是实现，agent loop / compaction 是 Consumer。`dsh:docs/architecture.md`、`dsh:docs/capability-seams.md` | `LLMProvider` Protocol + 一个 `DeepSeekProvider` 实例，由宿主直接注入循环。`wo-agent:src/llm/protocol.py`、`wo-agent:src/agent/loop.py` |
| 路由键 | 请求携带 `Model` 对象；`Model.provider` 选 Provider，`Model.api` 选 API 实现。`pi:packages/ai/src/models.ts` | 请求携带 `provider` 字符串；`LlmRuntime.registerAdapter(providers, adapter)` 注册路由。`dsh:docs/subsystems/llm-streaming.md` | 请求携带 `provider` 字符串，但循环只持有一个 provider 实例，字符串未用于选路。`wo-agent:src/llm/protocol.py`、`wo-agent:src/agent/loop.py` |
| auth | `ProviderAuth`（`apiKey` / `oauth`），`Models.applyAuth()` 在请求前解析；`CredentialStore` 持久化。`pi:packages/ai/src/auth/types.ts`、`pi:packages/ai/src/models.ts` | `ctx.credentials` seam：配置只存引用，adapter 每次请求重新解析。`dsh:docs/subsystems/credentials.md`、`dsh:docs/subsystems/llm-streaming.md` | `DeepSeekConfig.api_key` 在构造时传入，之后不变。`wo-agent:src/llm/deepseek.py` |
| 失败传递 | stream 内 `error` 事件 + 最终 `AssistantMessage.stopReason` / `errorMessage`，不抛出请求期失败。`pi:packages/ai/src/types.ts`、`pi:packages/ai/README.md` | 终止 `finish` 分片携带 `LlmFailure {message, code, status?, providerRetryAfterMs?}`；也允许 adapter 抛出，由 `LlmRuntime.stream()` 归一化。`dsh:docs/subsystems/llm-streaming.md` | 终止 `finish` 分片携带 `LlmFailure`；协议要求 provider 绝不在流上抛异常。`wo-agent:src/llm/protocol.py`、`wo-agent:src/llm/types.py` |
| 重试 | 两层：API 内 `retryProviderRequest`（按 HTTP status / `x-should-retry` / `retry-after`）；上层 `retry.ts`（正则错误分类 + 指数退避）。`pi:packages/ai/src/utils/provider-retry.ts`、`pi:packages/ai/src/utils/retry.ts` | provider 声明 `RetryPolicy`，`dsh-llm-retry` 在 `agent/request-error` 的 durable step 边界执行；adapter 单次调用只算一次 provider attempt。`dsh:packages/llm/llm-retry/README.md`、`dsh:packages/llm/llm/src/retry-policy.ts` | 循环内 `is_retryable(code)` + `max_retries` + 线性 `retry_backoff_s`，同一步重发。`wo-agent:src/agent/loop.py`、`wo-agent:src/llm/errors.py` |
| usage | `AssistantMessage.usage` 含 disjoint 计数、`totalTokens` 与 `cost`；成本按 `Model.cost` 计算。`pi:packages/ai/src/types.ts`、`pi:packages/ai/src/models.ts` | `usage` 分片 + 会话日志；`dsh-token-meter` 从 durable log 重放计价，provider usage 仅在 canonical envelope 匹配时作锚点。`dsh:docs/subsystems/token-meter.md` | `TokenUsage` 已随 `assistant/message` 落日志，但没有 meter；压缩用字符数代理。`wo-agent:src/session/events.py`、`wo-agent:src/compaction/engine.py` |
| 跨 provider 续聊 | `transformMessages()` 按 `provider/api/model` 是否相同做 thinking / tool-call / image 变换。`pi:packages/ai/src/api/transform-messages.ts` | replay state 只在同一 adapter 实例同时拥有历史与目标路由时传递；否则退化为 provider-neutral 转换。`dsh:docs/subsystems/llm-streaming.md` | 单 provider，无此路径。`wo-agent:src/llm/deepseek.py` |

## 2. pi-agent 的 LLM 层

### 2.1 Provider / Api / Models 三层职责

- **Provider** 是运行时单元：`id`、`name`、`baseUrl`、`headers`、`auth`、`getModels()`、可选 `refreshModels()` / `filterModels()`、`stream()` / `streamSimple()`。每个 provider 都必须有 auth 语义，即使是无需 key 的本地服务。`pi:packages/ai/src/models.ts`
- **Api** 是线协议实现：每个模块导出 `stream` 与 `streamSimple`，按 API 提供具体 options 类型；已知 API 由 `KnownApi` / `ApiOptionsMap` 枚举，自定义 API 用字符串回退到通用 options。`pi:packages/ai/src/types.ts`、`pi:packages/ai/src/index.ts`
- **Models** 是 provider 集合与分发器：`setProvider()` 按 `provider.id` upsert（同 id 替换），`stream()` 先 `applyAuth()` 再委托给 `provider.stream()`；`getModels()` / `getModel()` 是同步读取最后已知目录。`pi:packages/ai/src/models.ts`
- Provider factory 把三者焊在一起：`createProvider({ id, auth, models, api })`；`api` 可以是单个 `ProviderStreams`，也可以是按 `model.api` 分发的 map（mixed-API provider）。`pi:packages/ai/src/models.ts`
- 内置 provider 是独立 subpath factory，每个只 import 自己的 catalog 与 lazy API wrapper；`providers/all.ts` 才是全量入口。`pi:packages/ai/README.md`、`pi:packages/ai/src/providers/all.ts`
- 静态目录与动态目录分离：静态 provider 的 `refresh()` 是 no-op；动态 provider 通过 `fetchModels` 刷新，`getModels()` 仍同步返回最后已知列表。`pi:packages/ai/README.md`、`pi:packages/ai/src/models.ts`

### 2.2 auth 解析与 credential store

- `ProviderAuth` 至少要有 `apiKey` 或 `oauth` 之一。`ApiKeyAuth` 提供 `resolve()`、可选 `check()` 与 `login()`；`OAuthAuth` 提供 `login()`、`refresh()`、`toAuth()`。`pi:packages/ai/src/auth/types.ts`
- 解析顺序：显式 per-request `apiKey` 优先；否则读 `CredentialStore`；存储的 credential 拥有该 provider，只有没有存储值时才查环境变量；刷新失败不回退到 env。`pi:packages/ai/src/auth/resolve.ts`、`pi:packages/ai/README.md`
- `CredentialStore` 契约：`read(providerId)`、`list()`（只返回非密元数据）、`modify(providerId, fn)`（唯一写路径，串行化 read-modify-write）、`delete()`。OAuth refresh 在 `modify` 内执行，避免并发双刷。默认实现是内存版，应用注入持久化实现。`pi:packages/ai/src/auth/credential-store.ts`、`pi:packages/ai/src/auth/types.ts`
- `Models.getAuth()` / `checkAuth()` / `getAvailable()` 可在不发请求的情况下解析或检查 auth；`getAuth()` 对未配置 provider 返回 `undefined`，真正损坏时抛 `ModelsError`。`pi:packages/ai/src/models.ts`
- `transformHeaders` 属于 `Models` 而非 `Provider`：顺序是 provider auth headers -> `model.headers` -> 显式 `options.headers` -> `transformHeaders` -> `Provider.stream*()`。`pi:packages/ai/README.md`、`pi:packages/ai/src/models.ts`

### 2.3 `stream()` 失败不抛错、写进 `stopReason`

- `StreamFunction` 契约明确：一旦调用，request/model/runtime 失败应编码在返回的 stream 里，而不是抛出；错误终止必须产生 `stopReason` 为 `"error"` 或 `"aborted"` 的 `AssistantMessage`，并带 `errorMessage`，通过 `error` 事件发出。`pi:packages/ai/src/types.ts`
- 终止事件只有两种：`done`（成功，reason 为 `stop` / `length` / `toolUse` / `deferred`）或 `error`（reason 为 `error` / `aborted`，携带最终 message）。`pi:packages/ai/src/types.ts`
- 失败 message 保留已收到的 partial content 与 partial usage；abort 后可以把 partial message 放回 context 继续。`pi:packages/ai/README.md`
- auth 失败、未知 provider、lazy API 加载失败也走同一路径：`lazyStream()` 把 setup rejection 转成 `error` 事件与 error message，而不是让调用方 catch。`pi:packages/ai/src/api/lazy.ts`
- `StopReason` 的完整集合是 `pending | stop | length | toolUse | error | aborted | deferred`；`pending` 只出现在 partial message。`pi:packages/ai/src/types.ts`
- Provider 返回的 `finish_reason` 映射到 `stopReason`：`stop` -> `stop`，`length` -> `length`，`tool_calls` -> `toolUse`，`content_filter` / `network_error` / 未知值 -> `error` 并写 `errorMessage`。`pi:packages/ai/src/api/openai-completions.ts`

### 2.4 跨 provider 续聊时的消息变换

`transformMessages(messages, model, normalizeToolCallId?)` 在 API 序列化前统一处理历史。`pi:packages/ai/src/api/transform-messages.ts`

- `user` 消息原样通过。
- `assistant` 消息先比较 `provider` / `api` / `model` 是否与目标模型完全一致：
  - 同一模型：保留带 signature 的 thinking block（即使文本为空），保留 text / toolCall。
  - 不同模型：thinking block 转为普通 text；redacted thinking 直接丢弃；`thoughtSignature` 删除。
- tool call ID 可通过注入的 `normalizeToolCallId()` 归一化，并同步改写后续 toolResult 的 `toolCallId`。
- 非 vision 模型：user 与 toolResult 中的 image block 替换为占位文本；连续图片只保留一个占位。
- `stopReason` 为 `error` / `aborted` 的 assistant 消息整条跳过，不进入重放历史。
- 第二轮补齐孤立 tool call：为没有对应 toolResult 的 call 合成 `isError: true` 的 `"No result provided"` 结果；会话结束时也补一次。
- README 的对外描述与源码一致：同 provider/API 的 assistant 原样保留；不同 provider 的 thinking 转成 `<thinking>` 标签文本；text、tool call、tool result 保留。`pi:packages/ai/README.md`

### 2.5 usage 与成本

- `Usage` 字段：`input`、`output`、`cacheRead`、`cacheWrite`、可选 `cacheWrite1h`、可选 `reasoning`（是 `output` 的子集）、`totalTokens`、`cost`。`pi:packages/ai/src/types.ts`
- `calculateCost()` 用 `Model.cost` 的每百万 token 单价与可选 tier 计算 `usage.cost`；所以成本精度依赖模型目录里的定价数据。`pi:packages/ai/src/models.ts`
- OpenAI-compatible 的 usage 映射做 disjoint 处理：`input = prompt_tokens - cacheRead - cacheWrite`；`output` 已包含 reasoning。`pi:packages/ai/src/api/openai-completions.ts`
- 失败或 abort 的 message 仍可能带 partial usage；README 明确这一点。`pi:packages/ai/README.md`

### 2.6 错误分类与重试（补充事实）

- API 层 `retryProviderRequest()` 的分类依据是 HTTP status 与响应头：`x-should-retry: true/false` 优先；无 status 视为可重试；`408/409/429/5xx` 可重试；`retry-after-ms` / `retry-after` 可覆盖本地退避，超过 `maxRetryDelayMs`（默认 60s）则直接失败。`pi:packages/ai/src/utils/provider-retry.ts`
- 上层 `retry.ts` 另有一套基于错误文本正则的分类：区分不可重试的 quota/billing 文本与可重试的 overloaded / rate limit / 5xx / transport / premature stream 文本；策略是有限次数 + 指数退避 + jitter。`pi:packages/ai/src/utils/retry.ts`
- 两套分类并存：一套在 API 实现内部，一套在调用方重试循环里。`pi:packages/ai/src/api/openai-completions.ts`、`pi:packages/ai/src/utils/retry.ts`

## 3. dsh 的 LLM 层

### 3.1 `ctx.llm` seam 的三角色

- dsh 对 seam 的定义：Service Definition 声明接口并拥有 `ctx.<key>`，一个或多个 Service Provider 实现，一个或多个 Consumer 注入使用；单一角色本身不是 seam。`dsh:docs/architecture.md`、`dsh:docs/glossary.md`
- `ctx.llm` 的三角色：Service Definition 是 `llm` 包（`LlmRuntime`），Provider 是 `llm-deepseek` / `llm-pi-ai` / `llm-replay`，Consumer 是 `agent-loop` / `compaction-basic`。`dsh:docs/capability-seams.md`
- `LlmRuntime` 提供：`registerAdapter(providers, adapter)`、`listProviders()`、`registerConfigurableProviders()`、`discoverModels()`、`providerRetryPolicy()`、`imageRequestPricing()`、`listModels()`、`resolveModelInfo()`、`resolveCallConfig()`、`prepareCall()`、`stream()`。`dsh:docs/subsystems/llm-streaming.md`
- `llm/stream` 是 waterfall：listener 可以在 adapter 查找前短路，或改写一次性请求；loop-built 请求 deep-frozen，listener 只读。`dsh:docs/subsystems/llm-streaming.md`
- 注册冲突是全有或全无：同一 provider route 重复注册抛 `DUPLICATE_ADAPTER`；`replace()` 原子替换路由。`dsh:packages/llm/llm/README.md`、`dsh:docs/subsystems/llm-streaming.md`
- 模型目录是 advisory，不是请求白名单；adapter 仍可接受未列出的 model id。`dsh:docs/subsystems/llm-streaming.md`

### 3.2 模型请求与流式分片的线格式

- 一次调用是完整组装后的 `GenerateOptions`：`provider`、`model`、`reasoningEffort?`、`messages`、`system?`、`tools?`、`temperature?`、`maxTokens?`、`stop?`、`signal?`、`sessionId?`、`purpose?`。`dsh:docs/subsystems/llm-streaming.md`
- `system` 是单独的文本槽，adapter 映射到 provider 的 system slot；`messages` 是 provider 实际看到的有序历史。`dsh:docs/subsystems/llm-streaming.md`
- `StreamChunk` 是封闭判别联合：`block-start`、`text-delta`、`reasoning-delta`、`tool-call-delta`、`block-end`、`usage`、`finish`。`index` 关联交错的 delta；`block-end` 直接携带组装好的 `ContentBlock`。`dsh:docs/subsystems/llm-streaming.md`
- adapter 契约包括：`usage` 在 `finish` 之前，`finish` 之后无内容；tool-call arguments 全程是原始 JSON 字符串；失败可抛异常或以 `finish {kind:'error'|'aborted', failure}` 结束，二者都归一化成 `LlmFailure`；一次 adapter 调用只算一次 provider attempt；流空闲有 `streamIdleTimeoutMs`；空完成映射为 `EMPTY_RESPONSE`。`dsh:docs/subsystems/llm-streaming.md`
- DeepSeek 适配器的实际翻译与 wo-agent 高度相似：`block-end` / `usage` / `finish` 延迟到 `[DONE]`，DeepSeek 的 `prompt_tokens` 含缓存命中所以要减出 disjoint 计数，空 stop 变 `EMPTY_RESPONSE`，SSE 提前结束抛 `STREAM_CLOSED`。`dsh:packages/llm/llm-deepseek/src/translate.ts`、`dsh:packages/llm/llm-deepseek/src/sse.ts`

### 3.3 tool schema 如何随请求组装

- `ToolSchema` 声明在 `llm` 包而不是 `tools` 包，因为它是 `GenerateOptions.tools` 的一部分；`tools` 包的 `ToolDefinition` 也 import 它。`dsh:docs/subsystems/llm-streaming.md`
- `tools` registry 的 `schemas()` 按显式 allowlist 投影：只保留 name / description / parameters，`output` / `execute` / `finalizeContent` / `timeoutMs` / `isConcurrencySafe` / presenter 字段不得进入模型请求。`dsh:docs/subsystems/tools.md`
- system prompt 组装会收集 tool-schema provider 的 `ToolProviderResult.schemas`，按 canonical ordering 排序；`request/header` 记录渲染后的 prompt 与权威返回的 tool order（`toolOrder` 配置，未设置时按字典序）。`dsh:docs/subsystems/system-prompt.md`、`dsh:docs/subsystems/llm-streaming.md`、`dsh:docs/subsystems/session.md`
- loop 从 logged header 构建请求，不按每次调用临时接受这些配置。`dsh:docs/subsystems/llm-streaming.md`

### 3.4 usage 计量落在哪

- `TokenUsage` 计数是 DISJOINT：`inputTokens` 只含未缓存输入；缓存读写独立；计费输入是三者之和；`reasoningTokens` 是 `outputTokens` 的子集，不能再加一次。`dsh:docs/subsystems/llm-streaming.md`
- usage 作为 `usage` 分片在终止 `finish` 之前发出。`dsh:docs/subsystems/llm-streaming.md`
- 会话日志同时保留原始 `assistant/chunk` 与组装后的 `assistant/message`；`assistant/message` 可带 step usage。token 计量读取 per-step 的 `assistant/chunk { type: 'usage' }`，在没有 usage chunk 时才用 `assistant/message.usage` 作为 committed-step fallback；失败 attempt 没有 assistant message，其 usage chunk 就是 durable accounting record。`dsh:docs/subsystems/session.md`
- `dsh-token-meter` 是独立 service：每个会话从 durable log 折叠出一份 replay state，`measure(session, requestHeader?)` 返回 `totalTokens`、`surfaceTokens`、`nodes` 等；provider usage 只在 canonical request envelope 完全匹配且总量不低于路由定价锚点时复用，否则用固定启发式（4 字符/token 加结构与角色开销）。`dsh:docs/subsystems/token-meter.md`、`dsh:packages/llm/token-meter/README.md`
- compaction 读取 `measure()`，而不是自己估算；token-meter 还注册 `tokenUsage`、`contextPressure`、`contextBreakdown` 三个 session projection 供 UI/压缩消费。`dsh:packages/llm/token-meter/README.md`
- 模型容量由拥有该路由的 adapter 提供：`resolveModelInfo().context`，token-meter 不自己猜。`dsh:packages/llm/token-meter/README.md`

### 3.5 注册表与能力协商

- `LlmAdapter` 的必选方法只有 `stream()`；可选 `providerInfo()`、`providerRetryPolicy()`、`imageRequestPricing()`、`listModels()`、`resolveModel()`、`prepareCall()`。`dsh:docs/subsystems/llm-streaming.md`
- `resolveModel(provider, model)` 返回确切模型身份，以及可选 `context`、`defaultMaxTokens`、`reasoning.efforts` / `defaultEffort`、`inputModalities`。`dsh:docs/subsystems/llm-streaming.md`
- 不支持显式 `reasoningEffort` 时在 provider I/O 之前拒绝，不做 clamp 或 alias；`maxTokens` 缺失时才 materialize adapter 默认值。`dsh:docs/subsystems/llm-streaming.md`
- `prepareCall()` 把配置、context 元数据、retry policy 与同一个 adapter registration 绑定，避免 HMR / 动态配置在解析与分发之间换掉 adapter。`dsh:docs/subsystems/llm-streaming.md`
- configurable provider directory 让配置界面在路由尚未注册时也能展示 dormant provider；模型发现 `discoverModels()` 用一次性凭据 interrogate 端点，不读不写 settings/credentials。`dsh:docs/subsystems/llm-streaming.md`

### 3.6 认证

- `ctx.credentials` 的配置只存引用（POSIX 风格环境变量名），provider 拥有值，consumer 每次操作重新 resolve；LLM adapter 每次模型请求解析一次，所以轮换凭据下一次请求生效。`dsh:docs/subsystems/credentials.md`
- 空存储值在所有 provider 中视为缺失。`dsh:docs/subsystems/credentials.md`
- adapter 层有 `MISSING_CREDENTIAL` 与 `INVALID_CREDENTIAL` 两个稳定码；后者用于“提供了但格式不可用”，前者用于“哪里都没有”。`dsh:packages/llm/llm/README.md`、`dsh:packages/llm/llm/src/error.ts`
- `normalizeApiKey()` 只接受可打印 ASCII、排除空格，并在使用前 trim；这是 transport invariant，不是某个 provider 的策略。`dsh:packages/llm/llm/src/api-key.ts`

### 3.7 重试边界

- adapter 的 `retryPolicy` 是 provider 拥有的配置，注册路由时解析成不可变 `ResolvedRetryPolicy`；默认 normal 模式 5 次重试，可重试码为 `EMPTY_RESPONSE`、`RATE_LIMIT`、`SERVER`、`TIMEOUT`、`TRANSPORT`，退避 500ms 到 10s、10% jitter。`dsh:packages/llm/llm/src/retry-policy.ts`、`dsh:packages/llm/llm-retry/README.md`
- 重试执行在 agent loop 的 `agent/request-error` waterfall，不在 `ctx.llm.stream()` 外层；原因是 raw stream 无法 durably 切分已经发出的 chunk，而 loop 可以在同一个 open turn 内重跑失败 step。`dsh:packages/llm/llm-retry/README.md`
- 每次重试调度先写 durable `llm/retry` 事件，再等待；`llm/retry-started` 在真正重试前写入；provider 的合法 `Retry-After` 可替换本地退避。`dsh:packages/llm/llm-retry/README.md`
- 直接调用 `ctx.llm.stream()` 的 consumer 仍是 single-attempt。`dsh:packages/llm/llm-retry/README.md`

### 3.8 replay state

- 成功 `finish` 可带 `ReplayEnvelope`：response 级 opaque 元数据 + 可选 per-block 元数据；assembly 丢弃 block 时同步丢弃对应位置条目，保证存储元数据与存储内容一致。`dsh:docs/subsystems/llm-streaming.md`
- 后续请求只有在历史 provider 与目标 provider 当前注册到同一个 adapter 实例时，`LlmRuntime` 才传递 replay state；其他 adapter 只收到 provider-neutral content，无法使用的存储状态降级为普通转换并记诊断，而不是让请求失败。`dsh:docs/subsystems/llm-streaming.md`

## 4. wo-agent 现状

### 4.1 `types.py`、`assembler.py`、`deepseek.py` 的分工

- `wo-agent:src/llm/types.py`：provider 中立词汇。内容块是类型化联合，tool call 本身是内容块；消息是不可变值，带稳定 `id` 与类型化 `source`；流分片是 `block-start` / `*-delta` / `block-end` / `usage` / `finish`；`finish` 是唯一终止，错误/中止也是 `finish`；`TokenUsage` 是 disjoint 计数。文件头注释明确吸收自 pi-ai 与 dsh 的设计，但不照搬类划分。`wo-agent:src/llm/types.py`
- `wo-agent:src/llm/protocol.py`：`LLMRequest` + `LLMProvider` Protocol。`LLMRequest` 含 `provider`、`model`、`messages`、`max_tokens`、`temperature`、`reasoning_effort`、`stop`、`tools`。协议要求 provider 绝不在流上抛异常，终止永远是 `finish`。
- `wo-agent:src/llm/assembler.py`：唯一共享的 `BlockAssembler`，把分片折成块、assistant 消息与 usage；容忍纯 delta 协议；`block-end` 首次关闭为准，之后同 index 的 delta 被忽略；`max-tokens` 时丢弃 tool-call 块。
- `wo-agent:src/llm/deepseek.py`：唯一知道 DeepSeek 特例的适配器。OpenAI-compatible `/chat/completions` SSE；延迟 `block-end`/`usage`/`finish` 到 `[DONE]`；回放 assistant 的 `reasoning_content`（空串也发）；图片输入剥成占位文本；`prompt_tokens` 减缓存得到 disjoint usage；空 stop 变 `EMPTY_RESPONSE`；`signal` 是协作式取消；失败也走 `finish`。
- `wo-agent:src/llm/errors.py`：稳定错误码 `AUTH`、`RATE_LIMIT`、`CONTEXT_WINDOW_EXCEEDED`、`QUOTA_EXCEEDED`、`EMPTY_RESPONSE`、`MALFORMED_RESPONSE`、`STREAM_CLOSED`、`ABORTED`；`RETRYABLE_CODES` 仅含后四个中的 `RATE_LIMIT` / `STREAM_CLOSED` / `EMPTY_RESPONSE` / `MALFORMED_RESPONSE`。
- `wo-agent:src/llm/registry.py`：薄 `ModelRegistry`，只有 `register()`、`get()`、`names()`，没有重复检查、路由元数据或生命周期。仓库内没有调用点；provider 由宿主构造后直接传给循环。`wo-agent:src/agent/loop.py`、`wo-agent:cli/boot.py`、`wo-agent:examples/demo_agent.py`
- `wo-agent:src/llm/__init__.py` 仍从 `.deepseek` re-export `DeepSeekProvider` / `DeepSeekConfig`；实际调用方直接 `from llm.deepseek import ...`。`wo-agent:cli/boot.py`、`wo-agent:examples/demo_agent.py`

### 4.2 shard 流协议与 `BlockAssembler`

- 分片集合与 dsh 同形：`BlockStart` / `TextDelta` / `ReasoningDelta` / `ToolCallDelta` / `BlockEnd` / `UsageChunk` / `FinishChunk`。`wo-agent:src/llm/types.py`
- `BlockAssembler.push()` 维护 `_partials` 与首次出现顺序；`blocks()` 按顺序组装；未用 `block-end` 关闭的未知块类型会抛 `ValueError`；`message()` 默认 `ModelSource()`。`wo-agent:src/llm/assembler.py`
- 与 dsh 的差异：wo-agent 没有 `interruptedBlocks()`（取消时安全收尾已流出的 text/reasoning），没有 `replayState`，`FinishReason` 是固定联合而非 merge-extensible map。`wo-agent:src/llm/assembler.py`、`wo-agent:src/llm/types.py`、`dsh:docs/subsystems/llm-streaming.md`
- 循环把每个原始分片写 `AssistantChunk` 落日志，同时喂给 assembler；流结束后读 `finish`、`usage`，把组装消息写 `AssistantMessageEvent`。`wo-agent:src/agent/loop.py`
- 压缩摘要器也直接 `provider.stream()` + `BlockAssembler`，不走 agent 循环。`wo-agent:src/compaction/summarizer.py`

### 4.3 重试判定 `is_retryable`

- `is_retryable(code)` 只看稳定 code 是否在 `RETRYABLE_CODES`；`AUTH` / `CONTEXT_WINDOW_EXCEEDED` / `QUOTA_EXCEEDED` / `ABORTED` 不在集合内。`wo-agent:src/llm/errors.py`
- 循环在同一步内重试：`attempts += 1`；`is_retryable(code)` 且 `attempts <= max_retries` 时按 `retry_backoff_s * attempts` 线性等待后重发；失败 attempt 不写 assistant/message。`wo-agent:src/agent/loop.py`
- `CONTEXT_WINDOW_EXCEEDED` 有一次特殊路径：若挂了 compaction，先做一次 overflow 压缩再重试；压缩结果为空则按普通错误返回。`wo-agent:src/agent/loop.py`
- `LlmFailure.provider_retry_after_ms` 字段存在并且会被 session 序列化，但循环没有读取它；`DeepSeekProvider.http_code()` 只按 HTTP status 映射，未解析响应体里的上下文窗口/额度文本。`wo-agent:src/llm/types.py`、`wo-agent:src/session/serialize.py`、`wo-agent:src/llm/deepseek.py`
- `http_code()` 的映射：401/403 -> `AUTH`，429 -> `RATE_LIMIT`，402/409 -> `QUOTA_EXCEEDED`，400 -> `CONTEXT_WINDOW_EXCEEDED`，其他 -> `"HTTP"`。`wo-agent:src/llm/deepseek.py`

### 4.4 注册、认证、计量缺口

- **注册**：`ModelRegistry` 存在但未被使用；没有 `NO_ADAPTER` 之类的未知 provider 错误；没有按名选 adapter 的运行时路径；`provider` 字符串目前只是随请求传递的元数据。`wo-agent:src/llm/registry.py`、`wo-agent:src/agent/loop.py`
- **认证**：`DeepSeekConfig` 在构造时接收 `api_key`，`stream()` 直接拼 `Authorization: Bearer ...`；没有 credential store、没有每次请求重新解析、没有 `MISSING_CREDENTIAL` / `INVALID_CREDENTIAL`。`wo-agent:src/llm/deepseek.py`、`wo-agent:src/llm/errors.py`
- **计量**：`TokenUsage` 已随 `assistant/message` 落日志，`session/serialize.py` 能往返；但 `Model` 元数据没有调用点，压缩层没有 token meter，`CompactionOptions` 用 `threshold_chars` / `retain_chars`，`message_chars()` 明确写「字符数代理 token 计量」。`wo-agent:src/session/events.py`、`wo-agent:src/compaction/engine.py`、`wo-agent:src/compaction/pairing.py`
- **能力协商**：`Model` dataclass 已有 `context_window`、`max_tokens`、`reasoning`、`input_modalities`，但没有 provider 查询或请求前校验；`reasoning_effort` 只进入 `LLMRequest` 与 `LlmCallConfig`，DeepSeek adapter 的 `_build_body()` 没有映射它。`wo-agent:src/llm/types.py`、`wo-agent:src/llm/deepseek.py`

### 4.5 上层调用点

- `ReactLoopAgent` 的 `AgentOptions` 有 `provider`、`model`、`max_tokens`、`temperature`、`max_retries`、`retry_backoff_s`；没有 per-route policy、context window 或模型能力对象。`wo-agent:src/agent/agent.py`
- 构造 `LLMRequest` 时 `provider=self._options.provider`、`model=self._options.model`，但实际调用的是注入的 `self._provider.stream()`。`wo-agent:src/agent/loop.py`
- `RequestHeaderEvent` 记录 `LlmCallConfig`，作为会话级事实；`LlmCallConfig` 含 `provider`、`model`、`max_tokens`、`temperature`、`reasoning_effort`、`stop`。`wo-agent:src/session/events.py`、`wo-agent:src/llm/types.py`
- `compose()` 只组装 `tools` / `skills` / `system_prompt` / `compaction` / `commands`，没有 `llm` 槽位；`ComposeContext` 不持有 provider。`wo-agent:src/compose/compose.py`

## 5. 候选接缝（逐条）

以下按依赖顺序排列，只列可选实现与验收方式；是否进入路线由后续 HITL 票决定。

### 5.1 Provider 注册表与路由选择

**上游事实**

- dsh：`ctx.llm.registerAdapter(providers, adapter)` 注册 route；重复 route 原子失败；`stream()` 按 `provider` 选 adapter；未知 provider 是 `NO_ADAPTER`。`dsh:docs/subsystems/llm-streaming.md`、`dsh:packages/llm/llm/README.md`
- pi：`Models.setProvider()` 按 `provider.id` upsert（同 id 替换）；`stream()` 按 `model.provider` 找 provider，再按 `model.api` 找 API 实现。`pi:packages/ai/src/models.ts`

**前置依赖**：一个可被 `compose()` 或宿主持有的运行时上下文；现有 `ModelRegistry` 可复用其形状。

**改动面**：`wo-agent:src/llm/registry.py`（重复检查、`get` 失败语义、路由元数据）、`wo-agent:src/compose/compose.py`（`ctx.llm` 槽位）、`wo-agent:src/agent/loop.py`（按 `options.provider` 解析）、`wo-agent:cli/boot.py` / `examples/`（注册代替直接注入）。

**最小验收**：两个 fake provider 按名选路；未知 provider 产生结构化 `NO_ADAPTER` 终止；重复注册失败且不破坏已有路由；现有单 provider 测试不改语义通过。

**可选形态**：A. 只做 name -> provider 映射，路由元数据最小；B. 加上 dsh 式的 provider route 描述（`providerInfo`）与注册 disposer。

### 5.2 Api 层抽象（wire protocol 与 provider 身份分离）

**上游事实**

- pi：`Api` 是线协议，`Provider` 是身份 + 目录 + auth；`createProvider({ api })` 可传单个实现或按 `model.api` 分发的 map；一个 API 可由多个 provider 共享（xAI、Groq、Cerebras、OpenRouter 等共用 `openai-completions`）。`pi:packages/ai/src/types.ts`、`pi:packages/ai/src/models.ts`、`pi:packages/ai/README.md`
- dsh：没有独立 `Api` 类型层，选择的是「adapter 按 provider route 注册」，`LlmAdapter.stream()` 是唯一必选方法；DeepSeek 有 direct 与 pi-ai 两个结构不同的 adapter。`dsh:docs/subsystems/llm-streaming.md`、`dsh:packages/llm/llm-deepseek/README.md`

**前置依赖**：5.1 的路由与 provider 身份。若只保留单 provider，可先不引入。

**改动面**：把 `wo-agent:src/llm/deepseek.py` 拆成「OpenAI-compatible SSE/序列化」与「DeepSeek provider 配置」两层，或在 `LLMProvider` 上增加 `api` 标识与请求转换钩子；测试继续用 `httpx.MockTransport`。

**最小验收**：同一 wire 实现服务两个 base_url/api_key 不同的 provider 配置；两个配置的请求体与鉴权头分别正确；DeepSeek 特例（reasoning_content、图片占位、usage 减缓存）仍在单一位置。

**可选形态**：A. 仅把 `DeepSeekProvider` 内部拆成 `_Translator` / `_build_body` 可复用模块；B. 引入显式 `Api` 注册表与 per-API options 类型。

### 5.3 Auth / 凭据解析

**上游事实**

- dsh：`ctx.credentials` 配置只存引用；adapter 每次请求解析；`MISSING_CREDENTIAL` / `INVALID_CREDENTIAL` 是稳定码；`normalizeApiKey()` 校验可打印 ASCII。`dsh:docs/subsystems/credentials.md`、`dsh:packages/llm/llm/src/api-key.ts`
- pi：`ProviderAuth` 持有 `apiKey` / `oauth`；`Models.applyAuth()` 合并显式值、存储 credential、ambient env；存储 credential 优先于 env；`CredentialStore.modify()` 是唯一写路径。`pi:packages/ai/src/auth/types.ts`、`pi:packages/ai/src/models.ts`、`pi:packages/ai/src/auth/resolve.ts`

**前置依赖**：5.1 的 provider 身份；若要做持久化，还需要一个宿主可注入的 store。

**改动面**：新增 `wo-agent:src/llm/auth.py`（`resolve()` Protocol，返回 key / headers / base_url 或失败码）；`DeepSeekConfig` 去掉「唯一 key 源」假设，改为接受 resolver 或 key + env 名；`cli/boot.py` 负责选择 env / 显式值；`errors.py` 增加 `MISSING_CREDENTIAL` / `INVALID_CREDENTIAL`（或等价命名）。

**最小验收**：无 key 时在发 HTTP 前产生 `MISSING_CREDENTIAL` 终止；非法 key 产生 `INVALID_CREDENTIAL`；显式请求值覆盖 env；key 不进入 session 日志或错误消息。

**可选形态**：A. 只做 env + 显式 override 的解析器；B. 加 dsh 式引用/每次请求解析；C. 加 pi 式 `CredentialStore` 与 `modify()` 串行化。

### 5.4 usage 计量

**上游事实**

- dsh：usage 分片在 finish 前；会话日志保留 `assistant/chunk` 与 `assistant/message.usage`；`dsh-token-meter` 从 durable log 折叠，`measure()` 返回 pressure 与 surface 价格，provider usage 仅在 canonical envelope 匹配时复用，否则 4 字符/token 启发式；compaction 读 `measure()`。`dsh:docs/subsystems/session.md`、`dsh:docs/subsystems/token-meter.md`
- pi：`Usage` 随 `AssistantMessage` 返回，含 disjoint 计数、`totalTokens`、`cost`；成本按模型目录单价计算。`pi:packages/ai/src/types.ts`、`pi:packages/ai/src/models.ts`

**前置依赖**：usage 已经落日志（wo-agent 已具备）；若要按模型窗口计价，需要 5.6 的 context window；若要复用 provider usage 作锚点，需要 canonical request envelope（`RequestHeaderEvent` 已记录 `LlmCallConfig`，但没有完整 messages/tools 的 canonical hash）。

**改动面**：新增 `wo-agent:src/llm/meter.py` 或独立 `src/meter/`；`CompactionOptions` 从字符阈值改为可注入的 measurement；`agent/loop.py` 在每步后推进 meter；`session/` 提供 fold 入口。

**最小验收**：同一日志 revision 上 `measure(session)` 结果确定；有匹配 usage 时 total 等于 provider 计数，无匹配时按启发式；压缩阈值可按 token 表达；空日志与缺 usage 的日志有明确返回值。

**可选形态**：A. 只做「最近一步 usage + 字符启发式」的轻量 meter；B. 做 dsh 式 replay fold 与 surface 节点定价；C. 做 pi 式 per-message usage + cost，不做全局 meter。

### 5.5 错误分类与重试策略

**上游事实**

- dsh：`LlmFailure` 稳定码 + `ResolvedRetryPolicy`；normal 默认 5 次、五类可重试码、指数退避 + jitter；重试在 `agent/request-error` 的 durable step 边界执行；`Retry-After` 可替换本地退避。`dsh:docs/subsystems/llm-streaming.md`、`dsh:packages/llm/llm/src/retry-policy.ts`、`dsh:packages/llm/llm-retry/README.md`
- pi：API 层按 status/header 分类，上层按错误文本正则分类；两层都独立存在。`pi:packages/ai/src/utils/provider-retry.ts`、`pi:packages/ai/src/utils/retry.ts`

**前置依赖**：5.1 的 route（若 policy 按 route 挂）；现有 `LlmFailure` 与 `finish` 终止已具备。

**改动面**：`wo-agent:src/llm/errors.py` 扩充 `SERVER` / `TIMEOUT` / `TRANSPORT` / `NO_ADAPTER` / `MISSING_CREDENTIAL` 等码；`wo-agent:src/llm/deepseek.py` 的 `http_code()` 与 SSE 异常路径改为结构化分类（例如 400 只在文本匹配 context overflow 时归 `CONTEXT_WINDOW_EXCEEDED`）；`AgentOptions` 或 registry 增加 per-route policy；`agent/loop.py` 读取 `provider_retry_after_ms` 与 policy。

**最小验收**：401/403 -> `AUTH` 不重试；429 -> `RATE_LIMIT` 可重试；5xx -> `SERVER` 可重试；超时 -> `TIMEOUT` 可重试；流提前结束 -> `STREAM_CLOSED` 可重试；普通 400 不再被误判为 context overflow；`Retry-After` 在 policy 上限内生效；失败 attempt 不写 assistant/message。

**可选形态**：A. 只扩充码表与 loop 的退避；B. 加 per-route `RetryPolicy` 与 `provider_retry_after_ms`；C. 加 dsh 式 durable `llm/retry` 事件与 `agent/request-error` 扩展点。

### 5.6 能力协商（模型元数据）

**上游事实**

- dsh：`resolveModel(provider, model)` 返回 `context`、`defaultMaxTokens`、`reasoning.efforts` / `defaultEffort`、`inputModalities`；显式 `reasoningEffort` 不支持时在 I/O 前拒绝；`resolveCallConfig()` materialize 默认值；`prepareCall()` 绑定同一 registration。`dsh:docs/subsystems/llm-streaming.md`
- pi：`Model` 自带 `reasoning`、`thinkingLevelMap`、`input`、`cost`、`contextWindow`、`maxTokens`、`compat`；`Model` 与 provider/API 一起构成请求的目标。`pi:packages/ai/src/types.ts`

**前置依赖**：5.1 的 provider 身份；若做请求前校验，还需要 5.3 的 auth 失败路径。

**改动面**：扩展 `wo-agent:src/llm/types.py` 的 `Model`（已有字段可复用）与新增 `resolve_model(provider, model)` 查询；`LLMProvider` 增加可选能力方法；`agent/loop.py` 在构造 `LLMRequest` 前校验 `reasoning_effort` / `max_tokens`；`DeepSeekProvider` 实现自己的 effort 集合与 context window。

**最小验收**：`resolve_model("deepseek", "deepseek-chat")` 返回 context window 与 max tokens；不支持的 `reasoning_effort` 在发请求前得到稳定错误；未列出的 model id 仍可透传；context window 可供 5.4 的 compaction 使用。

**可选形态**：A. 静态 `Model` 表 + provider 方法返回固定元数据；B. dsh 式异步 `resolveModel()` + `prepareCall()`；C. 只把 `Model` 作为配置对象，不做查询。

### 5.7 跨 provider 消息变换

**上游事实**

- pi：`transformMessages()` 对同一 `provider/api/model` 保留 thinking signature；跨模型把 thinking 转 text、丢弃 redacted thinking、删除 `thoughtSignature`、归一化 tool call ID、为非 vision 模型降级图片、跳过 error/aborted assistant、补齐孤立 tool result。`pi:packages/ai/src/api/transform-messages.ts`
- dsh：replay state 只在同一 adapter 实例拥有历史与目标路由时传递；其他 adapter 只拿 provider-neutral content，无法使用时降级并记诊断。`dsh:docs/subsystems/llm-streaming.md`

**前置依赖**：5.1 的多 provider 选路；`LLMMessage.source` 已带 `ModelSource(provider, model)`，但消息本身没有 `api` 字段。

**改动面**：新增 `wo-agent:src/llm/transform.py`，在 adapter 序列化前调用；`DeepSeekProvider._to_openai_dict()` 与未来的其他 adapter 不再各自处理跨 provider 历史；`ModelSource` 可能需要补 `api` 或从 provider 元数据推导。

**最小验收**：同一 session 从 provider A 切到 B 时，B 收到不含 A 的 thinking signature 的历史；thinking 变 text；孤立 tool call 得到合成结果；非 vision 模型收到图片占位；同一 provider/model 的历史原样保留。

**可选形态**：A. 只做 thinking 降级与孤立 tool result 补齐；B. 加 tool call ID 归一化与图片降级；C. 加 dsh 式 adapter-private replay state 与同实例限制。

## 6. 明确不搬的部分

| 部分 | 上游位置与规模 | 事实 | 与学习项目的关系 |
|---|---|---|---|
| 模型目录生成 | `pi:scripts/generate-models.ts`、`pi:scripts/generate-image-models.ts`、`pi:src/models.generated.ts`、`pi:src/providers/*.models.ts`（数十个）、`pi:src/providers/data/*.json`、`pi:src/model-catalog.ts` | README 的 Adding a New Provider 明确：模型目录由脚本从 models.dev 等来源生成，`*.models.ts` 是从 JSON 派生的稳定类型包装。`pi:packages/ai/README.md` | 这是构建期数据管线，不改变运行时接缝；wo-agent 已有手写 `Model` 与 DeepSeek 配置即可。 |
| 几十家 provider 的适配 | `pi:src/providers/all.ts` 导入 41 个 provider factory；`pi:src/api/` 有 11 个线协议/图片实现模块；依赖 `@anthropic-ai/sdk`、`openai`、`@google/genai`、AWS Bedrock SDK 等。`pi:package.json` | 每个 provider 还要处理目录、auth、compat、baseUrl 差异；`pi:packages/ai/README.md` 的 Supported Providers 列出全量。 | 超出「可控规模 Python 内核 + 极窄宿主」；wo-agent 运行时依赖目前只有 `httpx`。`wo-agent:pyproject.toml`、`wo-agent:CLAUDE.md` |
| OpenAI-compatible 兼容矩阵 | `pi:src/types.ts` 的 `OpenAICompletionsCompat` / `OpenAIResponsesCompat`（20+ flag） | 覆盖 `developer` role、`reasoning_effort`、`stream_options`、`max_completion_tokens`、thinking format、cache control、session affinity、OpenRouter/Vercel routing 等。`pi:packages/ai/README.md` | 只有 DeepSeek 特例与少量网关兼容需要关注；全矩阵是产品级 provider 适配成本。 |
| OAuth | `pi:src/auth/oauth/`、`pi:src/oauth.ts`、`pi:src/bun-oauth.ts`；`pi:packages/ai/README.md` 的 OAuth Providers；dsh `ctx.authorization` | 需要 login / refresh / device code / callback server / refresh lock；pi 的 `CredentialStore.modify()` 还要在支持跨进程锁的后端上避免双刷。`pi:packages/ai/src/auth/types.ts` | 学习项目用 API key 即可覆盖「凭据解析」接缝；OAuth 是独立的授权产品面。 |
| 环境凭据（AWS profile / ADC / Copilot） | `pi:src/providers/amazon-bedrock.ts`、`pi:src/providers/google-vertex.ts`；README 的 Environment Variables | Bedrock 解析 AWS profile / access key / ECS task role / web identity；Vertex 解析 gcloud ADC / service account。`pi:packages/ai/README.md` | 依赖云厂商凭据链，和 Python 学习内核无关。 |
| 图片与 Files API | `dsh:packages/llm/llm-deepseek/src/files-api.ts`、`file-store.ts`、`image-tokens.ts`、`request-pricing.ts`；`pi:src/providers/images/`、`src/images.ts` | 上传缓存、过期刷新、stale-file 恢复、quota 清理、base64 fallback、图片 token 计价。`dsh:packages/llm/llm-deepseek/README.md` | 文本 harness 不需要；wo-agent 当前把图片输入剥成占位文本。`wo-agent:src/llm/deepseek.py` |
| deferred responses | `pi:src/types.ts` 的 `DeferredHandle` / `fetchDeferred` / `cancelDeferred`；README 的 deferred 选项 | 异步长任务、provider handle、poll/cancel。`pi:packages/ai/README.md` | 独立的运行时形态，不是 LLM 接入层最小接缝。 |
| 成本计算与定价目录 | `pi:src/models.ts` 的 `calculateCost()`、`ModelCost` / `ModelCostTier`；`dsh:packages/llm/token-meter/src/route-pricing.ts` | pi 的 cost 依赖模型目录单价；dsh 的 route pricing 还处理图片投影。 | 若不做模型目录生成，成本只能手填；token 计量本身不依赖成本。 |
| Cordis 机制本身 | `dsh:docs/subsystems/llm-streaming.md` 的 `llm/stream` waterfall、`@Remote`、`registerConfigurableProviders`、`discoverModels`；`dsh:packages/llm/llm/src/index.ts` | dsh 的 seam 是 Cordis Service；注册、dispose、waterfall、Remote 都依赖框架。 | wo-agent 明确「不引入 Cordis / profile yaml」，只借概念。`wo-agent:CLAUDE.md`、`wo-agent:src/compose/compose.py` |
| token-meter 的完整 projection 面 | `dsh:packages/llm/token-meter/src/*.ts`、`dsh:docs/subsystems/token-meter.md` | 除 `measure()` 外还有 `tokenUsage` / `contextPressure` / `contextBreakdown` 三个 projection、shadow price、O(1) fold。 | 最小接缝只需要 `measure()`；projection 面服务 UI/压缩展示，可后置。 |

## 7. 需要后续 HITL 决策的问题

以下只列选项，不在本文选择：

1. **路由粒度**：只按 provider name 选单例，还是像 dsh/pi 一样让 `Model` / route 携带 api、base_url、model 三层信息？
2. **auth 起点**：先做 env + 显式 override 的解析器，还是一次到位做 credential store（含持久化与 `modify()` 串行化）？
3. **usage 计量形态**：轻量「最近 usage + 字符启发式」，dsh 式 replay fold，还是 pi 式 per-message usage + cost？
4. **重试位置**：继续在 agent loop 内重试，还是抽成 dsh 式 `agent/request-error` 扩展点 / 独立 retry 执行器？
5. **能力元数据来源**：手写静态 `Model` 表，还是 provider `resolve_model()` 动态返回？是否需要在请求前拒绝不支持的 `reasoning_effort`？
6. **跨 provider 变换范围**：只做 thinking 降级与孤立 tool result，还是包含 tool call ID 归一化、图片降级与 adapter-private replay state？
7. **Api 层抽象时机**：单 provider 阶段是否就拆 wire 实现与 provider 身份，还是等第二个 provider 出现再拆？

## 8. 来源索引

**wo-agent**

- `wo-agent:CLAUDE.md`
- `wo-agent:src/llm/types.py`
- `wo-agent:src/llm/protocol.py`
- `wo-agent:src/llm/assembler.py`
- `wo-agent:src/llm/deepseek.py`
- `wo-agent:src/llm/errors.py`
- `wo-agent:src/llm/registry.py`
- `wo-agent:src/llm/__init__.py`
- `wo-agent:src/agent/loop.py`
- `wo-agent:src/agent/agent.py`
- `wo-agent:src/session/events.py`
- `wo-agent:src/session/serialize.py`
- `wo-agent:src/compaction/engine.py`
- `wo-agent:src/compaction/pairing.py`
- `wo-agent:src/compaction/summarizer.py`
- `wo-agent:src/compose/compose.py`
- `wo-agent:cli/boot.py`
- `wo-agent:examples/demo_agent.py`
- `wo-agent:pyproject.toml`
- `wo-agent:src/llm/tests/test_assembler.py`
- `wo-agent:src/llm/tests/test_deepseek.py`
- `wo-agent:src/llm/tests/test_errors.py`

**dsh**

- `dsh:docs/architecture.md`
- `dsh:docs/glossary.md`
- `dsh:docs/capability-seams.md`
- `dsh:docs/subsystems/llm-streaming.md`
- `dsh:docs/subsystems/session.md`
- `dsh:docs/subsystems/token-meter.md`
- `dsh:docs/subsystems/credentials.md`
- `dsh:docs/subsystems/tools.md`
- `dsh:docs/subsystems/system-prompt.md`
- `dsh:packages/llm/llm/README.md`
- `dsh:packages/llm/llm/src/types.ts`
- `dsh:packages/llm/llm/src/assembler.ts`
- `dsh:packages/llm/llm/src/error.ts`
- `dsh:packages/llm/llm/src/api-key.ts`
- `dsh:packages/llm/llm/src/retry-policy.ts`
- `dsh:packages/llm/llm-deepseek/README.md`
- `dsh:packages/llm/llm-deepseek/src/translate.ts`
- `dsh:packages/llm/llm-deepseek/src/sse.ts`
- `dsh:packages/llm/llm-retry/README.md`
- `dsh:packages/llm/token-meter/README.md`

**pi-agent**

- `pi:packages/ai/README.md`
- `pi:packages/ai/src/types.ts`
- `pi:packages/ai/src/models.ts`
- `pi:packages/ai/src/index.ts`
- `pi:packages/ai/src/auth/types.ts`
- `pi:packages/ai/src/auth/resolve.ts`
- `pi:packages/ai/src/auth/credential-store.ts`
- `pi:packages/ai/src/api/transform-messages.ts`
- `pi:packages/ai/src/api/openai-completions.ts`
- `pi:packages/ai/src/api/lazy.ts`
- `pi:packages/ai/src/utils/provider-retry.ts`
- `pi:packages/ai/src/utils/retry.ts`
- `pi:packages/ai/src/providers/all.ts`
- `pi:packages/ai/src/providers/deepseek.ts`
- `pi:packages/ai/src/models.generated.ts`
- `pi:Docs/source-reading.md`
