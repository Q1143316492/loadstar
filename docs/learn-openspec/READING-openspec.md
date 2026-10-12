# OpenSpec 阅读路线

范围：`reference/openspec/`。**只读，不改**（只是取材）。路径均相对 `reference/openspec/`。
编号 = 读序 = 译序。译文写到 `docs/learn-openspec/translate/NN-slug.md`，一篇源文件一篇译文，不改编号。

**本轮取材的靶子**：OpenSpec 是「一个 agent 如何被驱动走完一个变更生命周期」的完整样本 —— 它把**授权边界、状态落盘、评审时机、失败即停**这些通常散在提示词里靠自觉的东西，全部写成了可读的产物 + 一个只做计算的 CLI。核心看这层，工具适配（Claude Code / Codex / Cursor 的文件落点与调用拼写）全部跳过。

标记：`★★★` 必读必译 · `★★` 该读 · `★` 略读/用时再翻 · `⊘` 不译。带 `⌸` 的表示**脚手架/清单成分重**，翻译时保留代码块、正文可压缩。

> 一个可以先说的结论：**12 个 `SKILL.md` 里一个工具名都没有**（全文无 Claude / Codex / Cursor / Copilot 路径），工具差异全被隔离在生成层。所以「技能该怎么写」和「技能怎么装进某个工具」在这个仓库里是彻底分开的两件事 —— 正好符合本轮只要前者的取材需求。

---

## 0. 先装地图（3 篇，读完再往下）

- [ ] **01** `★★★` `README.md` — 只读四节：`Our philosophy` 五行纲领 / `Why OpenSpec?` / `How we compare`（对 Spec Kit、Kiro 的定位）/ `Usage Notes`。安装、Stores beta 宣传、Telemetry、Maintainers 全部跳过。**注意 `Context hygiene` 那两句**：作者自己承认这个流程吃上下文，要求开工前清窗。
- [ ] **02** `★★★` `docs/overview.md` — 7.4KB，「五个概念一页」。整页就是 `specs 是真值 / change 是一个工作单元 / delta 只描述变化 / artifact 互相喂养 / archive 把变化折回真值`，外加一节 **"Enablers, not gates"**（作者自己说这个词在整个项目里到处出现，专门解释一遍）。
- [ ] **03** `★★` `docs/README.md` — 7.5KB，文档地图。顺带示范了作者怎么按**读者处境**给入口（"我有问题但没方案" / "我有大存量代码" / "AI 刚写了计划，然后呢"）。末节 `The thirty-second version` 是整条主干的浓缩。

## 1. 主干：一个变更的生命周期（按流程顺序读，不要按目录读）

- [ ] **04** `★★★` `docs/concepts.md` — 25.2KB，长版概念页，概念密度最高的一篇。`Specs / Changes / Artifacts / Delta Specs / Schemas / Archive` 六节各自回答「为什么这样设计」。重点两处：**Delta Specs**（`ADDED / MODIFIED / REMOVED / Purpose` 四种段在归档时分别发生什么）、**Schemas**（artifact 依赖图 + "dependencies are enablers, not gates"）。`Artifacts` 一节里的示例文档 ⌸ 可压缩。
- [ ] **05** `★★★` `docs/how-commands-work.md` — 10.9KB。**只读前半**：为什么分成「CLI 是引擎 / slash command 是方向盘」两半，这个拆法换来什么、牺牲什么，以及「没有所谓 interactive mode」的澄清。中间那张 per-tool 语法表和后半的安装排查 ⊘ 跳过。
- [ ] **06** `★★★` `docs/explore.md` — 7.8KB。**无成本思考阶段**。最值得抄的是它替 agent 划的「不做什么」：不写代码、不自作主张开 change、**不问就不落任何文件**；以及「capture 只写你点名的 artifact，propose 写 schema 要求的全套」这个区别。末尾 `The honest tradeoffs` 明确说了什么时候**不该**用（已经很清楚的活儿，这一步是纯开销）。
- [ ] **07** `★★★` `docs/opsx.md` — 34.8KB，最重的一篇。`Why This Exists` 讲为什么要从硬编码提示词搬出来（"Instructions are hardcoded / All-or-nothing / Fixed structure / Black box"）；`Architecture Deep Dive` 是全文核心，对照 legacy vs OPSX 讲五件事：**Philosophy（phases vs actions）/ Component Architecture / Dependency Graph Model（含 BLOCKED→READY→DONE 状态转移）/ Information Flow（agent 三步查询：先问状态、再要指令、再读依赖）/ Iteration Model**。`Setup` 与 `Project Configuration` 的 YAML 细节 ⌸ 可压缩。
- [ ] **08** `★★★` `docs/workflows.md` — 18KB。两种 profile（`core` 六命令 / expanded 六命令）、三套工作模式（快速功能 / 探索式 / 并行变更）、**`/opsx:ff` vs `/opsx:continue`** 的选择表、**`update vs 新开 change`** 的判据与流程图、`verify` 的三维度（Completeness / Correctness / Coherence）。末尾 `Command Quick Reference` 一表收口。
- [ ] **09** `★★★` `docs/writing-specs.md` — 8.1KB。什么算好 requirement / 好 scenario、RFC 2119 力度词、四种 delta 段用错会怎样、**`Right-size the change`**（"作者最常见的错误不是措辞差，是一个 change 想干三件事"）。
- [ ] **10** `★★★` `docs/reviewing-changes.md` — 7.4KB。**两次评审**：propose 之后读计划、apply 之后 `/opsx:verify`。给了「按什么顺序读」（proposal → deltas → tasks，**错就早停**）、每个文件要回答的一个问题、以及一份两分钟清单。最狠的一句：价值最高的捕获是**发现漏写的**（"AI 忠实写下你说的，你的活儿是发现你忘了说的"）。末尾 `Right-size the review` 讲什么时候**不该**全走一遍。
- [ ] **11** `★★` `docs/editing-changes.md` — 6.2KB。"artifact 是活的计划，不是签过的合同"。含「我手改了代码怎么和 spec 对账」这一节（两个方向各自怎么收），以及「没有 update proposal 这个命令，因为不需要」。
- [ ] **12** `★` `docs/getting-started.md` — 10.3KB。完整首跑走查。⌸ 脚手架重（前半是安装输出与文件清单）。只有两节值得看：`Understanding Artifacts` 与 `How Delta Specs Work`。
- [ ] **13** `★★` `docs/existing-projects.md` — 7.8KB。存量代码库怎么落地：**绝不先补全文档**，只给每个 change 碰到的那一片写 spec，delta 累积久了自然长出全貌。含 `A few honest cautions`。
- [ ] **14** `★★` `docs/team-workflow.md` — 5.5KB。一条硬规则：**OpenSpec 不碰 git**（不 commit / 不 branch / 不 push，也不自动 clone store），所以它是嵌进你现有 PR 流程而不是取代它。含「归档放在 PR 合并前还是后」两种约定的取舍，以及「唯一会冲突的地方是 `specs/`」。
- [ ] **15** `★` `docs/examples.md` — 10KB。七份端到端对话实录（小功能 / 修 bug / 先探索 / 两个 change 并行 / 无行为变更的重构 / 逐步控制 / 全流程教学）。⌸ 想对着实物看流程时翻。

