# Matt Pocock Skills 阅读路线

范围：`reference/mattpocock-skills/`。**只读，不改**（这里只是取材）。
路径均相对 `reference/mattpocock-skills/`。编号 = 读序，按编号读；想按文件夹翻，见文末「按目录速查」。
译文落在 `docs/learn-mattpocock/translate/`，编号与此处一致；目录里那篇 `README.md` 记了翻译约定（代码块与标识符按英文原样保留、术语首次出现附英文原词、原文的兄弟文档链接改指本仓库英文原文）与**与上游的同步记录**。

> **快照状态**：`reference/` 已于 2026-10-13 从 `c55ee46`（09-18）整体更新到 `49dd158`（10-09），并已移出 `.gitignore`、纳入版本管理。影响本路线的三处变化：① `resolving-merge-conflicts`（第 18 篇）被上游删除；② `domain-modeling/CONTEXT-FORMAT.md` 改名 `GLOSSARY-FORMAT.md`，全文的 `CONTEXT.md` 一律改叫 `GLOSSARY.md`；③ 上游把 `retro` / `pr` / `implement-spec` 提升进 `engineering/`，本路线相应增补第 37–39 篇。

**这份路线的筛选原则**（与 Superpowers 那份不同，这里不是全套通读）：

- **只取核心与未废弃**：`skills/engineering/` + `skills/productivity/`（作者所谓 promoted 桶）里，与「agent 流程该怎么设计」直接相关的部分。`skills/misc/`、`skills/in-progress/`、`skills/deprecated/` 全部不读（`deprecated/` 目前是空的，作者说退役的技能直接删、由 changeset 记录替代者）。
- **跳过工具适配层**：Claude Code / Codex 的安装、插件清单、每个技能旁的 `agents/openai.yaml`（含它的 `policy.allow_implicit_invocation`）、`.claude-plugin/`、`scripts/*.sh` 这类平台细节，全部跳过。只在理解「user-invoked 与 model-invoked 这条分轴」时读一次 `invocation.md`，读完即止。
- **跳过面向人的文档页**：`docs/engineering/*.md`、`docs/productivity/*.md` 是给人类读者写的介绍页（四个小节：What it does / When to reach for it / Common questions / It's working if），技巧含量低于 `SKILL.md` 本体，全跳。
- **跳过写作教学线**：`skills/productivity/teach/`、`writing-beats` / `writing-fragments` / `writing-shape`（写文章用的），与 Lodestar 无关。
- **保留判断**：`wizard` / `to-questionnaire` / `handoff` / `prototype` 看起来像「外围」，但它们是作者对「人类必须亲自做的那一步该怎么交给 agent 编排」的答案，属于流程思考，保留。

## 0. 先装地图（三份，读完再往下）

- [ ] **01** `skills/engineering/ask-matt/SKILL.md` — **本文档最重要的一篇**。作者的流程总图：一条 main flow（idea → ship）、两条 on-ramp、一个 codebase health 环，加上「Vocabulary underneath」两层词汇表。90 行，看到的不只是技能清单，而是他把整个开发生命周期切成了哪几段、每段的产物是什么。
- [ ] **02** `skills/engineering/ask-matt/PHASE-BOUNDARIES.md` — 会话内的**阶段边界决策树**。五个选项（Continue / `/clear` / `/handoff` / Subagent / `/compact`），五个按序提问，外加「primary source vs secondary source」的代价模型。这是作者对「上下文该在什么时候断」的完整回答，Lodestar 最该对照的一块。
- [ ] **03** `.agents/invocation.md` — 唯一的**正交分轴**：user-invoked vs model-invoked。为什么有些技能故意不让模型自己触发、`description` 是面向人还是面向模型、技能之间怎么互相调用（写「Call the Skill tool with X」，不写 `../other/FILE.md`）。26 行，读完这个轴，后面所有技能的 frontmatter 才读得懂。

## 1. 提问原语（把模糊需求逼成决策）

