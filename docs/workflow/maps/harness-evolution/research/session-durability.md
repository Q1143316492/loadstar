# 会话与崩溃恢复：dsh、pi、wo-agent 对照

> 票：[02-research-session-durability.md](../tickets/02-research-session-durability.md)
> 地图：[map.md](../map.md)
> 结论视图：[session-durability 卡片](../../../../../reference/harness-architectures/session-durability.md)
>
> 只列事实与选项，不做取舍；排序与是否进入路线留给决策票。

## 来源与约定

路径前缀代表一个工作树，路径本身相对该工作树根：

- `dsh:` = `d:\Unity\Src\DSH\deepseek-harness` @ `0a53fb55be`
- `pi:` = `d:\Unity\Src\DSH\pi-agent` @ `853a80d26`
- `wo-agent:` = 本仓（调查时 HEAD `b9a96d6`）

本文的存放位置按票面指定：`docs/workflow/maps/harness-evolution/research/`。该目录此前不存在，随本文建立；它与其他地图产物（`map.md`、`tickets/`）同级，符合「研究产物与地图同仓」的既有做法。

一个必须先说明的事实：**pi 的 `harness.md` 是目标规格，不是当前源码的说明**。规格在 `pi:packages/agent/docs/harness.md`（2941 行），其中自述源码树里的 format-4 代码「unfinished and is replaced in place」（§1.7）。当前源码实现的是另一套「records + reducer」模型：`pi:packages/agent/src/harness/session/types.ts`（`OperationStartedRecord`、`StepAttemptRecord`、`ToolStartedRecord` 等）与 `pi:packages/agent/src/harness/reducer.ts`（按记录折叠出 lane 状态）。因此下文把「pi 规格的做法」与「pi 当前源码的做法」分开写；搬概念时两者可当作两种选项。

三句话的形状差异：

- dsh 恢复的是**历史**：把日志补到最后一个 balanced 边界，再用 `deriveMessages()` 重新派生；没有「崩溃时正在执行哪个 tool」的状态。
- pi 恢复的是**意图**：读一个 total 的 operation state（程序计数器），按 intent/settlement 的缺口决定重试、合成结果或标记 interrupted。
- wo-agent 目前保存的是**整本历史快照**：有事件溯源与 surface 投影，但落盘只发生在 turn 结束后的全量 `save`，没有请求前屏障、没有意图、没有可恢复的操作状态。

---

## 1. dsh 的形状

### 1.1 内存模型：日志是唯一事实源

- `Session` 是 `SessionEvent` 的 append-only 日志；`seq = log.length`，`time` 是 epoch ms。事件 envelope 是 `type` 上的判别联合，`data` 是每种事件的 payload，不是独立的 `type` / `data` 双联合（`dsh:docs/subsystems/session.md`，`dsh:packages/core/session/src/types.ts`）。
- 核心事件词汇 12 种：`turn/start`、`turn/end`、`step/start`、`step/end`、`user/message`、`assistant/chunk`、`assistant/message`、`tool/call`、`tool/result`、`request/header`、`request/context`、`session/end-seed`。`SessionEventMap` 可被插件用 declaration merging 扩展；`compaction/*` 就是这样加进来的（`dsh:docs/subsystems/session.md`）。
- 只有 `user/message`、`assistant/message`、`tool/result` 是 `SurfaceEventType`，必须带 `surfaceOp`；非 surface 事件不许带。`surfaceOp` 只有 `'append'` 与 `{ op: 'replace', start, end }` 两种；`replace` 的 `start` / `end` 是**当前表层节点的 seq**，要求 `sourceEventSeqs` 覆盖所有被遮蔽节点（`dsh:docs/subsystems/session.md#surface-types`）。
- `Session.surface` 是增量维护的只读投影：`nodes` 是当前模型可见顺序，`replaceGeneration` 每次替换递增。`foldSurface(events)` 可从日志完整重放，返回 `nodes` 和每次 replacement 实际遮蔽的 seq（`dsh:packages/core/session/src/surface.ts`，`dsh:docs/subsystems/session.md`）。
- `deriveMessages()` 规则：`user/message` → user；`assistant/message` → assistant（空内容跳过，只承载 max-tokens 的 usage）；`tool/result` → 带 tool-result 块的 user；`assistant/chunk` 不参与派生；其余结构事件不产生消息。投影结果缓存，每个 surface 节点只投影一次，`replace` 导致重建；返回的新数组共享深层冻结的消息对象（`dsh:docs/subsystems/session.md#derived-history`）。
- `request/header` 记录的是完整 `EpochHeader`：`config`、`adapterDefaults`、**渲染后的 `system` 提示词**、**组装后的 `tools` schema**。`reason` 为 `initial` / `resume` / `change` / `series`；`foldRequestHeader(events)` 取最新快照。`request/context` 单独记录 route 的 `contextWindow`，不参与 header 等值比较（`dsh:docs/subsystems/session.md#the-request-header-event-requestheader`）。
- `session/end-seed` 是构造器 seed 的边界：seed 事件 seq 更小；它是 `firstLiveSeq` 的持久化投影。seed 末尾已有该事件则不重复写。它让插件能区分「来自 seed 的未闭合 `compaction/start`」与「本生命周期正在进行的压缩」（`dsh:docs/subsystems/session.md#the-end-seed-boundary-sessionend-seed`）。
- `TurnEndReasonMap` 有 `completed` / `aborted` / `blocked` / `error` / `max-tokens` / `interrupted`；`interrupted` 是循环从不产生的唯一原因，由崩溃恢复合成（`dsh:docs/subsystems/session.md#why-a-turn-ended-turnendreasonmap`）。
- fork 是 `ctx.sessions.fork(source, boundary?, childSessionId?)`：取源日志的 inclusive prefix，要求 prefix 不结束在 open turn 内，然后创建 child session，seed 是 deep clone，header 带 `parentSession`、`seedLength`、继承的 `cwd`（`dsh:docs/subsystems/session.md#live-session-fork-api`）。

### 1.2 持久化：能力缝 + 批量写 + flush 检查点

