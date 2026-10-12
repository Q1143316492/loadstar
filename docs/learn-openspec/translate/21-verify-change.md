## 21 verify-change —— 校验实现

> 译自 `reference/openspec/skills/openspec-verify-change/SKILL.md`（原文 219 行，全文翻译）。按 `READING-openspec.md` 第 21 项。frontmatter、全部 bash 命令、JSON 字段名与 CLI 报错码按原样保留。

**frontmatter**

- `name`: `openspec-verify-change`
- `description`: `Verify implementation matches OpenSpec change artifacts. Use when the user wants to validate that implementation is complete, correct, and coherent before archiving. Also use when the user says "openspec verify" or "opsx verify".`
- `allowed-tools`: `Bash(openspec:*)`
- `license`: `MIT`
- `compatibility`: `Requires openspec CLI.`
- `metadata.author`: `openspec`
- `metadata.version`: `"1.0"`

### 21.1 开篇

校验一个实现是否匹配这个 change 的 artifact（spec、task、design）。

### 21.2 store 选择（Store selection）

**store 选择（Store selection）：** 如果用户点名了一个 store（store 是一台机器上注册的、独立的 OpenSpec 仓库），或者工作就住在某个 store 里，跑 `openspec store list --json` 发现已注册的 store id，然后在那些读写 spec 和 change 的命令上传 `--store <id>`（`new change`、`status`、`instructions`、`list`、`show`、`validate`、`archive`、`doctor`、`context`、`schemas`、`view`）。一旦选定，就把 `--store <id>` 当作在整个工作流余下部分里 **sticky**。下面那些命令的每一个未加作用域的例子都是简写：跑之前，把参数补上。例如跑 `openspec status --change "<name>" --json --store "<id>"`，而不是下面展示的未加作用域的形式。其它命令不接受这个参数。命令打印出的提示已经带上了这个参数；后续调用要保持带上它。没有 store 时，命令作用于最近的本 `openspec/` root。

### 21.3 项目检查（Project check）

**项目检查（Project check）：** 这些步骤期望一个已经在用 OpenSpec 的项目。在第一个会写任何东西的步骤之前（`new change`、`archive`、`sync specs`，或撰写一个 artifact 文件），先确认项目有 root：跑 `openspec list --json`（选中 store 时带 `--store <id>`，因为那时 store 就是 root）并读 `root`。一个 root 对象意味着项目已配置好。`"root": null` 意味着没有配置好 —— 这里没有 `openspec/` 目录，而一次写入（比如 `openspec new change`）会作为副作用创建一个。这条命令也会以非零码退出，那是这个答案本身，而不是 CLI 坏了，所以要读 JSON，不要去重试或绕开它。

### 21.4 一种与配置无关的 `"root": null`

有一种 `"root": null` 和配置无关：当一条 `status` 错误消息以 `Declared in` 或 `Invalid store declaration in` 开头，并点名了本项目的 `openspec/config.yaml`（或 `config.yml`）时，说明这个项目确实通过一个它声明的 store 在用 OpenSpec，只是这台机器无法解析那个 store（store 未注册，或者 `store:` 那行格式不对）。不要把它当作未初始化并跳过下面的分支：在写入之前停下，把那条错误的 `message` 和 `fix` 给用户看。

### 21.5 没有 root 时，取决于工作流是怎么被触达的

否则，在没有 root 的情况下，接下来发生什么取决于这个工作流是怎么被触达的：

- **自动选中（Auto-selected）**：你自己选了这个工作流，而用户没有点名 OpenSpec、没有点名这个技能、也没有跑它的 slash command。停止使用 OpenSpec，正常回答这个请求，就像没装 OpenSpec 一样。不要让他们去配置任何东西，也不要提 OpenSpec 的配置。
- **显式 OpenSpec 请求（Explicit OpenSpec request）**：用户点名了 OpenSpec、点名了这个技能，或跑了它的 slash command。在写入之前停下，问怎么继续：把项目配置起来（`openspec init`）、指向他们已有的某个 store（`--store <id>`），还是这次请求不用 OpenSpec。等他们的回答。

