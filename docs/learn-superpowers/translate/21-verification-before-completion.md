## 21 verification-before-completion

> 译自 `reference/superpowers/skills/verification-before-completion/SKILL.md`（原文 120 行）。frontmatter 与全部五个代码块（`The Iron Law`、`The Gate Function`、`Key Patterns` 的五个示例块）按原样保留。
> 对照 `READING-superpowers.md` 第 22 项。

**frontmatter**

- `name`: `verification-before-completion`
- `description`: `Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always`

**完成前验证（Verification Before Completion）**

### 21.1 概览（Overview）

**核心原则：** 证据永远先于主张。

**违反这条规则的文字，就是违反这条规则的精神。**

### 21.2 铁律（The Iron Law）

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

如果你没有在本条消息里跑过验证命令，你就不能声称它通过。

### 21.3 闸门函数（The Gate Function）

```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. ONLY THEN: Make the claim

Skip any step = lying, not verifying
```

### 21.4 常见失败（Common Failures）

| 主张 | 需要什么 | 不充分 |
|-------|----------|----------------|
| 测试通过 | 测试命令输出：0 个失败 | 上一次的运行结果、「应该能过」 |
| Linter 干净 | Linter 输出：0 个错误 | 部分检查、外推 |
| 构建成功 | 构建命令：退出码 0 | Linter 通过、日志看起来不错 |
| Bug 已修复 | 测试原始症状：通过 | 改了代码、假定已修好 |
| 回归测试有效 | 已验证红-绿循环 | 测试通过了一次 |
| Agent 已完成 | VCS diff 显示有改动 | Agent 报告「成功」 |
| 需求已满足 | 逐行核对清单 | 测试通过 |

### 21.5 红旗——停下（Red Flags - STOP）

- 使用「应该」「大概」「看起来」
- 在验证之前表达满意（「太好了！」「完美！」「搞定了！」等）
- 未经验证就要提交/推送/开 PR
- 相信 agent 的成功报告
- 依赖部分验证
- 想着「就这一次」
- 累了、想让工作赶紧结束
- **任何暗示成功、却没有跑过验证的措辞**

### 21.6 反合理化（Rationalization Prevention）

| 借口 | 真相 |
|--------|---------|
| 「现在应该能跑了」 | 去**跑**验证 |
| 「我有信心」 | 信心 ≠ 证据 |
| 「就这一次」 | 没有例外 |
| 「Linter 过了」 | Linter ≠ 编译器 |
| 「Agent 说成功了」 | 独立验证 |
| 「我累了」 | 疲惫 ≠ 借口 |
| 「部分检查就够了」 | 部分什么都证明不了 |
| 「换了个说法，所以规则不适用」 | 精神高于文字 |

### 21.7 关键范式（Key Patterns）

**测试：**
```
✅ [Run test command] [See: 34/34 pass] "All tests pass"
❌ "Should pass now" / "Looks correct"
```

**回归测试（TDD 红-绿）：**
```
✅ Write → Run (pass) → Revert fix → Run (MUST FAIL) → Restore → Run (pass)
❌ "I've written a regression test" (without red-green verification)
```

**构建：**
```
✅ [Run build] [See: exit 0] "Build passes"
❌ "Linter passed" (linter doesn't check compilation)
```

**需求：**
```
✅ Re-read plan → Create checklist → Verify each → Report gaps or completion
❌ "Tests pass, phase complete"
```

**Agent 委派：**
```
✅ Agent reports success → Check VCS diff → Verify changes → Report actual state
❌ Trust agent report
```

### 21.8 何时适用（When To Apply）

**永远在以下时刻之前：**
- 任何形式变体的成功/完成主张
- 任何满意的表达
- 任何关于工作状态的正面陈述
- 提交、创建 PR、任务完成
- 移动到下一个任务
- 委派给 agent

**规则适用于：**
- 确切的措辞
- 转述与同义词
- 成功的暗示
- 任何暗示完成/正确的沟通
