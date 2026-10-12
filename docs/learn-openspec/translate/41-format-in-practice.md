## 41 格式实物 —— 真实 change 长什么样

> 译自 `reference/openspec/openspec/config.yaml`（36 行）、`reference/openspec/openspec/changes/add-status-next-step/`（`.openspec.yaml`、`proposal.md`、`tasks.md`、`specs/cli-artifact-workflow/spec.md`）与 `reference/openspec/openspec/changes/fix-schemas-root-selection/`（`.openspec.yaml`、`proposal.md`、`design.md`、`tasks.md`、`specs/schema-resolution/spec.md`）。按 `READING-openspec.md` 第 41 项。
> 读法：`config.yaml` 的 YAML 逐字节原样保留，下面另附它那段散文的中译；两个 change 的每个产物各给一份中译，都放在 ```markdown 围栏里 —— 围栏内 spec 语法逐字保留英文（`## MODIFIED Requirements`、`## ADDED Requirements`、`### Requirement: <name>`、`#### Scenario: <name>`，以及 `- **WHEN**` / `- **THEN**` / `- **AND**` / `- **GIVEN**` 标记），`SHALL` 作为规范力度词也留在原文；YAML 元数据块全字节保留；`- [ ]` / `- [x]` 复选框逐字节保留，只译编号后面的任务描述。

### 41.1 openspec/config.yaml —— 最小的 context/rules 注入实例

`reference/openspec/openspec/config.yaml`（36 行，YAML 原样保留）：

```yaml
schema: spec-driven

context: |
  Tech stack: TypeScript, Node.js (≥20.19.0), ESM modules
  Package manager: pnpm
  CLI framework: Commander.js

  Product language:
  - Write OpenSpec proposals and specs in user-facing product behavior language
  - Requirements should describe the experience, observable behavior, and product contract
  - Avoid implementation-negative SHALL statements when a positive user outcome can express the same rule
  - Put internal mechanisms in design.md or tasks.md unless the mechanism is itself part of the user-facing contract

  Cross-platform requirements:
  - This tool runs on macOS, Linux, AND Windows
  - Always use path.join() or path.resolve() for file paths - never hardcode slashes
  - Never assume forward-slash path separators
  - Tests must use path.join() for expected path values, not hardcoded strings
  - Consider case sensitivity differences in file systems

rules:
  specs:
    - Include scenarios for Windows path handling when dealing with file paths
    - Requirements involving paths must specify cross-platform behavior
    - Prefer user-facing product behavior and observable outcomes over internal implementation mechanics
    - Include HOW details only when the mechanism is part of the product contract
    - If we generate artifacts, specify deletion/modification by explicit list lookup, not pattern matching
  tasks:
    - Add Windows CI verification as a task when changes involve file paths
    - Include cross-platform testing considerations
  design:
    - Document any platform-specific behavior or limitations
    - Prefer Node.js path module over string manipulation for paths
    - Use existing constants and lists - don't invent detection mechanisms
    - Prefer explicit lookups over pattern matching or regex
    - If we generate it, we track it by name in a constant
```

文件里那些散文内容的中译：

- `schema: spec-driven`
- `context:`（块标量：注入给 agent 的项目上下文）
  - 技术栈：TypeScript、Node.js（≥20.19.0）、ESM 模块
  - 包管理器：pnpm
  - CLI 框架：Commander.js
  - 产品语言（Product language）：
    - 用面向用户的产品行为语言来写 OpenSpec 的 proposal 和 spec
    - requirement 应当描述体验、可观察的行为以及产品契约
    - 当一个正向的用户结果能表达同一条规则时，避免写成实现层面的否定式 SHALL 语句
    - 把内部机制放进 design.md 或 tasks.md，除非该机制本身就是面向用户契约的一部分
  - 跨平台要求（Cross-platform requirements）：
    - 这个工具要在 macOS、Linux **和** Windows 上运行
    - 文件路径一律用 path.join() 或 path.resolve() —— 绝不硬编码斜杠
    - 绝不假定路径分隔符是正斜杠
    - 测试里表示期望路径值时必须用 path.join()，不能用硬编码字符串
    - 考虑文件系统之间的大小写敏感差异
