## 43 initiatives —— 已退役那一代

> 译自 `reference/openspec/openspec/initiatives/context-store-and-initiatives/`（7 个根文件合计 2,359 行：`README.md` 58 / `.initiative.yaml` 27 / `direction-git-native-work.md` 472 / `direction.md` 458 / `roadmap.md` 775 / `tasks.md` 321 / `decisions.md` 225 / `questions.md` 23；另加 `work-items/` 下 20 个目录共 56 个文件、5,573 行）。按 `READING-openspec.md` 第 43 项：**这一代已被作者自己判为历史**。本目录自己的 `README.md` 第一行状态就写着 `Status: transition evidence / beta history.`，第二段写明 `It is not the active product roadmap or implementation queue.`，并把读者指向 `work/`（即第 44 项）。因此本篇与第 44 项对照读：44 是新形态，43 是被砍掉的那一版长什么样。
>
> 子节顺序不按文件列表，而按本目录 `README.md` 自己的 `## Reading Order` 排列（`direction-git-native-work.md` → `direction.md` → `roadmap.md` → `tasks.md` → `decisions.md` → `questions.md` → `work-items/<id>/`），`README.md` 与 `.initiative.yaml` 置于最前。
>
> **压缩说明：**43.1 – 43.8 的七个根文件全部全译。43.9 的 20 个 work item **不逐条全译**：只译每个 work item 共同携带的**形态**（`plan.md` / `tasks.md` / `evidence.md` 三个文件各自是什么），加上其中**一个**代表性 work item（`07-add-agent-first-initiative-discovery`，主题是 agent handoff / discovery，与 agent 相关）的 `plan.md`、`tasks.md`、`evidence.md` 三份文件全文；其余 19 个只按名字列出，各附一行取自各自 `plan.md` 的释义。
>
> 代码块处理规则：`text` / `bash` / `json` / `yaml` / `ts` 围栏标记、目录树、ASCII 图、命令、路径、flag、JSON 键名全部原样保留。`text` 围栏内若是**散文**（产品边界声明、词汇表）则译出并置于原文块之后；若是目录树或示意图则一并原样保留不再重排。任务清单的 `- [x]` / `- [ ]` 标记与编号原样保留，只译任务描述。

### 43.1 `README.md`

> 源文件：`reference/openspec/openspec/initiatives/context-store-and-initiatives/README.md`

**Context Store 与 Initiative**

状态：transition evidence / beta history。

本目录保存 beta 时期的 context-store 与 workspace 方向、探索它时所做的决定，以及导向更简单的 Git-native 模型的那些证据。

它不是现行的产品路线图，也不是实现队列。要看当前方向，从以下两个文件开始：

1. `openspec/work/simplify-context-and-workspace-model/goal.md`
2. `openspec/work/simplify-context-and-workspace-model/roadmap.md`

`direction-git-native-work.md` 这份笔记是导向当前 goal 的那份过渡笔记。如果它与当前的 `goal.md` 冲突，以当前的 `goal.md` 为准。

#### 阅读顺序

在研究 beta 历史时，使用这个阅读顺序：

1. `direction-git-native-work.md` 解释从旧的 beta 模型走向 Git-native specs 与 work 的过渡。
2. `direction.md` 保存更早的 context-store 与 initiative 方向。
3. `roadmap.md` 保存历史性的 beta 路线图快照。
4. `tasks.md` 保存历史性的 initiative 全局进度。
5. `decisions.md` 记录 beta 期间已接受的决策。
6. `questions.md` 追踪当时仍处于开放状态的问题。
7. `work-items/<id>/` 包含某一条历史路线图条目的执行笔记。

#### 边界

这些 artifact 保存旧模型的产品意图、路线图决策与 beta 证据。OpenSpec 的 spec 描述的是代码背后当前的行为契约。

在行为随某个实现 slice 一起改变之前，不要为未来意图改写 spec。

更早的产品边界是：

```text
Context stores sync truth.
Collections shape truth.
Initiatives coordinate work.
Workspaces open local views.
Changes implement repo-owned slices.
```

（译文：context store 同步真值。collection 塑造真值。initiative 协调工作。workspace 打开本地视图。change 实现 repo 拥有的切片。）

更新的方向是：

```text
OpenSpec is a Git-native artifact format for specs and work.

Specs are what is true.
Work is what is in motion.
```

（译文：OpenSpec 是 specs 与 work 的 Git-native 产物格式。Specs 是「什么是真的」。Work 是「什么正在动」。）

### 43.2 `.initiative.yaml`

> 源文件：`reference/openspec/openspec/initiatives/context-store-and-initiatives/.initiative.yaml`

```yaml
version: 1
id: context-store-and-initiatives
title: Context Store And Initiatives Direction
status: exploring
summary: >
  Define the direction for a synced context store, mounted collections,
  initiatives, local workspaces, and repo-local changes.
owners: []
artifacts:
  readme: README.md
  direction: direction.md
  roadmap: roadmap.md
  tasks: tasks.md
  decisions: decisions.md
  questions: questions.md
  work_items: work-items/
linked_changes:
  - change: workspace-reimplementation-roadmap
    relationship: informs
  - change: workspace-agent-guidance
    relationship: reframes
  - change: workspace-apply-repo-slice
    relationship: reframes
  - change: workspace-verify-and-archive
    relationship: reframes
links: []
metadata: {}
```

`summary` 译文：为一个同步的 context store、挂载式 collection、initiative、本地 workspace 与 repo-local change 定义方向。

### 43.3 `direction-git-native-work.md`

> 源文件：`reference/openspec/openspec/initiatives/context-store-and-initiatives/direction-git-native-work.md`

**Git 原生的 Specs 与 Work 方向**

这份笔记记录在 initiative、workspace、context-store 与多 repo 规划的讨论之后得出的当前产品方向。

正面的形态是：

```text
OpenSpec is a Git-native artifact format for specs and work.

Specs are what is true.
Work is what is in motion.
```

（译文：OpenSpec 是 specs 与 work 的 Git-native 产物格式。Specs 是「什么是真的」。Work 是「什么正在动」。）

OpenSpec 的 artifact 以文件形式存在于 Git 中。那个 Git repo 可以是代码 repo、规划 repo 或契约 repo。OpenSpec 不应在这些文件之外引入另一套权威状态系统。

#### 核心形态

优先选用的未来形态是：

```text
openspec/
  README.md
  openspec.yml
  specs/
  work/
```

- `specs/` 描述已接受的行为。
- `work/` 描述正在推进中的预期工作。

无论 OpenSpec root 位于代码旁边，还是位于专门的规划 repo 或契约 repo 中，这个形态都应当相同。

```text
app-repo/
  openspec/
    specs/
    work/

planning-repo/
  openspec/
    specs/
    work/
```

不存在针对 “repo-local”、“external”、“workspace”、“context store” 或 “multi-repo” artifact 的独立产品模式。位置选择只等于一件事：OpenSpec 文件放在哪个 Git repo 里。

#### 词汇

先用一套小词汇：

```text
Spec       current accepted behavior
Work       intended effort in motion
Change     work that applies concrete deltas to targets
Initiative work that coordinates or decomposes other work
Target     repo, service, package, path, or system where work lands
```

（译文：Spec 当前已接受的行为。Work 正在推进中的预期工作。Change 把具体 delta 施加到 target 上的 work。Initiative 协调或分解其它 work 的 work。Target work 落地的 repo、service、package、path 或 system。）

用户不应被要求把 `context store`、`project`、`workspace`、`artifact home` 或 `index` 当作主要产品名词来学习。

#### 领域术语

在解释近期产品时使用这些术语：

```text
OpenSpec root
  The `openspec/` directory that contains specs, changes, work, and config.

In-project OpenSpec
  OpenSpec initialized inside the project repo it helps describe.

Standalone OpenSpec repo
  A separate Git repo whose main purpose is to hold OpenSpec artifacts.

Target project repo
  A code repo that a change or work item applies to.

Local repo map
  Private local resolution from a target repo id to a checkout path.

Workspace view
  Legacy or beta local-view language. In the new direction, this should reduce
  to a local repo map plus an optional focused OpenSpec root or work item.
```

（译文：**OpenSpec root** —— 包含 specs、changes、work 与 config 的那个 `openspec/` 目录。**In-project OpenSpec** —— 初始化在它所描述的那个 project repo 内部的 OpenSpec。**Standalone OpenSpec repo** —— 一个独立的 Git repo，其主要用途就是承载 OpenSpec artifact。**Target project repo** —— 某个 change 或 work item 所施加到的代码 repo。**Local repo map** —— 从 target repo id 到 checkout path 的私有本地解析。**Workspace view** —— legacy 或 beta 的本地视图语言。在新方向下，它应缩减为一个 local repo map，加一个可选的、被聚焦的 OpenSpec root 或 work item。）

示例：

```text
In-project OpenSpec:

app-repo/
  openspec/
    specs/
    changes/

Standalone OpenSpec repo:

app-openspec-repo/
  openspec/
    specs/
    changes/

Target project repo:

app-repo/
  src/
  tests/
```

产品应避免用 `repo-local` 这个词来表达这一区分。把「OpenSpec 住在这个 project repo 里」和「这份 work 以这个 repo 为目标」搞混太容易了。

产品也应避免把 `workspace` 变成主要面向用户的名词。剩下的活儿更简单：把 target repo id 映射到本地 checkout path，好让 agent 与命令能在这台机器上组装出相关的 Git repo。

#### Work 是原语

`work/` 是承载不同规模工作单元的唯一常规区域。

```text
openspec/
  specs/
    auth/session-limits.md
  work/
    add-login-rate-limit/
      work.yaml
      proposal.md
      tasks.md
      deltas/
    checkout-modernization/
      work.yaml
      README.md
```

一个 change 就是带有 change 能力的 work：

```yaml
id: add-login-rate-limit
kind: change
status: proposed
targets:
  - repo: app
```

一个 initiative 也是 work：

```yaml
id: checkout-modernization
kind: initiative
status: active
children:
  - work: add-login-rate-limit
  - work: add-checkout-tax
```

change 与 initiative 之间的区分不应来自 artifact 住在哪个顶层文件夹里，而应来自 metadata 与能力：

- 带 targets 与 deltas 的 work 可以校验这些 delta 并将其归档进 `specs/`。
- 带 children、dependencies 与 context 的 work 可以协调并汇总其它 work。
- 有些 work 可能既是 change 形状，也是协调形状。

#### Git 是真值来源

OpenSpec 应保持 Git-native：

- 历史来自 Git。
- 评审使用常规的 Git 与 forge 流程。
- diff 就是普通的文件 diff。
- 外部规划意味着另一个 Git repo，而不是另一套状态系统。
- 索引、仪表盘、状态汇总与编排都是派生视图。

forge 特有的状态，例如 pull request 状态、CI、评审批准或合并状态，可以由 adapter 读取。那种状态不应变成与 OpenSpec 竞争的另一套真值。

#### Targets

文件系统位置不应隐含实现目标。work 自己声明它落在哪里。

```yaml
targets:
  - repo: api
  - repo: web
```

target 以后可以指向 repo、service、package、path、外部系统或 monorepo 子树。格式里早早使用复数 `targets`，即使某些 MVP 生命周期命令只支持一个 target。

#### 嵌套与引用

规则是：

```text
Nest within a repo.
Reference across repos.
```

（译文：在同一个 repo 内嵌套。跨 repo 则引用。）

在同一个 Git repo 内部，当嵌套关系是真实关系时，work 可以嵌套：

```text
app-repo/
  openspec/
    work/
      checkout-modernization/
        work.yaml
        work/
          add-login-rate-limit/
```

跨越 Git repo 边界时，work 通过稳定的身份引用其它 work：

```yaml
id: checkout-modernization
kind: initiative
children:
  - repo: api
    work: add-tax-api
  - repo: web
    work: update-checkout-ui
```

这样既让每个 repo 的可执行 work 贴近它所影响的代码，又仍然允许一个规划 repo 或契约 repo 去协调更大的工作。

work 的身份必须来自 metadata，而不是来自路径。文件夹路径可以帮助人浏览；它们不应成为 work 的持久身份。

#### 依赖与排序

多 repo 的复杂度主要在于排序，而不在于文件夹摆放。

OpenSpec 应能在 Git 中记录依赖意图：

```yaml
depends_on:
  - work: publish-tax-contract
```

未来的视图可以回答：

- 这份大工作如何分解？
- 什么必须先发生？
- 哪些 target 受影响？
- 哪些团队拥有这些切片？
- agent 需要什么周边上下文？

自由的 artifact 格式应能描述顺序与依赖。强制排序、卡住合并、或汇总实时 forge 状态的自动化，可以留作一个派生的编排层。

#### MVP 含义

近期的发布路径应让现有的 OpenSpec 基线继续工作：

```text
openspec/
  README.md
  openspec.yml
  specs/
  changes/
```

第一层心智模型是：

```text
Specs = what is true.
Changes = what should change.
```

（译文：Specs = 什么是真的。Changes = 什么应当改变。）

近期工作不应要求未来的 `work/` 布局。`change` 仍然重要，因为 change 会施加 delta。`work/` 模型是未来的布局方向，而不是让独立 OpenSpec repo 变得有用的前提。

