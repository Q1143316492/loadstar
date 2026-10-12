## 26 ff-change —— 快进生成规划 artifact

> 译自 `reference/openspec/skills/openspec-ff-change/SKILL.md`（原文 127 行，全文翻译）。按 `READING-openspec.md` 第 26 项。frontmatter、全部 bash 命令、JSON 字段名与 CLI 报错码按原样保留。

**frontmatter**

- `name`: `openspec-ff-change`
- `description`: `Fast-forward through OpenSpec artifact creation. Use when the user wants to quickly create all artifacts needed for implementation without stepping through each one individually. Also use when the user says "openspec ff" or "opsx ff".`
- `allowed-tools`: `Bash(openspec:*)`
- `license`: `MIT`
- `compatibility`: `Requires openspec CLI.`
- `metadata.author`: `openspec`
- `metadata.version`: `"1.0"`

### 26.1 开篇

快进走过 artifact 创建 —— 一口气生成开始实现所需的一切。

### 26.2 store 选择（Store selection）

**store 选择（Store selection）：** 如果用户点名了一个 store（store 是一台机器上注册的、独立的 OpenSpec 仓库），或者工作就住在某个 store 里，跑 `openspec store list --json` 发现已注册的 store id，然后在那些读写 spec 和 change 的命令上传 `--store <id>`（`new change`、`status`、`instructions`、`list`、`show`、`validate`、`archive`、`doctor`、`context`、`schemas`、`view`）。一旦选定，就把 `--store <id>` 当作在整个工作流余下部分里 **sticky**。下面那些命令的每一个未加作用域的例子都是简写：跑之前，把参数补上。例如跑 `openspec status --change "<name>" --json --store "<id>"`，而不是下面展示的未加作用域的形式。其它命令不接受这个参数。命令打印出的提示已经带上了这个参数；后续调用要保持带上它。没有 store 时，命令作用于最近的本 `openspec/` root。

### 26.3 项目检查（Project check）

**项目检查（Project check）：** 这些步骤期望一个已经在用 OpenSpec 的项目。在第一个会写任何东西的步骤之前（`new change`、`archive`、`sync specs`，或撰写一个 artifact 文件），先确认项目有 root：跑 `openspec list --json`（选中 store 时带 `--store <id>`，因为那时 store 就是 root）并读 `root`。一个 root 对象意味着项目已配置好。`"root": null` 意味着没有配置好 —— 这里没有 `openspec/` 目录，而一次写入（比如 `openspec new change`）会作为副作用创建一个。这条命令也会以非零码退出，那是这个答案本身，而不是 CLI 坏了，所以要读 JSON，不要去重试或绕开它。

### 26.4 有一种 `"root": null` 与配置无关（One `"root": null` is not about setup）

有一种 `"root": null` 和配置无关：当一条 `status` 错误消息以 `Declared in` 或 `Invalid store declaration in` 开头，并点名了本项目的 `openspec/config.yaml`（或 `config.yml`）时，说明这个项目确实通过一个它声明的 store 在用 OpenSpec，只是这台机器无法解析那个 store（store 未注册，或者 `store:` 那行格式不对）。不要把它当作未初始化并跳过下面的分支：在写入之前停下，把那条错误的 `message` 和 `fix` 给用户看。

### 26.5 没有 root 时如何分支（No root: branch on how this workflow was reached）

否则，在没有 root 的情况下，接下来发生什么取决于这个工作流是怎么被触达的：

- **自动选中（Auto-selected）**：你自己选了这个工作流，而用户没有点名 OpenSpec、没有点名这个技能、也没有跑它的 slash command。停止使用 OpenSpec，正常回答这个请求，就像没装 OpenSpec 一样。不要让他们去配置任何东西，也不要提 OpenSpec 的配置。
- **显式 OpenSpec 请求（Explicit OpenSpec request）**：用户点名了 OpenSpec、点名了这个技能，或跑了它的 slash command。在写入之前停下，问怎么继续：把项目配置起来（`openspec init`）、指向他们已有的某个 store（`--store <id>`），还是这次请求不用 OpenSpec。等他们的回答。

两个分支里，都不要把创建 root 当作副作用：用户要求之前不要跑 `openspec init`，不要手工创建 `openspec/` 文件，也不要让任何命令创建它。

