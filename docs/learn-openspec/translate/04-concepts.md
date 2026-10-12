## 4 concepts —— 概念

> 译自 `reference/openspec/docs/concepts.md`（原文 631 行，全文翻译）。按 `READING-openspec.md` 第 04 项。所有代码块（含嵌套的 Markdown 示例）、目录树与 ASCII 图按原样保留。

### 4.1 哲学（Philosophy）

OpenSpec 建立在四条原则之上：

```text
fluid not rigid         — no phase gates, work on what makes sense
iterative not waterfall — learn as you build, refine as you go
easy not complex        — lightweight setup, minimal ceremony
brownfield-first        — works with existing codebases, not just greenfield
```

```text
流体而非僵化        —— 没有阶段闸门，做当下说得通的事
迭代而非瀑布        —— 边建边学，边走边磨
简单而非复杂        —— 轻量配置，最少仪式
存量为先            —— 适配既有代码库，不只是绿地
```

#### 这些原则为什么重要（Why These Principles Matter）

**流体而非僵化。** 传统 spec 系统把你锁进阶段里：先规划，再实现，然后完事。OpenSpec 更灵活 —— 你可以按对你的工作来说说得通的任何顺序创建 artifact。

**迭代而非瀑布。** 需求会变。理解会加深。一开始看起来不错的方法，在你看到代码库之后可能站不住。OpenSpec 拥抱这个现实。

**简单而非复杂。** 有些 spec 框架要求大量配置、僵硬格式或笨重流程。OpenSpec 不挡你的路。几秒钟初始化，立刻开始工作，只在需要时才定制。

**存量为先。** 大多数软件工作不是从零构建 —— 而是修改既有系统。OpenSpec 基于 delta 的方法让「为既有行为指定变更」变得容易，而不只是描述新系统。

### 4.2 大局（The Big Picture）

OpenSpec 把你的工作组织成两个主要区域：

```text
┌────────────────────────────────────────────────────────────────────┐
│                        openspec/                                   │
│                                                                    │
│   ┌─────────────────────┐      ┌───────────────────────────────┐   │
│   │       specs/        │      │         changes/              │   │
│   │                     │      │                               │   │
│   │  Source of truth    │◄─────│  Proposed modifications       │   │
│   │  How your system    │ merge│  Each change = one folder     │   │
│   │  currently works    │      │  Contains artifacts + deltas  │   │
│   │                     │      │                               │   │
│   └─────────────────────┘      └───────────────────────────────┘   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**specs** 是真相 —— 它们描述你的系统当前如何行为。

**changes** 是提议的修改 —— 它们住在各自的目录里，直到你准备好把它们合并。

这个分离是关键。你可以并行处理多个 change 而不冲突。你可以在一个 change 影响到主 spec 之前先评审它。而当你归档一个 change 时，它的 delta 干净地合并进真相。

### 4.3 Specs

Spec 用结构化的 requirement 和 scenario 描述你系统的行为。

#### 结构（Structure）

```text
openspec/specs/
├── auth/
│   └── spec.md           # Authentication behavior
├── payments/
│   └── spec.md           # Payment processing
├── notifications/
│   └── spec.md           # Notification system
└── ui/
    └── spec.md           # UI behavior and themes
```

按领域组织 spec —— 对你的系统来说说得通的逻辑分组。常见模式：

- **按功能区域**：`auth/`、`payments/`、`search/`
- **按组件**：`api/`、`frontend/`、`workers/`
- **按限界上下文**：`ordering/`、`fulfillment/`、`inventory/`

#### Spec 格式（Spec Format）

一个 spec 包含 requirement，每条 requirement 有 scenario：

```markdown
# Auth Specification

## Purpose
Authentication and session management for the application.

## Requirements

### Requirement: User Authentication
The system SHALL issue a JWT token upon successful login.

#### Scenario: Valid credentials
- GIVEN a user with valid credentials
- WHEN the user submits login form
- THEN a JWT token is returned
- AND the user is redirected to dashboard

#### Scenario: Invalid credentials
- GIVEN invalid credentials
- WHEN the user submits login form
- THEN an error message is displayed
- AND no token is issued

### Requirement: Session Expiration
The system MUST expire sessions after 30 minutes of inactivity.

