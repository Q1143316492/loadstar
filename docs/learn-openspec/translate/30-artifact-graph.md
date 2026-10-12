## 30 artifact-graph —— 流程的发动机

> 译自 `reference/openspec/src/core/artifact-graph/`（8 个文件，约 55KB）与 `src/core/change-status-policy.ts`、`src/core/planning-home.ts`、`src/core/root-selection.ts` 的文件头。按 `READING-openspec.md` 第 30-31 项。这是**源码阅读稿**：导出签名与英文注释原文按原样保留，只译注释正文；TypeScript 语句本身不译。

### 30.0 这一层回答什么

这一层是 CLI 侧的发动机：它把 schema YAML 读成一张 artifact 依赖图，再用「生成文件是否存在」这一个事实算出每个 artifact 的状态（`done` / `skipped` / `ready` / `blocked`）。`state.ts` 的 `detectCompleted()` 只做一次目录扫描，`graph.ts` 的 `getBuildOrder()` / `getNextArtifacts()` / `getBlocked()` 则全部是这套状态之上的纯计算。`instruction-loader.ts` 是这一层与 agent 的交接点：它为某个 artifact 装配 `context`、`rules`、`template`、依赖与解锁信息，并把这些字段连同 `nextSteps`、`actionContext` 一起输出成 JSON。schema 从哪里来由 `resolver.ts` 决定（项目本地 → 用户全局 → 包内置），OpenSpec root 从哪里来由 `planning-home.ts` 与 `root-selection.ts` 决定。`change-status-policy.ts` 把「下一步做什么」单独抽成一处，让文本面与 JSON 面共用同一个答案。

---

### 30.1 `types.ts` —— 定义 schema 的数据形状与运行时状态类型

`reference/openspec/src/core/artifact-graph/types.ts` · 3024 字节 · 79 行

**导出接口（原样保留）**

```ts
export const ArtifactSchema = z.object({
  id: z.string().min(1, { error: 'Artifact ID is required' }),
  generates: relativePathSchema('generates field'),
  description: z.string(),
  template: relativePathSchema('template field'),
  instruction: z.string().optional(),
  requires: z.array(z.string()).default([]),
});

export const ApplyPhaseSchema = z.object({
  requires: z.array(z.string()).min(1, { error: 'At least one required artifact' }),
  tracks: relativePathSchema('apply.tracks').nullable().optional(),
  instruction: z.string().optional(),
});

export const SchemaYamlSchema = z.object({
  name: z.string().min(1, { error: 'Schema name is required' }),
  version: z.number().int().positive({ error: 'Version must be a positive integer' }),
  description: z.string().optional(),
  artifacts: z
    .array(ArtifactSchema)
    .min(1, { error: 'At least one artifact required' })
    .max(MAX_ARTIFACTS, {
      error: `A schema may declare at most ${MAX_ARTIFACTS} artifacts`,
    }),
  apply: ApplyPhaseSchema.optional(),
});

export type Artifact = z.infer<typeof ArtifactSchema>;
export type ApplyPhase = z.infer<typeof ApplyPhaseSchema>;
export type SchemaYaml = z.infer<typeof SchemaYamlSchema>;

export type CompletedSet = Set<string>;

export interface BlockedArtifacts {
  [artifactId: string]: string[];
}
```

**设计推理（注释译文）**

```text
// <line 24-26>（文件级：ArtifactSchema 之前；其后紧跟 const MAX_ARTIFACTS = 1000;）
// Artifact definition schema
// Upper bound on artifacts in one schema. Keeps `validateNoCycles`' recursive
// DFS well inside the stack limit for any accepted input.
```

**译文：** artifact 定义 schema。一个 schema 里 artifact 数量的上界；它让 `validateNoCycles` 的递归 DFS 对任何被接受的输入都稳稳待在栈限制之内。

```text
// <line 38>（ApplyPhaseSchema 之前）
// Apply phase configuration for schema-aware apply instructions
```

**译文：** apply 阶段的配置，用于 schema 感知的 apply 指令。

```text
// <line 40>（ApplyPhaseSchema.requires）
// Artifact IDs that must exist before apply is available
```

**译文：** 必须存在、apply 才可用的 artifact ID。

```text
// <line 42>（ApplyPhaseSchema.tracks）
// Path to file with checkboxes for progress (relative to change dir), or null if no tracking
```

**译文：** 带 checkbox 的进度文件路径（相对 change 目录）；若不跟踪进度则为 null。

```text
// <line 44>（ApplyPhaseSchema.instruction）
// Custom guidance for the apply phase
```

**译文：** apply 阶段的自定义指引。

```text
// <line 48>（SchemaYamlSchema 之前）
// Full schema YAML structure
```

**译文：** 完整的 schema YAML 结构。

```text
// <line 56-58>（SchemaYamlSchema.artifacts 的 .max() 上）
// Bounded so a hostile schema cannot drive the cycle-detection DFS past the
// V8 stack limit and crash with an uncaught RangeError instead of a
// validation error.
```

**译文：** 设上界是为了让恶意 schema 无法把环路检测的 DFS 推过 V8 栈限制，然后以一个未捕获的 RangeError 崩溃，而不是给出一条校验错误。

```text
// <line 62>（SchemaYamlSchema.apply）
// Optional apply phase configuration (for schema-aware apply instructions)
```

**译文：** 可选的 apply 阶段配置（供 schema 感知的 apply 指令使用）。

```text
// <line 66>（派生类型之前）
// Derived TypeScript types
```

**译文：** 派生出的 TypeScript 类型。

```text
// <line 71>（运行时状态类型之前）
// Runtime state types (not Zod - internal only)
```

**译文：** 运行时状态类型（不用 Zod —— 仅供内部使用）。

```text
// <line 73>（CompletedSet 之前）
// Slice 1: Simple completion tracking via filesystem
```

**译文：** Slice 1：用文件系统做简单的完成度跟踪。

```text
// <line 76>（BlockedArtifacts 之前）
// Return type for blocked query
```

**译文：** blocked 查询的返回类型。

---

### 30.2 `schema.ts` —— 从 YAML 加载 schema 并在加载期做四道校验

`reference/openspec/src/core/artifact-graph/schema.ts` · 6342 字节 · 182 行

**导出接口（原样保留）**

```ts
export class SchemaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchemaValidationError';
  }
}

export function loadSchema(filePath: string): SchemaYaml { ... }

export function parseSchema(yamlContent: string): SchemaYaml { ... }

export function findApplyTracksWarning(schema: SchemaYaml): string | undefined { ... }
```

**设计推理（注释译文）**

```text
// <line 12-14>（loadSchema）
/**
 * Loads and validates an artifact schema from a YAML file.
 */
```

**译文：** 从 YAML 文件加载并校验一个 artifact schema。

```text
// <line 20-22>（parseSchema）
/**
 * Parses and validates an artifact schema from YAML content.
 */
```

**译文：** 从 YAML 内容解析并校验一个 artifact schema。

```text
// <line 26>（parseSchema 内）
  // Validate with Zod
```

**译文：** 用 Zod 校验。

```text
// <line 35>（parseSchema 内，第一道校验）
  // Check for duplicate artifact IDs
```

**译文：** 检查是否有重复的 artifact ID。

```text
// <line 38>（parseSchema 内，第二道校验）
  // Check that all requires references are valid
```

**译文：** 检查所有 requires 引用是否有效。

```text
// <line 41>（parseSchema 内，第三道校验）
  // Check that the apply phase names artifacts this schema declares
```

**译文：** 检查 apply 阶段点名的 artifact 都是本 schema 声明过的。

```text
// <line 44>（parseSchema 内，第四道校验）
  // Check for cycles
```

**译文：** 检查是否有环。

```text
// <line 50-52>（validateNoDuplicateIds）
/**
 * Validates that there are no duplicate artifact IDs.
 */
```

**译文：** 校验不存在重复的 artifact ID。

```text
// <line 63-65>（validateRequiresReferences）
/**
 * Validates that all `requires` references point to valid artifact IDs.
 */
```

**译文：** 校验所有 `requires` 引用都指向有效的 artifact ID。

