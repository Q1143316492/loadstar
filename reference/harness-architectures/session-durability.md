# 会话持久性与崩溃恢复

> dsh `0a53fb55be` · pi `853a80d26`
> 研究：[session-durability.md](../../docs/workflow/maps/harness-evolution/research/session-durability.md)

## dsh 怎么做

append-only `SessionEvent` 日志是唯一事实源，模型历史由 `deriveMessages()` 派生。持久化是能力缝，写走批量与 flush 检查点。崩溃恢复只做一件事：把日志补到最后一个 balanced 边界，再重新派生——不记录「崩溃时正在跑哪个工具」。

## pi 怎么做

三个存储（不可变 entries、可变 registers、append-only usage ledger）加一个 total 的 operation 状态当程序计数器。外部效果包成 intent → effect → settlement，id 提前预留。恢复时读 register、按缺口决定重试、合成结果或标记 interrupted。注意：`harness.md` 是目标规格，当前源码是 records + reducer 的另一套实现。

## wo-agent 现状

已有 append-only 日志、`derive_messages()` 与 `surfaceOp: replace` 压缩投影，格式版本 1。落盘只在 turn 结束后全量重写，turn 中途崩溃会丢掉该 turn 的全部事件；加载时只补 `turn/end`，不补 `step/end` 与悬空的工具结果。没有请求/工具的 intent，也没有可恢复的操作状态。

## 可搬性与前置依赖

- **进路线**：效果前 checkpoint、加载时合成 closers、严格加载与格式拒绝、增量 append 与 torn-tail 前缀恢复、请求与工具 intent 及预留 id、压缩锁的崩溃语义。
- **只留卡片**：entry tree、lane、fork、SQLite 后端——与「单线会话 + 极窄宿主」定位冲突。
- **明确不搬**：Cordis 服务与投影缓存、Zod/structuredClone、zstd 与 link 发布、precise rewrite、完整 EpochHeader（与「系统提示词不进日志」的设计冲突）。

依赖顺序：checkpoint 与 closers 不改事件词汇，可以先做；增量 append 改存储；intent 要新增事件类型，最后做并且要 bump 格式版本。
