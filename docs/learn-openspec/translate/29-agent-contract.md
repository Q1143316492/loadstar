## 29 agent-contract —— agent 契约

> 译自 `reference/openspec/docs/agent-contract.md`（原文 146 行，全文翻译）。按 `READING-openspec.md` 第 29 项（⌸）。所有 JSON 形状、字段名、诊断码、退出码按原样保留；只译正文。

### 29.1 开篇

`openspec` CLI 的机器可读接口，对着 `src/` 核验过（capstone 审计，2026-06-11）。下面每一种形状都是按发出它的代码记录的。

### 29.2 通用约定（General conventions）

- **每次调用一份 JSON 文档。** 在 `--json` 模式下，stdout 恰好携带一份 JSON 文档（2 空格美化打印）。人类散文、spinner 和 store banner 都走 stderr。
- **store banner。** 在人类模式下，一个由 store 选出的 root 会往 stderr 打印 `Using OpenSpec root: <id> (<path>)`。JSON 模式下**永不**打印。
- **键名大小写随界面而异**（见 Known inconsistencies）：store/doctor/context 的载荷用 `snake_case`；工作流载荷（`status`、`instructions`、`new change`、`validate`、`list`）用 `camelCase`，但内嵌的 `root` 对象例外 —— 它始终用 `store_id`。
- **可选键被省略，而不是置 null**，在大多数载荷里（例如 `root.store_id`、`member.path`）。使用显式 `null` 的例外会按形状逐一指出（store doctor 的 `git.*`、失败载荷）。

### 29.3 诊断信封（The diagnostic envelope）

所有机器可读诊断共享同一种信封形状（`StoreDiagnostic`）：

```json
{
  "severity": "error" | "warning" | "info",
  "code": "snake_case_string",
  "message": "human sentence",
  "target": "dotted.surface (optional)",
  "fix": "one actionable sentence/command (optional)"
}
```

诊断出现在两个位置：**status 数组**（顶层或每条目上的 `status: StoreDiagnostic[]`），用于健康状况发现；以及**抛出的错误**，在命令失败时被转成单元素的 `status` 数组。

### 29.4 root 选择与 `RootOutput`（Root selection and `RootOutput`）

所有解析 root 的命令（`list`、`show`、`validate`、`status`、`instructions`、`instructions apply`、`instructions archive`、`new change`、`archive`、`doctor`、`context`、`schemas`）都以同一条优先级解析出一个 OpenSpec root：

1. `--store <id>` → 该已注册 store 的 root（`source: "store"`）。
2. 否则，最近的、含 `openspec/` 的祖先：planning 形状 → `source: "nearest"`（`store:` 指针被忽略，并往 stderr 发一条警告）；只含配置的目录带一个有效 `store:` 指针 → 那个 store，`source: "declared"`。
3. 没有最近的 root + 设了全局 `defaultStore`（`openspec config set defaultStore <id>`）→ 那个 store，`source: "global_default"`；一个过期的 id 会以底层 store 错误失败，并带一个名为 `openspec config unset defaultStore` 的 `fix`。
4. 没有最近的 root、没有默认值 + 存在已注册 store → 错误 `no_root_with_registered_stores`。
5. 没有 root、没有默认、没有 store：命令可以把 cwd 当作 `source: "implicit"`；`doctor`、`context`、`list` 和批量 `validate` 则改为以 `no_openspec_root` 失败。`list` 为带 `openspec/project.md` 的遗留项目保留 implicit 回退。

成功的 JSON 载荷通常内嵌 root；成功的 `schemas --json` 刻意保持 §29.7 里记录的、兼容性的裸数组：

```json
"root": { "path": "/abs/path", "source": "store" | "declared" | "global_default" | "nearest" | "implicit", "store_id": "id (only when store-selected)" }
```

**root 失败契约**：在 JSON 模式下，解析失败会往 stdout 打印 `{ ...commandNullShape, "status": [diagnostic] }` 并以 1 退出。

