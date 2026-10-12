## 39 templates —— 生成技能的模板层

> 源码阅读稿：译自 `reference/openspec/src/core/templates/optional-workflow.ts`、`workflows/propose.ts`、`workflows/apply-change.ts`、`workflows/continue-change.ts`。**导出的签名与英文注释原文逐字保留**，只译注释正文；TypeScript 语句不译。按 `READING-openspec.md` 第 39 项。这一层**生成**第 2 节那十二个 `SKILL.md`；`reference/openspec/skills/` 下签入的副本是构建产物（`skills/README.md` 自己写着 `do not edit by hand`）。

### 39.0 这一层是什么

第 2 节里的十二个 `SKILL.md` 不是手写的，而是从这一层的 TypeScript 模块渲染出来的：每个模块导出一个或多个模板函数，返回 `SkillTemplate` / `CommandTemplate` 对象，其 `instructions` / `content` 字段就是技能的正文。三个 `workflows/*.ts` 文件各自开头都带同一段「由旧的整体模板文件拆分而来」的声明，说明它们曾经是一个文件。真正值得注意的是 `optional-workflow.ts`：同一个技能在 `core` 档和 expanded 档下要给不同指令，这一层选择的解法是**在生成期把分支定下来**，而不是让模型运行时自己去判断某个命令装没装。

---

### 39.1 optional-workflow.ts

- 路径：`reference/openspec/src/core/templates/optional-workflow.ts`
- 大小：7,495 字节；187 行

**文件头文档注释（第 1–16 行）：**

```ts
/**
 * Optional-Workflow Conditionals
 *
 * Not every workflow is installed. The `core` profile ships six of the twelve
 * (`propose`, `explore`, `apply`, `update`, `sync`, `archive`), and a `custom`
 * profile can ship any subset. A template that names `/opsx:continue` is
 * therefore writing a dead reference for anyone whose profile omits it — the
 * agent is told to hand off to a workflow that was never generated (#1734,
 * umbrella #919).
 *
 * `command-references.ts` rewrites how a reference is spelled; this module
 * decides whether it is emitted at all. Templates author both branches with
 * `optionalWorkflow()`, and `resolveOptionalWorkflows()` picks one at
 * generation time against the resolved workflow set, so the generated file
 * states one path instead of asking the model to check availability at runtime.
 */
```

> Optional-Workflow 条件分支
>
> 并不是每个 workflow 都被安装。`core` 档只发十二个里的六个（`propose`、`explore`、
> `apply`、`update`、`sync`、`archive`），而 `custom` 档可以发任意子集。所以一个点名
> `/opsx:continue` 的模板，对档位里没有它的任何人来说就是在写一个死引用 —— agent 被
> 指使去交接给一个从未被生成过的 workflow（#1734，总纲 #919）。
>
> `command-references.ts` 重写一个引用**怎么拼**；这个模块决定它**是否被发出**。模板用
> `optionalWorkflow()` 同时写两个分支，`resolveOptionalWorkflows()` 在生成期对着解析出的
> workflow 集合挑一个，**所以生成出来的文件陈述的是一条路径，而不是让模型在运行时去检查
> 可用性。**

**导出的名字与签名（逐字）：**

```ts
export function optionalWorkflow(
  workflowId: string,
  whenInstalled: string,
  whenMissing: string
): string;

export function onlyWithWorkflow(workflowId: string, whenInstalled: string): string;

export function resolveOptionalWorkflows(
  text: string,
  installedWorkflows: ReadonlySet<string>
): string;

export function assertWorkflowConditionalsResolved(text: string, reason: string): void;
```

**设计推理注释（源文件行序；英文原文逐字，后接中译）：**

**(1) 第 18–21 行，标记的字面形状**

```ts
const OPEN = '[[opsx:if-workflow ';
const OPEN_END = ']]';
const ELSE = '[[opsx:else]]';
const END = '[[opsx:end]]';
```

> 这就是生成期条件分支的全部语法：`[[opsx:if-workflow X]]...[[opsx:else]]...[[opsx:end]]`。