两个分支里，都不要把创建 root 当作副作用：用户要求之前不要跑 `openspec init`，不要手工创建 `openspec/` 文件，也不要让任何命令创建它。

### 21.6 输入（Input）

**输入（Input）**：可选地指定一个 change 名。如果省略了，就看看它能不能从对话上下文里推断出来。如果含糊或模棱两可，你**必须**提示用户从可用的 change 里选一个。

### 21.7 步骤（Steps）

**Steps**

### 21.8 步骤 1：选择这个 change（Select the change）

1. **选择这个 change**

   如果提供了名字，就用它。否则：
   - 如果用户提到过某个 change，就从对话上下文里推断
   - 如果只存在一个活跃 change，就自动选中它
   - 如果模棱两可，跑 `openspec list --json` 拿到可用的 change，并让用户选一个

   提示时，展示 list 返回的所有活跃 change，包括 `status: "no-tasks"` 的 change。
   如果拿得到，给每个 change 附上它所用的 schema。
   把 task 未完成的 change 标成 "(In Progress)"。

   始终宣布："Using change: <name>"，以及如何覆盖它（例如 `/openspec-verify-change <other>`）。

### 21.9 步骤 2：检查 status 以理解 schema（Check status to understand the schema）

2. **检查 status 以理解 schema**
   ```bash
   openspec status --change "<name>" --json
   ```
   解析这个 JSON 来理解：
   - `schemaName`：正在使用的工作流（例如 "spec-driven"）
   - `planningHome`、`changeRoot`、`artifactPaths` 和 `actionContext`：路径与作用域上下文
   - 这个 change 存在哪些 artifact

### 21.10 步骤 3：拿到规划上下文并加载 artifact（Get planning context and load artifacts）

3. **拿到规划上下文并加载 artifact**

   ```bash
   openspec instructions apply --change "<name>" --json
   ```

   这会返回 change 目录、`contextFiles`（artifact ID -> 具体文件路径的数组）、`taskTrackingConfigured`，以及顶层 `tasks` 和 `progress` —— 它们是从 schema 的 `apply.tracks` 配置所匹配到的、所有可读的具体文件上聚合出来的。从 `contextFiles` 读取所有可用的 artifact。

   把 apply 的 `state` 和 `instruction` 当作上下文，而不是校验结论。校验期间不要实现 task，也不要归档这个 change。

### 21.11 步骤 4：初始化校验报告结构（Initialize verification report structure）

4. **初始化校验报告结构**

   创建一个带三个维度的报告结构：
   - **Completeness（完整性）**：追踪 task 与 spec 覆盖
   - **Correctness（正确性）**：追踪 requirement 实现与 scenario 覆盖
   - **Coherence（连贯性）**：追踪 design 遵守与模式一致性

   每个维度都可以有 CRITICAL、WARNING 或 SUGGESTION 级别的 issue。

   校验是建议性的。尊重有意为之的省略，例如 `skip_specs: true`、可选的设计文档，以及不带 task 追踪的 schema。不要为了拿到一份干净的报告，就去要求或发明可选的、或被有意省略的 artifact。`Not verified` 描述的是本报告的局限，不是一条新的归档前置条件。归档保留它自己的检查和用户确认行为。

   把 schema 未定义的检查、或 status 报告为被有意跳过的 artifact，标成 **Not applicable**。对于那些可读的 delta spec 含有 REMOVED 或 RENAMED requirement、但没有 ADDED 或 MODIFIED requirement 的 change，它的正确性检查也是 **Not applicable**（见步骤 6）。把它们从「被跳过的检查」计数和归档就绪评估里排除。把 **Not verified** 留给那些本应适用、但证据缺失或不可用的检查。

   如果适用检查只拿得到 task 证据，就只校验 task 完成情况，并把其余适用检查（包括 **Code Pattern Consistency**）标成 not verified，理由为 "Only task evidence available"。

   如果 artifact 读不了，或者里面没有可用的 requirement、scenario 或 design 决策，就把受影响的检查标成 not verified，并给出具体理由。继续做那些由剩余证据支持的检查，但一份只被部分检查的输入，不等于一项被完整校验的检查。requirement 缺失会影响 Spec Coverage 和 Requirement Implementation Mapping；scenario 缺失会影响 Scenario Coverage；design 决策缺失会影响 Design Adherence。