### 29.5 命令 JSON 形状（Command JSON shapes）

#### 29.5.1 `list --json`

`{ "changes": [ { "name", "completedTasks", "totalTasks", "lastModified", "status": "no-tasks"|"complete"|"in-progress", "nested"?: ["<area>/<name>", ...] } ], "warnings"?: [ { "code", "name", "nested", "message" } ], "root": RootOutput }` —— 注意这里的每 change `status` 是一个字符串枚举。`--specs`：`{ "specs": [ { "id", "requirementCount" } ], "root" }`。

`warnings`（为空时省略）报告 `changes/` 下不是 change 的目录。目前唯一的 code 是 `nested_change_directory`：一个包着 change 目录的命名空间目录，OpenSpec 无法寻址它，因为一个 change 永远是 `changes/` 直接下面的一个目录。同一个条目在被列出的 change 上带有 `nested`，那时它的 `status` 就没有意义了。不要把这样的条目当作一个 change；报告那条消息，并别去动那些目录。

#### 29.5.2 `show <item> --json`

change：`{ "id", "title", "deltaCount", "deltas": [...], "root" }`。spec：`{ "id", "title", "overview", "requirementCount", "requirements": [...], "metadata": { "version", "format", "sourcePath"? }, "root" }`。

#### 29.5.3 `validate --json`

`{ "items": [ { "id", "type": "change"|"spec", "valid", "issues": [ { "level", "path", "message", "line"?, "column"? } ], "durationMs" } ], "summary": { "totals": {items,passed,failed}, "byType": {...} }, "version": "1.0", "root" }`。任一条目失败时以 1 退出。

#### 29.5.4 `status --json`

`{ "changeName", "schemaName", "planningHome"?: { "kind", "root", "changesDir", "defaultSchema" }, "changeRoot", "artifactPaths": { "<id>": {outputPath, resolvedOutputPath, existingOutputPaths} }, "nextSteps": ["..."], "actionContext": { "mode": "repo-local", "sourceOfTruth": "repo", "planningArtifacts", "linkedContext", "allowedEditRoots", "requiresAffectedAreaSelection", "constraints" }, "isPlanningComplete", "isComplete", "applyRequires", "artifacts": [ {id, outputPath, status: "done"|"skipped"|"ready"|"blocked", requires, missingDeps?} ], "root" }`。`isPlanningComplete` 意味着每一个未被跳过的规划 artifact 都存在；被跳过的 artifact 算作已满足，而不被创建。它**不**意味着实现任务已完成。`isComplete` 作为兼容别名保留，值相同。每个 artifact 的 `requires` 是它直接依赖的 id（在每种 status 下都存在，所以即便 artifact 是 `done` 也能算出传递所需集合）；`missingDeps` 只在 `blocked` 时出现。`artifacts` 数组按依赖顺序排列，schema 里 `artifacts:` 的声明顺序用来打破同时变为 ready 的 artifact 之间的并列（**从不**按字母序），所以第一个 `ready` 条目就是下一个该写的 artifact；`missingDeps` 使用同样的顺序。`"skipped"` 标记一个 artifact，它的 `generates` 路径在 `specs/` 之下、且所属 change 的 `.openspec.yaml` 声明了 `skip_specs: true`；它满足依赖但**绝不能**被创建。没有活跃 change：`{ "changes": [], "message", "root" }`，以 0 退出。

`--all`（批量，与 `--change` 互斥 —— 两者同时给是一个错误，形状为 `{ "changes": [], "root": null, "status": [d] }` 的 null 形状）：`{ "changes": [ <每 change 的 status 对象，不带每 change 的 root>, ... ], "root" }`，按 change 名排序。一个加载失败的 change 就地贡献 `{ "changeName", "status": [d] }`；扫描继续，保留完整信封，并在文本模式和 JSON 模式下都以 1 退出。一个无效的 `--schema` 会让整次调用以 null 形状失败，即使没有任何 change 存在。

