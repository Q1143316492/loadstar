## 18 openspec-apply-change —— 实现任务

> 译自 `reference/openspec/skills/openspec-apply-change/SKILL.md`（原文 201 行，全文翻译）。按 `READING-openspec.md` 第 18 项。frontmatter、全部 bash 命令、JSON 字段名、输出模板骨架与 CLI 报错码按原样保留。

**frontmatter**

- `name`: `openspec-apply-change`
- `description`: `Implement tasks from an OpenSpec change. Use when the user wants to start implementing, continue implementation, or work through tasks. Also use when the user says "openspec apply", "opsx apply", or "openspec implement".`
- `allowed-tools`: `Bash(openspec:*)`
- `license`: `MIT`
- `compatibility`: `Requires openspec CLI.`
- `metadata.author`: `openspec`
- `metadata.version`: `"1.0"`

### 18.1 开篇

实现一个 OpenSpec change 里的任务。

**store 选择（Store selection）：** 如果用户点名了一个 store（store 是一台机器上注册的、独立的 OpenSpec 仓库），或者工作就住在某个 store 里，跑 `openspec store list --json` 发现已注册的 store id，然后在那些读写 spec 和 change 的命令上传 `--store <id>`（`new change`、`status`、`instructions`、`list`、`show`、`validate`、`archive`、`doctor`、`context`、`schemas`、`view`）。一旦选定，就把 `--store <id>` 当作在整个工作流余下部分里 **sticky**。下面那些命令的每一个未加作用域的例子都是简写：跑之前，把参数补上。例如跑 `openspec status --change "<name>" --json --store "<id>"`，而不是下面展示的未加作用域的形式。其它命令不接受这个参数。命令打印出的提示已经带上了这个参数；后续调用要保持带上它。没有 store 时，命令作用于最近的本 `openspec/` root。

**项目检查（Project check）：** 这些步骤期望一个已经在用 OpenSpec 的项目。在第一个会写任何东西的步骤之前（`new change`、`archive`、`sync specs`，或撰写一个 artifact 文件），先确认项目有 root：跑 `openspec list --json`（选中 store 时带 `--store <id>`，因为那时 store 就是 root）并读 `root`。一个 root 对象意味着项目已配置好。`"root": null` 意味着没有配置好 —— 这里没有 `openspec/` 目录，而一次写入（比如 `openspec new change`）会作为副作用创建一个。这条命令也会以非零码退出，那是这个答案本身，而不是 CLI 坏了，所以要读 JSON，不要去重试或绕开它。

有一种 `"root": null` 和配置无关：当一条 `status` 错误消息以 `Declared in` 或 `Invalid store declaration in` 开头，并点名了本项目的 `openspec/config.yaml`（或 `config.yml`）时，说明这个项目确实通过一个它声明的 store 在用 OpenSpec，只是这台机器无法解析那个 store（store 未注册，或者 `store:` 那行格式不对）。不要把它当作未初始化并跳过下面的分支：在写入之前停下，把那条错误的 `message` 和 `fix` 给用户看。

否则，在没有 root 的情况下，接下来发生什么取决于这个工作流是怎么被触达的：

- **自动选中（Auto-selected）**：你自己选了这个工作流，而用户没有点名 OpenSpec、没有点名这个技能、也没有跑它的 slash command。停止使用 OpenSpec，正常回答这个请求，就像没装 OpenSpec 一样。不要让他们去配置任何东西，也不要提 OpenSpec 的配置。
- **显式 OpenSpec 请求（Explicit OpenSpec request）**：用户点名了 OpenSpec、点名了这个技能，或跑了它的 slash command。在写入之前停下，问怎么继续：把项目配置起来（`openspec init`）、指向他们已有的某个 store（`--store <id>`），还是这次请求不用 OpenSpec。等他们的回答。

两个分支里，都不要把创建 root 当作副作用：用户要求之前不要跑 `openspec init`，不要手工创建 `openspec/` 文件，也不要让任何命令创建它。

**输入（Input）**：可选地指定一个 change 名（例如 `/openspec-apply-change add-auth`）。如果省略，检查它能否从对话上下文里推断出来。如果模糊或有歧义，你**必须**提示可选的 change。

### 18.2 步骤（Steps）

**1. 选中 change**

如果提供了名字，就用它。否则：
- 如果用户在对话里提到过某个 change，就从上下文里推断
- 如果只有一个活跃 change，就自动选中
- 如果有歧义，跑 `openspec list --json` 拿到可用 change，并让用户选一个

始终声明："Using change: <name>"，以及如何覆盖它（例如 `/openspec-apply-change <other>`）。

**2. 检查状态以理解 schema**
```bash
openspec status --change "<name>" --json
```
解析这个 JSON 来理解：
- `schemaName`：正在使用的工作流（例如 "spec-driven"）
- `planningHome`、`changeRoot` 和 `actionContext`：规划作用域与编辑约束
- 哪个 artifact 装着 tasks（spec-driven 通常是 "tasks"，别的 schema 看 status）

**3. 获取 apply 指令**

```bash
openspec instructions apply --change "<name>" --json
```

它返回：
- `contextFiles`：artifact ID → 具体文件路径数组（随 schema 而变 —— 可能是 proposal/specs/design/tasks，也可能是 spec/tests/implementation/docs）
- 进度（total、complete、remaining）
- 带状态的 task 列表
- 基于当前状态的动态指令
- 可选的 `context`：来自选中 root 的、当前必需的项目指令输入
- 可选的 `operationGuidance`：apply 当前的建议性指引
- `missingArtifacts`（存在时）：没有输出的必需 artifact id