#### 路线图

##### 1. 保留当前基线

让现有的 in-project OpenSpec 流程继续可用且可理解：

```text
app-repo/
  openspec/
    specs/
    changes/
```

第一个发布目标不是把所有东西改名，而是让当前模型变得无聊且可靠。

##### 2. 让位置选择显式化

教给产品语言：

```text
OpenSpec can live inside your project repo,
or in its own Git repo.
```

（译文：OpenSpec 可以住在你的 project repo 里，也可以住在它自己的 Git repo 里。）

使用：

- `in-project OpenSpec` 指 `app-repo/openspec/`
- `standalone OpenSpec repo` 指 `app-openspec-repo/openspec/`

避免用 `repo-local` 作为这一区分的对用户说法。

##### 3. 支持独立 OpenSpec repo

允许 OpenSpec 在一个不承载应用代码的 Git repo 中被初始化与校验：

```text
app-openspec-repo/
  openspec/
    specs/
    changes/
```

这应当使用与 in-project OpenSpec 相同的 parser、template、校验与 archive 概念。独立 repo 不是一套新的状态系统。

##### 4. 加入 target project repo 解析

独立 OpenSpec repo 需要描述 change 落在哪里：

```yaml
targets:
  - repo: app
```

第一个 slice 可以让 target 解析保持简单：

- 注册本地 target repo
- 校验被引用的 target 确实存在
- 清晰地报告未解析的 target
- 让 agent 知道涉及哪个 OpenSpec repo 与哪些 target repo

先不要 clone、branch、sync、编排或推断复杂的 repo 状态。

这是更大的 workspace-view 概念被简化后的后继者。现有的 workspace beta 行为可以作为兼容性保留，但新方向应把 local repo mapping 作为产品形态。

##### 5. 加入跨 repo 上下文与 doctoring

一旦独立 OpenSpec repo 能指向 project repo，就为相关上下文加入面向读取的支持：

- doctor 检查缺失的 target repo 映射
- 面向 agent 的本地路径映射
- 需要时对其他 OpenSpec repo 的只读引用
- 清晰输出说明每个 artifact 归哪个 Git repo 所有

远程 Git URL 支持、pull/push 辅助、状态仪表盘与排序强制可以以后再做。

##### 6. 向 `work/` 演进

在基线与独立 repo 流程都稳固之后，引入未来的布局方向：

```text
openspec/
  specs/
  work/
```

到那时：

- 现有的 `changes/` 可以作为 legacy 被支持或被迁移
- change 变成 change 形状的 work
- initiative 变成协调形状的 work
- 依赖与排序视图可以建立在稳定的 work 身份之上

不要让 `/work` 卡住独立 OpenSpec repo 的发布。

#### 考虑过的决策

##### 把 `changes/` 与 `initiatives/` 分开

作为优先的未来形态被否决：

```text
openspec/
  changes/
  initiatives/
```

这是用文件夹当类型系统，会让 change 与 initiative 显得人为地互不相关。更干净的模型是一棵 `work/` 树，change 与 initiative 是 work 的两种形状。

##### 由 initiative 拥有的 change 文件夹

作为常规存储被否决：

```text
openspec/
  initiatives/
    checkout-modernization/
      changes/
        add-tax-api/
```

这会让 initiative 的所有权看起来成了生命周期的所有权。一个更大的工作单元可以协调一个更小的，但更小的那个单元仍然有自己的身份、targets、deltas 与生命周期。

##### 把 project 或 repo 桶当作生命周期 root

作为默认被否决：

```text
projects/
  api/
    openspec/
      changes/
  web/
    openspec/
      changes/
```

当每个 artifact 干净地归属于某一个 repo 时，repo 桶是好用的，但一遇到跨 repo 工作、共享契约、monorepo 以及横跨多个 target 的 initiative，它们就变得别扭。repo 应当是 target，而不是强制的生命周期 root。

##### 把有状态的 context store 当作核心原语

作为核心框架被否决。

一个专门的规划 repo 或契约 repo 可以承载 OpenSpec artifact，但它仍然是一个 Git repo。OpenSpec 不应创建一个可能与 Git 相冲突的独立权威 store。

##### 可配置的布局模式

作为 MVP 产品形态被否决。

自定义布局模式会迫使每个工具、每份文档与每条 agent 指令都去分支。宁要一个带有明确主张的布局，让用户选择把它放进哪个 Git repo。

##### 把 workspace 当作主要产品对象

作为新的面向用户形态被否决。

workspace-view 行为中有用的部分是本地解析：知道 OpenSpec repo 与 target project repo 在这台机器上 checkout 在哪里。这应当被当作一个 local repo map，而不是规划容器、生命周期所有者或持久真值来源。

#### 取代说明

这个方向取代了更早的那个产品边界 —— 那个边界把 context store、collection、initiative、workspace 与 repo-local change 当作各自独立的主要名词。那些 artifact 仍然是有用的历史上下文，也描述了已实现的 beta 行为，但新的产品方向应当从 Git-native 的 `specs/` 与 `work/` 形态出发。

### 43.4 `direction.md`

> 源文件：`reference/openspec/openspec/initiatives/context-store-and-initiatives/direction.md`

**Context Store 与 Initiative 方向**

状态：historical beta direction（历史性的 beta 方向）。

这份文档保存来自 workspace/initiative 讨论的更早的 context-store 与 workspace 方向。它是有用的过渡证据，但不是这次简化工作的当前产品权威。

要看当前方向，从以下两个文件开始：

1. `openspec/work/simplify-context-and-workspace-model/goal.md`
2. `openspec/work/simplify-context-and-workspace-model/roadmap.md`

这里记录的主要历史转变是：「workspace」不应成为持久的共享规划对象。在这个更早的模型里，持久的共享对象是一个同步的 context store，而 initiative 是它内部一个有明确主张的 collection。

#### 历史核心模型

```text
Context Store
  = synced shared content container

Collection
  = mounted content system inside a store

Initiatives
  = first major collection for cross-team implementation context

Workspace
  = local working view over context stores and repos

Change
  = repo/team-owned implementation plan
```

（译文：**Context Store** = 同步的共享内容容器。**Collection** = store 内部挂载的内容系统。**Initiatives** = 第一个主要 collection，用于跨团队的实现上下文。**Workspace** = 覆盖 context store 与 repo 的本地工作视图。**Change** = repo/团队拥有的实现计划。）

那条干净的规则：

```text
Context stores sync truth.
Collections shape truth.
Initiatives coordinate work.
Workspaces open local views.
Changes implement repo-owned slices.
```

（译文：context store 同步真值。collection 塑造真值。initiative 协调工作。workspace 打开本地视图。change 实现 repo 拥有的切片。）

#### 历史锁定的产品边界

workspace-to-initiative 的转向是这次 beta 协调工作的产品边界：

- workspace 是一个可再生成、机器本地的工作视图。它把 context store、initiative、project、repo 与 folder 映射到当前用户可以打开的路径。
- context store 是共享文件的持久同步容器。
- initiative 是跨团队或跨 repo 实现上下文的持久协调对象。
- repo-local change 仍然是由做这件事的 repo 或团队拥有的实现计划。

这取代了那个更早的模型 —— 在那个模型里，workspace 级别的 `changes/` 树拥有跨 repo 工作的常规共享计划。既有的 workspace-planning 行为可以作为 beta 或 legacy 基础设施保留，但它不应主导新的生命周期设计。

workspace 路线图的处置：

- 保留 setup、link、relink、list、open、update 与 doctor。
- 保留已链接的 repo 与 folder 在 change 存在之前可见，以供探索。
- 保留 workspace 本地的 agent guidance 作为本地视图设置，由 `workspace update` 刷新。
- 推迟 workspace 的 apply、verify 与 archive，直到 initiative 能链接到 repo 拥有的 OpenSpec change。
- 推迟 branch/worktree 编排、多 repo apply、强跨 repo 校验与依赖图强制。

#### Agent 优先的 UX

initiative 的主要用户体验预期是 agent 驱动的：

```text
Using initiative billing-launch, explore the API work and create a proposal.
```

（译文：使用 initiative billing-launch，探索 API 相关工作并创建一个 proposal。）

用户不应需要知道每一条命令。OpenSpec 应暴露小的、结构化的 CLI 原语，让 agent 可以：

- 在已注册的 context store 中找到预期的 initiative
- 从 context store 读取常规 initiative 文件
- 创建或链接一个 repo-local OpenSpec change
- 把 workspace 状态用于本地 repo 与 folder 视图
- 尊重编辑边界，而不是把每个被打开的 folder 都当作可编辑

因此 CLI 是 agent 的工具面，而不是完整的用户工作流。作为第一个 slice，优先选择显式、机器可读的命令，例如 `initiative show --json`、`new change --initiative ...`，以及 workspace local-view 命令，而不是宽泛的交互式流程。

常规的 initiative 上下文应留在 context store 中。repo-local change 应引用该 initiative，而不是把 initiative 散文的副本检入。如果 agent 需要一份紧凑的 context pack，OpenSpec 可以从活的 initiative 上下文把它生成为命令输出。

#### Context Store

context store 是共享/同步的文件文件夹。它与内容无关。它不应知道 initiative 是什么。

示例：

```text
acme-context/
  initiatives/
  decisions/
  api-catalog/
  playbooks/
```

第一个 backend 应当是 Git：

```text
create/update/delete files
  -> commit
  -> push
  -> other users pull
  -> local views update
```

但应用应当与一个 store 抽象对话，而不是直接与 Git 对话，这样 backend 以后可以变成云数据库。

#### Backend

backend 为 context store 提供持久化与同步。

示例：

- `git` backend：本地 clone、pull、commit、push、watch
- `cloud` backend：数据库记录、订阅、托管同步
- `memory` backend：测试与本地原型

backend 应暴露通用的文件/对象操作：

```text
read
write
delete
list
sync
watch
```

它不应包含 initiative 特有的行为。

#### Collections

collection 是 context store 内部挂载的内容系统。它有点像插件，但「collection」是对用户说的那个词。

每个 collection 拥有：

- 一个文件夹命名空间
- 一个内容模型
- template
- 校验/规则
- 可选的 agent guidance
- 可选的 UI 视图

示例：

```text
context-store/
  initiatives/      # Initiative collection
  decisions/        # Decision collection
  api-catalog/      # API catalog collection
```

核心应强制一个 collection 只在自己的挂载点内部写入。

#### Initiative Collection

initiative collection 是第一个面向企业的 collection。

initiative 是针对某个被协调的结果的、共享的、agent 可消费的实现上下文。它可以横跨团队、repo、service、API、契约与 capability。

默认形态：

```text
initiatives/
  launch-billing-flow/
    initiative.yaml
    requirements.md
    design.md
    contracts/
    decisions.md
    questions.md
    tasks.md
```

这里描述的是 context store 里运行时 initiative collection 的形态。这个路线图文件夹可能仍含有 legacy 的 `.initiative.yaml` 进度 metadata —— 那是当 initiative 本身被用来管理这次迁移时的产物；那个 legacy tracker 不是新的 context-store initiative 应当照抄的模型。

默认结构应为企业设计伙伴关系而带有明确主张，但 collection 系统以后应允许其它结构。

#### Initiative 的职责

initiative 应拥有与实现相关的共享上下文：

- 产品/项目意图
- 已接受的需求
- 高层技术协调
- capability 与所有权地图
- API/event/schema 契约
- 依赖假设
- 决策与开放问题
- 供 repo-local 实现工作读取的、workspace 可读的上下文

initiative 不应试图变成完整的 Jira 或 Confluence。聚焦的定位是：

```text
OpenSpec stores agreed implementation context.
Jira tracks work.
Confluence stores broad prose.
GitHub/GitLab store code.
```

（译文：OpenSpec 存储已达成一致的实现上下文。Jira 追踪工作。Confluence 存储宽泛的散文。GitHub/GitLab 存储代码。）

#### Initiative 与 Change 的范围

一个 initiative 可以横跨一个或多个 OpenSpec change。

这些 change 可以住在：

- 与 initiative 相同的 repo 中
- 不同的 repo 中
- 以后还可以在多个 context store 或 OpenSpec root 中

initiative 存储共享的协调上下文。workspace 视图可以把那份上下文与本地 repo 及 repo 拥有的 change 关联起来，而不使 initiative 存储机器本地的 checkout 链接。

这使分组与存储保持分离：

```text
Initiative = shared grouping/context
Change     = execution artifact
Workspace  = local opened view of initiative + repos
```

（译文：Initiative = 共享的分组/上下文。Change = 执行 artifact。Workspace = initiative + repo 的本地已打开视图。）

#### Workspace

workspace 是一个本地工作视图，不是真值来源。

它可以把 context store 与 project 标识符映射到本地路径，配置一个 opener，并以正确的可见 folder 启动编码 agent。

workspace 可以通过解析以下内容来打开一个 initiative：

- 该 initiative 的 context store
- 本地选定的 repo-local change
- 参与 repo 的本地 checkout 路径

持久的 workspace 记录应保持极小且私有。它记录的是这个 runtime 的本地视图选择，而不是生成的 agent 文件或共享的 initiative 内容。

