## 22 archive-change —— 归档一个 change

> 译自 `reference/openspec/skills/openspec-archive-change/SKILL.md`（原文 209 行，全文翻译）。按 `READING-openspec.md` 第 22 项。frontmatter、全部 bash 命令、JSON 字段名、输出模板骨架与 CLI 报错码按原样保留。

**frontmatter**

- `name`: `openspec-archive-change`
- `description`: `Archive a completed OpenSpec change in the experimental workflow. Use when the user wants to finalize and archive a change after implementation is complete. Also use when the user says "openspec archive" or "opsx archive".`
- `allowed-tools`: `Bash(openspec:*)`
- `license`: `MIT`
- `compatibility`: `Requires openspec CLI.`
- `metadata.author`: `openspec`
- `metadata.version`: `"1.0"`

### 22.1 开篇（Opening）

在实验性工作流里归档一个已完成的 change。

**store 选择（Store selection）：** 如果用户点名了一个 store（store 是一台机器上注册的、独立的 OpenSpec 仓库），或者工作就住在某个 store 里，跑 `openspec store list --json` 发现已注册的 store id，然后在那些读写 spec 和 change 的命令上传 `--store <id>`（`new change`、`status`、`instructions`、`list`、`show`、`validate`、`archive`、`doctor`、`context`、`schemas`、`view`）。一旦选定，就把 `--store <id>` 当作在整个工作流余下部分里 **sticky**。下面那些命令的每一个未加作用域的例子都是简写：跑之前，把参数补上。例如跑 `openspec status --change "<name>" --json --store "<id>"`，而不是下面展示的未加作用域的形式。其它命令不接受这个参数。命令打印出的提示已经带上了这个参数；后续调用要保持带上它。没有 store 时，命令作用于最近的本 `openspec/` root。

### 22.2 项目检查（Project check）

**项目检查（Project check）：** 这些步骤期望一个已经在用 OpenSpec 的项目。在第一个会写任何东西的步骤之前（`new change`、`archive`、`sync specs`，或撰写一个 artifact 文件），先确认项目有 root：跑 `openspec list --json`（选中 store 时带 `--store <id>`，因为那时 store 就是 root）并读 `root`。一个 root 对象意味着项目已配置好。`"root": null` 意味着没有配置好 —— 这里没有 `openspec/` 目录，而一次写入（比如 `openspec new change`）会作为副作用创建一个。这条命令也会以非零码退出，那是这个答案本身，而不是 CLI 坏了，所以要读 JSON，不要去重试或绕开它。

有一种 `"root": null` 和配置无关：当一条 `status` 错误消息以 `Declared in` 或 `Invalid store declaration in` 开头，并点名了本项目的 `openspec/config.yaml`（或 `config.yml`）时，说明这个项目确实通过一个它声明的 store 在用 OpenSpec，只是这台机器无法解析那个 store（store 未注册，或者 `store:` 那行格式不对）。不要把它当作未初始化并跳过下面的分支：在写入之前停下，把那条错误的 `message` 和 `fix` 给用户看。

### 22.3 无 root 时如何分支（No root: branch on how this workflow was reached）

否则，在没有 root 的情况下，接下来发生什么取决于这个工作流是怎么被触达的：

- **自动选中（Auto-selected）**：你自己选了这个工作流，而用户没有点名 OpenSpec、没有点名这个技能、也没有跑它的 slash command。停止使用 OpenSpec，正常回答这个请求，就像没装 OpenSpec 一样。不要让他们去配置任何东西，也不要提 OpenSpec 的配置。
- **显式 OpenSpec 请求（Explicit OpenSpec request）**：用户点名了 OpenSpec、点名了这个技能，或跑了它的 slash command。在写入之前停下，问怎么继续：把项目配置起来（`openspec init`）、指向他们已有的某个 store（`--store <id>`），还是这次请求不用 OpenSpec。等他们的回答。

两个分支里，都不要把创建 root 当作副作用：用户要求之前不要跑 `openspec init`，不要手工创建 `openspec/` 文件，也不要让任何命令创建它。

### 22.4 capability 路径（Capability path）