#### Scenario: Idle timeout
- GIVEN an authenticated session
- WHEN 30 minutes pass without activity
- THEN the session is invalidated
- AND the user must re-authenticate
```

**关键元素：**

| 元素 | 用途 |
|---------|---------|
| `## Purpose` | 这个 spec 所属领域的高层描述 |
| `### Requirement:` | 系统必须具备的一条具体行为 |
| `#### Scenario:` | 该 requirement 在实际中的一个具体例子 |
| SHALL/MUST/SHOULD | RFC 2119 关键词，表示 requirement 的强度 |

#### 为什么这样组织 spec（Why Structure Specs This Way）

**Requirement 是「什么」** —— 它们陈述系统该做什么，而不指定实现。

**Scenario 是「何时」** —— 它们提供可验证的具体例子。好的 scenario：
- 可测试（你能为它写出一个自动化测试）
- 同时覆盖正常路径和边界情况
- 使用 Given/When/Then 或类似的结构化格式

**RFC 2119 关键词**（SHALL、MUST、SHOULD、MAY）传达意图：
- **MUST/SHALL** —— 绝对要求
- **SHOULD** —— 推荐，但存在例外
- **MAY** —— 可选

#### spec 是什么（以及不是什么）（What a Spec Is (and Is Not)）

spec 是一份**行为契约**，不是实现计划。

好的 spec 内容：
- 用户或下游系统依赖的可观测行为
- 输入、输出和错误条件
- 外部约束（安全、隐私、可靠性、兼容性）
- 可被测试或明确验证的 scenario

spec 里要避免的：
- 内部类名/函数名
- 库或框架的选择
- 逐步的实现细节
- 详细的执行计划（那些属于 `design.md` 或 `tasks.md`）

快速检验：
- 如果实现可以变而不改变外部可见行为，那它多半不属于 spec。

#### 保持轻量：渐进式严谨（Keep It Lightweight: Progressive Rigor）

OpenSpec 的目标是避免官僚主义。用能让这个 change 仍然可验证的最轻级别。

**轻量 spec（默认）：**
- 简短、行为优先的 requirement
- 清楚的范围与非目标
- 几条具体的验收检查

**完整 spec（用于更高风险）：**
- 跨团队或跨仓的变更
- API/契约变更、迁移、安全/隐私考虑
- 模糊性很可能导致昂贵返工的变更

大多数 change 应该停在轻量模式。

#### 人 + agent 协作（Human + Agent Collaboration）

在很多团队里，人负责探索，agent 负责起草 artifact。预期的循环是：

1. 人提供意图、上下文和约束。
2. agent 把这些转成行为优先的 requirement 和 scenario。
3. agent 把实现细节留在 `design.md` 和 `tasks.md` 里，不放进 `spec.md`。
4. 验证在实现之前确认结构与清晰度。

这让 spec 对人可读、对 agent 一致。

### 4.4 Changes

一个 change 是给你的系统的一份提议修改，打包成一个目录，装着理解并实现它所需的一切。

#### change 的结构（Change Structure）

```text
openspec/changes/add-dark-mode/
├── proposal.md           # Why and what
├── design.md             # How (technical approach)
├── tasks.md              # Implementation checklist
├── .openspec.yaml        # Change metadata (optional): schema, created, skip_specs, retire_capabilities
└── specs/                # Delta specs
    └── ui/
        └── spec.md       # What's changing in ui/spec.md
```

每个 change 是自包含的。它包含：
- **Artifact** —— 捕捉意图、设计和任务的文档
- **Delta spec** —— 关于什么被添加、修改或移除的规格说明
- **元数据** —— 这个特定 change 的可选配置

#### 为什么 change 是目录（Why Changes Are Folders）

把一个 change 打包成目录有几个好处：

1. **所有东西在一起。** proposal、design、tasks 和 specs 住在一处。不用去不同地方翻找。

2. **并行工作。** 多个 change 可以同时存在而不冲突。在处理 `add-dark-mode` 的同时，`fix-auth-bug` 也可以在进行中。

3. **干净的历史。** 归档时，change 移进 `changes/archive/`，完整上下文被保留。你可以回头看，理解的不只是改了什么，还有为什么。

4. **对评审友好。** 一个 change 目录容易评审 —— 打开它，读 proposal，看 design，查 spec delta。

### 4.5 Artifacts

Artifact 是 change 内部指引工作的那些文档。

