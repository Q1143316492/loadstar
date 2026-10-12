# skills —— Lodestar 的技能库

> **状态（2026-10-13）**：本文原为 `skills/README.md`，那个目录（上游技能镜像）已删除——它与 `reference/mattpocock-skills/` 构成两份同源副本，分不清谁是权威。删除后 **`reference/mattpocock-skills/` 成为 matt 技能库的唯一权威副本**：它既被 `docs/learn-mattpocock/translate/` 里 30 多处链接锚定，也已在同日**从 `c55ee46` 整体更新到 `49dd158`（2026-10-09）并移出 `.gitignore`、纳入版本管理**。因此本文下面「旧快照、不更新」的说法已作废，只保留它的历史语境。
>
> 保留本文是因为它记着两件不可再生的东西：**第一批减法删掉哪 11 个技能及其判据**，以及 **DSH 的技能发现规则与挂载命令**。下面提到 `skills/` 的地方，读作「如果你重建一份可改的工作副本」。

**可改的工作副本**（当前不存在）：外部拉进来的技能平铺成 `skills/<名字>/SKILL.md`，改这里不影响上游。

`reference/mattpocock-skills/` 现在是**与上游同步的唯一副本**。它此前是冻结在 `c55ee46`（2026-09-18）的旧快照；2026-10-13 更新到 `49dd158`（2026-10-09）时，实测的差异是：

- 上游**淘汰**了 `resolving-merge-conflicts`（译文第 18 篇讲的就是它，已标注废弃）；
- 上游把 `retro` / `pr` / `implement-spec` **提升**进 `skills/engineering/`（原在 `in-progress/`），译文相应增补第 37–39 篇；
- `domain-modeling/CONTEXT-FORMAT.md` **改名**为 `GLOSSARY-FORMAT.md`，正文里的 `CONTEXT.md` 一律改叫 `GLOSSARY.md`（译文已同步改名）；
- 另有约 15 个技能文件内容更新，`ask-matt` 改动最大（新增 `/implement-spec`、`/pr`、`/retro` 三条路径）。

> ⚠️ **DSH 不扫这个目录。** 要能被 agent 调用，得在 `.dsh/skills/` 里建一层目录联接（junction），见文末「怎么让 DSH 调到」。

## 现状

| 项 | 值 |
|---|---|
| 页面 / 仓库 | <https://www.aihero.dev/skills> → <https://github.com/mattpocock/skills> |
| 版本 | `main` @ `49dd158`（2026-10-09 提交，2026-10-12 拉取） |
| 当前内容 | 27 个上游技能 + 自写的 `doc-quality` |
| 校验 | 拉取时逐个 SHA256 与上游一致；第一批减法删掉的 11 个见下 |

## 分类（照上游那 6 组）

`轴`：**M** = model-invocable，会进 DSH 会话技能目录（占上下文）；**U** = 只手打 `/名字`，零目录成本。

| 组 | 技能 | 轴 |
|---|---|---|
| 01 Getting Started | ask-matt | U |
| 02 The Main Flow | grill-with-docs · to-spec · to-tickets · implement · retro | U×5 |
| | code-review | M |
| 03 Shaping | wayfinder | U |
| | prototype · research | M×2 |
| 04 Engineering | improve-codebase-architecture · implement-spec | U×2 |
| | diagnosing-bugs · wizard | M×2 |
| 05 Productivity | grill-me · handoff · to-questionnaire · wait-what | U×4 |
| | writing-for-agents | M |
| 06 Reference | pr · codebase-design · domain-modeling · grilling · tdd | M×5 |
| 未晋级（in-progress） | chief-of-staff · claude-handoff · loop-me | U×3 |

合计 27 = U 16 + M 11。微调精力只花在核心那 12 个上，其余留作参考、不必动。

## 第一批减法：删掉的 11 个

判据沿用 `docs/learn-mattpocock/READING-mattpocock.md` 第 5 节：工具适配层、非核心桶、写作教学线一律不读。

