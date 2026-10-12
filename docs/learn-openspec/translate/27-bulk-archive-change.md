## 27 bulk-archive-change —— 批量归档

> 译自 `reference/openspec/skills/openspec-bulk-archive-change/SKILL.md`（原文 374 行，全文翻译）。按 `READING-openspec.md` 第 27 项。frontmatter、全部 bash 命令、JSON 字段名、输出模板骨架与 CLI 报错码按原样保留。

**frontmatter**

- `name`: `openspec-bulk-archive-change`
- `description`: `Archive multiple completed OpenSpec changes at once. Use when archiving several parallel changes. Also use for a plural archive request - "openspec bulk-archive", "opsx bulk-archive", "openspec archive all", or "openspec archive these changes".`
- `allowed-tools`: `Bash(openspec:*)`
- `license`: `MIT`
- `compatibility`: `Requires openspec CLI.`
- `metadata.author`: `openspec`
- `metadata.version`: `"1.0"`

### 27.1 开篇（Opening）

在一次操作里归档多个已完成的 change。

这个技能让你批量归档 change，通过检查代码库来判断实际实现了什么，从而智能地处理 spec 冲突。

### 27.2 store 选择（Store selection）

**store 选择（Store selection）：** 如果用户点名了一个 store（store 是一台机器上注册的、独立的 OpenSpec 仓库），或者工作就住在某个 store 里，跑 `openspec store list --json` 发现已注册的 store id，然后在那些读写 spec 和 change 的命令上传 `--store <id>`（`new change`、`status`、`instructions`、`list`、`show`、`validate`、`archive`、`doctor`、`context`、`schemas`、`view`）。一旦选定，就把 `--store <id>` 当作在整个工作流余下部分里 **sticky**。下面那些命令的每一个未加作用域的例子都是简写：跑之前，把参数补上。例如跑 `openspec status --change "<name>" --json --store "<id>"`，而不是下面展示的未加作用域的形式。其它命令不接受这个参数。命令打印出的提示已经带上了这个参数；后续调用要保持带上它。没有 store 时，命令作用于最近的本 `openspec/` root。

### 27.3 项目检查（Project check）

**项目检查（Project check）：** 这些步骤期望一个已经在用 OpenSpec 的项目。在第一个会写任何东西的步骤之前（`new change`、`archive`、`sync specs`，或撰写一个 artifact 文件），先确认项目有 root：跑 `openspec list --json`（选中 store 时带 `--store <id>`，因为那时 store 就是 root）并读 `root`。一个 root 对象意味着项目已配置好。`"root": null` 意味着没有配置好 —— 这里没有 `openspec/` 目录，而一次写入（比如 `openspec new change`）会作为副作用创建一个。这条命令也会以非零码退出，那是这个答案本身，而不是 CLI 坏了，所以要读 JSON，不要去重试或绕开它。

### 27.4 一种与配置无关的 `"root": null`

有一种 `"root": null` 和配置无关：当一条 `status` 错误消息以 `Declared in` 或 `Invalid store declaration in` 开头，并点名了本项目的 `openspec/config.yaml`（或 `config.yml`）时，说明这个项目确实通过一个它声明的 store 在用 OpenSpec，只是这台机器无法解析那个 store（store 未注册，或者 `store:` 那行格式不对）。不要把它当作未初始化并跳过下面的分支：在写入之前停下，把那条错误的 `message` 和 `fix` 给用户看。

### 27.5 无 root 时如何分支（No root: branch on how this workflow was reached）

否则，在没有 root 的情况下，接下来发生什么取决于这个工作流是怎么被触达的：

- **自动选中（Auto-selected）**：你自己选了这个工作流，而用户没有点名 OpenSpec、没有点名这个技能、也没有跑它的 slash command。停止使用 OpenSpec，正常回答这个请求，就像没装 OpenSpec 一样。不要让他们去配置任何东西，也不要提 OpenSpec 的配置。
- **显式 OpenSpec 请求（Explicit OpenSpec request）**：用户点名了 OpenSpec、点名了这个技能，或跑了它的 slash command。在写入之前停下，问怎么继续：把项目配置起来（`openspec init`）、指向他们已有的某个 store（`--store <id>`），还是这次请求不用 OpenSpec。等他们的回答。