- [ ] **04** `skills/productivity/grilling/SKILL.md` — **全套的地基**。`design tree` + `rounds` + `frontier` 三个词定义了作者所有的提问法：一轮问完整条 frontier、每题附推荐答案、事实是 agent 的活、决策是用户的活。28 行，Superpowers 的 brainstorming 干的是同一件事，但这里的模型更小、更可复用。
- [ ] **05** `skills/productivity/grill-me/SKILL.md` — 7 行，`grilling` 的无状态外壳（不在工作目录里时用）。
- [ ] **06** `skills/engineering/grill-with-docs/SKILL.md` — 7 行，`grilling` 的有状态外壳：同一个提问，但边走边写 `CONTEXT.md` 与 ADR。**对比 05 读**，这一对是作者「包装层只做一件事」的样板。

## 2. 计划与工单（把决策落成可执行的形状）

- [ ] **07** `skills/engineering/to-spec/SKILL.md` — 把当前对话**合成**成 spec 并发到 issue tracker。定义性约束：**不再访谈**（访谈已经在 grilling 阶段做完了）。里面的 spec 模板（Problem / Solution / User Stories / Implementation Decisions / Testing Decisions / Out of Scope）是直接可用的产物格式，注意它明确禁止写文件路径和代码片段。
- [ ] **08** `skills/engineering/to-tickets/SKILL.md` — 把 plan/spec/对话切成 **tracer bullet 工单**，每个要声明自己的 **blocking edges**。核心是 `vertical-slice-rules` 四条 + 「wide refactor 是垂直切分的例外」那段 expand–contract 编排。**agent 流程设计者最该读的一篇**：它定义了什么算「一个 agent 能独立干完的活」。
- [ ] **09** `skills/engineering/wayfinder/SKILL.md` — 一个会话装不下的巨型工作怎么规划。核心词汇：`destination` / `map` / `decision ticket` / `fog of war` / `frontier` / `HITL vs AFK`。「plan, don't do」和「fog or ticket?」两段是纯粹的方法论，与 issue tracker 无关，可以抽出来用在 Lodestar 上。
- [ ] **10** `skills/engineering/triage/SKILL.md` — 把外部进来的 issue 推过一台小状态机（2 个 category 角色 + 5 个 state 角色）。价值在两处：状态机本身，以及「先验证 claim 再写 brief」的纪律。
- [ ] **11** `skills/engineering/triage/AGENT-BRIEF.md` — **agent brief 的写法**：durability over precision（不写路径行号）、behavioral not procedural（写 what 不写 how）、complete acceptance criteria、explicit scope boundaries。附一份好 brief（bug / enhancement / PR）与一份坏 brief 的对照。这是「给 agent 的任务书长什么样」的完整答案。
- [ ] **12** `skills/engineering/triage/OUT-OF-SCOPE.md` — 被拒需求的持久化知识库（`.out-of-scope/`）。机制很小，但「institutional memory + dedup」这个思路对任何 agent 分发系统都成立。

## 3. 执行主链路（干活这一侧）

- [ ] **13** `skills/engineering/implement/SKILL.md` — 15 行，全链路最短的一篇，却是枢纽：用 `/tdd` 在**事先议定的 seam** 上实现 → 定期 typecheck / 单测 → 最后跑全量 → `/code-review` → 提交。看它有多短：说明作者把复杂度都推给了 `tdd` 和 `code-review`。
- [ ] **14** `skills/engineering/tdd/SKILL.md` — red → green 循环的参考。重点是三件事：**seam** 必须先与用户议定、三个 anti-pattern（implementation-coupled / tautological / horizontal slicing）、以及「refactoring 不属于这个循环」。
- [ ] **15** `skills/engineering/tdd/tests.md` — 好测试 vs 坏测试的代码对照，短。
- [ ] **16** `skills/engineering/tdd/mocking.md` — 什么时候才 mock（只在系统边界），以及为了可 mock 该怎么设计接口。
- [ ] **17** `skills/engineering/code-review/SKILL.md` — **两轴评审**：Standards（是否符合本仓规范）+ Spec（是否忠实实现了来源 issue）。两轴各派一个 subagent 并行跑、**刻意不合并不重排**，因为「一轴会掩盖另一轴」。附 12 条 Fowler 坏味道基线（都标注为 judgement call，且仓库规范永远优先）。
- [ ] **18** ~~`skills/engineering/resolving-merge-conflicts/SKILL.md`~~ — **已废弃**：上游在本次同步前已删除该技能，目录不复存在。原内容是「用 **intent**（回溯到每一侧的 primary source）逐 hunk 解冲突，绝不 `--abort`」，译文（第 18 篇）保留作历史参考。

