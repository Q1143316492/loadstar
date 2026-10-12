## 24 persuasion-principles

> 译自 `reference/superpowers/skills/writing-skills/persuasion-principles.md`（原文 187 行）。代码块、文件路径、标识符与研究引文信息按原样保留。

### 24.1 概览（Overview）

LLM 和人一样，会对同样的说服原则作出反应。理解这套心理学，能帮你设计出更有效的技能——不是为了操纵，而是为了确保关键做法在压力之下依然被遵守。

**研究基础：** Meincke 等人（2025）以 N=28,000 段 AI 对话测试了 7 条说服原则。说服技巧让依从率翻了一倍以上（33% → 72%，p < .001）。

### 24.2 七条原则（The Seven Principles）

#### 24.2.1 1. 权威（Authority）

**它是什么：** 对专长、资历或官方来源的顺从。

**它在技能里如何起作用：**

- 命令式语言：“YOU MUST”、“Never”、“Always”
- 不容商量的措辞框架：“No exceptions”
- 消除决策疲劳与合理化

**何时使用：**

- 强制纪律的技能（TDD、验证要求）
- 安全攸关的做法
- 已被确立的最佳实践

**示例：**

```markdown
✅ Write code before test? Delete it. Start over. No exceptions.
❌ Consider writing tests first when feasible.
```

#### 24.2.2 2. 承诺（Commitment）

**它是什么：** 与先前的行动、陈述或公开宣告保持一致。

**它在技能里如何起作用：**

- 要求公开宣告：“Announce skill usage”
- 强制做出明确选择：“Choose A, B, or C”
- 使用追踪：用 todo 承载清单

**何时使用：**

- 确保技能真的被遵守
- 多步骤流程
- 问责机制

**示例：**

```markdown
✅ When you find a skill, you MUST announce: "I'm using [Skill Name]"
❌ Consider letting your partner know which skill you're using.
```

#### 24.2.3 3. 稀缺（Scarcity）

**它是什么：** 由时间限制或有限可得性产生的紧迫感。

**它在技能里如何起作用：**

- 有时限的要求：“Before proceeding”
- 顺序依赖：“Immediately after X”
- 防止拖延

**何时使用：**

- 需要立即验证的要求
- 对时间敏感的工作流
- 防止“我待会儿再做”

**示例：**

```markdown
✅ After completing a task, IMMEDIATELY request code review before proceeding.
❌ You can review code when convenient.
```

#### 24.2.4 4. 社会认同（Social Proof）

**它是什么：** 向他人所做之事、或被视为正常之事靠拢。

**它在技能里如何起作用：**

- 普遍性表述：“Every time”、“Always”
- 失败模式：“X without Y = failure”
- 确立规范

**何时使用：**

- 记录普遍适用的做法
- 对常见失败发出警告
- 强化标准

**示例：**

```markdown
✅ Checklists without todo tracking = steps get skipped. Every time.
❌ Some people find a todo list helpful for checklists.
```

#### 24.2.5 5. 共同体（Unity）

**它是什么：** 共享身份、“我们感”、内群体归属。

**它在技能里如何起作用：**

- 协作式语言：“our codebase”、“we're colleagues”
- 共享目标：“we both want quality”

**何时使用：**

- 协作型工作流
- 建立团队文化
- 非层级化的做法

**示例：**

```markdown
✅ We're colleagues working together. I need your honest technical judgment.
❌ You should probably tell me if I'm wrong.
```

#### 24.2.6 6. 互惠（Reciprocity）

**它是什么：** 回报所受恩惠的义务。

**它在技能里如何起作用：**

- 慎用——会让人觉得在操纵
- 技能里很少需要

**何时避免：**

- 几乎总是（其他原则更有效）

#### 24.2.7 7. 好感（Liking）

**它是什么：** 偏向与自己喜欢的人合作。

**它在技能里如何起作用：**

- **不要用它来换取依从**
- 与诚实反馈的文化相冲突
- 制造谄媚

**何时避免：**

- 在执行纪律时永远避免

### 24.3 按技能类型组合原则（Principle Combinations by Skill Type）

| 技能类型 | 使用 | 避免 |
|------------|-----|-------|
| 强制纪律 | 权威 + 承诺 + 社会认同 | 好感、互惠 |
| 指导/技法 | 中等权威 + 共同体 | 重压式权威 |
| 协作 | 共同体 + 承诺 | 权威、好感 |
| 参考 | 只求清晰 | 一切说服手法 |

### 24.4 为什么有效：心理学机制（Why This Works: The Psychology）

**明线规则减少合理化：**

- “YOU MUST”消除决策疲劳
- 绝对化语言消灭“这算不算例外？”这类问题
- 明确的反合理化对策堵住具体的漏洞

**执行意图造就自动行为：**

- 清晰的触发条件 + 必须执行的动作 = 自动执行
- “当 X 时，做 Y”比“一般要做 Y”更有效
- 降低依从所需的认知负荷

**LLM 是准人类（parahuman）的：**

- 训练于包含这些模式的人类文本之上
- 训练数据里，权威语言出现在依从之前
- 承诺序列（陈述 → 行动）被频繁建模
- 社会认同模式（大家都做 X）确立规范

### 24.5 合乎伦理地使用（Ethical Use）

**正当的：**

- 确保关键做法被遵守
- 写出有效的文档
- 防止可预见的失败

**不正当的：**

- 为个人利益而操纵
- 制造虚假的紧迫感
- 基于愧疚的依从

**检验标准：** 如果用户完全理解这项技巧，它是否仍然服务于用户的真实利益？

### 24.6 研究引文（Research Citations）

**Cialdini, R. B. (2021).** *Influence: The Psychology of Persuasion (New and Expanded).* Harper Business.

- 说服的七条原则
- 影响力研究的实证基础

**Meincke, L., Shapiro, D., Duckworth, A. L., Mollick, E., Mollick, L., & Cialdini, R. (2025).** Call Me A Jerk: Persuading AI to Comply with Objectionable Requests. University of Pennsylvania.

- 以 N=28,000 段 LLM 对话测试了 7 条原则
- 使用说服技巧后依从率从 33% 提升到 72%
- 权威、承诺、稀缺最有效
- 验证了 LLM 行为的准人类模型

### 24.7 速查（Quick Reference）

设计技能时，问自己：

1. **它属于哪一类？**（纪律 vs. 指导 vs. 参考）
2. **我想改变的是什么行为？**
3. **哪条（些）原则适用？**（纪律类通常用权威 + 承诺）
4. **我是不是组合得太多了？**（不要七条全用）
5. **这合乎伦理吗？**（是否服务于用户的真实利益？）