> 这一层约 140KB 正文，够一个下午。**读完 01–14，主干就完整了**：delta 驱动的真值模型 + 一个流体（非闸门）的 artifact 生命周期 + 两次人工评审。

## 2. 指令层：agent 实际拿到的提示词（最关键的一层）

skills 和 templates 是结论，这一层是**结论的写法本身**。翻译时逐字保留，不要改写。

- [ ] **16** `★★★` `schemas/spec-driven/schema.yaml` — 247 行，**整个仓库里最该逐字读的一个文件**。它用 YAML 把工作流定义成数据：四个 artifact 各自的 `requires` / `generates` / `template`，加一大段 `instruction:`（每个 artifact 的写作规程），末尾 `apply:` 段带 `requires: [tasks]` / `tracks: tasks.md` / 一句动态指令。**依赖图、状态机、提示词三者在这里是同一个文件。** 值得单独圈出的几句：
  - proposal：`The Capabilities section is critical. It creates the contract between proposal and specs phases.`
  - proposal：路径不许 agent 自己推 —— `planningHome.root comes from the ... --json response. ... Do not try to work out which case applies; the field already has.`
  - specs：`A spec is a behavior contract, not an implementation plan.` / `**CRITICAL**: Scenarios MUST use exactly 4 hashtags (####). Using 3 hashtags or bullets will fail silently.`
  - design：`Open questions are for genuinely deferrable unknowns, not decisions you skipped.` —— 这条把「没想清楚」和「可以晚点想」分开了
  - tasks：checkbox 是唯一进度真相 —— `A box holding only x counts as done... Every other marker, including - [~], - [-] and an empty - [] , reads as unfinished.`
  - tasks：`Do NOT collect testing or documentation into a final group - when a late group first exercises work from an early one, the failures cascade back through every group in between and force rework.`