```text
// <line 80-94>（validateApplyReferences）
/**
 * Validates that every `apply.requires` id is an artifact the schema declares.
 *
 * Apply skips an id that no artifact declares, so a typo silently dropped that
 * artifact from the apply gate. An unknown artifact `requires` is already a
 * load error, and this is the same kind of reference.
 *
 * `apply.tracks` is deliberately not checked here. It is a path, not an id:
 * apply reads it as written, so a schema whose `tracks` value does not exactly
 * match any `generates` value (a hand-written `TODO.md`, or `tasks/main.md`
 * under a glob `generates: tasks/*.md` that really does produce it) works
 * today, and failing the load would break every command on it.
 * `openspec schema validate` reports that case as a warning instead
 * (see `findApplyTracksWarning`).
 */
```

**译文：** 校验每一个 `apply.requires` 里的 id 都是本 schema 声明过的 artifact。

apply 会跳过一个没有任何 artifact 声明的 id，所以一个拼写错误就静默地把那个 artifact 从 apply 闸门上摘掉了。未知的 artifact `requires` 已经是加载期错误，而这属于同一类引用。

这里刻意不检查 `apply.tracks`。它是一个路径，不是一个 id：apply 按字面读取它，所以即使某个 schema 的 `tracks` 值与任何 `generates` 值都不精确相等（手写的 `TODO.md`，或者在 `generates: tasks/*.md` 这个 glob 之下、而该 glob 确实会产出 `tasks/main.md`），今天也能正常工作，而让加载失败会让它上面的每条命令都坏掉。`openspec schema validate` 改为把这种情况报成 warning（见 `findApplyTracksWarning`）。

```text
// <line 109-121>（findApplyTracksWarning）
/**
 * Describes an `apply.tracks` value that is not exactly equal to any artifact's
 * `generates` value, or returns undefined when there is nothing to report.
 *
 * The tracked-tasks lookups select the artifact whose `generates` string equals
 * `tracks`, so this is a progress-discovery problem, not a claim that nothing
 * produces the file: a glob `generates: tasks/*.md` really does generate
 * `tracks: tasks/main.md`, yet the strings differ, so the lookup still misses.
 * Either way apply keeps working (it reads the path directly), but `openspec
 * list` and `openspec status` fall back to counting the top-level `tasks.md`,
 * and apply's remedy cannot name an artifact to build. A typo such as
 * `task.md` is the other usual cause.
 */
```

**译文：** 描述一个不等于任何 artifact `generates` 值的 `apply.tracks` 值；没有可报告的内容时返回 undefined。

被跟踪任务的查找会选出 `generates` 字符串等于 `tracks` 的那个 artifact，所以这是一个「进度发现不了」的问题，而不是在断言没有东西产出该文件：`generates: tasks/*.md` 这个 glob 确实会产出 `tracks: tasks/main.md`，但两个字符串不同，查找仍然落空。无论哪种情况 apply 都照常工作（它直接读那个路径），但 `openspec list` 和 `openspec status` 会退回去数顶层 `tasks.md`，而 apply 的补救办法点不出该构建哪个 artifact。像 `task.md` 这样的拼写错误是另一种常见成因。

```text
// <line 135-138>（validateNoCycles）
/**
 * Validates that there are no cyclic dependencies.
 * Uses DFS to detect cycles and reports the full cycle path.
 */
```

**译文：** 校验不存在循环依赖。用 DFS 检测环，并报出完整环路路径。

```text
// <line 158>（validateNoCycles.dfs 内）
        // Found a cycle - reconstruct the path
```

**译文：** 发现了一个环 —— 重建这条路径。

---

### 30.3 `graph.ts` —— artifact 依赖图上的构建顺序、就绪与被阻塞查询

`reference/openspec/src/core/artifact-graph/graph.ts` · 6085 字节 · 194 行

**导出接口（原样保留）**

```ts
export class ArtifactGraph {
  private artifacts: Map<string, Artifact>;
  private schema: SchemaYaml;
  private declarationOrder: Map<string, number>;

  private constructor(schema: SchemaYaml) { ... }

  private compareByDeclarationOrder(a: string, b: string): number { ... }

  static fromYaml(filePath: string): ArtifactGraph { ... }

  static fromYamlContent(yamlContent: string): ArtifactGraph { ... }

  static fromSchema(schema: SchemaYaml): ArtifactGraph { ... }

  getArtifact(id: string): Artifact | undefined { ... }

  getAllArtifacts(): Artifact[] { ... }

  getName(): string { ... }

  getVersion(): number { ... }

  getBuildOrder(): string[] { ... }

  getNextArtifacts(completed: CompletedSet): string[] { ... }

  isComplete(completed: CompletedSet): boolean { ... }

  getBlocked(completed: CompletedSet): BlockedArtifacts { ... }
}
```

**设计推理（注释译文）**

```text
// <line 4-7>（ArtifactGraph）
/**
 * Represents an artifact dependency graph.
 * Provides methods for querying build order, ready artifacts, and completion status.
 */
```

**译文：** 表示一张 artifact 依赖图。提供查询构建顺序、就绪 artifact 与完成状态的方法。

```text
// <line 11>（ArtifactGraph.declarationOrder）
  /** Artifact id -> its position in the schema's `artifacts:` list. */
```

**译文：** artifact id -> 它在 schema `artifacts:` 列表中的位置。

```text
// <line 20-32>（compareByDeclarationOrder）
  /**
   * Orders artifact ids by where the schema declares them.
   *
   * The dependency graph leaves siblings tied - spec-driven's `specs` and
   * `design` both require only `proposal`, so both become ready at the same
   * time. Ties used to be broken alphabetically, which put `design` ahead of
   * `specs` and made the CLI recommend the artifacts in an order that
   * contradicted the schema's own documented sequence
   * (proposal -> specs -> design -> tasks). Breaking ties by declaration order
   * follows the sequence the schema author wrote, for built-in and custom
   * schemas alike, and stays just as deterministic. Ids not in the schema sort
   * last so the comparator stays total.
   */
```

**译文：** 按 schema 声明它们的位置给 artifact id 排序。

依赖图会让同级项并列 —— spec-driven 的 `specs` 和 `design` 都只依赖 `proposal`，所以两者同时就绪。并列项过去按字母序打破，这把 `design` 排到了 `specs` 前面，让 CLI 推荐的 artifact 顺序与 schema 自己写明的顺序（proposal -> specs -> design -> tasks）相矛盾。按声明顺序打破并列，就是跟随 schema 作者写下的顺序，对内置与自定义 schema 一视同仁，并且同样确定。不在 schema 里的 id 排到最后，好让比较器保持全序。

```text
// <line 40-42>（fromYaml）
  /**
   * Creates an ArtifactGraph from a YAML file path.
   */
```

**译文：** 从 YAML 文件路径创建 ArtifactGraph。

```text
// <line 48-50>（fromYamlContent）
  /**
   * Creates an ArtifactGraph from YAML content string.
   */
```

**译文：** 从 YAML 内容字符串创建 ArtifactGraph。

```text
// <line 56-58>（fromSchema）
  /**
   * Creates an ArtifactGraph from a pre-validated schema object.
   */
```

**译文：** 从已校验的 schema 对象创建 ArtifactGraph。

```text
// <line 63-65>（getArtifact）
  /**
   * Gets a single artifact by ID.
   */
```

**译文：** 按 ID 取单个 artifact。

```text
// <line 70-72>（getAllArtifacts）
  /**
   * Gets all artifacts in the graph.
   */
```

**译文：** 取图中的所有 artifact。

```text
// <line 77-79>（getName）
  /**
   * Gets the schema name.
   */
```

**译文：** 取 schema 名。

```text
// <line 84-86>（getVersion）
  /**
   * Gets the schema version.
   */
```

**译文：** 取 schema 版本。

```text
// <line 91-94>（getBuildOrder）
  /**
   * Computes the topological build order using Kahn's algorithm.
   * Returns artifact IDs in the order they should be built.
   */
```

**译文：** 用 Kahn 算法计算拓扑构建顺序。返回 artifact ID，按它们应被构建的顺序排列。

```text
// <line 99>（getBuildOrder 内）
    // Initialize all artifacts
