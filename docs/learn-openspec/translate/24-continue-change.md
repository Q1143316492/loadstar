## 24 continue-change —— 创建下一个 artifact

> 译自 `reference/openspec/skills/openspec-continue-change/SKILL.md`（原文 127 行，全文翻译）。按 `READING-openspec.md` 第 24 项。frontmatter、全部 bash 命令、JSON 字段名与 CLI 报错码按原样保留。

**frontmatter**

- `name`: `openspec-continue-change`
- `description`: `Continue working on an OpenSpec change by creating the next artifact. Use when the user wants to progress their change, create the next artifact, or continue their workflow. Also use when the user says "openspec continue" or "opsx continue".`
- `allowed-tools`: `Bash(openspec:*)`
- `license`: `MIT`
- `compatibility`: `Requires openspec CLI.`
- `metadata.author`: `openspec`
- `metadata.version`: `"1.0"`

### 24.1 开篇

通过创建下一个 artifact 来继续处理一个 change。

### 24.2 store 选择（Store selection）

**store 选择（Store selection）：** 如果用户点名了一个 store（store 是一台机器上注册的、独立的 OpenSpec 仓库），或者工作就住在某个 store 里，跑 `openspec store list --json` 发现已注册的 store id，然后在那些读写 spec 和 change 的命令上传 `--store <id>`（`new change`、`status`、`instructions`、`list`、`show`、`validate`、`archive`、`doctor`、`context`、`schemas`、`view`）。一旦选定，就把 `--store <id>` 当作在整个工作流余下部分里 **sticky**。下面那些命令的每一个未加作用域的例子都是简写：跑之前，把参数补上。例如跑 `openspec status --change "<name>" --json --store "<id>"`，而不是下面展示的未加作用域的形式。其它命令不接受这个参数。命令打印出的提示已经带上了这个参数；后续调用要保持带上它。没有 store 时，命令作用于最近的本 `openspec/` root。

### 24.3 项目检查（Project check）

**项目检查（Project check）：** 这些步骤期望一个已经在用 OpenSpec 的项目。在第一个会写任何东西的步骤之前（`new change`、`archive`、`sync specs`，或撰写一个 artifact 文件），先确认项目有 root：跑 `openspec list --json`（选中 store 时带 `--store <id>`，因为那时 store 就是 root）并读 `root`。一个 root 对象意味着项目已配置好。`"root": null` 意味着没有配置好 —— 这里没有 `openspec/` 目录，而一次写入（比如 `openspec new change`）会作为副作用创建一个。这条命令也会以非零码退出，那是这个答案本身，而不是 CLI 坏了，所以要读 JSON，不要去重试或绕开它。

### 24.4 有一种 `"root": null` 与配置无关（One `"root": null` is not about setup）

有一种 `"root": null` 和配置无关：当一条 `status` 错误消息以 `Declared in` 或 `Invalid store declaration in` 开头，并点名了本项目的 `openspec/config.yaml`（或 `config.yml`）时，说明这个项目确实通过一个它声明的 store 在用 OpenSpec，只是这台机器无法解析那个 store（store 未注册，或者 `store:` 那行格式不对）。不要把它当作未初始化并跳过下面的分支：在写入之前停下，把那条错误的 `message` 和 `fix` 给用户看。

### 24.5 没有 root 时如何分支（No root: branch on how this workflow was reached）

否则，在没有 root 的情况下，接下来发生什么取决于这个工作流是怎么被触达的：

- **自动选中（Auto-selected）**：你自己选了这个工作流，而用户没有点名 OpenSpec、没有点名这个技能、也没有跑它的 slash command。停止使用 OpenSpec，正常回答这个请求，就像没装 OpenSpec 一样。不要让他们去配置任何东西，也不要提 OpenSpec 的配置。
- **显式 OpenSpec 请求（Explicit OpenSpec request）**：用户点名了 OpenSpec、点名了这个技能，或跑了它的 slash command。在写入之前停下，问怎么继续：把项目配置起来（`openspec init`）、指向他们已有的某个 store（`--store <id>`），还是这次请求不用 OpenSpec。等他们的回答。

两个分支里，都不要把创建 root 当作副作用：用户要求之前不要跑 `openspec init`，不要手工创建 `openspec/` 文件，也不要让任何命令创建它。

### 24.6 输入（Input）

**输入（Input）**：可选地指定一个 change 名。如果省略了，检查它能否从对话上下文里推断出来。如果含糊或有歧义，你**必须**提示可选的 change。

### 24.7 步骤（Steps）

**步骤（Steps）**

### 24.8 步骤 1：选择 change（Step 1: Select the change）

1. **选择 change**

   如果提供了名字，就用它。否则：
   - 如果用户在对话里提到过某个 change，就从对话上下文里推断
   - 如果只存在一个活跃 change，就自动选中
   - 如果模棱两可，跑 `openspec list --json` 拿到按最近修改时间排序的可用 change，并让用户选一个

   提示时，把最近修改的 3-4 个 change 作为选项呈现出来，展示：
   - change 名字
   - 状态（例如 "0/5 tasks"、"complete"、"no tasks"）
   - 它最近一次被修改是什么时候（来自 `lastModified` 字段）

   把最近修改的那个 change 标成 "(Recommended)"，因为它很可能就是用户想继续的那个。

   始终宣布："Using change: <name>"，以及如何覆盖它（例如 `/openspec-continue-change <other>`）。