**(2) 第 23–28 行，为什么整行条件要单独匹配**

```ts
/**
 * A conditional that occupies a whole line on its own. Matched first so a
 * branch that resolves to empty takes its line with it — otherwise dropping a
 * table row or a bullet would leave a blank line behind, which markdown reads
 * as the end of the table or list.
 */
```

> 一个独占整行的条件分支。它被**优先**匹配，这样一个解析为空的支会连它那一行一起带走
> —— 否则删掉一行表格或一个 bullet 会留下一个空行，而 markdown 会把那个空行读成表格或
> 列表的结束。

**(3) 第 35–42 行，四个剩余标记用的模式**

```ts
/** Any leftover marker, used to fail loudly on malformed authoring. */
const RESIDUAL_MARKER_PATTERN = /\[\[opsx:(if-workflow|else|end)/;

/** A single well-formed marker, in any position. */
const MARKER_PATTERN = /\[\[opsx:(?:if-workflow [a-z-]+|else|end)\]\]/g;

/** Anything that opens like a marker, well-formed or not. */
const MARKER_LIKE_PATTERN = /\[\[opsx:/;
```

> 任何残留的标记，用来在作者写错时大声失败。
>
> 一个单独的、格式良好的标记，任意位置。
>
> 任何以标记开场的东西，格式良好与否都算。

**(4) 第 44–55 行，为什么必须在挑分支**之前**校验**

```ts
/**
 * Rejects a malformed conditional before any branch is chosen.
 *
 * Checking after resolution is not enough: the unselected branch is discarded
 * first, so a truncated block inside it would pass for one profile and throw
 * for another — the exact profile-dependent behavior this module exists to
 * remove. Authoring is either valid for every profile or valid for none.
 *
 * @param text - Template body as authored
 * @throws If a marker is unrecognized, or the blocks are not a flat sequence
 *         of if / else / end
 */
```

> 在挑任何分支**之前**就拒绝畸形的条件块。
>
> 解析之后再检查是不够的：没被选中的那个分支会先被丢弃，于是它内部一个被截断的块会对
> 某个档位通过、对另一个档位抛错 —— 恰恰就是这个模块存在要消除的那种「行为取决于档位」。
> 作者的写法要么对每个档位都合法，要么对谁都不合法。
>
> @param text - 作者写下的模板正文
> @throws 标记无法识别，或者各块不是 if / else / end 的扁平序列时抛出

**(5) 第 83–95 行，`optionalWorkflow` 的 JSDoc**

```ts
/**
 * Authors a passage whose wording depends on whether `workflowId` is installed.
 *
 * Both branches must read correctly on their own: the generated file contains
 * exactly one of them, with no trace of the other.
 *
 * @param workflowId - Workflow id as it appears in ALL_WORKFLOWS (e.g. 'continue')
 * @param whenInstalled - Text to emit when the workflow is part of the profile
 * @param whenMissing - Text to emit otherwise, typically a CLI fallback
 *
 * @example
 * optionalWorkflow('continue', 'suggest `/opsx:continue`', 'run `openspec status`')
 */
```

> 写出一段措辞取决于 `workflowId` 是否被安装的文字。
>
> 两个分支各自都必须读得通：生成出来的文件**只**包含其中一个，另一个不留痕迹。
>
> @param workflowId - 与 `ALL_WORKFLOWS` 中一致的 workflow id（例如 `'continue'`）
> @param whenInstalled - workflow 属于该档位时要发出的文本
> @param whenMissing - 否则要发出的文本，通常是一条 CLI 兜底
>
> @example
> `optionalWorkflow('continue', 'suggest `/opsx:continue`', 'run `openspec status`')`

**(6) 第 104–114 行，`onlyWithWorkflow` 的 JSDoc**

```ts
/**
 * A passage that is dropped entirely when `workflowId` is not installed.
 *
 * Use for a line that only makes sense alongside the workflow it names — a
 * command-reference table row, a bullet listing one workflow. When the
 * conditional is the whole line, the line goes with it rather than leaving a
 * blank one behind.
 *
 * @param workflowId - Workflow id as it appears in ALL_WORKFLOWS
 * @param whenInstalled - Text to emit when the workflow is part of the profile
 */
```

