## 3 invocation

> 译自 `reference/mattpocock-skills/.agents/invocation.md`（原文 26 行）。无 frontmatter。

**模型调用与用户调用（Model-invoked vs user-invoked）**

本仓库里的每一个 `SKILL.md` 都是一个技能。把它们区分开来的唯一一个轴是**调用（invocation）**，也就是谁能触达它：

- **用户调用（user-invoked）**：**只能由人输入它的名字**来触达。在 frontmatter 里设 `disable-model-invocation: true`（Claude Code），在 `agents/openai.yaml` 里设 `policy.allow_implicit_invocation: false`（Codex）。`description` 是**面向人的**：一行摘要，供浏览斜杠命令的人阅读。去掉触发词清单（「当用户说……时使用」）。
- **模型调用（model-invoked）**：**模型或用户**都可以触达。这是默认：省略 `disable-model-invocation` 和 `agents/openai.yaml` 里的 `policy` 块。`description` 是**面向模型的**，保留丰富的触发措辞（「当用户想要……、提到……、要求……时使用」），好让自动调用被触发。判断一个技能是否应该保持模型调用的测试：_模型能不能有用地自主去找它？_（复用是提取一个技能的理由，不是那个测试。）

每个 harness 都以自己的方式把用户调用的技能排除在模型的触达范围之外，所以除了人以外什么都无法触发它：其他任何技能都不行。一个用户调用的技能可以调用模型调用的技能，但它永远无法触达另一个用户调用的技能。

每个技能在它的 `SKILL.md` 旁边还带着一个 `agents/openai.yaml`。它存放 Codex 的 UI 元数据：给技能选择器用的 `interface.display_name` 和 `interface.short_description`，以及（对用户调用的技能而言）与 `disable-model-invocation` 配套的 `policy.allow_implicit_invocation: false`。让两者保持同步：一个技能要么在两个 harness 里都是用户调用的，要么都不是。

各 bucket 的 `README.md` 和顶层 `README.md` 把条目分成 **User-invoked** 和 **Model-invoked** 两组。

### 3.1 它们之间的依赖（Dependencies between them）

依赖被表达为一条明确的指令：**调用 Skill 工具**并传入被点名的技能（`Call the Skill tool with "grilling"`），而不是深层 `../other-skill/FILE.md` 交叉引用，也不是留一个光秃秃的 `/skill` 式提及让模型自己去解释。点名工具才是让它被触发的东西：大多数 harness 把技能调用暴露为模型可调用的一个工具，而把这一点写清楚，比把 `/name` 丢进散文里、指望它被当成命令来读，命中率更高。去掉开头的 `/` 也让这件事保持 harness 中立，而不是更差：一个光秃秃的技能名自身不携带任何关于它属于哪个 harness 触发语法的假设。共享的参考文档住在拥有它们的那个技能内部；其他技能通过调用 Skill 工具并传入它来够到那些材料，而不是跨文件夹链接。

这说的是**操作性（operative）** 指令：技能自己的步骤叫 agent 现在就去跑另一个技能。只是为人类挑选而给技能点名的路由文字（`ask-matt`、各 bucket 的 `README.md`）并没有在调用任何东西，所以它把 `/skill` 式的名字保留为普通标签。

Skill 工具每次调用只接一个技能。一个需要两个技能的步骤是两次调用，而不是一次带两个名字的调用：要这么说（`Call the Skill tool twice, for "grilling" and "domain-modeling"`），而不是说 "call it with X and Y"，后者读起来像是一次调用同时接了两个。

这一整套约定只有在被点名的技能是**模型调用的**时候才成立。用户调用的技能永远无法通过这种方式触达，句号：按照上面的不变量，其他任何技能都不能调用它，包括把它点名给 Skill 工具。当一个步骤的前置条件是一个用户调用的技能时（例如 `setup-matt-pocock-skills`），把它写成一条让人去执行的指令："tell the user to run `/setup-matt-pocock-skills`"，绝不要写成一次 Skill 工具调用。

### 3.2 被动的与主动的领域工作（Passive vs active domain work）

仅仅为了词汇去_读_ `CONTEXT.md`，是一句散文式的指引，不是 `domain-modeling` 技能。只有主动的构建/磨利功课（挑战术语、边界情形场景、写 ADR、就地更新 `CONTEXT.md`）才是 `domain-modeling`。
