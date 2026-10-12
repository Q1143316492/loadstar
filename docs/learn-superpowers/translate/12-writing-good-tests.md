## 12 writing-good-tests

> 译自 `reference/superpowers/skills/test-driven-development/writing-good-tests.md`（原文 198 行）。全部代码块（含测试代码与注释）按原样保留。
> 对照 `READING-superpowers.md` 第 13 项。

**这份参考何时加载：** 写测试或改测试、加 mock、或为测试添加清理/辅助方法时。

### 12.1 概览（Overview）

测试存在的意义，是抓住某个具体的破坏。这里的一切由两条原则统辖：

```
1. Every test names the break it catches
2. Every test exercises the real thing
```

严格的 TDD 会自然产出这两者：一个先写、并亲眼看它对真实代码失败的测试，已经证明了自己能失败；只有当真实依赖被证明慢或是外部的时候，它才配得上一个 mock。

### 12.2 原则 1：说出它抓的那个破坏（Principle 1: Name the Break）

在写测试体之前，先回答：**什么样的生产改动应该让这个测试失败——而那个改动是一个 bug，还是一个决定？** 测试靠抓住错误的分支、缺失的副作用、错误的参数、边界情况或坏掉的契约，来赢得自己的位置。

**独立推导期望值。** 用字面量和手工核对过的 fixture；带字面量 `want` 值的表驱动测试是首选形态。由被测代码——或它的辅助函数——算出来的期望值，无论那段代码做什么都会通过：

```typescript
// ❌ Mirror assertion: the same builder computes both sides — always true
const expected = buildSearchQuery({ tag: 'urgent' });
expect(buildSearchQuery({ tag: 'urgent' })).toBe(expected);

// ✅ Hand-derived literal
expect(buildSearchQuery({ tag: 'urgent' })).toBe('tag:"urgent"');
```

**不要变更探测器。** 如果只有有意的决定才能让一个测试失败——某个常量的值、消息的确切措辞、私有结构——那它会在重新设计时开火，却对 bug 睡大觉。要测那个依赖该决定的行为：不是 `expect(MAX_RETRIES).toBe(5)`，而是「一次失败的调用被重试 5 次，而第 6 次尝试永远不会发生」。

**测行为，不测文本。** 断言某个脚本、技能或配置包含某行确切内容，只能证明源文件还是那个源文件。把脚本放到受控输入上运行，断言输出、副作用或退出码。指导 agent 的文档，由消费它的 agent 的行为来检验（superpowers:writing-skills）；写给人看的散文完全不配拥有测试。

**测你的代码，不测框架。** 测你的代码在它的边界上立下的契约——你注册的路由、你发出的查询、你产出的载荷。上游的机制是它们维护者该写的测试（经典案例：断言你的路由器调用了一个已注册的 handler——那是框架的测试，不是你的）。当上游行为真的让你意外时，写一个窄小的表征测试，把那个假设点出来。同一条边界也适用于你自己代码的内部：构造函数、getter、常量和平凡转发，只有在它们做校验、归一化、设默认值、推导、施加约束或引发副作用时，才配得上测试——否则就断言第一个依赖它们、且消费方可见的结果。

#### 12.2.1 门禁函数（Gate Function）

```
BEFORE writing the test body:
  Name the production change that would make this test fail.

  Cannot name one            → redesign around an observable behavior
  "The source text changed"  → run the artifact and assert its effects
  Only intentional decisions → change detector; test the behavior
                               that depends on the decision

  Confirm the expected value is derived without the code under test.
  IF it reuses the code's logic or helpers:
    Replace it with a literal or hand-checked fixture
```

### 12.3 原则 2：练真家伙（Principle 2: Exercise the Real Thing）

**mock 挣不到任何断言。** 对 mock 的断言，在 mock 存在时通过、在它缺席时失败——它对组件什么都没说。断言真实组件的行为；如果你检查的就是那个 mock，那就取消 mock，或者把断言删掉。

```typescript
// ✅ Real behavior
expect(screen.getByRole('navigation')).toBeInTheDocument();

// ❌ Mock existence
expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument();
```

**你的人类搭档的纠正：**「我们是在测一个 mock 的行为吗？」

**在正确的层级上 mock。** 替换真实方法之前，先弄清它的每一个副作用；mock 掉慢的或外部的操作，把测试依赖的东西保持为真实。拿不准时，先让测试跑在真实实现上，观察实际需要发生什么。

