## 8 to-tickets

> 译自 `reference/mattpocock-skills/skills/engineering/to-tickets/SKILL.md`（原文 105 行）。frontmatter 按原样保留。

**frontmatter**

- `name`: `to-tickets`
- `description`: `Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, published to the configured tracker (edges as text in one file per ticket locally, or native blocking links on a real tracker).`（把一份计划、spec 或当前对话拆成一组曳光弹 ticket，每个 ticket 声明自己的阻塞边，并发布到已配置的 tracker：本地是每个 ticket 一个文件、边以文本表示，真实 tracker 上则是原生阻塞链接。）
- `disable-model-invocation`: `true`

### 8.1 拆成 ticket（To Tickets）

把一份计划、spec 或对话拆成一组 **ticket**：曳光弹（tracer bullet）式的垂直切片，每个都声明哪些 ticket **阻塞**它。

issue tracker 与 triage 标签词汇表应该已经提供给你了。如果没有，告诉用户去运行 `/setup-matt-pocock-skills`。

### 8.2 流程（Process）

#### 8.2.1 收集上下文（Gather context）

从对话上下文中已有的内容开始工作。如果用户作为参数传了一个引用（spec 路径、issue 编号或 URL），就把它取来，读完它的完整正文和评论。

#### 8.2.2 探索代码库（可选）（Explore the codebase (optional)）

如果你还没有探索过代码库，那就去探索，以理解代码的当前状态。ticket 的标题和描述应当使用项目领域词汇表的术语，并尊重你正在触及的区域中的 ADR。

寻找把代码预重构（prefactor）的机会，让实现更容易。「先让改动变简单，再做那个简单的改动。」

#### 8.2.3 起草垂直切片（Draft vertical slices）

把工作拆成**曳光弹** ticket。

<vertical-slice-rules>

- 每个切片都切出一条穿过每一层（schema、API、UI、测试）的狭窄但**完整**的路径：是垂直的，而**不是**某一层的水平切片
- 一个完成的切片自身就是可演示或可验证的
- 每个切片的大小以能放进一个全新的上下文窗口为准
- 任何预重构都应先做完

</vertical-slice-rules>

给每个 ticket 标出它的**阻塞边（blocking edges）**：在它开始之前必须完成的其他 ticket。没有阻塞者的 ticket 可以立刻开始。

**大范围重构是垂直切片的例外。**一次**大范围重构（wide refactor）**是一次机械改动（重命名一列、给一个共享符号改类型），它的**爆炸半径（blast radius）**会扇及整个代码库，于是一次编辑就同时弄坏成千上万个调用点，任何垂直切片都无法以绿色落地。不要硬把它塞进一颗曳光弹，而要把它排成**扩展–收缩（expand–contract）**。先扩展：在旧形式旁边加上新形式，这样什么都不会坏。然后按爆炸半径分批迁移调用点（按 package、按目录），每批自成一个 ticket，阻塞于那次扩展；由于旧形式仍然存在，批次之间 CI 保持绿色。最后收缩：在没有任何调用者残留之后删除旧形式，这个动作放在一个 ticket 里，阻塞于每一个迁移批次。当连这些批次都无法各自保持绿色时，保留这个顺序，但让它们共用一个集成分支，并且所有这些批次都阻塞一个最终的「集成并验证」ticket；只有在那里才承诺绿色。

#### 8.2.4 向用户提问确认（Quiz the user）

把提议的拆解作为编号列表呈现出来。对每个 ticket，展示：

- **Title**：简短描述性名称
- **Blocked by**：哪些其他 ticket（如果有）必须先完成
- **What it delivers**：这个 ticket 让什么端到端行为得以工作

问用户：

- 这个粒度感觉对吗？（太粗 / 太细）
- 阻塞边正确吗：每个 ticket 是否只依赖真正卡住它的那些 ticket？
- 有没有 ticket 应该合并或进一步拆分？

迭代直到用户批准这个拆解。

#### 8.2.5 把 ticket 发布到已配置的 tracker（Publish the tickets to the configured tracker）

发布已批准的 ticket。**如何**发布取决于 `/setup-matt-pocock-skills` 配置的 tracker；两种情况下 ticket 本身都一样，只是阻塞边的形态变了：

- **本地文件** → 在 `.scratch/<feature-slug>/issues/<NN>-<slug>.md` 下每个 ticket 写一个文件，从 `01` 开始按依赖顺序编号（阻塞者在前）。每个文件的 "Blocked by" 列出它所依赖的编号/标题。使用下面的单 ticket 文件模板：每个文件一个 ticket，绝不合并成一个文件。
- **真实 issue tracker（GitHub、Linear 等）** → 按依赖顺序（阻塞者在前）每个 ticket 发布一个 issue，这样每个 ticket 的阻塞边才能引用真实标识符。平台如果有原生的阻塞 / 子 issue 关系就用它；否则把每个 ticket 的 "Blocked by" 设为阻塞它的那些 issue。除非另有指示，打上 `ready-for-agent` triage 标签；这些 ticket 按构造就是 agent 可抓取的。

按**前沿（frontier）**推进：任何阻塞者都已完成的 ticket。对于一条纯线性的链条，那就是从上到下。

**不要**关闭或修改任何父 issue。

<local-ticket-template>

### <NN>: <Ticket title>

**What to build:** 这个 ticket 让什么端到端行为得以工作，从用户的视角描述，而不是一层层的实现清单。

**Blocked by:** 卡住这个 ticket 的那些 ticket 的编号/标题，或者 "None (can start immediately)"。

**Status:** ready-for-agent

- [ ] Acceptance criterion 1
- [ ] Acceptance criterion 2

</local-ticket-template>

<issue-template>

### Parent

tracker 上父 issue 的引用（如果来源是一个已有 issue，否则省略本节）。

### What to build

这个 ticket 让什么端到端行为得以工作，从用户的视角描述，而不是一层层的实现。

### Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

### Blocked by

- 对每个阻塞 ticket 的引用，或者 "None (can start immediately)"。

</issue-template>

无论用哪种形式，都要避免具体文件路径或代码片段：它们很快就过时。例外：如果某个原型产出了一段代码片段，它比散文更精确地编码了某项决策（状态机、reducer、schema、类型形状），就把它内联，并简要注明它来自原型。裁剪到承载决策的部分，不要工作 demo，只要关键片段。
