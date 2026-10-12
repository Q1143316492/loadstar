## 6 explore —— 先探索

> 译自 `reference/openspec/docs/explore.md`（原文 127 行，全文翻译）。按 `READING-openspec.md` 第 06 项。代码块按原样保留。

### 6.1 开篇

**`/opsx:explore` 是你的思考伙伴。当你有一个问题但还没有计划时，就用它。** 它调查你的代码库，和你一起权衡选项，并澄清你真正想要什么 —— 这一切都发生在写下一行代码之前。当图景清楚了，它把接力棒交给 `/opsx:propose`。

如果你从这些文档里只带走一个习惯，就带这个：**拿不准时，先探索，再提议。**

为什么这重要。AI 编码助手很急切。你模糊地问，它们会自信地建出**某个东西**，只是可能不是你需要的东西。explore 是解药。它是一场无风险的对话，你和 AI 在其中一起弄清正确的走法，所以等到你 propose 时，你提议的是对的东西。

### 6.2 什么时候探索（When to explore）

explore 作为第一步的适用频率比人们预期的高。以下任一条为真时就用它：

- 你知道**问题**但不知道**方案**。（"页面感觉慢。""认证一团糟。""我们老是收到重复订单。"）
- 你在几个方法之间选择，想看到它们针对**你的实际代码**的权衡。
- 你刚接触一个代码库，需要先理解某样东西怎么工作，再去改它。
- 需求很模糊，你想在承诺之前把它们磨锋利。
- 你怀疑这活儿比看起来更大或更小，想诚实地量一下范围。

