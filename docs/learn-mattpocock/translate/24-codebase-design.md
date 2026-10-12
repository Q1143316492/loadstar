## 24 codebase-design

> 译自 `reference/mattpocock-skills/skills/engineering/codebase-design/SKILL.md`（原文 114 行）。frontmatter 按原样保留。

**frontmatter**

- `name`: `codebase-design`
- `description`: `Shared vocabulary for designing deep modules. Use when the user wants to design or improve a module's interface, find deepening opportunities, decide where a seam goes, make code more testable or AI-navigable, or when another skill needs the deep-module vocabulary.`（用于设计深模块的共享词汇。在用户想要设计或改进某个模块的接口、寻找加深机会、决定接缝放在哪里、让代码更可测试或更易于 AI 导航时使用，或在另一个技能需要深模块词汇时使用。）

### 24.1 代码库设计（Codebase Design）

设计**深模块（`deep module`）**：小接口背后承载大量行为，放在干净的接缝处，并可通过该接口测试。无论代码正在被设计还是重构，都使用这套语言和这些原则。目标是为调用方带来杠杆，为维护者带来局部性，为所有人带来可测试性。

#### 24.1.1 词汇表（Glossary）

精确使用这些术语：不要替换成「component」「service」「API」或「boundary」。语言一致正是全部要点。

**模块（Module）**：任何有接口和实现的东西。有意地与规模无关：一个函数、类、包，或横跨多层的切片。_避免_：unit、component、service。

**接口（`Interface`）**：调用方为正确使用该模块必须知道的一切：类型签名，也包括不变量、顺序约束、错误模式、必需配置和性能特征。_避免_：API、signature（太窄，它们只指类型层面的表面）。

**实现（`Implementation`）**：模块内部的东西，它的代码体。与 **适配器（`Adapter`）** 不同：一个东西可以是一个小适配器配一个大实现（一个 Postgres 仓库），或者一个大适配器配一个小实现（一个内存假件）。当话题是接缝时用「adapter」；否则用「implementation」。

**深度（`Depth`）**：接口处的杠杆。调用方（或测试）每学习一单位接口能驱动的行为量。当一个模块把小接口背后坐着大量行为时，它是**深的**；当接口几乎和实现一样复杂时，它是**浅的**。

**接缝（`Seam`）** _（Michael Feathers）_：一个你可以在不编辑该处的情况下改变行为的地方；一个模块的接口所居的*位置*。接缝放在哪里本身就是一项设计决策，与它背后放什么不同。_避免_：boundary（与 DDD 的限界上下文撞车）。

**适配器（Adapter）**：一个在接缝处满足某接口的具体东西。它描述的是*角色*（它填哪个槽），不是实质（里面是什么）。

**杠杆（`Leverage`）**：调用方从深度中得到的东西。每学习一单位接口，获得更多能力。一份实现会在 N 个调用点与 M 个测试上回报。

**局部性（`Locality`）**：维护者从深度中得到的东西。变更、bug、知识和验证集中在一处，而不是散布到各个调用方。修一次，处处都修好。

#### 24.1.2 深与浅（Deep vs shallow）

**深模块** = 小接口 + 大量实现：

```
┌─────────────────────┐
│   Small Interface   │  ← Few methods, simple params
├─────────────────────┤
│                     │
│  Deep Implementation│  ← Complex logic hidden
│                     │
└─────────────────────┘
```

**浅模块** = 大接口 + 少量实现（避免）：

```
┌─────────────────────────────────┐
│       Large Interface           │  ← Many methods, complex params
├─────────────────────────────────┤
│  Thin Implementation            │  ← Just passes through
└─────────────────────────────────┘
```

设计一个接口时，问：

- 我能减少方法的数量吗？
- 我能简化参数吗？
- 我能把更多复杂性藏在里面吗？

#### 24.1.3 原则（Principles）

- **深度是接口的属性，不是实现的属性。** 一个深模块内部可以由小的、可 mock 的、可替换的部件组成；它们只是不属于接口。一个模块可以有**内部接缝**（对其实现私有，供它自己的测试使用），也可以在其接口处有**外部接缝**。
- **删除测试（`deletion test`）。** 想象删掉这个模块。如果复杂性消失了，它就是个过路件。如果复杂性在 N 个调用方那里重新出现，它就是在挣自己的饭钱。
- **接口就是测试面（`test surface`）。** 调用方和测试穿过同一个接缝。如果你想越过接口去测试，这个模块大概形状不对。
- **一个适配器意味着一个假想的接缝。两个适配器意味着一个真实的接缝。** 除非确实有东西在接缝两侧变化，否则不要引入接缝。

#### 24.1.4 为可测试性而设计（Designing for testability）

好的接口让测试变得自然：

1. **接受依赖，不要创建依赖。**

   ```typescript
   // Testable
   function processOrder(order, paymentGateway) {}

   // Hard to test
   function processOrder(order) {
     const gateway = new StripeGateway();
   }
   ```

2. **返回结果，不要产生副作用。**

   ```typescript
   // Testable
   function calculateDiscount(cart): Discount {}

   // Hard to test
   function applyDiscount(cart): void {
     cart.total -= discount;
   }
   ```

3. **小表面积。** 更少的方法 = 更少的测试。更少的参数 = 更简单的测试搭建。

#### 24.1.5 关系（Relationships）

- 一个**模块**恰好有一个**接口**（它呈现给调用方和测试的表面）。
- **深度**是一个**模块**的属性，相对它的**接口**来度量。
- **接缝**是**模块**的**接口**所居之处。
- **适配器**坐在**接缝**处，满足**接口**。
- **深度**为调用方产生**杠杆**，为维护者产生**局部性**。

#### 24.1.6 被否决的表述（Rejected framings）

- **把深度当作实现行数与接口行数之比**（Ousterhout）：这会奖励给实现灌水。我们改用深度即杠杆。
- **把「Interface」当作 TypeScript 的 `interface` 关键字或一个类的公开方法**：太窄了：这里的接口包含调用方必须知道的每一条事实。
- **「Boundary」**：与 DDD 的限界上下文撞车。说**接缝**或**接口**。

#### 24.1.7 深入（Going deeper）

- **在给定依赖的情况下加深一个簇**，见 [DEEPENING.md](../../../reference/mattpocock-skills/skills/engineering/codebase-design/DEEPENING.md)：依赖分类、接缝纪律，以及替换而非叠层的测试。
- **探索备选接口**，见 [DESIGN-IT-TWICE.md](../../../reference/mattpocock-skills/skills/engineering/codebase-design/DESIGN-IT-TWICE.md)：拉起并行的 sub-agent，用几种截然不同的方式设计接口，然后按深度、局部性和接缝位置比较。
