# 持久会话模型：entry tree、lane、fork

> dsh `0a53fb55be` · pi `853a80d26`
> 研究：[session-durability.md](research/session-durability.md) §2.1–§2.7

## dsh 怎么做

日志本身是线性的，但提供 `fork(source, boundary)`：复制边界内的历史到子会话，header 记 `parentSession` 与 `seedLength`。分支是离线能力，不是运行时的多游标。

## pi 怎么做

entry 是不可变节点，每条带 `id` 与 `parentId`，构成一棵树；lane 是指向树中某个叶子的命名游标，各拥有自己的 leaf、模型配置、队列与最多一个 operation。共享历史的同时支持分支、压缩、fork 与并行工作。压缩可以写成 self-contained entry（摘要 + 保留尾部），而不是替换投影。

## wo-agent 现状

单线会话：事件顺序即对话顺序，`derive_messages()` 从整本日志折叠出当前表层，压缩用 `surfaceOp: replace` 遮蔽区间而不是改树结构。没有 entry id / parent 指针、没有 lane、没有 fork，也没有 SQLite 后端与分支索引。

## 可搬性与前置依赖

- **处置：只留卡片，不实现。** 分支、多 lane、并行子 agent 服务的是多线程对话与产品级编排，与 wo-agent「单线会话 + 极窄宿主」的定位直接冲突。
- **如果将来需要 fork**：做成离线工具即可——复制前缀、写新 header，不必引入 lane 或分支索引。
- **代价**：引入 entry tree 要让 `derive_messages` 从「fold 全日志」改成「从 lane leaf 回溯」，`replace` 与被遮蔽节点的关系也要重新定义；这是会话模型的更换，不是增量改动。

学习价值：这是理解「事件日志」与「对话树」两种会话模型差异的最好样本——前者简单、后者能表达分叉。
