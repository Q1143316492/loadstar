# 搁置状态：学到哪了，差什么

2026-11-24 搁置。回来时先读这一页，再看 [`map.md`](map.md)。

## 一句话结论

**方法是对的，但这个对象太小，撑不起它。**

## 已经亲手做过的

| 环节 | 落在哪 |
|---|---|
| 装 TLA+ 工具链（Java 21 + TLC 2.19 + VS Code 扩展） | 见 [`../../learn-statechart/04-write-the-spec.md`](../../learn-statechart/04-write-the-spec.md) |
| 给 `Inbox.claim` 写状态规格（5 变量 / 4 动作） | [`../../learn-statechart/specs/Inbox.tla`](../../learn-statechart/specs/Inbox.tla) |
| TLC 穷举跑通：63 个不同状态、深度 7、零违反 | 同上 |
| 故意改坏（`ClaimTurn` 漏记 step）→ `NoLoss 违反`、退出码 12、三步反例 | [`InboxBroken.tla`](../../learn-statechart/specs/InboxBroken.tla) |
| 踩过无限状态坑，用 `CONSTRAINT nextId <= 4` 解决 | 同上 |
| 手写随机属性测试（`fold_surface`） | [`../../learn-statechart/examples/prop_fold.py`](../../learn-statechart/examples/prop_fold.py) |
| 穷举版属性测试（pytest 版，0.04 秒） | [`../../learn-statechart/examples/test_fold_surface.py`](../../learn-statechart/examples/test_fold_surface.py) |
| 状态爆炸实测（深度 ×5、变量 ×2/×3） | [`../../learn-statechart/examples/scaling.py`](../../learn-statechart/examples/scaling.py) |

## 价值判断：为什么停

实测数据：

- 真实 `Inbox` 的状态空间：**9 个**（只按队列长度）／**56 个**（含顺序，上限 3）
- 把 `claim` 改坏后，**现有 4 条测试立刻有 2 条变红**（`test_inject_joins_the_next_followup_step`、`test_steer_is_claimed_at_next_step`）
- 穷举器跑遍真实 `Inbox`，**没有找到现有测试漏掉的缺陷**

也就是说：**在这个对象上，这套方法与手写测试等价。** 我之前说「TDD 抓不到」是错的——写那些测试的人已经想到了那个组合。

### TLA+ 的适用条件（三条同时满足）

1. 有两个以上**互相独立**的状态变量
2. bug 只在**交错**下出现（单线程跑一遍不会坏）
3. **人写不完用例**

`Inbox` 三条全不满足：只有两个强相关的队列、单线程纯函数、4 条测试就覆盖。

### 什么时候值得回来

- 遇到**并发 / 重试 / 状态机死角**（上游 `statechart` 的原话）
- 也就是说：**你写不出测试**的那个 bug 出现时

## 差什么（没做的）

按「能纠正什么」排序：

1. **验收 3：把反例回放到真代码。** 这是唯一能检验模型与代码是否一致的步骤，也是整个方法里最容易被跳过的一步。原文：「如果 bug 没复现，先认为模型错了」。
2. **活性 `PROPERTY`（`~>`）。** 唯一 TLA+ 能做、Python 穷举做不了的事。
3. **View 模块 + Mermaid 状态图。** 技能叫 statechart，我们一张图都没出。

其余略过的（`NoDeadlock`、并行区域、PlusCal、`SYMMETRY`、statechart CLI 脚本、两个 formal-verification 技能）**建议继续跳过**——对象太小，做了也是走过场。

## 教程文件的完成度

| 文件 | 状态 |
|---|---|
| `README.md` | ✔ |
| `01-read-the-state-model.md` | ✔（含答案与自测） |
| `02-property-test-by-hand.md` | ✔ |
| `03-watch-it-fail.md` | ✔ |
| `04-write-the-spec.md` | ✔（含环境与实测输出） |
| `05-read-the-counterexample.md` | ✘ **未写**（README 里有坏链接） |
| `06-second-object.md` | ✘ **未写**（README 里有坏链接） |
| `reference.md` | ✔ |
| HTML 版（`00/01/02/03/04-*.html`） | ✔ 探索期的可视化，内容有重叠，可删可留 |

## 回来时先做什么

1. 读这一页，确认「三条适用条件」是否已经满足
2. 如果满足，从 **验收 3** 开始——把模型的反例回放到真代码
3. 如果不满足，**别再进场**，改去补别的防线（见 `cwl-correct`）
