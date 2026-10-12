## 42 explorations —— 「探索阶段该落什么盘」的实物样本

> 译自 `reference/openspec/openspec/explorations/` 全部 5 个文件：`explore-workflow-ux.md`（5.0 KB）、`workspace-architecture.md`（33.2 KB）、`workspace-roadmap.md`（10.1 KB）、`workspace-user-journeys.md`（53.8 KB）、`workspace-ux-simplification.md`（12.1 KB）。按 `READING-openspec.md` 第 42 项。
> 压缩说明：唯一压缩处是 `workspace-user-journeys.md`（42.4）的 `## Edge Cases` 一节 —— 那 14 条原本是同一形状（条目名 + Example + Expected behavior），下面压成保留每条名字与各自要点的紧凑摘要。除此之外，五个文件的所有标题、论证与代码块（目录树 / ASCII 图 / YAML / bash / text 围栏）全部按原文逐处译出，围栏内容逐字节保留。
> 层级约定：为容纳 `### 42.N`，源文件的 `##` / `###` / `####` 标题依次映射到译文里的 `####` / `#####` / `######`，标题一律是「中文译法（English 原文）」。

### 42.1 explore-workflow-ux.md —— 探索工作流的 UX

源文件标题：`# Explore Workflow UX`

#### 背景（Context）

explore 工作流是核心循环的一部分（`propose`、`explore`、`apply`、`archive`）。用户应当能在 explore 模式里把想法想透，然后顺畅地过渡到一份正式的 change proposal。

目前 explore 引用的是 `/opsx:new` 与 `/opsx:ff`，而它们正在被 `/opsx:propose` 取代。但除了更新引用之外，关于 explore 应当如何工作，还有更深的 UX 问题。

这次探索还受到那个正在成形的工作区方向的影响：对于更大的跨团队或跨仓工作，OpenSpec 可能需要把 **initiative** 当作一等的规划对象，而把仓本地的 change 当作执行产物。这意味着 explore 有时可能在播种一个 initiative，而不只是一个 change。

#### 待解问题（Open Questions）

##### 探索产物（Exploration Artifacts）

1. **探索应当能导出成 .md 吗？**
   - 目前探索是短暂的（只是对话）
   - 保存探索笔记对用户会有帮助吗？

2. **探索文件应当住在哪里？**
   - `openspec/explorations/<name>.md`？
   - `openspec/changes/<change>/explorations/`？
   - 对于需要协调的工作，`.openspec-workspace/initiatives/<initiative>/explorations/`？
   - 还是别的地方？

3. **格式应当是什么？**
   - 自由形式的 markdown？
   - 结构化模板（problem、insights、open questions）？
   - 对话记录？

##### 多次探索（Multiple Explorations）

4. **一个用户可以拥有与同一个 change 相关的多次探索吗？**
   - 比如把认证方案的探索与 UI 方案的探索分开做
   - 它们彼此之间该如何关联？

5. **探索如何与 change 或 initiative 关联？**
   - change 存在之前：独立的探索
   - 仓本地 change 存在之后：探索链接到该 change？
   - 对需要协调的工作：探索先链接到 initiative，然后可选地被各仓本地 change 引用？

##### 生命周期与过渡（Lifecycle & Transitions）

6. **change proposal 存在之前会发生什么？**
   - 探索是独立的
   - 准备好之后，用户跑 `/opsx:propose`
   - 对于需要协调的工作，探索的上下文是否应当先播种一个 initiative？
   - 探索的上下文是否应当自动播种 proposal？

7. **change proposal 存在之后会发生什么？**
   - 探索可以引用已存在的 artifact
   - 探索应当能直接更新 artifact 吗？
   - 还是只告诉用户该更新什么？

8. **explore → propose 的过渡怎么工作？**
   - 手动：用户自己复制洞见，再单独跑 propose
   - 半自动：explore 提供「要从这次探索创建 proposal 吗？」
   - 自动：explore 察觉到想法已经结晶，主动启动 propose

##### 上下文交接（Context Handoff）

9. **探索得到的洞见如何流进 proposal？**
   - 用户手工吸收洞见
   - 探索摘要成为 propose 提示词的输入
   - 探索文件被 proposal 链接/引用

10. **propose 应当能读探索文件吗？**
    - 「我看到你探索过认证方案。沿用那些洞见……」

#### 可能的方向（Potential Approaches）

##### 方向 A：短暂的探索（现状+）（Approach A: Ephemeral Explorations (Status Quo+)）
- 探索仍然只存在于对话里
- 只把引用更新成 `/opsx:propose`
- 用户手工把洞见带下去
- **优点（Pro）：** 简单，不新增 artifact
- **缺点（Con）：** 洞见可能丢失，没有审计轨迹

##### 方向 B：可选导出（Approach B: Optional Export）
- 在结尾加一个「保存探索」选项
- 保存到 `openspec/explorations/<name>.md`
- propose 可以可选地读它们作为上下文
- **优点（Pro）：** 复杂度是自选的，洞见得以保留
- **缺点（Con）：** 又多了一种要管理的 artifact 类型

##### 方向 C：探索作为 proposal 的种子（Approach C: Exploration as Proposal Seed）
- 探索自动保存结构化的笔记
- 过渡到 propose 时，笔记成为 proposal 的输入
- **优点（Pro）：** 交接无缝，上下文被保留
- **缺点（Con）：** 更复杂，耦合更紧

##### 方向 D：change 内部的探索（Approach D: Explorations Within Changes）
- change 之前：独立的探索
- change 创建之后：探索笔记住在 `changes/<name>/explorations/`
- artifact 可以引用探索笔记
- **优点（Pro）：** 与 change 的关系清晰
- **缺点（Con）：** change 之前的探索放哪儿？

##### 方向 E：面向协调工作的、initiative 优先的探索（Approach E: Initiative-First Explorations for Coordinated Work）
- 本地工作可以保持独立，也可以链接到 change
- 需要协调的工作把探索笔记存在协调工作区里某个 initiative 之下
- 执行开始时，各仓本地的 change 可以引用那份共享探索
- **优点（Pro）：** 契合正在成形的「共享规划 / 仓本地执行」二分
- **缺点（Con）：** 又多了一个可能存放探索产物的上下文

#### 下一步（Next Steps）

- [ ] 用户研究：今天人们实际怎么用 explore？
- [ ] 原型：试试保存探索，看 propose 是否因此受益
- [ ] 决策：根据发现挑一个方向
- [ ] 让 explore 的 UX 与 initiative 优先的协调规划对齐
- [ ] 实现：据此更新 explore 工作流

#### 相关（Related）

- `openspec/changes/simplify-skill-installation/` —— 当前正在更新核心工作流的 change
- `src/core/templates/workflows/explore.ts` —— explore 工作流模板

### 42.2 workspace-architecture.md —— 工作区探索

源文件标题：`# Workspace Exploration`

#### 背景（Context）

在简化技能安装的过程中，我们发现了关于 profile、config 与 workspace 应当如何协同工作的更深层问题。本文记录了我们决定了什么、还有什么悬着、以及什么需要调研。

**更新（Update）：** 最初的探索显示，「workspace」主要并不是关于 config 分层的 —— 它关乎一个更根本的问题：**当工作横跨多个模块或仓库时，spec 与 change 住在哪里？**

---

#### 第 1 部分：Profile 与 Config（Part 1: Profile & Config (Original Scope)）

##### 我们决定了什么（What We've Decided）

###### Profile 的 UX（简化后）（Profile UX (Simplified)）

**改之前（最初的提案）（Before (original proposal)）：**
```
openspec profile set core|extended
openspec profile install <workflow>
openspec profile uninstall <workflow>
openspec profile list
openspec profile show
openspec config set delivery skills|commands|both
openspec config get delivery
openspec config list
```
8 个子命令，两个概念（profile + config）

**改之后（简化后）（After (simplified)）：**
```
openspec config profile          # interactive picker (delivery + workflows)
openspec config profile core     # preset shortcut
openspec config profile extended # preset shortcut
```
1 个带预设的命令，一个概念

###### 交互式选择器（Interactive Picker）

```
$ openspec config profile

Delivery: [skills] [commands] [both]
                              ^^^^^^

Workflows: (space to toggle, enter to save)
[x] propose
[x] explore
[x] apply
[x] archive
[ ] new
[ ] ff
[ ] continue
[ ] verify
[ ] sync
[ ] bulk-archive
[ ] onboard
```

一个地方同时配置投递方式与工作流选择。

###### 为什么叫「Profile」而不是「Workflows」（Why "Profile" (Not "Workflows")）

把 profile 当作一个抽象层，为未来的扩展留出了空间：
- 方法学打包（spec-driven、test-driven）
- 用户自建的 profile
- 可分享的 profile
- 面向不同方法论的不同技能/命令集合

##### Config 分层调研（Config Layering Research）

我们调研了同类工具如何处理 config 分层：

| 工具 | 模型 | 关键模式 |
|------|-------|-------------|
| **VSCode** | User → Workspace → Folder | 对象合并，原始值覆盖。Workspace = 提交进仓库的 `.vscode/` |
| **ESLint (flat)** | 单一根配置 | *刻意取消了级联* —— 「复杂度呈指数爆炸」 |
| **Turborepo** | 根 + 包 extends | 每个包一个 `turbo.json`，用 `extends: ["//"]` 做覆盖 |
| **Nx** | Integrated vs Package-based | 两种模式 —— 共享根 OR 每包独立。从 integrated 迁移很难。 |
| **pnpm** | workspace 文件定义包的集合 | `pnpm-workspace.yaml` 放在包集合的根。依赖可以共享，也可以每包独立 |
| **Claude Code** | Global + Project | 全局用 `~/.claude/`，每项目用 `.claude/`。不追踪 workspace。 |
| **Kiro** | 按根分发 | 每个文件夹有自己的 `.kiro/`。聚合展示，无继承。 |

**ESLint 给出的关键洞见：** ESLint 团队在 flat config 里明确移除了级联，因为级联是一场复杂度噩梦。他们的新模型：根上一份配置，用 glob 模式去定位子目录。

**对 profile/config 的建议：** 两层就够了。
- **全局（Global）** = 用户的默认值（`~/.config/openspec/`）
- **项目（Project）** = 仓库级配置（`.openspec/`，或提交进仓库）

config 不需要「workspace」层。这与 Claude Code 的模型一致。

##### config 上的决定（本次 change 适用）（Config Decision (For This Change)）

保持简单：
1. 全局 profile 作为 `openspec init` 的默认值
2. `openspec init` 把当前 profile 应用到项目上
3. 暂不做 workspace 追踪
4. 不对已有项目做自动同步

这是显式的，也不妨碍未来的功能。

---

#### 第 2 部分：更深的问题（spec 与 change 的组织）（Part 2: The Deeper Problem (Spec & Change Organization)）

##### 真正的问题（The Real Question）

workspace 这个问题不是关于 config 的 —— 它是关于 **spec 与 change 住在哪里**，当：

1. **Monorepo**：一份 spec 或一个 change 可能横跨多个 package/app
2. **Multi-repo**：一个 change 可能完全横跨多个仓库
3. **跨职能工作**：一个功能影响多个团队（backend、web、iOS、Android）

##### OpenSpec 当前的架构（Current OpenSpec Architecture）

OpenSpec 目前假定：
- 每个仓库一个 `openspec/`，永远在根上
- CLI 不向上遍历目录 —— 它期望你就在根上
- change 可以碰任何 spec（没有作用域划分）
- 单一 config 适用于一切
- 一个项目内部没有「scope」或「boundary」的概念

```
openspec/
├── specs/
│   ├── auth/spec.md           # Domain-organized specs
│   ├── payments/spec.md
│   └── checkout/spec.md
├── changes/
│   └── add-oauth/
│       ├── proposal.md
│       ├── design.md
│       ├── tasks.md
│       └── specs/             # Delta specs (can touch multiple)
│           ├── auth/spec.md
│           └── checkout/spec.md
└── config.yaml
```

**这对单项目仓库很管用。** 但下面这些呢：
- 有 50+ 个 package 的大型 monorepo？
- 由多仓组成的微服务？
- 横跨多个团队的跨职能功能？

##### Checkout/支付这个例子（The Checkout/Payment Example）

设想一个支付系统，其中有：
- **后端结算团队（Backend billing team）**：拥有支付处理
- **Web 团队（Web team）**：拥有 web 结账的 UX
- **iOS 团队（iOS team）**：拥有 iOS 结账的 UX
- **Android 团队（Android team）**：拥有 Android 结账的 UX
- **横切的部分（Cross-cutting）**：所有客户端都必须遵守的那份支付*契约*

**问题：**
- 那份共享支付契约的 spec 住在哪里？
- 各平台特有的结账 spec 住在哪里？
- 如果 iOS 的 spec「extends」了那份共享契约，这要如何表达？
- 契约变化时，下游 spec 如何被更新？
- 谁拥有什么？

##### 核心张力（The Core Tension）

```
                    SCOPE
                      │
         Narrow       │       Broad
    (team/module)     │    (cross-cutting)
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
    │  "Our team's    │   "Shared       │
    │   checkout      │    checkout     │
    │   behavior"     │    contract"    │
    │                 │                 │
────┼─────────────────┼─────────────────┼──── OWNERSHIP
    │                 │                 │
    │  Easy:          │   Hard:         │
    │  One team,      │   Multiple      │
    │  one spec       │   stakeholders  │
    │                 │                 │
    └─────────────────┴─────────────────┘
```

---

#### 第 3 部分：别的领域怎么解决这个问题（Part 3: How Other Domains Solve This）

##### 调研中看到的模式（Patterns from Research）

| 领域 | 共享的部分 | 特有的部分 | 它们如何连接 |
|--------|-------------|----------------|------------------|
| **Protobuf** | 根上的 `common/` | 每个服务自己的 `domain/service/` | 从 common 导入 |
| **设计系统（Design Systems）** | design token、组件名、API | 各平台实现 | 「同样的属性，不同的渲染」 |
| **DDD** | Shared Kernel | Bounded Context | context mapping 定义关系 |
| **RFC** | 横切 RFC | 团队范围内的 RFC | 不同的评审流程 |
| **OpenAPI** | 基础 schema | 各服务的 spec | 用 `$ref` 指向共享定义 |

##### Protobuf 的 monorepo 模式（Protobuf Monorepo Pattern）

```
proto/
├── common/              # Shared, low-churn types
│   └── money.proto
│   └── address.proto
├── billing/             # Domain-specific
│   └── service.proto
└── checkout/
    └── service.proto    # Imports from common/
```

**关键洞见：**「大多数工程组织都应当把他们的 proto 文件放在一个仓库里。心智开销因此保持恒定，而不是随组织规模增长。」

##### 设计系统的模式（Booking.com、Uber）（Design Systems Pattern (Booking.com, Uber)）

> 「组件在 iOS 与 Android 之间可以看起来相当不同，因为它们使用各自原生的应用设计标准，但它们仍然共享代码里**完全相同的属性**。这正是属性如此强大的原因 —— 它是每个组件的**唯一真值来源**。」

**关键洞见：** 共享 spec 定义的是*契约*（属性、行为）。各平台的 spec 定义的是*实现细节*（在那个平台上它长什么样、怎么工作）。

##### DDD 的 Bounded Context（DDD Bounded Contexts）

> 「一个 context，一个团队。清晰的归属避免沟通失误。」

**关键洞见：** spec 应当有清晰的归属。横切关注点使用「Shared Kernel」模式 —— 显式共享的代码/spec，改动它们需要协调。

---