只有当你已经确切知道想要什么、以及怎么做时，才跳过 explore。那种情况下直接去 [`/opsx:propose`](commands.md#opsxpropose)。

### 6.3 它做什么（以及不做什么）（What it does (and doesn't)）

explore 是一场**对话**，不是一个生成器。

**它做：**
- 读取和搜索你的代码库来回答真实问题。
- 比较选项并点明每个的权衡。
- 画图让一个设计变得易读。
- 帮你把一个模糊想法收窄成具体、可构建的范围。
- 在你要求时、或你接受它的提议时，捕捉这次探索：它用 `openspec new change` 搭出 change 骨架，写下你点名的那些规划 artifact，或者更新一个既有 change 的 artifact。
- 在你准备好时交给 `/opsx:propose`。

**它不做：**
- 写或改代码。explore 永不写代码，任何路径下都不写，包括 capture 在内。
- 设计或编辑你的 schema 或模板。塑造那些是一个 change，不是思考。
- 自己开一个 change 或写一个 artifact。除非你要求、或它提议时你说了是，否则它什么都不写；而且即便写了，也只写你同意的东西，加上开一个 change 所需的那些配置性文件（见下文）。
- 推着你去做 capture。当思考结晶时它会提议；决定权在你。

这就是重点。探索不花你任何代价，也不让你承诺任何事，直到你开口。你可以探索三条死胡同，从每条里学到东西，然后只提议那条活下来的路。

### 6.4 它已经装好了（It's already installed）

好消息：`/opsx:explore` 随默认的 **core** profile 一起发货，和 `propose`、`apply`、`update`、`sync`、`archive` 并列。你不需要启用任何东西。如果你的项目里配置好了 OpenSpec，explore 就在你的 AI 聊天里待命。（和所有 `/opsx:*` 命令一样，你在助手的聊天里输入它，不是终端。见 [How Commands Work](how-commands-work.md)。）

### 6.5 一个完整例子（A full example）

看一个模糊的担忧如何变成一个锋利、可构建的 change。

```text
You: /opsx:explore

AI:  What would you like to explore?

You: Our checkout sometimes creates duplicate orders. I don't know why
     and I don't know how to fix it safely.

AI:  Let me dig into the checkout path...
     [reads the order service, the payment webhook handler, and the
      client submit logic]

     Here's what I found. There are two ways a duplicate can happen:

     1. The client can submit twice (double-click, retry on slow network).
        Nothing debounces it.
     2. The payment webhook can fire more than once, and the handler
        creates an order each time. There's no idempotency key.

     Cause #2 is the dangerous one: it can charge and fulfill twice.

     Three ways to fix it, roughly in order of robustness:
     - Idempotency key on the order-creation endpoint (handles both causes)
     - Dedup on the webhook by payment-intent id (handles #2 only)
     - Client-side debounce (handles #1 only, papers over the real bug)

     Given your code already stores the payment-intent id, the
     idempotency-key approach is a small change with the biggest payoff.
     Want me to scope that?

You: Yes, let's do the idempotency key.

You: /opsx:propose add-order-idempotency-key

AI:  Created openspec/changes/add-order-idempotency-key/, with a proposal
     and delta spec grounded in what we just found. Ready for implementation.
```

注意发生了什么。起点是「有东西坏了，我不敢碰」。二十秒的探索把它变成了一个被命名的根因、三个排序过的选项、一条系在既有代码上的推荐，以及一个精确的 change。接下来的 proposal 之所以锋利，是因为思考先发生了。

### 6.6 交接给 propose（Handing off to propose）

explore 不归档进任何东西。当你准备好了，你就开始一个 change，AI 会把你们对话里的上下文带进 artifact。

```text
explore  ──►  propose  ──►  apply  ──►  archive
 (think)     (agree)       (build)     (record)
  （思考）      （达成一致）    （构建）      （记录）
```

你可以用大白话说（"let's turn this into a change"），或者直接跑 `/opsx:propose <name>`。两条路都行：你刚做的探索会成为 proposal 的地基，而不是一次性的聊天。

你也可以让 explore 自己捕捉这个 change，不用离开对话："start a change for this" 会搭出目录，"write the proposal too" 会正好写下你点名的那些 artifact。搭骨架还会铺下这个 change 自己的元数据，并把你的项目在顶层缺失的东西补齐（`openspec/specs/`、`openspec/changes/archive/`、一份 `config.yaml`）。

这和交接给 propose 是同一个终点，只有一个区别：propose 会写你的 schema 为抵达实现所需的**整套**，而 capture 只写你点名的那些 artifact。

如果你用扩展命令集，explore 也可以改为交给 `/opsx:new`，走逐步创建 artifact 的路线。见 [Workflows](workflows.md)。

### 6.7 一次好探索的技巧（Tips for a good exploration）

- **带问题来，不要带方案来。** "Logins feel slow" 给 AI 留出调查的空间。"Add a Redis cache" 让你预先承诺一个还没验证过的答案。
- **把权衡问出声。** "What are the downsides of each option?" 会让你拿到更诚实的比较。
- **让它先读。** 最好的探索从 AI 真的去看你的代码开始，而不是靠猜。有帮助的话，把它指到相关区域。
- **中途放弃是可以的。** 如果探索揭示出这个想法不值得做，那是一次胜利。你很便宜地学到了这一点。
- **change 进行到一半也可以再探索。** `/opsx:apply` 卡住了？你可以退一步，探索一个子问题，然后回来。

### 6.8 诚实的取舍（The honest tradeoffs）

**你得到什么：** explore 在最便宜的时刻抓住走错的方向 —— 在你承诺任何事之前。它在你陌生的代码里尤其强大，因为 AI 读代码并概述系统的能力能替你省下一个下午的摸索。

**它花你什么：** 一点耐心。explore 是一场对话，所以它比直接甩出 `/opsx:propose` 然后祈祷要慢。对于你已经真正理解的活儿，这额外的一步是纯粹的开销，你应该跳过它。

经验法则：任务越模糊，explore 越值；任务越清楚，你越可以直接跳到 propose。

### 6.9 下一步去哪（Where to go next）

- [Commands: `/opsx:explore`](commands.md#opsxexplore)：精确参考
- [Workflows](workflows.md)：作为日常循环一部分的 explore
- [Examples & Recipes](examples.md#recipe-3-exploring-before-you-commit)：一个完整走查里的 explore
- [Getting Started](getting-started.md)：第一个 change 的指南，包含探索