两个分支里，都不要把创建 root 当作副作用：用户要求之前不要跑 `openspec init`，不要手工创建 `openspec/` 文件，也不要让任何命令创建它。

### 27.6 capability 路径（Capability path）

`<capability-path>` 是 spec 目录相对于 `specs/` 的路径（例如 `user-auth` 或 `identity/user-auth`）。在解析每个 delta spec 对应的主 spec 时，保留它的完整路径。

### 27.7 输入（Input）

**输入（Input）**：无需提供（会提示选择）

### 27.8 步骤（Steps）

**步骤（Steps）**

### 27.9 步骤 1：获取活跃的 change（Step 1: Get active changes）

1. **获取活跃的 change（Get active changes）**

   跑 `openspec list --json` 拿到所有活跃的 change。

   如果没有活跃的 change，告知用户并停下。

### 27.10 步骤 2：提示选择 change（Step 2: Prompt for change selection）

2. **提示选择 change（Prompt for change selection）**

   请用户选择 change（多选）：
   - 从 list 输出里展示每个 change 的名字和任务状态
   - 包含一个 "All changes" 选项
   - 允许任意数量的选择（1+ 可以，2+ 是典型用例）

   **重要**：不要自动选中。始终让用户选。

   **在批量校验之前，为选中的 root 加载一次当前的归档输入：**

   从这个 root 里挑一个选中的 change，用同样的已选 root 参数跑
   `openspec instructions archive --change "<selected-change>" --json`。
   这次查询是建议性的，而且是可选的：它只提供额外的提示输入，所以它绝不能阻塞这个批次。如果它失败，或返回无效的 JSON —— 例如在一个尚不支持这条命令的旧版 CLI 上 —— 就在没有上下文、也没有操作指引的情况下继续这个批次。不要报错，也不要停下。

   一次有效的响应可能把 `context` 和 `operationGuidance` 都省略掉。把 `context` 当作整个批次里必需的提示层输入：读它并考虑它，并应用相关的项目事实、约定和约束。把 `operationGuidance` 当作可选的增量建议：读每一条并考虑它，并遵循那些适用、且与内置批量工作流相容的条目。

   把这两个字段与冲突分析、用户的明确选择、解析出的路径、CLI 检查和命令契约分开。如果 context 与其中某个起控制作用的输入冲突，就报告冲突并保留那个起控制作用的值。如果指引不适用，或与某个起控制作用的输入冲突，就不要遵循它，并解释原因。不要从任何一个字段推断被跳过的提示、替换路径或参数，也不要把它们的文本逐字抄进 spec、change 或总结里。这些是提示层的行为契约，不是可强制执行的检查。

### 27.11 步骤 3：批量校验 —— 为所有选中的 change 收集状态（Step 3: Batch validation - gather status for all selected changes）

