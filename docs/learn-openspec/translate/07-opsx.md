## 7 opsx —— OPSX 工作流

> 译自 `reference/openspec/docs/opsx.md`（原文 675 行）。按 `READING-openspec.md` 第 07 项。ASCII 图与代码块按原样保留。
> 按第 07 项的 ⌸ 标记，以下内容压缩处理，均已在正文对应位置注明或直接略去：`Setup` 一节压成命令加一句说明；`Project Configuration` 保留配置示例、字段表、schema 优先级与注入机制（`<context>` → `<rules>` → `<template>`），其 `Troubleshooting` 子节（"Unknown artifact ID in rules" / "Config not being applied" / "Context too large" 三条操作性排错）略去不译；末尾 `Feedback` 略去。其余各节全文翻译。

### 7.1 这是什么？（What Is It?）

OPSX 现在是 OpenSpec 的标准工作流。

它是一个面向 OpenSpec change 的**流体、迭代的工作流**。不再有僵硬的阶段 —— 只有你随时可以执行的动作。

### 7.2 为什么会有它（Why This Exists）

legacy OpenSpec 工作流能用，但它是**锁死的**：

- **指令是硬编码的** —— 埋在 TypeScript 里，你改不了
- **全有或全无** —— 一条大命令创建所有东西，没法单独测试各个部件
- **结构固定** —— 所有人都用同一个工作流，无法定制
- **黑箱** —— 当 AI 输出不好时，你没法调提示词

**OPSX 把它打开了。** 现在任何人都可以：

1. **拿指令做实验** —— 改一个模板，看 AI 是否做得更好
2. **粒度化测试** —— 独立校验每个 artifact 的指令
3. **定制工作流** —— 定义你自己的 artifact 和依赖
4. **快速迭代** —— 改一个模板，立刻测试，不用重新构建

```text
Legacy workflow:                      OPSX:
┌────────────────────────┐           ┌────────────────────────┐
│  Hardcoded in package  │           │  schema.yaml           │◄── You edit this
│  (can't change)        │           │  templates/*.md        │◄── Or this
│        ↓               │           │        ↓               │
│  Wait for new release  │           │  Instant effect        │
│        ↓               │           │        ↓               │
│  Hope it's better      │           │  Test it yourself      │
└────────────────────────┘           └────────────────────────┘
```

**这是给每个人的：**
- **团队** —— 创建匹配你们实际工作方式的工作流
- **高级用户** —— 微调提示词，为你的代码库拿到更好的 AI 输出
- **OpenSpec 贡献者** —— 不发版就能试验新方法

我们都还在学习什么最有效。OPSX 让我们能一起学。

### 7.3 用户体验（The User Experience）

**线性工作流的问题：**
你在「规划阶段」，然后「实现阶段」，然后「完成」。但真实工作不是这样的。你实现了某个东西，意识到设计错了，需要更新 specs，然后继续实现。线性阶段在和工作的实际发生方式对着干。

**OPSX 的做法：**
- **动作，不是阶段** —— create、implement、update、archive —— 任何时候都能做其中任何一个
- **依赖是使能者** —— 它们展示什么是可能的，而不是接下来什么是必须的

```text
  proposal ──→ specs ──→ design ──→ tasks ──→ implement
```

### 7.4 配置（Setup）⌸

```bash
# Make sure you have openspec installed — skills are automatically generated
openspec init
```

这会在 `.claude/skills/`（或等价位置）创建 AI 编码助手能自动发现的技能。

默认情况下，OpenSpec 使用 `core` 工作流 profile（`propose`、`explore`、`apply`、`update`、`sync`、`archive`）。如果你想要扩展工作流命令（`new`、`continue`、`ff`、`verify`、`bulk-archive`、`onboard`），用 `openspec config profile` 配置，再用 `openspec update` 应用。

配置过程中，你会被提示创建一个**项目配置**（`openspec/config.yaml`）。它是可选的，但推荐。

