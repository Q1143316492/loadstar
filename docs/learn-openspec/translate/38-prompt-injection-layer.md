## 38 提示词注入层 —— project-config / references / change-metadata

> 源码阅读稿：译自 `reference/openspec/src/core/project-config.ts`、`reference/openspec/src/core/references.ts`、`reference/openspec/src/utils/change-metadata.ts`。**导出的签名与英文注释原文逐字保留**，只译注释正文；TypeScript 语句不译。按 `READING-openspec.md` 第 38 项（⌸）。

### 38.0 这一层回答什么

这一层管的是「谁把项目自己的东西塞进提示词，以及塞进去之后谁负责校验」。`project-config.ts` 读 `openspec/config.yaml`，产出 `context`、逐 artifact 的 `rules`、逐 operation 的 `guidance` 和 `store` 指针；`references.ts` 把跨仓声明的 store 编译成一份**索引**，让生成指令时能带上「去哪个仓、用哪条 fetch 命令」。`change-metadata.ts` 管的是另一个方向：change 目录里的 `.openspec.yaml` 怎么被读写、schema 名字怎么解析，以及 `skip_specs` / `retire_capabilities` 这类标记在什么条件下才算数。三者的共同立场是：配置面出的问题只降级成 warning 诊断，不能让一次生成直接失败；但**一旦某个标记要影响 validate/archive 的结论，就得与 CLI 其它部分看到的是同一份真相**。

---

### 38.1 project-config.ts

- 路径：`reference/openspec/src/core/project-config.ts`
- 大小：22,604 字节；618 行
- 注意：该文件**没有文件头文档注释**，第 1–7 行直接是 `import`。设计推理全部写在导出 schema 的 JSDoc、字段行内注释，以及导出函数的 JSDoc 上，下面按源文件行序逐条列出。

**导出的名字与签名（逐字）：**

```ts
export const OPERATION_IDS = ['apply', 'archive'] as const;
export type OperationId = (typeof OPERATION_IDS)[number];

export interface OperationConfig {
  guidance?: string[];
}

export type OperationsConfig = Partial<Record<OperationId, OperationConfig>>;

const OperationConfigSchema = z.object({
  guidance: z.array(z.string()).optional(),
});

export const ProjectConfigSchema = z.object({
  schema: z
    .string()
    .min(1)
    .describe('The workflow schema to use (e.g., "spec-driven")'),
  context: z
    .string()
    .optional()
    .describe('Project context injected into all artifact instructions'),
  rules: z
    .record(
      z.string(), // artifact ID
      z.array(z.string()) // list of rules
    )
    .optional()
    .describe('Per-artifact rules, keyed by artifact ID'),
  operations: z
    .object({
      apply: OperationConfigSchema.optional(),
      archive: OperationConfigSchema.optional(),
    })
    .optional()
    .describe('Per-operation advisory guidance'),
  store: z
    .string()
    .optional()
    .describe('Store id used as the OpenSpec root when no local planning shape exists'),
  githubCopilot: z
    .object({
      cloudAgent: z.boolean().optional(),
    })
    .optional()
    .describe('GitHub Copilot integration preferences'),
});

/** Normalized in-memory shape of a referenced store declaration. */
export interface DeclarationEntry {
  id: string;
  /** Clone source rendered into onboarding fixes. */
  remote?: string;
}

export type ProjectConfig = z.infer<typeof ProjectConfigSchema> & {
  references?: DeclarationEntry[];
};

export interface OperationInputs {
  context?: string;
  operationGuidance?: string[];
}

export function loadOperationInputs(
  projectConfig: ProjectConfig | null,
  operationId: OperationId
): OperationInputs;

export const MAX_CONTEXT_SIZE = 50 * 1024; // 50KB hard limit, shared with the references index

export function readProjectConfig(projectRoot: string): ProjectConfig | null;

export function validateConfigRules(
  rules: Record<string, string[]>,
  validArtifactIds: Set<string>
): string[];

export function suggestSchemas(
  invalidSchemaName: string,
  availableSchemas: { name: string; isBuiltIn: boolean }[]
): string;

export interface StorePointerRead {
  /** The declared store id, when present and a string. */
  value?: string;
  /** Set when the pointer cannot be trusted: the config file could not be
   * read as YAML, or the store key is present but not a string. An empty
   * or comments-only config is NOT malformed - it simply has no pointer. */
  malformed?: 'unparseable' | 'non_string';
  /** Absolute path of the config file actually read, or null when none exists. */
  filePath: string | null;
}

export function readStorePointer(projectRoot: string): StorePointerRead;

/** Shared .yaml/.yml probe used by readProjectConfig and readStorePointer. */
export function resolveConfigFilePath(projectRoot: string): string | null;

/** Human rendering of a malformed pointer reason, shared by every surface. */
export function storePointerProblem(reason: 'unparseable' | 'non_string'): string;

export interface OpenSpecDirClassification {
  hasPlanningShape: boolean;
  pointer: StorePointerRead;
}

export function classifyOpenSpecDir(projectRoot: string): OpenSpecDirClassification;
```

**设计推理注释（源文件行序；英文原文逐字，后接中译）：**

**(1) 第 21–33 行，`ProjectConfigSchema` 的 JSDoc —— 为什么用 Zod**

```ts
/**
 * Zod schema for project configuration.
 *
 * Purpose:
 * 1. Documentation - clearly defines the config file structure
 * 2. Type safety - TypeScript infers ProjectConfig type from schema
 * 3. Runtime validation - uses safeParse() for resilient field-by-field validation
 *
 * Why Zod over manual validation:
 * - Helps understand OpenSpec's data interfaces at a glance
 * - Single source of truth for type and validation
 * - Consistent with other OpenSpec schemas
 */
```