### 24.9 步骤 2：检查当前状态（Step 2: Check current status）

2. **检查当前状态**
   ```bash
   openspec status --change "<name>" --json
   ```
   解析这个 JSON 来理解当前状态。响应包含：
   - `schemaName`：正在使用的工作流 schema（例如 "spec-driven"）
   - `artifacts`：artifact 数组，带它们的状态（"done"、"skipped"、"ready"、"blocked"）
   - `isPlanningComplete`：布尔值，表示所有规划 artifact 是否都已完成。更旧的 CLI 版本用 `isComplete` 暴露同一个值。
   - `planningHome`、`changeRoot`、`artifactPaths` 和 `actionContext`：路径与作用域上下文。用它们，而不是假设仓库相对的路径。

### 24.10 步骤 3：根据状态行动（Step 3: Act based on status）

3. **根据状态行动**：

   ---

   **如果所有规划 artifact 都已完成（`isPlanningComplete: true`，或旧版的 `isComplete: true`）**：
   - 向用户道贺
   - 展示最终状态，包括所用的 schema
   - 建议："Planning is complete! You can now implement this change. Once implementation and any tracked work are complete, archive it."
   - 停下

   ---

   **如果已有 artifact 可以创建**（status 展示出带 `status: "ready"` 的 artifact）：
   - 从 status 输出里挑出**第一个** `status: "ready"` 的 artifact
   - 拿到它的指令：
     ```bash
     openspec instructions <artifact-id> --change "<name>" --json
     ```
   - 解析这个 JSON。关键字段是：
     - `context`：项目背景（对你的约束 —— **不要**放进输出）
     - `rules`：artifact 专属规则（对你的约束 —— **不要**放进输出）
     - `template`：你的输出文件要用的结构
     - `instruction`：schema 专属的指引
     - `resolvedOutputPath`：写这个 artifact 的已解析路径或模式
     - `dependencies`：要作为上下文读取的、已完成的 artifact（带 `skipped: true` 的条目没有文件 —— 不要去找它们）
     - `skipped`/`warning`：当这个 change 声明了 skip_specs 且这个 artifact **绝不能**被创建时出现 —— 另挑一个 artifact
   - **创建这个 artifact 文件**：
     - 读取任何已完成的依赖文件作为上下文 —— **始终从磁盘重读**它们，即使你在对话里早先见过（用户可能已经改过）
     - 如果 `instruction` 字段把创建委托给某个具体技能或命令，就调用它来产出 artifact，而不是自己写这个文件，然后确认 artifact 文件存在于 `resolvedOutputPath`
     - 否则用 `template` 作为结构 —— 填它的各个分段
     - 写的时候把 `context` 和 `rules` 作为约束来应用 —— 但**不要**把它们抄进文件
     - 写到 instructions 里指定的 `resolvedOutputPath`。如果它是一个 glob 模式，就用 schema 指令和这个 change 的上下文选择具体的文件路径
   - 展示创建了什么，以及现在解锁了什么
   - 创建**一个** artifact 之后就停下

   ---

   **如果没有 artifact 可以创建（全部 blocked）**：
   - 在一个有效的 schema 下，这不该发生
   - 展示状态，并建议检查有没有问题

### 24.11 步骤 4：创建 artifact 之后展示进度（Step 4: After creating an artifact, show progress）

4. **创建 artifact 之后展示进度**
   ```bash
   openspec status --change "<name>"
   ```

### 24.12 输出（Output）

**输出（Output）**

每次调用之后，展示：
- 创建了哪个 artifact
- 正在使用哪个 schema 工作流
- 当前进度（N/M 完成）
- 现在解锁了哪些 artifact
- 提示："Want to continue? Just ask me to continue or tell me what to do next."

### 24.13 artifact 创建准则（Artifact Creation Guidelines）

**artifact 创建准则（Artifact Creation Guidelines）**

artifact 的类型及它们的用途取决于 schema。instructions 输出里的 `instruction` 字段是每个 artifact 的权威指引 —— 即使这个 artifact 有一个熟悉的名字（proposal.md、tasks.md 等等）也要遵循它，因为自定义 schema 可能为同样的文件名定义不同的内容或不同的流程。

如果 `instruction` 字段指示用某个具体技能或命令来创建这个 artifact，就调用它，而不是直接写这个 artifact。

### 24.14 护栏（Guardrails）

**护栏（Guardrails）**
- 每次调用只创建一个 artifact
- 创建新的 artifact 之前始终读取依赖 artifact —— 从磁盘重读，而不是从对话记忆里读（文件可能在你上次看到之后变过）
- 绝不要跳过 artifact，也不要乱序创建
- 如果上下文不清楚，创建之前先问用户
- 写完之后、标记进度之前，确认 artifact 文件存在
- 用 schema 的 artifact 序列，不要假设具体的 artifact 名字
- **重要**：`context` 和 `rules` 是给你（agent）的约束，不是文件的内容
  - **不要**把 `<context>`、`<rules>`、`<project_context>` 块抄进 artifact
  - 它们指引你写什么，但绝不应该出现在输出里