```text
getGlobalDataDir()/workspaces/<workspace-name>/
  workspace.yaml
```

workspace 名字就是本地身份。workspace 记录可以可选地存储一个选定的 context store 与 initiative，外加指向本地路径的稳定链接名与 opener 偏好。initiative 引用是记录内部的数据，而不是路径段。

打开一个 workspace 会在被管理的 workspace root 上物化出 opener 特有的 runtime 文件。那些文件可以包含生成的 agent guidance、skill 与编辑器 workspace 文件。机器可读的上下文由 JSON 命令输出返回。这些是本地支撑物的再生成，不是真值来源。

```text
private local view record
  -> generated runtime files
  -> opener-specific launch
  -> initiative context + selected local repos/folders
```

workspace 应可再生成且与 runtime 相关。它们不应成为 initiative 内容、检入的协作状态、branch、worktree、clone 或实现进度的常规归属地。

#### Repo Changes

repo-local change 仍然是团队拥有的实现计划。

一个工程团队应能把相关的 initiative 上下文拉进一个 repo，并创建一个被链接的 OpenSpec change。

示例：

```text
repo/
  openspec/
    changes/
      add-billing-api/
        .openspec.yaml
        proposal.md
        design.md
        specs/
        tasks.md
```

本地 change 应在 metadata 中引用该 initiative，例如：

```yaml
initiative:
  store: platform
  id: billing-launch
```

这份 metadata 是持久的 repo 上下文，应当被检入。它不应包含机器本地路径。当 agent 需要共享上下文时，它们应从已注册的 context store 读取该 initiative 的常规文件。

#### 概念之间的关系

```text
Context Store
  contains Collections

Collection
  defines structure/rules for a mounted folder

Initiative Collection
  defines initiatives/

Initiative
  coordinates one shared outcome

Workspace
  opens local views of context stores and repos

Repo Change
  implements one team's/repo's part of an initiative
```

（译文：**Context Store** 包含 Collection。**Collection** 为一个挂载的 folder 定义结构/规则。**Initiative Collection** 定义 `initiatives/`。**Initiative** 协调一个共享结果。**Workspace** 打开 context store 与 repo 的本地视图。**Repo Change** 实现某个团队/repo 在某个 initiative 中的那一部分。）

端到端流程：

```text
Product/program/architect creates initiative
  -> initiative syncs through context store
  -> engineers open local workspace
  -> repo team pulls relevant initiative context
  -> repo team creates linked OpenSpec change
  -> repo team implements locally
  -> workspace view surfaces local progress alongside initiative context
```

#### 本地 API 方向

应用应使用依赖注入：

```ts
const store = createStore({
  id: "acme-context",
  backend: gitBackend({
    remote: "git@github.com:acme/context.git",
    localPath: "~/.openspec/stores/acme-context",
    autoSync: true,
  }),
  collections: [
    initiativeCollection({ mount: "initiatives" }),
  ],
});
```

用法：

```ts
const initiatives = store.collection("initiatives");

await initiatives.create({ id: "launch-billing-flow" });
await initiatives.update("launch-billing-flow", patch);
await store.sync();
```

重要的分离：

```text
Git backend knows Git.
Store knows sync/lifecycle/events.
Collection knows content structure.
Initiative collection knows initiatives.
```

（译文：Git backend 懂 Git。Store 懂同步/生命周期/事件。Collection 懂内容结构。Initiative collection 懂 initiative。）

#### UI 方向

UI 在核心上应与内容无关：

- 浏览 folder/文件
- 编辑 Markdown/YAML
- 预览内容
- 搜索
- 显示 diff/历史
- 同步状态

collection 可以加入更丰富的视图：

- initiative 状态视图
- 契约表格
- owner/依赖图
- 已链接 repo-change 视图

无论挂载了哪些 collection，UI 都应可用。

#### 开放问题

- 第一个具体的 context store 命令面是什么？
- store 应当叫 `context`、`store`，还是更面向产品的名字？
- 企业 context store 默认应住在哪里：客户的 GitHub、OpenSpec 管理的 Git，还是以后的托管云？
- 非技术用户如何在感觉不到 Git 的前提下编辑 Git 支撑的内容？
- 在冲突处理变得痛苦之前，最小可用的 auto-sync 行为是什么？
- 一个 initiative 契约如何升级成某个 owner repo 的常规契约？
- 已链接的 repo change 应如何把状态回报给 initiative，而不变成 Jira？
- monorepo 应如何映射 capability、folder 与 repo-local change？
- 第一条 repo-change 链接命令应当叫什么？
- 在已链接的 change 存在之后，哪些 initiative 进度/状态信号是有用的？

#### 建议的下一步方向

在 store、collection 与 initiative 的 create/list 基础之后，按这个顺序构建接下来的 slice：

1. 围绕 create/list、校验、template，以及显式推迟 read/update/delete 策略，把 Initiative MVP 理清。
2. 为 setup、registration、listing 与 doctoring 加入最小的 context-store UX。
3. 用 `initiative show --json` 与已注册 store 查找，加入 agent 优先的 initiative discovery。
4. 加入 repo-local change metadata，以及面向 `--initiative` 的、对 agent 友好的 create/link 流程。
5. 否决独立的 `initiative resolve`；本地路径映射属于 workspace，不属于 initiative 命令。
6. 一旦 show/link 语义存在，就让 workspace 打开能感知 initiative 的本地视图。
7. 加入从本地升级到 initiative 的 escalation UX。
8. 在真实使用塑造出这些需求之后，加固团队共享协调、同步、冲突指引与进度状态。

### 43.5 `roadmap.md`

> 源文件：`reference/openspec/openspec/initiatives/context-store-and-initiatives/roadmap.md`

**Context Store 与 Initiative 路线图**

状态：historical beta roadmap snapshot（历史性的 beta 路线图快照）。

这份路线图保存的是在探索 context-store 与 workspace 模型时存在的那个实现队列。它不是当前简化工作的现行路线图。

要看当前方向，从以下两个文件开始：

1. `openspec/work/simplify-context-and-workspace-model/goal.md`
2. `openspec/work/simplify-context-and-workspace-model/roadmap.md`

这份路线图底下的历史性产品决策是：

```text
Context stores sync truth.
Collections shape truth.
Initiatives coordinate work.
Workspaces open local views.
Changes implement repo-owned slices.
```

（译文：context store 同步真值。collection 塑造真值。initiative 协调工作。workspace 打开本地视图。change 实现 repo 拥有的切片。）

#### 历史性的 beta 优先级快照

当时，手动 beta 走查把首次运行的摩擦提到了前面。在投入更深的 schema 或生命周期机制之前，这是历史性的工作顺序：

1. 把手动 beta 现实走查推进到足以让接下来的 slice 有依据。
2. Item 12，context-store 首次运行与清理 UX：无参数交互式 setup、目标路径安全，以及一条受支持的 unregister/remove 路径。
3. 暂时把 Item 13 跳过，不作为实现项。保留 handoff 的发现，但在 agent handoff 模型更清楚之前，避免硬编码线性的「下一步」指引。
4. Item 14，workspaces beta 指南拆分：让用户文档匹配交互式 setup 路径，并把精确的 flag 留在 agent playbook 里。
5. Item 15，context store 的 project root 与 schema 主导的 initiative：稀疏的 initiative 创建与 store 本地的 schema。

escalation UX、团队共享加固以及 initiative 承载的、绑定 target 的 change 仍然重要，但它们应当等到首次运行路径「无聊得让人放心」之后再动。

在 workspace 变成公开/稳定之前，把 Item 19 当作一次晚期 beta 清理走查来跑，好让 beta 兼容代码被有意识地评审，而不是被当成永久契约。

#### 1. 锁定方向

目标：把 workspace-to-initiative 的转向变得显式，使未来的 workspace 工作不再继续实现更早的「workspace 拥有计划」模型。

交付：

- 记录 workspace 是本地工作视图，而不是持久的共享规划对象。
- 记录 initiative 是跨团队或跨 repo 工作的持久协调对象。
- 把当前的 workspace apply、verify 与 archive 方向标记为已推迟或已被取代，直到 initiative 链接的 repo change 存在。
- 保留已经建好的 workspace setup、link、open、update 与 doctor 行为，作为有用的 beta 基础设施。

完成条件：

- 新来的 agent 能分辨哪些 workspace 想法仍然适用、哪些不应主导实现。

锁定的处置：

- 保留 workspace setup、link、relink、list、open、update 与 doctor 作为 beta 本地视图基础设施。
- 保留「workspace 可见不等于承诺 change」作为已链接 repo 与 folder 的安全规则。
- 用「initiative 是持久协调对象」取代「workspace 是持久规划归属地」。
- 取代把 workspace 级规划 artifact 当作常规跨 repo 共享计划的做法。
- 把 workspace apply、verify 与 archive 作为一等生命周期命令推迟，直到 initiative 链接的 repo-local change 存在。
- 推迟 branch/worktree 编排、强跨 repo 校验、依赖图强制与共享契约治理。

新 agent 的历史阅读规则：

- 从 `openspec/work/simplify-context-and-workspace-model/goal.md` 与 `openspec/work/simplify-context-and-workspace-model/roadmap.md` 获取当前产品权威。
- 把 `openspec/initiatives/context-store-and-initiatives/direction.md` 当作历史性的 beta 方向，而不是当前产品权威。
- 把 `openspec/changes/workspace-reimplementation-roadmap/HISTORICAL_DIRECTION.md` 与 `openspec/changes/workspace-reimplementation-roadmap/` 当作被保留下来的本地视图行为与 POC 教训的历史参考材料。
- 除非后来某个 initiative 链接的 repo-change 设计明确把它们重新激活，否则不要把 `workspace-apply-repo-slice` 或 `workspace-verify-and-archive` 捡起来当作下一个实现 slice。

#### 2. 把 Workspace 稳定成本地视图

目标：让 workspace 保持有用，同时不使它成为真值来源。

交付：

- workspace guidance，把持久协调导向 initiative，把实现规划导向 repo-local change，并把已链接的 repo 或 folder 导向本地上下文，直到选定一个 edit root。
- workspace-open 行为，启动带有可见已链接 folder 的本地规划视图。
- workspace doctor/status 输出，解释本地路径映射、未解析的链接、已安装的 agent skill 以及修复步骤。
- 清楚的文档，说明 `workspace update` 刷新本地 agent guidance，且不修改已链接的 repo。

完成条件：

- 用户可以搭建一个 workspace、链接 repo、打开 agent，并理解 workspace 是覆盖上下文的本地视图，而不是常规共享计划。

#### 3. 加入 Context Store 基础

目标：创建通用的本地 context-store 基础，让它以后能承载 initiative 与其它共享上下文 collection。sync/watch 行为仍留作未来的加固 slice。

交付：

- 一个 context store 抽象，带通用本地操作：read、write、delete 与 list。
- 第一个 Git 形状的 backend 模型，可以指向一个本地 store root。
- 一个用于快速测试与原型的 test/memory backend。
- 一个不包含 initiative 特有逻辑的 store 配置模型。

完成条件：

- OpenSpec 可以在一个本地 context store 内部创建与操作文件，而核心 store 层不知道这些文件意味着什么。pull、push、watch、远程创建与冲突处理被记为未来的同步工作。

#### 4. 加入 Collection 基础

目标：让产品特有的内容系统住在 context store 内部，而不把每一个未来概念都硬编码进 store 层。

交付：

- 一个 collection 接口，带一个挂载的文件夹命名空间。
- 让 collection 的写入留在自己挂载点内部的规则。
- 基本的 collection 校验与 template 钩子。
- 一种让 collection 以后暴露可选 agent guidance 或 UI metadata 的方式。

完成条件：

- context store 可以承载一个挂载的 `initiatives/` collection，同时保持足够通用，能容纳未来的 decision、API catalog 或 playbook 之类的 collection。

#### 5. 交付 Initiative MVP

目标：给被协调的工作一个持久的、共享的、agent 可消费的归属地。

交付：

- initiative 的创建与列出。
- 一个默认的 initiative 文件形态：

```text
initiatives/<id>/
  initiative.yaml
  requirements.md
  design.md
  decisions.md
  questions.md
  tasks.md
```

- 用于产品意图、已接受需求、设计决策、开放问题与协调任务的 template。
- 对必需 initiative metadata 的校验。
- 明确推迟完整的 read/show、update 与 delete 策略，直到 agent 优先的 discovery 与生命周期需求更清楚。

完成条件：

- 用户或 agent 可以在任何 repo 承诺实现细节之前，创建并列出作为共享规划对象的 initiative。

#### 6. 加入最小 Context Store UX

目标：在 repo handoff 或 workspace 打开依赖它之前，让共享的 initiative 存储可用。

交付：

- `context-store setup <id>`，用于创建一个本地 Git 支撑的 store folder，带可移植的 store metadata 与本地注册。
- `context-store register <path>`，用于注册一个已有的 clone 或 folder，store id 默认取自 repo 或 folder 名。
- `context-store list` 与 `context-store doctor`，用于本地可见性与非变更式诊断。
- `initiative list` 默认覆盖所有已注册 store，`--store` 作为过滤器，`--store-path` 作为逃生口。
- 适合 agent 的最小人类输出与 JSON 输出。

