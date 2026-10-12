## 32-36 openspec/specs —— 项目给自己写的行为规格

> 译自 `reference/openspec/openspec/specs/` 下八篇 spec.md，合计 1,044 行（`artifact-graph` 185 / `instruction-loader` 71 / `context-injection` 53 / `rules-injection` 102 / `schema-resolution` 171 / `change-creation` 67 / `cli-artifact-workflow` 333 / `docs-agent-instructions` 62）。按 `READING-openspec.md` 第 32-36 项。这是一份合译：六个编号各对应路线里那一项点名的 spec。这些文件是项目**自举**出来的行为规格 —— 比源码好读，比文档权威。

**路线项 → spec 文件：**

1. **32** = `artifact-graph/spec.md`
2. **33** = `instruction-loader/spec.md`
3. **34** = `context-injection/spec.md` + `rules-injection/spec.md`
4. **35** = `schema-resolution/spec.md` + `change-creation/spec.md`
5. **36** = `cli-artifact-workflow/spec.md` + `docs-agent-instructions/spec.md`

八篇按顺序收在 32.1–32.8 八节里，每节标题标注它所属的路线项。spec 格式的结构语法（`## Purpose`、`## Requirements`、`### Requirement:`、`#### Scenario:`、`- **WHEN**` / `- **THEN**` / `- **AND**` / `- **GIVEN**`）的**文字**一律原样保留不译；只译 requirement 与 scenario 的正文，其中的标识符、函数名、路径与 JSON 键名原样保留。

> 层级约定：为让标题树可导航，上述语法标题在译文里的 Markdown 层级统一深两层（源 `##`→`####`、`###`→`#####`、`####`→`######`），**标题文字本身未改** —— 54 条 requirement、176 条 scenario、8 个 `Purpose` 与 8 个 `Requirements` 与源文件逐条对齐。要按原始层级读，直接看 `reference/openspec/openspec/specs/<capability>/spec.md`。

### 32.1 artifact-graph（路线 32）

> 源文件：`reference/openspec/openspec/specs/artifact-graph/spec.md`

**artifact-graph Specification**

#### Purpose

定义由 schema 驱动的工作流所使用的 artifact 图模型、依赖校验与完成状态逻辑。

#### Requirements

##### Requirement: schema 加载（Schema Loading）

系统 SHALL 从 schema 目录内的 YAML schema 文件加载 artifact 图定义。

###### Scenario: 有效 schema 被加载（Valid schema loaded）

- **WHEN** 一个 schema 目录含有一个有效的 `schema.yaml` 文件
- **THEN** 系统返回一个带有全部 artifact 与依赖的 ArtifactGraph

###### Scenario: 无效 schema 被拒（Invalid schema rejected）

- **WHEN** 一个 schema YAML 文件缺少必需字段
- **THEN** 系统抛出一个带有描述性信息的错误

###### Scenario: 检测到环形依赖（Cyclic dependencies detected）

- **WHEN** 一个 schema 含有环形的 artifact 依赖
- **THEN** 系统抛出一个错误，列出处于该环中的 artifact ID

###### Scenario: 无效依赖引用（Invalid dependency reference）

- **WHEN** 某个 artifact 的 `requires` 数组引用了一个不存在的 artifact ID
- **THEN** 系统抛出一个错误，指出这个无效引用

###### Scenario: 重复 artifact ID 被拒（Duplicate artifact IDs rejected）

- **WHEN** 一个 schema 含有多个 ID 相同的 artifact
- **THEN** 系统抛出一个错误，指出这个重复

###### Scenario: 找不到 schema 目录（Schema directory not found）

- **WHEN** 解析一个没有对应目录的 schema 名
- **THEN** 系统抛出一个错误，列出可用的 schema

##### Requirement: 构建顺序计算（Build Order Calculation）

系统 SHALL 为 artifact 计算出一个有效的拓扑构建顺序。

###### Scenario: 线性依赖链（Linear dependency chain）

- **WHEN** artifact 构成一条线性链（A → B → C）
- **THEN** getBuildOrder() 返回 [A, B, C]

###### Scenario: 菱形依赖（Diamond dependency）

- **WHEN** artifact 构成一个菱形（A → B、A → C、B → D、C → D）
- **THEN** getBuildOrder() 把 A 排在 B 和 C 之前，把 D 排在最后

###### Scenario: 互相独立的 artifact（Independent artifacts）

- **WHEN** artifact 之间没有任何依赖
- **THEN** getBuildOrder() 按 schema 声明它们的顺序返回

###### Scenario: 同时就绪的 artifact 按声明顺序排列（Simultaneously ready artifacts ordered by declaration）

- **WHEN** artifact 在同一时刻变为就绪（spec-driven 的 specs 和 design 都只依赖 proposal）
- **THEN** getBuildOrder() 按 schema 的 artifacts 列表声明它们的顺序返回，而不是按字母序
- **AND** 一个已经在等待构建的 artifact 不会被排到 schema 声明在它之前的那个之前

##### Requirement: 状态检测（State Detection）

系统 SHALL 通过扫描文件系统检测 artifact 的完成状态。

系统 SHALL 把含有 `*`、`?` 或 `[` 的 `generates` 值识别为 glob 模式。它还 SHALL 支持花括号备选、花括号区间，以及 `@()`、`+()`、`!()`、`*()`、`?()` 这几种 extglob 形式。输出为 glob 的 artifact SHALL 在至少存在一个匹配文件时被判定为已完成。

系统 SHALL 在不存在受支持的 glob 语法时，保留带有裸的前导 `!`、普通圆括号或单元素花括号的字面文件名。花括号展开 SHALL 保留字面花括号组，并识别靠后的与嵌套的展开组。展开后的输出路径与被遍历的符号链接 SHALL 保持在 change 目录之内。

###### Scenario: 简单文件存在（Simple file exists）

- **WHEN** 一个 artifact 生成 "proposal.md" 且该文件存在
- **THEN** 该 artifact 被标记为已完成

###### Scenario: 简单文件缺失（Simple file missing）

- **WHEN** 一个 artifact 生成 "proposal.md" 且该文件不存在
- **THEN** 该 artifact 不会被标记为已完成

###### Scenario: glob 模式且有文件（Glob pattern with files）

- **WHEN** 一个 artifact 生成 "specs/*.md" 且 specs/ 目录含有 .md 文件
- **THEN** 该 artifact 被标记为已完成

###### Scenario: glob 模式为空（Glob pattern empty）

- **WHEN** 一个 artifact 生成 "specs/*.md" 且 specs/ 目录为空或缺失
- **THEN** 该 artifact 不会被标记为已完成

###### Scenario: change 目录缺失（Missing change directory）

- **WHEN** change 目录不存在
- **THEN** 所有 artifact 都被标记为未完成（空状态）

###### Scenario: 花括号备选且有匹配文件（Brace alternatives with matching files）

- **WHEN** 一个 artifact 生成 "review-{api,ui}.md" 且 "review-api.md" 存在
- **THEN** 该 artifact 被标记为已完成

###### Scenario: 字面花括号组之后的花括号区间（Brace range after a literal brace group）

- **WHEN** 一个 artifact 生成 "report-{draft}-{1..3}.md"
- **AND** "report-{draft}-1.md"、"report-{draft}-2.md"、"report-{draft}-3.md" 与 "report-{draft}-4.md" 都存在
- **THEN** 它解析出的输出恰好包含前三个文件
- **AND** 该 artifact 被标记为已完成

###### Scenario: 靠后的与嵌套的花括号备选（Later and nested brace alternatives）

- **WHEN** 一个 artifact 生成 "report-{draft}-{{api},ui}.md" 且 "report-{draft}-{api}.md" 存在
- **THEN** 该 artifact 被标记为已完成