`<capability-path>` 是 spec 目录相对于 `specs/` 的路径（例如 `user-auth` 或 `identity/user-auth`）。在解析每个 delta spec 对应的主 spec 时，保留它的完整路径。

### 22.5 输入（Input）

**输入（Input）**：可选地指定一个 change 名。如果省略，检查它是否能从对话上下文推断出来。如果含糊或模棱两可，你**必须**提示可选的 change。

### 22.6 步骤（Steps）

### 22.7 步骤 1：选择 change（Step 1: Select the change）

1. **选择 change（Select the change）**

   如果提供了名字，就用它。否则：
   - 如果用户提到过某个 change，就从对话上下文推断
   - 如果只存在一个活跃 change，就自动选中
   - 如果模棱两可，跑 `openspec list --json` 拿到可选的 change，并让用户选一个

   提示时，只展示活跃的 change（尚未归档的）。
   如果拿得到，把每个 change 所用的 schema 也带上。

   始终宣布："Using change: <name>"，以及如何覆盖它（例如 `/openspec-archive-change <other>`）。

   **在既有的归档检查之前，加载当前的归档输入：**

   解析出选中的 change 和规划 root 之后，跑：
   ```bash
   openspec instructions archive --change "<name>" --json
   ```
   这条命令上保持同样的已选 root 参数。这个查询是建议性的，而且是可选的：它只提供额外的提示输入，所以它绝不该阻塞归档。如果它以非零码退出，或返回无效 JSON —— 例如在一个尚不支持这条命令的旧版 CLI 上 —— 就在没有上下文、也没有操作指引的情况下继续归档工作流。不要报错，也不要停下。

   一次成功的响应可能把两个可选字段都省略掉。把 `context` 当作必需的提示层输入：读它并考虑它，并应用相关的项目事实、约定和约束。把 `operationGuidance` 当作可选的增量建议：读每一条并考虑它，并遵循那些适用、且与内置归档工作流相容的条目。

   把这两个字段跟内置步骤、用户的显式选择、解析出的路径、CLI 检查和命令契约分开。如果 context 与其中某个控制性输入冲突，报告该冲突，并保留那个控制性的值。如果 guidance 不适用，或与某个控制性输入冲突，就不要遵循它并解释为什么。不要从任何一个字段里推断替换路径、跳过的提示或参数，也不要把它们的文本逐字抄进 spec、change artifact 或归档总结，除非用户另外要求。这些是提示层的行为契约，不是可强制执行的检查。

### 22.8 步骤 2：检查 artifact 完成状态（Step 2: Check artifact completion status）

2. **检查 artifact 完成状态（Check artifact completion status）**

   跑 `openspec status --change "<name>" --json` 检查 artifact 完成情况。

   解析这个 JSON 来理解：
   - `schemaName`：正在使用的工作流
   - `planningHome`、`changeRoot`、`artifactPaths` 和 `actionContext`：路径与作用域上下文
   - `artifacts`：所有 artifact 的列表，带有它们的状态（`done`、`skipped`，或其它）

   **如果任何 artifact 既不是 `done` 也不是 `skipped`**（skipped 的 artifact 满足要求 —— 这个 change 声明了 skip_specs）：
   - 显示警告，列出未完成的 artifact
   - 请用户确认他们想继续
   - 用户确认就继续

### 22.9 步骤 3：检查 task 完成状态（Step 3: Check task completion status）

3. **检查 task 完成状态（Check task completion status）**

   用同样的已选 root 参数跑 `openspec list --json`，并在 `changes` 里找到 `name` 与选中的 change 完全匹配的那个条目。
   要求恰好一个匹配，以及非负整数 `totalTasks` 和 `completedTasks`，并且 `completedTasks <= totalTasks`。CLI 会解析 schema 所追踪的 task 文件，包括自定义 artifact 名、输出路径和 glob。
   未完成的 task = `totalTasks - completedTasks`。

   不要从 artifact 状态或顶层 `tasks.md` 的不存在来推断 task 完成情况。如果这次查询失败、返回无效 JSON、省略或重复了选中的 change，或返回无效的计数，就报告问题，并在同步或归档之前停下。
   CLI 只把 `x`/`X` 勾选标记计为完成；
   其它标记，包括不熟悉的标记，都算未完成。

   **如果发现未完成的 task：**
   - 显示警告，展示未完成 task 的数量
   - 请用户确认他们想继续
   - 用户确认就继续

   **如果 `totalTasks` 是零：** 不做 task 相关的警告，直接继续。