> 当 `workflowId` 没被安装时被整体丢弃的一段文字。
>
> 用于那种只有与它点名的 workflow 并存才有意义的一行 —— 一行命令参考表格、一个列出某个
> workflow 的 bullet。当条件块独占整行时，这一行跟着它一起走，而不是留下一个空行。
>
> @param workflowId - 与 `ALL_WORKFLOWS` 中一致的 workflow id
> @param whenInstalled - workflow 属于该档位时要发出的文本

**(7) 第 119–130 行，`resolveOptionalWorkflows` 的 JSDoc —— 先于命令引用改写器运行**

```ts
/**
 * Resolves every `optionalWorkflow()` passage in `text` against the workflows
 * that will actually be installed.
 *
 * Runs before the command-reference transformers, so a reference in a branch
 * that was dropped never reaches them.
 *
 * @param text - Template body, possibly containing conditionals
 * @param installedWorkflows - The resolved workflow set for this installation
 * @returns The body with one branch of each conditional kept
 * @throws If a malformed conditional leaves a marker in the output
 */
```

> 把 `text` 里每一段 `optionalWorkflow()` 都对着**实际将要安装**的 workflow 集合解析掉。
>
> 它跑在命令引用改写器**之前**，所以被丢掉的那个分支里的引用永远不会到达它们。
>
> @param text - 模板正文，可能含条件分支
> @param installedWorkflows - 这次安装解析出的 workflow 集合
> @returns 每个条件分支各保留一支之后的正文
> @throws 畸形条件块在输出里留下标记时抛出

**(8) 第 165–176 行，`assertWorkflowConditionalsResolved` 的 JSDoc —— 为什么写文件时还要再查一遍**

```ts
/**
 * Fails loudly if `text` still carries a conditional marker.
 *
 * Called at the end of resolution to catch a malformed block, and again at the
 * points that write a generated file — so a body that skipped resolution
 * altogether (a generation path that bypassed getSkillTemplates /
 * getCommandTemplates) throws instead of shipping literal markers to a user.
 *
 * @param text - Text about to be written, or just resolved
 * @param reason - What went wrong, used as the message prefix
 * @throws If any `[[opsx:...]]` marker remains
 */
```

> `text` 里还带着条件标记时大声失败。
>
> 在解析结束时调用一次以抓住畸形块，在**写生成文件**的那些点上再调用一次 —— 于是一个
> 完全跳过了解析的正文（一条绕开了 `getSkillTemplates` / `getCommandTemplates` 的生成
> 路径）会抛错，而不是把字面的标记发到用户手里。
>
> @param text - 即将被写入、或刚解析完的文本
> @param reason - 出了什么问题，用作消息前缀
> @throws 任何 `[[opsx:...]]` 标记残留时抛出

---

### 39.2 propose.ts

- 路径：`reference/openspec/src/core/templates/workflows/propose.ts`
- 大小：28,550 字节；356 行

**文件头注释（第 1–6 行）：**

```ts
/**
 * Skill Template Workflow Modules
 *
 * This file is generated by splitting the legacy monolithic
 * templates file into workflow-focused modules.
 */
```

> 技能模板的 workflow 模块
>
> 这个文件是把旧的整体模板文件拆成按 workflow 划分的模块后生成的。

**导出的名字与签名（逐字）：**

```ts
export function getOpsxProposeSkillTemplate(): SkillTemplate;

export function getOpsxProposeCommandTemplate(): CommandTemplate;
```

**设计推理注释（源文件行序；英文原文逐字，后接中译）：**

**(1) 第 12–25 行，两条 apply 交接语为什么在生成期解析、以及两个面为什么措辞不同**