- `SessionPersistence` 是能力缝：`locate` / `create` / `append` / `prepare` / `load` / `inspect` / `readFrom` / `list` / `listSnapshots`，全部建立在同一套 `SessionEvent` 上，不另造持久化事件类型（`dsh:docs/subsystems/persistence.md`）。
- 写入不是同步落盘：`session/event` 是同步通知，persistence 插件把事件复制进 per-session controller；第一个待写事件启动固定批量窗口，后来事件加入但不延长截止时间；`session/flush` 取消等待并排空到静止点。配置的上限只约束有意的批量等待，不约束事件循环调度或后端持久化延迟（`dsh:docs/subsystems/persistence.md#the-flush-checkpoint`，`dsh:packages/session/session-persistence/src/write-behind.ts`，默认 `DEFAULT_WRITE_BATCH_MAX_DELAY_MS = 200`）。
- `dsh-session-checkpoint-policy` 在三个语义点调用 `ctx.sessions.flush(session)`，并且是 fail-closed：
  - `llm/stream` 前：完整请求前缀未持久化就不向 adapter dispatch；
  - 顶层 `tools/execute` 前：记录在案的调用未持久化就不执行 tool body（嵌套 tool dispatch 复用外层）；
  - `agent/pre-step` 前：把上一步提交的内容落盘。
  （`dsh:packages/session/session-checkpoint-policy/src/index.ts`）
- JSONL 后端：每个 commit 追加逻辑行，默认用带 checksum 的 Zstandard frame 编码，也可配置为 raw lines；append 完成后才 resolve；首次创建用 temp-write + fsync + `link()` 发布（不是 `rename()`，以便并发创建时 `EEXIST` 而不是互相覆盖）；POSIX 上还会 fsync 目录。崩溃尾部有三种处理：完整的 torn tail 被截断，能从 torn frame 里恢复的完整事件保留，然后补合成 closers（`dsh:packages/session/session-persistence-jsonl/src/index.ts`）。
- SQLite 后端是 opt-in：同一 logical event stream 被压成 bounded 的 `text-chunks` / `reasoning-chunks` / `tool-call-chunks` 行，读时重建完整事件流；拒绝旧 schema 而不迁移（`dsh:docs/subsystems/persistence.md#the-backends`）。
- header 与日志分开：`version`、`id`、`createdAt`、`cwd`、`parentSession`、`seedLength`、`origin`、`delegationDepth`、`agentPreset` 存在 `SessionHeader`，不进 `SessionEventMap`，不进 `deriveMessages()`（`dsh:docs/subsystems/persistence.md#sessionheader--metadata-beside-the-log`）。
- 格式拒绝分两类：`SessionFormatUnsupportedError`（日志完好但本构建读不懂，例如 header version 更新或更旧、未知事件类型且未标 `ignorable: true`）与 `SessionPersistenceCorruptionError`（真的损坏）。JSONL 在读任何事件之前先看 header version，保证「未来格式」报「升级 harness」而不是「损坏」（`dsh:docs/subsystems/persistence.md#format-refusal--logs-a-build-cannot-faithfully-read`）。

### 1.3 崩溃恢复：关闭边界，不截断

- 冷加载发现 open `turn/start` 无 `turn/end` 时**不截断**：长任务的 turn 可能很大，崩溃前的事件已经持久化。恢复追加合成事件：
  - 对 `assistant/message` 里每个没有对应 `tool/result` 的 tool-call，先补错误结果；根据是否见过 `tool/call` 区分 `TOOL_OUTCOME_UNKNOWN` 与 `TOOL_NOT_STARTED`，错误文本明确要求模型「不要盲目重试」；
  - 再补 open `step/end`；
  - 最后补 `turn/end { reason: { kind: 'interrupted' } }`。
  - 合成事件的 seq 从最后事件 +1 开始，`time` 复用最后事件时间，保证确定性（`dsh:packages/core/session/src/repair.ts`，`dsh:docs/subsystems/persistence.md#crash-recovery-preserves-an-interrupted-turn`）。
- 恢复只应用于 cold session：live id 的 `load` 等到权威内存快照持久化且 balanced 才返回；open live turn 直接拒绝，不补合成边界。`inspect` 不提交恢复、不发布；`prepare` 才提交修复（`dsh:docs/subsystems/persistence.md`）。
- `readFrom(id, fromSeq)` 是给基于 watermark 的读模型用的物理后缀读，不做 torn-tail 处理、不补 synthetic closers；只返回有效连续前缀内的事件（`dsh:docs/subsystems/persistence.md`）。
- resume 的形状：`ctx.agents.resume({ resumeSessionId })` 只是加载一个 balanced session 再起一个新的 loop，`request/header` 以 `reason: 'resume'` 记录新的 loop 实例边界。dsh 没有「操作程序计数器」，不恢复「崩溃时正在进行的那个 tool/step」，只恢复历史（`dsh:docs/subsystems/core.md`，`dsh:packages/core/agent-loop/src/agent.ts`）。
- 会话投影缓存是可选的独立能力缝：`ctx.sessionProjections` 订阅一次 `session/event`，把每个 commit 喂给每个纯 `apply` 单元；`stateOf` 读单个 host state，`snapshot` 返回同一 `asOfSeq` 的 client 值；`sessionProjectionCache` 另外把 `(sessionId, key, ver, seq, val)` 持久化，`stateVersion` 不匹配就丢弃而不是前向 apply（`dsh:docs/subsystems/session-projection.md`）。

### 1.4 哪些部分与 Cordis / TypeScript 绑定

- 能力缝的注册与释放是 Cordis effect：service definition/provider/consumer、`ctx.inject`、fiber disposer、profile/bundle 组合、`ctx.sessionProjections` 的注册随插件卸载消失（`dsh:docs/architecture.md`，`dsh:docs/subsystems/session-projection.md`）。
- `SessionEventMap` 的扩展靠 TypeScript declaration merging；`append()` 对 `SurfaceEventType` 强制要求 `surfaceIntent`、对其他类型编译期拒绝，靠条件类型元组（`dsh:docs/subsystems/session.md`）。
- 运行时校验依赖 `isJsonValue`、Zod（projection `stateSchema` / `viewSchema`）、`structuredClone` 与 `deepFreeze`；持久化后端依赖 `node:fs` 的 `link`/`fsync`/`truncate` 与 `node:sqlite` / zstd 编解码。
- 概念上可 Python 化的是：事件词汇与 surface 折叠、log-only 边界事件、flush 检查点、repair closers、格式拒绝、header 分离、fork 的 seed 前缀。框架机制（effect、服务注册、声明合并、编译期约束、持久化投影缓存）不可直接搬。

---

## 2. pi 的形状

### 2.1 目标规格：三存储、事务、程序计数器

**三存储，一条不变量**：所有持久内容只能是