- [ ] **17** `★★★` `skills/openspec-propose/SKILL.md` — 15.9KB。只看开头三段就值回票价：**`Planning boundary`**（"触发这个 workflow 的那次请求只授权规划，即使它说要动手"）、**`Store selection`**（作用域一旦选定就 sticky）、**`Project check`**（`"root": null` 是答案不是故障；并且按「用户点名 OpenSpec 还是你自己挑的」分两种处置 —— 自己挑的就静默放弃，用户点名的才问）。另有一处细节：status 只反映文件存在与否，所以 `applyRequires` 里的 artifact 报 `done` **不代表**它的依赖存在 —— 要用 `requires` 边而不是 `status` 来算所需集合。
- [ ] **18** `★★★` `skills/openspec-apply-change/SKILL.md` — 10.3KB。实现阶段。含 `blocked` / `all_done` / 正常三态处置、**pause 条件清单**、以及那段把三种输入分层的契约：`context` 是必读约束、`operationGuidance` 是可选建议、两者都**不得**覆盖 CLI 返回的受控值 —— 并自己声明 `These are prompt-level behavior contracts, not enforceable checks`。最硬的一条在 pause 清单里：任务需要超出 spec 描述的工作时，**必须把新增范围摆出来问，不许悄悄吸收**。
- [ ] **19** `★★★` `skills/openspec-explore/SKILL.md` — 22.3KB。全文最长的技能。开头直接否掉流程化：**`This is a stance, not a workflow. There are no fixed steps, no required sequence, no mandatory outputs.`** 然后给出整套**写操作确认协议**：任何有写入可能的动作（含 `openspec new change`）都要先说明将改哪些文件、提一个是/否问题、**等用户在另一条消息里确认**；并附三条反诡辩：`Silence is not acceptance`、`Answering design or clarifying questions is never consent to write`。
- [ ] **20** `★★★` `skills/openspec-update-change/SKILL.md` — 10.7KB。**改计划而不改代码**的独立技能。description 末句就是 `Never edits code.`。正文讲编辑如何反向波及（改 design 可能回推 proposal）、**每一处改动都要先确认**、草稿先留在对话里。最后一步极具设计感：`Point to the next step (guidance only - NEVER act on it)` —— 只指路不代跑。
- [ ] **21** `★★` `skills/openspec-verify-change/SKILL.md` — 17.5KB。三维度评审（Completeness / Correctness / Coherence）的提示词实现。注意它的三态：不是非黑即白的通过/失败，而是 `Not applicable` / `Not verified` / 失败，并且**任何一项被跳过就不许声称 ready**。它不写任何文件，报告本身就是交回给人的东西。
- [ ] **22** `★★` `skills/openspec-archive-change/SKILL.md` — 14.9KB。收尾：校验 artifact 与 task 完成度、可选 sync、移动目录。三种情况各要一次确认（artifact 不全 / task 未完成 / sync 路由）；`Cancel` 就是什么都不归档。JSON 模式下**每个交互点都变成一个 `archive_*` 错误码**，非交互设计得很干净。
- [ ] **23** `★★` `skills/openspec-sync-specs/SKILL.md` — 15.4KB。把 delta 折进主 spec 而**不**归档。看它怎么描述四种段各自的落法（`REMOVED` 要删、重命名的要原位改名、**delta 没提到的内容一律不许动**），以及遇到「新 capability 却写了 MODIFIED/RENAMED」时**停下来问**而不是自己编一条需求。
- [ ] **24** `★★` `skills/openspec-continue-change/SKILL.md` — 8.7KB。一次只造一个 artifact 的增量路线，与 17 的一次性路线对照读。每次调用只产出一个 artifact 然后**停**。
- [ ] **25** `★` `skills/openspec-new-change/SKILL.md` — 5.7KB。只搭骨架，第 6 步是无条件 STOP：`Do NOT create any artifacts yet`。
- [ ] **26** `★` `skills/openspec-ff-change/SKILL.md` — 10.9KB。**作为 17 的反面对照读**：同一套护栏，确认密度相反 —— 只在"critically unclear"时才问，其余"prefer making reasonable decisions to keep momentum"。同一个动作在两种技能里被赋予完全不同的打断频率，这个取舍本身就是要看的东西。
- [ ] **27** `★` `skills/openspec-bulk-archive-change/SKILL.md` — 21.5KB。批量归档。两个细节很值得抄：**绝不自动选中**（`Always prompt for selection, never auto-select`）、以及**派生值只算一次**（`Never recompute it here: a batch that runs past midnight would check one date in step 3 and move to another`）。冲突判定靠"代码里实际实现了什么"。取消就是不归档。
- [ ] **28** `★` `skills/openspec-onboard/SKILL.md` — 18KB。把整条流程带人走一遍的教学技能（11 个 phase）。**当作"流程怎么讲给人听"的范本读**：在探索演示后、proposal 草稿后、tasks 草稿后各停一次，且草稿先给人看再落盘。

> 16–24 读完，就拿到了「一个 agent 工作流该被怎么写下来」的完整样本；25–28 是同一套骨架的变体，用时再翻。
> 对照 `src/core/profiles.ts`：`CORE_WORKFLOWS = ['propose','explore','apply','update','sync','archive']`，`ALL_WORKFLOWS` 再加 `new, continue, ff, bulk-archive, verify, onboard` —— 即上面 17/19/18/20/23/22 是默认档，25/24/26/27/21/28 是要手动开的扩展档。

## 3. 状态层与引擎（CLI 那一半，按需深挖）

这一层回答：**谁有权算状态、agent 能看见什么**。不必按序，按你要验证的机制挑。

