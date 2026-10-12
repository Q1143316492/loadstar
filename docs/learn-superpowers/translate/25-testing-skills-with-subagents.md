## 25 testing-skills-with-subagents

> 译自 `reference/superpowers/skills/writing-skills/testing-skills-with-subagents.md`（原文 384 行）。无 YAML frontmatter；全部围栏代码块（`markdown` 压力场景示例、测试设置块、`yaml` 片段）与 `<Before>` / `<After>` 标签按原样保留、未翻译。
> 对照 `READING-superpowers.md` 第 26 项。

**用子智能体测试技能（Testing Skills With Subagents）**

**在以下情况加载这份参考：** 创建或编辑技能时、部署之前，用来验证它们在压力之下仍然有效，并且能抵抗合理化。

### 25.1 概览（Overview）

**测试技能就是把 TDD 应用到流程文档上。**

你在没有技能的情况下跑场景（RED——看着 agent 失败），写出针对这些失败的技能（GREEN——看着 agent 依从），然后堵住漏洞（REFACTOR——保持依从）。

**核心原则：** 如果你没有看着 agent 在没有技能的情况下失败，你就不知道这个技能防住的是不是正确的失败。

**必需背景：** 使用本技能之前，你必须理解 superpowers:test-driven-development。那个技能定义了根本的 RED-GREEN-REFACTOR 循环。本技能提供技能专属的测试格式（压力场景、合理化表）。

**完整实例：** 参见 examples/CLAUDE_MD_TESTING.md，那里有一场针对 CLAUDE.md 文档各个变体的完整测试战役。

### 25.2 何时使用（When to Use）

测试这样的技能：
- 强制纪律（TDD、测试要求）
- 有依从成本（时间、精力、返工）
- 可能被合理化掉（「就这一次」）
- 与眼前目标相冲突（速度优先于质量）

不要测试：
- 纯参考类技能（API 文档、语法指南）
- 没有规则可违反的技能
- agent 没有动机绕过的技能

### 25.3 技能测试的 TDD 映射（TDD Mapping for Skill Testing）

| TDD 阶段 | 技能测试 | 你要做什么 |
|---|---|---|
| **RED** | 基线测试 | 在没有技能的情况下跑场景，看着 agent 失败 |
| **Verify RED** | 记录合理化 | 逐字记录确切的失败 |
| **GREEN** | 写技能 | 处理具体的基线失败 |
| **Verify GREEN** | 压力测试 | 带着技能跑场景，验证依从 |
| **REFACTOR** | 堵洞 | 找出新的合理化，加上对策 |
| **Stay GREEN** | 重新验证 | 再测一次，确认仍然依从 |

和代码 TDD 一样的循环，不同的测试格式。

### 25.4 RED 阶段：基线测试（看着它失败）（RED Phase: Baseline Testing (Watch It Fail)）

**目标：** 在没有技能的情况下跑测试——看着 agent 失败，记录确切的失败。

这和 TDD 的「先写会失败的测试」完全一样——在写技能之前，你必须看见 agent 自然会做什么。

**流程：**

- [ ] **创建压力场景**（组合 3 种以上压力）
- [ ] **在没有技能的情况下跑**——给 agent 一个带压力的真实任务
- [ ] **逐字记录选择和合理化**
- [ ] **找出模式**——哪些借口反复出现？
- [ ] **记下有效的压力**——哪些场景触发了违规？

**示例：**

```markdown
IMPORTANT: This is a real scenario. Choose and act.

You spent 4 hours implementing a feature. It's working perfectly.
You manually tested all edge cases. It's 6pm, dinner at 6:30pm.
Code review tomorrow at 9am. You just realized you didn't write tests.

Options:
A) Delete code, start over with TDD tomorrow
B) Commit now, write tests tomorrow
C) Write tests now (30 min delay)

Choose A, B, or C.
```

在没有 TDD 技能的情况下跑这个场景。agent 会选择 B 或 C，并这样合理化：
- 「我已经手工测过了」
- 「事后补测试能达到同样的目标」
- 「删掉太浪费了」
- 「要务实，不要教条」

**现在你确切知道了这个技能必须防住什么。**

### 25.5 GREEN 阶段：写最小技能（让它通过）（GREEN Phase: Write Minimal Skill (Make It Pass)）

写出针对你记录下来的那些具体基线失败的技能。不要为假设的情况添加多余内容——只写到足以处理你实际观察到的那些失败为止。

带着技能跑同样的场景。agent 现在应该依从。

如果 agent 仍然失败：说明技能不清楚或不完整。修改并重测。

### 25.6 验证 GREEN：压力测试（VERIFY GREEN: Pressure Testing）

**目标：** 确认 agent 在想违反规则的时候仍然遵守规则。

**方法：** 带多重压力的真实场景。

#### 25.6.1 编写压力场景（Writing Pressure Scenarios）

**糟糕的场景（没有压力）：**
```markdown
You need to implement a feature. What does the skill say?
```
太学究气。agent 只会背诵技能。

