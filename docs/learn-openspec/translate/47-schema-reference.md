## 47 schema 参考 —— 格式与 spec-driven 的产物

> 译自 `reference/openspec/docs-lab/reference/schemas/schema-yaml.md`（原文 228 行）与 `reference/openspec/docs-lab/reference/schemas/spec-driven/index.md`（原文 476 行）。按 `READING-openspec.md` 第 47 项；这两篇是第 16 项（`schemas/spec-driven/schema.yaml`）的展开版。
> 字段名、类型、默认值、代码块、ASCII 图、目录树、文件名、路径、flag、链接目标与表格结构原样保留；只译正文描述。

### 47.1 schema-yaml.md —— schema 格式的字段级参考

> 一个 schema 定义的每一个字段，供阅读或编写 schema 时使用。

`schema.yaml` 列出一个工作流会创建哪些规划文件。它还定义它们的顺序，以及向实现阶段的交接。

#### 47.1.1 位置（Location）

一个项目 schema 住在 `openspec/schemas/<name>/` 下：

```text
openspec/schemas/review-first/
├── schema.yaml
└── templates/
    ├── proposal.md
    └── tasks.md
```

OpenSpec 会在三个地方查找这个目录。第一个匹配者胜出。

| Copy | Directory |
|---|---|
| **1. Project** | `<project>/openspec/schemas/<name>/` |
| **2. User, macOS and Linux** | `~/.local/share/openspec/schemas/<name>/` |
| **2. User, Windows** | `%LOCALAPPDATA%\openspec\schemas\<name>\` |
| **3. Package** | 随 CLI 一起安装的 schemas |

如果设置了 `XDG_DATA_HOME`，那么在每一个平台上，用户目录都会移到 `$XDG_DATA_HOME/openspec/schemas/<name>/`。

目录名就是查找键，由 `--schema`、`config.yaml` 和 [`.openspec.yaml`](../configuration/change-metadata.md#schema) 使用。如果 `name` 字段与目录名不同，OpenSpec 查找时仍然使用目录名。

[`openspec schema which <name>`](../cli.md#openspec-schema-which) 打印当前生效的目录，以及它遮住的、优先级更低的副本。

#### 47.1.2 顶层字段（Top-level fields）

| Field | Contract |
|---|---|
| `name` | **必填。** 一个非空字符串，作为 schema 名存储。查找仍然使用目录名。 |
| `version` | **必填。** 一个正整数，作为 schema 修订号存储。这个值不改变 OpenSpec 的行为。 |
| `description` | 一个可选字符串，由 `openspec schemas` 打印。没有值时，schema 没有描述。 |
| `artifacts` | **必填。** 一个非空的 [artifact 条目](#artifact-fields)列表。 |
| `apply` | 可选的 [apply 设置](#apply-fields)。没有这个块时，OpenSpec 使用 [apply 默认值](#apply-defaults)。 |

#### 47.1.3 artifact 字段（Artifact fields）

`artifacts` 下的每一个条目定义一个规划文件或一组文件。

| Field | Contract |
|---|---|
| `id` | **必填。** 一个唯一、非空的字符串，用于依赖、项目规则、命令和 apply 设置。 |
| `generates` | **必填。** 一个相对路径或 glob，告诉 agent 把 artifact 写到 change 文件夹里的哪里。 |
| `description` | **必填。** 一个字符串，在发给 agent 的指令里给这个 artifact 打标签。 |
| `template` | **必填。** 指向这个 artifact 在 schema 的 `templates/` 文件夹里格式的相对路径。 |
| `instruction` | 可选指导，告诉 agent 该产出什么内容。 |
| `requires` | 一个 artifact ID 列表，这些 artifact 必须先完成。默认：`[]`。 |

##### 47.1.3.1 `generates`

路径从 change 文件夹开始。对于一个名为 `add-auth` 的 change：

```yaml
generates: proposal.md
```

artifact 落在这里：

```text
openspec/changes/add-auth/proposal.md
```

一个 glob 可以匹配多个文件：

```yaml
generates: specs/**/*.md
```

这会匹配 `openspec/changes/add-auth/specs/` 之下的 Markdown 文件。

OpenSpec 在 `generates` 里识别这些 glob 形式：

- **通配符与字符类**：包含 `*`、`?` 或 `[` 的值，例如 `specs/**/*.md` 和 `review-[ab].md`。
- **花括号展开**：像 `review-{api,ui}.md` 这样的备选，以及像 `file-{1..3}.md` 这样的区间。
- **Extglobs**：诸如 `@(proposal|design).md`、`+(proposal|design).md` 和 `!(proposal|design).md` 这样的模式。

**字面文件名**：单独一个前导 `!` 不构成 glob。用 `generates: '!review.md'` 来指那个文件。像 `(proposal|design).md` 这样的普通括号，以及像 `review-{api}.md` 这样的单元素花括号，同样仍然按字面处理。

OpenSpec 拒绝绝对路径，以及包含 `..` 段的路径。

###### 47.1.3.1.1 完成判定（Completion）

OpenSpec 检查输出是否存在。它不通过读取文件来判断 artifact 是否完成。

| `generates` value | Complete when |
|---|---|
| `proposal.md` | 那个文件存在。 |
| `specs/**/*.md` | 这个 glob 至少匹配到一个文件。 |

##### 47.1.3.2 `template`

路径从 schema 的 `templates/` 文件夹开始。在 `review-first` schema 里：

```yaml
template: proposal.md
```

OpenSpec 读取这个文件：

```text
openspec/schemas/review-first/templates/proposal.md
```

OpenSpec 把 template 的内容作为输出格式交给 agent。它不会把 template 复制到 change 文件夹里。

OpenSpec 拒绝绝对路径，以及包含 `..` 段的路径。

##### 47.1.3.3 `requires`

- **依赖**：`requires` 里的每一个 ID 都必须指向同一个 schema 里的另一个 artifact。
- **就绪状态**：一个 artifact 在它所有依赖都完成之后变为就绪。
- **非法图**：缺失的 ID、重复的 ID 和依赖环都会校验失败。
- **并列**：当多个 artifact 同时就绪时，它们在 `artifacts` 里的顺序决定 OpenSpec 先返回哪一个。

#### 47.1.4 apply 字段（Apply fields）

`apply` 定义实现开始之前必须存在什么。

| Field | Contract |
|---|---|
| `requires` | **必填。** 一个非空的 artifact 列表，这些 artifact 必须在 apply 指令变为就绪之前存在。 |
| `tracks` | 一个可选的相对路径或 glob，指向 change 文件夹里的 Markdown 任务文件。默认：`null`。 |
| `instruction` | 可选指导，在 apply 就绪时发给 agent。OpenSpec 默认使用内置指导。 |

artifact 的 `requires` 控制规划顺序。`apply.requires` 控制 apply 指令什么时候变为就绪。

##### 47.1.4.1 `tracks`

路径从 change 文件夹开始。对于一个名为 `add-auth` 的 change，`tracks: tasks.md` 读取的是：

```text
openspec/changes/add-auth/tasks.md
```

像 `tracks: "**/tasks.md"` 这样的 glob 会读取每一个匹配的文件，例如 `backend/tasks.md` 和 `frontend/tasks.md`。OpenSpec 会合并它们的任务与进度。给一个 artifact 的 `generates` 字段用相同的值，这样状态与列表跟踪的就是同一批文件。

如果没有文件匹配，或者匹配到的文件里没有任何带任务文本的 checkbox，apply 会一直处于 blocked。OpenSpec 认这些 checkbox 形式：

```markdown
- [ ] Pending task
- [x] Completed task
* [X] Completed task
+ [ ] Pending task
1. [ ] Pending task
2) [x] Completed task
```

任何 Markdown 列表标记都可以：`-`、`*`、`+`，或者一个最多九位数字、后跟 `.` 或 `)` 的编号。允许有前导空格。[spec-driven 页面的 tasks.md 一节](spec-driven/index.md#tasksmd)定义默认 schema 产出的更严格格式。

被跟踪的文件驱动 apply 状态：

- **`blocked`**：没有文件匹配，或者没有任何可读文件带一个含任务文本的 checkbox。
- **`ready`**：至少有一个任务待完成，或者有一个匹配文件读不到，而另一个文件提供了任务。
- **`all_done`**：每一个被跟踪的任务都已勾选，且每一个匹配文件都已被读取。

如果一个匹配文件读不到，apply 会保留可读文件里的任务与进度，但不会把这个 change 标为 `all_done`。[Apply 的 JSON 输出](../cli.md#openspec-instructions)会指明每一个不可用的文件及其原因。

OpenSpec 拒绝绝对路径，以及包含 `..` 段的路径。

##### 47.1.4.2 apply 默认值（Apply defaults）

| Behavior | Default |
|---|---|
| 必需的 artifact | schema 里的每一个 artifact |
| 进度跟踪 | 没有被跟踪的文件 |
| agent 指导 | 内置的 apply 指导 |

#### 47.1.5 完整示例（Complete example）

```yaml
name: review-first
version: 1
description: Proposal and implementation checklist

