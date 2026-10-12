## 15 receiving-code-review

> 译自 `reference/superpowers/skills/receiving-code-review/SKILL.md`（原文 205 行）。frontmatter 与全部代码块（响应流程伪代码、示例对话）按原样保留、未翻译。
> 对照 `READING-superpowers.md` 第 16 项。

**frontmatter**

- `name`: `receiving-code-review`
- `description`: `Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical rigor and verification, not performative agreement or blind implementation`

### 15.1 概览（Overview）

代码评审需要的是技术评估，不是情绪表演。

**核心原则：** 先核实，再实施。先提问，再假设。技术正确性优先于社交上的舒适。

### 15.2 回应模式（The Response Pattern）

流程伪代码原文保留，未译：

```
WHEN receiving code review feedback:

1. READ: Complete feedback without reacting
2. UNDERSTAND: Restate requirement in own words (or ask)
3. VERIFY: Check against codebase reality
4. EVALUATE: Technically sound for THIS codebase?
5. RESPOND: Technical acknowledgment or reasoned pushback
6. IMPLEMENT: One item at a time, test each
```

### 15.3 禁止的回应（Forbidden Responses）

**绝不：**

> 译文：「你完全说得对！」（明确的指令文件违规）
>
> 原文：`"You're absolutely right!" (explicit instruction-file violation)`

> 译文：「说得好！」/「精彩的反馈！」（表演性的）
>
> 原文：`"Great point!" / "Excellent feedback!" (performative)`

> 译文：「我这就去实施」（在核实之前）
>
> 原文：`"Let me implement that now" (before verification)`

**而是：**

- 复述技术上的要求
- 提出澄清性问题
- 如果反馈是错的，用技术理由反驳
- 直接开始干活（行动 > 言语）

### 15.4 处理不清楚的反馈（Handling Unclear Feedback）

流程伪代码原文保留，未译：

```
IF any item is unclear:
  STOP - do not implement anything yet
  ASK for clarification on unclear items

WHY: Items may be related. Partial understanding = wrong implementation.
```

**示例：**

示例原文保留，未译：

```
your human partner: "Fix 1-6"
You understand 1,2,3,6. Unclear on 4,5.

❌ WRONG: Implement 1,2,3,6 now, ask about 4,5 later
✅ RIGHT: "I understand items 1,2,3,6. Need clarification on 4 and 5 before proceeding."
```

### 15.5 按来源分别处理（Source-Specific Handling）

#### 15.5.1 来自你的搭档（From your human partner）

- **可信**——理解之后就去实施
- **范围不清楚时仍然要问**
- **不要表演性的附和**
- **直接进入行动**，或给一句技术上的确认

#### 15.5.2 来自外部评审者（From External Reviewers）

流程伪代码原文保留，未译：

```
BEFORE implementing:
  1. Check: Technically correct for THIS codebase?
  2. Check: Breaks existing functionality?
  3. Check: Reason for current implementation?
  4. Check: Works on all platforms/versions?
  5. Check: Does reviewer understand full context?

IF suggestion seems wrong:
  Push back with technical reasoning

IF can't easily verify:
  Say so: "I can't verify this without [X]. Should I [investigate/ask/proceed]?"

IF conflicts with your human partner's prior decisions:
  Stop and discuss with your human partner first
```

**你的搭档的规则：** “对外部反馈——保持怀疑，但要仔细核实”（External feedback - be skeptical, but check carefully）

### 15.6 对「专业级」功能的 YAGNI 检查（YAGNI Check for "Professional" Features）

流程伪代码原文保留，未译：

```
IF reviewer suggests "implementing properly":
  grep codebase for actual usage

  IF unused: "This endpoint isn't called. Remove it (YAGNI)?"
  IF used: Then implement properly
```

**你的搭档的规则：** “你和评审者都向我汇报。如果不需要这个功能，就不要加。”（You and reviewer both report to me. If we don't need this feature, don't add it.）

### 15.7 实施顺序（Implementation Order）