###### Scenario: extglob 备选且有匹配文件（Extglob alternatives with matching files）

- **WHEN** 一个 artifact 生成 "@(proposal|design).md" 或 "+(proposal|design).md" 且 "proposal.md" 存在
- **THEN** 该 artifact 被标记为已完成

###### Scenario: 否定式 extglob 排除其备选项（Negative extglob excludes its alternatives）

- **WHEN** 一个 artifact 生成 "!(proposal|design).md"
- **AND** "proposal.md"、"design.md" 与 "notes.md" 都存在
- **THEN** 它解析出的输出只包含 "notes.md"
- **AND** 该 artifact 被标记为已完成

###### Scenario: 花括号或 extglob 模式且无匹配文件（Brace or extglob pattern without matching files）

- **WHEN** 一个 artifact 生成 "review-{api,ui}.md" 或 "@(proposal|design).md" 且没有任何匹配文件
- **THEN** 该 artifact 不会被标记为已完成

###### Scenario: 字面输出名保持字面（Literal output names remain literal）

- **WHEN** 一个 artifact 生成 "!review.md"、"(proposal|design).md" 或 "review-{api}.md"
- **THEN** 完成与否取决于是否存在一个名字与之完全相同的文件

###### Scenario: 花括号展开逃出 change 目录（Brace expansion escapes the change directory）

- **WHEN** 一个 artifact 生成 "{safe,../outside}/review.md"
- **THEN** 输出解析在匹配文件之前就拒绝这个落在 change 目录之外的展开路径
- **AND** 拒绝与那个外部文件是否存在无关

###### Scenario: 展开后的目录模式触达向外的符号链接（Expanded directory pattern reaches an outbound symbolic link）

- **WHEN** 一个 artifact 生成 "content/{safe,linked}/review.md" 或 "content/@(safe|linked)/review.md"
- **AND** "content/linked" 是一个指向 change 目录之外某个目录的符号链接
- **THEN** 输出解析拒绝穿过该链接进行遍历，即使没有任何匹配文件存在也如此

##### Requirement: 就绪 artifact 查询（Ready Artifact Query）

系统 SHALL 基于依赖完成情况识别出哪些 artifact 已就绪、可以被创建。

###### Scenario: 根 artifact 初始就绪（Root artifacts ready initially）

- **WHEN** 没有任何 artifact 已完成
- **THEN** getNextArtifacts() 返回没有依赖的 artifact

###### Scenario: 有依赖的 artifact 变为就绪（Dependent artifact becomes ready）

- **WHEN** 一个 artifact 的依赖全部已完成
- **THEN** getNextArtifacts() 包含该 artifact

###### Scenario: 被阻塞的 artifact 被排除（Blocked artifacts excluded）

- **WHEN** 一个 artifact 还有未完成的依赖
- **THEN** getNextArtifacts() 不包含该 artifact

###### Scenario: 就绪 artifact 按声明顺序排列（Ready artifacts ordered by declaration）

- **WHEN** 若干 artifact 同时就绪
- **THEN** getNextArtifacts() 按 schema 声明它们的顺序返回，所以第一项就是 schema 推荐下一个写的 artifact

##### Requirement: 完成度检查（Completion Check）

系统 SHALL 判定一个图中的所有 artifact 何时全部完成。

###### Scenario: 全部完成（All complete）

- **WHEN** 图中的所有 artifact 都在已完成集合中
- **THEN** isComplete() 返回 true

###### Scenario: 部分完成（Partially complete）

- **WHEN** 图中的部分 artifact 尚未完成
- **THEN** isComplete() 返回 false

##### Requirement: 阻塞查询（Blocked Query）

系统 SHALL 识别出哪些 artifact 被阻塞，并返回它们全部未满足的依赖。

###### Scenario: artifact 被单个依赖阻塞（Artifact blocked by single dependency）

- **WHEN** artifact B 依赖 artifact A 且 A 未完成
- **THEN** getBlocked() 返回 `{ B: ['A'] }`

###### Scenario: artifact 被多个依赖阻塞（Artifact blocked by multiple dependencies）

- **WHEN** artifact C 依赖 A 和 B，且只有 A 已完成
- **THEN** getBlocked() 返回 `{ C: ['B'] }`

###### Scenario: artifact 被全部依赖阻塞（Artifact blocked by all dependencies）

- **WHEN** artifact C 依赖 A 和 B，且两者都未完成
- **THEN** getBlocked() 返回 `{ C: ['A', 'B'] }`
- **AND** 未满足的依赖按 schema 声明它们的顺序列出

##### Requirement: schema 目录结构（Schema Directory Structure）

系统 SHALL 支持自包含的 schema 目录，模板与 schema 同处一目录。

###### Scenario: 带模板的 schema（Schema with templates）

- **WHEN** 一个 schema 目录含有 `schema.yaml` 与 `templates/` 子目录
- **THEN** artifact 可以引用相对于该 schema 的 templates 目录的模板

###### Scenario: 用户 schema 覆盖（User schema override）

- **WHEN** 在 `${XDG_DATA_HOME}/openspec/schemas/<name>/` 存在一个 schema 目录
- **THEN** 系统使用那个目录而不是内置的

###### Scenario: 内置 schema 兜底（Built-in schema fallback）

- **WHEN** 某个 schema 不存在用户覆盖
- **THEN** 系统使用包内置的 schema 目录

###### Scenario: 列出可用 schema（List available schemas）

- **WHEN** 列出 schema 时
- **THEN** 系统返回来自用户目录与包目录两处的 schema 名

### 32.2 instruction-loader（路线 33）

> 源文件：`reference/openspec/openspec/specs/instruction-loader/spec.md`

**instruction-loader Specification**

#### Purpose

instruction-loader 从 schema 目录加载指令模板，对它们做校验并用元数据与参数（例如 change 上下文与依赖状态）加以增强，然后把它们暴露给下游服务使用，包括模板取用、参数替换与增强。

#### Requirements

##### Requirement: 模板加载（Template Loading）

系统 SHALL 从 schema 目录加载模板。

###### Scenario: 从 schema 目录加载模板（Load template from schema directory）

- **WHEN** 调用 `loadTemplate(schemaName, templatePath)`
- **THEN** 系统从 `schemas/<schemaName>/templates/<templatePath>` 加载该模板

###### Scenario: 找不到模板文件（Template file not found）

- **WHEN** 某个模板文件不存在于该 schema 的 templates 目录中
- **THEN** 系统抛出一个带有该模板路径的错误

##### Requirement: change 上下文加载（Change Context Loading）

系统 SHALL 加载把图与完成状态合在一起的 change 上下文。

###### Scenario: 为既有 change 加载上下文（Load context for existing change）

- **WHEN** 为一个已存在的 change 调用 `loadChangeContext(projectRoot, changeName)`
- **THEN** 系统返回一个带有图、已完成集合、schema 名与 change 信息的上下文

###### Scenario: 用自定义 schema 加载上下文（Load context with custom schema）

- **WHEN** 调用 `loadChangeContext(projectRoot, changeName, schemaName)`
- **THEN** 系统使用指定的 schema 而不是默认的

###### Scenario: 为非存在的 change 目录加载上下文（Load context for non-existent change directory）

- **WHEN** 为一个不存在的 change 目录调用 `loadChangeContext`
- **THEN** 系统返回已完成集合为空的上下文

##### Requirement: 模板增强（Template Enrichment）

系统 SHALL 用 change 特有的上下文增强模板。

###### Scenario: 包含 artifact 元数据（Include artifact metadata）

- **WHEN** 为某个 artifact 生成指令时
- **THEN** 输出包含 change 名、artifact ID、schema 名与输出路径

###### Scenario: 包含依赖状态（Include dependency status）