### 21.12 步骤 5：校验完整性（Verify Completeness）

5. **校验完整性**

   **Task Completion（task 完成）**：
   - 如果 `taskTrackingConfigured` 是 false，就把 **Task Completion** 报成 not applicable。不要把空的 `tasks` 当作证据缺失。
   - 否则，用顶层 `tasks` 和 `progress` 字段。它们已经聚合了 `apply.tracks` 匹配到的每一个可读的具体文件，与所追踪 artifact 的 ID 无关；不要从一个 `contextFiles` 的键去推断追踪关系。
   - 如果 `unavailableTrackingFiles` 非空，就把 **Task Completion** 标成 not verified，并带上每一个不可用路径和理由。继续使用任何可读的 task 证据，但不要从部分的 `tasks` 和 `progress` 字段里推断完成情况。
   - 如果 `taskTrackingConfigured` 是 true、而 `tasks` 为空，就把 **Task Completion** 标成 not verified，并从 apply 的 `state` 和 `instruction` 里记下理由。光有非零的总数，并不足以确立可评估的 task 描述。
   - 从 `progress` 报告已完成 task 数与总 task 数。
   - 如果 `progress.remaining` 大于 0：
     - 为每一个列出的未完成 task 加一条 CRITICAL issue。如果剩余数超过已列出的未完成 task，也把那些没有描述的未完成 checkbox 报出来，并建议补上描述、把它们做完。不要只从列出的 task 就推断完成情况。
     - 建议："Complete task: <description>" 或 "Mark as done if already implemented"

   **Spec Coverage（spec 覆盖）**：
   - 如果 status 通过 `skip_specs: true` 把 spec artifact 标成 skipped，或者 schema 没有定义 spec artifact，就把依赖 spec 的那些检查报成 not applicable。
   - 否则，`contextFiles` 是按 artifact id 做键的，而 artifact id 来自当前生效的 schema。如果 `contextFiles.specs` 缺失或为空，就把 **Spec Coverage**、**Requirement Implementation Mapping** 和 **Scenario Coverage** 标成 not verified；不要把它们任何一个当作干净通过。
   - 如果 `contextFiles.specs` 里有 delta spec：
     - 抽取所有 requirement（用 "### Requirement:" 标记的，或在 `## RENAMED Requirements` 下以 `FROM:`/`TO:` 对列出的），并记下每一条所在的 delta 分段：`## ADDED`、`## MODIFIED`、`## REMOVED` 或 `## RENAMED Requirements`。分段决定了这项检查要找什么。
     - 对每一条 ADDED 或 MODIFIED requirement（对 MODIFIED，检查 delta 里的文本，而不是旧措辞）：
       - 在代码库里搜索与该 requirement 相关的关键词
       - 评估实现是否很可能存在
     - 如果 ADDED 或 MODIFIED requirement 看起来未被实现：
       - 加一条 CRITICAL issue："Requirement not found: <requirement name>"
       - 建议："Implement requirement X: <description>"
     - 对每一条 REMOVED requirement，这个 change 要求的是该行为消失，所以把这个检查反过来：
       - 在代码库里搜索那个被移除的行为。`openspec/` artifact 或文档里的匹配，或者只服务于 Migration note 或某条 ADDED requirement 的代码里的匹配，本身不构成证据。报出任何仍然交付被移除行为的代码路径，包括与某条 ADDED requirement 共用的那条。
       - 找不到实现才是预期结果。绝不把一条 REMOVED requirement 报成 "Requirement not found"，也绝不建议去实现它。
       - 如果该行为仍然存在：
         - 加一条 CRITICAL issue："Removed requirement still implemented: <requirement name>"
         - 建议："Remove the remaining implementation at <file>:<lines>, following the requirement's Migration note if it has one"
     - 对每一个 RENAMED 条目（`FROM:`/`TO:`），变的是名字、行为保持不变，所以针对这个未变的行为检查 TO requirement：
       - 不要把 FROM 名字报成缺失，也不要要求代码符号、标识符或文件名跟着改名。
       - 如果 TO 名字也出现在 MODIFIED 下，它的行为在那里按 MODIFIED 文本检查；这里跳过它。
       - 否则，读主 spec 里的基线 requirement，路径是 `<planningHome.root>/openspec/specs/<capability-path>/spec.md`，capability 路径与那份 delta spec 相同：读 FROM 名字下的那条 requirement，只有当主 spec 已经同步、因而 FROM 名字不存在时，才读 TO 名字下的那条。它的正文和 scenario 就是 TO requirement 所保留行为的证据。
       - 在代码库里搜索该行为，并评估它是否仍然被实现。
       - 如果它看起来未被实现：
         - 加一条 CRITICAL issue："Renamed requirement not found: <TO name>"
         - 建议："Restore the behavior of <TO name> (renamed from <FROM name>); a rename must not change behavior"
       - 如果基线 requirement 找不到或读不了，就把那个条目上的 **Spec Coverage** 标成 not verified，并给出理由。绝不把一次未检查的 rename 算作通过。

