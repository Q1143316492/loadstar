## 37 retro

> 译自 `reference/mattpocock-skills/skills/engineering/retro/SKILL.md`（原文 44 行）。frontmatter 按原样保留。

**frontmatter**

- `name`: `retro`
- `description`: `"Conduct a retrospective on a coding session."`（对一次编码会话做复盘。）
- `disable-model-invocation`: `true`

用户要求做一次**复盘（retrospective）**。你要建议的是对编码 agent 的**环境**做哪些改进，以改善未来的运行。

### 37.1 步骤（Steps）

1. 为了拿到写作风格指南，调用 Skill 工具并以 `writing-for-agents` 为参数。

2. 读用户指定的那次会话的**一手来源（primary sources）**。这可能意味着在本机的会话日志里检索。如果用户没有指定会话，默认用当前这个。

3. 在下面这些类别里找改进候选。

- **导航（Navigation）**：agent 找到正确文件有多容易？文件之间有没有隐藏依赖？加一条**导航指引（navigation pointer）**会不会更容易？_当_ 会话花了很长时间才找到某条信息时用。
- **自动化检查（Automated checks）**：有没有能抓住 agent 所犯错误的自动化检查？lint、类型、测试、文件系统 linter？先读仓库自己的检查命令（它的 `package.json` / 构建工具的 `lint`/`check` 脚本、它的 CI workflow），这样「一个已存在但没接上、或悄悄坏掉的检查」本身就是发现，而不是被重新发明一遍。一个没有**护栏（guardrail）** 的仓库（既没有 pre-commit hook，也没有跑它的 lint/typecheck/test 命令的 CI job）本身就是一条发现：没有 lint 的仓库是一个长期被错过的机会，不是一个中性的默认状态。_当_ agent 犯了一个自动化检查本可抓住的错误，或这个仓库根本没有护栏时用。
- **编码标准（Coding standards）**：该不该给**评审 agent（reviewer agent）** 一条要执行的新规则？该不该删掉或澄清一条已有规则？先给这次违规分类：**机械性（mechanical）** 的违规（一条固定的语法模式、一个被禁的 API、一种 import 形状、一条文件位置规则）配一个确定性检查，没有例外：在仓库自己的 linter 里定制一条规则、加一个 pre-commit hook，或加一个 CI job，看仓库的语言和既有护栏哪个最便宜。默认去建那个检查，而不是写那条规则。把 `CODING_STANDARDS.md` 留给真正的**判断题（judgement calls）**（跨文件一致性、「与周围的风格相符」、任何护栏永远无法替代的东西）。_当_ 评审 agent 没能抓住一个错误时用。
- **全局 AGENTS.md**：有没有一些引导指令应该被挪去编码标准（或自动化检查），而不是留在原地？_当_ AGENTS.md 文件特别大时用——无论是在仓库里还是用户全局作用域。
- **工具经济（Tool economy）**：agent 有没有做过本可以精简的昂贵工具调用？有没有哪个自定义工具（CLI、MCP）在 token 上特别低效？_当_ agent 做了一次昂贵的工具调用时用。
- **空操作（No-ops）**：在引导文件里找那些不会改变 agent 行为的指令。_当_ 引导文件很大很难缠时用。
- **信息获取（Information access）**：找机会增加 agent 对信息的获取。把开发服务器日志分流（tee）出来、给第三方服务只读访问。_当_ 某条关键信息对 agent 不可得时用。

4. 按严重程度排序，把这些候选呈现给用户。

### 37.2 参考（Reference）

#### 37.2.1 实现与评审（Implementation vs Review）

记住所有工作都要经过两个阶段：实现与评审。实现 agent 承受的**上下文压力（context pressure）** 最大。它负责探索、写代码、调试失败。

评审 agent 的上下文压力最小——它收到的是一份 diff，不需要探索。它往往也不需要写代码或调试。

这意味着**编码标准应该由评审 agent 来施加，而不是实现 agent**。

#### 37.2.2 文件（Files）

你能用仓库里的几个文件：

- `CLAUDE.md`/`AGENTS.md`：这些文件会被推进这个仓库里任何 agent 的上下文窗口。它们该被极其克制地使用，通常只用来放指向其他文件的**导航指引**。
- `CODING_STANDARDS.md`：这个文件在评审时读，不在实现时读。如果标准文件长过 1,000 行，就往文档目录加**导航指引**。
- Docs：把 docs 当作被其他文件指着的参考文件。写新的之前先找已有的。
- Skills：用技能来放文档（因为它们的 description 会进 agent 的上下文窗口），或者放用户调用的命令。遵循 `writing-for-agents` 技能里的建议。