3. **批量校验 —— 为所有选中的 change 收集状态（Batch validation - gather status for all selected changes）**

   用同样的已选 root 参数跑一次 `openspec list --json` 拿任务进度。如果这次查询失败、返回无效 JSON、遗漏任何一个选中的 change、包含重复的选中 change，或返回无效的计数，就报告这个问题，并在同步或归档这个批次之前停下。

   对每一个选中的 change，收集：

   a. **Artifact 状态** - 跑 `openspec status --change "<name>" --json`
      - 解析 `schemaName`、`artifacts`、`planningHome`、`changeRoot`、`artifactPaths` 和 `actionContext`
      - 记下哪些 artifact 是 `done`，哪些是别的状态

   b. **任务完成度** - 从 list 响应里找到 `name` 与这个 change 完全匹配的那个 `changes` 条目
      - 要求 `totalTasks` 和 `completedTasks` 是满足 `completedTasks <= totalTasks` 的非负整数
      - 未完成的 task = `totalTasks - completedTasks`
      - CLI 解析该 schema 追踪的任务文件，包括自定义 artifact 名、输出路径和 glob
      - 不要从 artifact 状态、id 为 `tasks` 的 artifact，或缺少顶层 `tasks.md` 来推断任务完成度
      - CLI 只把 `x`/`X` 复选框标记算作完成；其它标记都算未完成
      - 如果 `totalTasks` 是零，记为 "No tasks"

   c. **Delta spec** - 从 status JSON 里检查 `artifactPaths.specs.existingOutputPaths`
      - 列出存在哪些 capability spec
      - 对每一个，提取 requirement 名（匹配 `### Requirement: <name>` 的行）
      - 把这个列表当作唯一的 delta spec 来源。如果 `specs` 条目缺失，或这个列表为空，就不要为那个 change 做任何 spec 同步或 specs-instruction 查询；不要从无关的 artifact 推断 delta。
      - 对每一个 change 独立地评估这一点，包括那些某些 schema 没有 `specs` artifact 的混合 schema 批次。

   d. **归档目标** - 为每个 change 计算一次目标名字，并把它记为该 change 的 `<target-name>`
      - 当 change 名已经以 `YYYY-MM-DD-` 前缀开头时，就原样使用它；否则把当前日期作为 `YYYY-MM-DD-<name>` 前置上去（跟 `openspec archive` 同样的规则）
      - 检查 `<planningHome.changesDir>/archive/<target-name>` 是否已经存在
      - 如果它已经存在，或者另一个选中的 change 解析出同一个目标名字，就把每一个这样的 change 标为 `Blocked`，附上 `Archive directory already exists`
      - 被阻塞的 change 永远不会被同步或移动：在第 6 步的表里把它显示为 `Blocked`，把它排除在冲突解决之外（只用其它 change 来解决它的冲突），并在第 8d 步把它记为 Failed
      - 在任何主 spec 被写入之前于这里检查，与 `openspec archive` 一致：一次在同步之后才发现的碰撞，会让主 spec 为一个从未发生的归档被改写

### 27.12 步骤 4：检测 spec 冲突（Step 4: Detect spec conflicts）

4. **检测 spec 冲突（Detect spec conflicts）**

   构建一张以 `<capability-path>`（相对于 `specs/` 的精确路径）为键的映射：

   ```text
   identity/user-auth -> [change-a, change-b]  <- CONFLICT (2+ changes)
   billing/user-auth  -> [change-c]            <- OK (different full path)
   ```

   当 2+ 个选中的 change 为完全相同的 `<capability-path>` 准备了 delta spec 时，就存在冲突。

### 27.13 步骤 5：以 agent 方式解决冲突（Step 5: Resolve conflicts agentically）

5. **以 agent 方式解决冲突（Resolve conflicts agentically）**

   **对每一个冲突**，调查代码库：

   a. **读 delta spec** —— 从每一个冲突的 change 读，理解每一方声称要新增/修改什么

   b. **搜索代码库** —— 找实现证据：
      - 找实现了每个 delta spec 里 requirement 的代码
      - 检查相关文件、函数或测试

   c. **确定解决方案**：
      - 如果只有一个 change 实际被实现了 -> 同步那一个的 spec
      - 如果两个都实现了 -> 按时间顺序应用（较早的先，较新的覆盖）
      - 如果两个都没实现 -> 跳过 spec 同步，警告用户

   d. **记录解决方案** —— 对每一个冲突：
      - 对每一份 delta spec 的纳入或排除决策，以 change 和 `<capability-path>` 为键
      - 要应用哪些被纳入的 delta spec，以及按什么顺序
      - 哪些 delta spec 因为实现缺失而要排除在同步之外
      - 理由（在代码库里发现了什么）

### 27.14 步骤 6：展示合并后的状态表（Step 6: Show consolidated status table）

6. **展示合并后的状态表（Show consolidated status table）**

   展示一张总结所有 change 的表：

   ```markdown
   | Change              | Artifacts | Tasks | Specs   | Conflicts | Status |
   |---------------------|-----------|-------|---------|-----------|--------|
   | schema-management   | Done      | 5/5   | 2 delta | None      | Ready  |
   | project-config      | Done      | 3/3   | 1 delta | None      | Ready  |
   | add-oauth           | Done      | 4/4   | 1 delta | identity/user-auth (!) | Ready* |
   | add-verify-skill    | 1 left    | 2/5   | None    | None      | Warn   |
   ```

   对冲突，展示解决方案：
   ```text
   * Conflict resolution:
     - identity/user-auth spec: Will apply add-oauth then add-jwt (both implemented, chronological order)
   ```

   对未完成的 change，展示警告：
   ```text
   Warnings:
   - add-verify-skill: 1 incomplete artifact, 3 incomplete tasks
   ```

