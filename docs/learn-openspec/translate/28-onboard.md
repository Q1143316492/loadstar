## 28 onboard —— 引导式教学

> 译自 `reference/openspec/skills/openspec-onboard/SKILL.md`（原文 574 行，全文翻译）。按 `READING-openspec.md` 第 28 项。frontmatter、全部 bash 命令、JSON 字段名、输出模板骨架与 CLI 报错码按原样保留。

**frontmatter**

- `name`: `openspec-onboard`
- `description`: `Guided onboarding for OpenSpec - walk through a complete workflow cycle with narration and real codebase work. Also use when the user says "openspec onboard" or "opsx onboard".`
- `allowed-tools`: `Bash(openspec:*)`
- `license`: `MIT`
- `compatibility`: `Requires openspec CLI.`
- `metadata.author`: `openspec`
- `metadata.version`: `"1.0"`

### 28.1 开篇（Opening）

引导用户走完他们的第一个完整 OpenSpec 工作流循环。这是一次教学体验 —— 你会在他们的代码库里做真实的工作，同时解释每一步。

### 28.2 store 选择（Store selection）

**store 选择（Store selection）：** 如果用户点名了一个 store（store 是一台机器上注册的、独立的 OpenSpec 仓库），或者工作就住在某个 store 里，跑 `openspec store list --json` 发现已注册的 store id，然后在那些读写 spec 和 change 的命令上传 `--store <id>`（`new change`、`status`、`instructions`、`list`、`show`、`validate`、`archive`、`doctor`、`context`、`schemas`、`view`）。一旦选定，就把 `--store <id>` 当作在整个工作流余下部分里 **sticky**。下面那些命令的每一个未加作用域的例子都是简写：跑之前，把参数补上。例如跑 `openspec status --change "<name>" --json --store "<id>"`，而不是下面展示的未加作用域的形式。其它命令不接受这个参数。命令打印出的提示已经带上了这个参数；后续调用要保持带上它。没有 store 时，命令作用于最近的本 `openspec/` root。

### 28.3 项目检查（Project check）

**项目检查（Project check）：** 这些步骤期望一个已经在用 OpenSpec 的项目。在第一个会写任何东西的步骤之前（`new change`、`archive`、`sync specs`，或撰写一个 artifact 文件），先确认项目有 root：跑 `openspec list --json`（选中 store 时带 `--store <id>`，因为那时 store 就是 root）并读 `root`。一个 root 对象意味着项目已配置好。`"root": null` 意味着没有配置好 —— 这里没有 `openspec/` 目录，而一次写入（比如 `openspec new change`）会作为副作用创建一个。这条命令也会以非零码退出，那是这个答案本身，而不是 CLI 坏了，所以要读 JSON，不要去重试或绕开它。

### 28.4 一种与配置无关的 `"root": null`

有一种 `"root": null` 和配置无关：当一条 `status` 错误消息以 `Declared in` 或 `Invalid store declaration in` 开头，并点名了本项目的 `openspec/config.yaml`（或 `config.yml`）时，说明这个项目确实通过一个它声明的 store 在用 OpenSpec，只是这台机器无法解析那个 store（store 未注册，或者 `store:` 那行格式不对）。不要把它当作未初始化并跳过下面的分支：在写入之前停下，把那条错误的 `message` 和 `fix` 给用户看。

### 28.5 无 root 时如何分支（No root: branch on how this workflow was reached）

否则，在没有 root 的情况下，接下来发生什么取决于这个工作流是怎么被触达的：

- **自动选中（Auto-selected）**：你自己选了这个工作流，而用户没有点名 OpenSpec、没有点名这个技能、也没有跑它的 slash command。停止使用 OpenSpec，正常回答这个请求，就像没装 OpenSpec 一样。不要让他们去配置任何东西，也不要提 OpenSpec 的配置。
- **显式 OpenSpec 请求（Explicit OpenSpec request）**：用户点名了 OpenSpec、点名了这个技能，或跑了它的 slash command。在写入之前停下，问怎么继续：把项目配置起来（`openspec init`）、指向他们已有的某个 store（`--store <id>`），还是这次请求不用 OpenSpec。等他们的回答。

两个分支里，都不要把创建 root 当作副作用：用户要求之前不要跑 `openspec init`，不要手工创建 `openspec/` 文件，也不要让任何命令创建它。

### 28.6 预检（Preflight）

开始之前，检查 OpenSpec CLI 是否已安装：

```bash
# Unix/macOS
openspec --version 2>&1 || echo "CLI_NOT_INSTALLED"
# Windows (PowerShell)
# if (Get-Command openspec -ErrorAction SilentlyContinue) { openspec --version } else { echo "CLI_NOT_INSTALLED" }
```

**如果 CLI 未安装：**
> OpenSpec CLI is not installed. Install it first, then come back to `/openspec-onboard`.

