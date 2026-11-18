## 问题

这是学习型项目，产物要能迭代个人知识与个人 AI skill 库。决定学习产物以什么形态沉淀、如何回流。

需要回答：

1. 每读完一处架构，产出什么：能力卡片（dsh 怎么做 / pi 怎么做 / wo-agent 现状 / 可搬性）、源码阅读笔记、还是可复用的 skill。
2. 卡片与技能的关系：什么程度的重复值得固化成 skill（例如「读一个 harness 参考实现」的流程），什么只值得留笔记。
3. 落点与命名：`reference/harness-architectures/` 的目录与卡片模板；知识笔记是否放在同一仓库；是否需要索引文件。
4. 更新节奏：卡片在每次移植决策后回填，还是定期重读上游；上游更新时如何知道卡片过期（记录 commit）。
5. 与现有工作流技能（`cwl-research`、`cwl-codebase-design` 等）的衔接：哪些环节直接复用，哪些需要新技能。

产物是「学习产物回流机制」的决策，写回本票答案，供路线 spec 引用。

类型：grilling
状态：已解决
阻塞于：无

## 答案

用户按推荐全部采纳（2026-11-19）。

1. **落点**：卡片放 wo-agent 的 `reference/harness-architectures/`，与代码同仓。lodestar 继续只放跨项目的工作流技能，不搬知识。
2. **形态**：纯 markdown，一能力一文件。能被 agent 直接读、能走 `git diff`。卡片超过二三十张、需要一眼扫过时再补 HTML 索引。
3. **不新建技能**：复用 `cwl-research` 做调查，流程约定写在 `reference/harness-architectures/README.md`。等跑过两三个能力、看清高频步骤，再考虑抽 `cwl-harness-study`。
4. **卡片是结论视图，不是第二份事实源**：固定四段——dsh 怎么做、pi 怎么做、wo-agent 现状、可搬性与前置依赖，每段三到六行，末尾链到研究文档的具体章节。细节只住在 `research/`。
5. **过期判断**：卡片头与 README 记上游 commit（dsh `0a53fb55be`、pi `853a80d26`）。每次移植一个能力后只回填该卡片「wo-agent 现状」一段；上游升级不主动重读，按 pin 判断是否重跑研究。

### 回填纪律

- 移植一个能力后：改那张卡片的「现状」段 + 地图「已定决策」加一行。
- 发现研究结论有误：先改 `research/` 那份文档，再同步卡片；不反向。
- 卡片命名按能力，不按上游包名（例如 `session-durability.md` 而不是 `dsh-session.md`）。