### 27.15 步骤 7：确认批量操作（Step 7: Confirm batch operation）

7. **确认批量操作（Confirm batch operation）**

   问用户一个单独的确认问题：

   - "Archive N changes?"，选项取决于状态
   - 选项可能包括：
     - "Archive all N changes"
     - "Archive only N ready changes (skip incomplete)"
     - "Cancel"

   如果有未完成的 change，说清楚它们会带着警告被归档。

   按意图、而不是按精确标签来对回答做路由 —— 这些标签是你写的，所以要匹配用户选了什么，而不是上面的措辞：
   - "Cancel" —— 停下，不归档。报告什么都没有被归档，并跳过余下的步骤。
   - 全部归档那个选项 —— 对每一个不是 `Blocked` 的选中 change 继续
   - 只归档就绪项那个选项 —— 只对第 6 步的表标为 `Ready` 或 `Ready*` 的 change 继续，并在第 8d 步把其余的记为 Skipped，除了 `Blocked` 的 change，它们保持 Failed 并附上 `Archive directory already exists`。如果一个 `Ready*` 的 change 的冲突伙伴被跳过，就只用正在被归档的那些 change 重新推导那个冲突的解决方案。
   - 其它任何回答 —— 再问一次，而不是归档

   在第 8 步写入第一份主 spec 或移动任何 change 之前，为已确认的批次取回每一份必需的 specs 规则快照。对每一个将要同步具体的 `artifactPaths.specs.existingOutputPaths` 的 change，用同样的已选 root 参数恰好跑一次 `openspec instructions specs --change "<name>" --json`。在第一次写入或移动之前拿到所有快照。如果任何一次查询以非零码退出，或返回无效的 artifact-instruction JSON，就点名受影响的 change，报告错误，并在任何主 spec 写入或 change 移动之前停下整个批次。不要把查询失败当作省略了规则。一次没有 `rules` 的有效响应就是无规则的情况。

### 27.16 步骤 8：对每个已确认的 change 执行归档（Step 8: Execute archive for each confirmed change）

