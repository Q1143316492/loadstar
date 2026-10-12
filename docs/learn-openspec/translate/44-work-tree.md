## 44 work —— 砍回来之后的新形态

> 译自 `reference/openspec/openspec/work/`。按 `READING-openspec.md` 第 44 项：这是同一批人在同一个仓库上长出的**最新一代规划产物形态**，也是第四章（自举）的高潮。第 44 项把它与第 43 项（`openspec/initiatives/`，已被作者自己判为 `beta history`）明确对照：43 是那套被砍掉的 machinery，44 是把整套东西收缩回 Git 之后的形态 —— 四层模型 `goal → roadmap → slice → result`，配 `slices/<id>/{spec.md, plan.md, result.md, log.md?}`。
>
> **压缩说明（两处，均为显式压缩）：**
> 1. `simplify-context-and-workspace-model/roadmap.md`（原文 110.8 KB / 2197 行）**不全译**。译出它的标题结构、全部 framing 散文（开篇、`The Story In Plain English`、`Vocabulary For This Roadmap`、`Rules We Should Not Forget`、`Progress At A Glance`、每个 Phase 的引言、`Later Ideas`），并把中间那串长长的逐 slice 详述压缩成**逐 slice 摘要**（slice 名 + 取自它自己文字的一行目的）；`Roadmap Change Log` 的 78 条按日期记录也压缩成一条总述。见 44.6。
> 2. `simplify-context-and-workspace-model/slices/` 下 11 个 slice **不全译**。只把 `assemble-working-context` 这一个 slice 当作范本全译（`spec.md` + `plan.md`），其余 10 个按名字列出，各附一行取自各自 `spec.md` 的 `## Outcome` 的释义。见 44.8。
> 其余部分全部全译：`work/README.md`、`work/AGENTS.md`、`goal.md`、`runbook.md`、`workset-direction.md`，以及 `capstone/` 下全部五个文件。
>
> **标题层级约定：** 本文件第 1 行是全篇唯一的 `##`；`### 44.N <源文件>` 是每个源文件的小节；源文件内容里的标题一律更深 —— 源 `##` 记为 `####`，源 `###` 记为 `#####`。44.7 与 44.8 下再嵌一层 `#### 44.N.M <源文件>` 标记，其源文件的内容标题相应再深一层（源 `##` → `#####`，源 `###` → `######`）。唯一一处按**格式骨架**处理的是 44.8.1 里作为范本的 slice artifact：它的 `## Outcome` / `## Locked Decisions` / `## Acceptance Criteria` 与 `### <scenario 组>` 保留 artifact 自身的相对层级（分别落在 `#####` / `######`），好让这份格式读起来仍然成立；该节引言里另有说明。
>
> 代码块处理规则：`bash` / `json` / `yaml` / `text` 围栏标记、命令、路径、flag、JSON 键名、`- [ ]` 复选框全部原样保留。`text` 围栏内若是散文（产品方向声明、口诀、五问框架），则原样保留原文块，并在其后给出译文。三条**必须不错过**的句子（README 的四层口诀、AGENTS 的 `Good human UX is usually good agent UX`、goal 的 `The product should not require context stores, workspaces, or another state system as primary user-facing concepts.`）同时给出英文原文与译文，并加粗标出。

### 44.1 `work/README.md` —— goal → roadmap → slice → result

> 源文件：`reference/openspec/openspec/work/README.md`

**OpenSpec Work**

这个目录是 Git-native 工作 artifact 的实验性归属地。

当前的实验把 work 模型分成四层：

```text
goal -> roadmap -> slice -> result
```

- `goal.md` 描述目的地：我们想让它成真的是什么，以及为什么。
- `roadmap.md` 描述通往那个目标的当前路径。随着实现揭示出更好的排序，它预期会变化。
- `slices/<id>/spec.md` 描述一个小型的期望结果。
- `slices/<id>/plan.md` 描述那个 slice 将如何被实现与验证。
- `slices/<id>/result.md` 记录实际发生了什么，以及该 slice 通过、失败或需要后续跟进的证据。
- `slices/<id>/log.md` 是可选的。只在重要变化需要一个简短说明时使用它：改了什么、为什么、以及哪些下游 artifact 受影响。

目标是让高层工作保持轻量，同时仍然给 agent 与人足够结构，好一次推进一个 slice。

经验法则（Rule of thumb）：

```text
spec.md says what must be true.
plan.md says how we intend to get there.
result.md says what actually happened.
```

**（译文：`spec.md` 说的是什么必须为真。`plan.md` 说的是我们打算怎么走到那里。`result.md` 说的是实际发生了什么。）**

#### 形态

```text
openspec/work/
  README.md
  <work-id>/
    goal.md
    roadmap.md
    slices/
      <slice-id>/
        spec.md
        plan.md
        result.md
        log.md
```

#### 工作流

从 goal 开始，然后维护一份松散的路线图。路线图是一串活的、可能发生的 slice，而不是按顺序执行所有内容的承诺。

对每个 slice：

1. 探索并访谈，直到这个 slice 有了一份有用的 `spec.md`。
2. 只有当 spec 清楚到可以实现时，才生成 `plan.md`。
3. 执行计划。
4. 在 `result.md` 中记录证据、验证输出与后续跟进。
5. 当结果改变了前进路径时，更新 `roadmap.md`。

#### 修订规则

当期望的 slice 结果变化时，编辑 `spec.md`。

当实现路径变化、但 slice 结果仍然相同时，编辑 `plan.md`。

当实现或验证已经发生时，创建或更新 `result.md`。不要把它当作当前意图的真值来源。

当一次有意义的转向仅从最终文件很难理解时，加入 `log.md` 条目。

当新工作可以被独立接受、排期、验证或交付时，创建一个新 slice。

#### 兼容性

这个目录是实验性的。当前 OpenSpec CLI 的校验、archive 与 spec 更新行为仍以 `openspec/changes/` 与 `openspec/specs/` 为中心。

用 `/work` 来协调与学习。当一个 slice 需要今天可执行的 OpenSpec 生命周期时，把这个 slice 投影成一个普通的 `openspec/changes/<id>/` artifact，直到 `/work` 有了一等的 CLI 支持。

### 44.2 `work/AGENTS.md` —— 两个用户

> 源文件：`reference/openspec/openspec/work/AGENTS.md`

**给 `/work` 的 Agent Guidance**

在这个目录工作时，先用产品视角。

从用户如何体验这份工作出发，而不是从内部的命令或文件结构出发。这个产品有两类用户：

- 人：他们通常通过提示 agent 来做 OpenSpec 工作。他们可能会为交互式设置或一次性动作运行 shell 命令，但提示才是常规界面。
- Agent：他们需要清晰的意图、可发现的状态、无歧义的下一步动作，以及足够结构化的输出，好安全地行动。

**Good human UX is usually good agent UX.** 一个好到人容易开口要求、也容易理解的流程，通常也更容易让 agent 执行、验证与解释。

（译文：好的**人类** UX 通常就是好的 **agent** UX。）

在路线图或 slice 探索时：

- 先描述面向用户的流程，再描述内部实现。
- 问人看到了什么、要求了什么、批准了什么、纠正了什么。
- 问 agent 必须发现什么、决定什么、执行什么、回报什么。
- 在提出新形态之前，把推理建立在当前 repo 的行为之上。
- 把 shell 命令当作支撑性的机械，而不是主要的产品叙事。
- 优先使用具体的工作流，而不是抽象的模型语言。

当答案变得令人困惑时，把它重构成：

```text
What does the human want?
What does the agent need to know?
Where does the work live?
What changes on disk?
How does the user know it worked?
```

（译文：人想要什么？agent 需要知道什么？活儿住在哪？磁盘上什么变了？用户怎么知道成了？）

### 44.3 `goal.md`

> 源文件：`reference/openspec/openspec/work/simplify-context-and-workspace-model/goal.md`

**简化 Context 与 Workspace 模型的目标**

#### 目的地

把当前的 context-store、initiative、workspace 与 repo-local change 方向，重新导向一个更简单的 OpenSpec 模型 —— 更容易解释、更容易实现、也更容易狗粮。

简化后的方向是：

```text
Specs are what is true.
Work is what is in motion.
```

（译文：Specs 是「什么是真的」。Work 是「什么正在动」。）

OpenSpec 的 artifact 应住在 Git 中。那个 Git repo 可以是 project repo、一个独立的规划 repo，或一个契约 repo。**The product should not require context stores, workspaces, or another state system as primary user-facing concepts.**

（译文：**这个产品不应要求把 context store、workspace 或另一套状态系统当作主要的面向用户概念。**）

#### 期望的体验

一个人应能说：

```text
OpenSpec can live in this project repo or in its own Git repo.
This project repo's work draws on these planning repos.
I can keep a personal workset for the planning repo and the code repos I want
open together.
```

（译文：OpenSpec 可以住在这个 project repo 里，也可以住在它自己的 Git repo 里。这个 project repo 的工作取自这些规划 repo。我可以为规划 repo 与我想一起打开的代码 repo 保留一个 personal workset。）

agent 与命令应能组装出相关的 OpenSpec root 与被引用的规划 repo，而不要求用户把 context-store、workspace、collection 与 repo-local 这几种模式理解为彼此独立的产品系统。代码 repo 通过用户显式的指示或个人 workset 进入这份体验，而不是通过一份检入的声明加一份本地映射。

#### 产品方向

- 在引入更简单的模型时，保留当前的 `specs/` 与 `changes/` 基线。
- 让位置选择变得显式：in-project OpenSpec 还是独立 OpenSpec repo。
- 以引用而非重定向来支持分层规划：高层需求与设计可以住在一个独立 repo 中，而 project repo 保留自己的 OpenSpec root 用于实现层工作，把那个独立 repo 作为已声明的上下文来取用。
- 在更清楚的产品模型出现之前，保持实现 repo 的选择是显式的；不要引入「一份检入的 code-repo 声明加一份本地映射抽象」作为默认路径。
- 把 workspace 行为缩减为个人的、手动组合的聚焦视图。
- 把未来的 `work/` 布局当作更晚的演进，而不是让独立 OpenSpec repo 变得有用的前提。

#### 约束

- 保持当前的 `openspec/changes/` 与 `openspec/specs/` 生命周期可用。
- 把这个 `/work` 文件夹当作组织这次重新导向的实验，而不是已实现的产品模型。
- 避免让 context store 或 workspace 复活为主要产品名词。
- 避免把全局 `decisions.md` 与 `questions.md` 文件当作默认的规划形态。
- 优先使用小的、可评审的 slice，而不是大的路线图条目。
- 只提升需要用来指导未来 slice 的信息。

#### 成功信号

- 一个新来的 agent 通过读这个 work 目录里的文件，就能理解当前目标和当前路线图。
- 旧的 context-store 与 workspace initiative 变成有用的过渡历史，而不是活跃的产品队列。
- 接下来的产品 slice 是关于保留基线、澄清位置、支持独立 OpenSpec repo、references 与 personal workset。
- 路线图避免让未来的 `/work` 支持阻塞更简单的独立 OpenSpec repo 路径。

### 44.4 `runbook.md`

> 源文件：`reference/openspec/openspec/work/simplify-context-and-workspace-model/runbook.md`

**Roadmap Runbook**

从这个 repo 的一个全新会话开始，在 `codex/store-root-parity` 分支上，用恰好这条命令启动这次运行（交互式，或通过 `claude -p '/goal ...'` 无头启动）：

