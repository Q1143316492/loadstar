## 11 editing-changes —— 编辑与迭代一个 change

> 译自 `reference/openspec/docs/editing-changes.md`（原文 91 行，全文翻译）。按 `READING-openspec.md` 第 11 项。代码块与 ASCII 图按原样保留。

### 11.1 开篇

**一个 change 里的每份 artifact 都只是一个 Markdown 文件，你随时可以编辑。** 没有锁住的「规划阶段」，没有批准闸门，没有要进入的特殊编辑模式。想在你已经开始构建之后改 proposal？打开 `proposal.md` 改它。实现到一半发现 design 错了？改 `design.md`，继续往下走。这就是全部答案，而且这是有意为之。

这一页是给你想「等等，我能回去改那个吗？」的那一刻的。能。下面是每种常见情况该怎么做。

### 11.2 两种编辑任何东西的方式（Two ways to edit anything）

你永远两个都有：

1. **直接编辑文件。** artifact 是 `openspec/changes/<name>/` 下的纯 Markdown。在你的编辑器里打开 `proposal.md`、`design.md`、`tasks.md`，或者 `specs/` 下的一份 delta spec，改它。不需要别的。

2. **让你的 AI 修订它。** 在聊天里，直接说出你想要什么：「把 proposal 更新一下，去掉缓存那个想法，加一节限流，」或者「design 应该用一个队列，不是轮询。」AI 会替你把 artifact 改好，用这个 change 的其余部分作为上下文。

哪个合适当下就用哪个。小的措辞调整？编辑文件。实质性的重新思考？让 AI 带着完整上下文修订。

### 11.3 「我在开始之后怎么更新 proposal（或 specs）？」（"How do I update the proposal (or specs) after I've started?"）

直接更新它就行。同一个 change，精修一下。

如果你在用扩展命令，自然的流程是：编辑 artifact，然后跑 `/opsx:continue` 从新的状态接着走，或者跑 `/opsx:apply` 继续对着更新后的计划实现。如果你用的是默认的 `core` 命令，编辑 artifact 然后跑 `/opsx:apply`；它会读当前文件，所以它对着 artifact 现在所说的内容来构建。

心智模型：artifact 是活的计划，不是签过字的合同。AI 永远从它们的当前内容出发工作，所以编辑它们就是在给工作转向。

```text
You: I want to change the approach in this change.

You: [edit design.md, or tell the AI:]
     Update design.md to use a background job instead of a synchronous call.

AI:  Updated design.md. The task list still fits; want me to continue applying?

You: /opsx:apply
```

这回答了一个非常常见的问题：没有单独的「update proposal」命令，因为你不需要。文件就是真相之源，编辑它（手动或者通过 AI）就是更新。

### 11.4 「实现之后我怎么回去评审？」（"How do I go back to review after implementing?"）

你不必「回去」，因为你从未离开。这个工作流是流体的：评审、编辑和实现不是你被困在里面的顺序阶段。

具体来说，在做了一些 `/opsx:apply` 的活儿之后：

- 想重新审视计划？打开 artifact 读它们，或者在终端里跑 `openspec show <change>` 看一个合并后的视图。
- 发现了要改的东西？编辑 artifact（或者让 AI 改），然后继续。
- 想要一次结构化的检查，确认代码和计划对得上？跑 `/opsx:verify`（扩展命令）。它报告 completeness、correctness 和 coherence，不阻塞任何事。见 [工作流：验证（Workflows: Verify）](workflows.md#verify-check-your-work)。

没有「评审阶段」可以回去，因为评审是你在任何时刻都能做的事，包括实现之后。

### 11.5 「我手改了代码。怎么和 OpenSpec 对账？」（"I edited the code by hand. How do I reconcile that with OpenSpec?"）

这种事一直在发生，而且没关系。你在编辑器里调了点东西，现在代码和 artifact 对不上了。按哪个是真的，就往哪个方向把它们带回同步：

- **代码现在是对的，spec 过期了。** 更新 delta spec（以及 tasks，如果相关）来描述你实际交付的行为。归档之前 spec 应该与事实一致，因为归档会把 spec 合并进你的真相之源。
- **spec 是对的，代码漂移了。** 继续构建或修复，直到代码与 spec 一致。

让不一致浮出来的一种快速方式是 `/opsx:verify`：它读你的 artifact 和代码，告诉你它们在哪里分叉。把它的输出当成一份对账用的 to-do list，然后在它们一致之后归档。

原则是：在归档时刻，你的 spec 成为记录在案的事实。所以在归档之前，让 spec 对代码实际做什么说实话。手动编辑是受欢迎的；只是别让它们悄悄把 spec 弄到脱同步。

### 11.6 精修一份你不满意的 proposal（Refining a proposal you're not happy with）

如果生成出来的 proposal 没有命中，你有三个好动作：

- **就地迭代。** 告诉 AI 哪里不对（「范围太宽了，把 admin 那些功能去掉」），让它修订。最便宜，而且通常就是对的。
- **先探索，再重新提议。** 如果问题在于想法本身不清楚，退回到 `/opsx:explore`，把它想透，让一份更锋利的 proposal 从中长出来。见 [先探索（Explore First）](explore.md)。
- **从零开始。** 如果意图已经根本改变，一个新的 change 可能比修补旧的更清楚。

最后一个动作有它自己的决策指南，就在下面。

### 11.7 什么时候更新 vs. 另起一个新 change（When to update vs. start a new change）

短版本：**当它是同一件工作的精修时就更新；当意图根本改变、或者范围爆炸成了不同的工作时就另起。**

- 同一个目标，更好的方法？更新。
- 范围收窄（现在先发 MVP，以后更多）？更新，然后归档，再为第二阶段开一个新 change。
- 问题本身变了（「加个深色模式」变成了「建一套完整的主题系统」）？新 change。

完整的流程图和工作示例在 [工作流：什么时候更新 vs. 另起（Workflows: When to Update vs Start Fresh）](workflows.md#when-to-update-vs-start-fresh)，更深入的讨论在 [OPSX：什么时候更新 vs. 另起（OPSX: When to Update vs. Start Fresh）](opsx.md#when-to-update-vs-start-fresh)。

### 11.8 关于 task 的一点说明（A note on tasks）

`tasks.md` 是一份活的清单，不是冻结的计划。随着你实现，你可以加上你发现的 task，删掉后来发现不必要的那些，或者给它们重排顺序。AI 在 `/opsx:apply` 期间完成它们时会勾掉条目，如果你以后回来，它会从第一个未勾选的 task 继续。飞行途中编辑这份清单是预期之中的事。

### 11.9 下一步去哪（Where to go next）

- [工作流（Workflows）](workflows.md) - 各种模式，加上更新还是另起的决策指南
- [评审一个 change（Reviewing a Change）](reviewing-changes.md) - 在你构建之前对计划做的两分钟通读
- [先探索（Explore First）](explore.md) - 当一个想法需要重新思考时退回去的地方
- [命令（Commands）](commands.md) - `/opsx:continue`、`/opsx:apply` 和 `/opsx:verify` 的细节
- [概念：Artifact（Concepts: Artifacts）](concepts.md#artifacts) - 每份 artifact 各自的用途
