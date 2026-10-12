## 4 grilling

> 译自 `reference/mattpocock-skills/skills/productivity/grilling/SKILL.md`（原文 28 行）。frontmatter 按原样保留并附中译。

**frontmatter**

- `name`: `grilling`
- `description`: `Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.`（就一份计划、一个决策或一个想法不留情面地盘问用户。当用户想对自己的思考做压力测试，或者用了任何 'grill' 触发短语时使用。）

不留情面地访谈用户，直到你们达成共识。把这画成一棵**设计树（design tree）**：每一个决策都分叉出挂在它下面的决策。

以**轮次（rounds）** 来推进这棵树。**前沿（frontier）** 是所有前置条件已经落定的决策：你现在就可以问、无需猜测还没听到的答案的那些问题。在一轮里把整个前沿问完：给每个问题编号，并给出你推荐的答案。然后等用户的回答，再开始下一轮。

一轮的格式如下：

```
❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>

---

❓ **Q2** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>
```

把每个问题都措辞成「回答 yes 就等于接受你推荐的答案」。

用户每回答一轮，树就被重塑一次：落定的决策把前沿向外推，并解锁那些依赖它们的问题。重新计算前沿，问下一轮。如果一个问题的答案依赖本轮里另一个仍未关闭的问题，那它属于_更晚_的一轮，而不是这一轮。

找_事实_是你的活，永远不是用户的。当前沿上的某个问题需要来自环境（文件系统、工具等）的事实时，派一个 sub-agent 去找它；凡是你能自己查到的，都不要去问用户。不要在它上面阻塞：一个正在跑的探索就是一个未落定的前置条件，所以只有它下游的问题才等 sub-agent 汇报；前沿里其余的问题现在就问。_决策_是用户的：把每一个都摆给他们，然后等。

当前沿为空时，这个会话就结束了：设计树的每一个分支都走过了，没有任何东西被默默假设。在用户确认你们已达成共识之前，不要据此行动。