#### 29.5.5 `instructions <artifact> --json`

`{ "changeName", "artifactId", "schemaName", "changeDir", "planningHome"?, "outputPath", "resolvedOutputPath", "existingOutputPaths", "description", "instruction"?, "context"?, "rules"?, "references"?: ReferenceIndexEntry[], "skipped"?, "warning"?, "template", "dependencies": [{id,done,path,description,skipped?}], "unlocks", "root" }`。`unlocks` 列出这个 artifact 让哪些变为 ready，按 schema 的声明顺序（也就是 `status` 推荐它们的同一顺序）。`"skipped": true`（带 `"warning"`）出现在 change 声明了 `skip_specs: true` 且这个 artifact 被跳过时 —— 不要创建它的文件。一个带 `skipped: true` 的依赖条目无需文件即算满足 —— 不要试图读它的路径。

`ReferenceIndexEntry`：`{ "store_id", "root"?, "specs"?: [{id,summary}], "fetch"?, "status": [] }` —— 已解析的条目带上 root/specs/fetch；未解析的带 store_id + 一条 warning status。索引上限 50KB（`reference_index_truncated`）。

#### 29.5.6 `instructions apply --json`

`{ "changeName", "changeDir", "schemaName", "contextFiles": { "<artifactId>": ["/abs", ...] }, "progress": {total,complete,remaining}, "tasks": [{id,description,done}], "state": "blocked"|"all_done"|"ready", "missingArtifacts"?, "missingPrerequisites"?, "warnings"?, "instruction", "references"?, "context"?, "operationGuidance"?, "root" }`。`missingArtifacts` 是 apply 所阻塞于其上的东西（schema 的 `apply.requires`）；`missingPrerequisites` 是在 apply 能跑之前仍要建的全部东西，按构建顺序 —— 那些 requires 的传递闭包，所以它可能是更长的那个列表。`warnings` 列出这个 change 自身的非阻塞问题 —— 目前是：一个已可实现、却没有 delta spec 也没有 `skip_specs: true` 的 change，也就是 `openspec validate` 拒绝的那种状态。两个可选的 root 字段（`context`、`operationGuidance`）在每次调用时都从选中的 root 读取。`context` 是必需的 prompt 级输入，它的相关项目事实、约定和约束必须被应用；`operationGuidance` 是建议性输入，它的条目只在适用且与内置工作流兼容时才被遵循。两者都与状态、tasks、进度、上下文文件和内置指令分开。

#### 29.5.7 `instructions archive --json`

`{ "changeName", "context"?, "operationGuidance"?, "root" }`。要求在已解析的 repo/store root 里有一个有效的 `--change`，并使用与 apply 相同的必需 context / 建议性 guidance 语义。这是一个只读的运行时输入界面：它不返回静态的 archive 工作流、不勘察或合并 delta spec、不写主 spec、也不移动 change。

#### 29.5.8 `new change <name> --json`

成功：`{ "change": { "id", "path", "metadataPath", "schema" }, "root" }`。失败：`{ "change": null, "status": [d] }`，以 1 退出。

#### 29.5.9 `archive <name> --json`

成功：`{ "archive": { "change", "archivedAs": "YYYY-MM-DD-name", "path", "specsUpdated", "totals"?, "warnings"? }, "root" }`。失败：`{ "archive": null, "root"?, "status": [d] }`，以 1 退出。`specsUpdated` 只在至少一个 spec 文件被写入或退役时为 true（一个 change 移除了某个 capability 的最后一条 requirement 时，它的 spec 会被删除，这要求在 change 的 `.openspec.yaml` 里设 `retire_capabilities: true`；每一次退役都在 `warnings` 里被点名，且只有当该 spec 住在调用方的 checkout 里时才附一条可粘贴的 Git 恢复命令）；一个已经同步过的 change 归档时各项 total 全为零，跳过项列在 `warnings` 里。JSON 模式严格非交互：每一个提示点都变成一个 `archive_*` code。

