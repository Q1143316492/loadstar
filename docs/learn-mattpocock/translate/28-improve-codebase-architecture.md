## 28 improve-codebase-architecture

> 译自 `reference/mattpocock-skills/skills/engineering/improve-codebase-architecture/SKILL.md`（原文 71 行）。frontmatter 按原样保留。

**frontmatter**

- `name`: `improve-codebase-architecture`
- `description`: `Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick.`（扫描代码库寻找加深机会，以可视化 HTML 报告呈现，然后就你选中的那一个拷问到底。）
- `disable-model-invocation`: `true`

### 28.1 改进代码库架构（Improve Codebase Architecture）

呈现架构摩擦，并提出**加深机会**：把浅模块变成深模块的重构。目标是可测试性与 AI 可导航性。

这个命令 _受_ 项目领域模型的启发，并建立在共享的设计词汇之上：

- 用 "codebase-design" 调用 Skill 工具，取得架构词汇（**模块**、**接口**、**深度**、**接缝**、**适配器**、**杠杆**、**局部性**）及其原则（删除测试、「接口就是测试面」、「一个适配器 = 假想的接缝，两个 = 真实的」）。在每一条建议里精确使用这些术语，不要漂移到「component」「service」「API」或「boundary」。
- `GLOSSARY.md` 里的领域语言为好接缝提供名字；`docs/adr/` 里的 ADR 记录了本命令不应重新争讼的决策。

#### 28.1.1 流程（Process）

##### 28.1.1.1 探索（Explore）

**先定范围再扫描：YAGNI。** 加深一个模块的回报在于让它未来的变更更容易，所以给最近改动过的部分额外加权。在开始看之前先决定看 *哪里*：

- 如果用户点明了方向（一个模块、一个子系统、一个痛点），就采纳它，跳过下面的推断。
- 否则，往回走相当一段提交历史（`git log --oneline`）来找出代码库的热点，那些反复出现的文件和区域，让这些路径先把你的注意力拉过去。如果改动是散乱分布、没有明显热点，就把网撒得更宽。

先读项目的领域词汇表（`GLOSSARY.md`）和你正在触碰区域的所有 ADR。

然后拉起一个 sub-agent 走查代码库。不要遵循死板的启发式；有机地探索，并记下你在哪里感受到摩擦：

- 哪里理解一个概念需要在许多小模块之间来回跳？
- 哪里的模块是**浅的**，接口几乎和实现一样复杂？
- 哪里为了可测试性抽出了纯函数，但真正的 bug 藏在它们被调用的方式里（没有**局部性**）？
- 哪里紧耦合的模块跨接缝泄漏？
- 代码库的哪些部分没有测试，或者难以通过它们当前的接口测试？

对你怀疑是浅的一切施加**删除测试**：删掉它会把复杂性集中起来，还是只是把它挪个位置？「是，集中起来」就是你要的信号。

##### 28.1.1.2 以 HTML 报告呈现候选（Present candidates as an HTML report）

把一份自包含的 HTML 文件写到操作系统临时目录，这样不会有东西落进仓库。临时目录从 `$TMPDIR` 解析，回退到 `/tmp`（Windows 上是 `%TEMP%`），写到 `<tmpdir>/architecture-review-<timestamp>.html`，让每次运行都有一个新文件。为用户打开它（Linux 上 `xdg-open <path>`，macOS 上 `open <path>`，Windows 上 `start <path>`），并告诉他们绝对路径。

报告用 **Tailwind via CDN** 做布局与样式，用 **Mermaid via CDN** 做图，在图形/流程/时序能可靠传达结构的地方使用。把 Mermaid 与手工制作的 CSS/SVG 视觉混用：当关系是图形状的（调用图、依赖、时序）时用 Mermaid，当你想要更有编排感的东西（体量图、剖面、坍缩动画）时用手搭的 div/SVG。每个候选都配一张**前/后可视化**。要有视觉性。

为每个候选渲染一张卡片，包含：

- **Files**：涉及哪些文件/模块
- **Problem**：当前架构为什么在制造摩擦
- **Solution**：用平实英语描述会改变什么
- **Benefits**：按局部性与杠杆来解释，以及测试会如何改善
- **Before / After diagram**：并排、定制绘制，说明浅在哪里、深在哪里
- **Recommendation strength**：`Strong`、`Worth exploring`、`Speculative` 之一，渲染为徽章

用一节 **Top recommendation** 结束报告：你会先做哪个候选，以及为什么。

**领域用 GLOSSARY.md 的词汇，架构用 `/codebase-design` 的词汇。** 如果 `GLOSSARY.md` 定义了「Order」，就说「the Order intake module」，不要说「the FooBarHandler」，也不要说「the Order service」。

**ADR 冲突**：如果一个候选与现有 ADR 矛盾，只有当摩擦真实到值得重新审视该 ADR 时才把它摆出来。在卡片里清楚标出（例如一个警告提示：_"contradicts ADR-0007, but worth reopening because…"_）。不要把 ADR 禁止的每一种理论上的重构都列出来。

完整的 HTML 脚手架、图模式与样式指南见 [HTML-REPORT.md](../../../reference/mattpocock-skills/skills/engineering/improve-codebase-architecture/HTML-REPORT.md)。

还不要提出接口。文件写好后，问用户：「你想探索其中哪一个？」

##### 28.1.1.3 拷问回路（Grilling loop）

用户选定一个候选后，用 "grilling" 调用 Skill 工具，和他们一起走决策树：约束、依赖、加深后模块的形状、接缝背后坐着什么、哪些测试能存活。

随着决策定型，副作用就地发生；用 "domain-modeling" 调用 Skill 工具，在过程中保持领域模型最新：

- **用一个不在 `GLOSSARY.md` 里的概念给加深后的模块命名？** 把该术语加到 `GLOSSARY.md`。如果文件不存在就惰性创建它。
- **在对话中打磨了一个模糊术语？** 就地更新 `GLOSSARY.md`。
- **用户以一个承重的理由拒绝了这个候选？** 提议一篇 ADR，这样表述：_"Want me to record this as an ADR so future architecture reviews don't re-suggest it?"_ 只有当未来的探索者为了避免再次提出同一件事而确实需要这个理由时才提议；跳过短命的理由（「现在不值得」）和不言自明的理由。
- **想为加深后的模块探索备选接口？** 用 "codebase-design" 调用 Skill 工具，并使用它的 design-it-twice 并行 sub-agent 模式。