### 22.10 步骤 4：评估 delta spec 的同步状态（Step 4: Assess delta spec sync state）

4. **评估 delta spec 的同步状态（Assess delta spec sync state）**

   把 status JSON 里的 `artifactPaths.specs.existingOutputPaths` 当作唯一的 delta spec 来源。如果 `specs` 条目缺失，或 `existingOutputPaths` 是空的，就在没有同步提示的情况下继续，不要从其它 artifact 推断 delta spec。

   **如果 delta spec 存在：**
   - 把每个 delta spec 与它在 `<planningHome.root>/openspec/specs/<capability-path>/spec.md` 对应的主 spec 做比较（用第 2 步里那个 store 感知的 `planningHome.root`，而不是硬编码的仓库路径）
   - 缺失的主 spec **并不自动**等于「已经同步」。对于一个新 capability，主 spec 是同步的*输出*，不是输入：
     - 如果这个 delta 有 MODIFIED 或 RENAMED requirement，就报告只有 ADDED requirement 才能创建一个新的主 spec，并把那个 capability 标为 sync-blocked。绝不要编造一条当前没有版本的 requirement。
     - 否则，如果这个 delta 只有 REMOVED requirement，且这个 change 的 `.openspec.yaml` 声明了 `retire_capabilities: true`，那这个 capability 已经退役：把它算作已同步，警告没有东西可移除，并且不要重建主 spec。现在和在验证一次已完成的同步时，都要应用这条规则。
     - 否则，如果这个 delta 没有 ADDED requirement，就报告无法同步，并把那个 capability 标为 sync-blocked。对于一个只有 REMOVED 的 delta，警告没有可从中移除的主 spec，并让主 spec 树保持不变。`openspec archive` 对未标记的、只有 REMOVED 的情况会以 `Spec must have at least one requirement` 拒绝。
     - 否则，把这个 capability 算作需要同步，并在总结里点名它（`<capability-path>: new main spec will be created`）。如果这个 delta 还有 REMOVED requirement，就警告它们会被忽略，因为没有可从中移除的主 spec。同步只用这个 delta 的 ADDED requirement 来创建主 spec，跟 `openspec archive` 所做的完全一样。
   - 确定会被应用哪些变化（新增、修改、移除、重命名）
   - 即使某个 capability 是 sync-blocked，也继续评估剩余的 capability。在提示之前展示一份合并的总结。

   **提示选项（Prompt options）：**
   - 如果任何 capability 是 sync-blocked：解释原因，并且只提供 "Archive without syncing"、"Cancel"
   - 否则，如果需要变化："Sync now (recommended)"、"Archive without syncing"
   - 否则，如果已经同步："Archive now"、"Sync anyway"、"Cancel"

   按回答路由：
   - "Cancel" —— 停下，不归档
   - "Archive without syncing" 或 "Archive now" —— 继续归档
   - "Sync now" 或 "Sync anyway" —— 同步，然后验证（见下）。当某个 capability 是 sync-blocked 时，不要开始任何同步；解释这个阻塞，并重复可选的选项。
   - 其它任何回答 —— 再问一次，而不是归档

   在一次选定的同步写入任何主 spec 之前，用同样的已选 root 参数跑一次
   `openspec instructions specs --change "<name>" --json`。要求零退出状态和有效的 artifact-instruction
   JSON。如果这次查询失败或返回无效 JSON，就报告错误，并在写入任何主 spec 或移动这个 change 之前停下。一次省略了 `rules` 的有效响应就是无规则的情况。只把返回的 `rules` 应用到这次合并所产出的主 spec 的内容和形式上；不要把它们用作归档指引、改变 CLI 行为，或把规则文本抄进任何输出文件。

   然后为 change '<name>' 内联跑 `openspec-sync-specs` 工作流（agent 驱动的智能合并），把来自上面的 delta spec 分析和取到的 specs 规则快照传进去，并等它结束。这次内联同步必须复用那个快照，不要再去取一次 `specs` instructions。不要把它委托给后台任务 —— 第 5 步会把 `changeRoot` 从一个仍在读它的同步底下移走，结果就是这个 change 被归档了而主 spec 从未更新。如果你的 agent 只能靠委托来跑它，那就同步地委托并等结果。

   然后对这个在 `artifactPaths.specs.existingOutputPaths` 里有 delta spec 的每一个 capability，重跑本步骤开头的那个比较，包括那个显式退役的、缺失 spec 的情况 —— 不只是同步报告说它碰过的那些。一次成功的同步不会留下任何待应用的东西，所以现在每个 capability 都必须读作已同步：
   - ADDED requirement 存在
   - MODIFIED requirement 带着 delta 里点名的 scenario 和描述变化，并且其它 scenario 完好
   - REMOVED requirement 已消失 —— 并且当这次同步退役了一个 capability（移除了它的最后一条 requirement，留下空的 `## Requirements`）时，它的主 spec 是被删除而不是留空；一次被同步有意保留并报告的 spec 也算匹配
   - RENAMED requirement 以新名字存在，以旧名字不存在

   如果同步失败，或任何 capability 不匹配，就报告哪里不同，并停下 —— 不要归档。什么都没有移动，`changeRoot` 完好无损，所以用户可以修掉不匹配，或重跑同步并重新开始归档。

