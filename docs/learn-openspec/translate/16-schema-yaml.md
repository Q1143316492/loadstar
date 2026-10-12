## 16 schema.yaml —— spec-driven 工作流的定义

> 译自 `reference/openspec/schemas/spec-driven/schema.yaml`（原文 247 行）。按 `READING-openspec.md` 第 16 项。YAML 结构键（`name` / `version` / `description` / `artifacts` / `id` / `generates` / `template` / `requires` / `apply` / `tracks`）与所有内嵌示例、命令、路径原样保留；只译 `instruction:` 段的正文。
> 第 16 项只点这个文件；文末 16.7 附上它引用的四个 template（共 76 行，极短，且 instruction 里多处直接指向它们），原样保留不译。

### 16.1 文件整体结构

```yaml
name: spec-driven
version: 1
description: Default OpenSpec workflow - proposal → specs → design → tasks
artifacts:
  # 四个 artifact，见 16.2 - 16.5
apply:
  # 实现阶段，见 16.6
```

| id | generates | template | requires |
|---|---|---|---|
| `proposal` | `proposal.md` | `proposal.md` | `[]` |
| `specs` | `specs/**/*.md`（glob） | `spec.md` | `[proposal]` |
| `design` | `design.md` | `design.md` | `[proposal]` |
| `tasks` | `tasks.md` | `tasks.md` | `[specs, design]` |

`apply` 段：`requires: [tasks]`、`tracks: tasks.md`。

### 16.2 artifact：proposal

```yaml
  - id: proposal
    generates: proposal.md
    description: Initial proposal document outlining the change
    template: proposal.md
    instruction: |
      # 以下为译文
    requires: []
```

**instruction 译文：**

创建 proposal 文档，确立这次 change **为什么**需要。

分段：

- **Why**：用 1–2 句话说明问题或机会。这解决了什么问题？为什么是现在？
- **What Changes**：用项目符号列出变更。对新增的 capability、修改或移除要具体。破坏性变更标记 **BREAKING**。
- **Capabilities**：指明哪些 spec 将被创建或修改：
  - **New Capabilities**：列出被引入的 capability。每个都会成为一个新的 `specs/<capability-path>/spec.md`。你新引入的路径段用 kebab-case（例如 `user-auth` 或 `identity/user-auth`），并遵循项目既有的 spec 组织方式。
  - **Modified Capabilities**：列出现有 capability 中 **REQUIREMENT** 正在变化的那些。只在 spec 级行为变化时列出（不只是实现细节）。每个都需要一个 delta spec 文件。使用 `openspec/specs/` 下**确切**的既有路径。如果没有 requirement 变化就留空。
- **Impact**：受影响的代码、API、依赖或系统。

**重要**：Capabilities 这一节是关键。它在 proposal 阶段和 specs 阶段之间建立了契约。填写之前先研究既有 spec：跑 `openspec list --specs` 拿到项目的 capability 清单，然后对看起来相关的那些跑 `openspec show "<spec-id>" --type spec --json --no-scenarios` —— 它会返回一个 capability 的 purpose 和 requirement 文本，而不会把整个 spec 文件拉进上下文。只有面对一个已注册的独立 store 时才给这两条命令加上 `--store "<id>"`，并且要保留 `--type spec`：否则一个同名 change 和一个 spec 会被报成 ambiguous-item 错误。不带 `--specs` 的 `openspec list` 列的是进行中的 change，不是 spec —— 它永远不显示项目已经覆盖了什么。复用既有 capability 的确切路径，不要引入一个近似重复的名字。过滤式的读取只是一个概览。在判断什么已被覆盖、什么该变化之前，要用 `openspec show "<spec-id>" --type spec`（同样的 `--store` 规则）把每个相关 spec 连同 scenario 完整读一遍。这里列出的每个 capability 都会需要一个对应的 spec 文件。

每个 change 要么声明至少一个 capability（新增或修改），要么明确选择不要 spec：除非这个 change 的 `.openspec.yaml` 设置了 `skip_specs: true`，否则 `openspec validate` 会拒收一个零 delta 的 change。只有没有任何 spec 级行为变化时（纯重构、工具链、文档）才用 `skip_specs: true` —— spec 描述行为，所以如果行为没变，spec 也不该变。不要为了满足校验而编造一条 requirement。