```

**译文：** 初始化所有 artifact。

```text
// <line 105>（getBuildOrder 内）
    // Build reverse adjacency (who depends on whom)
```

**译文：** 构建反向邻接表（谁依赖谁）。

```text
// <line 112>（getBuildOrder 内）
    // Start with roots (in-degree 0), in declaration order for determinism
```

**译文：** 从根（入度 0）开始，按声明顺序以保证确定性。

```text
// <line 123>（getBuildOrder 内）
      // Collect newly ready artifacts, then sort before adding
```

**译文：** 收集新就绪的 artifact，加入之前先排序。

```text
// <line 132-133>（getBuildOrder 内）
      // Re-sort the whole queue, not just the new arrivals: an artifact that
      // has been waiting can be declared after one that just became ready.
```

**译文：** 对整个队列重排序，而不只是新加入的项：一个已经等了一阵的 artifact 可能被声明在刚刚就绪的那个之后。

```text
// <line 141-143>（getNextArtifacts）
  /**
   * Gets artifacts that are ready to be created (all dependencies completed).
   */
```

**译文：** 取已就绪、可以创建的 artifact（所有依赖都已完成）。

```text
// <line 149>（getNextArtifacts 内）
        continue; // Already completed
```

**译文：** 已经完成。

```text
// <line 158-159>（getNextArtifacts 内）
    // Declaration order: deterministic, and the first entry is the artifact the
    // schema wants written next.
```

**译文：** 按声明顺序：确定，并且第一项就是 schema 希望你接下来写的 artifact。

```text
// <line 164-166>（isComplete）
  /**
   * Checks if all artifacts in the graph are completed.
   */
```

**译文：** 检查图中所有 artifact 是否都已完成。

```text
// <line 175-177>（getBlocked）
  /**
   * Gets blocked artifacts and their unmet dependencies.
   */
```

**译文：** 取被阻塞的 artifact 及其未满足的依赖。

```text
// <line 183>（getBlocked 内）
        continue; // Already completed
```

**译文：** 已经完成。

---

### 30.4 `state.ts` —— 状态就是生成文件是否存在

`reference/openspec/src/core/artifact-graph/state.ts` · 1224 字节 · 37 行

**导出接口（原样保留）**

```ts
export function detectCompleted(graph: ArtifactGraph, changeDir: string): CompletedSet { ... }
```

**设计推理（注释译文）**

```text
// <line 6-13>（detectCompleted）
/**
 * Detects which artifacts are completed by checking file existence in the change directory.
 * Returns a Set of completed artifact IDs.
 *
 * @param graph - The artifact graph to check
 * @param changeDir - The change directory to scan for files
 * @returns Set of artifact IDs whose generated files exist
 */
```

**译文：** 通过在 change 目录里检查文件是否存在，检测哪些 artifact 已完成。返回已完成 artifact ID 的 Set。

@param graph - 要检查的 artifact 图
@param changeDir - 要扫描文件的 change 目录
@returns 生成文件已存在的 artifact ID 的 Set

```text
// <line 17>（detectCompleted 内）
  // Handle missing change directory gracefully
```

**译文：** 优雅处理 change 目录缺失的情况。

```text
// <line 31-34>（isArtifactComplete）
/**
 * Checks if an artifact is complete by checking if its generated file(s) exist.
 * Supports both simple paths and glob patterns.
 */
```

**译文：** 通过检查 artifact 生成的文件是否存在，判断该 artifact 是否完成。同时支持简单路径与 glob 模式。

---

### 30.5 `outputs.ts` —— 把 `generates` 解析成真实存在的输出文件

`reference/openspec/src/core/artifact-graph/outputs.ts` · 5875 字节 · 169 行

**导出接口（原样保留）**

```ts
export function isGlobPattern(pattern: string): boolean { ... }

export function isSpecsArtifactPath(generates: string): boolean { ... }

export function resolveArtifactOutputPath(changeDir: string, generates: string): string { ... }

export function resolveArtifactOutputs(changeDir: string, generates: string): string[] { ... }

export function artifactOutputExists(changeDir: string, generates: string): boolean { ... }
```

**设计推理（注释译文）**

```text
// <line 22-24>（isGlobPattern）
/**
 * Recognizes artifact globs while preserving literal output filenames.
 */
```

**译文：** 识别 artifact 的 glob，同时保住字面量输出文件名。

```text
// <line 26-27>（isGlobPattern 内）
  // Keep the original wildcard rules and recognize brace expansions and extglobs.
  // Its full dynamic predicate also reinterprets literal !, parentheses, and backslashes.
```

**译文：** 保留原本的通配规则，并识别花括号展开与 extglob。它的完整动态谓词还会重新解释字面量的 !、圆括号与反斜杠。

```text
// <line 33-35>（isSpecsArtifactPath）
/**
 * Returns whether an artifact generates files under the change's specs/ tree.
 */
```

**译文：** 返回该 artifact 是否在 change 的 specs/ 树下生成文件。

```text
// <line 70>（assertGlobDirectoryTraversal 内）
      // `**` may consume no directory at all.
```

**译文：** `**` 可以一个目录都不消费。

```text
// <line 113-116>（resolveArtifactOutputs）
/**
 * Resolves an artifact's output path(s) to concrete files that currently exist.
 * Returns absolute file paths. Glob matches are sorted for deterministic output.
 */
```

**译文：** 把 artifact 的输出路径解析为当前确实存在的具体文件。返回绝对文件路径。glob 匹配结果会排序，以保证输出确定。

```text
// <line 135>（resolveArtifactOutputs 内，globOptions）
    // Preserve linked artifact directories; confine traversal and concrete matches.
```

**译文：** 保留被链接的 artifact 目录；限制遍历范围与具体匹配结果。

```text
// <line 138-139>（resolveArtifactOutputs 内）
  // Task generation expands braces without accessing the filesystem. Validate
  // every task base before globbing, including paths introduced by expansion.
```

**译文：** 任务生成会在不访问文件系统的情况下展开花括号。在 glob 之前校验每一个 task base，包括展开后新引入的路径。

```text
// <line 164-166>（artifactOutputExists）
/**
 * Checks if an artifact has at least one resolved output file.
 */
```

**译文：** 检查一个 artifact 是否至少解析出一个输出文件。

---

### 30.6 `instruction-loader.ts` —— 装配交给 agent 的指令，并渲染 change 状态

`reference/openspec/src/core/artifact-graph/instruction-loader.ts` · 19116 字节 · 540 行

**导出接口（原样保留）**

```ts
export class TemplateLoadError extends Error {
  constructor(
    message: string,
    public readonly templatePath: string
  ) { ... }
}

export interface ChangeContext {
  graph: ArtifactGraph;
  completed: CompletedSet;
  schemaName: string;
  changeName: string;
  changeDir: string;
  projectRoot: string;
  planningHome?: PlanningHome;
  metadata?: ChangeMetadata;
  skippedArtifacts?: Set<string>;
}

export interface LoadChangeContextOptions {
  changeDir?: string;
  planningHome?: PlanningHome;
  projectConfig?: ProjectConfig | null;
}

export interface ArtifactInstructions {
  changeName: string;
  artifactId: string;
  schemaName: string;
  changeDir: string;
  planningHome?: PlanningHomeSummary;
  outputPath: string;
  resolvedOutputPath: string;
  existingOutputPaths: string[];
  description: string;
  instruction: string | undefined;
  context: string | undefined;
  rules: string[] | undefined;
  references?: ReferenceIndexEntry[];
  template: string;
  dependencies: DependencyInfo[];
  unlocks: string[];
  skipped?: boolean;
  warning?: string;
}

export const SKIP_SPECS_INSTRUCTIONS_WARNING =
  'This change declares skip_specs: true in .openspec.yaml (no spec-level behavior changes), so this artifact is skipped.\n' +
  'Do not create spec files - they will conflict with that marker. If requirements now change, remove skip_specs from .openspec.yaml and rerun this command.';

export interface DependencyInfo {
  id: string;
  done: boolean;
  path: string;
  description: string;
  skipped?: boolean;
}

export interface ArtifactStatus {
  id: string;
  outputPath: string;
  status: 'done' | 'skipped' | 'ready' | 'blocked';
  requires: string[];
  missingDeps?: string[];
}