```text
/goal ROADMAP QUEUE COMPLETE: every item in the work queue defined in
openspec/work/simplify-context-and-workspace-model/runbook.md (slice 1.4,
the Phase 5 command-group deletion slice, 3.1-3.6, 4.1, the Phase 5
remainder, and the 6.1 final acceptance capstone) has all of its roadmap.md
progress boxes ticked except "Merged to main", the full pnpm test suite
passes, all work is committed on codex/store-root-parity, and the
capstone's release-readiness report is committed with no open P1/P2
findings. Work strictly per the runbook, one coherent unit per turn, never
waiting for the user; or stop after 300 turns.
```

这个文件是那次自主运行的契约 —— 它要跑完 `simplify-context-and-workspace-model` 路线图。驱动器是 `/goal`（基于条件：turn 一个接一个地触发，直到完成条件被满足 —— 没有时间表，也不等用户）。每个 turn 做一件连贯的工作单元，并以一个显式状态结束，好让 goal 评估器读懂。所有工作都发生在 `codex/store-root-parity` 上（见 `roadmap.md` 中的单分支工作流说明）。

架构：由 goal 驱动的主循环是那条串行的脊柱（每个 turn 一个带判断的工作单元，phase 之间做簿记）；并行的评审阶段作为多 agent Workflow 运行；`/code-review` 与 `/simplify` 这两个 skill 以及 codex CLI 提供独立的评审机械 —— 这些 skill 从主循环运行，绝不从 workflow agent 内部运行。

#### 后续运行：7.1 personal worksets（Follow-up run: 7.1 personal worksets (added 2026-06-12)）

最初的队列已完成。Item 7.1 作为它自己的 goal 运行，从 `codex/store-root-parity` 上的一个全新会话开始：

```text
/goal 7.1 COMPLETE: roadmap item 7.1 (personal worksets) in
openspec/work/simplify-context-and-workspace-model/roadmap.md has all
of its progress boxes ticked except "Merged to main" — including the
capstone dogfood and the pushed-branch box — the full pnpm test suite
passes, all work is committed on codex/store-root-parity, and the
branch is pushed to origin with code-review comments addressed. Work
per the runbook's per-slice discipline with the slice folder
slices/personal-worksets/; the 7.1 section's functional requirements,
locked decisions, and research checklist are the requirements baseline
and are owner-directed — do not relitigate them. Start with the
research checkpoint (the old launch mechanics at f858c19^ are the
evidence base). One coherent unit per turn, never waiting for the
user; or stop after 80 turns.
```

7.1 是一个 build slice：完整的评审纪律（删除 slice 的裁剪不适用）。两条本次运行特有的修订（owner 指示，2026-06-12）：

- **本次运行允许 push —— 仅限该工作分支。** 在实现后评审的修复落地之后，以及在簿记时，各把 `codex/store-root-parity` push 到 origin 一次。然后检查 PR #1190 上触及该 slice 的 code-review 评论，并逐条处理（修掉它，或在 changelog 中记录一条带理由的回复）。合并到 `main` 或 push `main` 仍然禁止；Hard boundaries 一节里的「never push at all」仅对本次运行被这一段取代。
- **7.1 capstone —— 在 simplify 之后、簿记之前。** 无头地从用户的座位端到端证明这个功能：在一个带隔离 XDG 状态、PATH 上有假 `code` / `cursor` / `claude` / `codex` 可执行文件的临时环境里，为两种启动风格各走一遍 compose → list → open，校验生成的 `.code-workspace` 内容与每个工具确切的启动 argv（包括 agent 打开的无提示规则）。然后做一次冷启动 UX 走查：一个只拿到 `--help` 输出、没有任何内部知识的新无头 agent，必须能走到一个被打开的 workset。把 transcript 记进该 slice 文件夹，修掉它暴露的问题，重跑完整套件，并勾上 capstone 复选框。

本 runbook 其它所有小节照旧适用。

#### 每回合重新锚定（Re-anchor (every turn)）

1. 读 `roadmap.md` —— Progress At A Glance、下一个未完成项指针，以及当前 slice 那一节。如果 `goal.md` 与 `AGENTS.md` 还不在上下文里，读它们。信任文件而不是对话记忆；上下文可能已经被压缩过。
2. 工作队列，按顺序：slice 1.4 → Phase 5 的 command-group 删除 slice → 3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6 → 4.1 → Phase 5 余下部分 → **6.1 最终验收 capstone**（见 roadmap 的 Phase 6 与下面这一节）。所有产品决策都已锁在 `roadmap.md` 里（「Decisions locked」区块、Rules We Should Not Forget、1.4 的术语复选框、5.1 的判据）；不要重新打开它们。

#### 每-slice 纪律（Per-slice discipline，从 slice 1.3 的纪律演化而来）

1. **Spec**：按既定格式写 `slices/<slice-name>/spec.md`（Outcome、Locked Decisions、User Experience、Scope、带 GIVEN/WHEN/THEN scenario 的 Acceptance Criteria）。把每一条主张都建立在当前代码上。
2. **Spec 评审** —— 并行运行（agent 用 Workflow，codex 用 Bash）：一个对抗式评审 agent + 一次 codex CLI 评审。折入所有发现；在 roadmap changelog 中记录这一轮。
3. **Plan**：写 `slices/<slice-name>/plan.md`（Status、带 file:line 锚点的代码地图、实现计划、测试计划、风险、完成定义）。
4. **Plan 评审**：与 spec 评审相同的并行形态。折入发现。
5. **实现**在这个分支上。构建干净；任何实现提交之前完整 `pnpm test` 全绿。有意识地更新既有测试，绝不靠放松契约。
6. **实现后评审**，三个彼此独立的机制并行（它们都不做编辑）：
   - 一个 spec 符合性 agent（Workflow），逐个 scenario 地把实现与 slice spec 对照检查；
   - 以高 effort 运行 `/code-review` skill，找正确性问题；
   - 一次对提交区间的 codex CLI 评审。
   修掉所有 P1/P2 发现与便宜的 P3；重跑完整套件。
7. **质量走查**：对改动的代码运行 `/simplify` —— 串行，在正确性修复落地之后，因为它会编辑工作树。重跑完整套件；提交。
8. **簿记**：勾上该 slice 的 roadmap 进度框，更新下一项指针与 Progress At A Glance，加入 changelog 条目，让 slice 的 spec/plan 与实际交付的内容保持一致，提交。

#### 常设质量门槛（Standing quality bars，在每个 slice 的评审中检查）

- **词汇**：新的面向用户字符串只使用锁定的名词（store、reference、target project repo、OpenSpec root）。一个概念一个 token —— 不许同义词漂移。
- **错误 UX**：每一个新错误或提示都点出具体的下一步动作；在选中了某个 store 时携带 `--store <id>`；跨 root 时使用绝对路径。用户粘贴的提示必须逐字可用。
- **Agent 契约**：新的 JSON 字段与诊断码遵循既有的共享形态（root 区块模式；severity/code/message/fix 诊断）。只做加法、保持一致、不出现平行的 envelope 风格。
- **精简模块**：被触及的模块超过约 600 行即触发拆分或记录理由。新的抽象至少需要两个真实调用点，或一条记录下来的理由 —— 不要投机性的通用化。
- **依赖方向**：core 绝不从 commands 导入；store 的 Git 机械留在唯一的 git 模块之后；config 解析与 instruction 注入留在各自的模块里。root 解析仍然恰好是一条共享代码路径 —— 不许出现各命令局部的优先级分叉。

codex 评审调用方式：非交互地 `codex exec`，模型 5.5、高推理（`-c model=...` 与 reasoning-effort 覆盖；首次使用时用 `codex exec --help`/配置确认确切的 model id，然后复用它）。给 codex 提交区间或 artifact 路径，并要求它给出带 severity 与 file:line 证据的发现。

删除 slice 的评审档（仅限 Phase 5 余下部分）：spec 评审保持完整的双形态（subagent + codex）；plan 评审只跑对抗式 subagent，不用 codex；实现后评审跑 spec 符合性 agent 与高 effort 的 `/code-review`，不做每-slice 的 codex。理由：删除 slice 是机械性的，它们的评审-修复轮次是整次运行中最小的，而且 6.1 的全量 delta codex 评审本来就会重新覆盖每一行被删的代码。Build slice（4.1）保持完整纪律。

Slice 特有的验收：

- **1.4**：实现之后，无头地跑 dogfood 证明 —— 在一个带隔离 XDG 状态与一个已注册 store 的临时项目里，一个新的无头 agent 会话必须仅凭一条提示就完成一个 store 范围内的 change，无需手把手。

#### 最终验收 capstone（6.1 —— 最后一个队列项）

capstone 证明的是**产品**，不是各个 slice。只有当一名冷启动用户今天就能开始使用它时，它才通过。它的检查：

1. **Persona journeys**，每个或是一条 e2e 测试，或是一次无头 dogfood：
   - 新团队：创建一个 store，把一个 change 走完到 archive，在本地提交并 push；第二个 checkout 克隆、注册、继续（1.3 的 journey 在改名与删除之后仍必须通过，用新的名字）。
   - 分层流程：需求在一个 store 中；一个应用 repo 里的 agent 引用它，从 config 发现这层关系，引用上游 spec，并在应用 repo 自己的 root 中写下低层设计。
   - 外置规划：一个没有本地 root、只有一份 fallback 声明的 repo，在不必重复 `--store` 的情况下跑完正常的生命周期。
   - 冷启动：一个新的无头 agent，只拿到一句含糊的人类提示（「为这个项目在一个独立 repo 里搭起规划」）且没有任何内部知识，仅凭 `--help` 输出与生成的 guidance 就成功。
2. **可用性审计**：一次错误目录走查（新路径上每一个可能的走错都会给出可行动、携带 store 的错误）；一次词汇清扫（任何面向用户的表面上都没有 `context store`/initiative/workspace 残留，包括 `docs/cli.md`）；一份有记录的首次成功耗时统计（从安装到第一个 store 范围内的 change 所需的命令数与概念数）。
3. **技术审计**：单 resolver 不变量（一份优先级实现，没有各命令局部的分叉）；依赖方向检查；对被触及区域的死代码清扫；模块大小报告；一份 agent 契约清单（所有 JSON 形态与诊断码记录在一份参考文件里并验证一致）；相对 `origin/main` 的净 LOC 增量被报告出来（考虑到 Phase 5 的删除，预期为净负 —— 若不是，给出理由）。
4. **全量 delta 评审 gauntlet**，覆盖 `origin/main...HEAD`（是总和，不是各个 slice）：max effort 的 `/code-review`、一次 codex CLI 评审、一次对抗式 Workflow 评审员扇出，以及一个问「缺了什么」的完整性批评者。修掉所有 P1/P2 发现。
5. **发布就绪报告**提交到这个 work 文件夹：五分钟的新用户故事、审计结果、完整的 `Decided autonomously` 台账，以及映射到 Later Ideas 的已知缺口。

#### 自主决策协议（Autonomous decision protocol）

当某个 slice 暴露出一个路线图尚未锁定的决策时：

1. 做出与锁定决策、护栏与目标（「Specs are what is true. Work is what is in motion.」）最一致的判断。
2. 当天就把它记进 roadmap changelog，用一行清楚标记：`Decided autonomously (review me): ...`，附理由。
3. 继续。不要停下来问；也不要静默决定 —— changelog 标记就是用户的评审面。

Phase 5 的删除 slice 无需确认即可推进：它们只删代码与生成的 guidance，绝不删用户数据，而 git 历史就是撤销。