- `rules:`（按 artifact id 分组、逐 artifact 注入的规则）
  - `specs`：
    - 处理文件路径时，为 Windows 路径处理补上 scenario
    - 涉及路径的 requirement 必须写明跨平台行为
    - 相比内部实现机制，优先写面向用户的产品行为与可观察结果
    - 只有当机制是产品契约的一部分时，才写 HOW 细节
    - 如果我们生成产物，就用显式的列表查找来指定删除/修改，而不是模式匹配
  - `tasks`：
    - 变更涉及文件路径时，把 Windows CI 校验作为一项任务加进去
    - 包含跨平台测试的考量
  - `design`：
    - 记录任何平台特有的行为或限制
    - 路径处理优先用 Node.js 的 path 模块，而不是字符串操作
    - 使用已有的常量和列表 —— 不要另造检测机制
    - 优先用显式查找，而不是模式匹配或正则
    - 如果我们生成它，就在一个常量里按名字追踪它

### 41.2 changes/add-status-next-step/ —— 一份模范 proposal

该目录共 4 个文件（外加一层 `specs/cli-artifact-workflow/`）。

`.openspec.yaml`（2 行，原样保留）：

```yaml
schema: spec-driven
created: 2026-09-04
```

`proposal.md`（44 行）中译：

```markdown
# 点名那条能让 change 重新继续的命令（Name the command that resumes a change）

## 为什么（Why）

`openspec status` 报告一个 change 处在什么位置，然后就停在那儿。那条把它往前推的命令其实早就被算出来了：`buildNextSteps` 推导出它，`--json` 把它作为 `nextSteps` 发布出去。但文本界面从来没有把它渲染出来。

于是人真正会去读的那个界面停在了一张清单上。`openspec new change` 交棒时说的是 `Next: openspec status --change <name>`，而那条下一步命令本身却没有自己的动词。丢了一次会话之后重新捡起一个 change，或者打开别人起头的一个 change，都意味着你必须事先就知道下一条命令是哪条（#906）。

完成态是最糟的一种。一旦每个规划 artifact 都存在，status 就只打出一句孤零零的绿色 "All planning artifacts complete!"，读起来像*你已经做完了*，哪怕 `tasks.md` 还只勾了一半。这正是 #906 报的问题：每个 artifact 都显示 `done` 而不是 `ready`，于是结论变成了没有任何东西还需要跑。

## 改什么（What Changes）

- `openspec status` 结尾多一行 `Next:`，点名一条命令：规划还没完成时是下一个 ready artifact 的 `openspec instructions` 调用，一旦每个规划 artifact 都存在则是 `openspec instructions apply`。
- 只要解析出的 root 是一个 store，这一行就带上 `--store <id>`。不带这个参数的命令会针对指针仓库解析，而不是 status 真正被读取的那个 store。
- `--all` 让 sweep 里的每个 change 各拿到自己的一行，而加载失败的条目一行都不给，因为失败的条目没有 artifact 状态可供推理。
- 这一行与 JSON 里 `nextSteps` 那句话出自同一次解析，所以两个界面不可能点名不同的命令。`nextSteps` 本身一字未变。

没有新命令，没有新参数，没有新 JSON 字段。这只是把一个 agent 契约早就在发布的值渲染出来。

## 影响（Impact）

- 受影响的 spec：`cli-artifact-workflow`（MODIFIED: Next Artifact Discovery）
- 受影响的代码：`src/commands/workflow/status.ts`、`src/core/change-status-policy.ts`
- 受影响的文档：`docs/cli.md`（status 的文本输出示例）
```

`tasks.md`（17 行）中译：

```markdown
# 任务（Tasks）

## 1. 只解析一次下一步（Resolve the next step once）
- [x] 1.1 抽出 `resolveNextStep`，返回命令与那句话，让 `buildNextSteps` 仍然只返回那同一句话，这样 JSON 契约不变
- [x] 1.2 在单元测试里逐字钉住已发布的那几句话，这样把命令从话里拆出来就不可能改动契约的措辞

## 2. 把它渲染到文本界面（Render it on the text surface）
- [x] 2.1 从解析出的命令打印一行 `Next:`，放在完成提示行之后，而不是取代它
- [x] 2.2 把 store 选择串进渲染器，让命令带上 `--store`
- [x] 2.3 给 `--all` sweep 里的每个 change 各一行，失败的条目一行也不给

## 3. 覆盖这些行为（Cover the behavior）
- [x] 3.1 端到端断言 ready、planning-complete、skipped 与自定义 schema 这几种情况
- [x] 3.2 断言打印出的命令逐字出现在 JSON 那句话里，并断言这一行永远不会漏进 `--json`

## 4. 记录下来（Record it）
- [x] 4.1 更新 `cli-artifact-workflow` 的 spec delta 与 `docs/cli.md` 的 status 输出示例
```

