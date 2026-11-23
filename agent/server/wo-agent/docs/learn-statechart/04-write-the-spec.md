# 04 · 写规格，让它跑起来

**产物**：`specs/Inbox.tla` + `.cfg`，TLC 跑通；再改坏一行，看它报错。
**认领**：**验收 1**——写出状态规格，检查器跑得通。
**预计**：2 小时（环境已装好的情况下 1 小时）。

## 环境（已在本机装好）

| 组件 | 位置 | 状态 |
|---|---|---|
| Java 21 LTS | `C:\Program Files\Eclipse Adoptium\jdk-21.0.13.10002-hotspot` | 已装 |
| TLC 2.19 | `.vendor/tla/tla2tools.jar`（2.27 MB，已 gitignore） | 已下，sha256 已核 |
| VS Code 扩展 | `tlaplus.vscode-ide` v2026.11.191813 | 已装，自带 TLC 2.0 |

装 Java 只用了一条命令：

```sh
winget install --id EclipseAdoptium.Temurin.21.JDK --accept-source-agreements --accept-package-agreements --silent
```

**新开的终端才有 `java`**。当前会话里用绝对路径：

```sh
JAVA="/c/Program Files/Eclipse Adoptium/jdk-21.0.13.10002-hotspot/bin/java"
```

## 人那一步：先挑一条规则

写规格之前，先回答一个问题——**哪条规则值得验？**

规则要满足三条：一句人话能说完；能落到代码里某个具体位置；**真的可能被违反**。

对 `Inbox.claim`，我挑的是：

> 每条被推进来的消息，要么还在队列里，要么被认领过。不会凭空消失。

这条叫**守恒**（no loss）。它会坏吗？会——只要 `claim` 倒空了 `next_step` 却忘了把内容记进"已认领"。

## 一条路径够不够——先估最短破坏

在写规格之前，先问：**违反它最短要几步？**

我的估计是 **3 步**：推一条 turn、推一条 step、claim 一次。因为 `claim("next-turn")` 会同时倒空 step 并取一条 turn——如果它忘了记录 step，两条消息里必然少一条。

三年前这个估计是靠猜的。现在你也猜一下，然后让 TLC 告诉你答案。

## 写规格

文件在 [`specs/Inbox.tla`](specs/Inbox.tla)。核心就五段：

```tla
VARIABLES nextTurn, nextStep, claimed, pushed, nextId
```

- `nextTurn` / `nextStep`：两个队列，就是代码里的 `_next_turn` / `_next_step`。
- `claimed`：被认领过的 id。
- `pushed`：**幽灵变量**——代码里没有这个变量。为了写出「不会丢」这条规则，必须加一个记录「曾经有什么」的变量。这就是原文学说的「模型里没有对应变量就加一个」。
- `nextId`：id 生成器。

四个动作：

| 动作 | 代码里对应 | 做什么 |
|---|---|---|
| `PushTurn` | `push_turn` | 往 turn 队列尾追加一个新 id |
| `PushStep` | `push_step` | 往 step 队列尾追加 |
| `ClaimStep` | `claim("next-step")` | 倒空 step，全部记进 claimed |
| `ClaimTurn` | `claim("next-turn")` | 倒空 step + 从 turn 队首取一条 |

和代码有一处**有意不同**：代码的 `claim("next-turn")` 在 turn 为空时仍然会倒空 step。模型里把它拆成两个动作，`ClaimTurn` 要求 turn 非空——语义等价，但状态更少。

## 最大的坑：无限状态

第一次跑的时候我忘了 `nextId` 会无限增长，TLC 一直跑不停。**这是 TLA+ 最经典的翻车方式。**

两个解法，规格里都用了：

```tla
QueueItemBound ...        -- 用 CONSTANT MaxItems 限住队列长度
NextIdBound == nextId <= 4  -- 用 CONSTRAINT 限住 id 增长
```

`CONSTRAINT` 的意思是「到了这个边界就不要再往外探索了」。TLC 仍会检查边界上的那个状态，只是不再从它往后走。

## 跑

```sh
cd docs/learn-statechart/specs
"$JAVA" -cp ../../../.vendor/tla/tla2tools.jar tlc2.TLC -config Inbox.cfg -workers 1 Inbox.tla
```

实际输出（本机）：

```text
Model checking completed. No error has been found.
200 states generated, 63 distinct states found, 0 states left on queue.
The depth of the complete state graph search is 7.
Finished in 00s
```

**63 个状态、深度 7、1 秒内跑完。** 「没有错误」这句的意思是：在这个边界内，把所有能走的路都走过了，三条规则一条没破。

## 然后改坏它

[`specs/InboxBroken.tla`](specs/InboxBroken.tla) 只改了一行——`ClaimTurn` 忘了把倒空的 step 记进 `claimed`：

```diff
-    /\ claimed' = claimed \cup QueueSet(nextStep) \cup {Head(nextTurn)}
+    /\ claimed' = claimed \cup {Head(nextTurn)}
```

```sh
"$JAVA" -cp ../../../.vendor/tla/tla2tools.jar tlc2.TLC -config InboxBroken.cfg -workers 1 InboxBroken.tla
```

实际输出：

```text
State 2: <PushTurn>   nextTurn = <<0>>        pushed = {0}
State 3: <PushStep>   nextStep = <<1>>        pushed = {0, 1}
State 4: <ClaimTurn>  nextStep = <<>>         claimed = {0}     ← 1 不见了

Error: Invariant NoLoss is violated.
TLC exit=12
```

**四步，三步动作，一条完整路径。** 这就是最短反例——和人估的一样短。

## 读这条反例

```text
PushTurn(0) → PushStep(1) → ClaimTurn
```

第三步是问题所在：`ClaimTurn` 倒空了 `nextStep`（里面有 id 1），但只把 `nextTurn` 队首的 0 记进 `claimed`。**id 1 从系统里蒸发了。**

翻译成代码就是在 `claim` 里漏掉 `claimed.extend(self._next_step)`——注意真实代码根本没有 `claimed` 这个变量，它直接返回列表。所以这个 bug 在代码里表现为「返回值漏了一条」，而不是「丢了一个集合」。

**这就是模型和代码的差别所在**：模型显式化了代码里隐含的东西（「返回的列表就是被认领的东西」）。这种显式化正是模型能发现问题的原因，也是它可能和代码脱节的原因。

## 做完的标志

- `Inbox.tla` 跑出 `No error has been found`，并且你能读出状态数。
- `InboxBroken.tla` 报 `Invariant NoLoss is violated`，退出码 12。
- 你能说出那条四步路径里每一步对应代码的哪个方法。

第 05 篇：把这条反例翻译成 wo-agent 里的一条真测试。
