## 5 writing-plans

> 译自 `reference/superpowers/skills/writing-plans/SKILL.md`（原文 204 行）。frontmatter 与两个模板代码块（`Plan Document Header`、`Task Structure`）按原样保留。

**frontmatter**

- `name`: `writing-plans`
- `description`: `Use when you have a spec or requirements for a multi-step task, before touching code`

### 5.1 概览（Overview）

为一位**没看过这个代码库、也没看过这份 spec** 的工程师写实施计划。假定他只要知道了确切的接口和确切的测试，就能用项目语言写出地道的代码；假设计划里留白的地方他会做出合理选择。**他无法知道的，是你已经定下的东西**：改哪些文件、叫什么名字和签名、从 spec 里取哪些值、哪些测试证明每个任务。把这些写下来。把整份计划拆成小块任务交给他。DRY。YAGNI。TDD。频繁提交。

**开始时声明：** “I'm using the writing-plans skill to create the implementation plan.”

**上下文：** 如果在隔离的 worktree 里工作，它应该已经在执行阶段由 `superpowers:using-git-worktrees` 技能创建好了。

**计划保存到：** `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`

- （用户对计划存放位置的偏好覆盖这个默认值）

### 5.2 范围检查（Scope Check）

如果 spec 覆盖了多个互相独立的子系统，它本该在头脑风暴阶段就被拆成子项目的 spec。如果没有，建议把它拆成多份计划——一个子系统一份。每份计划本身都应该产出可运行、可测试的软件。

### 5.3 文件结构（File Structure）

在定义任务之前，先画出会创建或修改哪些文件、每个文件负责什么。**分解的决策就是在这里锁定的。**

- 设计边界清晰、接口定义良好的单元。每个文件应该只有一个明确职责。
- 一次能拿在上下文里的代码，你推理得最好；文件聚焦时你的改动更可靠。宁愿要更小、更聚焦的文件，也不要承担过多的大文件。
- **一起变化的文件应该放在一起。按职责拆分，不要按技术分层拆分。**
- 在既有代码库里，遵循既有模式。如果代码库本来就用大文件，不要单方面重构——但如果你正在改的文件已经臃肿难用，把一次拆分写进计划是合理的。

这个结构决定任务怎么分解。每个任务都应该产出**自足、单独看也说得通的改动**。

### 5.4 任务的合适粒度（Task Right-Sizing）

任务是这样的最小单元：**它自带一个测试循环，并且值得让一个全新的评审者把关。** 划任务边界时：把初始化、配置、脚手架、文档这些步骤**折进需要它们的那个交付物所属的任务里**；只在「评审者可以合理地否掉其中一个任务、却批准它旁边那个」的地方才拆开。每个任务以一个**可独立测试的交付物**收尾。

### 5.5 步骤粒度（Step Granularity）

**每个步骤是一个动作，带一个可检查的结果：**

- “写会失败的测试”——一步
- “跑它，确认它失败”——一步
- “写最少的代码让测试通过”——一步
- “跑测试，确认通过”——一步
- “提交”——一步

### 5.6 计划文档头（Plan Document Header）

**每份计划都必须以这个头开始：**

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

**Spec:** [path to the spec/design doc this plan implements — the plan
argues from the spec, so the spec travels with it; executors read both]

## Global Constraints

[The spec's project-wide requirements — version floors, dependency limits,
naming and copy rules, platform requirements — one line each, with exact
values copied verbatim from the spec. Every task's requirements implicitly
include this section.]

## Review Focus