## 4. 支撑纪律（横向能力，可独立取用）

- [ ] **19** `skills/productivity/writing-for-agents/SKILL.md` — **元技能：给 agent 写文档**。全套理论密度最高的一篇。核心概念：**context pointer**（指针的措辞而非目标决定触发率）、**两种 load**（context load / cognitive load）、**information hierarchy**（in-file step / in-file reference / disclosed reference）、**leading words**（用预训练里已有的词当锚，以及否定式为何有害）、以及完整的 **pruning** 清单（single source of truth / cache / relevance / sediment / no-ops）。Lodestar 要写的每一条「法」都该过这一套标准。
- [ ] **20** `skills/productivity/writing-for-agents/SKILL-MECHANICS.md` — 上面那篇的技能专章：invocation 二选一怎么权衡、什么时候该拆技能、router 技能是什么。
- [ ] **21** `skills/engineering/domain-modeling/SKILL.md` — **主动**维护项目的领域模型（区别于「只是读 `CONTEXT.md`」）：挑战术语、用具体场景压测、与代码交叉验证、就地更新。重点是那句「`CONTEXT.md` 是词汇表，不是 spec、不是草稿纸」。
- [ ] **22** `skills/engineering/domain-modeling/CONTEXT-FORMAT.md` — `CONTEXT.md` / `CONTEXT-MAP.md` 的格式与规则。
- [ ] **23** `skills/engineering/domain-modeling/ADR-FORMAT.md` — ADR 的极简模板，以及**三个条件同时成立才写 ADR** 的判据。
- [ ] **24** `skills/engineering/codebase-design/SKILL.md` — **deep module** 词汇表：module / interface / implementation / depth / seam / adapter / leverage / locality。含 deletion test、「接口就是测试面」、「一个 adapter 是假 seam，两个才是真 seam」。作者刻意先把几个被滥用的词（component / service / API / boundary）列为 _Avoid_。
- [ ] **25** ├ `codebase-design/DEEPENING.md` — 依赖的四个类别决定接缝怎么测；seam 纪律；replace-don't-layer。
- [ ] **26** └ `codebase-design/DESIGN-IT-TWICE.md` — 派 3+ 个并行 subagent，各带**不同的设计约束**画出激进不同的接口，再由你来比较、给强判断。
- [ ] **27** `skills/engineering/diagnosing-bugs/SKILL.md` — 六阶段诊断循环。**Phase 1 就是全部**：先造出一个「**tight** 且能对这个 bug 变红」的反馈回路，否则不许进入假设阶段。含「非确定性 bug 的目标是提高复现率而非干净复现」与「没有正确 seam 本身就是发现」两条硬观点。
- [ ] **28** `skills/engineering/improve-codebase-architecture/SKILL.md` — 定期巡检代码库、找「深化机会」、以 HTML 报告呈现、再对选中的那个开 grilling。注意 YAGNI 的范围收缩（先看 git log 的热点）与「这是 survey，不是 rescue」。
- [ ] **29** `skills/engineering/prototype/SKILL.md` — 一次性原型回答一个设计问题。两条分支（逻辑 / UI）怎么选，以及「throwaway 是对代码写法的约束，不是销毁承诺」——原型的答案并进真代码、原型本身作为 **primary source** 留在分支上。
- [ ] **30** ├ `prototype/LOGIC.md` — 单个自包含 HTML：纯模块可整块搬进真代码，页面壳是可丢的。
- [ ] **31** └ `prototype/UI.md` — 单路由挂多个激进不同的 UI 变体，`?variant=` + 浮动底栏切换。
- [ ] **32** `skills/engineering/research/SKILL.md` — 12 行：后台 agent 查一手资料，落成一份带引用的 Markdown。短，但「primary sources、每条断言回溯到拥有它的源头」这个标准值得抄。
- [ ] **33** `skills/productivity/handoff/SKILL.md` — 把当前对话压成交接文档。两条规则值得注意：**不重复已有产物**（spec/plan/ADR/commit 一律引用路径），以及文档里要写一节「suggested skills」。
- [ ] **34** `skills/productivity/wait-what/SKILL.md` — 7 行。消息没听懂时的纠正指令：重新讲一遍、补上下文、用简化技术英语、用 `CONTEXT.md` 的词汇。这是 21–23 那套词汇表的下游用法。
- [ ] **35** `skills/productivity/to-questionnaire/SKILL.md` — 「要问的人不在场」时的产物：把阻塞点变成给**别人**填的问卷。定义性约束：**grill 的是这次「投递」（给谁、要拿回什么），不是题目本身**。
- [ ] **36** `skills/engineering/wizard/SKILL.md` — 只有人类能做的步骤，生成一个交互式 bash 向导去带他做。看它的分工哲学：库部分每个向导都一模一样、不许手改；你的活只有划定阶段和写阶段内容。

