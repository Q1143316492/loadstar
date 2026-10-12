## 3 docs/README —— OpenSpec 文档首页

> 译自 `reference/openspec/docs/README.md`（原文 115 行，全文翻译）。按 `READING-openspec.md` 第 03 项。相对链接与代码块按原样保留。

### 3.1 开篇

欢迎。这里是 OpenSpec 一切文档的家。

OpenSpec 帮你和你的 AI 编码助手**在写任何代码之前就先就把要建什么达成一致**。你描述这个变更，AI 起草一份简短的 spec 和一份任务清单，你们一起看同一份计划，然后工作才开始。不再有做到一半才发现 AI 建错了东西。

如果你别的都不读，只读这两页：

1. [Getting Started](getting-started.md)：安装、初始化，并交付你的第一个 change。
2. [How Commands Work](how-commands-work.md)：你究竟在哪里输入 `/opsx:propose`（提示：在 AI 聊天里，不是终端里）。这一点几乎人人都被绊过一次。

第二页比看起来更重要。OpenSpec 有两半：一个在终端里跑的 CLI 工具，和一组交给你 AI 助手的 slash command。分清楚哪个是哪个，能省掉最常见的那次困惑。

> **最该先养成的习惯：拿不准要建什么时，从 `/opsx:explore` 开始。** 它是个无风险的思考伙伴，会读你的代码、权衡选项，并在任何代码被写出来之前把一个模糊想法磨成一个具体计划。[Explore First](explore.md) 指南把理由讲透了。

### 3.2 选你的路径（Pick your path）

**我完全是新手。** 从 [Getting Started](getting-started.md) 开始，然后扫一眼 [Core Concepts at a Glance](overview.md)。碰到什么觉得神秘的地方，[FAQ](faq.md) 和 [Glossary](glossary.md) 就在手边。

**我有问题但没有方案。** 这是最常见的情况，它有专门的答案：[Explore First](explore.md)。用 `/opsx:explore` 在承诺任何事之前先和 AI 一起想清楚。

**我有一个很大的既有代码库。** 你不需要把它全部文档化。[Using OpenSpec in an Existing Project](existing-projects.md) 展示了怎么在真实的存量代码上起步，而不用把整片海煮沸。

