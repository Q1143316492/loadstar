## 问题

两个练习对象的不变量清单是什么？

每个对象给 2–3 条，必须满足三条要求：

- 用一句人话能说完，不出现变量名以外的术语；
- 能落到代码里某个具体位置（函数、分支、字段），不是抽象口号；
- 至少有一条是**真的可能被违反**的——如果读代码时你确信它恒成立，那它练不出东西。

`fold_surface` 的候选方向：`seq` 与事件数一致；`source_seq` 永远指向更早的事件；表层 `start`/`end` 配对完整；一次 replace 之后没有任何事件仍指向被替换的表层。

`Inbox.claim` 的候选方向：一个 item 不会被认领两次；`cancel(keep_inbox=True)` 之后 next-turn 队列非空则下一轮必被消费；被取消的 item 不会出现在 `derive_messages()` 里。

答案产出：每条不变量一句话 + 对应的代码位置 + 「它为什么可能被违反」半句。

类型：grilling
状态：已解决
阻塞于：02

## 答案

两条已在规格与测试里落地，一条明确不建模。

### `fold_surface`（`examples/test_fold_surface.py`）

1. **表层里没有重复的 seq。** 位置：`fold_surface` 的 `nodes[start_idx:end_idx+1] = [...]`。可能被违反：把 `start`/`end` 当索引用时，替换区间算错就会留下重复。
2. **表层里的每个 seq 都小于事件总数。** 位置：同处。可能被违反：`surface_op` 引用了尚未写入的事件。
3. **`replace(s, e)` 之后 `s` 和 `e` 都不再留在表层。** 位置：同上。可能被违反：校验被删掉后，替换不生效但仍被记录。

第 3 条最初写成「[s,e] 区间内的 seq 都消失」，**是错的**——`replace` 之后表层顺序可以不等于 seq 顺序，数值落在区间里的节点本来就不在其中。原版因此误报 24 次，改措辞后归零。这条错误本身是教程素材。

### `Inbox.claim`（`specs/Inbox.tla`）

1. **`NoLoss`**：每条推送过的消息，要么还在队列里，要么被认领过。位置：`claim` 的 `claimed = list(self._next_step)` 与 `claimed.append(self._next_turn.pop(0))`。可能被违反：漏记队列里倒空的那批。
2. **`NoDoubleClaim`**：已在 `claimed` 里的 id 不会重新出现在队列中。位置：`push_turn` / `push_step` 不做去重。可能被违反：同一 id 被重复推送。
3. **`TypeOK`**：队列长度不超过上界、`claimed ⊆ pushed`。位置：整个类。这条是模型的边界，不是业务规则。

### 不建模

`cancel(keep_inbox=...)`、`pop_last_turn`（`take_back`）、`peek_turns`、`has_pending` 的时序使用。理由是它们与 claim 不共享状态约束；加了只增维度、不加性质。第 06 篇由使用者自己决定要不要扩。

### 实测

- `Inbox.tla`：63 个不同状态、深度 7、无错误。
- `InboxBroken.tla`（`ClaimTurn` 漏记 step）：`NoLoss` 违反，退出码 12，最短路径 3 步 `PushTurn → PushStep → ClaimTurn`，与人工预估一致。