如果未安装，就停在这里。

### 28.7 Phase 1：欢迎（Phase 1: Welcome）

展示：

```
## Welcome to OpenSpec!

I'll walk you through a complete change cycle—from idea to implementation—using a real task in your codebase. Along the way, you'll learn the workflow by doing it.

**What we'll do:**
1. Pick a small, real task in your codebase
2. Explore the problem briefly
3. Create a change (the container for our work)
4. Build the artifacts: proposal → specs → design → tasks
5. Implement the tasks
6. Archive the completed change

**Time:** ~15-20 minutes

Let's start by finding something to work on.
```

### 28.8 Phase 2：任务选择（Phase 2: Task Selection）

#### 28.8.1 代码库分析（Codebase Analysis）

扫描代码库，找小的改进机会。留意：

1. **TODO/FIXME 注释** - 在代码文件里搜 `TODO`、`FIXME`、`HACK`、`XXX`
2. **缺失的错误处理** - 吞掉错误的 `catch` 块、没有 try-catch 的风险操作
3. **没有测试的函数** - 把 `src/` 和测试目录交叉比对
4. **类型问题** - TypeScript 文件里的 `any` 类型（`: any`、`as any`）
5. **调试残留** - 非调试代码里的 `console.log`、`console.debug`、`debugger` 语句
6. **缺失的校验** - 没有校验的用户输入处理器

也检查最近 git 活动：
```bash
# Unix/macOS
git log --oneline -10 2>/dev/null || echo "No git history"
# Windows (PowerShell)
# git log --oneline -10 2>$null; if ($LASTEXITCODE -ne 0) { echo "No git history" }
```

#### 28.8.2 给出建议（Present Suggestions）

根据你的分析，给出 3-4 个具体建议：

```
## Task Suggestions

Based on scanning your codebase, here are some good starter tasks:

**1. [Most promising task]**
   Location: `src/path/to/file.ts:42`
   Scope: ~1-2 files, ~20-30 lines
   Why it's good: [brief reason]

**2. [Second task]**
   Location: `src/another/file.ts`
   Scope: ~1 file, ~15 lines
   Why it's good: [brief reason]

**3. [Third task]**
   Location: [location]
   Scope: [estimate]
   Why it's good: [brief reason]

**4. Something else?**
   Tell me what you'd like to work on.

Which task interests you? (Pick a number or describe your own)
```

**如果什么都没找到：** 退回到问用户想建什么：
> I didn't find obvious quick wins in your codebase. What's something small you've been meaning to add or fix?

#### 28.8.3 范围护栏（Scope Guardrail）

如果用户选中的或描述的东西太大（大功能、好几天的工作）：

```
That's a valuable task, but it's probably larger than ideal for your first OpenSpec run-through.

For learning the workflow, smaller is better—it lets you see the full cycle without getting stuck in implementation details.

**Options:**
1. **Slice it smaller** - What's the smallest useful piece of [their task]? Maybe just [specific slice]?
2. **Pick something else** - One of the other suggestions, or a different small task?
3. **Do it anyway** - If you really want to tackle this, we can. Just know it'll take longer.

What would you prefer?
```

如果用户坚持，就让他们覆盖 —— 这是一条软护栏。

### 28.9 Phase 3：探索演示（Phase 3: Explore Demo）

选好一个任务之后，简短演示一下探索模式：

```
Before we create a change, let me quickly show you **explore mode**—it's how you think through problems before committing to a direction.
```

花 1-2 分钟调查相关代码：
- 读涉及的文件
- 如果有帮助，画一张快速的 ASCII 图
- 记录任何需要考虑的点

```
## Quick Exploration

[Your brief analysis—what you found, any considerations]

┌─────────────────────────────────────────┐
│   [Optional: ASCII diagram if helpful]  │
└─────────────────────────────────────────┘

Explore mode (`/openspec-explore`) is for this kind of thinking—investigating before implementing. You can use it anytime you need to think through a problem.

Now let's create a change to hold our work.
```

**PAUSE** —— 等用户确认之后再继续。

### 28.10 Phase 4：创建 change（Phase 4: Create the Change）

**EXPLAIN:**
```
## Creating a Change

A "change" in OpenSpec is a container for all the thinking and planning around a piece of work. It lives at the `changeRoot` reported by `openspec status --change "<name>" --json` and holds your artifacts—proposal, specs, design, tasks.

Let me create one for our task.
```

**DO:** 用一个推导出来的 kebab-case 名字创建这个 change：
```bash
openspec new change "<derived-name>"
```

**SHOW:**
````
Created: <changeRoot from status JSON>

The folder structure:
```
<changeRoot>/
├── proposal.md    ← Why we're doing this (empty, we'll fill it)
├── design.md      ← How we'll build it (empty)
├── specs/         ← Detailed requirements (empty)
└── tasks.md       ← Implementation checklist (empty)
```

