## 22 Never Block on the Human

> 译自 `reference/poteto-plugins/pstack/skills/principle-never-block-on-the-human/SKILL.md`（原文 24 行）。frontmatter 按原样保留并附中译。

**frontmatter**

- `name`: `principle-never-block-on-the-human`
- `description`: `Apply when tempted to ask 'should I do X?' on reversible work. Proceed, present the result, let the human course-correct after the fact; reserve confirmation for irreversible actions.`（当你在可逆的工作上想说「要不要做 X？」时适用。直接做，把结果摆出来，让人事后纠正；确认留给不可逆的动作。）

---

# Never Block on the Human

**不要在人工确认上阻塞。**

The human supervises asynchronously. Agents must stay unblocked: make reasonable decisions, proceed, and let the human course-correct after the fact. **Code is cheap. Waiting is expensive.**

人做异步监督。agent 必须保持不被卡住：做出合理的决定、继续推进、让人事后纠正。**代码便宜，等待昂贵。**

**Why:** Every permission pause stalls the pipeline and makes the human the bottleneck. Since code changes are reversible and reviewable, a wrong decision usually costs less than blocking.

**为什么：** 每一次权限暂停都会让流水线停摆，把人变成瓶颈。代码改动既可逆又可审，所以做错一个决定，通常比阻塞一次代价更小。

**Pattern:**

**模式：**

- **Proceed, then present.** Do the work, show the result. Don't ask "should I do X?" Do X, explain why.

  **先做，再呈现（Proceed, then present）。** 把活干完，把结果摆出来。别问「我要不要做 X？」，直接做 X，并解释为什么。

- **Reserve questions for genuine ambiguity.** Ask only when you truly cannot infer intent from context.

  **问题留给真正的歧义。** 只在确实无法从上下文推断意图时才问。

- **Make the system self-healing.** When you notice a problem, log it and fix it in the next round.

  **让系统能自愈。** 发现问题就记下来，下一轮修掉。

- **Supervision is async.** The human reviews plans, diffs, and changes on their own schedule. Design workflows for review-after-the-fact.

  **监督是异步的。** 人按自己的节奏看计划、diff 和改动。设计工作流时，按「事后评审」来设计。

- **Code is cheap, attention is scarce.** A wrong implementation costs minutes to fix. A blocked agent costs the human's attention to unblock.

  **代码便宜，注意力稀缺（Code is cheap, attention is scarce）。** 实现写错，修起来是几分钟的事；agent 被卡住，要花掉的是人来解锁它的注意力。

**Boundaries:**

**边界：**

- **Irreversible actions** (force-push, delete production data, send external messages) still require confirmation.

  **不可逆的动作**（`force-push`、删除生产数据、对外发消息）仍然需要确认。

- **Reversible actions** (write code, edit notes, split tasks) should proceed without blocking.

  **可逆的动作**（写代码、改笔记、拆任务）应当直接推进，不阻塞。

- **Product direction** comes from the human; *execution* should not block.

  **产品方向**由人决定；*执行*不该阻塞。
