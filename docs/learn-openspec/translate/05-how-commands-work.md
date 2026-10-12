## 5 how-commands-work —— 命令如何工作

> 译自 `reference/openspec/docs/how-commands-work.md`（原文 173 行）。按 `READING-openspec.md` 第 05 项，只译前半的设计部分：开篇 / `The two halves` / `"How do I start interactive mode?"` / `Why this split exists` / `How the commands got there` / `Which commands do I even have?`。`Slash command syntax by tool` 那张 per-tool 语法表、`Confirming it's installed`、`A clean first run`、`Related` 均略去不译。

### 5.1 唯一要知道的一件事

**OpenSpec 有两类命令，它们跑在两个不同的地方。**

- `openspec ...` 命令跑在你的**终端**里。（例如 `openspec init`。）
- `/opsx:...` 命令跑在你 **AI 助手的聊天**里。（例如 `/opsx:propose`。）

如果你曾经把 `/opsx:propose` 输进终端然后什么都没发生，这一页就是原因。你在跟 OpenSpec 的另一半说话。slash command 不是终端命令。它们是你给 AI 编码助手的指令，输在同一个聊天框里 —— 就是你平时打「add a login form」的那个地方。

这一个区分是新用户最常见的绊脚石，所以我们把它讲得清清楚楚。

### 5.2 两半（The two halves）

OpenSpec 是同一个项目戴着两顶帽子。

**CLI（终端那一半）。** 一个叫 `openspec` 的程序，你安装它并从 shell 运行。它配置你的项目、列出和校验 change、显示一个 dashboard、归档完成的工作。你在 iTerm、VS Code 终端、PowerShell 里输入这些 —— 任何你跑 `git` 或 `npm` 的地方。

```bash
openspec init        # set up OpenSpec in this project
openspec list        # see active changes
openspec view        # open the interactive dashboard
```

**slash command（聊天那一半）。** 像 `/opsx:propose` 和 `/opsx:apply` 这样的短命令，你输进你的 AI 助手。它们告诉 AI 遵循 OpenSpec 工作流：起草 proposal、写 specs、从任务清单构建、完成后归档。你把它们输进 Claude Code、Cursor、Devin Desktop、Copilot，或者你用的任何助手。

```text
/opsx:propose add-dark-mode    (typed in your AI chat)
/opsx:apply                    (typed in your AI chat)
/opsx:archive                  (typed in your AI chat)
```

一图说清心智模型：

```text
        YOUR TERMINAL                         YOUR AI ASSISTANT'S CHAT
   ┌──────────────────────┐               ┌──────────────────────────────┐
   │  $ openspec init     │   installs    │  /opsx:propose add-dark-mode  │
   │  $ openspec list     │  ──────────►  │  /opsx:apply                  │
   │  $ openspec view     │   commands    │  /opsx:archive                │
   └──────────────────────┘    & skills   └──────────────────────────────┘
        run openspec here                       run /opsx:* here
```

注意那个箭头。在终端里跑 `openspec init`，正是把 slash command *安装*进你的 AI 工具的动作。终端那一半配置了聊天那一半。之后，日常的驾驶大多发生在聊天里。

### 5.3 「我怎么进入 interactive mode？」（"How do I start interactive mode?"）

**没有单独的 interactive mode 需要启动。** 这个问题被问得很多，所以它值得一个直白的答案。

你不是进入某个特殊的 OpenSpec 模式。你就照常打开你的 AI 编码助手，往聊天里输一条 slash command。slash command **就是**你「进入」OpenSpec 的方式。你的助手识别它，加载对应的 OpenSpec 技能，然后开始遵循工作流。

所以真正的操作说明是：

1. 在你的项目里打开你的 AI 编码助手（Claude Code、Cursor、Devin Desktop 等等）。
2. 在它的聊天里输入 `/opsx:propose`，和你输入任何其它请求的地方一样。
3. 留意自动补全：如果 OpenSpec 装好了，你打斜杠时会看到 `/opsx:propose`、`/opsx:apply` 之类的出现。

就这样。没有模式要切，没有守护进程要拉起，没有单独的窗口。

有一件事**确实**是交互式的，它住在终端里：`openspec view`。它打开一个 dashboard，用来浏览你的 specs 和 changes。但那是个查看器，不是用来 propose 和 build 的东西。构建发生在聊天里的 slash command 里。

### 5.4 为什么存在这个分界（Why this split exists）

值得理解，因为它解释了为什么 OpenSpec 能和 30 多种不同的 AI 工具一起工作。

CLI 是**引擎**。它知道规则：一个 change 目录长什么样、哪些 artifact 依赖哪些、如何把一个 delta spec 合并进你的真相。它在哪儿都一样。

slash command 是**方向盘**，而每个 AI 工具的方向盘都略有不同。Claude Code 管它们叫 commands。Cursor 和 Devin Desktop 有自己的格式。有些工具管它们叫 skills。当你运行 `openspec init` 时，OpenSpec 为你选中的每个工具生成正确类型的文件，所以同一个 `/opsx:propose` 的意图在哪个助手里都管用。

这个设计的强项：你学一次工作流，就能跨工具带着走。代价：命令的确切语法在不同工具间可能略有差异，这就是下一节的内容。

### 5.5 命令是怎么到那里的：skills 与 commands（How the commands got there: skills and commands）

当你运行 `openspec init`（或 `openspec update`）时，OpenSpec 往你的项目里写一些小文件，让你的 AI 工具能找到这个工作流。取决于你的工具和设置，它们是 **skills**、**commands**，或两者都有。

- **Skills** 住在 `.claude/skills/openspec-*/SKILL.md` 这样的地方。它们是正在形成的跨工具标准：一个装着指令的目录，你的助手会自动发现它。
- **Commands** 住在 `.cursor/commands/opsx-<id>.md` 或 `.claude/commands/opsx/<id>.md` 这样的地方 —— 布局由工具决定，而工具决定你怎么输这条命令。它们是更老的、按工具区分的 slash command 文件。Codex 不会拿到生成的命令文件；用 `.agents/skills/openspec-*`。

你不必在意你的工具用的是哪一种。你只管输 slash command，它就能用。但知道这些文件存在，在出问题时会有帮助：如果你的命令消失了，通常意味着这些文件缺失或过期了，而 `openspec update` 会重新生成它们。

### 5.6 我到底有哪些命令？（Which commands do I even have?）

默认情况下，OpenSpec 安装的是**核心** slash command 集：

- `/opsx:explore`：在承诺一个 change 之前，先和 AI 一起把想法想透（拿不准时绝佳的第一步）
- `/opsx:propose`：创建一个 change 并一步起草它所有的规划 artifact
- `/opsx:apply`：通过逐项完成它的任务清单来构建这个 change
- `/opsx:update`：修订一个 change 的规划 artifact 并保持它们相互一致
- `/opsx:sync`：把一个 change 的 spec 更新合并进你的主 spec（通常是自动的）
- `/opsx:archive`：完成一个 change 并把它归档

一个不错的默认节奏：拿不准要做什么时用 `explore`，然后是 `propose`、`apply`、`archive`。[Explore First](explore.md) 指南解释了为什么这个开头的一步很值。

还有一个**扩展**集，给想要更细控制的人（`/opsx:new`、`/opsx:continue`、`/opsx:ff`、`/opsx:verify`、`/opsx:bulk-archive`、`/opsx:onboard`）。用 `openspec config profile` 打开它，然后用 `openspec update` 应用。

对这一切都是新手？`/opsx:onboard`（在扩展集里）会带你自己的代码库上走完一个完整的 change，并逐步讲解。它是最友好的入门方式。