> 项目配置的 Zod schema。
>
> 目的：
> 1. 文档 —— 清楚地定义配置文件结构
> 2. 类型安全 —— TypeScript 从 schema 推断出 ProjectConfig 类型
> 3. 运行时校验 —— 用 safeParse() 做有韧性的、逐字段的校验
>
> 为什么用 Zod 而不是手写校验：
> - 让人一眼看懂 OpenSpec 的数据接口
> - 类型与校验的单一真值来源
> - 与 OpenSpec 其它 schema 保持一致

**(2) 第 35–39 行，`schema` 字段**

```ts
  // Required: which schema to use (e.g., "spec-driven", or project-local schema name)
  schema: z
    .string()
    .min(1)
    .describe('The workflow schema to use (e.g., "spec-driven")'),
```

> 必需：用哪个 schema（例如 `"spec-driven"`，或者项目本地的 schema 名）

**(3) 第 41–46 行，`context` 字段**

```ts
  // Optional: project context (injected into all artifact instructions)
  // Max size: 50KB (enforced during parsing)
  context: z
    .string()
    .optional()
    .describe('Project context injected into all artifact instructions'),
```

> 可选：项目 context（注入所有 artifact 的指令）
> 大小上限：50KB（在解析时强制执行）

**(4) 第 48–55 行，`rules` 字段**

```ts
  // Optional: per-artifact rules (additive to schema's built-in guidance)
  rules: z
    .record(
      z.string(), // artifact ID
      z.array(z.string()) // list of rules
    )
    .optional()
    .describe('Per-artifact rules, keyed by artifact ID'),
```

> 可选：逐 artifact 规则（叠加在 schema 内置指引之上）

**(5) 第 57–64 行，`operations` 字段**

```ts
  // Optional: per-operation advisory guidance, kept separate from artifact rules.
  operations: z
    .object({
      apply: OperationConfigSchema.optional(),
      archive: OperationConfigSchema.optional(),
    })
    .optional()
    .describe('Per-operation advisory guidance'),
```

> 可选：逐 operation 的建议性指南，与 artifact 规则分开保存。

**(6) 第 66–69 行，`references` 为何故意不在 Zod schema 里**

```ts
  // Note: the `references` field (id strings or {id, remote} maps) is
  // deliberately absent here — readProjectConfig parses and normalizes
  // it by hand (see DeclarationEntry below); a schema entry nothing
  // parses would only drift from the real behavior.
```

> 注意：`references` 字段（id 字符串，或者 `{id, remote}` 映射）在这里是**故意**缺席的
> —— `readProjectConfig` 手工解析并规范化它（见下面的 DeclarationEntry）；一个没人用来
> 解析的 schema 条目只会与真实行为漂移。

**(7) 第 71–77 行，`store` 字段**

```ts
  // Optional: the declared default store. Only consulted by root
  // resolution when this openspec/ directory is config-only (no specs/
  // or changes/); a fallback, never an override.
  store: z
    .string()
    .optional()
    .describe('Store id used as the OpenSpec root when no local planning shape exists'),
```

> 可选：声明的默认 store。只有当这个 `openspec/` 目录是「只有配置」（没有 `specs/` 或
> `changes/`）时，root 解析才会查它；它是回退，绝不是覆盖。

**(8) 第 79–87 行，`githubCopilot` 字段**

```ts
  // Optional: GitHub Copilot integration preferences. `cloudAgent` is the
  // opt-in for generating the Copilot cloud coding-agent files (a GitHub
  // Actions workflow + agent file); absent means "not yet decided".
  githubCopilot: z
    .object({
      cloudAgent: z.boolean().optional(),
    })
    .optional()
    .describe('GitHub Copilot integration preferences'),
```

> 可选：GitHub Copilot 集成偏好。`cloudAgent` 是生成 Copilot cloud coding-agent 文件
> （一个 GitHub Actions workflow 加一个 agent 文件）的 opt-in；缺席意味着「还没决定」。

**(9) 第 90–95 行，`DeclarationEntry` 的接口注释**

```ts
/** Normalized in-memory shape of a referenced store declaration. */
export interface DeclarationEntry {
  id: string;
  /** Clone source rendered into onboarding fixes. */
  remote?: string;
}
```

> 一条被引用的 store 声明的、规范化后的内存形状。
>
> 被渲染进上手修复项里的 clone 来源。

**(10) 第 185–193 行，`parseDeclarationList` 的 JSDoc —— 去重与 remote 的填充规则**

```ts
/**
 * Parser for `references:` declarations: string entries or
 * {id, remote} maps, normalized to DeclarationEntry[]. Dedup keys on
 * id and keeps the first position; the first entry carrying a remote
 * supplies it (a later duplicate fills a missing remote, never
 * overrides). Invalid entries drop with a warning like other resilient
 * fields; returns undefined when the field is absent or normalizes to
 * empty.
 */
```

> `references:` 声明的解析器：字符串条目，或者 `{id, remote}` 映射，规范化为
> `DeclarationEntry[]`。去重以 id 为键并保留第一个位置；第一个带 remote 的条目提供
> 它（后面的重复项只会补上一个缺失的 remote，绝不覆盖）。无效条目像其它有韧性的字段
> 一样带警告丢弃；字段缺席或规范化为空时返回 undefined。

**(11) 第 213–220 行，`remote` 被丢弃时的行内注释**

```ts
        if (typeof candidate.remote === 'string' && candidate.remote.length > 0) {
          declaration.remote = candidate.remote;
        } else if (candidate.remote !== undefined) {
          droppedRemotes = true; // remote dropped, id kept
        }
```

> remote 被丢弃，id 保留

**(12) 第 248 行，`MAX_CONTEXT_SIZE`**

```ts
export const MAX_CONTEXT_SIZE = 50 * 1024; // 50KB hard limit, shared with the references index
```

> 50KB 硬上限，与 references 索引共用

