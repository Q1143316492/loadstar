## 1 ask-matt

> 译自 `reference/mattpocock-skills/skills/engineering/ask-matt/SKILL.md`（原文 90 行）。frontmatter 按原样保留并附中译。

**frontmatter**

- `name`: `ask-matt`
- `description`: `Ask which skill or flow fits your situation. A router over the skills in this repo.`（问你哪个技能或流程适合你当前的处境。它是本仓库技能之上的一个路由。）
- `disable-model-invocation`: `true`

**问 Matt（Ask Matt）**

你不可能记住每一个技能，所以要问。

**流程（flow）** 是穿过这些技能的一条路径。大多数路径沿一条**主流程（main flow）** 走，有两条**入口匝道（on-ramp）** 汇入其中。其余的一切要么是独立技能，要么是运行在底层的词汇层。

### 1.1 主流程：想法 → 交付（The main flow: idea → ship）

大多数工作走的那条路线。你有一个想法，想把它做出来。

1. **`/grill-with-docs`** 通过访谈把想法磨利。只要你**在一个工作目录里工作**，就从这里开始：它是有状态的，会把学到的东西留在 `CONTEXT.md` 和 ADR 里。（没有工作目录？改用 `/grill-me`，见「独立使用」一节。两者跑的是同一个 `/grilling` 原语；`grill-with-docs` 是那个留下纸面痕迹的，所以只要有一个仓库可以留痕，它就是两者中更好的那个。）
2. **分支：你能在对话里解决每一个问题吗？** 如果某个问题需要一个跑得起来的答案（状态、业务逻辑、一个你必须亲眼看到的 UI），就绕道做一个原型，两个方向都用 **`/handoff`** 搭桥（原型住在自己的目录里，这正是 `/handoff` 的用途；见「阶段边界」）：
   - 先用 **`/handoff`** 交接出去，然后针对那个文件开一个全新的会话，
   - 用 **`/prototype`** 以一次性代码回答那个问题，
   - 再用 **`/handoff`** 把你学到的东西交回来，并从最初的想法线程里引用它。
3. **分支：这是一个跨多个会话的构建吗？**
   - **是** → 先 **`/to-spec`**（把线程变成一份 spec），再用 **`/to-tickets`** 把它拆成 tracer bullet（曳光弹）工单，每个工单声明自己的**阻塞边（blocking edges）**。在本地 tracker 上，那就是 `.scratch/<feature>/issues/` 下每个工单一个文件，按阻塞优先手工推进；在真实的 tracker 上，这些边变成原生的阻塞链接，于是任何阻塞项都已完成的工单都可以直接拿来开工：每个工单启动一次 **`/implement`**，**每个工单之间都 `/clear` 一次上下文**。每个工单都是自包含的，所以上一个工单的上下文可以随意丢弃。
   - **否** → 就在同一个上下文窗口里直接 **`/implement`**。

   无论哪条路，**`/implement`** 都会在内部驱动 **`/tdd`** 来构建每一个 issue（一次一个红-绿（red-green）切片），然后在提交之前跑一遍 **`/code-review`** 收尾，那是对 diff 的双轴评审（Standards + Spec）。当你只想在没有完整 spec 的情况下以测试先行搭出一个具体行为时，单独去用 **`/tdd`**；当你想针对某个固定点评审一个分支或 PR 时，单独去用 **`/code-review`**。

#### 1.1.1 上下文卫生（Context hygiene）

把第 1–3 步保持在**一个不间断的上下文窗口**里（在 `/to-tickets` 之前不要 compact 或 clear），这样访谈、spec 和工单都建立在同一套思考之上。之后每个 `/implement` 都从工单出发，重新开始。

