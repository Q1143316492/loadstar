## 10 reviewing-changes —— 评审一个 change

> 译自 `reference/openspec/docs/reviewing-changes.md`（原文 143 行，全文翻译）。按 `READING-openspec.md` 第 10 项。代码块与 ASCII 图按原样保留。

### 10.1 开篇

OpenSpec 的全部承诺是：你和你的 AI **在任何代码写下之前，就先就「建什么」达成一致。** 而这份一致只有在你真的读了 AI 起草的东西之后才有意义。这一页讲的就是你用来做这件事的那两分钟 —— 打开什么、按什么顺序、找什么。

这个赌注很简单：在一段话的计划里抓到一个走错的方向，几乎不花成本。在 300 行代码里抓到同一个走错的方向，就不是了。评审就是你兑现这个赌注的地方。

### 10.2 你评审的两个时刻（The two moments you review）

正好有两个：

```
/opsx:propose ──► REVIEW THE PLAN ──► /opsx:apply ──► REVIEW THE CODE ──► /opsx:archive
                  (before any code)                    (/opsx:verify)
```

1. **在 `/opsx:propose`（或 `/opsx:ff`）之后**，在 `/opsx:apply` 之前 —— 趁计划还只是文字的时候读它。
2. **在构建之后**，用 `/opsx:verify` —— 检查代码是否真的做了计划所说的事。

第一次评审是最能替你省事的，也正是人们会跳过的那一次。这一页的大部分篇幅都花在那里。

### 10.3 按这个顺序读（Read it in this order）

一个 change 就是 `openspec/changes/<name>/` 下装着纯 Markdown 的一个文件夹。按这个顺序读这些文件 —— 一旦发现哪里不对，它能让你最早退出：

```
openspec/changes/add-dark-mode/
├── proposal.md      1. the intent and scope   ← if this is wrong, stop here
├── specs/…/spec.md  2. the requirements       ← the heart of the review
├── design.md        (only for bigger changes) — the technical approach
└── tasks.md         3. the plan of work
```

你不需要读每一行。你需要回答三个问题，每个文件一个。

### 10.4 proposal：这是对的问题吗？（The proposal: is this the right problem?）

先打开 `proposal.md`。它捕捉「为什么」和「是什么」—— 意图、范围，以及用一两段话说清的方法。

**好的样子长什么样：** 一个清楚的意图，一个你认得出的范围，以及一个「为什么现在值得做这件事」的理由。

**危险信号：**

- 它解决的，和你要求解决的那个问题略有*不同*。
- 范围长大了 —— 你要的是一个主题切换开关，而 proposal 还顺手碰了 auth，「既然我们都在这里了」。
- 它很含糊。「改进设置页」不是范围；「加一个尊重操作系统偏好的深色模式开关」才是。