## 4b. 同步增补（37–39，2026-10-13 加）

编号接在原 36 篇之后，不重排——它们不是原读序的一部分，而是上游把三个原本在 `in-progress/` 的技能提升进 `engineering/` 后补进来的。三篇都属「执行主链路」那一侧。

- [ ] **37** `skills/engineering/retro/SKILL.md` — 44 行，会话复盘。分类别去找改进候选（导航 / 自动化检查 / 编码标准 / 全局 AGENTS.md / 工具经济 / 空操作 / 信息获取），并给出两条判据：**机械性违规配确定性检查，判断题才写进 `CODING_STANDARDS.md`**；以及「**编码标准应由评审 agent 施加，而不是实现 agent**」（因为实现的上下文压力最大）。这是 Lodestar「缺 delta 记录」那一环的现成答案。
- [ ] **38** `skills/engineering/pr/SKILL.md` — 170 行，PR 正文的模板与写法。三节：**Summary**（挑能把关键点讲清楚的最小视图：伪代码 / 调用树 / 组件树 / 文件树 / Mermaid / diff）、**Evidence**（变更前后的具体证据，截图 S 级、执行输出 A 级）、**Merge Danger**（单行道还是双行道 + 爆炸半径）。注意它的出处：正文标明取自 Dex Horthy 的 `show-me` 技能。
- [ ] **39** `skills/engineering/implement-spec/SKILL.md` — 40 行，一次跑完整份 spec。把 ticket 读成**任务图**，在**前沿**上并行跑 implementer subagent（各在自己的 worktree），用 **merger subagent** 合并，最后在集成分支上跑一次 `code-review`。关键一句：subagent 之间**主要靠上下文指针通信，不重复指针已能拿到的信息**。

## 5. 现在不读（工具性 / 适配层 / 非核心桶）

| 类别 | 位置 | 为什么不读 |
|---|---|---|
| 插件与安装 | `README.md` 的 Installation 三节、`.claude-plugin/`、`.agents/install-block.md`、`scripts/link-skills.sh`、`scripts/sync-plugin-version.mjs`、`.changeset/`、`.github/` | 各 Harness 的安装、注册、发版流水 |
| Codex 适配 | 每个技能旁的 `agents/openai.yaml`、`.agents/adr/0002-ship-as-a-claude-code-plugin.md` | 平台 UI 元数据与「为什么先只做 Claude 插件」的决策 |
| 配置类技能 | `skills/engineering/setup-matt-pocock-skills/`（含 `issue-tracker-*.md`、`triage-labels.md`、`domain.md`） | 「每个仓跑一次」的落地配置；`domain.md` 里有价值的只有「缺文件就静默继续，不要报缺失、不要提前创建」这一条，已在 21 里覆盖 |
| 面向人的文档页 | `docs/engineering/*.md`、`docs/productivity/*.md`、`.agents/writing-docs.md` | 发布站点的页面规范（四个小节、绝对链接、不许署名作者），技巧含量低于 SKILL.md 本体 |
| 非核心桶 | `skills/misc/`（shoehorn、scaffold-exercises、setup-pre-commit、git-guardrails）、`skills/in-progress/` 的 `claude-handoff`、`loop-me`、`chief-of-staff` | 前两个是特定技术栈的迁移脚本；后三个尚未提升进 `engineering/`（`retro`、`pr`、`implement-spec` 已于本次同步提升，见 37–39） |
| 写作教学线 | `skills/productivity/teach/` 及四个 FORMAT 文件 | 「多会话教一个人」的完整体系，与 agent 流程设计无关 |
| 仓库自述 | `README.md` 的 Why These Skills Exist 四节、`AGENTS.md`、`CLAUDE.md`、`CHANGELOG.md`、`GLOSSARY.md` | 值得在「想知道作者为什么这样分工」时反查：四个失败模式（没对齐 / 太啰嗦 / 代码不 work / 泥球）正是 01–03 那条主链的动机来源 |