8. **对每个已确认的 change 执行归档（Execute archive for each confirmed change）**

   开始处理之前，把第 5 步记录下来的决策（经过第 7 步的任何重新推导之后）搬进两个按 delta 分组的集合：
   - `includedDeltas`：来自已确认 change 的所有非冲突 delta spec，加上被选中用于同步的冲突 delta
   - `excludedDeltas`：来自已确认 change 的、因为实现缺失而被排除的冲突 delta
   - 一个 change 可以同时有被纳入和被排除的 delta spec。把决策保持在每个 delta 上；不要把它压缩成一个按 change 的同步标志。

   按确定下来的顺序处理 change（遵守冲突解决）：

   a. **同步被纳入的 delta spec**：
      - 只对在 `includedDeltas` 里有条目的 change 内联跑 `openspec-sync-specs` 工作流（agent 驱动的智能合并），只把被纳入的 delta 路径传进去，并明确指示它忽略那个 change 的 `excludedDeltas`。等它结束。
      - 对冲突，按解决后的顺序应用。
      - 把那个 change 取到的 specs 规则快照传进内联同步；内联同步必须复用它，不要再去取一次 instructions
      - 只把 artifact 规则应用到那个 change 产出的主 spec 上。它们不改变冲突解决、归档行为或 CLI 契约，它们的文本也不会被抄进输出文件
      - 不要委托给一个后台任务 —— 第 8c 步会把 `changeRoot` 从一个仍在读它的同步底下移走。
      - 如果一个 change 没有被纳入的 delta spec，就不要为它跑同步工作流。

   b. **在移动 changeRoot 之前验证被纳入的 delta spec**：
      - 只对 `includedDeltas` 里的 delta spec 重跑那个比较，与 `<planningHome.root>/openspec/specs/<capability-path>/spec.md` 处的主 spec 比（用第 3 步 status JSON 里那个 store 感知的 `planningHome.root`，而不是硬编码的仓库路径）。
      - 验证主 spec 被更新了：
        - ADDED requirement 存在
        - MODIFIED requirement 带着 delta 里点名的 scenario 和描述变化，并且其它 scenario 完好
        - REMOVED requirement 已消失 —— 并且当这次同步退役了一个 capability（移除了它的最后一条 requirement，留下空的 `## Requirements`）时，它的主 spec 是被删除而不是留空；一次被同步有意保留并报告的 spec 也算匹配
        - RENAMED requirement 以新名字存在，以旧名字不存在
      - 不要验证 `excludedDeltas` 里的 delta spec；它们被有意留在未同步状态。
      - 如果同步失败，或任何 capability 不匹配验证，就报告哪里不同，并让移动那个 change 的 `changeRoot` 失败/跳过 —— 不要归档那个 change。`changeRoot` 保持完好无损。

   c. **执行归档**：

      目标名字：用第 3d 步为这个 change 记录的 `<target-name>`，不变。绝不要在这里重新计算它：一个跑过午夜的批次会在第 3 步检查一个日期，却移动到另一个日期。

      **检查目标是否已经存在：**
      - 在移动之前立刻再检查一次，即使第 3 步已经检查过：目标可能在批次中途出现
      - 如果存在：把这个 change 记为 Failed 并附上 `Archive directory already exists`，把 `changeRoot` 留在原处，报告第 8a 步已经为它同步的任何主 spec，并带着余下的 change 继续
      - 如果不存在：把 `changeRoot` 移到归档目录

      ```bash
      mkdir -p "<planningHome.changesDir>/archive"
      mv "<changeRoot>" "<planningHome.changesDir>/archive/<target-name>"
      ```

      **确认这次移动没有嵌套：** 即使目标在检查之后才出现、把 change 移进了它*内部*，`mv` 也会以 0 退出。如果 `<planningHome.changesDir>/archive/<target-name>/<change-directory-name>`（`changeRoot` 的最后一段路径）现在存在，就把那个目录移回 `changeRoot`，并把这个 change 记为 Failed 并附上 `Archive directory already exists`。绝不要把它报告为已归档。

   d. **跟踪结果** —— 对每个 change：
      - Success：成功归档
      - Failed：归档或 spec 验证期间出错（记录错误）
      - Skipped：用户选择不归档（如果适用）
      - Sync skipped：对 `excludedDeltas` 里的每一个 delta，报告 `sync skipped`，带上 change、`<capability-path>` 和记录下来的原因。这与跳过归档不同。

### 27.17 步骤 9：展示总结（Step 9: Display summary）

9. **展示总结（Display summary）**

   展示最终结果：

   ```markdown
   ## Bulk Archive Complete

   Archived 3 changes:
   - schema-management-cli -> archive/2026-01-19-schema-management-cli/
   - project-config -> archive/2026-01-19-project-config/
   - add-oauth -> archive/2026-01-19-add-oauth/

   Skipped 1 change:
   - add-verify-skill (user chose not to archive incomplete)

   Spec sync summary:
   - 4 delta specs synced to main specs
   - 1 delta spec sync skipped (add-jwt, identity/user-auth: implementation not found)
   - 1 conflict resolved (identity/user-auth: synced add-oauth, skipped add-jwt)
   ```

   如果有任何失败：
   ```text
   Failed 1 change:
   - some-change: Archive directory already exists
   ```

### 27.18 冲突解决示例（Conflict Resolution Examples）

示例 1：只有一个被实现
```text
Conflict: <planningHome.root>/openspec/specs/auth/spec.md touched by [add-oauth, add-jwt]

Checking add-oauth:
- Delta adds "OAuth Provider Integration" requirement
- Searching codebase... found src/auth/oauth.ts implementing OAuth flow

Checking add-jwt:
- Delta adds "JWT Token Handling" requirement
- Searching codebase... no JWT implementation found

Resolution: Only add-oauth is implemented. Will sync add-oauth specs only.
```