这件事的限度是 **[smart zone](https://www.aihero.dev/ai-coding-dictionary/smart-zone)**：模型仍能锐利推理的那个窗口（在最先进的模型上约 150k tokens）。如果一个会话在 `/to-tickets` 之前就接近它了，不要在性能退化的情况下硬推；在最近的阶段边界处 `/compact`，然后继续（见「阶段边界」）。

### 1.2 入口匝道（On-ramps）

一种会生成工作的起始处境，之后汇入主流程。

- **bug 和需求堆积** → **`/triage`**。它让 issue 走过各个分诊角色，产出 agent-ready 的 issue，之后由 **`/implement`** 接手。

  分诊只适用于**不是你创建的** issue：bug 报告、外部进来的功能请求，任何以原始形态到达的东西。`/to-tickets` 产出的工单已经是 agent-ready 的，所以**不要对它们做分诊**。

- **有东西坏了** → **`/diagnosing-bugs`**。用于那些硬的：一眼看不穿的 bug、时有时无的 flake、在两个已知良好状态之间悄悄溜进来的回归。它拒绝在拿到**紧的反馈回路（tight feedback loop）** 之前做理论推演（一条已经因为*这个* bug 变红的命令），然后用一个回归测试来修。当真正的发现是「没有一个好的接缝（seam）可以把 bug 锁住」时，它的复盘会交接给 **`/improve-codebase-architecture`**。

- **一件巨大而雾气弥漫的工作：一个绿地项目，或一次体量大到超出单个会话的功能构建** → **`/wayfinder`**，这里是认知负荷最重的流程。当从这里到目的地的路还看不见时，它在 issue tracker 上画出一张**共享地图（shared map）**，由**决策工单（decision tickets）** 组成，一次解决一个，产出的是**决策，而不是可交付物**，直到雾（fog）被推回去、路变得清楚。**`/grill-with-docs`** 磨利的是你能在一个会话里握住的想法，wayfinder 面向的是你握不住的那个想法；它更慢、更密，所以要把它留给正好这种情况，绝不要用在一个界定清晰的功能上。

  当地图变清楚时，**它做的是交接，不是构建**：在主流程的 **`/to-spec`** 处汇入，由它把地图里互相关联的决策收拢成一份可构建的计划，然后照常 `/to-tickets` 和 `/implement`。把地图直接接到 `/implement` 会跳过那次收拢，并丢掉互相关联的细节，所以只有当这件事最终确实很小时，才直接去 `/implement`。

### 1.3 代码库健康（Codebase health）

不是功能工作，只是日常维护。

- 只要你有空闲的一刻，就可以跑 **`/improve-codebase-architecture`**，让代码库保持适合 agent 在其中作业。它会浮现出**深化机会（deepening opportunities）**；选中其中一个就_生成一个想法_，你可以把它带进主流程的 `/grill-with-docs`。它是找出候选者的勘测；**`/codebase-design`**（见下）是你为选中的那个做设计的工作台。

### 1.4 底层词汇（Vocabulary underneath）

两份由模型调用的参考，运行在其他技能*之下*，各自是自身词汇的唯一事实来源。当问题出在**词**而不是流程上时，直接去找它们；或者让上面的技能把它们拉进来。

- **`/domain-modeling`**：磨利项目的*领域*语言：挑战一个含糊的词，消解一个超载的词（"account" 同时在干三件事），把一个难以逆转的决策记为 ADR。它是 `/grill-with-docs` 所驱动的主动功课，用来让 `CONTEXT.md` 保持一份干净的词汇表。
- **`/codebase-design`** 是深模块（deep module）词汇（module、interface、depth、seam、adapter、leverage、locality），用来设计一个模块的*形状*：在一条干净的接缝处，把大量行为放在一个小接口后面。`/tdd` 和 `/improve-codebase-architecture` 都说这门语言。

### 1.5 阶段边界（Phase boundaries）

**阶段（phase）** 是一个会话内部的一块工作：访谈、实现、QA。在两者之间的**边界（boundary）** 处，你有五个选项，而在它们之间做选择是整张地图里最模糊的决策：

- **Continue**：原地不动。不花费什么，也不丢失什么。
- **`/clear`**：清空窗口，适用于这里的一切对接下来要做的事都不重要时。
- **`/handoff`** 写一个可携带的 markdown 文件。范围很窄：只用于**换了 harness**、**换了目录**、**交给同事**，或者在**阶段中途**分叉一个支线任务。它买到的是可携带性。
- **Subagent**：把一个范围收紧的任务送到它自己的窗口，然后拿回一份报告。
- **`/compact`** 压缩这段上下文，并用它给一个全新会话播种。它是**默认项**，在决策树的底部，而不是第一手就抓的东西。

读 [PHASE-BOUNDARIES.md](../../../reference/mattpocock-skills/skills/engineering/ask-matt/PHASE-BOUNDARIES.md) 看那棵有序的决策树：五个问题、每个分支背后的理由，以及为什么一手来源（primary source）的代价使得 **Continue** 成为第一个要排除的选项。要在边界**处**做决定；阶段中途，要么继续，要么把剩下的拆给 subagent。

### 1.6 独立使用（Standalone）

完全不在主流程上。

- **`/grill-me`**：与 `/grill-with-docs` 同样不留情面的访谈，但是**无状态（stateless）** 的：它不在本地保存任何东西，也不构建 `CONTEXT.md`。当你**不在一个工作目录里工作**时找它（磨利一份计划、一个设计、一篇文字，任何下面没有仓库的东西）。如果你在工作目录里，就改用 `/grill-with-docs`：它跑同一套访谈，还会留下纸面痕迹，所以严格来说它更好。
- **`/grilling`** 就是访谈原语本身：轮次、前沿（frontier）、事实是 agent 的活而决策是你的。`/grill-me` 和 `/grill-with-docs` 是两个具名的入口，`/triage`、`/wayfinder` 和 `/improve-codebase-architecture` 内部都跑它。只有当你想要一场没有任何包装的访谈时，才直接找它。
- **`/resolving-merge-conflicts`** 一块一块地处理进行中的 merge 或 rebase 冲突，依据追溯到各方一手来源的**意图（intent）** 来解，而不是挑行，然后把这次操作收尾。它从不运行 `--abort`。独立、不在任何流程上：当你已经处在冲突中途时找它。
- **`/prototype`** 是一个小而一次性的程序，用来回答一个设计问题：这个状态模型的感觉对不对，或者这个 UI 应该长什么样。一次性是对代码怎么写的一条约束，不是要销毁它的承诺：答案会折进真实代码里，而原型本身作为**一手来源（primary source）** 保留在从 main 开出的 `prototype/<name>` 分支上，由实现 issue 指向它。它是主流程第 2 步里的那次绕道，但任何时候只要一个设计问题难以在纸上定下来，都可以找它。
- **`/research`**：把阅读的跑腿活委托给一个**后台 agent**：它针对**一手来源**调查一个问题，然后在仓库里留下一份带引用的 Markdown 文件。它读的时候你继续干活。它产出的文件是可以*带进*主流程 `/grill-with-docs` 的东西，因为研究是喂养思考，而不是替代思考。
- **`/to-questionnaire`** 在你被卡住的东西不在你脑子里、也不在代码库里，而在**别人的**脑子里时出场，它写一份问卷让他们填。它是 `/grill-me` 的反面：它不访谈你关于主题的内容，而是访谈你关于**这次发送（send）** 的事（要发给谁、你需要拿回什么），并把问题瞄准那个缺口。回来的东西是 `/grill-with-docs` 或 `/to-spec` 的素材。
- **`/wizard`** 面向只有**人**才能走的那些步骤：准备基础设施、配置凭证或 CI secret、在一个不熟悉的第三方控制台里点来点去、执行一次性的迁移或切换。它生成一个可交互的 bash 脚本，打开每一个 URL，捕获每一个值，并写进 `.env` 和 GitHub secrets，于是这套流程不再是你每次都要向 agent 重新解释的东西。由模型调用，所以 agent 一撞上只有你能通过的墙就会找它。如果 agent 自己就能做，它就应该自己做；这个是留给真正需要人留在回路里的地方。
- **`/wait-what`** 是对一条没落地的消息的纠正手段。在任何其他技能内部、在对话中途用它，agent 就会用你缺的那点上下文，用平实的英语、用 `CONTEXT.md` 的词汇，把它刚说过的话重新讲一遍。它是事后补救；`/grill-with-docs` 是事前的疗法，因为早早商定好的共同语言才是从一开始就不让行话出现的东西。
- **`/teach`**：跨多个会话学一个概念，把当前目录当作一个有状态的工作区。
- **`/writing-for-agents`** 是撰写 agent 消费的文档的参考：技能、AGENTS.md、被指向的文档。

### 1.7 前置条件（Precondition）

**`/setup-matt-pocock-skills`**：在第一次跑工程流程之前运行，配置其他技能所假设的 issue tracker、分诊标签和文档布局。自定义的 issue tracker 也一样可用。