完成条件：

- 单个开发者或队友可以创建或注册一个共享 context store、列出跨已注册 store 的 initiative，并在不学习内部 registry 布局的情况下诊断缺失或损坏的本地 store 设置。

#### 7. 加入 Agent 优先的 Initiative Discovery

目标：让 agent 解析用户点名的 initiative，并从真值来源读取常规 initiative 上下文。

交付：

- `initiative show <id>`，默认搜索已注册的 store。
- 当同一个 initiative id 存在于多个 store 中时的歧义处理。
- JSON 输出，带常规 initiative metadata、store 身份、initiative root path 与 metadata path。
- 人类输出聚焦于身份与可用文件，而不是工作进度。

完成条件：

- agent 能回答：「用户指的是哪个 initiative？常规上下文在哪里？initiative metadata 在哪里？」

#### 8. 把 Repo-Local Change 连接到 Initiative

目标：把共享协调与 repo 拥有的实现计划干净地分开。

实现之前需要确认的讨论点：

- create/link 流程是否应明确报告这个 change 住在哪里、它引用哪个 initiative，以及下一条建议的命令？
- `--initiative <id>` 应默认搜索已注册 store，还是在注册了多个 store 时要求 `--store`？
- 当 initiative 存在但当前 repo 没有明显的归属匹配时，命令应做什么？

交付：

- repo-local change metadata，可以通过 store id 与 initiative id 引用一个 initiative。
- 对 agent 友好的 create 或 link 流程，例如 `new change <id> --initiative <store>/<initiative>`。
- 指引说明 repo-local change 仍然负责实现、校验与 archive。
- 默认不检入 `initiative.md` 快照；agent 从 context store 实时读取常规 initiative 文件。

完成条件：

- 一个 initiative 可以协调多个 repo-local change，而不把共享计划复制到每个 repo、不把机器本地链接存进 initiative，也不让 initiative 拥有实现 artifact。

#### 9. 否决 Initiative Resolve

决策：不加入 `openspec initiative resolve`，现在不加，以后也不加。

理由：

- `initiative show` 已经解析常规共享 initiative 上下文。
- workspace 是覆盖 repo、folder、context store 与 initiative 的本地视图。
- repo-local change 已经在检入的 `.openspec.yaml` metadata 中携带持久的 initiative 链接。
- repo-local status 已经报告工作进度。
- 一条独立的 resolve 命令要么重复 workspace 的本地视图状态，要么在 workspace 不存在时产出孱弱的输出。

不要交付：

- `openspec initiative resolve <id>`
- 为 initiative 可用性做的全 workspace 或全 repo 扫描
- 把显式路径扫描作为 initiative 命令
- 为判断 initiative 参与情况而做的 Git remote 匹配
- repo 归属推断
- 作为 initiative 解析一部分的 clone、branch 创建或 worktree 创建
- initiative backlink
- initiative 命令下的本地可用性或进度仪表盘

完成条件：

- 未来的 agent 能看出「initiative resolve」是被有意否决的，不应以另一个命令名复活。

#### 建议的讨论点：加入 Initiative Next / Agent Handoff UX

状态：候选 work item，尚未锁定进带编号的路线图。

需要确认的问题：

- 它是否应在「Let Workspaces Open Initiatives」之前成为一条路线图条目？

目标：在从当前 repo 或 workspace 发现 initiative 之后，给 agent 与用户一条小小的「现在做什么？」命令，而不把它变成仪表盘或进度/状态面。

可能的形态：

```bash
openspec initiative next billing-launch --json
```

可能的 JSON 回答：

```json
{
  "initiative": "billing-launch",
  "next_action": "create_repo_change",
  "reason": "initiative found, no linked local change exists for this repo",
  "suggested_command": "openspec new change add-billing-api --initiative billing-launch"
}
```

实现之前需要确认的讨论点：

- `initiative next` 是对的命令名吗？还是这条指引应属于 workspace 的 initiative 打开流程或 repo-local status？
- 它应返回恰好一条建议的下一步动作，还是一组带排序的选项？
- 它是否应检查工作进度，还是只限于 handoff/readiness？
- 当没有注册任何 store、initiative 有歧义、或本地 repo 无关时，它应如何表现？

若被接受的完成条件：

- agent 能回答「从这个位置出发，我为这个 initiative 下一步该做什么？」，而不必在 `show`、workspace 状态与 repo-local change metadata 之间猜。

#### 10. 让 Workspace 打开 Initiative

目标：在 initiative show 与 repo-change 链接存在之后，把持久的 initiative 上下文连接到这个 runtime 的本地工作视图。

锁定的方向：

- workspace 不包含工作。它记住这个 runtime 如何打开这份工作。
- 只持久化极小的私有本地视图选择。
- 打开时生成 opener 特有的 runtime 文件。
- 附加 initiative 上下文，以及选定的、已存在的本地 repo 或 folder。
- 在这个 slice 中不要 clone、branch、创建 worktree、使用 submodule 或推断本地 repo。
- 只有上下文的打开是有效的。

产品决策状态：

- Item 10 已没有未决的产品决策。实现仍可能暴露机械细节，但预期的 UX 形态已锁定。

命令 UX 决策：

- 使用 `openspec workspace open --initiative <initiative>`。
- 支持 `<store>/<initiative>` 与 `<initiative> --store <store>`。
- 当用户想显式选择本地 workspace 身份时，支持 `openspec workspace open <workspace-name> --initiative <initiative>`。
- 如果只提供了 `<initiative>`，当恰好有一个已注册 context store 拥有该 initiative id 时就继续。
- 遇到歧义时，列出精确匹配并要求显式的 store 选择器。
- 没有精确匹配时，在可用的情况下展示可能的匹配并建议 `openspec initiative list`；不要静默打开一个模糊匹配。
- 如果用户省略了 workspace 名，在无歧义时从 initiative id 派生一个友好的默认名；否则要求用户挑一个显式的 workspace 名。

打开目标决策：

- 默认打开 initiative 目录，而不是整个 context store。
- 生成的 guidance 与 JSON 输出仍应报告 context store root，并说明更广的上下文是可用的。
- 以后可以有一个显式选项用来打开整个 context store，但宽泛的 store 范围不是 Item 10 的默认。

本地视图记录决策：

- 对能感知 initiative 的本地视图使用一条私有本地视图记录。
- 把 initiative 视图状态存进根部的 `workspace.yaml` 文件。
- 记录存储选定的 context-store 绑定、initiative、本地链接、opener 与选定工具。绑定可以保留一个 registry 选择器或一个 runtime 本地路径选择器。
- context 绑定是可选的，所以一个 workspace 也可以是一个带已链接 folder、没有 initiative 的自定义本地视图。

workspace 存储决策：

- 把每个私有 workspace 视图存在 `getGlobalDataDir()/workspaces/<workspace-name>/` 下。
- workspace 名字就是本地身份。选定的 store 与 initiative（如果有）是私有记录内部的数据，而不是路径段。
- 在 workspace root 使用一个持久的 `workspace.yaml`。
- 在 workspace root 生成 `AGENTS.md`、opener workspace 文件与工具特有的 skill。
- 不要为 Item 10 引入单独的生成输出目录。

runtime 身份决策：

- 使用 `getGlobalDataDir()` 作为跨平台的 runtime 本地边界。
- 本地路径只在写入那条私有 `workspace.yaml` 的 runtime 中有效。
- 不要在 Item 10 中加入路径翻译或单独的 `<runtime-id>` 路径段。

prepare/JSON 决策：

- 保留 `workspace open --json` 作为同一次打开操作的、面向机器的回执。
- 不要为 Item 10 加入 `--prepare-only`。
- JSON 应返回有用的生成路径、选定上下文、已打开 root、被跳过的 root、opener、启动状态与 warning，而不是一个光秃秃的成功响应。

Codex Desktop 决策：

- 把生成的 workspace root 作为 Codex Desktop 项目打开。
- 通过生成的 guidance 与 `workspace open --json` 输出，暴露附加的 initiative 与已链接 repo/folder 路径。
- 推迟 Desktop 多 root 自动化，直到有更清楚的 Desktop 契约。

编辑边界决策：

- 只输出建议性的边界。
- 把 initiative/context-store 文件标注为共享协调上下文，把已链接的 repo/folder（在被选中时）标注为本地实现上下文。
- 不要在 Item 10 中强制写入限制。

交付：

- 私有本地视图状态，可以为这个 runtime 记住选定的 context store、选定的 initiative、选定的本地链接、opener 与选定工具。
- `workspace open` 支持生成 opener 特有的 runtime 文件，并打开 initiative 上下文加本地解析出的已链接 repo/folder。
- agent guidance 与机器可读的 `workspace open --json` 输出，解释当前 initiative、已打开 root、被跳过的 root、本地路径与建议性编辑边界。
- workspace 名字复用行为，避免把已有的 workspace 静默重指到另一个 initiative。
- 打开时的 warning：跳过缺失的已链接 repo/folder，但在选定的 initiative 或 context store 无法解析时失败。
- 继续支持自定义的非 initiative workspace 作为一等本地视图。
- 针对缺失 context store、缺失已链接 repo/folder 与陈旧本地视图记录的 doctor 指引。

完成条件：

- 队友可以在自己的 runtime 中打开同一个 initiative，同时使用自己的本地路径与自己选定的 repo 子集。
- 生成的 runtime 文件明确是派生物，可以在不丢失用户本地视图选择的前提下再生成。

#### 11. 手动 Beta 现实走查

状态：建议的立即 beta 学习项。

目标：手动跑一遍已存在的东西，并在设计更多表面之前，用摩擦来更新 initiative 笔记。

交付：

- 一份新用户走查：context-store setup、initiative 创建、workspace 打开、repo 链接、doctor 输出，以及 repo-local 已链接 change 的创建。
- 关于什么地方清楚、什么地方别扭、哪里缺提示、哪里文档把太多 flag 推给用户的笔记。
- 一份简短的处置，把纯文档修复与后续实现 slice 分开。

完成条件：

- initiative 里含有手动尝试当前 beta 流程得到的具体笔记。
- 下一个实现或文档 slice 建立在观察到的摩擦之上，而不是猜测的工作流形态之上。

#### 12. Context Store 首次运行与清理 UX

目标：让 context-store 的 setup 与清理感觉像一次正常的本地工作流，而不加入同步、远程或治理自动化。

Work item：`work-items/12-context-store-first-run-and-cleanup-ux/`

交付：

- 面向终端用户的无参数交互式 `context-store setup`。
- 当必需的 setup 选择缺失时，确定性的非交互与 JSON 行为。
- 针对受管理默认值、显式路径、既存 Git repo 与非空目录的目标路径安全输出。
- 一条受支持的本地清理路径，用于注销或移除一个 context store，而不必手改 registry。
- setup 输出解释本地 registry 状态与 Git 状态，包括 `--init-git` 之后未提交的共享 store 文件。

完成条件：

- 新用户可以在不知道隐藏 registry 路径、环境变量或手动文件编辑的情况下，搭建或清理一个本地 context store。

#### 13. Agent Handoff 输出与交付打磨

状态：作为实现项被推迟。

目标（若被重新考虑）：定义一个 agent handoff 回执模型，报告存在什么、它住在哪里、有哪些可用的 affordance，而不规定一条线性的下一步。

Work item：`work-items/13-agent-handoff-output-and-delivery-polish/`

交付：

暂时不要交付固定的「Next for your agent」指引。当前的形态假设用户与 agent 线性地走完 beta 流程，但真实的 agentic 工作流可能会检查、分支、跳过步骤，或从既有上下文出发。

留给未来探索：

- 命令输出是否应包含上下文回执、可用的 affordance，还是除确定性路径之外什么都不含。
- `created_paths` 之类的直接路径字段是不是一项小的独立回执改进，而不是更宽的 handoff 模型的一部分。
- 交付措辞应如何把基线 OpenSpec 指引与工作流入口区分开，同时不把它与这个 handoff 条目耦合。

#### 14. Workspaces Beta 指南拆分

状态：建议的立即 beta 学习项。

目标：让 beta 文档反映预期的分工：

```text
Users make local choices.
Agents run OpenSpec work commands.
```

（译文：用户做本地选择。agent 运行 OpenSpec 的工作命令。）

交付：

- 一份面向用户的指南，对 context-store 位置、opener、本地 repo 路径这类本地选择，优先使用交互式终端 setup。
- 一份面向 agent 的 CLI playbook，保留显式的命令、JSON 输出、current-directory 规则与注意事项。
- 一条清楚的规则，说明哪些 flag 是正常的面向用户逃生口，哪些主要是面向 agent 的精确性。

完成条件：

- 新用户不用读一份 flag 密布的 CLI 教程，就能走到一个可用的 beta 设置。
- 编码 agent 仍然能找到创建 initiative、链接 repo-local change 与安全检查状态所需的确切命令。

#### 15. Context Store 的 Project Root 与 Schema 主导的 Initiative

目标：让 context store 能像 OpenSpec root 一样承载共享的规划配置与 schema，同时默认让实现 change 归 repo 所有。

Work item：`work-items/15-context-store-project-roots-and-schema-led-initiatives/`

需要确认的产品决策：

