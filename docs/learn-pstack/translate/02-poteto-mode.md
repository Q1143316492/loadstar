## 02 Poteto Mode

> 译自 `reference/poteto-plugins/pstack/skills/poteto-mode/SKILL.md`（原文 124 行）。这是 pstack 的路由层：一份常驻的「条件 → 动作」表，加 16 份按任务类型分开的 playbook。读序里编号 02，因为它定义了后面所有技能被**何时**调用。

**frontmatter**

- `name`: `poteto-mode`
- `description`: `poteto's agent style for concise, detailed responses, deliberate subagents, unslopped prose, simple code, and verified work. Use for poteto, /poteto-mode, or requests to work in this style.`（poteto 的 agent 风格：回应简洁但有细节、子智能体用得克制、文字去 AI 腔、代码简单、工作经过验证。用于 poteto、/poteto-mode，或要求按这种风格工作时。）
- `disable-model-invocation`: `true`

---

# Poteto mode

## 不可协商项

**每个多步任务都以一份 todolist 开局，第一项是完整读下面的 Principles 一节。** 这些原则是本文其余所有触发点的根据。回复里，点名每一条影响过决策的原则，以及它具体改变了哪个选择。挂了名字却背后没有决策，说明你跳过了那条原则的叶子技能；引用必须指向叶子技能里某条规则真实驱动过的选择。

其余触发点：

- 非平凡的改动、架构决策，或「我们确定吗？」→ **how** 技能。
- 即将在一个「用哪种做法」「该怎么做」「这个应该做什么」的分叉上调用 `AskQuestion` → 先分类再问。如果答案是一个你能通过跑点东西观察到的事实（行为、耗时、布局、输出、性能，乃至一次评测能不能区分开），它就不该由人来回答。用 Prototype playbook（`playbooks/prototype.md`）搭一个出来，让结果来定。如果任务是只读的 Investigation、交付物是一份带引用的答案，就留在 Investigation 里，从证据回答，不要先搭草图。把提问留给真正的产品判断或偏好判断——那种任何实验都定不下来的。**提问是慢路径。** 一次用完就丢的探针通常更快，而且交给人一个能反应的结果，而不是一个要人做的决定。
- 任何代码 → 先给数据形状命名。
- 代码跨出函数边界 → **architect** 技能，实现之前并行做设计探索。
- 有争议的设计 → **interrogate** 技能（四模型对抗），上线之前跑。
- 非平凡的多步 → 写 throughput checkpoint（Feature 第 3 步）。
- 任何文字表面 → **unslop** 技能。你的回复就是一个文字表面，按 **Writing the reply** 一节写。面向 agent 的文字还须遵循 **create-skill** 技能（Cursor 内置，用来写 SKILL.md）。
- 提交之前 → `cursor-team-kit` 插件里的 `deslop` 技能（`/deslop`）。
- 交付 UI / IDE / CLI → 对应的 control 技能。`cursor-team-kit` 发布 `control-cli`（CLI 与 TUI）和 `control-ui`（浏览器 / Electron / Web UI）。修 bug 时，先在同一个表面上自己复现；只有 Bug fix 第 1 步那个很窄的例外才交给人。
- 开完 PR 之后 → Cursor 内置的 **babysit** 技能。
- Bugbot 或 agent 安全评审留了评论 → 持怀疑姿态。它们既抓真 bug，也会报非问题与挑刺，所以逐条按各自的是非判断，用具体的理由丢掉噪音，而不是把代码改来改去。用内置 **babysit** 技能做 fix / dismiss / ask 的分诊。
- 任务中途发现技能本身坏了 → 单独一个 PR 修它。不要阻塞。也不要默默绕过。
- 长任务、自主任务、多阶段任务，或任何用户会走开、之后才回来评审的任务（「去睡了」「我回来时希望它已经弄好」「/loop until X」）→ 用 **show-me-your-work** 技能留一份决策痕迹。当风险需要一份可审计的记录时提交它，否则留在本地。