- **WHEN** 某个 artifact 有依赖
- **THEN** 输出展示每条依赖及其完成状态（done/missing）

###### Scenario: 包含解锁的 artifact（Include unlocked artifacts）

- **WHEN** 生成指令时
- **THEN** 输出包含在这个 artifact 之后哪些 artifact 变得可用
- **AND** 它们按 schema 声明它们的顺序列出，与 `openspec status` 推荐它们的顺序一致

###### Scenario: 根 artifact 指示（Root artifact indicator）

- **WHEN** 某个 artifact 没有依赖
- **THEN** 依赖一栏指明这是一个根 artifact

##### Requirement: 状态格式化（Status Formatting）

系统 SHALL 把 change 状态格式化为可读输出。

###### Scenario: 全部 artifact 已完成（All artifacts completed）

- **WHEN** 所有 artifact 都已完成
- **THEN** status 把所有 artifact 显示为 "done"

###### Scenario: 混合完成状态（Mixed completion status）

- **WHEN** 部分 artifact 已完成
- **THEN** status 把已完成的显示为 "done"、就绪的显示为 "ready"、被阻塞的显示为 "blocked"

###### Scenario: 被阻塞 artifact 的细节（Blocked artifact details）

- **WHEN** 某个 artifact 被阻塞
- **THEN** status 显示哪些依赖缺失

###### Scenario: 包含输出路径（Include output paths）

- **WHEN** status 被格式化时
- **THEN** 每个 artifact 都展示它的输出路径模式

### 32.3 context-injection（路线 34）

> 源文件：`reference/openspec/openspec/specs/context-injection/spec.md`

**context-injection Specification**

#### Purpose

定义 `openspec/config.yaml` 里的项目上下文如何被注入工作流指令，同时保留源文本与格式。

#### Requirements

##### Requirement: 向所有 artifact 指令注入 context（Inject context into all artifact instructions）

系统 SHALL 把项目 config 里的 context 字段注入所有 artifact 的指令中，并包在 XML 风格的 `<context>` 标签里。

###### Scenario: config 含有 context 字段（Config has context field）

- **WHEN** config 含有 `context: "Tech stack: TypeScript, React"`
- **THEN** 指令输出包含 `<context>\nTech stack: TypeScript, React\n</context>`

###### Scenario: config 不含 context 字段（Config has no context field）

- **WHEN** config 省略 context 字段或 context 为 undefined
- **THEN** 指令输出不包含 `<context>` 标签

###### Scenario: context 是多行字符串（Context is multi-line string）

- **WHEN** config 含有多行的 context
- **THEN** 指令输出在 `<context>` 标签内保留换行

###### Scenario: context 应用于所有 artifact（Context applied to all artifacts）

- **WHEN** 为任何 artifact（proposal、specs、design、tasks）加载指令时
- **THEN** context 段落出现在所有指令输出中

##### Requirement: 用 XML 风格标签格式化 context（Format context with XML-style tags）

系统 SHALL 把 context 内容包在 `<context>` 开标签与 `</context>` 闭标签里，内容单独成行。

###### Scenario: context 标签结构（Context tag structure）

- **WHEN** context 被注入指令时
- **THEN** 格式恰好是 `<context>\n{content}\n</context>\n\n`

###### Scenario: context 出现在 template 之前（Context appears before template）

- **WHEN** 生成带 context 的指令时
- **THEN** `<context>` 段出现在 `<template>` 段之前

##### Requirement: 原样保留 context 内容（Preserve context content exactly as provided）

系统 SHALL 注入 context 内容，不做修改、转义或解释。

###### Scenario: context 含特殊字符（Context contains special characters）

- **WHEN** context 含有 `<`、`>`、`&`、引号之类的字符
- **THEN** 这些字符按它们在 config 中所写的原样保留

###### Scenario: context 含 URL（Context contains URLs）

- **WHEN** context 含有像 "docs at https://example.com" 这样的 URL
- **THEN** URL 在被注入的内容中完全原样保留

###### Scenario: context 含 Markdown（Context contains Markdown）

- **WHEN** context 含有 `**bold**` 或 `[links](url)` 这样的 Markdown 格式
- **THEN** Markdown 被保留，既不渲染也不转义

### 32.4 rules-injection（路线 34）

> 源文件：`reference/openspec/openspec/specs/rules-injection/spec.md`

**rules-injection Specification**

#### Purpose

定义项目 config 里的逐 artifact 规则如何以确定性的格式与校验被注入生成的指令。

#### Requirements

##### Requirement: 只为匹配的 artifact 注入 rules（Inject rules only for matching artifact）

系统 SHALL 仅在 artifact ID 与 rules 对象中的某个键匹配时，才把 config 里的 rules 注入指令。

###### Scenario: 该 artifact 存在 rules（Rules exist for the artifact）

- **WHEN** 为 "proposal" 加载指令，且 config 含有 `rules: { proposal: ["Rule 1", "Rule 2"] }`
- **THEN** 指令输出包含带有这两条 rule 的 rules 段

###### Scenario: 该 artifact 没有 rules（No rules for the artifact）

- **WHEN** 为 "design" 加载指令，且 config 含有 `rules: { proposal: [...] }`
- **THEN** 指令输出不包含 `<rules>` 标签

###### Scenario: rules 对象未定义（Rules object is undefined）

- **WHEN** config 省略 rules 字段或 rules 为 undefined
- **THEN** 任何 artifact 的指令输出都不包含 `<rules>` 标签

###### Scenario: 该 artifact 的 rules 数组为空（Rules array is empty for artifact）

- **WHEN** config 含有 `rules: { proposal: [] }`
- **THEN** 指令输出不包含 `<rules>` 标签

##### Requirement: 用 XML 风格标签与项目符号列表格式化 rules（Format rules with XML-style tags and bullet list）

系统 SHALL 把 rules 包在 `<rules>` 标签里，每条 rule 作为一个项目符号列表项。

###### Scenario: 该 artifact 的单条 rule（Single rule for artifact）

- **WHEN** config 含有 `rules: { proposal: ["Include rollback plan"] }`
- **THEN** 指令输出包含 `<rules>\n- Include rollback plan\n</rules>\n\n`

###### Scenario: 该 artifact 的多条 rules（Multiple rules for artifact）

- **WHEN** config 含有 `rules: { proposal: ["Rule 1", "Rule 2", "Rule 3"] }`
- **THEN** 指令输出把每条 rule 作为单独的项目符号

###### Scenario: rules 出现在 context 之后、template 之前（Rules appear after context and before template）

- **WHEN** 生成同时带 context 与 rules 的指令时
- **THEN** 顺序是 `<context>` 然后 `<rules>` 然后 `<template>`

##### Requirement: 原样保留 rule 文本（Preserve rule text exactly as provided）

系统 SHALL 注入 rule 文本，不做修改、转义或解释。

###### Scenario: rule 含 markdown（Rule contains markdown）

- **WHEN** rule 含有像 "Use **Given/When/Then** format" 这样的 markdown
- **THEN** markdown 在被注入的内容中保留

###### Scenario: rule 含特殊字符（Rule contains special characters）

- **WHEN** rule 含有 `<`、`>`、引号之类的字符
- **THEN** 这些字符按所写的原样保留

###### Scenario: rule 是多行字符串（Rule is multi-line string）

- **WHEN** rule 文本含有换行
- **THEN** 换行在该项目符号内保留

##### Requirement: 支持多个 artifact 各带不同 rules（Support multiple artifacts with different rules）

系统 SHALL 允许同一份 config 为不同 artifact 配置不同的规则集。

###### Scenario: 多个 artifact 都有 rules（Multiple artifacts have rules）

- **WHEN** config 含有 `rules: { proposal: ["P1"], specs: ["S1", "S2"], tasks: ["T1"] }`
- **THEN** proposal 的指令只显示 ["P1"]，specs 只显示 ["S1", "S2"]，tasks 只显示 ["T1"]