`specs/cli-artifact-workflow/spec.md`（37 行）中译：

```markdown
## MODIFIED Requirements

### Requirement: Next Artifact Discovery

这个工作流 SHALL 用 `openspec status` 的输出来判断接下来能创建什么，而不是靠一个单独的「下一条命令」界面。

#### Scenario: Discover next artifacts from status output

- **WHEN** 用户需要知道接下来该创建哪个 artifact
- **THEN** `openspec status --change <id>` 用 `[ ]` 标出 ready 的 artifact
- **AND** 第一个 `[ ]` 条目就是 schema 推荐的下一个 artifact
- **AND** 继续这个工作流不需要任何专门的「下一条命令」

#### Scenario: Status names the command that moves the change forward

- **WHEN** 用户在文本模式下跑 `openspec status --change <id>`，并且解析出了一个下一步
- **THEN** 输出的结尾是一行 `Next:`，恰好点名一条要跑的命令
- **AND** 只要还有任何规划 artifact 处于 ready，这条命令就是针对第一个 ready artifact 的 `openspec instructions <artifact> --change "<id>" --json`
- **AND** 一旦每个规划 artifact 都存在，它就是 `openspec instructions apply --change "<id>" --json`，打印在完成提示行之后而不是取代它，因为实现任务还没做完时，单看那一行会读成「你已经做完了」
- **AND** 被点名的 artifact 永远不会是这个 change 跳过（skip）的那个 —— 它满足自己的下游，却绝不能被创建
- **AND** artifact id 来自解析出的 schema，所以即便某个项目的 schema 一个默认 artifact 名都没声明，它仍然能拿到一条可用的命令

#### Scenario: The named command carries the store selection

- **WHEN** 解析出的 root 是一个 store
- **THEN** `Next:` 那条命令带上 `--store <id>`，于是它针对读取 status 的同一个 root 解析，而不是指针仓库

#### Scenario: Both surfaces name the same command

- **WHEN** 解析出了一个下一步
- **THEN** 打印在 `Next:` 行上的命令与 JSON `nextSteps` 那句话里的命令出自同一次解析，所以两个界面不可能点名不同的命令
- **AND** `Next:` 这一行永远不会出现在 `--json` 输出里，输出保持可解析

#### Scenario: No next step resolves

- **WHEN** 没有任何 artifact 处于 ready 且规划尚未完成，或者 `--all` sweep 里有某个 change 加载失败
- **THEN** 不为它打印任何 `Next:` 行，而不是给一条猜出来或共用的命令
```

### 41.3 changes/fix-schemas-root-selection/ —— 尺寸读得动的完整四件套

该目录共 5 个文件（外加一层 `specs/schema-resolution/`）：`proposal.md` 2.4K + `design.md` 6.8K + `spec.md` 4.2K + `tasks.md` 3.1K，加元数据 42 字节。

`.openspec.yaml`（2 行，原样保留）：

```yaml
schema: spec-driven
created: 2026-08-09
```

`proposal.md`（29 行）中译：