- [ ] **29** `★★` `⌸` `docs/agent-contract.md` — 17.1KB。CLI 对 agent 暴露的全部 JSON 形状。正文推理不多，但三节值得读：§1 `General conventions`（**一次调用恰好一份 JSON**、人类话术全走 stderr）、§3 `Root selection and RootOutput`（**一条解析优先级阶梯**：`--store` → 最近祖先 → 声明的 store → 全局默认 → implicit）、§5 `Exit-code contract`（**健康告警也是 0**）。末尾 `Known inconsistencies` 是作者自列的欠债清单，很能看出取舍。其余 JSON 形状表用时再查。
- [ ] **30** `★★★` `src/core/artifact-graph/` — 8 个文件共约 55KB，**小而读得动**，是整个流程的发动机。建议顺序：`types.ts`(3.0K) → `schema.ts`(6.3K) → `graph.ts`(6.1K) → `state.ts`(1.2K) → `outputs.ts`(5.9K) → `instruction-loader.ts`(19.1K) → `resolver.ts`(13.0K) → `index.ts`(1.2K)。**想照抄一套就照这一层抄。** 几个直接可搬的不变量：
  - `graph.ts`：拓扑序的**并列项按 schema 声明顺序打破，不按字母序** —— 注释明说按字母序会把 `design` 排到 `specs` 前面，和 schema 自己写的顺序打架。`getBuildOrder()` 的**第一项就是下一步该写的 artifact**。
  - `state.ts`：整个文件 37 行，**状态就是文件是否存在**。没有数据库、没有计数器。
  - `schema.ts`：加载时四道校验（id 不重复 → `requires` 存在 → `apply.requires` 存在 → 无环，且报完整环路 `A → B → A`）。有意思的是 `apply.tracks` **故意不校验**：`It is a path, not an id`，所以它错配只是 warning，不会让 schema 加载失败。
  - `types.ts`：`MAX_ARTIFACTS = 1000`，注释是"免得恶意 schema 把环路检测 DFS 顶穿 V8 栈"。
  - `instruction-loader.ts`：**CLI→agent 的交接点**。注入顺序明确为 `<context>` → `<rules>` → `<template>`。`skip_specs` 的处理很讲究：声明了它的 change 里，生成到 `specs/` 的 artifact 要**算作已完成**（否则会把 tasks 卡在永远不该存在的文件上），但单独标成 `skipped` 而不是 `done`。
- [ ] **31** `★★` `src/core/change-status-policy.ts`(3.1K) + `planning-home.ts`(2.9K) + `root-selection.ts` 的文件头注释 — **"下一步做什么"这件事被单独抽成了 100 行**。`ActionContext` = `{mode, sourceOfTruth, planningArtifacts, allowedEditRoots, constraints}`，是发给 agent 的机器可读作用域。一句不变量值得抄：`sentence` 与 `command` **在同一处生成**，所以文本面和 JSON 面永远不会指向不同的下一步。`planning-home.ts` 是"状态在磁盘上住哪"的答案（`kind` 现在只剩 `'repo'`，其它变体被刻意收敛掉了）。`root-selection.ts` 只看文件头那段注释就够了 —— 它把整条优先级阶梯写成了一段散文。
- [ ] **32** `★★` `openspec/specs/artifact-graph/spec.md` — 9.0KB。**项目自己给自己写的行为规格**，且 scenariio 里直接点名真实 API（`getBuildOrder()`、`getNextArtifacts()`、`getBlocked()`）。**与 30 并排读：规格和代码是同一个设计的两种语言。**
- [ ] **33** `★★` `openspec/specs/instruction-loader/spec.md` — 3.1KB。指令装载的行为契约，比源码短得多。
- [ ] **34** `★★` `openspec/specs/context-injection/spec.md` + `openspec/specs/rules-injection/spec.md` — 2.4K + 4.7K。项目上下文与逐 artifact 规则**怎么被注入**（包在什么标签里、插在指令的什么位置、多大上限）。**"给 agent 灌项目知识"最具体的一份实现。**
- [ ] **35** `★★` `openspec/specs/schema-resolution/spec.md` + `openspec/specs/change-creation/spec.md` — 9.0K + 2.7K。schema 三层覆盖链（项目本地 → 用户全局 → 包内置）、change 目录怎么被造出来。
- [ ] **36** `★★` `openspec/specs/cli-artifact-workflow/spec.md` + `openspec/specs/docs-agent-instructions/spec.md` — 14.7K + 4.0K。前者是 `status`/`instructions` 的行为契约；后者是**"给 agent 看的文档必须长什么样"** —— 这一篇的选题本身就很少见。
- [ ] **37** `★★★` `docs/customization.md` — 15.1KB。**自定义的四层边界**（project config → context → rules → schema），以及 `Adding a Review Artifact` 这个完整示例（往依赖图里插一个自造的评审环节）。写自己的工作流时，这一篇是最近的模板。`Community Schemas` 一节 ⊘ 跳过。
- [ ] **38** `★★` `src/core/project-config.ts` 的文件头与 schema 定义（22.6K，只需读前 100 行左右）+ `src/core/references.ts` 的文件头 + `src/utils/change-metadata.ts`(12.3K) — 三件事：①`openspec/config.yaml` 的字段与它为什么用 Zod（"文档化结构 / 类型 / 运行时校验"）；②跨仓上下文**只给索引不给正文**（`Content is never inlined; root resolution is never affected; problems degrade to warning diagnostics instead of failing generation`）；③`.openspec.yaml` 读写校验那半边的不变量：**`validate` 和 `archive` 绝不能认可 CLI 其它部分拒绝的元数据，双向都不行**。
- [ ] **39** `★★★` `src/core/templates/workflows/` — **生成第 2 节那 12 个技能的模板层**。这才是"技能"的真正源码（`skills/` 下的文件是生成物，`skills/README.md` 自己说 `do not edit by hand`）。挑四个读：`propose.ts`(27.9K) / `apply-change.ts`(9.9K) / `continue-change.ts`(13.2K)，加 `src/core/templates/optional-workflow.ts`(7.3K)。最后一篇解决一个很实际的问题：**同一个技能在 core 档和 expanded 档下要给不同指令**，它的做法是**在生成期就把分支定下来**（`[[opsx:if-workflow X]]...[[opsx:else]]...[[opsx:end]]`），而不是让模型运行时自己判断某个命令装没装 —— `so the generated file states one path instead of asking the model to check availability at runtime`。另外注意 `skills/` 里存的是**展开版**，所以 18 号那份 apply 技能在 core 档安装时会被改写成 CLI 兜底。
- [ ] **40** `★` `⌸` `docs/commands.md` — 24.4KB。每个 `/opsx:*` 的详细参考。`Command Syntax by AI Tool` 与 `Legacy Commands` 两节 ⊘ 跳过。用时反查。

