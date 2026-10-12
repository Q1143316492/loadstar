## 7 to-spec

> 译自 `reference/mattpocock-skills/skills/engineering/to-spec/SKILL.md`（原文 75 行）。frontmatter 按原样保留。

**frontmatter**

- `name`: `to-spec`
- `description`: `"Turn the current conversation into a spec and publish it to the project issue tracker: no interview, just synthesis of what you've already discussed."`（把当前对话转成一份 spec，并发布到项目 issue tracker：不做访谈，只综合你已经讨论过的内容。）
- `disable-model-invocation`: `true`

本 skill 拿当前对话上下文和对代码库的理解，产出 spec。**不要**访谈用户，只综合你已知的内容。

issue tracker 与 triage 标签词汇表应该已经提供给你了。如果没有，告诉用户去运行 `/setup-matt-pocock-skills`。

### 7.1 流程（Process）

1. 探索仓库，理解代码库的当前状态，如果你还没做过的话。整份 spec 都要使用项目领域词汇表的术语，并尊重你正在触及的区域中的任何 ADR。

2. 勾勒出你将要测试这个功能的那些接缝（seam）。已有的接缝应优先于新建接缝。使用尽可能高的接缝。如果需要新接缝，就在你能做到的最高点提出它们。整个代码库里的接缝越少越好，理想数量是一个。

与用户确认这些接缝符合他们的预期。

3. 用下面的模板写 spec，然后把它发布到项目 issue tracker。打上 `ready-for-agent` triage 标签，不需要再做额外的 triage。

<spec-template>

#### 7.1.1 问题陈述（Problem Statement）

用户所面临的问题，从用户的视角描述。

#### 7.1.2 解决方案（Solution）

该问题的解决方案，从用户的视角描述。

#### 7.1.3 用户故事（User Stories）

一份**长长的**、带编号的用户故事列表。每个用户故事都应当是这种格式：

1. As an <actor>, I want a <feature>, so that <benefit>

<user-story-example>
1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
</user-story-example>

这份用户故事列表应当极其详尽，覆盖该功能的方方面面。

#### 7.1.4 实现决策（Implementation Decisions）

一份已做出的实现决策的列表。可以包括：

- 将要构建/修改的模块
- 那些模块中将要被修改的接口
- 来自开发者的技术澄清
- 架构决策
- Schema 变更
- API 契约
- 具体的交互

**不要**包含具体文件路径或代码片段。它们可能很快就会过时。

例外：如果某个原型产出了一段代码片段，它比散文更精确地编码了某项决策（状态机、reducer、schema、类型形状），就把它内联到相关决策里，并简要注明它来自原型。裁剪到承载决策的部分，不要工作 demo，只要关键片段。

#### 7.1.5 测试决策（Testing Decisions）

一份已做出的测试决策的列表。包括：

- 对什么算好测试的描述（只测试外部行为，不测实现细节）
- 哪些模块会被测试
- 测试的先例（也就是代码库中类似类型的测试）

#### 7.1.6 超出范围（Out of Scope）

对这份 spec 中超出范围之事的描述。

#### 7.1.7 补充说明（Further Notes）

关于该功能的任何补充说明。

</spec-template>
