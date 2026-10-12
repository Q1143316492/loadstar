## 21 domain-modeling

> 译自 `reference/mattpocock-skills/skills/engineering/domain-modeling/SKILL.md`（原文 74 行）。frontmatter 按原样保留。

**frontmatter**

- `name`: `domain-modeling`
- `description`: `Build and sharpen a project's domain model. Use when discussing codebase terminology, writing or editing a CONTEXT.md, or recording or editing an ADR.`（构建并打磨项目的领域模型。在讨论代码库术语、编写或编辑 CONTEXT.md，或记录、编辑 ADR 时使用。）

### 21.1 领域建模（Domain Modeling）

在设计过程中主动构建并打磨项目的领域模型。这是 *主动的* 纪律：挑战术语、发明边界情况场景，并在术语与决策定型的当下把词汇表和决策写下来。（仅仅为了词汇而 *阅读* `CONTEXT.md` 不是本技能：那是任何技能都能做的一行习惯。本技能适用于你在改变模型的时候，而不只是消费它的时候。）

#### 21.1.1 文件结构（File structure）

大多数仓库只有一个上下文：

```
/
├── CONTEXT.md
├── docs/
│   └── adr/
│       ├── 0001-event-sourced-orders.md
│       └── 0002-postgres-for-write-model.md
└── src/
```

如果根目录存在 `CONTEXT-MAP.md`，这个仓库就有多个上下文。地图指向每一个所在的位置：

```
/
├── CONTEXT-MAP.md
├── docs/
│   └── adr/                          ← system-wide decisions
├── src/
│   ├── ordering/
│   │   ├── CONTEXT.md
│   │   └── docs/adr/                 ← context-specific decisions
│   └── billing/
│       ├── CONTEXT.md
│       └── docs/adr/
```

惰性创建文件：只在你有东西要写的时候。如果不存在 `CONTEXT.md`，就在第一个术语被定下来时创建一个。如果不存在 `docs/adr/`，就在需要第一篇 ADR 时创建它。

#### 21.1.2 会话期间（During the session）

##### 21.1.2.1 对照词汇表提出质疑（Challenge against the glossary）

当用户使用的术语与 `CONTEXT.md` 里已有的语言冲突时，立刻指出来。「你的词汇表把 'cancellation' 定义为 X，但你似乎指的是 Y。到底是哪一个？」

##### 21.1.2.2 打磨模糊的语言（Sharpen fuzzy language）

当用户使用含糊或过载的术语时，提出一个精确的规范术语。「你说的是 'account'：你指的是 Customer 还是 User？这是两个不同的东西。」

##### 21.1.2.3 讨论具体场景（Discuss concrete scenarios）

当领域关系正在被讨论时，用具体的场景对它做压力测试。发明一些探查边界情况的场景，迫使用户对概念之间的边界保持精确。

##### 21.1.2.4 与代码交叉核对（Cross-reference with code）

当用户陈述某件事如何运作时，检查代码是否同意。如果你发现矛盾，把它摆出来：「你的代码取消的是整个 Order，但你刚说部分取消是可能的。哪一个是对的？」

##### 21.1.2.5 就地更新 CONTEXT.md（Update CONTEXT.md inline）

当一个术语被定下来时，就地更新 `CONTEXT.md`。不要把它们攒起来：在它们发生时捕获。使用 [CONTEXT-FORMAT.md](../../../reference/mattpocock-skills/skills/engineering/domain-modeling/CONTEXT-FORMAT.md) 里的格式。

`CONTEXT.md` 应当完全不包含实现细节。不要把 `CONTEXT.md` 当成规格、草稿本或实现决策的存放处。它是词汇表，仅此而已。

##### 21.1.2.6 谨慎地提议 ADR（Offer ADRs sparingly）

只有当以下三条全部成立时，才提议创建一篇 ADR：

1. **难以逆转**：以后改变主意代价显著
2. **脱离上下文会令人意外**：未来的读者会想「他们为什么这么做？」
3. **真实权衡的结果**：确实存在其他可选方案，而你出于具体理由选了这一个

三条中任何一条缺失，就跳过 ADR。使用 [ADR-FORMAT.md](../../../reference/mattpocock-skills/skills/engineering/domain-modeling/ADR-FORMAT.md) 里的格式。
