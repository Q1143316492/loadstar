## 9 wayfinder

> 译自 `reference/mattpocock-skills/skills/engineering/wayfinder/SKILL.md`（原文 128 行）。frontmatter 按原样保留。

**frontmatter**

- `name`: `wayfinder`
- `description`: `Plan a huge chunk of work (more than one agent session can hold) as a shared map of decision tickets on your issue tracker, and resolve them one at a time until the way to the destination is clear.`（把一大块工作（超过一个 agent 会话所能承载的量）规划成 issue tracker 上一张由决策 ticket 组成的共享地图，然后逐个解决，直到通往目的地的路清晰为止。）
- `disable-model-invocation`: `true`

一个松散的想法来了，对单个 agent 会话来说太大，而且裹在迷雾里：从这里到**目的地（destination）**的路还看不见。寻路（wayfinding）就是找到那条路，而不是朝目的地猛冲。这个 skill 把路标在仓库 issue tracker 上的一张**共享地图（shared map）**里，然后逐个处理它的**决策 ticket（decision ticket）**（其解决结果是一项决策的问题，而不是待执行构建的切片），直到路线清晰。

目的地因事而异，而给它命名是标图的第一件事：它塑造每一个 ticket。它可能是一份交付出去并持续迭代的 spec，一个在规划开始前就要锁定的决策，或者一次就地完成的改动，比如数据结构迁移。这张地图与领域无关：工程工作、课程内容，什么形状合适就装什么。

### 9.1 规划，不要动手（Plan, don't do）

wayfinder 默认是**规划**：每个 ticket 解决一项决策，当路清晰、在有人动手去做那件事之前再没有什么要决定的时候，这张地图就完成了。那种「干脆直接干」的拉力，通常正是你已经走到地图边缘、该交棒的信号。一次行动可以在它的 **Notes** 里覆盖这一点，把执行带进地图本身，但除此之外，产出决策，而不是交付物。

### 9.2 以名称指代（Refer by name）

每张地图和每个 ticket 都是一个 issue，所以它有一个**名称**：它的标题。在人类阅读的一切内容里（叙述、地图的 Decisions-so-far），都用那个名称指代它，绝不用裸 id、编号或 slug。一整面 `#42, #43, #44` 的墙是不可读的；名称一眼就能读懂。id 和 URL 不会消失；名称包裹着它的链接，但它们骑在名称**里面**，绝不代替名称。

### 9.3 地图（The Map）

地图是这个仓库 issue tracker 上的单个 issue，标签为 `wayfinder:map`，是权威工件。它的 ticket 是地图的子 issue。

地图是**索引**，不是存储。它列出已做出的决策，并指向持有其细节的 ticket；一项决策只存在于一个地方，也就是它的 ticket，所以地图从不重述它，只概述并链接它。

**地图、它的子 ticket、阻塞和前沿查询在物理上位于何处，因 tracker 而异。**issue tracker 应该已经提供给你了。如果没有，告诉用户去运行 `/setup-matt-pocock-skills`。查阅 tracker 文档的 "Wayfinding operations" 一节，了解**这个**仓库如何表达它们。如果没有提供任何 tracker，默认使用 local-markdown tracker。

#### 9.3.1 地图正文（The map body）

整张地图的低分辨率视图，每个会话加载一次。开放的 ticket **不**列在这里：它们是开放的子 issue，通过查询找到。

```markdown
## Destination

<what reaching the end of this map looks like: the spec, decision, or change this effort is finding its way to. One or two lines; every session orients to it before choosing a ticket.>

## Notes

<domain; skills every session should consult; standing preferences for this effort>

## Decisions so far

<!-- the index: one line per closed ticket, enough to judge relevance, then zoom the link for the detail the ticket holds -->

- [<closed ticket title>](link): <one-line gist of the answer>

## Not yet specified

<!-- see "Fog of war": in-scope fog you can't ticket yet; graduates as the frontier advances -->

## Out of scope

<!-- see "Out of scope": work ruled beyond the destination; closed, never graduates -->
```

#### 9.3.2 Ticket（Tickets）

每个 ticket 都是地图的**子 issue**；tracker 的 issue id 就是它的身份。它的正文是那个问题，大小以能放进一个 100K token 的 agent 会话为准：

```markdown
## Question

<the decision or investigation this ticket resolves>
```