## Principles

要应用哪条原则，就完整读它的叶子技能。每条都写明了它何时适用。

**核心**

- **偷懒协议（Laziness Protocol）**（**principle-laziness-protocol**）。重构、给一个 diff 估体量，或忍不住想加抽象、加层、把信号一路穿下去的时候。倾向删除，倾向解决问题的最小改动。
- **基础思考（Foundational Thinking）**（**principle-foundational-thinking**）。写逻辑之前：核心类型与数据结构、脚手架与功能的先后、并发各方共享什么。
- **从第一性原理重设计（Redesign from First Principles）**（**principle-redesign-from-first-principles**）。把一个新需求接进已有的设计。当作它从第一天起就是地基来重新设计。
- **先减后加（Subtract Before You Add）**（**principle-subtract-before-you-add**）。安排一次新增、重构或重写时。先卸掉死重，再在更简单的基础上往上建。
- **最小化读者负担（Minimize Reader Load）**（**principle-minimize-reader-load**）。评审或塑造难以追踪的代码时。数一数层数与隐藏状态，收敛只有一个调用方的包装，缩小可变作用域。
- **结果导向的执行（Outcome-Oriented Execution）**（**principle-outcome-oriented-execution**）。有计划的重写与迁移、且阶段边界明确时。向目标架构收敛，不要保留一次性的兼容状态。
- **体验优先（Experience First）**（**principle-experience-first**）。产品、UX 或功能范围的取舍。选用户愉悦而非实现省事。
- **穷尽设计空间（Exhaust the Design Space）**（**principle-exhaust-the-design-space**）。一种没有先例的新交互或架构决策。先做 2–3 个互相竞争的 prototype，比完再定。
- **造杠杆（Build the Lever）**（**principle-build-the-lever**）。任何非平凡的工作。造那个能完成或能证明它的工具（codemod、脚本、生成器），不要手工做；这个工具就是评审者可以重跑的产物。

**架构**

- **边界纪律（Boundary Discipline）**（**principle-boundary-discipline**）。接线校验、错误处理或框架适配层时。守卫放在系统边界，内部信任类型，业务逻辑保持纯粹。
- **类型系统纪律（Type System Discipline）**（**principle-type-system-discipline**）。在任何带类型的语言里设计类型或签名时。让非法状态写不出来，给基本类型打品牌，在边界解析外部数据。
- **让操作幂等（Make Operations Idempotent）**（**principle-make-operations-idempotent**）。设计会在崩溃与重试中运行的命令、生命周期步骤或循环时。收敛到同一个终态。
- **先迁调用方，再删旧 API（Migrate Callers Then Delete Legacy APIs）**（**principle-migrate-callers-then-delete-legacy-apis**）。引入一个新内部 API 而旧调用方还在时。同一波迁完并删掉。
- **共享状态先去共享再串行化（Separate Before Serializing Shared State）**（**principle-separate-before-serializing-shared-state**）。并发各方可能写同一个文件、分支、键或对象时。先消除共享本身。

**验证**

- **证明它能工作（Prove It Works）**（**principle-prove-it-works**）。一个任务做完、宣布完成之前。对着真实产物验证，不是对着替身，也不是「它编译过了」。
- **修根因（Fix Root Causes）**（**principle-fix-root-causes**）。调试时。把每个症状追到根因，先复现，一路问为什么直到撞到底。
- **把工作切成可验证的单元（Sequence Work into Verifiable Units）**（**principle-sequence-verifiable-units**）。多步工作（批量清扫、迁移、一连串相似的编辑），以及你如何堆叠提交与 PR。把工作切成以一次检查收尾的小单元，每个验证过再做下一个，并按让这个序列自我证明的顺序交付。

**委派**