### 7.5 项目配置（Project Configuration）

项目配置让你设置默认值，并把项目特定的上下文注入到所有 artifact 中。

#### 创建配置（Creating Config）

配置在 `openspec init` 期间创建，或手工创建：

```yaml
# openspec/config.yaml
schema: spec-driven

context: |
  Tech stack: TypeScript, React, Node.js
  API conventions: RESTful, JSON responses
  Testing: Vitest for unit tests, Playwright for e2e
  Style: ESLint with Prettier, strict TypeScript

rules:
  proposal:
    - Include rollback plan
    - Identify affected teams
  specs:
    - Use Given/When/Then format for scenarios
  design:
    - Include sequence diagrams for complex flows
```

#### 配置字段（Config Fields）

| 字段 | 类型 | 说明 |
|-------|------|-------------|
| `schema` | string | 新 change 的默认 schema（例如 `spec-driven`） |
| `context` | string | 注入到所有 artifact 指令里的项目上下文 |
| `rules` | object | 按 artifact 分组的规则，以 artifact ID 为键 |

#### 它如何工作（How It Works）

**schema 优先级**（从高到低）：
1. CLI 参数（`--schema <name>`）
2. change 元数据（change 目录里的 `.openspec.yaml`）
3. 项目配置（`openspec/config.yaml`）
4. 默认（`spec-driven`）

**上下文注入：**
- context 被前置到每个 artifact 的指令前
- 包在 `<context>...</context>` 标签里
- 帮助 AI 理解你项目的约定

**规则注入：**
- rules 只对匹配的 artifact 注入
- 包在 `<rules>...</rules>` 标签里
- 出现在 context 之后、template 之前

#### 按 schema 分的 artifact ID（Artifact IDs by Schema）

**spec-driven**（默认）：
- `proposal` —— change proposal
- `specs` —— 规格说明
- `design` —— 技术设计
- `tasks` —— 实现任务

#### 配置校验（Config Validation）

- `rules` 里未知的 artifact ID 会产生警告
- schema 名称会对着可用 schema 校验
- context 有 50KB 大小上限
- 无效 YAML 会带行号报错

### 7.6 命令（Commands）

| 命令 | 它做什么 |
|---------|--------------|
| `/opsx:propose` | 创建一个 change 并一步生成规划 artifact（默认快速路径） |
| `/opsx:explore` | 把想法想透、调查问题、澄清需求 |
| `/opsx:new` | 开始一个新的 change 骨架（扩展工作流） |
| `/opsx:continue` | 创建下一个 artifact（扩展工作流） |
| `/opsx:ff` | 快进生成规划 artifact（扩展工作流） |
| `/opsx:apply` | 实现任务，按需更新 artifact |
| `/opsx:update` | 修订一个 change 的规划 artifact 并保持它们一致 |
| `/opsx:verify` | 校验实现是否匹配 artifact（扩展工作流） |
| `/opsx:sync` | 把 delta spec 合并进主 spec（可选） |
| `/opsx:archive` | 完成后归档 |
| `/opsx:bulk-archive` | 归档多个已完成的 change（扩展工作流） |
| `/opsx:onboard` | 端到端走完一个 change 的引导式教学（扩展工作流） |

### 7.7 用法（Usage）

#### 探索一个想法

```
/opsx:explore
```

把想法想透、调查问题、比较选项。不需要任何结构 —— 就是一个思考伙伴。当洞见结晶时，转到 `/opsx:propose`（默认）或 `/opsx:new`/`/opsx:ff`（扩展）。

#### 开始一个新 change

```
/opsx:propose
```

创建 change 并生成实现之前所需的规划 artifact。

如果你启用了扩展工作流，可以改用：

```text
/opsx:new        # scaffold only
/opsx:continue   # create one artifact at a time
/opsx:ff         # create all planning artifacts at once
```

#### 创建 artifact

```
/opsx:continue
```

