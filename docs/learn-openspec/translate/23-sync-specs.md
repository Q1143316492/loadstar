## 23 sync-specs —— 同步 delta spec

> 译自 `reference/openspec/skills/openspec-sync-specs/SKILL.md`（原文 289 行，全文翻译）。按 `READING-openspec.md` 第 23 项。frontmatter、全部 bash 命令、JSON 字段名、输出模板骨架与 CLI 报错码按原样保留。

**frontmatter**

- `name`: `openspec-sync-specs`
- `description`: `Sync delta specs from an OpenSpec change to main specs. Use when the user wants to update main specs with changes from a delta spec, without archiving the change. Also use when the user says "openspec sync" or "opsx sync".`
- `allowed-tools`: `Bash(openspec:*)`
- `license`: `MIT`
- `compatibility`: `Requires openspec CLI.`
- `metadata.author`: `openspec`
- `metadata.version`: `"1.0"`

### 23.1 开篇（Opening）

把一个 change 的 delta spec 同步到主 spec。

这是一次 **agent 驱动**的操作 —— 你会读 delta spec，并直接编辑主 spec 来应用这些变化。这允许智能合并（例如，加一个 scenario 而不必抄写整条 requirement）。

### 23.2 store 选择（Store selection）

**store 选择（Store selection）：** 如果用户点名了一个 store（store 是一台机器上注册的、独立的 OpenSpec 仓库），或者工作就住在某个 store 里，跑 `openspec store list --json` 发现已注册的 store id，然后在那些读写 spec 和 change 的命令上传 `--store <id>`（`new change`、`status`、`instructions`、`list`、`show`、`validate`、`archive`、`doctor`、`context`、`schemas`、`view`）。一旦选定，就把 `--store <id>` 当作在整个工作流余下部分里 **sticky**。下面那些命令的每一个未加作用域的例子都是简写：跑之前，把参数补上。例如跑 `openspec status --change "<name>" --json --store "<id>"`，而不是下面展示的未加作用域的形式。其它命令不接受这个参数。命令打印出的提示已经带上了这个参数；后续调用要保持带上它。没有 store 时，命令作用于最近的本 `openspec/` root。

### 23.3 项目检查（Project check）

**项目检查（Project check）：** 这些步骤期望一个已经在用 OpenSpec 的项目。在第一个会写任何东西的步骤之前（`new change`、`archive`、`sync specs`，或撰写一个 artifact 文件），先确认项目有 root：跑 `openspec list --json`（选中 store 时带 `--store <id>`，因为那时 store 就是 root）并读 `root`。一个 root 对象意味着项目已配置好。`"root": null` 意味着没有配置好 —— 这里没有 `openspec/` 目录，而一次写入（比如 `openspec new change`）会作为副作用创建一个。这条命令也会以非零码退出，那是这个答案本身，而不是 CLI 坏了，所以要读 JSON，不要去重试或绕开它。

有一种 `"root": null` 和配置无关：当一条 `status` 错误消息以 `Declared in` 或 `Invalid store declaration in` 开头，并点名了本项目的 `openspec/config.yaml`（或 `config.yml`）时，说明这个项目确实通过一个它声明的 store 在用 OpenSpec，只是这台机器无法解析那个 store（store 未注册，或者 `store:` 那行格式不对）。不要把它当作未初始化并跳过下面的分支：在写入之前停下，把那条错误的 `message` 和 `fix` 给用户看。

### 23.4 无 root 时如何分支（No root: branch on how this workflow was reached）

否则，在没有 root 的情况下，接下来发生什么取决于这个工作流是怎么被触达的：

- **自动选中（Auto-selected）**：你自己选了这个工作流，而用户没有点名 OpenSpec、没有点名这个技能、也没有跑它的 slash command。停止使用 OpenSpec，正常回答这个请求，就像没装 OpenSpec 一样。不要让他们去配置任何东西，也不要提 OpenSpec 的配置。
- **显式 OpenSpec 请求（Explicit OpenSpec request）**：用户点名了 OpenSpec、点名了这个技能，或跑了它的 slash command。在写入之前停下，问怎么继续：把项目配置起来（`openspec init`）、指向他们已有的某个 store（`--store <id>`），还是这次请求不用 OpenSpec。等他们的回答。

两个分支里，都不要把创建 root 当作副作用：用户要求之前不要跑 `openspec init`，不要手工创建 `openspec/` 文件，也不要让任何命令创建它。