###### Scenario: 有些 artifact 有 rules，其它没有（Some artifacts have rules, others do not）

- **WHEN** config 只为 proposal 与 specs 配置了 rules
- **THEN** design 与 tasks 的指令没有 `<rules>` 段

##### Requirement: rules 是对 schema 指导的追加（Rules are additive to schema guidance）

系统 SHALL 把 config rules 追加到 schema 内置的 artifact 指令上，而不是替换它。

###### Scenario: artifact 同时有 schema 指令与 config rules（Artifact has schema instruction and config rules）

- **WHEN** artifact 有来自 schema 的内置指令，且 config 提供了 rules
- **THEN** 最终指令同时包含 schema 指导与 config rules

###### Scenario: rules 提供额外约束（Rules provide additional constraints）

- **WHEN** schema 说 "create proposal"，而 config rules 说 "include rollback plan"
- **THEN** agent 同时看到 schema 模板与这条额外的 rule

##### Requirement: 在指令加载期间校验 artifact ID（Validate artifact IDs during instruction loading）

系统 SHALL 在加载指令时对照 schema 校验 rules 里的 artifact ID，并对未知 ID 发出警告。

###### Scenario: 所有 artifact ID 都有效（All artifact IDs are valid）

- **WHEN** 指令加载时，config 含有 `rules: { proposal: [...], specs: [...] }`，而 schema 含有这些 artifact
- **THEN** 不发出任何校验警告

###### Scenario: rules 中有未知 artifact ID（Unknown artifact ID in rules）

- **WHEN** 指令加载时，config 含有 `rules: { unknownartifact: [...] }`
- **THEN** 发出警告："Unknown artifact ID in rules: 'unknownartifact'. Valid IDs for schema 'spec-driven': design, proposal, specs, tasks"

###### Scenario: 多个未知 artifact ID（Multiple unknown artifact IDs）

- **WHEN** 指令加载时，config 含有多个未知 artifact ID
- **THEN** 每个未知 artifact ID 各发出一条独立的警告

###### Scenario: 校验警告每个会话只显示一次（Validation warnings shown once per session）

- **WHEN** 在同一个 CLI 会话中多次加载指令
- **THEN** 每条唯一的校验警告只显示一次（被缓存）

### 32.5 schema-resolution（路线 35）

> 源文件：`reference/openspec/openspec/specs/schema-resolution/spec.md`

**schema-resolution Specification**

#### Purpose

定义项目本地 schema 的解析行为，包括优先顺序（项目本地，然后用户覆盖，然后包内置）以及未提供 `projectRoot` 时的向后兼容回退。

#### Requirements

##### Requirement: 项目本地 schema 解析（Project-local schema resolution）

在提供了 `projectRoot` 时，系统 SHALL 以最高优先级从项目本地目录（`./openspec/schemas/<name>/`）解析 schema。

###### Scenario: 项目本地 schema 优先于用户覆盖（Project-local schema takes precedence over user override）

- **WHEN** 在 `./openspec/schemas/my-workflow/schema.yaml` 存在名为 "my-workflow" 的 schema
- **AND** 在 `~/.local/share/openspec/schemas/my-workflow/schema.yaml` 也存在名为 "my-workflow" 的 schema
- **AND** 调用 `getSchemaDir("my-workflow", projectRoot)`
- **THEN** 系统 SHALL 返回项目本地的路径

###### Scenario: 项目本地 schema 优先于包内置（Project-local schema takes precedence over package built-in）

- **WHEN** 在 `./openspec/schemas/spec-driven/schema.yaml` 存在名为 "spec-driven" 的 schema
- **AND** "spec-driven" 是一个包内置 schema
- **AND** 调用 `getSchemaDir("spec-driven", projectRoot)`
- **THEN** 系统 SHALL 返回项目本地的路径

###### Scenario: 无项目本地 schema 时回退到用户覆盖（Falls back to user override when no project-local schema）

- **WHEN** 在 `./openspec/schemas/my-workflow/` 不存在名为 "my-workflow" 的 schema
- **AND** 在 `~/.local/share/openspec/schemas/my-workflow/schema.yaml` 存在名为 "my-workflow" 的 schema
- **AND** 调用 `getSchemaDir("my-workflow", projectRoot)`
- **THEN** 系统 SHALL 返回用户覆盖的路径

###### Scenario: 既无项目本地也无用户 schema 时回退到包内置（Falls back to package built-in when no project-local or user schema）

- **WHEN** 在 `./openspec/schemas/spec-driven/` 不存在名为 "spec-driven" 的 schema
- **AND** 在 `~/.local/share/openspec/schemas/spec-driven/` 不存在名为 "spec-driven" 的 schema
- **AND** "spec-driven" 是一个包内置 schema
- **AND** 调用 `getSchemaDir("spec-driven", projectRoot)`
- **THEN** 系统 SHALL 返回包内置的路径

###### Scenario: 未提供 projectRoot 时的向后兼容（Backward compatibility when projectRoot not provided）

- **WHEN** 调用 `getSchemaDir("my-workflow")` 时没有传 `projectRoot` 参数
- **THEN** 系统 SHALL 只检查用户覆盖与包内置两处位置
- **AND** 系统 SHALL NOT 检查项目本地位置

##### Requirement: 项目 schemas 目录辅助函数（Project schemas directory helper）

系统 SHALL 提供一个 `getProjectSchemasDir(projectRoot)` 函数，返回项目本地 schemas 目录的路径。

###### Scenario: 返回正确路径（Returns correct path）

- **WHEN** 调用 `getProjectSchemasDir("/path/to/project")`
- **THEN** 系统 SHALL 返回 `/path/to/project/openspec/schemas`

##### Requirement: 列出 schema 时包含项目本地（List schemas includes project-local）

在提供了 `projectRoot` 时，系统 SHALL 在列出可用 schema 时把项目本地 schema 包含进来。

###### Scenario: 项目本地 schema 出现在列表中（Project-local schemas appear in list）

- **WHEN** 在 `./openspec/schemas/team-flow/schema.yaml` 存在名为 "team-flow" 的 schema
- **AND** 调用 `listSchemas(projectRoot)`
- **THEN** 返回的列表 SHALL 包含 "team-flow"

###### Scenario: 列表中项目本地 schema 遮蔽同名用户 schema（Project-local schema shadows same-named user schema in list）

- **WHEN** 在项目本地与用户覆盖两处都存在名为 "custom" 的 schema
- **AND** 调用 `listSchemas(projectRoot)`
- **THEN** 返回的列表 SHALL 恰好包含一次 "custom"

###### Scenario: listSchemas 的向后兼容（Backward compatibility for listSchemas）

- **WHEN** 调用 `listSchemas()` 时没有传 `projectRoot` 参数
- **THEN** 系统 SHALL 只包含用户覆盖与包内置的 schema

##### Requirement: schema 信息包含 project 来源（Schema info includes project source）

系统 SHALL 在 `listSchemasWithInfo()` 的结果中为项目本地 schema 标注 `source: 'project'`。

###### Scenario: 项目本地 schema 显示 project 来源（Project-local schema shows project source）

- **WHEN** 在 `./openspec/schemas/team-flow/schema.yaml` 存在名为 "team-flow" 的 schema
- **AND** 调用 `listSchemasWithInfo(projectRoot)`
- **THEN** "team-flow" 的 schema 信息 SHALL 带有 `source: 'project'`

###### Scenario: 用户覆盖 schema 显示 user 来源（User override schema shows user source）

- **WHEN** 名为 "my-custom" 的 schema 只存在于 `~/.local/share/openspec/schemas/my-custom/`
- **AND** 调用 `listSchemasWithInfo(projectRoot)`
- **THEN** "my-custom" 的 schema 信息 SHALL 带有 `source: 'user'`

