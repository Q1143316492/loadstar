## 2 overview —— 核心概念一览

> 译自 `reference/openspec/docs/overview.md`（原文 91 行，全文翻译）。按 `READING-openspec.md` 第 02 项。

### 2.1 开篇

**OpenSpec 是你和你的 AI 之间的一层轻量协议。** 你把一个变更该做什么写下来，AI 起草细节，你们一起看同一份计划，然后才开始写代码。这一页把整个心智模型放在一屏里。想要长版本时，见 [Concepts](concepts.md)。

整个想法用五个词概括：**先达成一致，再有信心地构建。**

### 2.2 五个想法（The five ideas）

OpenSpec 里的一切都由五个概念搭成。学会这五个，剩下的都是细节。

**1. spec 就是真相。** 一个 spec 描述你的系统**此刻**如何行为。它住在 `openspec/specs/`，按领域组织（`auth/`、`payments/`、`ui/`）。spec 由 requirement（"系统 SHALL 在 30 分钟后让会话过期"）和 scenario（具体的 given/when/then 例子）组成。把 spec 想成"这个软件做什么"这个问题的唯一共识答案。

**2. 一个 change 是一个工作单元。** 当你想添加、修改或移除行为时，你创建一个 change：`openspec/changes/` 下的一个目录，把这项工作的所有东西放在一处。一份 proposal、一份 design、一份任务清单，以及 spec 的改动。一个 change，一个目录，一个功能。

**3. delta spec 描述的是变的是什么，不是整个世界。** 在一个 change 内部，你不重写整个 spec。你写一小段 delta：`ADDED` 这条 requirement，`MODIFIED` 那条，`REMOVED` 另一条。这个技巧正是 OpenSpec 擅长修改既有系统、而不只是从零开始的原因。你描述的是差异，不是终点。

**4. artifact 互相喂养。** 一个 change 包含几份文档，按自然的顺序创建，每一份喂给下一份：

```text
proposal ──► specs ──► design ──► tasks ──► implement
   why        what       how       steps      do it
   为什么      做什么      怎么做      步骤        去做
```

你随时可以回头改其中任何一份。它们是**使能者，不是闸门**。（下面还会再讲。）

**5. 归档把 change 折回真相。** 工作完成后，你归档这个 change。它的 delta spec 合并进主 spec，change 目录带着日期前缀移进 `changes/archive/`。现在你的 spec 描述的是新现实，你准备好迎接下一个 change。循环闭合。

### 2.3 全景图（The picture）

```text
┌─────────────────────────────────────────────────────────────────┐
│                          openspec/                              │
│                                                                 │
│   ┌──────────────────┐         ┌──────────────────────────┐    │
│   │     specs/       │         │        changes/          │    │
│   │                  │ ◄─────  │                          │    │
│   │ source of truth  │  merge  │ one folder per change    │    │
│   │ how things work  │  on     │ proposal · design ·      │    │
│   │ today            │ archive │ tasks · delta specs      │    │
│   └──────────────────┘         └──────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

两个目录。`specs/` 是真的东西。`changes/` 是你在提议的东西。归档把一份提议变成真相。

### 2.4 你实际会跑的循环（The loop you'll actually run）

在默认配置下，你的一天是这样的。可选地先想清楚；然后一条命令起草计划，你读它，下一条把它建出来，最后一条把它归档。

```text
/opsx:explore                   →  （可选）先和 AI 一起想清楚
/opsx:propose add-dark-mode     →  AI 起草 proposal、specs、design、tasks
        （你读并调整计划）
/opsx:apply                     →  AI 把它建出来，逐项勾掉任务
/opsx:archive                   →  spec 已更新，change 已归档
```

**拿不准时，从探索开始。** `/opsx:explore` 是一个无风险的思考伙伴：它读你的代码，摆出选项，在任何代码被写出来之前把一个模糊的想法变成具体计划。它是「一个 AI 面对模糊提示词反正会建出*某个东西*」的最佳解药。已经确切知道想要什么？直接跳到 `/opsx:propose`。两条路都行，explore 在默认 profile 里，所以它一直都在。见 [Explore guide](explore.md)。

那些是 slash command，在你的 AI 助手聊天框里输入。配置（`openspec init`）发生在你的终端里。如果这个分界对你来说是新的，先读 [How Commands Work](how-commands-work.md)；它是最常见的困惑点。

### 2.5 「使能，而非闸门」（"Enablers, not gates"）

这个说法在 OpenSpec 里到处出现，所以这里用大白话解释它的意思。

老派的 spec 流程是瀑布：先完成规划，*然后*你才被允许实现，而且回头很痛苦。OpenSpec 拒绝这一套。`proposal → specs → design → tasks` 这个顺序展示的是接下来**什么是可能的**，不是你**被迫**要做的下一步。

实现过程中发现设计错了？改 `design.md` 然后继续。意识到范围该缩小？更新 proposal。没有任何东西锁上。依赖的存在只是为了让 AI 拿到它需要的上下文（没有 spec 做基础，你写不出好 tasks），而不是为了把你关进框里。

这里的强项是诚实：真实工作是混乱而迭代的，OpenSpec 让它保持这样。代价是纪律：因为没有任何东西逼你往前走，保持一个 change 聚焦的责任就落在你身上，而不是任由它蔓延。[Workflows](workflows.md) 指南里有这方面的好习惯。

### 2.6 这点小开销为什么值得（Why this is worth the small overhead）

说白了：OpenSpec 多了一步。你在构建之前先写一份简短的计划。那么你换来了什么？

- **在走错路的代价还小的时候抓住它。** 在一段话的 proposal 里修正一个误解是免费的；等 AI 写完 400 行之后再修就不是了。
- **计划和代码待在同一个仓库里。** 六个月后，spec 会告诉你（以及下一个 AI 会话）这个系统为什么是这样工作的。
- **change 是可评审的。** 一个 change 目录是一个整洁的包裹：读 proposal，扫一遍 deltas，检查 tasks。不用在聊天记录里做考古。
- **它适配既有代码库。** delta 意味着你可以为一个五万行的应用指定一个变更，而不必先把整个应用文档化。

还有一个诚实的取舍：对于一个真正琐碎的一行修改，这些仪式可能不划算，这没关系。OpenSpec 被设计得轻量，但它不是免费的。在「达成一致很重要」的地方用它 —— 而一旦你在和一个会自信地把你随口一说就建出来的 AI 合作，那几乎就是所有时候。

### 2.7 下一步去哪（Where to go next）

- 第一次来？[Getting Started](getting-started.md) 完整走一遍第一个 change。
- 还不确定要建什么？从 [Explore First](explore.md) 开始。
- 搞不清命令在哪里跑？[How Commands Work](how-commands-work.md)。
- 想要上面所有内容的深入版？[Concepts](concepts.md)。
- 靠例子学？[Examples & Recipes](examples.md)。
- 需要查术语？[Glossary](glossary.md)。