- `entries`：会话树，write-once、append-only；
- `registers`：当前可变状态，namespace + key 的 typed cell，覆盖或删除；
- `usage ledger`：append-only 的 token/cost 行。

没有第四处。尚未进入树的内容（排队输入、延迟写）放在 `pending.entry` register，在 placement 事务里变成 entry（`pi:packages/agent/docs/harness.md` §0.3、§1.1、§2.2）。

**事务**：一个 transaction 是若干 entry insert、usage insert、register set/delete 的集合，all-or-none；写入按顺序获得严格递增的 `seq`，允许跳号；同一 session 的 transaction 串行，只有一个 writer（§1.4）。未提交的失败 commit 会让整个 harness fault，不允许部分应用的 transaction（§1.4、§4.8）。

**entry tree**：entry 是不可变的完整行，含 `id`、`parentId`、`seq`、`timestamp`、`type`、payload；`type` 有 `message` / `compaction` / `branch_summary` / `custom`。context 从 lane 的 leaf 沿 parent 回溯，默认 newest-first，遇到 compaction 就停止；compaction entry 自带 `summary` 与完整 `retainedTail`，「Context never reads past a compaction」，因此压缩是自包含 checkpoint，不是指向历史的指针（§2.1、§2.5）。

**lanes**：命名游标，每个 session 有 `main`。一个 lane 由 `lane.leaf`、`lane.config`、`lane.state` 三个 register 组成，第一次操作结束后再加 `lane.lastResult`。lane 建在某 entry 上时不复制任何树内容；两个 lane 在同一 leaf 上分叉。lane 永不删除或改名（§2.3）。

**operation**：一次被接受的 lane 工作（run / compaction / navigation）。`op.meta` 记录身份、intent、起点，写一次不覆盖；`op.state/{operationId}` 是**当前程序计数器**，每次转换覆盖为完整的 `OperationState`（不是 delta，不依赖前一状态）。大 payload 放在兄弟 register：`op.tool_args`、`op.preparation`。operation 结束由 terminal transaction 删除所有 `op.*` 并把结果写进 `lane.lastResult`；没有 `finished` 状态，结束后 operation 不存在（§0.3、§3.1、§3.2、§3.13）。

`OperationState` 的 phase 包括 `checkpoint`、`assistant`（`ready` / `effect_pending` / `retry_wait`）、`tools`（每个 call 的 `planned` / `effect_pending` / `completed`）、`compaction`、`deferred`、`failure_drain`；`control` 独立于 phase，承载 `running` 与 `cancel_requested`（§3.2、§3.5）。

**effect sandwich**：每次 provider 请求和真实 tool 调用被两次 commit 夹住：

1. intent：「即将做 X；输出会使用 id R 和 usage id U」；
2. 执行 X（不确定窗口）；
3. settlement：「输出 + usage + 下一状态」。

tool 的 intent 还会持久化 `op.tool_args` 和 `replay: "never" | "safe"`。hooks 不走 sandwich，结果在消费它的事务里持久化，崩溃可能重跑（§0.3、§3.7、§3.8）。

**checkpoint 过程**：在每次队列排空点按固定顺序应用 deferred writes、消费 steer、按需 threshold compact、生成 assistant、消费 follow-up、`before_run_end`、条件 finish（§3.12）。classification 在内存中纯计算，先 cancellation，再 overflow，再 deferred，再可重试错误，再 toolUse，最后 stop/length（§3.7）。

**terminal transaction**：删除 `op.meta`、`op.state`、`op.tool_args`、`op.preparation`、operation-owned `pending.entry`，写 `lane.lastResult`，清 `currentOperationId`；ledger 行永不删除。`lane.lastResult` 只为「应用重启后还能回答上一个操作发生了什么」，恢复从不读它（§3.13）。

### 2.2 恢复：读一个 register，切换

- `restore(lane)` 是 5 次 register point lookup：`lane.config`、`lane.state`、`lane.leaf`，只有存在 open operation 时再读 `op.meta` 和 `op.state`。然后按当前状态直接命名的 entry id 和 register key 做一次 bounded batch 读取（trigger、latest assistant、batch assistant、deferred source、completed results、prompt entries、source leaf、navigation target；`op.tool_args`、`op.preparation`、`pending.entry`），再做 bounded validation。没有 journal replay、没有 fold、没有 tree walk、没有从「缺失」推断状态（§4.4、§3.3）。
- 崩溃位置只有可枚举的几格：intent 前、intent 后 dispatch 前、effect 中、settlement 后、queue-application commit 前后、structural final commit 前后、第一次 abort commit 后、terminal commit 后（§4.5）。
- 全系统**唯一不确定区间**是「intent 已持久化、settlement 缺失」。三条恢复策略：
  - generation `effect_pending`：按**捕获的**重试策略发起下一个编号的 attempt；到达上限就按预留的 response id 写入 synthetic error；如果 cancellation 已持久化则写 synthetic `aborted`，不重试。
  - tool `effect_pending`：只有持久化声明和当前声明都说 `safe` 才用持久化的 `op.tool_args` 重放；否则在预留 result id 下写 synthetic `interrupted` 错误。
  - deferred `effect_pending`：running 控制下等应用的 `resume()`，每次 poll 预留新 id；cancelled 控制下用现有预留 id 合成 `aborted`，无上限（§4.5）。
- `close()` 被定义为「controlled crash」：停止接收新工作、拉 signal、拒绝 parked action、排空已接收的 commit、释放 writer lease；不写任何取消或 terminal 状态。重开时看到 `effect_pending`，走 §4.5 的策略（§4.7）。
- `abort()` 不是 phase，是 `control`：第一次 abort 一个 commit 写 `cancel_requested` 并移动 drained queue ids；已 intent 的 effect 允许结算，禁止新 provider/tool/hook/retry；abort 先于 hook 则跳过 hook（§4.6）。
- 外部 finalization：另一个进程或管理工具可以先提交 terminal transaction；live drive 通过条件 commit 发现 `op.*` 已消失，拉 signal、丢弃内存结果、从 `lane.lastResult` 解析调用方 promise（§4.9）。
- `restore` 不做 repair-by-rewrite：它只追加 entry、覆盖自己拥有的 register，用与正常执行相同的 transition；中断再重跑得到同样结果（§1.8）。

### 2.3 后端与崩溃点