### 23.5 capability 路径（Capability path）

`<capability-path>` 是 spec 目录相对于 `specs/` 的路径（例如 `user-auth` 或 `identity/user-auth`）。在解析每个 delta spec 对应的主 spec 时，保留它的完整路径。

### 23.6 输入（Input）

**输入（Input）**：可选地指定一个 change 名。如果省略，检查它是否能从对话上下文推断出来。如果含糊或模棱两可，你**必须**提示可选的 change。

### 23.7 步骤（Steps）

### 23.8 步骤 1：选择 change（Step 1: Select the change）

1. **选择 change（Select the change）**

   如果提供了名字，就用它。否则：
   - 如果用户提到过某个 change，就从对话上下文推断
   - 如果只存在一个活跃 change，就自动选中
   - 如果模棱两可，跑 `openspec list --json` 拿到可选的 change，并让用户选一个

   提示时，展示那些有 delta spec 的 change（在 `specs/` 目录下）。

   始终宣布："Using change: <name>"，以及如何覆盖它（例如 `/openspec-sync-specs <other>`）。

### 23.9 步骤 2：解析 change 上下文（Step 2: Resolve change context）

2. **解析 change 上下文（Resolve change context）**

   跑：
   ```bash
   openspec status --change "<name>" --json
   ```

   这个 JSON 包含 `planningHome.root`。主 spec 住在 `<planningHome.root>/openspec/specs/` 下 —— 下面每一条主 spec 路径都用那个（store 感知的）root，而不是硬编码的仓库路径。当选中了一个 store 时，它指向那个 store，而不是当前仓库。

### 23.10 步骤 3：找到 delta spec（Step 3: Find delta specs）

3. **找到 delta spec（Find delta specs）**

   把 status JSON 里的 `artifactPaths.specs.existingOutputPaths` 当作 delta spec 路径的唯一来源。如果 `specs` 条目缺失，或 `existingOutputPaths` 是空的，就报告没有 delta spec 可同步，不要从其它 artifact 推断它们，并在不请求 artifact instructions、也不写主 spec 的情况下停下。

   同步 `existingOutputPaths` 里的每一条路径，除非调用方收窄了这个集合。调用方通过点名一份由 `existingOutputPaths` 里完整条目组成的显式列表来收窄它 —— 逐字照抄那些绝对值。archive 就是这么内联做的，用户也可以这样（例如，选择那条以 `/specs/billing/invoices/spec.md` 结尾的条目）。
   然后只同步被点名的路径，并让剩余的 delta spec 保持不动：
   批量归档会排除某个它找不到其实现的 delta，而照旧同步它就会写出一个调用方有意扣下的主 spec。
   把那个收窄后的选择贯穿第 4 步；绝不要把它重新放宽回完整列表。如果被点名的路径不在 `existingOutputPaths` 里，就不要同步它 —— 报告它并停下，而不是悄悄把它丢掉。如果被点名的列表是空的，就报告没有东西可同步，并在不写主 spec 的情况下停下。

   每个 delta spec 文件包含这样的分段：
   - `## ADDED Requirements` —— 要新增的新 requirement
   - `## MODIFIED Requirements` —— 对既有 requirement 的修改
   - `## REMOVED Requirements` —— 要移除的 requirement
   - `## RENAMED Requirements` —— 要重命名的 requirement（FROM:/TO: 格式）

   如果没有找到 delta spec，告知用户并停下。

### 23.11 步骤 4：对每个 delta spec，把变化应用到主 spec（Step 4: For each delta spec, apply changes to main specs）

