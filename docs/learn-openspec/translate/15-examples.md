## 15 examples —— 例子与配方

> 译自 `reference/openspec/docs/examples.md`（原文 224 行，全文翻译）。按 `READING-openspec.md` 第 15 项。七份端到端对话实录所在的 `text` 代码块，以及终端 `bash` 代码块与 `yaml` 代码块，全部按原样逐字保留；只译外围正文与各配方的 H2 标题。

### 15.1 开篇

真实的 change，从开始到结束。每份配方展示你会输入的命令，以及你会看到什么回来，这样你就能把自己的处境对上某个模式并照抄。这些都用默认的 **core** 命令（`propose`、`explore`、`apply`、`update`、`sync`、`archive`）；扩展命令集有帮助的地方会注明。

开始之前提醒一句：像 `/opsx:propose` 这样的 slash command 输在 **AI 助手的聊天**里，而 `openspec` 命令输在**终端**里。如果这对你是新东西，先读 [命令如何工作](how-commands-work.md)。下面的实录里，`You:` 和 `AI:` 是聊天，以 `$` 开头的行是终端。

> **还不确定自己在建什么？** 如果你先用 `/opsx:explore` 把它想透，这些配方大多会更锋利。[配方 3](#recipe-3-exploring-before-you-commit) 展示了它的实际样子，[先探索](explore.md) 指南给出了完整的论证。

### 15.2 配方 1：一个小功能，走快速路径（Recipe 1: A small feature, the fast path）

**什么时候用它：** 你知道自己想要什么，而且这是一块边界清楚的工作。这是最常见的配方。

整个过程就三条命令。propose、build、archive。

```text
You: /opsx:propose add-logout-button

AI:  Created openspec/changes/add-logout-button/
     ✓ proposal.md — why and what
     ✓ specs/      — the new requirement and its scenarios
     ✓ design.md   — technical approach
     ✓ tasks.md    — implementation checklist
     Ready for implementation. Run /opsx:apply.
```

现在读那份计划。打开 proposal 和 delta spec。这就是 OpenSpec 为之而生的时刻：在一个错误假设还只是一段话、而不是 400 行代码的时候抓住它。如果有什么不对，直接编辑任何 artifact，然后继续。

```text
You: /opsx:apply

AI:  Working through tasks...
     ✓ 1.1 Add logout button to header
     ✓ 1.2 Clear session on click
     ✓ 1.3 Add confirmation dialog
     All tasks complete!

You: /opsx:archive

AI:  Archiving add-logout-button...
     ✓ Merged specs into openspec/specs/auth/spec.md
     ✓ Moved to openspec/changes/archive/2026-06-22-add-logout-button/
     Done. Ready for the next change.
```

就这样。登出行为现在是你的 spec 的一部分，而这个 change 带着它的完整上下文被归档了。

### 15.3 配方 2：修一个 bug（Recipe 2: A bug fix）

**什么时候用它：** 有东西坏了，而你想让这个修复被记录成一次深思熟虑的行为变更，而不是一次神秘的提交。

bug 修复和功能完全一样地工作。区别在于你怎么框定 proposal：描述*正确的*行为，而不只是「修好这个 bug」。

```text
You: /opsx:propose fix-login-redirect-loop

AI:  Created openspec/changes/fix-login-redirect-loop/
     The proposal captures the current broken behavior and the
     intended behavior. The delta spec MODIFIES the redirect
     requirement so it's now precise and testable.
     Ready for implementation.
```

因为修复是作为一条带全新 scenario 的 `MODIFIED` requirement 落地的，下一个人（或者下一个 AI 会话）看到的就不只是你修好了它，还有「正确」是什么意思。然后照常 `/opsx:apply` 和 `/opsx:archive`。

提示：对一次修复来说，好的 scenario 就是用散文写成的回归测试。「GIVEN a logged-out user, WHEN they submit valid credentials, THEN they land on the dashboard and are not redirected again.」把这句话写出来，实现就有了明确的目标。

### 15.4 配方 3：投入之前先探索（Recipe 3: Exploring before you commit）

**什么时候用它：** 你有一个问题，但还没有计划。你不确定该建什么，或者哪条路是对的。

从 `/opsx:explore` 开始。它是一个没有结构的思考伙伴。它从不写代码，也不写任何别的东西 —— 除非你让它把你们定下的东西记下来，或者在它提议时你说好。它读你的代码库并帮你做决定。

```text
You: /opsx:explore

AI:  What would you like to explore?

You: Page loads feel slow but I don't know where the time goes.

AI:  Let me look... I found three likely culprits:
     1. Large unoptimized images on the product list
     2. Synchronous data fetching that blocks render
     3. Re-renders triggered by context changes
     Which should we tackle first?

You: The data fetching one.

You: /opsx:propose optimize-product-list-fetching

AI:  Created the change, with a proposal informed by what we just
     found. Ready for implementation.
```

探索在你为一个想法花掉一个 change *之前*就澄清了你的思路。当洞见成形时，去 propose，AI 会把上下文带过去。

### 15.5 配方 4：同时周旋两个 change（Recipe 4: Juggling two changes at once）

**什么时候用它：** 你正做到一半，一个紧急修复插了队。

change 是彼此独立的文件夹，所以并行的工作不会冲突。启动那个修复，交付它，然后回到你刚才停下的地方继续那个功能。

```text
You: I'm partway through add-dark-mode, but I need to fix a login bug now.

You: /opsx:propose fix-login-redirect

AI:  Created openspec/changes/fix-login-redirect/. Ready for implementation.

You: /opsx:apply

AI:  Implemented the fix. All tasks complete.

You: /opsx:archive

AI:  ✓ Archived fix-login-redirect.

You: Back to dark mode.

You: /opsx:apply add-dark-mode

AI:  Resuming add-dark-mode. Picking up at task 2.3: Update Header...
```

在 `/opsx:apply add-dark-mode` 里点名 change，就是当一个以上 change 处于活跃时，你把 AI 指向某个具体 change 的方式。因为 task 在 `tasks.md` 里跟踪完成度，AI 确切知道你在哪里停下。

当几个 change 同时完成时，扩展命令 `/opsx:bulk-archive` 把它们一起归档，并通过检查代码里实际实现了什么来解决 spec 冲突。见 [工作流](workflows.md#parallel-changes)。

### 15.6 配方 5：无行为变更的重构（Recipe 5: A refactor with no behavior change）

**什么时候用它：** 你在重整代码结构，而外部可见的行为应当保持完全一致。

这是有意思的那种情况，因为一次纯粹的重构*没有任何东西要加到你的 spec 里*。行为契约不变，变的只是实现。所以工作住在 design 和 tasks 里，而 spec delta 是空的或者不存在。

```text
You: /opsx:propose refactor-payment-module

AI:  Created the change. The proposal states the goal (split the
     payment module, no behavior change) and the design captures
     the new structure. No spec changes, since behavior is identical.
     Ready for implementation.
```

通过在 change 的 `.openspec.yaml` 里设置 `skip_specs: true`，显式声明这份空 delta：

```yaml
schema: spec-driven
skip_specs: true
```

没有这个标记时，`openspec validate` 会拒绝一个零 delta 的 change（这样被遗忘的 specs 阶段仍然会被抓住）；有了它，校验通过，而 `openspec status` 把 specs 阶段显示为被显式跳过，而不是待办。如果这次重构到头来还是改变了行为，就把 `skip_specs` 从 `.openspec.yaml` 里删掉，并写出 delta spec —— validate 把「标记加 spec 文件」视为冲突，所以过期的标记不会悄悄留着。

归档一个带标记的 change 不需要额外的 flag（没有 delta 要合并）。另外，`--skip-specs` flag 告诉终端命令显式跳过 spec 这一步：

```bash
$ openspec archive refactor-payment-module --skip-specs
```

同一个 flag 对工具链、CI 和只改文档的 change 也很顺手。原则是：spec 描述行为，所以如果行为没变，spec 也不该变。见 [概念](concepts.md#what-a-spec-is-and-is-not)。

### 15.7 配方 6：逐步控制（扩展命令）（Recipe 6: Step-by-step control (expanded commands)）

**什么时候用它：** 一个复杂或有风险的 change，你想在往下走之前逐一评审每个 artifact。

core 的 `/opsx:propose` 一次性起草所有东西。当你更想一步一步来时，打开扩展命令：

```bash
$ openspec config profile      # select the expanded workflows
$ openspec update              # apply them to this project
```

现在你可以搭骨架并增量构建：

```text
You: /opsx:new add-2fa

AI:  Created openspec/changes/add-2fa/. Ready to create: proposal.

You: /opsx:continue

AI:  Created proposal.md. Now available: specs, design.

You: /opsx:continue

AI:  Created specs/auth/spec.md. Now available: design.
```

每个 artifact 一落地就评审它，随意编辑，满意了再继续。当你想要剩下的部分一次起草完时，`/opsx:ff` 会快进过剩余的规划 artifact。归档之前，`/opsx:verify` 检查实现是否真的与 spec 相符。见 [工作流](workflows.md#opsxff-vs-opsxcontinue)。

### 15.8 配方 7：动手学会整个循环（Recipe 7: Learning the whole loop hands-on）

**什么时候用它：** 你已经装好了 OpenSpec，想在自己的代码上*感受*这个工作流，而不是看一个玩具例子。

打开扩展命令（见配方 6），然后：

```text
You: /opsx:onboard

AI:  Welcome to OpenSpec! I'll walk you through a complete change
     using your actual codebase. Let me scan for a small, safe
     improvement we can make together...
```

`/opsx:onboard` 找到一个真实的（小）改进，为它创建一个 change，实现它，并归档它，全程都有讲解。它要花 15 到 30 分钟，给你留下一个真实的 change，你可以保留也可以丢弃。这是最温和的学习方式。见 [命令](commands.md#opsxonboard)。

### 15.9 从终端检查你的工作（Checking your work from the terminal）

任何时候，你都可以从终端查看事情的状况：

```bash
$ openspec list                      # active changes
$ openspec show add-dark-mode        # one change in detail
$ openspec validate add-dark-mode    # check structure
$ openspec view                      # interactive dashboard
```

这些是读取与检视的工具。提议和构建仍然通过聊天里的 slash command 发生。完整细节见 [CLI 参考](cli.md)。

### 15.10 接下来去哪（Where to go next）

- [先探索](explore.md)：当你不确定时推荐的开头方式
- [工作流](workflows.md)：上面那些模式，外加每个模式何时使用的决策指南
- [命令](commands.md)：每一条 slash command 的详细说明
- [上手](getting-started.md)：标准的首次 change 走查
- [概念](concepts.md)：这些部件为什么这样拼在一起