**(13) 第 250–268 行，`readProjectConfig` 的 JSDoc —— 有韧性的逐字段校验，以及「为什么不缓存」的性能说明**

```ts
/**
 * Read and parse openspec/config.yaml from project root.
 * Uses resilient parsing - validates each field independently using Zod safeParse.
 * Returns null if file doesn't exist.
 * Returns partial config if some fields are invalid (with warnings).
 *
 * Performance note (Jan 2025):
 * Benchmarks showed direct file reads are fast enough without caching:
 * - Typical config (1KB): ~0.5ms per read
 * - Large config (50KB): ~1.6ms per read
 * - Missing config: ~0.01ms per read
 * Config is read 1-2 times per command (schema resolution + instruction loading),
 * adding ~1-3ms total overhead. Caching would add complexity (mtime checks,
 * invalidation logic) for negligible benefit. Direct reads also ensure config
 * changes are reflected immediately without stale cache issues.
 *
 * @param projectRoot - The root directory of the project (where `openspec/` lives)
 * @returns Parsed config or null if file doesn't exist
 */
```

> 从项目根读取并解析 `openspec/config.yaml`。
> 使用有韧性的解析 —— 用 Zod `safeParse` 独立校验每个字段。
> 文件不存在时返回 null。
> 部分字段无效时返回**部分**配置（并带警告）。
>
> 性能说明（2025 年 1 月）：
> 基准测试显示，不做缓存时直接读文件已经足够快：
> - 典型配置（1KB）：每次读约 0.5ms
> - 大配置（50KB）：每次读约 1.6ms
> - 配置缺失：每次读约 0.01ms
> 配置每条命令读 1–2 次（schema 解析 + 指令装载），合计增加约 1–3ms 开销。缓存会引入
> 复杂度（mtime 检查、失效逻辑）而收益可忽略。直接读还能保证配置改动立即生效，没有
> 过期缓存的问题。
>
> @param projectRoot - 项目的根目录（`openspec/` 所在处）
> @returns 解析出的配置，文件不存在时为 null

**(14) 第 265–272 行、第 399 行：有韧性解析的两条边界**

```ts
  const configPath = resolveConfigFilePath(projectRoot);
  if (configPath === null) {
    return null; // No config is OK
  }
```

> 没有配置是可以的

```ts
    // Return partial config even if some fields failed
    return Object.keys(config).length > 0 ? (config as ProjectConfig) : null;
```

> 即使某些字段失败了，也返回部分配置

**(15) 第 321–324 行，`rules` 的 artifact id 为什么不限于内置命名**

```ts
        // Artifact ids are intentionally not restricted to the built-in naming
        // convention, so keys such as "constructor" remain valid for custom
        // schemas. A null-prototype map preserves those keys as data without
        // letting "__proto__" mutate the lookup object's prototype.
        const parsedRules: Record<string, string[]> = Object.create(null);
```

> artifact id 有意不限于内置命名约定，所以像 `"constructor"` 这样的键对自定义 schema
> 依然合法。一个 null 原型的映射把这些键当数据保留，同时不让 `"__proto__"` 去改查找
> 对象的原型。

**(16) 第 368–370 行，读 `store:` 时为什么不吃这份解析**

```ts
    // Parse store pointer field: a string, or dropped with a warning.
    // (Root resolution does NOT use this parse — it uses readStorePointer
    // below, which errors on malformed pointers instead of dropping.)
    if (raw.store !== undefined) {
      if (typeof raw.store === 'string') {
        config.store = raw.store;
      } else {
```

> 解析 store 指针字段：一个字符串，否则带警告丢弃。
> （root 解析**不**用这份解析 —— 它用下面的 `readStorePointer`，后者对畸形指针报错，
> 而不是丢弃。）

**(17) 第 413–422 行，`validateConfigRules` 的 JSDoc —— rules 是全局的、schema 是逐 change 的**

```ts
/**
 * Validate artifact IDs in rules against the artifacts of every available
 * schema. The `rules:` map is global, but each change can use a different
 * schema, so a key is only unknown when it matches no artifact in ANY schema.
 * Returns warnings for keys that are unknown everywhere.
 *
 * @param rules - The rules object from config
 * @param validArtifactIds - Set of valid artifact IDs across all schemas
 * @returns Array of warning messages for unknown artifact IDs
 */
```

> 把 rules 里的 artifact ID 对着**每一个**可用 schema 的 artifact 校验。`rules:` 映射是
> 全局的，但每个 change 可以用不同的 schema，所以一个键只有在**任何** schema 里都匹配
> 不到 artifact 时才算未知。对到处都未知的键返回警告。
>
> @param rules - 配置里的 rules 对象
> @param validArtifactIds - 所有 schema 里合法 artifact ID 的集合
> @returns 针对未知 artifact ID 的警告消息数组

**(18) 第 442–449 行，`suggestSchemas` 的 JSDoc**

```ts
/**
 * Suggest valid schema names when user provides invalid schema.
 * Uses fuzzy matching to find similar names.
 *
 * @param invalidSchemaName - The invalid schema name from config
 * @param availableSchemas - List of available schemas with their type (built-in or project-local)
 * @returns Error message with suggestions and available schemas
 */
```

> 用户提供了无效 schema 时，给出合法 schema 名的建议。
> 使用模糊匹配找出相似的名字。
>
> @param invalidSchemaName - 配置里那个无效的 schema 名
> @param availableSchemas - 可用 schema 的列表及其类型（内置或项目本地）
> @returns 带建议与可用 schema 的错误消息

**(19) 第 515–517 行，段落分隔注释**

```ts
// -----------------------------------------------------------------------------
// Store pointer (declared default store)
// -----------------------------------------------------------------------------
```

> Store 指针（声明的默认 store）
**(20) 第 519–528 行，`StorePointerRead` 的字段注释 —— 什么算畸形、什么不算**