### 22.11 步骤 5：执行归档（Step 5: Perform the archive）

5. **执行归档（Perform the archive）**

   在 `planningHome.changesDir` 下创建一个 `archive` 目录（如果它不存在）：
   ```bash
   mkdir -p "<planningHome.changesDir>/archive"
   ```

   生成目标名字：当 change 名已经以 `YYYY-MM-DD-` 前缀开头时，就原样使用它；否则把当前日期作为 `YYYY-MM-DD-<change-name>` 前置上去。绝不要叠上第二个日期（跟 `openspec archive` 同样的规则）。

   **检查目标是否已经存在：**
   - 如果存在：报错失败，建议重命名已有的归档，或用不同的日期
   - 如果不存在：把 `changeRoot` 移到归档目录

   ```bash
   mv "<changeRoot>" "<planningHome.changesDir>/archive/<target-name>"
   ```

### 22.12 步骤 6：展示总结（Step 6: Display summary）

6. **展示总结（Display summary）**

   展示归档完成总结，包括：
   - change 名字
   - 所用的 schema
   - 归档位置
   - spec 是否被同步（如果适用）
   - 关于任何警告的说明（未完成的 artifact/task）

### 22.13 成功时的输出（Output On Success）

```markdown
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** the archive path derived from `planningHome.changesDir`/<target-name>/
**Specs:** <"✓ Synced to main specs" only if the step 4 verification passed; otherwise "No delta specs" or "Sync skipped">

<"All artifacts complete. All tasks complete." — or, if archived with warnings, list them instead (e.g. "Archived with 2 incomplete tasks")>
```

### 22.14 护栏（Guardrails）

- 宣布选中的 change；当它模棱两可时提示选择
- 用 artifact 图（openspec status --json）做完成度检查
- 不要因为警告就阻塞归档 —— 只是告知并确认
- 移到归档时保留 .openspec.yaml（它跟着目录一起移动）
- 展示关于发生了什么的清晰总结
- 如果请求了同步，就内联跑 `openspec-sync-specs` 工作流（agent 驱动）
- 绝不要在 spec 同步还在途中时归档 —— 内联跑同步，并在移动 `changeRoot` 之前验证主 spec
- 如果 delta spec 存在，始终跑同步评估，并在提示之前展示合并的总结
- 应用相关的运行时上下文并报告冲突；操作指引保持为建议性的
- 考虑每一个 guidance 条目，并解释任何不适用或冲突的建议
- 既有的 CLI 检查、解析出的路径、提示和命令契约保持不变
- artifact 规则只约束正在被写的 spec，绝不是操作指引
- 绝不把运行时上下文、操作指引或 artifact 规则文本逐字抄进输出文件