```ts
/**
 * The implementation handoff. `apply` is not guaranteed to be installed, so
 * the prompt is resolved at generation time (see optional-workflow.ts) rather
 * than naming a workflow that may not exist.
 *
 * The two surfaces word this differently on purpose (#258): a command-only
 * tool has no conversational agent to ask, so its prompt names a command or
 * the CLI and never invites "ask me to implement".
 */
const SKILL_APPLY_HANDOFF = optionalWorkflow(
  'apply',
  'run `/opsx:apply` or ask me to apply this change',
  'ask me to apply this change'
);

const COMMAND_APPLY_HANDOFF = optionalWorkflow(
  'apply',
  'run `/opsx:apply`',
  'run `openspec instructions apply --change "<name>" --json` to get the tasks'
);
```

> 实现阶段的交接。`apply` 不保证被安装，所以这段提示词在**生成期**就解析掉（见
> `optional-workflow.ts`），而不是去点名一个可能并不存在的 workflow。
>
> 两个面**故意**措辞不同（#258）：只有命令、没有对话 agent 的工具没有对象可问，所以它的
> 提示词点名一条命令或 CLI，从不邀请「让我来实现」。

---

### 39.3 apply-change.ts

- 路径：`reference/openspec/src/core/templates/workflows/apply-change.ts`
- 大小：10,137 字节；242 行

**文件头注释（第 1–6 行）：**

```ts
/**
 * Skill Template Workflow Modules
 *
 * This file is generated by splitting the legacy monolithic
 * templates file into workflow-focused modules.
 */
```

> 技能模板的 workflow 模块
>
> 这个文件是把旧的整体模板文件拆成按 workflow 划分的模块后生成的。

**导出的名字与签名（逐字）：**

```ts
export function getApplyInstructions(): string;

export function getApplyChangeSkillTemplate(): SkillTemplate;

export function getOpsxApplyCommandTemplate(): CommandTemplate;
```

**设计推理注释（源文件行序；英文原文逐字，后接中译）：**

**(1) 第 12–21 行，blocked 状态的交接为什么带 CLI 兜底**

```ts
/**
 * `/opsx:continue` is not in the `core` profile, so the blocked-state handoff
 * is authored with a CLI fallback and resolved at generation time (see
 * optional-workflow.ts).
 */
const BLOCKED_STATE_HANDOFF = optionalWorkflow(
  'continue',
  'suggest using `/opsx:continue` to create them.',
  'suggest completing the missing artifacts. Run `openspec status --change "<name>" --json`, select the next `ready` artifact (not `skipped` or `blocked`), and use `openspec instructions "<artifact-id>" --change "<name>" --json` for its rules and template. Keep the selected `--store <id>` on both commands.'
);
```

> `/opsx:continue` 不在 `core` 档里，所以 blocked 状态的交接写了一条 CLI 兜底，并在生成期
> 解析（见 `optional-workflow.ts`）。

**(2) 第 23–28 行，全部 task 完成后的 archive 交接**

```ts
/** The archive handoff shown once every task is done. */
const ARCHIVE_HANDOFF = optionalWorkflow(
  'archive',
  'You can archive this change with `/opsx:archive`.',
  'You can archive this change by running `openspec archive "<name>"`.'
);
```

> 每一个 task 都完成之后展示的 archive 交接。

**(3) 第 30–38 行，`getApplyInstructions` 的 JSDoc —— 两个面共用同一份正文**

```ts
/**
 * The apply workflow instructions, authored once and rendered by both the
 * skill and command surfaces. The surfaces are intentionally distinct, but
 * they differ only in how they are invoked — the generation transformers
 * rewrite the canonical `/opsx:<id>` tokens per surface downstream (see
 * command-references.ts). The instruction text itself is shared, so the two
 * cannot silently drift. Should a surface ever need genuinely different
 * wording, add a parameter here and pass it from that surface's template.
 */
```

> apply workflow 的指令，只写一次，由 skill 面与 command 面共同渲染。两个面是**有意**
> 不同的，但它们的差别只在**怎么被调用** —— 生成期的改写器在下游按面重写规范的
> `/opsx:<id>` token（见 `command-references.ts`）。指令正文本身是共享的，所以两者无法
> 悄悄漂移。若某个面日后真的需要不同的措辞，在这里加一个参数，并从那个面的模板传进来。

**(4) 第 223–232、234–241 行：两个导出各自复用同一段正文**

