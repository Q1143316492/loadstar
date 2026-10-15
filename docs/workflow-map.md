# workflow 地图

`workflow/` 技能的索引：谁先谁后、谁被谁调用、哪些还欠着。

状态：**✓ 已实现**（19 个，中译 + 本地化完成，可用）· **⏳ 暂缓**（2 个，条件到了再搬）· **❌ 不做**（5 个，已判定不移植；判据见 [`porting-status.md`](porting-status.md)）。

```
入口：  /cwl-ask（拿不准用哪个？按处境指路）
主干：  /cwl-grill-with-docs → /cwl-to-plan → /cwl-implement → /cwl-code-review → /cwl-retro
                                 ↑               ↑
匝道：  /cwl-wayfinder ──────────┘(并入)        │
        /cwl-diagnosing-bugs ──────────────────→(修好后 /cwl-retro)
保养：  /cwl-improve-codebase-architecture ──→(候选并入 /cwl-grill-with-docs)
旁路：  /cwl-prototype ⇄ /cwl-handoff 桥（出入）
随时：  /cwl-handoff · /cwl-show-me · /cwl-doc-quality
底层：  /cwl-grilling · /cwl-domain-modeling · /cwl-codebase-design · /cwl-tdd（被引用，不主动跑）
```

## 主干：idea → ship

盘问 → 计划这两步应保持在一个不中断的上下文窗口里；每个 `/cwl-implement` 开新窗口。

| 技能 | 状态 | 做什么 |
|---|---|---|
| `cwl-grill-with-docs` | ✓ | 盘问澄清想法；边盘边把术语写进词汇表、把决策落成 ADR（调 `cwl-grilling` + `cwl-domain-modeling`） |
| `cwl-to-plan` | ✓ | 把对话综合成 spec + 曳光弹 ticket，写入 `docs/specs/<slug>/`（= 上游 `to-spec` + `to-tickets` 的合并） |
| `cwl-implement` | ✓ | 按 ticket 实现，在约定接缝上调 `cwl-tdd`；收尾调 `cwl-code-review`；不自动提交 |
| `cwl-code-review` | ✓ | 对固定点起的 diff 做两轴评审（标准 / Spec），并行子智能体，只读只报告 |
| `cwl-retro` | ✓ | 复盘会话：提的是环境改进（导航、检查、规范），不是代码意见 |
| `implement-spec` | ❌ | 整份 spec 并行实现（每票一个 worktree）——游戏项目禁用 worktree，核心机制不可用，不移植 |
| `pr` | ❌ | 写 PR 正文：Summary / Evidence / Merge Danger |

## 匝道：先产生工作，再并入主干

| 技能 | 状态 | 做什么 |
|---|---|---|
| `cwl-wayfinder` | ✓ | 装不进一个会话的迷雾努力：把「决策票据」做成地图逐张解决，出口并入 `cwl-to-plan` |
| `cwl-diagnosing-bugs` | ✓ | 硬 bug：先建紧反馈回路（一个命令就能打红），再修 + 回归测试；修好后同会话 `cwl-retro`；没有可锁定的接缝就转 `cwl-improve-codebase-architecture` |
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
| `grill-me` | ❌ | 没有仓库场合的 `cwl-grilling`（3 行路由） |
| `wait-what` | ❌ | 「没听懂，重讲」：给上下文、简化措辞、带上词汇表语言 |
| `to-questionnaire` | ⏳ | 把「我答不了、得问别人」变成一份问卷 |
| `ask-matt` | ❌ | 路由器：按你的处境推荐用哪个技能（与本文地图重复，不搬） |
| `wizard` | ⏳ | 生成 bash 向导，陪人一步步做只有人能做的操作 |

## 底层：被引用，不主动跑

| 技能 | 状态 | 做什么 |
|---|---|---|
| `cwl-grilling` | ✓ | 设计树盘问（`cwl-grill-with-docs`、`cwl-improve-codebase-architecture` 都引它） |
| `cwl-domain-modeling` | ✓ | 领域词汇表（`GLOSSARY.md`）与 ADR 的建立、打磨 |
| `cwl-codebase-design` | ✓ | 深模块词汇：模块 / 接口 / 深度 / 接缝 / 适配器 / 杠杆 / 局部性（含 DEEPENING、DESIGN-IT-TWICE） |
| `cwl-tdd` | ✓ | 红 → 绿循环的参照：好测试、接缝、反模式（含 tests、mocking） |
| `cwl-writing-for-agents` | ✓ | 给 agent 写文档的参考（`cwl-retro` 引它；含 SKILL-MECHANICS） |

## 自写（不属上游分类）

| 技能 | 状态 | 做什么 |
|---|---|---|
| `cwl-ask` | ✓ | 路由器：按处境指路（形制参考上游 `ask-matt`；会话边界五选项收入简版） |
| `cwl-doc-quality` | ✓ | 审阅文档「列举了却不展开」的毛病（自写，中文） |
| `cwl-show-me` | ✓ | 用图、代码形状草图把当前话题画出来（上游原文照搬，英文） |

---

- 挂载方法、技能发现规则，以及「第一批减法」删掉的 11 个技能与判据：见 [`upstream-mirror.md`](upstream-mirror.md)。
- 上游 38 个技能逐个的去向（已移植 / 不做 / 暂缓）：见 [`porting-status.md`](porting-status.md)。
- ⏳ 的对应文件都在 [`reference/mattpocock-skills/`](../reference/mattpocock-skills/) 里，条件到了可直接取用移植；❌ 的不再规划移植。
