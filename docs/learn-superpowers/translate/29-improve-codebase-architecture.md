## 29 improve-codebase-architecture

> 译自 `C:\Users\chenweilin\.dsh\skills\improve-codebase-architecture\SKILL.md`（原文 71 行；与 `reference/mattpocock-skills/skills/engineering/improve-codebase-architecture/SKILL.md` **字节级相同**）。**这份不属于 Superpowers 阅读路线**——它是你 DSH 里安装的 mattpocock 技能，编号只是接续本目录的翻译顺序。

**frontmatter**

- `name`: `improve-codebase-architecture`
- `description`: `Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick.`
- `disable-model-invocation`: `true`（**只允许用户显式调用**，模型不会自动触发它——这也是它是斜杠命令的原因）

# 改进代码库架构（Improve Codebase Architecture）

暴露架构上的摩擦点，并提出**加深机会（deepening opportunities）**：把浅模块变成深模块的重构。目标是可测试性，以及「AI 可导航性」。

这条命令*受*项目领域模型的启发，并建立在一套共享的设计词汇之上：

- 用 Skill 工具调用 `codebase-design`，取得架构词汇（**module**、**interface**、**depth**、**seam**、**adapter**、**leverage**、**locality**）与它的原则（删除测试、「接口就是测试面」、「一个适配器 = 假想接缝，两个 = 真接缝」）。在每一条建议里**严格使用这些术语**，不要漂移成 "component"、"service"、"API" 或 "boundary"。
- `CONTEXT.md` 里的领域语言给好的接缝命名；`docs/adr/` 里的 ADR 记录着这条命令**不该重新翻案**的决定。

## 流程（Process）

### 1. 探查（Explore）

**先定范围再扫描：YAGNI。** 加深一个模块的回报，在于让它**将来**更好改；所以把额外的权重放在代码库里**最近变动过**的部分。看之前先决定**看哪儿**：

- 如果用户点了方向（某个模块、某个子系统、某个痛点），就照它走，跳过下面的推断。
- 否则，往回翻相当一段提交历史（`git log --oneline`），找代码库的热点——反复出现的那些文件和区域——让这些路径先把你的注意力拉过去。如果改动很分散、没有明显热点，就把网撒大一点。

先读项目的领域词表（`CONTEXT.md`），以及你要碰的那片区域里的 ADR。

然后派一个子智能体去走代码库。**不要套固定启发式**；有机地探索，并记下你在哪里感到摩擦：

- 哪里理解一个概念，需要在许多小模块之间来回跳？
- 哪里的模块是**浅的**，接口复杂得几乎和实现一样？
- 哪里为了可测试性抽出了纯函数，而真正的 bug 藏在它们**被调用的方式**里（没有 **locality**）？
- 哪里紧密耦合的模块越过自己的接缝在漏？
- 代码库的哪些部分没有测试，或者通过它们当前的接口很难测？

对你怀疑是浅的东西套用**删除测试（deletion test）**：删掉它会让复杂度**集中**，还是只是**搬家**？「会集中」才是你要的信号。

### 2. 用 HTML 报告呈现候选（Present candidates as an HTML report）

把一份自包含的 HTML 写到操作系统临时目录，别让任何东西落进仓库。临时目录从 `$TMPDIR` 取，取不到就退回 `/tmp`（Windows 上是 `%TEMP%`），文件写到 `<tmpdir>/architecture-review-<timestamp>.html`，这样每次运行都是新文件。替用户打开它（Linux 用 `xdg-open <path>`，macOS 用 `open <path>`，Windows 用 `start <path>`），并把绝对路径告诉他。

报告用**经 CDN 加载的 Tailwind** 做布局与样式，用**经 CDN 加载的 Mermaid** 画那些用图/流/时序能可靠说明结构的示意图。把 Mermaid 与手写的 CSS/SVG 视觉混着用：关系是图状的（调用图、依赖、时序）就用 Mermaid；想要更「编辑化」的表达（体量图、剖面图、折叠动画）就手搭 div/SVG。每个候选都要有一张**前后对比图**。要视觉化。

每个候选渲染一张卡片，包含：

- **Files（涉及文件）**：牵扯到哪些文件/模块
- **Problem（问题）**：当前架构为什么产生摩擦
- **Solution（方案）**：用平实的语言说明会改什么
- **Benefits（收益）**：用 locality 与 leverage 来讲，以及测试会怎样变好
- **Before / After diagram（前后对比图）**：并排、手绘，画出「浅」与「加深」的差别
- **Recommendation strength（推荐强度）**：`Strong` / `Worth exploring` / `Speculative` 三选一，渲染成徽章

报告最后放一节 **Top recommendation（首要推荐）**：你会先动哪个候选、为什么。

**领域词汇用 `CONTEXT.md`，架构词汇用 `/codebase-design`。** 如果 `CONTEXT.md` 定义了 "Order"，就说「Order 录入模块（the Order intake module）」，不要说 "FooBarHandler"，也不要说 "Order service"。

**ADR 冲突**：如果某个候选与既有 ADR 矛盾，只在摩擦**真的大到值得重开那个 ADR** 时才提出来。在卡片里明确标出（比如一条警告标注：*「与 ADR-0007 冲突，但值得重开，因为……」*）。不要把 ADR 禁止的每一种理论重构都列出来。

完整的 HTML 骨架、示意图范式与样式指引，见 [HTML-REPORT.md](HTML-REPORT.md)。

**先不要提接口。** 文件写完后，问用户：「这里面哪个你想深入看看？」

### 3. 拷问循环（Grilling loop）

用户挑定一个候选之后，用 Skill 工具调用 `grilling`，和他一起走决策树：约束、依赖、加深后模块的形状、接缝后面坐着什么、哪些测试能活下来。

决定一旦成形，副作用就地发生；用 Skill 工具调用 `domain-modeling`，让领域模型保持最新：

- **用 `CONTEXT.md` 里没有的概念给加深后的模块命名？** 把该术语加进 `CONTEXT.md`。文件不存在就惰性创建它。
- **对话中把一个模糊术语磨清楚了？** 当场更新 `CONTEXT.md`。
- **用户带着承重理由拒绝了某个候选？** 提议一条 ADR，措辞是：*「要不要我把它记成 ADR，好让将来的架构评审不再重复提这个？」* 只有当这个理由**真的会被未来的探索者需要**、以避免重提同一件事时才提议；跳过那些一次性的理由（「现在不值得做」）和不言自明的理由。
- **想探索加深后模块的替代接口？** 用 Skill 工具调用 `codebase-design`，用它那个 design-it-twice 并行子智能体范式。
