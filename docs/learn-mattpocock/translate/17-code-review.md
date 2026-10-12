## 17 code-review

> 译自 `reference/mattpocock-skills/skills/engineering/code-review/SKILL.md`（原文 87 行）。frontmatter 按原样保留。

**frontmatter**

- `name`: `code-review`
- `description`: `"Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes: Standards (does the code follow this repo's documented coding standards?) and Spec (does the code match what the originating issue/spec asked for?). Runs both reviews in parallel sub-agents and reports them side by side. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to \"review since X\"."`（从固定点（commit、分支、tag 或 merge-base）起评审改动，沿两条轴：标准（代码是否遵循本仓库文档化的编码标准？）与规范（代码是否符合起源 issue/spec 的要求？）。两个评审以并行子智能体运行并并排报告。当用户想评审一个分支、一个 PR、进行中的改动，或提出 "review since X" 时使用。）

对 `HEAD` 与用户给出的固定点（fixed point）之间的 diff 做两条轴的评审：

- **标准（Standards）**：代码是否符合本仓库文档化的编码标准？
- **规范（Spec）**：代码是否忠实实现了起源 issue / spec？

两条轴都作为**并行子智能体（parallel sub-agents）**运行，这样它们不会互相污染上下文，然后由本技能汇总它们的发现。

issue tracker 应该已经提供给你了。如果缺少 `docs/agents/issue-tracker.md`，告诉用户运行 `/setup-matt-pocock-skills`。

### 17.1 流程（Process）

#### 17.1.1 钉住固定点（Pin the fixed point）

无论用户说的固定点是什么（一个 commit SHA、分支名、tag、`main`、`HEAD~5` 等），那就是固定点。如果他们没指定，就问一个。

只捕获一次 diff 命令：`git diff <fixed-point>...HEAD`（三点，这样比较是相对于 merge-base 的）。同时用 `git log <fixed-point>..HEAD --oneline` 记下提交列表。

在继续之前，确认固定点能解析（`git rev-parse <fixed-point>`），并且 diff 非空。错误的 ref 或空 diff 应该在这里失败，而不是在两个并行子智能体内部失败。

#### 17.1.2 确定 spec 来源（Identify the spec source）

按这个顺序寻找起源 spec：

1. 提交信息里的 issue 引用（`#123`、`Closes #45`、GitLab `!67` 等），通过 `docs/agents/issue-tracker.md` 里的工作流获取。
2. 用户作为参数传入的一个路径。
3. `docs/`、`specs/` 或 `.scratch/` 下匹配分支名或功能的 spec 文件。
4. 如果什么都没找到，问用户 spec 在哪里。如果他们说没有 spec，**规范**子智能体将跳过并报告 "no spec available"。

#### 17.1.3 确定标准来源（Identify the standards sources）

仓库里任何记录代码应该怎么写的东西，例如 `CODING_STANDARDS.md` 或 `CONTRIBUTING.md`。

在仓库所记录的内容之上，标准这条轴始终携带下面的**气味基线（smell baseline）**：一组固定的 Fowler 代码坏味道（_Refactoring_，第 3 章），即使仓库什么都没记录也适用。有两条规则约束它：

- **仓库覆盖基线。** 仓库文档化的标准总是胜出；当它认可某件基线会标记的事情时，压制该坏味道。
- **始终是判断调用（judgement call）。** 每个坏味道都是一条加标签的启发式提示（"possible Feature Envy"），绝不是硬性违规。和这里的任何标准一样，凡是工具已经强制的东西都跳过。

每个坏味道的读法是 *它是什么* → *怎么修*；拿它与 diff 对照：

- **神秘命名（Mysterious Name）**：函数、变量或类型，其名称不能揭示它做什么或存什么。→ 重命名它；如果想不出诚实的名字，那说明设计本身浑沌。
- **重复代码（Duplicated Code）**：同一个逻辑形状在这次改动中出现于不止一个 hunk 或文件。→ 抽出这个共享形状，两处都调用它。
- **特性依恋（Feature Envy）**：一个方法访问另一个对象的数据比访问自己的还多。→ 把该方法搬到它所依恋的数据上。
- **数据泥团（Data Clumps）**：同样的那几个字段或参数总是结伴出现（一个想要诞生的类型）。→ 把它们打包成一个类型，传那个类型。
- **基本类型偏执（Primitive Obsession）**：用一个基本类型或字符串来代表一个值得拥有自己类型的领域概念。→ 给这个概念一个自己的小类型。
- **重复的 switch（Repeated Switches）**：同一个类型上的同一套 `switch`/`if` 级联在这次改动中反复出现。→ 换成多态，或者两个位置共享的一张映射表。
- **霰弹式修改（Shotgun Surgery）**：一个逻辑改动迫使 diff 里许多文件出现零散的编辑。→ 把一起变化的东西聚到一个模块里。
- **发散式变化（Divergent Change）**：一个文件或模块因为若干互不相关的原因被编辑。→ 拆分，让每个模块只因一个原因而变化。
- **夸夸其谈通用性（Speculative Generality）**：为 spec 并不存在的需求添加的抽象、参数或钩子。→ 删掉它；先内联回去，等真实需求出现再说。
- **消息链（Message Chains）**：调用方不该依赖的长链 `a.b().c().d()` 导航。→ 把这段行走藏在第一个对象的一个方法后面。
- **中间人（Middle Man）**：一个类或函数大部分只是在往下委托。→ 砍掉它，直接调用真正的目标。
- **被拒绝的馈赠（Refused Bequest）**：一个子类或实现者忽略或覆盖了它继承来的大部分东西。→ 放弃继承，改用组合。

#### 17.1.4 并行派出两个子智能体（Spawn both sub-agents in parallel）

**标准子智能体的提示词**应包含：

- 完整的 diff 命令和提交列表。
- 你在第 3 步找到的标准来源文件清单，**再加上第 3 步的气味基线**完整粘贴进去（该子智能体没有其他途径拿到它）。
- 简报："Report, per file/hunk where relevant, (a) every place the diff violates a documented standard: cite the standard (file + the rule); and (b) any baseline smell you spot: name it and quote the hunk. Distinguish hard violations from judgement calls: documented-standard breaches can be hard, but baseline smells are always judgement calls, and a documented repo standard overrides the baseline. Skip anything tooling enforces. Under 400 words."

**规范子智能体的提示词**应包含：

- diff 命令和提交列表。
- spec 的路径或已获取的内容。
- 简报："Report: (a) requirements the spec asked for that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep); (c) requirements that look implemented but where the implementation looks wrong. Quote the spec line for each finding. Under 400 words."

如果缺少 spec，跳过规范子智能体，并在最终报告中说明这一点。

#### 17.1.5 汇总（Aggregate）

把两份报告分别放在 `## Standards` 和 `## Spec` 标题下呈现，逐字照录或稍作清理。**不要**合并或重排发现，因为两条轴是刻意分开的（见 _为什么是两条轴_）。

以一行总结结尾：每条轴的发现总数，以及 _每条轴内部_ 最严重的问题（如果有）。不要跨轴挑出唯一赢家：那正是这种分离要防止的重排。

### 17.2 为什么是两条轴（Why two axes）

一个改动可以通过一条轴而不通过另一条：

- 遵循每一条标准但实现了错误东西的代码 → **标准通过，规范不通过。**
- 完全做到了 issue 所要求的事、但破坏了项目约定的代码 → **规范通过，标准不通过。**

把它们分开报告，可以阻止一条轴掩盖另一条轴。