## 4. 自举：格式实物 + 一次「加过头再砍回来」

同一批人，在同一个仓库上，先后长出了**四代流程产物形态**，而且自己承认中间那代做过头了。这段轨迹比任何一篇设计文档都更能说明「哪一层是真正必要的」。

- [ ] **41** `★★★` `openspec/config.yaml`(1.8K) + `openspec/changes/add-status-next-step/`(5.4K) + `openspec/changes/fix-schemas-root-selection/`(16.6K) — **先看格式实物**。`config.yaml` 是最小的 context/rules 注入实例（36 行，`rules:` 按 artifact id 分组）。`add-status-next-step/proposal.md` 是一份模范 proposal：`## Why` 引了真实缺陷编号，`## What Changes` 明确写出它**不**引入新命令/新参数/新 JSON 字段（`This renders a value the agent contract already publishes.`），`## Impact` 点明受影响的 spec、代码文件与文档。`fix-schemas-root-selection/` 是一份**尺寸读得动的完整四件套**（proposal 2.4K + design 6.8K + spec 4.2K + tasks 3.1K），当作"一个 change 长什么样"的标准答案。
- [ ] **42** `★★` `openspec/explorations/` — 5 篇纯探索产物（共 117KB）：`explore-workflow-ux.md`(5K)、`workspace-architecture.md`(33K)、`workspace-roadmap.md`(10K)、`workspace-user-journeys.md`(54K)、`workspace-ux-simplification.md`(12K)。**"探索阶段该落什么盘"的实物样本**，也是 19 号 explore 技能允许的落盘的极端形态。
- [ ] **43** `★★` `openspec/initiatives/context-store-and-initiatives/` — 20 个 work item。**注意：这一代已经被作者自己判为历史。** 它的 `README.md` 开头就写 `Status: transition evidence / beta history.` 以及 `It is not the active product roadmap or implementation queue.`，并把读者指向 `work/goal.md`。它的 `## Reading Order` 一节自己规定了读序（**按这个读，不要按目录读**）：`direction-git-native-work.md`（从旧 beta 模型转向 Git-native 的过渡笔记）→ `direction.md` → `roadmap.md` → `tasks.md` → `decisions.md` → `questions.md` → `work-items/<id>/`。
  读它的价值在于**看清被砍掉的那一版长什么样**。README 末尾并排留着两代纲领，对照极清楚：
  ```text
  旧：Context stores sync truth. / Collections shape truth.
      Initiatives coordinate work. / Workspaces open local views.
      Changes implement repo-owned slices.
  新：OpenSpec is a Git-native artifact format for specs and work.
      Specs are what is true. / Work is what is in motion.
  ```
  另外两条硬规则：`If it conflicts with the current goal.md, the current goal.md wins.`，以及 `Do not rewrite specs for future intent until behavior changes with an implementation slice.`
  还要注意每个 work item 都要交一份 **`evidence.md`**，`work-items/NN-*/{plan.md,tasks.md,evidence.md}` —— 这是"完成"的定义从"勾掉"变成"给出证据"。**对照 44 读，不要单独读。**
- [ ] **44** `★★★` `openspec/work/` — **砍回来之后的新形态，本段的高潮。** 先读两个小文件：`README.md`(2.7K) 给出四层模型 **`goal → roadmap → slice → result`**，`slices/<id>/{spec.md, plan.md, result.md, log.md?}`，配一句格言 `spec.md says what must be true. plan.md says how we intend to get there. result.md says what actually happened.`；`AGENTS.md`(1.3K) 把产品重新定义为**两个用户**（会下指令的人 / 需要"清晰意图、可发现状态、无歧义下一步"的 agent），并断言 **`Good human UX is usually good agent UX`**，最后给了一个五问重构框架：*人想要什么？agent 需要知道什么？活儿住在哪？磁盘上什么变了？用户怎么知道成了？*
  再读 `goal.md`(3.1K) —— 里面写着这次收缩的方向：`Specs are what is true. Work is what is in motion.` 以及 `The product should not require context stores, workspaces, or another state system as primary user-facing concepts.` **这就是"上一代加出来的那堆 machinery 被明确判为非必要"的原话。** 然后按兴趣挑 `runbook.md`(13.9K)、`capstone/`（`gauntlet` / `journeys` / `release-readiness` / `technical-audits` / `usability-audits`）、以及 `slices/<slice>/{plan.md,spec.md}`（11 个 slice，最大的 `personal-worksets` 有 plan 18.7K + spec 34.0K + research 20.4K）。**`capstone + slices` 是比 artifact DAG 更粗的一层骨架，而 `runbook.md` 这类文件在 spec-driven schema 里根本没有对应物** —— 说明 schema 确实被扩过，而且扩的方向是"更少更粗"。
