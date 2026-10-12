## 35 to-questionnaire

> 译自 `reference/mattpocock-skills/skills/productivity/to-questionnaire/SKILL.md`（原文 54 行）。frontmatter 按原样保留。

**frontmatter**

- `name`: `to-questionnaire`
- `description`: `Turn a decision you can't fully answer into a questionnaire for someone else to fill in.`（把一个你无法完全回答的决策变成一份让别人填写的问卷。）
- `disable-model-invocation`: `true`

把用户无法独自回答的某件事变成一份**问卷**：一份 Markdown 文档，他们交给某一个人异步填写，或者在一次会议上一起填。接收方掌握着用户缺乏的知识；问卷把它从他们那里引出来。

**拷问的是这次发送，而不是主题。** 只就 _发送_ 采访用户，那是他总能回答的：它发给谁，以及他需要拿回什么。文档里的问题则瞄准接收方所知与用户所需之间的**缺口**。

1. **它发给谁？** 在一次交流里，问出接收方的角色、专长以及与用户的关系。这决定了问卷的语气以及它必须承载多少上下文。当你知道接收方是谁，以及他们知道哪些用户不知道的东西时完成。

2. **你需要拿回什么？** 在一次交流里，问出用户无法独自解决、需要从这个人那里获得的具体决策或事实。当你有一份具体清单，列出用户走开时必须能够做或决定什么时完成。

3. **写问卷。** 按下面的文档结构，起草瞄准第 1–2 步所得缺口的问题。把它写到当前目录的 `to-questionnaire-<slug>.md`（slug 取自主题）并报告路径。当文件存在，且用户在第 2 步点名的每一项都被某个问题覆盖时完成。

### 35.1 文档结构（Document structure）

把文档框定为一份**发现问卷**：用户缺乏上下文，接收方持有它。按最重要优先排列问题，因为异步意味着你可能只有一次机会，而一旦问题超过一把，就按主题归到 `##` 标题下。用下面的模板来写。

<questionnaire-template>

# <Questionnaire title>

**Purpose:** 这份问卷为什么存在，以及压在上面的那个决策。

**From:** <the user>, **To:** <the recipient>, **How your answers will be used:** <where they go>

## Context

一段话，为一位不在用户脑子里的接收方做定位。足够答得好，但不要写成一页。

## How to answer

截止时间与大致工作量。部分回答和「我不知道」都有用：把任何你不确定的东西标出来，而不是跳过它。

## <Theme heading>

每个主题一个 `##` 小节。每节下面放它的问题，最重要的优先。每个问题只含一个想法，绝不复合，答案存根直接放在它下面，只在问题可能被误读或容易招来敷衍回答时，才加一行 _why this matters_。

<question-example>
### What load is the system expected to handle at launch?

_Why this matters: 它决定我们是现在就为突发流量做容量准备，还是往后推。_

>
</question-example>

## Anything else?

一个收尾的兜底问题：还有什么我们没问、但我们应该知道的？

</questionnaire-template>
