## 46 docs-lab/README —— 下一代文档结构设计稿

> 译自 `reference/openspec/docs-lab/README.md`（原文 294 行）。按 `READING-openspec.md` 第 46 项。
> 标题、表格结构、页面清单、路径、文件名与所有行内代码原样保留；只译正文与目标的描述。

### 46.1 状态与这份 README 负责什么（Status and what this README owns）

**状态：正文在逐页落地；其余都是骨架**（真实的标题，外加一行被站点提取为页面描述的 `>` 职责声明）。线上站点从这棵树构建：`website/docs.sync.config.mjs` 把这些文件映射到已发布的页面，旧的 `docs/` 树不再被站点使用。

这份 README 负责结构：有哪些页面，以及哪个页面教什么。反向视图 —— 从一个职责或一条消息指向拥有它的页面 —— 是 [message-map.md](message-map.md)。如何写这些页面（风格、语气、格式）是 `write-openspec-docs` 技能的 [writing.md](../.agents/skills/write-openspec-docs/writing.md)。

### 46.2 每一页的标准（The bar for every page）

docs-lab 里的每一页都是手写的，从零开始。旧的 `docs/` 树是事实的素材来源，绝不是可以搬过来的文本。

我们追求的是读者能 get 到要点：每一页都读得通，对任何人 —— 无论其技能水平如何 —— 都讲得通，而最重要的是它简单。我们能交付的最糟的东西，是理解起来认知成本高昂的文档；这种成本来自复杂的词、讲不通的比喻、没有解释的随意术语，以及妨碍阅读的排版。每一句话都有其目的，并且读起来、理解起来都轻松。如果一句话过不了这个检验，就重写它或者删掉它。

### 46.3 结构规则（Structure rules）

**文件夹就是领域。** 每一页都住在它所属领域的文件夹里（`start/`、`guides/`、`customize/`、`multi-repo/`、`reference/`、`help/`）；根目录只放这份 README、`message-map.md` 和 `sources.md`。大多数文件夹作为一个侧边栏组发布；`guides/` 作为 Guides 组发布，下辖三个可折叠子组（Understanding OpenSpec、Using OpenSpec、Adopting OpenSpec），默认全部展开（在页面起草完成之前先从站点隐藏：整个小节在 `website/docs.sync.config.mjs` 里被注释掉，指向某篇指南的链接在它被重新列入之前回退到 GitHub 上的源文件）。Reference 下辖三个嵌套文件夹（`reference/architecture/`、`reference/schemas/` 和 `reference/configuration/`），各自作为一个可折叠组发布，以 `index.md` 作为它的落地页；spec-driven schema 作为单独一页（`reference/schemas/spec-driven/index.md`）发布在 Schemas 组内。标签与 URL 来自 `website/docs.sync.config.mjs`，所以移动一个文件永远不会移动一个 URL。

**只教一次。** 循环（propose、review、apply、archive）只有一个教学者；其他每一页都只做链接，绝不重讲：

- `start/quickstart.md` 把它当作 UX 来教：一个人如何让一个 change 走完生命周期，包括 archive 在磁盘上做了什么。
- `start/overview.md` 把它当作推销来展示：只有文案，没有解释。
- `guides/concepts.md` 不参与其中：这一页解释各种 artifact（specs、changes、delta），并把循环交给 quickstart 链接。磁盘路径以内联方式出现在拥有它的概念旁边，绝不作为一个版面小节。
- `start/installation.md` 负责安装；`start/setup.md` 负责 init 以及它写了什么。quickstart 以一行前置条件开头，同时链接这两者，并从 explore 开始。

**Guides vs reference。** `reference/skills.md` 承载每个技能的契约：参数、它创建什么，以及它用什么来回应。指南页面（Using 和 Adopting 两个子组）负责一个任务中人的判断，包括何时该伸手去用哪个技能，可以横跨多个技能，并且绝不重复技能机制。`reference/architecture/` 是 Reference「供查阅」这条标准唯一的例外：它属于解释性内容，趁它只有三页，就先把它安在这里作为一个务实的归宿。如果它长大（比如说，吸收了贡献者内部细节），考虑给它自己的文件夹和标签页。

