## 27 diagnosing-superpowers

> 译自 `reference/superpowers/skills/diagnosing-superpowers/SKILL.md`（原文 120 行）。YAML frontmatter 按原样保留，取值不译。
> 对照 `READING-superpowers.md` 第 28 项。

**frontmatter**

- `name`: `diagnosing-superpowers`
- `description`: `Use when a superpowers session went wrong and your human partner wants to know why — repeated work, ignored plans, stumbles, poor results, a skill that didn't fire, "it took too long", "why is it so expensive", "what is it doing" — or wants to build a bug report for the superpowers maintainers, for the current session or a past one identified by id or path, on any harness.`

**诊断 Superpowers（Diagnosing Superpowers）**

### 27.1 概览（Overview）

和你的「人类搭档」一起把一次会话里到底哪里出了错钉死，读磁盘上的转录，带着证据报告发生了什么。**你只做报告；你不诊断 superpowers。** 由分诊这个证据包或这个 issue 的人来决定 superpowers 要不要改。

**核心原则：** 每一条发现都要引用 `path:line`。没有引用，就没有发现。每一个数字都来自转录，或来自你跑过的命令，绝不来自记忆。

### 27.2 工作流（Workflow）

每一步建一个 todo。第 5–7 步只在各自声明的条件下执行。

1. **问题受理。** 一次问一个问题，直到你能写出一句陈述：点名会话（一个或多个）、已知的话轮范围、你的搭档期待什么、实际发生了什么、以及他在意的那个可观测量（墙上时钟、token、重复动作、某一个具体动作）。「它花了太久」是抱怨，不是问题陈述。记下目标是否是一份 superpowers bug 报告。
2. **定位。** 用 `references/session-discovery.md` 把每个会话解析成经过核实的绝对文件系统路径。用它的第一条 prompt 和时间戳确认一个过去的会话，并把每一个你否掉的候选都连同理由列出来，或者写「none」。枚举子智能体转录。创建 `~/.superpowers/diagnosing-superpowers/<session-id>/`，把这个路径告诉你的搭档，并在那里填写 `templates/case.md`，按它的来源规则来处理环境和技能相关的观察。
3. **分诊。** 你自己读一遍所报问题周边的区域。然后按维度并行派出一名分析师子智能体，每个都给到 case 文件路径、`prompts/analyst-common.md`，以及 `prompts/` 里的一个维度文件：`skill-timeline.md`、`plan-adherence.md`、`repeated-work.md`、`stumbles.md`、`quality-evidence.md`、`request-conflicts.md`、`cost-and-time.md`。转录很长时按话轮范围切分一个维度。丢掉任何没有 `path:line` 的返回发现。
4. **报告。** 按顺序填写 `templates/report.md` 的每一节，写到工作区，展示它，并给出路径。检查被引用的内容实际证明了什么，并保留支撑性的 case；一个符号链接别名不是一份冗余副本。
5. **GitHub issues** —— 当报告第 §7 节说 possible 或 likely，或你的搭档要求时。按 `references/github-issues.md` 搜索 open 和 closed 的 issue。展示匹配项，并建议把这份报告加到最接近的那个上。如果什么都不匹配，填写 `templates/issue.md`，写到工作区，展示确切的文本，并且只有在批准之后才创建 issue。`gh` 不能附加文件；如果已有一个证据包，把它的路径给你的搭档，让他在浏览器里附加。
6. **导出** —— 只在你的搭档要一个证据包时；绝不主动构建一个。如果受理时的目标是 bug 报告，说一次「一个经过清洗的证据包可按需提供」，然后等。询问脱敏级别，并说明每一种都包含什么：skeleton（不含工具结果正文）、evidence（只为被引用的事件保留正文）、full。按 `templates/bundle-README.md` 构建证据包，派出 `prompts/scrub.md`，然后是 `prompts/scrub-audit.md`，重复这两步直到审计返回 CLEAN。在展示最终的清洗日志、文件清单以及隐私与证据结论之前，先完成证据包模板的证据检查和对账。只有在批准之后才归档（`zip -r` 或 `tar -czf`）。拿到归档路径后，说明它包含什么，指向清洗日志看替换项，并说明清洗可能漏东西：在分享之前他们必须审阅每一个文件。
7. **相似会话** —— 在被要求时。把已确认的发现转成一个签名，按 mtime 和大小列出候选，找到标记行的行号，给每个候选并行派出 `prompts/similar-session.md`，并追加报告第 §9 节。

