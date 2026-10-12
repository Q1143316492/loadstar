## 13 existing-projects —— 用在存量项目里

> 译自 `reference/openspec/docs/existing-projects.md`（原文 134 行，全文翻译）。按 `READING-openspec.md` 第 13 项。代码块（含终端命令、聊天实录）按原样保留。

### 13.1 开篇

**你不必一开始就把整个代码库文档化。你只为即将改动的东西写 spec。** 这是在存量项目上采用 OpenSpec 最该知道的一件事，也是 OpenSpec 为什么以存量为先来构建。

一种常见的担心听起来是这样的：「我的应用有 8 万行旧代码。难道我得先把它们全都写成 spec，OpenSpec 才有用？」不。你会讨厌那样，我们也会。OpenSpec 让 spec 一次一个 change 地长出来。你的第一个 change 记录它碰到的那一片，下一个 change 记录它的那一片，几个月之后，你的 spec 就围绕你实际做的工作自然地补齐了。

本指南展示如何在第一天就开始，而不去煮沸整个海洋。

### 13.2 三十秒版本（The thirty-second version）

```bash
$ cd your-existing-project
$ openspec init          # adds openspec/ and your AI tool's commands
```

然后，在你的 AI 聊天里：

```text
/opsx:explore            # optional: have the AI read the area you'll touch
/opsx:propose <a real, small change you actually need>
/opsx:apply
/opsx:archive
```

你的 spec 现在精确描述那个 change 碰到的系统部分，不多一点。这是对的。你可以不再为另外那 8 万行操心了。

### 13.3 为什么 delta 为先就是全部的诀窍（Why delta-first is the whole trick）

OpenSpec 的 change 写成 **delta**：`ADDED`、`MODIFIED`、`REMOVED`。delta 描述相对于当前行为变的是什么，而不是整个系统。

这正是存量工作需要的。你很少从零开始构建。你在加一个字段、修一个重定向、收紧一个超时。delta 让你精确地指定那一个改动，而不必先写下关于它周边一切的 40 页 spec。

所以你的 `openspec/specs/` 目录一开始不是满满当当、完整无缺的。它开始时几乎是空的，然后累积。每个归档的 change 把它 delta 合并进来。`auth/` 的 spec 只有在你做过几次 auth 改动之后才会变得详尽，而那正是你想要它详尽的时候。

