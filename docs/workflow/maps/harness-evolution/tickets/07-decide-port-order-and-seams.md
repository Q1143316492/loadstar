## 问题

对「进路线」的架构排定渐进顺序，并决定每一步的接缝与验收。

需要回答：

1. 第一步是什么：哪一个能力改动面最小、又能立刻验证方向（例如先补 token 计量与压缩阈值，还是先做工具审批，还是先做可逆注册）。
2. 每一步放在哪个包、动哪个 Protocol：新增能力必须落在现有分层里，不能出现与 `agent/` 并列的新核心层。
3. 每一步的验收：可观察的行为、测试形态（fake provider、无网络）、以及对现有 CLI 或示例的影响。
4. 哪些步骤有先后依赖（例如 token 计量先于压缩阈值；审批先于沙箱），哪些可以并行。
5. 每一步结束后，wo-agent 的文档（`docs/<包>.md`、`README.md`）要同步到什么程度。

产物是一张有序的步骤表，每步一行：目标、接缝、验收、依赖。它将成为路线 spec 的骨架。

类型：grilling
状态：已解决
阻塞于：06

## 答案

用户按推荐全部采纳（2026-11-19）。有序步骤表如下。

| # | 目标 | 接缝 | 验收 | 依赖 |
|---|---|---|---|---|
| 1 | usage 投影、状态栏显示累计 token、压缩阈值按模型窗口比例 | 新增 `session/usage.py` 折叠；`compaction/CompactionOptions` 改按窗口比例；`cli/usage.py` 与 `cli/tui/app.py` 读投影 | 状态栏显示累计 token；压缩在窗口 80% 触发、尾部保留 16%；不用真实 key 的 fake provider 测试 | 无 |
| 2 | 错误分类与 per-route 重试策略 | `llm/protocol.py` 让 provider 声明重试策略；`agent/loop.py` 消费 | 400 不再一律判为窗口超限；可重试码与退避由 provider 声明；测试覆盖错误码分流 | 无 |
| 3 | 效果前 checkpoint、合成 closers、严格加载 | 新增 `session/repair.py`；`JsonlSessionStore.load`；`agent/loop.py` 在请求与工具前落盘 | 崩溃后加载日志 balanced；未知事件报「本构建不支持」；checkpoint 失败则不 dispatch | 无 |
| 4 | 组合期校验、skill 诊断、可逆注册（disposer） | `compose/ComposeContext` 收集 diagnostics；`skill/registry.py` 报告冲突；`Capability.mount` 可返回 disposer | 同名工具不再静默覆盖；skill 冲突有结构化 warning；卸载能力后注册项消失 | 无 |
| 5 | 结构化错误码、bash 凭据清洗、执行器级协作超时 | `tools/executor.py` 与 `tools/definition.py`；`workspace/shell.py` | 工具错误带稳定 code；bash 子进程看不到 API key；超时产生 `TOOL_TIMEOUT` 结果 | 无 |
| 6 | 三态审批（allow / deny / ask）与并发安全标记 | `tools/` 定义 `ApprovalChannel` 协议；`cli/tui` 提供确认实现 | 无通道时 `ask` 变 `is_error`；`bash` 默认 ask；默认串行，显式 safe 才并行 | 5 |
| 7 | 增量 append 与 torn-tail 前缀恢复 | `session/persistence.py` 的 `SessionStore`；`JsonlSessionStore` | 半行尾部被截断到完整前缀；seq 跳号报 corruption；全量 load 结果不变 | 3 |
| 8 | 请求与工具 intent、预留 id | `session/events.py` 新增 log-only 事件；`agent/loop.py` dispatch 前写入 | intent 后崩溃可报告未结算操作；结算使用预留 id；不重复写同一 id | 3, 7 |

交付粒度（Q4）：每步一次独立交付——开短分支、写或改测试、跑全量、走代码评审、合回 `main`、同步对应 `docs/<包>.md`。地图只在步骤完成后追加一行。

审批形态（Q3）：核心只定义 `ApprovalChannel` 协议，CLI 提供基于 Textual 的确认实现；无 UI 或无人值守时默认 deny（fail closed）；`bash` 默认 ask，其余工具默认 allow。

第一步的窗口常量先手写为 DeepSeek 的 `context_window`；模型能力协商仍留在卡片里，等第二个 provider 再做成 provider 声明的元数据。
