# upstream-mirror —— 历史说明 + DSH 环境事实

> 本文原为 `skills/README.md`（2026-10-13 存档）。当时那个「可改的上游镜像」目录已删除——它与 `reference/mattpocock-skills/` 是同源双份。现在 `reference/mattpocock-skills/`（`@ 49dd158`）是**唯一权威副本**：译文里 30 多处链接锚定它，它也已纳入版本管理。
>
> 保留本文只为下面这一节：DSH 的技能发现规则（实测得来，别处没有）。第一批减法删掉的 11 个技能与判据已并入 [`porting-status.md`](porting-status.md)，此处不再重复。

## DSH 的技能发现规则（实测）

本地技能发现只认这几个根（rank 越小越优先）：

| rank | 来源 | 路径 |
|---|---|---|
| 100 | project-dsh | `<项目根>/.dsh/skills` |
| 200 | project-agents | `<项目根>/.agents/skills` |
| 300 | custom | `customSkillDirs` 配置 |
| 400 | user-dsh | `~/.dsh/skills` |
| 500 | user-agents | `~/.agents/skills` |
| 600 | bundled | 随包（`office-*` 等） |

项目根 = 最近的有 `.git` 的祖先。

两条硬规则：

1. **深度只有一层**：`<根>/<名字>/SKILL.md`，或平铺的 `<根>/<名字>.md`。嵌套的 `**/SKILL.md` 刻意不支持。
2. **frontmatter 必填 `name`（kebab-case）与 `description`**；`disable-model-invocation: true` 的技能不进会话目录，只能手打 `/名字`。

操作要点（实测）：

- 挂载用目录联接（junction）：源文件留在 `workflow/`，改源就是改技能。
- 撤联接**必须**用 `[System.IO.Directory]::Delete('<联接路径>', $false)`——`Remove-Item -Recurse` 在 PowerShell 老版本会跟着删掉联接目标里的内容。
- 加或撤联接后**下一步**生效，不需要重启；同名技能按 rank 裁决，项目级静默压过用户级。