```ts
export interface StorePointerRead {
  /** The declared store id, when present and a string. */
  value?: string;
  /** Set when the pointer cannot be trusted: the config file could not be
   * read as YAML, or the store key is present but not a string. An empty
   * or comments-only config is NOT malformed - it simply has no pointer. */
  malformed?: 'unparseable' | 'non_string';
  /** Absolute path of the config file actually read, or null when none exists. */
  filePath: string | null;
}
```

> 声明的 store id，当它存在且是字符串时。
>
> 当这个指针不可信时被设置：配置文件读不成 YAML，或者 store 键存在但不是字符串。
> 一个空的、或只有注释的配置**不**算畸形 —— 它只是没有指针。
>
> 实际被读取的配置文件的绝对路径；一个都不存在时为 null。

**(21) 第 530–536 行，`readStorePointer` 的 JSDoc —— 畸形值必须被报告，而不是丢弃**

```ts
/**
 * Warning-silent targeted read of the `store:` pointer. Used by root
 * resolution (which must not re-emit the resilient parser's field
 * warnings) and by `openspec init`'s pointer guard. Unlike
 * `readProjectConfig`, a malformed value is REPORTED, not dropped —
 * a dropped pointer would silently flip where work lands.
 */
```

> 对 `store:` 指针的、不产生警告的定点读取。root 解析用它（root 解析不得重新发出有韧性
> 解析器的字段警告），`openspec init` 的指针守卫也用它。与 `readProjectConfig` 不同，
> 畸形值是**被报告**的，不是被丢弃的 —— 被丢掉的指针会悄悄翻转工作落地的地方。

**(22) 第 545–547 行，注释：空配置是「不完美」，不是「畸形」**

```ts
    // Empty, comments-only, or non-mapping configs carry no pointer;
    // they are imperfect, not malformed (readProjectConfig owns the
    // field warnings for those).
```

> 空的、只有注释的、或不是映射的配置不携带指针；它们是不完美，不是畸形（那些情况的
> 字段警告归 `readProjectConfig` 管）。

**(23) 第 564、574 行：两个共享的小函数**

```ts
/** Shared .yaml/.yml probe used by readProjectConfig and readStorePointer. */
```

> `readProjectConfig` 与 `readStorePointer` 共用的 `.yaml`/`.yml` 探测。

```ts
/** Human rendering of a malformed pointer reason, shared by every surface. */
```

> 畸形指针原因的人类可读渲染，每个面共用。

**(24) 第 581–588 行，`OpenSpecDirClassification` 的字段注释**

```ts
export interface OpenSpecDirClassification {
  /**
   * True when openspec/specs or openspec/changes exists as a directory
   * that is not itself a store root.
   */
  hasPlanningShape: boolean;
  pointer: StorePointerRead;
}
```

> 当 `openspec/specs` 或 `openspec/changes` 作为目录存在、且它自身不是一个 store root
> 时为 true。

**(25) 第 590–599 行，`classifyOpenSpecDir` 的 JSDoc —— 为什么带 store 元数据的目录不算规划内容**

```ts
/**
 * One classification for "real root vs config-only pointer dir", shared
 * by root resolution and the init pointer guard so they can never
 * disagree (slice 3.2).
 *
 * A specs/ or changes/ directory carrying store metadata is a store at
 * the recommended `~/openspec/<id>` layout whose id is `specs` or
 * `changes`, not planning content of the directory above it. Counting it
 * would make $HOME the phantom root the qualifying walk exists to prevent.
 */
```

> 「真 root 还是只有配置的指针目录」只有一份分类，root 解析与 init 的指针守卫共用，
> 所以它们永远不会互相矛盾（slice 3.2）。
>
> 一个带 store 元数据的 `specs/` 或 `changes/` 目录，是推荐布局 `~/openspec/<id>` 下一
> 个 id 恰好叫 `specs` 或 `changes` 的 store，而不是它上一层目录的规划内容。把它算进去
> 会让 `$HOME` 变成那个限定式遍历专门要防的幽灵 root。

---

### 38.2 references.ts

- 路径：`reference/openspec/src/core/references.ts`
- 大小：17,662 字节；520 行
- 阅读范围：**文件头文档注释 + 文件顶部注释**（按第 38 项只取这一层；本文件后段是索引装配与转义的实现细节）。

**文件头文档注释（第 1–10 行）：**

```ts
/**
 * Referenced-store index assembly (slice 3.1).
 *
 * A root's `openspec/config.yaml` may declare `references:` — store ids
 * whose specs the root's work draws on. Instructions output carries an
 * INDEX of those stores' specs (id, one-line summary, fetch recipe via
 * `--store`), built live from the registered checkouts at assembly time.
 * Content is never inlined; root resolution is never affected; problems
 * degrade to `warning` diagnostics instead of failing generation.
 */
```

> 被引用 store 的索引装配（slice 3.1）。
>
> 一个 root 的 `openspec/config.yaml` 可以声明 `references:` —— 这个 root 的工作要取材于
> 其 spec 的那些 store id。指令输出携带这些 store 的 spec 的一份**索引**（id、一行摘要、
> 经由 `--store` 的 fetch recipe），在装配时从已注册的 checkout 现场构建。
> **内容永不内联；root 解析永不受影响；问题降级为 `warning` 诊断，而不是让生成失败。**

**顶部注释（源文件行序；英文原文逐字，后接中译）：**

**(1) 第 27–38 行，导出接口**

```ts
export interface ReferenceSpecEntry {
  id: string;
  summary: string;
}

export interface ReferenceIndexEntry {
  store_id: string;
  root?: string;
  specs?: ReferenceSpecEntry[];
  fetch?: string;
  status: StoreDiagnostic[];
}
```

> （这两个接口没有文档注释；形状即契约：已解析的条目带上 `root` / `specs` / `fetch`，
> 未解析的带 `store_id` 加一条 warning `status`。）

