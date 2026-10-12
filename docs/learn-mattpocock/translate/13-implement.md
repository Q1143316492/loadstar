## 13 implement

> 译自 `reference/mattpocock-skills/skills/engineering/implement/SKILL.md`（原文 15 行）。frontmatter 按原样保留。

**frontmatter**

- `name`: `implement`
- `description`: `"Implement a piece of work based on a spec or set of tickets."`（根据 spec 或一组 ticket 实现一项工作。）

实现用户以 spec 或 ticket 形式描述的工作。

如果用户传入了 ticket 引用，从 issue tracker 取出它，并在开始之前说出它的标题。如果这个引用有歧义，就问清楚。

尽可能在预先约定好的接缝（seam）处，调用 Skill 工具，参数为 "tdd"。

定期运行类型检查，定期运行单个测试文件，最后完整跑一次全量测试套件。

完成后，调用 Skill 工具，参数为 "code-review"，来评审这项工作。

把工作提交到当前分支。
