## 20 update-change —— 修订一个 change

> 译自 `reference/openspec/skills/openspec-update-change/SKILL.md`（原文 108 行，全文翻译）。按 `READING-openspec.md` 第 20 项。frontmatter、全部 bash 命令、JSON 字段名与 CLI 报错码按原样保留。

**frontmatter**

- `name`: `openspec-update-change`
- `description`: `Update an OpenSpec change by revising its existing planning artifacts and keeping them coherent with one another. Use when the user wants to revise a change's plan, fold new decisions into it, or reconcile its artifacts after an edit. Also use when the user says "openspec update change" or "opsx update". If the user means the openspec update CLI command, which refreshes generated files, run that command instead. Never edits code.`
- `allowed-tools`: `Bash(openspec:*)`
- `license`: `MIT`
- `compatibility`: `Requires openspec CLI.`
- `metadata.author`: `openspec`
- `metadata.version`: `"1.0"`

### 20.1 开篇

修订一个 change 已有的规划 artifact，并保持它们彼此连贯。绝不编辑代码。

### 20.2 store 选择（Store selection）

**store 选择（Store selection）：** 如果用户点名了一个 store（store 是一台机器上注册的、独立的 OpenSpec 仓库），或者工作就住在某个 store 里，跑 `openspec store list --json` 发现已注册的 store id，然后在那些读写 spec 和 change 的命令上传 `--store <id>`（`new change`、`status`、`instructions`、`list`、`show`、`validate`、`archive`、`doctor`、`context`、`schemas`、`view`）。一旦选定，就把 `--store <id>` 当作在整个工作流余下部分里 **sticky**。下面那些命令的每一个未加作用域的例子都是简写：跑之前，把参数补上。例如跑 `openspec status --change "<name>" --json --store "<id>"`，而不是下面展示的未加作用域的形式。其它命令不接受这个参数。命令打印出的提示已经带上了这个参数；后续调用要保持带上它。没有 store 时，命令作用于最近的本 `openspec/` root。

### 20.3 项目检查（Project check）

**项目检查（Project check）：** 这些步骤期望一个已经在用 OpenSpec 的项目。在第一个会写任何东西的步骤之前（`new change`、`archive`、`sync specs`，或撰写一个 artifact 文件），先确认项目有 root：跑 `openspec list --json`（选中 store 时带 `--store <id>`，因为那时 store 就是 root）并读 `root`。一个 root 对象意味着项目已配置好。`"root": null` 意味着没有配置好 —— 这里没有 `openspec/` 目录，而一次写入（比如 `openspec new change`）会作为副作用创建一个。这条命令也会以非零码退出，那是这个答案本身，而不是 CLI 坏了，所以要读 JSON，不要去重试或绕开它。

### 20.4 一种与配置无关的 `"root": null`

有一种 `"root": null` 和配置无关：当一条 `status` 错误消息以 `Declared in` 或 `Invalid store declaration in` 开头，并点名了本项目的 `openspec/config.yaml`（或 `config.yml`）时，说明这个项目确实通过一个它声明的 store 在用 OpenSpec，只是这台机器无法解析那个 store（store 未注册，或者 `store:` 那行格式不对）。不要把它当作未初始化并跳过下面的分支：在写入之前停下，把那条错误的 `message` 和 `fix` 给用户看。

### 20.5 没有 root 时，取决于工作流是怎么被触达的

否则，在没有 root 的情况下，接下来发生什么取决于这个工作流是怎么被触达的：

- **自动选中（Auto-selected）**：你自己选了这个工作流，而用户没有点名 OpenSpec、没有点名这个技能、也没有跑它的 slash command。停止使用 OpenSpec，正常回答这个请求，就像没装 OpenSpec 一样。不要让他们去配置任何东西，也不要提 OpenSpec 的配置。
- **显式 OpenSpec 请求（Explicit OpenSpec request）**：用户点名了 OpenSpec、点名了这个技能，或跑了它的 slash command。在写入之前停下，问怎么继续：把项目配置起来（`openspec init`）、指向他们已有的某个 store（`--store <id>`），还是这次请求不用 OpenSpec。等他们的回答。

两个分支里，都不要把创建 root 当作副作用：用户要求之前不要跑 `openspec init`，不要手工创建 `openspec/` 文件，也不要让任何命令创建它。