Now let's fill in the first artifact—the proposal.
````

### 28.11 Phase 5：Proposal（Phase 5: Proposal）

**EXPLAIN:**
```
## The Proposal

The proposal captures **why** we're making this change and **what** it involves at a high level. It's the "elevator pitch" for the work.

I'll draft one based on our task.
```

**DO:** 起草 proposal 内容（先不要保存）：

`<capability-path>` 是 spec 目录相对于 `specs/` 的路径（例如
`user-auth` 或 `identity/user-auth`）。对修改既有的 capability，用已存在的精确路径。对于新的 capability，遵循项目既有的 spec 组织方式。

```
Here's a draft proposal:

---

# Proposal

## Why

[1-2 sentences explaining the problem/opportunity]

## What Changes

[Bullet points of what will be different]

## Capabilities

### New Capabilities
- `<capability-path>`: [brief description]

### Modified Capabilities
<!-- If modifying existing behavior -->
- `<existing-capability-path>`: [brief description]

## Impact

- `src/path/to/file.ts`: [what changes]
- [other files if applicable]

---

Does this capture the intent? I can adjust before we save it.
```

**PAUSE** —— 等用户批准/反馈。

批准之后，保存 proposal：
```bash
openspec instructions proposal --change "<name>" --json
```
然后把内容写到 `openspec instructions proposal --change "<name>" --json` 给出的 `resolvedOutputPath`。

```
Proposal saved. This is your "why" document—you can always come back and refine it as understanding evolves.

Next up: specs.
```

### 28.12 Phase 6：Specs（Phase 6: Specs）

**EXPLAIN:**
```
## Specs

Specs define **what** we're building in precise, testable terms. They use a requirement/scenario format that makes expected behavior crystal clear.

For a small task like this, we might only need one spec file.
```

**DO:** 解析出 spec 文件应该创建在哪里：
```bash
openspec instructions specs --change "<name>" --json
# Use resolvedOutputPath from the JSON. If it is a glob, choose the concrete file path using the schema instruction and the change's context.
```

起草 spec 内容：

```
Here's the spec:

---

# Spec Delta

## ADDED Requirements

### Requirement: <Name>

<Description of what the system should do>

#### Scenario: <Scenario name>

- **WHEN** <trigger condition>
- **THEN** <expected outcome>
- **AND** <additional outcome if needed>

---

This format—WHEN/THEN/AND—makes requirements testable. You can literally read them as test cases.
```

保存到从 `resolvedOutputPath` 选出的具体文件路径。

### 28.13 Phase 7：Design（Phase 7: Design）

**EXPLAIN:**
```
## Design

The design captures **how** we'll build it—technical decisions, tradeoffs, approach.

For small changes, this might be brief. That's fine—not every change needs deep design discussion.
```

**DO:** 起草 design.md：

```
Here's the design:

---

# Design

## Context

[Brief context about the current state]

## Goals / Non-Goals

**Goals:**
- [What we're trying to achieve]

**Non-Goals:**
- [What's explicitly out of scope]

## Decisions

### Decision 1: [Key decision]

[Explanation of approach and rationale]

---

For a small task, this captures the key decisions without over-engineering.
```

保存到 `openspec instructions design --change "<name>" --json` 给出的 `resolvedOutputPath`。

### 28.14 Phase 8：Tasks（Phase 8: Tasks）

**EXPLAIN:**
```
## Tasks

Finally, we break the work into implementation tasks—checkboxes that drive the apply phase.

These should be small, clear, and in logical order. Each group carries the tests and documentation for its own work - the last group is only for integration checks.
```

**DO:** 基于 specs 和 design 生成任务：

```
Here are the implementation tasks:

---

# Tasks

## 1. [Category or file]

- [ ] 1.1 [Specific task] — verify: [test, command, observable behavior, or delivered artifact]
- [ ] 1.2 [Specific task] — verify: [test, command, observable behavior, or delivered artifact]

## 2. Integration Verification

- [ ] 2.1 Verify [broader integration or system behavior] with [end-to-end test or observable result]

---

Each checkbox becomes a unit of work in the apply phase. Does this task breakdown look right?
```

**PAUSE** —— 等用户批准/反馈。

批准之后，保存到 `openspec instructions tasks --change "<name>" --json` 给出的 `resolvedOutputPath`。

然后问：
> "Tasks are saved. Ready to implement?"

**PAUSE** —— 等用户确认之后再实现。

### 28.15 Phase 9：Apply（实现）（Phase 9: Apply (Implementation)）

**EXPLAIN:**
```
## Implementation

Now we implement each task, checking them off as we go. I'll announce each one and occasionally note how the specs/design informed the approach.
```

**DO:** 对每个 task：

