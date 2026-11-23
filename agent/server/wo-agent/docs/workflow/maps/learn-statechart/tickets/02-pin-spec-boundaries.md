## 问题

`fold_surface` 与 `Inbox.claim` 的规格边界各划在哪里？

要回答的具体问题：

- `fold_surface`：把哪些事件纳入模型？`SurfaceReplace` 的校验（start/end 必须在当前表层、`source_seq` 必须指更早事件）在模型里是一个 action 还是一个守卫？失败路径（raise）要不要建模？
- `Inbox.claim`：`claim` / `cancel(keep_inbox=True)` / `cancel(keep_inbox=False)` 三种语义在模型里各是什么？两级队列（next-turn 与 steer）要不要分开建模，还是合并成一个队列就够教学？
- 两个对象各自「不建模」的部分要明确写出来（例如流式分片、协程调度、provider 返回），并说明为什么不建模——这是交接时必须说清的东西。

答案产出：两个对象各自的变量、`Init`、动作清单、以及明确的「不建模」列表。

类型：grilling
状态：已解决
阻塞于：无

## 答案

**这五条是按推荐落定的，未经你确认。** 你还不具备判断这些取舍的背景，所以下面是我的决定，理由写在每条后面。第 06 篇你自己给 `Inbox.claim` 划边界时会重新遇到同样的取舍，那时再检验它们。

### 五条边界决定

1. **建「未校验」的模型。** 允许 `replace` 指向表层里不存在的节点，让不变量去抓它。只有这样才能回答「如果删掉那行校验会怎么样」——TLC 给出的坏路径就是这个问题的答案。代价：模型描述的不是「现在的代码」，而是「代码去掉校验之后的形状」，文档里必须明说。
2. **不设 `rejected` 状态。** 代码直接 raise，没有「已损坏但还能继续」的概念。设一个拒绝态会让状态空间翻倍，却不增加可查的性质。
3. **`Inbox` 两级队列都建模。** 合并成一个之后 `claim` 就退化成「取一条」，没有不变量可写。两级队列是它的全部价值。
4. **只建模 `claim` 与 `cancel`。** `pop_last_turn` / `peek_turns` / `clear` 与它们不共享状态约束，加进来只增维度、不加性质；但在「不建模」列表里写明，因为划边界本身就是第 06 篇要教的技能。
5. **`seq` 显式建模。** 「最短坏路径」的全部价值来自 `seq` 与表层顺序可以不一致——这正是 `SurfaceReplace` 的 docstring 特意提醒的事。

### `fold_surface`

**变量**

- `log`：事件序列。每个元素是 `[op |-> "append"]` 或 `[op |-> "replace", start |-> s, end |-> e]`。
- `surface`：当前表层，是 seq 编号的序列；顺序即模型可见顺序，**不一定**等于数值顺序。
- `shadowed`：幽灵变量，最近一次 `replace` 声称要替换掉的 seq 集合。代码里没有这个变量，是为了写出规则才加的——这正是「模型里没有对应变量就加一个」的实例。

**`Init`**：`log = <<>>`，`surface = <<>>`，`shadowed = {}`。

**动作**

- `Append`：往 `log` 末尾追加一条 append 事件，`surface` 末尾追加 `Len(log)`。
- `Replace(s, e)`：追加一条 `start = s, end = e` 的 replace 事件。若 `s`、`e` 都在 `surface` 中且 `s` 的位置不晚于 `e`，把这一段替换成新节点；否则（校验被删掉之后的行为）新节点直接追加，旧节点全部留下。

**不变量**

- `TypeOK`：`surface` 的每个元素都小于 `Len(log)`。
- `SurfaceUnique`：`surface` 中没有重复的 seq。
- `ShadowedGone`：`shadowed` 与 `surface` 不相交——一次 replace 声称替换掉的节点，必须真的不在表层了。

`ShadowedGone` 是核心。删掉 [session.py](../../../../src/session/session.py) 里 `seqs.index()` 的 `try/except` 之后它会失败，那条最短反例就是第 05 篇要回放的路径。

### `Inbox.claim`

**变量**

- `turn`：next-turn 队列（序列）。
- `step`：next-step 队列（序列）。
- `claimed`：已被认领的条目 id 集合。

**`Init`**：三者皆空。

**动作**

- `PushTurn` / `PushStep`：往对应队列尾部追加一个新 id。
- `Claim(target)`：把 `step` 全部移出并加入 `claimed`；若 `target = "next-turn"` 且 `turn` 非空，再从队首取一条。
- `Cancel(keep)`：`keep = FALSE` 时清空两级队列。

**不变量**

- `NoDoubleClaim`：`claimed` 与两个队列的元素不相交。
- `StepDrained`：每次 `claim` 之后 `step` 为空。
- `TurnHeadOnly`：从 `turn` 取走的永远是最早入队的那条。

### 不建模（两个对象共同）

- **流式分片、provider 返回、协程调度**：模型里没有时间与并发，事件按任意顺序到达就是全部要考察的维度。
- **事件内容**：只建模「事件类型 + 位置」，不建模 payload。
- **`Inbox` 的 `pop_last_turn` / `peek_turns` / `clear`**：理由见决定 4。
- **压缩事务与 `source_event_seqs` 的跨事件校验**：留给第三个对象，或第 06 篇之后自己扩展。
