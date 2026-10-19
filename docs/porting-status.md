# mattpocock 技能移植状态

`reference/mattpocock-skills`（`@ 49dd158`）共 **38 个技能**，本表逐个记录去向。技能在 `workflow/` 内部的关系（主干 / 匝道 / 保养 / 底层）见 [`workflow-map.md`](workflow-map.md)。

图例：✅ 已移植 · ❌ 不做 · ⏸️ 暂缓（条件到了再搬）

## ✅ 已移植（20 个 → 19 个目录）

| 上游技能 | workflow 目录 | 本地化要点 |
|---|---|---|
| `grill-with-docs` | `cwl-grill-with-docs/` | 中译；正文原样（调 `cwl-grilling` + `cwl-domain-modeling`） |
| `to-spec` + `to-tickets` | `cwl-to-plan/` | **合并为一步**（对齐 OpenSpec `propose` 的形状）；产物写本地 `docs/specs/`，剥掉 setup / tracker / 标签 |
| `implement` | `cwl-implement/` | 收尾改为「不提交」（报告改动 + 建议提交信息） |
| `code-review` | `cwl-code-review/` | 不提交 / 不暂存 / 不 fetch；支持未提交改动的 diff；解除 setup 依赖 |
| `pr` | `cwl-pr/` | 中译；模板与 Summary 视觉菜单原样保留（代码块英文） |
| `retro` | `cwl-retro/` | 中译 |
| `grilling` | `cwl-grilling/` | 中译 |
| `domain-modeling` | `cwl-domain-modeling/` | 中译（含 GLOSSARY-FORMAT、ADR-FORMAT） |
| `tdd` | `cwl-tdd/` | 中译（含 tests、mocking）；示例代码保持 TS 原样 |
| `codebase-design` | `cwl-codebase-design/` | 中译（含 DEEPENING、DESIGN-IT-TWICE） |
| `writing-for-agents` | `cwl-writing-for-agents/` | 中译（含 SKILL-MECHANICS） |
| `improve-codebase-architecture` | `cwl-improve-codebase-architecture/` | 中译（含 HTML-REPORT）；徽章 / 依赖标签 / 示例本地化 |
| `diagnosing-bugs` | `cwl-diagnosing-bugs/` | 中译；HITL 脚本保留 bash 原文（代码不译）**并改为 user-invoked**：上游触发面过宽（「任何报错」都自动触发，与「疑难 bug」的定位矛盾；且 Unity 玩法 bug 的回路常是 HITL，硬门常造不出）——疑难时手打召唤 |
| `research` | `cwl-research/` | 中译 |
| `prototype` | `cwl-prototype/` | 中译（含 LOGIC、UI）；分支产物保留 web 形态，首次使用时按技术栈再本地化 |
| `handoff` | `cwl-handoff/` | 中译 |
| `teach` | `cwl-teach/` | 中译（含 MISSION / RESOURCES / LEARNING-RECORD / GLOSSARY 四个格式文件）；补上上游 `SKILL.md` 断掉的 GLOSSARY-FORMAT 链接（上游只发文件不给入口）；加一句本地化提示：另开目录、别在正在工作的项目里跑。**2026-10-19 改判**：原判「不做」的理由是「与 agent 流程设计无关」——判据本身仍成立，但技能库不只服务工程流；它是零依赖的通用教学机制，不碰 tracker / setup，搬进来不改任何既有技能 |
| `wayfinder` | `cwl-wayfinder/` | 中译 + 本地化：地图与决策 ticket 改为 `docs/maps/<努力名>/`（`map.md` + `tickets/NN-*.md`），认领 / 阻塞 / 前沿全部换成文件字段（`类型` / `状态` / `阻塞于`） |
| `wait-what` | `cwl-wait-what/` | 中译；description 面向人一行。**2026-10-16 复检改判**：原判「不做」（意思等价 + 5 分钟可搬），后按「镜头型技能」改判——与 `cwl-show-me` 同族：零设置、全场景、口头禅即修 |

> `workflow/` 里另有 3 个非 matt 技能：`cwl-doc-quality`（自写）、`cwl-ask`（自写路由器，形制来自上游 `ask-matt`）、`cwl-show-me`（humanlayer，原文照搬）。

## ❌ 不做（13 个）

### 第一批减法（2026-10-13，10 个）