每个 ticket 带一个 `wayfinder:<type>` 标签，取 `research`、`prototype`、`grilling`、`task` 之一（见 [Ticket Types](#ticket-types)）。`wayfinder:` 标签是地图及其 ticket 唯一携带的标签，绝不打像 `ready-for-agent` 这样的 triage 标签：它们是决策，不是实现工作。

会话通过把 ticket 指派给驱动这张地图的开发者来**认领（claim）**它，**在任何工作之前先做**，这样并发的会话就会跳过它。那个被指派人**就是**认领：一个开放、未指派的 ticket 就是未被认领。

阻塞使用 tracker 的**原生**依赖关系：这一点必不可少，因为它会在 tracker 自己的 UI 里**可视化地**呈现前沿，让人类不必打开地图就能看到什么可以被取走。只有缺少原生阻塞的 tracker 才退回正文约定。当一个 ticket 的所有阻塞 ticket 都已关闭时，它就是**未阻塞（unblocked）**的；**前沿（frontier）**是开放的、未阻塞的、未认领的子 ticket，也就是已知世界的边缘。

答案不是正文的一部分；它在解决时被记录（见 [Work through the map](#work-through-the-map)）。解决 ticket 期间产生的资产从 issue 链接过去，不要粘贴进来。

### 9.4 Ticket 类型（Ticket Types）

每个 ticket 要么是 **HITL**（human in the loop，与一个为自己发言的人类**一起**工作），要么是 **AFK**，由 agent 独自驱动。HITL ticket 只能通过那次实时交流来解决；agent 绝不代人类站到交流的那一侧（一个自问自答的 grilling agent 已经违反了这一点）。

- **Research**（AFK）：阅读文档、第三方 API 或本地资源（如知识库），以呈现某项决策在等待的事实。由一个调用 Skill 工具并以 "research" 为参数的 subagent 解决。当需要当前工作目录之外的知识时使用。
- **Prototype**（HITL）：通过做一个廉价、粗糙、具体的工件来供人反应（大纲、粗略看法、stub，或者 UI/逻辑代码），从而提升讨论的保真度，做法是调用 Skill 工具并以 "prototype" 为参数。把原型作为资产链接过去。当「它应该长什么样」或「它应该怎么表现」是关键问题时使用。
- **Grilling**（HITL）：对话。默认情形。总是调用 Skill 工具两次，参数分别是 "grilling" 和 "domain-modeling"。
- **Task**（HITL 或 AFK）：在**决策**得以做出之前必须发生的手工工作：没有什么要决定、要做原型或要研究，但讨论被它卡住，直到它完成。注册一个服务以便评判它的 API、准备访问权限、搬动数据以便看清它的形状。这是**唯一**一类「做」而非「决定」的类型，它靠解开一项决策而获得自己的位置，不靠交付目的地。agent 在能做到的地方独自驱动它（AFK）；否则它把手把手的精确清单交给人类（HITL）。工作在完成时即解决；答案记录做了什么以及任何由此产生、后续 ticket 会依赖的事实（凭据位置、新 URL、行数）。

### 9.5 战争迷雾（Fog of war）

地图是**刻意**不完整的：不要给你还看不见的东西标图。在活跃 ticket 之外躺着**战争迷雾（fog of war）**：你分辨得出即将到来、却还无法确切指认的决策与调查的模糊视图，因为它们挂在仍然开放的问题上。解决一个 ticket 会清掉它前方的迷雾，把现在可被指定的东西升级为新的 ticket，一次一个，直到通往目的地的路清晰、不再有 ticket 剩下。

地图的 **Not yet specified** 一节就是写下那幅模糊视图的地方：被怀疑的问题、以后要重新查看的区域。它是**通往**目的地的尚未被发现的前沿：这里的一切都在范围内，只是还不够清晰，不足以开成 ticket。视图允许多松散就写多松散，也可以写得多完整就多完整；它同时也是一块路标，供协作者读出这项努力正在往哪儿走。

**是迷雾还是 ticket？**测试标准是：你现在能不能精确地陈述这个问题，而**不是**你现在能不能回答它。

- 当问题已经很清晰时，就**开 ticket**，即使它被阻塞、你还不能对它动手。
- 当你还没法清晰地措辞时，就**放进 Not yet specified**。不要把迷雾预先切成 ticket 大小的块：它比 ticket 更粗，而且当前沿到达时，一块补丁可能升级成几个 ticket，也可能一个都不升级。

**Not yet specified** 排除已经决定的东西（Decisions so far）、已经是活跃 ticket 的东西，以及超出范围的东西（下一节）。

### 9.6 超出范围（Out of scope）

迷雾只会**朝着**目的地聚拢。目的地固定了范围，所以超出它之外的工作是**超出范围（out of scope）**：它不是迷雾，也不属于 **Not yet specified**。它在地图上有自己的一节 **Out of scope**：你有意识地排除在**这次**努力之外的工作。让它落到这里的是范围，而不是清晰度。

超出范围的工作永不升级（前沿止于目的地），所以它只有在目的地被重新划定的时候才会回来，而且那时是以一次全新的努力出现，不是续接。

把某件事判定为超出范围是一个划定范围的动作，不是路线上的一个步骤。当一个已存在的 ticket 被发现位于目的地之外（标图时范围划错，或者被某次解决暴露出来），就**关闭它**（关闭的 ticket 明确地不在前沿上），并在 **Out of scope** 一节留一行：概述加上它为何超出范围，并链接那个已关闭的 ticket。它不进入 **Decisions so far**，那一节记录的是实际走过的路线；一条范围边界不是路线上的步骤。

### 9.7 调用（Invocation）

两种模式。无论哪种，**每个会话解决的 ticket 绝不超过一个**，research ticket 除外。

#### 9.7.1 标出地图（Chart the map）

用户带着一个松散的想法调用。

1. **给目的地命名。**调用 Skill 工具两次，参数分别是 "grilling" 和 "domain-modeling"，以确定这张地图正在寻路前往的是什么：那份 spec、决策或改动。目的地固定了范围，所以要最先定下来。
2. **标出前沿。**再次 grill，这次是**广度优先**：在整个空间里扇形展开，而不是在任一条线上下潜得很深，把开放决策和现在就可迈出的第一步都翻出来。**如果这没有翻出任何迷雾**（通往目的地的路已经清晰，整段旅程小到一次会话就能装下），你就不需要地图。停下来问用户想怎么推进。
3. **创建地图**（标签 `wayfinder:map`）：填好 Destination 和 Notes，Decisions-so-far 留空，把迷雾勾勒进 **Not yet specified**。
4. **创建你现在能指定的 ticket**，作为地图的子 issue，然后在**第二遍**中接上阻塞边（issue 需要先有 id 才能互相引用）。也在这一遍里写交叉引用，用真实的 id：占位符 `#<n>` 会自动链接到一份不相干的 issue。接线把它们分成前沿和已阻塞两类；你还无法指定的一切都留在迷雾里：**Not yet specified** 一节。
5. **启动 research subagent。**对你刚创建的每个 `research` ticket，各起一个 subagent，调用 Skill 工具并以 "research" 为参数来并行解决它，把它的发现捕获到一个一次性的 `research/<name>` 分支上，并从 ticket 里放一个上下文指针过去。把这个分支推上去，但不要开 PR：它永远不会被合并。
6. 停：标图是一个会话的工作；它自己不解任何东西。

#### 9.7.2 沿地图推进（Work through the map）

用户带着一张地图（URL 或编号）调用。ticket 是**可选**的：不带 ticket 时，由你挑选下一个决策，而不是用户。

1. 加载**地图**：低分辨率视图，而不是每个 ticket 的正文。
2. 选择 ticket。如果用户指名了一个，就用它。否则按顺序取第一个前沿 ticket。**认领它**：在任何工作之前把它指派给自己。
3. 解决它，按它的 `wayfinder:<type>` 标签所命名的类型来解（见 [Ticket Types](#ticket-types)）。读标签，而不只是读正文：正文从不声明类型。**按需放大**：随时取来任何相关或已关闭 ticket 的完整正文；按 `## Notes` 块点名的那些 skill 去调用 Skill 工具。如果拿不准，就调用 Skill 工具两次，参数分别是 "grilling" 和 "domain-modeling"。
4. 记录解决结果：把答案作为**解决评论**发出去，**关闭**该 issue，并**追加一个上下文指针**到地图的 Decisions-so-far。
5. 添加新浮现的 ticket（先创建再接边）；把答案使其可被指定的任何迷雾升级，并从 **Not yet specified** 中清掉每一块已升级的补丁，让它只作为它的新 ticket 存在。如果答案揭示出某个 ticket（这一个或另一个）位于目的地之外，就**将其判定为超出范围**，而不是在路线上解决它。如果该决策使地图的其他部分失效，更新或删除那些 ticket。

用户可能会并行推进未阻塞的 ticket，所以要预期其他会话会同时编辑 tracker。