export interface ChangeStatus {
  changeName: string;
  schemaName: string;
  planningHome?: PlanningHomeSummary;
  changeRoot: string;
  artifactPaths: Record<string, ArtifactPathSummary>;
  nextSteps: string[];
  actionContext: ActionContext;
  isPlanningComplete: boolean;
  isComplete: boolean;
  applyRequires: string[];
  artifacts: ArtifactStatus[];
}

export interface ArtifactPathSummary {
  outputPath: string;
  resolvedOutputPath: string;
  existingOutputPaths: string[];
}

export function loadTemplate(
  schemaName: string,
  templatePath: string,
  projectRoot?: string
): string { ... }

export function loadChangeContext(
  projectRoot: string,
  changeName: string,
  schemaName?: string,
  options: LoadChangeContextOptions = {}
): ChangeContext { ... }

export interface GenerateInstructionsOptions {
  projectConfig?: ProjectConfig | null;
  references?: ReferenceIndexEntry[];
}

export function generateInstructions(
  context: ChangeContext,
  artifactId: string,
  projectRoot?: string,
  options: GenerateInstructionsOptions = {}
): ArtifactInstructions { ... }

export function formatChangeStatus(
  context: ChangeContext,
  options: { storeId?: string } = {}
): ChangeStatus { ... }
```

**设计推理（注释译文）**

```text
// <line 26>（模块级 shownWarnings）
// Session-level cache for validation warnings (avoid repeating same warnings)
```

**译文：** 校验 warning 的会话级缓存（避免重复同一条警告）。

```text
// <line 29-31>（TemplateLoadError）
/**
 * Error thrown when loading a template fails.
 */
```

**译文：** 加载模板失败时抛出的错误。

```text
// <line 42-44>（ChangeContext）
/**
 * Change context containing graph, completion state, and metadata.
 */
```

**译文：** change 上下文，包含图、完成状态与元数据。

```text
// <line 46>（ChangeContext.graph）
  /** The artifact dependency graph */
```

**译文：** artifact 依赖图。

```text
// <line 48>（ChangeContext.completed）
  /** Set of completed artifact IDs */
```

**译文：** 已完成 artifact ID 的集合。

```text
// <line 50>（ChangeContext.schemaName）
  /** Schema name being used */
```

**译文：** 正在使用的 schema 名。

```text
// <line 52>（ChangeContext.changeName）
  /** Change name */
```

**译文：** change 名。

```text
// <line 54>（ChangeContext.changeDir）
  /** Path to the change directory */
```

**译文：** change 目录的路径。

```text
// <line 56>（ChangeContext.projectRoot）
  /** Project root directory */
```

**译文：** 项目根目录。

```text
// <line 58>（ChangeContext.planningHome）
  /** Resolved planning home for this change */
```

**译文：** 为这个 change 解析出的 planning home。

```text
// <line 60>（ChangeContext.metadata）
  /** Parsed change metadata, when present */
```

**译文：** 解析后的 change 元数据（存在时）。

```text
// <line 62-66>（ChangeContext.skippedArtifacts）
  /**
   * Artifact IDs counted as complete only because the change declares
   * skip_specs, not because their files exist. Kept separate so status can
   * render them as skipped rather than done.
   */
```

**译文：** 仅因为 change 声明了 skip_specs 而被算作完成的 artifact ID，不是因为它们的文件存在。单独保留，好让 status 把它们渲染成 skipped 而不是 done。

```text
// <line 73>（LoadChangeContextOptions.projectConfig）
  /** Pre-read project config; suppresses schema resolution's fallback config read. */
```

**译文：** 预先读好的项目配置；抑制 schema 解析里那次兜底的配置读取。

```text
// <line 77-79>（ArtifactInstructions）
/**
 * Enriched instructions for creating an artifact.
 */
```

**译文：** 为创建 artifact 而充实过的指令。

```text
// <line 81>（ArtifactInstructions.changeName）
  /** Change name */
```

**译文：** change 名。

```text
// <line 83>（ArtifactInstructions.artifactId）
  /** Artifact ID */
```

**译文：** artifact ID。

```text
// <line 85>（ArtifactInstructions.schemaName）
  /** Schema name */
```

**译文：** schema 名。

```text
// <line 87>（ArtifactInstructions.changeDir）
  /** Full path to change directory */
```

**译文：** change 目录的完整路径。

```text
// <line 89>（ArtifactInstructions.planningHome）
  /** Resolved planning home for this change */
```

**译文：** 为这个 change 解析出的 planning home。

```text
// <line 91>（ArtifactInstructions.outputPath）
  /** Output path pattern (e.g., "proposal.md") */
```

**译文：** 输出路径模式（例如 `"proposal.md"`）。

```text
// <line 93>（ArtifactInstructions.resolvedOutputPath）
  /** Absolute output path or glob pattern resolved under the change directory */
```

**译文：** 在 change 目录下解析出的绝对输出路径或 glob 模式。

```text
// <line 95>（ArtifactInstructions.existingOutputPaths）
  /** Existing concrete output files for this artifact */
```

**译文：** 这个 artifact 已存在的具体输出文件。

```text
// <line 97>（ArtifactInstructions.description）
  /** Artifact description */
```

**译文：** artifact 描述。

```text
// <line 99>（ArtifactInstructions.instruction）
  /** Guidance on how to create this artifact (from schema instruction field) */
```

**译文：** 如何创建这个 artifact 的指引（来自 schema 的 instruction 字段）。

```text
// <line 101>（ArtifactInstructions.context）
  /** Project context from config (constraints/background for AI, not to be included in output) */
```

**译文：** 来自配置的项目上下文（给 AI 的约束/背景，不要写进产物）。

```text
// <line 103>（ArtifactInstructions.rules）
  /** Artifact-specific rules from config (constraints for AI, not to be included in output) */
```

**译文：** 来自配置的 artifact 专属规则（给 AI 的约束，不要写进产物）。

```text
// <line 105>（ArtifactInstructions.references）
  /** Referenced-store index (read-only upstream context; omitted when no references are declared) */
```

**译文：** 被引用 store 的索引（只读的上游上下文；未声明 references 时省略）。

```text
// <line 107>（ArtifactInstructions.template）
  /** Template content (structure to follow - this IS the output format) */
```

**译文：** 模板内容（要遵循的结构 —— 它本身就是输出格式）。

```text
// <line 109>（ArtifactInstructions.dependencies）
  /** Dependencies with completion status and paths */
```

**译文：** 带完成状态和路径的依赖。

```text
// <line 111>（ArtifactInstructions.unlocks）
  /** Artifacts that become available after completing this one */
```

**译文：** 完成这一个之后变得可用的 artifact。

```text
// <line 113>（ArtifactInstructions.skipped）
  /** True when the change declares skip_specs and this artifact is skipped */
```

**译文：** 当 change 声明了 skip_specs 且这个 artifact 被跳过时为 true。

```text
// <line 115>（ArtifactInstructions.warning）
  /** Present only when skipped: tells the consumer not to create the artifact */
```

**译文：** 仅在 skipped 时出现：告诉消费方不要创建这个 artifact。

```text
// <line 119-123>（SKIP_SPECS_INSTRUCTIONS_WARNING）
/**
 * Warning attached to instructions for an artifact skipped via skip_specs.
 * Carried in the JSON payload too, so agents driving the CLI with --json see
 * the same do-not-create signal as the text output.
 */
```

**译文：** 挂在经 skip_specs 跳过的 artifact 指令上的警告。它也随 JSON 载荷一起带出，所以用 --json 驱动 CLI 的 agent 能看到与文本输出相同的「不要创建」信号。

```text
// <line 128-130>（DependencyInfo）
/**
 * Dependency information including path and description.
 */
```

**译文：** 依赖信息，含路径与描述。

```text
// <line 132>（DependencyInfo.id）
  /** Artifact ID */
```

**译文：** artifact ID。

```text
// <line 134>（DependencyInfo.done）
  /** Whether the dependency is completed */
```

**译文：** 该依赖是否已完成。

```text
// <line 136>（DependencyInfo.path）
  /** Relative output path of the dependency (e.g., "proposal.md") */
