## 问题

dsh 与 pi-agent 的「会话与崩溃恢复」各是什么形状，wo-agent 现有 `session/` 与它们的差距在哪，哪些概念值得渐进搬入？

需要回答：

1. **dsh 侧**：append-only `SessionEvent` 日志、`deriveMessages()` 投影、persistence 后端、crash recovery 的最小机制（哪些是 Python 侧可借的，哪些依赖 Cordis）。
2. **pi 侧**：`packages/agent/docs/harness.md` 里的 entry tree、lanes、operation 状态机、三存储（entries / registers / usage ledger）、原子事务、effect sandwich、崩溃位置与恢复策略。梳理出最小可行子集。
3. **wo-agent 现状**：`src/session/` 的事件类型、`derive_messages()`、`surfaceOp: replace` 压缩投影、`JsonlSessionStore` 的重载与 `interrupted` 补写。明确它已经具备什么、缺什么。
4. **渐进可搬性**：列出候选概念（例如 usage ledger、请求意图与结算的两段提交、崩溃恢复、分支/fork、lane），逐条给出前置依赖、对现有接口的改动面、以及最小验收方式。
5. **明确不搬**：指出哪些机制离开 Cordis / TypeScript 生态就不划算，或与 wo-agent 的单线会话定位冲突。

产物写到 `research/session-durability.md`，从本票链接。只给事实与选项，不做取舍决策。

类型：research
状态：已解决
阻塞于：无

## 答案

研究见 [session-durability.md](../../../../../reference/harness-architectures/research/session-durability.md)。

- **三种形状**：dsh 恢复的是「历史」——把日志补到最后一个 balanced 边界再 `derive_messages()`；pi 恢复的是「意图」——三存储加 total 的 operation 状态（程序计数器），按 intent / settlement 的缺口决定重试、合成或标记 interrupted；wo-agent 是「整本历史快照」，只在 turn 结束后全量 `save`，mid-turn 崩溃会丢掉该 turn 的全部事件，且只补 `turn/end`，不补 `step/end` 与悬空 tool result。
- **一个必须先说的事实**：pi 的 `harness.md` 是目标规格，当前源码是另一套 records + reducer 的实现；搬概念时二者可当作两种选项。
- **最值得搬（按依赖）**：效果前 flush / checkpoint、合成 closers、严格加载与 torn-tail 前缀恢复、请求与工具 intent 及预留 id、total 的 op 状态与 resume、usage ledger。
- **明确不搬**：Cordis service / effect / 声明合并 / 投影缓存、Zod / structuredClone、SQLite 与 writer lease、zstd 与 link 发布、多 lane / 分支 / subagent、precise rewrite、deferred poll、完整 EpochHeader（与 wo-agent 系统提示词注册表设计冲突）。
- **留给 HITL 的问题**：持久化目标是「不丢已完成 turn」还是「继续同一个 turn/step/tool」；状态放 log-only 事件还是 sidecar；是否接受新增事件词汇；全量重写是否换成增量 append；usage 单一事实源；entry tree / lane / fork 是否只留卡片；压缩崩溃语义用哪一版。