#### 硬边界（Hard boundaries，是禁令，不是闸门）

- **绝不**合并、rebase 到、或 push 到 `main`；绝不 push —— 提交留在本地 `codex/store-root-parity` 上。
- 绝不删除用户数据文件。
- 绝不重新打开一个已锁定的决策；绝不重建按 change 的链接（关系是位置、声明或引用）。
- 一个 change 只住在一个 root 里。

#### 并行策略（Parallelism policy）

- **跨 slice 的工作保持串行。** 每个 slice 都落在同一个分支上；那些交汇文件（`src/cli/index.ts`、completions registry、`project-config.ts`、`foundation.ts`/`registry.ts` 与 `roadmap.md` 的簿记）几乎被每个 slice 共享；而队列里最大的两个提交 —— 1.4 的大规模改名与 Phase 5 的大规模删除 —— 是把并行轨道 rebase 过去的最差基底。
- **鼓励 slice 内的扇出。** 对分区文件集的机械清扫 —— 1.4 的改名与 guidance 表面、Phase 5 的删除清扫 —— 作为 Workflow 运行，在 agent 并发编辑时使用 worktree 隔离。一个集成点，一次完整套件运行。
- **允许前瞻性研究。** 在实现 turn 中，一个后台只读 workflow 可以预先构建下一个 slice 的代码地图（为它的 plan 准备 file:line 锚点）。绝不要针对尚未落地的代码或名字预先写下一个 spec。

#### Turn 大小与状态（Turn sizing and status，评估器读这一节）

- 每个 turn 一个连贯单元：一份 spec 加它的评审、一份 plan 加它的评审、一个实现检查点，或一轮评审与修复。
- 每个 turn 结束时给出一个显式状态块，说明：当前 slice 与步骤、这一 turn 产出了什么、评审结论、测试套件状态、任何 `Decided autonomously` 条目，以及下一 turn 做什么。goal 评估器只能看到 transcript 呈现出来的东西 —— 平直地陈述进度，绝不要隐含。
- 当队列里每一项的 roadmap 进度框都被勾上（除了「Merged to `main`」）、完整套件全绿、所有工作都已提交、**并且 6.1 capstone 通过且它的发布就绪报告已提交且没有未决的 P1/P2 发现**时，这次运行就算完成。当这成真时，在最终状态里明确说出来：「ROADMAP QUEUE COMPLETE」，加上包含每一条供评审的 `Decided autonomously` 条目的收尾总结。

### 44.5 `workset-direction.md`

> 源文件：`reference/openspec/openspec/work/simplify-context-and-workspace-model/workset-direction.md`

**用户指示的后续：Workset 纠正（capstone 后评审）**

> **已被取代（2026-06-19）：** 持续的产品评审把 code-repo 声明与 map 命令组整个移除了。workset 纯粹是本地的、个人的、手动组合的具名视图（见具有权威性的路线图条目 7.1）。代码 repo 之所以进入一个会话，是因为用户在 workset 中点名了文件夹或给出了一条显式路径，而不是因为 OpenSpec 从声明中推导出它们。

日期：2026-06-12。来源：owner 对 4.1 自主决策的设计评审（`Decided autonomously (review me)` 这个回路按预期闭合）。这取代了 4.1 的命名/范围决策；它没有重新打开任何路线图锁定的决策。实现应作为一次后续 slice 按标准的每-slice 纪律运行。

#### 1. `openspec context` 变成 `openspec workset`，以 change 为锚

- 把 4.1 的表面改名为 `openspec workset`。「Context」命名的是数据，不是活儿；「working set」是路线图自己的名词（Phase 4 的目标：「everything **this work** relates to in one working set」），也是 CS/Eclipse 里既有的术语，指一个派生的、正在被活跃使用的子集。
- 主要形态：`openspec workset <change-name>` —— 锚是那个工作项，而不是 root。成员及它们的角色由 change 向外推导：change 所住的 root（位置）、该 change 的代码库收窄并以 root 的已声明清单作为兜底（声明）、root 所引用的 store（声明）、经由 machine map 得到的路径。生成的 `.code-workspace` 文件以 change 命名 —— 具名的、可重新打开的视图就是那个文件，键是这个工作项。
- 裸的 `openspec workset` 仍是 root 并集视图（被解析出的 root 的声明所描述的一切）。
- `--json` 仍是 agent brief，并增加三行内联的操作规则：一次一个 root；被引用的 store 是只读上下文；已声明的代码库是工作落地之处；用 `--store` 显式抵达另一个 root。
- 否决替代方案的理由已经定案；不要重新争论：`view`（相对已发布的 dashboard 是破坏性变更；不够具体）、`open`（没有宾语的动词）、`workspace`（宾语语法、行业里含义过载、与 `.code-workspace` 自我碰撞）。

#### 2. workset 必须塑造 agent 会话的边界（启动消费者）

生成的路径不能跨越 agent 沙箱边界：Claude Code 对它工作目录之外的内容会提示；codex 会把沙箱限制在启动 root。一份只打印路径的 brief 是降级模式。因此：

- `--code-workspace`（已交付）是路线 1：IDE agent 从 workspace 文件继承多 root 边界。
- 加入路线 2：一个启动 flag（`workset open <change>` 或 `--open`），以被授予的成员启动配置好的消费者 —— 编辑器经由 workspace 文件；CLI agent 经由它们的边界 flag（`--add-dir` / 沙箱 root）。最小版本：只支持编辑器；没有 opener 可用时降级为打印文件路径。
- 路线 3（仅 brief）仍然有效：确切的路径让 agent 能提出一次精确的访问请求，由人批准一次。

#### 3. code-repo 关系路径是被移除，不是被改名

- 旧的 code-repo 关系命令组与 registry 小节从产品路径中移除。
- 把代码 repo 带进 workspace 的主要界面是显式的：用户提供的路径、当前工作目录，以及手动组合的 workset。
- 为未来的多 repo 协调场景保留一条小注记，但在用户模型清楚之前，不要保留 machine token 或诊断。

#### 4. 没有 workspace 式的分组 registry

分组的持久化存在于声明（检入、团队共享）加 machine map 中；具名视图是按 change 的 `.code-workspace` 文件（编辑器的 recents 就是重新打开的面；手改该文件覆盖临时的成员资格）。重新引入被注册的分组会重建第二套成员资格真值、一个对象生命周期与本地专有状态。把「change 命名文件之外的具名保存集合」停放为一条 Later Idea，以真实使用证据为门槛。

#### 5. 语法原则（作为常设护栏记录下来）

- 三个层级：闭集的产品对象获得名词组（`store`）；开集的 artifact 集合搭通用动词、把类型当作数据（永远不要按 collection 建命令组；`change` 组是冻结的 legacy 便利）；派生的表面是动词或结果名词（`doctor`、`workset`）；管道获得一个动词（`map`）。
- 「Workspace」作为产品名词永久退役。
- 生命周期留在 skill/schema 中；CLI 保持为通用的数据平面。

### 44.6 `roadmap.md`（标题结构 + framing 散文 + 逐 slice 摘要）

> 源文件：`reference/openspec/openspec/work/simplify-context-and-workspace-model/roadmap.md`（原文 110.8 KB / 2197 行，折叠进 2197 行里的 19 个 slice 小节）。
>
> **本节是显式压缩。**译出的是：文件的标题结构、全部 framing 散文（开篇、The Story In Plain English、Vocabulary For This Roadmap、Rules We Should Not Forget、Progress At A Glance、每个 Phase 的引言与 Phase checklist、Later Ideas）。压缩掉的是：每个 slice 小节里的详述正文（其 Progress 勾选清单、What the user can do、Why it matters、What changes in commands or files、How the user or agent knows it worked、Decisions locked 细节、示例 JSON/CLI 片段），它们被压成下方**逐 slice 摘要**——「slice 名（Slice 目录）+ 一行取自它自己文字的目的」；`Roadmap Change Log` 的 78 条按日期记录（2026-06-07 → 2026-06-12）压成一条总述。

**简化 Context 与 Workspace 模型路线图（Simplify Context And Workspace Model Roadmap）**

这份路线图是 `goal.md` 所述工作的内部计划。

目标很简单：

```text
Specs are what is true.
Work is what is in motion.
```

OpenSpec 的工作应住在普通的 Git 文件里。那些文件可以住在 project repo 内部，也可以住在一个单独的 OpenSpec repo 中，由它指向一个或多个 project repo。

这份路线图应能被没有任何 beta 背景的人读懂。每个条目都说：

- 用户能做什么。
- 为什么它重要。
- 命令或文件上有什么变化。
- 用户或 agent 怎么知道它成了。

这还不是公开的产品文案。保持务实、小、对「已经存在什么」诚实。

#### 用大白话说这件事（The Story In Plain English）

今天，这个领域里有太多东西是用 beta 术语解释的：context store、initiative、workspace、collection 与 repo-local 模式。

更简单的产品故事应变成：

1. OpenSpec 可以住在这个 project repo 里，也可以住在它自己的 Git repo 里。
2. 如果 OpenSpec 住在它自己的 repo 里，用户可以在本地注册那个 repo。
3. 正常的 OpenSpec 命令可以在那个被选中的 OpenSpec repo 中创建、读取、校验与归档工作。
4. 一个拥有自己 OpenSpec root 的 project repo，可以引用它工作所取用的独立 OpenSpec repo，例如来自 PM 与架构师的高层需求，而不让那些 repo 接管命令的作用位置。
5. personal workset 可以把一个规划 repo 与用户为这台机器显式选择的代码 repo 一起打开。
6. 组装出的 OpenSpec 上下文可以展示 root 加被引用的 store；它不会从声明中推断实现 repo。

产品不应要求用户或 agent 把 initiative、workspace 拥有的规划或 collection 状态理解为主要模型。

#### 本路线图的词汇（Vocabulary For This Roadmap）

- **OpenSpec root**：那个带 `config.yaml`、`specs/` 与 `changes/` 的 `openspec/` 文件夹。
- **OpenSpec inside a project repo**：`openspec/` 文件夹住在代码 repo 内部。
- **Standalone OpenSpec repo**：`openspec/` 文件夹住在它自己的 Git repo 里。
- **Store**：一个在这台机器上注册的独立 OpenSpec repo。它有一个很薄的 `.openspec-store/store.yaml` 身份文件，但真正的规划工作住在 `openspec/` 下的普通文件里。（2026-06-11 从 beta 名词「context store」改名而来；CLI 命令组的改名落在 slice 1.4。）
- **Reference store**：一个 project repo 的工作取用其上下文的独立 OpenSpec repo（例如 PM/架构师的需求）。reference 永不改变命令的作用位置；它被当作上下文读取。
- **View**：一种本地便利，用来把 OpenSpec repo 与 project repo 一起打开。它不是真值来源。

#### 我们不应忘记的规则（Rules We Should Not Forget）

- 保持正常的 `openspec/specs/` 与 `openspec/changes/` 生命周期可用。
- 当使用 context store 时，把它们当作独立 OpenSpec repo，而不是一套单独的规划系统。
- references 是 repo 级配置，绝不是按 change 的生命周期链接。一旦每个 change 都携带一个带状态耦合回某个 store 的受管理链接对象，我们就重新发明了 initiative。
- 一个 change 只住在一个 root 里。跨 root 的编辑是两个 change；第二个 root 用 `--store` 显式抵达。
- 不要在更简单的产品路径中创建新的 initiative 链接。
- 不要在更简单的产品路径中创建 workspace 拥有的规划状态。
- 不要在这些 slice 中承诺 clone、pull、push、sync、branch、worktree、dashboard、apply、verify 或 archive 编排。
- 把旧的 beta 文件当作历史，除非它们阻塞更简单的路径。
- 在行为稳固之前不要改写公开文档。

