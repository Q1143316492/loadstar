## 14 team-workflow —— 团队里的 OpenSpec

> 译自 `reference/openspec/docs/team-workflow.md`（原文 74 行，全文翻译）。按 `READING-openspec.md` 第 14 项。代码块（含 ASCII 流程图与终端命令）按原样保留。

### 14.1 开篇

其他指南里的一切，无论你是单干还是在一个二十人的团队里，运作方式都一样。在团队里变的是边缘上的那些问题：spec 住在哪，队友怎么评审一份计划，以及这一切怎么套进我们已有的 pull request 流程。

简短的回答：一个 change 就是一些文件，而 OpenSpec 从不碰 git。所以它嵌进你现有的工作流，而不是取代它。这一页把那些好用的约定讲清楚。

### 14.2 唯一一条规则：OpenSpec 不碰 git（One rule: OpenSpec doesn't touch git）

OpenSpec 读写 `openspec/` 下的纯 Markdown。它从不在你的项目里 commit、branch、push 或 pull —— 它也从不自己 clone 或同步一个 [store](stores-beta/user-guide.md)。这意味着：

- **你像提交任何源码一样提交 `openspec/`。** spec、活跃的 change 和归档都是你项目历史的一部分。（是的，提交整个文件夹 —— 见 [FAQ](faq.md#should-i-commit-the-openspec-folder-to-git)。）
- **一个 change 就是一个你像代码一样做版本管理的文件夹。** `openspec/changes/add-dark-mode/` 只是一个分支上的文件。
- **下面所有内容都是约定，不是强制。** OpenSpec 不会逼你这么做；它只是刚好套得很顺。

### 14.3 日常循环（The everyday loop）

好用的工作流，是把一个 change 映射到一个分支和一个 pull request：

```
git switch -c add-dark-mode        start a branch, as usual
   │
/opsx:propose add-dark-mode        draft the plan (proposal + specs + tasks)
   │
REVIEW THE PLAN                    you read it before any code — see Reviewing a Change
   │
/opsx:apply                        build it; artifacts + code change together
   │
git commit && open a PR            the PR contains the spec delta AND the code
   │
teammate reviews, merges
   │
/opsx:archive                      fold the delta into specs/, move the change to archive/
```

计划和代码并排住在同一个分支里，所以你的队友会把两者一起评审，而六个月之后，归档的 spec 仍然解释着这段代码为什么长成那样。

### 14.4 在 pull request 里评审 spec（Reviewing specs in a pull request）

这正是团队感受到回报的地方。当一个 PR 里包含该 change 的 delta spec 时，评审者得到的是原始 diff 从来给不了的东西：**一份用平实语言写成的「这个 change 打算做什么」的陈述**，就在他们读第一行代码之前。

对评审者来说，一个好的阅读顺序：

1. **读 `proposal.md`** —— 这是对的问题和范围吗？
2. **读 `specs/` 下的 delta** —— 「完成」的定义对吗？（这就是[评审一个 change](reviewing-changes.md) 的两分钟过一遍，现在发生在 PR 里。）
3. **然后读代码 diff** —— 它是否恰好交付了那些 requirement？

对*做法*有异议的评审者，可以针对 proposal 便宜地把意见说出来，而不必在 300 行代码上重新争论一遍。把 delta spec 放在 PR 描述靠上的位置，或者把评审者指向那个 change 文件夹，让他们从那里开始。

### 14.5 什么时候归档（When to archive）

归档把 change 的 delta 折进你的主 `openspec/specs/`，并把 change 文件夹移到 `openspec/changes/archive/YYYY-MM-DD-<name>/`。因为 `specs/` 是**共享的真相来源**，在团队里时机就有讲究了。两种可行的约定：

- **PR 合并之后归档（推荐）。** 分支携带活跃的 change；一旦它合并进你的主分支，就在那里归档（通常是一个很小的后续提交，或一次定时的清理）。这让共享的 `specs/` 只随着真正上线的工作向前走。
- **在 PR 里面归档。** 对小团队更简单：同一个 PR 既加代码，也做 sync 和归档。代价是你的 `specs/` diff 和代码 diff 一起落地，这会让 PR 更吵。

挑一种，并保持一致。无论哪种，`/opsx:archive` 都会检查 task 是否完成，并先提议做一次 sync，所以不会有东西被半途而废地意外合并。

### 14.6 两个人，并行的 change（Two people, parallel changes）

因为 change 是各自独立的文件夹，它们不会相撞：

- **不同的 change，不同的人 —— 没问题。** `add-dark-mode` 和 `rate-limit-login` 是不同分支上的不同文件夹；在两者都归档之前，它们从不碰对方。
- **一个 change，一个 owner。** 两个人编辑同一个 change 文件夹，冲突起来和两个人编辑同一个文件一模一样。让一个 change 只归一个作者，或者把它拆成两个 change（这也是[定好尺寸](writing-specs.md#right-size-the-change)的另一个理由）。
- **唯一会出现冲突的地方是 `specs/`。** 如果两个 change 都修改*同一条* requirement，归档第二个时会在 `openspec/specs/…/spec.md` 里冲突 —— 像处理任何 merge conflict 一样解决它，保留那条反映现实的 requirement。这很少见，而且它是一个特性：这是 git 在告诉你，两个 change 对系统该如何行为意见不一致。

### 14.7 当规划超出一个仓库（When planning outgrows one repo）

以上一切都假设计划住在代码仓库自己的 `openspec/` 文件夹里，这是正确的默认。当你的规划真的横跨多个仓库或团队时 —— 一个功能碰到三个服务，或者需求由一个团队拥有、由其他团队消费 —— 这就是 beta 的 **stores** 功能的用武之地：规划获得它自己的仓库，任何一个代码仓库都可以指向它。先读 [Stores 用户指南](stores-beta/user-guide.md)。

### 14.8 接下来去哪（Where to go next）

- [评审一个 change](reviewing-changes.md) —— 那一遍评审，现在在你的 PR 里面。
- [写好 spec](writing-specs.md) —— 包括如何给一个 change 定好尺寸，让它装得进一个分支。
- [Stores 用户指南](stores-beta/user-guide.md) —— 跨仓库和跨团队的规划。