- Memory：map 就是状态；一个队列串行 commit。
- JSONL：**文件不是状态，是重放成 Memory map 的配方**。每个 `commit()` 一行；单写用对象行，多写用数组行。open 时按行重放，严格递增的 seq 允许跳号；**最后一行不完整则整行丢弃并截断**（数组行整组丢弃），这是「事务内没有崩溃前缀」的来源；非法中间行或完整但非法的事务是 corruption。durability 只到进程崩溃级，**没有 fsync 承诺**（§1.7）。
- JSONL 的 register 每次 set 都追加，所以会积累死掉的写历史；用 snapshot compaction 重写为 `header + 当前 entries + 当前 registers + usage rows`，temp file + atomic rename，存活行保留原 seq（§1.7）。
- SQLite：一个 session 一个文件；一个 `commit()` 是一个 SQL transaction；必须 `BEGIN IMMEDIATE`，否则读后升级写锁会拿到 stale snapshot；`writer_lease` 用 `(owner_id, fence)` 强制单 writer，WAL 本身不阻止两个进程交替写；branch index 是 rebuildable projection（§1.7、§2.6）。
- 当前源码（与规格不同）：session 用 `LaneRecord` 日志（`operation_started`、`step_attempt`、`tool_started`、`queue_enqueued`、`write_deferred`、`abort_requested`、`operation_finished` 等）加纯 reducer 恢复 lane 状态；`reducer.ts` 明确列出它认为单 writer 协议不可能产生的矛盾状态（`multiple_open_operations`、`record_after_finish`、`tool_call_mismatch` 等），restore 遇到就拒绝而不是修复。JSONL `load` 对最后一行解析失败时把有效前缀原子重写回去（`publishFileAtomically`），interior 失败则报错（`pi:packages/agent/src/harness/reducer.ts`，`pi:packages/agent/src/harness/session/jsonl/storage.ts`）。
  - 这提供了第二种可选形状：**日志 + 纯 reducer**，而不是「可变 register + 程序计数器」。它和规格共享 intent/settlement 与 bounded validation 的概念，但状态是折叠出来的。

### 2.4 pi 的最小可行子集（按依赖闭包，不是取舍）

如果目标只是「崩溃后不重复已结算的外部效果，并能继续同一次 lane 工作」，闭包是：

1. 原子提交（一次 commit 全有或全无，或等价的整文件原子替换）；
2. 一个 total 的当前状态（program counter）或等价的纯 reducer；
3. provider/tool 的 intent 与 settlement，以及预留 id；
4. bounded restore + validation（只读当前状态直接命名的 entry/register）；
5. 恢复策略：重试、synthetic settlement、或标记 interrupted。

不需要的前置：entry tree 的分支、多 lane、branch index、SQLite、writer lease、usage ledger、projection cache。usage ledger 只影响计费完整性；entry tree/lane 影响分支与并行，不是单线恢复的必要条件。

如果只借「恢复历史」而不借「恢复意图」，pi 与 dsh 是两条路线：dsh 是「重放历史到最后一个 balanced 边界」，pi 是「读程序计数器决定下一步」。wo-agent 当前更接近 dsh 的前半段（有日志与派生，没有 durable 边界与恢复策略）。

---

## 3. wo-agent 现状

### 3.1 已有

- `wo-agent:src/session/events.py`：13 种事件——`turn/start`、`turn/end`、`step/start`、`step/end`、`user/message`、`assistant/chunk`、`assistant/message`、`tool/call`、`tool/result`、`request/header`、`compaction/start`、`compaction/summary`、`compaction/end`。surface 类型与 dsh 一致，`SurfaceReplace` 的 `start` / `end` 也是表层节点的 seq。
- `wo-agent:src/session/session.py`：`append` 分配 `seq = len(events)`，不修改不删除；`fold_surface` 实现 append/replace，并在**折叠时**校验 start/end 存在于当前表层、start 不晚于 end、`source_event_seqs` 覆盖所有被遮蔽节点且都指向更早事件；`derive_messages` 跳过非 surface、`assistant/chunk`、空内容 assistant；`surface_seqs` 暴露当前表层。
- `wo-agent:src/session/serialize.py`：同一套 dataclass 就地进出 dict（`asdict` + 按 `type` 分派重建），持久化不另造事件类型；`SurfaceReplace` 也由 `_surface_op_from_dict` 重建。
- `wo-agent:src/session/persistence.py`：`SessionStore` 协议只有 `save(session)` / `load(id)` / `delete(id)` / `list()`；`SessionFormatUnsupportedError` 与 `SessionCorruptionError` 已存在。
- `wo-agent:src/session/jsonl.py`：一个 session 一个 `.jsonl`；header 带 `version` / `id` / `title`；`save` 写 temp、`flush`、`fsync`、`os.replace`；`load` 校验 header 与 `FORMAT_VERSION`，逐行反序列化，最后调用 `_repair_interrupted_turn` 补一条 `turn/end { reason: "interrupted" }`。
- `wo-agent:docs/session.md` 与 `wo-agent:src/compaction/engine.py`：压缩事务序列 `compaction/start` → 摘要 → `compaction/summary` → `user/message` `replace` → `compaction/end`；摘要期间表层被改则放弃提交；崩溃留下未匹配 start 时视为 busy，不自动清除。

### 3.2 与 dsh / pi 的差距（事实）