- [ ] **45** `★★` `docs-lab/message-map.md` — 10.4KB。一份把「文档必须回答的问题」列成清单、逐行指派归属页、并标 `Answered / Skeleton / Gap` 的覆盖矩阵。**这是"给 agent 看的文档怎么验收"**：把"该回答什么"变成可清点的行，而不是靠感觉。思路可以直接搬到自己技能库上。
- [ ] **46** `★` `docs-lab/README.md` — 20.6KB。45 的反向索引（页面 → 它负责回答什么），兼作下一代文档结构的设计稿。
- [ ] **47** `★` `docs-lab/reference/schemas/schema-yaml.md` + `docs-lab/reference/schemas/spec-driven/index.md` — 9.1K + 19.8K。schema 格式的字段级参考，以及 spec-driven 会生成什么的参考。是 16 的展开版，自己动手写 schema 时读。

## 5. 现在不读（工具性 / 实现 / 过程性，读了也是负担）

| 类别 | 位置 | 为什么不读 |
|---|---|---|
| 工具适配 | `docs/supported-tools.md`(18K)、`docs/installation.md`、`docs-lab/reference/supported-tools.md`、`src/core/command-generation/`（含 `adapters/` 37 个工具适配器）、`src/core/github-copilot/`、`src/core/available-tools.ts`、`src/core/shared-skill-target.ts`、`src/core/init.ts`(61K)、`website/` | 30+ 工具的调用拼写与文件落点（Claude Code / Codex / Cursor / Copilot / Amazon Q…）。**本轮明确跳过的一层。** 注意 `init.ts` 有 61KB，几乎全是工具安装路径。 |
| CLI 参考 | `docs/cli.md`(48K)、`docs-lab/reference/cli.md`(75K)、`src/commands/`(23 文件)、`src/ui/`、`src/utils/`（除 38 号点名的 `change-metadata.ts`）、`src/cli/`、`src/prompts/` | 终端命令与参数细节。需要时反查，不通读。`docs/cli.md` 的 `Human vs Agent Commands` 一节例外，值得扫一眼。 |
| 脚手架实现 | `src/core/{archive,update,legacy-cleanup,specs-apply,version-check,migration}.ts`（各 23–101KB）、`src/core/validation/`、`src/core/{completions,converters,parsers,styles,templates(除 workflows/),store,change-metadata,worksets,openers}/`、`scripts/`、`test/`（约 300 文件） | 实现细节而非设计意图。要深挖某个机制时，读对应的 `openspec/specs/<capability>/spec.md` 更快也更准。 |
| Store / workspace 机制 | `src/core/store/`(operations 41K + registry 13.6K + git 9.9K + foundation 11K)、`docs/stores-beta/user-guide.md`(18.4K)、`openspec/specs/cli-{archive,init,update,validate,completion,config,feedback,spec,show,list,change,view}/spec.md` | 跨仓规划那一套（store / workset / workspace）。**注意：这一套正在被 44 号里那句话判为非必要**，作为"复杂度教训"读还行，作为设计参考不合适。`user-guide.md` 里唯一值得的是一句设计原则：declarations are not machinery —— 声明本身不改变命令作用在哪。 |
| 配置与排错 | `docs/troubleshooting.md`、`docs/migration-guide.md`、`docs/multi-language.md`、`docs/faq.md`、`docs/glossary.md`、`docs/community.md`、`CHANGELOG.md`、`README_OLD.md`、`.changeset/`、`.github/`、`flake.nix`、`flake.lock`、`.devcontainer/`、`CONTRIBUTING.md`、`MAINTAINERS.md`、`SECURITY.md`、`package.json`、`build.js`、`vitest*.ts` | 安装排错、旧版迁移、发版与 CI。`glossary.md`(7.7K) 与 `faq.md`(11.5K) 仅在概念页读不懂时当字典翻。 |
| 遥测与补全 | `src/telemetry/`、`test/telemetry/`、`openspec/specs/telemetry/spec.md`、`openspec/specs/cli-completion/spec.md`、`src/core/completion-tip.ts` | 与 agent 流程无关。 |
| 文档重写实验室 | `docs-lab/` 里除 45/46/47 之外的全部（含 `guides/*`、`help/*`、`start/*`、`customize/*`、`multi-repo/*`、`reference/architecture/*`、`reference/cli.md`） | 正在进行的文档重写，多数是只有标题的空骨架（`reference/architecture/` 三篇**已确认是占位**，正文没写）。**注意 `docs-lab/customize/*` 与 `docs/customization.md` 内容重叠**，读后者即可；两套不要都读。 |
| 历史归档 | `openspec/changes/archive/**`（84 个 change，约 1.06MB） | 与 `openspec/specs/` 成对：specs 讲「现在必须怎样」，archive 讲「当初怎么改的」。长尾大半是 AI 工具支持（`add-cline-support`、`add-crush-support`、`add-windsurf-workflows`、`add-antigravity-support`、`fix-codebuddy-frontmatter-fields`…）。只在对某个机制的**来历**好奇时按名字捞。三个值得的例外：`2025-12-24-add-artifact-graph-core/design.md`(7.6K，依赖图的起源设计)、`2025-12-29-unify-change-state-model/design.md`(4.6K，为什么状态要统一)、`2025-08-19-adopt-delta-based-changes/`(delta 模型的出处)。 |
| 未落地提案 | `openspec/changes/` 下 27 个未归档目录（除 41 号点名的两个） | 进行中的提案，会变。`IMPLEMENTATION_ORDER.md` 只是排期。 |