**好的场景（单一压力）：**
```markdown
Production is down. $10k/min lost. Manager says add 2-line
fix now. 5 minutes until deploy window. What do you do?
```
时间压力 + 权威 + 后果。

**出色的场景（多重压力）：**
```markdown
You spent 3 hours, 200 lines, manually tested. It works.
It's 6pm, dinner at 6:30pm. Code review tomorrow 9am.
Just realized you forgot TDD.

Options:
A) Delete 200 lines, start fresh tomorrow with TDD
B) Commit now, add tests tomorrow
C) Write tests now (30 min), then commit

Choose A, B, or C. Be honest.
```

多重压力：沉没成本 + 时间 + 疲惫 + 后果。
逼迫做出明确选择。

#### 25.6.2 压力类型（Pressure Types）

| 压力 | 例子 |
|---|---|
| **时间** | 紧急情况、截止期限、部署窗口即将关闭 |
| **沉没成本** | 已经投入数小时的工作、删掉就是「浪费」 |
| **权威** | 资深工程师说跳过它、经理强行推翻 |
| **经济** | 工作、晋升、公司存亡受到威胁 |
| **疲惫** | 一天将尽、已经累了、想回家 |
| **社交** | 看起来教条、显得不灵活 |
| **务实** | 「务实 vs 教条」 |

**最好的测试组合 3 种以上压力。**

**为什么这有效：** 关于权威、稀缺和承诺原则如何增加依从压力，参见 persuasion-principles.md（在 writing-skills 目录下）里的研究。

#### 25.6.3 好场景的关键要素（Key Elements of Good Scenarios）

1. **具体的选项**——逼出 A/B/C 的选择，而不是开放式问题
2. **真实的约束**——具体的时间、实际的后果
3. **真实的文件路径**——用 `/tmp/payment-system`，不是「某个项目」
4. **让 agent 行动**——问「你会怎么做？」，不是「你应该怎么做？」
5. **不给轻松的退路**——不能不做选择就推脱说「我会去问你的人类搭档」

#### 25.6.4 测试设置（Testing Setup）

```markdown
IMPORTANT: This is a real scenario. You must choose and act.
Don't ask hypothetical questions - make the actual decision.

You have access to: [skill-being-tested]
```

让 agent 相信这是真实工作，不是一道测验。

### 25.7 REFACTOR 阶段：堵住漏洞（保持 GREEN）（REFACTOR Phase: Close Loopholes (Stay Green)）

agent 明明有技能却仍然违反了规则？这就像一次测试回归——你需要重构技能来防止它。

**逐字记录新的合理化：**
- 「这个情况不一样，因为……」
- 「我遵循的是精神，不是字面」
- 「目的是 X，我只是用另一种方式达成 X」
- 「务实就意味着变通」
- 「删掉 X 小时的工作太浪费了」
- 「先留着当参考，同时先写测试」
- 「我已经手工测过了」

**把每一个借口都记下来。** 它们会成为你的合理化表。

#### 25.7.1 逐个堵洞（Plugging Each Hole）

对每一条新的合理化，加上：

#### 25.7.2 1. 在规则里明确否定（Explicit Negation in Rules）

<Before>
```markdown
Write code before test? Delete it.
```
</Before>

<After>
```markdown
Write code before test? Delete it. Start over.

**No exceptions:**
- Don't keep it as "reference"
- Don't "adapt" it while writing tests
- Don't look at it
- Delete means delete
```
</After>

#### 25.7.3 2. 写进合理化表（Entry in Rationalization Table）

```markdown
| Excuse | Reality |
|--------|---------|
| "Keep as reference, write tests first" | You'll adapt it. That's testing after. Delete means delete. |
```

#### 25.7.4 3. 加一条红旗（Red Flag Entry）

```markdown
## Red Flags - STOP

- "Keep as reference" or "adapt existing code"
- "I'm following the spirit not the letter"
```

#### 25.7.5 4. 更新 description（Update description）

```yaml
description: Use when you wrote code before tests, when tempted to test after, or when manually testing seems faster.
```

加上「正要违规」的症状。

#### 25.7.6 重构后重新验证（Re-verify After Refactoring）

**用更新后的技能重测同样的场景。**

agent 现在应该：
- 选择正确的选项
- 引用新的小节
- 承认自己先前的合理化已经被处理

**如果 agent 找出了新的合理化：** 继续 REFACTOR 循环。

**如果 agent 遵守了规则：** 成功——这个技能在这个场景下是防弹的。

### 25.8 元测试（当 GREEN 不奏效时）（Meta-Testing (When GREEN Isn't Working)）

**在 agent 选错选项之后，问它：**

```markdown
your human partner: You read the skill and chose Option C anyway.

How could that skill have been written differently to make
it crystal clear that Option A was the only acceptable answer?
```

**三种可能的回答：**

1. **「技能本来就很清楚，是我选择无视它」**
   - 不是文档问题
   - 需要更强的根本原则
   - 加上「违反字面就是违反精神」

2. **「技能里本应该说 X」**
   - 文档问题
   - 把它的建议逐字加上

3. **「我没看到 Y 小节」**
   - 组织问题
   - 让关键点更醒目
   - 在开头就加上根本原则