###### Scenario: 包内置 schema 显示 package 来源（Package built-in schema shows package source）

- **WHEN** "spec-driven" 只作为包内置存在
- **AND** 调用 `listSchemasWithInfo(projectRoot)`
- **THEN** "spec-driven" 的 schema 信息 SHALL 带有 `source: 'package'`

##### Requirement: schemas 命令显示来源（Schemas command shows source）

`openspec schemas` 命令 SHALL 显示每个 schema 的来源。

###### Scenario: 显示格式包含来源（Display format includes source）

- **WHEN** 用户运行 `openspec schemas`
- **THEN** 输出 SHALL 展示每个 schema 及其来源标签（project、user 或 package）

##### Requirement: 新建 change 时用 config schema 作为默认（Use config schema as default for new changes）

在没有显式 `--schema` 参数、且不适用 planning-home 默认值时，系统 SHALL 使用 `openspec/config.yaml` 里的 schema 字段作为新建 change 时的默认。

###### Scenario: 无 --schema 参数创建 change 且存在 config（Create change without --schema flag and config exists）

- **WHEN** 用户运行 `openspec new change foo`，不适用 planning-home 默认值，且 config 含有 `schema: "tdd"`
- **THEN** 系统以 schema "tdd" 创建该 change

###### Scenario: 无 --schema 参数创建 change 且无 config（Create change without --schema flag and no config）

- **WHEN** 用户运行 `openspec new change foo`，不适用 planning-home 默认值，且不存在 config 文件
- **THEN** 系统以默认 schema "spec-driven" 创建该 change

###### Scenario: 带显式 --schema 参数创建 change（Create change with explicit --schema flag）

- **WHEN** 用户运行 `openspec new change foo --schema custom`，且 config 含有 `schema: "tdd"`
- **THEN** 系统以 schema "custom" 创建该 change（CLI 参数覆盖 config）

##### Requirement: 按更新后的优先级顺序解析 schema（Resolve schema with updated precedence order）

系统 SHALL 按以下优先级顺序解析一个 change 的 schema：CLI 参数、change 元数据、planning-home 默认值、项目 config、硬编码默认值。

###### Scenario: 提供了 CLI 参数（CLI flag is provided）

- **WHEN** 用户带着 `--schema custom` 运行命令
- **THEN** 系统使用 "custom"，不管 change 元数据或 config 如何

###### Scenario: change 元数据指定了 schema（Change metadata specifies schema）

- **WHEN** change 的 `.openspec.yaml` 含有 `schema: bound`，而 config 含有 `schema: tdd`
- **THEN** 系统使用来自 change 元数据的 "bound"

###### Scenario: 只有项目 config 指定了 schema（Only project config specifies schema）

- **WHEN** 不存在 CLI 参数、change 元数据或 planning-home 默认值，但 config 含有 `schema: tdd`
- **THEN** 系统使用来自项目 config 的 "tdd"

###### Scenario: 哪里都没有指定 schema（No schema specified anywhere）

- **WHEN** 没有 CLI 参数、change 元数据、planning-home 默认值或项目 config
- **THEN** 系统使用硬编码默认值 "spec-driven"

##### Requirement: 支持 config 中的项目本地 schema 名（Support project-local schema names in config）

系统 SHALL 允许 config 的 schema 字段引用定义在 `openspec/schemas/` 中的项目本地 schema。

###### Scenario: config 引用了项目本地 schema（Config references project-local schema）

- **WHEN** config 含有 `schema: "my-workflow"` 且 `openspec/schemas/my-workflow/` 存在
- **THEN** 系统解析到该项目的本地 schema

###### Scenario: config 引用了不存在的 schema（Config references non-existent schema）

- **WHEN** config 含有 `schema: "nonexistent"` 且该 schema 不存在
- **THEN** 系统在尝试加载该 schema 时显示错误，附模糊匹配建议与全部有效 schema 的列表

##### Requirement: 为无效 schema 提供有用的错误信息（Provide helpful error message for invalid schema）

系统 SHALL 显示带有模糊匹配建议、可用 schema 列表与修复说明的 schema 错误。

###### Scenario: schema 名有拼写错误（近似匹配）（Schema name with typo (close match)）

- **WHEN** config 含有 `schema: "spce-driven"`（拼写错误）
- **THEN** 错误信息包含 "Did you mean: spec-driven (built-in)" 作为建议

###### Scenario: schema 名没有近似匹配（Schema name with no close matches）

- **WHEN** config 含有 `schema: "completely-wrong"`
- **THEN** 错误信息展示所有可用的内置与项目本地 schema 列表

###### Scenario: 错误信息包含修复说明（Error message includes fix instructions）

- **WHEN** config 引用了无效 schema
- **THEN** 错误信息包含 "Fix: Edit openspec/config.yaml and change 'schema: X' to a valid schema name"

###### Scenario: 错误区分内置与项目本地 schema（Error distinguishes built-in vs project-local schemas）

- **WHEN** 错误列出可用 schema 时
- **THEN** 输出清楚地把每一个标为 "built-in" 或 "project-local"

##### Requirement: 对既有 change 保持向后兼容（Maintain backwards compatibility for existing changes）

系统 SHALL 继续对没有项目 config 的既有 change 正常工作。

###### Scenario: 既有 change 没有 config（Existing change without config）

- **WHEN** change 在 config 功能之前就已创建，且不存在 config 文件
- **THEN** 系统用既有逻辑（change 元数据或硬编码默认值）解析 schema

###### Scenario: 既有 change 后来才加上 config（Existing change with config added later）

- **WHEN** config 文件被加到一个已有 change 的项目
- **THEN** 既有 change 继续使用它们从 `.openspec.yaml` 绑定的 schema

### 32.6 change-creation（路线 35）

> 源文件：`reference/openspec/openspec/specs/change-creation/spec.md`

**change-creation Specification**

#### Purpose

提供用于创建与校验 OpenSpec change 目录的程序化工具。

#### Requirements

##### Requirement: change 创建（Change Creation）

系统 SHALL 提供一个以程序化方式创建新 change 目录的函数。

###### Scenario: 创建 change（Create change）

- **WHEN** 调用 `createChange(projectRoot, 'add-auth')`
- **THEN** 系统创建 `openspec/changes/add-auth/` 目录

###### Scenario: 重复 change 被拒（Duplicate change rejected）

- **WHEN** 调用 `createChange(projectRoot, 'add-auth')` 且 `openspec/changes/add-auth/` 已经存在
- **THEN** 系统抛出一个表示该 change 已存在的错误

###### Scenario: 按需创建父目录（Creates parent directories if needed）

- **WHEN** 调用 `createChange(projectRoot, 'add-auth')` 且 `openspec/changes/` 不存在
- **THEN** 系统创建包含父目录的完整路径

###### Scenario: 无效 change 名被拒（Invalid change name rejected）

- **WHEN** 以无效的名字调用 `createChange(projectRoot, 'Add Auth')`
- **THEN** 系统抛出一个校验错误

##### Requirement: change 名校验（Change Name Validation）

系统 SHALL 校验 change 名遵循 kebab-case 约定。

###### Scenario: 有效的 kebab-case 名被接受（Valid kebab-case name accepted）

- **WHEN** 校验像 `add-user-auth` 这样的 change 名
- **THEN** 校验返回 `{ valid: true }`

###### Scenario: 数字后缀被接受（Numeric suffixes accepted）

- **WHEN** 校验像 `add-feature-2` 这样的 change 名
- **THEN** 校验返回 `{ valid: true }`

###### Scenario: 单个单词被接受（Single word accepted）

