## 9 writing-specs —— 写好 spec

> 译自 `reference/openspec/docs/writing-specs.md`（原文 103 行，全文翻译）。按 `READING-openspec.md` 第 09 项。代码块与 ASCII 图按原样保留。

你很少从一张白纸开始写 spec。你用平实的语言描述一个 change，`/opsx:propose` 起草出 requirement 与 scenario，然后你把它们打磨好。这一页讲的就是最后这部分 —— 「好」是什么样，以及如何把 AI 引向它。

它是 [评审一个 change（Reviewing a Change）](reviewing-changes.md) 的姊妹篇：评审是在草稿里抓薄弱点，写作是知道一份强草稿由什么构成。

### 9.1 spec 是行为，不是代码（A spec is behavior, not code）

spec 用任何人都能核查的说法说明你的系统*做什么* —— 而不是它怎么被构建。它由 **requirement**（对行为的陈述）和 **scenario**（证明这些行为的具体例子）构成。

```markdown
### Requirement: Session Timeout
The system SHALL expire a session after 30 minutes of inactivity.

#### Scenario: Idle timeout
- GIVEN an authenticated session
- WHEN 30 minutes pass with no activity
- THEN the session is invalidated and the user must re-authenticate
```

把*怎么做* —— 队列、库、表结构 —— 留在 `design.md` 或代码里。当行为与实现被混进同一条 requirement 时，这条 requirement 就不再可测试，并且从代码改变的那一刻起就开始过时。

### 9.2 什么算好的 requirement（What makes a good requirement）

一条好的 requirement 是一个行为，表述得足够平实，你可以直接交给别人去测。

- **一条陈述，一个 `SHALL`/`MUST`。** 如果一条 requirement 带着三个「而且还」的分句，它实际上是三条 requirement。把它们拆开。
- **可观测。** 代码之外的人应当能判断它是否成立。「The system SHALL show an error banner when the upload exceeds 10 MB」是可观测的。「The system SHALL handle large uploads gracefully」则不是。
- **恰当的力量。** OpenSpec 使用 RFC 2119 关键词，它们的含义各不相同：

  | 关键词 | 含义 |
  |---------|---------|
  | `MUST` / `SHALL` | 硬性要求。没有商量余地。 |
  | `SHOULD` | 强烈推荐，但留有给出正当理由的例外空间。 |
  | `MAY` | 真正可选的。 |

  默认用 `MUST`/`SHALL`。只有当你真的想说「除非有充分理由不这么做」时才用 `SHOULD`。

对一条 requirement 的检验：*一个从没见过这份代码的测试者，能判断它通过了吗？* 如果不能，它就需要打磨。

### 9.3 什么算好的 scenario（What makes a good scenario）

scenario 是 requirement 证明自己价值的地方。每一条都是一个具体的 GIVEN / WHEN / THEN，可以变成一个自动化测试。

- **它真正演练自己的 requirement。** 只是换个说法复述 requirement 的 scenario 什么也没测。把它写成一个具体情境加一个具体结果。
- **覆盖要紧的情况，而不只是顺利路径。** 合法登录很容易写。空输入、过期 token、第二次点击、出错的那件事 —— bug 就住在这些地方，也正是一条 scenario 最值钱的地方。
- **在标题里点名这个情况。**「Scenario: Rejects an expired token」让评审者一眼看到覆盖了什么；「Scenario: Test 2」则不能。

一个有用的习惯：在批准之前，问自己*哪一个情况被弄坏我会不高兴？* —— 然后确认有一条 scenario 点了它的名。

### 9.4 选对 delta 类型（Pick the right kind of delta）

一个 change 用三种分段类型描述它对 spec 的编辑。用对类型才能让你归档后的 spec 保持诚实：

- **`## ADDED Requirements`** —— 以前不存在的全新行为。
- **`## MODIFIED Requirements`** —— 已经存在并且正在变化的行为。把完整的新版本写进去；一句说明改了什么的话对评审者有帮助。
- **`## REMOVED Requirements`** —— 正在消失的行为，附一句说明为什么。