| 能力 | dsh | pi 规格 | wo-agent |
|---|---|---|---|
| 事实源 | append-only `SessionEvent` 日志；模型历史派生 | entries + registers + usage ledger；模型 context 从 lane leaf 回溯 | append-only 事件日志；模型历史派生 |
| 持久化原语 | 增量 append + 批量写 + `flush` barrier | 单事务 commit；JSONL 一行一 commit / SQLite 一事务 | 整本日志 `save` 覆盖写（temp + fsync + replace） |
| 落盘时机 | 批量窗口 + 三个语义 checkpoint（请求前、顶层 tool 前、pre-step 前） | 每个 phase 转换一次 commit；intent 与 settlement 各一次 | TUI 在一轮 `followup` 返回后调用 `save`；`/new`、`/name` 也调用；异常路径不调用 |
| 请求前日志已持久化 | 是，checkpoint policy fail-closed | 是，request intent 先 commit | 否；请求可能已发生而日志未落盘 |
| tool 前日志已持久化 | 是 | 是，tool intent + `op.tool_args` 先 commit | 否 |
| 崩溃闭合 | 合成 tool result（区分 started / not started）+ `step/end` + `turn/end{interrupted}` | synthetic settlement under reserved ids；或 reducer 报矛盾 | 只补 `turn/end{interrupted}`；不补 `step/end`、不补 tool result |
| 崩溃后继续同一操作 | 否；resume 只是加载日志再起 loop | 是；`op.state` 是程序计数器，`resume()` 驱动 | 否；load 后 idle，需要用户重新输入 |
| 效果意图 | 无专门事件；靠 flush 保证请求前历史完整 | intent/settlement + 预留 response/usage/result id | 无 |
| 失败 attempt 的 usage | `assistant/message.usage`；失败 attempt 若有 usage chunk 则是 durable 记录 | usage ledger 记录成功、失败、重试、synthetic、abort | 只有成功 `assistant/message` 的 `usage`；失败 attempt 无记录（DeepSeek adapter 只在 `[DONE]` 发 `UsageChunk`） |
| 未知事件类型 | 未标 `ignorable` 则拒绝，报格式不支持 | 解码按 schema，非法即 corruption | `serialize.dict_to_event` 抛 `ValueError`；`load` 只捕获 `JSONDecodeError`，不映射为 `SessionCorruptionError` |
| 断尾 / torn tail | JSONL frame 截断 + 恢复完整事件 | JSONL 最后一行整行丢弃并截断 | 整文件 `os.replace` 通常避免断尾；一旦出现不完整行，`load` 整体报 corruption，不保留已提交前缀 |
| seq 完整性 | append 保证连续；后端校验 | 严格递增，允许跳号；跳号合法 | `load` 用 `row["event"]` 重建、由 `append` 重新分配 seq，忽略文件里的 `seq`；不校验连续性 |
| 压缩崩溃 | `session/end-seed` 区分 seed 与 live；未匹配 start 来自旧生命周期则可忽略 | compaction 是自包含 entry；terminal transaction 一次提交 | 未匹配 `compaction/start` 一律视为 busy，永久阻塞自动压缩 |
| session header | version/id/createdAt/cwd/lineage/seedLength/origin/depth/agentPreset | metadata + storageVersion + parentSessionId | version/id/title |
| 分支 / fork / lane | `fork(source, boundary)` 生成 child seed；header 记 lineage | entry tree + 多 lane + fork（branch/tree scope） | 无 |
| 单写者 | JSONL 靠进程所有权；SQLite 有 lease | JSONL 单进程；SQLite `writer_lease` | 无锁；同一 session 可被两个进程打开 |
| 可重试性 / 幂等恢复 | repair 追加合成事件；重复 load 不会重复补（balanced） | restore 用与正常执行相同的 transition；中断再跑结果相同 | 同一份 open-turn 文件每次 load 都补一条 `turn/end`（在内存；若再 save 才持久化） |

需要特别指出的三处具体行为：

1. `wo-agent:cli/tui/app.py` 的 `_run_turn` 只在 `await followup(...)` 正常返回后 `save`；`except` 分支只刷新 UI，不 `save`。因此一次 turn 中途异常或进程被杀，整个 turn 的 `user/message`、`assistant/chunk`、`tool/call`、`tool/result` 都只存在于内存。
2. `wo-agent:src/session/jsonl.py` 的 `_repair_interrupted_turn` 只看 `turn/start` / `turn/end`，不检查 open `step` 和未配对的 `tool/call`。若日志中存在「assistant 消息带 tool-call + `tool/call` 但无 `tool/result`」的尾部，`derive_messages()` 会把它原样交给下一次请求，provider 可能因悬空 tool call 拒绝。
3. `wo-agent:src/compaction/engine.py` 的 `unmatched_compaction_start` 从尾部向前找第一个 `compaction/*`；若保存过一份在压缩中途的日志，重载后该锁永远存在，`compact_if_needed` 与 `compact_now` 都不会再成功。当前「只在 turn 结束后 save」的时序让这种情况很难发生，但机制上没有解除路径。

### 3.3 wo-agent 已经具备、与 dsh 对齐的部分

- 「模型可见 = 必须落日志」的派生模型；`surfaceOp: replace` 的压缩投影；`source_event_seqs` 的遮蔽覆盖校验；被替换事件仍保留（`wo-agent:docs/session.md`，`wo-agent:src/session/tests/test_surface.py`）。
- 版本化 header 与 `SessionFormatUnsupportedError`；整文件原子替换；崩溃 open turn 的 `interrupted` 补写（`wo-agent:src/session/jsonl.py`，`wo-agent:src/session/tests/test_jsonl.py`）。
- `request/header` 作为 log-only 事件记录每次调用的 `LlmCallConfig`；loop 实际写入 `reason` 为 `initial` / `change` / `retry`，`resume` 目前不由 loop 产生（`wo-agent:src/agent/loop.py`，`wo-agent:src/session/events.py`）。
- 压缩事务的 start/summary/end 顺序、表层跨度在摘要期间被改则放弃提交（`wo-agent:src/compaction/engine.py`）。

---

## 4. 候选机制清单

分组只表示「改动落在哪一层」，不表示优先级。每条给出前置依赖、对现有接口的改动面、最小验收方式与来源。

### A 组：不改事件词汇

#### A1. 崩溃闭合补全（synthetic closers）

- 来源：`dsh:packages/core/session/src/repair.ts`，`dsh:docs/subsystems/persistence.md#crash-recovery-preserves-an-interrupted-turn`。
- 前置依赖：`assistant/message` 的 tool-call 块与 `tool/call` / `tool/result` 的 call_id 配对信息；现有 `TurnEnd` / `ToolResultEvent` / `StepEnd` 类型即可。
- 改动面：新增 `wo-agent:src/session/repair.py`；`JsonlSessionStore.load` 用新函数替换 `_repair_interrupted_turn`；合成结果复用 `create_tool_result_message`，`source_event_seqs` 指向 `tool/call` seq；`SessionStore` 协议不变。
- 最小验收：构造「`turn/start` + `step/start` + `assistant/message`（含 tool-call）+ `tool/call`」日志，`load` 后事件 balanced，依次出现 synthetic `tool/result`、`step/end`、`turn/end{interrupted}`；synthetic 结果引用 call seq；原事件逐条不变。若修复只在内存视图发生，同一文件再次 `load` 会再补一次；若 `load` 或调用方把修复持久化，再次 `load` 应看到 balanced 日志且不再追加。两种语义在实现前要选一种并写进验收。
- 备注：区分「见过 `tool/call`」（outcome unknown）与「只在 assistant 块里见过 call」（not started）；错误文本要提示模型不要盲目重试。dsh 的 `time` 复用最后事件时间，wo-agent 现在用当前时间。

