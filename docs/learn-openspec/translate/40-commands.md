## 40 commands —— slash command 参考

> 译自 `reference/openspec/docs/commands.md`（原文 779 行 / 25,015 字节）。按 `READING-openspec.md` 第 40 项（⌸）。按第 40 项的口径：`Quick Reference` 与 `Command Reference` 两节照译；`Command Syntax by AI Tool` 与 `Legacy Commands` 两节**略去**（工具适配层，本轮阅读路线明确不取），`Troubleshooting` 亦略去；末尾 `Next Steps` 按本目录既定惯例保留（40.3）。所有命令名、参数、代码块与示例输出按原样保留。

这是 OpenSpec slash command 的参考。这些命令在 AI 编码助手的聊天界面里调用（例如 Claude Code、Cursor、Devin Desktop）。

工作流模式与每条命令何时使用，见 [工作流（Workflows）](workflows.md)。CLI 命令见 [CLI](cli.md)。

这些页面用 `/opsx:<command>` 作为规范名。有些工具的拼法不同 —— Cursor 与 GitHub Copilot 注册的是 `/opsx-propose`，Codex 用 `$openspec-propose` —— 所以查
[如何调用（How To Invoke）](supported-tools.md#how-to-invoke)
看你自己的工具。OpenSpec 生成的文件已经用了正确的形式。

### 40.1 快速参考（Quick Reference）

#### 40.1.1 默认快捷路径（`core` 档）（Default Quick Path (`core` profile)）

| 命令 | 用途 |
|---------|---------|
| `/opsx:propose` | 一步创建 change 并生成规划 artifact |
| `/opsx:explore` | 在决定开一个 change 之前把事情想透 |
| `/opsx:apply` | 实现这个 change 的 task |
| `/opsx:update` | 修订一个 change 的规划 artifact 并保持它们自洽 |
| `/opsx:sync` | 把 delta spec 合并进主 spec |
| `/opsx:archive` | 归档一个已完成的 change |

#### 40.1.2 扩展 workflow 命令（自定义 workflow 选择）（Expanded Workflow Commands (custom workflow selection)）

| 命令 | 用途 |
|---------|---------|
| `/opsx:new` | 起一个 change 脚手架 |
| `/opsx:continue` | 按依赖创建下一个 artifact |
| `/opsx:ff` | Fast-forward：一次创建所有规划 artifact |
| `/opsx:verify` | 校验实现与 artifact 相符 |
| `/opsx:bulk-archive` | 一次归档多个 change |
| `/opsx:onboard` | 走完整个 workflow 的引导式教学 |

默认全局档位是 `core`。要启用扩展 workflow 命令，运行 `openspec config profile`，选择
workflow，然后在你的项目里运行 `openspec update`。

---

### 40.2 命令参考（Command Reference）

#### 40.2.1 `/opsx:propose`

一步创建新 change 并生成规划 artifact。这是 `core` 档里的默认起始命令。

**语法：**
```text
/opsx:propose [change-name-or-description]
```

**参数：**
| 参数 | 必需 | 描述 |
|----------|----------|-------------|
| `change-name-or-description` | 否 | kebab-case 名字，或者用自然语言描述的 change |

**它做什么：**
- 创建 `openspec/changes/<change-name>/`
- 生成实现之前需要的 artifact（对 `spec-driven` 而言：proposal、specs、design、tasks）
- 当这个 change 已就绪、可以交给 `/opsx:apply` 时停下

**示例：**
```text
You: /opsx:propose add-dark-mode

AI:  Created openspec/changes/add-dark-mode/
     ✓ proposal.md
     ✓ specs/ui/spec.md
     ✓ design.md
     ✓ tasks.md
     Ready for implementation. Run /opsx:apply.
```

**提示：**
- 想要最快的端到端路径就用它
- 想要逐步控制 artifact，就启用扩展 workflow 并用 `/opsx:new` + `/opsx:continue`

---

#### 40.2.2 `/opsx:explore`

> **不确定时从这里开始。** Explore 是一个无成本的思考伙伴：它读你的代码库、比较各种选项，在你写任何代码之前把一团模糊的想法打磨成具体的计划。它随默认档位一起发布。完整的论证与更多示例见 [先探索（Explore First）](explore.md) 指南。

在决定开一个 change 之前，把事情想透、调查问题、澄清需求。

**语法：**
```
/opsx:explore [topic]
```

**参数：**
| 参数 | 必需 | 描述 |
|----------|----------|-------------|
| `topic` | 否 | 你想探索或调查的内容 |

**它做什么：**
- 开一段无需任何结构的探索性对话
- 调查代码库来回答问题
- 比较各种选项与做法
- 画可视化的图来理清思路
- 在你要求时、或者它提议而你说好时捕获这次探索：用 `openspec new change` 搭一个 change 脚手架，并写入你点名的那些规划 artifact，或者更新一个已有 change 的 artifact
- 当洞见成形时，可以转到 `/opsx:propose`（默认）或 `/opsx:new`（扩展 workflow）

**示例：**
```text
You: /opsx:explore

AI:  What would you like to explore?

You: How should we handle authentication for the mobile app?

AI:  Let me investigate your current auth setup...
     [Analyzes codebase]

     I see you're using session-based auth for the web app.
     For mobile, we have three main options:

     1. JWT tokens (stateless, works offline)
     2. OAuth2 (if you need third-party login)
     3. Extend current sessions (simpler, but requires connectivity)

     Your API already has CORS configured. Which direction interests you?

You: Let's go with JWT.

AI:  That's a decision worth keeping. Want me to start a change called
     add-jwt-auth? Just the change folder, nothing else yet.

You: Yes.

AI:  Started openspec/changes/add-jwt-auth/. Say the word and I'll
     write the proposal, specs, and tasks from what we just worked out.
```

**提示：**
- 需求不清楚、或者你需要调查时用它
- 它**从不**写代码；除非你要求、或者它提议而你说好，否则不写任何其它东西
- 适合在决定之前比较多种做法
- 可以读文件、搜索代码库

---

#### 40.2.3 `/opsx:new`

起一个新的 change 脚手架。创建 change 目录，然后等你用 `/opsx:continue` 或 `/opsx:ff`
生成 artifact。

这条命令属于扩展 workflow 集合（不在默认的 `core` 档里）。

**语法：**
```
/opsx:new [change-name] [--schema <schema-name>]
```

**参数：**
| 参数 | 必需 | 描述 |
|----------|----------|-------------|
| `change-name` | 否 | change 目录的名字（未提供时会提示） |
| `--schema` | 否 | 要用的 workflow schema（默认：来自配置，或 `spec-driven`） |

**它做什么：**
- 创建 `openspec/changes/<change-name>/` 目录
- 在 change 目录里创建 `.openspec.yaml` 元数据文件
- 展示第一个已就绪、可以创建的 artifact 模板
- 未提供时提示输入 change 名与 schema

**它创建什么：**
```
openspec/changes/<change-name>/
└── .openspec.yaml    # Change metadata (schema, created date)
```

**示例：**
```
You: /opsx:new add-dark-mode

AI:  Created openspec/changes/add-dark-mode/
     Schema: spec-driven

     Ready to create: proposal
     Use /opsx:continue to create it, or /opsx:ff to create all artifacts.
```

**提示：**
- 用描述性的名字：`add-feature`、`fix-bug`、`refactor-module`
- 避免 `update`、`changes`、`wip` 这类泛泛之名
- schema 也可以在项目配置（`openspec/config.yaml`）里设置

---

#### 40.2.4 `/opsx:continue`

创建依赖链上的下一个 artifact。一次创建一个 artifact，逐步推进。

**语法：**
```
/opsx:continue [change-name]
```

**参数：**
| 参数 | 必需 | 描述 |
|----------|----------|-------------|
| `change-name` | 否 | 要继续哪个 change（未提供时从上下文推断） |

**它做什么：**
- 查询 artifact 依赖图
- 展示哪些 artifact 已就绪、哪些被阻塞
- 创建第一个就绪的 artifact
- 读取依赖文件作为上下文
- 展示创建之后什么变得可用

**示例：**
```
You: /opsx:continue

AI:  Change: add-dark-mode

     Artifact status:
     ✓ proposal    (done)
     ◆ specs       (ready)
     ◆ design      (ready)
     ○ tasks       (blocked - needs: specs, design)

     Creating specs...

     [Reads proposal.md, creates specs based on requirements]

     ✓ Created openspec/changes/add-dark-mode/specs/ui/spec.md

     Now available: design
     Run /opsx:continue to create the next artifact.
```

**提示：**
- 想在继续之前逐个评审 artifact 时用它
- 适合需要控制的复杂 change
- 可能有多个 artifact 同时变为就绪
- 继续之前你可以先编辑已创建的 artifact

---

#### 40.2.5 `/opsx:ff`

快进走完 artifact 创建。一次创建所有规划 artifact。

**语法：**
```
/opsx:ff [change-name]
```

**参数：**
| 参数 | 必需 | 描述 |
|----------|----------|-------------|
| `change-name` | 否 | 快进哪个 change（未提供时从上下文推断） |

**它做什么：**
- 按依赖顺序创建所有 artifact
- 通过 todo 列表跟踪进度
- 所有 `apply-required` 的 artifact 都完成时停下
- 创建下一个 artifact 之前先读它的每一个依赖

**示例：**
```
You: /opsx:ff add-dark-mode

AI:  Fast-forwarding add-dark-mode...

     ✓ Creating proposal.md
     ✓ Creating specs/ui/spec.md
     ✓ Creating design.md
     ✓ Creating tasks.md

     All planning artifacts complete!
     Ready for implementation. Run /opsx:apply to begin.
```

**提示：**
- 你对要建什么已经有清晰图景时用它
- 对直白的 change 来说比 `/opsx:continue` 更快
- 之后你仍然可以编辑 artifact
- 适合中小型功能

---

#### 40.2.6 `/opsx:apply`

实现这个 change 的 task。逐条走完任务列表，写代码并勾掉条目。

**语法：**
```
/opsx:apply [change-name]
```

**参数：**
| 参数 | 必需 | 描述 |
|----------|----------|-------------|
| `change-name` | 否 | 要实现哪个 change（未提供时从上下文推断） |

**它做什么：**
- 读 `tasks.md` 并找出未完成的任务
- 逐条走完任务
- 按需写代码、创建文件、跑测试
- 用 checkbox `[x]` 标记任务完成

**示例：**
```
You: /opsx:apply

AI:  Implementing add-dark-mode...

     Reading tasks.md:
     - [ ] 1.1 Create ThemeContext
     - [ ] 1.2 Add CSS custom properties
     - [ ] 1.3 Implement localStorage persistence

     Working on 1.1: Create ThemeContext...
     [Creates src/context/ThemeContext.tsx]

     ✓ 1.1 Complete

     Working on 1.2: Add CSS custom properties...
     [Updates src/styles/globals.css]

     ✓ 1.2 Complete
     ...
```

**提示：**
- 被打断后可以从上次停下的地方继续
- 指定 change 名即可用于并行的多个 change
- 完成状态记录在 `tasks.md` 的 checkbox 里

---

#### 40.2.7 `/opsx:update`

修订一个 change 已有的规划 artifact，并让它们彼此保持自洽。只碰规划 artifact —— 它**从不**编辑代码。

**语法：**

```text
/opsx:update [change-name]
```

**参数：**

| 参数 | 必需 | 描述 |
|----------|----------|-------------|
| `change-name` | 否 | 要更新哪个 change（未提供时从上下文推断） |

**它做什么：**

- 通过 `openspec status --change <name> --json` 读取这个 change 的 artifact
- 应用你要求的修订；如果你没点名，就检查 artifact 之间有无矛盾
- 按任意方向对其它已有 artifact 做调和（改 design 可能回推到 proposal）
- 每次写入之前都与你确认，一次一个 artifact
- 最后给出下一步建议：`/opsx:continue`（尚未开始的 artifact）、`/opsx:apply`（把修订后的计划带进代码），或 `/opsx:archive`（全部完成）

**缺失的文件：**

- 对一个像 `specs/**/*.md` 这样的 glob artifact，如果已有至少一个文件，update 可以提议补一个缺失的同伴文件。它使用 schema 的指令，并在创建之前请你确认具体路径。
- 一个文件都还没有的 artifact 留给 `/opsx:continue`。被有意跳过的 artifact 保持不动。
- 新文件必须留在 change 目录之内。如果在创建之前那个已确认的路径上出现了文件，update 会停下而不是覆盖它。

**示例：**

```text
You: /opsx:update add-dark-mode - we're storing the theme in a cookie now, not localStorage

AI:  Reading add-dark-mode artifacts...

     The design references localStorage in two places; tasks 1.3 covers
     localStorage persistence; the proposal doesn't mention storage.

     Proposed revisions:
     1. design.md - swap localStorage decision for cookie storage
     2. tasks.md - reword task 1.3 to cookie persistence

     Apply revision 1? (design.md)
```

**提示：**

- 它不会去启动一个当前没有任何文件的 artifact。为此启用 `/opsx:continue`，或者在那个可选 workflow 没安装时用 `openspec status` 与 `openspec instructions`。
- 如果这个 change 已经实现过了，接着跑一次 `/opsx:apply`，让代码与修订后的计划相符
- 如果你的修订改变了这个 change 的**意图**，不如另起一个新 change（见 [何时更新 vs 另起（When to Update vs. Start Fresh）](opsx.md#when-to-update-vs-start-fresh)）

---

#### 40.2.8 `/opsx:verify`

校验实现与你的 change artifact 相符。检查完备性、正确性与一致性。

**语法：**
```
/opsx:verify [change-name]
```

**参数：**
| 参数 | 必需 | 描述 |
|----------|----------|-------------|
| `change-name` | 否 | 要校验哪个 change（未提供时从上下文推断） |

**它做什么：**
- 检查实现质量的三个维度
- 在代码库里搜索实现证据
- 报告归入 CRITICAL、WARNING 或 SUGGESTION 的问题
- 不阻塞 archive，但把问题摊出来

**校验维度：**

| 维度 | 它校验什么 |
|-----------|-------------------|
| **完备性（Completeness）** | 所有 task 完成、所有 requirement 被实现、scenario 有覆盖 |
| **正确性（Correctness）** | 实现与 spec 意图相符、边界情况有处理 |
| **一致性（Coherence）** | 设计决策反映在代码里、模式一致 |

**示例：**
```
You: /opsx:verify

AI:  Verifying add-dark-mode...

     COMPLETENESS
     ✓ All 8 tasks in tasks.md are checked
     ✓ All requirements in specs have corresponding code
     ⚠ Scenario "System preference detection" has no test coverage

     CORRECTNESS
     ✓ Implementation matches spec intent
     ✓ Edge cases from scenarios are handled
     ✓ Error states match spec definitions

     COHERENCE
     ✓ Design decisions reflected in code structure
     ✓ Naming conventions consistent with design.md
     ⚠ Design mentions "CSS variables" but implementation uses Tailwind classes

     SUMMARY
     ─────────────────────────────
     Critical issues: 0
     Warnings: 2
     Ready to archive: Yes (with warnings)

     Recommendations:
     1. Add test for system preference detection
     2. Update design.md to reflect Tailwind usage, or refactor to use CSS variables
```

**提示：**
- 归档之前跑一次，早点抓住不一致
- 警告不阻塞 archive，但表明可能有潜在问题
- 适合在提交之前评审 AI 的成果
- 能揭示 artifact 与实现之间的漂移

---

#### 40.2.9 `/opsx:sync`

**可选命令。** 把一个 change 的 delta spec 合并进主 spec。需要时 archive 会提示同步，所以通常你不必手动运行它。

**语法：**
```
/opsx:sync [change-name]
```

**参数：**
| 参数 | 必需 | 描述 |
|----------|----------|-------------|
| `change-name` | 否 | 要同步哪个 change（未提供时从上下文推断） |

**它做什么：**
- 从 change 目录读取 delta spec
- 解析 ADDED/MODIFIED/REMOVED/RENAMED 段
- 把改动合并进主 `openspec/specs/` 目录
- 保留 delta 未提及的既有内容
- 不归档这个 change（它仍然活跃）

**示例：**
```text
You: /opsx:sync

AI:  Syncing add-dark-mode delta specs...

     Reading: openspec/changes/add-dark-mode/specs/ui/spec.md
     Target:  openspec/specs/ui/spec.md

     Changes to apply:
     ✓ ADDED: Theme Selection requirement (2 scenarios)
     ✓ ADDED: Accessibility requirement (1 scenario)

     Merging...
     ✓ openspec/specs/ui/spec.md updated

     Change remains active. Run /opsx:archive when ready to complete.
```

**何时手动使用：**

| 情形 | 用 sync 吗？ |
|----------|-----------|
| 长寿的 change，希望在归档之前就让 spec 进主目录 | 是 |
| 多个并行 change 需要更新后的基础 spec | 是 |
| 想单独预览/评审这次合并 | 是 |
| 快速 change，直接去归档 | 否（archive 会处理） |

**提示：**
- Sync 是智能的，不是复制粘贴
- 可以往已有 requirement 里加 scenario 而不重复
- 同步之后 change 仍然活跃（未被归档）
- 大多数用户永远不需要直接调用它 —— 需要时 archive 会提示

---

#### 40.2.10 `/opsx:archive`

归档一个已完成的 change。给它收尾并移进归档目录。

**语法：**
```
/opsx:archive [change-name]
```

**参数：**
| 参数 | 必需 | 描述 |
|----------|----------|-------------|
| `change-name` | 否 | 要归档哪个 change（未提供时从上下文推断） |

**它做什么：**
- 检查 artifact 完成状态
- 检查 task 完成度（未完成时警告）
- 在尚未同步时提议同步 delta spec
- 把 change 目录移到 `openspec/changes/archive/YYYY-MM-DD-<name>/`
- 保留所有 artifact 作为审计线索

**示例：**
```text
You: /opsx:archive

AI:  Archiving add-dark-mode...

     Artifact status:
     ✓ proposal.md exists
     ✓ specs/ exists
     ✓ design.md exists
     ✓ tasks.md exists (8/8 tasks complete)

     Delta specs: Not yet synced
     → Sync now? (recommended)

You: Yes

AI:  ✓ Synced specs to openspec/specs/ui/spec.md
     ✓ Moved to openspec/changes/archive/2025-01-24-add-dark-mode/

     Change archived successfully.
```

**提示：**
- Archive 不会因 task 未完成而阻塞，但会警告
- Delta spec 可以在归档期间同步，也可以提前同步
- 已归档的 change 为历史保留
- 先用 `/opsx:verify` 抓问题

---

#### 40.2.11 `/opsx:bulk-archive`

一次归档多个已完成的 change。处理 change 之间的 spec 冲突。

**语法：**
```
/opsx:bulk-archive [change-names...]
```

**参数：**
| 参数 | 必需 | 描述 |
|----------|----------|-------------|
| `change-names` | 否 | 指定要归档的 change（未提供时会提示选择） |

**它做什么：**
- 列出所有已完成的 change
- 归档之前逐个校验
- 检测跨 change 的 spec 冲突
- 通过检查代码里实际实现了什么来解决冲突
- 按时间顺序归档

**示例：**
```
You: /opsx:bulk-archive

AI:  Found 3 completed changes:
     - add-dark-mode (8/8 tasks complete)
     - fix-login-bug (3/3 tasks complete)
     - update-footer (2/2 tasks complete)

     Checking for spec conflicts...
     ⚠ add-dark-mode and update-footer both touch specs/ui/

     Inspecting codebase to resolve...
     Both changes are implemented. Will merge in chronological order:
     1. add-dark-mode (created Jan 20)
     2. update-footer (created Jan 22)

     Archive all 3 changes?

You: Yes

AI:  ✓ Archived add-dark-mode
     ✓ Archived fix-login-bug
     ✓ Archived update-footer
     Specs merged: add-dark-mode → update-footer
```

**提示：**
- 适合并行的工作流
- 冲突解决是 agentic 的（检查代码库）
- Change 按创建顺序归档
- 覆盖 spec 内容之前会提示

---

#### 40.2.12 `/opsx:onboard`

走完整个 OpenSpec workflow 的引导式上手。一个使用你真实代码库的交互式教学。

**语法：**
```
/opsx:onboard
```

**它做什么：**
- 带旁白走完一个完整的 workflow 周期
- 扫描你的代码库寻找真实的改进机会
- 创建一个真实的 change 与真实 artifact
- 实现真实的工作（小而安全的改动）
- 归档已完成的 change
- 每一步都随做随讲

**阶段：**
1. 欢迎与代码库分析
2. 找一个改进机会
3. 创建 change（`/opsx:new`）
4. 写 proposal
5. 创建 specs
6. 写 design
7. 创建 tasks
8. 实现 task（`/opsx:apply`）
9. 校验实现
10. 归档 change
11. 总结与下一步

**示例：**
```
You: /opsx:onboard

AI:  Welcome to OpenSpec!

     I'll walk you through the complete workflow using your actual codebase.
     We'll find something small to improve, create a proper change for it,
     implement it, and archive it.

     Let me scan your codebase for opportunities...

     [Analyzes codebase]

     I found a few things we could work on:
     1. Add input validation to the contact form
     2. Improve error messages in the auth flow
     3. Add loading states to async buttons

     Which interests you? (or suggest something else)
```

**提示：**
- 最适合正在学这条 workflow 的新用户
- 用真实代码，不是玩具示例
- 创建一个你可以留下也可以丢弃的真实 change
- 走完需要 15–30 分钟

### 40.3 下一步（Next Steps）

- [工作流（Workflows）](workflows.md) - 常见模式，以及每条命令何时使用
- [CLI](cli.md) - 用于管理和校验的终端命令
- [自定义（Customization）](customization.md) - 创建自定义 schema 与工作流