#### 进度速览（Progress At A Glance）

用它作为快速的「我们到哪了？」视图。

工作分支：所有路线图实现都发生在唯一的 `codex/store-root-parity` 分支（PR #1190）上，每个 slice 叠在前一个之上。合并到 `main` 被推迟到这份工作作为一个整体准备落地时；每个 slice 里的「Merged to `main`」复选框在那之前保持未勾，而且不阻塞下一个 slice。

带编号的标签是路线图工作项 id。一个条目内部更小的 `Progress` 复选框是该编号工作项的状态步骤。

- [x] **Phase 0. 让当前方向易于找到。** 旧的 beta 计划被标记为历史，这个 `/work` 路线图成为当前方向。
- [ ] **Phase 1. 让一个独立 OpenSpec repo 有用。** slice 1.1–1.4 已在工作分支上实现且测试通过；只剩合并到 `main`。名词到处是「store」（CLI 命令组、machine token、guidance、文档），并且一个无头 agent 仅凭一条普通提示就完成了一个 store 范围内的 change（dogfood transcript 在 1.4 的 slice 文件夹里）。
- [x] **Phase 2. 停止让新工作走 initiative。** 已被完全吸收：2.1 在 slice 1.2 内交付，2.2 折入 slice 1.4，2.3 折入条目 4.1。这里不再有独立工作。
- [x] **Phase 3. 说明 root 之间如何相关：references。** 完成（合并到 `main` 待办）：references、declared-store fallback、canonical remote，以及 `openspec doctor` 的关系健康汇总都在工作分支上实现并测试。code-repo 声明/map 实验已于 2026-06-19 移除。
- [ ] **Phase 4. 组装工作上下文。** 完成（合并到 `main` 待办）：`openspec context` 交付组装出的工作集；旧的 workspace 打开机械被删除（吸收了旧的 2.3）。
- [ ] **Phase 5. 只在旧表面让简单路径困惑时才移除它们。** 判据已商定（删除，排序推进）。第一批已完成：`workspace` 与 `initiative` 命令组被删除（净 −12.9k 行）。余下部分在 4.1 之后执行。
- [ ] **Phase 6. 证明整体，准备好迎接第一批用户。** 最终验收 capstone：persona journey、可用性与技术审计、全量 delta 评审、发布就绪报告。最后运行。
- [ ] **Phase 7. 保留并打开 personal workset。** 完成（合并到 `main` 待办）：`workset` 命令组（compose/list/open/remove）、带本地配置的双风格 opener 表、capstone dogfood transcript，以及已处理评审意见的已 push 分支 —— 都在工作分支上。

下一个未完成项：

- （无）—— 路线图里每一项都已通过它最后一个合并前复选框。整份路线图里唯一未勾的框是每项的「Merged to `main`」，它们会在分支落地（PR #1190）时一起关闭。

#### 阶段 0. 让当前方向易于找到（Phase 0. Make The Active Direction Easy To Find）

这个阶段已完成。它清理了旧的路线图来源，好让 agent 与人不会跟错计划。

Phase checklist：

- [x] **0.1** 把人们从旧的 context-store beta 计划引开。
- [x] **0.2** 把已推迟的 workspace 计划标记为不是当前队列。
- [x] **0.3** 围绕 OpenSpec root 重新表述本地 agent guidance。

逐 slice 摘要（各 slice 的详述正文已压缩）：

- `0.1 Point People Away From The Old Context-Store Beta Plan` —— 让旧的 context-store initiative 把读者指向这个 `goal.md` 与 `roadmap.md`，并让旧的 initiative 路线图不再被当作实现队列。
- `0.2 Mark Deferred Workspace Plans As Not The Current Queue` —— 把旧的 workspace 重实现 artifact 标记为已废弃或待删除评审，避免旧 workspace 的 apply、verify、archive、branch、worktree 或 dashboard 计划被意外复活。
- `0.3 Reframe Local Agent Guidance Around OpenSpec Roots` —— 把本地 guidance 改写成从「OpenSpec root 在哪里？」出发，而不是从「这是哪种 beta workspace/context-store 模式？」出发。

#### 阶段 1. 让一个独立 OpenSpec repo 有用（Phase 1. Make A Standalone OpenSpec Repo Useful）

这个阶段的面向用户目标：

```text
I can keep OpenSpec work in its own Git repo and still use normal OpenSpec
commands.
```

（译文：我可以把 OpenSpec 工作放在它自己的 Git repo 里，同时仍然使用正常的 OpenSpec 命令。）

Phase checklist：

- [x] **1.1** 创建或注册一个独立 OpenSpec repo。已在 draft PR #1190 实现。
- [ ] **1.2** 让正常命令使用一个具名的独立 OpenSpec repo。已在 `codex/store-root-selection` 上实现、测试并完成评审后续修复；合并待办。
- [ ] **1.3** 端到端证明独立 repo 的生命周期。spec 与 plan 写于 2026-06-11；在 `codex/store-root-parity` 上叠在 1.1 与 1.2 之上实现。
- [ ] **1.4** 一次 guidance 走查：store 进、initiative 出。吸收旧的条目 2.2；以 context-store 术语决策为门槛；承载 slice 1.2 遗留的 guidance 债。

逐 slice 摘要（各 slice 的详述正文已压缩）：

- `1.1 Create Or Register A Standalone OpenSpec Repo`（`slices/store-root-parity/`）—— 让 `context-store setup` / `context-store register` 把 context store 当作一个带薄身份文件的普通独立 OpenSpec root，持久的规划状态住在正常的 OpenSpec artifact 中。
- `1.2 Let Normal Commands Use A Named Standalone OpenSpec repo`（`slices/store-root-selection/`）—— 让正常命令能作用在一个按名字选定的已注册独立 OpenSpec root 上（`openspec new change add-billing --store team-context`），并顺带让 `new change` 停止创建 initiative 链接，使 `--store` 只有一个含义。
- `1.3 Prove The Standalone Repo Lifecycle End To End`（`slices/store-lifecycle-proof/`）—— 用一个双 checkout 的 journey 测试证明：已注册的独立 repo 支持与项目内 root 相同的基本生命周期，包括 clone、register、继续工作这条共享路径。
- `1.4 One Guidance Pass: Stores In, Initiatives Out`（`slices/store-rename-and-guidance/`）—— 把产品名词统一为 **store**（命令组、machine token、help、completions、生成的 skill、检入 guidance、文档），并让同一个 guidance 面不再宣传 initiative 与 workspace 作为正常流程。

#### 阶段 2. 停止让新工作走 Initiative（Phase 2. Stop Putting New Work Through Initiatives）

这个阶段的面向用户目标：

```text
Normal OpenSpec work should not require an initiative.
```

（译文：正常的 OpenSpec 工作不应要求一个 initiative。）

旧的 initiative 数据可以继续作为 legacy 历史可读，但更简单的路径应停止把新工作挂到 initiative 上。

截至 2026-06-11，这个阶段里的每一项都已被另一个 slice 吸收；这个阶段不承载独立工作。下面各节说明每一项去了哪里。

Phase checklist：

- [x] **2.1** 停止在正常 change 流程中创建新的 initiative 链接。2026-06-10 提前拉进 slice 1.2；在那里实现。
- [x] **2.2** 把 initiative 命令隐藏或移出主路径。2026-06-11 折入 slice 1.4（一次 guidance 走查）。
- [x] **2.3** 让 workspace 打开不再依赖 initiative。2026-06-11 折入路线图条目 4.1（打开在那里被重建）。

逐 slice 摘要（各 slice 的详述正文已压缩）：

- `2.1 Stop Creating New Initiative Links In Normal Change Flows` —— 提前拉进 slice 1.2（`slices/store-root-selection/`）：`new change` 不再创建 initiative 链接，`openspec set change` 因只有链接 initiaive 这一个行为而被移除，既有的 `.openspec.yaml` initiative metadata 仍可解析。
- `2.2 Hide Or Move Initiative Commands Out Of The Main Path` —— 折入 slice 1.4：教 guidance 认识 store 与让这些 guidance 面不再宣传 initiative 是同一次再生成，而不是两次。
- `2.3 Make Workspace Opening Stop Depending On Initiatives` —— 折入路线图条目 4.1：研究显示 initiative 选择被硬编码在约 5,500 行 workspace 打开机械里（`WorkspaceContextState` 的核心就是 initiative 形状），而 4.1 无论如何都会围绕组装出的上下文重建打开。

#### 阶段 3. 说明 root 之间如何相关：References（Phase 3. Say How Roots Relate: References）

这个阶段的面向用户目标：

```text
This project repo's work draws on these planning repos.
```

（译文：这个 project repo 的工作取自这些规划 repo。）

root 之间一种被声明的关系：

- 一个 project repo 可以**引用**它的工作所取用的独立 OpenSpec repo（PM 与架构师把高层需求与设计放在一个 store 里；开发者在应用 repo 自己的 OpenSpec root 中创建低层设计与任务，并以该 store 作为被引用的上下文）。

root 解析优先级是固定的，并且只陈述一次：显式的 `--store` 优先，然后是最近的本地 `openspec/` root，然后是（只在没有本地 root 时）一个已声明的默认 store，最后是今天的带提示的错误。已声明的 store 绝不覆盖本地 root，references 绝不改变命令的作用位置。

更早的 code-repo 关系方向于 2026-06-19 被移除，因为心智模型不清楚，而当前的 workset UX 通过显式的本地组合解决了观察到的「把规划和代码一起打开」需求。

2026-06-11 锁定的决策：

- **索引，不内联（3.1）。** 被引用 store 的内容绝不内联进生成的 instructions；instructions 携带一个在组装时从已注册 checkout 实时构建的索引（有哪些 spec、一行摘要、经由 `--store` 的 fetch recipe），agent 自行取用它需要的。内联会把上游内容冻结在生成时刻 —— 正是这次努力要消灭的复制粘贴失败。
- **声明住在 `openspec/config.yaml`（3.1、3.2）。** `references:` 与兜底 `store:` 指针共用一个归属地。兜底情况是一个只有 config 的 `openspec/` 目录（没有 `specs/` 或 `changes/`）：root 检测保持今天的 stat-only 走查，两个额外的 stat 区分真实 root 与指针，而当 root 同时具有规划形态与指针时 doctor 给出警告（按优先级指针被忽略）。顶层标记文件被否决：`.openspec.yaml` 已被按 change 的 metadata 占用，而只有点号的文件名冲突对 agent 是一种危险。
- **关系是位置、声明或引用 —— 绝不是受管理的 artifact 链接。** 工作住在哪里是一种关系（`--store` 是 root 选择，不是链接）；root 在 collection 级别一次性声明 references；artifact 到 artifact 的派生（「derives from team-context/billing」）是散文引用，agent 通过 reference 机械去跟随它。没有按 change 的边对象（见 Rules We Should Not Forget）。

Phase checklist：

- [ ] **3.1** 让一个 project repo 引用它的工作所取用的 store。spec 与 plan 已写好并评审（`slices/store-references/`）；实现是下一步。
- [ ] **3.2** 在没有本地 root 时兜底到一个已声明的 store。
- [ ] **3.3** 在 store 身份中记录一个 canonical remote。
- [x] **3.4 / 3.5 已移除。** code-repo 关系实验在 beta 行为变硬之前就被删除。
- [ ] **3.6** 报告 root 与 reference 的关系健康。