- **WHEN** 校验像 `refactor` 这样的 change 名
- **THEN** 校验返回 `{ valid: true }`

###### Scenario: 大写字符被拒（Uppercase characters rejected）

- **WHEN** 校验像 `Add-Auth` 这样的 change 名
- **THEN** 校验返回 `{ valid: false, error: "..." }`

###### Scenario: 空格被拒（Spaces rejected）

- **WHEN** 校验像 `add auth` 这样的 change 名
- **THEN** 校验返回 `{ valid: false, error: "..." }`

###### Scenario: 下划线被拒（Underscores rejected）

- **WHEN** 校验像 `add_auth` 这样的 change 名
- **THEN** 校验返回 `{ valid: false, error: "..." }`

###### Scenario: 特殊字符被拒（Special characters rejected）

- **WHEN** 校验像 `add-auth!` 这样的 change 名
- **THEN** 校验返回 `{ valid: false, error: "..." }`

###### Scenario: 前导连字符被拒（Leading hyphen rejected）

- **WHEN** 校验像 `-add-auth` 这样的 change 名
- **THEN** 校验返回 `{ valid: false, error: "..." }`

###### Scenario: 结尾连字符被拒（Trailing hyphen rejected）

- **WHEN** 校验像 `add-auth-` 这样的 change 名
- **THEN** 校验返回 `{ valid: false, error: "..." }`

###### Scenario: 连续连字符被拒（Consecutive hyphens rejected）

- **WHEN** 校验像 `add--auth` 这样的 change 名
- **THEN** 校验返回 `{ valid: false, error: "..." }`

### 32.7 cli-artifact-workflow（路线 36）

> 源文件：`reference/openspec/openspec/specs/cli-artifact-workflow/spec.md`

**cli-artifact-workflow Specification**

#### Purpose

定义面向已搭脚手架与活跃 change 的 artifact 工作流 CLI 行为（`status`、`instructions`、`templates` 以及各种 setup 流程）。

#### Requirements

##### Requirement: status 命令（Status Command）

系统 SHALL 显示一个 change 的 artifact 完成状态，包括已搭脚手架（空）的 change。

> **修复 bug**：此前经由 `getActiveChangeIds()` 要求 `proposal.md` 必须存在。

###### Scenario: 显示含全部状态的 status（Show status with all states）

- **WHEN** 用户运行 `openspec status --change <id>`
- **THEN** 系统显示每个 artifact 及其状态指示：
  - `[x]` 表示已完成的 artifact
  - `[ ]` 表示就绪的 artifact
  - `[-]` 表示被阻塞的 artifact（并列出缺失的依赖）

###### Scenario: status 显示完成摘要（Status shows completion summary）

- **WHEN** 用户运行 `openspec status --change <id>`
- **THEN** 输出包含完成百分比与计数（例如 "2/4 artifacts complete"）

###### Scenario: status JSON 输出（Status JSON output）

- **WHEN** 用户运行 `openspec status --change <id> --json`
- **THEN** 系统输出带有 changeName、schemaName、isPlanningComplete、isComplete 与 artifacts 数组的 JSON
- **AND** 只有当每一个未被跳过的 planning artifact 都存在时，`isPlanningComplete` 才为 true
- **AND** 被跳过的 artifact 算作已满足，而无需被创建
- **AND** `isComplete` 作为兼容别名保留，取值相同

###### Scenario: status JSON 包含 apply 所需（Status JSON includes apply requirements）

- **WHEN** 用户运行 `openspec status --change <id> --json`
- **THEN** 系统输出带有以下内容的 JSON：
  - `changeName`、`schemaName`、`isPlanningComplete`、`isComplete`、`artifacts` 数组
  - `applyRequires`：apply 阶段所需的 artifact ID 数组

###### Scenario: status JSON 暴露每个 artifact 的依赖边（Status JSON exposes each artifact's dependency edges）

- **WHEN** 用户运行 `openspec status --change <id> --json`
- **THEN** `artifacts` 数组里的每一条都包含 `requires`：它直接依赖的 artifact ID 数组
- **AND** 无论该 artifact 处于什么状态，`requires` 都存在，所以一个 `done` 的 artifact 依然报告它的依赖（让 agent 单凭 status 就能算出传递性的所需集合）

###### Scenario: status 按依赖顺序列出 artifact，并列时按声明顺序（Status lists artifacts in dependency order, declaration order breaking ties）

- **WHEN** 用户运行 `openspec status --change <id>`（文本或 `--json`）
- **THEN** artifact 按依赖顺序出现，所以依赖永远不会被列在需要它的东西之后
- **AND** 同时变为就绪的 artifact 保持 schema 声明它们的顺序，而不是被按字母序重排
- **AND** 因此第一个 `ready` 条目就是下一个要写的 artifact
- **AND** 被阻塞 artifact 的 `missingDeps` 也使用同一顺序

###### Scenario: 对脚手架 change 的 status（Status on scaffolded change）

- **WHEN** 用户对一个没有任何 artifact 的 change 运行 `openspec status --change <id>`
- **THEN** 系统显示所有 artifact 及其状态
- **AND** 根 artifact（无依赖）显示为就绪 `[ ]`
- **AND** 有依赖的 artifact 显示为被阻塞 `[-]`

###### Scenario: 缺少 change 参数（Missing change parameter）

- **WHEN** 用户运行 `openspec status` 时没有 `--change`
- **THEN** 系统显示一个错误并附可用 change 的列表
- **AND** 其中包含已搭脚手架的 change（没有 proposal.md 的目录）

###### Scenario: 未知 change（Unknown change）

- **WHEN** 用户运行 `openspec status --change unknown-id`
- **AND** 目录 `openspec/changes/unknown-id/` 不存在
- **THEN** 系统显示一个错误，列出所有可用的 change 目录

##### Requirement: 下一个 artifact 的发现（Next Artifact Discovery）

工作流 SHALL 使用 `openspec status` 的输出来确定接下来能创建什么，而不是另设一套 next 命令界面。

###### Scenario: 从 status 输出发现下一个 artifact（Discover next artifacts from status output）

- **WHEN** 用户需要知道接下来创建哪个 artifact
- **THEN** `openspec status --change <id>` 用 `[ ]` 标出就绪的 artifact
- **AND** 第一个 `[ ]` 条目就是 schema 推荐的下一个 artifact
- **AND** 继续这个工作流不需要任何专门的 "next command"

##### Requirement: instructions 命令（Instructions Command）

系统 SHALL 输出用于创建某个 artifact 的增强指令，对已搭脚手架的 change 亦然。

###### Scenario: 显示增强后的 instructions（Show enriched instructions）

- **WHEN** 用户运行 `openspec instructions <artifact> --change <id>`
- **THEN** 系统输出：
  - artifact 元数据（ID、输出路径、描述）
  - 模板内容
  - 依赖状态（done/missing）
  - 解锁的 artifact（完成后什么变得可用）

###### Scenario: instructions JSON 输出（Instructions JSON output）

- **WHEN** 用户运行 `openspec instructions <artifact> --change <id> --json`
- **THEN** 系统输出与 ArtifactInstructions 接口相匹配的 JSON

###### Scenario: 未知 artifact（Unknown artifact）

- **WHEN** 用户运行 `openspec instructions unknown-artifact --change <id>`
- **THEN** 系统显示一个错误，列出该 schema 的有效 artifact ID

###### Scenario: 依赖未满足的 artifact（Artifact with unmet dependencies）

- **WHEN** 用户为一个被阻塞的 artifact 请求 instructions
- **THEN** 系统显示 instructions，并附一条关于缺失依赖的警告

###### Scenario: 对脚手架 change 的 instructions（Instructions on scaffolded change）

- **WHEN** 用户对一个已搭脚手架的 change 运行 `openspec instructions proposal --change <id>`
- **THEN** 系统输出用于创建 proposal 的模板与元数据
- **AND** 不要求任何 artifact 已经存在