#### 29.5.10 `doctor --json`

`{ "root": { "path", "source", "store_id"?, "healthy", "status": [] }, "store": { "id", "metadata": {present,valid,remote?}, "origin_url"?, "drift"?: {ahead,behind}, "status": [] } | null, "references": [...], "status": [] }`。`drift`（只对一个有上游追踪引用的、git 支撑的 store checkout 出现）是相对最近一次 fetch 到的上游的 ahead/behind 计数，不是活动远端。任何严重级别的健康状况发现都以 0 退出。失败载荷：`{ "root": null, "store": null, "references": [], "status": [d] }`，以 1 退出。

#### 29.5.11 `context --json`

`{ "root": { "path", "source", "store_id"?, "role": "openspec_root" }, "members": [ { "role": "referenced_store", "id", "path"?, "remote"?, "fetch"?, "status": [] } ], "status": [] }`。AVAILABLE = path 存在**且** status 为空。`--code-workspace <path>` 写入 `{folders:[{name,path}]}`（只含可用的被引用 store，带 `ref:` 前缀）；在 JSON 模式下，写入发生在打印之前，所以即便写入失败 stdout 也恰好只有一份文档。失败：`{ "root": null, "members": [], "status": [d] }`，以 1 退出。

#### 29.5.12 `store ... --json`

setup/register：`{ "store": {id, root, metadata_path?}, "registry": {path, registered, already_registered}, "git": {is_repository, initialized, committed}, "created_files": [], "status": [] }`。unregister/remove：`{ "store", "registry": {path, removed}, "files": {deleted, deleted_path, left_on_disk}, "status": [] }`。list：`{ "stores": [{id, root}], "status": [] }`。doctor：`{ "stores": [ { id, root, metadata_path?, openspec_root: {...healthy, status}, metadata: {present, valid, id?, remote}, git: {is_repository, has_commits, has_uncommitted_changes, has_remote, origin_url}, status } ], "status": [] }`（`null` = 未知/未探测）。健康状况发现以 0 退出；失败以 1 退出，带对应的 null 形状。提示取消以 130 退出。

#### 29.5.13 `schemas --json` / `templates --json`

`schemas`：成功时仍然是裸数组 `[ {name, description, artifacts, source} ]`；它解析规范的 root 选择优先级，并接受 `--store <id>`。root 选择失败：`{ "schemas": [], "root": null, "status": [d] }`，以 1 退出。`templates`：带键对象 `{ "<artifactId>": {path, source} }`，仍基于 cwd，没有 root/status 键。

### 29.6 退出码契约（Exit-code contract）

| 情况 | 退出 | Stdout |
|---|---|---|
| 成功，含健康状况发现（doctor/context/store doctor） | 0 | 载荷 |
| `--json` 模式下的命令失败 | 1 | 一份 JSON 文档，带 `status: [d]` 和该命令的 null 形状 |
| `validate` 有条目失败 | 1 | 完整报告 |
| 提示取消（`store` 组，人类模式） | 130 | 仅 stderr |

### 29.7 诊断码目录（Diagnostic code catalog）

#### 解析（Resolution）

`no_openspec_root`、`no_root_with_registered_stores`、`no_registered_stores`、`unknown_store`、`store_identity_mismatch`、`unhealthy_store_root`、`store_path_not_supported`、`invalid_store_pointer`、`initiative_option_removed`、`areas_option_removed`；透传：`invalid_store_id`、`invalid_store_registry`、`invalid_store_metadata`。

#### OpenSpec root 健康（error，无 fix）

`openspec_store_root_missing`、`openspec_store_root_not_directory`、`openspec_root_missing`、`openspec_root_not_directory`、`openspec_config_missing`、`openspec_config_not_file`、`openspec_specs_not_directory`、`openspec_changes_not_directory`、`openspec_archive_not_directory`。在 stores beta 期间，`openspec/specs/`、`openspec/changes/` 和 `openspec/changes/archive/` 在一个健康的 root 里可以缺失；只有当它们存在但不是目录时，才是健康错误。

