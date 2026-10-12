## 25 new-change —— 只搭骨架

> 译自 `reference/openspec/skills/openspec-new-change/SKILL.md`（原文 87 行，全文翻译）。按 `READING-openspec.md` 第 25 项。frontmatter、全部 bash 命令、JSON 字段名与 CLI 报错码按原样保留。

**frontmatter**

- `name`: `openspec-new-change`
- `description`: `Start a new OpenSpec change using the experimental artifact workflow. Use when the user wants to create a new feature, fix, or modification with a structured step-by-step approach. Also use when the user says "openspec new change" or "opsx new".`
- `allowed-tools`: `Bash(openspec:*)`
- `license`: `MIT`
- `compatibility`: `Requires openspec CLI.`
- `metadata.author`: `openspec`
- `metadata.version`: `"1.0"`

### 25.1 开篇

用实验性的、artifact 驱动的方法开始一个新的 change。

### 25.2 store 选择（Store selection）

**store 选择（Store selection）：** 如果用户点名了一个 store（store 是一台机器上注册的、独立的 OpenSpec 仓库），或者工作就住在某个 store 里，跑 `openspec store list --json` 发现已注册的 store id，然后在那些读写 spec 和 change 的命令上传 `--store <id>`（`new change`、`status`、`instructions`、`list`、`show`、`validate`、`archive`、`doctor`、`context`、`schemas`、`view`）。一旦选定，就把 `--store <id>` 当作在整个工作流余下部分里 **sticky**。下面那些命令的每一个未加作用域的例子都是简写：跑之前，把参数补上。例如跑 `openspec status --change "<name>" --json --store "<id>"`，而不是下面展示的未加作用域的形式。其它命令不接受这个参数。命令打印出的提示已经带上了这个参数；后续调用要保持带上它。没有 store 时，命令作用于最近的本 `openspec/` root。

### 25.3 项目检查（Project check）

**项目检查（Project check）：** 这些步骤期望一个已经在用 OpenSpec 的项目。在第一个会写任何东西的步骤之前（`new change`、`archive`、`sync specs`，或撰写一个 artifact 文件），先确认项目有 root：跑 `openspec list --json`（选中 store 时带 `--store <id>`，因为那时 store 就是 root）并读 `root`。一个 root 对象意味着项目已配置好。`"root": null` 意味着没有配置好 —— 这里没有 `openspec/` 目录，而一次写入（比如 `openspec new change`）会作为副作用创建一个。这条命令也会以非零码退出，那是这个答案本身，而不是 CLI 坏了，所以要读 JSON，不要去重试或绕开它。

### 25.4 有一种 `"root": null` 与配置无关（One `"root": null` is not about setup）

有一种 `"root": null` 和配置无关：当一条 `status` 错误消息以 `Declared in` 或 `Invalid store declaration in` 开头，并点名了本项目的 `openspec/config.yaml`（或 `config.yml`）时，说明这个项目确实通过一个它声明的 store 在用 OpenSpec，只是这台机器无法解析那个 store（store 未注册，或者 `store:` 那行格式不对）。不要把它当作未初始化并跳过下面的分支：在写入之前停下，把那条错误的 `message` 和 `fix` 给用户看。

### 25.5 没有 root 时如何分支（No root: branch on how this workflow was reached）

否则，在没有 root 的情况下，接下来发生什么取决于这个工作流是怎么被触达的：

- **自动选中（Auto-selected）**：你自己选了这个工作流，而用户没有点名 OpenSpec、没有点名这个技能、也没有跑它的 slash command。停止使用 OpenSpec，正常回答这个请求，就像没装 OpenSpec 一样。不要让他们去配置任何东西，也不要提 OpenSpec 的配置。
- **显式 OpenSpec 请求（Explicit OpenSpec request）**：用户点名了 OpenSpec、点名了这个技能，或跑了它的 slash command。在写入之前停下，问怎么继续：把项目配置起来（`openspec init`）、指向他们已有的某个 store（`--store <id>`），还是这次请求不用 OpenSpec。等他们的回答。

两个分支里，都不要把创建 root 当作副作用：用户要求之前不要跑 `openspec init`，不要手工创建 `openspec/` 文件，也不要让任何命令创建它。

### 25.6 输入（Input）

**输入（Input）**：用户的请求应该包含一个 change 名（kebab-case）**或**一段对要建什么的描述。

### 25.7 步骤（Steps）

**步骤（Steps）**

### 25.8 步骤 1：如果没有提供清晰的输入，问他们想建什么（Step 1: If no clear input provided, ask what they want to build）

1. **如果没有提供清晰的输入，问他们想建什么**

   问用户（开放式，不给预设选项）：
   > "What change do you want to work on? Describe what you want to build or fix."

   从他们的描述里推导出一个 kebab-case 名字（例如 "add user authentication" → `add-user-auth`）。

   **重要**：不理解用户想建什么就**不要**往下走。

### 25.9 步骤 2：确定工作流 schema（Step 2: Determine the workflow schema）

2. **确定工作流 schema**

   使用默认 schema（省略 `--schema`），除非用户明确要求一个不同的工作流。

   **只在用户提到以下内容时才使用不同的 schema：**
   - 某个具体的 schema 名字 → 用 `--schema <name>`
   - "show workflows" 或 "what workflows" → 跑 `openspec schemas --json`，让他们选

   **否则**：省略 `--schema` 以使用默认值。

### 25.10 步骤 3：创建 change 目录（Step 3: Create the change directory）

3. **创建 change 目录**
   ```bash
   openspec new change "<name>"
   ```
   只在用户要求某个具体工作流时才加 `--schema <name>`。
   这会在 CLI 解析出的 planning home 里创建一个搭好骨架的 change。

### 25.11 步骤 4：展示 artifact 状态（Step 4: Show the artifact status）

4. **展示 artifact 状态**
   ```bash
   openspec status --change "<name>" --json
   ```
   用返回的 `planningHome`、`changeRoot`、`artifactPaths` 和 `nextSteps`，而不是假设仓库相对的路径。

### 25.12 步骤 5：拿到第一个 artifact 的指令（Step 5: Get instructions for the first artifact）

5. **拿到第一个 artifact 的指令**
   第一个 artifact 取决于 schema（例如 spec-driven 的 `proposal`）。
   查看 status 输出，找到第一个状态为 "ready" 的 artifact。
   ```bash
   openspec instructions <first-artifact-id> --change "<name>"
   ```
   这会输出创建第一个 artifact 所需的 template 和 context。

### 25.13 步骤 6：停下并等待用户指示（Step 6: STOP and wait for user direction）

6. **停下，等待用户指示**

### 25.14 输出（Output）

**输出（Output）**

完成这些步骤之后，总结：
- change 名字和位置
- 正在使用的 schema/工作流，以及它的 artifact 序列
- 当前状态（0/N 个 artifact 完成）
- 第一个 artifact 的 template
- 提示："Ready to create the first artifact? Just describe what this change is about and I'll draft it, or ask me to continue."

### 25.15 护栏（Guardrails）

**护栏（Guardrails）**
- 还**不要**创建任何 artifact —— 只展示指令
- 不要越过展示第一个 artifact template 这一步
- 如果名字无效（不是 kebab-case），要一个有效的名字
- 如果同名的 change 已经存在，建议改为继续那个 change
- 如果使用的是非默认工作流，就传 --schema