```typescript
// ❌ The mock swallows the config write that duplicate detection reads
vi.mock('ToolCatalog', () => ({
  discoverAndCacheTools: vi.fn().mockResolvedValue(undefined)
}));

// ✅ Mock only the slow server startup; the config write stays real
vi.mock('MCPServerManager');
```

**让替身（double）具体。** 当参数、调用次数或顺序是契约的一部分时，就断言它们——一个什么都接受的假货，什么都没验证。给每个分支（成功、错误、格式非法）各自的 fixture 或 spy，这样错误的分支就无法满足这个期望。

**完整镜像真实数据。** 照现实中的样子 mock 完整结构——所有有文档的字段——而不是只 mock 你的测试读到的那几个。当下游代码读到一个被省略的字段时，部分 mock 会静默失败：测试通过了，集成却坏了。

**生产类只携带生产方法。** 只有测试需要的清理逻辑住在测试工具里，绝不做成生产类上的 `destroy()`。问自己：这个方法是不是只被测试调用？这个类是否拥有这个资源的生命周期？答案不对 → 测试工具。

**宁要真实组件，不要复杂的 mock。** 当 mock 的搭建代码长得超过了测试逻辑、当 mock 缺少真实组件拥有的方法、或者当 mock 一变测试就断，就换成用真实组件的集成测试。**你的人类搭档的问题：**「我们这里需要用 mock 吗？」

#### 12.3.1 门禁函数（Gate Function）

```
BEFORE adding a mock or test helper:
  List the real method's side effects; keep the ones the test
  depends on real — mock the slow/external level below them.

  Mock responses mirror the complete real structure.

  A method only tests call lives in test utilities, not production.

  About to assert on the mock itself?
    Unmock it or delete the assertion.
```

### 12.4 测试随实现一起交付（Tests Ship With the Implementation）

TDD 循环——失败的测试、最小的实现、重构——就是「完成」的含义。把行为需要的测试交付出去，且只交付这些：平凡的代码和写给人看的散文一个都不配，而为满足流程写下的测试要付一辈子的维护成本。

### 12.5 变异检查（The Mutation Check）

在收尾之前，在脑子里对生产代码做变异；每一个现实的变异，都应该至少有一个测试失败：

- 常量或参数写错
- 分支处理写错
- 缺少状态变更或副作用
- 返回空值或默认值
- 对零值、空值、nil、未授权或格式非法的输入缺少校验

没有任何测试抓住的变异，标志着这段行为没有受到保护——或者标志着那个测试是同义反复。

### 12.6 速查表（Quick Reference）

| 当你…… | 就…… |
|-------------|-----|
| 写任何测试 | 说出它抓的那个破坏——是一个 bug，不是一个决定 |
| 构造期望值 | 用手推导出来；绝不用被测代码 |
| 测试脚本或文档 | 运行它 / 对它的消费方做压力测试；绝不去 grep 它的文本 |
| 伸手去给依赖写测试 | 测你的边界契约，不测它们有文档的机制 |
| 想对某个被 mock 的元素断言 | 测真实组件，或者取消 mock |
| 正要 mock 一个方法 | 弄清它的副作用；mock 慢的/外部的那一层 |
| 构造 mock 响应 | 完整镜像真实结构 |
| 需要只有测试用的清理逻辑 | 把它放进测试工具 |
| 眼看 mock 搭建膨胀 | 换成用真实组件的集成测试 |
| 写完一个测试文件 | 跑变异检查 |

### 12.7 危险信号（Warning Signs）

- 搭建和断言共用同一个对象，从而保证了相等
- 这个测试只能通过 panic、崩溃或找不到选择器而失败
- 这个测试在每一次有意改动时失败，从不在意外破坏时失败
- 期望值藏在循环、builder 或辅助函数后面
- 这个测试去 grep 源代码文本，或者断言一个被删掉的符号保持被删状态
- 如果只剩框架，这个测试依然有意义
- 这个测试是为覆盖率而存在，不检查任何副作用或结果
- 某条断言检查一个 `*-mock` 的 test ID，或者你一移除 mock 它就失败
- 某个方法只被测试文件调用
- mock 搭建占了测试的一半以上，或者你说不清为什么需要这个 mock
- 「只是为了保险起见」而 mock