判据来源：[`learn-mattpocock/READING-mattpocock.md`](learn-mattpocock/READING-mattpocock.md) 第 5 节——工具适配层、非核心桶、写作教学线一律不读。

| 技能 | 判据 |
|---|---|
| `setup-matt-pocock-skills` | 绑死作者家的 issue tracker 与标签体系 |
| `triage` | 同上；tracker 状态机。**2026-10-16 复检后维持**：形状是「维护者处理外部输入」，单人开发无此入口；brief 原则已被 `cwl-to-plan` 吸收 |
| `git-guardrails-claude-code` | Claude Code hooks 专用 |
| `migrate-to-shoehorn` | TS 测试库迁移 |
| `scaffold-exercises` | 作者课程仓库的脚手架 |
| `setup-pre-commit` | Husky 配置 |
| `setup-ts-deep-modules` | TS + dependency-cruiser |
| `writing-beats` · `writing-fragments` · `writing-shape` | 写作教学线 ×3 |

### 复检新增（2026-10-16）

| 技能 | 判据 |
|---|---|
| `ask-matt` | 上游版不做（流程图引用未移植技能、带 setup 前置）。**2026-10-16 改判衍生**：做了自己的版本 `cwl-ask`——地图不会跟着技能挂载走，仓外需要它；`PHASE-BOUNDARIES.md` 的五选项已收入其简版 |
| `grill-me` | 冗余：`cwl-grilling` 模型可触发即手工可打；仓库场景已有 `cwl-grill-with-docs` |

### 2026-10-16 追加（worktree 禁用改判）

| 技能 | 判据 |
|---|---|
| `implement-spec` | 原列暂缓。核心机制是**每票一个 git worktree 的并行编排**；游戏项目数百 GB，与 Unity 结合后 worktree 成本不可接受（完整副本 ×N、二次导入与编辑器锁、`.meta`/prefab 合并灾难）→ **worktree 一律禁用（含 Agent）**。去掉 worktree 后残值 ≈「Agent 串行按票实现整份 spec」，已由 `cwl-implement` 覆盖（它本就接受「一份 spec 或一组 ticket」） |

## ⏸️ 暂缓（2 个，条件已定）

| 技能 | 条件 |
|---|---|
| `wizard` | 第一次真碰到「只有人能做的配置流程」时先现写；若好用，把 197 行 bash 模板改写成 Python 版沉淀 |
| `to-questionnaire` | 30 行；仅在需要向他人异步收集决策时；第一次发生再搬 |

## 不在范围（3 个）

in-progress 桶、上游未晋级：`chief-of-staff`、`claude-handoff`、`loop-me`。

---

**合计 38** = 已移植 20 + 不做 13 + 暂缓 2 + 不在范围 3。

> 本文每次技能体检 / 移植后更新。

> **2026-10-16 复检**：对照上游仓库现状（在线检索），技能清单与本表 38 个一致、无新增技能。`resolving-merge-conflicts` 系上游 **1.3.0 主动删除**（理由：无需专用技能，agent 自行处理 merge/rebase 冲突；[译文 18](learn-mattpocock/translate/18-resolving-merge-conflicts.md)，已标废弃），不入表。

> **2026-10-16 前缀统一**：`workflow/` 全部目录已加 `cwl-` 前缀（命名空间，规避与其他环境的同名技能冲突）；本表第二列与全库引用已同步。上游技能名保持不加前缀（第一列即上游原名）。

> **2026-10-19 `teach` 改判**：从「❌ 不做（第一批减法）」改为已移植。触发是「要把它迁进自己的技能仓库」这个明确需求。理由见上表：判据「与 agent 流程设计无关」没被推翻，是范围判断变了——技能库收的是自用工具，`teach` 的机制（跨会话工作区、引用优先、HTML 课程、学习记录推算最近发展区）与工程流零耦合，迁入不影响任何既有技能。

> **2026-10-19 `pr` 改判**：从「❌ 不做（复检新增）」改为已移植，目录 `cwl-pr/`。模板与 Summary 视觉菜单按原文搬，不删节。上游自带的 `CREDITS.md`（上游唯一的 per-skill 署名）没有搬：它替代的是「对 `show-me` 的硬依赖」，本仓库已有 `cwl-show-me`，署名并入 README 的出处段。