## 按目录速查

```
skills/engineering/ask-matt/                        → 01 02
.agents/invocation.md                               → 03
skills/productivity/grilling/                       → 04
skills/productivity/grill-me/                       → 05
skills/engineering/grill-with-docs/                 → 06
skills/engineering/to-spec/                         → 07
skills/engineering/to-tickets/                      → 08
skills/engineering/wayfinder/                       → 09
skills/engineering/triage/                          → 10 11 12
skills/engineering/implement/                       → 13
skills/engineering/tdd/                             → 14 15 16
skills/engineering/code-review/                     → 17
skills/engineering/resolving-merge-conflicts/       → 18（已废弃）
skills/productivity/writing-for-agents/             → 19 20
skills/engineering/domain-modeling/                 → 21 22 23
skills/engineering/codebase-design/                 → 24 25 26
skills/engineering/diagnosing-bugs/                 → 27
skills/engineering/improve-codebase-architecture/   → 28
skills/engineering/prototype/                       → 29 30 31
skills/engineering/research/                        → 32
skills/productivity/handoff/                        → 33
skills/productivity/wait-what/                      → 34
skills/productivity/to-questionnaire/               → 35
skills/engineering/wizard/                          → 36

同步增补：
skills/engineering/retro/                           → 37
skills/engineering/pr/                              → 38
skills/engineering/implement-spec/                  → 39
```

## 读的时候盯住这五个问题（为 Lodestar 取材）

1. **一个技能的边界画在哪** —— 对比 `grill-me`（7 行）与 `grill-with-docs`（7 行）都只是「Call the Skill tool with X」的壳。作者把可复用纪律放在 model-invoked 技能里，把编排放在 user-invoked 技能里；这个切法决定了什么能被自动触发。
2. **「一次会话能装下多少」怎么被当成设计约束** —— `to-tickets` 要求每个切片能装进**一个全新上下文窗口**，`wayfinder` 要求每张工单能装进**一个 100K token 会话**，`ask-matt` 给出 **smart zone ≈ 150k**。这是作者整套切分逻辑的量纲，比任何「任务要小」的说法都硬。
3. **状态放在哪、以什么形状放** —— spec 进 issue tracker、工单进 issue tracker 或 `.scratch/`、领域词进 `CONTEXT.md`、决策进 ADR、拒绝进 `.out-of-scope/`、原型进 throwaway 分支、研究进带引用的 Markdown、交接进临时目录的 md。**没有一样留在对话里**。
4. **人机分工的接缝在哪** —— `HITL vs AFK`、`push right`（把 checkpoint 尽量往后推）、wizard（只有人能做的步骤）、to-questionnaire（知识在别人脑子里）、wait-what（沟通失败时的纠正）。作者反复在处理同一件事：**agent 不该替人做人的决定，也不该让人做 agent 能做的调查**。
5. **强制力从哪来** —— 与 Superpowers 的祈使句 + Red Flags 表不同，这一套几乎**不靠命令式语气**：靠的是**判据**（三个条件同时成立才写 ADR；一条命令已经跑过一次且能对这个 bug 变红）、**结构**（模板里的空位不填就交不出去）、**措辞**（`tight`、`deep`、`tracer bullet`、`red`、`relentless` 这些 leading word），以及**把不该发生的事从上下文里拿掉**（否定式会激活被禁行为，所以要正面指令）。这是 Lodestar 最该对照的一份样本。