**(2) 第 40–46 行，索引大小上限为什么等于项目 context 上限**

```ts
/**
 * Shares the project-context cap: the rendered index is prompt material.
 * Measured in UTF-8 bytes against the XML rendering (the larger of the
 * two), entries and diagnostics included; only the truncation warning
 * itself is exempt (no oscillation).
 */
```

> 与项目 context 共用同一个上限：渲染后的索引是提示词材料。
> 按 UTF-8 字节、对着 XML 渲染（两者中较大的那个）来量，条目与诊断都算在内；只有截断
> 警告本身豁免（避免来回震荡）。

**(3) 第 52–58 行，remote 只有在 shell 惰性时才渲染成可粘贴的 clone 命令**

```ts
/**
 * A remote is rendered into the pasteable clone command only when it is
 * shell-inert: no whitespace, quotes, or metacharacters, and not
 * flag-like (a config-supplied `--upload-pack=...` must never reach a
 * command agents execute verbatim). Anything else falls back to the
 * teammate-checkout wording.
 */
```

> 只有当 remote 对 shell 惰性时，它才会被渲染进那条可粘贴的 clone 命令：没有空白、
> 引号或元字符，并且不像一个 flag（配置提供的 `--upload-pack=...` 绝不该进入 agent
> 逐字执行的命令）。其它情况一律回退到「找队友要一份 checkout」的说法。

**(4) 第 65–72 行，路径为什么用绝对 home 路径，以及为什么按平台选引号**

```ts
    // Verbatim-pasteable: absolute home path because tilde never
    // expands outside a shell and agent JSON consumers execute argv.
    // The checkout is quoted (homedirs may contain spaces); the remote
    // is unquoted but gated by isShellSafeRemote above.
```

> 可逐字粘贴：用绝对 home 路径，因为 `~` 在 shell 之外永不展开，而消费 agent JSON 的
> 那一方执行的是 argv。checkout 被加引号（home 目录可能含空格）；remote 不加引号，但由
> 上面的 `isShellSafeRemote` 把关。

```ts
    // The fix renders on the machine that will paste it: POSIX shells
    // get single quotes; cmd/PowerShell treat single quotes as literal
    // characters, so win32 gets double quotes (valid everywhere).
```

> 这条修复项渲染在将要粘贴它的那台机器上：POSIX shell 得到单引号；cmd/PowerShell 把
> 单引号当字面字符，所以 win32 得到双引号（在哪里都合法）。

**(5) 第 81–85 行，CommonMark 收尾 `#` 序列**

```ts
/**
 * Drop a CommonMark closing sequence (`## Purpose ##`). The closing run only
 * counts when whitespace precedes it, so `Purpose###` keeps its hashes.
 * Scans from the end so the cost stays linear in the title length.
 */
```

> 去掉 CommonMark 的收尾序列（`## Purpose ##`）。只有当前面是空白时，那串收尾的 `#`
> 才算数，所以 `Purpose###` 保留它的 `#`。从尾部开始扫描，使代价与标题长度成线性。

**(6) 第 106–109 行，标题解析为什么手写**

```ts
/**
 * Heading title, or null when the line is not an ATX heading. Hand-rolled
 * rather than a regex so a title padded with whitespace cannot backtrack.
 */
```

> 返回标题文本，或在该行不是 ATX 标题时返回 null。手写而不用正则，这样被空白填充的标题
> 不会引发回溯。

**(7) 第 127–133 行，取 Purpose 行的容错策略**

```ts
/**
 * Tolerant first-Purpose-line extraction. parseSpec() throws on specs
 * without Purpose/Requirements sections; the index must never fail on an
 * imperfect upstream spec, so this scans for the heading directly —
 * fence-aware, so `## Purpose` inside a code block never matches, and
 * tolerant of CommonMark closing hashes (`## Purpose ##`).
 */
```

> 容错地提取第一行 Purpose。`parseSpec()` 对没有 Purpose/Requirements 段的 spec 会抛错；
> 索引绝不能在一条不完美的上游 spec 上失败，所以这里直接扫标题 —— 对围栏敏感，代码块
> 里的 `## Purpose` 永不匹配；并且容忍 CommonMark 的收尾 `#`（`## Purpose ##`）。

**(8) 第 201–204、219 行：两个纯渲染器**

```ts
/**
 * Pure renderer for the artifact-instructions XML block. Also the byte
 * budget's measuring stick (it is the larger rendering).
 */
```

> artifact 指令 XML 块的纯渲染器。它同时也是字节预算的标尺（它是两者中较大的那份渲染）。

```ts
/** Pure renderer for the apply-instructions markdown section. */
```

> apply 指令 markdown 段的纯渲染器。

**(9) 第 235–240 行，为什么转入 agent 指引的字符串必须「一行进一行出」**

```ts
/**
 * Strings rendered into agent guidance can come from cloned content
 * (spec directory names, Purpose lines, config-declared remotes). One
 * line in, one line out: control characters and newlines must never
 * let hostile content forge instruction lines (slice 6.1 hardening).
 */
```

> 渲染进 agent 指引的字符串可能来自 clone 回来的内容（spec 目录名、Purpose 行、配置声明
> 的 remote）。一行进，一行出：控制字符与换行绝不能让敌意内容伪造出指令行（slice 6.1
> 加固）。

**(10) 第 246–250 行，为什么「信封标签」就是全部的逃逸面**

```ts
/**
 * The tags the instruction printer uses to frame its blocks. A block ends at
 * its own closing tag and nowhere else, so this is the entire breakout
 * surface: neutralize these and repo-supplied text cannot escape the element
 * that marks it as data.
 */
```

