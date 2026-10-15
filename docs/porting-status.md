# mattpocock 技能移植状态

`reference/mattpocock-skills`（`@ 49dd158`）共 **38 个技能**，本表逐个记录去向。技能在 `workflow/` 内部的关系（主干 / 匝道 / 保养 / 底层）见 [`workflow-map.md`](workflow-map.md)；第一批减法 11 个的原始判据见 [`upstream-mirror.md`](upstream-mirror.md)。

图例：✅ 已移植 · ❌ 不做 · ⏸️ 暂缓（条件到了再搬）

## ✅ 已移植（17 个 → 16 个目录）

| 上游技能 | workflow 目录 | 本地化要点 |
|---|---|---|
| `grill-with-docs` | `cwl-grill-with-docs/` | 中译；正文原样（调 `cwl-grilling` + `cwl-domain-modeling`） |
| `to-spec` + `to-tickets` | `cwl-to-plan/` | **合并为一步**（对齐 OpenSpec `propose` 的形状）；产物写本地 `docs/specs/`，剥掉 setup / tracker / 标签 |
| `implement` | `cwl-implement/` | 收尾改为「不提交」（报告改动 + 建议提交信息） |
| `code-review` | `cwl-code-review/` | 只读约束（不提交 / 不暂存 / 不 fetch）；支持未提交改动的 diff；解除 setup 依赖 |
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
| `wayfinder` | `cwl-wayfinder/` | 中译 + 本地化：地图与决策 ticket 改为 `docs/maps/<努力名>/`（`map.md` + `tickets/NN-*.md`），认领 / 阻塞 / 前沿全部换成文件字段（`类型` / `状态` / `阻塞于`） |

> `workflow/` 里另有 3 个非 matt 技能：`cwl-doc-quality`（自写）、`cwl-ask`（自写路由器，形制来自上游 `ask-matt`）、`cwl-show-me`（humanlayer，原文照搬）。

## ❌ 不做（16 个）

### 第一批减法（2026-10-13，11 个；判据详见 `upstream-mirror.md`）

| 技能 | 判据 |
|---|---|
| `setup-matt-pocock-skills` | 绑死作者家的 issue tracker 与标签体系 |
| `triage` | 同上；tracker 状态机。**2026-10-16 复检后维持**：形状是「维护者处理外部输入」，单人开发无此入口；brief 原则已被 `cwl-to-plan` 吸收 |
| `teach` | 多会话教学体系，与 agent 流程设计无关 |
| `git-guardrails-claude-code` | Claude Code hooks 专用 |
| `migrate-to-shoehorn` | TS 测试库迁移 |
| `scaffold-exercises` | 作者课程仓库的脚手架 |
| `setup-pre-commit` | Husky 配置 |
| `setup-ts-deep-modules` | TS + dependency-cruiser |
| `writing-beats` · `writing-fragments` · `writing-shape` | 写作教学线 ×3 |

### 复检新增（2026-10-16）

| 技能 | 判据 |
|---|---|
| `pr` | 使用场景不经 PR：自己的库直推 `main`；公司靠需求文档而非 PR 描述。模型可触发但触发面不存在 |
| `ask-matt` | 上游版不做（流程图引用未移植技能、带 setup 前置）。**2026-10-16 改判衍生**：做了自己的版本 `cwl-ask`——地图不会跟着技能挂载走，仓外需要它；`PHASE-BOUNDARIES.md` 的五选项已收入其简版 |
| `grill-me` | 冗余：`cwl-grilling` 模型可触发即手工可打；仓库场景已有 `cwl-grill-with-docs` |
| `wait-what` | 6 行；「没看懂，用大白话重讲」等价；要固定触发词的话搬它只要 5 分钟 |

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

**合计 38** = 已移植 17 + 不做 16 + 暂缓 2 + 不在范围 3。

> 本文每次技能体检 / 移植后更新。

> **2026-10-16 复检**：对照上游仓库现状（在线检索），技能清单与本表 38 个一致、无新增技能。`resolving-merge-conflicts` 系上游 **1.3.0 主动删除**（理由：无需专用技能，agent 自行处理 merge/rebase 冲突；[译文 18](learn-mattpocock/translate/18-resolving-merge-conflicts.md)，已标废弃），不入表。

> **2026-10-16 前缀统一**：`workflow/` 全部目录已加 `cwl-` 前缀（命名空间，规避与其他环境的同名技能冲突）；本表第二列与全库引用已同步。上游技能名保持不加前缀（第一列即上游原名）。