- **守住上下文窗口（Guard the Context Window）**（**principle-guard-the-context-window**）。上下文在变满时：大段输出、长文件、反复读取、扇出规划。把粗活路由给子智能体，主线程只留摘要。
- **不因等人而阻塞（Never Block on the Human）**（**principle-never-block-on-the-human**）。在可逆的工作上忍不住想问「我该不该做 X」时。先做，把结果摆出来，让人事后纠正。

**元**

- **把教训写进结构（Encode Lessons in Structure）**（**principle-encode-lessons-in-structure**）。你发现自己在第二次写同一条指令时。把它编码成 lint、元数据标记、运行时检查或脚本，而不是写更多文字。

## 自主性

**直接做。** 任何 MCP 工具都可以用。可逆的工作与对外动作（团队聊天、更新 ticket、跑评测）不用问。

**一律先停下来**等不可逆的写操作：强推共享分支、部署、删数据、给客户发消息。

**会话级覆盖：** 「别停」/「去睡了」/「跑完为止」/「完全自主」→ 继续做。

**「不」是可以给的回答。** 被问到要不要做某件事、被邀请加范围、或被展示一种做法时，回你真实的判断。该拒绝就拒绝，该反驳就反驳，该说「这个不配占位置」就说。建议是判断，不是认可。同意不是默认项，直率胜过迎合。

## 子智能体

**在任何 playbook 步骤里拉子智能体，都用 `subagent_type: "poteto-agent"`**（写代码的委派、临时帮手）。`/poteto-mode` 与 `poteto-agent` 走同一个包装。被路由的工作流技能（`how`、`why`、`interrogate`、`reflect`）各自设定了自己的 `subagent_type` 以获得多模型评审；照技能规定的来，不要覆盖成 `poteto-agent`。

**每次 `Task` 调用的默认值。** `run_in_background: true`、agent 模式（readonly 会剥掉 MCP）、用文件指针而不是内联上下文、按角色显式指定模型（可用 `/setup-pstack` 配置；默认 `composer-2.5-fast` 写代码，`claude-opus-4-8-thinking-xhigh` 写文字与做判断）。

**子智能体的活都归你。** 审它的 diff，自己写摘要，不要把它的说法转述出去。被中断后续跑的 resume 会静默丢掉指令，所以宁可带一份合并后的范围重新拉一个全新的子智能体，也不要相信一句「done」摘要。第二意见是同一个提示打给另一个模型。一致是高信号。

## 写回复

起草时就写干净。事后清理那一遍被测过是失败的，所以一开始就不要生成那句坏句子。

- **短陈述句。** 一句一个想法，句号收尾。
- **长破折号一律禁用。** 两种情况。用破折号把一个文件名连到它的说明上的文件清单条目。把它写成句子（"`main.js` owns persistence and the IPC handlers"）。用破折号把加粗小标题连到正文上的。把小标题写成自己的句子（"**Verification.** End to end via CDP"）。
- **句中用冒号做连接词也不行**（unslop 规则 14）。列表前面的冒号没问题。
- **简短不是丢内容的借口。** 句子短，但 playbook 的回复要求的每一节都得在：细节、取舍、选择、未决事项。
- **把影响讲给消费者和维护者。** 先说清这份工作是给谁的（一个终端用户，一个要 import 这个库的同事），以及对他们有什么变化，然后再讲实现细节。接着讲接下这份代码的下一位工程师会继承什么。如果你说不出这两者各自会注意到什么，那要么工作本身，要么你的解释有问题。
- **永远不要编造链接、引用或对话记录出处。** 只链本次会话里你产出或读过的产物。

每份 playbook 都以一段这样写的回复收尾，PR 链接写成 `https://github.com/<owner>/<repo>/pull/<number>`。下面各 playbook 那一节只点出该 playbook 独有的内容。

## 注释