> 指令打印器用来框住各块的那些标签。一个块只在它自己的闭合标签处结束、别处都不会，所以
> 这就是全部的逃逸面：把它们中和掉，仓库提供的文本就无法逃出那个把它标记为数据的元素。

**(11) 第 279–291 行，为什么只中和这一小撮标签，而不转义每一个尖括号**

```ts
/**
 * Neutralize the envelope's own tags - opening and closing - in repo-supplied
 * text, so it cannot close the block that frames it as data nor forge a new
 * block that carries authority.
 *
 * Deliberately narrow: only this fixed vocabulary is touched. Escaping every
 * angle bracket also works, but it mangles ordinary content for everyone.
 * OpenSpec's own spec-driven schema writes `### Requirement: <name>` and
 * `openspec show "<spec-id>"`; custom templates carry `<details>`; and
 * `context:` routinely holds `R&D`, `pnpm build && pnpm test` or
 * `Result<T, E>`. All of those would reach the agent entity-encoded - a real
 * cost paid by every user, against a threat only these tags can carry.
 */
```

> 在仓库提供的文本里中和信封自己的标签 —— 开标签与闭标签都要 —— 使它既不能关闭那个把
> 它框为数据的块，也不能伪造一个带权威的新块。
>
> 刻意收窄：只碰这一份固定的词汇表。转义每一个尖括号也行得通，但它会为所有人弄坏普通
> 内容。OpenSpec 自己的 spec-driven schema 会写 `### Requirement: <name>` 和
> `openspec show "<spec-id>"`；自定义模板带 `<details>`；而 `context:` 里经常有 `R&D`、
> `pnpm build && pnpm test` 或 `Result<T, E>`。这些全都会以实体编码的形式到达 agent ——
> 那是每个用户都要付的真实代价，去防一个只有这些标签才承载得起的威胁。

**(12) 第 300–303 行，为什么属性值可以放心地全量转义**

```ts
/**
 * Attribute values are ids and directory names, never prose, so escaping every
 * metacharacter here costs nothing and stops a quote from closing the
 * attribute and forging siblings on the tag.
 */
```

> 属性值是 id 与目录名，绝不是散文，所以这里转义每一个元字符不花任何代价，还能挡住一个
> 引号关闭属性、在标签上伪造兄弟属性。

**(13) 第 367–371 行，索引装配的三条边界**

```ts
/**
 * Builds the referenced-store index. One registry read per call; one
 * level deep (a referenced store's own references are never followed);
 * self-references omitted; every failure degrades to a warning entry.
 */
```

> 构建被引用 store 的索引。每次调用读一次注册表；只深入一层（一个被引用 store 自己的
> references 永不被跟随）；自引用被省略；每一次失败都降级为一条 warning 条目。

---

### 38.3 change-metadata.ts

- 路径：`reference/openspec/src/utils/change-metadata.ts`
- 大小：12,329 字节；345 行
- 该文件同样**没有文件头文档注释**（第 1–6 行是 `import`），设计推理集中在导出函数与标记读取的 JSDoc 上。下面对全文件注释按源文件行序逐条列出。

**导出的名字与签名（逐字）：**

```ts
export const METADATA_FILENAME = '.openspec.yaml';

export class ChangeMetadataError extends Error {
  constructor(
    message: string,
    public readonly metadataPath: string,
    public readonly cause?: Error
  );
}

export function validateSchemaName(
  schemaName: string,
  projectRoot?: string
): string;

export function writeChangeMetadata(
  changeDir: string,
  metadata: ChangeMetadata,
  projectRoot?: string
): void;

export function readChangeMetadata(
  changeDir: string,
  projectRoot?: string
): ChangeMetadata | null;

export interface ResolveSchemaForChangeOptions {
  metadata?: ChangeMetadata | null;
  /** Pre-read project config; suppresses the fallback config read when provided. */
  projectConfig?: ProjectConfig | null;
}

export function resolveSchemaForChange(
  changeDir: string,
  explicitSchema?: string,
  projectRootOverride?: string,
  options: ResolveSchemaForChangeOptions = {}
): string;

export interface MetadataMarker {
  declared: boolean;
  invalidReason?: string;
}

/** @deprecated Use MetadataMarker. */
export type SkipSpecsMarker = MetadataMarker;

export function readSkipSpecsMarker(changeDir: string): MetadataMarker;

export function readRetireCapabilitiesMarker(changeDir: string): MetadataMarker;
```

**设计推理注释（源文件行序；英文原文逐字，后接中译）：**

**(1) 第 10–12 行，`ChangeMetadataError`**

```ts
/**
 * Error thrown when change metadata validation fails.
 */
```

> change 元数据校验失败时抛出的错误。

**(2) 第 24–31 行，`validateSchemaName` 的 JSDoc**

```ts
/**
 * Validates that a schema name is valid (exists in available schemas).
 *
 * @param schemaName - The schema name to validate
 * @param projectRoot - Optional project root for project-local schema resolution
 * @returns The validated schema name
 * @throws Error if schema is not found
 */
```

> 校验一个 schema 名合法（存在于可用 schema 中）。
>
> @param schemaName - 要校验的 schema 名
> @param projectRoot - 可选的 project root，用于项目本地 schema 解析
> @returns 校验过的 schema 名
> @throws schema 找不到时抛错

**(3) 第 45–52 行，`writeChangeMetadata` 的 JSDoc**

```ts
/**
 * Writes change metadata to .openspec.yaml in the change directory.
 *
 * @param changeDir - The path to the change directory
 * @param metadata - The metadata to write
 * @param projectRoot - Optional project root for project-local schema resolution
 * @throws ChangeMetadataError if validation fails or write fails
 */
```

> 把 change 元数据写进 change 目录里的 `.openspec.yaml`。
>
> @param changeDir - change 目录的路径
> @param metadata - 要写入的元数据
> @param projectRoot - 可选的 project root，用于项目本地 schema 解析
> @throws 校验失败或写入失败时抛 `ChangeMetadataError`