```markdown
## 为什么（Why）

`openspec schemas` 从 shell 的当前目录去发现项目本地的 schema，而消费 schema 的那些命令会先解析出一个权威的 OpenSpec root。当一个显式 store、一个本地 `store:` 指针或 `defaultStore` 选中了另一个 root 时，发现流程可能推荐一个在 change 真正会被创建的地方并不存在的 schema。目前 agent 只能绕过这个错配：解析出一个路径，然后试图改掉自己 shell 的工作目录 —— 这在受支持的各家工具上并不可靠。

## 改什么（What Changes）

- 让 `openspec schemas` 在列出 schema 之前，通过与常规 OpenSpec 命令相同的 root 选择契约来解析它的项目 root。
- 给 `openspec schemas` 加上 `--store <id>`，包括那条标准的隐藏 `--store-path` 拒绝路径，让显式的 store 选择直接由 CLI 承载。
- 沿用既有的优先级与诊断，尊重最近的 root、本地 `store:` 指针与全局 `defaultStore`；不要另加一个 schema 专用的 root 解析器。
- 保留成功的 human 与 JSON schema 列表输出形状，以及在没有 root、也没有已注册 store 时既有的无 root 兜底。
- 为显式 store、声明的指针、全局默认、最近 root 优先级、错误处理与补全元数据补上 CLI 回归覆盖。
- 更新共享的「支持 store 的命令」指引、已提交的生成技能快照与生成内容 parity 哈希，把 `schemas` 列进去，并同步正式的 CLI 与 JSON agent 契约参考；保留既有的 `propose` 兼容流程，同时去掉它那句如今已不成立的「`schemas` 不能接受 `--store`」。

## 能力（Capabilities）

### 新增能力（New Capabilities）

无。

### 修改的能力（Modified Capabilities）

- `schema-resolution`：`openspec schemas` 从权威的 OpenSpec root 解析并列出 schema，包括显式选中与已配置的 store。

## 影响（Impact）

- 受影响的 CLI 表面：`openspec schemas [--json] [--store <id>]`。
- 受影响的代码：workflow 的 schemas 命令、CLI 选项注册、命令补全元数据、共享的支持 store 的命令列表，以及直接受影响的命令契约文档。
- 受影响的测试：一套聚焦的 schemas 命令测试，加上 CLI/补全的回归覆盖。
- 不修改 schema 格式、选择策略、任何工作流特有的流程或 change 创建行为；唯一一处工作流特有的措辞改动，是纠正那句已经过时的「`schemas` 不能接受 `--store`」。
```

`design.md`（79 行）中译：

