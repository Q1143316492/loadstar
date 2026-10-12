## 17 systematic-debugging

> 译自 `reference/superpowers/skills/systematic-debugging/SKILL.md`（原文 283 行）。frontmatter 与全部四段代码块（Iron Law 一行、诊断埋点骨架、四层 bash 埋点示例、配置片段）按原样保留；三张表格逐格翻译。
> 对照 `READING-superpowers.md` 第 18 项。

**frontmatter**

- `name`: `systematic-debugging`
- `description`: `Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes`

**系统性调试（Systematic Debugging）**

### 17.1 概览（Overview）

**核心原则：** 永远先找到根因，再动手修复。修症状就是失败。

**违反这套流程的字面，就是违反调试的精神。**

### 17.2 铁律（The Iron Law）

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

如果没有完成第 1 阶段，你就不可以提出修复方案。

### 17.3 何时使用（When to Use）

用于**任何**技术问题：
- 测试失败
- 生产环境的 bug
- 意外行为
- 性能问题
- 构建失败
- 集成问题

**尤其**在这些时候要用：
- 时间压力之下（紧急情况会让猜测变得诱人）
- 「就快速修一下」看起来显而易见
- 你已经试过多次修复
- 上一次修复没起作用
- 你并没有完全理解这个问题

**不要**在这些时候跳过：
- 问题看起来简单（简单 bug 也有根因）
- 你在赶时间（赶工必然带来返工）
- 经理想让它**现在**就修好（系统性方法比反复瞎折腾更快）

### 17.4 四个阶段（The Four Phases）

你必须完成每一个阶段，才能进入下一个。

#### 17.4.1 第 1 阶段：根因调查（Phase 1: Root Cause Investigation）

**在尝试任何修复之前：**

1. **仔细读错误信息**
   - 不要跳过错误或警告
   - 它们往往包含着确切的解法
   - 完整读堆栈跟踪
   - 记下行号、文件路径、错误码

2. **稳定复现**
   - 你能可靠地触发它吗？
   - 确切的步骤是什么？
   - 它每次都发生吗？
   - 如果无法复现 → 去收集更多数据，不要猜

3. **检查最近的改动**
   - 什么改动可能导致了这个？
   - Git diff、最近的提交
   - 新依赖、配置变更
   - 环境差异

4. **在多组件系统里收集证据**

   **当系统有多个组件时（CI → build → signing、API → service → database）：**

   **在提出修复方案之前，先加入诊断埋点：**
   ```
   For EACH component boundary:
     - Log what data enters component
     - Log what data exits component
     - Verify environment/config propagation
     - Check state at each layer

   Run once to gather evidence showing WHERE it breaks
   THEN analyze evidence to identify failing component
   THEN investigate that specific component
   ```

   **示例（多层系统）：**
   ```bash
   # Layer 1: Workflow
   echo "=== Secrets available in workflow: ==="
   echo "IDENTITY: ${IDENTITY:+SET}${IDENTITY:-UNSET}"

   # Layer 2: Build script
   echo "=== Env vars in build script: ==="
   env | grep IDENTITY || echo "IDENTITY not in environment"

   # Layer 3: Signing script
   echo "=== Keychain state: ==="
   security list-keychains
   security find-identity -v

   # Layer 4: Actual signing
   codesign --sign "$IDENTITY" --verbose=4 "$APP"
   ```

   **这能揭示：** 是哪一层失败（secrets → workflow ✓，workflow → build ✗）

5. **追踪数据流**

   **当错误深深处在调用栈里时：**

   完整的反向追踪技巧见本目录的 `root-cause-tracing.md`。

   **速览版：**
   - 坏值是从哪里来的？
   - 是谁带着坏值调用了这里？
   - 一路往上追，直到找到源头
   - 在源头修，不要在症状处修

#### 17.4.2 第 2 阶段：模式分析（Phase 2: Pattern Analysis）

**先找出模式，再修：**

1. **找到能工作的例子**
   - 在同一个代码库里找到类似的、能工作的代码
   - 与坏掉的那块相似的东西里，什么在正常工作？

2. **与参考实现对照**
   - 如果是在实现某个模式，就**完整**读参考实现
   - 不要略读——每一行都读
   - 在应用之前彻底理解这个模式

3. **找出差异**
   - 能工作的和坏掉的之间，有什么不同？
   - 列出每一处差异，无论多小
   - 不要假设「那不可能有影响」

4. **理解依赖**
   - 它需要哪些其他组件？
   - 有哪些设置、配置、环境？
   - 它做了哪些假设？

#### 17.4.3 第 3 阶段：假设与验证（Phase 3: Hypothesis and Testing）

**科学方法：**

1. **只形成一个假设**
   - 清楚地陈述：「我认为 X 是根因，因为 Y」
   - 把它写下来
   - 要具体，不要含糊

2. **最小化验证**
   - 做**尽可能小**的改动来验证假设
   - 一次只动一个变量
   - 不要一次修多处

3. **继续之前先验证**
   - 起作用了吗？是 → 第 4 阶段
   - 没起作用？形成**新的**假设
   - **不要**在它上面再叠加更多修复

4. **当你不懂的时候**
   - 说「我不理解 X」
   - 不要假装懂
   - 求助
   - 再做研究

#### 17.4.4 第 4 阶段：实施（Phase 4: Implementation）

**修根因，不要修症状：**