##### Requirement: templates 命令（Templates Command）

系统 SHALL 展示某个 schema 中所有 artifact 解析后的模板路径。

###### Scenario: 用默认 schema 列出模板路径（List template paths with default schema）

- **WHEN** 用户运行 `openspec templates`
- **THEN** 系统用默认 schema 展示每个 artifact 及其解析后的模板路径

###### Scenario: 用自定义 schema 列出模板路径（List template paths with custom schema）

- **WHEN** 用户运行 `openspec templates --schema tdd`
- **THEN** 系统展示指定 schema 的模板路径

###### Scenario: templates JSON 输出（Templates JSON output）

- **WHEN** 用户运行 `openspec templates --json`
- **THEN** 系统输出把 artifact ID 映射到模板路径的 JSON

###### Scenario: 模板解析来源（Template resolution source）

- **WHEN** 展示模板路径时
- **THEN** 系统指明每个模板是来自用户覆盖还是包内置

##### Requirement: new change 命令（New Change Command）

系统 SHALL 带校验地创建新的 change 目录。

###### Scenario: 创建有效 change（Create valid change）

- **WHEN** 用户运行 `openspec new change add-feature`
- **THEN** 系统创建 `openspec/changes/add-feature/` 目录

###### Scenario: 无效 change 名（Invalid change name）

- **WHEN** 用户以无效的名字运行 `openspec new change "Add Feature"`
- **THEN** 系统显示带有指引的校验错误

###### Scenario: 重复 change 名（Duplicate change name）

- **WHEN** 用户为一个已存在的 change 运行 `openspec new change existing-change`
- **THEN** 系统显示一个表示该 change 已存在的错误

###### Scenario: 带 description 创建（Create with description）

- **WHEN** 用户运行 `openspec new change add-feature --description "Add new feature"`
- **THEN** 系统创建该 change 目录，并把 description 写进 README.md

##### Requirement: schema 选择（Schema Selection）

系统 SHALL 支持为工作流命令选择自定义 schema。

###### Scenario: 默认 schema（Default schema）

- **WHEN** 用户不带 `--schema` 运行工作流命令
- **THEN** 系统使用 "spec-driven" schema

###### Scenario: 自定义 schema（Custom schema）

- **WHEN** 用户运行 `openspec status --change <id> --schema tdd`
- **THEN** 系统用指定的 schema 构建 artifact 图

###### Scenario: 未知 schema（Unknown schema）

- **WHEN** 用户指定一个未知 schema
- **THEN** 系统显示一个错误，列出可用的 schema

##### Requirement: 输出格式化（Output Formatting）

系统 SHALL 提供一致的输出格式。

###### Scenario: 彩色输出（Color output）

- **WHEN** 终端支持颜色
- **THEN** 状态指示使用颜色：绿色（done）、黄色（ready）、红色（blocked）

###### Scenario: 无彩色输出（No color output）

- **WHEN** 使用了 `--no-color` 参数或设置了 NO_COLOR 环境变量
- **THEN** 输出使用纯文本指示，不带 ANSI 颜色

###### Scenario: 进度指示（Progress indication）

- **WHEN** 加载 change 状态耗时较长
- **THEN** 系统在加载期间显示一个 spinner

##### Requirement: 实验性隔离（Experimental Isolation）

系统 SHALL 把 artifact 工作流命令实现成隔离的，以便于移除。

###### Scenario: 单文件实现（Single file implementation）

- **WHEN** artifact 工作流特性被实现时
- **THEN** 所有命令都在 `src/commands/artifact-workflow.ts`

###### Scenario: help 文本标记（Help text marking）

- **WHEN** 用户对任何 artifact 工作流命令运行 `--help`
- **THEN** help 文本指明该命令是实验性的

##### Requirement: schema 的 apply 块（Schema Apply Block）

系统 SHALL 支持 schema 定义中的 `apply` 块，用它控制实现何时以及如何开始。

###### Scenario: 带 apply 块的 schema（Schema with apply block）

- **WHEN** 一个 schema 定义了 `apply` 块
- **THEN** 系统用 `apply.requires` 确定在 apply 之前必须存在哪些 artifact
- **AND** 用 `apply.tracks` 识别用于进度跟踪的文件（如果没有则为 null）
- **AND** 用 `apply.instruction` 作为展示给 agent 的指导

###### Scenario: 不带 apply 块的 schema（Schema without apply block）

- **WHEN** 一个 schema 没有 `apply` 块
- **THEN** 系统要求所有未被跳过的 artifact 都存在之后 apply 才可用
- **AND** 一旦那些 artifact 都存在，就使用默认指令："All required artifacts complete. Proceed with implementation."

##### Requirement: apply instructions 命令（Apply Instructions Command）

系统 SHALL 通过 `openspec instructions apply` 生成感知 schema 的 apply 指令。

###### Scenario: 生成 apply instructions（Generate apply instructions）

- **WHEN** 用户运行 `openspec instructions apply --change <id>`
- **AND** 所有所需 artifact（按 schema 的 `apply.requires`）都存在
- **THEN** 系统输出：
  - `contextFiles`：把 artifact ID 映射到所有现存 artifact 具体路径数组
  - schema 特有的指令文本
  - 进度跟踪文件路径（如果设置了 `apply.tracks`）

###### Scenario: apply 因 artifact 缺失被阻塞（Apply blocked by missing artifacts）

- **WHEN** 用户运行 `openspec instructions apply --change <id>`
- **AND** 所需 artifact 缺失
- **THEN** 系统指明 apply 被阻塞
- **AND** 列出必须先创建哪些 artifact

###### Scenario: apply instructions JSON 输出（Apply instructions JSON output）

- **WHEN** 用户运行 `openspec instructions apply --change <id> --json`
- **THEN** 系统输出带有以下内容的 JSON：
  - `contextFiles`：把 artifact ID 映射到现存 artifact 具体路径数组的对象
  - `instruction`：apply 指令文本
  - `tracks`：进度文件的路径或 null
  - `applyRequires`：所需 artifact ID 的列表

##### Requirement: 工具选择参数（Tool selection flag）

`artifact-experimental-setup` 命令 SHALL 接受 `--tool <tool-id>` 参数来指定目标 AI 工具。

###### Scenario: 通过参数指定工具（Specify tool via flag）

- **WHEN** 用户运行 `openspec artifact-experimental-setup --tool cursor`
- **THEN** skill 文件被生成在 `.cursor/skills/`
- **AND** 命令文件按 Cursor 的 frontmatter 格式生成

###### Scenario: 缺少工具参数（Missing tool flag）

- **WHEN** 用户运行 `openspec artifact-experimental-setup` 时没有 `--tool`
- **THEN** 系统显示一个要求 `--tool` 参数的错误
- **AND** 在错误信息中列出有效的工具 ID

###### Scenario: 未知工具 ID（Unknown tool ID）

- **WHEN** 用户运行 `openspec artifact-experimental-setup --tool unknown-tool`
- **AND** 该工具 ID 不在 `AI_TOOLS` 中
- **THEN** 系统显示一个错误，列出有效的工具 ID

###### Scenario: 没有 skillsDir 的工具（Tool without skillsDir）

- **WHEN** 用户指定一个没有配置 `skillsDir` 的工具
- **THEN** 系统显示一个错误，指明该工具不支持生成 skill

###### Scenario: 没有命令适配器的工具（Tool without command adapter）

- **WHEN** 用户指定一个配有 `skillsDir` 但未注册命令适配器的工具
- **THEN** skill 文件被成功生成
- **AND** 命令生成被跳过，并给出一条信息性消息

##### Requirement: 输出消息（Output messaging）