```markdown
## 背景（Context）

动机见 `proposal.md`，行为契约见 `specs/schema-resolution/spec.md`。

修复前的 CLI 有两个本就彼此兼容、却没有接上的部件：

- `schemasCommand()` 把 `process.cwd()` 直接传给 `listSchemasWithInfo()`。
- `listSchemasWithInfo(projectRoot)` 在拿到一个权威的项目 root 时，本来就能列出正确的项目本地、用户与包内置 schema。
- 常规的按 root 作用域的命令本来就会调 `resolveRootForCommand()`，它实现了显式 store、最近的 root、本地 `store:` 指针、全局 `defaultStore`、无 root 兜底、规范化（canonicalization）与共享诊断。

这个错配是在构建产物 CLI 上、用彼此不同的 `local-only` 与 `store-only` 两个 schema 复现出来的。从本地项目出发，`schemas --json` 返回了 `local-only` 并漏掉了 `store-only`，而 `context --json --store team-context` 却把操作 root 解析到了那个 store。修复前相关的测试基线是通过的（110 个测试），所以这个复现不是某个既有失败测试套件造成的。

## 目标 / 非目标（Goals / Non-Goals）

**目标（Goals）：**

- 让 schema 发现与 schema 消费解析出同一个 root。
- 通过一个受支持的 CLI 参数承载显式的 store 选择。
- 复用规范的 root 选择实现及其诊断。
- 保留成功的 schema 列表输出兼容性与跨平台路径处理。

**非目标（Non-Goals）：**

- 不改在一个已解析 root 内部的 schema 解析优先级。
- 不改 schema 描述、语义选择策略或任何工作流特有行为，只纠正过时的 `schemas --store` 指引。
- 不新增裸的文件系统 root 参数，也不在成功的 JSON 输出里暴露解析出的路径。
- 不修改 `context`、`templates`、change 创建，也不改 root 解析器本身。
- 不重构既有的 `propose` 兼容序列；只改它那句已经过时的参数支持声明。

## 决策（Decisions）

### 1. 在 CLI 命令边界处解析 root（Resolve the root at the CLI command boundary）

`schemasCommand()` 将接受标准的 store 选择字段，并在调用 `listSchemasWithInfo(root.path)` 之前先调 `resolveRootForCommand()`。这与 `status` 及其它按 root 作用域的 workflow 命令用的是同一个边界。

在 `listSchemasWithInfo()` 内部做解析被否决了，因为那个函数同时也是一个编程 API，并且在省略 `projectRoot` 时有意保持向后兼容的行为。root 选择是 CLI/会话层面的事；schema 枚举应当仍然是对它拿到的那个 root 的纯操作。

### 2. 加上标准的 store 选项与拒绝路径（Add the standard store option and rejection path）

`schemas` 的 Commander 注册将用 `COMMON_FLAGS.store` 加上 `--store <id>`，并使用共享的隐藏 `--store-path` 选项。`SchemasOptions` 将承载 `store` 与 `storePath`，命令补全元数据也会加上同一个通用 store 参数。因为仓库强制要求每条暴露 `--store` 的命令都被共享的 store 选择指引点名，那个共享命令列表、已提交的生成技能快照与生成内容 parity 哈希都会更新以纳入 `schemas`。正式的 CLI/JSON agent 契约参考会同步，既有的 `propose` 兼容流程只会丢掉它那句如今已不成立的「`schemas` 不能接受这个参数」的断言；它的 root 解析顺序保持不变。

裸的 `--root` 或 `--cwd` 参数被否决了，因为它会绕过注册表校验、store 身份检查、规范化与既有诊断。让 Agent 去跑 `cd <root.path> && openspec schemas` 也被否决了，因为生成的工具权限与工作目录支持在不同 Agent 之间各不相同。

### 3. 保留规范的 root 优先级，不另设 schemas 专用兜底（Preserve canonical root precedence without a schemas-specific fallback）

这条命令将原样使用 `resolveRootForCommand()`：

1. 显式的 `--store`。
2. 最近的 OpenSpec root，包括解析一个只有配置的 `store:` 指针。
3. 当没有更近的 root 时，用全局 `defaultStore`。
4. 只有当既没有 root、也没有已注册 store 的选择可用时，才用一个隐式的当前目录 root。

非法指针、过期的默认值、未知 store，以及存在未被选中的已注册 store，仍然是 fail-closed。加一条 schemas 专用的捕获并兜底路径被否决了，因为它会重新造出这次改动要消除的那个错配。

### 4. 保留成功输出；沿用既有的 JSON 失败契约（Preserve success output; use the existing JSON failure contract）

成功的 human 输出仍是当前这份列表，成功的 JSON 仍是顶层的 schema 数组。不添加任何 root 元数据，避免破坏输出形状的改动。

当 root 解析在 `--json` 下失败时，既有的命令适配器会输出一份机器可读的失败文档：空的 schema 列表、null root，以及那条共享的 status 诊断。human 模式保留其它命令所用的标准 root 横幅与错误/修复呈现。

### 5. 测用户可见的命令，而不是实现层的 mock（Test the user-visible command, not an implementation mock）

一套聚焦的 CLI 测试将构造真实的临时 root 与已注册 store，各自带有不同且合法的项目本地 schema。它会演练显式 store 选择、本地指针、全局默认、最近 root 优先级、无 root 兼容性、fail-closed 错误、带空格的路径，以及那个隐藏的已移除选项。补全元数据另有一条聚焦的注册表断言。

测试将按 `test/AGENTS.md` 使用 Node 的路径工具与规范的 fixture 辅助函数；不做任何比较非规范写法的路径同一性断言。

## 风险 / 取舍（Risks / Trade-offs）

- **有已注册 store 但没有选中 root 的用户，不能再把 `schemas` 当作一个未加作用域、只列包内置项的列表来用。** → 返回与其它按 root 作用域的命令相同的、可操作的「请选择」诊断；选中一个 store 或进入某个 root 就能让结果变得权威。
- **加入 root 解析会引入新的 JSON 失败路径。** → 显式断言单文档的失败输出与非零退出行为。
- **带有空格或平台特有分隔符的 store root 可能暴露路径假设。** → 在内部解析路径，并加一个真实的 CLI fixture，其 store 路径带空格；绝不去拼一条 shell 命令。
- **那个功能 PR 仍然需要把它的 schema 选择流程与显式 store 选择整合起来。** → 这次修复同步了共享指引与既有的 `propose` 兼容措辞，但把这个功能特有的选择/确认行为留给那条分支，在这个独立的 CLI 修复合并之后再做。

## 迁移方案（Migration Plan）

1. 发布能感知 root 的 `schemas` 命令与 `--store` 参数。
2. 在它自己的分支上更新依赖它的、功能特有的 schema 选择指引；这次修复之后，共享的支持 store 的命令列表与既有的 `propose` 兼容措辞就已经支持 `schemas --store` 了。
3. 既有的成功且未加作用域的输出保持兼容；面向某个已注册 store 的脚本应当加上 `--store <id>`。
4. 回滚时移除该参数，把 `schemasCommand()` 还回 `process.cwd()`，不改 schema 文件，也不改已注册 store 的状态。
```