### 21.13 步骤 6：校验正确性（Verify Correctness）

6. **校验正确性**

   如果 delta spec 可读，且至少含有一条 REMOVED 或 RENAMED requirement、但没有 ADDED 或 MODIFIED requirement（这个 change 只移除或重命名 requirement），就把 **Requirement Implementation Mapping** 和 **Scenario Coverage** 报成 **Not applicable**。Spec Coverage 下的 REMOVED 和 RENAMED 检查就是这类 change 的证据（每一个 RENAMED 条目都在那里按其基线行为接受检查），所以不要把这两项检查标成 not verified。一份完全解析不出 requirement 的 delta spec 是不可用的证据，而不是一个「只做移除」的 change：把这两项检查标成 not verified。

   **Requirement Implementation Mapping（requirement 实现映射）**：
   - 对 delta spec 里每一条 ADDED 或 MODIFIED requirement（REMOVED 条目、以及没有 MODIFIED 块的 RENAMED 条目，已在 Spec Coverage 下结清）：
     - 在代码库里搜索实现证据
     - 如果找到了，记下文件路径和行范围
     - 评估实现是否匹配 requirement 的意图
     - 如果发现了偏离：
       - 加一条 WARNING："Implementation may diverge from spec: <details>"
       - 建议："Review <file>:<lines> against requirement X"

   **Scenario Coverage（scenario 覆盖）**：
   - 对 delta spec 里每一条 ADDED 或 MODIFIED requirement 下的每个 scenario（用 "#### Scenario:" 标记）：
     - 检查这些条件是否在代码里被处理
     - 检查是否存在覆盖该 scenario 的测试
     - 如果该 scenario 看起来未被覆盖：
       - 加一条 WARNING："Scenario not covered: <scenario name>"
       - 建议："Add test or implementation for scenario: <description>"
   - 跳过 REMOVED requirement 下的 scenario；那个行为本就该消失。

### 21.14 步骤 7：校验连贯性（Verify Coherence）

7. **校验连贯性**

   **Design Adherence（design 遵守）**：
   - 如果 schema 没有定义 design artifact，就把 **Design Adherence** 报成 not applicable。
   - 如果 `contextFiles.design` 存在：
     - 抽取关键决策（找像 "Decision:"、"Approach:"、"Architecture:" 这样的分段）
     - 校验实现是否遵循了那些决策
     - 如果发现矛盾：
       - 加一条 WARNING："Design decision not followed: <decision>"
       - 建议："Update implementation or revise design.md to match reality"
   - 否则，如果 `contextFiles.design` 缺失或为空：把 **Design Adherence** 标成 not verified。在有其它支撑性 artifact 时，**Code Pattern Consistency** 仍然要跑；只拿得到 task 证据的情形仍限于 task 完成情况。

   **Code Pattern Consistency（代码模式一致性）**：
   - 如果实现改动无法被识别出来，就把 **Code Pattern Consistency** 标成 not verified，并说明缺失的证据是什么。
   - 否则，审查新代码与项目模式的一致性
   - 检查文件命名、目录结构、编码风格
   - 如果发现显著偏离：
     - 加一条 SUGGESTION："Code pattern deviation: <details>"
     - 建议："Consider following project pattern: <example>"