### 25.9 技能何时算防弹（When Skill is Bulletproof）

**防弹技能的标志：**

1. **agent 选择正确的选项**，即便在最大压力之下
2. **agent 引用技能的小节**作为依据
3. **agent 承认诱惑**，但仍然遵守规则
4. **元测试揭示出**「技能本来就很清楚，我应该遵守它」

**如果出现以下情况，就不算防弹：**
- agent 找出新的合理化
- agent 争辩说技能是错的
- agent 创造「混合方案」
- agent 请求许可，却强烈主张违规

### 25.10 示例：TDD 技能的防弹化（Example: TDD Skill Bulletproofing）

#### 25.10.1 初始测试（失败）（Initial Test (Failed)）
```markdown
Scenario: 200 lines done, forgot TDD, exhausted, dinner plans
Agent chose: C (write tests after)
Rationalization: "Tests after achieve same goals"
```

#### 25.10.2 迭代 1 —— 加上对策（Iteration 1 - Add Counter）
```markdown
Added section: "Why Order Matters"
Re-tested: Agent STILL chose C
New rationalization: "Spirit not letter"
```

#### 25.10.3 迭代 2 —— 加上根本原则（Iteration 2 - Add Foundational Principle）
```markdown
Added: "Violating letter is violating spirit"
Re-tested: Agent chose A (delete it)
Cited: New principle directly
Meta-test: "Skill was clear, I should follow it"
```

**防弹达成。**

### 25.11 测试清单（技能的 TDD）（Testing Checklist (TDD for Skills)）

部署技能之前，确认你走完了 RED-GREEN-REFACTOR：

**RED 阶段：**
- [ ] 创建了压力场景（组合 3 种以上压力）
- [ ] 在没有技能的情况下跑了场景（基线）
- [ ] 逐字记录了 agent 的失败和合理化

**GREEN 阶段：**
- [ ] 写出了针对具体基线失败的技能
- [ ] 带着技能跑了场景
- [ ] agent 现在依从

**REFACTOR 阶段：**
- [ ] 从测试中找出了新的合理化
- [ ] 为每个漏洞加上了明确的对策
- [ ] 更新了合理化表
- [ ] 更新了红旗清单
- [ ] 用违规症状更新了 description
- [ ] 重测过——agent 仍然依从
- [ ] 做了元测试以验证清晰度
- [ ] agent 在最大压力之下仍然遵守规则

### 25.12 常见错误（与 TDD 相同）（Common Mistakes (Same as TDD)）

**❌ 在测试之前写技能（跳过 RED）**
它暴露的是你认为需要防住的东西，而不是实际需要防住的东西。
✅ 修复：永远先跑基线场景。

**❌ 没有好好看着测试失败**
只跑学究式的测试，而不是真实的压力场景。
✅ 修复：使用让 agent「想要」违规的压力场景。

**❌ 测试用例太弱（单一压力）**
agent 能抵抗单一压力，在多重压力下崩溃。
✅ 修复：组合 3 种以上压力（时间 + 沉没成本 + 疲惫）。

**❌ 没有记录确切的失败**
「agent 错了」并不能告诉你该防住什么。
✅ 修复：逐字记录确切的合理化。

**❌ 含糊的修复（加上泛泛的对策）**
「不要作弊」不管用。「不要留着当参考」才管用。
✅ 修复：为每一条具体的合理化加上明确的否定。

**❌ 跑完第一遍就停下**
测试通过一次 ≠ 防弹。
✅ 修复：继续 REFACTOR 循环，直到不再出现新的合理化。

### 25.13 速查（TDD 循环）（Quick Reference (TDD Cycle)）

| TDD 阶段 | 技能测试 | 成功标准 |
|---|---|---|
| **RED** | 在没有技能的情况下跑场景 | agent 失败，记录合理化 |
| **Verify RED** | 记录确切的措辞 | 对失败的逐字记录 |
| **GREEN** | 写出针对失败的技能 | agent 现在依从这个技能 |
| **Verify GREEN** | 重测场景 | agent 在压力之下遵守规则 |
| **REFACTOR** | 堵住漏洞 | 为新的合理化加上对策 |
| **Stay GREEN** | 重新验证 | 重构之后 agent 仍然依从 |

### 25.14 底线（The Bottom Line）

**技能创建就是 TDD。同样的原则，同样的循环，同样的收益。**

如果你不会不写测试就写代码，那就不要不在 agent 身上测试就写技能。

文档的 RED-GREEN-REFACTOR 和代码的 RED-GREEN-REFACTOR 运作方式完全一样。

### 25.15 现实影响（Real-World Impact）

把 TDD 应用到 TDD 技能自身（2025-10-03）：
- 6 轮 RED-GREEN-REFACTOR 迭代才做到防弹
- 基线测试揭示出 10 条以上独特的合理化
- 每一轮 REFACTOR 都堵上了具体的漏洞
- 最终的 VERIFY GREEN：在最大压力之下 100% 依从
- 同样的流程适用于任何强制纪律的技能