保持简洁（1–2 页）。聚焦「为什么」而不是「怎么做」—— 实现细节属于 design.md。

这是地基 —— specs、design 和 tasks 都建立在它之上。

### 16.3 artifact：specs

```yaml
  - id: specs
    generates: "specs/**/*.md"
    description: Detailed specifications for the change
    template: spec.md
    instruction: |
      # 以下为译文
    requires:
      - proposal
```

**instruction 译文：**

创建定义系统**该做什么**的规格说明文件。

一个 spec 是行为契约，不是实现计划。

好的 spec 内容：
- 用户或下游系统依赖的可观测行为
- 输入、输出和错误条件
- 外部约束（安全、隐私、可靠性、兼容性）
- 可被测试或明确验证的 scenario

spec 里要避免的：
- 内部类名/函数名
- 库或框架的选择
- 逐步的实现细节
- 详细的执行计划（那些属于 design.md 或 tasks.md）

快速检验：如果实现可以变而不改变外部可见行为，那它多半不属于 spec。

为 proposal 的 Capabilities 一节里列出的每个 capability 创建一个 spec 文件。
`<capability-path>` 是 spec 目录相对于 `specs/` 的路径（例如 `user-auth` 或 `identity/user-auth`）。保留完整路径：
- 新 capability：使用 proposal 里给出的确切路径 `specs/<capability-path>/spec.md`。proposal 里新引入的任何路径段都必须是 kebab-case。遵循项目既有的组织方式；当项目使用扁平布局时，不要新增一个 domain 层级。
- 修改的 capability：创建 delta 时，使用 `openspec/specs/<capability-path>/` 下确切的既有路径，写到 `specs/<capability-path>/spec.md`。写 delta 之前跑 `openspec list --specs` 确认那个路径，只有面对一个已注册的独立 store 时才追加 `--store "<id>"` —— 一个打错或凭空想出来的路径会指向一个不存在的 capability，而不是你想要的。不要移动或重命名该 capability。

除非这个 change 的 `.openspec.yaml` 设置了 `skip_specs: true`（没有 spec 级行为变化），否则至少必须有一个 spec 文件 —— `openspec validate` 会拒收一个没有该标记的零 delta change。如果 proposal 没列出任何 capability 而又没设 `skip_specs`，先回头改 proposal。

delta 操作（用 `##` 标题）：
- **ADDED Requirements**：新 capability
- **MODIFIED Requirements**：变化的行为 —— **必须**包含完整的更新后内容
- **REMOVED Requirements**：被废弃的功能 —— **必须**包含 **Reason** 和 **Migration**
- **RENAMED Requirements**：仅改名 —— 使用 FROM:/TO: 格式

格式要求：
- 每条 requirement：`### Requirement: <name>` 后接描述
- 规范性陈述使用 SHALL/MUST（避免 should/may）
- 每个 scenario：`#### Scenario: <name>`，用 WHEN/THEN 格式
- **关键**：scenario 必须正好用 4 个井号（`####`）。用 3 个井号或项目符号会**静默失败**。
- 每条 requirement **必须**至少有一个 scenario。

仅限新 capability：delta spec 的第一节是 `## Purpose` —— 一两句话（50+ 字符，否则 `openspec validate --strict` 会报它太短），描述这个 capability 是干什么的。归档时它会拷进所创建的主 spec；没有它，新的主 spec 会被留下一个 `TBD ... Update Purpose after archive` 占位符需要手工填。**不要**给既有 capability 的 delta 加 `## Purpose` —— 那个 spec 已经有了，delta 里的会被忽略。要改一个既有 capability 的 Purpose —— 包括改掉遗留的 `TBD` 占位符 —— 直接编辑 `<planningHome.root>/openspec/specs/<capability-path>/spec.md`。`planningHome.root` 来自 `openspec instructions ... --json` 的响应。始终用它而不是仓库相对路径：每当 change 住在一个 store 里时它都解析到那个 store —— 无论那个 store 来自 `--store`、项目里的 `store:` 指针，还是全局默认 store —— 否则解析到当前仓库。不要去判断是哪种情况；那个字段已经判好了。