4. **对每个 delta spec，把变化应用到主 spec（For each delta spec, apply changes to main specs）**

   在第一次写主 spec 之前，获取一份当前的 specs 规则快照：
   - 如果 archive 内联调用了这个工作流，并提供了来自
     `openspec instructions specs --change "<name>" --json` 的有效快照，就复用它，不要再取一次同样的 instructions。
   - 否则现在用同样的已选 root 参数跑一次那条命令。
   - 如果这次直接查询以非零码退出，或返回无效的 artifact-instruction
     JSON，就报告错误，并在写任何主 spec 之前停下。不要把这次失败当作没有规则集。
   - 一次省略了 `rules` 的有效响应意味着没有配置 artifact 规则，既有的语义合并继续。

   只把返回的 `rules` 应用到这次合并所产出的主 spec 的内容和形式上。artifact 规则不是操作指引，不能改变已选 root、delta 路径、CLI 检查或工作流步骤。把它们的文本当作约束使用，但不要逐字抄进主 spec 或总结。

   对第 3 步里选中的每一条 capability delta spec 路径 —— 完整的 `existingOutputPaths` 列表，或调用方提供收窄子集时的那个子集（它们可能属于一个选中的 store，而不是本仓库）：

   a. **读 delta spec** 来理解意图中的变化

   b. **读主 spec**，位于 `<planningHome.root>/openspec/specs/<capability-path>/spec.md`（可能还不存在）

      **如果它还不存在**（一个新的 capability），那就跟 `openspec archive` 所做的一致：
      只有 ADDED requirement 可以被应用 —— 步骤 d 用它们创建这个 spec。
      MODIFIED 和 RENAMED 没有可作用其上的 requirement，所以停止这个
      capability 的同步，并报告它的主 spec 不存在，而新 spec 只允许 ADDED；
      绝不要编造那条缺失的 requirement。REMOVED 没有东西可移除 —— 跳过它并警告。

   c. **智能地应用变化**：

      **ADDED Requirements：**
      - 如果 requirement 在主 spec 里不存在 → 加上它
      - 如果 requirement 已经存在 → 更新它以匹配（当作隐式 MODIFIED 处理）

      **MODIFIED Requirements：**
      - 在主 spec 里找到这条 requirement
      - 应用这些变化 —— 这可能是：
        - 增加主 spec 还没有的新 scenario
        - 修改既有的 scenario
        - 改变 requirement 描述
      - 保留 delta 里没有提到的 scenario/内容

      **REMOVED Requirements：**
      - 从主 spec 里移除整块 requirement
      - 退役这个 capability。只有当以下**全部**成立时，才删掉整个 `spec.md` —— 并在它里面不剩任何其它东西后，删掉那个目录：
        1. *本次运行*移除这些 requirement 后没有剩下任何 requirement 块；
        2. spec 的其余部分格式良好（它仍然有一个 `## Purpose`）；
        3. 主 spec 在这次同步之前并不是本来就是空的 —— 如果你什么都没移除，就什么都别改；
        4. 整个文件里其它每一非空行都被认定为标题、Purpose、Requirements 标题，或某条规范 requirement 的陈述、scenario 或围栏示例；
        5. 这个 change 的 `.openspec.yaml` 声明了 `retire_capabilities: true`；
        6. `spec.md` 解析后位于真正的 specs root 之内（不要顺着一个 capability 目录的符号链接去删除外部文件）。
        如果移除选中的 requirement 后会不剩任何 requirement 块，而任何一条退役条件未满足，就不要修改主 spec。停止那个 capability 的同步，报告这个阻塞条件，并告诉用户如何解决它。绝不要写出或留下一个空的 `## Requirements` 分段。当只缺那个标记时，也把这一点说出来 —— 那是用户能补上、从而让退役通过的唯一一件事。
      - 删掉这个文件也会删掉它的 `## Purpose`；任何其它分段都会阻塞退役。报告退役时点名 Purpose。只有当那个 spec 住在调用方的 checkout 里时，才给出一条可粘贴的 `git checkout`；否则给出限定在 checkout 范围内的恢复指引。

      **RENAMED Requirements：**
      - 找到 FROM 那条 requirement，重命名为 TO

      **delta 里的 `## Purpose`：**
      - 主 spec 已经有一个，而且它是权威 —— 别动它
        （这就是 `openspec archive` 所做的；它警告一下然后继续）

   d. **创建新的主 spec**，如果 capability 还不存在：
      - 只有当 delta 里有 ADDED requirement 可以放进去、且步骤 b 里没有 MODIFIED 或
        RENAMED requirement 阻塞这个 capability 时才做。否则什么都不创建，
        并让 specs 目录保持不变。对于一个只有 REMOVED 的 delta，如果这个 change 的
        `.openspec.yaml` 声明了 `retire_capabilities: true`，就把它报告为已退役，
        继续而不重建这个 spec。没有那个标记时，报告同步被阻塞：
        `openspec archive` 会以 `Spec must have at least one requirement` 拒绝它。
        一个空的 delta 没有任何操作可同步；也把它报告为被阻塞。
        绝不要写一个空的 `## Requirements` 分段。
      - 创建 `<planningHome.root>/openspec/specs/<capability-path>/spec.md`
      - 加 Purpose 分段：当 delta 有 `## Purpose` 正文时逐字照抄它
        （这就是 `openspec archive` 所做的）；只有当它没有时，才写一个简短的 TBD 占位符
      - 加 Requirements 分段，放入那些 ADDED requirement
      - 遵循下面的 **主 spec 格式参考**