```

**译文：** 该依赖的相对输出路径（例如 `"proposal.md"`）。

```text
// <line 138>（DependencyInfo.description）
  /** Description of the dependency artifact */
```

**译文：** 依赖 artifact 的描述。

```text
// <line 140>（DependencyInfo.skipped）
  /** True when the dependency is satisfied via skip_specs - no files exist to read */
```

**译文：** 当该依赖是经由 skip_specs 被满足时为 true —— 没有文件可读。

```text
// <line 144-146>（ArtifactStatus）
/**
 * Status of a single artifact in the workflow.
 */
```

**译文：** 工作流中单个 artifact 的状态。

```text
// <line 148>（ArtifactStatus.id）
  /** Artifact ID */
```

**译文：** artifact ID。

```text
// <line 150>（ArtifactStatus.outputPath）
  /** Output path pattern */
```

**译文：** 输出路径模式。

```text
// <line 152>（ArtifactStatus.status）
  /** Status: done, skipped (via skip_specs), ready, or blocked */
```

**译文：** 状态：done、skipped（经由 skip_specs）、ready 或 blocked。

```text
// <line 154-157>（ArtifactStatus.requires）
  /** Artifact IDs this artifact directly requires (its `requires` edges).
   * Present for every status so callers can compute the transitive required
   * set even when the artifact is already `done` (file-existence status does
   * not imply its dependencies exist). */
```

**译文：** 这个 artifact 直接依赖的 artifact ID（它的 `requires` 边）。每个状态都带上它，好让调用方即使在该 artifact 已经是 `done` 时也能算出传递性的所需集合（文件是否存在的状态并不蕴含它的依赖存在）。

```text
// <line 159>（ArtifactStatus.missingDeps）
  /** Missing dependencies (only for blocked) */
```

**译文：** 缺失的依赖（仅 blocked 时）。

```text
// <line 163-165>（ChangeStatus）
/**
 * Formatted change status.
 */
```

**译文：** 格式化后的 change 状态。

```text
// <line 167>（ChangeStatus.changeName）
  /** Change name */
```

**译文：** change 名。

```text
// <line 169>（ChangeStatus.schemaName）
  /** Schema name */
```

**译文：** schema 名。

```text
// <line 171-172>（ChangeStatus.planningHome）
  /** Planning home facts (generated skills derive the archive dir
   * from planningHome.changesDir - a published agent contract). */
```

**译文：** planning home 的事实（生成的技能从 planningHome.changesDir 推出 archive 目录 —— 这是一份已发布的 agent 契约）。

```text
// <line 174>（ChangeStatus.changeRoot）
  /** Full path to the change root */
```

**译文：** change 根的完整路径。

```text
// <line 176>（ChangeStatus.artifactPaths）
  /** Absolute artifact path details keyed by artifact ID */
```

**译文：** 按 artifact ID 索引的绝对 artifact 路径细节。

```text
// <line 178>（ChangeStatus.nextSteps）
  /** Plain-language next steps for users and agents */
```

**译文：** 给用户和 agent 看的白话下一步。

```text
// <line 180>（ChangeStatus.actionContext）
  /** Machine-readable action constraints for agents */
```

**译文：** 给 agent 的机器可读动作约束。

```text
// <line 182>（ChangeStatus.isPlanningComplete）
  /** Whether all planning artifacts are complete */
```

**译文：** 是否所有规划 artifact 都已完成。

```text
// <line 184>（ChangeStatus.isComplete）
  /** Compatibility alias for isPlanningComplete */
```

**译文：** isPlanningComplete 的兼容别名。

```text
// <line 186>（ChangeStatus.applyRequires）
  /** Artifact IDs required before apply phase (from schema's apply.requires) */
```

**译文：** apply 阶段之前必须存在的 artifact ID（来自 schema 的 apply.requires）。

```text
// <line 188>（ChangeStatus.artifacts）
  /** Status of each artifact */
```

**译文：** 每个 artifact 的状态。

```text
// <line 198-206>（loadTemplate）
/**
 * Loads a template from a schema's templates directory.
 *
 * @param schemaName - Schema name (e.g., "spec-driven")
 * @param templatePath - Relative path within the templates directory (e.g., "proposal.md")
 * @param projectRoot - Optional project root for project-local schema resolution
 * @returns The template content
 * @throws TemplateLoadError if the template cannot be loaded
 */
```

**译文：** 从 schema 的 templates 目录加载一个模板。

@param schemaName - schema 名（例如 "spec-driven"）
@param templatePath - templates 目录内的相对路径（例如 "proposal.md"）
@param projectRoot - 可选的项目根，用于项目本地 schema 解析
@returns 模板内容
@throws 无法加载模板时抛 TemplateLoadError

```text
// <line 252-264>（loadChangeContext）
/**
 * Loads change context combining graph and completion state.
 *
 * Schema resolution order:
 * 1. Explicit schemaName parameter (if provided)
 * 2. Schema from .openspec.yaml metadata (if exists in change directory)
 * 3. Default 'spec-driven'
 *
 * @param projectRoot - Project root directory
 * @param changeName - Change name
 * @param schemaName - Optional schema name override. If not provided, auto-detected from metadata.
 * @returns Change context with graph, completed set, and metadata
 */
```

**译文：** 加载 change 上下文，把图与完成状态合在一起。

Schema 解析顺序：
1. 显式的 schemaName 参数（若提供）
2. 来自 .openspec.yaml 元数据的 schema（若 change 目录里存在）
3. 默认 `'spec-driven'`

@param projectRoot - 项目根目录
@param changeName - change 名
@param schemaName - 可选的 schema 名覆盖。未提供时从元数据自动探测。
@returns 带图、完成集合与元数据的 change 上下文

```text
// <line 285-288>（loadChangeContext 内）
  // A change that declares skip_specs has no spec deltas by design, so
  // artifacts generating into specs/ count as complete; otherwise the graph
  // would block their dependents (e.g. tasks) on files that must not exist.
  // Tracked separately so status renders them as skipped, not done.
```

**译文：** 声明了 skip_specs 的 change 按设计就没有 spec delta，所以生成到 specs/ 里的 artifact 算作已完成；否则图会把它们的下游（例如 tasks）阻塞在必须不存在的文件上。单独跟踪，好让 status 把它们渲染成 skipped 而不是 done。

```text
// <line 312-325>（generateInstructions）
/**
 * Generates enriched instructions for creating an artifact.
 *
 * Instruction injection order:
 * 1. <context> - Project context from config (if present)
 * 2. <rules> - Artifact-specific rules from config (if present)
 * 3. <template> - Schema's template content
 *
 * @param context - Change context
 * @param artifactId - Artifact ID to generate instructions for
 * @param projectRoot - Project root directory (for reading config)
 * @returns Enriched artifact instructions
 * @throws Error if artifact not found
 */
```

**译文：** 为创建 artifact 生成充实过的指令。

指令注入顺序：
1. `<context>` —— 来自配置的项目上下文（若存在）
2. `<rules>` —— 来自配置的 artifact 专属规则（若存在）
3. `<template>` —— schema 的模板内容

@param context - change 上下文
@param artifactId - 要为其生成指令的 artifact ID
@param projectRoot - 项目根目录（用于读取配置）
@returns 充实过的 artifact 指令
@throws artifact 找不到时抛 Error

```text
// <line 327>（GenerateInstructionsOptions.projectConfig）
  /** Pre-read project config; suppresses the internal read (no double read). */
```

**译文：** 预先读好的项目配置；抑制内部那次读取（不重复读）。

```text
// <line 329>（GenerateInstructionsOptions.references）
  /** Referenced-store index assembled at the command boundary. */
```

**译文：** 在命令边界装配好的被引用 store 索引。

```text
// <line 348>（generateInstructions 内）
  // Use projectRoot from context if not explicitly provided
```

**译文：** 若没有显式提供 projectRoot，就用上下文里的。

```text
// <line 351>（generateInstructions 内）
  // Use the pre-read config when provided; otherwise read it here.
```

**译文：** 提供了预读配置就用它；否则在这里读。

```text
// <line 357>（generateInstructions 内）
      // If config read fails, continue without config