示例 2：两个都被实现
```text
Conflict: <planningHome.root>/openspec/specs/api/spec.md touched by [add-rest-api, add-graphql]

Checking add-rest-api (created 2026-01-10):
- Delta adds "REST Endpoints" requirement
- Searching codebase... found src/api/rest.ts

Checking add-graphql (created 2026-01-15):
- Delta adds "GraphQL Schema" requirement
- Searching codebase... found src/api/graphql.ts

Resolution: Both implemented. Will apply add-rest-api specs first,
then add-graphql specs (chronological order, newer takes precedence).
```

### 27.19 成功时的输出（Output On Success）

**成功时的输出（Output On Success）**

```markdown
## Bulk Archive Complete

Archived N changes:
- <change-1> -> archive/<target-name-1>/
- <change-2> -> archive/<target-name-2>/

Spec sync summary:
- N delta specs synced to main specs
- No conflicts (or: M conflicts resolved)
```

### 27.20 部分成功时的输出（Output On Partial Success）

**部分成功时的输出（Output On Partial Success）**

```markdown
## Bulk Archive Complete (partial)

Archived N changes:
- <change-1> -> archive/<target-name-1>/

Skipped M changes:
- <change-2> (user chose not to archive incomplete)

Failed K changes:
- <change-3>: Archive directory already exists
```

### 27.21 无 change 时的输出（Output When No Changes）

**无 change 时的输出（Output When No Changes）**

```markdown
## No Changes to Archive

No active changes found. Create a new change to get started.
```

### 27.22 护栏（Guardrails）

**护栏（Guardrails）**
- 允许任意数量的 change（1+ 可以，2+ 是典型用例）
- 始终提示选择，绝不自动选中
- 尽早检测 spec 冲突，并靠检查代码库来解决
- 当两个 change 都被实现时，按时间顺序应用 spec
- 只在实现缺失时才跳过 spec 同步（警告用户）
- 确认之前展示清晰的按 change 状态
- 整个批次用一次确认
- 用户取消确认之后绝不归档 —— 被取消的批次什么都不归档
- 跟踪并报告所有结果（success/skip/fail）
- 移到归档时保留 .openspec.yaml
- 归档目录目标用当前日期，在第 3d 步算一次并在移动时复用：YYYY-MM-DD-<name>；已经以 `YYYY-MM-DD-` 前缀开头的名字按原样使用（绝不叠上第二个日期）
- 如果归档目标存在，让那个 change 失败，但带着其它 change 继续
- 在第 3 步、第一次主 spec 写入之前检查每一个归档目标；目标已存在的 change 永远不会被同步或移动
- 如果请求了同步，就对每个有被纳入 delta spec 的 change 内联跑 `openspec-sync-specs` 工作流（agent 驱动）
- 把按 delta 的 `includedDeltas` 和 `excludedDeltas` 决策带进执行；只同步和验证被纳入的 delta
- 把每一个被排除的 delta 报告为 `sync skipped`，而不要把归档本身当作被跳过
- 绝不要在 spec 同步还在途中时归档一个 change —— 内联跑同步，并在移动 `changeRoot` 之前验证 `<planningHome.root>/openspec/specs/<capability-path>/spec.md` 处的主 spec
- 在 spec 检查或移动之前，为每个选中的 root 取一次归档输入
- 在这个批次第一次主 spec 写入或移动之前，取回所有必需的 specs 规则快照
- 一次失败的归档输入查询绝不阻塞批次；它会在没有上下文或指引的情况下继续
- 一次失败的 specs instruction 查询会原子地停下整个批次
- 没有具体 `artifactPaths.specs.existingOutputPaths` 的 change 在没有 spec 同步的情况下继续
- 在整个批次里应用相关的运行时上下文，并报告冲突
- 操作指引保持为建议性的；考虑每一条，并解释被拒绝的建议
- 把运行时输入、冲突分析、CLI 推导出的值和 artifact 规则分开
- Artifact 规则只约束被写入的 spec
- 绝不把运行时输入或 artifact 规则文本逐字抄进输出文件