流程伪代码原文保留，未译：

```
FOR multi-item feedback:
  1. Clarify anything unclear FIRST
  2. Then implement in this order:
     - Blocking issues (breaks, security)
     - Simple fixes (typos, imports)
     - Complex fixes (refactoring, logic)
  3. Test each fix individually
  4. Verify no regressions
```

### 15.8 什么时候该反驳（When To Push Back）

遇到这些情况就反驳：

- 建议会破坏现有功能
- 评审者缺少完整上下文
- 违反 YAGNI（没人用的功能）
- 在这个技术栈上技术上不正确
- 存在历史遗留/兼容性方面的原因
- 与你的搭档的架构决策冲突

**怎么反驳：**

- 用技术理由，不要用防御姿态
- 问具体的问题
- 引用能跑通的测试/代码
- 如果涉及架构，把你的搭档拉进来

**如果你不敢把反驳说出口：** 承认这份紧张，然后把你看到的问题告诉你的搭档。他们会感谢你的诚实。

### 15.9 认可正确的反馈（Acknowledging Correct Feedback）

当反馈确实正确时：

示例原文保留，未译：

```
✅ "Fixed. [Brief description of what changed]"
✅ "Good catch - [specific issue]. Fixed in [location]."
✅ [Just fix it and show in the code]

❌ "You're absolutely right!"
❌ "Great point!"
❌ "Thanks for catching that!"
❌ "Thanks for [anything]"
❌ ANY gratitude expression
```

**为什么不道谢：** 行动会说话。直接修好。代码本身就表明你听到了反馈。

**如果你发现自己正要写下「Thanks」：** 删掉它。改为陈述修复。

### 15.10 体面地纠正你的反驳（Gracefully Correcting Your Pushback）

如果你反驳了，而且反驳错了：

示例原文保留，未译：

```
✅ "You were right - I checked [X] and it does [Y]. Implementing now."
✅ "Verified this and you're correct. My initial understanding was wrong because [reason]. Fixing."

❌ Long apology
❌ Defending why you pushed back
❌ Over-explaining
```

用事实陈述更正，然后往下走。

### 15.11 常见错误（Common Mistakes）

| 错误 | 修正 |
|---|---|
| 表演性的附和 | 陈述要求，或者直接动手 |
| 盲目实施 | 先对照代码库核实 |
| 不测试就批量改 | 一次一个，每个都测 |
| 假设评审者一定对 | 检查它会不会弄坏东西 |
| 回避反驳 | 技术正确性 > 舒不舒服 |
| 只实施一部分 | 先把所有条目澄清清楚 |
| 无法核实却照样往下做 | 说明限制，问方向 |

### 15.12 真实示例（Real Examples）

**表演性附和（坏）：**

示例原文保留，未译：

```
Reviewer: "Remove legacy code"
❌ "You're absolutely right! Let me remove that..."
```

**技术性核实（好）：**

示例原文保留，未译：

```
Reviewer: "Remove legacy code"
✅ "Checking... build target is 10.15+, this API needs 13+. Need legacy for backward compat. Current impl has wrong bundle ID - fix it or drop pre-13 support?"
```

**YAGNI（好）：**

示例原文保留，未译：

```
Reviewer: "Implement proper metrics tracking with database, date filters, CSV export"
✅ "Grepped codebase - nothing calls this endpoint. Remove it (YAGNI)? Or is there usage I'm missing?"
```

**不清楚的条目（好）：**

示例原文保留，未译：

```
your human partner: "Fix items 1-6"
You understand 1,2,3,6. Unclear on 4,5.
✅ "Understand 1,2,3,6. Need clarification on 4 and 5 before implementing."
```

### 15.13 GitHub 评论串回复（GitHub Thread Replies）

在 GitHub 上回复行内评审评论时，要在评论串里回复（`gh api repos/{owner}/{repo}/pulls/{pr}/comments/{id}/replies`），而不是作为顶层 PR 评论。
