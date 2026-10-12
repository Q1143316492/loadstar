## 14 tdd

> 译自 `reference/mattpocock-skills/skills/engineering/tdd/SKILL.md`（原文 38 行）。frontmatter 按原样保留。

**frontmatter**

- `name`: `tdd`
- `description`: `Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions "red-green-refactor", or wants integration tests.`（测试驱动开发。当用户想以测试先行方式构建功能或修 bug、提到 "red-green-refactor"，或想要集成测试时使用。）

### 14.1 测试驱动开发（Test-Driven Development）

TDD 就是 `red` → `green` 循环。本技能是一份参照，用来让这个循环产出值得留下的测试：什么才算好测试、测试写在哪里、有哪些反模式，以及循环本身的规则。每一节在每个循环里都适用：在循环之前和循环之中查阅它们，而不是循环之后。

在探索代码库时，读 `GLOSSARY.md`（如果存在），让测试名称和接口词汇与项目的领域语言保持一致，并尊重你所触及区域的 ADR。

#### 14.1.1 什么是好测试（What a good test is）

测试通过公开接口验证行为，而不是验证实现细节。代码可以完全改变，测试却不该变。好测试读起来像一份规格说明："user can checkout with valid cart" 精确地告诉你存在什么能力，而且它能挺过重构，因为它不关心内部结构。

例子见 [tests.md](../../../reference/mattpocock-skills/skills/engineering/tdd/tests.md)，mock 的指导原则见 [mocking.md](../../../reference/mattpocock-skills/skills/engineering/tdd/mocking.md)。

#### 14.1.2 接缝：测试写在哪里（Seams: where tests go）

**接缝（seam）** 是你进行测试的公开边界：在那个接口处，你不必伸手进内部就能观察行为。测试住在接缝处，绝不针对内部实现。

**只在预先约定的接缝处测试。** 在写任何测试之前，把要测试的接缝写下来并与用户确认。未确认的接缝上不写任何测试。你不可能测试一切，所以事先约定接缝，正是让测试投入落在关键路径和复杂逻辑上、而不是每个边界情况上的办法。

问："公开接口是什么，我们应该测试哪些接缝？" 给每条提议的接缝配一行说明：它能抓住什么、漏掉什么。

当这个接口本身的形状仍有疑问时（模块有多深、接缝该落在哪里、接口该暴露什么），用 "codebase-design" 调用 Skill 工具以获取词汇。它是模块、接口、深度、接缝、适配器、杠杆和局部性这些术语的共同来源，而且它是一份供查阅的参照，不是一次要跑起来的会话。

#### 14.1.3 反模式（Anti-patterns）

- **实现耦合（implementation-coupled）**：mock 内部协作者、测试私有方法，或通过旁路通道验证（查数据库而不是使用接口）。识别信号：重构时测试就破，但行为并没有改变。
- **同义反复（tautological）**：断言用代码的算法重算期望值（expect(`add(a, b)).toBe(a + b`)、用同样方式手推出来的快照、把一个常量断言为等于它自己），于是它靠构造就通过，永远不可能与代码产生分歧。期望值必须来自独立的事实来源：一个已知正确的字面量、一个算过的例子、spec。
- **水平切片（horizontal slicing）**：先写完所有测试，再写所有实现。批量测试验证的是 _想象出来_ 的行为：你测的是事物的 _形状_ 而不是面向用户的行为，测试对真实变化变得不敏感，而且你在理解实现之前就把测试结构定死了。改为按 **垂直切片（vertical slice）** 工作：一个测试 → 一个实现 → 重复，每个测试都是一颗 **曳光弹（tracer bullet）**，它回应上一个循环教会你的东西。

#### 14.1.4 循环的规则（Rules of the loop）

- **`red` 先于 `green`。** 先写失败的测试，然后只写足够让它通过的代码。不要预判未来的测试，也不要添加投机性的功能。
- **一次一个切片。** 每个循环：一个接缝、一个测试、一个最小实现。
- **重构不属于这个循环。** 它属于评审阶段（见 `code-review` 技能），不属于 `red` → `green` 的实现循环。
