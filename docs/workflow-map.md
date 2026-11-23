# workflow 地图

`workflow/` 技能的索引：谁先谁后、谁被谁调用、哪些还欠着。

状态：**✓ 已实现**（27 个，中译 + 本地化完成，可用）· **⏳ 暂缓**（2 个，条件到了再搬）· **❌ 不做**（3 个，已判定不移植；判据见 [`porting-status.md`](porting-status.md)）。

路线怎么连，见 [`workflow/cwl-ask/SKILL.md`](../workflow/cwl-ask/SKILL.md) 的「路线图」——那张图只此一份，这里按同一分组列每个技能的去向。

## 主干：idea → ship

盘问 → 计划这两步应保持在一个不中断的上下文窗口里；每个 `/cwl-implement` 开新窗口。

| 技能 | 状态 | 做什么 |
|---|---|---|
| `cwl-grill-with-docs` | ✓ | 盘问澄清想法；边盘边把术语写进词汇表、把决策落成 ADR（调 `cwl-grilling` + `cwl-domain-modeling`） |
| `cwl-to-plan` | ✓ | 把对话综合成 spec + 曳光弹 ticket，写入 `docs/workflow/specs/<slug>/`（= 上游 `to-spec` + `to-tickets` 的合并） |
| `cwl-implement` | ✓ | 按 ticket 实现，在约定接缝上调 `cwl-tdd`；收尾调 `cwl-code-review`；不自动提交 |
| `cwl-code-review` | ✓ | 对固定点起的 diff 做两轴评审（标准 / Spec），并行子智能体；发现按固定字段报（严重度、位置、问题、证据、依据、建议），主审四档过滤后另存一份到临时目录。子智能体用的提示模板、品味基线、评审镜头与发现格式都在 `REVIEWER.md` |
| `cwl-pr` | ✓ | 走 PR 时写正文：最小视图（Summary）、前后证据（Evidence）、单行道 / 双行道与爆炸半径（Merge Danger） |
| `cwl-retro` | ✓ | 复盘会话：提的是环境改进（导航、检查、规范），不是代码意见 |
| `cwl-correct` | ✓ | 移植上游 `correct`：把反复犯的错按架构 → 类型 → lint → 测试 → 文档的顺序修掉，每条新检查先在真实历史错误上失败一次；维护「规则 ↔ 执行者」表 |
| `cwl-clean-code` | ✓ | 自写（取材上游 `no-comments` 与《Clean Code》）：实现完成后的整理。三类处理方式——直接删文本、MUST KILL 标出要改形状的、走开报告改行为的。第一条规则是注释（默认没有，五类外部约束放行）；其余按章节查表（重复、死代码、命名、函数形状、错误处理） |
| `implement-spec` | ❌ | 整份 spec 并行实现（每票一个 worktree）——游戏项目禁用 worktree，核心机制不可用，不移植 |

## 匝道：先产生工作，再并入主干

| 技能 | 状态 | 做什么 |
|---|---|---|
| `cwl-wayfinder` | ✓ | 装不进一个会话的迷雾努力：把「决策票据」做成地图逐张解决，出口并入 `cwl-to-plan` |
| `cwl-wayfinder-map-view` | ✓ | 自写：把一张 wayfinder 地图写成判读 JSON，灌进 `TEMPLATE.html` 出一页路线图（分波、现在、依赖连线），落系统临时目录；`render.js` 与票文件对账 |
| `cwl-debug-mode` | ✓ | 自写（替换上游 `diagnosing-bugs`）：先提可证伪的假设，再用项目自己的日志通道插桩取证；复现 → 分析 → 定点修复 → 清场（删探针和临时日志） |
| `cwl-research` | ✓ | 后台智能体查一手来源（官方文档、源码），写一份带引用的 Markdown 笔记 |

## 保养：不是功能开发

| 技能 | 状态 | 做什么 |
|---|---|---|
| `cwl-improve-codebase-architecture` | ✓ | 扫描「加深机会」→ 生成 HTML 报告（写系统临时目录，不进仓）→ 选中后进盘问回路；候选可并入 `cwl-grill-with-docs` |

## 旁路与随用

