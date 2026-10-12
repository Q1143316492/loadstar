## 22 glossary-format

> 译自 `reference/mattpocock-skills/skills/engineering/domain-modeling/GLOSSARY-FORMAT.md`（原文 60 行）。无 frontmatter。

### 22.1 GLOSSARY.md 格式（GLOSSARY.md Format）

#### 22.1.1 结构（Structure）

```md
# {Context Name}

{One or two sentence description of what this context is and why it exists.}

## Language

**Order**:
{A one or two sentence description of the term}
_Avoid_: Purchase, transaction

**Invoice**:
A request for payment sent to a customer after delivery.
_Avoid_: Bill, payment request

**Customer**:
A person or organization that places orders.
_Avoid_: Client, buyer, account
```

#### 22.1.2 规则（Rules）

- **要有主见。** 当同一个概念存在多个词时，挑最好的那个，把其他的列在 `_Avoid_` 下。
- **让定义紧凑。** 最多一两句话。定义它是什么，而不是它做什么。
- **只收录本项目上下文专属的术语。** 通用编程概念（超时、错误类型、工具模式）不属于这里，即使项目大量使用它们。添加一个术语之前，先问：这是本上下文独有的概念，还是一个通用编程概念？只有前者才该收录。
- **当自然聚类出现时，把术语归到子标题下。** 如果所有术语都属于单一内聚领域，平铺的列表就可以。

#### 22.1.3 单上下文与多上下文仓库（Single vs multi-context repos）

**单上下文（大多数仓库）：** 仓库根目录一份 `GLOSSARY.md`。

**多上下文：** 仓库根目录的 `GLOSSARY-MAP.md` 列出各个上下文、它们所在的位置，以及它们彼此如何关联：

```md
# Context Map

## Contexts

- [Ordering](./src/ordering/GLOSSARY.md): receives and tracks customer orders
- [Billing](./src/billing/GLOSSARY.md): generates invoices and processes payments
- [Fulfillment](./src/fulfillment/GLOSSARY.md): manages warehouse picking and shipping

## Relationships

- **Ordering → Fulfillment**: Ordering emits `OrderPlaced` events; Fulfillment consumes them to start picking
- **Fulfillment → Billing**: Fulfillment emits `ShipmentDispatched` events; Billing consumes them to generate invoices
- **Ordering ↔ Billing**: Shared types for `CustomerId` and `Money`
```

技能推断适用哪种结构：

- 如果存在 `GLOSSARY-MAP.md`，读它来找到各个上下文
- 如果只存在一份根 `GLOSSARY.md`，就是单上下文
- 如果两者都不存在，就在第一个术语被定下来时惰性创建一份根 `GLOSSARY.md`

当存在多个上下文时，推断当前话题与哪一个相关。如果不清楚，就问。