#### 第 4 部分：OpenSpec 的几种模型（Part 4: Three Models for OpenSpec）

##### 模型 A：扁平根（现状）（Model A: Flat Root (Current)）

```
openspec/
├── specs/
│   ├── checkout-contract/    # Shared contract
│   ├── checkout-web/         # Web-specific
│   ├── checkout-ios/         # iOS-specific
│   ├── checkout-android/     # Android-specific
│   ├── billing/              # Backend
│   └── ... (50+ specs at root level)
└── changes/
```

**优点（Pros）：**
- 心智模型简单
- 所有 spec 都在一个地方
- 没有嵌套带来的复杂度

**缺点（Cons）：**
- 规模化后变得笨重（50+ 个目录）
- 没有清晰的归属信号
- 很难看出哪些 spec 彼此相关
- 命名约定变得至关重要（`checkout-*`）

##### 模型 B：嵌套 spec（领域 → 平台）（Model B: Nested Specs (Domain → Platform)）

```
openspec/
├── specs/
│   ├── checkout/
│   │   ├── spec.md              # Shared contract (the "interface")
│   │   ├── web/spec.md          # Web implementation spec
│   │   ├── ios/spec.md          # iOS implementation spec
│   │   └── android/spec.md      # Android implementation spec
│   └── billing/
│       └── spec.md
└── changes/
```

**优点（Pros）：**
- 层级清晰（共享的在顶上，特有的嵌在里面）
- 相关的 spec 放在一起
- 视觉上更能扩展
- 归属可以跟随结构

**缺点（Cons）：**
- spec 引用更复杂（`checkout/web` vs `checkout`）
- 需要定义继承/扩展的语义
- iOS 的 spec 到底是「extends」基础 spec，还是只是引用它？

**待解问题（Open question）：**「extends」是什么意思？
```yaml
# checkout/ios/spec.md
extends: ../spec.md   # Inherits all requirements?
requirements:
  - System SHALL support Apple Pay  # Adds to base?
```

##### 模型 C：分发式 spec（贴近代码）（Model C: Distributed Specs (Near the Code)）

```
monorepo/
├── services/
│   └── billing/
│       └── openspec/specs/billing/spec.md
├── clients/
│   ├── web/
│   │   └── openspec/specs/checkout/spec.md
│   ├── ios/
│   │   └── openspec/specs/checkout/spec.md
│   └── android/
│       └── openspec/specs/checkout/spec.md
└── openspec/           # Root-level for cross-cutting
    ├── specs/
    │   └── checkout-contract/spec.md   # Shared contract
    └── changes/        # Where do cross-cutting changes live?
```

**优点（Pros）：**
- spec 住在它所描述的代码附近
- 团队自然地拥有自己的 spec
- 对多仓也管用（每个仓库有自己的 `openspec/`）

**缺点（Cons）：**
- 横切的 spec 很尴尬（它们放哪儿？）
- 横跨多个 `openspec/` 目录的 change = ？？？
- 需要一个「workspace」概念来做聚合
- 有多个 `openspec/` root 要管理

##### 模型 D：混合（每个项目内部用模型 B + 跨项目用模型 C）（Model D: Hybrid (Model B Inside Each Project + Model C Across Projects)）

每个项目用一个 `openspec/` root，但允许在那个 root 内部嵌套 spec，以实现清晰的归属与共享契约。
对于多仓工作，用一个 workspace manifest 来协调多个项目，而不复制权威 spec。

**Monorepo 形态（单项目、嵌套 spec）：**
```
repo/
└── openspec/
    ├── specs/
    │   ├── contracts/
    │   │   └── checkout/spec.md
    │   ├── billing/
    │   │   └── spec.md
    │   └── checkout/
    │       ├── web/spec.md
    │       ├── ios/spec.md
    │       └── android/spec.md
    └── changes/
        └── add-3ds/
            ├── proposal.md
            ├── design.md
            ├── tasks.md
            └── specs/
                ├── contracts/checkout/spec.md
                ├── billing/spec.md
                ├── checkout/web/spec.md
                ├── checkout/ios/spec.md
                └── checkout/android/spec.md
```

**多仓形态（多个项目 + workspace 编排）：**
```
~/work/
├── contracts/
│   └── openspec/
│       ├── specs/checkout/spec.md
│       └── changes/add-3ds-contract/
├── billing-service/
│   └── openspec/
│       ├── specs/billing/spec.md
│       └── changes/add-3ds-billing/
├── web-client/
│   └── openspec/
│       ├── specs/checkout/spec.md
│       └── changes/add-3ds-web/
├── ios-client/
│   └── openspec/
│       ├── specs/checkout/spec.md
│       └── changes/add-3ds-ios/
└── payments-workspace/
    └── .openspec-workspace/
        ├── workspace.yaml
        └── initiatives/add-3ds/links.yaml
```

`workspace.yaml` 列出项目/root。`links.yaml` 把一个横切 initiative 映射到各项目的 change。
权威 spec 留在各自拥有的仓库里；workspace 数据只是协调用的元数据。

**优点（Pros）：**
- 清晰的归属边界（一个项目拥有自己的 spec 与 change）
- 共享契约可以有一个专门的归属仓库（作为真值来源不重复）
- 用同一个心智模型同时覆盖 monorepo 与 multi-repo
- 避开了继承带来的复杂度（关系可以先从显式引用开始）
- 有从当前模型渐进迁移的路径

**缺点（Cons）：**
- 跨仓协调需要新的 workspace UX
- 跨仓的功能工作会产生多个要管理的 change ID
- 需要为契约归属与 initiative 链接建立约定
- 有些用户可能期望一个全局的「mega change」，而不是链接起来的各项目 change
- 工具必须同时支持主 spec 与 change delta 里的嵌套 spec 路径

---

#### 第 5 部分：多仓的考量（Part 5: Multi-Repo Considerations）

对于多仓设置，模型 C（或者说模型 D 的协调那一半）几乎是被迫的选择：

```
~/work/
├── billing-service/
│   └── openspec/specs/billing/
├── web-client/
│   └── openspec/specs/checkout/
├── ios-client/
│   └── openspec/specs/checkout/
└── contracts/                    # Dedicated repo for shared specs?
    └── openspec/specs/
        └── checkout-contract/
```

##### 多仓的问题（Questions for Multi-Repo）

1. **共享 spec 住在哪里？**
   - 一个专门的「contracts」仓库？
   - 在每个仓库里各复制一份（有漂移风险）？
   - 一个仓库是「真值来源」，其它仓库引用它？

2. **跨仓的 change 住在哪里？**
   - 放在其中一个仓库里？（感觉不对 —— 归属有偏向）
   - 放在一个单独的「workspace」仓库里？
   - 放在 `~/.config/openspec/workspaces/my-platform/changes/`？

3. **变化如何传播？**
   - 改 `checkout-contract` 会影响所有客户端仓库
   - 我们需要显式的依赖追踪吗？
   - 还是说这属于「带外处理」（团队自己手工协调）？

##### 「Workspace」对多仓可能意味着什么（What "Workspace" Might Mean for Multi-Repo）

如果我们加上 workspace 支持，它可以是：

> **一个 workspace 是一组可以一起操作的 OpenSpec root。**

```yaml
# ~/.config/openspec/workspaces.yaml (or similar)
workspaces:
  my-platform:
    roots:
      - ~/work/billing-service
      - ~/work/web-client
      - ~/work/ios-client
      - ~/work/contracts
    shared_context: |
      All services use TypeScript.
      API contracts follow OpenAPI 3.1.
```

这将会使能：
1. **跨仓的 change**：创建一个追踪多个 root 上 delta 的 change
2. **聚合的 spec 视图**：看到 workspace 里的所有 spec
3. **共享上下文**：适用于所有 root 的 context/rules

---

#### 第 6 部分：关键设计问题（Part 6: Key Design Questions）

##### 1. spec 应当是层级化的（带继承）吗？（1. Should specs be hierarchical (with inheritance)?）

**选项 A：不要继承，只要组织**
- 嵌套目录纯粹是组织性的
- 每份 spec 都是独立的
- 关系是隐式的（靠命名）或手工记录的

**选项 B：显式继承**
```yaml
# checkout/ios/spec.md
extends: ../spec.md
requirements:
  - System SHALL support Apple Pay  # Adds to base
```
- 子 spec 继承父 spec 的 requirement
- 可以新增、覆盖或扩展
- 更强大，但也更复杂

**选项 C：只有引用，没有继承**
```yaml
# checkout/ios/spec.md
references:
  - ../spec.md  # "See also" but no inheritance
requirements:
  - System SHALL implement checkout per checkout-contract
  - System SHALL support Apple Pay
```
- 为了文档目的做显式引用
- 没有自动继承
- 语义更简单

##### 2. 「shared kernel」住在哪里？（2. Where does the "shared kernel" live?）

**选项 A：根层级（模型 B）**
- `openspec/specs/checkout/spec.md` 就是 shared kernel
- 各平台的 spec 嵌在它下面

**选项 B：专门的区域**
- `openspec/specs/_shared/checkout-contract/spec.md`
- 或者 `openspec/specs/_contracts/checkout/spec.md`
- 显式的「shared」命名空间

**选项 C：单独的仓库（多仓场景下的模型 C）**
- 一个专门的 `contracts` 或 `specs` 仓库
- 其它仓库引用它

##### 3. 「workspace」与「project」有什么区别？（3. What's a "workspace" vs a "project"?）

如果我们引入 workspace：

| 概念 | 定义 |
|---------|------------|
| **Project** | 单个 OpenSpec root（一个 `openspec/` 目录） |
| **Workspace** | 一组可以一起操作的 project |

一个 workspace 将会使能：
- 跨 project 的聚合 spec 查看
- 跨 project 的 change
- 跨 project 的共享上下文

**问题：** 我们需要显式的 workspace 追踪，还是只要临时的多 root（像 Claude Code 的 `/add-dir`）就够了？

##### 4. OpenSpec 需要理解依赖吗？（4. Does OpenSpec need to understand dependencies?）

如果 `checkout-web` 依赖 `checkout-contract`：
- OpenSpec 应当知道这层关系吗？
- 对 `checkout-contract` 的一次改动应当对下游 spec 发出警告吗？
- 还是说依赖追踪「超出范围」？

**取舍（Trade-off）：**
- 有依赖追踪：更强大，自动的传播警告
- 没有：更简单，依赖由团队自己管理

##### 5. 横切工作的 change 应当怎么工作？（5. How should changes work for cross-cutting work?）

**对 monorepo（模型 B）：**
- 一个 change，`specs/` 里放多个 delta spec
- 今天已经能用了

**对 multi-repo（模型 C）：**
- 选项 A：一个「workspace change」引用多个仓库的 change
- 选项 B：每个仓库里各有一个 change，彼此互相引用
- 选项 C：change 永远住在一个仓库里，引用其它仓库的 spec

---

#### 第 7 部分：「惊艳」会是什么样？（Part 7: What Would "Amazing" Look Like?）

根据调研，团队喜欢：

1. **一个可以看的地方**（Protobuf：「心智开销保持恒定」）
2. **清晰的归属**（DDD：「一个 context，一个团队」）
3. **共享契约 + 本地扩展**（设计系统：「同样的属性，不同的渲染」）
4. **自动的一致性**（设计系统：「design token 作为地基」）
5. **低认知负担**（不该在组织结构上想太多）

##### 可能的北极星（Possible North Stars）

**野心版（Ambitious）：**
> OpenSpec 自动理解你的仓库结构，检测出横切的 spec，并帮你创建流向他处的 change。

**更简版（Simpler）：**
> 你想怎么组织 spec 就怎么组织。OpenSpec 就是能跑。

**务实版（Practical）：**
> 嵌套 spec 用于组织。显式依赖用于横切。没有魔法。

---

#### 第 8 部分：可能的前进路径（Part 8: Possible Paths Forward）

##### 对本次 change（simplify-skill-installation）（For This Change (simplify-skill-installation)）

现在不要去解决 spec 组织的问题。范围保持在：
1. Profile 的 UX 简化
2. `openspec init` 的改进
3. 暂不做 workspace 追踪

##### 未来：spec 组织的 change（Future: Spec Organization Change）

一个单独的 change 去探索并实现：

1. **在模型 A、B、C 或 D（混合）之间做决定**
2. **决定继承语义**（或者不要继承）
3. **更新 spec 解析**以处理嵌套
4. **更新 change delta** 以处理嵌套 spec

##### 未来：多仓 / workspace 的 change（Future: Multi-Repo / Workspace Change）

如果有需要，单独一个 change 来做：

1. **定义 workspace 概念**
2. **实现 workspace 追踪**（或临时的多 root）
3. **跨仓的 change**
4. **跨仓库的共享上下文**

---

#### 第 9 部分：spec 的哲学（行为优先、轻量、与 agent 对齐）（Part 9: Spec Philosophy (Behavior First, Lightweight, Agent-Aligned)）

##### OpenSpec 里的 spec 是什么？（What is a spec in OpenSpec?）

对 OpenSpec 而言，一份 spec 应当被当作**边界处一份可验证的行为契约**：
- 用户、集成方或运维方能够观察到并依赖的东西
- 能用测试、检查或显式评审来验证的东西
- 即便内部实现变了也应当保持稳定的东西

##### spec 里该有什么、不该有什么（What should and should not be in specs）

**应当包含（Include）：**
- 可观察的行为与结果
- 接口/数据契约（输入、输出、错误条件）
- 对外部有意义的非功能约束（隐私、安全、可靠性）
- 下游消费方所依赖的兼容性保证

**应当避免（Avoid）：**
- 内部实现细节（类名、库的选择、控制流）
- 变了也不影响行为的工具机制
- 一步一步的执行计划（那属于 tasks/design）

##### 让严谨程度成比例（以免变成官僚主义）（Keep rigor proportional (to avoid bureaucracy)）

使用渐进式的严谨度：

1. **轻量 spec（大多数 change 的默认）（Lite spec (default for most changes)）**
   - 简短的行为要点、清晰的范围，以及验收检查
2. **完整 spec（只用于高风险或跨边界的工作）（Full spec (only for high-risk or cross-boundary work)）**
   - 针对 API 破坏性变更、迁移、安全/隐私，或跨团队/跨仓的改动，给出更深的契约细节

这让日常使用保持轻量，同时在失败代价昂贵的地方保住清晰度。

##### 人做探索 -> agent 写 spec（Human exploration -> agent-authored specs）

OpenSpec 里的 spec 常常是由人探索、由 agent 撰写的。为了让这件事可靠：

- 人提供意图、约束，以及探索中得来的例子
- agent 把这些转换成简洁、行为优先的 requirement 与 scenario
- agent 把实现细节留在 design/tasks 里，而不是 spec 里
- 校验检查强制结构与可测试性

一句话：人塑造意图；agent 产出稳定、可验证的契约。

##### 这套哲学该住在哪里（Where this philosophy should live）

为了不让它在探索笔记里丢失，把它写进：
1. `docs/concepts.md`，作为面向人的框架叙述
2. `openspec/specs/openspec-conventions/spec.md`，作为规范性的 spec 约定
3. `openspec/specs/docs-agent-instructions/spec.md`，作为 agent 指令的撰写规则

---

#### 第 10 部分：设计决定（2026 年 4 月）（Part 10: Design Decisions (April 2026)）