| 技能 | 状态 | 做什么 |
|---|---|---|
| `cwl-prototype` | ✓ | 一次性原型回答设计问题（逻辑 / 状态模型，或 UI 该长什么样） |
| `cwl-handoff` | ✓ | 把会话压成交接文档（写系统临时目录），供下个会话拾起；也作 `cwl-prototype` 的出入桥 |
| `cwl-teach` | ✓ | 多会话教学：当前目录即教学工作区（`MISSION.md` / `lessons/*.html` / `learning-records/` / `assets/`），一节课一个 HTML；不在工作项目里跑，另开目录（上游 `teach`，2026-10-19 从 ❌ 改判移植） |
| `cwl-code-tour` | ✓ | 自写：按模块逐站读陌生代码库——每站列出接口、说明这几行承诺背后撑着多少行为，标出浅模块并收尾给跳过清单。与 `cwl-improve-codebase-architecture` 互为反面（读哪里 / 改哪里） |
| `grill-me` | ❌ | 没有仓库场合的 `cwl-grilling`（3 行路由） |
| `cwl-wait-what` | ✓ | 「没跟上」：把上一条重讲一遍——先给结论，再用短句补上没说出的前提，术语用回词汇表（上游 `wait-what`，2026-10-16 从 ❌ 改判移植） |
| `to-questionnaire` | ⏳ | 把「我答不了、得问别人」变成一份问卷 |
| `ask-matt` | ❌ | 路由器：按你的处境推荐用哪个技能（与本文地图重复，不搬） |
| `wizard` | ⏳ | 生成 bash 向导，陪人一步步做只有人能做的操作 |

## 底层：被引用，不主动跑

| 技能 | 状态 | 做什么 |
|---|---|---|
| `cwl-grilling` | ✓ | 设计树盘问（`cwl-grill-with-docs`、`cwl-improve-codebase-architecture` 都引它） |
| `cwl-domain-modeling` | ✓ | 领域词汇表（`docs/workflow/GLOSSARY.md`）与 ADR 的建立、打磨 |
| `cwl-codebase-design` | ✓ | 深模块词汇：模块 / 接口 / 深度 / 接缝 / 适配器 / 杠杆 / 局部性（含 DEEPENING、DESIGN-IT-TWICE） |
| `cwl-tdd` | ✓ | 红 → 绿循环的参照：好测试、接缝、反模式（含 tests、mocking） |
| `cwl-writing-for-agents` | ✓ | 给 agent 写文档的参考（`cwl-retro` 引它；含 SKILL-MECHANICS） |

## 自写（不属上游分类）

| 技能 | 状态 | 做什么 |
|---|---|---|
| `cwl-ask` | ✓ | 路由器：按处境指路（形制参考上游 `ask-matt`；会话边界五选项收入简版） |
| `cwl-direct` | ✓ | 范围明确的任务：先读项目约定，然后直接动手，一次做成正式可用的实现；短板收尾点名，范围变大就升级回主流程 |
| `cwl-doc-writing` | ✓ | 写文档的规范：结构让读者扫得到答案，措辞去掉 AI 腔（据 pstack `unslop` 与 OpenSpec `writing.md` 合并） |
| `cwl-show-me` | ✓ | 用图、代码形状草图把当前话题画出来；HTML 视觉件从 `TEMPLATE.html` 起步（上游原文，已译；模板为自加，风格对齐架构巡检报告） |
| `cwl-sync` | ✓ | 从远端技能库拉最新版本，平铺覆盖到项目级 / 用户级技能目录；旧的 `cwl-*` 先删后换，其他技能不动 |
| `cwl-pet` | ✓ | 桌宠预警（`agent/`）的日常操作：查状态、重启、关闭、改阈值与话术、装或卸 Claude Code 钩子、钩子不生效时按序排查 |

---

- 技能发现规则与挂载注意（DSH 实测）：见 [`upstream-mirror.md`](upstream-mirror.md)。
- 上游 38 个技能逐个的去向（已移植 / 不做 / 暂缓）：见 [`porting-status.md`](porting-status.md)。
- ⏳ 的对应文件都在 [`reference/mattpocock-skills/`](../reference/mattpocock-skills/) 里，条件到了可直接取用移植；❌ 的不再规划移植。