如果你想要更深的机制，见 [概念：Delta Spec](concepts.md#delta-specs)。

### 13.4 在真实代码库上的第一个 change（Your first change on a real codebase）

挑一件小而真实的事。不是玩具，不是重写。一件你反正这周就要做的改动。小的首次 change 以低风险教会你这个工作流。

**第 1 步：让 AI 读相关的那片区域。** 这正是 `/opsx:explore` 在一个陌生或庞大的代码库上挣得自己位置的地方。把它指向你即将触碰的部分，让它在提议任何东西之前先摸清事情如何运作。

```text
You: /opsx:explore

AI:  What would you like to explore?

You: I need to add rate limiting to our public API, but I'm not sure
     how requests currently flow through the middleware.

AI:  Let me trace it... [reads the router, middleware stack, and config]
     Requests hit Express, pass through auth middleware, then your
     controllers. There's no rate-limiting layer today. The cleanest
     insertion point is a middleware right after auth. Want me to scope it?
```

注意 AI 现在理解你的实际结构，所以它写出的 proposal 会贴合你的代码，而不是一个通用模板。在一个大代码库上，单单这个习惯就能省下最多的痛苦。见 [先探索](explore.md)。

**第 2 步：提议这个 change。** proposal 和它的 delta spec 只捕捉这一个 change。

```text
You: /opsx:propose add-api-rate-limiting
```

**第 3 步：构建并归档**，用 `/opsx:apply` 和 `/opsx:archive`，和任何 change 一样。归档之后，你有了一份描述限流行为的真 spec，它诞生于一个你本来就需要做的改动。

### 13.5 想要人带着走一遍？用 onboard（Prefer a guided tour? Use onboard）

如果你更愿意在自己的代码上看整个循环带着讲解发生一遍，扩展命令 `/opsx:onboard` 做的正是这个：它在你的代码库里扫出一个小的、安全的改进，然后带你走一遍提议、构建和归档，并解释每一步。

先打开扩展命令：

```bash
$ openspec config profile      # select the expanded workflows
$ openspec update              # apply them to this project
```

然后在聊天里：

```text
/opsx:onboard
```

这是在一个真实项目上最温和的入门方式，而且它会给你留下一个真实的（小）change，你可以保留也可以丢弃。见 [命令：`/opsx:onboard`](commands.md#opsxonboard)。

### 13.6 「但我已经有需求文档了」（"But I already have requirements docs"）

也许你有一份 PRD、一份 SRS、一份正式 spec，甚至是 TLA+ 模型。很好。你不会把它们整体导入，也不必把它们扔掉。

把既有文档当作**探索的素材**，而不是要转换的 spec。当你开始一个 change 时，把相关的那一节粘给 AI 或指给它看，让它从中塑造出一份聚焦的 OpenSpec delta。delta 用 OpenSpec 可测试的 requirement-and-scenario 形式，捕捉你现在正在改的行为。你原来的文档留在原地，作为背景。

诚实的原因：OpenSpec 的 spec 刻意以行为为先、以 change 为范围。一份 40 页的 PRD 是另一种 artifact，干的是另一种活。强行做一次性的批量转换，往往产出一份巨大、陈旧、没人信任的 spec。让 spec 从真实的 change 里长出来，才能让它们保持准确。

```text
You: /opsx:explore
You: Here's the section of our PRD about checkout. I'm implementing the
     "guest checkout" requirement next.
     [paste the relevant requirement]
AI:  [reads it, asks clarifying questions, then helps scope a change]
You: /opsx:propose add-guest-checkout
```

### 13.7 在大代码库里组织 spec（Organizing specs in a big codebase）

spec 住在 `openspec/specs/` 下面，按 **domain** 分组：domain 是一个逻辑区域，和你的团队思考这个系统的方式相符。你不必预先设计好整个分类法。当你在某个区域的第一个 change 需要时，就创建那个 domain 文件夹。

切分 domain 的常见方式：

- **按功能区域：** `auth/`、`payments/`、`search/`
- **按组件：** `api/`、`frontend/`、`workers/`
- **按限界上下文：** `ordering/`、`fulfillment/`、`inventory/`

挑一个能让新人点头的就行。你可以以后再细化。见 [概念：Spec](concepts.md#specs)。

### 13.8 Monorepo 与跨仓库的工作（Monorepos and work that spans repos）

对于 monorepo，最简单的模型是在仓库根放一个 `openspec/` 目录，domain 对应你的 package 或 service。这覆盖了大多数团队。

如果你的工作真的横跨**多个仓库**（或者几个你当作独立单元对待的 package），OpenSpec 有一个 beta 的 **stores** 功能：规划住在它自己的独立仓库里，你的任何一个代码仓库都可以引用它，所以计划不必住进某一个仓库的 `openspec/` 文件夹里。它还是 beta，所以把它的命令和状态当作仍在演进。先读 [Stores 用户指南](stores-beta/user-guide.md)，了解心智模型和最短的可用路径。

### 13.9 几句诚实的提醒（A few honest cautions）

- **抵制把一切回填的冲动。** 为你并不在改的代码写 spec，感觉很有产出，但通常不是。那些 spec 会变陈旧，因为没有任何东西逼着它们跟上现实。让真实的 change 驱动你的 spec。
- **让早期 change 保持小。** 你最初的几个 change 与其说是在交付，不如说是在学节奏。范围紧，循环就快，教训就便宜。
- **把 `openspec/` 提交进 git。** 你的 spec 和归档属于版本控制，和它们描述的代码放在一起。
- **给 AI 上下文。** 在一个约定很强的大代码库上，填好 `openspec/config.yaml` 的 `context:`，这样每份 proposal 都会尊重你的技术栈和模式。见 [自定义](customization.md#project-configuration)。

### 13.10 接下来去哪（Where to go next）

- [先探索](explore.md) - 在改动代码之前先理解代码的关键习惯
- [上手](getting-started.md) - 完整的首次 change 走查
- [编辑与迭代一个 change](editing-changes.md) - 随着你的理解调整一个 change
- [概念：Delta Spec](concepts.md#delta-specs) - 为什么 delta 让存量工作变得干净
- [自定义](customization.md) - 教 OpenSpec 你的项目约定