#### store 注册表/身份/状态（Store registry/identity/state）

`invalid_store_id`、`invalid_store_registry`、`invalid_store_metadata`、`store_registry_busy`、`store_not_found`、`no_store_registry`、`store_registry_changed`、`store_metadata_missing`、`store_metadata_id_mismatch`、`store_metadata_invalid`、`store_id_conflict`、`store_path_conflict`、`store_already_registered`（info）。

#### store setup/register/remove

`store_setup_id_required`、`store_setup_path_required`、`store_setup_path_not_directory`、`store_setup_inside_git_repo`、`store_setup_non_empty_directory`、`store_setup_cancelled`、`store_path_required`、`store_path_missing`、`store_path_not_directory`、`store_root_pointer_declared`、`store_register_root_unhealthy`、`store_register_identity_confirmation_required`、`store_register_cancelled`、`store_remote_empty`、`store_remote_requires_hand_edit`、`store_remove_confirmation_required`、`store_remove_cancelled`、`store_remove_path_not_directory`、`store_remove_metadata_missing`、`store_remove_contains_registered_store`、`store_root_missing`（remove 里是 warning，doctor 里是 error）、`store_root_not_directory`。

#### store git

`store_git_init_failed`、`store_git_identity_missing`、`store_git_commit_failed`、`store_git_no_commits`（warning）、`store_clone_fragile_directories`（warning）、`store_remote_divergence`（info，doctor）、`store_checkout_drift`（info，doctor）。

#### references（warning）

`reference_invalid_id`、`reference_registry_unreadable`、`reference_unresolved`、`reference_root_unhealthy`、`reference_index_truncated`。

#### 关系（warning；doctor；context 只保留注册表那条）

`relationship_registry_unreadable`、`root_pointer_ignored`、`root_pointer_invalid`、`pointer_declarations_inert`。

#### archive（JSON 模式）

`archive_change_name_required`、`archive_change_not_found`、`archive_change_symlink`、`archive_validation_failed`、`archive_confirmation_required`、`archive_tasks_incomplete`、`archive_spec_update_failed`、`archive_spec_validation_failed`、`archive_target_exists`、`archive_error`。

#### context 写入

`context_file_exists`、`context_output_dir_missing`。

#### 兜底

`doctor_failed`、`context_failed`、`store_error`、`change_error`、`archive_error`。

### 29.8 已知不一致（Known inconsistencies）

由 capstone 审计记录；已发布键的重命名是推迟到这版之后的产品决策：

1. ~~在 `--json` 模式下，若干失败路径只打印 stderr 而没有 JSON 文档。~~ 已在 capstone gauntlet 轮修复：`show`/`validate` 的未知与歧义条目发出 `{status:[{code: unknown_item | ambiguous_item, ...}]}`；`status`/`instructions`/`list`/`show`/`validate` 里抛出的错误经由 JSON 感知的失败助手路由（该命令的 null 形状 + `status`）；`store <unknown subcommand> --json` 发出 `{status:[{code: unknown_store_subcommand}]}`；`list` 在解析失败时携带它的 `{changes|specs: [], root: null}` null 形状。
2. `store_root_missing` 以两种严重级别发出（remove 里是 warning，store doctor 里是 error）—— 上下文相关，上面已记录。
3. snake_case（store 家族）与 camelCase（工作流家族）的键名大小写；`root.store_id` 到处都是 snake_case。
4. src 里存在四个平行的信封类型声明；archive 诊断永不携带 `target`。
5. `list --json` 复用 `status` 键作为每 change 的字符串枚举。
6. 只有 `validate` 的输出携带 `version` 字段。
7. `templates` 忽略 root 选择（基于 cwd，没有 `--store`）。
8. 已弃用的名词形式（`change`/`spec` 子命令）发出未封装载荷，没有 `root`/`status`。