**要回答的问题：** *这和我实际要求的东西一致吗，有没有什么东西偷偷溜进来？* 如果答案是否，就停下 —— 别再往下读，先修好 proposal（见 [反驳](#107-反驳很便宜)）。

### 10.5 spec delta：「完成」定义对了吗？（The spec deltas: is "done" defined correctly?）

这是评审的核心。`specs/` 下的 delta spec 说明当这个 change 交付时什么会变成*事实* —— 以 requirement 的形式，以及证明它们的 scenario：

```markdown
## ADDED Requirements

### Requirement: Dark Mode Toggle
The system SHALL let a user switch between light and dark themes.

#### Scenario: Respects the OS preference on first load
- GIVEN a user who has never set a theme
- WHEN they open the app on a device set to dark mode
- THEN the app renders in dark mode
```

**一条好 requirement 长什么样：** 一句清楚的 `SHALL`/`MUST` 陈述，你能把它交给测试者，并且至少有一个 scenario，其 GIVEN/WHEN/THEN 真的演练了那句陈述。

**危险信号：**

- **一条含糊的 requirement。**「系统 SHALL 很快」既不能构建也不能测试。多快算快？
- **一条没有 scenario 的 requirement**，或者一个并没有测试它所归属的那条 requirement 的 scenario。
- **所有捕获里最有价值的那个：漏掉的东西。** AI 忠实地写下了你*说过的*。你的活儿是注意到你*忘了说*的。如果你最在意的是操作系统偏好的那种情况，而没有任何 scenario 提到它，那这次评审就值回了它自己的成本。

读 delta 时要问：*如果系统做的正好 —— 且仅仅 —— 是这件事，我会满意吗？* 这里还没有涉及代码，所以改动依然很便宜。

### 10.6 tasks：工作计划合理吗？（The tasks: is the plan of work sane?）

最后打开 `tasks.md`。它是 AI 会逐项走完的实现清单。

**好的样子长什么样：** 有序的步骤，每一步都能追溯到一条 requirement，没有任何神秘的东西。

**危险信号：**

- 一个没有对应 requirement 的 task（它是从哪来的？）。
- 一个巨大的「实现这个功能」task，把所有真正的决定都藏了起来。
- 一个碰了你刚刚批准的范围之外的东西的 task。

你在这里不是在做估算或微观管理 —— 你在检查这份计划和那些你已经接受的 requirement 是否对得上。

### 10.7 反驳很便宜（Pushing back is cheap）

如果三个问题里有任何一个的答案不对，就说出来。这里没有阶段，没有任何东西被锁住 —— 你修好它，然后继续。两种方式，和 [编辑一个 change](editing-changes.md) 里一模一样：

- **自己编辑文件。** 它就是纯 Markdown；改掉那行范围，把一条 requirement 收紧，删掉一个 task。
- **告诉 AI 哪里不对**，让它修订：*「把 auth 那些改动去掉 —— 超出范围了，」*、*「加一个用户已经选过主题时的 scenario，」*、*「把 task 3 拆成 schema 和 UI。」*

然后重读你改过的那部分。反复起草，直到它成为一份你愿意签上自己名字的计划。这种来回*就是*产品在工作。

### 10.8 代码之后：验证（After the code: verify）

一旦活儿建好了，`/opsx:verify` 就是你的第二次评审。它会重读 artifact 和代码，并在三个维度上报告对不上的地方：

| 维度 | 它检查什么 |
|-----------|----------------|
| **Completeness** | 每个 task 都完成了，每条 requirement 都实现了，scenario 都被覆盖了 |
| **Correctness** | 实现和 spec 的意图一致，边界情况被处理了 |
| **Coherence** | 设计决策真的出现在代码里 |

```text
You: /opsx:verify

AI:  Verifying add-dark-mode...

     COMPLETENESS
     ✓ All 8 tasks in tasks.md are checked
     ✓ All requirements in specs have corresponding code
     ⚠ Scenario "Respects the OS preference on first load" has no test coverage
```

它把问题标为 CRITICAL、WARNING 或 SUGGESTION，并且**不**阻止归档 —— 它把缺口摆出来，把决定权留给你。这就是「AI 写代码了吗」和「它建的是我们商定的东西吗」之间的区别。

`/opsx:verify` 属于 expanded profile。如果你没有它，用 `openspec config profile` 打开它（然后 `openspec update`），或者干脆自己重读这个 change 和 diff。

### 10.9 把评审调到合适的大小（Right-size the review）

不是每个 change 都配得上完整走一遍。一个改错别字的单文件修复值得二十秒扫一眼。一个碰了 auth、支付、或者你无法恢复的数据的 change，值得把上面每个问题都问一遍。重点从来不是仪式 —— 而是把你的注意力花在出错会很贵的地方，在不会贵的地方扫一眼就过。

### 10.10 两分钟清单（The two-minute checklist）

- [ ] proposal 的意图和我要求的一致。
- [ ] 没有任何多余的东西溜进范围。
- [ ] 每条 requirement 都具体到足以测试。
- [ ] 每条 requirement 都有一个真的演练了它的 scenario。
- [ ] 我最在意的那种情况被覆盖了。
- [ ] task 和 requirement 对得上；没有任何东西是神秘的或超出范围的。
- [ ] 如果 AI 正好建了这个、别的什么都不建，我会觉得踏实。

如果七条全过，放心地跑 `/opsx:apply`。如果有任何一条没过，那不是挫折 —— 那是这两分钟在干它的活。

### 10.11 下一步去哪（Where to go next）

- [写好 spec（Writing Good Specs）](writing-specs.md) —— 反面：怎么起草值得批准的 requirement 和 scenario。
- [编辑与迭代一个 change（Editing & Iterating on a Change）](editing-changes.md) —— 在你已经开始之后改动一个计划的机制。
- [工作流（Workflows）](workflows.md) —— 评审在更大循环里处在什么位置。