| 删掉 | 为什么 |
|---|---|
| `setup-matt-pocock-skills` | 绑死作者家的 issue tracker 与标签体系 |
| `triage` | 同上，tracker 状态机，脱离 GitHub/GitLab 空转 |
| `teach` | 多会话教学体系，与 agent 流程设计无关 |
| `git-guardrails-claude-code` | Claude Code hooks 专用 |
| `migrate-to-shoehorn` | TS 测试库迁移 |
| `scaffold-exercises` | 作者课程仓库的脚手架 |
| `setup-pre-commit` | Husky 配置 |
| `setup-ts-deep-modules` | TS + dependency-cruiser |
| `writing-beats` / `writing-fragments` / `writing-shape` | 写作教学线 ×3 |

**取回方式**：下面「重新拉取」的命令里，把对应名字从 `$exclude` 删掉再跑，即可单独取回。

## 怎么让 DSH 调到

DSH 的本地技能发现只认这几个根（rank 越小越优先）：

| rank | 来源 | 路径 |
|---|---|---|
| 100 | project-dsh | `<项目根>/.dsh/skills` |
| 200 | project-agents | `<项目根>/.agents/skills` |
| 300 | custom | `customSkillDirs` 配置 |
| 400 | user-dsh | `~/.dsh/skills` |
| 500 | user-agents | `~/.agents/skills` |
| 600 | bundled | 随包（`office-*` 等） |

项目根 = 最近的有 `.git` 的祖先，这里就是 `D:\Workspace\lodestar`。

两条硬规则：

1. **深度只有一层**：`<根>/<名字>/SKILL.md`，或平铺的 `<根>/<名字>.md`。嵌套的 `**/SKILL.md` **刻意不支持** —— 所以本目录里怎么分子目录都行（DSH 根本看不见），只有 `.dsh/skills/` 那一层必须是平的。
2. **frontmatter 必填 `name`（kebab-case）与 `description`**；`disable-model-invocation: true` 的技能不进会话目录，只能手打 `/名字`。

挂一个（用目录联接，源文件仍在 `skills/`，改这边就等于改技能）：

```powershell
New-Item -ItemType Junction -Path 'D:\Workspace\lodestar\.dsh\skills\tdd' -Target 'D:\Workspace\lodestar\skills\tdd'
```

撤掉联接时**必须**用下面这句（`Remove-Item -Recurse` 在老版本会跟着删掉目标内容）：

```powershell
[System.IO.Directory]::Delete('D:\Workspace\lodestar\.dsh\skills\tdd', $false)
```

实测（会话内验证过）：加联接后**下一步**技能目录就出现该技能，删掉后下一步消失，不需要重启。同名技能按 rank 裁决，项目里的（100/300）会静默压过 `~/.dsh/skills` 里的旧版（400）—— 所以微调过的版本一旦挂上就生效。

`doc-quality` 现在是 `skills.md`（不是 `SKILL.md`），要能被调用，得先改名再挂。

## 重新拉取

```powershell
$exclude = @('setup-matt-pocock-skills','triage','teach','git-guardrails-claude-code','migrate-to-shoehorn','scaffold-exercises','setup-pre-commit','setup-ts-deep-modules','writing-beats','writing-fragments','writing-shape')
git clone --depth 1 https://github.com/mattpocock/skills.git D:\Workspace\lodestar\.staging\mattpocock-skills
$src = 'D:\Workspace\lodestar\.staging\mattpocock-skills\skills'
$dst = 'D:\Workspace\lodestar\skills'
Get-ChildItem $src -Recurse -Filter SKILL.md -File | ForEach-Object {
  $name = $_.Directory.Name
  if ($exclude -contains $name) { return }
  $target = Join-Path $dst $name
  if (-not (Test-Path $target)) { Copy-Item $_.Directory.FullName $target -Recurse }
}
Remove-Item 'D:\Workspace\lodestar\.staging' -Recurse -Force
```

已存在的目录不覆盖，所以微调不会被冲掉。

## 这个工作区里的一个坑

沙箱进程跑在「低完整性」级别，只写得进带同样标记的目录。**新建**的目录会自动继承标记，随便改；早先手工建的老目录没有标记，沙箱写不进去 —— 目前 `doc-quality/` 就是这种状态，要改它得先把标记补上（或让会话临时切成完全权限）。