```

**译文：** 配置读取失败就继续，不带配置。

```text
// <line 361-363>（generateInstructions 内）
  // Validate rules artifact IDs if config has rules (only once per session).
  // The rules map is global while each change can use a different schema, so a
  // key is only "unknown" when it matches no artifact in ANY available schema.
```

**译文：** 若配置有 rules 就校验 rules 的 artifact ID（每个会话只做一次）。rules 映射是全局的，而每个 change 可以使用不同的 schema，所以一个 key 只有在不匹配任何可用 schema 里的任何 artifact 时才算「未知」。

```text
// <line 370>（generateInstructions 内）
    // Show each unique warning only once per session
```

**译文：** 每条唯一的警告每个会话只显示一次。

```text
// <line 379>（generateInstructions 内）
  // Extract context and rules as separate fields (not prepended to template)
```

**译文：** 把 context 和 rules 作为独立字段抽出（不前置到模板里）。

```text
// <line 410-412>（getDependencyInfo）
/**
 * Gets dependency info including paths and descriptions.
 */
```

**译文：** 取带路径与描述的依赖信息。

```text
// <line 431-437>（getUnlockedArtifacts）
/**
 * Gets artifacts that become available after completing the given artifact.
 *
 * `getAllArtifacts()` already yields the schema's declaration order, so the list
 * is returned as collected: sorting it alphabetically would have `unlocks` name
 * the artifacts in a different order than `status` recommends them.
 */
```

**译文：** 取完成给定 artifact 之后变得可用的 artifact。

`getAllArtifacts()` 本来就按 schema 的声明顺序产出，所以这个列表按收集到的顺序返回：按字母序排序会让 `unlocks` 点名的 artifact 顺序与 `status` 推荐它们的顺序不同。

```text
// <line 450-455>（formatChangeStatus）
/**
 * Formats the status of all artifacts in a change.
 *
 * @param context - Change context
 * @returns Formatted change status
 */
```

**译文：** 格式化一个 change 中所有 artifact 的状态。

@param context - change 上下文
@returns 格式化后的 change 状态

```text
// <line 460>（formatChangeStatus 内）
  // Load schema to get apply phase configuration
```

**译文：** 加载 schema 以取到 apply 阶段配置。

```text
// <line 512>（formatChangeStatus 内）
  // Sort by build order for consistent output
```

**译文：** 按构建顺序排序，保证输出一致。

---

### 30.7 `resolver.ts` —— 三层 schema 解析链与 schema 目录发现

`reference/openspec/src/core/artifact-graph/resolver.ts` · 12978 字节 · 383 行

**导出接口（原样保留）**

```ts
export class SchemaLoadError extends Error {
  constructor(
    message: string,
    public readonly schemaPath: string,
    public readonly cause?: Error
  ) { ... }
}

export function getPackageSchemasDir(): string { ... }

export function getUserSchemasDir(): string { ... }

export function getProjectSchemasDir(projectRoot: string): string { ... }

export function isSchemaDir(parentDir: string, entry: fs.Dirent): boolean { ... }

export function getSchemaDir(name: string, projectRoot?: string): string | null { ... }

export function resolveSchema(name: string, projectRoot?: string): SchemaYaml { ... }

export function listSchemas(projectRoot?: string): string[] { ... }

export interface SchemaInfo {
  name: string;
  description: string;
  artifacts: string[];
  source: 'project' | 'user' | 'package';
}

export function listSchemasWithInfo(projectRoot?: string): SchemaInfo[] { ... }
```

**设计推理（注释译文）**

```text
// <line 9-11>（SchemaLoadError）
/**
 * Error thrown when loading a schema fails.
 */
```

**译文：** 加载 schema 失败时抛出的错误。

```text
// <line 23-26>（getPackageSchemasDir）
/**
 * Gets the package's built-in schemas directory path.
 * Uses import.meta.url to resolve relative to the current module.
 */
```

**译文：** 取包内置的 schemas 目录路径。用 import.meta.url 相对当前模块解析。

```text
// <line 29>（getPackageSchemasDir 内）
  // Navigate from dist/core/artifact-graph/ to package root's schemas/
```

**译文：** 从 dist/core/artifact-graph/ 上溯到包根的 schemas/。

```text
// <line 33-35>（getUserSchemasDir）
/**
 * Gets the user's schema override directory path.
 */
```

**译文：** 取用户的 schema 覆盖目录路径。

```text
// <line 40-44>（getProjectSchemasDir）
/**
 * Gets the project-local schemas directory path.
 * @param projectRoot - The project root directory
 * @returns The path to the project's schemas directory
 */
```

**译文：** 取项目本地的 schemas 目录路径。
@param projectRoot - 项目根目录
@returns 该项目 schemas 目录的路径

```text
// <line 49-60>（isSchemaDir）
/**
 * Determines whether a directory entry represents a schema directory candidate.
 *
 * Returns true for real directories and for symlinks whose target is a
 * directory. `fs.Dirent.isDirectory()` reports the raw entry type, so a symlink
 * (even one pointing at a directory) has `isDirectory() === false`; we
 * dereference such entries via `fs.statSync` to admit symlinked schema dirs
 * while still rejecting symlinks-to-files and broken/dangling symlinks.
 *
 * @param parentDir - The directory containing the entry
 * @param entry - The directory entry from `fs.readdirSync(..., { withFileTypes: true })`
 */
```

**译文：** 判断一个目录项是否算作 schema 目录候选。

对真实目录、以及目标为目录的符号链接都返回 true。`fs.Dirent.isDirectory()` 报告的是原始条目类型，所以一个符号链接（即使它指向目录）的 `isDirectory() === false`；我们通过 `fs.statSync` 解引用这类条目，以接纳被符号链接过来的 schema 目录，同时仍然拒绝指向文件的符号链接与断链/悬空符号链接。

@param parentDir - 包含该条目的目录
@param entry - 来自 `fs.readdirSync(..., { withFileTypes: true })` 的目录项

```text
// <line 61-71>（isOwnedTransientSchemaDir）
/**
 * Directories `schema fork` and `schema init` create transiently while swapping
 * a schema into place: a staging copy (`.fork-staging-<rand>` /
 * `.init-staging-<rand>`, created via mkdtemp) and a backup of the previous
 * destination (`<name>.fork-backup-<pid>-<ts>` /
 * `<name>.init-backup-<pid>-<ts>`). Either can briefly coexist with real
 * schemas in the schemas dir, and a backup outlives the run when its cleanup is
 * blocked, so discovery must never surface them. Real schema names are
 * kebab-case (no dots), so excluding these dot-bearing temp names can never
 * hide a legitimate schema.
 */
```

**译文：** `schema fork` 与 `schema init` 在把 schema 换到位的过程中会临时创建一些目录：一份暂存副本（`.fork-staging-<rand>` / `.init-staging-<rand>`，经 mkdtemp 创建），以及前一个目标位置的备份（`<name>.fork-backup-<pid>-<ts>` / `<name>.init-backup-<pid>-<ts>`）。两者中的任何一个都可能与 schemas 目录里的真 schema 短暂共存，而备份在它的清理被阻塞时会活得比这次运行更久，所以发现过程绝不能把它们暴露出来。真实的 schema 名是 kebab-case（不含点），因此排除这些带点的临时名永远不会藏掉一个合法 schema。

```text
// <line 90>（isSchemaDir 内）
      // statSync follows the link; isDirectory() reflects the target type.
```

**译文：** statSync 会跟随链接；isDirectory() 反映的是目标类型。

```text
// <line 93>（isSchemaDir 内）
      // Broken symlink (dangling target) — statSync throws; treat as non-dir.
```

**译文：** 断链（目标悬空）—— statSync 抛错；按非目录处理。

```text
// <line 100-104>（getSchemaCandidateDir）
/**
 * Returns a schema directory only when its schema file stays within that
 * directory's canonical trust boundary. The directory itself may be a symlink;
 * external user schema links are an intentionally supported workflow.
 */
