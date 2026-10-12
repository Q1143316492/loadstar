## 26 design-it-twice

> 译自 `reference/mattpocock-skills/skills/engineering/codebase-design/DESIGN-IT-TWICE.md`（原文 44 行）。无 frontmatter。

### 26.1 设计两次（Design It Twice）

当用户想为一个已选定的加深候选探索备选接口时，使用这个并行 sub-agent 模式。基于「Design It Twice」（Ousterhout）：你的第一个想法不太可能是最好的。

使用 [SKILL.md](../../../reference/mattpocock-skills/skills/engineering/codebase-design/SKILL.md) 里的词汇：**模块**、**接口**、**接缝**、**适配器**、**杠杆**。

#### 26.1.1 流程（Process）

##### 26.1.1.1 框定问题空间（Frame the problem space）

在拉起 sub-agent 之前，为已选定的候选写一份面向用户的问题空间说明：

- 任何新接口都需要满足的约束
- 它会依赖的依赖，以及它们落入哪一类别（见 [DEEPENING.md](../../../reference/mattpocock-skills/skills/engineering/codebase-design/DEEPENING.md)）
- 一段粗略的示意性代码草图，用来给约束落地；它不是提案，只是让约束变具体的一种方式

把它给用户看，然后立刻进入第 2 步。用户在 sub-agent 并行工作时阅读和思考。

##### 26.1.1.2 拉起 sub-agent（Spawn sub-agents）

并行拉起 3 个以上 sub-agent。每一个都必须为加深后的模块产出一个**截然不同**的接口。

给每个 sub-agent 一份独立的技术简报（文件路径、耦合细节、来自 [DEEPENING.md](../../../reference/mattpocock-skills/skills/engineering/codebase-design/DEEPENING.md) 的依赖类别、接缝背后坐着什么）。简报与第 1 步中面向用户的问题空间说明相互独立。给每个 agent 一条不同的设计约束：

- Agent 1：「最小化接口：最多瞄准 1–3 个入口点。让每个入口点的杠杆最大化。」
- Agent 2：「最大化灵活性：支持许多用例与扩展。」
- Agent 3：「为最常见的调用方优化：让默认情形变得轻而易举。」
- Agent 4（如适用）：「围绕端口与适配器设计跨接缝依赖。」

在简报里同时包含 [SKILL.md](../../../reference/mattpocock-skills/skills/engineering/codebase-design/SKILL.md) 的词汇和 CONTEXT.md 的词汇，让每个 sub-agent 的命名都与架构语言和项目的领域语言保持一致。

每个 sub-agent 输出：

1. 接口（类型、方法、参数，加上不变量、顺序、错误模式）
2. 用法示例，展示调用方如何使用它
3. 实现在接缝背后藏了什么
4. 依赖策略与适配器（见 [DEEPENING.md](../../../reference/mattpocock-skills/skills/engineering/codebase-design/DEEPENING.md)）
5. 权衡：杠杆高在哪里，薄在哪里

##### 26.1.1.3 呈现与比较（Present and compare）

按顺序呈现设计，让用户逐个吸收，然后用散文比较它们。按**深度**（接口处的杠杆）、**局部性**（变更集中在哪里）和**接缝位置**对比。

比较之后，给出你自己的推荐：你认为哪个设计最强，以及为什么。如果不同设计中的元素能很好地组合，提出一个混合方案。要有主见：用户想要的是一个强判断，不是一份菜单。