**我只想让它跑起来。** [安装](installation.md)，跑 `openspec init`，然后读 [How Commands Work](how-commands-work.md)，让你的第一条 slash command 落在正确的地方。或者用 [AI 辅助安装提示词](installation.md#install-with-your-ai-assistant)把配置直接交给你的助手。

**我靠例子学。** [Examples & Recipes](examples.md) 从头到尾走完几个真实变更：一个小功能、一个 bug 修复、一次重构、一次探索。

**AI 刚起草了一份计划 —— 然后呢？** 读它。[Reviewing a Change](reviewing-changes.md) 展示了那两分钟的检查，能在代价还小的时候抓住走错的方向；[Writing Good Specs](writing-specs.md) 讲一份值得批准的计划由什么构成。

**我在团队里工作。** [OpenSpec on a Team](team-workflow.md) 展示一个 change 如何映射到一条分支和一个 pull request，以及队友如何在代码之前先评审计划。

**我从旧工作流过来。** [迁移指南](migration-guide.md) 解释改了什么、为什么改，并保证你已有的工作安然无恙。

**我想把它掰弯成我们团队自己的流程。** [Customization](customization.md) 覆盖项目配置、自定义 schema 和共享上下文。

**有什么东西坏了。** [Troubleshooting](troubleshooting.md) 收集了人们真正会撞上的失败，以及修法。

### 3.3 完整地图（The whole map）

#### 从这里开始

| 文档 | 它给你什么 |
|-----|-------------------|
| [Getting Started](getting-started.md) | 安装、初始化，端到端跑完你的第一个 change |
| [Explore First](explore.md) | 用 `/opsx:explore` 在承诺之前把想法想清楚 |
| [How Commands Work](how-commands-work.md) | slash command 在哪里跑、「interactive mode」是什么意思、终端 vs 聊天 |
| [Core Concepts at a Glance](overview.md) | 一页装下整个心智模型：specs、changes、deltas、archive |
| [安装](installation.md) | npm、pnpm、yarn、bun、Nix，一个把配置交给 AI 助手的提示词，以及如何验证它成功了 |

#### 日常使用

| 文档 | 它给你什么 |
|-----|-------------------|
| [Workflows](workflows.md) | 常见模式，以及什么时候该用哪条命令 |
| [Examples & Recipes](examples.md) | 真实变更的完整走查，可直接复制粘贴 |
| [Writing Good Specs](writing-specs.md) | 一条强壮的 requirement 和 scenario 长什么样，以及如何给一个 change 定合适的大小 |
| [Reviewing a Change](reviewing-changes.md) | 在写任何代码之前，对起草好的计划做两分钟检查 |
| [OpenSpec on a Team](team-workflow.md) | change 如何嵌进分支、pull request 和评审 |
| [Using OpenSpec in an Existing Project](existing-projects.md) | 在大型存量代码库上采用 OpenSpec |
| [Editing & Iterating on a Change](editing-changes.md) | 更新 artifact、回退、对账手工修改 |
| [Commands](commands.md) | 每条 `/opsx:*` slash command 的参考 |
| [CLI](cli.md) | 每条 `openspec` 终端命令的参考 |

#### 深入理解

| 文档 | 它给你什么 |
|-----|-------------------|
| [Concepts](concepts.md) | specs、changes、artifacts、schemas 和 archive 的长篇解释 |
| [OPSX Workflow](opsx.md) | 为什么这个工作流是流体的而不是阶段锁定的，外加一份架构深挖 |
| [Glossary](glossary.md) | 每个术语都在一处定义 |

#### 让它成为你的

| 文档 | 它给你什么 |
|-----|-------------------|
| [Customization](customization.md) | 项目配置、自定义 schema、共享上下文 |
| [Multi-Language](multi-language.md) | 用英语之外的语言生成 artifact |
| [Supported Tools](supported-tools.md) | OpenSpec 集成的 30 多种 AI 工具，以及文件落在哪里 |
| [Community Showcase](community.md) | 用 OpenSpec 构建、以及为 OpenSpec 构建的项目与资源 |

#### 需要帮助时

| 文档 | 它给你什么 |
|-----|-------------------|
| [FAQ](faq.md) | 人们问得最多的问题的快速回答 |
| [Troubleshooting](troubleshooting.md) | 针对具体失败的具体修法 |
| [Migration Guide](migration-guide.md) | 从 legacy 工作流迁到 OPSX |

#### 跨仓协作（beta）

| 文档 | 它给你什么 |
|-----|-------------------|
| [Stores: User Guide](stores-beta/user-guide.md) | 当工作跨仓或跨团队时，让规划拥有自己的仓库 |
| [Agent Contract](agent-contract.md) | agent 驱动的那些机器可读 CLI 接口 |

### 3.4 三十秒版（The thirty-second version）

```text
1. Install        npm install -g @fission-ai/openspec@latest
2. Initialize     cd your-project && openspec init
3. Explore        (in your AI chat)  /opsx:explore           ← optional, but a great habit
4. Propose        (in your AI chat)  /opsx:propose add-dark-mode
5. Build          (in your AI chat)  /opsx:apply
6. Archive        (in your AI chat)  /opsx:archive
```

第 1、2 步发生在你的终端里。其余发生在你 AI 助手的聊天里。这个分界是唯一值得背下来的东西，[How Commands Work](how-commands-work.md) 精确解释了原因。第 3 步是可选的，但拿不准时从 `/opsx:explore` 开始，是最值得养成的习惯。

### 3.5 还能去哪求助（Where else to get help）

- **Discord：** [discord.gg/YctCnvvshC](https://discord.gg/YctCnvvshC)，用于提问、想法和求助。
- **GitHub Issues：** [github.com/Fission-AI/OpenSpec/issues](https://github.com/Fission-AI/OpenSpec/issues)，用于 bug 和功能请求。
- **`openspec feedback "your message"`** 从终端直接发反馈（它会打开一个 GitHub issue）。

发现这些文档里有错的、过时的或让人困惑的地方？那是个 bug。开一个 issue 或 PR。文档改进是你能做出的最有价值的贡献之一。