- 一个 context store 在 `openspec init` 之后可以像 repo 一样拥有 `openspec/config.yaml` 与 `openspec/schemas/`。
- 那个类 project 形态是给共享上下文配置与 initiative schema 用的。它绝不能静默地把 context store 变成一个实现 repo。
- `initiative create` 应创建一个稀疏外壳，并让经过评审的 initiative artifact 通过 schema 主导的 status/instructions 生长出来。

交付：

- context-store setup 创建或支持 store 本地的 OpenSpec 配置。
- 一个用于高层需求与设计 artifact 的默认 initiative schema。
- 稀疏的 initiative 创建：`initiative.yaml` 加一份简短的 `brief.md`，没有 `TBD` 占位符，也没有默认的 `tasks.md`。
- 以 initiative 目录为根的 initiative artifact status 与 instructions 输出。
- 护栏，使 `openspec new change` 不会仅仅因为 store 有一个 `openspec/` 目录，就意外地在 context store 内部创建可执行的 repo-local change。
- 对既有的六文件 MVP initiative 的兼容。

完成条件：

- 一个 context store 能解析 store 本地的 initiative schema。
- agent 能依据 CLI instructions 迭代地创建 initiative 的需求与设计 artifact。
- 既有的 MVP initiative 继续可以 list 与 show。
- 文档不再把 initiative 创建呈现为「现在就把每个 markdown 文件填满」。

#### 16. 加入 Escalation UX

目标：让用户从本地开始，只在真正需要协调时才升级。

Work item：`work-items/16-add-escalation-ux/`

交付：

- 默认从当前 repo 开始的 explore/propose 指引。
- 当工作横跨多个 owned 区域时的一条推荐路径：

```text
This appears to span multiple owned areas.
OpenSpec can upgrade it into a coordinated initiative and carry the current
planning context forward.
```

（译文：这看起来横跨多个 owned 区域。OpenSpec 可以把它升级为一个被协调的 initiative，并把当前的规划上下文带过去。）

- 对当前 change 名、产品目标、笔记、推断出的区域与相关问题的 carry-forward 行为。
- 清晰的提示，询问具体的受影响区域，而不是抽象的存储模型。

完成条件：

- 被协调的规划感觉像是本地规划的延续，而不是工作流的重启。

#### 17. 加固团队共享协调

目标：让 initiative 对团队实用，而不把 setup 变成一场管理仪式。

Work item：`work-items/17-harden-team-shared-coordination/`

交付：

- 一个推荐的 Git 支撑的共享 context store 模式。
- 轻量的队友上手：

```text
Clone the context store.
Run openspec workspace doctor.
Open the initiative with your agent.
```

（译文：克隆 context store。运行 `openspec workspace doctor`。用你的 agent 打开该 initiative。）

- 针对本地路径映射的修复流程。
- 同步状态与冲突指引。
- 在已提交的 initiative 状态与机器本地的 workspace 状态之间清楚分离。

完成条件：

- 若干队友可以共享同一个 initiative，同时各自保留自己的本地 checkout 布局。

#### 18. 探索 Initiative 承载的、绑定 Target 的 Change Artifact

目标：决定共享的 initiative artifact 是否只有在被绑定到一个 target repo 或 spec root 之后，才能升级为可执行的 OpenSpec change，同时不模糊 initiative 协调、repo 所有权与 workspace 本地视图的边界。

Work item：`work-items/18-explore-initiative-hosted-target-bound-change-artifacts/`

探索之前需要确认的讨论点：

- 「change home」是否应保留为内部 resolver 语言，而面向用户的说法类似「这个计划应该住在哪里？」与「可编辑的 target」？
- initiative work item、brief、绑定 target 的 change 与 repo-local change 之间有什么区别？
- 在一个 initiative 承载的 artifact 被认为实现就绪之前，需要哪些可移植的 target metadata？
- 共享的绑定 target 的 change 是否应要求显式选择加入，还是可以由 initiative/store 策略来选定？
- 什么用户/团队场景能证明一个 initiative 承载的、绑定 target 的 change 比一个 repo-local 已链接 change 更合理？

交付：

- 审计命令、template、校验、archive、apply、completion 与文档中对 repo-local `openspec/changes/` 的假设。
- 定义 artifact home、实现 target、允许的 edit root 与 action context 这些概念。
- 决定 initiative 承载的、绑定 target 的 change 如何绑定到 repo spec、实现 root、branch、校验、archive 与 sync/冲突行为。
- 定义 agent 可读的 JSON 输出，覆盖 work target、artifact home、实现 target、initiative 链接、编辑边界、不受支持的生命周期命令与下一条命令。
- 记录既有的 repo-local 与 workspace-local change 的兼容行为。
- 建议这应成为一个实现 slice、保持推迟、先从 initiative work item 起步，还是先限定在特定 schema 或工作流上。

完成条件：

- initiative 里有一份具体的建议、opt-in/config 示例、受影响的命令清单，以及实现 go/no-go 判据。

#### 19. 在公开发布前评审 Workspace Beta 兼容性

目标：决定哪些 workspace beta 兼容行为应活进公开的 workspace 契约，并在 workspace 尚未发布时移除或迁移其余的。

Work item：`work-items/19-review-workspace-beta-compatibility-before-public-release/`

为什么这件事靠后：

- workspace 仍是 beta，尚未公开/稳定。
- 我们不需要永远保留每一个中间态的 beta 文件形态。
- 在首次运行 UX 与 initiative 行为仍在变化时过早清理会有反复的风险。
- 在手动 beta 使用显示出真实用户实际创建了哪些本地 workspace artifact 之后，正确的兼容契约更容易定义。

交付：

- 盘点 workspace 兼容代码，包括 legacy 拆分状态读取器、registry 兜底、`codex` 到 `codex-cli` 的别名、生成的 `.gitignore` 清理，以及空的兼容 shim。
- 把每条路径归类为公开契约、beta 迁移、仅测试 shim 或可移除的死重。
- 移除那些只支持未发布的中间态 workspace 形态的 beta-only shim。
- 为试过 beta 的人定义任何值得保留的迁移行为。
- 更新文档、测试、生成的 guidance 与 release note，使公开的 workspace 兼容承诺变得显式。

完成条件：

- workspace 兼容面被有意做得小。
- 公开文档不暗示支持 beta-only 的 workspace 内部细节。
- 任何保留下来的迁移代码都有明确的 owner、理由与移除策略。

#### 靠后，不先做

这些重要，但应等到 initiative 模型有真实使用之后：

- 作为一等生命周期命令的 workspace apply、verify 与 archive。
- branch 或 worktree 编排。
- 强跨 repo 校验。
- 依赖图强制。
- 共享契约所有权工作流。
- sponsor/driver 治理流程。
- initiative 进度/状态仪表盘。
- 云托管的 context store。

#### 建议的交付顺序

1. 锁定方向，并推迟旧的 workspace 生命周期 slice。
2. 把 workspace 稳定成本地视图与 agent 启动器。
3. 加入 context store 基础。
4. 加入 collection 基础。
5. 交付 initiative MVP。
6. 加入最小的 context-store UX。
7. 加入 agent 优先的 initiative discovery。
8. 把 repo-local change 链接到 initiative。
9. 保持 initiative resolve 被否决；改用 workspace 本地视图映射。
10. 让 workspace 打开 initiative。
11. 手动 beta 现实走查。
12. Context store 首次运行与清理 UX。
13. 在 handoff 模型更清楚之前，跳过 agent handoff 输出与交付打磨。
14. Workspaces beta 指南拆分。
15. Context store 的 project root 与 schema 主导的 initiative。
16. 加入从本地到 initiative 的 escalation UX。
17. 加固团队共享协调。
18. 探索 initiative 承载的、绑定 target 的 change artifact。
19. 在公开发布前评审 workspace beta 兼容性。

待议：在 beta 指南与稀疏 initiative 模型澄清 agent 实际需要什么上下文之后，重新考虑 handoff 回执。

### 43.6 `tasks.md`

> 源文件：`reference/openspec/openspec/initiatives/context-store-and-initiatives/tasks.md`

**Context Store 与 Initiative 任务**

状态：historical beta progress snapshot（历史性的 beta 进度快照）。

这个文件保存来自旧 context-store 与 workspace initiative 的任务状态。它不是当前简化工作的现行实现队列。

要看当前方向，从以下两个文件开始：

1. `openspec/work/simplify-context-and-workspace-model/goal.md`
2. `openspec/work/simplify-context-and-workspace-model/roadmap.md`

历史性的路线图条目住在 `roadmap.md`；详细的工作笔记住在 `work-items/` 下。

#### 历史性的 beta 优先级快照

当时，手动 beta 走查优先处理一个新用户在起步时撞到的东西，而不是更深的模型工作：

1. 把 Item 11 的观察推进到足以让实现有依据。
2. Item 12：无参数的 context-store setup、路径安全与清理。
3. 暂时把 Item 13 跳过，不作为实现项。保留发现，但在 agent handoff 形态被更好理解之前，不要硬编码线性的「下一步」指引。
4. Item 14：更新 beta 指南，使其匹配改进后的首次运行流程。
5. Item 15：context-store 的 project root 与稀疏的 schema 主导 initiative。
6. Item 16-18：把 escalation、团队加固与 initiative 承载的、绑定 target 的 change 留到上手路径变得合理之后。
7. Item 19：在接近尾声、workspace 行为变成公开/稳定之前，评审 beta workspace 兼容性。

#### 1. 锁定方向

Work item：`work-items/01-lock-the-direction/`

- [x] 在 initiative 文档中记录 workspace-to-initiative 产品边界。
- [x] 把旧的 workspace 重实现路线图标记为历史参考。
- [x] 推迟 workspace apply、verify 与 archive，直到 initiative 链接的 repo change 存在。
- [x] 完成一次非 spec 的方向走查，使路线图、work item、文档与活跃 change artifact 都指向 initiative 作为产品意图。
- [x] 决定面向用户的 workspace 文档现在是否需要改动；默认不改，除非它们错误描述了当前行为。
- [x] 在处置走查之后，决定如何处理活跃的无任务 workspace change。
- [x] 为 Item 1 记录最终证据与剩余风险。

#### 2. 把 Workspace 稳定成本地视图

Work item：`work-items/02-stabilize-workspace-as-local-view/`

- [x] 把生成的 workspace guidance 重新锚定到 initiative 方向。
- [x] 决定生成的 guidance 应停止把 workspace 级 `changes/` 推荐为被协调工作的规划归属地。
- [x] 决定 `workspace update` 应为已有的 workspace 刷新生成的 workspace guidance。
- [x] 决定 workspace-planning 的 action context 应把 beta workspace artifact 当作本地兼容上下文。
- [x] 决定推迟 doctor 的已安装 skill 摘要，暂时只更新陈旧的 `workspace update` 措辞。
- [x] 定义需要保留的确切本地视图行为。
- [x] 对照该定义评审当前的 workspace setup、link、relink、list、open、update 与 doctor 行为。
- [x] 找出 Item 1 之后遗留的任何产品措辞或 guidance 缺口。

#### 3. 加入 Context Store 基础

Work item：`work-items/03-add-context-store-foundation/`

- [x] 定义初始的 store/backend 数据模型。
- [x] 决定第一个 slice 只做核心 API，暂无 CLI 表面。
- [x] 决定第一个 backend 只做 Git/本地 checkout 配置。
- [x] 决定 context store root、本地 registry YAML 与可移植 store metadata YAML 住在哪里。
- [x] 实现 context-store 基础 helper 与测试。

#### 4. 加入 Collection 基础

Work item：`work-items/04-add-collection-foundation/`

- [x] 定义 collection 挂载规则。
- [x] 决定校验/template 钩子在这个 slice 中保持为不生效的扩展字段。
- [x] 证明 `initiatives/` 可以在没有 store 特有逻辑的情况下挂载。

#### 5. 交付 Initiative MVP

Work item：`work-items/05-ship-initiative-mvp/`

- [x] 定义 initiative 文件形态与校验。
- [x] 为 requirements、design、decisions、questions 与 tasks 加入 template。
- [x] 实现 create/list 的挂载式 collection 操作与 CLI adapter。
- [x] 决定完整的 read/show、update 与 delete 策略应移到以后的 agent 优先 discovery 与生命周期工作。

#### 6. 加入最小 Context Store UX

Work item：`work-items/06-add-minimal-context-store-ux/`

- [x] 创建 Item 6 的 work-item 追踪笔记。
- [x] 定义高层 `context-store setup`、`register`、`list` 与 `doctor` 的 UX 方向。
- [x] 决定确切的检入 store metadata 与机器本地 registry 行为。
- [x] 决定 setup/register/list/doctor 的人类行为与职责划分。
- [x] 决定 `initiative list` 跨已注册 store 的部分成功行为。
- [x] 决定 Item 6 的最终边界情况：id 推断、非空 setup folder、registry 冲突、空状态、JSON 退出行为与静态 completion。
- [x] 更新 `initiative list` 使其默认覆盖已注册 store，`--store` 作为过滤器，`--store-path` 作为逃生口。
- [x] 为 context-store CLI 行为加入聚焦的测试与验证。

#### 7. 加入 Agent 优先的 Initiative Discovery

