---
name: cwl-handoff
description: "把当前会话压缩成一份交接文档，供另一个 agent 接手。"
argument-hint: "下一个会话打算用来做什么？"
disable-model-invocation: true
---

写一份总结当前会话的交接文档，让一个全新的 agent 能接着干活。存到操作系统的临时目录（`$TMPDIR`，没有就用 `/tmp`；Windows 上是 `%TEMP%`）——不要存在当前工作区。

文档里包含一节「建议技能」，点名下一个 agent 应当对哪些技能调用 Skill 工具。

不要重复已经记录在其他产物里的内容（spec、计划、ADR、issue、提交、diff）。用路径或 URL 引用它们。

脱敏任何敏感信息，例如 API 密钥、密码或个人身份信息。

用户传了参数时，把它们当作「下个会话要干什么」的描述，据此裁剪文档。
