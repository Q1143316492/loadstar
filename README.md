# lodestar

自己的 AI 编码工作流技能库。技能为中文（`cwl-show-me` 除外）；取材上游、不逐字复刻。

## 来自哪里

- **技能**：主体来自 [mattpocock/skills](https://github.com/mattpocock/skills)（`@ 49dd158`，原样导入基线见提交 `010369f`），之后做了中译与本地化——去掉 tracker 依赖，规划产物写本地 `docs/specs/`。`cwl-show-me` 来自 [humanlayer/skills](https://github.com/humanlayer/skills)（原文照搬，未译；`cwl-pr` 的 Summary 视觉菜单亦取自该技能）；`cwl-doc-quality` 与 `cwl-ask` 自写。
- **参考存档**：[`reference/`](reference/) 存着三套上游库的纯文件快照（mattpocock / openspec / superpowers，只读；版本 pin 见其 [`README.md`](reference/README.md)），供取材用。

## 安装

把 `workflow/` 里的技能目录**平铺**（只一层）放进所用 agent 的技能目录即可。

## 技能

技能目录统一带 `cwl-` 前缀（命名空间，避免与其他环境的同名技能冲突）。技能之间的关系（主干 / 匝道 / 保养 / 底层）以及暂缓与不做的项，见 [`docs/workflow-map.md`](docs/workflow-map.md)。

| 技能 | 是什么 | 怎么调 |
|---|---|---|
| `cwl-ask` | 路由器：拿不准用哪个，说处境，它指路（也可能说「什么都不用」） | 手打 |
| `cwl-grill-with-docs` | 盘问澄清想法；边盘边产出词汇表与 ADR | 手打 |
| `cwl-to-plan` | 把对话综合成 spec + 曳光弹 ticket，写入 `docs/specs/<slug>/` | 手打 |
| `cwl-implement` | 按 ticket/spec 实现（调 `cwl-tdd`）；收尾调 `cwl-code-review`；不自动提交 | 手打 |
| `cwl-code-review` | 对固定点起的 diff 做两轴评审（标准 / Spec），只读只报告 | 模型可触发 |
| `cwl-pr` | 写 PR 正文：最小视图（Summary）/ 前后证据（Evidence）/ 合并风险（Merge Danger） | 模型可触发 |
| `cwl-retro` | 复盘会话，给环境改进建议 | 手打 |
| `cwl-wayfinder` | 大块迷雾努力：把决策 ticket 画成地图逐张解决，出口并入 `cwl-to-plan` | 手打 |
| `cwl-diagnosing-bugs` | 疑难 bug 的诊断回路：先建能打红的反馈回路，再谈原因 | 手打 |
| `cwl-research` | 后台查一手来源（文档、源码），写一份带引用的 Markdown 笔记 | 模型可触发 |
| `cwl-improve-codebase-architecture` | 扫描「加深机会」→ 生成 HTML 报告 → 选中后进盘问回路 | 手打 |
| `cwl-prototype` | 一次性原型回答设计问题（逻辑 / 状态模型，或 UI 该长什么样） | 模型可触发 |
| `cwl-handoff` | 把会话压成交接文档（写系统临时目录），供下个会话拾起 | 手打 |
| `cwl-teach` | 多会话教学：把当前目录当有状态的教学工作区，一节课一个 HTML | 手打 |
| `cwl-wait-what` | 哪条没看懂喊一声：补上下文、换大白话、重讲一遍 | 手打 |
| `cwl-grilling` | 设计树盘问（被 `cwl-grill-with-docs` 等调用） | 模型可触发 |
| `cwl-domain-modeling` | 建立、打磨领域词汇表（`GLOSSARY.md`）与 ADR | 模型可触发 |
| `cwl-tdd` | 红 → 绿循环的参照：好测试、接缝、反模式 | 模型可触发 |
| `cwl-codebase-design` | 深模块词汇：模块 / 接口 / 深度 / 接缝 / 适配器 / 杠杆 / 局部性 | 模型可触发 |
| `cwl-writing-for-agents` | 给 agent 写文档（技能、`AGENTS.md`）的参考 | 模型可触发 |
| `cwl-doc-quality` | 审阅文档「列举了却不展开」的毛病 | 模型可触发 |
| `cwl-show-me` | 用图与代码形状草图把当前话题画出来 | 手打 |

维护者材料（设计笔记、尝试记录、上游译文）都在 [`docs/`](docs/)。