**Reference 是查阅，也因此得名。** `reference/schemas/` 和 `reference/configuration/` 是契约：键、值、类型、默认值，以及位置，放在表格和代码块里。任何解释性的内容（schema 是什么、该往 config.yaml 里放什么）住在 Customize 或 Guides 里，并且只被链接，绝不重述。命名遵循三条规则。一个 reference 文件夹的落地页标题是「Overview」；文件夹标签已经命名了这个组，重复它会让侧边栏双重嵌套。一个记录单个文件的页面，标题里带上概念和文件名，概念在前，其中概念命名这个文件的用途，而不只是它的范围（「Project configuration (config.yaml)」、「CLI settings (config.json)」）：左边缘才是眼睛在侧边栏里用来消歧的东西，而文件名让标题与读者搜索的、在磁盘上看到的东西保持一致。一个文件名本身就是读者所用术语的页面，就只把文件名作为标题（`schema.yaml`），一个拥有某个产品术语的页面就以那个术语为标题（`spec-driven`），而一个覆盖多个文件的页面就只用概念（Stores），并在职责行里命名它的那些文件。

**FAQ 是一行式回答。** 每条 FAQ 条目都是一段简短回答，最多几行，或者是一个指向拥有该主题的页面的路由链接。How-to 内容从不住在 FAQ 里：当一个回答长大到超过一行，它就搬到一篇指南或参考页，而 FAQ 条目变成一个指针。

### 46.4 页面索引：每一页的职责（Page index: every page's job）

下面每一个目标都是页面 `>` 引用块的原样内容，所以这里的承诺就是读者看到的承诺。一个页面恰好交付它的目标：内容长大了超过它，意味着拆分这个页面，或者在两处同时重写目标，绝不让两者漂移。

#### 开始：从「这是什么？」到你的第一个已归档 change（Start: from "what is this?" to your first archived change）

| Page | Goal |
|---|---|
| [Overview](start/overview.md) | _TODO：2026-08-21 为从零重写而清空，并从站点撤下（在此期间 `/docs` 重定向到 Installation）；旧的目标行因推销力太弱而被丢弃。要点在 Notes.md。_ |
| [Installation](start/installation.md) | 在你的机器上安装 `openspec` CLI，更新它，并卸载它。 |
| [Set up your project](start/setup.md) | 把 OpenSpec 加到一个项目里：跑 init，看看它写了什么，并调整它。 |
| [Quickstart](start/quickstart.md) | 你在新项目或既有项目里的第一个 change，从想法到归档。 |

#### 指南：理解这套系统，把它用好，并把它带到你的代码库和团队（Guides: understand the system, use it well, bring it to your codebase and team）

| Page | Goal |
|---|---|
| [Understanding › Concepts](guides/concepts.md) | 这两种 artifact 分别是什么，以及一个 change 如何描述一份相对当前 specs 的 diff。 |
| [Using › Explore an idea](guides/explore.md) | 在承诺一份 proposal 之前，和 agent 一起把它想透。 |
| [Using › Review the plan](guides/review-the-plan.md) | 那两分钟的通读，在错误的方向变成代码之前抓住它们。 |
| [Using › Apply a change](guides/apply.md) | 执行计划：节奏、上下文窗口，以及从你停下的地方接上。 |
| [Using › Change course](guides/change-course.md) | 在 change 进行中修改它，或者判断另起一个更干净。 |
| [Adopting › Existing codebases](guides/existing-codebases.md) | 把 OpenSpec 带到一个代码很多、spec 全无的代码库：从哪里开始、回填什么，以及 specs 从那里如何生长。 |
| [Adopting › Teams](guides/teams.md) | 作为团队使用 OpenSpec：提交什么、一个 change 如何搭上它的 PR，以及什么时候归档。 |

#### 自定义：让工作流贴合你的项目（Customize: make the workflows fit your project）

| Page | Goal |
|---|---|
| [Overview](customize/overview.md) | 自定义 OpenSpec 的各种选项。 |
| [Profiles](customize/profiles.md) | 选择安装哪些工作流，以及它们是以 skills、commands 还是两者兼具的形式安装。 |
| [Project configuration](customize/project-config.md) | 用 config.yaml 里的几行，让工作流按你想要的方式规划 change。 |
| [Schemas](customize/schemas.md) | 改变 OpenSpec 的产出：artifact、它们的顺序，以及它们的 template。 |

#### 多仓库（beta）：跨仓库边界做规划（Multi-repo (beta): plan across repository boundaries）

| Page | Goal |
|---|---|
| [Stores (beta)](multi-repo/stores.md) | 规划跨仓库的 change：一个 store，多个仓库。 |
| [Worksets (beta)](multi-repo/worksets.md) | 在一个编辑器窗口里打开 store 以及使用它的那些仓库，这样你的 agent 能同时看到两者。 |

#### 参考：查得到，精确而完整（Reference: look it up, exact and complete）