- [x] 定义 `initiative show <id>` 的人类与 JSON 输出。
- [x] 默认搜索已注册 store，并处理有歧义的 initiative id。
- [x] 为 agent 读取返回常规 initiative metadata、store 身份、root path 与 metadata path。
- [x] 让工作进度状态不进入这条命令。

#### 8. 把 Repo-Local Change 连接到 Initiative

Work item：`work-items/08-connect-repo-local-changes-to-initiatives/`

- [x] 决定 initiative 链接住在 repo-local 的 `.openspec.yaml` 中。
- [x] 加入 repo-local initiative metadata。
- [x] 为 repo-local change 加入对 agent 友好的 create 或 link 流程。
- [x] 决定新 change 创建时 `--initiative` 链接的命令命名。
- [x] 确认 create/link 输出是否应报告 change 住在哪里、它引用哪个 initiative，以及下一条建议的命令。
- [x] 确认在多 store 设置下，`--initiative <id>` 是默认搜索已注册 store，还是要求显式的 store 选择。
- [x] 把常规 initiative 上下文留在 context store 中；默认不加入检入的 `initiative.md` 快照。

#### 9. 否决 Initiative Resolve

Work item：`work-items/09-add-initiative-resolve/`

- [x] 压力测试是否需要一条独立的 `initiative resolve` 命令。
- [x] 决定不加入 `openspec initiative resolve`，现在不加，以后也不加。
- [x] 把常规 initiative discovery 留在 `initiative show`。
- [x] 把本地路径映射留在 workspace 行为中。
- [x] 把实现进度留在 repo-local status 中。
- [x] 否决全 repo 扫描、全 workspace 扫描、把显式路径扫描作为 initiative 命令、Git remote 匹配、clone、worktree 创建与 initiative backlink。

#### 建议的讨论：Initiative Next / Agent Handoff UX

Work item 草稿：`work-items/proposed-initiative-next-agent-handoff-ux/`

- [ ] 决定是否把它作为带编号的路线图条目加在 Item 9 与 Item 10 之间。
- [ ] 决定这个表面是 `initiative next`、workspace 的 initiative 打开，还是 repo-local status 指引。
- [ ] 决定它建议一条下一步动作，还是多条带排序的选项。
- [ ] 决定把进度/状态留在范围之外，除非我们明确想让这条命令长成更宽的状态面。

#### 10. 让 Workspace 打开 Initiative

- [x] 创建 Item 10 的 work-item 追踪笔记。
- [x] 锁定把 initiative 作为本地 workspace 视图打开的命令 UX。
- [x] 定义针对选定的 context store、initiative、本地链接、opener 与选定工具的私有本地视图记录。
- [x] 决定私有本地视图记录的存储命名空间与键。
- [x] 决定默认打开目标：initiative 目录还是完整 context store。
- [x] 决定生成的 runtime 文件住在哪里以及如何再生成。
- [x] 在没有路径翻译的前提下，定义 macOS、Codespaces、WSL、SSH 与容器的 runtime 身份规则。
- [x] 决定面向 agent 与桌面集成的 prepare/JSON 面。
- [x] 决定针对生成的 workspace root 与附加路径的 Codex Desktop 行为。
- [x] 为 Item 10 定义建议性的编辑边界输出。
- [x] 确认这个 slice 只打开已知的本地路径，不创建 clone、branch、worktree 或 submodule。

#### 11. 手动 Beta 现实走查

Work item：`work-items/11-manual-beta-reality-pass/`

- [ ] 从一个新用户的视角手动跑一遍当前的 context-store、initiative、workspace 与 repo-local change 流程。
- [ ] 记录关于令人困惑的命令、缺失的提示、不清楚的输出，以及文档过度解释或解释不足之处的笔记。
- [ ] 随着观察到来更新 initiative 笔记。
- [ ] 决定哪些发现应变成实现 slice，哪些只是纯文档修复。

#### 12. Context Store 首次运行与清理 UX

Work item：`work-items/12-context-store-first-run-and-cleanup-ux/`

- [x] 决定并实现无参数交互式 `context-store setup`。
- [x] 为受管理默认值、显式路径、Git repo 与非空目录定义目标路径安全行为。
- [x] 为注销或移除 context store 加入本地清理支持。
- [x] 让 setup 与 cleanup 输出报告商定的人类可读摘要与确切的 JSON 状态，且不带工作流 `next_commands`。
- [x] 为首次运行 setup 与 cleanup 行为更新文档与测试。

#### 13. Agent Handoff 输出与交付打磨

Work item：`work-items/13-agent-handoff-output-and-delivery-polish/`

状态：已推迟。暂时不要从这个条目实现固定的「Next for your agent」输出。

- [ ] 在 Item 14/15 澄清 beta 指南与稀疏 initiative 流程之后再重新考虑 handoff 模型。
- [ ] 如有需要，把 `created_paths` 这类确定性回执改进拆成一个更小的未来实现 slice。
- [ ] 避免规定一条线性的工作流路径；未来的 handoff 输出应报告状态、路径与 agent 可以自行组合的可能的 affordance。

#### 14. Workspaces Beta 指南拆分

Work item：`work-items/14-workspaces-beta-guide-split/`

- [ ] 更新面向用户的指南，对本地选择优先使用交互式终端 setup。
- [ ] 把 initiative 创建、initiative 编辑与 repo-local change 创建移入「问你的编码 agent」的指引。
- [ ] 把显式 flag、JSON 输出、cwd 规则与注意事项留在面向 agent 的 CLI playbook 中。
- [ ] 决定哪些 flag 作为歧义时的逃生口仍对用户文档有用。
- [ ] 记录撰写指南时发现的任何交互式提示缺口。

#### 15. Context Store 的 Project Root 与 Schema 主导的 Initiative

Work item：`work-items/15-context-store-project-roots-and-schema-led-initiatives/`

- [x] 创建 Item 15 的 work-item 追踪笔记。
- [ ] 更新 initiative 方向语言，使 context store 成为能感知 OpenSpec 的共享 project root，而不仅是跨团队/跨 repo 的协调文件夹。
- [ ] 决定最小的 context-store OpenSpec 结构：`.openspec-store/store.yaml`、`openspec/config.yaml`、`openspec/schemas/` 与 collection 挂载点。
- [ ] 决定 initiative collection 默认值的 store 本地配置形态，包括是否使用 `collections.initiatives.schema`。
- [ ] 决定 context-store setup 如何创建、保留或修复 store 本地的 `openspec/config.yaml`。
- [ ] 定义内置的高层 initiative schema 及其初始 artifact。
- [ ] 决定 `initiative create` 只创建 `initiative.yaml`，还是创建 `initiative.yaml` 加一个由 schema 选定的种子 artifact（例如 `brief.md`）。
- [ ] 用稀疏的迭代式创建替代急切的六文件 initiative 脚手架。
- [ ] 加入以 initiative 目录为根的 initiative artifact status/instructions 行为。
- [ ] 对 initiative 命令复用 project-local schema 解析，以 context-store root 作为 project root。
- [ ] 决定 schema CLI 命令是否需要 `--store` 或 `--store-path` 选择器。
- [ ] 守护 planning-home 解析，使带 `openspec/config.yaml` 的 context store 不会意外把该 store 变成实现 repo。
- [ ] 把既有的六文件 beta initiative 保留为可读的合法 initiative。
- [ ] 为类 project 的 context-store 模型更新文档、生成的 agent guidance 与测试。

#### 16. 加入 Escalation UX

Work item：`work-items/16-add-escalation-ux/`

- [ ] 定义从本地升级到 initiative 的推荐触发条件。
- [ ] 把当前的规划上下文带进一个新的 initiative。
- [ ] 让提示基于受影响的区域。

#### 17. 加固团队共享协调

Work item：`work-items/17-harden-team-shared-coordination/`

- [ ] 记录推荐的 Git 支撑的 store 设置。
- [ ] 定义队友上手与修复流程。
- [ ] 加入同步状态与冲突指引。

#### 18. 探索 Initiative 承载的、绑定 Target 的 Change Artifact

Work item：`work-items/18-explore-initiative-hosted-target-bound-change-artifacts/`

- [ ] 确认「change home」保持为内部语言，而面向用户的措辞更接近「这个计划应该住在哪里？」
- [ ] 为 initiative work item、brief、绑定 target 的 change、artifact home 与可编辑 target 定义面向用户的命名。
- [ ] 决定 initiative 承载的 artifact 能否升级为可执行的 change，以及必须首先具备哪些 target metadata。
- [ ] 决定 repo-local 与 initiative 承载 artifact 的配置或 opt-in 面。
- [ ] 定义 `openspec new change` 如何选择并报告 artifact home、实现 target、initiative 链接与 action context。
- [ ] 决定 initiative 承载的、绑定 target 的 change 如何绑定到 repo spec、实现 root、校验、archive 与同步行为。
- [ ] 记录既有的 repo-local 与 workspace-local change 的兼容行为。
- [ ] 找出后续实现 slice 与风险。

#### 19. 在公开发布前评审 Workspace Beta 兼容性

Work item：`work-items/19-review-workspace-beta-compatibility-before-public-release/`

- [ ] 盘点 workspace beta 兼容代码与测试。
- [ ] 决定哪些 beta-only 兼容路径应在公开发布前移除。
- [ ] 决定哪些兼容路径需要显式的迁移行为或 release note。
- [ ] 移除那些只支持未发布 beta workspace 形态的低价值 shim。
- [ ] 更新文档、测试与 agent guidance，使其匹配选定的公开 workspace 兼容契约。

### 43.7 `decisions.md`

> 源文件：`reference/openspec/openspec/initiatives/context-store-and-initiatives/decisions.md`

**Context Store 与 Initiative 决策**

#### 2026-05-20：把路线图执行追踪放在 initiative 内部

决策：把 initiative 路线图的实现追踪在 `openspec/initiatives/context-store-and-initiatives/` 内部，而不是为每条路线图条目创建一个 OpenSpec change。

为什么：initiative 是这份工作的持久协调对象。repo-local 的 OpenSpec change 应保留给由某个 repo 或团队拥有的实现 slice。路线图条目的追踪属于 initiative，直到某项任务需要一个 repo 拥有的实现计划。

影响：

- 使用 `tasks.md` 作为 initiative 全局的进度仪表盘。
- 使用 `work-items/<nn-slug>/` 记录某一条路线图条目的详细执行笔记。
- 当实现进入一个 repo 拥有的 slice 时，再把 repo-local 的 OpenSpec change 链接回 initiative。

#### 2026-05-20：锁定 Workspace-to-Initiative 产品边界

决策：workspace 是本地工作视图，不是持久的共享规划对象。持久协调属于 context store 与 initiative。repo-local change 拥有实现。

影响：

- 保留 workspace 的 setup、link、relink、list、open、update 与 doctor 作为 beta 本地视图基础设施。
- 把 workspace-planning 行为当作 beta 或过渡性兼容。
- 推迟 workspace 的 apply、verify 与 archive，直到存在 initiative 链接的 repo-local change。

#### 2026-05-21：在行为变化之前不动 Spec

决策：不要用最初的方向锁定去改写 OpenSpec spec。spec 应描述代码背后当前的行为契约。initiative artifact 应承载产品意图、路线图决策与未来方向，直到后来某次实现 change 有意地同时更新行为与其 spec。

影响：

- 最初的 Item 1 清理应聚焦于 initiative 文档、历史路线图 artifact、活跃 proposal 的处置与面向用户的文档。
- 既有的 workspace-planning spec 与 schema 可以继续描述当前已实现的行为。
- 未来对 spec 的改动应与它们所治理的行为一起发生。

#### 2026-05-21：把已推迟的 Workspace Change 保留为参考占位

决策：把 agent guidance、repo-slice apply、verify/archive 与重实现路线图这些活跃的 workspace change，保留为已推迟的参考占位。

为什么：在 context store、initiative 与 initiative 链接的 repo-local change 存在之后，这些领域预期仍然重要。现在把它们归档或删除会丢失有用的研究与连续性。

影响：

- 不要把它们的实现当作紧接着的下一步焦点。
- 把它们当前的 proposal 当作历史/已推迟的方向。
- 在 initiative 链接的 repo-local change 定义出持久 handoff 模型之后，再重新审视并重构它们。

#### 2026-05-21：生成的 Workspace Guidance 按所有权路由工作

决策：生成的 workspace guidance 应把 workspace 描述为本地工作视图，并把持久工作路由到拥有它的 artifact：initiative 拥有跨团队或跨 repo 的意图，repo-local 的 OpenSpec change 拥有实现计划，已链接的 repo 或 folder 拥有它们自己的实现。

为什么：initiative 方向取代了那个更早的模型 —— 在那个模型里，workspace 级的 `changes/` 树拥有常规的跨 repo 共享计划。新的 agent guidance 不应强化那个旧模型。

影响：

- 移除那些告诉 agent 把 workspace 级 `changes/` 当作被协调工作之规划归属地的 guidance。
- 当 legacy 或 beta 的 workspace-planning 文件存在时，保持它们可读，作为兼容上下文。
- 在广泛的面向用户文档或 spec 之前，先更新生成的 workspace guidance。
- 在相应行为有意改变之前，不要动 spec。