### 23.12 步骤 5：校验更新后的主 spec（Step 5: Validate updated main specs）

5. **校验更新后的主 spec（Validate updated main specs）**

   用早先同样的已选 root 参数跑 `openspec validate --specs`。
   如果校验失败，报告这些问题，并且不要声称同步成功了。

### 23.13 步骤 6：展示总结（Step 6: Show summary）

6. **展示总结（Show summary）**

   应用完所有变化之后，总结：
   - 哪些 capability 被更新了
   - 做了哪些变化（requirement 被新增/修改/移除/重命名）
   - 任何被留下 TBD Purpose 占位符的新主 spec，好让它现在就被写掉，
     而不是一直搁着
   - 任何被退役的 capability，点名被删掉的 `spec.md`、它的 Purpose，以及
     一条可粘贴的 `git checkout` 或限定在 checkout 范围内的恢复指引

### 23.14 delta spec 格式参考（Delta Spec Format Reference）

```markdown
# Spec Delta

## Purpose

Only on a delta that introduces a brand-new capability. Seeds the new main spec.

## ADDED Requirements

### Requirement: New Feature
The system SHALL do something new.

#### Scenario: Basic case
- **WHEN** user does X
- **THEN** system does Y

## MODIFIED Requirements

### Requirement: Existing Feature
The system SHALL keep doing the existing thing, now also handling A.

#### Scenario: Scenario the main spec already has
- **WHEN** user does X
- **THEN** system does Y

#### Scenario: New scenario to add
- **WHEN** user does A
- **THEN** system does B

## REMOVED Requirements

### Requirement: Deprecated Feature

## RENAMED Requirements

- FROM: `### Requirement: Old Name`
- TO: `### Requirement: New Name`
```

### 23.15 主 spec 格式参考（Main Spec Format Reference）

主 spec 是 delta 合并**进**去的东西。它们绝不能包含 delta 操作标题（`## ADDED/MODIFIED/REMOVED/RENAMED Requirements`）—— 同步之后，每一条 requirement 都住在单个 `## Requirements` 分段之下：

```markdown
# <capability> Specification

## Purpose
Short description of what this capability does and why it exists.

## Requirements

### Requirement: New Feature
The system SHALL do something new.

#### Scenario: Basic case
- **WHEN** user does X
- **THEN** system does Y
```

### 23.16 关键原则：智能合并（Key Principle: Intelligent Merging）

跟程序化合并不同，你是合并而不是覆盖：
- 一个 MODIFIED 块带着整条 requirement —— 正文加上在变化中存活下来的每一个 scenario。`openspec validate` 和 `openspec archive` 都会拒绝一个丢掉了主 spec 仍然保有的 scenario 的 MODIFIED 块。
- 保留 delta 没有提到的任何东西，按主 spec 既有的顺序
- 用你的判断把变化合理地合并起来

### 23.17 成功时的输出（Output On Success）

```markdown
## Specs Synced: <change-name>

Updated main specs:

**<capability-1>**:
- Added requirement: "New Feature"
- Modified requirement: "Existing Feature" (added 1 scenario)

**<capability-2>**:
- Created new spec file
- Added requirement: "Another Feature"

Main specs are now updated. The change remains active - archive when implementation is complete.
```

### 23.18 护栏（Guardrails）

- 做改动之前先读 delta spec 和主 spec
- 保留 delta 没有提到的既有内容
- 绝不把 delta 文件原样抄进主 spec —— 合并它的内容，好让主 spec 保持主 spec 格式参考里的结构，不带任何 delta 操作标题
- 如果有不清楚的地方，请求澄清
- 一边做一边展示你在改什么
- 这个操作应当幂等 —— 跑两次应当给出同样的结果
- 只用 `artifactPaths.specs.existingOutputPaths`；绝不从无关的 artifact 推断 delta spec
- 尊重调用方提供的 `existingOutputPaths` 子集；绝不把它重新放宽回完整列表
- 直接同步时只取一次 specs instructions，或者内联复用 archive 提供的快照
- 每当 specs-instruction 响应非零或 JSON 无效时，在每一次写主 spec 之前停下
- artifact 规则只约束正在被写的 spec，绝不被抄进输出文件