artifacts:
  - id: proposal
    generates: proposal.md
    description: Why the change is needed and what it affects
    template: proposal.md
    instruction: |
      Explain the problem, the proposed change, and its impact.
    requires: []

  - id: tasks
    generates: tasks.md
    description: Trackable implementation checklist
    template: tasks.md
    instruction: |
      Break the approved proposal into ordered implementation tasks.
    requires:
      - proposal

apply:
  requires:
    - tasks
  tracks: tasks.md
  instruction: |
    Work through the pending tasks and mark each one complete.
```

#### 47.1.6 校验（Validation）

[`openspec schema validate <name>`](../cli.md#openspec-schema-validate) 检查：

- 字段类型与必填字段
- 相对路径
- artifact ID、依赖与环
- `apply.requires` 的 ID：每一个都必须是这个 schema 里的一个 artifact
- template 文件

一个带有未知 `apply.requires` ID 的 schema 不会加载，所以每一条用到它的命令都会报出这个错误。

当 `apply.tracks` 与某个 artifact 的 `generates` 值不完全相等时，校验会警告但不会失败。OpenSpec 通过比较这两个字符串来找到被跟踪的 artifact，所以任何别的情况都会让它无法判断这个文件属于哪个 artifact 的进度。这包括像 `task.md` 这样的笔误，也包括 `tracks: tasks/main.md` 对 `generates: tasks/*.md` 这种情形：glob 确实产出了那个文件，但两个字符串仍然不同。两种情况下 apply 都照旧读取这个文件，但 `openspec list` 和 `openspec status` 改为计入 `tasks.md`。

校验抓不到这些错误：

| Mistake | What happens |
|---|---|
| 某个字段拼错，比如 `instrution` | OpenSpec 忽略它。校验不报告这个拼写错误。 |
| `name` 与 schema 目录不同 | 校验通过。OpenSpec 查找时仍然使用目录名。 |

### 47.2 spec-driven/index.md —— spec-driven 会生成什么

> 默认工作流的 artifact：它们的顺序、它们的格式，以及它们产生的 change 文件夹。

`spec-driven` 是 OpenSpec 内置的默认 schema。[schema.yaml](../schema-yaml.md) 定义它设置的字段。

#### 47.2.1 产物（Artifacts）

这个工作流起草四个 artifact：

| Artifact | File | Purpose |
|---|---|---|
| [`proposal`](#proposalmd) | `proposal.md` | 这个 change 为什么需要 |
| [`specs`](#delta-specs-specmd) | `specs/<capability-path>/spec.md`，每个 capability 一个 | 什么行为发生变化 |
| [`design`](#designmd) | `design.md` | 如何构建它 |
| [`tasks`](#tasksmd) | `tasks.md` | 实现清单 |

#### 47.2.2 起草顺序（Drafting order）

```text
             ┌─ specs ──┐
proposal ────┤          ├── tasks ── apply
             └─ design ─┘
```

proposal 最先来。specs 和 design 以任意顺序跟在后面，而 tasks 两者都需要。实现（[apply](#apply)）在 `tasks.md` 就位之后开始。

有两个 artifact 可以跳过：

- **`design`**：当[它的条件](#designmd)没有一条适用时，agent 会略过它，照样起草 `tasks`。
- **`specs`**：在 change 的 `.openspec.yaml` 里设置 [`skip_specs: true`](../../configuration/change-metadata.md#skip_specs)。

#### 47.2.3 示例 change 文件夹（Example change folder）

一个名为 `add-user-auth` 的 change，每一个 artifact 都已起草：

```text
openspec/changes/add-user-auth/
├── .openspec.yaml      change metadata, written when the change is created
├── proposal.md
├── specs/
│   └── user-auth/
│       └── spec.md     one delta spec per capability
├── design.md
└── tasks.md
```

#### 47.2.4 proposal.md

确立这个 change 为什么需要。

##### 47.2.4.1 结构（Structure）

agent 作为输出格式收到的 template（[templates/proposal.md](https://github.com/Fission-AI/OpenSpec/blob/main/schemas/spec-driven/templates/proposal.md)）：

```md
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

##### 47.2.4.2 指令（Instructions）

agent 起草这个 artifact 时收到的指令（来自 [schema.yaml](https://github.com/Fission-AI/OpenSpec/blob/main/schemas/spec-driven/schema.yaml)）：

```md
Create the proposal document that establishes WHY this change is needed.

Sections:
- **Why**: 1-2 sentences on the problem or opportunity. What problem does this solve? Why now?
- **What Changes**: Bullet list of changes. Be specific about new capabilities, modifications, or removals. Mark breaking changes with **BREAKING**.
- **Capabilities**: Identify which specs will be created or modified:
  - **New Capabilities**: List capabilities being introduced. Each becomes a new `specs/<capability-path>/spec.md`. Use kebab-case for path segments you introduce (e.g., `user-auth` or `identity/user-auth`) and follow the project's existing spec organization.
  - **Modified Capabilities**: List existing capabilities whose REQUIREMENTS are changing. Only include if spec-level behavior changes (not just implementation details). Each needs a delta spec file. Use the exact existing path under `openspec/specs/`. Leave empty if no requirement changes.
- **Impact**: Affected code, APIs, dependencies, or systems.

IMPORTANT: The Capabilities section is critical. It creates the contract between
proposal and specs phases. Research existing specs before filling this in:
run `openspec list --specs` for the project's capability inventory, then
`openspec show "<spec-id>" --type spec --json --no-scenarios` for any that
look related - that returns a capability's purpose and requirement texts
without pulling whole spec files into context. Append `--store "<id>"` to
both commands only for a registered standalone store, and keep `--type
spec`: a change and a spec sharing a name is otherwise an ambiguous-item
error. `openspec list` without `--specs` lists in-flight changes, not
specs - it never shows what the project already covers. Reuse an existing
capability's exact path instead of introducing a near-duplicate name.
The filtered read is only an overview. Before deciding what is already
covered or what should change, read each relevant spec in full, including
scenarios, with `openspec show "<spec-id>" --type spec` (same `--store` rule).
Each capability listed here will need a corresponding spec file.

Every change must either declare at least one capability (new or
modified) or explicitly opt out of specs: `openspec validate` rejects a
change with zero deltas unless the change's `.openspec.yaml` sets
`skip_specs: true`. Use `skip_specs: true` only when no spec-level
behavior changes (pure refactor, tooling, docs) - specs describe
behavior, so if behavior does not change, no spec should change either.
Do not invent a requirement just to satisfy validation.

Keep it concise (1-2 pages). Focus on the "why" not the "how" -
implementation details belong in design.md.

This is the foundation - specs, design, and tasks all build on this.
```

#### 47.2.5 Delta specs（spec.md）

定义什么行为发生变化，proposal 列出的每一个 capability 对应一份 delta spec。

每一份 delta spec 就是它 capability 文件夹里的那个 `spec.md`。`openspec validate` 和 `openspec archive` 会拒绝写在 `specs/` 下任何其他文件里的 delta 小节，例如 `specs/user-auth.md`，因为 archive 从不合并它们。

##### 47.2.5.1 结构（Structure）

agent 作为输出格式收到的 template（[templates/spec.md](https://github.com/Fission-AI/OpenSpec/blob/main/schemas/spec-driven/templates/spec.md)）：

```md
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

##### 47.2.5.2 指令（Instructions）

agent 起草这个 artifact 时收到的指令（来自 [schema.yaml](https://github.com/Fission-AI/OpenSpec/blob/main/schemas/spec-driven/schema.yaml)）：

````md
Create specification files that define WHAT the system should do.

A spec is a behavior contract, not an implementation plan.

Good spec content:
- Observable behavior users or downstream systems rely on
- Inputs, outputs, and error conditions
- External constraints (security, privacy, reliability, compatibility)
- Scenarios that can be tested or explicitly validated

Avoid in specs:
- Internal class/function names
- Library or framework choices
- Step-by-step implementation details
- Detailed execution plans (those belong in design.md or tasks.md)

Quick test: if the implementation can change without changing externally
visible behavior, it likely does not belong in the spec.

Create one spec file per capability listed in the proposal's Capabilities section.
`<capability-path>` is the spec directory relative to `specs/` (for example,
`user-auth` or `identity/user-auth`). Preserve the full path:
- New capabilities: use the exact path from the proposal at `specs/<capability-path>/spec.md`. Any path segment newly introduced in the proposal must be kebab-case. Follow the project's existing organization; do not add a new domain level when the project uses a flat layout.
- Modified capabilities: use the exact existing path from `openspec/specs/<capability-path>/` when creating the delta at `specs/<capability-path>/spec.md`. Run `openspec list --specs` to confirm that path before writing the delta, appending `--store "<id>"` only for a registered standalone store - a mistyped or invented path targets a capability that does not exist rather than the one you meant. Do not move or rename the capability.

There must be at least one spec file unless the change's `.openspec.yaml`
sets `skip_specs: true` (no spec-level behavior change) - `openspec validate`
rejects a zero-delta change without that marker. If the proposal lists no
capabilities and `skip_specs` is not set, revisit the proposal first.

Delta operations (use ## headers):
- **ADDED Requirements**: New capabilities
- **MODIFIED Requirements**: Changed behavior - MUST include full updated content
- **REMOVED Requirements**: Deprecated features - MUST include **Reason** and **Migration**
- **RENAMED Requirements**: Name changes only - use FROM:/TO: format

Format requirements:
- Each requirement: `### Requirement: <name>` followed by description
- Use SHALL/MUST for normative requirements (avoid should/may)
- Each scenario: `#### Scenario: <name>` with WHEN/THEN format
- **CRITICAL**: Scenarios MUST use exactly 4 hashtags (`####`). Using 3 hashtags or bullets will fail silently.
- Every requirement MUST have at least one scenario.

New capabilities only: the delta spec's first section is `## Purpose` -
one or two sentences (50+ characters, or `openspec validate --strict`
reports it as too brief) describing what the capability is for. Archive
copies it into the main spec it creates; without it the new main spec is
left with a `TBD ... Update Purpose after archive` placeholder to fill in
by hand. Do NOT add `## Purpose` to a delta for an existing capability -
that spec already has one and the delta's is ignored. To change an
existing capability's Purpose - including a leftover `TBD` placeholder -
edit `<planningHome.root>/openspec/specs/<capability-path>/spec.md`
directly. `planningHome.root` comes from the `openspec instructions ...
--json` response. Always use it rather than a repo-relative path: it
resolves to the store whenever the change lives in one - whether that
came from `--store`, a project `store:` pointer, or a global default
store - and to the current repository otherwise. Do not try to work out
which case applies; the field already has.

MODIFIED requirements workflow:
1. Locate the existing requirement in `<planningHome.root>/openspec/specs/<capability-path>/spec.md` (the same store-aware root as above)
2. Copy the ENTIRE requirement block (from `### Requirement:` through all scenarios)
3. Paste under `## MODIFIED Requirements` and edit to reflect new behavior
4. Ensure header text matches exactly (whitespace-insensitive)

Common pitfall: Using MODIFIED with partial content loses detail at archive time.
If adding new concerns without changing existing behavior, use ADDED instead.

Example (a new capability, so its first section is `## Purpose`):
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

Specs should be testable - each scenario is a potential test case.
````

#### 47.2.6 design.md

解释如何实现这个 change。只有当这个 change 需要它时才起草。

##### 47.2.6.1 结构（Structure）

agent 作为输出格式收到的 template（[templates/design.md](https://github.com/Fission-AI/OpenSpec/blob/main/schemas/spec-driven/templates/design.md)）：

```md
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

##### 47.2.6.2 指令（Instructions）

agent 起草这个 artifact 时收到的指令（来自 [schema.yaml](https://github.com/Fission-AI/OpenSpec/blob/main/schemas/spec-driven/schema.yaml)）：

```md
Create the design document that explains HOW to implement the change.

When to include design.md (create only if any apply):
- Cross-cutting change (multiple services/modules) or new architectural pattern
- New external dependency or significant data model changes
- Security, performance, or migration complexity
- Ambiguity that benefits from technical decisions before coding

Sections:
- **Context**: Only the current state and constraints needed to explain the approach. Reference the proposal for motivation instead of restating it (e.g., "See proposal.md - Why").
- **Goals / Non-Goals**: What this design achieves and explicitly excludes. Don't restate the proposal's scope - add only design-level boundaries.
- **Decisions**: Key technical choices with rationale (why X over Y?). Include alternatives considered for each decision.
- **Risks / Trade-offs**: Known limitations, things that could go wrong. Format: [Risk] → Mitigation
- **Migration Plan**: Steps to deploy, rollback strategy (if applicable)
- **Open Questions**: Unknowns that can safely be answered later without
  changing the specs, the approach, or the task breakdown. Omit if none.

Open questions are for genuinely deferrable unknowns, not decisions you
skipped. If a question would change the specs, the chosen approach, or
the task breakdown, resolve it now - ask the user instead of guessing.

Focus on architecture and approach, not line-by-line implementation.
The proposal covers why and what; design covers how. Reference the
proposal for motivation and, once written, the specs for requirements -
if a section would only restate them, point to them instead.

Good design docs explain the "why" behind technical decisions.
```

#### 47.2.7 tasks.md

把实现拆成可勾选的任务。[apply](#apply) 在这里跟踪进度。

##### 47.2.7.1 结构（Structure）

agent 作为输出格式收到的 template（[templates/tasks.md](https://github.com/Fission-AI/OpenSpec/blob/main/schemas/spec-driven/templates/tasks.md)）：

```md
# Tasks

## 1. <!-- Task Group Name -->

- [ ] 1.1 <!-- Task description -->
- [ ] 1.2 <!-- Task description -->

## 2. <!-- Task Group Name -->

- [ ] 2.1 <!-- Task description -->
- [ ] 2.2 <!-- Task description -->
```

##### 47.2.7.2 指令（Instructions）

agent 起草这个 artifact 时收到的指令（来自 [schema.yaml](https://github.com/Fission-AI/OpenSpec/blob/main/schemas/spec-driven/schema.yaml)）：

````md
Create the task list that breaks down the implementation work.

Before writing tasks, check design.md for Open Questions. If any of them
would change what gets built, resolve them with the user first - do not
bake an unstated assumption into the task list.

**IMPORTANT: Follow the template below exactly.** The apply phase parses
checkbox format to track progress. A box holding only `x` counts as done,
upper or lower case and with any spacing, so `- [ x]` is done too. Every
other marker, including `- [~]`, `- [-]` and an empty `- []`, reads as
unfinished. A line with no checkbox is not tracked at all.

Guidelines:
- Group related tasks under ## numbered headings
- Each task MUST be a checkbox: `- [ ] X.Y Task description`
- Tasks should be small enough to complete in one session
- Order tasks by dependency (what must be done first?)
- Each task MUST state how to verify completion (a test, command,
  observable behavior, or delivered artifact). Put the verification in
  that task's checkbox description. Use a separate verification task only
  when it checks broader integration or system behavior that spans
  multiple implementation tasks.
- Each task group MUST land the tests and documentation its own work
  calls for. Do NOT collect testing or documentation into a final group -
  when a late group first exercises work from an early one, the failures
  cascade back through every group in between and force rework. A group
  whose work calls for neither, such as scaffolding or dependency setup,
  carries neither. A final group is for integration checks only, not for
  the tests and docs an earlier group owed.

Example:
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

Reference specs for what needs to be built, design for how to build it.
````

#### 47.2.8 Apply

从规划到实现的交接。Apply 是走完 `tasks.md` 的那个阶段，不是一个 artifact。

- **开始**：一旦 `tasks.md` 存在并列出至少一个任务。
- **跟踪**：`tasks.md` 里的 checkbox。勾掉它们就是进度记录。
- **结束**：每一个 checkbox 都被勾选。OpenSpec 随后建议归档这个 change。

##### 47.2.8.1 设置（Settings）

apply 设置（来自 [schema.yaml](https://github.com/Fission-AI/OpenSpec/blob/main/schemas/spec-driven/schema.yaml)）：

```yaml
apply:
  requires: [tasks]
  tracks: tasks.md
  # instruction: shown below
```

##### 47.2.8.2 指令（Instructions）

实现开始时发给 agent 的指令（来自 [schema.yaml](https://github.com/Fission-AI/OpenSpec/blob/main/schemas/spec-driven/schema.yaml)）：

```md
Read context files, work through pending tasks, mark complete as you go.
Pause if you hit blockers or need clarification.
```

#### 47.2.9 schema.yaml

完整的 [schema.yaml](https://github.com/Fission-AI/OpenSpec/blob/main/schemas/spec-driven/schema.yaml)，instruction 正文已省略。每一段都在上面各自的小节里完整展示。

```yaml
name: spec-driven
version: 1
description: Default OpenSpec workflow - proposal → specs → design → tasks
artifacts:
  - id: proposal
    generates: proposal.md
    description: Initial proposal document outlining the change
    template: proposal.md
    # instruction: shown in full under proposal.md above
    requires: []

  - id: specs
    generates: "specs/**/*.md"
    description: Detailed specifications for the change
    template: spec.md
    # instruction: shown in full under Delta specs above
    requires:
      - proposal

  - id: design
    generates: design.md
    description: Technical design document with implementation details
    template: design.md
    # instruction: shown in full under design.md above
    requires:
      - proposal

  - id: tasks
    generates: tasks.md
    description: Implementation checklist with trackable tasks
    template: tasks.md
    # instruction: shown in full under tasks.md above
    requires:
      - specs
      - design

apply:
  requires: [tasks]
  tracks: tasks.md
  # instruction: shown in full under Apply above
```