#### 2026-05-21：Workspace 的 Action Context 是本地兼容上下文

决策：workspace-planning 的 action context 不应再把 workspace 级 artifact 描述为真值来源。它应报告 `sourceOfTruth: "workspace-local"`，并把 workspace 本地的规划 artifact 描述为当前本地视图的兼容上下文。

为什么：workspace-planning artifact 在 beta 工作流中仍然可能存在，但 initiative 方向把持久协调分配给 initiative，把实现规划分配给 repo-local change。

影响：

- 为兼容而保留 `actionContext.mode: "workspace-planning"`。
- 在选定显式 edit root 之前，保持 `allowedEditRoots: []`。
- 把已链接的 repo 与 folder 保留为上下文，而不是隐含的 edit root。
- 当 initiative 上下文存在时，把持久协调路由到 initiative。

#### 2026-05-21：围绕 Agent 优先的 Initiative Handoff 重排路线图

决策：把 initiative 当作一个 agent 优先的工作流。用户应能用「使用 initiative X，探索 Y 并创建一个 proposal」这样的意图提示 agent；OpenSpec 应提供小的 CLI 原语让 agent 组合。

为什么：实际的 UX 不是人手动敲每一条协调命令。agent 需要可靠的、结构化的答案，知道常规 initiative 上下文住在哪里，以及 repo-local change 如何引用它。本地路径来自 workspace 状态，而不是来自 initiative 命令。

影响：

- 在 workspace 的 initiative 打开之前，先推进最小的 context-store setup、registration、listing 与 doctoring。
- 在更宽的进度/状态概念之前，先加入 `initiative show --json`。
- 用检入的 initiative metadata 连接 repo-local change，而不是检入 initiative 散文的快照。
- 不要加入 `initiative resolve`；本地路径映射由 workspace 的本地视图状态拥有。
- 在 show 与 repo-change 链接语义存在之后，再教 workspace 打开流程认识 initiative。

#### 2026-05-26：Workspace 的 Initiative 打开使用生成的 Runtime 文件

决策：把 workspace 的 initiative 打开当作一条私有本地视图记录加生成的 runtime 文件。workspace 不包含工作。它记住这个 runtime 如何打开这份工作。

为什么：initiative 上下文是 context store 中的共享真值，repo-local change 拥有实现，而 agent/编辑器 affordance 需要存在于 agent 实际运行的 runtime 中。把生成文件持久化为 workspace 真值，会把本地视图状态与共享协调搅在一起，并产生陈旧或涉及隐私的 artifact。

影响：

- 只持久化极小的私有本地视图选择：选定的 store、选定的 initiative、选定的本地链接、opener 与选定工具。
- 在私有 workspace 记录内部保留选定的 context-store 选择器，这样一次 runtime 本地的 `--store-path` 打开可以在不把机器本地路径写进检入 repo metadata 的情况下被重新打开。
- 在打开或准备视图时，生成 agent guidance、skill、启动提示与编辑器 workspace 文件作为 runtime 支撑物。
- Item 10 中只打开已存在的本地路径；不要 clone、branch、创建 worktree、使用 submodule 或推断本地 repo。
- 把生成的 runtime 文件当作可丢弃、可再生成的。
- 允许只带上下文的 initiative 打开；已链接的 repo 是可选的本地视图选择。
- 在 Item 10 中保持编辑边界为建议性，直到设计出强制机制。

#### 2026-05-26：Workspace 存储以 Workspace 名为键

决策：把私有 workspace 视图存在 `getGlobalDataDir()/workspaces/<workspace-name>/` 下。workspace 名字就是本地身份。选定的 context store 与 initiative（如果有）住在一条持久的私有 `workspace.yaml` 记录内部。

为什么：workspace 是通用的本地视图，不是 initiative 拥有的目录。用户可能想要一个带已链接 repo 与 folder、但没有 initiative 的自定义 workspace，或者想要多个针对同一个 initiative 的个人 workspace。以 store 与 initiative 作为存储键，会把文件系统布局过度拟合到一种工作流上。

影响：

- 在 `workspace.yaml` 内部保持 initiative 引用可选。
- 存储 initiative 上下文时带一个显式的 context-store 绑定，而不是一个扁平的 store id，因为 workspace 状态可能需要记住一个 registry 选择器或一个 runtime 本地路径选择器。
- 在被管理的 workspace root 生成 `AGENTS.md`、opener workspace 文件与工具特有的 skill。
- Item 10 中保持 `workspace.yaml` 作为唯一的视图文件；不要加入单独的机器可读视图文件。
- 不要为 Item 10 引入单独的生成输出目录。
- 如果用户在没有 workspace 名的情况下打开一个 initiative，当 initiative id 无歧义时，从它派生一个友好的默认 workspace 名。
- 遇到 workspace 名冲突或多个 workspace 指向同一个 initiative 时，请人选择，或在非交互模式下要求一个显式的 workspace 名。

#### 2026-05-26：Item 10 Workspace 打开的 UX 决策

决策：把 Item 10 围绕 runtime 身份、JSON 输出、Codex Desktop、编辑边界与实现范围剩余的这些产品决策敲定。

影响：

- 使用 `getGlobalDataDir()` 作为跨平台的 runtime 本地边界。不要在 Item 10 中加入路径翻译或单独的 runtime id。
- 保留 `workspace open --json` 作为同一次打开操作的、面向机器的回执。它应返回有用的生成路径、选定上下文、已打开 root、被跳过的 root、opener、启动状态与 warning。
- 不要为 Item 10 加入 `--prepare-only`。
- 对 Codex Desktop，把生成的 workspace root 作为项目打开，并通过生成的 guidance 与 `workspace open --json` 输出暴露附加的 initiative 与 repo/folder 路径。
- 只输出建议性的编辑边界；不要强制写入限制。
- 继续只打开已知存在的本地路径。不要在 Item 10 中 clone、branch、创建 worktree、使用 submodule 或推断本地 repo。

#### 2026-05-30：推迟硬编码的 Agent Handoff Guidance

决策：暂时把 Item 13（agent handoff 输出与交付打磨）跳过，不作为实现项。

为什么：底层的 beta 痛点是真实的：在 setup、initiative 创建、workspace 打开与 repo-local change 创建之后，用户与 agent 需要更好的回执。然而，固定的「Next for your agent」指引假设了一条线性的工作流路径，可能不适合动态的 agentic 工作 —— 在那种工作里，agent 应检查当前状态并自行选择下一步。

影响：

- 暂时不要实现硬编码的下一步区块。
- 把 Item 13 保留为未来回执或 affordance 模型的研究上下文。
- 未来的输出优先报告存在什么、它住在哪里、有哪些动作可用，而不是规定一条下一步命令。
- 像直接 `created_paths` 字段这样的确定性回执改进，如果确实仍然有用，可以拆成一个更小的实现 slice。
- 交付措辞方面的顾虑可以与 handoff 输出分开处理。

### 43.8 `questions.md`

> 源文件：`reference/openspec/openspec/initiatives/context-store-and-initiatives/questions.md`

**Context Store 与 Initiative 问题**

#### 开放

- 面向用户的命令词汇应说 `context`、`store`，还是更面向产品的词？
- 一旦 initiative 存在，既有的 workspace-planning change 应得到什么样的迁移或兼容路径？
- 已链接的 repo change 应如何把进度回报进 initiative，而不变成 Jira 克隆？
- monorepo 应如何映射 capability、folder 与 repo-local change？
- OpenSpec 是否应支持在 context store 与本地 OpenSpec repo 之间可配置的 change 归属地，以及什么样的所有权规则能让那个模型安全？

#### 已解决

- workspace 不应成为持久的共享规划对象。
- initiative 路线图的实现应在 initiative 内部追踪，直到需要 repo 拥有的实现 change。
- 第一个具体的 context store 命令面是 `context-store setup`、`context-store register`、`context-store list`/`ls` 与 `context-store doctor`。同步、push/pull、remote 与冲突处理是未来的工作。

### 43.9 work-items 的形态

> 源文件：`reference/openspec/openspec/initiatives/context-store-and-initiatives/work-items/`（20 个目录）。按本篇开头的压缩说明，这里只译**形态**与其中一个代表性 item 的全文，其余 19 个按名字列出并各附一行取自其 `plan.md` 的释义。

每个 work item 是一个目录 `work-items/<nn-slug>/`，携带同一组文件：

- `plan.md` —— 这一项的 `Status` / `Source Of Truth` / `Goal`，以及锁定的方向、决策登记表、边界与不在范围内的清单。
- `tasks.md` —— 这一项的勾选清单（`- [x]` / `- [ ]`）。
- `evidence.md` —— **完成证据**。这是这一代最值得注意的一处：「完成」的定义在这里从「勾掉一个框」变成「给出证据」。各 item 的分节名不尽相同，反复出现的分节是 `Conversation Decisions`、`Research Notes`、`Implementation Evidence`、`Verification`（后两者是实际改动的文件/模块清单与跑过的验证命令清单）。

三个文件并非每个 item 都齐全：`10-let-workspaces-open-initiatives`、`14-workspaces-beta-guide-split`、`16-add-escalation-ux`、`17-harden-team-shared-coordination`、`19-review-workspace-beta-compatibility-before-public-release` 只有 `plan.md` 与 `tasks.md`；`11-manual-beta-reality-pass` 用一份 `notes.md`（18.2 KB 的手动走查笔记）代替 `evidence.md`；`09-add-initiative-resolve` 另有一份 `decision-review.md`。

以下全文译出代表性 item `07-add-agent-first-initiative-discovery`（主题为 agent handoff / discovery）的三个文件。

#### 43.9.1 `07-add-agent-first-initiative-discovery/plan.md`

**加入 Agent 优先的 Initiative Discovery**

##### 状态

实现完成；验证进行中。

##### 真值来源

从 `../../direction.md` 出发。

这一项之所以存在，是因为预期的工作流是 agent 优先的：

```text
Using initiative billing-launch, explore the API work and create a proposal.
```

在 repo-local 链接、本地解析或 workspace 打开能工作之前，agent 需要一条小命令来回答：

- 用户指的是哪个 initiative？
- 哪个 context store 含有这个常规 initiative？
- initiative metadata 在哪里，agent 应当检查哪个 root？

##### 目标

加入 agent 优先的 initiative discovery，而不把 `show` 变成读取器、进度仪表盘、repo resolver 或 workspace 启动器。

##### 迄今锁定的方向

- `initiative show <id>` 是一条 locator/discovery 命令。
- 它应返回身份、context-store 位置、initiative 位置与 initiative metadata path。
- 它不应拼接 markdown、摘要文件内容、计算进度、解析 repo、列出已链接的 change 或打开 workspace。
- 默认查找搜索所有本地已注册的 context store。
- `--store <id>` 过滤到某一个已注册 store。
- `--store-path <path>` 仍然是显式的本地路径逃生口。
- 跨 store 的重复 initiative id 是歧义。命令不应自动挑选一个匹配。
- 在默认的全 store 查找中，不可读的 store 使这次查找不完整。命令应失败，而不是静默返回一个可能为假的唯一匹配。
- 显式的 `--store` 与 `--store-path` 模式只考虑被选定的 store。

##### 输出契约方向

第一份 JSON 契约应当是 resolver/read-pointer 投影，而不是对 `initiative.yaml` 的完整序列化。

建议的成功形态：

```json
{
  "context_store": {
    "id": "platform",
    "root": "/path/to/platform-context"
  },
  "initiative": {
    "version": 1,
    "id": "billing-launch",
    "title": "Billing Launch",
    "summary": "Coordinate billing launch work.",
    "created": "2026-05-21",
    "root": "/path/to/platform-context/initiatives/billing-launch",
    "store_path": "initiatives/billing-launch",
    "metadata_path": "/path/to/platform-context/initiatives/billing-launch/initiative.yaml"
  },
  "status": []
}
```

锁定的字段决策：

- 保留 `initiative.version`。
- 保留 `initiative.created`。
- 保留 `initiative.id`、`title`、`summary`、`root`、`store_path` 与 `metadata_path`。
- 保留 `context_store.id` 与 `root`。
- 从 `initiative show` v1 中省略 `context_store.source`。它是选择器来源，而不是 context-store 身份。既有的 create/list 输出暂时可以保持不变。
- 从 v1 中省略顶层的 `resolution` 字段。
- 从 v1 投影中省略 `initiative.status`。
- 从 v1 投影中省略 `initiative.owners`。
- 从 v1 投影中省略任意的 `initiative.metadata`。
- 从 v1 投影中省略 `files` 清单。
- 省略顶层的 `matches`。
- 把歧义与不完整查找的候选放在相关诊断条目之下，例如 `status[0].details.matches`。
- 保持顶层 `status` 只承载命令诊断，而不是 initiative 的工作进度。

##### 仍待决定

- 最小的 v1 slice 已无待决项。

##### 人类输出方向

成功输出应保持聚焦于定位：

```text
OpenSpec initiative: Billing Launch

ID: billing-launch
Summary: Coordinate billing launch work.
Context store: platform
Location: /path/to/platform-context/initiatives/billing-launch

Files:
  Metadata: /path/to/platform-context/initiatives/billing-launch/initiative.yaml
```