基于依赖显示什么已经可以被创建，然后创建一个 artifact。反复使用来增量地搭起你的 change。

```
/opsx:ff add-dark-mode
```

一次创建所有规划 artifact。当你要建什么有清晰图景时用它。

#### 实现（流体的那部分）

```
/opsx:apply
```

逐项处理任务，边做边勾。如果你在同时处理多个 change，可以跑 `/opsx:apply <name>`；否则它应该从对话里推断，推断不出来时提示你选择。

#### 更新一个 change

```
/opsx:update add-dark-mode - we're storing the theme in a cookie now
```

修订这个 change 已有的规划 artifact，并在任何方向上保持它们一致（改 design 可能反向波及 proposal）。它永不编辑代码。每一处修改都先和你确认。它如何处理缺失文件而不新起一个 artifact，见 [update 参考](commands.md#opsxupdate)。

如果这个 change 已经被实现了，它会推荐 `/opsx:apply`，让代码赶上修订后的计划。如果你的修订改变了这个 change 的**意图**，那应该另起一个新的。见 [什么时候更新 vs. 另起](#78-什么时候更新-vs-另起一个新-change)。

#### 同步 delta spec

```text
/opsx:sync
```

把当前 change 的 delta spec 合并进你的主 `openspec/specs/`，**不**归档 —— change 保持活跃。它会应用整个 delta：`## REMOVED` 下的 requirement 从主 spec 删除，被重命名的原位改名，而 delta 没提到的内容原样不动。同步是可选的 —— 你没同步的话归档会提示你先同步。在以下时候用它：你希望在归档之前就更新主 spec；某个并行 change 需要建立在这个 change 刚加入的 spec 上；或者你想在归档前先看看合并后的主 spec。

#### 收尾

```
/opsx:archive   # Move to archive when done (prompts to sync specs if needed)
```

### 7.8 什么时候更新 vs. 另起一个新 change（When to Update vs. Start Fresh）

你总能在实现之前编辑你的 proposal 或 specs。但「精修」什么时候变成「这是另一件事了」？

#### 一份 proposal 捕捉什么（What a Proposal Captures）

一份 proposal 定义三件事：
1. **意图** —— 你在解决什么问题？
2. **范围** —— 什么在界内、什么在界外？
3. **方法** —— 你打算怎么解决？

问题在于：哪一个变了，变了多少？

#### 在以下情况更新既有的 change（Update the Existing Change When:）

**意图相同，执行精修**
- 你发现了没考虑到的边界情况
- 方法需要微调，但目标没变
- 实现暴露出设计略有偏差

**范围收窄**
- 你意识到完整范围太大，想先交付 MVP
- "Add dark mode" → "Add dark mode toggle (system preference in v2)"

**学习驱动的修正**
- 代码库的结构和你想的不一样
- 某个依赖的表现和预期不符
- "Use CSS variables" → "Use Tailwind's dark: prefix instead"

#### 在以下情况另起一个新 change（Start a New Change When:）

**意图发生了根本变化**
- 问题本身现在不同了
- "Add dark mode" → "Add comprehensive theme system with custom colors, fonts, spacing"

**范围爆炸**
- change 长得太大，实质上已经是另一件事
- 更新完之后原始 proposal 会面目全非
- "Fix login bug" → "Rewrite auth system"

**原始那个可以完成**
- 原始的 change 可以被标记为「完成」
- 新工作是独立的，不是一次精修
- 完成 "Add dark mode MVP" → 归档 → 新建 "Enhance dark mode"

#### 启发式（The Heuristics）

```text
                        ┌─────────────────────────────────────┐
                        │     Is this the same work?          │
                        └──────────────┬──────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
             Same intent?      >50% overlap?      Can original
             Same problem?     Same scope?        be "done" without
                    │                  │          these changes?
                    │                  │                  │
          ┌────────┴────────┐  ┌──────┴──────┐   ┌───────┴───────┐
          │                 │  │             │   │               │
         YES               NO YES           NO  NO              YES
          │                 │  │             │   │               │
          ▼                 ▼  ▼             ▼   ▼               ▼
       UPDATE            NEW  UPDATE       NEW  UPDATE          NEW
```

| 检验 | 更新 | 新 change |
|------|--------|------------|
| **同一性** | 「同一件事，精修过」 | 「另一件事」 |
| **范围重叠** | 重叠 >50% | 重叠 <50% |
| **完成性** | 不做这些改动就没法「完成」 | 能完成原始那个，新工作是独立的 |
| **故事** | 更新链条讲得通一个连贯的故事 | 打补丁比重新说更让人糊涂 |

#### 原则（The Principle）

> **更新保留上下文。新 change 提供清晰。**
>
> 当你思考的历史有价值时，选择更新。
> 当重新开始比打补丁更清楚时，选择新建。

把它想成 git 分支：
- 在同一个功能上继续提交
- 当它确实是新工作时，开一个新分支
- 有时把一个阶段性的功能合并掉，然后为第二阶段重新开始

### 7.9 有什么不同？（What's Different?）

| | legacy（`/openspec:proposal`） | OPSX（`/opsx:*`） |
|---|---|---|
| **结构** | 一份大 proposal 文档 | 离散的 artifact，带依赖 |
| **工作流** | 线性阶段：plan → implement → archive | 流体动作 —— 任何时候做任何事 |
| **迭代** | 回头很别扭 | 边学边更新 artifact |
| **定制** | 结构固定 | schema 驱动（定义你自己的 artifact） |

**关键洞见：** 工作不是线性的。OPSX 不再假装它是。

### 7.10 架构深挖（Architecture Deep Dive）

本节解释 OPSX 在底层如何工作，以及它和 legacy 工作流的对比。
本节里的例子用扩展命令集（`new`、`continue` 等）；默认 `core` 用户可以把同一套流程映射到 `propose → apply → sync → archive`。

#### 哲学：阶段 vs 动作（Philosophy: Phases vs Actions）

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LEGACY WORKFLOW                                      │
│                    (Phase-Locked, All-or-Nothing)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐      ┌──────────────┐      ┌──────────────┐             │
│   │   PLANNING   │ ───► │ IMPLEMENTING │ ───► │   ARCHIVING  │             │
│   │    PHASE     │      │    PHASE     │      │    PHASE     │             │
│   └──────────────┘      └──────────────┘      └──────────────┘             │
│         │                     │                     │                       │
│         ▼                     ▼                     ▼                       │
│   /openspec:proposal   /openspec:apply      /openspec:archive              │
│                                                                             │
│   • Creates ALL artifacts at once                                          │
│   • Can't go back to update specs during implementation                    │
│   • Phase gates enforce linear progression                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                            OPSX WORKFLOW                                     │
│                      (Fluid Actions, Iterative)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│              ┌────────────────────────────────────────────┐                 │
│              │           ACTIONS (not phases)             │                 │
│              │                                            │                 │
│              │   new ◄──► continue ◄──► apply ◄──► archive │                 │
│              │    │          │           │           │    │                 │
│              │    └──────────┴───────────┴───────────┘    │                 │
│              │              any order                     │                 │
│              └────────────────────────────────────────────┘                 │
│                                                                             │
│   • Create artifacts one at a time OR fast-forward                         │
│   • Update specs/design/tasks during implementation                        │
│   • Dependencies enable progress, phases don't exist                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 组件架构（Component Architecture）

**legacy 工作流**使用 TypeScript 里硬编码的模板：

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                      LEGACY WORKFLOW COMPONENTS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Hardcoded Templates (TypeScript strings)                                  │
│                    │                                                        │
│                    ▼                                                        │
│   Tool-specific configurators/adapters                                      │
│                    │                                                        │
│                    ▼                                                        │
│   Generated Command Files (.claude/commands/openspec/*.md)                  │
│                                                                             │
│   • Fixed structure, no artifact awareness                                  │
│   • Change requires code modification + rebuild                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**OPSX** 使用外部 schema 和一个依赖图引擎：

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OPSX COMPONENTS                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Schema Definitions (YAML)                                                 │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  name: spec-driven                                                  │   │
│   │  artifacts:                                                         │   │
│   │    - id: proposal                                                   │   │
│   │      generates: proposal.md                                         │   │
│   │      requires: []              ◄── Dependencies                     │   │
│   │    - id: specs                                                      │   │
│   │      generates: specs/**/*.md  ◄── Glob patterns                    │   │
│   │      requires: [proposal]      ◄── Enables after proposal           │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                    │                                                        │
│                    ▼                                                        │
│   Artifact Graph Engine                                                     │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  • Topological sort (dependency ordering)                           │   │
│   │  • State detection (filesystem existence)                           │   │
│   │  • Rich instruction generation (templates + context)                │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                    │                                                        │
│                    ▼                                                        │
│   Skill Files (.claude/skills/openspec-*/SKILL.md)                          │
│                                                                             │
│   • Cross-editor compatible (Claude Code, Cursor, Devin)                    │
│   • Skills query CLI for structured data                                    │
│   • Fully customizable via schema files                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 依赖图模型（Dependency Graph Model）

Artifact 构成一张有向无环图（DAG）。依赖是**使能者**，不是闸门：

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
                                  │
                                  ▼
                          ┌──────────────┐
                          │ APPLY PHASE  │
                          │ (requires:   │
                          │  tasks)      │
                          └──────────────┘
```

**状态转移：**

```text
   BLOCKED ────────────────► READY ────────────────► DONE
      │                        │                       │
   Missing                  All deps               File exists
   dependencies             are DONE               on filesystem
```

#### 信息流（Information Flow）

**legacy 工作流** —— agent 接收静态指令：

```text
  User: "/openspec:proposal"
           │
           ▼
  ┌─────────────────────────────────────────┐
  │  Static instructions:                   │
  │  • Create proposal.md                   │
  │  • Create tasks.md                      │
  │  • Create design.md                     │
  │  • Create delta spec files              │
  │                                         │
  │  No awareness of what exists or         │
  │  dependencies between artifacts         │
  └─────────────────────────────────────────┘
           │
           ▼
  Agent creates ALL artifacts in one go
```

**OPSX** —— agent 查询丰富的上下文：

```text
  User: "/opsx:continue"
           │
           ▼
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  Step 1: Query current state                                             │
  │  ┌────────────────────────────────────────────────────────────────────┐  │
  │  │  $ openspec status --change "add-auth" --json                      │  │
  │  │                                                                    │  │
  │  │  {                                                                 │  │
  │  │    "artifacts": [                                                  │  │
  │  │      {"id": "proposal", "status": "done"},                         │  │
  │  │      {"id": "specs", "status": "ready"},      ◄── First ready      │  │
  │  │      {"id": "design", "status": "ready"},                          │  │
  │  │      {"id": "tasks", "status": "blocked",                          │  │
  │  │       "missingDeps": ["specs", "design"]}                          │  │
  │  │    ]                                                               │  │
  │  │  }                                                                 │  │
  │  └────────────────────────────────────────────────────────────────────┘  │
  │                                                                          │
  │  Step 2: Get rich instructions for ready artifact                        │
  │  ┌────────────────────────────────────────────────────────────────────┐  │
  │  │  $ openspec instructions specs --change "add-auth" --json          │  │
  │  │                                                                    │  │
  │  │  {                                                                 │  │
  │  │    "template": "# Specification\n\n## ADDED Requirements...",      │  │
  │  │    "dependencies": [{"id": "proposal", "path": "...", "done": true}│  │
  │  │    "unlocks": ["tasks"]                                            │  │
  │  │  }                                                                 │  │
  │  └────────────────────────────────────────────────────────────────────┘  │
  │                                                                          │
  │  Step 3: Read dependencies → Create ONE artifact → Show what's unlocked  │
  └──────────────────────────────────────────────────────────────────────────┘
```

#### 迭代模型（Iteration Model）

**legacy 工作流** —— 迭代很别扭：

```text
  ┌─────────┐     ┌─────────┐     ┌─────────┐
  │/proposal│ ──► │ /apply  │ ──► │/archive │
  └─────────┘     └─────────┘     └─────────┘
       │               │
       │               ├── "Wait, the design is wrong"
       │               │
       │               ├── Options:
       │               │   • Edit files manually (breaks context)
       │               │   • Abandon and start over
       │               │   • Push through and fix later
       │               │
       │               └── No official "go back" mechanism
       │
       └── Creates ALL artifacts at once
```

**OPSX** —— 自然的迭代：

```text
  /opsx:new ───► /opsx:continue ───► /opsx:apply ───► /opsx:archive
      │                │                  │
      │                │                  ├── "The design is wrong"
      │                │                  │
      │                │                  ▼
      │                │            Just edit design.md
      │                │            and continue!
      │                │                  │
      │                │                  ▼
      │                │         /opsx:apply picks up
      │                │         where you left off
      │                │
      │                └── Creates ONE artifact, shows what's unlocked
      │
      └── Scaffolds change, waits for direction
```

#### 自定义 schema（Custom Schemas）

用 schema 管理命令创建自定义工作流：

```bash
# Create a new schema from scratch (interactive)
openspec schema init my-workflow

# Or fork an existing schema as a starting point
openspec schema fork spec-driven my-workflow

# Validate your schema structure
openspec schema validate my-workflow

# See where a schema resolves from (useful for debugging)
openspec schema which my-workflow
```

Schema 存放在 `openspec/schemas/`（项目本地，纳入版本管理）或 `~/.local/share/openspec/schemas/`（用户全局）。

**schema 结构：**
```
openspec/schemas/research-first/
├── schema.yaml
└── templates/
    ├── research.md
    ├── proposal.md
    └── tasks.md
```

**示例 schema.yaml：**
```yaml
name: research-first
artifacts:
  - id: research        # Added before proposal
    generates: research.md
    requires: []

  - id: proposal
    generates: proposal.md
    requires: [research]  # Now depends on research

  - id: tasks
    generates: tasks.md
    requires: [proposal]
```

**依赖图：**
```
   research ──► proposal ──► tasks
```

#### 小结（Summary）

| 方面 | legacy | OPSX |
|--------|----------|------|
| **模板** | 硬编码在 TypeScript 里 | 外部 YAML + Markdown |
| **依赖** | 无（一次全建） | 带拓扑排序的 DAG |
| **状态** | 基于阶段的心智模型 | 文件系统是否存在 |
| **定制** | 改源码，重新构建 | 创建 schema.yaml |
| **迭代** | 阶段锁定 | 流体，什么都能改 |
| **编辑器支持** | 按工具区分的 configurator/adapter | 单一 skills 目录 |

### 7.11 Schema（Schemas）

Schema 定义存在哪些 artifact 以及它们的依赖。当前可用：

- **spec-driven**（默认）：proposal → specs → design → tasks

```bash
# List available schemas
openspec schemas

# See all schemas with their resolution sources
openspec schema which --all

# Create a new schema interactively
openspec schema init my-workflow

# Fork an existing schema for customization
openspec schema fork spec-driven my-workflow

# Validate schema structure before use
openspec schema validate my-workflow
```

### 7.12 技巧（Tips）

- 用 `/opsx:explore` 在承诺一个 change 之前把想法想透
- 知道想要什么时用 `/opsx:ff`，在探索时用 `/opsx:continue`
- 在 `/opsx:apply` 期间，如果有东西不对 —— 修那个 artifact，然后继续
- 任务通过 `tasks.md` 里的 checkbox 追踪进度
- 任何时候都能查状态：`openspec status --change "name"`
