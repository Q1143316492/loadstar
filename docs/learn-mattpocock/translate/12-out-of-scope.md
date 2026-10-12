## 12 out-of-scope

> 译自 `reference/mattpocock-skills/skills/engineering/triage/OUT-OF-SCOPE.md`（原文 105 行）。无 frontmatter。

### 12.1 超出范围知识库（Out-of-Scope Knowledge Base）

仓库中的 `.out-of-scope/` 目录存放被否决功能请求的持久记录。它有两个用途：

1. **机构记忆**：某个功能为何被否决，这样在 issue 关闭时理由不会丢失
2. **去重**：当一个新 issue 进来并与先前的否决匹配时，这个 skill 可以把先前的决定翻出来，而不是重新争论一遍

### 12.2 目录结构（Directory structure）

```
.out-of-scope/
├── dark-mode.md
├── plugin-system.md
└── graphql-api.md
```

每个**概念**一个文件，而不是每个 issue 一个。请求同一件事的多个 issue 归到一个文件下。

### 12.3 文件格式（File format）

文件应当用松弛、可读的风格写，更像一份简短的设计文档，而不是一条数据库记录。用段落、代码样例和示例，让理由对那些第一次遇到它的人来说清晰有用。

```markdown
# Dark Mode

This project does not support dark mode or user-facing theming.

## Why this is out of scope

The rendering pipeline assumes a single color palette defined in
`ThemeConfig`. Supporting multiple themes would require:

- A theme context provider wrapping the entire component tree
- Per-component theme-aware style resolution
- A persistence layer for user theme preferences

This is a significant architectural change that doesn't align with the
project's focus on content authoring. Theming is a concern for downstream
consumers who embed or redistribute the output.

```ts
// The current ThemeConfig interface is not designed for runtime switching:
interface ThemeConfig {
  colors: ColorPalette; // single palette, resolved at build time
  fonts: FontStack;
}
```

## Prior requests

- #42: "Add dark mode support"
- #87: "Night theme for accessibility"
- #134: "Dark theme option"
```

#### 12.3.1 给文件命名（Naming the file）

为概念取一个简短、描述性的 kebab-case 名称：`dark-mode.md`、`plugin-system.md`、`graphql-api.md`。这个名称应当足够可辨认，让人浏览目录时不用打开文件就明白被否决的是什么。

#### 12.3.2 写理由（Writing the reason）

理由应当有实质内容：不是「我们不想要这个」，而是为什么。好的理由会引用：

- 项目范围或理念（"This project focuses on X; theming is a downstream concern"）
- 技术约束（"Supporting this would require Y, which conflicts with our Z architecture"）
- 战略决策（"We chose to use A instead of B because..."）

理由应当是耐久的。避免引用临时情况（「我们现在太忙了」）；那些不是真正的否决，而是推迟。

### 12.4 何时检查 `.out-of-scope/`（When to check `.out-of-scope/`）

triage 期间（第 1 步：收集上下文），读取 `.out-of-scope/` 中的全部文件。在评估一个新 issue 时：

- 检查该请求是否匹配一个已有的超出范围概念
- 匹配靠概念相似度，而不是关键词："night theme" 匹配 `dark-mode.md`
- 如果有匹配，把它翻给维护者看："This is similar to `.out-of-scope/dark-mode.md`. We rejected this before because [reason]. Do you still feel the same way?"

维护者可以：

- **确认**：新 issue 被加入已有文件的 "Prior requests" 列表，然后关闭
- **重新考虑**：超出范围文件被删除或更新，该 issue 走正常 triage 流程
- **不同意**：这些 issue 相关但不同，走正常 triage

### 12.5 何时写入 `.out-of-scope/`（When to write to `.out-of-scope/`）

只有当某个 **enhancement**（不是 bug）作为 `wontfix` 被*否决*时。这既适用于 enhancement PR，也完全同样适用于 issue：被否决的 PR 记录在这里，这样同一个请求不会再作为新代码回来。

当一个东西因为**已经实现**而以 `wontfix` 关闭时，**不要**写到这里。那是已建成的功能，不是被否决的功能；记录它会让去重检查被假否决污染。相反，关闭评论要指出该功能已经在哪里。

流程：

1. 维护者判定某个功能请求超出范围
2. 检查是否已存在匹配的 `.out-of-scope/` 文件
3. 如果有：把新 issue 追加到 "Prior requests" 列表
4. 如果没有：新建一个文件，含概念名、决定、理由和第一个先前请求
5. 在该 issue 上发一条评论，解释这个决定并提到 `.out-of-scope/` 文件
6. 用 `wontfix` 标签关闭该 issue

### 12.6 更新或移除超出范围文件（Updating or removing out-of-scope files）

如果维护者对先前被否决的概念改变了主意：

- 删除该 `.out-of-scope/` 文件
- 这个 skill 不需要重开旧 issue；它们是历史记录
- 触发这次重新考虑的新 issue 走正常 triage 流程
