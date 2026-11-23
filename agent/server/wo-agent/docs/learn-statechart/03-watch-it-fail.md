# 03 · 亲眼看它失败

**产物**：一次被记下来的失败记录，以及你怎么定位它的说明。
**认领**：**验收 2**——写出规则，故意改坏代码时检查会报错。
**预计**：1 小时。

## 为什么要故意改坏

一个你从没见过失败的检查，和一个不存在的检查，价值相同。这一篇就是把「检查会失败」这件事**证明给你自己看**。

做法：把 `fold_surface` 里按 seq 查找的逻辑，改成按下标切片——也就是 [`events.py`](../../src/session/events.py) 里 `SurfaceReplace` 的 docstring 特意警告的那个错误。

## 第一步：改坏它

打开 [`src/session/session.py`](../../src/session/session.py)，找到这一段：

```python
        seqs = [seq for seq, _ in nodes]
        try:
            start_idx = seqs.index(op.start)
            end_idx = seqs.index(op.end)
        except ValueError as exc:
            raise ValueError(...) from exc
```

改成把它当索引用：

```python
        start_idx = op.start
        end_idx = op.end
```

不要改别的地方。**先备份这一行**，或者记下 `git diff`——第 05 篇末尾要改回来。

## 第二步：跑检查

```sh
PYTHONIOENCODING=utf-8 .venv/Scripts/python docs/learn-statechart/examples/prop_fold.py
```

如果你在 02 篇填好了第三条规则，现在应该看到大量违反。仓库里还有一份对照脚本可以直接跑：

```sh
PYTHONIOENCODING=utf-8 .venv/Scripts/python docs/learn-statechart/examples/verify_break.py
```

它把原版和改坏版并排跑，实测输出是：

```text
== 原版（含校验）
原版: 3000 轮，违反 0 次
== 改坏版（start/end 当索引）
改坏版: 3000 轮，违反 1115 次
```

**记住这两个数**。这就是「检查能失败」的证据：同一组规则，同一个生成器，唯一变的是实现，一个 0 次、一个 1115 次。

## 第三步：读一条失败

挑一条打印出来的记录，回答四个问题，写进你的笔记：

1. **哪条规则被违反了**——第 1、2 还是第 3 条？
2. **是哪一步造成的**——事件列表里的第几条？它的 `start`/`end` 是什么？
3. **为什么按下标切片会错**——具体到「表层当时长什么样、`start` 这个 seq 实际在第几个位置」。
4. **规则写错的可能性排除掉了吗**——如果你怀疑是规则的问题，把第 3 条改成「区间内的 seq 都消失」再跑一次，看会不会误报。会误报，就说明原来那条才是对的。

第 3 问是这个练习的核心。**「按下标切片」错在哪，恰好就是「为什么 start/end 必须是 seq」的答案。**

## 第四步：改回来

把 `session.py` 改回原样，再跑一次脚本确认回到 `0 次`。

```sh
git diff src/session/session.py    # 应该没有输出
```

## 一个容易被误解的地方

你可能觉得：代码里有校验，坏事件根本进不来，所以这个测试证明了什么？

它证明的是**校验是唯一挡住它的东西**。把校验拿掉，规则立刻被违反——说明这几条规则确实描述了代码要守的性质，而不是同义反复。这正是第 04 篇要用模型检查做的事：把「校验拿掉之后所有可能的坏路径」穷举出来，而不只是随机撞到的那几条。

模型不描述「现在的代码」，它描述「代码去掉校验之后的形状」。这一点第 04 篇会再强调一次，因为它是整套方法里最反直觉的一步。

## 做完的标志

- 你亲眼看到了 `0 次` 和上千次的两个结果。
- 你能用自己的话解释「按下标切片」为什么错。
- `git diff src/session/session.py` 是空的。

第 04 篇：把同一个对象写成 TLA+ 规格，让工具去穷举所有顺序，而不只是随机撞。
