# lodestar

自己的 AI 编码工作流技能库：24 个技能，覆盖「想法 → 计划 → 实现 → 评审 → 交付」，以及盘问、调试、调研、教学等旁路。技能正文为中文（`cwl-show-me` 除外），取材上游、不逐字复刻。

装上之后手打 `/cwl-ask`：说不清该用哪个，就把处境说给它听。

## 来自哪里

- **主体**：[mattpocock/skills](https://github.com/mattpocock/skills)（`@ 49dd158`，原样导入基线见提交 `010369f`），之后做了中译与本地化——去掉 tracker 依赖，规划产物写本地 `docs/workflow/specs/`。
- **外来技能**：`cwl-show-me` 来自 [humanlayer/skills](https://github.com/humanlayer/skills)（原文照搬，未译；`cwl-pr` 的 Summary 视觉菜单亦取自该技能）。
- **自写**：`cwl-doc-quality`、`cwl-ask`、`cwl-debug-mode`。
- **参考存档**：[`reference/`](reference/) 存着三套上游库的只读快照（mattpocock / openspec / superpowers，版本 pin 见其 [`README.md`](reference/README.md)），供取材用。

## 安装

技能目录必须**平铺**：`<技能根>/cwl-<名字>/SKILL.md`。不要整个搬 `workflow/`，也不要再套一层分类目录。

**安装前先问用户：装到项目目录，还是用户目录？** 不要替用户选。

- **项目目录**：只对当前项目生效，通常随项目进版本控制。
- **用户目录**：对所有项目生效，不进入任何项目仓库。

各 agent 的技能根：

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

`.agents/skills/` 是跨 runtime 的通用位置，Codex、Gemini CLI、Copilot CLI 等都认；同一层级两者都在时，它优先。不在表里的 agent，先查它自己的技能目录；没有就用这一行。这些路径会随 agent 版本变化，拿不准时优先用通用位置，并核对 agent 当前文档。

复制（以 Claude Code 项目级为例）：

```bash
mkdir -p .claude/skills
cp -r workflow/cwl-* .claude/skills/
```

装好之后，后续的安装与更新交给 [`cwl-sync`](workflow/cwl-sync/SKILL.md)：它从远端拉最新技能，平铺覆盖到项目级或用户级技能目录，先删后换（技能库里移除的技能也会跟着消失），其他技能不动。

PowerShell 用 `Copy-Item -Recurse`。想跟着本仓库更新，用符号链接或目录联接代替复制（Windows 目录联接的注意事项见 [`docs/upstream-mirror.md`](docs/upstream-mirror.md)）。

装完手打 `/cwl-ask` 验证：它应该能根据你的处境指到一个具体技能。

## 技能

技能目录统一带 `cwl-` 前缀（命名空间，避免与其他环境的同名技能冲突）。「怎么调」一列：**手打**只能由你输入名字触发，**模型可触发**也可能由模型自己带上。技能之间的关系（主干 / 匝道 / 保养 / 底层）以及暂缓与不做的项，见 [`docs/workflow-map.md`](docs/workflow-map.md)。

| 技能 | 是什么 | 怎么调 |
|---|---|---|
| `cwl-ask` | 路由器：拿不准用哪个，说处境，它指路（也可能说「什么都不用」） | 手打 |
| `cwl-explore` | 探索模式：陪你想清楚，只读、不写代码，也不交产物 | 模型可触发 |
| `cwl-grill-with-docs` | 盘问澄清想法；边盘边产出词汇表与 ADR | 手打 |
| `cwl-to-plan` | 把对话综合成 spec + 曳光弹 ticket，写入 `docs/workflow/specs/<slug>/` | 手打 |
| `cwl-implement` | 按 ticket/spec 实现（调 `cwl-tdd`）；收尾调 `cwl-code-review`；不自动提交 | 手打 |
| `cwl-code-review` | 对固定点起的 diff 做两轴评审（标准 / Spec） | 模型可触发 |
| `cwl-pr` | 写 PR 正文：最小视图（Summary）/ 前后证据（Evidence）/ 合并风险（Merge Danger） | 模型可触发 |
| `cwl-retro` | 复盘会话，给环境改进建议 | 手打 |
| `cwl-wayfinder` | 大块迷雾努力：把决策 ticket 画成地图逐张解决，出口并入 `cwl-to-plan` | 手打 |
| `cwl-debug-mode` | 调试模式：提假设 → 用项目日志插桩 → 复现取证 → 定点修复 → 清场 | 手打 |
| `cwl-research` | 后台查一手来源（文档、源码），写一份带引用的 Markdown 笔记 | 模型可触发 |
| `cwl-improve-codebase-architecture` | 扫描「加深机会」→ 生成 HTML 报告 → 选中后进盘问回路 | 手打 |
| `cwl-prototype` | 一次性原型回答设计问题（逻辑 / 状态模型，或 UI 该长什么样） | 模型可触发 |
| `cwl-handoff` | 把会话压成交接文档（写系统临时目录），供下个会话拾起 | 手打 |
| `cwl-teach` | 多会话教学：把当前目录当有状态的教学工作区，一节课一个 HTML | 手打 |
| `cwl-wait-what` | 哪条没看懂喊一声：补上下文、换大白话、重讲一遍 | 手打 |
| `cwl-grilling` | 设计树盘问（被 `cwl-grill-with-docs` 等调用） | 模型可触发 |
| `cwl-domain-modeling` | 建立、打磨领域词汇表（`docs/workflow/GLOSSARY.md`）与 ADR | 模型可触发 |
| `cwl-tdd` | 红 → 绿循环的参照：好测试、接缝、反模式 | 模型可触发 |
| `cwl-codebase-design` | 深模块词汇：模块 / 接口 / 深度 / 接缝 / 适配器 / 杠杆 / 局部性 | 模型可触发 |
| `cwl-writing-for-agents` | 给 agent 写文档（技能、`AGENTS.md`）的参考 | 模型可触发 |
| `cwl-doc-quality` | 审阅文档「列举了却不展开」的毛病 | 模型可触发 |
| `cwl-show-me` | 用图与代码形状草图把当前话题画出来 | 手打 |
| `cwl-sync` | 从远端技能库拉最新版本，平铺覆盖到项目级 / 用户级技能目录（先删后换） | 手打 |

维护者材料（设计笔记、尝试记录、上游译文、移植台账）都在 [`docs/`](docs/)。