**处理各种状态：**
- 如果 `state: "blocked"`：显示那条消息，暂停实现。
  - 如果 `missingArtifacts` 非空：建议用 `/openspec-continue-change` 创建它们。
  - 否则，遵循 CLI 指令，从既有的规划 artifact 创建或修复 schema 配置的追踪文件。不要假设另一个 artifact 已就绪，也不要在 blocked 期间开始实现。
- 如果 `state: "all_done"`：恭喜，建议归档
- 否则：继续实现

把 `context` 当作必需的 prompt 级输入。读取并考虑它，实现时应用相关的项目事实、约定和约束。
把 `operationGuidance` 当作可选、附加的建议。读取并考虑每一条，并遵循那些适用、且与内置工作流兼容的条目。

把这两个字段与 CLI 返回的状态、缺失 artifact、tasks、进度、`contextFiles` 和内置的 `instruction` 分开。它们不是任务完成的证据，不替代内置指令，也不允许绕过 blocked 状态。如果 context 与内置指令、用户的明确选择或 CLI 控制的某个值冲突，报告冲突并保留起控制作用的那个值。如果指引不适用、或与那些起控制作用的输入冲突，就不要遵循它，并解释原因。这些是 prompt 级的行为契约，不是可强制执行的检查。

**4. 读取上下文文件**

读取 apply 指令输出里 `contextFiles` 下列出的每一个文件路径。
这些文件取决于所用的 schema：
- **spec-driven**：proposal、specs、design、tasks
- 其它 schema：遵循 CLI 输出里的 contextFiles

除非用户另外要求这些内容，否则不要把 `context` 或 `operationGuidance` 逐字抄进实现文件或规划 artifact。

**5. 展示当前进度**

显示：
- 正在使用的 schema
- 进度："N/M tasks complete"
- 剩余任务概览
- 来自 CLI 的动态指令

**6. 实现任务（循环直到完成或受阻）**

对每个待办任务：
- 显示正在处理哪个任务
- 做所需的代码改动
- 保持改动最小且聚焦
- 在 tasks 文件里标记任务完成：`- [ ]` → `- [x]`
- 继续下一个任务

**暂停如果：**
- 任务不清楚 → 请求澄清
- 实现暴露出设计问题 → 建议更新 artifact
- 某个任务需要超出 spec 和 tasks 所描述范围的工作，或者你正想为了让它能塞进去而丢弃、收窄、推迟或接受对既定行为的例外 → 把增加的范围摆到明面上并提问；不要默默吸收它
- 碰到错误或阻碍 → 报告并等指引
- 用户打断

**7. 完成或暂停时，展示状态**

显示：
- 本次会话完成的任务
- 总体进度："N/M tasks complete"
- 如果全部完成：建议归档
- 如果暂停：解释原因并等指引

### 18.3 实现期间的输出（Output During Implementation）

```
## Implementing: <change-name> (schema: <schema-name>)

Working on task 3/7: <task description>
[...implementation happening...]
✓ Task complete

Working on task 4/7: <task description>
[...implementation happening...]
✓ Task complete
```

### 18.4 完成时的输出（Output On Completion）

```
## Implementation Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 7/7 tasks complete ✓

### Completed This Session
- [x] Task 1
- [x] Task 2
...

All tasks complete! You can archive this change with `/openspec-archive-change`.
```

### 18.5 暂停时的输出（输出 On Pause (Issue Encountered)）

```
## Implementation Paused

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 4/7 tasks complete

### Issue Encountered
<description of the issue>

**Options:**
1. <option 1>
2. <option 2>
3. Other approach

What would you like to do?
```

### 18.6 护栏（Guardrails）

- 一直做任务，直到完成或受阻
- 开始之前始终读取上下文文件（来自 apply 指令输出）
- 如果任务有歧义，实现之前先暂停并问
- 如果实现暴露问题，暂停并建议更新 artifact
- 保持代码改动最小，并限定在每个任务的范围内
- 每完成一个任务后立即更新它的 checkbox
- 碰到错误、阻碍或不清楚的需求就暂停 —— 不要猜
- 当一个任务需要超出 spec 所描述的工作时，把增加的范围摆到明面上并暂停 —— 绝不默默收窄、推迟或简化掉既定行为
- 只有当任务的既定行为被完整实现时才标记 `- [x]`，不是部分完成或推迟时
- 用 CLI 输出里的 contextFiles，不要假设具体的文件名
- 不要把 context 或操作指引当作任务已完成的证据
- 应用相关的项目上下文；报告与起控制作用的工作流输入的冲突
- 考虑每一条指引条目；解释任何不适用或冲突的建议
- 不要把运行时上下文或操作指引抄进实现文件或规划 artifact
- 保留 CLI 控制的 blocked/ready/all-done 行为与完成判定标准

### 18.7 流体工作流整合（Fluid Workflow Integration）

这个技能支持「对一个 change 的动作」模型：

- **任何时候都能被调用**：所有 artifact 完成之前（如果 tasks 已存在），部分实现之后，与其它动作交错进行
- **允许更新 artifact**：如果实现暴露设计问题，建议更新 artifact —— 不阶段锁定，流体地工作