#### A2. 效果前 flush / checkpoint

- 来源：`dsh:packages/session/session-checkpoint-policy/src/index.ts`，`dsh:packages/session/session-persistence/src/write-behind.ts`，`dsh:docs/subsystems/persistence.md#the-flush-checkpoint`。
- 前置依赖：一个可从 `agent` 调用的持久化屏障。现有 `SessionStore.save(session)` 已可充当粗粒度实现；若不想让 `agent` 依赖 store，可注入 `checkpoint: Callable[[Session], None]`。
- 改动面：`wo-agent:src/agent/loop.py` 在 `provider.stream(...)` 前、每个 `tools.execute(...)` 前调用；失败则不 dispatch、以 `error` 结束当前 turn。`cli/boot.py` 负责把 store 或回调接进 `ReactLoopAgent`。`SessionStore` 可不改。
- 最小验收：fake store 记录调用顺序，断言 `checkpoint` 先于 provider/tool；checkpoint 抛异常时 provider 与 tool 均未被调用；checkpoint 成功后立刻模拟进程死亡，重新 `load` 能看到 `request/header` 与 `tool/call`。
- 备注：现有 `save` 是 O(会话长度) 的全量重写，每个 step/tool 都调用会随历史增长；dsh 用增量批量 + barrier。若先做 A2 再做 B1，可以先用 `save` 验证语义，再换增量。

#### A3. 严格加载与格式拒绝

- 来源：`dsh:docs/subsystems/persistence.md#format-refusal--logs-a-build-cannot-faithfully-read`，`pi:packages/agent/docs/harness.md` §1.7（interior 非法行是 corruption）。
- 前置依赖：已知事件类型集合；事件 envelope 可选 `ignorable` 标记。
- 改动面：`wo-agent:src/session/serialize.py` 把 `dict_to_event` 的 `ValueError` 映射为 `SessionFormatUnsupportedError`（未知 type）或 `SessionCorruptionError`（payload 形状坏）；`wo-agent:src/session/jsonl.py` 在 load 时校验 `row["seq"]` 连续（可选：`time` 非递减）、header version 方向化报错；非 `ignorable` 的未知事件拒绝。`SessionEvent` 可加 `ignorable: bool = False`。
- 最小验收：未知事件类型 → 报「本构建不支持」而不是 `ValueError`；version 999 → 报「升级 harness」；seq 跳号 → `SessionCorruptionError`；`ignorable` 未知事件被跳过且后续事件仍可读。
- 备注：与 B1 一起做才完整；单独做可以让当前「未知事件 `ValueError` 直接穿透 `load`」不再泄漏。

#### A4. 单写者租约 / 文件锁

- 来源：`pi:packages/agent/docs/harness.md` §1.7（`writer_lease`）、§0.6（one process per session）；`dsh:docs/subsystems/persistence.md`（live id 的 load 行为）。
- 前置依赖：B1 的追加写；多进程入口确实存在。
- 改动面：`JsonlSessionStore` 增加 lock file 或 OS 级锁；`load` 检查 owner；`save`/`append` 续租。单进程 CLI 可以是 no-op 开关。
- 最小验收：两个进程同时打开同一 session，第二个被拒绝或降为只读；崩溃后租约过期可接管；正常退出释放。
- 备注：当前 wo-agent 是单进程 TUI，这一项没有消费者；只有出现 `wo-agent` 的 RPC/服务宿主时才需要。

### B 组：扩展存储或事件词汇

#### B1. 增量 append + torn-tail 前缀恢复

- 来源：`dsh:packages/session/session-persistence-jsonl/src/index.ts`，`dsh:docs/subsystems/persistence.md`；`pi:packages/agent/src/harness/session/jsonl/storage.ts`。
- 前置依赖：单写者（或 A4）；header 惰性物化；load 能接受「有效前缀 + 损坏尾部」；seq 连续性校验（A3）。
- 改动面：`wo-agent:src/session/persistence.py` 的 `SessionStore` 增加 `append(session_id, events)`（或 `append(session)`，由 store 记录 per-session 已持久化的 seq）；`JsonlSessionStore` 用追加模式写行 + `flush` + `fsync`；`save` 保留用于压缩/重写。`load` 对最后一行 JSON 解析失败时截断到最后一条完整行，而不是整体报错；interior 失败仍报 corruption。
- 最小验收：写 3 条后手工截断第 4 条为半行，`load` 返回 3 条（必要时再叠加 A1 的 closers），并把文件截断到前缀；下一次 `append` 从 seq 3 开始；seq 跳号或重复 → `SessionCorruptionError`；完整文件 `load` 与原 `save` 结果一致。
- 备注：dsh 默认用 zstd frame + checksum + `link()` 发布；pi 的 JSONL 明确只承诺进程崩溃级、不 fsync。wo-agent 现有 temp+fsync+replace 的整文件原子性更强，但代价是每次 O(n)。追加写在 Windows 上的 flush/锁语义需要实测。

#### B2. 请求 / 工具意图与预留 id（effect sandwich）

- 来源：`pi:packages/agent/docs/harness.md` §0.3、§3.2、§3.7、§3.8、§4.5。
- 前置依赖：A2 或 B1（先保证 intent 本身能落盘）；id 预生成（现有 `uuid.uuid4().hex` 足够，不必 UUIDv7）；日志只增事件词汇。
- 改动面：新增 log-only 事件，例如 `request/intent`（turn/step/attempt、`LlmCallConfig` 快照、预留的 assistant message id 与 usage id）与 `tool/intent`（call_id、预留 result message id、arguments、`replay: "never" | "safe"`）；`wo-agent:src/agent/loop.py` 在 dispatch 前 append，结算事件使用预留 id；`serialize.py` 双向支持；`derive_messages` 忽略它们。load 时扫描「有 intent 无 settlement」的记录，得到 suspended 状态。
- 最小验收：在 intent 后、结算前杀死/抛异常；重新 `load` 能报告「有一个未结算的 attempt/tool」；按策略重试或写 synthetic error，写入的 id 与 intent 预留的一致；不会对同一预留 id 写两次；正常路径的日志仍能派生同样的消息。
- 备注：dsh 没有 intent 事件，只有「请求前 flush」；intent 是 pi 独有的、让恢复知道「可能已计费/可能已产生副作用」的机制。不引入 intent 时，A2 只能保证「请求前的日志已落盘」，无法判断崩溃时是否有一个请求在飞行中。

#### B3. Usage ledger