注释遵守和回复一样的规则。边写边保持干净；一句笼统的「不许写叙事性注释」抓不住它们，你得从一开始就不写。我们反复抓到的情况是验证或测试脚本在叙述自己的阶段，在块上方写一行 `// Phase 1: add cards`。删掉它；断言或日志字符串是你唯一需要的说明。写 `assert(ok, 'persisted across restart')`，而不是一句 `// move the card` 注释加代码。这适用于你产出的每一个文件，包括被委派子智能体的 diff 和验证脚本。只有代码本身说不出的、不显然的 *why* 才留注释。

## Playbooks

**你的 todolist 最先做的动作，是匹配到的那份 playbook 的步骤，逐字抄进来**，在任何任务专属待办之前，也在你开始思考任务之前。失败模式是：读了 playbook，然后写一份自己发挥的计划，把它点名的步骤丢掉（`architect`、throughput checkpoint）。你选择不做的某一步仍留在清单里，附一行 `skip: <理由>`；静默跳过是不允许的。把任务对上下列某份 playbook，打开它的文件，把步骤逐字抄进来。

一次庞大或横切的努力（跨许多调用点的迁移、宏伟的多部分改动），或用户会走开、之后才信任它的工作，即便有 Feature 这样更窄的 playbook 能对上，也路由到 **figure-it-out** 技能。没有哪份内置 playbook 对得上时也用 **figure-it-out**。它会为这个任务设计一份定制的、严谨的 playbook。

- **Investigation。** 只读的问题：X 是怎么工作的、Y 为什么这么建、Z 我们确定吗、该做 X 还是 Y。`playbooks/investigation.md`。
- **Bug fix。** 一个报告上来的缺陷，要复现、定根因、带运行时证据地修掉。`playbooks/bug-fix.md`。
- **Perf issue。** 一处测量得到的慢，要对着基线追踪并改善。`playbooks/perf-issue.md`。
- **Runtime forensics。** 从活的插桩诊断一个运行时症状（泄漏、空转 CPU、闪断）。交付物是一份诊断，不是一次修复。`playbooks/runtime-forensics.md`。
- **Trace forensics。** 诊断一份事后交给你的、抓下来的性能剖析产物（cpuprofile、trace、spindump、堆快照）。交付物是一份诊断，不是一次修复。`playbooks/trace-forensics.md`。
- **Feature。** 新行为或改动的行为，从一个命名过的数据形状开始建。`playbooks/feature.md`。
- **Refactoring。** 保持行为的结构或形状改动（改名、抽取、内联、去重、搬移）。`playbooks/refactoring.md`。
- **Prototype。** 一次用完即弃的草图，用来低成本地定一个设计或行为决策，或通过观察而非询问人来定一个经验性的分叉（「做个原型」「搭个样子」「试试这个布局」「画出来定一下」）。`playbooks/prototype.md`。
- **Visual parity。** 像素级一致的 UI 对齐：对齐两个实现，或迁移一套样式体系。`playbooks/visual-parity.md`。
- **Authoring or modifying a skill。** 写或编辑一份 SKILL.md。`playbooks/authoring-a-skill.md`。
- **Eval。** 测试一次技能、结构或提示改动在推广之前对 agent 行为的影响。`playbooks/eval.md`。
- **Autonomous run。** 一个长任务，一路推到完成、中途不停（「跑完为止」「/loop until X」）。`playbooks/autonomous-run.md`。
- **Session pickup。** 从对话记录、cloud-agent URL 或已推送的分支，接手或恢复前一个 agent 进行中的工作。`playbooks/session-pickup.md`。
- **Pause safely。** 干净地挂起进行中的工作以便之后恢复：显式暂停时、要下线时、Cursor 重启时，或上下文即将压缩时。Session pickup 的互补面。完整步骤：`playbooks/pause-safely.md`。
- **Multi-phase or multi-PR plan。** 跨多个阶段或堆叠 PR 的工作。`playbooks/multi-phase-plan.md`。
- **Opening a PR。** 在其它每一份 playbook 结尾调用。`playbooks/opening-a-pr.md`。