`tasks.md`（22 行）中译：

```markdown
## 1. 用 CLI 测试钉死 root 选择的回归（Lock the root-selection regression with CLI tests）

- [x] 1.1 新增 `test/commands/schemas.test.ts`：真实的临时本地 root 与已注册 store root、合法且彼此不同的项目 schema、隔离的 XDG 数据/配置 home、规范化清理，以及一个带空格的 store 路径。
- [x] 1.2 加上失败用例，证明 `schemas --json --store <id>` 返回 store-only 的 schema 而不是 cwd-only 的那个，并且 `schemas --store-path <path>` 会走到那条刻意保留的「已移除选项」诊断。
- [x] 1.3 加上失败用例，证明只有配置的 `store:` 与全局 `defaultStore` root 不带参数也能提供 schema，而一个最近的真实 root 会胜过 `defaultStore`。
- [x] 1.4 为无 root 兼容性、未选中已注册 store 的失败、非法/不可用 store 的失败、单文档 JSON 诊断，以及成功时数组输出不变，加上失败用例。
- [x] 1.5 扩展 `test/core/completions/command-registry.test.ts`，要求 `schemas` 定义上带通用的 `store` 参数，并要求共享的 store 选择指引点名它。
- [x] 1.6 跑 `pnpm exec vitest run test/commands/schemas.test.ts test/core/completions/command-registry.test.ts`，确认新测试失败的原因仅仅是 `schemas` 缺少权威的 root 选择与 `--store` 支持。

## 2. 实现规范的 schemas root 选择（Implement canonical schemas root selection）

- [x] 2.1 在 `src/commands/workflow/schemas.ts` 里给 `SchemasOptions` 加上 `store` 与 `storePath`，通过 `resolveRootForCommand()` 解析，在 JSON 解析失败时提前返回，并把 `root.path` 传给 `listSchemasWithInfo()`。
- [x] 2.2 更新 `src/cli/index.ts` 里 `schemas` 的注册：加上 `--store <id>`、共享的隐藏 `--store-path` 选项，以及能感知 JSON 的失败处理，同时不改成功的输出形状。
- [x] 2.3 在 `src/core/completions/command-registry.ts` 里给 `schemas` 条目加上 `COMMON_FLAGS.store`，把 `schemas` 加进共享的支持 store 的命令指引，同步已提交的生成技能快照与正式的 CLI/JSON agent 契约参考，在不改兼容流程的前提下移除 `propose` 那句过时声明，并刷新生成内容 parity 哈希。
- [x] 2.4 跑 `pnpm run build`，然后重跑 `pnpm exec vitest run test/commands/schemas.test.ts test/core/completions/command-registry.test.ts`，确认所有 root、错误、输出兼容与补全用例都通过。

## 3. 回归与跨平台验证（Regression and cross-platform verification）

- [x] 3.1 跑 `pnpm exec vitest run test/cli-e2e/basic.test.ts test/commands/context.test.ts test/commands/global-default-store.test.ts test/core/root-selection.test.ts test/core/artifact-graph/resolver.test.ts`，验证相邻的 root 与 schema 行为。
- [x] 3.2 跑 `pnpm run lint`、`pnpm run build` 与 `pnpm test`；确认成功的 `schemas` 输出没有回归，且作用域外的 CLI、测试、生成的指引/文档与 proposal 文件都没有变化。
- [x] 3.3 跑 `pnpm exec openspec validate fix-schemas-root-selection --strict` 与 `git diff --check`。
- [ ] 3.4 在 Windows CI 上验证聚焦的 schemas 测试套件，特别是带空格的本地 store 路径，以及不存在硬编码的路径分隔符。
```

`specs/schema-resolution/spec.md`（80 行）中译：