**(4) 第 60、63、72 行，写入路径上的三步**

```ts
  // Validate schema exists
  ...
  // Validate with Zod
  ...
  // Write YAML file
```

> 校验 schema 存在 → 用 Zod 校验 → 写 YAML 文件

**(5) 第 86–93 行，`readChangeMetadata` 的 JSDoc**

```ts
/**
 * Reads change metadata from .openspec.yaml in the change directory.
 *
 * @param changeDir - The path to the change directory
 * @param projectRoot - Optional project root for project-local schema resolution
 * @returns The validated metadata, or null if no metadata file exists
 * @throws ChangeMetadataError if the file exists but is invalid
 */
```

> 从 change 目录里的 `.openspec.yaml` 读 change 元数据。
>
> @param changeDir - change 目录的路径
> @param projectRoot - 可选的 project root，用于项目本地 schema 解析
> @returns 校验过的元数据；没有元数据文件时为 null
> @throws 文件存在但无效时抛 `ChangeMetadataError`

**(6) 第 128、137 行，读取路径上的两步**

```ts
  // Validate with Zod
  ...
  // Validate that the schema exists
```

> 用 Zod 校验 → 校验 schema 存在

**(7) 第 149–153 行，`ResolveSchemaForChangeOptions`**

```ts
export interface ResolveSchemaForChangeOptions {
  metadata?: ChangeMetadata | null;
  /** Pre-read project config; suppresses the fallback config read when provided. */
  projectConfig?: ProjectConfig | null;
}
```

> 预先读好的项目配置；提供它时会抑制那次回退的配置读取。

**(8) 第 155–167 行，`resolveSchemaForChange` 的 JSDoc —— 四层解析顺序**

```ts
/**
 * Resolves the schema for a change, with explicit override taking precedence.
 *
 * Resolution order:
 * 1. Explicit schema (if provided)
 * 2. Schema from .openspec.yaml metadata (if exists)
 * 3. Schema from openspec/config.yaml (if exists)
 * 4. Default 'spec-driven'
 *
 * @param changeDir - The path to the change directory
 * @param explicitSchema - Optional explicit schema override
 * @returns The resolved schema name
 */
```

> 解析一个 change 用的 schema，显式覆盖优先。
>
> 解析顺序：
> 1. 显式 schema（若提供）
> 2. 来自 `.openspec.yaml` 元数据的 schema（若存在）
> 3. 来自 `openspec/config.yaml` 的 schema（若存在）
> 4. 默认 `'spec-driven'`
>
> @param changeDir - change 目录的路径
> @param explicitSchema - 可选的显式 schema 覆盖
> @returns 解析出的 schema 名

**(9) 第 174、177、188、204 行，解析顺序的四条行内注释**

```ts
  // Derive project root from changeDir (changeDir is typically projectRoot/openspec/changes/change-name)
  ...
  // 1. Explicit override wins
  ...
  // 3. Try reading from project config when metadata is absent.
  ...
  // 4. Default
```

> 从 `changeDir` 推出 project root（`changeDir` 通常是
> `projectRoot/openspec/changes/change-name`）
> ……
> 1. 显式覆盖胜出
> ……
> 3. 元数据缺席时，尝试从项目配置读。
> ……
> 4. 默认值

```ts
    } catch {
      // If config read fails, fall back to default
    }
```

> 如果配置读取失败，回退到默认值

**(10) 第 208–220 行，`MetadataMarker` 的两个字段**

```ts
export interface MetadataMarker {
  /**
   * True when the metadata parses under ChangeMetadataSchema, sets
   * the requested boolean marker to true, and names a schema that loads.
   */
  declared: boolean;
  /**
   * Set when the marker cannot be honored: it appears in a file that
   * fails the metadata contract, or the metadata file exists but cannot be
   * read at all (so whether the marker is set cannot even be determined).
   */
  invalidReason?: string;
}
```

> 当元数据能在 `ChangeMetadataSchema` 下解析、把请求的那个布尔标记设为 true，并且点名的
> schema 能加载时为 true。
>
> 当这个标记无法被兑现时被设置：它出现在一个不满足元数据契约的文件里，或者元数据文件
> 存在但根本读不出来（于是连标记有没有被设置都无法判定）。

**(11) 第 222–223 行，废弃别名**

```ts
/** @deprecated Use MetadataMarker. */
export type SkipSpecsMarker = MetadataMarker;
```

> 已废弃，用 `MetadataMarker`。

**(12) 第 225–237 行，`readSkipSpecsMarker` 的 JSDoc —— 标记何时才算数，以及那条双向不变量**

```ts
/**
 * Non-throwing read of the skip_specs marker. The marker only counts when the
 * metadata would load for status/instructions: the file parses under
 * ChangeMetadataSchema, its schema name passes readChangeMetadata's
 * listSchemas membership check, AND the schema itself loads via resolveSchema
 * (a schema.yaml that exists but does not parse fails status just the same).
 * Validate and archive must never honor metadata the rest of the CLI rejects,
 * in either direction. The project root for schema resolution is derived from
 * changeDir exactly like resolveSchemaForChange (changeDir is
 * <root>/openspec/changes/<name> for every root type, including store roots).
 * Missing metadata means "not declared"; a marker that cannot be honored
 * yields invalidReason so callers can say why.
 */
```