```

**译文：** 只有当 schema 文件待在该目录的规范化信任边界内时，才返回这个 schema 目录。目录本身可以是符号链接；外部用户 schema 链接是刻意支持的工作流。

```text
// <line 120-134>（getSchemaDir）
/**
 * Resolves a schema name to its directory path.
 *
 * Resolution order (when projectRoot is provided):
 * 1. Project-local: <projectRoot>/openspec/schemas/<name>/schema.yaml
 * 2. User override: ${XDG_DATA_HOME}/openspec/schemas/<name>/schema.yaml
 * 3. Package built-in: <package>/schemas/<name>/schema.yaml
 *
 * When projectRoot is not provided, only user override and package built-in are checked
 * (backward compatible behavior).
 *
 * @param name - Schema name (e.g., "spec-driven")
 * @param projectRoot - Optional project root directory for project-local schema resolution
 * @returns The path to the schema directory, or null if not found
 */
```

**译文：** 把 schema 名解析成它的目录路径。

解析顺序（提供 projectRoot 时）：
1. 项目本地：`<projectRoot>/openspec/schemas/<name>/schema.yaml`
2. 用户覆盖：`${XDG_DATA_HOME}/openspec/schemas/<name>/schema.yaml`
3. 包内置：`<package>/schemas/<name>/schema.yaml`

未提供 projectRoot 时，只检查用户覆盖与包内置（向后兼容行为）。

@param name - schema 名（例如 "spec-driven"）
@param projectRoot - 可选的项目根目录，用于项目本地 schema 解析
@returns schema 目录的路径；找不到则为 null

```text
// <line 151>（getSchemaDir 内）
  // 1. Check project-local directory (if projectRoot provided)
```

**译文：** 1. 检查项目本地目录（若提供了 projectRoot）。

```text
// <line 159>（getSchemaDir 内）
  // 2. Check user override directory
```

**译文：** 2. 检查用户覆盖目录。

```text
// <line 165>（getSchemaDir 内）
  // 3. Check package built-in directory
```

**译文：** 3. 检查包内置目录。

```text
// <line 174-189>（resolveSchema）
/**
 * Resolves a schema name to a SchemaYaml object.
 *
 * Resolution order (when projectRoot is provided):
 * 1. Project-local: <projectRoot>/openspec/schemas/<name>/schema.yaml
 * 2. User override: ${XDG_DATA_HOME}/openspec/schemas/<name>/schema.yaml
 * 3. Package built-in: <package>/schemas/<name>/schema.yaml
 *
 * When projectRoot is not provided, only user override and package built-in are checked
 * (backward compatible behavior).
 *
 * @param name - Schema name (e.g., "spec-driven")
 * @param projectRoot - Optional project root directory for project-local schema resolution
 * @returns The resolved schema object
 * @throws Error if schema is not found in any location
 */
```

**译文：** 把 schema 名解析成一个 SchemaYaml 对象。

解析顺序（提供 projectRoot 时）：
1. 项目本地：`<projectRoot>/openspec/schemas/<name>/schema.yaml`
2. 用户覆盖：`${XDG_DATA_HOME}/openspec/schemas/<name>/schema.yaml`
3. 包内置：`<package>/schemas/<name>/schema.yaml`

未提供 projectRoot 时，只检查用户覆盖与包内置（向后兼容行为）。

@param name - schema 名（例如 "spec-driven"）
@param projectRoot - 可选的项目根目录，用于项目本地 schema 解析
@returns 解析出的 schema 对象
@throws 任何位置都找不到该 schema 时抛 Error

```text
// <line 191>（resolveSchema 内）
  // Normalize name (remove .yaml extension if provided)
```

**译文：** 规范化名字（若提供了 .yaml 扩展名则去掉）。

```text
// <line 204>（resolveSchema 内）
  // Load and parse the schema
```

**译文：** 加载并解析 schema。

```text
// <line 236-241>（listSchemas）
/**
 * Lists all available schema names.
 * Combines project-local, user override, and package built-in schemas.
 *
 * @param projectRoot - Optional project root directory for project-local schema resolution
 */
```

**译文：** 列出所有可用的 schema 名。合并项目本地、用户覆盖与包内置的 schema。

@param projectRoot - 可选的项目根目录，用于项目本地 schema 解析

```text
// <line 245>（listSchemas 内）
  // Add package built-in schemas
```

**译文：** 加入包内置 schema。

```text
// <line 258>（listSchemas 内）
  // Add user override schemas (may override package schemas)
```

**译文：** 加入用户覆盖 schema（可以覆盖包 schema）。

```text
// <line 271>（listSchemas 内）
  // Add project-local schemas (if projectRoot provided)
```

**译文：** 加入项目本地 schema（若提供了 projectRoot）。

```text
// <line 289-291>（SchemaInfo）
/**
 * Schema info with metadata (name, description, artifacts).
 */
```

**译文：** 带元数据（名字、描述、artifacts）的 schema 信息。

```text
// <line 299-304>（listSchemasWithInfo）
/**
 * Lists all available schemas with their descriptions and artifact lists.
 * Useful for agent skills to present schema selection to users.
 *
 * @param projectRoot - Optional project root directory for project-local schema resolution
 */
```

**译文：** 列出所有可用 schema 及其描述与 artifact 列表。对要向用户呈现 schema 选择的 agent 技能有用。

@param projectRoot - 可选的项目根目录，用于项目本地 schema 解析

```text
// <line 309>（listSchemasWithInfo 内）
  // Add project-local schemas first (highest priority, if projectRoot provided)
```

**译文：** 先加入项目本地 schema（最高优先级，若提供了 projectRoot）。

```text
// <line 327>（listSchemasWithInfo 内）
              // Skip invalid schemas
```

**译文：** 跳过无效的 schema。

```text
// <line 335>（listSchemasWithInfo 内）
  // Add user override schemas (if not overridden by project)
```

**译文：** 加入用户覆盖 schema（若未被项目覆盖）。

```text
// <line 352>（listSchemasWithInfo 内）
            // Skip invalid schemas
```

**译文：** 跳过无效的 schema。

```text
// <line 359>（listSchemasWithInfo 内）
  // Add package built-in schemas (if not overridden by project or user)
```

**译文：** 加入包内置 schema（若未被项目或用户覆盖）。

```text
// <line 375>（listSchemasWithInfo 内）
            // Skip invalid schemas
```

**译文：** 跳过无效的 schema。

---

### 30.8 `index.ts` —— 把这一层的对外面收成一个 barrel

`reference/openspec/src/core/artifact-graph/index.ts` · 1236 字节 · 56 行

**导出接口（原样保留）**

```ts
export {
  ArtifactSchema,
  SchemaYamlSchema,
  type Artifact,
  type SchemaYaml,
  type CompletedSet,
  type BlockedArtifacts,
} from './types.js';

export { loadSchema, parseSchema, SchemaValidationError } from './schema.js';

export { ArtifactGraph } from './graph.js';

export { detectCompleted } from './state.js';

export {
  artifactOutputExists,
  isGlobPattern,
  resolveArtifactOutputPath,
  resolveArtifactOutputs,
} from './outputs.js';

export {
  resolveSchema,
  listSchemas,
  listSchemasWithInfo,
  getSchemaDir,
  getPackageSchemasDir,
  getUserSchemasDir,
  SchemaLoadError,
  type SchemaInfo,
} from './resolver.js';

export {
  loadTemplate,
  loadChangeContext,
  generateInstructions,
  formatChangeStatus,
  TemplateLoadError,
  type ChangeContext,
  type LoadChangeContextOptions,
  type ArtifactInstructions,
  type DependencyInfo,
  type ArtifactStatus,
  type ChangeStatus,
  type ArtifactPathSummary,
} from './instruction-loader.js';

export type {
  PlanningHomeSummary,
  ActionContext,
} from '../change-status-policy.js';
```

**设计推理（注释译文）**

```text
// <line 1>
// Types
```

**译文：** 类型。

```text
// <line 11>
// Schema loading and validation
```

**译文：** schema 加载与校验。

```text
// <line 14>
// Graph operations
```

**译文：** 图操作。

```text
// <line 17>
// State detection
```

**译文：** 状态检测。

```text
// <line 26>
// Schema resolution
```

**译文：** schema 解析。

```text
// <line 38>
// Instruction loading
```

**译文：** 指令加载。

---

### 30.9 `change-status-policy.ts` —— 「下一步做什么」的唯一出处

`reference/openspec/src/core/change-status-policy.ts` · 3124 字节 · 102 行

**导出接口（原样保留）**

```ts
export interface PlanningHomeSummary {
  kind: 'repo';
  root: string;
  changesDir: string;
  defaultSchema: string;
}

