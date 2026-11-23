# 速查

随时翻，不进读序。

## 命令

```sh
# 仓库根：agent/server/wo-agent
.venv/Scripts/python -m pytest

# 跑属性测试示例
PYTHONIOENCODING=utf-8 .venv/Scripts/python docs/learn-statechart/examples/prop_fold.py

# 原版与改坏版对照
PYTHONIOENCODING=utf-8 .venv/Scripts/python docs/learn-statechart/examples/verify_break.py
```

Windows 控制台默认不是 UTF-8，中文输出会乱码。`PYTHONIOENCODING=utf-8` 解决这个，不改系统设置。

## 三个词

| 词 | 意思 |
|---|---|
| 状态 | 一组变量的取值 |
| 动作 | 把一组取值变成另一组 |
| 不变量 | 每一组取值都必须成立的断言 |

## TLA+ 最小形状

```tla
---- MODULE Name ----
EXTENDS Naturals

VARIABLES x, y

Init == x = 0 /\ y = 0

A == x < 3 /\ x' = x + 1 /\ UNCHANGED y
B == y < 3 /\ y' = y + 1 /\ UNCHANGED x

Next == A \/ B
vars == <<x, y>>
Spec == Init /\ [][Next]_vars

TypeOK == x \in 0..3 /\ y \in 0..3
====
```

- `'` 是「下一步的值」，不是取反。
- `UNCHANGED` 必须写：不写就等于允许这个变量随便变，模型会失真。
- `Next` 要写成各动作的**析取**，否则检查器会把每一步都命名为 `Next`，报告读不懂。
- `[][Next]_vars` 的意思是：每一步要么走 `Next`，要么所有变量不变（静默）。

## 配置文件的四行

```tla
SPECIFICATION Spec
CONSTRAINT StateConstraint
INVARIANT TypeOK
```

- `INVARIANT`：每个状态都要成立（安全性）。
- `PROPERTY`：涉及时间（活性），写法与不变量不同。
- `CONSTRAINT`：砍掉一部分状态，防止状态爆炸。
- `CONSTANT`：模型规模。

## 读报错

检查器报违反时，给你的是**最短路径**，格式大致是：

```text
State 1: <Initial predicate>
/\ x = 0
/\ y = 0

State 2: <A line 8, col 1 ...>
/\ x = 1
/\ y = 0

Error: Invariant TypeOK is violated.
```

读法：

1. 从第一个 State 往下读，每个 State 对应一次动作。
2. 找到 `Error` 那行说的**是哪条不变量**。
3. 往回看**最后一步**——那一步通常就是原因。
4. 把这条路径翻译成代码里的操作序列。

## 常见误报

| 现象 | 多半是什么 |
|---|---|
| 终态被判死锁 | 终态缺一个 no-op 动作，见第 04 篇 |
| 每一步都叫 `Next` | `Next` 没写成动作的析取 |
| 状态数爆炸 | 缺 `CONSTRAINT`，或常量取太大 |
| 不变量从一开始就违反 | `Init` 写错了，或规则本身写错了 |

## 本教程的约定

- 规格文件放 `docs/learn-statechart/specs/`。
- 示例脚本放 `docs/learn-statechart/examples/`。
- 不进 `src/` 的测试目录：在仓库还没有属性测试范式之前，别用教程代码定义它。