错误输出应保持朴素：

- 未找到：说明该 initiative 在已注册的 context store 中未找到，并建议 `openspec initiative list`。
- 有歧义：展示匹配的 store 与路径，然后建议 `openspec initiative show <id> --store <store>`。
- 查找不完整：说明有些 context store 无法读取，在存在时附上部分匹配，然后建议 `openspec context-store doctor`。

##### 文件列举方向

`initiative show` 在 v1 中不应列出 initiative 文件夹的内容。

只有 `initiative.yaml` 是标识与校验该 initiative 所必需的。其它所有文件都依赖 schema/config，且可能因团队而异。一旦命令解析出 `initiative.root`，agent 就可以用常规的文件系统工具检查该文件夹。以后能感知 schema 的视图可以暴露重要文件，而不必硬编码今天的默认 template 文件名。

##### 补全方向

为以下命令加入静态 shell completion metadata：

```text
initiative show <id> --store <id> --store-path <path> --json
```

在这个 slice 中不要为已注册的 store id 或 initiative id 加入动态 completion。

##### 核心读取操作方向

为精确查找加入一个聚焦的 `readInitiative` 操作。

行为：

- 当 initiative 文件夹或 `initiative.yaml` 缺失时返回 `null`。
- 当 `initiative.yaml` 存在但无效时抛出。
- 当解析出的 `initiative.yaml` id 与文件夹 id 不匹配时抛出。
- 不要扫描无关的 initiative 文件夹。

##### 查找错误的优先级

对默认的全 store 查找而言，任何一个不可读的已注册 store 都会使这次查找不完整。

如果一个或多个可读 store 含有该 initiative，而另有一个或多个 store 无法读取，主要错误仍应是 `initiative_lookup_incomplete`，而不是成功或有歧义。把任何可读的部分匹配附在诊断详情下。

显式的 `--store` 与 `--store-path` 模式被限定在选定的 store 上，不检查无关的已注册 store。

无效的精确 initiative 文件夹是损坏的共享状态，不是「未找到」。

如果 `initiatives/<id>/initiative.yaml` 存在但无效或 id 不匹配，`initiative show` 应以 invalid-initiative 诊断失败。在默认的全 store 查找中，不可读的 store 仍然优先，报为 `initiative_lookup_incomplete`，因为完整候选集无法得知。

##### 明确不在范围内

- 顶层的 `openspec show` 集成。
- Markdown 内容包或生成的 context pack。
- 在 repo-local change 中检入 initiative 快照。
- repo-local change 链接。
- 本地 repo/workspace 解析。
- workspace 打开。
- Git 同步状态、dirty 状态、remote、pull、push 或冲突。
- initiative 的进度或状态仪表盘。

#### 43.9.2 `07-add-agent-first-initiative-discovery/tasks.md`

**加入 Agent 优先的 Initiative Discovery 任务**

- [x] 创建 Item 7 的 work-item 追踪笔记。
- [x] 决定 `initiative show <id>` 是一条 locator/discovery 命令。
- [x] 决定默认查找搜索所有已注册的 context store。
- [x] 决定 `--store` 与 `--store-path` 仍是收窄范围的选择器。
- [x] 决定重复的 initiative id 是歧义错误。
- [x] 决定不可读的 store 使默认的全 store 查找不完整。
- [x] 决定 v1 投影省略 `initiative.status`、`owners` 与任意 `metadata`。
- [x] 决定 v1 投影保留 `initiative.version` 与 `created`。
- [x] 决定 v1 省略 `files`，只返回 initiative root 与 metadata path。
- [x] 决定歧义与不完整查找的候选住在诊断详情下，而不是顶层 `matches`。
- [x] 决定成功与错误状态的精确人类输出方向。
- [x] 决定 `initiative show` 省略 `context_store.source`。
- [x] 决定 `initiative show` 省略顶层的 `resolution` 字段。
- [x] 决定静态 completion metadata 随 Item 7 一起交付。
- [x] 决定 `readInitiative` 对缺失返回 `null`、对无效抛出。
- [x] 决定在默认的全 store 模式下，不完整查找优先于成功或有歧义。
- [x] 决定无效的精确 initiative 文件夹是错误，而不是 not-found。
- [x] 实现一个聚焦的按 initiative 读取操作。
- [x] 实现 `initiative show`。
- [x] 为 `initiative show` 注册静态 completion metadata。
- [x] 加入聚焦的测试与验证证据。

#### 43.9.3 `07-add-agent-first-initiative-discovery/evidence.md`

**加入 Agent 优先的 Initiative Discovery 证据**

##### 对话决策

- `initiative show <id>` 应是面向 agent 的 locator/discovery 命令。
- 该命令应回答用户指的是哪个 initiative、常规上下文住在哪里、initiative metadata 在哪里。
- 该命令不应拼接 markdown、摘要 initiative 内容、计算工作进度、解析本地 repo、列出已链接的 change 或打开 workspace。
- 默认查找应搜索所有已注册的 context store。
- `--store <id>` 应消歧或过滤到某一个已注册 store。
- `--store-path <path>` 应保持为显式的本地路径逃生口。
- 跨 store 的重复 initiative id 应以歧义错误失败。
- 当任何已注册 store 不可读时，默认的全 store 查找应失败，因为唯一性无法得知。
- 显式的 `--store` 与 `--store-path` 查找应只关心被选定的 store。
- `initiative.status` 应从 v1 输出投影中省略。
- `owners` 应从 v1 输出投影中省略。
- 任意的 `metadata` 应从 v1 输出投影中省略。
- `version` 与 `created` 应留在 v1 的 initiative 投影中。
- `files` 应从 v1 中省略。
- `initiative.metadata_path` 应指向经过校验的 `initiative.yaml`。
- `initiative.root` 足以让 agent 用常规文件系统工具检查该文件夹。
- 顶层 `matches` 应省略。歧义与不完整查找的候选应住在需要它们的诊断之下，例如 `status[0].details.matches`。
- `context_store.source` 应从 `initiative show` v1 中省略，因为它是选择器来源，而不是 context-store 身份。
- v1 不需要顶层的 `resolution` 字段。
- 既有的 `initiative create/list` 输出暂时可以保留 `context_store.source`；这一项不应重构旧的输出形态。
- 当精确的 initiative 缺失时，`readInitiative` 应返回 `null`；当 `initiative.yaml` 存在但无效或 id 错误时抛出。
- 在默认的全 store 查找中，任何不可读的已注册 store 都应使主要错误为 `initiative_lookup_incomplete`，即使可读的 store 有部分匹配。
- 如果 `initiatives/<id>/initiative.yaml` 存在但无效或 id 错误，`initiative show` 应作为损坏的 initiative 状态失败，而不是把那个 store 当作未找到。
- 人类输出在成功时应是紧凑的定位视图：title、id、summary、context store、location 与常规文件名。
- 人类的歧义与不完整查找错误应内联展示匹配或部分匹配的 store，然后指向下一条命令。
- 静态 shell completion metadata 应随 `initiative show` 交付。
- store id 与 initiative id 的动态 completion 应继续推迟。

##### 研究笔记

- 当前的 initiative create/list 输出会摊开解析出的完整 `initiative.yaml` 状态，这对 MVP 有用，但对第一份 `show` 契约来说太宽。
- 相比通过 `listInitiatives` 实现 `show`，更受偏好的做法是一个聚焦的按 initiative 读取操作，因为精确查找不应因一个无关的畸形 initiative 文件夹而失败。
- 其它 initiative 文件依赖 schema/config，不应被硬编码进 `show`。
- 把候选留在诊断详情内部，与 GraphQL 风格响应的总体形态一致：成功的数据保持干净，而错误特有的上下文随错误一起走。
- 如果以后需要选择器来源，就加入一个单独的显式字段（例如 `resolution`），而不是把来源放进 `context_store` 内部。
- 人类输出应保持紧凑：title、id、summary、context store、location 与 metadata path。

##### 实现证据

- `src/core/collections/initiatives/operations.ts` 加入 `readInitiative` 用于精确的 initiative 查找。
- `src/commands/initiative.ts` 加入 `initiative show <id>`，带全 store 默认查找、`--store`、`--store-path`、JSON 输出、紧凑的人类输出、歧义诊断与不完整查找诊断。
- `src/core/completions/command-registry.ts` 加入 `initiative show` 的静态 completion metadata。
- `test/core/collections/initiatives/operations.test.ts` 覆盖精确读取、缺失的 initiative、无效的精确 initiative、id 不匹配与无关的无效文件夹。
- `test/commands/initiative.test.ts` 覆盖 `initiative show` 成功、`--store-path`、人类输出、歧义、不完整查找、not found、无效的精确 initiative 状态、无 `context_store.source`、无 `files`、无顶层 `matches` 与静态 completion。

##### 验证

- `pnpm run build`
- `pnpm exec vitest run test/core/collections/initiatives/operations.test.ts`
- `pnpm exec vitest run test/commands/initiative.test.ts`
- `pnpm exec vitest run test/commands/context-store.test.ts
  test/commands/initiative.test.ts test/core/context-store/foundation.test.ts
  test/core/context-store/registry.test.ts
  test/core/collections/initiatives/operations.test.ts`
- `pnpm run lint`
- `git diff --check`
- 对 initiative 路线图、任务追踪器与 Item 7 work-item 笔记的 Markdown 行长检查。

#### 43.9.4 其余 19 个 work item

- `01-lock-the-direction` —— 把 workspace-to-initiative 的转向弄得足够显式，使未来的 agent 与贡献者不再继续实现更早的「workspace 拥有计划」模型；这是一次非 spec 的方向走查，不是运行时移除。
- `02-stabilize-workspace-as-local-view` —— 保持 workspace setup、link、relink、list、open、update 与 doctor 有用，同时说清 workspace 是可再生成的机器本地视图，而不是持久协调对象。
- `03-add-context-store-foundation` —— 加入最小的核心 context store 基础，而不让 store 层知道 initiative、collection、workspace 或 repo-local change。
- `04-add-collection-foundation` —— 加入最小的 collection 基础，让产品特有的内容系统挂载进 context store，而不让 context-store 层知道那些系统意味着什么。
- `05-ship-initiative-mvp` —— 在 `initiatives/` collection 内部，给被协调的工作一个持久的、共享的、agent 可消费的归属地。
- `06-add-minimal-context-store-ux` —— 让用户或 agent 在不知道内部 registry 布局的情况下创建、注册、列出并诊断本地 context store。
- `07-add-agent-first-initiative-discovery` —— 见上，本节的代表性 item。
- `08-connect-repo-local-changes-to-initiatives` —— 让 agent 把一个 repo-local 的 OpenSpec change 创建或链接到一个共享 initiative，而不复制 initiative 散文、不存机器本地路径，也不让 initiative 拥有 repo 实现 artifact。
- `09-add-initiative-resolve` —— 最终决策：不实现独立的 `openspec initiative resolve`，现在不实现，以后也不实现；该 item 因此从「加一条命令」变成一次只做决策的检查点。
- `10-let-workspaces-open-initiatives` —— 锁定方向是 workspace 不包含工作，它只记住这个 runtime 如何打开工作；持久化的只有极小的私有本地视图选择，生成的是 opener 特有的 runtime 文件。
- `11-manual-beta-reality-pass` —— 用手工跑一遍当前 beta 流程，在构建更多表面之前把摩擦当作产品输入；产物是笔记，不是打磨。
- `12-context-store-first-run-and-cleanup-ux` —— 覆盖后续文档、schema 或 handoff 工作未完全捕获的 context-store setup 与 cleanup 缺口。
- `13-agent-handoff-output-and-delivery-polish` —— 作为实现项已推迟；保留这份笔记作为未来 handoff 回执模型的研究输入，而不实现硬编码的「Next for your agent」。
- `14-workspaces-beta-guide-split` —— 让 beta 文档匹配人们实际使用该功能的方式：人用终端提示做本地设置与本地路径，编码 agent 用显式 CLI 命令做 OpenSpec 工作。
- `15-context-store-project-roots-and-schema-led-initiatives` —— 用「类 project 的 context-store root 加迭代式、schema 主导的 initiative artifact 流程」替换当前「initiative create 写出一整包硬编码六文件」的模型。
- `16-add-escalation-ux` —— 让用户从本地开始，只有当工作确实需要共享上下文时才升级为一个被协调的 initiative。
- `17-harden-team-shared-coordination` —— 让 initiative 对若干队友实用，而不把 setup 变成一场管理仪式。
- `18-explore-initiative-hosted-target-bound-change-artifacts` —— 未开始；把泛泛的「可配置 change home」收窄成更锋利的问题：共享的 initiative artifact 何时能变成可执行的、绑定 target 的 OpenSpec change。
- `19-review-workspace-beta-compatibility-before-public-release` —— 在 workspace 变成公开/稳定之前，决定哪些 beta workspace 兼容行为真正值得保留下去。
- `proposed-initiative-next-agent-handoff-ux` —— 讨论草稿，尚未锁定进带编号的路线图：给 agent 一条小小的「现在做什么？」handoff 命令（`openspec initiative next <id> --json`），外加一份让新 agent 获得基线 OpenSpec 素养的 `use-openspec` skill。
