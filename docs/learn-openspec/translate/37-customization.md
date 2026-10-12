## 37 customization —— 自定义

> 译自 `reference/openspec/docs/customization.md`（原文 433 行 / 15,506 字节，全文翻译）。按 `READING-openspec.md` 第 37 项。所有命令、参数、路径、YAML 键、JSON 键、代码块与目录树按原样保留；只译正文。

OpenSpec 提供三层自定义：

| 层级 | 它做什么 | 最适合 |
|-------|--------------|----------|
| **项目配置** | 设置默认值，注入 context/rules | 大多数团队 |
| **自定义 schema** | 定义你自己的 workflow artifact | 流程独特的团队 |
| **全局覆盖** | 在所有项目间共享 schema | 高级用户 |

---

### 37.1 项目配置（Project Configuration）

`openspec/config.yaml` 文件是为你的团队自定义 OpenSpec 最省事的方式。它让你可以：

- **设置默认 schema** —— 不必在每条命令上写 `--schema`
- **注入项目 context** —— AI 看到你的技术栈、约定等
- **添加逐 artifact 规则** —— 针对特定 artifact 的自定义规则
- **添加逐 operation 指南** —— 给 apply 与 archive 工作的建议性偏好
- **记住集成选择** —— 例如 [GitHub Copilot cloud coding agent](supported-tools.md#github-copilot-cloud-coding-agent) 的 opt-in

#### 37.1.1 快速设置（Quick Setup）

```bash
openspec init
```

这会以交互方式带你创建一份配置。或者手动创建：

```yaml
# openspec/config.yaml
schema: spec-driven

context: |
  Tech stack: TypeScript, React, Node.js, PostgreSQL
  API style: RESTful, documented in docs/api.md
  Testing: Jest + React Testing Library
  We value backwards compatibility for all public APIs

rules:
  proposal:
    - Include rollback plan
    - Identify affected teams
  specs:
    - Use Given/When/Then format
    - Reference existing patterns before inventing new ones

operations:
  apply:
    guidance:
      - Run focused tests before the full suite
  archive:
    guidance:
      - Keep the completion summary concise

# Set by `openspec init` when you choose (or decline) the GitHub Copilot
# cloud coding agent; controls whether `init`/`update` generate its files.
githubCopilot:
  cloudAgent: false
```

#### 37.1.2 它如何工作（How It Works）

**默认 schema：**

```bash
# Without config
openspec new change my-feature --schema spec-driven

# With config - schema is automatic
openspec new change my-feature
```

**Context 与 rules 注入：**

生成任何 artifact 时，你的 context 和 rules 会被注入 AI 提示词：

```xml
<context>
Tech stack: TypeScript, React, Node.js, PostgreSQL
...
</context>

<rules>
- Include rollback plan
- Identify affected teams
</rules>

<template>
[Schema's built-in template]
</template>
```

- **Context** 出现在所有 artifact 中
- **Rules** 只出现在与之匹配的那个 artifact 中

**Operation 指南：**

`operations.apply.guidance` 与 `operations.archive.guidance` 是可选数组，
给出 agent 应当如何开展这些操作的、建议性的指示。它们与 `rules` 分开：operation
指南不约束 artifact 内容，而 artifact 规则**绝不**被改标成 operation 指南。

Apply 与 archive 在执行时取用这些输入：

```bash
openspec instructions apply --change my-feature --json
openspec instructions archive --change my-feature --json
```

两个面都返回当前项目的 `context` 和匹配的 `operationGuidance`，作为各自独立的可选
字段。每次调用都从解析出的 root 读一份新快照。选中 `--store <id>` 时，change、
context 与指南都来自那个 store，而不是当前仓库。
archive 指令命令是只读的：它不检查也不合并 delta spec、不写主 spec、不移动 change、
不跑静态 archive workflow。

项目 context 是一个必需的提示词级输入。生成的工作流读它，并应用相关的项目事实、约定
与约束。Operation 指南是可选的附加建议：工作流考虑每一条，并遵循那些适用且与内置
workflow 兼容的条目。

两个字段都与 CLI 控制的状态、解析出的路径、内置步骤、用户显式选择和 artifact 规则保持
分开。workflow 在保留控制值的同时报告 context 冲突。它不遵循不适用或相冲突的指南，并
说明原因。两个字段都不是可强制执行的检查，workflow 不会把它们的文本抄进实现文件、
spec、change artifact 或摘要 —— 除非用户另行要求那些内容。

**Archive 与 spec-sync 的输入安全：**

Archive、bulk archive 和独立的 sync 使用 `openspec status --json` 的
`artifactPaths.specs.existingOutputPaths` 作为唯一的 delta-spec 来源。没有 `specs`
artifact 的 schema，或者具体输出列表为空的 change，没有任何东西可同步；其它 artifact
不用来推断 delta spec。

在一次语义合并写入主 spec 之前，workflow 消费当前的
`openspec instructions specs --change <name> --json` 输出。返回的 `specs` 规则只约束
那次合并产出的主 spec。单次 archive 把这份快照传进内联 sync，独立 sync 直接取它，
bulk archive 在它第一次写 spec 之前取得每一份必需的快照。archive/specs 指令响应非零
或 JSON 无效时是**查找失败**，不是空输入：workflow 在受影响的 spec 写入或 change 移动
之前停下（对 bulk archive，是在任何批量写入或移动之前）。

这份配置不改变 archive 的执行阶段、用户提示、文件系统操作、语义合并的所有权、直接的
`openspec archive` 命令，也不改变 artifact `rules` 的结构与输出。

#### 37.1.3 Schema 解析顺序（Schema Resolution Order）

当 OpenSpec 需要一个 schema 时，按这个顺序检查：

1. CLI 参数：`--schema <name>`
2. Change 元数据（change 目录里的 `.openspec.yaml`）
3. 项目配置（`openspec/config.yaml`）
4. 默认值（`spec-driven`）

---

### 37.2 自定义 schema（Custom Schemas）

当项目配置不够用时，用一个完全自定义的 workflow 创建你自己的 schema。自定义 schema 放在
项目的 `openspec/schemas/` 目录里，与你的代码一起纳入版本控制。

```text
your-project/
├── openspec/
│   ├── config.yaml        # Project config
│   ├── schemas/           # Custom schemas live here
│   │   └── my-workflow/
│   │       ├── schema.yaml
│   │       └── templates/
│   └── changes/           # Your changes
└── src/
```

#### 37.2.1 Fork 一个已有的 schema（Fork an Existing Schema）

最快的自定义方式是 fork 一个内置 schema：

```bash
openspec schema fork spec-driven my-workflow
```

这把整个 `spec-driven` schema 复制到 `openspec/schemas/my-workflow/`，你可以在那里随意编辑。

**你会得到：**

```text
openspec/schemas/my-workflow/
├── schema.yaml           # Workflow definition
└── templates/
    ├── proposal.md       # Template for proposal artifact
    ├── spec.md           # Template for specs
    ├── design.md         # Template for design
    └── tasks.md          # Template for tasks
```

现在编辑 `schema.yaml` 来改变 workflow，或者编辑 template 来改变 AI 生成什么。

#### 37.2.2 从零创建一个 schema（Create a Schema from Scratch）

针对一个完全崭新的 workflow：

```bash
# Interactive
openspec schema init research-first

# Non-interactive
openspec schema init rapid \
  --description "Rapid iteration workflow" \
  --artifacts "proposal,tasks" \
  --default
```

#### 37.2.3 Schema 结构（Schema Structure）

一个 schema 定义你的 workflow 里有哪些 artifact，以及它们如何互相依赖：

```yaml
# openspec/schemas/my-workflow/schema.yaml
name: my-workflow
version: 1
description: My team's custom workflow

artifacts:
  - id: proposal
    generates: proposal.md
    description: Initial proposal document
    template: proposal.md
    instruction: |
      Create a proposal that explains WHY this change is needed.
      Focus on the problem, not the solution.
    requires: []

  - id: design
    generates: design.md
    description: Technical design
    template: design.md
    instruction: |
      Create a design document explaining HOW to implement.
    requires:
      - proposal    # Can't create design until proposal exists

  - id: tasks
    generates: tasks.md
    description: Implementation checklist
    template: tasks.md
    requires:
      - design

apply:
  requires: [tasks]
  tracks: tasks.md
```

**关键字段：**

| 字段 | 用途 |
|-------|---------|
| `id` | 唯一标识符，用在命令与规则里 |
| `generates` | 输出文件名（支持 `specs/**/*.md` 这类 glob） |
| `template` | `templates/` 目录里的模板文件 |
| `instruction` | 创建这个 artifact 的 AI 指令 |
| `requires` | 依赖 —— 哪些 artifact 必须先存在 |

按你希望它们被写入的顺序列出 artifact。`requires` 决定什么是可能的；当多个 artifact
同时就绪时，`artifacts:` 列表的顺序决定哪个排在最前。

#### 37.2.4 模板（Templates）

模板是引导 AI 的 markdown 文件。创建那个 artifact 时，它们被注入提示词。

```markdown
<!-- templates/proposal.md -->
## Why

<!-- Explain the motivation for this change. What problem does this solve? -->

## What Changes

<!-- Describe what will change. Be specific about new capabilities or modifications. -->

## Impact

<!-- Affected code, APIs, dependencies, systems -->
```

模板可以包含：
- 供 AI 填写的段落标题
- 给 AI 的 HTML 注释指引
- 展示预期结构的示例格式

#### 37.2.5 校验你的 schema（Validate Your Schema）

使用自定义 schema 之前，先校验它：

```bash
openspec schema validate my-workflow
```

这会检查：
- `schema.yaml` 语法正确
- 所有被引用的模板都存在
- 没有循环依赖
- Artifact ID 合法

#### 37.2.6 使用你的自定义 schema（Use Your Custom Schema）

创建之后，这样使用你的 schema：

```bash
# Specify on command
openspec new change feature --schema my-workflow

# Or set as default in config.yaml
schema: my-workflow
```

#### 37.2.7 调试 schema 解析（Debug Schema Resolution）

不确定正在用哪个 schema？这样检查：

```bash
# See where a specific schema resolves from
openspec schema which my-workflow

# List all available schemas
openspec schema which --all
```

输出会显示它来自你的项目、用户目录，还是包：

```text
Schema: my-workflow
Source: project
Path: /path/to/project/openspec/schemas/my-workflow
```

---

> **注意：** OpenSpec 也支持位于 `~/.local/share/openspec/schemas/` 的用户级 schema，
> 用于跨项目共享；但推荐用 `openspec/schemas/` 里的项目级 schema，因为它们与你的代码
> 一起纳入版本控制。

---

### 37.3 示例（Examples）

#### 37.3.1 快速迭代 workflow（Rapid Iteration Workflow）

一个用于快速迭代的最小 workflow：

```yaml
# openspec/schemas/rapid/schema.yaml
name: rapid
version: 1
description: Fast iteration with minimal overhead

artifacts:
  - id: proposal
    generates: proposal.md
    description: Quick proposal
    template: proposal.md
    instruction: |
      Create a brief proposal for this change.
      Focus on what and why, skip detailed specs.
    requires: []

  - id: tasks
    generates: tasks.md
    description: Implementation checklist
    template: tasks.md
    requires: [proposal]

apply:
  requires: [tasks]
  tracks: tasks.md
```

#### 37.3.2 加一个评审 artifact（Adding a Review Artifact）

Fork 默认 schema 并加一个评审步骤：

```bash
openspec schema fork spec-driven with-review
```

然后编辑 `schema.yaml` 加入：

```yaml
  - id: review
    generates: review.md
    description: Pre-implementation review checklist
    template: review.md
    instruction: |
      Create a review checklist based on the design.
      Include security, performance, and testing considerations.
    requires:
      - design

  - id: tasks
    # ... existing tasks config ...
    requires:
      - specs
      - design
      - review    # Now tasks require review too
```

---

### 37.4 社区 schema（Community Schemas）

OpenSpec 也支持通过独立仓库分发的、由社区维护的 schema。它们提供带有明确取舍的
workflow，把 OpenSpec 与其它工具或系统集成起来，类似于
[github/spec-kit 的社区扩展目录](https://github.com/github/spec-kit/tree/main/extensions)
对 spec-kit 的作用。

社区 schema 不被 vendor 进 OpenSpec 核心 —— 它们住在自己的仓库里，有自己的发布节奏。
要使用其中一个，把 schema bundle 复制进你项目的 `openspec/schemas/<schema-name>/`
目录（每个仓库的 README 都有安装说明）。

| Schema | 维护者 | 仓库 | 描述 |
|--------|-----------|-----------|-------------|
| `intent-driven` | @harikrishnan83 | [intent-driven-dev/openspec-schemas](https://github.com/intent-driven-dev/openspec-schemas/tree/main/openspec/schemas/intent-driven) | 在实现之前捕获变更意图、可观察行为、技术设计与持久的架构决策。增加一份 change 本地的 ADR 评审清单，并把合格的长寿决策写成不可变、可被取代的 ADR。 |
| `superpowers-bridge` | @JiangWay | [JiangWay/openspec-schemas](https://github.com/JiangWay/openspec-schemas/tree/main/superpowers-bridge) | 把 OpenSpec 的 artifact 治理与 [obra/superpowers](https://github.com/obra/superpowers) 的执行技能（brainstorming、writing-plans、经由 subagent 的 TDD、code review、finishing）集成起来。增加一个证据优先的 `retrospective` artifact，填补 Superpowers 原生未覆盖的缺口。 |
| `nanopm` | @nmrtn | [nmrtn/nanopm](https://github.com/nmrtn/nanopm/tree/main/openspec-schema) | PM 优先的 workflow。在实现上游跑 [nanopm](https://github.com/nmrtn/nanopm) 的规划管线（audit → strategy → roadmap → PRD）。桥接产品规划与 OpenSpec 的 spec-driven 工程 workflow。若 `.nanopm/` 存在，artifact 从它读取 —— proposal 取材于 audit，design 取材于 strategy，tasks 取材于 PRD 拆解。 |
| `e2e-runbooks` | @Lukk17 | [Lukk17/openspec-schemas](https://github.com/Lukk17/openspec-schemas/tree/master/openspec/schemas/e2e-runbooks) | 能力级的端到端测试 runbook。每个 capability 得到一份不可变的 spec、一份不可变的 tasks 模板，以及每次执行一条带时间戳的 run 记录。断言只针对可观察行为（HTTP 状态、响应体、持久化状态 —— 绝不是日志子串）；每次 run 记录 UTC 起止时间、时长，以及尽力估算的 LLM token 消耗。 |
| `anvil` | @jikkujoyce | [jikkujoyce/openspec-schemas](https://github.com/jikkujoyce/openspec-schemas/tree/main/schemas/anvil) | 带 TDD 纪律与一个对抗性评审步骤的 spec-driven workflow。流程：`proposal` → `specs` → `design` → `review` → `test-plan` → `tasks` → `apply` → `verify`。`review` 由一个全新上下文、只读的评审者撰写（有可用时用第二个模型），并输出一行 `VERDICT:` 告诉 agent 给 `test-plan`、`tasks` 和 `apply` 设闸；OpenSpec 只检查 artifact 是否存在，所以要用你自己的 CI 或 hook 来强制执行那道闸。`test-plan` 把每条 spec scenario 映射到一个具名测试，并兼作一份红/绿账本，由 `verify` 审计。 |

> 想贡献一个社区 schema？提一个 issue 附上你仓库的链接，或者提交一个往这张表里加一行的 PR。

---

### 37.5 另见（See Also）

- [CLI 参考：Schema 命令（CLI Reference: Schema Commands）](cli.md#schema-commands) - 完整的命令文档