`openspec init` 命令 SHALL 清晰地输出它生成了什么。

###### Scenario: 在输出中显示目标工具（Show target tool in output）

- **WHEN** 初始化创建或刷新某个工具配置时
- **THEN** 输出分别在 `Created:` 或 `Refreshed:` 之下包含该工具名

###### Scenario: 显示生成的路径（Show generated paths）

- **WHEN** 初始化生成 skill 或命令时
- **THEN** 输出总结它们的数量与目标目录
- **AND** 只报告所选 profile 与交付模式所启用的类型

###### Scenario: 显示跳过命令的消息（Show skipped commands message）

- **WHEN** 初始化因缺少适配器而跳过命令生成时
- **THEN** 输出包含消息："Commands skipped for: <tools> (no adapter)"
- **AND** `<tools>` 以逗号分隔列出被跳过的工具 ID

##### Requirement: status JSON 提供规划上下文（Status JSON provides planning context）

status 命令 SHALL 为 change 提供机器可读的规划上下文。

###### Scenario: 报告下一步（Reporting next steps）

- **WHEN** 用户运行 `openspec status --change <id> --json`
- **THEN** 输出 SHALL 包含给 agent 的下一步指导
- **AND** 该指导 SHALL 使用平实的行动语言

##### Requirement: status JSON 的 action 上下文（Status JSON action context）

status 命令 SHALL 暴露 action 上下文，让 agent 无需硬编码文件系统假设就能行动。

###### Scenario: repo 本地的 action 上下文（Repo-local action context）

- **GIVEN** 该 change 是 repo 本地的
- **WHEN** 用户运行 `openspec status --change <id> --json`
- **THEN** status JSON SHALL 保持既有的 artifact 状态行为
- **AND** 对使用 action 上下文的 agent，它 SHALL 报告一个 repo 本地的 planning home

##### Requirement: instructions 使用解析后的规划路径（Instructions use resolved planning paths）

artifact 与 apply 的 instructions SHALL 使用解析后的规划路径，而不是硬编码的 repo 本地 change 路径。

###### Scenario: repo 本地的 artifact instructions（Repo-local artifact instructions）

- **GIVEN** 该 change 是 repo 本地的
- **WHEN** 用户运行 `openspec instructions <artifact> --change <id> --json`
- **THEN** instruction 输出 SHALL 保持既有的 repo 本地路径

##### Requirement: 工作流技能使用 CLI artifact 上下文（Workflow skills use CLI artifact context）

生成的工作流技能 SHALL 把 OpenSpec CLI 输出当作 artifact 位置的唯一真相来源。

###### Scenario: 技能在 artifact 工作前查看 status（Skills inspect status before artifact work）

- **WHEN** 某个生成的工作流技能需要查看或创建某个 change 的 artifact
- **THEN** 它 SHALL 指示 agent 运行 `openspec status --change <id> --json`
- **AND** 它 SHALL 使用返回的规划上下文与 artifact 路径，而不是假定一条 repo 本地的 change 路径

###### Scenario: 技能在写 artifact 前使用 instructions（Skills use instructions before writing artifacts）

- **WHEN** 某个生成的工作流技能即将创建或更新一个 artifact
- **THEN** 它 SHALL 指示 agent 运行 `openspec instructions <artifact> --change <id> --json`
- **AND** 它 SHALL 写入该命令返回的解析后 artifact 路径

### 32.8 docs-agent-instructions（路线 36）

> 源文件：`reference/openspec/openspec/specs/docs-agent-instructions/spec.md`

**docs-agent-instructions Specification**

#### Purpose

定义生成出来的 agent 指令文档的撰写标准，使模板、示例与校验清单清晰且可直接复制。

#### Requirements

##### Requirement: 快速参考的放置（Quick Reference Placement）

AI instructions SHALL 以一个快速参考段开头，在任何叙述性指导之前先呈现必需的文件结构、模板与格式规则。

###### Scenario: 把模板放在开头（Loading templates at the top）

- **WHEN** `openspec/AGENTS.md` 被重新生成或更新
- **THEN** 标题之后的第一个实质段落 SHALL 为 `proposal.md`、`tasks.md`、spec delta 与 scenario 格式提供可直接复制的标题
- **AND** 把每个模板链接到对应的工作流步骤，以便深入阅读

##### Requirement: 内嵌模板与示例（Embedded Templates and Examples）

`openspec/AGENTS.md` SHALL 在 agent 做相应修改的位置就地包含完整的可复制/粘贴模板与内联示例。

###### Scenario: 提供文件模板（Providing file templates）

- **WHEN** 作者读到起草 proposal 与 delta 的工作流指导时
- **THEN** 提供与必需结构相匹配的围栏 Markdown 模板（`## Why`、`## ADDED Requirements`、`#### Scenario:` 等）
- **AND** 为每个模板配一个简短示例，展示正确的标题用法与 scenario 项目符号

##### Requirement: 校验前清单（Pre-validation Checklist）

`openspec/AGENTS.md` SHALL 提供一份简明的校验前清单，在运行 `openspec validate` 之前点出常见的格式错误。

###### Scenario: 突出常见的校验失败（Highlighting common validation failures）

- **WHEN** 读者读到校验指导时
- **THEN** 呈现一份清单，提醒他们核对 requirement 标题、scenario 格式与 delta 分段
- **AND** 其中包含关于至少要用 `#### Scenario:`、以及 scenario 之前要有描述性 requirement 文本的提醒

##### Requirement: 工作流指导的渐进披露（Progressive Disclosure of Workflow Guidance）

文档 SHALL 把初学者必需内容与进阶主题分开，让新人可以专注核心步骤，同时不失去对进阶工作流的访问。

###### Scenario: 组织入门与进阶章节（Organizing beginner and advanced sections）

- **WHEN** 重新组织 `openspec/AGENTS.md`
- **THEN** 保留一个只限于最小步骤（搭脚手架、起草、校验、请求评审）的引言段
- **AND** 把进阶主题（多 capability 的 change、归档细节、工具深入探讨）移到后面清楚标注的章节
- **AND** 从快速参考提供指向那些进阶章节的锚点链接

##### Requirement: 行为优先的 spec 撰写指导（Behavior-First Spec Authoring Guidance）

agent 指令文档 SHALL 明确教导：spec 捕捉的是可观测的行为契约，而实现细节属于 design/tasks。

###### Scenario: 区分 spec 内容与实现内容（Distinguishing spec vs implementation content）

- **WHEN** `openspec/AGENTS.md` 解释如何写 `spec.md`
- **THEN** 它 SHALL 指示 agent 纳入可被外部验证的行为、输入/输出、错误与约束
- **AND** 它 SHALL 指示 agent 在 spec 里避免内部的库/框架选择与类/函数级实现细节

###### Scenario: 把细节导向正确的 artifact（Routing detail to the right artifact）

- **WHEN** 实现细节确有必要时
- **THEN** 指令 SHALL 引导 agent 把它放进 `design.md` 或 `tasks.md`，而不是 `spec.md` 的行为 requirement 段

##### Requirement: 默认轻量的指导（Lightweight-by-Default Guidance）

agent 指令文档 SHALL 提倡最少的仪式与与风险相称的严谨度。

###### Scenario: 应用渐进式严谨（Applying progressive rigor）

- **WHEN** agent 为常规 change 起草 spec 时
- **THEN** 指令 SHALL 偏向简洁、轻量的 requirement 与 scenario
- **AND** 把更深、更完整的规格风格留给更高风险的 change（例如 API 破坏、迁移、跨团队或安全/隐私敏感的工作）

###### Scenario: 清晰时间最优化（Time-to-clarity optimization）

- **WHEN** 指导讨论起草工作流时
- **THEN** 它 SHALL 强调产出仍然可测试、可评审的最小 spec