```markdown
## ADDED Requirements

### Requirement: Schemas command SHALL honor authoritative root selection

`openspec schemas` SHALL 用与其它按 root 作用域的命令相同的优先级与诊断来解析权威的 OpenSpec root，然后用那个 root 列出 schema。这条命令 SHALL 接受 `--store <id>`，用于显式选择已注册的 store。成功的 human 输出与成功的 `--json` 输出 SHALL 保持它们既有的格式。

#### Scenario: Nearest project root supplies schemas

- **GIVEN** 当前目录位于一个含项目本地 schema 的 OpenSpec root 里
- **WHEN** 用户跑 `openspec schemas --json`
- **THEN** 结果 SHALL 包含那个 root 的项目本地 schema

#### Scenario: Explicit store overrides the current project

- **GIVEN** 当前项目与某个已注册 store 各自含有不同的项目本地 schema
- **WHEN** 用户跑 `openspec schemas --json --store <id>`
- **THEN** 结果 SHALL 包含来自所选 store root 的 schema
- **AND** 它 SHALL NOT 包含只存在于当前项目里的 schema

#### Scenario: Local store pointer supplies schemas

- **GIVEN** 最近的那个 `openspec/config.yaml` 是一个只有配置、声明了 `store: <id>` 的 root
- **WHEN** 用户不带显式 store 参数跑 `openspec schemas --json`
- **THEN** 结果 SHALL 包含来自所声明 store root 的 schema

#### Scenario: Global default store supplies schemas

- **GIVEN** 不存在更近的 OpenSpec root 或指针
- **AND** 全局配置声明了 `defaultStore: <id>`
- **WHEN** 用户跑 `openspec schemas --json`
- **THEN** 结果 SHALL 包含来自默认 store root 的 schema

#### Scenario: Explicit store preserves root-selection precedence

- **GIVEN** 一个最近的 project root、一个全局默认 store，以及一个被显式选中的已注册 store 同时存在
- **WHEN** 用户跑 `openspec schemas --json --store <id>`
- **THEN** 被显式选中的那个 store SHALL 提供项目本地的 schema

#### Scenario: Nearest root precedes the global default

- **GIVEN** 一个最近的 project root 与一个全局默认 store 含有不同的 schema
- **WHEN** 用户不带 `--store` 跑 `openspec schemas --json`
- **THEN** 最近的 project root SHALL 提供项目本地的 schema

#### Scenario: Rootless listing remains available without registered stores

- **GIVEN** 不存在 OpenSpec root、指针、全局默认，也不存在已注册 store
- **WHEN** 用户跑 `openspec schemas --json`
- **THEN** 这条命令 SHALL 像以前一样，把当前目录当作它的隐式 root，列出用户与包内置的 schema

#### Scenario: Registered stores require an authoritative selection

- **GIVEN** 不存在 OpenSpec root、指针或全局默认
- **AND** 有一个或多个 store 已注册
- **WHEN** 用户不带 `--store` 跑 `openspec schemas --json`
- **THEN** 这条命令 SHALL 以标准的 root 选择诊断失败，并要求用户选择一个已注册的 store
- **AND** 它 SHALL NOT 静默地从当前目录列出 schema

#### Scenario: Invalid or unavailable store fails closed

- **WHEN** 显式、声明或全局默认的 store 解析失败
- **THEN** `openspec schemas` SHALL 报告既有的 root 选择诊断并以非零码退出
- **AND** 它 SHALL NOT 退回使用当前目录的 schema

#### Scenario: Removed store-path option is rejected deliberately

- **WHEN** 用户跑 `openspec schemas --store-path <path>`
- **THEN** 这条命令 SHALL 拒绝这个已移除的选项，并给出标准指引：注册该 store 并使用 `--store <id>`

#### Scenario: Success output remains compatible

- **WHEN** root 解析成功
- **THEN** human 输出 SHALL 保留既有的 schema 列表与来源标签
- **AND** `--json` 输出 SHALL 仍然是既有的顶层 schema 信息数组

#### Scenario: Store path works across supported platforms

- **GIVEN** 所选的 store root 使用一个合法的平台原生路径，其中包括一条带空格的路径
- **WHEN** 用户跑 `openspec schemas --json --store <id>`
- **THEN** 这条命令 SHALL 从那个 store 列出 schema，而无需用户或 Agent 去拼一条 shell `cd` 命令
```