1. **创建失败的测试用例**
   - 尽可能最简单的复现
   - 可能的话写成自动化测试
   - 没有测试框架就写一次性测试脚本
   - 修复前**必须**先有它
   - 用 `superpowers:test-driven-development` 技能来写规范的失败测试

2. **实施单一修复**
   - 针对已定位的根因
   - 一次只做**一处**改动
   - 不要「顺手也改一下」的改进
   - 不要捆绑重构

3. **验证修复**
   - 测试现在通过了吗？
   - 没有破坏其他测试吧？
   - 问题真的解决了吗？
   - 在宣称成功之前，用 `superpowers:verification-before-completion` 技能

4. **如果修复没起作用**
   - 停下
   - 数一数：你已经试过几次修复？
   - 如果 < 3：回到第 1 阶段，带着新信息重新分析
   - **如果 ≥ 3：停下，质疑架构（见下面第 5 步）**
   - 没有架构层面的讨论，不要尝试第 4 次修复

5. **如果 3 次以上修复都失败了：质疑架构**

   **指向架构问题的模式：**
   - 每次修复都在不同的地方暴露出新的共享状态／耦合／问题
   - 修复需要「大规模重构」才能实现
   - 每次修复都在别处制造出新症状

   **停下，质疑根本假设：**
   - 这个模式从根本上站得住吗？
   - 我们是不是「仅凭惯性在硬撑」？
   - 该重构架构，还是继续修症状？

   **在尝试更多修复之前，先与你的「人类搭档」讨论**

   这不是一个失败的假设——这是一个错误的架构。

### 17.5 红旗——停下，走流程（Red Flags - STOP and Follow Process）

如果你发现自己心里在想：
- 「先快速修一下，之后再调查」
- 「就试着改一下 X，看看行不行」
- 「一次加好几处改动，然后跑测试」
- 「跳过测试，我手动验证」
- 「大概是 X，我来修那个」
- 「我没有完全理解，但这也许能行」
- 「模式说的是 X，但我要换个方式改」
- 「主要问题在这里：[不调查就直接列修复方案]」
- 在追踪数据流之前就提出解决方案
- **「再试一次修复」（已经试过 2 次以上时）**
- **每次修复都在不同的地方暴露出新问题**

**以上全部意味着：停下。回到第 1 阶段。**

**如果 3 次以上修复都失败了：** 质疑架构（见第 4 阶段第 5 步）

### 17.6 你的**人类搭档**发出的「你做错了」信号（your human partner's Signals You're Doing It Wrong）

**留意这些纠偏：**

> 译文：「不是没发生吗？」
>
> 原文：`"Is that not happening?"`——你没有验证就假设了

> 译文：「它会不会让我们看到……？」
>
> 原文：`"Will it show us...?"`——你本该加入证据收集

> 译文：「别猜了」
>
> 原文：`"Stop guessing"`——你在不理解的情况下提修复方案

> 译文：「往深里想这个」
>
> 原文：`"Ultra-think this"`——质疑根本假设，而不只是症状

> 译文：「我们卡住了？」（带着挫败）
>
> 原文：`"We're stuck?"`——你的做法没起作用

**当你看到这些时：** 停下。回到第 1 阶段。

### 17.7 常见合理化（Common Rationalizations）

| 借口 | 真相 |
|---|---|
| “问题很简单，不需要流程” | 简单问题也有根因。对简单 bug 来说流程很快。 |
| “紧急情况，没时间走流程” | 系统性调试比猜一下、试一下的反复折腾**更快**。 |
| “先试这个，之后再调查” | 第一次修复就定下了模式。从头就做对。 |
| “等确认修复有效后我再写测试” | 没测试的修复留不住。先写测试才能证明它。 |
| “一次修多处省时间” | 无法隔离出是哪处起了作用。还会引入新 bug。 |
| “参考太长，我照着改改模式” | 理解不完整必然带来 bug。把它完整读完。 |
| “我看到问题了，我来修” | 看见症状 ≠ 理解根因。 |
| “再试一次修复”（在 2 次以上失败之后） | 3 次以上失败 = 架构问题。质疑模式，不要再修。 |

### 17.8 速查表（Quick Reference）

| 阶段 | 关键活动 | 成功标准 |
|---|---|---|
| **1. 根因** | 读错误、复现、检查改动、收集证据 | 理解**是什么**和**为什么** |
| **2. 模式** | 找到能工作的例子、做对照 | 找出差异 |
| **3. 假设** | 形成理论、最小化验证 | 假设被证实，或形成新假设 |
| **4. 实施** | 创建测试、修复、验证 | bug 解决，测试通过 |

### 17.9 当流程揭示「没有根因」时（When Process Reveals "No Root Cause"）

如果系统性调查揭示问题确实是环境性的、时序相关的、或外部的：

1. 你已经走完了流程
2. 记录下你调查了什么
3. 实施恰当的处理（重试、超时、错误信息）
4. 为将来的调查加上监控／日志

**但是：** 95% 的「没有根因」案例都是调查不完整。

### 17.10 支撑技巧（Supporting Techniques）

这些技巧是系统性调试的一部分，就在本目录里：

- **`root-cause-tracing.md`** - 沿调用栈反向追踪 bug，找到最初的触发点
- **`defense-in-depth.md`** - 找到根因之后，在多层加上校验
- **`condition-based-waiting.md`** - 用条件轮询替代任意设置的超时