逐 slice 摘要（各 slice 的详述正文已压缩）：

- `3.1 Let A Project Repo Reference The Stores Its Work Draws On`（`slices/store-references/`）—— 让一个 project repo 一次性声明它的工作取自哪些 store，此后该 repo 里每个 agent 会话都能在它已读的 instructions 里看到这些 store 的 spec 索引（存在什么、各一行、以及取用的确切命令）。
- `3.2 Fall Back To A Declared Store When No Local Root Exists`（`slices/declared-store-fallback/`）—— 让一个规划完全外置（没有本地 OpenSpec root）的 repo 只声明一次 store，此后每条正常命令都不必再带 `--store`；声明是兜底，永不覆盖。
- `3.3 Record A Canonical Remote In Store Identity`（`slices/store-canonical-remote/`）—— 让 store 在它检入的身份文件里记录自己是从哪里克隆来的，使每个原本说「向队友要一份 checkout」的表面都能给出确切的克隆来源。
- `3.4 / 3.5 Removed: Code-Repo Relationship Experiment` —— 专用的实验 slice 于 2026-06-19 删除：那个抽象要求用户在产品还没有清晰场景时就维护一份检入声明加一份机器本地映射；真实 dogfood 用手动 workset 成员打开规划 store 加代码 repo，已经解决了当前用户需求。
- `3.6 Report Relationship Health`（`slices/relationship-health/`）—— 用一个只读的地方回答一个问题：被解析出的 OpenSpec root 是否健康，它引用的 store 在这台机器上是否可用；`openspec doctor` 分开报告 root 健康、store metadata 健康、reference 健康与跨领域的关系警告。

#### 阶段 4. 组装工作上下文（Phase 4. Assemble The Working Context）

这个阶段的面向用户目标：

```text
Give me — or my agent — everything this work relates to in one working set:
the OpenSpec root and the stores it references.
```

（译文：把这份工作相关的一切给我或我的 agent，收在一个工作集里：OpenSpec root 与它引用的 store。）

Phase checklist：

- [x] **4.1** 从已声明的关系组装工作上下文。（合并到 `main` 待办。）

逐 slice 摘要（各 slice 的详述正文已压缩）：

- `4.1 Assemble The Working Context From Declared Relationships`（`slices/assemble-working-context/`）—— 从任意 root 出发，用一条命令产出它的声明所描述的 OpenSpec 工作上下文（被解析出的 root 加被引用的 store），可作为 agent brief（JSON）、人类清单或可选的 `.code-workspace` 文件消费；无法解析的 reference 被报告而不是被猜。本条吸收了路线图条目 2.3（旧的 workspace 打开机械随之删除）。

#### 阶段 5. 只在旧表面让简单路径困惑时才移除它们（Phase 5. Remove Old Surfaces Only When They Confuse The Simple Path）

这个阶段的面向用户目标：

```text
Remove or hide old beta surfaces only when they make the simple path harder to
use or understand.
```

（译文：只在旧的 beta 表面让简单路径更难用或更难懂时才移除或隐藏它们。）

Phase checklist：

- [x] **5.1** 当旧的 workspace 与 initiative 路径阻塞或困惑简单路径时，移除或隐藏它们。（合并到 `main` 待办。）

逐 slice 摘要（各 slice 的详述正文已压缩）：

- `5.1 Remove Or Hide Old Workspace And Initiative Paths`（`slices/delete-legacy-command-groups/`）—— 判据已商定为「删除，不隐藏 —— 排序推进」：guidance 面在 slice 1.4 死去，`workspace` 与 `initiative` 命令组成为一次小的删除 slice（第一批净 −12,903 行），workspace 的**状态模型**与 `workspace-planning` 模式在 4.1 替换打开时死去；不可侵犯的豁免仍然有效：绝不自动删除用户数据文件。

#### 阶段 6. 证明整体，准备好迎接第一批用户（Phase 6. Prove The Whole, Ready For First Users）

这个阶段的面向用户目标：

```text
A person with zero context can start using this today: every persona
journey works cold, every error leads somewhere, and the codebase ended
leaner than it started.
```

（译文：一个零背景的人今天就能开始用它：每条 persona journey 都能冷启动跑通，每个错误都指向某处，而代码库最终比开始时更瘦。）

Phase checklist：

- [ ] **6.1** 最终验收 capstone。

逐 slice 摘要（各 slice 的详述正文已压缩）：

- `6.1 Final Acceptance Capstone` —— 各个 slice 证明了它们自己；这一项证明产品，即所有阶段之和作为一个整体被评审与演练；完整清单在 `runbook.md`（「Final acceptance capstone」）。已完成的勾选项：persona journey 全过（`capstone/journeys.md`）、可用性审计（`capstone/usability-audits.md`）、技术审计（`capstone/technical-audits.md`）、对 `origin/main...HEAD` 的全量 delta 评审 gauntlet 无未决 P1/P2（`capstone/gauntlet.md`）、发布就绪报告已提交（`capstone/release-readiness.md`）；只剩合并到 `main`。

#### 阶段 7. 保留并打开 Personal Workset（Phase 7. Keep And Open Personal Worksets）

这个阶段的面向用户目标：

```text
Let me keep my own named view of the folders I work on together, and
open them all with one command in the tool I choose.
```

（译文：让我把我一起处理的那些文件夹保留成一个自己的具名视图，并用一条命令在我选的工具里把它们全部打开。）

Phase checklist：

- [ ] **7.1** personal workset：组合、保留并打开一个本地工作视图。

逐 slice 摘要（各 slice 的详述正文已压缩）：

- `7.1 Personal Worksets: Compose, Keep, And Open A Local Working View`（`slices/personal-worksets/`）—— workset 是一个纯粹本地、个人、具名的工作视图：用户手动组合它（一个规划 root 加他们选择的任意文件夹），把它留在自己的机器上，按名字重新打开，并启动进自己选择的工具；它不检入、不共享、不从声明派生，也绝不是成员资格真值。用户指示的后续（owner 设计评审，2026-06-12）取代了 `workset-direction.md` 中按 change 锚定的方向。

#### 后来的想法（Later Ideas）

在更简单的独立 OpenSpec repo 路径能用之前，把这些挡在主队列之外：

- **L1** 在行为稳固之后改写公开概念文档。
- **L2** 决定一旦行为已经改变，已被接受的 workspace-planning spec 应如何变化。
- **L3** 只有在真实使用显示出清晰的用户模型之后，才重新考虑更丰富的多 repo 协调。
- **L4** 只有在基线与独立 repo 流程都稳固之后，才考虑一等的 `work/`。
- **L5** 重新考虑 `changes/` 是否应演变为 `work/` 下 change 形状的 work。
- **L6** 只有在手动形态被证明有用之后，才加入机器可读的 `/work` metadata。
- **L7** `context-store` 术语的保留或改名**决策**已于 2026-06-11 移入 slice 1.4（guidance 散文不应把一个我们还没选定的名字烤进去，而在没有用户时改名是免费的）。如果选择了改名，只有它的执行可以落在这里作为单独的 slice。
- **L8** 评审本地 `use-openspec` skill guidance，并决定它应是一个被忽略的本地 skill、生成的 artifact、检入的源码，还是产品化的默认。
- **L9** 只在它们对简单的独立 repo 流程有影响时，修掉小的基线怪癖，例如 `openspec list --specs` 的 JSON 支持。
- **L10** 只有当类 initiative 的行为以后仍然被证明有用时，才把它作为 Git-native 的 work 类型重新引入。
- **L11** 如果文件系统与 Git 历史被证明不够用，就让已归档的 change 能通过命令浏览（例如 `list --archived`）。目前 archive 命令自己的确认行就是生命周期的验证信号。

#### 路线图 Change Log（Roadmap Change Log，压缩）

> 源文件此处是一份按日期排列的 changelog，共 **78 条**，覆盖 **2026-06-07 → 2026-06-12**（06-07 ×2、06-08 ×3、06-09 ×5、06-10 ×4、06-11 ×53、06-12 ×11）。按本节的压缩说明，这里不逐条译出，只归纳它记录的弧线：它按时间记下了路线图自身的演化 —— 从把活跃的重新导向实验放到 `openspec/work/` 之下、把旧 initiative/workspace 材料改写为「过渡证据与 beta 历史」开始；随后重排为独立 OpenSpec repo 与本地视图，逐步锁定并实现 slice 1.2 / 1.3 / 1.4 / 3.1 / 3.2 / 3.3 / 3.6 / 4.1 / 5.1 / 6.1 / 7.1，每一轮都记下它的 spec、plan、两路对抗式评审折入的发现、`Decided autonomously (review me)` 条目、测试套件规模（从 85 files / 1,616 tests 到 101 files / 1,799 tests）与 capstone 审计结果；也包括 2026-06-19 对 code-repo 声明/map 实验的删除，以及 2026-06-12 owner 设计评审把按 change 锚定的 workset 方向替换为路线图条目 7.1。

### 44.7 `capstone/`（5 个文件，全译）

> 源文件：`reference/openspec/openspec/work/simplify-context-and-workspace-model/capstone/{gauntlet.md, journeys.md, release-readiness.md, technical-audits.md, usability-audits.md}`。五个文件全部全译；它们的 `##` 内容标题记为 `#####`。

#### 44.7.1 `gauntlet.md`

> 源文件：`reference/openspec/openspec/work/simplify-context-and-workspace-model/capstone/gauntlet.md`

**Capstone 全量 delta 评审 Gauntlet（6.1）—— 发现台账**

2026-06-11 对 `origin/main...HEAD` 运行，用了四个机制：max effort 的 `/code-review`（3 次 finder 扇出 + 一轮 12 个候选的验证 + gap 清扫）、一个 32-agent 对抗式 Workflow（六个镜头 × 反驳式验证 + 完整性批评者）、一次 codex 全量 delta 评审，以及审计排队的条目。下面每一条发现都已 CONFIRMED（多数为实测复现）。Status 列追踪修复轮次。

##### P1（2）

| # | 发现 | 状态 |
|---|---------|--------|
| G1 | 推荐使用的 `~/openspec/<id>` 布局把 `$HOME` 变成了一个「最近」root：走查中任何 `openspec/` **目录**都算数，于是 home 树下的每条生命周期命令都静默地把规划文件落进 `$HOME/openspec/changes/`，而 registered-store 提示永不触发。 | **fixed**（37ad867；已实测复验） |
| G2 | `status`/`instructions` 的 `--json` 在抛错时不输出任何 JSON 文档（stdout 上还多一个空行）；属于更广的 JSON 失败契约家族。 | **fixed**（37ad867；已实测复验） |

##### P2（13）