1. 宣布："Working on task N: [description]"
2. 在代码库里实现这个变更
3. 自然地引用 specs/design："The spec says X, so I'm doing Y"
4. 在 tasks.md 里标记完成：`- [ ]` → `- [x]`
5. 简短状态："✓ Task N complete"

保持叙述轻量 —— 不要过度解释每一行代码。

所有 task 之后：

```
## Implementation Complete

All tasks done:
- [x] Task 1
- [x] Task 2
- [x] ...

The change is implemented! One more step—let's archive it.
```

### 28.16 Phase 10：归档（Phase 10: Archive）

**EXPLAIN:**
```
## Archiving

When a change is complete, we archive it. The archive path is derived from `planningHome.changesDir` and the date.

Archived changes become your project's decision history—you can always find them later to understand why something was built a certain way.
```

**DO:** 归档这个 change（`--yes` 会回答那些确认提示，而你无法从一次工具调用里回答它们）：
```bash
openspec archive "<name>" --yes
```

**SHOW:**
```
Archived to: `<planningHome.changesDir>/archive/<target-name>/` (the target name prepends today's date, unless the name already starts with a `YYYY-MM-DD-` prefix — then it is kept as-is, no second date)

The change is now part of your project's history. The code is in your codebase, the decision record is preserved.
```

### 28.17 Phase 11：回顾与下一步（Phase 11: Recap & Next Steps）

```
## Congratulations!

You just completed a full OpenSpec cycle:

1. **Explore** - Thought through the problem
2. **New** - Created a change container
3. **Proposal** - Captured WHY
4. **Specs** - Defined WHAT in detail
5. **Design** - Decided HOW
6. **Tasks** - Broke it into steps
7. **Apply** - Implemented the work
8. **Archive** - Preserved the record

This same rhythm works for any size change—a small fix or a major feature.

---

## Command Reference

**The commands you have installed:**

 | Command          | What it does                               |
 |------------------|--------------------------------------------|
 | `/openspec-propose` | Create a change and generate all artifacts |
 | `/openspec-explore` | Think through problems before/during work  |
 | `/openspec-apply-change`   | Implement tasks from a change              |
 | `/openspec-archive-change` | Archive a completed change                 |
 | `/openspec-new-change`     | Start a new change, one artifact at a time |
 | `/openspec-continue-change` | Continue working on an existing change    |
 | `/openspec-ff-change`      | Fast-forward: create all artifacts at once |
 | `/openspec-verify-change`  | Verify implementation matches artifacts    |

---

## What's Next?

Try `/openspec-propose` on something you actually want to build. You've got the rhythm now!
```

### 28.18 优雅退出处理（Graceful Exit Handling）

#### 28.18.1 用户想中途停下（User wants to stop mid-way）

如果用户说他们需要停下、想暂停，或者看起来心不在焉：

```
No problem! Your change is saved at the `changeRoot` reported by `openspec status --change "<name>" --json`.

To pick up where we left off later, `openspec status --change "<name>" --json` shows exactly where the change stands.
- `/openspec-continue-change <name>` - Resume artifact creation
- `/openspec-apply-change <name>` - Jump to implementation (if tasks exist)

The work won't be lost. Come back whenever you're ready.
```

无压力地优雅退出。

#### 28.18.2 用户只想要命令参考（User just wants command reference）

如果用户说他们只想看看命令，或者想跳过教程：

```
## OpenSpec Quick Reference

**The commands you have installed:**

 | Command                  | What it does                               |
 |--------------------------|--------------------------------------------|
 | `/openspec-propose <name>`  | Create a change and generate all artifacts |
 | `/openspec-explore`         | Think through problems (no code changes)   |
 | `/openspec-apply-change <name>`    | Implement tasks                            |
 | `/openspec-archive-change <name>`  | Archive when done                          |
 | `/openspec-new-change <name>`      | Start a new change, step by step           |
 | `/openspec-continue-change <name>` | Continue an existing change                |
 | `/openspec-ff-change <name>`       | Fast-forward: all artifacts at once        |
 | `/openspec-verify-change <name>`   | Verify implementation                      |

Try `/openspec-propose` to start your first change.
```

优雅退出。

### 28.19 护栏（Guardrails）

- **在关键转折点遵循 EXPLAIN → DO → SHOW → PAUSE 模式**（探索之后、proposal 草稿之后、tasks 之后、归档之后）
- **实现期间保持叙述轻量** —— 教学而不说教
- **不要跳过阶段**，即使这个 change 很小 —— 目标是教会这个工作流
- **在标记的点暂停等确认**，但不要过度暂停
- **优雅地处理退出** —— 绝不施压让用户继续
- **用真实的代码库任务** —— 不要模拟，也不要用假的例子
- **温和地调整范围** —— 引导用户走向更小的任务，但尊重用户的选择
