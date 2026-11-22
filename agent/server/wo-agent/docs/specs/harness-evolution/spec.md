# wo-agent harness 演进路线

把 dsh 与 pi-agent 里值得借的 harness 架构，按渐进顺序搬进 wo-agent。上游钉在 dsh `0a53fb55be`、pi-agent `853a80d26`；架构对照在 [`reference/harness-architectures/`](../../../reference/harness-architectures/README.md)，一手事实在其中的 [`research/`](../../../reference/harness-architectures/research/)。

这份 spec 决定四件事：搬什么、按什么顺序、接缝落在哪个包、每步怎么验收。细节只住在研究文档，这里不重抄。每一步对应一张独立实现票，按文末模板开票即可。

## 现状基线与差距

wo-agent 已经与 dsh 同构的部分：

- **会话**：append-only 事件日志，模型可见历史由 `derive_messages()` 派生；`surfaceOp: replace` 的压缩投影与遮蔽校验齐备（[session.md](../../session.md)）。
- **LLM 流**：shard 流协议加唯一的 `BlockAssembler`；provider 失败也以 `finish` 收尾，不在流上抛异常（[llm.md](../../llm.md)）。
- **组合**：`compose()` 在启动时按序 `mount` 能力；工具、系统提示词、skill、压缩各走自己的注册表（[compose.md](../../compose.md)）。
- **工具**：`RegistryToolExecutor` 已有「注册表 → 守卫 → 解析 → 执行 → 错误转结果」的管线；守卫是单调拒绝（[tools.md](../../tools.md)）。
- **定位**：可控规模的 Python 内核 + 极窄宿主。「不做大而全 agent」是硬闸门（`CLAUDE.md`）。

与上游的差距按四层归纳：

| 层 | 缺什么 | 研究 |
|---|---|---|
| 会话持久性 | 整本日志覆盖写；请求与工具执行前不落盘；崩溃只补 `turn/end`，不补 `step/end` 与合成 tool result；没有 intent、预留 id、torn-tail 前缀恢复；未知事件不映射为 corruption | [session-durability](../../../reference/harness-architectures/research/session-durability.md) |
| LLM 层 | 错误码不分 route、`400` 一律判为窗口超限；重试策略写死在 `RETRYABLE_CODES`，provider 无法声明；`provider_retry_after_ms` 没有消费方 | [llm-provider](../../../reference/harness-architectures/research/llm-provider.md) |
| 组合层 | 同名工具静默覆盖；skill 冲突静默跳过；注册不可撤销，没有 disposer；组合期没有 diagnostics 汇总 | [composition-extension](../../../reference/harness-architectures/research/composition-extension.md) |
| 工具管线 | 连接口只有 reject，没有 allow / deny / ask 与审批通道；非进程工具没有执行器级 deadline；错误没有稳定 code；`bash` 子进程继承全部环境变量；并发标记与调度缺失 | [tool-pipeline](../../../reference/harness-architectures/research/tool-pipeline-permissions.md) |

**已经落地、不再开票的部分**：provider 注册表与按名选路、auth 解析（override → 环境变量 → `AUTH`）（`27dfb79`）；usage 投影与按模型窗口比例的压缩阈值（`913429b`，即下表第 1 步）。

## 进路线的能力与顺序

八步按依赖排序，每步一次独立交付。第 1 步已落地；第 2、3、4、5 步互不阻塞，可并行开票。

| # | 目标 | 接缝 | 验收 | 依赖 | 进度 |
|---|---|---|---|---|---|
| 1 | usage 投影、状态栏累计 token、压缩阈值按窗口比例 | `session/usage.py` 折叠；`compaction/CompactionOptions`；`cli/tui/app.py` 读投影 | 状态栏显示累计 token；窗口 80% 触发压缩、尾部保留 16%；fake provider 测试 | 无 | 已落地 `913429b` |
| 2 | 错误分类与 per-route 重试策略 | `llm/protocol.py` 让 provider 声明重试策略；`agent/loop.py` 消费 | `400` 不再一律判窗口超限；可重试码与退避由 provider 声明；测试覆盖错误码分流 | 无 | 待办 |
| 3 | 效果前 checkpoint、合成 closers、严格加载 | 新增 `session/repair.py`；`JsonlSessionStore.load`；`agent/loop.py` 在请求与工具前落盘 | 崩溃后加载日志 balanced；未知事件报「本构建不支持」；checkpoint 失败则不 dispatch；加载时关闭孤立压缩 | 无 | 待办 |
| 4 | 组合期校验、skill 诊断、可逆注册（disposer） | `compose/ComposeContext` 收集 diagnostics；`skill/registry.py` 报告冲突；`Capability.mount` 可返回 disposer | 同名工具不再静默覆盖；skill 冲突有结构化 warning；卸载能力后注册项消失 | 无 | 待办 |
| 5 | 结构化错误码、bash 凭据清洗、执行器级协作超时 | `tools/executor.py`、`tools/definition.py`；`workspace/shell.py` | 工具错误带稳定 code；bash 子进程看不到 API key；超时产生 `TOOL_TIMEOUT` 结果 | 无 | 待办 |
| 6 | 三态审批（allow / deny / ask）与并发安全标记 | `tools/` 定义 `ApprovalChannel` 协议；`cli/tui` 提供确认实现 | 无通道时 `ask` 变 `is_error`；`bash` 默认 ask；默认串行，显式 safe 才并行 | 5 | 待办 |
| 7 | 增量 append 与 torn-tail 前缀恢复 | `session/persistence.py` 的 `SessionStore`；`JsonlSessionStore` | 半行尾部被截断到完整前缀；seq 跳号报 corruption；全量 load 结果不变 | 3 | 待办 |
| 8 | 请求与工具 intent、预留 id | `session/events.py` 新增 log-only 事件；`agent/loop.py` dispatch 前写入 | intent 后崩溃可报告未结算操作；结算使用预留 id；不重复写同一 id | 3, 7 | 待办 |