| # | 发现 | 状态 |
|---|---------|--------|
| G3 | JSON 失败契约家族：`show`/`validate` 的未知条目、`list`（既没有 failurePayload，又有 changes-dir 抛出）、`store <unknown subcommand>`，全部以 exit 1 退出且 stdout 上零 JSON；而 agent-contract.md 目前声称这已修好。 | **fixed**（37ad867；已实测复验） |
| G4 | `doctor`/`context` 漏掉了共享的 `--store-path` 拒绝接缝（报的是 Commander 的 unknown-option，而不是带类型的 `store_path_not_supported`）。 | **fixed**（37ad867；已实测复验） |
| G5 | doctor 未加防护的 `gitOriginUrl(root.path)` 会向上走：一个嵌套在另一个 checkout 里的非 repo store 会报出外层 repo 的 origin 以及虚假的 `store_remote_divergence`（实测复现；违反了 operations.ts 自己记录下来的防护）。 | **fixed**（37ad867；已实测复验） |
| G6 | 陈旧的 registry 锁 = 永久的 `store_registry_busy`，而且给出的修复永远不可能奏效；`store remove` 期间按 Ctrl-C（它在整个递归 rm 期间持锁）会把它变成孤儿；doctor 对它视而不见；EACCES 也被误报为 busy。 | **fixed**（37ad867；已实测复验） |
| G7 | 只有 config 的 root：`new change` 创建了 change 却从不补完形态（scaffold 防护只在 `openspec/` 完全缺失时触发）—— doctor 随即把工具刚写入的 root 判为不健康。 | **fixed**（37ad867；已实测复验） |
| G8 | 提示注入面：target 的 `remote` 字符串、被引用 store 的 spec id（原始目录名）与 Purpose 摘要原样渲染进 `<referenced_stores>`/instruction 输出 —— 来自恶意 clone 的换行/控制字符可以伪造 instruction 行。 | **fixed**（37ad867；已实测复验） |
| G9 | 另有五份已接受的 spec 仍然 REQUIRE 已被删除的行为（artifact-graph、schema-resolution、change-creation 为 P2；cli-update、openspec-conventions 为 P3）—— L2 的切除只覆盖了 cli-config/cli-artifact-workflow。 | **fixed**（37ad867；已实测复验） |
| G10 | 生成的 workflow skill 仍在指示 agent 从已经变化的状态 JSON 表面解析 `planningHome`（archive-change 模板）。 | **fixed**（37ad867；已实测复验） |
| G11 | 生成的 zsh completion 脚本语法无效 —— `--store` 描述里的撇号（“you've”）破坏了 zsh 引号（完整性批评者，实测）。 | **fixed**（37ad867；已实测复验） |
| G12 | `store remove` 在 registry 写入提交之前就删掉了 store 文件夹 —— 提交失败会留下一个指向已删文件的幽灵注册。 | **fixed**（37ad867；已实测复验） |
| G13 | setup 的 prepare/execute 拆分：目录策略（非空、嵌套 git）只在 prepare 时断言；交互式确认的间隙无上界，而回滚的 `kind === 'missing'` 分支会递归删除 setup 从未创建的内容（两侧均实测复现）。 | **fixed**（37ad867；已实测复验） |
| G14 | 首次提交失败后遗留一个孤儿的新 `.git`（清理被嵌在 `createdPaths.length > 0` 之下）；重跑随后注册一个无提交的 store —— 正是这个 slice 存在要防止的那种空 clone 状态。 | **fixed**（37ad867；已实测复验） |
| G15 | registry 回滚竞态：`commitStoreRegistration` 的 catch 在锁之外删除 store metadata，可能删掉一个并发提交的注册所依赖的 metadata（实测复现；P3→P2 边界情况，与 G12/G13 一起排队）。 | **fixed**（37ad867；已实测复验） |

##### P3（取便宜项 vs 记录项）

排入修复轮（便宜、机械）：purpose 提取中的 fence 标记失步；`pathIsFile` 中把 stat-EACCES 当作缺失（已注册 store 被报为未注册并附带 clone 修复）；陈旧 target 清扫中 `existsSync` 与 `isDirectory` 的混用（一个位于已映射路径上的**文件**会呈现为可用并落进 code-workspace）；scaffold 出的 config 把一次性的 `--schema` 烤成 root 默认值；`list --json` 的紧凑与美化不一致；declared-pointer 的 repo-id 修复文案；root 相对的「Created change at」打印（应改为绝对路径）；写侧的跨小节重叠检查；文档修复（affected_areas 措辞、setup 选项表里的 `--remote`、--tools 里的 `vibe`、陈旧的 `list` 输出示例）；来自技术审计的死代码 P3 队列（apply 兜底 + resolveCurrentPlanningHomeSync、resolveRegisteredStore、references barrel 那一行、PlanningHomeSummary、parseJson 合并）。

记为报告用已知缺口（本轮未修，映射到 Later Ideas / release note）：registry fsync 持久性；在极端 reference 数量下 reference 索引字节预算以线性方式增长越过 50KB；Windows 的 clone recipe 引号处理（单引号 vs cmd.exe）；`view`/`templates`/`schemas`/deprecated 名词形式仍基于 cwd（已在 agent 契约中记录）；completions 会从裸 cwd 枚举 id；跨平台 CI 矩阵没有在这个分支上跑；被删除的 CLI 表面的 semver/changeset 规划；README 尚未描述 store 模型（L1 —— 公开概念文档改写）。

##### 结论（Verdicts）

- codex：FIX-FIRST（2 P2、1 P3 —— 都在上表中）。
- Workflow（32 个 agent、6 个镜头、反驳式验证）：25 条已确认发现 + 7 个完整性缺口 —— 均已在上面分诊。
- /code-review max：12/12 个候选被验证轮 CONFIRMED（其中 3 条是对代码自己记录的不可变量的跨发现违反）+ 6 条 gap 清扫发现 —— 均已在上面分诊。

全部 15 条 P1/P2 发现都在提交 37ad867 中修好，并经实测探针复验（JSON 契约码、`--store-path` 接缝、陈旧锁窃取、只有 config 的 scaffold 补完、幽灵 root 回归测试）加上完整套件（97 files、1,761 tests）。排队的便宜 P3 集合落在同一提交里；记为报告项的内容出现在发布就绪报告的已知缺口中。

#### 44.7.2 `journeys.md`

> 源文件：`reference/openspec/openspec/work/simplify-context-and-workspace-model/capstone/journeys.md`

**Capstone Persona Journey（6.1）—— 结果**

2026-06-11 针对分支头执行。四条全部通过。

##### Journey 1 —— 新团队：PASS（常设 e2e）

`test/cli-e2e/store-lifecycle.test.ts`（1.3 的 journey，在改名与删除过程中一直维护）：机器 A 通过 `store setup` 创建一个 store（已提交、可克隆），从一个指针 project repo 把一个 change 走完到 archive，project repo 保持逐字节不变；机器 B 克隆、无需仪式地注册、读取被提升的 spec。在每次完整套件运行中都绿（现在是 1,761 个测试套件的一部分）。

##### Journey 2 —— 分层的 PM→开发流程：PASS（新 e2e）

`test/cli-e2e/capstone-journeys.test.ts`：需求住在一个 `product-requirements` store 中；应用 repo 有**自己的** root 和一份 `references:` 声明。agent 仅凭 config 就发现这层关系（`openspec context --json` 连它的 fetch recipe 一起呈现该成员），逐字照该 recipe 引用上游 spec（`openspec show billing-rules --type spec --store product-requirements`），低层设计的 change 落在应用 repo 自己的 root 中，而整个过程中该 store 保持只读。

##### Journey 3 —— 外置规划：PASS（新 e2e）

同一个文件：一个没有本地 root、config 里只有 `store: team-planning` 的代码 repo，跑完整个生命周期 —— new change、status、每个 artifact 的 instructions、archive —— 且**零** `--store` flag。change 住在 store 中并在那里归档；代码 repo 从不长出规划状态（结束时它的 `openspec/` 仍只有 `config.yaml`）。

##### Journey 4 —— 冷启动 agent：PASS（无头 dogfood）

一个全新的 codex 无头会话（gpt-5.5，medium reasoning）在一个临时世界里：一个 `billing-app` TypeScript 项目、PATH 上有 `openspec` CLI、隔离的 XDG 状态，以及**唯一**一句含糊提示「为这个项目在一个独立 repo 里搭起规划……从它的 --help 输出里发现它怎么工作」。没有任何内部知识。

agent 未经提示就产出了当时预期的那种拓扑：

- `openspec store setup billing-app-planning` → 一个带 specs/changes/config/store metadata 与自己的 git 历史的独立规划 repo；
- 指针 `store: billing-app-planning` 被写进 project repo 的 `openspec/config.yaml`；
- 用 `openspec doctor`、`openspec context` 与 `openspec validate --all --store billing-app-planning` 自验证。

运行之后独立验证：从 `billing-app` 内部执行 `openspec context --json` 能解析出被声明的 root。后来的评审移除了 code-repo 关系那部分；这里保留的证据是 store setup 与指针流程。

#### 44.7.3 `release-readiness.md`

> 源文件：`reference/openspec/openspec/work/simplify-context-and-workspace-model/capstone/release-readiness.md`

**发布就绪报告 —— simplify-context-and-workspace-model**

2026-06-11 提交于 `codex/store-root-parity`（按本次运行的常设指示，合并到 `main` 被有意推迟）。这是 6.1 capstone 的最终交付物：把产品作为一个整体来证明。

**结论：发布就绪，下面的已知缺口已映射到 Later Ideas。capstone 台账里任何地方都没有未决的 P1/P2 发现。**

##### 五分钟的新用户故事

你安装 OpenSpec，然后运行两条命令：

```bash
openspec store setup team-plans --path ~/openspec/team-plans
openspec new change my-first-change --store team-plans
```

这就是走到一个可用的、store 范围内的 change 的全部旅程 —— 两条命令、两个概念（一个 **store** 是注册在你机器上的独立规划 repo；一个 **change** 是工作单元），每一步的输出都会打印确切的下一条命令。从那里开始，生命周期是 `status` → 每个 artifact 的 `instructions` → `archive`，各自在自己的提示里携带 `--store`。你的代码 repo 用一行就连上（`openspec/config.yaml` 里的 `store: team-plans`），此后生命周期从它们内部以零 flag 工作；project root 可以声明 `references:` 以获得带 fetch recipe 的只读上游上下文。`openspec doctor` 回答「我的设置健康吗」；`openspec context` 回答「哪些 OpenSpec root 由声明关联起来」；personal workset 打开规划 repo 加用户选择的任意代码文件夹。一切都带 `--json` 与一份有记录的 agent 契约（`docs/agent-contract.md`）。

这个故事不是愿景式的：journey 4 冷启动跑了 store/指针路径，而后来的 workset dogfood 通过显式的 `--member` 组合把规划 store 与代码文件夹一起打开。code-repo 关系抽象现在被记为一次已移除的实验，而不是当前产品的证明。

##### 这份路线图交付了什么（总和）

- **一个 root 模型。** 单一的解析优先级（显式 `--store` → 最近的合格 root → 已声明指针 → hint/implicit），恰好实现一次，并验证在所有命令入口点上成立。store 是带类型的本地 registry 中的独立 OpenSpec repo。
- **已声明的 references，没有机械。** `references:` 是只读的上下文声明；没有任何东西 clone、同步或强制编辑边界。无法解析的 reference 降级为带可粘贴修复的 warning。
- **两个只读的组合面。** `doctor`（关系健康，四个分开的类别，发现也 exit 0）与 `context`（作为 agent brief / 人类清单 / 编辑器视图的工作集）。
- **旧模型被删除，不是被藏起来。** workspace/initiative 命令组、状态模型、schema、已接受的 spec 与 template guidance 都没了（第一批 −12,903 行；在当前 PR 头上，`src/` 相对 `origin/main` 在整个 delta 上仍净 **−3,189** 行）。

##### 审计结果（完整记录在本文件夹）

