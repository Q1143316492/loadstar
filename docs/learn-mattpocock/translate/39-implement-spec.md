## 39 implement-spec

> 译自 `reference/mattpocock-skills/skills/engineering/implement-spec/SKILL.md`（原文 40 行）。frontmatter 按原样保留。

**frontmatter**

- `name`: `implement-spec`
- `description`: `"Implement the result of /to-spec and /to-tickets in code."`（用代码实现 `/to-spec` 和 `/to-tickets` 的结果。）
- `disable-model-invocation`: `true`

有人给你提供了一份 spec。这份 spec 应该带着与之关联的 ticket，描述如何实现它。

issue tracker 应该已经提供给你了。如果没有，告诉用户运行 `/setup-matt-pocock-skills`。

目标是让**整份 spec** 在一条**集成分支（integration branch）** 上实现完毕，每个 ticket 都按 issue tracker 关闭工作的方式被解决。

这些 ticket 不是一串步骤。它们是带阻塞关系的**任务图（task graph）**。这意味着永远存在一条**前沿（frontier）**，上面是可以直接抓取的就绪 ticket。

与 subagent 之间的通信应当稀疏。主要靠**上下文指针（context pointers）** 沟通：指向 spec、ticket、研究笔记和之前的提交。不要重复那些已经能通过指针拿到的信息。

**Implementer subagent** 应尽可能放在后台跑，以取得最大并发。

### 39.1 步骤（Steps）

1. 读 spec 和 ticket，理解这张任务图。

2. （可选）用一个**探索 subagent（exploration subagent）** 去做 ticket 所需的任何探索——相关的代码库文件或外部文档。确保这个探索 subagent 能保存文件：它应该把自己的 markdown 笔记保存到仓库之外的一个目录里，供所有后续 subagent 访问。这让 **implementer subagent** 能专注于实现，而不是探索。

3. 创建集成分支。如果 issue tracker 通过 PR 关闭工作，或者用户要求一个，就在第 5 步的第一次 merge 之后开一个 draft PR（一个在 main 之上还没有提交的分支开不了 PR），并标明它关闭这份 spec 和这些 ticket。

4. 用 **implementer subagent** 实现每个 ticket，各自在自己的 worktree、自己的分支上。每个 implementer subagent：
   - 在开始之前确认自己的 worktree 基于集成分支，如果不是就 reset 到它之上；
   - 调用 Skill 工具并以 `tdd` 为参数来构建这个 ticket；
   - 在报告完成之前，把集成分支的最新提交 merge 进自己的分支。

5. 一旦某个 **implementer subagent** 完成，用一个 **merger subagent** 把它的工作 merge 到集成分支上。

6. 如果这改变了可用 ticket 的**前沿（frontier）**，就再启动更多 **implementer subagent** 去做那些新就绪的 ticket。这让并发最大化。

7. 所有 ticket 完成后，在集成分支上调用 Skill 工具并以 `code-review` 为参数。由单个 **implementer subagent** 修复代码评审提出的所有问题。

8. 如果存在 draft PR，把它标记为可评审。否则，按 issue tracker 关闭工作的方式逐个解决 ticket，并报告集成分支。

9. 清理所有 **implementer subagent** 的 worktree。