#### artifact 流（The Artifact Flow）

```text
proposal ──────► specs ──────► design ──────► tasks ──────► implement
    │               │             │              │
   why            what           how          steps
 + scope        changes       approach      to take
```

Artifact 互相喂养。每个 artifact 为下一个提供上下文。

#### artifact 类型（Artifact Types）

##### Proposal（`proposal.md`）

proposal 在高层面捕捉**意图**、**范围**和**方法**。

```markdown
# Proposal: Add Dark Mode

## Intent
Users have requested a dark mode option to reduce eye strain
during nighttime usage and match system preferences.

## Scope
In scope:
- Theme toggle in settings
- System preference detection
- Persist preference in localStorage

Out of scope:
- Custom color themes (future work)
- Per-page theme overrides

## Approach
Use CSS custom properties for theming with a React context
for state management. Detect system preference on first load,
allow manual override.
```

**什么时候更新 proposal：**
- 范围变化（收窄或扩大）
- 意图变清晰（对问题有了更好的理解）
- 方法发生根本性转向

##### Specs（`specs/` 里的 delta spec）

Delta spec 描述相对于当前 spec **变的是什么**。见下文的 [Delta Specs](#46-delta-specs)。

##### Design（`design.md`）

design 捕捉**技术方法**和**架构决策**。

````markdown
# Design: Add Dark Mode

## Technical Approach
Theme state managed via React Context to avoid prop drilling.
CSS custom properties enable runtime switching without class toggling.

## Architecture Decisions

### Decision: Context over Redux
Using React Context for theme state because:
- Simple binary state (light/dark)
- No complex state transitions
- Avoids adding Redux dependency

### Decision: CSS Custom Properties
Using CSS variables instead of CSS-in-JS because:
- Works with existing stylesheet
- No runtime overhead
- Browser-native solution

## Data Flow
```
ThemeProvider (context)
       │
       ▼
ThemeToggle ◄──► localStorage
       │
       ▼
CSS Variables (applied to :root)
```

## File Changes
- `src/contexts/ThemeContext.tsx` (new)
- `src/components/ThemeToggle.tsx` (new)
- `src/styles/globals.css` (modified)
````

**什么时候更新 design：**
- 实现暴露出这个方法行不通
- 发现了更好的方案
- 依赖或约束变了

##### Tasks（`tasks.md`）

tasks 是**实现清单** —— 带 checkbox 的具体步骤。

```markdown
# Tasks

## 1. Theme Infrastructure
- [ ] 1.1 Create ThemeContext with light/dark state
- [ ] 1.2 Add CSS custom properties for colors
- [ ] 1.3 Implement localStorage persistence
- [ ] 1.4 Add system preference detection

## 2. UI Components
- [ ] 2.1 Create ThemeToggle component
- [ ] 2.2 Add toggle to settings page
- [ ] 2.3 Update Header to include quick toggle

## 3. Styling
- [ ] 3.1 Define dark theme color palette
- [ ] 3.2 Update components to use CSS variables
- [ ] 3.3 Test contrast ratios for accessibility
```

**task 最佳实践：**
- 把相关 task 归到标题下
- 使用层级编号（1.1、1.2 等）
- task 保持足够小，能在一次会话里完成
- 说明每个 task 如何被验证（一个测试、一条命令，或一个可观测结果）
- 把各组工作应配的测试和文档落在**该组内部**，不要收进最后一个补课组
- 完成时勾掉 task

### 4.6 Delta Specs

Delta spec 是让 OpenSpec 适用于存量开发的关键概念。它们描述**变的是什么**，而不是重述整个 spec。

#### 格式（The Format）

```markdown
# Delta for Auth

## ADDED Requirements

### Requirement: Two-Factor Authentication
The system MUST support TOTP-based two-factor authentication.

#### Scenario: 2FA enrollment
- GIVEN a user without 2FA enabled
- WHEN the user enables 2FA in settings
- THEN a QR code is displayed for authenticator app setup
- AND the user must verify with a code before activation

#### Scenario: 2FA login
- GIVEN a user with 2FA enabled
- WHEN the user submits valid credentials
- THEN an OTP challenge is presented
- AND login completes only after valid OTP

## MODIFIED Requirements

### Requirement: Session Expiration
The system MUST expire sessions after 15 minutes of inactivity.
(Previously: 30 minutes)

#### Scenario: Idle timeout
- GIVEN an authenticated session
- WHEN 15 minutes pass without activity
- THEN the session is invalidated

## REMOVED Requirements

### Requirement: Remember Me
(Deprecated in favor of 2FA. Users should re-authenticate each session.)
```

#### delta 分段（Delta Sections）

| 分段 | 含义 | 归档时发生什么 |
|---------|---------|------------------------|
| `## ADDED Requirements` | 新行为 | 追加到主 spec |
| `## MODIFIED Requirements` | 变化的行为 | 替换既有 requirement |
| `## REMOVED Requirements` | 废弃的行为 | 从主 spec 删除；当 change 声明 `retire_capabilities: true` 时，删掉最后一个 requirement 会退役该 capability 并删除它的 spec 文件 |
| `## Purpose` | 一个全新 capability 是干什么的 | 为将要创建的主 spec 播下 Purpose；当 spec 已存在时被忽略 |

#### 为什么用 delta 而不是完整 spec（Why Deltas Instead of Full Specs）

**清晰。** delta 精确展示变的是什么。读一份完整 spec，你得在脑子里把它和当前版本做 diff。

**避免冲突。** 两个 change 可以碰同一个 spec 文件而不冲突，只要它们修改的是不同的 requirement。

**评审效率。** 评审者看到的是变化，不是未变的上下文。注意力放在要紧的地方。

**适配存量。** 大多数工作在修改既有行为。delta 让「修改」成为一等公民，而不是事后想起来的东西。

### 4.7 Schemas

Schema 为一个工作流定义 artifact 类型及其依赖。

#### schema 如何工作（How Schemas Work）

```yaml
# openspec/schemas/spec-driven/schema.yaml
name: spec-driven
artifacts:
  - id: proposal
    generates: proposal.md
    requires: []              # No dependencies, can create first

  - id: specs
    generates: specs/**/*.md
    requires: [proposal]      # Needs proposal before creating

  - id: design
    generates: design.md
    requires: [proposal]      # Can create in parallel with specs

  - id: tasks
    generates: tasks.md
    requires: [specs, design] # Needs both specs and design first
```

**artifact 构成一张依赖图：**

```text
                    proposal
                   (root node)
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
      specs                       design
   (requires:                  (requires:
    proposal)                   proposal)
         │                           │
         └─────────────┬─────────────┘
                       │
                       ▼
                    tasks
                (requires:
                specs, design)
```

**依赖是使能者，不是闸门。** 它们展示什么**可以**被创建，而不是你必须接着创建什么。不需要 design 就可以跳过它。你可以在 design 之前或之后创建 specs —— 两者都只依赖 proposal。

#### 内置 schema（Built-in Schemas）

**spec-driven**（默认）

spec 驱动开发的标准工作流：

```text
proposal → specs → design → tasks → implement
```

最适合：大多数你想在实现之前先就 spec 达成一致的功能工作。

#### 自定义 schema（Custom Schemas）

为你们团队的工作流创建自定义 schema：

```bash
# Create from scratch
openspec schema init research-first

# Or fork an existing one
openspec schema fork spec-driven research-first
```

**示例自定义 schema：**

```yaml
# openspec/schemas/research-first/schema.yaml
name: research-first
artifacts:
  - id: research
    generates: research.md
    requires: []           # Do research first

  - id: proposal
    generates: proposal.md
    requires: [research]   # Proposal informed by research

  - id: tasks
    generates: tasks.md
    requires: [proposal]   # Skip specs/design, go straight to tasks
```

创建和使用自定义 schema 的完整细节见 [Customization](customization.md)。

### 4.8 Archive

归档通过把 change 的 delta spec 合并进主 spec、并保留该 change 作为历史，来完成这个 change。

#### 归档时发生什么（What Happens When You Archive）

```text
Before archive:

openspec/
├── specs/
│   └── auth/
│       └── spec.md ◄────────────────┐
└── changes/                         │
    └── add-2fa/                     │
        ├── proposal.md              │
        ├── design.md                │ merge
        ├── tasks.md                 │
        └── specs/                   │
            └── auth/                │
                └── spec.md ─────────┘


After archive:

openspec/
├── specs/
│   └── auth/
│       └── spec.md        # Now includes 2FA requirements
└── changes/
    └── archive/
        └── 2025-01-24-add-2fa/    # Preserved for history
            ├── proposal.md
            ├── design.md
            ├── tasks.md
            └── specs/
                └── auth/
                    └── spec.md
```

#### 归档过程（The Archive Process）

1. **合并 delta。** 每个 delta spec 分段（ADDED/MODIFIED/REMOVED）被应用到对应的主 spec。

2. **移进 archive。** change 目录带着日期前缀移进 `changes/archive/`，以便按时间排序。

3. **保留上下文。** 所有 artifact 在归档中完好保留。你随时可以回头看一个 change 为什么被做。

#### 为什么归档重要（Why Archive Matters）

**干净的状态。** 活跃 change（`changes/`）只显示进行中的工作。已完成的工作让开道路。

**审计轨迹。** 归档保留每个 change 的完整上下文 —— 不只是改了什么，还有解释为什么的 proposal、解释怎么做的 design，以及显示做了哪些工作的 tasks。

**spec 演化。** spec 随着 change 被归档而有机生长。每次归档合并它的 delta，逐渐积累出一份全面的规格说明。

### 4.9 一切如何拼在一起（How It All Fits Together）

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                              OPENSPEC FLOW                                   │
│                                                                              │
│   ┌────────────────┐                                                         │
│   │  1. START      │  /opsx:propose (core) or /opsx:new (expanded)           │
│   │     CHANGE     │                                                         │
│   └───────┬────────┘                                                         │
│           │                                                                  │
│           ▼                                                                  │
│   ┌────────────────┐                                                         │
│   │  2. CREATE     │  /opsx:ff or /opsx:continue (expanded workflow)         │
│   │     ARTIFACTS  │  Creates proposal → specs → design → tasks              │
│   │                │  (based on schema dependencies)                         │
│   └───────┬────────┘                                                         │
│           │                                                                  │
│           ▼                                                                  │
│   ┌────────────────┐                                                         │
│   │  3. IMPLEMENT  │  /opsx:apply                                            │
│   │     TASKS      │  Work through tasks, checking them off                  │
│   │                │◄──── Update artifacts as you learn                      │
│   └───────┬────────┘                                                         │
│           │                                                                  │
│           ▼                                                                  │
│   ┌────────────────┐                                                         │
│   │  4. VERIFY     │  /opsx:verify (optional)                                │
│   │     WORK       │  Check implementation matches specs                     │
│   └───────┬────────┘                                                         │
│           │                                                                  │
│           ▼                                                                  │
│   ┌────────────────┐     ┌──────────────────────────────────────────────┐    │
│   │  5. ARCHIVE    │────►│  Delta specs merge into main specs           │    │
│   │     CHANGE     │     │  Change folder moves to archive/             │    │
│   └────────────────┘     │  Specs are now the updated source of truth   │    │
│                          └──────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**这个良性循环：**

1. spec 描述当前行为
2. change 提议修改（以 delta 形式）
3. 实现让修改成真
4. 归档把 delta 合并进 spec
5. spec 现在描述新行为
6. 下一个 change 建立在更新后的 spec 上

### 4.10 术语表（Glossary）

| 术语 | 定义 |
|------|------------|
| **Artifact** | change 内部的一份文档（proposal、design、tasks 或 delta spec） |
| **Archive** | 完成一个 change 并把它 delta 合并进主 spec 的过程 |
| **Change** | 对系统的一份提议修改，打包成一个带 artifact 的目录 |
| **Delta spec** | 一份描述相对于当前 spec 的变化（ADDED/MODIFIED/REMOVED）的 spec |
| **Domain** | spec 的逻辑分组（例如 `auth/`、`payments/`） |
| **Requirement** | 系统必须具备的一条具体行为 |
| **Scenario** | 一条 requirement 的具体例子，通常用 Given/When/Then 格式 |
| **Schema** | 对 artifact 类型及其依赖的定义 |
| **Spec** | 描述系统行为的规格说明，包含 requirement 和 scenario |
| **Source of truth** | `openspec/specs/` 目录，装着当前已达成一致的行为 |

### 4.11 下一步（Next Steps）

- [Getting Started](getting-started.md) - 实用的第一步
- [Workflows](workflows.md) - 常见模式，以及各自何时使用
- [Commands](commands.md) - 完整命令参考
- [Customization](customization.md) - 创建自定义 schema 并配置你的项目