两条贯穿约束：

- **分层不破**：新增能力必须落在现有分层里（`compose/ → agent/ → session/ → llm/` 等单向依赖），不得出现与 `agent/` 并列的新核心层。
- **核心不带宿主**：审批、呈现、凭据提供方归宿主或 `cli/`；核心只定义协议。审批在无 UI 或无人值守时 fail closed（默认 deny），`bash` 默认 ask，其余工具默认 allow。

第 1 步的窗口常量先手写为 DeepSeek 的 `context_window`；模型能力协商留在卡片，等第二个 provider 再做成 provider 声明的元数据。

## 每步怎么开实现票

一个没参与过规划会话的 agent，只读本 spec 与对应研究文档，就能开出一张可交付的实现票。实现票至少写清：

1. **目标**：从上面的步骤表取一行，一句话说明行为变化。
2. **接缝**：列出要改的包与 Protocol；若需要新文件，写明落在哪一层、依赖方向。
3. **测试**：fake provider / 无网络；覆盖表中「验收」列的行为，含失败路径。
4. **文档**：同步对应的 `docs/<包>.md`；行为变化影响 `README.md` 时一并更新。
5. **边界**：明确本票不做的相邻能力，避免顺手扩大。

交付纪律：每步开短分支、写改测试、跑全量、走代码评审、合回 `main`，然后在地图的「已定决策」追加一行、回填对应能力卡片的「wo-agent 现状」段。

## 学习产物回流

架构学习产物落在 `reference/harness-architectures/`，与代码同仓；lodestar 只放跨项目的工作流技能，不搬知识。

- **卡片是结论视图**：一能力一文件，固定四段——dsh 怎么做、pi 怎么做、wo-agent 现状、可搬性与前置依赖，每段三到六行，末尾链到 `research/` 的具体章节。细节只住在研究里。
- **不新建技能**：复用 `cwl-research` 做调查；流程写在 `reference/harness-architectures/README.md`。跑过两三个能力、看清高频步骤后，再考虑抽 `cwl-harness-study`。
- **回填纪律**：移植一个能力后只改该卡片的「现状」段；发现研究结论有误，先改研究文档再同步卡片，不反向。
- **过期判断**：卡片头与 README 记上游 commit；上游升级先比 pin，没变就不重读。

## 明确不做

### 判出范围

- Cordis 运行时与 profile / bundle / patch 分层，以及 TypeScript 扩展宿主：借概念，不搬框架。
- preset roster 与信任模型、scope 父链与 `isolate` realm、HMR：都回本于大规模插件生态。
- 多 lane / 分支 / subagent、precise rewrite：与 wo-agent 单线会话定位冲突（`CLAUDE.md` 判停）。
- OAuth 与云凭据、模型目录生成、数十家 provider 适配：个人场景与当前 provider 数不支持。
- 全量 skill 生态、产品级 subagent、沙箱升权：会把项目做成小 Claude Code，定位闸门直接拒绝。

### 只留卡片

entry tree / lane / fork 与 SQLite 后端；模型能力协商与跨 provider 消息变换（等第二个 provider）；Api 层拆分；canonical output 与 presentation 契约；post-execute 各插件；sandbox seam；permission preset；usage ledger 的独立形态（用量并入 LLM 层计量）。

### 本路线之外、仍待显形

- 子智能体与后台任务对个人 skill 库的形态。
- 设置、遥测、会话检索是否值得在 wo-agent 落地，还是只留卡片。
- TUI 之外的入口（RPC、SDK、ACP）是否必要。
- 个人知识与 skill 库的载体形态：仓库内 notes、独立知识库，还是技能仓。

这些不阻塞本路线；显形后再决定是否另开地图。
