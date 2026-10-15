---
name: implement
description: "根据一份 spec 或一组 ticket 实现一项工作。"
disable-model-invocation: true
---

实现用户在 spec 或 ticket 里描述的工作。

如果用户传入了一个 ticket 引用（文件路径或编号），先读回它，并在开始前报出它的标题。引用有歧义就问。

在预先约定的接缝处，尽可能调用 Skill 工具运行 "tdd"。

经常跑类型检查，经常跑单个测试文件，最后完整跑一遍测试套件。

完成后，调用 Skill 工具运行 "code-review" 评审这份工作。

不要提交：把改动概要和一份建议的提交信息报告给用户，由用户自己提交。
