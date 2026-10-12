## 29 prototype

> 译自 `reference/mattpocock-skills/skills/engineering/prototype/SKILL.md`（原文 26 行）。frontmatter 按原样保留。

**frontmatter**

- `name`: `prototype`
- `description`: `Build a throwaway prototype to answer a design question. Use when the user wants to sanity-check whether a state model or logic feels right, or explore what a UI should look like.`（构建一个一次性原型来回答一个设计问题。在用户想要粗略验证一个状态模型或逻辑感觉对不对，或探索某个 UI 应该长什么样时使用。）

### 29.1 原型（Prototype）

原型是**回答一个问题的一次性代码（`throwaway code`）**。问题决定形状。

#### 29.1.1 选一个分支（Pick a branch）

判断正在被回答的是哪个问题，依据用户的提示词、周边的代码，或者如果用户在就问他：

- **「这段逻辑 / 状态模型感觉对吗？」** → [LOGIC.md](../../../reference/mattpocock-skills/skills/engineering/prototype/LOGIC.md)。构建一个可分享的单一 HTML 文件（自由操作按钮加上分标签的引导式走查），把状态机推过那些在纸面上难以推理的情形，并且非开发者也能驱动它。
- **「它应该长什么样？」** → [UI.md](../../../reference/mattpocock-skills/skills/engineering/prototype/UI.md)。在单一路由上生成几个截然不同的 UI 变体，通过 URL search param 和一条浮动底栏切换。

两个分支产出的产物非常不同，所以选错会浪费掉整个原型。如果问题确实含糊且联系不上用户，就默认选与周边代码更匹配的那个分支（后端模块 → 逻辑；页面或组件 → UI），并在原型顶部说明这个假设。

#### 29.1.2 两者都适用的规则（Rules that apply to both）

1. **从第一天起就是一次性的，并明确标记为一次性。** 把原型代码放在它实际会被用到的地方附近（在它为之做原型的模块或页面旁边），让上下文一目了然，但命名要让随便一个读者都能看出这是原型，不是生产代码。对于一次性的 UI 路由，遵守项目已有的路由约定；不要发明一个新的顶层结构。
2. **运行起来轻而易举。** 一个 UI 原型从项目任务运行器里的一条命令启动：`pnpm <name>`、`python <path>`、`bun <path>` 等。一个逻辑演示是用户双击打开的单一 HTML 文件。无论哪种，启动它都不需要动脑。
3. **默认不做持久化。** 状态活在内存里。持久化是原型正在 _检验_ 的东西，不是它应当依赖的东西。如果问题明确涉及数据库，就打一个临时 DB 或一个本地文件，用明确的「PROTOTYPE, wipe me」命名。
4. **跳过打磨。** 不要测试，不要超出让原型 _可运行_ 所需的错误处理，不要抽象。重点是把某件事快速学明白。
5. **把状态摆出来。** 每个动作之后（逻辑）或每次变体切换时（UI），打印或渲染完整的相关状态，让用户看到什么变了。
6. **做完后捕获它。** 把任何已被验证的决策折进真实代码，然后把原型本身作为一份**一手来源（`primary source`）**捕获：把它提交到一个一次性分支，走出 main，并在实现 issue 上留一条指向该分支的上下文指针。也把答案捕获下来（结论以及它解决的那个问题）写进 issue 或一次提交。main 分支只保留已被验证的决策。