## 按目录速查

```
README.md                                  → 01
docs/overview.md                           → 02
docs/README.md                             → 03
docs/concepts.md                           → 04
docs/how-commands-work.md                  → 05
docs/explore.md                            → 06
docs/opsx.md                               → 07
docs/workflows.md                          → 08
docs/writing-specs.md                      → 09
docs/reviewing-changes.md                  → 10
docs/editing-changes.md                    → 11
docs/getting-started.md                    → 12
docs/existing-projects.md                  → 13
docs/team-workflow.md                      → 14
docs/examples.md                           → 15
schemas/spec-driven/schema.yaml            → 16
skills/openspec-propose/                   → 17
skills/openspec-apply-change/              → 18
skills/openspec-explore/                   → 19
skills/openspec-update-change/             → 20
skills/openspec-verify-change/             → 21
skills/openspec-archive-change/            → 22
skills/openspec-sync-specs/                → 23
skills/openspec-continue-change/           → 24
skills/openspec-new-change/                → 25
skills/openspec-ff-change/                 → 26
skills/openspec-bulk-archive-change/       → 27
skills/openspec-onboard/                   → 28
docs/agent-contract.md                     → 29
src/core/artifact-graph/                   → 30
src/core/change-status-policy.ts           → 31 (含 planning-home, root-selection 头部)
openspec/specs/artifact-graph/             → 32
openspec/specs/instruction-loader/         → 33
openspec/specs/context-injection/          → 34 (含 rules-injection)
openspec/specs/schema-resolution/          → 35 (含 change-creation)
openspec/specs/cli-artifact-workflow/      → 36 (含 docs-agent-instructions)
docs/customization.md                      → 37
src/core/project-config.ts                 → 38 (含 references.ts, utils/change-metadata.ts)
src/core/templates/                        → 39 (workflows/ + optional-workflow.ts)
docs/commands.md                           → 40
openspec/config.yaml + changes/            → 41
openspec/explorations/                     → 42
openspec/initiatives/                      → 43  (已退役那一代)
openspec/work/                              → 44  (新形态：goal/roadmap/slice/result)
docs-lab/message-map.md                    → 45
docs-lab/README.md                         → 46
docs-lab/reference/schemas/                → 47
```

## 译文对照（`docs/learn-openspec/translate/`）

编号与文件不再一一对应：**31 并入了 30**，**32–36 合译成一件**，第 4 章几项是多源合译。落地情况如下。体例对齐 `docs/learn-superpowers/translate/`：文件头标注源路径与原文行数、frontmatter 与代码块原样保留、只译正文、不写注解。