### 21.15 步骤 8：生成校验报告（Generate Verification Report）

8. **生成校验报告**

   **Summary Scorecard（总结记分卡）**：
   ```markdown
   ## Verification Report: <change-name>

   ### Summary
   | Dimension    | Status           |
   |--------------|------------------|
   | Completeness | X/Y tasks, N reqs|
   | Correctness  | M/N reqs covered |
   | Coherence    | Followed/Issues  |
   ```

   在每一个 Status 单元格里，报告实际跑过的检查的结果，并对每一项被跳过的检查写 `Not verified (<reason>)`。如果某个维度里所有检查都被跳过，那个单元格以 `Not verified` 开头。绝不把一项被跳过的检查记成通过。在最终评估里，把每一项 not verified 或部分 verified 的检查都当作被跳过。N 只计入 ADDED 和 MODIFIED requirement，并单独报告 REMOVED 和 RENAMED requirement（例如 "1 removal confirmed, 1 rename verified"）。对一个只移除或重命名 requirement 的 change，Correctness 单元格写 `Not applicable (no ADDED or MODIFIED requirements)`。

   **Issues by Priority（按优先级排列的 issue）**：

   1. **CRITICAL**（归档前必须修）：
      - 未完成的 task
      - 缺失的 requirement 实现
      - 被移除的 requirement 仍在被实现
      - 被重命名的 requirement，其行为已不再被实现
      - 每一条都带具体、可执行的建议

   2. **WARNING**（应该修）：
      - spec/design 偏离
      - scenario 覆盖缺失
      - 每一条都带具体建议

   3. **SUGGESTION**（修了更好）：
      - 模式不一致
      - 小幅改进
      - 每一条都带具体建议

   **Final Assessment（最终评估）**：
   - 如果有 CRITICAL issue："X critical issue(s) found. Fix before archiving." 如果有任何检查被跳过，还要逐一点名每一项被跳过的检查及其理由。
   - 如果没有 CRITICAL issue、有一条或多条 warning、且没有检查被跳过："No critical issues. Y warning(s) to consider. Ready for archive (with noted improvements)."
   - 如果只有 suggestion、且没有检查被跳过："No critical issues or warnings. Z suggestion(s) to consider. Ready for archive (with noted improvements)."
   - 如果没有任何 issue、也没有检查被跳过："All checks passed. Ready for archive."
   - 如果有任何检查被跳过、且没有 CRITICAL issue：不要声称就绪。说 "No critical issues found in the checks that ran. <check(s)> not verified: <reason>." 非零时把 warning 数一并写上。
   - 在每一次最终评估里，非零时都写上 suggestion 数。

### 21.16 校验启发式（Verification Heuristics）

**Verification Heuristics**

- **Completeness**：聚焦客观的清单项（checkbox、requirement 列表）
- **Correctness**：用关键词搜索、文件路径分析、合理推断 —— 不要求绝对确定
- **Coherence**：找显眼的矛盾，不要对风格吹毛求疵
- **False Positives**：拿不准时，优先 SUGGESTION 而不是 WARNING，优先 WARNING 而不是 CRITICAL
- **Actionability**：每一条 issue 都必须带具体建议，适用时给出文件/行引用

### 21.17 输出格式（Output Format）

**Output Format**

用清晰的 markdown，包含：
- 总结记分卡用表格
- issue 用分组列表（CRITICAL/WARNING/SUGGESTION）
- 代码引用用格式：`file.ts:123`
- 具体、可执行的建议
- 不要 "consider reviewing" 这类含糊的建议
