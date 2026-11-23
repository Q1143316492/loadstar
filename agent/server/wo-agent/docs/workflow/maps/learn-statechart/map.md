# learn-statechart

## 目的地

一套 `docs/learn-statechart/` 下的分步教程，一步一个文档，在 wo-agent 上从零走到三条验收：

1. 写出一个 wo-agent 模块的状态规格，TLC 跑得通；
2. 写出两条业务不变量，故意改坏代码时会报错（亲眼见过它失败）；
3. 把 TLC 给的最短反例翻译成 wo-agent 里的一个真实测试，跑得起来。

## 备注

- **领域**：形式化验证入门——状态迁移、不变量、安全性 / 活性、原子步、反例回放。借鉴材料见 `lodestar/docs/learn-pstack/statechart.md` 与同目录的 `statechart.html`；上游技能是 pstack 的 `statechart`，不在本地存档里。
- **载体**：wo-agent（Python 3.12，事件溯源，255 个测试，fake provider，无网络依赖）。
- **练习对象**（已定）：
  - `src/session/session.py:45-90` 的 `fold_surface` —— 纯 reducer，自带校验型不变量；
  - `src/agent/inbox.py:19-55` 的 `Inbox.claim` —— 两级队列 + 认领 + 取消语义。
- **本图覆盖执行**：本图默认只规划，但目的地本身就是产出文件，因此显式覆盖——地图清晰后按票的结论撰写 `docs/learn-statechart/` 下的步骤文档。执行仍受「一个会话一张票」约束。
- **术语**：沿用 `ticket` / `地图` / `接缝` / `钉住`。
- **不引入生产依赖**：教程用的工具（TLA+、hypothesis）不进入 wo-agent 的运行时依赖；是否进 dev 依赖见票 03。
- **限制**：协程 + provider 流让「整个 loop」不可穷举，教学对象锁定在纯函数上。

## 已定决策

<!-- 索引：每条已解决的 ticket 一行，细节缩进链接里的 ticket -->

- [定教程的步骤与文件结构](tickets/01-tutorial-steps-and-files.md)：按验收切而非按概念切，七篇文档（README + 五步 + 06 第二对象 + reference 查阅页）；代码给骨架、核心留空；理论只外链；每篇末尾标注认领哪条验收。
- [钉住两个练习对象的规格边界](tickets/02-pin-spec-boundaries.md)：建「未校验」模型让不变量抓违规、不设 rejected 态；`fold_surface` 建 `log`/`surface`/`shadowed` 三变量与两条核心不变量；`Inbox.claim` 两级队列都建模，只覆盖 claim 与 cancel。**五条决定是我定的，未经用户确认**，留待第 06 篇复核。
- [决定属性测试是否进 dev 依赖](tickets/03-property-testing-dependency.md)：教程阶段手写随机序列（固定种子），不加 `hypothesis`，示例代码放教程目录不进 `src/*/tests/`；重复写三次再改判。
- [研究 Windows 上的 TLA+ 工具链](tickets/04-research-tla-toolchain-windows.md)：winget 装 Temurin 21 + VS Code 扩展 `tlaplus.vscode-ide`（自带 TLC）；命令行用 `.vendor/tla/tla2tools.jar` v1.7.4。规格放 `docs/learn-statechart/specs/`，`states/` 与 `*.out` 忽略。
- [决定不变量清单](tickets/05-decide-invariants.md)：`fold_surface` 三条（无重复 seq、seq 指向真实事件、replace 的 start/end 不残留）；`Inbox` 三条（NoLoss、NoDoubleClaim、TypeOK）。已落地为 `examples/test_fold_surface.py` 与 `specs/Inbox.tla`；`InboxBroken.tla` 验证 NoLoss 可被违反，最短路径 3 步。

## 尚未明确

- **技能改造的判据**：是否把上游 `statechart` 改造成 `cwl-statechart`，以及改哪几条。要等你实际跑过两三次、知道哪条规则真有用之后才锋利。
- **教程与项目文档的关系**：`docs/learn-statechart/` 与 `docs/session.md`、`docs/agent.md` 是否加互链，还是保持独立。
- **第三阶段对象**：压缩事务（`src/compaction/engine.py:188-240`）要不要作为进阶练习。它的事务 + 失败路径比前两个对象复杂一档。
- **中文还是英文**：文档正文语言。默认中文，但 TLA+ 标识符与术语保留英文——这条要等第一份文档写出来才知道会不会别扭。

## 搁置（2026-11-24）

用户决定暂时搁置这张地图，以后有想法再回来。结论与未完成项记在 [`STATUS.md`](STATUS.md)：

- **价值判断已下**：在 `Inbox.claim` 这个对象上，这套方法与手写测试等价——实测真实状态空间只有 9 个（长度）／56 个（含顺序），现有 4 条测试改坏即红，穷举器没找到新缺陷。TLA+ 的适用条件是「两个以上独立变量 + 交错型 bug + 人写不完用例」，Inbox 三条都不满足。
- **未做的三件**：验收 3（反例回放到真代码）、活性 `PROPERTY`、状态图 / view 模块。教程 04 篇之后没有继续。
- **TLA+ 工具链已装好**：Java 21 LTS、`.vendor/tla/tla2tools.jar`、VS Code 扩展，随时可用。

## 超出范围

- 把整个 wo-agent loop（含协程、provider 流）形式化：状态空间不可穷举，且收益远低于成本。
- 把 TLA+ 或 TLC 引入 wo-agent 的运行时依赖或 CI 主流程。
- 改造 pstack 里 `statechart` 之外的技能。
- 为 wo-agent 建立通用的属性测试基础设施（票 03 只回答「这个仓库允不允许」，不回答「怎么铺开」）。
