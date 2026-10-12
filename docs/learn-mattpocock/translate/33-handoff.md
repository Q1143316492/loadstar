## 33 handoff

> 译自 `reference/mattpocock-skills/skills/productivity/handoff/SKILL.md`（原文 16 行）。frontmatter 按原样保留。

**frontmatter**

- `name`: `handoff`
- `description`: `Compact the current conversation into a handoff document for another agent to pick up.`（把当前对话压缩成一份交接文档，供另一个 agent 接手。）
- `argument-hint`: `"What will the next session be used for?"`
- `disable-model-invocation`: `true`

写一份交接文档，总结当前对话，让一个全新的 agent 能继续这项工作。保存到用户操作系统的临时目录，而不是当前工作区。

在文档里包含一节「suggested skills」，点名下一个 agent 应当为哪些技能调用 Skill 工具。

不要重复已被其他产物捕获的内容（规格、计划、ADR、issue、提交、diff）。改为按路径或 URL 引用它们。

对任何敏感信息脱敏，例如 API 密钥、密码或可识别个人身份的信息。

如果用户传了参数，把它们当作对下一次会话将聚焦什么的描述，并据此裁剪文档。
