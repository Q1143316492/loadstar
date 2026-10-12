这篇文档来自于对于 superpower skill 的阅读

先读 README

## 1 README

### 1.1 How it works

skill不会直接着手编写代码。相反，它会先停下来，询问你的真实目标。

一旦它从对话中提取出一份技术规范，就会将其拆分成短小的片段展示给你，方便你阅读和理解。

确定方案后，他会先列足够清晰的计划。计划强调真正的红绿测试，也就是 TDD。还有两个原则。

- YAGNI 原则。别为"将来可能需要"写代码，只实现当下真正需要的
- DRY 原则（Don't Repeat Yourself）每一处知识在系统里只能有一个权威表述

superpowers 怎么用这两个词:

- 设计阶段砍功能：`skills/brainstorming/SKILL.md:214` 写着 "YAGNI ruthlessly"，评审表里 YAGNI 一栏的定义是 "Unrequested features, over-engineering"（`spec-document-reviewer-prompt.md:25`）。
- DRY 被刻意加了限定：两处评审提示词里，检查项写的都是「DRY without premature abstraction?」（`code-reviewer.md:74`、`task-reviewer-prompt.md:120`）——作者知道 DRY 会诱发过度抽象，所以在同一条检查项里就把边界钉死了。
- 最有用的一条：`skills/receiving-code-review/SKILL.md:88` 有个 "YAGNI Check"——发现某 endpoint 没人调用时，规范话术是「我 grep 了，没有任何地方调用它。删掉吗（YAGNI）？还是我漏了用法？」注意它给的是提问，不是判决。
- 这两个词还是公认的借口：`task-reviewer-prompt.md:69` 明确写了"「按 YAGNI 留着」或任何其他理由，都不是结论"；`docs/superpowers/specs/2026-06-10-strict-cost-sdd-design.md:209` 记录了一次 eval 里被识破的合理化——把 DRY 违规说成是 YAGNI。
- 还有一次真实事故值得你看：`2026-06-09-sdd-task-scoped-review-dispatch-design.md:146` 记载，控制器编造了"计划禁止共享 helper"的说法，去指示质量评审员不要报一个故意埋的 DRY 违规。之后他们的规则里就加了一条：禁止预判、禁止指示评审员忽略某类问题。

一句话总结：superpowers 把这两条写进提示词，不只是因为它们是好实践，更因为它们是 agent 最顺手的两个脱罪词——所以每条后面都跟着"这不是结论，是主张"的钉子。

一旦开始执行后，它会通过 子智能体 来驱动任务完成

在你确认敲定设计方案后，你的代理会制定一份实施计划。这份计划要足够清晰，哪怕交给一名热情但审美糟糕、缺乏判断力、不了解项目背景，并且抵触测试的初级工程师，他也能照着执行。计划着重强调真正的红 / 绿测试驱动开发（TDD）、YAGNI 原则（你不会需要它）以及 DRY 原则（不要重复自己）。

### 1.2 The Basic Workflow

1. 头脑风暴 — 在编写代码前启动。通过提问完善粗略想法，探索多种备选方案，分模块展示设计方案以供验证，保存设计文档。
2. 使用 git 工作树 — 设计方案获批后启动。在新分支上创建独立工作区，执行项目初始化，确认测试基准环境干净可用。
3. 编写执行计划 — 设计获批后启动。将工作拆分为细小任务（每项 2–5 分钟即可完成）。每个任务包含精确文件路径、完整代码以及验证步骤。
4. 子智能体驱动开发 或称 执行计划 — 获取计划后启动。两种模式：一是为每项任务分配全新子智能体，每项任务完成后进行审查（最严谨）；二是在当前会话中直接执行全部任务，最后一次性对整个分支做完整审查（成本更低）。
5. 测试驱动开发 — 开发实现阶段启动。严格遵循红 - 绿 - 重构流程：编写会失败的测试，确认测试报错，编写最简代码，确认测试通过，提交代码。删除在测试之前编写的代码。
6. 发起代码审查 — 任务间隙启动。对照开发计划开展审查，按严重程度上报问题。严重问题会阻断后续工作。
7. 完成开发分支 — 全部任务结束后启动。核验测试，提供操作选项（合并 / 拉取请求 / 保留 / 丢弃），清理工作树。

智能体会在执行任意任务前检查所需相关技能。 这些是强制工作流，而非可选建议。

diagnosing-superpowers 当你觉得技能异常的时候，可以调用这个技能来进行诊断。

### 1.3 Skills

#### 1.3.1 Testing

- test-driven-development - 测试驱动开发（TDD）——RED-GREEN-REFACTOR 循环（包含测试反模式参考）

#### 1.3.2 Debugging

- systematic-debugging - 系统化调试——四阶段根因分析流程（包含根因追踪、纵深防御、条件等待等技术）
- verification-before-completion - 完成前验证——确保问题确实已被修复
- diagnosing-superpowers - 诊断超能力——在一次会话中查明问题所在，并附上证据；导出脱敏诊断包或提交问题报告

#### 1.3.3 Collaboration

- brainstorming - 头脑风暴——苏格拉底式设计优化
- writing-plans - 编写计划——详细的实现计划
- executing-plans - 执行计划——内联计划执行：单一上下文、最终评审
- dispatching-parallel-agents - 分派并行代理——并发子代理工作流
- requesting-code-review - 请求代码评审——提交前检查清单
- receiving-code-review - 接收代码评审——回应反馈意见
- using-git-worktrees - 使用 Git 工作树——并行开发分支
- finishing-a-development-branch - 完成开发分支——合并/PR 决策流程
- subagent-driven-development - 子代理驱动开发——双阶段评审下的快速迭代（先规范合规，后代码质量）

#### 1.3.4 Meta

- writing-skills - 编写技能——按照最佳实践创建新技能（包含测试方法论）
- using-superpowers - 使用超能力——技能系统入门

### 1.4 哲学

- Test-Driven Development - Write tests first, always
- Systematic over ad-hoc - 重过程而非猜测
- Complexity reduction - Simplicity as primary goal 以简洁为首要目标
- Evidence over claims - Verify before declaring success 宣告成功前先进行验证
