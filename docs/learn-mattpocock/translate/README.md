# mattpocock-skills 译文

本目录是 `reference/mattpocock-skills/` 的逐篇中译，编号与 [`READING-mattpocock.md`](../READING-mattpocock.md) 的读序一一对应。

## 翻译约定

- 正文一律中译；**代码块、文件路径、标识符、命令、frontmatter 字段名与值、URL、标签字符串、`<...>` 占位符按英文原样保留**。
- 术语首次出现时保留英文原词，形如「接缝（`seam`）」，之后统一用中译。
- 每篇首行是 `## <编号> <名称>`，第二行注明源文件路径与原行数。
- 原文里指向同目录兄弟文档的相对链接，已改写为指向本仓库里的**英文原文**（`../../../reference/mattpocock-skills/...`），这样链接仍然可点；译文本身没有为这些兄弟文档另建编号。
- 只做翻译，不加注解、不写按语、不做评论。**例外**：当一篇的原文已从上游消失、或源文件被改名时，在文首加一条纯事实的状态标注（第 18 篇即此类）。

## 与上游的同步记录

`reference/` 已从 `c55ee46`（2026-09-18）整体更新到 `49dd158`（2026-10-09），译文随之做了以下调整：

| 变化 | 涉及译文 |
|---|---|
| `CONTEXT.md` → `GLOSSARY.md` 全文改名（含 `CONTEXT-MAP` / `CONTEXT-FORMAT`） | 01 · 03 · 10 · 14 · 21 · 22 · 26 · 27 · 28 · 34 |
| 源文件改名 `CONTEXT-FORMAT.md` → `GLOSSARY-FORMAT.md`，译文同步改名 | 22（文件已重命名为 `22-glossary-format.md`） |
| 上游**删除**了 `resolving-merge-conflicts` 技能，`ask-matt` 里的入口也已移除 | 18（已标注废弃）· 01 |
| 主流程新增 `/implement-spec` 分支、`/pr` 段落、`/retro` 收尾步骤 | 01 |
| 其他实质新增（挑重点） | 04 · 08 · 09 · 13 · 14 · 17 · 27 · 33 |
| **新增译文**：`retro` / `pr` / `implement-spec`（上游把三者提升进 `engineering/`） | 37 · 38 · 39 |

## 未收录的部分

`reference/mattpocock-skills/` 里另有一批内容按 [`READING-mattpocock.md`](../READING-mattpocock.md) 第 5 节的判断未纳入，主要是：Claude Code / Codex 的安装与插件适配层（`.claude-plugin/`、各技能的 `agents/openai.yaml`、`scripts/`）、面向人类的文档页（`docs/engineering/`、`docs/productivity/`、`.agents/writing-docs.md`）、配置类技能（`setup-matt-pocock-skills/` 及其 `issue-tracker-*.md`）、非核心桶（`skills/misc/`、`skills/in-progress/`）、以及写作教学线（`skills/productivity/teach/`）。

另外两篇虽是原文引用但未翻译，需要时可自行查阅：

- `skills/engineering/improve-codebase-architecture/HTML-REPORT.md` — 第 28 篇里架构报告的 HTML 脚手架、图模式与样式指南。
- `skills/engineering/wizard/template.sh` — 第 36 篇里那个「每个向导都相同、不许手改」的 bash 库。

上游另有 `skills/in-progress/` 里的 `chief-of-staff`（尚未提升进 `engineering/`），按读序原则未收录。
