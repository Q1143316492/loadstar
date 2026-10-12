## 12 getting-started —— 上手

> 译自 `reference/openspec/docs/getting-started.md`（原文 291 行）。按 `READING-openspec.md` 第 12 项。按第 12 项，⌸ 脚手架重的安装输出与文件清单部分压缩处理；`Understanding Artifacts` 与 `How Delta Specs Work` 两节完整译出。代码块（含目录树、聊天实录与嵌套的 Markdown 示例）按原样保留。

### 12.1 开篇

本指南解释你安装并初始化 OpenSpec 之后它如何工作。安装说明见 [主 README](../README.md#quick-start) 或 [安装指南](installation.md)。第一次接触整套文档？[文档首页](README.md) 给出了完整的地图。

> **这些命令在哪里输入？** 两个地方，把它们搞混是最常见的早期绊脚石。
>
> - `openspec ...` 命令（例如 `openspec init`）在你的**终端**里运行。
> - `/opsx:...` 命令（例如 `/opsx:propose`）在你的 **AI 助手的聊天**里运行 —— 就是你让它写代码的那个框。
>
> 没有单独的「交互模式」需要启动。你只要在聊天里输入 slash command，助手就从那里接手。完整解释见 [命令如何工作](how-commands-work.md)。

### 12.2 你的最初五分钟（Your First Five Minutes）

整个循环，每一步都标注了它发生在哪里：

```text
TERMINAL   $ npm install -g @fission-ai/openspec@latest
TERMINAL   $ cd your-project && openspec init
AI CHAT      /opsx:explore                    (optional: think it through first)
AI CHAT      /opsx:propose add-dark-mode      (AI drafts the plan; you review it)
AI CHAT      /opsx:apply                      (AI builds it)
AI CHAT      /opsx:archive                    (specs updated, change filed away)
```

两个终端步骤完成设置，之后你都在聊天里工作；本指南余下部分展开每一步做什么、你会看到什么。

**不想自己动手做终端那部分？** 把 [setup prompt](installation.md#install-with-your-ai-assistant) 粘给你的助手，它会处理这两行，然后汇报它创建了什么。

> **还没想好要建什么？先从 `/opsx:explore` 开始。** 它是一个无风险的思考伙伴：读你的代码库、权衡选项、把一个模糊的想法磨成一个具体的计划，这一切都发生在写下任何代码之前。当图景清楚时，它把接力棒交给 `/opsx:propose`。这是与一个否则会自信地建出错误东西的 AI 共事时最好的一个习惯。见 [Explore 指南](explore.md)。

### 12.3 它如何工作（How It Works）

OpenSpec 帮助你和你的 AI 编码助手在写下任何代码之前就先建什么达成一致。

**默认快速路径（core profile）：**

```text
/opsx:explore ──► /opsx:propose ──► /opsx:apply ──► /opsx:sync ──► /opsx:archive
   (optional)
```

当你在琢磨该做什么时从 `/opsx:explore` 开始，当你已经知道时直接跳到 `/opsx:propose`。explore 在默认 profile 里，所以你想要它的时候它总在。

**扩展路径（自定义工作流选择）：**

```text
/opsx:new ──► /opsx:ff or /opsx:continue ──► /opsx:apply ──► /opsx:verify ──► /opsx:archive
```

默认的全局 profile 是 `core`，它包含 `propose`、`explore`、`apply`、`update`、`sync` 和 `archive`。你可以用 `openspec config profile` 启用扩展工作流命令，然后再跑 `openspec update`。

### 12.4 OpenSpec 创建了什么（What OpenSpec Creates）

运行 `openspec init` 之后，你的项目有这样的结构：

```
openspec/
├── specs/              # Source of truth (your system's behavior)
│   └── <domain>/
│       └── spec.md
├── changes/            # Proposed updates (one folder per change)
│   └── <change-name>/
│       ├── proposal.md
│       ├── design.md
│       ├── tasks.md
│       └── specs/      # Delta specs (what's changing)
│           └── <domain>/
│               └── spec.md
└── config.yaml         # Project configuration (optional)
```

**两个关键目录：** **`specs/`** 是真相来源，按 domain 组织（例如 `specs/auth/`、`specs/payments/`），描述你的系统当前如何行为；**`changes/`** 是提议的修改，每个 change 有自己的文件夹，装着相关的全部 artifact，一个 change 完成后它的 spec 合并进主 `specs/` 目录。

### 12.5 理解 Artifact（Understanding Artifacts）

每个 change 文件夹里装着指引工作的 artifact：

| Artifact | 用途 |
|----------|---------|
| `proposal.md` | 「为什么」与「是什么」—— 捕捉意图、范围和做法 |
| `specs/` | delta spec，展示 ADDED/MODIFIED/REMOVED 的 requirement |
| `design.md` | 「怎么做」—— 技术做法与架构决策 |
| `tasks.md` | 带 checkbox 的实现清单 |

**Artifact 互相叠加：**

```
proposal ──► specs ──► design ──► tasks ──► implement
   ▲           ▲          ▲                    │
   └───────────┴──────────┴────────────────────┘
            update as you learn
```

你随时可以回头打磨更早的 artifact，因为你在实现过程中学到了更多。

### 12.6 Delta Spec 如何工作（How Delta Specs Work）

Delta spec 是 OpenSpec 里的关键概念。它们展示相对于你当前 spec 变的是什么。

#### 格式（The Format）

Delta spec 用分段来指明变化的类型：

```markdown
# Delta for Auth

## ADDED Requirements

### Requirement: Two-Factor Authentication
The system MUST require a second factor during login.

#### Scenario: OTP required
- GIVEN a user with 2FA enabled
- WHEN the user submits valid credentials
- THEN an OTP challenge is presented

## MODIFIED Requirements

### Requirement: Session Timeout
The system SHALL expire sessions after 30 minutes of inactivity.
(Previously: 60 minutes)

#### Scenario: Idle timeout
- GIVEN an authenticated session
- WHEN 30 minutes pass without activity
- THEN the session is invalidated

## REMOVED Requirements

### Requirement: Remember Me
(Deprecated in favor of 2FA)
```

#### 归档时发生什么（What Happens on Archive）

当你归档一个 change：

1. **ADDED** requirement 被追加到主 spec
2. **MODIFIED** requirement 替换既有版本
3. **REMOVED** requirement 从主 spec 里删除

change 文件夹移到 `openspec/changes/archive/`，作为审计历史。

### 12.7 例子：你的第一个 change（Example: Your First Change）

我们来走一遍给一个应用加暗色模式。

#### 1. 启动这个 change（默认方式）（1. Start the Change (Default)）

```text
You: /opsx:propose add-dark-mode

AI:  Created openspec/changes/add-dark-mode/
     ✓ proposal.md — why we're doing this, what's changing
     ✓ specs/       — requirements and scenarios
     ✓ design.md    — technical approach
     ✓ tasks.md     — implementation checklist
     Ready for implementation!
```

如果你启用了扩展工作流 profile，你也可以把它做成两步：`/opsx:new` 然后 `/opsx:ff`（或者用 `/opsx:continue` 增量进行）。

#### 2. 创建了什么（2. What Gets Created）

**proposal.md** - 捕捉意图：

```markdown
# Proposal: Add Dark Mode

## Intent
Users have requested a dark mode option to reduce eye strain
during nighttime usage.

## Scope
- Add theme toggle in settings
- Support system preference detection
- Persist preference in localStorage

## Approach
Use CSS custom properties for theming with a React context
for state management.
```

**specs/ui/spec.md** - 展示新 requirement 的 delta：

```markdown
# Delta for UI

## ADDED Requirements

### Requirement: Theme Selection
The system SHALL allow users to choose between light and dark themes.

#### Scenario: Manual toggle
- GIVEN a user on any page
- WHEN the user clicks the theme toggle
- THEN the theme switches immediately
- AND the preference persists across sessions

#### Scenario: System preference
- GIVEN a user with no saved preference
- WHEN the application loads
- THEN the system's preferred color scheme is used
```

**tasks.md** - 实现清单：

```markdown
# Tasks

## 1. Theme Infrastructure
- [ ] 1.1 Create ThemeContext with light/dark state
- [ ] 1.2 Add CSS custom properties for colors
- [ ] 1.3 Implement localStorage persistence

## 2. UI Components
- [ ] 2.1 Create ThemeToggle component
- [ ] 2.2 Add toggle to settings page
- [ ] 2.3 Update Header to include quick toggle

## 3. Styling
- [ ] 3.1 Define dark theme color palette
- [ ] 3.2 Update components to use CSS variables
```

#### 3. 实现（3. Implement）

```
You: /opsx:apply

AI:  Working through tasks...
     ✓ 1.1 Created ThemeContext with light/dark state
     ✓ 1.2 Added CSS custom properties to globals.css
     ✓ 1.3 Implemented localStorage persistence
     ✓ 2.1 Created ThemeToggle component
     ...
     All tasks complete!
```

实现过程中，如果你发现设计需要调整，直接更新那个 artifact 再继续就行。

#### 4. 归档（4. Archive）

```
You: /opsx:archive

AI:  Archiving add-dark-mode...
     ✓ Merged specs into openspec/specs/ui/spec.md
     ✓ Moved to openspec/changes/archive/2025-01-24-add-dark-mode/
     Done! Ready for the next feature.
```

你的 delta spec 现在是主 spec 的一部分，记录着你的系统如何工作。

### 12.8 校验与评审（Verifying and Reviewing）

用 CLI 查看你的 change 的情况：

```bash
# List active changes
openspec list

# View change details
openspec show add-dark-mode

# Validate spec formatting
openspec validate add-dark-mode

# Interactive dashboard
openspec view
```

### 12.9 下一步（Next Steps）

- [先探索](explore.md) - 在你投入之前，用 `/opsx:explore` 把一个想法想透
- [评审一个 change](reviewing-changes.md) - AI 起草的计划里该检查什么，在任何代码之前
- [写好 spec](writing-specs.md) - 一条强 requirement 和 scenario 长什么样
- [在存量项目里使用 OpenSpec](existing-projects.md) - 在一个大型存量代码库上起步
- [编辑与迭代一个 change](editing-changes.md) - 更新 artifact、往回走、对账手工的修改
- [核心概念一览](overview.md) - 整个心智模型在一页里
- [例子与配方](examples.md) - 真实的 change，从开始到结束
- [工作流](workflows.md) - 常见模式，以及每个命令何时使用
- [命令](commands.md) - 全部 slash command 的完整参考
- [概念](concepts.md) - 更深入地理解 spec、change 和 schema
- [自定义](customization.md) - 让 OpenSpec 按你的方式工作
- [Stores](stores-beta/user-guide.md) - 规划跨仓库或跨团队？把它放在自己的仓库里（beta）
- [FAQ](faq.md) 与 [排错](troubleshooting.md) - 当你卡住的时候
