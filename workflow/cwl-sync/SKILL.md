---
name: cwl-sync
description: "从远端 Lodestar 技能库拉取最新的 cwl-* 技能，平铺覆盖到项目级或用户级的技能目录（旧的 cwl-* 先删后换，其他技能不动）。"
disable-model-invocation: true
---

# 技能同步

把 Lodestar 仓库 `workflow/` 下的 `cwl-*` 技能，平铺同步到本机的一个技能根目录：删掉那里的旧 `cwl-*`，换成远端最新版。其他技能一律不动。

## 1. 定目标

**先问装到哪**，不要替用户选：

- **项目目录** —— 只对本项目生效，通常随项目进版本控制。
- **用户目录** —— 对所有项目生效。

按当前 agent 选路径；不在下表里或拿不准，用通用的 `.agents/skills/`（跨 runtime，Codex、Gemini CLI、Copilot CLI 等都认）。

| Agent | 项目目录 | 用户目录 |
|---|---|---|
| Claude Code | `.claude/skills/` | `~/.claude/skills/` |
| Cursor | `.cursor/skills/` | `~/.cursor/skills/` |
| Codex | `.agents/skills/` | `~/.agents/skills/` |
| Gemini CLI | `.gemini/skills/` | `~/.gemini/skills/` |
| OpenCode | `.opencode/skills/` | `~/.config/opencode/skills/` |
| GitHub Copilot CLI | `.github/skills/` | `~/.agents/skills/` |
| DSH | `.dsh/skills/` | `~/.dsh/skills/` |
| 其他 / 通用 | `.agents/skills/` | `~/.agents/skills/` |

目标根目录不存在时，问一句再建。

## 2. 取源

默认源 `git@github.com:Q1143316492/loadstar.git`；用户给了别的 URL 就用别的。SSH 拉不动时提示换 HTTPS（`https://github.com/Q1143316492/loadstar.git`）。

当前目录就是 Lodestar 本体时（有 `workflow/cwl-*/SKILL.md` 且 README 提到 Lodestar），直接用本地 `workflow/`，跳过克隆。

否则浅克隆到系统临时目录，只取 `workflow/` 一层：

```bash
SRC="${TMPDIR:-/tmp}/cwl-sync/loadstar"
git clone --depth 1 --filter=blob:none --sparse <URL> "$SRC"
git -C "$SRC" sparse-checkout set workflow
```

已有 `$SRC` 时就地更新，不重复克隆：

```bash
git -C "$SRC" fetch --depth 1 origin main && git -C "$SRC" reset --hard FETCH_HEAD
```

取源失败就停在这里，报出真实错误——不要拿旧缓存冒充最新。

## 3. 列计划并确认

对比源 `workflow/cwl-*/` 与目标根目录，分四类列出：

- **新增**：源里有、目标没有。
- **更新**：同名但内容不同（`diff -rq`）。
- **删除**：目标有、源里没有的 `cwl-*`（技能库里已移除的技能）。
- **一致**：内容相同，不复制。

只比对 `cwl-*` 目录；目标里的其他技能和文件不在范围内。把清单连同源 commit（`git rev-parse --short HEAD`）给用户看，**确认后**才动手删除。

目标里的 `cwl-*` 若含有源里没有的文件，单独标出来：删除会丢掉这些本地改动。

## 4. 执行

先暂存、再替换，避免拷贝中途失败把目标清空：

1. 把源的 `cwl-*` 复制到临时暂存目录。
2. 校验暂存里每个目录都有 `SKILL.md`；缺就停下，目标还没动。
3. 目标里已有的 `cwl-*` 整体移到备份目录（系统临时目录下，带时间戳），打印路径。
4. 把暂存的 `cwl-*` 移进目标根目录。

只动 `cwl-*`。目标根目录里不要留下暂存或备份残迹。

目标里的 `cwl-*` 若是符号链接或目录联接（README 推荐过用联接跟着本仓实时更新），先问用户：这类条目移动的是链接本身，但跟着链接删会删到仓库源文件。

## 5. 核对并报告

- 目标里每个 `cwl-*` 都有 `SKILL.md`。
- 每个 `SKILL.md` frontmatter 的 `name:` 与目录名一致。
- 目标的 `cwl-*` 集合与源完全一致，没有残留的旧技能。
- 报告：目标路径、技能总数、新增 / 更新 / 删除清单、源 commit、备份路径。
- 提醒用户**重启会话**：技能目录在会话启动时扫描，当前会话看不到新版本。