```ts
export function getApplyChangeSkillTemplate(): SkillTemplate {
  return {
    name: 'openspec-apply-change',
    description: 'Implement tasks from an OpenSpec change. Use when the user wants to start implementing, continue implementation, or work through tasks. Also use when the user says "openspec apply", "opsx apply", or "openspec implement".',
    instructions: getApplyInstructions(),
    license: 'MIT',
    compatibility: 'Requires openspec CLI.',
    metadata: { author: 'openspec', version: '1.0' },
  };
}

export function getOpsxApplyCommandTemplate(): CommandTemplate {
  return {
    name: 'OPSX: Apply',
    description: 'Implement tasks from an OpenSpec change (Experimental)',
    category: 'Workflow',
    tags: ['workflow', 'artifacts', 'experimental'],
    content: getApplyInstructions(),
  };
}
```

> 这两个导出函数没有各自的文档注释；上面第 (3) 条那段共享正文的理由就是它们唯一的
> 设计说明。

---

### 39.4 continue-change.ts

- 路径：`reference/openspec/src/core/templates/workflows/continue-change.ts`
- 大小：13,526 字节；258 行

**文件头注释（第 1–6 行）：**

```ts
/**
 * Skill Template Workflow Modules
 *
 * This file is generated by splitting the legacy monolithic
 * templates file into workflow-focused modules.
 */
```

> 技能模板的 workflow 模块
>
> 这个文件是把旧的整体模板文件拆成按 workflow 划分的模块后生成的。

**导出的名字与签名（逐字）：**

```ts
export function getContinueChangeSkillTemplate(): SkillTemplate;

export function getOpsxContinueCommandTemplate(): CommandTemplate;
```

**设计推理注释（源文件行序；英文原文逐字，后接中译）：**

**(1) 第 12–25 行，规划完成时的交接：两半各自在生成期解析**

```ts
/**
 * The planning-complete handoff. Neither `apply` nor `archive` is guaranteed
 * to be installed, so each half is resolved at generation time (see
 * optional-workflow.ts).
 */
const PLANNING_COMPLETE_HANDOFF = optionalWorkflow(
  'apply',
  'You can now implement this change with `/opsx:apply`.',
  'You can now implement this change - `openspec instructions apply --change "<name>" --json` returns the tasks and how to work them.'
) + ' ' + optionalWorkflow(
  'archive',
  'Once implementation and any tracked work are complete, archive it with `/opsx:archive`.',
  'Once implementation and any tracked work are complete, archive it with `openspec archive "<name>"`.'
);
```

> 规划完成时的交接。`apply` 与 `archive` 都不保证被安装，所以两半各自在生成期解析（见
> `optional-workflow.ts`）。

**(2) 第 27–30 行：`getContinueChangeSkillTemplate` 没有自己的 JSDoc**

```ts
export function getContinueChangeSkillTemplate(): SkillTemplate {
  return {
    name: 'openspec-continue-change',
    description: 'Continue working on an OpenSpec change by creating the next artifact. Use when the user wants to progress their change, create the next artifact, or continue their workflow. Also use when the user says "openspec continue" or "opsx continue".',
    instructions: `Continue working on a change by creating the next artifact.
```

> 与 39.2、39.3 一样，这个导出函数本身没有文档注释；它唯一的本体是返回对象里的
> `name` / `description` / `instructions`，以及下面第 (3) 条那段正文。

**(3) 第 135–137 行：`instructions` 正文里那条硬约束（`context` / `rules` 不是文件内容；原文转义形态逐字）**

```ts
- **IMPORTANT**: \`context\` and \`rules\` are constraints for YOU, not content for the file
  - Do NOT copy \`<context>\`, \`<rules>\`, \`<project_context>\` blocks into the artifact
  - These guide what you write, but should never appear in the output
```

> **重要**：`context` 与 `rules` 是给**你**的约束，不是文件的内容
>   - 不要把 `<context>`、`<rules>`、`<project_context>` 块抄进 artifact
>   - 它们指导你写什么，但绝不该出现在输出里