### 20.6 输入（Input）

**输入（Input）**：可选地指定一个 change 名。如果省略了，就看看它能不能从对话上下文里推断出来。如果含糊或模棱两可，你**必须**提示用户从可用的 change 里选一个。

这个工作流修订的是已经存在的 artifact；那些还不存在的，是由 `/openspec-continue-change` 创建的。

### 20.7 步骤（Steps）

**Steps**

### 20.8 步骤 1：选择这个 change（Select the change）

1. **选择这个 change**

   如果提供了名字，就用它。否则：
   - 如果用户提到过某个 change，就从对话上下文里推断
   - 如果只存在一个活跃 change，就自动选中它
   - 如果模棱两可，跑 `openspec list --json` 拿到按最近修改时间排序的可用 change，并让用户选一个

   提示时，把最近修改的 3-4 个 change 作为选项呈现出来，展示：
   - change 名字
   - 状态（例如 "0/5 tasks"、"complete"、"no tasks"）
   - 它有多久没被改过（来自 `lastModified` 字段）

   把最近修改的那个 change 标成 "(Recommended)"，因为它很可能就是用户想更新的那个。

   始终宣布："Using change: <name>"，以及如何覆盖它（例如 `/openspec-update-change <other>`）。

### 20.9 步骤 2：拿到这个 change 的 artifact（Get the change's artifacts）

2. **拿到这个 change 的 artifact**
   ```bash
   openspec status --change "<name>" --json
   ```
   解析这个 JSON 来理解当前状态。响应包含：
   - `schemaName`：正在使用的工作流 schema（例如 "spec-driven"）
   - `artifacts`：artifact 的数组，带它们的状态（"done"、"skipped"、"ready"、"blocked"）
   - `isPlanningComplete`：布尔值，表示所有规划 artifact 是否都已完成。更旧的 CLI 版本用 `isComplete` 暴露同一个值。
   - `planningHome`、`changeRoot`、`artifactPaths` 和 `actionContext`：路径与作用域上下文。用它们，而不是假设仓库相对的路径。

   artifact 的 id 和路径来自当前生效的 schema —— **不要**假设它们，也**不要**对硬编码的 artifact 名字做分支判断。自定义 schema 必须原样可用。

   要编辑的文件是 `artifactPaths.<id>.existingOutputPaths` —— 磁盘上真实存在的那几个具体文件，对 glob artifact 来说已经做过 glob 展开（例如 `specs/**/*.md`）。**不要**写 `resolvedOutputPath`：对一个 glob artifact 来说，它仍然是 glob 模式，不是一个真实文件。

### 20.10 步骤 3：理解请求（Understand the request）

3. **理解请求**
   - 如果用户要求的是某个具体修订（"the design now uses X"），那就是起始的编辑。
   - 如果他们只说了 "update" / "make this coherent"，就把它当作一次连贯性评审：读已有的 artifact，拿它们互相检查矛盾、缺口和重复。

### 20.11 步骤 4：阅读并调和（Read and reconcile）