| Page | Goal |
|---|---|
| [Skills](reference/skills.md) | 每一个 OpenSpec 技能：参数、它创建什么，以及它用什么来回应。 |
| [CLI](reference/cli.md) | `openspec` 终端命令。 |
| [Schemas](reference/schemas/index.md) | 每一个可用的工作流 schema 以及它定义的 artifact。 |
| [Schemas › schema.yaml](reference/schemas/schema-yaml.md) | 一个 schema 定义的每一个字段，供阅读或编写 schema 时使用。 |
| [Schemas › spec-driven](reference/schemas/spec-driven/index.md) | 默认工作流的 artifact：它们的顺序、它们的格式，以及它们产生的 change 文件夹。 |
| [Configuration](reference/configuration/index.md) | 每一个会改变 OpenSpec 行为的文件和设置，以及各自住在哪里。 |
| [Configuration › Project configuration (config.yaml)](reference/configuration/config-yaml.md) | openspec/config.yaml 的每一个字段：这个项目规划时所用的 schema、context 和 rules。 |
| [Configuration › Change metadata (.openspec.yaml)](reference/configuration/change-metadata.md) | 随每个 change 存储的元数据所支持的字段与校验规则。 |
| [Configuration › CLI settings (config.json)](reference/configuration/config-json.md) | config.json 的每一个字段：openspec CLI 在你的机器上如何表现。 |
| [Configuration › Environment variables](reference/configuration/environment-variables.md) | OpenSpec 会读取的每一个环境变量。 |
| [Configuration › Stores](reference/configuration/stores.md) | 多仓库 store 背后的文件：registry.yaml 和 store.yaml，以及一条命令使用哪个根。 |
| [Supported tools](reference/supported-tools.md) | OpenSpec 支持哪些 AI 编码工具，以及各自的命令语法。 |
| [Glossary](reference/glossary.md) | 每一个 OpenSpec 术语，各一行。 |
| [Architecture](reference/architecture/index.md)（在起草完成前从站点隐藏） | OPSX 是如何构建的：给好奇者的内部细节。 |
| [Architecture › Workflow runs](reference/architecture/workflow-runs.md) | 一次工作流运行是如何执行的，从调用到写出 artifact。 |
| [Architecture › Design decisions](reference/architecture/design-decisions.md) | OPSX 为什么按它现在的方式工作。 |

#### 帮助：摆脱卡住（Help: get unstuck）（在起草完成前从站点隐藏，见 Open TODOs）

| Page | Goal |
|---|---|
| [FAQ](help/faq.md) | 那些不需要单独一页的问题的简短回答。 |
| [Troubleshooting](help/troubleshooting.md) | 当 OpenSpec 没有做到你预期时：症状及其修法。 |

#### 旧版：安全地落地旧工作流（Legacy: land the old workflow safely）（在起草完成前从站点隐藏，见 Open TODOs）

| Page | Goal |
|---|---|
| [Migrating from the legacy workflow](help/legacy/migration.md) | 从 legacy 的 `/openspec:*` 命令迁到 OPSX。 |

### 46.5 旧文档（Old docs）

`docs/` 树是 legacy 的，计划是在 docs-lab 覆盖了它负责的内容之后把它移除。它已经有点变成一滩 AI 垃圾，所以不从它那里搬运任何文本（见 The bar for every page）。在它被移除之前，它保持原封不动：修复落在 docs-lab，绝不落在 `docs/`。