- 来源：`pi:packages/agent/docs/harness.md` §1.6。
- 前置依赖：B2 的 usage id（或结算时 mint）；provider 错误路径也能拿到 usage（`wo-agent:src/llm/deepseek.py` 目前只在 `[DONE]` 发 `UsageChunk`，失败路径通常没有 usage）。
- 改动面：新增 append-only `usage/row` 事件（含 `entry_id`、`adjustment`、`TokenUsage`）；`agent/loop.py` 对每次 attempt（成功、失败、重试、合成 abort）写一行；`wo-agent:cli/usage.py` 与 `wo-agent:cli/tui/app.py` 改为读 ledger（或保留现有 `assistant/message.usage` 作为派生视图）。`SessionStore` 不需要改。
- 最小验收：一次失败 attempt + 一次成功 attempt → 两行；失败行无 `entry_id`；总和等于行和；abort 合成行写零 usage；ledger 行在 `delete(session)` 之前永不删除；更新后的加总函数与 ledger 总和一致。
- 备注：dsh 没有独立 ledger，usage 在 `assistant/message` 与 usage chunk 上；wo-agent 现在也只从成功的 `assistant/message` 加总。若要保留单一事实源，也可以把失败 attempt 的 usage 挂在 `step/end` / `turn/end` 上，但那会改变现有事件语义。

#### B4. 压缩锁的崩溃语义（end-seed 或 orphan 处理）

- 来源：`dsh:docs/subsystems/session.md#the-end-seed-boundary-sessionend-seed`，`dsh:docs/subsystems/compaction.md`；`pi:packages/agent/docs/harness.md` §2.1、§3.13。
- 前置依赖：load 能区分 seed 与 live（或至少能识别「这半截压缩来自已结束的生命周期」）。
- 改动面：新增 `session/end-seed` 事件（load 后首次 live 写入；已有则不重复写）；`wo-agent:src/compaction/engine.py` 的 `unmatched_compaction_start` 只在最后一个 `end-seed` 之后查找；或在 load 时合成 `compaction/end { error: "interrupted" }`。`CompactionSummary` / `CompactionEnd` 不变。
- 最小验收：保存一份 `compaction/start` 未闭合的日志，`load` 后可以再次 `compact_now`（不会永久 busy）；带 `end-seed` 的旧锁被忽略；不删除任何事件；新生命周期不会把旧 `compaction/start` 当成本次锁。
- 备注：dsh 的 end-seed 还承担 seed/fork 边界；wo-agent 没有 seed 概念，最小版本可以只做「load 时关闭 orphan」，但那样无法区分「旧生命周期」与「另一个仍活着的写者」。

### C 组：改变会话模型

#### C1. 操作状态机与 resume

- 来源：`pi:packages/agent/docs/harness.md` §3、§4（`op.meta` / `op.state` / terminal transaction / restore）；`pi:packages/agent/src/harness/reducer.ts` 是「日志 + 纯 reducer」的另一种实现。
- 前置依赖：B2；operation 身份与 source leaf；状态落点二选一——log-only `operation/state` 事件（完整状态覆盖写），或 sidecar register 文件（如 `<session>.state.json`，原子替换）。
- 改动面：`wo-agent:src/agent/loop.py` 从「直接 while turn/step」改为「计划 → commit state → dispatch → await effect → settlement」；acceptance 写 `operation/meta`；每个 phase 转换写完整 state；terminal 删除 op 状态并写 `lane.lastResult` 等价物；`cli/boot.py` 在 load 后检测 open operation，进入 suspended 而不是 idle；`Agent` 暴露 `resume` / `suspended` 状态。若用 sidecar，`SessionStore` 需要保存/加载它；若用 log events，`serialize.py` 扩展。
- 最小验收：覆盖 §4.5 的崩溃位置矩阵（intent 前 / intent 后 dispatch 前 / effect 中 / settlement 后 / queue commit 前后 / terminal 前后），每格断言 durable 状态与下一步动作；`resume()` 不重放已结算的 effect；terminal 后 op 状态不存在；重复 resume 幂等。
- 备注：这是 pi 与 dsh 最大的形状差异，也是改动面最大的一项。只想要「崩溃不丢历史」时，A1 + A2 + B1 已覆盖；想要「崩溃后继续跑同一个操作」时，B2 + C1 是闭包。dsh 没有对等物，不能从 dsh 直接搬。

#### C2. entry tree / lane / fork

- 来源：`pi:packages/agent/docs/harness.md` §2.1–§2.7；`dsh:docs/subsystems/session.md#live-session-fork-api`。
- 前置依赖：每条事件/消息的 parent 指针；lane leaf；branch scan；header lineage（`parentSession` / `seedLength`）。
- 改动面：`SessionEvent`（或旁表）增加 `parent_id` / entry id；`wo-agent:src/session/session.py` 的 `derive_messages` 从「fold 全日志」改为「从 lane leaf 回溯 + surface」；`fold_surface` 与 `replace` 的交互要重新定义（被 replace 遮蔽的节点是否仍在 branch 上）；store header 增 lineage；新增 `Session.fork` / `create_lane`。压缩 entry 可能改为 self-contained（`summary` + `retainedTail`）而不是纯 replace。
- 最小验收：同一 leaf 建两个 lane，各自 append 后互不影响；`derive_messages` 各自只看到自己的分支；fork 子会话只看到 inclusive prefix，父会话继续增长不影响子；branch context 不包含兄弟分支；fork 的 header 记 parent/seedLength。
- 备注：与 wo-agent 的「单线会话 + 极窄宿主」定位直接冲突（`wo-agent:CLAUDE.md` 的定位边界）。fork 可以单独作为离线工具（复制前缀 + 新 header），不必引入 lane 或 branch index。

---

## 5. 离开 Cordis / TypeScript 生态就不划算的机制

以下判断的标准是「机制的价值是否主要来自框架/语言/平台，而不是会话语义本身」。