[The five input classes or failure modes the spec implies but no task's
tests exercise that are most likely to bite a person using this software
— one line each, naming the input or condition and the behavior a
reasonable person would expect, most likely first. The spec is a vision
document: it says what the software must do, not everything it will
meet, and its silence on an input is not permission for that input to
break the program. Write the list here, once, with the spec in front of
you. Then, for each line, add the test that pins it to the task that
owns the code, in that task's own step style.]

---
```

### 5.7 任务结构（Task Structure）

````markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Interfaces:**
- Consumes: [what this task uses from earlier tasks — exact signatures]
- Produces: [what later tasks rely on — exact function names, parameter
  and return types. A task's implementer sees only their own task; this
  block is how they learn the names and types neighboring tasks use.]

- [ ] **Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Implement `function(input: InputType) -> ResultType` in `exact/path/to/file.py`**

One line on the approach when the signature and the test leave a choice
(which library call, which data structure); a code block only for an
algorithm they do not determine.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

### 5.8 一个步骤里装什么（What a Step Contains）

当实现者能从一个步骤里写出**恰好一件**合理的东西时，这个步骤就合格了。**这就是全部要求：不含糊，而不是完整。** 每一类步骤只携带让它不含糊的东西，不多带：

- **测试步骤：** 测试的名字和它的断言，以代码形式给出，里面带上 spec 的确切取值。
- **代码步骤：** 确切的签名（名字、参数、返回类型）、它所在的文件、以及 spec 钉死的具体取值。函数体由实现者写。只有当签名和测试都定不了算法时（或 spec 固定了要逐字照抄的文本时），才出现函数体。
- **验证步骤：** 要跑的命令，以及什么输出代表通过。
- **对另一个任务的引用：** 那个任务的 Interfaces 块说了该用什么；计划不重复那个任务的代码。

**计划是实现者无法独自做出的那批决定。** 一份比它描述的代码还长的计划，等于替他把代码写了。而不做任何决定的句子（“TBD”、“处理边界情况”、“加上适当的校验”、“为上面这些写测试”，或一个没有任何任务定义的类型/函数）是反方向的失败。两种失败都由自审来抓。

### 5.9 自审（Self-Review）

写完完整计划后，用新鲜的眼光重看 spec，拿计划对着它检查。**这是你自己跑的清单——不是派子智能体。**

1. **spec 覆盖：** 略读 spec 的每一节、每一条需求。你能指出一个实现它的任务吗？把缺口都列出来。
2. **步骤扫描：** 每个步骤都必须让实现者能写出恰好一件合理的东西，也不能多带：一句什么都不决定的话是缺口；一个签名和测试已经决定了的函数体是抄写。两种都修掉。
3. **类型一致性：** 你在后面任务里用到的类型、方法签名、属性名，和你在前面任务里定义的一致吗？第 3 个任务里叫 `clearLayers()`、第 7 个任务里叫 `clearFullLayers()`，这是 bug。
4. **Review Focus：** 对 spec 暗示的每一类输入或失败模式，有没有一个任务的测试覆盖它？最可能咬到使用者的那五个未覆盖项写进 Review Focus 一节，每一项的测试加到拥有该代码的那个任务里。**这一节是空的，意味着你查过了、没找到，不代表你跳过了这项检查。**
5. **比例：** 把计划的长度和 spec 比一比。比它实现的 spec 长出好几倍的计划，是程序的抄本，不是计划。如果代码块占了文档的大部分，就把函数体换成签名、测试名和断言，再检查每个步骤是否仍然不含糊。

发现问题就地修掉。不需要再审一遍——改完就走。如果发现某条 spec 需求没有对应任务，把任务加上。

### 5.10 执行交接（Execution Handoff）

保存并自审完计划之后，把链接给人类搭档读。如果他**已经明确给出过**执行方式，就请他审阅计划并确认它抓住了他想要的东西；在实现之前等这次审阅，然后用那个已保存的方式。否则，请他审阅计划，并在实现之前选定执行方式。

**当还没有提供执行方式时：**

> 译文：「计划已完成，保存到 `docs/superpowers/plans/<filename>.md`。请审阅这份计划。你更想用哪种执行方式？
>
> - **子智能体驱动（Subagent-driven）**——每个任务由一个全新的子智能体实现，下一个任务开始前由一个全新的评审者检查，最后再做一次整分支评审。最彻底；代价是每个任务、每次评审都吃一份全新上下文。
> - **原生（Native）**——我在当前会话里亲手实现每一个任务，按这个 Harness 运行工作的方式来做，最后让一位跑在最强模型上的全新评审者检查整个分支。最便宜、最快；在结束之前没有独立评审。配合中档的会话模型也能跑得好，因为设计都装在计划里。
>
> 对这份计划我推荐 <两者之一>，因为 <一句话，来自计划本身：任务之间对彼此接口的依赖有多重、任务有多少个、上线后出错要付多大代价>。这份计划抓住了你想要的东西吗？我们该用哪种方式？」

原文见 `writing-plans/SKILL.md:187–194`（较长，不重复粘贴）。

**当已经提供了执行方式时：**

> 译文：「计划已完成，保存到 `docs/superpowers/plans/<filename>.md`。请审阅这份计划。它抓住了你想要的东西吗？」

原文见 `writing-plans/SKILL.md:196–198`。

**如果选了子智能体驱动：**

- **必需子技能：** 使用 superpowers:subagent-driven-development

**如果选了原生：**

- **必需子技能：** 使用 superpowers:executing-plans