[`sources.md`](sources.md) 把当前每一个 `docs/` 页面映射到它在这里的目的地：起草期间的素材来源，切换时的重定向清单。切换步骤在那个文件的 [Cutover](sources.md#cutover) 小节里。

### 46.6 未完成的 TODO（Open TODOs）

- 尚未开始：Architecture 页面（`reference/architecture/index.md`、`workflow-runs.md`、`design-decisions.md`）。这三篇都只有标题，所以我们在 2026-08-21 把这个组从站点隐藏了（文件夹条目在 `website/docs.sync.config.mjs` 里被注释掉）。这些文件留在磁盘上，带一条 WIP 注释。链接到它们的已发布页面（`reference/glossary.md` 链到 Overview，`customize/project-config.md` 链到 Workflow runs）回退到 GitHub 源文件，直到这个组被重新列入。
- 尚未开始：Help 与 Legacy 页面（`help/faq.md`、`help/troubleshooting.md`、`help/legacy/migration.md`）。FAQ 只有一个回答，另外两篇只有标题，所以我们在 2026-08-21 把两个小节都从站点隐藏了（在 `website/docs.sync.config.mjs` 里注释掉，机制与 Guides 相同）。这些文件留在磁盘上，带一条 WIP 注释。链接到它们的已发布页面（`start/setup.md` 链到 FAQ，`reference/glossary.md` 链到 Migration）回退到 GitHub 源文件，直到这些小节被重新列入。
- 尚未开始：`start/overview.md` 是故意留空的。我们在 2026-08-21 清掉了骨架（标题、叙事节拍、示意图画廊），以便从零重写这个落地页。旧的推销词（「一份在写代码之前共享、可评审的计划」）在 plan mode 遍地都是的今天已经低估了 OpenSpec；重写应该推销的是让更大的功能保持正轨与对齐（团队、git 原生、意图行为 vs 已实现行为、控制回路的框架）。要点在 `Notes.md`（「Start > Overview」）；示意图候选随画廊一起走了，现存于 git 历史里。在重写落地之前，这一页不在站点上：它的条目在 `website/docs.sync.config.mjs` 里被注释掉，`/docs` 重定向到 Installation（`website/public/_redirects` 加上 docs 页面路由里的一个回退）。恢复它是一次取消注释加上移除这两个重定向。只教一次的规则仍然适用：循环在这里只以推销的形式出现。
- 产品反馈，不是文档任务：spec-driven 的 design `instruction` 列了六节（包括 Migration Plan 和 Open Questions），但 `schemas/spec-driven/templates/design.md` 只有四个标题。文档把两者都原样展示；不一致属于上游。2026-08-14 在整合 spec-driven 页面时记下。
- 产品反馈，不是文档任务：`openspec store setup --remote` 把 URL 写进 `store.yaml`，但从不配置 git 的 `origin`，所以「先 setup --remote，再 `git push -u origin main`」按字面执行会失败；Stores 页面改为展示 `git remote add`。`openspec doctor` 里那段可粘贴的「缺失 store」修复由 `references:` 的 remote 驱动，而不是 `store.yaml`。2026-08-21 在移植 Stores 页面时记下。
- 风格指南后续（`.agents/skills/write-openspec-docs/writing.md`），来自 Stores 页面的几轮评审，2026-08-21：绝不使用页面还没有展示过的术语（说「`store:` 那一行」，而不是「那个指针」；先展示 artifact 来定义）；当行为取决于读者的起始状态时，枚举这些状态并把每一种走到它的结果；句子的主语是你、OpenSpec 或你的 agent，绝不是一个实现单元（「解析器挑选」）或一类事物（「只有 store 的项目会……」）；当一个已定义的术语在一个小节之后被再次使用时，在使用处用一句括号重新解释它。
- 代码块约定后续，2026-08-21：Stores 页面把命令放进 `bash` 代码块，配一行 `#` 注释，并把 OpenSpec 的输出放进单独的 `yaml` 代码块。`customize/schemas.md` 仍在使用带 `$` 提示符的 `console` 代码块（第 78、114、137、145 行；提示符在第 24 和 115 行）；风格指南应该为这个约定命名，而那一页应该采用它。
- Monorepo：message-map 第 37 行仍然是 Gap。「把 package 当作独立仓库处理」以后可能落在 Stores 页面上；不属于当前页面的范围。
- `reference/cli.md` 已完整起草：命令表加上每条真实命令一节，事实来自工作树里的实跑记录（2026-08-11）。start/setup.md 的「Skills, commands, or both」小节所设置的 `delivery` 键在那里只作为命令输出出现；它的字段级归宿 `reference/configuration/config-json.md` 已起草（2026-08-14）。
- 遥测没有文档。`OPENSPEC_TELEMETRY=0` 在这棵树里任何地方都没出现；Deno 安装命令授予 `--allow-net=edge.openspec.dev` 却没有任何解释（遥测的注解被刻意撤下，等一个真正的归宿）。归宿现在有了：写 `reference/configuration/environment-variables.md`（那个环境变量、收集了什么、如何退出、CI 自动禁用），然后让 Deno 小节链接到它来解释这个 flag。2026-08-07 记下；归宿于 2026-08-10 定下。
- 产品反馈，不是文档任务：init 不会说明全局 profile 是否改变了它所写的内容。一台 `profile: custom` 的机器会静默地安装与出厂机器不同的工作流集合，而 init 的输出里没有任何东西指明是哪个 profile 塑造了它。2026-08-05 在验证 installation.md 时记下；在上游跟踪，不要在正文里糊过去。
- 产品反馈，不是文档任务：把 sync-specs 技能从默认集合里去掉；它的职责读起来像参考内容而不是工作流，而且在每个读者都要扫的技能列表里凑数。2026-08-08 在写 start/setup.md 的工作流树时记下。
- 产品反馈，不是文档任务：把共享的 `.agents/` 文件夹作为每个工具的默认安装目标，工具专属文件夹（`.claude/`……）作为例外。文档在示例里已经偏向 `.agents/`；产品应该与之对齐。2026-08-08 记下。
- `help/troubleshooting.md` 的骨架里没有针对安装期失败（`command not found`、Node 版本不对、PATH）的小节。旧的 `docs/troubleshooting.md` 覆盖了它们；`start/installation.md` 以内联方式带着注意事项，但没有一个「症状到修法」的归宿。加一个小节，或者加一个 installation.md 的锚点。2026-08-10 在旧文档的消息审计期间记下。
- 缺失的指南：迭代流程。new/continue/fast-forward 的判断没有归属：这个流程是什么、什么时候选它而不是 propose，以及 ff 与 continue 之别。旧的 `docs/workflows.md` 覆盖过它（Two Modes、When to Use What）；`sources.md` 把那一页的机制路由到 `guides/apply.md`、把契约路由到 `reference/skills.md`，于是这个选择本身哪里都没落下。可能的落点是一篇 Guides › Using 页面，插在 Explore 与 Review the plan 之间，并带一个指向 `customize/profiles.md` 的指针（这些技能是核心集合之外的可选工作流）。只抢救 ff 与 continue 的经验法则；workflows.md 的其余部分未经验证。2026-08-11 记下。相关：message-map 第 29 行把 apply.md 的节奏问题措辞成起草期的节奏，也就是同一个创建阶段的取舍；当这篇指南落地时，修正那一行的措辞或归属。2026-08-14 记下。
- 缺失的指南：与 git 打交道。OpenSpec 从不碰 git，所以每一个 git 决策都落在读者身上，没有页面来回答：你在 propose 之前还是之后开分支、一个任务是否单独一次提交、PR 里放什么、归档那次提交落在哪里。`guides/teams.md` 负责 archive 与 PR 的先后顺序；其余没有归属。可能的落点是 Adoption 组里的一个 `guides/` 文件。2026-08-08 记下。
- `customize/skills.md` 被搁置：骨架留在磁盘上，但不在页面索引、侧边栏和同步配置里。编辑已安装的技能提示词目前还没有好答案（`openspec update` 会覆盖编辑）；message map 把这个问题保持为 Gap。等产品对「如何在更新后存活」有了真正的说法再复活它。2026-08-14 搁置。
- `guides/examples.md` 被搁置：骨架留在磁盘上，但不在页面索引、侧边栏和同步配置里。生造的例子会给这个产品教出错误的教训；等来自真实使用的、真实的已归档 change 能填满这一页时再复活它。内容计划（薄弱 vs 已评审的成对例子、已归档 change 画廊）在这个文件的注释里。2026-08-11 搁置。
- 产品反馈，不是文档任务：「expanded」在产品字符串里还活着，而 update 工作流在选择器里没有标签。存储的 profile 取值只有 core 和 custom，但 `src/core/templates/workflows/update-change.ts` 写着「expanded-profile workflow」，而 `WORKFLOW_PROMPT_META`（`src/commands/config.ts`）没有 `update` 条目，于是 `openspec config` 的工作流选择器把一个核心工作流渲染成裸的 `update` /「Workflow: update」。文档已统一到 core/custom，并把「expand the set」当作动词（2026-08-12）。2026-08-12 在术语表的产品扫描期间记下。
- 产品反馈，不是文档任务：尽快收敛到只有 skills。一个工作流的 skill 和 command 是同一份指令，Claude Code 已经在上游把 commands 并入 skills，而 setup 花了整整一个小节解释为什么存在两种形态。commands 一走，每一页都会更简单。2026-08-08 在写 start/setup.md 时记下。
- 站点体验待办清单，属于站点构建而非正文：i18n；在原生关键词搜索之上叠加 AI 搜索（一个「问文档」的答案框，而不只是匹配）；真正的亮/暗主题，把 Survey 调色板（DESIGN.md 的 token）带进两种模式，而不是一个原生的暗色主题。可以在同一轮里一并做的候选：`llms.txt` 加上每页一个「copy as Markdown」按钮，让 agent 能摄取页面；代码块上的复制按钮；以及「edit this page on GitHub」链接。2026-08-11 记下。