4. **阅读并调和**
   - 读这次请求触及的 artifact，以及这个 change 其它已存在的 artifact。
   - 在对话里、而不是在文件里起草这次请求的编辑。把「它到底改了什么」想清楚；所有写入都归步骤 5 管。然后拿起草好的编辑去检查每一个其它已存在的 artifact —— 方向是**任意**的：改一个较晚的 artifact 也可能需要回头修订一个较早的，而不只是反过来。构建顺序是有用的阅读顺序，不是对「哪些 artifact 可以被修订」的约束。
   - 记下所有现在变得不一致、缺失或互相矛盾的东西。
   - 对已经存在的文件（`existingOutputPaths`）提出修订。如果某个 artifact 没有已存在的输出文件、且状态是 `ready` 或 `blocked`，记下这一点，并把用户指向 `/openspec-continue-change` 去创建它们。`skipped` 的 artifact 保持不动；不要把它们当作缺失，也不要推迟给 continue 工作流。
   - 一个 glob artifact（例如 `specs/**/*.md`）在至少有一个文件匹配之后就被标成 `done`，而 continue 工作流只处理 `ready` 的 artifact。当调和识别出某个 glob artifact 缺一个文件、而它的 `existingOutputPaths` 非空时：
     1. 跑 `openspec instructions "<artifact-id>" --change "<name>" --json`，用它的 `instruction` 和 `template`。把 `context` 和 `rules` 当作约束；不要把它们抄进文件。如果 instructions 报 `skipped: true`，不要创建这个文件。从磁盘读当前的依赖文件；如果某个必需的、未跳过的依赖缺失，停下并先请用户恢复它。
     2. 在 `changeRoot` 里选一个具体路径，它要匹配 `artifactPaths.<id>.outputPath`、且尚不存在。在解析了任何符号链接的父目录之后，验证它仍在 `changeRoot` 内。glob 的 `resolvedOutputPath` 不是有效目标。
     3. 把这个新文件纳入步骤 5 提议的修订里，并且只在用户确认之后才创建它。
     4. 确认之后、创建之前的那一刻，刷新 status 和 instructions。验证这个 artifact 仍在范围内、没有被跳过、且是部分填充的；把上面那些具体路径检查重做一遍。
     5. 用一个如果目标已存在就会失败的创建操作。如果 `instruction` 把创建委托给另一个技能或命令，只在它能遵守已确认的路径和这些护栏时才调用它；否则停下。如果任何检查失败，或已确认的草稿不再有效，就停下并与用户调和，而不是替换已有内容或另选一个路径。
   - 如果这个 change 已经连贯，就说明这一点，不提任何修订。

### 20.12 步骤 5：逐个确认并应用（Confirm and apply, one artifact at a time）

5. **逐个 artifact 确认并应用**
   - 这一步执行本工作流里的每一次 artifact 写入；没有更早的步骤会编辑 artifact。
   - 展示每一条提议的修订以及原因 —— 包括步骤 4 里起草的那次请求的编辑。只在用户确认之后才写入。
   - 如果用户拒绝某条修订，就不要写它 —— 让那个 artifact 保持不变。
   - 当需要一次大幅重写时，先拿到那个 artifact 的 rules 和 template：
     ```bash
     openspec instructions "<artifact-id>" --change "<name>" --json
     ```

### 20.13 步骤 6：指向下一步（仅指路 —— 绝不代跑）

6. **指向下一步（guidance only - NEVER act on it）**
   - `existingOutputPaths` 为空、且状态是 `ready` 或 `blocked` 的 artifact -> 建议用 `/openspec-continue-change` 去创建它们。
   - change 已经实现（task 已勾掉 / 已 apply）-> 代码可能不再匹配修订后的计划；建议用 `/openspec-apply-change` 把这个 delta 带进代码。
   - 一切都完成并实现了 -> 建议 `/openspec-archive-change`。

### 20.14 输出（Output）

**Output**

每次调用之后，展示：
- 哪些 artifact 被修订了（以及哪些提议的修订被拒绝了）
- 在一个已经部分填充的 glob artifact 下创建的任何文件
- 任何被推迟给 `/openspec-continue-change` 的东西（还没有文件、且状态是 `ready` 或 `blocked` 的 artifact，绝不是 `skipped` 的 artifact）
- 这个 change 现在处在什么位置，以及推荐的下一条命令

### 20.15 护栏（Guardrails）

**Guardrails**
- 只碰规划 artifact —— **绝不**编辑实现代码。如果修订后的计划意味着代码改动，停下并指向 `/openspec-apply-change`。
- 用 `openspec status` 报告的 artifact id 和路径；绝不对硬编码的 artifact 名字做分支判断。
- 只编辑 `existingOutputPaths` 里的具体文件；绝不写 glob 的 `resolvedOutputPath`。
- 不要推进构建边界：如果某个 artifact 的 `existingOutputPaths` 为空、且状态是 `ready` 或 `blocked`，那是 `/openspec-continue-change` 的活。`skipped` 的 artifact 保持不动。唯一的新建文件范围，是一个 glob artifact 下、其 `existingOutputPaths` 非空的、已确认的具体路径。
- 每一次编辑写入之前，都先与用户确认。
- 如果这次请求改变的是这个 change 的*意图*，而不是对它的精化，建议用 `/openspec-new-change` 重新开始（"Update vs. Start Fresh" 启发式）。