> 对 `skip_specs` 标记的不抛错读取。只有当元数据在 status/instructions 那里也加载得起来
> 时，这个标记才算数：文件能在 `ChangeMetadataSchema` 下解析，它的 schema 名通过
> `readChangeMetadata` 的 `listSchemas` 成员检查，**并且** schema 本身能经由
> `resolveSchema` 加载（一个存在但解析不了的 `schema.yaml` 同样让 status 失败）。
> **Validate 与 archive 绝不能认可 CLI 其余部分拒绝的元数据，两个方向都不行。**
> 用于 schema 解析的 project root 从 `changeDir` 推导，方式与 `resolveSchemaForChange`
> 完全一样（对每一种 root 类型，包括 store root，`changeDir` 都是
> `<root>/openspec/changes/<name>`）。
> 元数据缺失意味着「未声明」；一个无法被兑现的标记会给出 `invalidReason`，好让调用方说明
> 为什么。

**(13) 第 242–251 行，`readRetireCapabilitiesMarker` 的 JSDoc —— 为什么删除必须是声明的而不是推断的**

```ts
/**
 * Non-throwing read of the retire_capabilities marker, with exactly the
 * semantics `readSkipSpecsMarker` documents above.
 *
 * Gates the one archive action that removes a file from `openspec/specs/`: when
 * a change's REMOVED entries take a capability's last requirement, archive
 * deletes the emptied main spec rather than aborting on a spec it cannot write
 * (#1302). Declared rather than inferred because the delete is recoverable only
 * from git, so it is the author's call.
 */
```

> 对 `retire_capabilities` 标记的不抛错读取，语义与上面 `readSkipSpecsMarker` 记录的完全
> 相同。
>
> 它给那唯一一个会从 `openspec/specs/` 里删文件的 archive 动作把关：当一个 change 的
> REMOVED 条目拿掉了某个 capability 的最后一条 requirement 时，archive 删除被清空的
> 主 spec，而不是在一份它写不了的 spec 上中止（#1302）。用声明而不是推断，是因为这次
> 删除只能从 git 里恢复，所以这是作者的决断。

**(14) 第 256–259 行，两个标记共用一份实现的理由**

```ts
/**
 * Shared implementation for the boolean change-metadata markers, keyed by field
 * name. One body rather than two, so a marker can never drift into honoring
 * metadata the other rejects - the whole point of the contract described above.
 */
```

> 布尔型 change 元数据标记的共享实现，以字段名为键。一份实现而不是两份，这样一个标记
> 永远不会漂移成认可另一个标记拒绝的元数据 —— 这正是上面那段契约的全部意义。

**(15) 第 261–269 行，为什么原因字符串里不许留控制字符**

```ts
/**
 * A marker that cannot be honored, with its reason made safe to print.
 *
 * Every reason quotes something the author wrote - a schema name, a parser
 * message carrying one, a filesystem error carrying a path - and callers print
 * it straight to a terminal (`openspec archive`, `openspec validate`). A raw CR
 * could forge a line of its own and an ESC could redraw the screen, so control
 * characters never leave this function.
 */
```

> 一个无法被兑现的标记，连同被处理成可安全打印的原因。
>
> 每一个原因都会引用作者写下的某样东西 —— 一个 schema 名、一条携带它名字的解析器消息、
> 一个携带路径的文件系统错误 —— 而调用方会把它直接打到终端上（`openspec archive`、
> `openspec validate`）。一个裸 CR 就能伪造出它自己的一行，一个 ESC 就能重绘屏幕，所以
> 控制字符绝不离开这个函数。

**(16) 第 285–288 行，文件存在但读不出来时为什么必须 fail closed**

```ts
    // The file exists but cannot be read (EACCES, EISDIR, ...). Status and
    // instructions reject the change outright here, and whether a marker is
    // set cannot be determined - fail closed rather than let archive treat
    // the change as unmarked while every metadata-reading surface errors.
```

> 文件存在但读不出来（EACCES、EISDIR……）。status 与 instructions 在这里直接拒绝这个
> change，而标记有没有被设置也无法判定 —— 要 fail closed，而不是让 archive 在所有读
> 元数据的面都报错时把这个 change 当成未标记。

**(17) 第 298–299 行，为什么那行正则要锚定**

```ts
    // Anchored so a comment like "# maybe add skip_specs later" does not
    // claim the marker was set.
```

> 加锚点，这样像 `"# maybe add skip_specs later"` 这样的注释不会宣称标记已被设置。

**(18) 第 309–315 行，为什么只在标记被设置时才检查 schema 能否加载**

```ts
    // Schema loading is checked only when the marker is set: a broken schema
    // on an ordinary change is status's problem to report, but honoring a
    // marker that status rejects would let validate/archive pass what the
    // rest of the CLI refuses to load. The membership check mirrors
    // readChangeMetadata (which rejects names like 'spec-driven.yaml' that
    // resolveSchema alone would normalize and accept); resolveSchema then
    // proves the schema actually parses. Any failure fails closed.
```

> 只在标记被设置时才检查 schema 加载：一个普通 change 上的坏 schema 是 status 该报告的
> 问题，但认可一个 status 拒绝的标记，会让 validate/archive 放行 CLI 其余部分拒绝加载的
> 东西。成员检查与 `readChangeMetadata` 一致（它拒绝像 `'spec-driven.yaml'` 这样的名字，
> 而单靠 `resolveSchema` 会把它规范化并接受）；随后 `resolveSchema` 证明 schema 真的
> 解析得动。任何失败都 fail closed。

**(19) 第 329–333 行，为什么看键存在而不是看值**

```ts
  // Key presence, not value: skip_specs: "yes" must surface as unhonorable,
  // not vanish while the zero-delta guidance tells the user to set the very
  // marker they set. An explicit skip_specs: false is the opposite of setting
  // the marker, so it must not drag unrelated metadata problems into
  // validate - the change simply is not marked.
```

> 看键存在，而不是看值：`skip_specs: "yes"` 必须暴露为「无法兑现」，而不能消失不见、
> 同时零 delta 的指引还在告诉用户去设置那个他明明已经设了的标记。显式的
> `skip_specs: false` 是设置标记的反面，所以它不该把无关的元数据问题拖进 validate ——
> 这个 change 就是未标记。