export interface ActionContext {
  mode: 'repo-local';
  sourceOfTruth: 'repo';
  planningArtifacts: string[];
  linkedContext: Array<{ name: string }>;
  allowedEditRoots: string[];
  requiresAffectedAreaSelection: boolean;
  constraints: string[];
}

export interface ChangeStatusPolicyArtifact {
  id: string;
  status: 'done' | 'skipped' | 'ready' | 'blocked';
}

export interface ChangeNextStepsInput {
  changeName: string;
  artifactStatuses: ChangeStatusPolicyArtifact[];
  allArtifactsComplete: boolean;
  storeId?: string;
}

export interface ActionContextInput {
  projectRoot: string;
  artifactIds: string[];
}

export function summarizePlanningHome(
  planningHome: PlanningHome | undefined
): PlanningHomeSummary | undefined { ... }

export function buildActionContext(input: ActionContextInput): ActionContext {
  return {
    mode: 'repo-local',
    sourceOfTruth: 'repo',
    planningArtifacts: input.artifactIds,
    linkedContext: [],
    allowedEditRoots: [input.projectRoot],
    requiresAffectedAreaSelection: false,
    constraints: ['Repo-local change artifacts and implementation edits are scoped to this project.'],
  };
}

export interface ChangeNextStep {
  command: string;
  sentence: string;
}

export function resolveNextStep(input: ChangeNextStepsInput): ChangeNextStep | undefined { ... }

export function buildNextSteps(input: ChangeNextStepsInput): string[] { ... }
```

**设计推理（注释译文）**

```text
// <line 29>（ChangeNextStepsInput.storeId）
  /** Selected store id; next-step commands must carry it. */
```

**译文：** 选中的 store id；下一步命令必须带上它。

```text
// <line 65-71>（ChangeNextStep）
/**
 * The one next action for a change, in both the forms the CLI needs.
 *
 * `sentence` is what the JSON `nextSteps` contract publishes; `command` is the
 * bare command the text surface prints. Both are built here so the two
 * surfaces can never name a different next step.
 */
```

**译文：** 一个 change 的唯一下一步动作，以 CLI 需要的两种形态给出。

`sentence` 是 JSON `nextSteps` 契约发布的内容；`command` 是文本界面打印的裸命令。两者都在这里构建，所以两个界面永远不可能指出不同的下一步。

```text
// <line 73>（ChangeNextStep.command）
  /** Ready-to-run command, including any `--store` flag. */
```

**译文：** 可直接运行的命令，含任何 `--store` 标志。

```text
// <line 75>（ChangeNextStep.sentence）
  /** Sentence form carried by the JSON `nextSteps` array. */
```

**译文：** JSON `nextSteps` 数组携带的句子形态。

---

### 30.10 `planning-home.ts` —— 规划状态在磁盘上住哪

`reference/openspec/src/core/planning-home.ts` · 2862 字节 · 99 行

**导出接口（原样保留）**

```ts
export type PlanningHomeKind = 'repo';

export interface PlanningHome {
  kind: PlanningHomeKind;
  root: string;
  changesDir: string;
  defaultSchema: string;
}

export interface ResolvePlanningHomeOptions {
  startPath?: string;
  allowImplicitRepoRoot?: boolean;
}

export function findRepoPlanningRootSync(startPath = process.cwd()): string | null { ... }

export function resolveCurrentPlanningHomeSync(
  options: ResolvePlanningHomeOptions = {}
): PlanningHome { ... }

export function getChangeDir(planningHome: PlanningHome, changeName: string): string { ... }

export function formatChangeLocation(planningHome: PlanningHome, changeName: string): string { ... }
```

**设计推理（注释译文）**

```text
// <line 97>（formatChangeLocation 内）
  // Repo homes always nest changesDir under the root.
```

**译文：** repo 形态的 home 总是把 changesDir 嵌在 root 之下。

本文件没有文件头文档注释，源码中只有上面这一条行内注释；其余文件内声明（`REPO_DEFAULT_SCHEMA`、`pathExistsAsDirectory`、`getSearchStartDirectory`、`findNearestAncestor`、`repoPlanningHome`）都不带注释。

---

### 30.11 `root-selection.ts` —— 正常命令共用的 OpenSpec root 解析

`reference/openspec/src/core/root-selection.ts` · 19231 字节 · 567 行

按取材范围，本节只覆盖该文件的文件头文档注释与文件头部的类型/类声明（第 1–90 行）；下面的导出清单也只列这一段里出现的导出项，其余 567 行正文不展开。

**导出接口（原样保留）**

```ts
export type OpenSpecRootSource =
  | 'store'
  | 'declared'
  | 'global_default'
  | 'nearest'
  | 'implicit';

export interface StoreSelectorOptions {
  store?: string;
  storePath?: string;
}

export interface ResolveOpenSpecRootOptions extends StoreSelectorOptions {
  startPath?: string;
  allowImplicitRoot?: boolean;
  globalDataDir?: string;
}

export interface ResolvedOpenSpecRoot {
  path: string;
  changesDir: string;
  specsDir: string;
  archiveDir: string;
  defaultSchema: 'spec-driven';
  source: OpenSpecRootSource;
  storeId?: string;
}

export interface RootSelectionDiagnostic {
  severity: 'error';
  code: string;
  message: string;
  target?: string;
  fix?: string;
}

export class RootSelectionError extends Error {
  readonly diagnostic: RootSelectionDiagnostic;

  constructor(
    message: string,
    code: string,
    options: { target?: string; fix?: string } = {}
  ) { ... }
}
```

**设计推理（注释译文）**

```text
// <line 1-23>（文件头）
/**
 * Shared OpenSpec root resolution for normal commands.
 *
 * Normal commands (`new change`, `status`, `instructions`, `list`, `show`,
 * `validate`, `archive`) resolve one OpenSpec root through this module:
 *
 * - `--store <id>` selects a registered store's root.
 * - Without `--store`, the nearest ancestor containing `openspec/` wins.
 *   Leftover workspace view state is never considered a root here.
 * - With no nearest root, a global `defaultStore` (if set) is the last
 *   machine-level fallback before the selection hint error.
 * - With no nearest root and no default, registered stores produce a
 *   selection hint error; otherwise commands may treat the current
 *   directory as an implicit root.
 *
 * Diagnostic codes reuse the store taxonomy where an error passes
 * through unchanged (`invalid_store_id`, metadata parse failures);
 * resolver-specific failures use the normal-command codes below
 * (`unknown_store`, `no_registered_stores`, `store_identity_mismatch`,
 * `unhealthy_store_root`, `store_path_not_supported`,
 * `invalid_store_pointer`, `no_root_with_registered_stores`,
 * `no_openspec_root`).
 */
```

**译文：** 正常命令共用的 OpenSpec root 解析。

正常命令（`new change`、`status`、`instructions`、`list`、`show`、`validate`、`archive`）都通过这个模块解析唯一的 OpenSpec root：

- `--store <id>` 选中一个已注册 store 的 root。
- 不带 `--store` 时，包含 `openspec/` 的最近祖先胜出。遗留的 workspace 视图状态在这里从不被当作 root。
- 没有最近的 root 时，一个全局 `defaultStore`（若设置了）是选择提示错误之前最后一层机器级兜底。
- 既没有最近的 root 也没有默认值，而已注册的 store 存在时，会产生一个选择提示错误；否则命令可以把当前目录当作隐式 root。

诊断码在错误原样通过时复用 store 的分类（`invalid_store_id`、元数据解析失败）；解析器自身特有的失败使用下面这些正常命令的码（`unknown_store`、`no_registered_stores`、`store_identity_mismatch`、`unhealthy_store_root`、`store_path_not_supported`、`invalid_store_pointer`、`no_root_with_registered_stores`、`no_openspec_root`）。

第 43–90 行的类型与类声明本身不带文档注释。