| 机制 | 依赖 | 为什么不划算 | 仍可保留的概念 |
|---|---|---|---|
| Cordis service / effect / fiber disposer / plugin tree | `dsh:docs/architecture.md`，`dsh:docs/cordis-primer.md` | 价值来自「注册即 effect、卸载即回滚」的框架；Python 侧没有对等物，自己实现会得到一个只有一处的伪框架 | 能力缝的三角色（definition / provider / consumer）；效果要有释放路径 |
| `ctx.sessionProjections` + persisted projection cache | `dsh:docs/subsystems/session-projection.md` | 驱动来自 `session/event` 订阅，消费方是 host/client carrier；wo-agent 没有 client、没有多读者、没有 wire schema | 纯 `apply(state, event)` 的 fold；`stateVersion` 不匹配则丢弃缓存 |
| `SessionEventMap` declaration merging + 编译期 surface intent 约束 | `dsh:docs/subsystems/session.md` | 类型层保证无法在 Python 复刻；运行时校验可以近似，但会失去「非 surface 事件编译期不能带 surfaceOp」 | 运行时 `append` 校验；事件 type 白名单；`ignorable` |
| Zod schema / `structuredClone` / `deepFreeze` | `dsh:packages/session/session-projection/src/index.ts` 等 | 语言运行时能力；Python 的 frozen dataclass 已提供另一套不可变保证 | 纯状态、可 JSON、不可变返回值 |
| JSONL zstd frame + checksum + `link()` 发布 + 目录 fsync | `dsh:packages/session/session-persistence-jsonl/src/index.ts` | 平台/Node 特性；Python 可用 `os.replace` + `fsync` 达到整文件原子性，zstd/`link` 的收益主要在大文件和多进程并发创建 | 原子发布、torn-tail 截断、fsync 边界 |
| SQLite 后端 + `writer_lease` + `BEGIN IMMEDIATE` + branch index | `pi:packages/agent/docs/harness.md` §1.7、§2.6 | 为多进程、分支、可扩展读模型设计；wo-agent 单进程单线，SQLite 的收益不足以抵消 schema/迁移/租约成本 | 单写者假设；revision/watermark 的概念 |
| 多 lane 并行 + subagent session + Slack thread | `pi:packages/agent/docs/harness.md` §0.4、§2.3 | 产品级并发编排；wo-agent 明确不做产品级 subagent | 「游标」概念可用于只读视图，不必落地多写者 |
| precise rewrite / 合规擦除 / Postgres partitioned retention | `pi:packages/agent/docs/harness.md` §2.9、Part 6 | 管理工具与大规模存储；没有合规/留存需求 | 「entries 永不删，压缩只改 context」的语义 |
| provider stream resumption / deferred poll | `pi:packages/agent/docs/harness.md` §3.2、§4.5 | 需要 provider 支持 deferred handle；wo-agent 的 LLM 层没有这个能力，属于 LLM 层票的范围 | 外部效果不确定时「重试或合成结果」的二选一 |
| hooks 的 replay 契约 | `pi:packages/agent/docs/harness.md` §0.3 | wo-agent 没有 hook 系统；如果未来有，可以按「结果在消费事务里持久化」处理 | 非幂等副作用的 idempotency key |

另外两项与 Cordis 无关、但与 wo-agent 当前设计直接冲突，单独列出：

- **完整 `EpochHeader` 落日志**：dsh 把渲染后的 system prompt 和 tool schemas 写进 `request/header`，使「每次请求都是日志的纯函数」（`dsh:docs/subsystems/session.md`）。wo-agent 的 `CLAUDE.md` 明确系统提示词由注册表当场 `assemble()`、不进 session；搬完整 header 会制造第二个事实源，并使日志随 tool schema 变化膨胀。可选项是只记录 `LlmCallConfig`（现状），或记录 header 的 hash/版本而不记录全文。
- **保留 `request/context`（contextWindow）**：dsh 需要它来判定请求容量；wo-agent 的压缩按字符阈值，token 计量与窗口属于 LLM 层票（`map.md` 的「尚未明确」）。会话层单独加 `request/context` 没有消费者。

---

## 6. 留给决策票的问题

以下问题在本次调查中只能列出选项，不能由研究票决定：

1. wo-agent 的持久化目标是什么：只保证「崩溃不丢已完成的 turn」，还是保证「崩溃后继续同一个 turn/step/tool」？前者至少需要 A1 + A2（若要让 mid-turn 的事件也在盘上，再加 B1），后者需要 B2 + C1。
2. 状态放在哪里：log-only `operation/state` 事件，还是 sidecar register 文件？前者保持「一份日志」，后者更接近 pi 的 register 模型且避免日志膨胀。
3. 是否接受新增事件词汇（intent / usage row / end-seed / operation state）？wo-agent 当前的 `FORMAT_VERSION = 1`，新增事件会改变磁盘格式。
4. `save` 的全量重写是否要换成增量 append？若保留全量重写，A2 的 checkpoint 成本随会话增长；若换增量，需要 A3 + A4 的加载校验与单写者假设。
5. usage 的单一事实源：保留 `assistant/message.usage`，还是引入 ledger？两者并存需要明确哪个是权威。
6. entry tree / lane / fork 是否值得作为「学习卡片」保留而不进路线？它们与「单线会话 + 极窄宿主」的定位冲突，但 fork 可以独立成离线工具。
7. 压缩的崩溃语义用哪种：`session/end-seed` 边界、load 时合成 `compaction/end`，还是 pi 的 self-contained compaction entry？三者的格式改动量不同。

---

## 附：一手来源索引

- dsh 会话模型：`dsh:docs/subsystems/session.md`，`dsh:packages/core/session/src/types.ts`，`dsh:packages/core/session/src/surface.ts`
- dsh 持久化与恢复：`dsh:docs/subsystems/persistence.md`，`dsh:packages/session/session-persistence/src/{write-behind,coordinator}.ts`，`dsh:packages/core/session/src/repair.ts`，`dsh:packages/session/session-persistence-jsonl/src/index.ts`
- dsh checkpoint 策略：`dsh:packages/session/session-checkpoint-policy/src/index.ts`
- dsh 投影：`dsh:docs/subsystems/session-projection.md`，`dsh:packages/session/session-projection/src/index.ts`
- pi 规格：`pi:packages/agent/docs/harness.md`（三存储 §0.3/§1；entry tree §2；operation §3；恢复 §4；公共面 §5；不变量 §9）
- pi 当前源码：`pi:packages/agent/src/harness/session/{types,session,state,memory}.ts`，`pi:packages/agent/src/harness/session/jsonl/{storage,repo,codec}.ts`，`pi:packages/agent/src/harness/reducer.ts`
- wo-agent 现状：`wo-agent:src/session/{events,session,serialize,persistence,jsonl}.py`，`wo-agent:src/agent/loop.py`，`wo-agent:src/compaction/engine.py`，`wo-agent:cli/boot.py`，`wo-agent:cli/tui/app.py`，`wo-agent:docs/session.md`