在拿上面这些模型对照真实的多仓用例评估之后（见 [#725](https://github.com/Fission-AI/OpenSpec/issues/725)），我们收敛到了下面这个设计方向。

##### 核心洞见（Core Insight）

workspace 本身并不是那个耐久的东西。对大型团队而言，耐久的规划对象是 **initiative** 或 **plan**，而仓本地的 spec 与 change 仍然是各仓库拥有的执行产物。一个功能涉及的仓库集合通常是按功能划定的，并且会随时间变化，所以一份必须在工作开始之前配置好的静态 workspace manifest，制造出了与实际团队工作方式不符的仪式。

##### 决定：模型 D + 惰性 workspace（Decision: Model D with Lazy Workspace）

选第 4 部分里的模型 D（混合），但让那份 workspace manifest **可选且惰性，而不是前置条件**。

- **每个仓库保留自己的权威 `openspec/`** —— 基本存储模型不变。
- **跨 root 的工作可以通过协调工作区里的一个 initiative 来协调** —— 当工作不再能干净地按仓库划分时，共享规划就住在这里。
- **「Workspace」是覆盖在已链接仓库与已链接 change 之上的、派生或显式的一份协调视图**，而不是用户必须事先注册的东西。
- **只有当有人明确想要一个可复用的跨仓捆绑时，才持久化一份 workspace manifest** —— 这是一项自选的便利，不是必需。

##### 决定：initiative 优先的规划 + 链接起来的仓本地 change（Decision: Initiative-First Planning with Linked Repo-Local Changes）

对更大的多团队工作而言，以仓库为中心的规划是错误的头等抽象。团队与仓库是同一件工作之上的多对多侧面。OpenSpec 应当把 **initiative / plan** 当作一等的规划对象，然后把仓本地的 change 链接到它上面。

这一点尤其重要，因为今天的 change 捆绑了：

- `proposal.md`
- `design.md`
- `tasks.md`
- delta spec
- `.openspec.yaml`

这种捆绑形态对仓本地工作很管用，但当一件工作横跨多个仓库或团队时就变得别扭。那些情况下，一个单独的仓本地 change 在试图同时扮演：

- 共享规划对象
- 仓库特有的执行产物

这两者应当被拆开。

更受偏好的模型是：

```text
coordination workspace /
  .openspec-workspace/
    workspace.yaml
    initiatives/
      add-3ds/
        initiative.yaml
        proposal.md
        design.md
        links.yaml

repo-A/
  openspec/
    changes/
      add-3ds-api/
        .openspec.yaml
        tasks.md
        specs/

repo-B/
  openspec/
    changes/
      add-3ds-web/
        .openspec.yaml
        tasks.md
        specs/
```

initiative 持有共享规划层：

- proposal / 意图
- 共享的设计与取舍
- 参与的团队
- 受影响的仓库
- 里程碑、风险与依赖
- 指向仓本地 change 的链接

每个仓本地 change 持有该仓库的执行层：

- 仓库特有的任务
- delta spec
- 本地的实现状态
- 可选的本地点记，应当随那个仓库的工作一起归档

跨仓链接仍然重要，但它应当挂在 initiative 与仓本地 change 之下：

```yaml
# billing-service/openspec/changes/add-3ds/.openspec.yaml
schema: spec-driven
created: 2026-04-12
initiative: add-3ds
links:
  - project: github.com/fission/web-client
    change: add-3ds-checkout
  - project: github.com/fission/ios-client
    change: add-3ds-checkout
```

每个仓库仍然持有自己的 change、自己的 delta。一项跨仓工作被表示为一个 initiative 加上 N 个链接起来的单仓 change。这比一个巨大的 mega-change 更好，因为：
- 共享规划有一个诚实的家
- 每个仓库的 change 走自己的归档周期
- delta spec 里不需要解析跨仓的文件路径
- 团队可以按不同速度推进（web 先于 iOS 上线）

对小的单仓工作，一个仓本地 change 作为「计划 + 执行的捆绑」可能仍然「够用」。initiative 优先的拆分，要等工作变成跨团队、跨模块、跨仓或其它协调密集型时才真正重要。

##### 决定：稳定的项目标识符，而不是路径（Decision: Stable Project Identifiers, Not Paths）

跨仓链接必须使用**稳定的项目标识符**，而不是文件系统路径。

- **规范形式：** 一个规范化的 `host/org/repo` 三元组（例如 `github.com/fission/web-client`）。
- **撰写时的简写：** CLI 接受 `org/repo`（例如 `fission/web-client`），并从当前仓库的 remote 推断 host。
- **相对路径永远不是耐久的标识符。** 它们只能作为缓存的本地解析结果存在。

##### 决定：离线优先的解析（Decision: Offline-First Resolution）

CLI 用一条离线优先的链路把项目标识符解析成本地路径：

1. **本次运行显式传入的路径**（例如 CLI 参数、临时的多 root）。
2. **本地 OpenSpec 仓库注册表** —— `~/.config/openspec/` 或 `~/.local/share/openspec/` 里的一份持久映射（见 `src/core/global-config.ts`）。
3. **父目录扫描** —— 在已知的父目录里扫描 git checkout，其 remote 匹配目标标识符。
4. **未解析** —— 如果找不到本地路径，就让这个目标保持未解析，并用一个部分 workspace 继续。CLI 绝不能失败。

注册表是渐进填充的：当 CLI 发现一个 clone（通过扫描或用户提示）时，它把这份映射持久化下来，供未来解析用。注册表还会保存「已知扫描根」（例如 `~/work/`），这样扫描会随时间变好，而无需事先配置。

##### 决定：v1 只做信息性引用（Decision: Informational References Only (v1)）

spec 层面的跨仓引用是**仅用于文档的指针**：

```yaml
# web-client/openspec/specs/checkout/spec.md frontmatter
references:
  - project: github.com/fission/contracts-service
    spec: checkout-contract
```

- CLI **不会**因为一份被引用的跨仓 spec 缺失或未解析而让校验失败。
- CLI **确实会**在规划、查看或应用 change 时，把这些引用呈现给人看和给 agent 用。
- 更强的保证（例如过时警告、跨仓校验）是之后加上的自选层 —— 通过 `lint`、`doctor` 或某个 feature flag —— 而不是基线行为。

这避免了在用例还没证明其必要性之前，就意外地把 OpenSpec 押进一套完整的依赖图系统里。

##### 决定：共享契约要有显式的归属仓库（Decision: Explicit Owner Repo for Shared Contracts）

当一份 spec 无法映射到单个实现仓库时（例如一份共享的 API 契约）：

- **必须有一个仓库作为显式的拥有者。** 它可以是一个专门的「contracts」仓库，也可以是那个天然的真值来源仓库。
- **其它仓库通过信息性引用去引用拥有者仓库的那份 spec**（见上）。
- **不存在默认的「纯 spec 仓库」模式。** 把 spec 的归属与代码的归属分得太激进，会让 agent 执行变别扭，也会让责任变得分散。

##### Monorepo 与 Multi-Repo 对照（Monorepo vs. Multi-Repo Summary）

| 关注点 | Monorepo | Multi-Repo |
|---------|----------|------------|
| **spec 组织** | 一个 `openspec/` 内部的嵌套 spec（模型 B） | 每个仓库各有自己的 `openspec/` |
| **横切的 spec** | 嵌在 `contracts/` 或 `shared/` 目录之下 | 专门的归属仓库，其它仓库引用它 |
| **规划对象** | 对简单工作，initiative 可选；对大型跨团队工作有用 | initiative 是主要的协调对象 |
| **change** | 一个或多个仓本地 change 可以实现一个 initiative | 链接起来的各仓 change 实现一个 initiative |
| **关系** | 引用（v1 不做继承） | 项目标识符链接，仅供信息 |
| **workspace** | 通常不需要，但可以为复杂工作承载 initiative 规划 | 协调工作区承载 initiative 规划；可选的 manifest 用于复用 |

##### 实现路径（Implementation Path）

1. **定义 initiative artifact** —— 为协调工作区里的共享规划加一种 initiative 格式。
2. **扩展 change 元数据** —— 让仓本地的 change 能指向一个 initiative 以及链接起来的兄弟 change。
3. **扩展 spec 元数据** —— 为跨仓 spec 指针加上 `references` 字段。
4. **构建项目解析** —— 实现那条离线优先的解析链路与本地注册表。
5. **构建 initiative 与链接视图** —— 能解析并展示 initiative 图以及链接起来的仓本地 change 的命令。
6. **支持临时多 root** —— 「这次运行把这几个目录加上」或者「从这个 initiative 的链接推导出 root」。
7. **可选的 workspace manifest** —— 只有当团队展现出复用模式时，才加上保存的 workspace。

嵌套 spec（单个仓库内部的模型 B）是干净支持 monorepo 的前置条件，应当最先处理，正如 #662 所勾勒的那样。

---

#### 小结（Summary）

| 问题 | 状态 | 备注 |
|----------|--------|-------|
| Profile 的 UX | 已决定 | 带预设的 `openspec config profile` |
| Config 分层 | 已决定 | 两层：global + project（没有 workspace 层） |
| spec 组织 | **方向已定** | 每个仓库嵌套 spec、共享契约有显式的归属仓库、跨仓上下文用引用 |
| spec 哲学 | 方向已定 | 行为优先的契约、渐进式的严谨度、与 agent 对齐的撰写 |
| spec 继承 | **已决定** | v1 只做引用，不做继承 |
| initiative / 规划模型 | **方向已定** | 更大的工作用 initiative 优先的规划，仓本地 change 作为执行产物 |
| 多仓支持 | **方向已定** | 共享 initiative 之下链接起来的各仓 change；workspace 是协调，不是权威的执行存储 |
| 依赖追踪 | **已决定** | v1 超出范围；引用仅供信息 |
| 跨仓解析 | **已决定** | 离线优先的解析链路 + 本地注册表 |
| 共享契约 | **已决定** | 必须有显式的归属仓库；没有默认的纯 spec 仓库模式 |

##### 关键洞见（Key Insight）

「workspace」这个问题其实是两个分开的问题：
1. **Config/profile 的作用域** → 用 global + project 解决（不需要 workspace）
2. **计划 vs. 执行的组织** → 方向已定：initiative 负责协调，仓本地 change 负责实现，workspace 仍然是一层协调

这两者应当是两个分开的 change，配两次分开的探索。

---

#### 参考（References）

- [VSCode 设置的优先级（VSCode Settings Precedence）](https://code.visualstudio.com/docs/configure/settings)
- [ESLint Flat Config 在 Monorepo 中的讨论（ESLint Flat Config in Monorepos Discussion）](https://github.com/eslint/eslint/discussions/16960)
- [Turborepo 的包配置（Turborepo Package Configurations）](https://turborepo.dev/docs/reference/package-configurations)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Claude Code 设置（Claude Code Settings）](https://code.claude.com/docs/en/settings)
- [Kiro 的多根工作区（Kiro Multi-Root Workspaces）](https://kiro.dev/docs/editor/multi-root-workspaces/)
- [DDD Bounded Context](https://martinfowler.com/bliki/BoundedContext.html)
- [Protobuf 的 Monorepo 模式（Protobuf Monorepo Patterns）](https://www.lesswrong.com/posts/xts8dC3NeTHwqYgCG/keep-your-protos-in-one-repo)
- [Booking.com 的多平台设计系统（Booking.com Multi-Platform Design System）](https://booking.design/how-we-built-our-multi-platform-design-system-at-booking-com-d7b895399d40)
- [InnerSource 的 RFC 模式（InnerSource RFC Patterns）](https://patterns.innersourcecommons.org/p/transparent-cross-team-decision-making-using-rfcs)

### 42.3 workspace-roadmap.md —— 工作区路线图

源文件标题：`# Workspace Roadmap`

#### 目的（Purpose）

本文为 OpenSpec 的 workspace、monorepo 与 multi-repo 支持提出一份轻量路线图。

它假定：

- 单仓是当前的默认体验
- monorepo 的痛点已经是真实的
- 多仓协调不是假设
- 大型工程组织已经需要它

这份路线图是刻意分阶段的。

目标不是一次把整套概念系统建起来。

目标是发布跨边界支持里最小可信的版本，同时保留一条通往更强长期模型的路径。

---

#### 产品原则（Product Principle）

> 优先选择能解决真实跨边界工作、又不堵住可能长期方向的最小功能集。

这意味着：

- 在使用证明必要之前，不要过度建设治理
- 如果真实团队已经需要，就不要建设不足的协调能力
- 除非明显值回票价，不要给单仓路径增加复杂度

---

#### 我们现在相信什么（What We Believe Now）

基于当前的探索工作，有几件事看起来越来越清晰。

##### 1. 需要嵌套的 spec 组织（1. Nested spec organization is needed）

OpenSpec 需要一种更好的方式来组织：

- 共享契约
- 本地实现 spec
- 一个 root 内部的多区域行为

##### 2. 信息性引用风险低且有用（2. Informational references are low-risk and useful）

引用帮助 agent 与人导航相关 spec，而不需要 OpenSpec 第一天就建一套依赖图系统。

##### 3. initiative + 链接起来的按仓 change 是正确的原语（3. Initiatives plus linked per-repo changes are the right primitive）

对真正的多仓工作，可能耐久的原语是：

- 一个 initiative 作为共享规划对象
- 每个拥有仓库一个链接起来的 change 作为执行产物
- 用稳定的标识符把它们连起来

##### 4. 跨仓工作需要一块中立的规划场地（4. Cross-repo work needs a neutral planning location）

对多仓工作，单个仓库不是整个规划产物的诚实住所。

initiative 层面的计划需要某种形式的协调工作区或协调仓库。

##### 5. 团队共享的协调是真实需求（5. Team-shared coordination is a real requirement）

这并不只是单人用户的思想实验。

真实团队与大型工程组织已经需要一种协调多仓工作的方式。

##### 6. 风险是一次发太多（6. The risk is shipping too much at once）

即便需求是真实的，完整模型也有很多活动部件：

- 嵌套 spec 路径
- 共享契约
- 链接起来的 change
- 跨 root 的规划
- 部分仓库解析
- agent 能力差异
- 团队共享的协调状态

路线图应当把它们仔细排序。

---

#### 阶段 1：一个 root 内部更好的结构（Phase 1: Better Structure Inside One Root）

##### 目标（Goal）

减少单仓与 monorepo 设置里的痛点，暂不引入协调机制。

##### 交付（Ship）

1. 一个 `openspec/` root 内部的嵌套 spec 路径
2. spec 里的信息性 `references`
3. 规划时更好地过滤相关 spec 路径
4. 更好地处理一个 root 内部的多区域 change

##### 用户价值（User value）

- monorepo 用户能更自然地组织共享 spec 与本地 spec
- 大的 root 变得不那么吵
- 一个 root 内部的共享契约更容易建模

##### 暂不交付（Do not ship yet）

- 协调工作区
- 链接起来的多仓 change
- 团队共享的协调仓库
- sponsor/owner 工作流机制

##### 成功标准（Success criteria）

- 用户能对大型 monorepo 建模，而不必把所有东西都拍平在顶层
- 用户能在一个 root 内部表达共享契约
- 规划上下文变得更小、更相关

---

#### 阶段 2：薄薄一层跨仓协调（Phase 2: Thin Cross-Repo Coordination）

##### 目标（Goal）

用最薄的、可信的协调层，支撑真实的多仓规划需求。

##### 交付（Ship）

1. 在中立的协调工作区或协调仓库里，用 initiative artifact 做共享规划
2. 用稳定的项目标识符链接起来的按仓 change
3. 通过项目 ID 做显式的仓库链接
4. 通过以下方式解析：
   - 显式输入
   - git remote 匹配
5. 支持部分解析
6. 面向协调规划的基础 agent 交接指令

##### 用户价值（User value）

- 用户在多仓工作上有一块诚实的立足之地
- 跨仓计划不再被埋在某一个仓库里
- 共享规划与仓本地执行被清晰分开
- 归属仍然留在真实仓库里
- 可以告诉 agent 哪些 root 重要

##### 关键约束（Key constraints）

这个阶段应当保持薄。

避免：

- 跨仓的依赖校验
- 丰富的治理流程
- CLI 里太多新抽象
- 重量级的本地/共享状态语义

##### v1 形态（v1 shape）

这个阶段应当感觉像：

- 默认做本地规划
- 需要时升级成协调 initiative
- initiative 层面的规划放在协调工作区里
- 底下是链接起来的仓本地 change

而不是像：

- 一个带很多管理概念的、完整的第二产品模式

##### 成功标准（Success criteria）

- 团队能协调多仓 change，而不必自己发明临时的表格或命名约定
- 用户明白规划住在哪里、实现住在哪里
- agent 能以一种操作上可用的方式跨 root 规划

---

#### 阶段 3：团队共享协调的加固（Phase 3: Team-Shared Coordination Hardening）

##### 目标（Goal）

让协调规划在队友之间、团队之间都能干净地运作。

##### 交付（Ship）

1. 把共享协调仓库/工作区支持当作一等模式
2. 清晰区分：
   - 提交进仓库的共享 initiative 状态
   - 本地机器特有的路径解析
3. 轻量的重新链接 / 修复流程
4. 对加入某个 initiative 的队友更好的上手体验
5. 为共享工作区更好地生成 agent 指令

##### 用户价值（User value）

- 团队可以共享一个稳定的跨仓 initiative
- 每个队友可以把项目 ID 映射到自己的本地 clone
- 新参与者能加入，而不用反推这个 initiative 是怎么搭起来的

##### 重要约束（Important constraint）

这个模型的本地那一侧应当尽量薄。

理想的本地层是：

- 可重新生成的
- 非权威的
- 除了路径解析之外没有语义上的重要性

##### 成功标准（Success criteria）

- 团队共享的协调能工作，而本地路径不会泄漏进已提交的状态
- 加入一个 initiative 感觉轻量
- 维护成本保持在可接受范围

---

#### 阶段 4：共享契约与治理的成熟（Phase 4: Shared Contract and Governance Maturity）

##### 目标（Goal）

支撑那些需要更强契约归属与更正式的跨边界规划的组织。

##### 只有需求能证明其正当性时才交付（Ship only if demand justifies it）

1. 有引导的共享契约归属流程
2. 把只存在于 initiative 的草稿行为提升为权威共享契约
3. 更强的角色可见性：
   - 权威共享契约的拥有者
   - initiative 的 sponsor/driver
4. 可选的 lint 或策略检查
5. 针对缺失拥有者或未解析引用的可选校验

##### 用户价值（User value）

- 更大的组织能干净地创建耐久的共享契约
- 治理在需要的地方变得显式
- 跨团队的归属变得更容易理解

##### 重要约束（Important constraint）

这不应该变成普通用户的强制项。

这些功能应当保持：

- 自选
- 高级
- 与组织复杂度成比例

##### 成功标准（Success criteria）

- 共享契约的工作流能解决真实的组织级问题，又不让普通规划感觉官僚

---

#### 什么不该被推迟（What Should Not Be Delayed）

因为需求已经是真实的，有些东西不该被当成纯粹的未来工作。

##### 应当尽快发生（Should happen soon）

- 嵌套 spec 路径
- 引用
- initiative artifact + 链接起来的 change 这一原语
- 稳定的项目标识符
- 面向多仓规划的薄协调层

##### 可以等（Can wait）

- 丰富的归属工作流
- 强依赖语义
- 宽泛的策略与治理功能
- 太多 agent 特有的机制

---

#### 贯穿所有阶段的 UX 护栏（UX Guardrails Across All Phases）

不管哪个阶段，UX 都应当遵循这些规则。

##### 1. 默认本地（1. Default local）

用户应当从他们已经在的地方开始。

##### 2. 只在必要时升级（2. Escalate only when necessary）

协调规划应当表现为一条升级路径，而不是默认模式。

##### 3. 高级概念大部分保持隐式（3. Keep advanced concepts mostly implicit）

只有当用户真的需要决定什么时，才暴露共享拥有者、sponsor 角色、overlay 与 manifest 这类概念。

##### 4. 权威存储跟随归属（4. Canonical storage follows ownership）

spec 与仓本地 change 留在拥有的 root 里。

##### 5. 共享协调不是权威 spec 存储（5. Shared coordination is not canonical spec storage）

协调数据帮助规划，但不取代真值来源。

##### 6. 隐藏的本地状态必须保持薄（6. Hidden local state must stay thin）

如果 OpenSpec 使用本地路径缓存或机器特有的映射，它们应当：

- 可修复
- 可替换
- 非权威

---

#### 可能的交付顺序（Likely Deliverable Sequence）

如果这份路线图被翻译成实际的 change proposal，顺序很可能是：

1. 嵌套 spec 路径 + 引用
2. monorepo 的作用域过滤与多区域规划改进
3. 用于共享规划的 initiative artifact
4. 跨仓的链接 change 元数据
5. 面向多仓规划的薄协调工作区 / 仓库
6. 团队共享协调的加固
7. 可选的共享契约成熟功能

---

#### 未闭的风险（Open Risks）

##### 1. v1 里的协调可能仍然太重（1. Coordination may still be too heavy in v1）

如果交接很笨拙，即便薄薄一层协调也可能显得太多。

##### 2. 隐藏的本地状态可能变得比预期更重要（2. Hidden local state may become more important than intended）

如果路径解析或本地仓库链接变得有语义上的重要性，系统会变得更难信任、更难调试。

##### 3. monorepo 与 multi-repo 可能无意间分化（3. Monorepo and multi-repo may diverge unintentionally）

产品应当抵制演化出两套完全分开的心智模型。

##### 4. agent 能力差异可能扭曲设计（4. Agent capability differences may distort the design）

UX 不应当假定每个编码 agent 都同样擅长多 root 规划。

##### 5. 团队规模的需求可能过早施压治理（5. Team-scale needs may pressure early governance）

大型组织可能很快就要归属、权限与评审结构。那不应该把全体用户逼进重量级流程。

---

#### 小结（Summary）

这份路线图不应当是：

- 「多仓的事以后再说」

因为需求已经是真实的。

它也不应当是：

- 「现在就把完整的 workspace 模型建起来」

因为复杂度面太大。

正确的路线图是：

1. 改进一个 root 内部的结构
2. 为多仓工作发布一层薄但真实的协调层
3. 加固团队共享的协调
4. 只在有正当理由时加入更正式的共享契约与治理支持

### 42.4 workspace-user-journeys.md —— 工作区用户旅程

源文件标题：`# Workspace User Journeys`

#### 目的（Purpose）

本文描述 OpenSpec 在以下场景里精确的用户体验：

1. 单仓项目
2. Monorepo
3. 表现得像许多仓库的大型 monorepo
4. 真正的多仓 initiative

它刻意以 UX 为先。目标是定义：

- 用户从哪里开始
- 他们跑哪些命令
- agent 看到什么
- artifact 存在哪里
- OpenSpec 如何决定该读哪些 spec
- 当 root 缺失、含糊或只有部分可用时，OpenSpec 如何表现

这是一份提案式的 UX 模型，不是实现规格。

---

#### 核心心智模型（The Core Mental Model）

用户不应当需要一套理解仓库的心智模型，再加一套分开的理解 monorepo 的心智模型。

OpenSpec 应当以 **scope** 为操作单位。

一个 scope 是一块被拥有的规划与实现边界。取决于代码库，一个 scope 可以是：

- 一整个仓库
- monorepo 里的一个 package 或 app
- monorepo 里的一个 service
- 一块共享契约区域
- 另一个被显式拥有的领域

用户体验应当是：

- 挑出你想改的东西
- 确认涉及哪些 scope
- OpenSpec 只读相关的 spec
- OpenSpec 把每个 artifact 存在它该在的拥有地
- 如果工作横跨多个拥有地，OpenSpec 创建一个中立的协调工作区

##### 耐久对象（Durable Objects）

有三种不同的耐久对象：

1. **Spec**
   一份权威的行为契约。永远存在拥有的 scope 里。

2. **Change**
   一份仓本地或 scope 本地的规划产物。存在实现/spec delta 的拥有者那里。

3. **Initiative**
   一份跨 scope 的协调产物。只有当工作横跨多个拥有的 root 时才需要。存在一块中立的协调工作区里。

关键规则是：

> 权威 spec 永远不搬进协调工作区。

workspace 负责协调。拥有的 root 仍然是权威。

##### 跨边界的 spec（Cross-Boundary Specs）

有些行为是真正跨多个 scope、app 或仓库的：

- 由 web、iOS、Android 与 backend 共享的结账行为
- 由应用客户端与 API 服务共享的 auth/session 规则
- 由发票、支付与报表共享的结算规则
- 跨许多系统共享的隐私或审计保证

这些不只是「本地 spec 之间的引用」。它们是一等的共享契约。

OpenSpec 应当把它们显式建模成：

1. **权威共享契约（Canonical shared contract）**
   一份定义跨边界必须成立什么的 spec。

2. **本地实现 spec（Local implementation specs）**
   描述每个拥有者如何在本地满足那份契约的按 scope spec。

3. **Initiative**
   一个把契约与它的各实现一起更新的 change 或项目。

第一性原理是：

> 一份跨边界的 spec 可以有很多消费者，但它仍然必须只有一个权威拥有者。

如果还没有拥有者，共享行为可以在探索期间暂时作为 initiative 笔记存在，但在归属明确之前，OpenSpec 不应把它提升为权威 spec。

---

#### UX 原则（UX Principles）

##### 1. 各处都是同一套顶层工作流（1. Same top-level workflow everywhere）

用户应当仍然认得现有的 OpenSpec 工作流：

- `openspec init`
- `openspec update`
- `/opsx:explore`
- `/opsx:propose`
- `/opsx:apply`
- `/opsx:archive`

新的行为是 OpenSpec 可能会问：

- 「这影响哪个 scope？」
- 「这是否横跨多个拥有的 root？」
- 「我该创建一个协调工作区吗？」

##### 2. 不需要事先注册 workspace（2. No required upfront workspace registration）

用户不应当为了以防万一而预先注册所有仓库或模块。

OpenSpec 应当支持：

- 临时发现
- 一次性的本地链接
- 之后可选的保存式 workspace

##### 3. 跨 root 规划必须有一块中立的家（3. Cross-root planning must have a neutral home）

如果一个 change 横跨多个仓库，规划产物不应被硬塞进某一个仓库。

相反，OpenSpec 应当为这个 initiative 创建一个中立的协调工作区。

##### 4. 权威存储跟随归属（4. Canonical storage follows ownership）

- 共享契约 spec 住在拥有契约的 scope 里
- web 特有的 spec 住在拥有 web 的 scope 里
- iOS 特有的 spec 住在拥有 iOS 的 scope 里
- 仓本地的代码任务住在仓本地的 change 里

##### 5. 引用是信息性的（5. References are informational）

跨 scope 或跨仓的 `references` 最初应当只用于文档。

OpenSpec 可以把它们呈现给用户与 agent，但第一版里不应当要求它们跨 root 解析或校验。

##### 6. 共享契约需要显式归属（6. Shared contracts need explicit ownership）

当用户描述的行为跨多个边界时，OpenSpec 应当帮他们决定自己正在创建的是：

- 一份本地 spec
- 一份共享契约
- 一条尚不权威的 initiative 笔记

如果这项工作是一份真正长期存在的契约，OpenSpec 应当提示用户给出一个权威拥有者，而不是把它埋在用户恰巧站着的那某个仓库里。

##### 7. 不要把「共享归属」强做成隐式的共同拥有（7. Do not force "shared ownership" as implicit co-ownership）

OpenSpec 应当帮团队创建**共享契约的归属**，而不是含糊的共同拥有。

这意味着：

- 一个 scope 或仓库拥有那份权威共享契约
- 其它 scope 消费并引用它
- 协调工作区可以摘要它
- 归属与评审路由保持清晰可读

##### 8. 只把当前仓库当作起点，而不是真值（8. Use the current repo only as a starting point, not as truth）

当用户在 `web-client` 里开始，并描述一个横跨 web、iOS、Android 与 backend 的结账行为时，OpenSpec 应当把当前 cwd 当作关于可能消费者的线索，而不是当作 `web-client` 应当拥有那份共享契约的证明。

---

#### 术语（Terms）

##### Project

单个 OpenSpec root，权威 spec 与 change 可以住在其中。

实践中一个 project 可以是：

- 一个带 `openspec/` 的仓库根
- 一个带单个 `openspec/` 的 monorepo 根
- 如果 OpenSpec 之后支持嵌套 root，则是一个嵌套的被拥有 scope

##### Scope

一个项目内部或跨项目的逻辑边界。Scopes 就是用户在规划时挑选的东西。

例子：

- `repo`
- `contracts/checkout`
- `apps/web`
- `services/billing`
- `mobile/ios`

##### 协调工作区（Coordination Workspace）

一块只用于跨 root 协调的中立目录。它存放 initiative 层面的规划数据与 agent 工作区指令。

例子：

```text
~/work/openspec-workspaces/add-3ds/
  .openspec-workspace/
    workspace.yaml
    initiative.md
    links.yaml
    agents/
      claude.md
      codex.md
```

这块协调工作区可以以两种模式存在：

1. **个人协调工作区（Personal coordination workspace）**
   一个人用于临时或探索性跨 root 规划的本地目录。

2. **共享协调工作区（Shared coordination workspace）**
   一个团队或多个团队使用的、已提交的协调仓库或共享工作区。

UX 应当在不改变核心心智模型的前提下同时支持两者。

##### 拥有的 Root（Owning Root）

权威地拥有一份 spec、一块代码库区域或一个仓本地 change 的仓库或 scope。

##### 共享契约拥有者（Shared Contract Owner）

权威地拥有一份跨边界 spec 的 scope 或仓库。

这可以是：

- monorepo 里一块已经存在的共享契约区域
- 一个已经存在的 backend/API 契约拥有者
- 一个专门的 contracts 仓库
- 在规划流程中新建的一个共享 scope

这不应是「用户在哪里启动 agent」意外造成的结果。

---

#### 建议的文件形态（Recommended File Shapes）

##### 单仓（Single repo）

```text
repo/
  openspec/
    specs/
    changes/
    config.yaml
```

##### Monorepo

```text
monorepo/
  openspec/
    specs/
    changes/
    config.yaml
  apps/
    web/
    admin/
  services/
    billing/
  packages/
    contracts/
```

可选的 scope 标记（Optional scope markers）：

```text
monorepo/
  apps/web/openspec.scope.yaml
  services/billing/openspec.scope.yaml
  packages/contracts/openspec.scope.yaml
```

##### 带协调工作区的多仓（Multi-repo with coordination workspace）

```text
~/work/
  contracts/
    openspec/
  web-client/
    openspec/
  ios-client/
    openspec/
  openspec-workspaces/
    add-3ds/
      .openspec-workspace/
        workspace.yaml
        initiative.md
        links.yaml
        agents/
          claude.md
          codex.md
```

---

#### 发现模型（Discovery Model）

OpenSpec 需要回答两个分开的问题：

1. 涉及哪些 scope？
2. 它们此刻在磁盘上的哪里？

这不是同一个问题。

##### Scope 发现（Scope discovery）

OpenSpec 从这些地方发现候选 scope：

- 当前仓库根
- `openspec/specs/**`
- 可选的 scope 标记文件
- 之前的 initiative 元数据
- 用户的显式选择

##### Root 解析（Root resolution）

对多仓工作，耐久的标识符不应是原始路径。

稳定的项目标识符应当长这样：

- `github.com/Fission-AI/web-client`
- `github.com/Fission-AI/contracts`

可以接受用户简写：

- `Fission-AI/web-client`
- `fission/web-client`

OpenSpec 按这个顺序把它们解析成本地路径：

1. 本次运行显式传入的路径
2. 已保存的本地 OpenSpec 注册表
3. 本地 git remote 扫描
4. 用户提示

像 `../web-client` 这样的相对路径可以作为单次运行的临时提示，但不应当成为耐久的标识符。

##### 共享 manifest 与本地 overlay（Shared manifest vs local overlay）

对团队使用，OpenSpec 应当区分：

1. **共享协调状态（Shared coordination state）**
   可以被提交并与队友共享的稳定信息。

2. **本地解析状态（Local resolution state）**
   机器特有的路径映射与本地可用性。

###### 共享协调状态应当包含（Shared coordination state should include）

- initiative ID 与摘要
- 稳定的项目标识符
- 选中的 scope
- 链接起来的仓本地 change ID
- 归属元数据
- 上线或排序的说明
- 未解析但已知的参与项目

###### 本地解析状态应当包含（Local resolution state should include）

- 项目标识符对应的本地文件系统路径
- 本地仓库的可用性
- 多个匹配里本地偏好的那个 clone
- 机器特有的 agent 挂载提示

这种区分对一个自洽的团队故事至关重要。

没有它，协调工作区会变成要么：

- 太本地化而无法分享，要么
- 被机器特有的路径污染，在队友那里就坏掉

---

#### 团队协作模型（Team Collaboration Model）

本节描述同一套 UX 如何从一个人扩展到大型组织。

##### 最小单位：一个用户、一台机器（Smallest unit: one user, one machine）

用户可以创建一个本地协调工作区，把一切都保持在本地。

这适用于：

- 一次性的跨仓探索
- 分享之前的私下规划
- 试一个多仓想法

##### 团队单位：共享 initiative（Team unit: shared initiative）

一旦跨仓工作变得需要协作，协调工作区就应当可分享、可提交。

这意味着：

- initiative 元数据被提交
- 归属决定被提交
- 链接起来的 change 被提交
- 本地路径不被提交

##### 跨团队单位：有 sponsor 的 initiative（Cross-team unit: sponsored initiative）

当工作横跨团队时，即便 spec 与代码仍然分散，initiative 也需要一个清晰的协调拥有者。

这与权威 spec 的归属不同。

现在有两种不同的职责：

1. **共享契约拥有者（Shared contract owner）**
   拥有那份权威的跨边界 spec。

2. **Initiative sponsor/driver**
   拥有当前这个 change 的协调过程。

这两者可以是同一个团队，但不必是。

例子：

- 平台团队 sponsor 上线，auth 团队拥有权威 auth 契约
- 支付团队 sponsor initiative，contracts 仓库拥有权威 checkout 契约
- 移动平台团队 sponsor 全应用范围的迁移，backend 团队拥有 API 契约

##### 我们应当告诉团队什么（What we should tell teams）

OpenSpec 应当清楚地传达这一点：

> 如果这项工作需要协作，就把协调工作区当作一个轻量的共享规划仓库或已提交的工作区。把稳定的 initiative 元数据提交进去，把机器特有的仓库路径映射留在本地。

这给以下问题一个干净的答案：

- 我们怎么共享这个跨仓计划？
- 队友怎么打开同一个 initiative？
- 本地 clone 布局不同的人怎么在同一个 initiative 上工作？

---

#### 归属决策模型（Ownership Decision Model）

本节回答一个关键的产品问题：

> 一个团队或 agent 应当如何决定一份共享的跨边界 spec 属于哪里？

##### 第一性原理的经验法则（First-principles heuristic）

OpenSpec 应当帮团队选出那个最有资格做到以下全部的拥有者：

1. 定义这项保证
2. 评审并批准对这项保证的改动
3. 把这项保证传达给消费者
4. 在这项保证变化时吸收协调成本

拥有者不必然是：

- 发起这个 change 的团队
- 前端团队
- 后端团队
- 代码最多的那个仓库

拥有者是契约最稳定、最权威的那条边界。

##### 归属决策的问题（Ownership decision questions）

当 OpenSpec 察觉到可能是一份共享契约时，它应当问这些问题，或者从中推断：

1. 这个行为是否打算长期在多个 scope 上都成立？
2. 它是一份对外契约、一条内部产品规则，还是一个实现细节？
3. 哪个团队或 scope 能批准对这份契约的改动？
4. 消费者自然会去把哪个拥有者当作真值来源？
5. 是否已经存在一块共享契约区域？
6. 这份契约是否可能比当前 initiative 活得更久？

##### 建议的结果（Recommended outcomes）

###### 结果 A：已经存在拥有者（Outcome A: Existing owner already exists）

例子：

- monorepo 里已经存在 `packages/contracts/checkout`
- 多仓环境里已经存在 `contracts` 仓库

OpenSpec 应当默认用那个已有的拥有者。

###### 结果 B：共享契约属于某个已有的领域拥有者（Outcome B: Shared contract belongs in an existing domain owner）

例子：

- 一份 API 请求/响应契约属于 API/backend 拥有者
- 一份共享 auth token 契约属于 auth 平台拥有者

如果没有专门的共享区域，OpenSpec 应当建议那个已有的领域拥有者。

###### 结果 C：应当新建一个共享契约 scope（Outcome C: A new shared contract scope should be created）

例子：

- 结账行为在若干客户端与服务之间共享
- 不存在已有的共享拥有者
- 这件事很可能会反复出现，需要长期治理

OpenSpec 应当帮忙新建一个共享契约 scope。

###### 结果 D：暂时只作为 initiative（Outcome D: Keep it as initiative-only for now）

例子：

- 团队仍在探索
- 边界不清楚
- 还没人能回答谁该拥有那份权威保证

OpenSpec 应当允许这个行为暂时留在 initiative 笔记里，并显式标记为非权威，直到选定归属。

##### OpenSpec 默认应当建议什么（What OpenSpec should suggest by default）

###### 对 monorepo（For monorepos）

默认建议顺序：

1. monorepo 内部已有的共享契约 scope
2. 已有的领域/平台拥有者
3. 在 monorepo 内部新建一个共享 scope
4. 在澄清之前只作为 initiative

###### 对多仓环境（For multi-repo environments）

默认建议顺序：

1. 已有的 contracts/shared-specs 仓库
2. 已经拥有那份稳定契约的领域/平台仓库
3. 新建一个专门的共享契约仓库或 scope
4. 在澄清之前只作为 initiative

##### OpenSpec 不应当做什么（What OpenSpec should not do）

OpenSpec 不应当：

- 静默地把归属指派给用户启动所在的仓库
- 在所有消费者那里复制那份权威共享 spec
- 在还没有选定拥有者时就把某样东西称为权威
- 在团队能开始规划之前，就把他们逼进一套中央管理配置

---

#### 共享契约创建的 UX（Shared Contract Creation UX）

当用户描述一个很可能是跨边界的行为时，OpenSpec 应当把它当作一个一等的规划时刻。

##### 检测线索（Detection cues）

可能需要对一份共享契约的信号：

- 请求提到多个平台或仓库
- 请求提到「shared」「common」「contract」「same behavior」「consistent across」
- 选中的 scope 同时包含客户端与 backend
- 没有任何已有的 spec 干净地拥有所描述的行为

##### 提示的形状（Prompt shape）

在 `/opsx:propose` 或 `/opsx:explore` 期间，OpenSpec 应当问类似这样的问题：

```text
This looks like behavior shared across multiple scopes:
- web
- iOS
- Android
- backend

What kind of artifact is this?
- A local change within one scope
- A shared contract that multiple scopes must follow
- An initiative note for now; ownership is not clear yet
```

如果用户选择共享契约：

```text
Where should the canonical shared contract live?
- Existing shared contracts scope
- Existing domain owner
- Create a new shared contract scope
- Decide later and keep this initiative-only for now
```

##### 新建一个共享契约 scope（Creating a new shared contract scope）

如果用户选择「新建一个共享契约 scope」，OpenSpec 应当引导他们。

###### Monorepo

提示的感觉：

```text
Suggested new shared scopes:
- openspec/specs/contracts/checkout
- openspec/specs/shared/checkout
- packages/contracts/checkout

Who should own review for this contract?
```

然后 OpenSpec：

1. 在选定的共享 scope 里创建那份权威共享 spec
2. 记录选中的消费者
3. 如果有必要，在消费者的 change/spec 里生成本地引用

###### 多仓（Multi-repo）

提示的感觉：

```text
No shared contract owner exists yet.

Choose where the canonical contract should live:
- Create it in an existing contracts repo
- Create a new shared contracts repo later; keep initiative-only for now
- Assign it to an existing domain owner repo
```

OpenSpec 应当避免自动创建一个全新的仓库。它可以搭出计划并记录这个决定，但创建仓库在组织上可能很敏感，通常属于 CLI 之外的事。

##### 临时的「只作为 initiative」模式（Temporary initiative-only mode）

如果归属不清楚，OpenSpec 应当支持：

- 把共享行为作为一份草稿笔记存在 initiative 工作区里
- 显式把它标记为非权威
- 提醒用户：在长期采纳之前，要把它提升为一份权威共享契约

这很重要，因为很多团队是在探索中发现需要一份共享契约的，那时他们还不知道该如何治理它。

---

#### 跨团队规模的自洽 UX（Cohesive UX Across Team Size）

产品应当感觉像一个系统，而不是三个分开的功能。

##### 不变的工作流（The invariant workflow）

不管什么场景，用户体验都应当总是归结为：

1. 从你所在的地方开始
2. 描述这项工作
3. 确认受影响的 scope
4. 让 OpenSpec 判定这是：
   - 只在本地
   - 一个 root 内的多 scope
   - 跨 root 的协调
5. OpenSpec 在正确的地方创建 artifact
6. OpenSpec 告诉用户去哪里继续规划、去哪里实现

##### 随规模变化的东西（What changes by scale）

###### 单人 / 单仓（Solo / single repo）

- 入口：仓库根
- 可分享性：不相关
- 只存本地就够了

###### 单人 / 临时多仓（Solo / ad hoc multi-repo）

- 入口：本地协调工作区
- 可分享性：可选
- 本地路径映射就够了

###### 团队 / 协作式多仓（Team / collaborative multi-repo）

- 入口：共享的协调仓库/工作区
- 可分享性：必需
- 提交稳定的 manifest，本地路径保持私有

###### 大型组织 / 跨团队 initiative（Large org / cross-team initiative）

- 入口：共享的协调仓库/工作区
- sponsor/driver 是显式的
- 共享契约的归属是显式的
- 有些参与团队在本地只能解析出一部分 root

##### 应当保持一致的东西（What should remain consistent）

这些不应当随组织规模变化：

- 权威 spec 住在拥有者那里
- 本地代码 change 住在拥有者那里
- 共享契约需要一个权威拥有者
- 协调数据不是权威 spec 的来源
- 本地机器路径永远不是耐久的标识符
- 即便规划是协调的，实现仍可能逐个 root 进行

如果这些不变量成立，UX 在单人、团队与全组织用法之间就仍然自洽。

---

#### Agent 访问模型（Agent Access Model）

跨 root 的 UX 只有在 agent 真正能看到相关 root 时才成立。

OpenSpec 应当支持三种 agent 能力级别。

##### 级别 1：强的多 root 支持（Level 1: Strong multi-root support）

这个工具能把多个目录显式挂载到一个会话上。

期望的 UX：

- 用户打开协调工作区
- OpenSpec 明确告诉用户要挂载哪些 root
- agent 从所有已挂载的 root 读取

##### 级别 2：单一 cwd，但对链接的 root 有文件系统访问（Level 2: Single cwd but filesystem access to linked roots）

这个工具从一个工作目录运行，但如果环境允许，它仍然能读兄弟绝对路径。

期望的 UX：

- 用户打开协调工作区
- OpenSpec 把 agent 可读的绝对路径写进工作区指令里
- agent 能直接读那些 root

##### 级别 3：实际上只能单 root（Level 3: Practically single-root）

这个工具一次只能可靠地在一个仓库里操作。

期望的 UX：

- 协调工作区只用于规划
- OpenSpec 之后引导用户进入各仓本地的实现会话
- `/opsx:apply` 在每个仓库里分别跑

这必须被当作一等情况，而不是事后补的兜底。

---

#### 需要保留的当前 OpenSpec 流程（Current OpenSpec Flow To Preserve）

今天流程是：

1. 用户进入一个仓库
2. 用户跑 `openspec init`
3. 用户在那个仓库里打开 agent
4. 用户跑 `/opsx:explore` 或 `/opsx:propose`
5. OpenSpec 把 change 存在 `openspec/changes/<change>/`
6. `/opsx:apply` 在那个仓库里实现

对单仓工作，这应当保持完全一样的感觉。

唯一的扩展是：

- 如果 OpenSpec 检测到一个跨 root 的 initiative，它显式地把工作流升级成协调工作区流程

---

#### 旅程 1：单仓，标准的 OpenSpec 项目（Journey 1: Single Repo, Standard OpenSpec Project）

##### 起始状态（Starting state）

用户有一个仓库：

```text
~/work/acme-app/
```

他们进入这个仓库：

```bash
cd ~/work/acme-app
```

他们初始化 OpenSpec：

```bash
openspec init
```

OpenSpec 创建：

```text
openspec/
  specs/
  changes/
  config.yaml
```

他们在这个仓库里打开 Claude、Codex、Cursor 或别的 agent。

##### 规划（Planning）

用户输入：

```text
/opsx:propose add-dark-mode
```

OpenSpec 应当：

1. 检测到单个本地项目
2. 检测到单个默认 scope：这个仓库
3. 创建一个仓本地 change
4. 只读本地项目配置与本地 spec
5. 生成本地规划 artifact

输出的感觉：

```text
Created openspec/changes/add-dark-mode/
Using scope: repo

Generated:
- proposal.md
- specs/ui/spec.md
- design.md
- tasks.md

Ready for implementation with /opsx:apply
```

##### 实现（Implementation）

用户输入：

```text
/opsx:apply
```

OpenSpec 读取：

- proposal
- specs
- design
- tasks

只从这个仓库读。

##### 归档（Archival）

用户输入：

```text
/opsx:archive
```

OpenSpec 在这个仓库里归档这个 change，和今天一样。

##### 存储结果（Storage outcome）

- spec delta 存在这个仓库
- 权威 spec 存在这个仓库
- tasks 与 design 存在这个仓库
- 不暴露任何 workspace 概念

##### 边界情况（Edge cases）

- 仓库里有多个活跃 change：提示用户选一个
- spec 目录缺失：如果当前 schema 行为允许，就继续
- 用户从子目录运行：OpenSpec 应当向上遍历，或者明确告诉他们要在仓库根运行

---

#### 旅程 2：Monorepo，小团队，一个明显的 scope（Journey 2: Monorepo, Small Team, One Obvious Scope）

##### 起始状态（Starting state）

用户有：

```text
~/work/platform/
```

里面有：

```text
platform/
  openspec/
  apps/web/
  services/api/
  packages/ui/
```

用户进入 monorepo 根，在那里跑他们的 agent。

##### 规划（Planning）

用户输入：

```text
/opsx:propose add-invoice-filtering
```

OpenSpec 检测到这仍然是一个项目 root，但有多个候选 scope。

如果用户的请求明确提到某一个区域，OpenSpec 可以推断出：

- `apps/web`

否则它会问：

```text
Which scope does this change affect?
- apps/web
- services/api
- packages/ui
- shared/contracts
```

用户挑 `apps/web`。

##### 预期行为（Expected behavior）

OpenSpec 应当：

1. 在 `openspec/changes/add-invoice-filtering/` 下创建一个 monorepo 本地的 change
2. 给那个 change 打上 `apps/web` 标记
3. 读取与 `apps/web` 相关的 spec
4. 避免把不相关的 monorepo 区域拉进上下文

##### 存储结果（Storage outcome）

- monorepo 根上一个 change
- scope 选择记录在 change 元数据里
- delta spec 只为选中的区域生成

##### 为什么这重要（Why this matters）

用户不应当因为恰好在 monorepo 里，就感觉自己用的是另一个产品。

---

#### 旅程 3：Monorepo，跨 scope 的 change（Journey 3: Monorepo, Cross-Scope Change）

##### 起始状态（Starting state）

同一个 monorepo：

```text
platform/
  openspec/
  apps/web/
  services/api/
  packages/contracts/
```

##### 规划（Planning）

用户输入：

```text
/opsx:propose add-3ds-checkout
```

OpenSpec 检测到可能受影响的 scope：

- `packages/contracts`
- `services/api`
- `apps/web`

它问：

```text
This appears to affect multiple scopes.
Which scopes should be included?
[x] packages/contracts
[x] services/api
[x] apps/web
[ ] apps/admin
[ ] packages/ui
```

##### 预期行为（Expected behavior）

OpenSpec 创建：

```text
platform/openspec/changes/add-3ds-checkout/
```

这个 change 包含列出全部三个选中 scope 的 scope 元数据。

OpenSpec 读取：

- 共享契约 spec
- billing/checkout 的 API spec
- web 结账 spec

OpenSpec 默认忽略不相关的 spec。

##### 实现（Implementation）

用户跑：

```text
/opsx:apply
```

OpenSpec 应当：

1. 展示有多个 scope 受影响
2. 据此给任务排序
3. 如果这个 monorepo 仍然被当作一个拥有的 root，就更新一份共享的 task artifact

##### 存储结果（Storage outcome）

- monorepo 根上一个 change
- 对应多个 scope 路径的 delta spec
- 所有权威 spec 仍然留在这个 monorepo 内部

##### 重要提示（Important note）

这仍然不是协调工作区的情形，因为仍然只有一个拥有的项目 root。

---

#### 旅程 4：表现得像许多仓库的大型 monorepo（Journey 4: Large Monorepo That Behaves Like Many Repos）

##### 为什么有这个旅程（Why this journey exists）

有些 monorepo 在操作上等价于多仓系统：

- 不同团队拥有不同区域
- 不同的发布节奏
- 许多开发者不应当去改彼此的规划设置
- 跨团队的工作是例外

这意味着 OpenSpec 不能假定：

- 一个 monorepo 根自动等于一个规划单位

##### 起始状态（Starting state）

```text
platform/
  openspec/
  apps/web/
  apps/mobile/
  services/billing/
  services/orders/
  packages/contracts/
```

存在可选的 scope 标记：

```text
apps/web/openspec.scope.yaml
apps/mobile/openspec.scope.yaml
services/billing/openspec.scope.yaml
packages/contracts/openspec.scope.yaml
```

##### 规划一个本地团队 change（Planning a local team change）

web 团队进入 monorepo 根，或者某个懂仓库的子工具进入 web 区域。

用户输入：

```text
/opsx:propose add-checkout-loading-state
```

OpenSpec 检测到这只限于 `apps/web`。

用户的体验应当与一个单 scope 的 change 完全一样。

##### 规划一个跨团队的 monorepo initiative（Planning a cross-team monorepo initiative）

用户输入：

```text
/opsx:propose add-3ds
```

OpenSpec 检测到：

- `packages/contracts`
- `services/billing`
- `apps/web`
- 可能还有 `apps/mobile`

这时 OpenSpec 必须做一个产品决定。

###### 建议的行为（Recommended behavior）

如果所有受影响的 scope 都住在一个拥有的 root 之下，并且用户对一个 monorepo 本地的 change 没有意见，那就继续用一个 root 级的 change。

如果这个 monorepo 被配置成、或被推断为表现得像许多被拥有的子项目，那就提议升级成一个**协调式的 monorepo initiative**。

提示的感觉：

```text
This monorepo has multiple independently owned scopes.

How would you like to plan this work?
- One monorepo change
- Coordination initiative with linked scope changes
```

##### 协调式的 monorepo initiative（Coordination-style monorepo initiative）

如果用户选择协调流程，OpenSpec 创建：

1. 一块中立的 initiative 工作区
2. 链接起来的 scope 本地 change，放在 monorepo 根里或各 scope 拥有的文件夹里

这与多仓是同一套概念流程，只是所有 root 恰好都在同一个 VCS 根里。

##### 为什么这重要（Why this matters）

这避免了 UX 把「monorepo 永远更简单」硬编码进去。

那个假设恰恰在这个功能所服务的企业式团队上不成立。

---

#### 旅程 5：从一个仓库内部开始的多仓工作（Journey 5: Multi-Repo Work Started From Inside One Repo）

##### 起始状态（Starting state）

用户在：

```text
~/work/web-client
```

他们在那里已经在用 OpenSpec。

他们在 `web-client` 里打开 Claude 并输入：

```text
/opsx:propose add-3ds
```

在探索或生成 proposal 的过程中，变得清楚的是这项工作还影响：

- `contracts`
- `billing-service`
- `ios-client`

##### 关键的 UX 要求（Critical UX requirement）

这时 OpenSpec 不应静默地在 `web-client` 内部创建一个跨仓的 change。

那会产生误导，因为：

- 这个 initiative 并不由 `web-client` 拥有
- agent 还没有其它 root
- 权威 spec 属于其它仓库

##### 预期的 OpenSpec 行为（Expected OpenSpec behavior）

OpenSpec 打断默认的单仓流程并说：

```text
This work spans multiple owning roots:
- github.com/Fission-AI/contracts
- github.com/Fission-AI/billing-service
- github.com/Fission-AI/web-client
- github.com/Fission-AI/ios-client

For cross-repo work, OpenSpec recommends creating a coordination workspace.

Suggested location:
~/work/openspec-workspaces/add-3ds

Create it now?
```

如果用户同意，OpenSpec 创建这个工作区。

如果用户想要别的位置，他们可以选。

##### 协调工作区的创建（Coordination workspace creation）

提议的 CLI 感觉：

```bash
openspec workspace create add-3ds --at ~/work/openspec-workspaces/add-3ds
```

OpenSpec 写入：

```text
~/work/openspec-workspaces/add-3ds/
  .openspec-workspace/
    workspace.yaml
    initiative.md
    links.yaml
    agents/
      claude.md
      codex.md
```

##### 仓库解析（Repo resolution）

OpenSpec 现在为以下项目解析本地路径：

- `github.com/Fission-AI/contracts`
- `github.com/Fission-AI/billing-service`
- `github.com/Fission-AI/web-client`
- `github.com/Fission-AI/ios-client`

使用：

1. 已知的本地注册表
2. git remote 扫描
3. 如果需要，用户确认

##### agent 交接（Agent handoff）

OpenSpec 然后告诉用户：

```text
Next step:
1. Open your coding agent in ~/work/openspec-workspaces/add-3ds
2. Attach these roots if your tool supports multi-root:
   - /Users/me/work/contracts
   - /Users/me/work/billing-service
   - /Users/me/work/web-client
   - /Users/me/work/ios-client

OpenSpec has generated workspace instructions at:
.openspec-workspace/agents/claude.md
```

##### 从工作区里规划（Planning from the workspace）

用户现在在协调工作区里启动 agent 并跑：

```text
/opsx:propose add-3ds
```

或者 OpenSpec 可能已经把这个 initiative 搭好了，并让 agent 去继续它。

##### 存储结果（Storage outcome）

协调工作区存放**initiative 层面的规划对象**：

- proposal.md
- design.md
- initiative 摘要
- 跨仓 scope 映射
- 归属、里程碑、风险与依赖
- 指向仓本地 change 的链接
- agent 工作区指令

每个仓库存放自己的执行 change：

- `contracts/openspec/changes/add-3ds-contract/`
- `billing-service/openspec/changes/add-3ds-billing/`
- `web-client/openspec/changes/add-3ds-web/`
- `ios-client/openspec/changes/add-3ds-ios/`

那些仓本地 change 才是仓库特有的任务、delta spec 与本地实现状态住的地方。

##### 为什么这重要（Why this matters）

这给用户一个诚实的答案，回答：

- 我该站在哪里？
- 这个 change 住在哪里？
- agent 怎么看到其它仓库？

答案是：

- 跨仓规划时站在协调工作区里
- 权威 change/spec 留在它们的拥有者那里

---

#### 旅程 6：从中立位置开始的多仓工作（Journey 6: Multi-Repo Work Started From a Neutral Place）

##### 起始状态（Starting state）

用户已经知道这项工作跨仓。

他们从一个中立目录开始：

```bash
cd ~/work
```

他们跑：

```bash
openspec workspace create add-3ds --at ~/work/openspec-workspaces/add-3ds
```

或者未来的某个更高层快捷方式：

```bash
openspec initiative new add-3ds
```

##### OpenSpec 的提示（OpenSpec prompts）

OpenSpec 问：

```text
Which repos or scopes are involved?
```

用户输入：

- `github.com/Fission-AI/contracts`
- `github.com/Fission-AI/billing-service`
- `github.com/Fission-AI/web-client`
- `github.com/Fission-AI/ios-client`

OpenSpec 解析本地 clone 并写入工作区文件。

##### agent 设置（Agent setup）

用户在他们的 agent 里打开这个协调工作区。

OpenSpec 生成的 agent 指令包含：

- initiative 摘要
- 可用的 root
- 归属映射
- 一条指引：对权威 spec 的编辑必须写回拥有的 root

##### 规划行为（Planning behavior）

当用户跑：

```text
/opsx:explore
```

或者

```text
/opsx:propose add-3ds
```

agent 读取：

- 工作区的 initiative 元数据
- 来自已挂载 root 的相关 spec
- 只限于选中的仓库/scope

##### 存储结果（Storage outcome）

与旅程 5 相同，只是用户不必先从一个仓库开始。

##### 为什么这个旅程重要（Why this journey matters）

有些用户会从一开始就刻意想让 initiative 住在任何单个仓库之外。

OpenSpec 应当直接支持这一点。

---

#### 旅程 6A：团队共享的多仓 initiative（Journey 6A: Team-Shared Multi-Repo Initiative）

##### 起始状态（Starting state）

一个团队知道这项工作跨多个仓库，并且会在数天或数周内涉及多个人。

他们创建或选择一个共享的协调仓库，例如：

```text
~/work/openspec-initiatives/
```

或者一个团队拥有的仓库，例如：

```text
github.com/Fission-AI/initiatives
```

在它内部，OpenSpec 创建：

```text
initiatives/
  add-3ds/
    .openspec-workspace/
      workspace.yaml
      initiative.md
      links.yaml
      agents/
        claude.md
        codex.md
```

##### 什么会被提交（What gets committed）

团队提交：

- initiative 摘要
- 稳定的项目 ID
- 选中的 scope
- 归属决定
- 链接起来的仓本地 change ID
- 上线与状态说明

##### 什么留在本地（What stays local）

每个队友把本地路径映射放在共享仓库之外，例如放在 OpenSpec 的本地 config/data 里：

- `github.com/Fission-AI/contracts` -> `/Users/alice/src/contracts`
- `github.com/Fission-AI/contracts` -> `/home/bob/work/contracts`

##### 队友的工作流（Teammate workflow）

每个队友：

1. clone 或 pull 这个共享协调仓库
2. 跑类似 `openspec workspace doctor` 或 `openspec workspace sync` 的命令
3. 把任何缺失的项目 ID 解析到本地 clone
4. 从共享协调工作区打开他们的 agent

##### agent 启动行为（Agent startup behavior）

OpenSpec 用以下内容生成 agent 指令：

- 已提交的共享 manifest
- 本地路径 overlay

这意味着每个队友看到同一个 initiative 结构，但配上他们自己有效的文件系统路径。

##### 为什么这重要（Why this matters）

这是「进入协调工作区」这句话的团队规模版本。

没有这个区分，这句话对一个人听起来自洽，但在共享规划上就崩了。

---

#### 旅程 6B：带显式 sponsor 的跨团队 initiative（Journey 6B: Cross-Team Initiative With Explicit Sponsor）

##### 起始状态（Starting state）

这项工作横跨：

- 平台/共享契约
- 后端服务
- 多个客户端
- 多个团队

##### 预期的设置（Expected setup）

OpenSpec 应当支持 initiative 被创建在一个由 sponsoring 或 driving 团队拥有的共享协调仓库里。

那个 sponsor 负责：

- 开启这个 initiative
- 链接参与的项目
- 追踪 initiative 状态
- 让归属决定保持可见

但 sponsor 并不自动拥有：

- 所有 spec
- 所有实现 change
- 那份权威共享契约

##### 例子（Example）

- 支付团队 sponsor `add-3ds`
- contracts 仓库拥有权威 checkout 契约
- web 团队拥有 web 实现 change
- iOS 团队拥有 iOS 实现 change
- billing 团队拥有后端实现 change

##### 用户体验（User experience）

当另一个团队成员打开那个共享协调工作区时，OpenSpec 应当把这一点说清楚：

```text
Initiative sponsor:
- payments-platform

Canonical shared contract owner:
- contracts

Participating owners:
- billing-service
- web-client
- ios-client
```

##### 为什么这重要（Why this matters）

没有这个，所谓「共享归属」就变得含糊，团队不知道自己读的是：

- 一份 sponsor 拥有的计划
- 一份权威契约
- 还是只是另一个团队的本地方解读

---

#### 旅程 7：只有部分仓库被 clone 时的多仓规划（Journey 7: Multi-Repo Planning When Only Some Repos Are Cloned）

##### 起始状态（Starting state）

用户想规划影响以下仓库的工作：

- contracts
- billing-service
- web-client
- ios-client

但本地只有：

- contracts
- web-client

##### 预期行为（Expected behavior）

OpenSpec 仍然应当允许规划。

它创建协调工作区并记录：

- `contracts` 与 `web-client` 的已解析 root
- `billing-service` 与 `ios-client` 的未解析状态

提示的感觉：

```text
Resolved locally:
- contracts
- web-client

Not currently available locally:
- billing-service
- ios-client

Planning can continue with partial context.
Implementation in unresolved roots will remain pending until linked.
```

##### agent 行为（Agent behavior）

agent 应当：

- 用已解析的仓库做具体规划
- 显式提到未解析的仓库
- 避免假装自己读过它们的 spec
- 如果有必要，在 initiative 追踪里生成待办占位

##### 存储结果（Storage outcome）

协调工作区里可能含有未解析的链接，例如：

```yaml
projects:
  - id: github.com/Fission-AI/contracts
    path: /Users/me/work/contracts
    status: resolved
  - id: github.com/Fission-AI/billing-service
    status: unresolved
  - id: github.com/Fission-AI/web-client
    path: /Users/me/work/web-client
    status: resolved
  - id: github.com/Fission-AI/ios-client
    status: unresolved
```

##### 为什么这重要（Why this matters）

这让规划在环境不完整时仍然有用。

在这里堵住规划会让这个功能变得脆弱。

这对大型团队也重要，因为并不是每个队友都会把每个参与的仓库 clone 下来或能访问。

---

#### 旅程 8：规划期间 spec 是怎么被读的（Journey 8: How Specs Are Read During Planning）

这是一条最重要的行为规则。

OpenSpec 永远不该盲目地读取所有 root 的所有 spec。

##### 单仓（Single repo）

读：

- 本地项目配置
- 与选中 scope 相关的本地 spec
- 只在有帮助时才读本地 change 历史

不要读：

- 默认不读不相关的本地 spec

##### Monorepo

读：

- 根项目配置
- 选中 scope 的 spec
- 如果被选中或被引用，读共享契约 spec

不要读：

- 不相关的 app/service/package

##### 多仓（Multi-repo）

读：

- 来自协调工作区的 initiative 元数据
- 已解析的已挂载 root 里的 spec
- 只读那些 root 里选中的 scope
- 如果用户或 agent 显式选择打开，才读信息性引用

不要读：

- 未解析 root 的 spec
- 每个仓库里的每一份 spec
- 如果那会让上下文爆炸，就不要自动读被引用的 spec

##### 信息性引用（Informational references）

引用应当这样出现：

```text
Related references:
- github.com/Fission-AI/contracts: openspec/specs/checkout/spec.md
- github.com/Fission-AI/web-client: openspec/specs/checkout/web/spec.md
```

agent 可以把它们当作导航提示。

它们不是校验的阻断项。

##### 共享契约的读取顺序（Shared contract read order）

当一个选中的 change 涉及共享契约时，OpenSpec 应当偏好这个读取顺序：

1. initiative 元数据，如果存在
2. 权威共享契约
3. 选中的消费者/本地 spec
4. 仓本地的 change artifact

这很重要，因为共享契约定义的是边界层面的真相，而本地 spec 描述每个消费者如何满足它们。

---

#### 旅程 9：artifact 是怎么存的（Journey 9: How Artifacts Are Stored）

这必须保持简单且确定。

##### 规则 1：权威 spec 住在拥有者那里（Rule 1: Canonical specs live with owners）

例子：

- 结账契约 spec 住在 `contracts`
- web 结账行为住在 `web-client`
- iOS 行为住在 `ios-client`

##### 规则 2：仓本地的 change 住在仓库拥有者那里（Rule 2: Repo-local changes live with repo owners）

例子：

- `contracts/openspec/changes/add-3ds-contract/`
- `web-client/openspec/changes/add-3ds-web/`

这些 change 是每个拥有仓库的执行产物。它们应当带上仓库特有的任务、delta spec 与本地实现状态。

##### 规则 3：initiative 层面的规划住在协调工作区里（Rule 3: Initiative-level planning lives in the coordination workspace）

例子：

- proposal.md
- design.md
- initiative 摘要
- 上线排序
- 跨仓假设
- 归属、里程碑、风险与依赖
- 仓本地 change 之间的链接

##### 规则 4：workspace 永远不成为权威 spec 存储（Rule 4: Workspace never becomes canonical spec storage）

协调工作区可以引用 spec 并摘要它们。

它不应当变成第二个 spec 真值来源。

##### 规则 5：只有归属明确之后，共享契约才是权威的（Rule 5: Shared contracts are canonical only after ownership is explicit）

如果一个跨边界行为还没有被指派权威拥有者，OpenSpec 应当把它作为 initiative 层面的草稿材料存放，而不是假装它已经是一份权威 spec。

##### 规则 6：共享协调工作区存放稳定的协作数据，而不是本地机器状态（Rule 6: Shared coordination workspaces store stable collaboration data, not local machine state）

如果一个协调工作区为了团队使用而被提交，它应当包含：

- 稳定的项目 ID
- 链接起来的 change
- 归属与 initiative 元数据

它不应当包含：

- `/Users/...` 路径
- `C:\\...` 路径
- 机器特有的已挂载 root 状态

那些信息属于本地 overlay 数据。

---

#### 旅程 10：跨 root 工作里的 `/opsx:apply`（Journey 10: `/opsx:apply` In Cross-Root Work）

实现的 UX 必须对工具的限制保持诚实。

##### 情况 A：agent 能跨 root 工作（Case A: Agent can work across roots）

用户在协调工作区里。

他们跑：

```text
/opsx:apply
```

OpenSpec 回应：

```text
This initiative has linked changes in:
- contracts
- billing-service
- web-client
- ios-client

Choose apply mode:
- Apply one linked change
- Apply in suggested sequence
```

建议的默认：

- 一次应用一个链接起来的 change

这让任务状态与实现上下文保持在可管理的规模。

##### 情况 B：agent 实际上只能单 root（Case B: Agent is practically single-root）

用户在协调工作区里并跑：

```text
/opsx:apply
```

OpenSpec 应当说：

```text
This initiative spans multiple repos.
Implementation must be run per repo in your current tool.

Next suggested step:
- open /Users/me/work/contracts and run /opsx:apply add-3ds-contract
```

##### 为什么这重要（Why this matters）

跨仓规划与跨仓实现不是同一种能力。

UX 绝不能假定所有 agent 都能把两者都做好。

---

#### 旅程 10A：在 monorepo 里创建一份共享契约（Journey 10A: Creating A Shared Contract In A Monorepo）

##### 起始状态（Starting state）

用户在一个 monorepo 里，其中有：

```text
platform/
  openspec/
  apps/web/
  apps/ios/
  apps/android/
  services/billing/
```

不存在已有的权威 `checkout` 共享契约。

##### 用户请求（User request）

用户输入：

```text
/opsx:propose add-3ds-checkout
```

agent 发现这个请求横跨：

- web
- iOS
- Android
- billing 后端

##### 预期的提示（Expected prompt）

```text
This looks like a cross-boundary behavior shared by multiple scopes.

Should OpenSpec treat this as:
- A shared contract
- Independent local changes only
- An initiative note for now
```

用户选择共享契约。

OpenSpec 然后问：

```text
Where should the canonical shared contract live?
- openspec/specs/contracts/checkout
- openspec/specs/shared/checkout
- keep it initiative-only for now
```

##### 预期的存储结果（Expected storage result）

OpenSpec 创建：

- 选定的共享 scope 里的权威共享契约
- monorepo 根下的仓本地 change
- 按需为选中的消费者 scope 生成本地 delta spec

##### 为什么这重要（Why this matters）

这让跨边界行为保持一个真值来源，而不是把同样的逻辑抹在 web、iOS、Android 与 backend 的 spec 上。

---

#### 旅程 10B：在多仓环境里创建一份共享契约（Journey 10B: Creating A Shared Contract In A Multi-Repo Environment）

##### 起始状态（Starting state）

用户正在规划一个涉及以下仓库的结账 initiative：

- `contracts`
- `web-client`
- `ios-client`
- `android-client`
- `billing-service`

不存在已有的共享结账契约。

##### 规划流程（Planning flow）

用户创建或进入一个协调工作区。

他们跑：

```text
/opsx:propose add-3ds
```

OpenSpec 检测到这很可能需要一份共享契约。

##### 预期的提示（Expected prompt）

```text
No canonical shared contract owner was found for this behavior.

Choose how to proceed:
- Create the canonical contract in an existing contracts repo
- Assign the contract to an existing domain owner repo
- Keep it as initiative-only for now
```

如果用户选择一个已有的 contracts 仓库，OpenSpec：

1. 在那个仓库里为共享契约创建一个仓本地 change
2. 把消费者的仓库 change 链接到它
3. 记录从消费者到权威契约的引用

如果用户让它只作为 initiative，OpenSpec：

1. 把跨边界行为的草稿存在 initiative 笔记里
2. 把它标记为非权威
3. 警告说：在它被提升为一份有归属的共享契约之前，长期的消费者行为不应依赖它

##### 为什么这重要（Why this matters）

这避免了一个糟糕的默认：随便哪个先发起这个 change 的应用团队，意外地变成了一个跨组织契约的长期拥有者。

---

#### 旅程 11：归档跨 root 的工作（Journey 11: Archiving Cross-Root Work）

##### 单仓或简单 monorepo（Single repo or simple monorepo）

与今天一样：

```text
/opsx:archive
```

##### 多仓 initiative（Multi-repo initiative）

在协调工作区里的用户跑：

```text
/opsx:archive
```

OpenSpec 检查链接起来的仓库 change：

- 已归档
- 可以归档
- 仍然活跃
- 未解析

提示的感觉：

```text
Initiative: add-3ds

Linked change status:
- contracts/add-3ds-contract: complete
- billing-service/add-3ds-billing: complete
- web-client/add-3ds-web: active
- ios-client/add-3ds-ios: unresolved

Archive options:
- Archive completed linked changes only
- Mark initiative partially complete
- Wait until all linked changes are done
```

##### 建议的行为（Recommended behavior）

允许部分完成状态。

跨仓工作常常是异步落地的。

---

#### 设置旅程（Setup Journeys）

设置路径需要感觉轻量。

#### 旅程 12：单仓用户的第零天设置（Journey 12: Day-Zero Setup For A Single Repo User）

##### 步骤（Steps）

1. `cd repo`
2. `openspec init`
3. 在仓库里打开 agent
4. 跑 `/opsx:propose`

不展示任何 workspace 概念。

---

#### 旅程 13：monorepo 团队的第零天设置（Journey 13: Day-Zero Setup For A Monorepo Team）

##### 步骤（Steps）

1. `cd monorepo`
2. `openspec init`
3. 可选地为主要的拥有区域加上 scope 标记
4. 跑 `openspec update`
5. 在 monorepo 根打开 agent

规划期间，OpenSpec 在需要时询问 scope 选择。

不需要单独的 workspace 管理步骤。

---

#### 旅程 14：多仓团队的第零天设置（Journey 14: Day-Zero Setup For A Multi-Repo Team）

##### 步骤（Steps）

1. 每个仓库各自跑 `openspec init`
2. 只有当跨仓工作出现时，用户才创建一个协调工作区
3. 用户按需把仓库 ID 链接到本地 clone
4. 用户在协调工作区里打开 agent 做规划

这很重要：

系统不应当要求一个平台团队在任何真正的工作开始之前，预先注册每一个仓库。

---

#### agent 指令要求（Agent Instruction Requirements）

当 OpenSpec 创建一个协调工作区时，它应当生成面向 agent 的文件。

最低内容：

1. initiative 摘要
2. 选中的 scope
3. 拥有的 root 与已解析的路径
4. 未解析的 root
5. 存储规则
6. 当前工具的实现限制（如果已知）

##### `claude.md` 示例（Example `claude.md`）

```md
You are working on initiative `add-3ds`.

Resolved roots:
- /Users/me/work/contracts
- /Users/me/work/web-client

Unresolved roots:
- github.com/Fission-AI/billing-service
- github.com/Fission-AI/ios-client

Ownership:
- contracts owns shared checkout contract
- web-client owns web checkout behavior

Rules:
- Canonical specs must be edited in owning roots
- Initiative-level notes live in this coordination workspace
- Cross-repo references are informational only
```

这个文件应当为任何能从确定性启动上下文中受益的、受支持的 agent 集成都生成一份。

---

#### 场景摘要（Scenarios Summary）

##### 顺畅路径（Happy paths）

1. 单仓，一个 change
2. Monorepo，一个 scope
3. Monorepo，多个 scope
4. 大型 monorepo，协调式 initiative
5. 多仓，所有 root 本地可用
6. 多仓，本地只有部分可用

##### 重要的过渡（Important transitions）

1. 一个单仓请求升级成多仓
2. 一个 monorepo 请求升级成协调式规划
3. 规划工作区交棒给仓本地实现
4. 归档时跨仓完成度不一
5. 只存在于 initiative 的共享行为被提升为一份权威共享契约

---

#### 边界情况（Edge Cases）

- **1. 用户从「错的」仓库开始（User starts in the "wrong" repo）** —— 例：用户从 `web-client` 开始，而工作其实横跨 `contracts`、`web-client`、`ios-client`。期望：OpenSpec 建议创建一个协调工作区；它不会把整个 initiative 埋进 `web-client`。
- **2. 用户想把 initiative 存到别处（User wants the initiative stored elsewhere）** —— 期望：允许显式选路径；如果有用，记住最近用过的工作区位置。
- **3. 两个本地 clone 匹配同一个仓库标识符（Two local clones match the same repo identifier）** —— 期望：提示用户选一个；可选地把偏好映射保存在本地。
- **4. 仓库标识符无法解析（Repo identifier cannot be resolved）** —— 期望：存成未解析；允许规划继续；只为那个 root 阻断实现。
- **5. monorepo 没有显式的 scope 元数据（Monorepo has no explicit scope metadata）** —— 期望：从结构与 spec 推断可能的 scope；让用户确认；之后可提议把这份选择模型保存下来。
- **6. scope 选择太宽（Scope selection is too broad）** —— 期望：警告用户会有很多 scope 被拉进规划；建议收窄。
- **7. 共享契约的归属含糊（Shared contract ownership is ambiguous）** —— 期望：要求给出一个权威拥有者；其它 scope/仓库可以引用它，但不会被隐式地共同拥有。
- **7A. 没有哪个已有共享拥有者说得通（No existing shared owner makes sense）** —— 期望：让团队暂时把这个行为保持为 initiative；显式标记为草稿且非权威；如果它开始表现得像一份长期契约，之后再提示提升。
- **8. agent 无法真正跨 root 工作（Agent cannot truly work across roots）** —— 期望：协调工作区只用于规划；引导用户进入逐个 root 的 apply 流程。
- **9. workspace 变陈旧（Workspace goes stale）** —— 例：仓库在磁盘上被移动、被改名、remote URL 变了。期望：`openspec workspace doctor` 或同等命令重新链接 root；initiative 元数据保持稳定，因为标识符耐久、路径不耐久。
- **10. 某个仓库被归档或被有意推迟（One repo is archived or intentionally deferred）** —— 期望：initiative 可以保持部分完成；并不是每个链接的 root 都必须同时落地。
- **11. 用户不想要巨型 monorepo 里的中央管理式设置（Users do not want admin-managed setup in giant monorepos）** —— 期望：scope 发现应当是本地且增量的；设置不应当要求先由一个中央团队定义一切。
- **12. 用户只想做一次临时多仓工作（Users want ad hoc multi-repo work only once）** —— 期望：允许一次性的协调工作区；不要强推长期的工作区管理。
- **13. 团队想共享一个协调工作区（Teams want to share a coordination workspace）** —— 期望：支持一个已提交的共享协调仓库或工作区；把机器特有的解析数据留在本地；让每个队友独立解析项目 ID。
- **14. 跨团队 initiative 需要不同的归属角色（Cross-team initiatives need different ownership roles）** —— 期望：区分 initiative sponsor 与权威共享契约拥有者；让两者都在工作区元数据与 agent 指令里可见。

---

#### 这套 UX 蕴含的产品决定（Product Decisions This UX Implies）

如果 OpenSpec 采纳这些旅程，会得出若干设计结论。

##### 1. 多仓规划需要一块一等的协调工作区（1. Multi-repo planning needs a first-class coordination workspace）

没有它，OpenSpec 就无法诚实回答用户该站在哪里、跨仓 initiative 该住在哪里。

##### 2. 仓本地 change 与权威 spec 应当留在拥有者那里（2. Repo-local changes and canonical specs should stay in owners）

没有它，OpenSpec 会造出重复或误导性的真值来源。

##### 3. 大型 monorepo 不能被当作永远简单的单个 root（3. Large monorepos cannot be treated as always-simple single roots）

OpenSpec 必须同时支持：

- 单 root 的 monorepo change
- 协调式的 monorepo initiative

##### 4. 发现与解析是两个系统（4. Discovery and resolution are different systems）

OpenSpec 必须分开处理：

- 识别 scope
- 为耐久的项目标识符解析本地路径

##### 5. agent 的启动上下文需要显式生成（5. Agent startup context needs explicit generation）

只有当 OpenSpec 为 agent 写出确定性的工作区上下文时，跨 root 规划才能可靠工作。

##### 6. v1 里引用应当保持信息性（6. References should stay informational in v1）

如果 OpenSpec 默认校验跨 root 引用，它实际上就等于发布了依赖图系统。

那应当是之后的一个可选能力。

##### 7. 共享契约的创建需要一套有引导的归属流程（7. Shared contract creation needs a guided ownership flow）

没有它，团队要么：

- 在各仓库之间重复共享行为
- 意外指派了归属
- 要么干脆避开创建跨边界 spec

OpenSpec 应当帮用户在以下选择里挑：

- 已有的共享拥有者
- 已有的领域拥有者
- 新建的共享契约 scope
- 只作为 initiative 的草稿模式

##### 8. 共享协调需要一个两层存储模型（8. Shared coordination needs a two-layer storage model）

为了干净地支持团队与组织，OpenSpec 应当区分：

- 已提交的共享 initiative 元数据
- 本地机器特有的路径解析

没有这个切分，UX 要么：

- 无法扩展到单个用户之外，要么
- 把机器特有的状态泄漏进共享 artifact

---

#### 待解问题（Open Questions）

这些旅程有意留下了一些实现选择。

1. 协调工作区应当总是在磁盘上对用户可见，还是可以可选地住在 OpenSpec 的全局数据目录里？
2. monorepo 的协调式 initiative 应当复用与多仓相同的 workspace 概念，还是用一个更轻的仓内变体？
3. OpenSpec 应当支持嵌套的 `openspec/` root，还是保持单个 root 并把 scope 单独建模？
4. 表示选中的 scope 与链接起来的 change，所需的最小元数据是什么？
5. 已提交的共享工作区状态与本地 overlay 状态之间，确切的格式切分是什么？
6. 哪些 agent 应当收到生成的工作区指令，用什么格式？
7. 确切的 CLI 表面应当是什么样，用来创建与管理协调工作区？

---

#### 建议的下一步（Recommended Next Step）

把这些旅程转换成一份具体的设计提案，覆盖：

1. 协调工作区的文件格式
2. scope 元数据的形状
3. 仓库标识符与本地解析模型
4. 链接 change 的模型
5. 共享 manifest 与本地 overlay 的模型
6. create、attach、doctor、sync 与 archive 这几条流程的 CLI 命令
7. 为受支持的工具生成 agent 指令

### 42.5 workspace-ux-simplification.md —— 工作区 UX 简化

源文件标题：`# Workspace UX Simplification`

#### 目的（Purpose）

本文聚焦一个 UX 目标：

> OpenSpec 应当只有一条默认路径、一条升级路径，并且除非系统确实需要用户做决定，否则对用户少暴露一些显式概念。

这是 `workspace-user-journeys.md` 的后续。那份文档对完整性有用，但它太早暴露了太多概念模型。

本文讲的是产品应当**感觉**成什么样。

---

#### UX 问题（The UX Problem）

当前那份用户旅程探索是自洽的，但第一次接触时太重。

主要问题是：

1. 在用户还没做任何事之前，就冒出太多概念：
   - scope
   - project
   - owning root
   - shared contract owner
   - coordination workspace
   - initiative sponsor
   - shared manifest vs local overlay

2. 跨 root 的工作感觉像工作流重启：
   - 用户从一个仓库开始
   - OpenSpec 说这是多仓
   - 用户创建一个 workspace
   - 用户在那里重新打开 agent
   - 用户实际上等于重新开始

3. 关于共享契约的决定被问得太显式、太早。

4. 团队规模的协调在概念上是对的，但读起来更像基础设施搭建，而不是一个轻量工作流。

这个系统内部是干净的，但产品体验应当更渐进。

---

#### 设计目标（Design Goal）

用户应当感觉：

- 「我就从我在的地方开始」
- 「OpenSpec 自己判断这件事是留在本地还是需要扩张」
- 「如果要扩张，它带着我往前走，而不是让我重开一次」
- 「只有当 OpenSpec 真的需要我做一个决定时，我才看到高级概念」

---

#### 核心 UX 形状（The Core UX Shape）

##### 一条默认路径（One default path）

默认路径应当永远是：

1. 进入一个仓库或 monorepo 根
2. 跑 `/opsx:explore` 或 `/opsx:propose`
3. 除非有强理由不这么做，OpenSpec 就在本地规划

这应当适用于：

- 单仓
- 普通的 monorepo 工作
- 许多处境下的许多用户

默认假设应当是：

> 在证明不是之前，这就是一个本地 change。

##### 一条升级路径（One escalation path）

唯一的升级路径应当是：

> 这项工作足够强地横跨多个被拥有的区域，以至于 OpenSpec 需要把它升级成一个协调 initiative。

这种升级可能因为：

- 大型 monorepo 的跨团队工作
- 真正的多仓工作
- 创建一份跨边界的共享契约

重要的 UX 点是：这些感觉上应当都是同一种升级：

- 「OpenSpec 正在把这件事升级成一个协调 initiative」

而不是：

- 多仓一套流程
- 大型 monorepo 另一套流程
- 共享契约又一套流程

---

#### 渐进式披露（Progressive Disclosure）

用户不应当一开始就必须理解完整的数据模型。

##### 默认就应当让用户看到的概念（Concepts users should see by default）

一开始，用户主要应当看到：

- change
- affected area
- 如果相关，也许还有 repo

对第一步规划来说这就够了。

##### OpenSpec 应当保持隐式、直到需要的概念（Concepts OpenSpec should keep implicit until needed）

这些通常应当藏到升级时才出现：

- scope
- coordination workspace
- initiative
- shared contract owner
- sponsor/driver
- manifest vs local overlay

##### 只有真的需要决定时，OpenSpec 才应当展示的概念（Concepts OpenSpec should only show when a real decision is needed）

只在行动的那一刻展示这些：

- 「这横跨多个仓库。要创建一个协调 initiative 吗？」
- 「这看起来是共享行为。权威契约应当住在哪里？」
- 「这个 initiative 是团队共享的。你想把它提交到一个共享协调仓库里吗？」

系统不应当把这些概念当作理论预先灌给用户。

---

#### 最简单的用户故事（The Simplest User Story）

这是 UX 应当优化的基线故事。

##### 故事（Story）

用户在一个仓库里，输入：

```text
/opsx:propose add-3ds
```

OpenSpec 应当：

1. 检视本地上下文
2. 推断可能受影响的区域
3. 只在必要时请求确认
4. 立刻继续

用户应当感觉自己只做了一件事：

```text
I am proposing a change.
```

而不是：

```text
I am selecting between multiple planning abstractions.
```

---

#### 升级的故事（The Escalation Story）

如果 OpenSpec 意识到这项工作不再只是本地的，它应当以一个动作完成升级。

##### 期望的感觉（Desired feel）

```text
This change affects multiple owned areas.
I can upgrade it into a coordinated initiative and carry your current planning context forward.
```

这个措辞很重要。

它应当感觉像：

- 一次升级
- 一次延续
- 一个便利

它不应当感觉像：

- 一个错误
- 一次硬停
- 一个单独的设置工作流

##### 升级期间应当发生什么（What should happen during escalation）

如果需要升级，OpenSpec 应当尽可能自动地做：

1. 把当前的 change 名/描述带过去
2. 保留已经推断出的受影响区域
3. 创建协调产物
4. 解析它能解析的本地 root
5. 生成 agent 指令
6. 然后告诉用户下一步

##### 升级 UX 的例子（Example escalation UX）

```text
This work spans multiple owned areas:
- contracts
- billing-service
- web-client
- ios-client

OpenSpec can upgrade this into a coordinated initiative.

Suggested next step:
- create a coordination workspace at ~/work/openspec-workspaces/add-3ds

I’ll carry forward:
- your current change description
- affected repos
- any planning notes already gathered
```

这比让用户觉得自己必须重开一次要好得多。

---

#### 最小的决定集（The Minimum Decision Set）

当 OpenSpec 不得不问问题时，它应当问最小的有用集合。

##### 决定 1：这是本地的还是协调的？（Decision 1: Is this local or coordinated?）

最重要的产品问题。

面向用户的形式：

```text
This appears to span multiple owned areas.

How should I proceed?
- Keep this as one local change
- Upgrade to a coordinated initiative
```

这应当少用，只在含糊真的重要时才用。

##### 决定 2：哪些区域受影响？（Decision 2: What areas are affected?）

面向用户的形式：

```text
Which areas are affected?
```

这比先问用户「scopes」要直观得多。

内部这确实是 scope 选择，但除非高级用户想要，用户不需要这个词。

##### 决定 3：这是共享行为吗？（Decision 3: Is this shared behavior?）

只在 OpenSpec 有强证据表明存在跨边界契约时才问。

面向用户的形式：

```text
This looks like behavior that multiple areas need to follow.

Should I treat this as:
- local changes only
- a shared contract
- draft coordination notes for now
```

##### 决定 4：共享归属应当住在哪里？（Decision 4: Where should shared ownership live?）

只在用户确认了共享契约行为、并且不存在明显的已有拥有者时才问。

面向用户的形式：

```text
Where should the canonical shared contract live?
```

这应当出现得晚，而不是早。

---

#### 建议的术语（Recommended Terminology）

内部模型可以使用许多精确的词。UI 应当使用更简单的词。

##### 面向用户的 UX 里优先使用（Prefer in user-facing UX）

- 默认用「area」而不是「scope」
- 用「coordinated initiative」而不是「workspace model」
- 用「shared contract」而不是「cross-boundary canonical spec」
- 用「owner」而不是「owning root」
- 用「team-shared initiative」而不是「shared coordination manifest」

##### 留给高级 UX 或文档（Reserve for advanced UX or docs）

- scope
- project root
- local overlay
- sponsor/driver
- coordination workspace

这些词有用，但不适合作为用户必须最先吸收的东西。

---

#### 建议的默认行为（Recommended Default Behavior）

为了让 UX 直观，OpenSpec 应当积极地替用户选默认值。

##### 默认 1：留在本地（Default 1: Stay local）

除非有强证据表明不然，规划就留在当前 root。

##### 默认 2：推断受影响的区域（Default 2: Infer affected areas）

OpenSpec 应当从以下来源推断受影响的区域：

- 请求的措辞
- 当前仓库
- 已知的 spec 布局
- 最近的 initiative 上下文

只在含糊有意义时才问用户。

##### 默认 3：复用已有的共享拥有者（Default 3: Reuse existing shared owners）

如果已经存在一个共享契约拥有者，OpenSpec 应当建议它，而不是问一个抽象的归属问题。

##### 默认 4：把未解析的 root 当作部分可用，而不是致命（Default 4: Treat unresolved roots as partial, not fatal）

对于协调 initiative，未解析的仓库不应当阻断规划，除非用户明确需要立刻在那里实现。

##### 默认 5：只有当协作是真的时才做团队共享（Default 5: Team-shared only when collaboration is real）

不要为单人或探索性工作强推团队/共享设置。

OpenSpec 可以先从一个本地协调工作区开始，之后再提议：

```text
This now looks collaborative. Do you want to move it into a shared coordination repo?
```

---

#### 怎么让团队 UX 感觉轻（How To Make Team UX Feel Light）

团队的故事不应当感觉像一场管理仪式。

##### 期望的团队体验（Desired team experience）

1. 一个人正常地开始规划
2. 如果需要，OpenSpec 升级成一个协调 initiative
3. 当工作变得需要协作时，OpenSpec 提议把它变成团队共享
4. 队友 clone 这个 initiative 仓库，并跑一条链接命令
5. 所有人都从同一份共享 initiative 上下文开始

##### 团队上手应当感觉像这样（Team onboarding should feel like this）

```text
Clone the initiative repo.
Run `openspec workspace doctor`.
Open your agent here.
```

而不是像这样：

```text
Learn a new planning model, understand manifests, configure overlays, and attach roots manually.
```

实现可能需要那些概念，但 UX 应当把它们压缩成几个动作。

---

#### 提示词的 UX 经验法则（UX Heuristics For Prompting）

如果 OpenSpec 能推断出一个合理的默认值，它就应当避免让用户以抽象方式给工作分类。

##### 好的提示（Good prompt）

```text
This affects:
- web checkout
- billing API
- shared checkout behavior

I think this should become a coordinated initiative.
Proceed?
```

为什么这是好的：

- 具体
- 带着建议
- 认知负担低

##### 较弱的提示（Weaker prompt）

```text
Would you like to create a coordination workspace with linked changes and shared ownership metadata?
```

为什么这更弱：

- 暴露了太多内部机制
- 用户得先解析产品架构才能说「是」

##### 好的归属提示（Good ownership prompt）

```text
I found an existing shared contracts area: `contracts/checkout`.
Use that as the canonical owner?
```

##### 较弱的归属提示（Weaker ownership prompt）

```text
Choose a canonical shared contract owner for this cross-boundary behavior.
```

后者更精确，但太抽象，除非用户已经深入这套工作流。

---

#### 我们应当追求的那种体验（The Experience We Should Aim For）

默认情况下，OpenSpec 应当感觉像：

- 「从这里开始」
- 「描述这项工作」
- 「除非需要你的判断，我来处理形状」

当系统升级时，它应当感觉像：

- 「这件事变得超出了一个本地 change」
- 「我已经替你准备好了协调式的设置」
- 「这是下一步显而易见要做的事」

当协作扩张时，它应当感觉像：

- 「这现在是团队共享的了」
- 「把稳定的计划提交进去」
- 「每个人都链接自己的本地 clone」

用户不应当感觉自己一直在切换概念框架。

---

#### 对那份旅程文档的建议后续改动（Recommended Follow-Up Changes To The Journeys）

为了让 `workspace-user-journeys.md` 更简单、更直观，下一版应当：

1. 把最简单的单仓与 monorepo 旅程挪到最前面。
2. 把大部分术语与内部模型章节挪到后面，或者挪进附录。
3. 把「coordination workspace」重新表述成一个升级产物，而不是一个起始抽象。
4. 在面向用户的例子里，把许多「scope」换成「area」。
5. 把抽象的归属问题改成建议优先的提示。
6. 把团队规模的设置压缩成一个简单的故事：
   - 共享 initiative 仓库
   - 本地链接命令
   - 在这里打开 agent
7. 让升级流程显式保留用户上下文，好让它读起来像延续，而不是重启。

---

#### 小结（Summary）

当前关于 workspace 的思考在方向上是对的，但 UX 应当变得更有主见，并且一开始少解释得多。

最简单的产品形状是：

- 一条默认路径：从用户已经在的地方做本地规划
- 一条升级路径：需要时升级成一个协调 initiative
- 渐进式披露：只有当 OpenSpec 需要真的做决定时，才展示高级概念

如果 OpenSpec 把这件事做好，同一套系统可以对以下使用者都显得直观：

- 单人用户
- 小团队
- 大型 monorepo
- 多仓团队
- 跨团队 initiative
