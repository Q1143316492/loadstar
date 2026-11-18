# harness-evolution

## 目的地

一份 wo-agent 的 harness 演进路线 spec：按渐进顺序列出值得从 dsh 与 pi-agent 搬入的架构、每一步的接缝与验收、以及学习产物如何回流个人知识与个人 AI skill 库。配套定稿 `reference/harness-architectures/` 能力卡片的目录结构。

## 备注

- **领域**：agent harness 架构学习与移植。wo-agent 是纯 Python 学习型 harness，刻意对齐 dsh 的模块拆分；dsh 与 pi-agent 是两份本地参考实现。
- **学习目标**：迭代个人知识与个人 AI skill 库。产出不止于代码，也包括可复用的架构卡片与工作流技能。
- **闸门**：学习价值驱动、定位把关。wo-agent 的 `CLAUDE.md` 明确「不做大而全 agent」，判断标准是「可控规模的 Python 内核 + 极窄宿主」；不过关的架构只写参考卡片，不进移植路线。
- **参考上游**（只钉路径与 commit，不 vendor 源码）：
  - dsh：`d:\Unity\Src\DSH\deepseek-harness` @ `0a53fb55be`（Cordis 全插件，约 60 个包）
  - pi-agent：`d:\Unity\Src\DSH\pi-agent` @ `853a80d26`（分层 monorepo；`packages/agent/docs/harness.md` 是运行时规格）
  - pi 的源码阅读大纲在 `d:\Unity\Src\DSH\pi-agent\Docs\source-reading.md`（本地未提交）
- **环境事实**：wo-agent 的 `.venv` 只装了运行时依赖，未装 dev extras；跑测试前需 `pip install -e ".[dev]"`。
- **工作约定**：一个会话只解一张票（research 票除外）；HITL 票必须真的与用户对话，不能自问自答；产物一律中文，术语沿用 `ticket` / `地图` / `接缝` / `钉住`。

## 已定决策

- [定下地图的目的地与产出形态](tickets/01-define-destination-and-outputs.md)：只做路线决策不做实现；地图放 wo-agent；学习驱动、定位把关；参考目录用能力卡片、不 vendor 源码。
- [研究组合层与扩展机制](tickets/04-research-composition-extension.md)：dsh 是可逆依赖注入的服务图，pi 是会话绑定的模块注入；单宿主也回本的是 disposer、组合期校验、最小 waterfall 事件与纯数据 preset，其余分层机制判为生态级、不搬。
- [研究 LLM 接入层](tickets/03-research-llm-provider-layer.md)：pi 拆 Provider / Api / Models 三层，dsh 走 Cordis seam；wo-agent 已有同形分片协议，缺的是注册表调用点、auth 解析、usage 计量、错误分类与能力协商，Api 层拆分等第二个 provider 再做。
- [研究会话与崩溃恢复](tickets/02-research-session-durability.md)：dsh 恢复历史（补 balanced 边界再派生），pi 恢复意图（program counter 加 intent/settlement），wo-agent 是 turn 结束才全量落盘的快照；可搬的是效果前 checkpoint、合成 closers、torn-tail 恢复、intent 与预留 id、op 状态与 resume，分支与多 lane 判为与单线定位冲突。
- [研究工具管线与权限](tickets/05-research-tool-pipeline-permissions.md)：dsh 用分阶段管线和三态审批，pi 只有 before/after 钩子且不带权限系统；wo-agent 缺的是执行器级超时、审批 seam、并发标记与统一输出契约，个人场景的刚需是 bash 人工闸门加凭据清洗，sandbox 与 permission preset 只留卡片。
- [决定哪些架构进路线](tickets/06-decide-in-scope-capabilities.md)：持久性取 A 组加增量 append 与 intent；LLM 层取注册表、auth、usage 计量、错误分类；组合层取校验、disposer、skill 诊断；工具管线取三态审批、协作超时、错误码、并发标记、凭据清洗；分支/lane、能力协商、canonical output、sandbox、preset 只留卡片。

## 尚未明确

- 子智能体与后台任务（dsh 的 subagent / jobs / agent-team）对个人 skill 库是否有价值，形态如何——取决于「决定哪些架构进路线」的结论。
- 设置、凭据、遥测、会话检索是否值得在 wo-agent 里落地，还是只作为架构卡片记录。凭据解析已在 LLM 研究里列为候选接缝，其余三项仍待显形。
- TUI 之外的入口（pi 的 RPC 模式、dsh 的 SDK/ACP）对个人 skill 库是否必要。
- 个人知识与 skill 库的载体形态（仓库内 notes、独立知识库、技能仓），以及卡片如何被技能复用。研究已证明卡片能承载架构对照，载体形态仍未定。

## 超出范围

- 把 Cordis 或 TypeScript 生态本身移植到 Python；只借概念，不搬框架。
- 产品化发布：PyPI/npm、二进制分发、多平台打包。
- Web 客户端、VitePress 站点、浏览器端形态。
- 与 dsh / pi 的会话格式或插件协议保持兼容。
- 通用 agent 的 skill 生态、产品级 subagent、沙箱升权（`CLAUDE.md` 已判定停）。
- 性能基准与大规模并发优化。
