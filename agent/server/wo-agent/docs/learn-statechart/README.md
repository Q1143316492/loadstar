# 学会状态机验证

一套在 wo-agent 上从零走到能用的分步教程。每一步都以「跑出一个结果」结尾，读完一篇就能动手。

## 你要理解的那一件事

> **状态**是一组变量的取值。**一次操作**把一组取值变成另一组。**规则**是对每一组取值都必须成立的断言。

测试走**一条**路。模型检查走**所有**路。这就是全部，其余都是这条的推论。

## 三条验收

学完的标准不是「读完」，是这三条：

1. 写出一个 wo-agent 模块的状态规格，检查工具跑得通；
2. 写出两条业务规则，故意改坏代码时检查会报错——你亲眼见过它失败；
3. 把工具给出的最短失败路径，翻译成 wo-agent 里的一个真实测试，跑得起来。

## 路线

六篇按顺序读，`reference.md` 随时查。

| 文件 | 要你做什么 | 产物 | 认领 |
|---|---|---|---|
| [01-read-the-state-model.md](01-read-the-state-model.md) | 把 `fold_surface` 的行为读成一张人话状态表 | 状态表 + 你不确信的格子 | 为验收 1 做准备 |
| [02-property-test-by-hand.md](02-property-test-by-hand.md) | 手写随机序列驱动它，每步检查规则 | 能跑的脚本，第一次通过 | 为验收 2 做准备 |
| [03-watch-it-fail.md](03-watch-it-fail.md) | 把校验改坏，确认检查变红 | 一次失败记录 + 你怎么定位它 | **验收 2** |
| [04-write-the-spec.md](04-write-the-spec.md) | 用 TLA+ 写出同一个对象，检查器跑通 | `specs/FoldSurface.tla` + `.cfg` | **验收 1** |
| [05-read-the-counterexample.md](05-read-the-counterexample.md) | 加业务规则、跑出违规、读最短路径 | 一条回放到真代码的测试 | **验收 3** |
| [06-second-object.md](06-second-object.md) | 对 `Inbox.claim` 自己走一遍 01–05 | `specs/Inbox.tla` 与测试 | 三条验收在新对象上复现 |
| [reference.md](reference.md) | 语法速查、报错怎么读、常用命令 | — | — |

## 环境

需要在 wo-agent 仓库根运行。只用到仓库已有的依赖：

```sh
cd agent/server/wo-agent
.venv/Scripts/python -m pytest        # 先确认现有 255 个测试是绿的
```

跑示例脚本：

```sh
PYTHONIOENCODING=utf-8 .venv/Scripts/python docs/learn-statechart/examples/prop_fold.py
```

`PYTHONIOENCODING=utf-8` 是为了让中文输出在 Windows 控制台不乱码。

第 04 篇开始要装 TLA+ 工具链，具体路径与耗时见 [`04-write-the-spec.md`](04-write-the-spec.md) 开头的环境准备；那份结论来自 [`research/tla-toolchain-windows.md`](../workflow/maps/learn-statechart/research/tla-toolchain-windows.md)。

## 练习对象

- [`src/session/session.py`](../../src/session/session.py) 的 `fold_surface` —— 纯函数，按日志顺序折叠出模型可见的表层。
- [`src/agent/inbox.py`](../../src/agent/inbox.py) 的 `Inbox` —— 两级队列与认领。

两者都**不碰网络、不碰协程**，可以在测试里直接构造。

## 为什么是这两个

它们各自带一类不同的校验：`fold_surface` 校验**位置**（`start`/`end` 是不是表层节点、`source` 是不是更早的事件），`Inbox` 校验**顺序**（哪条被先取走）。同一个方法论套在两种形状上，才能看出哪些是方法、哪些是巧合。

## 不在这份教程里

- 给仓库引入属性测试框架（`hypothesis`）。示例用手写随机序列，见 [`examples/prop_fold.py`](examples/prop_fold.py)。
- 把整个 agent 循环形式化。协程与流式返回让状态空间不可穷举，收益远低于成本。
- 压缩事务。留给第三个对象，或你自己扩展。
