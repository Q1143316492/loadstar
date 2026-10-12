## 13 requesting-code-review

> 译自 `reference/superpowers/skills/requesting-code-review/SKILL.md`（原文 95 行）。frontmatter 与两个围栏代码块（`Get git SHAs` 的 bash 块、示例块）按原样保留。
> 对照 `READING-superpowers.md` 第 14 项。

**frontmatter**

- `name`: `requesting-code-review`
- `description`: `Use when completing tasks, implementing major features, or before merging to verify work meets requirements`

派一个代码评审子智能体，在问题级联放大之前把它们抓住。评审者拿到的是为评估而精确构造的上下文——绝不是你这次会话的历史。

**核心原则：** 早评审，勤评审。

### 13.1 何时请求评审（When to Request Review）

**强制：**

- 子智能体驱动开发里，每个任务之后
- 完成重大功能之后
- 合并到 main 之前

**可选但有价值：**

- 卡住时（一个新视角）
- 重构之前（基线检查）
- 修完复杂 bug 之后

### 13.2 如何请求（How to Request）

**1. 拿到 git SHA：**

```bash
BASE_SHA=$(git rev-parse HEAD~1)  # or: git merge-base origin/main HEAD
HEAD_SHA=$(git rev-parse HEAD)
```

**2. 派出代码评审子智能体：**

派一个 `general-purpose` 子智能体，填写 [code-reviewer.md](code-reviewer.md) 里的模板

**占位符：**

- `{DESCRIPTION}` - 你构建了什么，简要总结
- `{PLAN_OR_REQUIREMENTS}` - 它应该做什么
- `{BASE_SHA}` - 起始提交
- `{HEAD_SHA}` - 结束提交

**3. 按反馈行动：**

- `Critical` 问题立刻修
- `Important` 问题在继续之前修
- `Minor` 问题记下来留待以后
- 评审者错了就顶回去（带上理由）

### 13.3 示例（Example）

```
[Just completed Task 2: Add verification function]

You: Let me request code review before proceeding.

BASE_SHA=$(git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[Dispatch code reviewer subagent]
  DESCRIPTION: Added verifyIndex() and repairIndex() with 4 issue types
  PLAN_OR_REQUIREMENTS: Task 2 from docs/superpowers/plans/deployment-plan.md
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661

[Subagent returns]:
  Strengths: Clean architecture, real tests
  Issues:
    Important: Missing progress indicators
    Minor: Magic number (100) for reporting interval
  Assessment: Ready to proceed

You: [Fix progress indicators]
[Continue to Task 3]
```

### 13.4 常见合理化（Common Rationalizations）

| 借口 | 真相 |
|--------|---------|
| “我干脆自己看 diff 就行，不用派评审者” | 你是协调者——在内联看 diff 会烧掉你继续推进工作所需的上下文窗口。派一个评审者子智能体：diff 和评估都活在它的上下文里，只有结论回到你这里。 |
| “评审者需要我整个会话历史才能理解这次改动” | 交给它精确构造的上下文，绝不是你这次会话的历史。这样评审者盯着的才是工作产物，而不是你的思考过程。 |

### 13.5 红旗（Red Flags）

**绝不：**

- 因为「这很简单」就跳过评审
- 无视 `Critical` 问题
- 带着未修的 `Important` 问题继续走
- 跟有效的技术反馈抬杠

**如果评审者错了：**

- 用技术理由顶回去
- 拿出代码/测试证明它能工作
- 请求澄清

模板见：[code-reviewer.md](code-reviewer.md)
