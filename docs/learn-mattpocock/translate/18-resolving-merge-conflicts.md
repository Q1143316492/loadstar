## 18 resolving-merge-conflicts

> 译自 `reference/mattpocock-skills/skills/engineering/resolving-merge-conflicts/SKILL.md`（原文 14 行）。frontmatter 按原样保留。

**frontmatter**

- `name`: `resolving-merge-conflicts`
- `description`: `"Use when you need to resolve an in-progress git merge/rebase conflict."`（当你需要解决一个进行中的 git merge/rebase 冲突时使用。）

1. **看清当前状态**，即 merge/rebase 的当前状态。检查 git 历史，以及冲突的文件。

2. **找到每个冲突的原始来源（primary sources）**。深入理解每一处改动为什么做出，以及原本的意图（intent）是什么。读提交信息，查 PR，查原始 issue/ticket。

3. **解决每个 hunk。** 尽可能同时保留双方的意图。无法兼容时，选那个符合这次 merge 既定目标的，并记下取舍。**不要**发明新行为。始终解决冲突；绝不 `--abort`。

4. 找出项目的**自动化检查**并运行它们，通常是先类型检查，再测试，再格式化。修好 merge 弄坏的任何东西。

5. **完成这次 merge/rebase。** 把所有内容 stage 起来并提交。如果是 rebase，继续 rebase 流程，直到所有提交都完成 rebase。
