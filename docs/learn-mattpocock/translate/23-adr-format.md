## 23 adr-format

> 译自 `reference/mattpocock-skills/skills/engineering/domain-modeling/ADR-FORMAT.md`（原文 47 行）。无 frontmatter。

### 23.1 ADR 格式（ADR Format）

ADR 存放在 `docs/adr/`，使用顺序编号：`0001-slug.md`、`0002-slug.md`，等等。

惰性创建 `docs/adr/` 目录：只在需要第一篇 ADR 时。

#### 23.1.1 模板（Template）

```md
# {Short title of the decision}

{1-3 sentences: what's the context, what did we decide, and why.}
```

就这样。一篇 ADR 可以只有一段。价值在于记录下 *确实* 做了某个决策以及 *为什么*，而不在于把各个小节填满。

#### 23.1.2 可选小节（Optional sections）

只在它们带来真正价值时才包含。大多数 ADR 不需要它们。

- **Status** frontmatter（`proposed | accepted | deprecated | superseded by ADR-NNNN`）：在决策被重新审视时有用
- **Considered Options**：只在被拒绝的备选方案值得记住时
- **Consequences**：只在需要点出不明显的下游影响时

#### 23.1.3 编号（Numbering）

扫描 `docs/adr/` 找出已有的最大编号，然后加一。

#### 23.1.4 何时提议 ADR（When to offer an ADR）

以下三条必须全部成立：

1. **难以逆转**：以后改变主意代价显著
2. **脱离上下文会令人意外**：未来的读者会看着代码想「他们到底为什么这么做？」
3. **真实权衡的结果**：确实存在其他可选方案，而你出于具体理由选了这一个

如果一个决策容易逆转，跳过它：你直接逆转就好。如果它不令人意外，没人会去想为什么。如果根本没有别的选择，除了「我们做了显而易见的事」之外没什么可记录的。

##### 23.1.4.1 什么够格（What qualifies）

- **架构形态。**「我们用的是 monorepo。」「写模型是事件溯源的，读模型投影进 Postgres。」
- **上下文之间的集成模式。**「Ordering 与 Billing 通过领域事件通信，不用同步 HTTP。」
- **带有锁定效应的技术选型。** 数据库、消息总线、认证服务商、部署目标。不是每个库：只是那些换掉要花一个季度的。
- **边界与范围决策。**「Customer 数据归 Customer 上下文所有；其他上下文只按 ID 引用它。」明确说不的地方和明确说是的地方一样有价值。
- **对显而易见路径的有意偏离。**「因为 X，我们用手工 SQL 而不是 ORM。」任何一位讲道理的读者会假设相反做法的地方。这些能阻止下一位工程师去「修」一个本来是有意为之的东西。
- **代码里看不见的约束。**「由于合规要求，我们不能用 AWS。」「由于合作方 API 合同，响应时间必须低于 200ms。」
- **当拒绝理由不明显时的被拒备选方案。** 如果你考虑过 GraphQL，并出于微妙的理由选了 REST，把它记下来；否则六个月后会有人再次提议 GraphQL。