### 27.3 速查表（Quick reference）

七名分析师永远都会跑。这张表说的是第 3 步里你自己该先读哪个区域，以及结论里先带出哪些发现。

| 抱怨 | 先读，先带出 |
|---|---|
| 「它花了太久」 | cost-and-time、stumbles |
| 「它为什么要做这些额外的工作？」 | repeated-work、plan-adherence |
| 「为什么它这么贵？」 | cost-and-time |
| 「它到底在干什么？」（还在跑） | skill-timeline；在覆盖范围里注明进行中 |
| 「它无视了计划」 | plan-adherence，先看压缩行 |
| 「技能 X 从来没触发」 | skill-timeline |

上述短台词对照：

- 「它花了太久」——原文：`"It took too long"`
- 「它为什么要做这些额外的工作？」——原文：`"Why did it do this extra work?"`
- 「为什么它这么贵？」——原文：`"Why is it so expensive?"`
- 「它到底在干什么？」（还在跑）——原文：`"What the hell is it doing?" (still running)`
- 「它无视了计划」——原文：`"It ignored the plan"`
- 「技能 X 从来没触发」——原文：`"Skill X never fired"`

### 27.4 硬规则（Hard rules）

- **上下文安全。** 一行转录可能有一兆字节。每一个会话文件、每一次都遵守 `references/context-safety.md`。
- **只读。** 绝不修改、移动或删除会话文件。
- **给子智能体的确切路径。** 子智能体的「当前会话」是它自己的。传绝对路径和 id。
- **只算人类 prompt。** Hook 输出、系统提醒和工具结果都不是你搭档说的话。在子智能体转录里，「user」是父智能体。
- **不做 superpowers 诊断。** 报告第 §7 节陈述涉及情况然后停下。绝不点出某个技能里的缺陷，也不提出改动。你的搭档催着要一个修复，并不豁免这一条；指向 issue 那一步，并提到证据包可按需提供。也不要给搭档建议。
- **批准闸门。** 在你的搭档看过清洗日志和文件清单之前，不归档。在他们批准确切文本之前，不建 issue、不发评论。
- **分析之前先受理。** 在你的搭档回答之前，第 2–7 步什么都不开始。如果他不在，把问题写下来然后停。你替他重建出来的陈述不是回答。一个已经划定范围的请求——某一个具体事件、现在正在跑什么、或要跑哪项分析——本身就是那句陈述：先回答它，再提问。针对整个会话的「为什么」是抱怨。

### 27.5 红旗（Red Flags）

| 想法 | 现实 |
|---|---|
| 「问题很明显，跳过受理」 | 问题陈述划定一切的范围。去问。 |
| 「他不在，所以我来重建陈述」 | 你无法重建他想要的东西。把问题写下来然后停。 |
| 「我现在全都扫一遍，最后再问」 | 没有划定范围的扫描会把他的预算花在错误的问题上。先问。 |
| 「他要一份 bug 报告，所以我现在就把证据包构建出来」 | 证据包是他的会话数据打包而成。只在他要求时才构建。 |
| 「小小改动，定向修改，不需要重构」 | 不管多小，都不是你说了算。报告证据；由分诊的人决定。 |
| 「每个 token 的价格是众所周知的」 | 你没有从转录里算出来的数字都是编的。给出引用，或者丢掉。 |

上述红旗表内引语的原文：

- 「问题很明显，跳过受理」——原文：`"The problem is obvious, skip intake"`
- 「他不在，所以我来重建陈述」——原文：`"They're away, so I'll reconstruct the statement"`
- 「我现在全都扫一遍，最后再问」——原文：`"I'll sweep everything now and ask at the end"`
- 「他要一份 bug 报告，所以我现在就把证据包构建出来」——原文：`"They want a bug report, so I'll build the bundle now"`
- 「小小改动，定向修改，不需要重构」——原文：`"Small, targeted edit, no restructuring needed"`
- 「每个 token 的价格是众所周知的」——原文：`"The price per token is well known"`