- **Persona journey**（`journeys.md`）：四条全过 —— 新团队（常设 e2e）、分层 PM→开发（新 e2e）、外置规划（新 e2e，零 `--store` flag）、冷启动 agent（实时无头 dogfood）。
- **可用性**（`usability-audits.md`）：55 个走错的错误目录（所有失败已修）；词汇清扫在实时清扫 root 与生成的 guidance 上干净，规划历史 artifact 按设计排除在外；首次成功耗时实测为 2 条命令 / 2 个概念。
- **技术**（`technical-audits.md`）：单 resolver 与依赖方向不可变量 HOLD；模块大小有界；agent 契约已记录并验证（`docs/agent-contract.md`）；死代码缩减为一份记录在案的 P3 队列。
- **全量 delta gauntlet**（`gauntlet.md`）：四个机制（max 的 /code-review、一个 32-agent 对抗式 Workflow、codex、完整性批评者）；2 条 P1 + 13 条 P2 发现，**全部在 37ad867 中修好并实测复验**，加上便宜的 P3 集合。最终套件：97 files、1,761 tests 全绿；全部 36 份已接受的 spec 通过校验。

##### 自主决策台账

每一条 `Decided autonomously (review me)` 条目都住在 roadmap changelog 里（18 条带标记的条目加上各 slice 记录的修订）。其中塑造了产品的那些：

1. 更早的 code-repo 关系实验已被取代并移除；只保留一条研究笔记，供未来的多 repo 协调设计使用。
2. declared-pointer root 通过与 `--store` 相同的 store resolver 解析（3.2）；损坏的 store metadata 仍是解析失败 —— 没有 doctor-only 的解析分叉（3.6 修订）。
3. `openspec doctor` 是顶层且以 root 为范围；任何严重程度的健康发现都 exit 0（3.6）。
4. 4.1 的表面是 `openspec context`（不是 `view`/`open`）；打开被生成出的 artifact **取代** —— 不启动编辑器；`binding.ts` 与 template 防护随状态模型一起死去（放宽的豁免范围）。
5. Phase 5 的余下部分删除了 workspace-planning schema、四个 beta change 文件夹与四份完全属于 workspace 的已接受 spec；混合的 spec 做了有界切除（L2 决定）。
6. Capstone 修复：nearest 走查现在要求一个**合格的** `openspec/`（规划形态或 config）；每一次 `--json` 失败都输出一份状态文档；`planningHome` 被恢复到 status JSON 中作为已发布的 agent 契约（反转了原计划的死代码合并 —— `PlanningHomeSummary` 又活了）；`store remove` 在删除文件之前先提交 registry 移除；提示渲染边界对被克隆的内容做净化。

##### 已知缺口及其处置

| 缺口 | 处置 |
|---|---|
| README/公开概念文档还没讲 store 的故事 | **L1**（行为稳固后改写公开文档）—— CLI 参考（`docs/cli.md`）与 agent 契约是最新的 |
| 更丰富的跨 repo 上下文（多 store fetch 的易用性、reference 索引在超过约 150 个 reference 后的增长） | **L3** |
| `view`、`templates`、`schemas` 与 deprecated 名词形式仍基于 cwd 且不带 `--store` | 已在 agent 契约中记录；若它们对简单流程有影响，可作为 L9 级修复的候选 |
| JSON 键大小写分裂（store 家族 snake_case vs workflow 家族 camelCase）与 envelope 类型统一 | 已在 agent 契约中记录；重命名已发布的键是第一个版本化发布时的产品决策 |
| registry fsync 持久性；Windows 的 clone recipe 引号处理；completions 从裸 cwd 枚举 id | 记录在案的工程笔记（gauntlet P3 台账）—— 都不阻塞 POSIX 机器上的第一个用户 |
| 跨平台 CI 矩阵没有在这个分支上跑；被删除的 CLI 表面没有 semver/changeset 规划 | 合并到 main 那一刻的发布流程工作，而本次运行有意不执行那一步 |
| `parseJson` 测试 helper 合并与同类的死代码 P3 | 记录在案的队列（`technical-audits.md`） |

##### 在用户之前还剩什么

一个动作：把 `codex/store-root-parity` 合并到 `main`（除「Merged to main」之外的每个路线图框都已勾上），并运行发布流程（CI 矩阵、版本、changelog）。该分支承载 80+ 个提交，每个提交在提交时都有一份全绿的完整套件。

#### 44.7.4 `technical-audits.md`

> 源文件：`reference/openspec/openspec/work/simplify-context-and-workspace-model/capstone/technical-audits.md`

**Capstone 技术审计（6.1）—— 结果**

2026-06-11 针对分支头执行；下面的体量与 delta 计数在之后的清理提交后已针对当前 PR 头刷新。

##### 单 resolver 不变量：HOLDS

root 选择优先级（显式 `--store` → 最近 → 已声明指针 → hint/implicit）恰好有一份实现（`resolveOpenSpecRoot`，root-selection.ts）。全部九个解析入口点（list/show/validate/status/instructions×2/new-change/archive/doctor/context）都经由它；doctor 与 init 额外的走查是解析后的诊断与 scaffold 防护，绝不是解析。发现并排队了一个潜在分叉：`generateApplyInstructions` 那条不可达的 `resolveCurrentPlanningHomeSync` 兜底（它唯一的调用者总是传入已解析的 home）—— 与该函数一起排队删除。deprecated 的名词形式（`change`/`spec`）基于 cwd 且不走查 —— 已记录，不是分叉。

##### 依赖方向：HOLDS

零 `core → commands/cli` 导入；零 `commands → cli` 导入；templates 什么都够不到。唯一的交叉链接是包入口（`src/index.ts`）同时再导出两者 —— 顶层组合。

##### 死代码：无 P2；五个 P3 与四条笔记，已排队或已记录

P3 队列（在 gauntlet 修复轮中能便宜修的已修）：

1. 不可达的 apply-instructions 兜底 + `resolveCurrentPlanningHomeSync`（在那之后只剩测试使用）。
2. `resolveRegisteredStore`（registry.ts）—— 只剩测试使用，已被 root-selection 涵盖，且它的修复文案引用了被移除的 `--store-path` flag。
3. references barrel 那一行（`core/index.ts`）—— 零消费者；同类模块被有意不做 barrel。
4. `PlanningHomeSummary` —— 在 4.1 之后与 `PlanningHome` 字段完全相同；同一性包装合并。
5. `parseJson` 测试 helper ×11 —— 把增强版合并进 `run-cli.ts`。

笔记（已记录，不动作）：`mkdir` fixture 副本 ×8（边缘价值）；`~/openspec/<id>` checkout 约定有 1 处计算 + 5 处散文（抽成常量会把它钉住）；`ext::` 传输 —— 零出现，shell 安全闸门 + `--` + 信任边界（团队检入的 store.yaml）成立，在闸门处排队一条威胁模型注释；`registerStore`/`isStoreRoot` 是只剩测试的导出（获准的 fixture API，已记录）。

##### 模块大小：有界

最大的 src 模块是 `store/operations.ts`，1,196 行；三个文件超过 800 行（operations、schema 命令、init）。`store.ts` 在 799，刚好在线下。src 总计：31,625 行。

##### Agent 契约清单：docs/agent-contract.md（已提交）

每个 JSON 形态、诊断 envelope、失败 payload、exit code 契约，以及一份 100+ 码的目录 —— 都对照发码代码验证过。文档中记录了 14 条一致性发现；其中一条达到 gauntlet 级别（P2）：在 `--json` 模式下，`validate`/`show` 的未知/有歧义条目路径与 `status`/`instructions` 的抛错只打印 stderr 并 exit 1，**不带** JSON 文档 —— 解析 stdout 的 agent 什么也拿不到。已排入 gauntlet 修复轮。其余（severity 为 low/medium：store 家族与 workflow 家族 payload 之间的 snake_case vs camelCase 分裂、四份平行的 envelope 类型声明、`list` 中的 `status` 键冲突、fallback 码的后缀命名、未版本化的 payload、schemas/templates 忽略 root 选择）记为报告的已知缺口 —— 重命名已发布的 JSON 键是产品决策，不是 capstone 修复。

##### 相对 origin/main 的净 LOC delta：src 如预期保持净负

- `src/`：净 **−3,189**（+8,489 / −11,678）—— Phase 5 的删除压过 Phase 3–4 的增量。
- `test/`：净 +956（+8,795 / −7,839）。
- 全量 delta：跨 235 个文件 +29,468 / −23,327；总插入主要由 `openspec/work/` 规划 artifact（spec、plan、roadmap 台账）主导 —— 那是过程文档，不是产品代码。

#### 44.7.5 `usability-audits.md`

> 源文件：`reference/openspec/openspec/work/simplify-context-and-workspace-model/capstone/usability-audits.md`

**Capstone 可用性审计（6.1）—— 结果**

2026-06-11 针对分支头执行。

##### 错误目录走查：55 个走错，46 过，9 失败

对新路径上每一个可能的走错做实时走查（13 个走查家族，人类 + JSON 两种表面），对照门槛评判：可行动、携带 store、正确的 exit code、诚实。解析层的分类法表现很好 —— 有区分度的 no-root 提示、带 code/fix 字段的单文档 JSON 失败、可被 shell 解析的 clone 修复、双向的命名空间冲突消息。

失败（在发布就绪报告之前修好；修复轮是下一个 capstone 提交）：

- **F1（P1）** 真实 root 中无法解析的 `openspec/config.yaml` 会倾倒出带 node_modules 栈帧的原始 YAMLParseError（`project-config.ts` 的 console.warn 把错误对象传了进去）。
- **F2（P2）** 损坏 registry 的修复从不点名 registry 文件 ——「Repair or remove the store registry file」没有路径，而建议的升级路径（`store doctor`）同样走死。
- **F3（P2）** 损坏 registry 下的 `instructions` 把 Fix 行整个丢掉（✖ Error 表面）。
- **F4（P2）** `validate` 的失败摘要不提供下钻命令（没有任何东西携带 `--store`）。
- **F5（P2）** 隐式 root 的 scaffolding（在空目录里 `new change`、非交互式 init）创建出的 root 立刻被 doctor 判为不健康（没有 config.yaml/specs/archive）—— 陷阱就是这不诚实的那一半。
- **F6–F9（P3）** 真实 root 上畸形指针的一条光秃秃、无路径的重复 warning；针对陌生 store 的指针修复被塑造成应对了错误的错误；在代码 repo 处注册 store 的修复假设了存在 store clone；`archive <nonexistent>` 不列候选，而 `status --change` 会列。

完整表格保存在审计 transcript 中（gauntlet 会复验修复）。

##### 词汇清扫（包括 docs/cli.md）

- 退役的 `context store` 形式：在强制清扫 root（`src`、`test`、`docs`、`scripts`，以及存在时的本地 `.codex` guidance）中零命中。`openspec/` 下的规划历史 artifact 按设计在这个清扫范围之外。
- `workspace`：没有已删除命令模型的 token 增长。剩下的实时命中是有意的：`.code-workspace` 这个文件格式名（VS Code 的约定）、`workspace-file` opener 风格、兼容测试与历史注释。生成的 template 由 parity 测试钉住，保持无残留。
- `initiative`：一条真实发现 —— `ChangeStatus.initiative`（instruction-loader）仍把一个存储着的 legacy initiative 链接透传到 status JSON。读取 legacy metadata 是对用户数据的容忍（正确）；在面向用户的 JSON 表面上**再输出**它则是残留。已排进修复轮：去掉这个透传，保留 schema 的解析容忍。`initiative_option_removed` 这条拒绝字符串是有意的（台账里记录的幸存者）。
- `docs/cli.md` 与 README：对退役的 `context store` 形式与旧命令模型术语都干净；实时保留 `.code-workspace` 措辞是刻意的。