MODIFIED requirement 的工作流：
1. 在 `<planningHome.root>/openspec/specs/<capability-path>/spec.md`（同上那个 store 感知的 root）里定位既有的 requirement
2. 拷贝**整个** requirement 块（从 `### Requirement:` 起，含所有 scenario）
3. 粘贴到 `## MODIFIED Requirements` 下，改成反映新行为
4. 确保标题文本完全一致（忽略空白差异）

常见坑：用 MODIFIED 却只给部分内容，会在归档时丢细节。
如果是在不改变既有行为的前提下**增加**新的关注点，用 ADDED。

示例（这是一个新 capability，所以它的第一节是 `## Purpose`）：

```
# Spec Delta

## Purpose

Lets users take their data out of the product in a portable format.

## ADDED Requirements

### Requirement: User can export data
The system SHALL allow users to export their data in CSV format.

#### Scenario: Successful export
- **WHEN** user clicks "Export" button
- **THEN** system downloads a CSV file with all user data

## REMOVED Requirements

### Requirement: Legacy export
**Reason**: Replaced by new export system
**Migration**: Use new export endpoint at /api/v2/export
```

Spec 应该是可测试的 —— 每个 scenario 都是一个潜在的测试用例。

### 16.4 artifact：design

```yaml
  - id: design
    generates: design.md
    description: Technical design document with implementation details
    template: design.md
    instruction: |
      # 以下为译文
    requires:
      - proposal
```

**instruction 译文：**

创建阐明**如何**实现这个 change 的 design 文档。

什么时候要包含 design.md（以下任一条成立时才创建）：
- 横切性变更（多个服务/模块）或新的架构模式
- 新的外部依赖或显著的数据模型变化
- 安全、性能或迁移方面的复杂度
- 在动手写代码之前，有一些模糊性靠技术决策能受益

分段：
- **Context**：只写解释这个方法所需的当前状态和约束。引用 proposal 说明动机，而不是复述它（例如 "See proposal.md - Why"）。
- **Goals / Non-Goals**：这个 design 达成什么、明确排除什么。不要复述 proposal 的范围 —— 只加 design 层面的边界。
- **Decisions**：关键技术选型及其理由（为什么选 X 而不是 Y？）。每个决策都要包含考虑过的替代方案。
- **Risks / Trade-offs**：已知局限、可能出问题的地方。格式：[Risk] → Mitigation
- **Migration Plan**：部署步骤、回滚策略（如果适用）
- **Open Questions**：可以安全地晚点回答、且不会改变 spec、方法或任务拆解的未知项。没有就省略。

Open question 是给真正可以推迟的未知项的，不是你跳过的决策。如果某个问题会改变 spec、所选方法或任务拆解，现在就解决它 —— 去问用户，不要猜。

聚焦架构和方法，不要逐行实现。proposal 覆盖为什么和做什么；design 覆盖怎么做。引用 proposal 来说明动机，spec 写完后引用 spec 来说明 requirement —— 如果某一节只会复述它们，那就改为指向它们。

好的 design 文档解释技术决策**背后**的为什么。

### 16.5 artifact：tasks

```yaml
  - id: tasks
    generates: tasks.md
    description: Implementation checklist with trackable tasks
    template: tasks.md
    instruction: |
      # 以下为译文
    requires:
      - specs
      - design
```

**instruction 译文：**

创建把实现工作拆解开的任务清单。

写 task 之前，先看 design.md 里的 Open Questions。如果其中有任何一个会改变要建什么，先和用户一起解决 —— 不要把未言明的假设烤进任务清单。

**重要：严格遵循下面的模板。** apply 阶段靠解析 checkbox 格式来追踪进度。一个只装着 `x` 的框算作完成，大小写不限、空格任意，所以 `- [ x]` 也算完成。其它任何标记，包括 `- [~]`、`- [-]` 和一个空的 `- []`，都读作未完成。没有 checkbox 的行根本不被追踪。