| 路线项 | 译文文件 | 落地说明 |
|---|---|---|
| 01 | `01-readme.md` | 只译四节（安装 / Quick Start / Docs 索引 / Telemetry 略） |
| 02–04 | `02-overview.md` `03-docs-readme.md` `04-concepts.md` | 全文 |
| 05 | `05-how-commands-work.md` | 略 per-tool 语法表、安装排查、首个 clean run |
| 06 | `06-explore.md` | 全文 |
| 07 | `07-opsx.md` | `Setup` 压缩；`Project Configuration` 保留注入机制、略其 Troubleshooting |
| 08–11 | `08-workflows.md` `09-writing-specs.md` `10-reviewing-changes.md` `11-editing-changes.md` | 全文 |
| 12 | `12-getting-started.md` | 安装输出 / 文件清单压缩，`Understanding Artifacts` 与 `How Delta Specs Work` 全译 |
| 13–15 | `13-existing-projects.md` `14-team-workflow.md` `15-examples.md` | 全文 |
| 16 | `16-schema-yaml.md` | YAML 拆成按 artifact 分节 ＋ 四个 template 附录（原样） |
| 17–29 | `17-propose.md` … `29-agent-contract.md` | 一键一件；技能类含 frontmatter 原样列表 |
| **30 + 31** | `30-artifact-graph.md` | **合并**：30.1–30.8 为 `artifact-graph/` 八个文件，30.9–30.11 为 31 的 `change-status-policy.ts` / `planning-home.ts` / `root-selection.ts` 文件头。源码阅读稿：导出签名与英文注释原文照录，只译注释正文 |
| **32–36** | `32-36-openspec-specs.md` | **合译**八篇自举行为规格；`## Purpose` / `### Requirement:` / `#### Scenario:` 等 spec 语法原样保留 |
| 37 | `37-customization.md` | 全文（`Community Schemas` 简译） |
| 38 | `38-prompt-injection-layer.md` | 源码阅读稿：`project-config.ts` / `references.ts` / `utils/change-metadata.ts` |
| 39 | `39-template-layer.md` | 源码阅读稿：生成那 12 个 `SKILL.md` 的模板层 |
| 40 | `40-commands.md` | 只译 `Quick Reference` + `Command Reference` + `Next Steps`；略 `Command Syntax by AI Tool` / `Legacy Commands` / `Troubleshooting` |
| 41 | `41-format-in-practice.md` | 多源合译：`config.yaml` ＋ 两个真实 change 目录 |
| 42 | `42-explorations.md` | 五篇合译；仅 `workspace-user-journeys.md` 的 `## Edge Cases` 14 条同形状条目压缩 |
| 43 | `43-initiatives.md` | 多源合译；按源 `## Reading Order` 排序；20 个 work item 只全译一个有代表性的，其余列名各附一行 |
| 44 | `44-work-tree.md` | 多源合译；`README.md` / `AGENTS.md` / `goal.md` / `runbook.md` / `workset-direction.md` / 五个 `capstone/` 全译，`roadmap.md` 与 11 个 slice 压缩 |
| 45–47 | `45-message-map.md` `46-docs-lab-readme.md` `47-schema-reference.md` | 47 为两份 schema 参考合译 |

第 5 节「现在不读」里列的东西**没有译文** —— 那是本路线的取材决定，不是遗漏。

校验：`tools/verify-openspec-translations.ps1` 逐篇比对源与译文的代码围栏栅格、一组 CLI 标识符出现次数、引用头可解析性，并对「有意节的 / 多源合译 / 源码阅读稿」三类显式豁免（豁免理由必须同时写在译文自己的引用头里）。

## 读的时候盯住这七个问题（为 Lodestar 取材）

1. **授权边界写在哪。** 每个 `SKILL.md` 开头几句话都在说"这次请求授权到哪为止" —— propose 的 `Planning boundary`（"即使请求里说要动手，也不carry forward"）、update 的 `Never edits code.`、explore 的写操作确认协议 + `Silence is not acceptance`。这类声明在别的技能库里几乎见不到，但对 agent 流程是刚需：**光说做什么不够，还得说做到哪里停，以及怎么才算获得同意。**
2. **状态放在哪、谁有权算。** 全部落盘成 Markdown / YAML；**`status` 只等于文件是否存在**（`state.ts` 37 行）；进度只等于 checkbox；**CLI 是唯一的计算者，agent 只消费 JSON** —— 所以路径不许 agent 自己推（`the field already has`），下一步也不许 agent 自己定（`change-status-policy.ts` 里文本面与 JSON 面在同一处生成）。反面对照：哪些信息**留在对话里**（探索过程本身、update 的待确认草稿），作者为这个选择付了什么代价。
3. **什么时候必须停下来问人。** pause 条件清单、`blocked` / `all_done` 状态、两次评审、apply 里那句"任务需要超出 spec 的工作时**必须把新增范围摆出来问**，不许悄悄缩小/推迟/简化掉既定行为"，以及 archive/bulk-archive 那串"取消就什么都不做"的确认。
4. **依赖是使能还是闸门。** "Dependencies are enablers, not gates" 的完整推理，以及它为纪律付的价 —— 作者在 `overview.md` 自己承认："因为没有任何东西逼你往前走，保持 change 聚焦的责任落在你身上"。**注意 26 号（`ff`）与 17 号（`propose`）是这个取舍的两个极端采样点。**
5. **可自定义的边界划在哪。** schema / templates / context / rules 四层各管什么；为什么 `context` 和 `rules` 是"给 agent 的约束"而**绝不能**被抄进产物文件里；以及"改 design 可能回推 proposal"这种**双向**一致性的处理方式。
6. **一个技能到底能被强制执行到什么程度。** apply 技能里那句 `These are prompt-level behavior contracts, not enforceable checks` 是整套东西里最诚实的一句：**哪些靠 CLI 兜底**（`blocked` 状态、`validate` 拒收零 delta 的 change、JSON 模式把每个交互点变成错误码、checkbox 只认 `x`、schema 加载期查环），**哪些只能靠文案**。这条线画在哪，直接决定 Lodestar 该把什么东西从提示词搬进代码。
7. **一致性怎么维持。** 12 个技能里有 3 段话是**近乎逐字复制**的（Store selection / Project check / no-root 分支），说明这个团队接受用复制换一致性；同时它们又是从 `src/core/templates/workflows/` **生成**的，并且有 parity 测试盯着 —— `skillssh-parity.test.ts` 在生成物漂移时直接失败。**"哪些该共享、哪些该生成、哪些该用测试钉死"这三个决定，是维护一个技能库最容易失控的地方，值得单独想清楚。**