归档时，ADDED 被追加到主 spec，MODIFIED 替换旧版本，REMOVED 从中删除。把一个 capability 的最后一条 requirement 移除，你就退役了它：与其留下一个空无一物的 spec，archive 会删除 `openspec/specs/<capability>/spec.md`。因为这是唯一一个会删除文件的归档步骤，它必须被明确要求 —— 在这个 change 的 `.openspec.yaml` 里加上 `retire_capabilities: true`，与那个文件本来就需要的 `schema:` 并列。没有它，归档会中止并告诉你原因。退役会删掉整个文件，所以当 spec 里除了标题、`## Purpose` 和它的 requirement 块之外还装着任何东西时，它同样会被拒绝 —— 一个 `## Notes` 分段、requirement 下面的一条注释。中止信息会点名那些行；把它们移进 `## Purpose` 或某条 requirement，或者手工删除这个 spec。对于调用者 checkout 里的 spec，归档输出还会给出能恢复已提交文件的 `git checkout`；被选中的 store 则收到 checkout 作用域内的恢复指引。如果你把一个真实的改动标成 ADDED，你最后会得到两条互相竞争的 requirement；如果你把新行为描述成 MODIFIED，就没有东西可供替换。拿不准时，打开当前的 spec 看看那条 requirement 是不是已经在里面了。

还有一类分段值得了解。当你的 delta 创建了一个尚不存在的 capability 时，用 `## Purpose` 开头 —— 一两句话说明这个 capability 是干什么的。归档会把它用作它所创建的主 spec 的 Purpose；跳过它，你会得到一个需要手工填写的 `TBD` 占位符。既有 spec 已经有 Purpose，所以 delta 里的那个在那里会被忽略 —— 要改就直接编辑 `openspec/specs/<capability-path>/spec.md`。这里，`<capability-path>` 是相对于 `specs/` 的目录，比如扁平项目里的 `user-auth`，或者按领域组织的项目里的 `identity/user-auth`。

### 9.5 给 change 定合适的大小（Right-size the change）

最常见的写作错误不是一条措辞糟糕的 requirement —— 而是一个想当三个用的 change。

**一个好的 change 只有一个能用一个句子说出的意图。**「加一个深色模式开关。」「给登录端点做限流。」「把 session 从 cookie 上迁走。」如果描述这个 change 需要很多「而且还」，那就是该拆分的信号。

change 太大的迹象：

- proposal 的范围读起来像一串互不相关的功能。
- 评审它要花一下午，所以没人会去评审。
- 两个人没法在不撞车的情况下同时做它。
- 一半的 task 可以自己独立发布。

更小的 change 更容易评审，更容易在一次专注的会话里做完，也更容易在六个月后只剩归档时被人想明白。你随时可以并行跑多个 change —— 见 [编辑与迭代（Editing & iterating）](editing-changes.md) 和 [工作流（Workflows）](workflows.md)。

反过来也会发生：一行错别字的修复不需要三条 requirement 加一份 design 文档。让仪式感与风险相称。

### 9.6 如何把 AI 引向一份好草稿（How to steer the AI toward a good draft）

因为 `/opsx:propose` 负责第一稿，你拿回来的东西的质量跟你给它的东西的质量同轨。你不必手写 requirement —— 你要做的是把 AI 瞄准好：

- **说清意图和边界。** *「加一个深色模式开关，首次加载时跟随操作系统设置 —— 不要碰现有的 theme API。」* 范围之外的那一半，和范围之内的一半同样重要。
- **点名你在意的情况。** *「确保有一条 scenario 覆盖已经手动选过主题的用户。」* AI 只覆盖你指到的部分。
- **然后动手编辑。** 它就是普通的 Markdown。收紧一个含糊的 `SHALL`，删掉一条什么都没测的 scenario，补上它漏掉的情况 —— 或者让 AI 来做：*「超时那条 requirement 太含糊，把它钉死在 30 分钟。」*

起草、打磨、重复。这样几轮之后就会产出一份你会信任的 spec，而这正是全部意义所在。

### 9.7 一份快速清单（A quick checklist）

- [ ] 每条 requirement 都是一个可观测的行为，带一个 `SHALL`/`MUST`。
- [ ] 没有把实现细节烤进 requirement 里。
- [ ] 每条 requirement 都至少有一条真正演练它的 scenario。
- [ ] 重要的边界情况和错误情况都有 scenario，而不只是顺利路径。
- [ ] delta 相对当前 spec 正确使用了 ADDED / MODIFIED / REMOVED。
- [ ] 整个 change 只有一个你能用一个句子说出的意图。

### 9.8 接下来去哪（Where to go next）

- [评审一个 change（Reviewing a Change）](reviewing-changes.md) — 两分钟的通读，抓住溜过去的东西。
- [概念（Concepts）](concepts.md) — spec、change 与 delta 背后更深的模型。
- [示例与配方（Examples & Recipes）](examples.md) — 从开始到结束的真实 change。