### 26.6 输入（Input）

**输入（Input）**：用户的请求应该包含一个 change 名（kebab-case）**或**一段对要建什么的描述。

### 26.7 步骤（Steps）

**步骤（Steps）**

### 26.8 步骤 1：如果没有提供清晰的输入，问他们想建什么（Step 1: If no clear input provided, ask what they want to build）

1. **如果没有提供清晰的输入，问他们想建什么**

   问用户（开放式，不给预设选项）：
   > "What change do you want to work on? Describe what you want to build or fix."

   从他们的描述里推导出一个 kebab-case 名字（例如 "add user authentication" → `add-user-auth`）。

   **重要**：不理解用户想建什么就**不要**往下走。

### 26.9 步骤 2：创建 change 目录（Step 2: Create the change directory）

2. **创建 change 目录**
   ```bash
   openspec new change "<name>"
   ```
   这会在 CLI 解析出的 planning home 里创建一个搭好骨架的 change。

### 26.10 步骤 3：拿到 artifact 的构建顺序（Step 3: Get the artifact build order）

3. **拿到 artifact 的构建顺序**
   ```bash
   openspec status --change "<name>" --json
   ```
   解析这个 JSON 来拿到：
   - `applyRequires`：实现之前所需的 artifact ID 数组（例如 `["tasks"]`）
   - `artifacts`：所有 artifact 的列表，每个带有它的 `status` 和它的 `requires` 边（它直接依赖的那些 artifact ID）
   - `planningHome`、`changeRoot`、`artifactPaths` 和 `actionContext`：路径与作用域上下文。用它们，而不是假设仓库相对的路径。

### 26.11 步骤 4：创建所需集合里的每一个 artifact（Step 4: Create every artifact in the required set）

4. **创建所需集合里的每一个 artifact**

   用一个 todo list 来追踪经过这些 artifact 的进度。

   按依赖顺序遍历 artifact（没有待办依赖的 artifact 排前面）：

   a. **对每一个处于 `ready`（依赖已满足）的 artifact**：
      - 拿到指令：
        ```bash
        openspec instructions <artifact-id> --change "<name>" --json
        ```
      - 这个 instructions JSON 包含：
        - `context`：项目背景（对你的约束 —— **不要**把它放进输出）
        - `rules`：artifact 专属规则（对你的约束 —— **不要**把它放进输出）
        - `template`：你的输出文件要用的结构
        - `instruction`：针对这类 artifact 的、schema 专属的指引
        - `skipped`/`warning`：当这个 change 声明了 skip_specs 且这个 artifact **绝不能**被创建时出现 —— 停下，另挑一个 artifact
        - `resolvedOutputPath`：写这个 artifact 的已解析路径或模式
        - `dependencies`：要作为上下文读取的、已完成的 artifact
      - 读取任何已完成的依赖文件作为上下文 —— **始终从磁盘重读**它们，即使你在对话里早先见过（用户可能已经改过）
      - **起草之前先勘察相关项目**：先读 `context` 和 `rules`，然后勘察 `openspec/` 之外相关的实现、邻近测试、配置和文档。保持勘察只读，并与这个 change 成比例；把发现复用到后面的 artifact，只在需要时勘察更多。
        - 从请求和项目上下文里识别目标项目；planning home 可能与代码分离。如果目标不明确，就问。对于绿地或非代码变更，勘察可用的结构和相关文档。如果源码拿不到，说明这个限制，并在它会实质性影响计划时提问。
        - 把范围、方法和任务建立在你的发现之上。区分观测到的行为、假设和建议的增补；把与既有 spec 的冲突摆到明面上，而不是默默决定谁对。
        - 现在做这个发现，而不是给实现阶段留下泛泛的「探索代码库」或「做个计划」任务。把任何必要的后续调查保持为针对一个未解决问题的具体动作。
      - 如果 `instruction` 字段把创建委托给某个具体技能或命令，就调用它来产出 artifact，而不是自己写这个文件，然后确认 artifact 文件存在于 `resolvedOutputPath`
      - 否则用 `template` 作为结构创建 artifact 文件，并写到 `resolvedOutputPath`。如果 `resolvedOutputPath` 是一个 glob，按 `instruction` 选择具体的文件路径
      - 把 `context` 和 `rules` 作为约束来应用 —— 但**不要**把它们抄进文件
      - 展示简短进度："✓ Created <artifact-id>"

   b. **继续，直到所需集合里的每一个 artifact 都存在（不只是 `apply.requires` 里的那些）**
      - 每创建一个 artifact 之后，重跑 `openspec status --change "<name>" --json`
      - 所需集合是 `applyRequires` 加上从它们出发、沿 `status --json` 里的 `requires` 边可达的每一个 artifact —— 传递地走一遍（spec-driven 会闭包到 proposal、specs、design、tasks）。这个集合之外的 artifact 不要碰
      - `status` 只反映文件存在与否，所以一个 `applyRequires` 里的 artifact 读作 `done` **并不**代表它的依赖存在 —— 提前写 `tasks.md` 会把 `tasks` 标成 done，而 `specs` 从未被写过。用每个 artifact 的 `requires` 边、而不是它的 `status`，来构建所需集合：一个 `done` 的 artifact 仍然列出它依赖什么
      - 已经读作 `status: "skipped"` 的 artifact 就是已满足的：这个 change 在 `.openspec.yaml` 里声明了 `skip_specs`，所以它的文件**绝不能**存在。绝不要试图创建一个
      - 创建所需集合里每一个缺失的 artifact，然后重新检查 —— 创建一个可能解锁其它的
      - 只在以下情况跳过一个：`status` 已经把它报成 `skipped`，或者它自己的 `instruction` 说它是有条件的：跑 `openspec instructions <artifact-id> --change "<name>" --json`，只有它的 `instruction` 字段标记它为可选时（例如 "create only if..."）才跳过。spec-driven 的 `design.md` 符合这一条；`specs` 只能通过上面的 `skipped` 状态符合，绝不能靠你自己的判断。告诉用户，并且不要再重新考虑它
      - 依赖是使能者，不是闸门：如果某个必需的 artifact 仍然只是因为一个你跳过的条件性依赖而 `blocked`，照样写它
      - 当所需集合里的每个 artifact 都是 `done`、`skipped`，或被有意跳过时，停下

   c. **如果某个 artifact 需要用户输入**（上下文严重不清楚）：
      - 请用户澄清
      - 然后继续创建

