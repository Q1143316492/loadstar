# GLOSSARY.md 格式

## 结构

```md
# {上下文名称}

{用一两句话描述这个上下文是什么、为什么存在。}

## 术语

**订单**：
{用一两句话描述这个术语}
_避免_：Purchase、transaction

**发票**：
交付后发给客户的付款请求。
_避免_：Bill、payment request

**客户**：
下单的个人或组织。
_避免_：Client、buyer、account
```

## 规则

- **要有主见。** 同一个概念有多个词时，挑最好的那一个，把其余列在 `_避免_` 下。
- **定义要紧凑。** 最多一两句话。定义它*是*什么，而不是它*做*什么。
- **只收录本项目上下文专属的术语。** 通用编程概念（超时、错误类型、工具模式）不属于这里，即使项目大量使用它们。添加术语前先问：这是本上下文独有的概念，还是通用编程概念？只有前者才该收录。
- **自然聚类出现时，把术语归到子标题下。** 如果所有术语都属于同一个内聚领域，平铺列表就可以。

## 单上下文与多上下文仓库

**单上下文（大多数仓库）：** 仓库根目录一份 `GLOSSARY.md`。

**多上下文：** 根目录的 `GLOSSARY-MAP.md` 列出各个上下文、它们所在的位置，以及彼此如何关联：

```md
# 词汇表地图

## 上下文

- [Ordering](./src/ordering/GLOSSARY.md)：接收并跟踪客户订单
- [Billing](./src/billing/GLOSSARY.md)：生成发票并处理付款
- [Fulfillment](./src/fulfillment/GLOSSARY.md)：管理仓库拣货与发货

## 关联

- **Ordering → Fulfillment**：Ordering 发出 `OrderPlaced` 事件；Fulfillment 消费它们开始拣货
- **Fulfillment → Billing**：Fulfillment 发出 `ShipmentDispatched` 事件；Billing 消费它们生成发票
- **Ordering ↔ Billing**：共享 `CustomerId` 与 `Money` 类型
```

本技能推断适用哪种结构：

- 存在 `GLOSSARY-MAP.md` 时，读它找出各个上下文
- 只有一份根 `GLOSSARY.md` 时，是单上下文
- 两者都不存在时，在第一个术语定下来时惰性创建一份根 `GLOSSARY.md`

存在多个上下文时，推断当前话题与哪一个相关。不清楚就问。