准则：
- 把相关 task 归到 `##` 编号标题下
- 每个 task **必须**是一个 checkbox：`- [ ] X.Y Task description`
- task 应该足够小，能在一次会话里完成
- 按依赖排序 task（什么必须先做？）
- 每个 task **必须**说明如何验证完成（一个测试、命令、可观测行为，或交付的产物）。把验证写进那个 task 的 checkbox 描述里。只有当某个验证检查的是跨多个实现任务的更大范围集成或系统行为时，才单列一个验证 task。
- 每个 task 组**必须**把它自己的工作所要求的测试和文档落在**该组内部**。**不要**把测试或文档收进最后一个组 —— 当一个靠后的组第一次检验靠前组的工作时，失败会沿着中间每个组级联回来，逼你返工。如果某个组的工作既不需要测试也不需要文档（例如搭脚手架或装依赖），那它就两样都不带。最后一个组只放集成检查，不是用来补前面各组欠下的测试和文档。

示例：
```
# Tasks

## 1. Setup

- [ ] 1.1 Create new module structure and verify expected files are present
- [ ] 1.2 Add dependencies to package.json and verify package installation succeeds

## 2. Core Implementation

- [ ] 2.1 Implement data export function and verify the export test passes
- [ ] 2.2 Add CSV formatting utilities and verify unit tests cover quoting and delimiters
- [ ] 2.3 Document the export API in docs/export.md and verify the documented command runs as written
```

参考 specs 了解需要建什么，参考 design 了解怎么建。

### 16.6 apply 段

```yaml
apply:
  requires: [tasks]
  tracks: tasks.md
  instruction: |
    Read context files, work through pending tasks, mark complete as you go.
    Pause if you hit blockers or need clarification.
```

**instruction 译文：**

读取上下文文件，逐项处理待办任务，边做边标记完成。
碰到阻碍或需要澄清时就暂停。

### 16.7 附录：四个 template（原样保留，不译）

`schemas/spec-driven/templates/proposal.md`（31 行）：

```markdown
# Proposal

## Why

<!-- Explain the motivation for this change. What problem does this solve? Why now? -->

## What Changes

<!-- Describe what will change. Be specific about new capabilities, modifications, or removals. -->

## Capabilities

### New Capabilities
<!-- Capabilities being introduced. Use kebab-case for path segments you introduce
     (e.g., user-auth or identity/user-auth) that follow the project's existing
     spec organization. Each creates specs/<capability-path>/spec.md. -->
- `<capability-path>`: <brief description of what this capability covers>

### Modified Capabilities
<!-- Existing capabilities whose REQUIREMENTS are changing (not just implementation).
     Only list here if spec-level behavior changes. Each needs a delta spec file.
     Use the exact existing path under openspec/specs/. Leave empty if no requirement
     changes. A change with no capabilities at all (pure refactor, tooling, docs)
     must set `skip_specs: true` in its .openspec.yaml - openspec validate rejects
     a zero-delta change without that marker. Do not invent a requirement just to
     satisfy validation. -->
- `<existing-capability-path>`: <what requirement is changing>

## Impact

<!-- Affected code, APIs, dependencies, systems -->
```

`schemas/spec-driven/templates/spec.md`（13 行）：

```markdown
# Spec Delta

## Purpose
<!-- New capabilities only: one or two sentences (50+ characters) on what this capability is for. Delete this section for an existing capability. -->

## ADDED Requirements

### Requirement: <!-- requirement name -->
<!-- requirement text -->

#### Scenario: <!-- scenario name -->
- **WHEN** <!-- condition -->
- **THEN** <!-- expected outcome -->
```

`schemas/spec-driven/templates/design.md`（21 行）：

```markdown
# Design

## Context

<!-- Current state and constraints that shape the approach. See proposal.md for motivation - don't restate it -->

## Goals / Non-Goals

**Goals:**
<!-- What this design aims to achieve -->

**Non-Goals:**
<!-- What is explicitly out of scope -->

## Decisions

<!-- Key design decisions with rationale and alternatives considered -->

## Risks / Trade-offs

<!-- Known risks and trade-offs -->
```

`schemas/spec-driven/templates/tasks.md`（11 行）：

```markdown
# Tasks

## 1. <!-- Task Group Name -->

- [ ] 1.1 <!-- Task description -->
- [ ] 1.2 <!-- Task description -->

## 2. <!-- Task Group Name -->

- [ ] 2.1 <!-- Task description -->
- [ ] 2.2 <!-- Task description -->
```