### 26.12 步骤 5：展示最终状态（Step 5: Show final status）

5. **展示最终状态**
   ```bash
   openspec status --change "<name>"
   ```

### 26.13 输出（Output）

**输出（Output）**

完成所有 artifact 之后，总结：
- change 名字和位置
- 已创建 artifact 的列表及简短说明，外加任何被你跳过的条件性 artifact 及原因
- 什么已就绪："All artifacts needed for implementation are ready."
- 提示："Run `/openspec-apply-change` or ask me to implement to start working on the tasks."

### 26.14 artifact 创建准则（Artifact Creation Guidelines）

**artifact 创建准则（Artifact Creation Guidelines）**

- 遵循 `openspec instructions` 给出的每个 artifact 类型的 `instruction` 字段 —— 它是权威指引，即使对熟悉的 artifact 名字也一样
- 如果 `instruction` 字段指引用某个具体技能或命令来创建这个 artifact，就调用它，而不是直接写这个 artifact
- schema 定义了每个 artifact 该包含什么 —— 遵循它
- 创建新的之前，读取依赖 artifact 作为上下文
- 用 `template` 作为你输出文件的结构 —— 填它的各个分段
- **重要**：`context` 和 `rules` 是给你（agent）的约束，不是文件的内容
  - **不要**把 `<context>`、`<rules>`、`<project_context>` 块抄进 artifact
  - 它们指引你写什么，但绝不应该出现在输出里

### 26.15 护栏（Guardrails）

**护栏（Guardrails）**
- 创建 apply 阶段传递依赖的每一个 artifact，而不只是 `apply.requires` 里列出的那些 id
- 创建新的 artifact 之前始终读取依赖 artifact —— 从磁盘重读，而不是从对话记忆里读（文件可能在你上次看到之后变过）
- 如果上下文严重不清楚，就问用户 —— 但优先做出合理的决定以保持势头
- 如果同名的 change 已经存在，建议改为继续那个 change
- 每写完一个 artifact，在进行到下一个之前确认它的文件存在