##### 首次成功耗时：2 条命令，2 个概念

从干净的机器状态实时测量（隔离 XDG、无配置）：

1. `openspec store setup team-plans --path ~/openspec/team-plans` —— 创建 store、注册它、打印下一条命令。
2. `openspec new change my-first-change --store team-plans` —— 第一个 store 范围内的 change 存在了；输出打印下一条命令（`status`）并携带 `--store`。

新用户必须掌握的概念：**store**（一个注册在这台机器上的独立规划 repo）与 **change**（工作单元）。root 这个概念在多 root 工作开始之前保持隐含。每一步的输出都点名下一步 —— 这段旅程是自我引导的，冷启动 dogfood（journey 4）端到端确认了这一点。

### 44.8 `slices/`（1 个范本全译 + 10 个一行释义）

> 源文件：`reference/openspec/openspec/work/simplify-context-and-workspace-model/slices/`（11 个 slice 目录，各带 `spec.md` + `plan.md`）。
>
> **本节是显式压缩。**只把 `assemble-working-context` 这一个 slice 当作范本**全译**（`spec.md` + `plan.md`）；其余 10 个不译，按名字列出并各附一行取自各自 `spec.md` 的 `## Outcome` 的释义。另有几个 slice 携带的额外文件同样不译：`personal-worksets/research.md`（20.4 KB）、`personal-worksets/capstone-dogfood.md`、`store-rename-and-guidance/dogfood-transcript.md`、`delete-legacy-command-groups/deletion-ledger.md`、`delete-legacy-command-groups/remainder.md`。
>
> **格式骨架处理：**`#### 44.8.1` 里的 `spec.md` 与 `plan.md` 是**被展示的 artifact 格式**本身，因此它们的标题保留 artifact 自身的相对层级，使这份骨架读起来仍然成立：源 `##` 记为 `#####`（`Outcome`、`Locked Decisions`、`JSON Shape`、`Human Output`、`.code-workspace Emission`、`Scope`、`Acceptance Criteria`、`Current Shape`、`Implementation Notes`、`Test Coverage`），源 `###` 记为 `######`（`Assembly From References`、`Nothing Declared`、`Code-Workspace Emission`、`Old Machinery Is Gone`）。这两份 artifact 的源 H1（`Assemble Working Context Spec (4.1)` / `Assemble Working Context Plan (4.1)`）以粗体行给出，不占标题层级。

#### 44.8.1 范本：`assemble-working-context`（`spec.md` + `plan.md` 全译）

**`spec.md`（源文件：`slices/assemble-working-context/spec.md`）**

**Assemble Working Context Spec (4.1)**

##### Outcome

从任意 root 出发，一条命令产出它的声明所描述的 OpenSpec 工作上下文：被解析出的 OpenSpec root 加被引用的 store。结果可作为 agent brief（JSON）、人类清单或可选的 `.code-workspace` 文件消费。无法解析的 reference 被报告，而不是被猜。

更早的 code-repo 声明/map 实验已被移除。`openspec context` 不推断实现 repo；用户用 personal workset 显式组合代码文件夹。

##### Locked Decisions

1. **组装是本地便利，不是规划系统。** 被选定的 OpenSpec root 仍然是真值来源；references 提供只读的上游上下文。
2. **主要界面是 agent brief。** 编辑器文件是同一份被组装数据的消费者之一。
3. **没有机械。** 不 clone、不 pull、不 push、不同步、不 branch、不 worktree、不 dashboard、不启动、不强制编辑边界。
4. **无法解析的 reference 被报告，而不是被猜。**

##### JSON Shape

```json
{
  "root": { "path": "/abs/root", "source": "store|declared|nearest", "store_id": "...", "role": "openspec_root" },
  "members": [
    { "role": "referenced_store", "id": "upstream-context", "path": "/abs/store", "fetch": "openspec show <spec-id> --type spec --store upstream-context", "status": [] },
    { "role": "referenced_store", "id": "design-system", "status": [{ "code": "reference_unresolved" }] }
  ],
  "status": []
}
```

可用的成员带 `path` 与空的 `status`。不可用的成员连它们的诊断与修复一起留在 brief 里。顶层 `status` 承载跨领域的降级，例如 registry 不可读。

##### Human Output

```text
$ openspec context
Working context for team-context (/Users/dev/src/team-context)

OpenSpec root
  team-context  /Users/dev/src/team-context

Referenced stores
  upstream-context  /Users/dev/openspec/upstream-context
    Fetch: openspec show <spec-id> --type spec --store upstream-context

Not available on this machine
  - design-system: not registered
    Fix: git clone -- https://github.com/acme/design-system.git /Users/dev/openspec/design-system && openspec store register '/Users/dev/openspec/design-system' --id design-system
```

##### `.code-workspace` Emission

`--code-workspace <path>` 写出 `{folders: [{name, path}...]}`，root 放第一位，然后是命名为 `ref:<id>` 的可用被引用 store。既有文件没有 `--force` 就拒绝写入；缺失的父目录会失败；JSON 模式让 stdout 保持为单份 brief，并把写入确认送到 stderr。

##### Scope

在范围内：

- `src/core/working-set.ts`：纯粹的工作集组装与 workspace JSON 构建器。
- `src/commands/context.ts` 与 `src/commands/shared-gather.ts`：root 关系数据收集、人类/JSON 输出、code-workspace 写入处理。
- 删除旧的 workspace 打开机械。
- 针对 root 加被引用 store 组装的文档与测试。

不在范围内：

- `.code-workspace` 之外的编辑器集成；终端会话启动器。
- 任何 code-repo 推断或实现文件夹发现。
- 按 change 的上下文收窄。

##### Acceptance Criteria

###### Assembly From References

- **GIVEN** 一个由 store 支撑的 root，带一个可解析与一个不可解析的 reference
- **WHEN** `openspec context` 在人类与 JSON 模式下运行
- **THEN** JSON 只含 root 与被引用 store 成员，已解析的成员携带绝对路径与 fetch recipe，未解析的成员逐字携带既有诊断，且 exit code 为 0

###### Nothing Declared

- **GIVEN** 一个没有 reference 的 root
- **WHEN** context 运行
- **THEN** 集合只含该 root，`members: []`，且人类输出说这个工作集就是这一个 root

###### Code-Workspace Emission

- **GIVEN** 上面的混合 reference fixture
- **WHEN** `openspec context --code-workspace out.code-workspace` 运行
- **THEN** 文件只含 root 加已解析的被引用 store 的文件夹，未解析的成员被报告到 stderr，覆盖需要 `--force`，且没有其它文件或 registry 状态发生变化

###### Old Machinery Is Gone

- **GIVEN** 4.1 之后的树
- **WHEN** 套件运行且台账被翻阅
- **THEN** 旧的 workspace 状态机械已消失，组装在没有任何 workspace 或 initiative 状态的情况下工作

**`plan.md`（源文件：`slices/assemble-working-context/plan.md`）**

**Assemble Working Context Plan (4.1)**

##### Current Shape

`openspec context` 组装被解析出的 OpenSpec root 与被引用的 store。它不再包含被推断出的代码 repo 或实现文件夹发现。

##### Implementation Notes

1. 在 doctor 与 context 之间共享关系收集：registry 快照、health 模式的 reference 索引、root 检查。
2. 构建一份只含 root 与被引用 store 成员的工作集 brief。
3. 把不可用的 reference 连既有诊断一起留在 JSON/人类输出中。
4. 只在被显式要求时生成 `.code-workspace` 文件；只写那一个文件，且覆盖需要 `--force`。
5. 保留对旧 workspace/initiative 打开机械的删除。

##### Test Coverage

- 对 store、nearest 与 declared-pointer 会话的 JSON/人类 context。
- 已解析与未解析的 reference。
- 空 reference 的 root 措辞。
- Code-workspace 的写入/拒绝/force/父目录缺失行为。
- 只读快照断言。

#### 44.8.2 其余 10 个 slice（各附一行取自其 `spec.md` 的 `## Outcome` 的释义）

- `store-root-parity`（路线图 1.1）—— `context-store setup` 与 `context-store register` 把一个 context store 当作带薄身份文件的普通独立 OpenSpec root：setup 或注册之后持久规划状态住在正常的 OpenSpec artifact（config、specs、changes、archived changes）里，而 `.openspec-store/` 仍只是身份或本地 registry metadata。
- `store-root-selection`（路线图 1.2）—— 正常 OpenSpec 命令可以作用在一个按名字选定的已注册独立 OpenSpec root 上；选定 store 解析为一个普通 OpenSpec root，下游一切行为等同于在该 root 内运行命令，同时这个 slice 让正常 change 流程停止创建 initiative 链接，使 `--store` 只有一个含义。
- `store-lifecycle-proof`（路线图 1.3）—— 已注册的独立 OpenSpec repo 可证明地支持与项目内 OpenSpec root 相同的基本生命周期，包括那个让独立 repo 存在的共享路径（队友或第二台机器克隆、注册并继续工作）；证明本身就是一条串起来的 journey 测试。
- `store-rename-and-guidance`（路线图 1.4）—— 已注册独立 OpenSpec repo 的产品名词到处是 **store**（命令组、machine token、help 文本、completions metadata、生成的 workflow skill、检入的 agent guidance、文档）；同一次走查让 store 对 agent 可发现，并让同样的 guidance 面不再把 initiative 与 workspace 宣传为正常流程。
- `store-references`（路线图 3.1）—— 一个 project repo 可以一次性声明它的工作取自哪些 store，此后该 repo 里每个 agent 会话都能在它已读的 instructions 内看到这些 store 的 spec **索引**（存在什么、各一行、以及取用任一个的确切命令）；上游真值留在 store，下游工作留在 repo 自己的 root，连接是一份声明加引用。
- `declared-store-fallback`（路线图 3.2）—— 一个规划完全外置（没有本地 OpenSpec root）的 repo 声明它的 store 一次，此后每条正常命令都在那里工作而不必每次调用都带 `--store`；声明是兜底、永不覆盖。
- `store-canonical-remote`（路线图 3.3）—— 队友上手不再死在「register the store」：store 可以一次性在它检入的身份文件里记录自己是从哪里克隆来的，于是每个原本说「向队友要一份 checkout」的表面都能给出确切的克隆来源 —— 而记录 remote 不是同步。
- `relationship-health`（路线图 3.6）—— 一个只读问题、一个地方：被解析出的 OpenSpec root 是否健康，它引用的 store 在这台机器上是否可用；`openspec doctor` 把 root 健康、store metadata 健康、reference 健康与跨领域关系警告分开报告，什么都不 clone、pull、push、sync、branch 或 repair。
- `delete-legacy-command-groups`（路线图 5.1）—— `openspec workspace` 与 `openspec initiative` 命令组不再存在，只有它们消费的一切随之而去（命令层、孤儿 core 模块、completions 条目、测试与文档）；此后 CLI 可见的表面就是简单路径：OpenSpec root、store，以及正常的生命周期命令。
- `personal-worksets`（路线图 7.1）—— 跨若干文件夹工作（一个规划 root 加他们选择的任意 repo）的用户，可以在一次简短的引导流程里把这个分组命名并组合起来、把它留在自己机器上、安全地列出与移除，并按名字在他们选择的工具里重新打开；workset 纯粹是个人且本地的：不检入、不共享、不从声明派生，也绝不是成员资格真值。
