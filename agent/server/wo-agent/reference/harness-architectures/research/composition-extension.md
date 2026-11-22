# 组合层与扩展机制研究

面向地图 `harness-evolution` 的票 04。只记录一手来源中的事实与可选项，不替后续 HITL 票做取舍。结论视图见 [composition-extension 卡片](../composition-extension.md)。参考实现钉在 dsh `0a53fb55be`、pi-agent `853a80d26`，路径均相对各自仓库根。

## 事实速览

- dsh 的扩展是**细粒度、可逆、按依赖注入的服务图**：插件向共享 `ctx` 提供 service、注册类型化事件、安装可逆 effect；profile / bundle / patch 是配置层；preset 是每会话的组合；scope 是每 agent 的可见性与生命周期。
- pi 的扩展是**粗粒度、按会话绑定的模块注入**：一个 TypeScript 模块拿到 `ExtensionAPI`，注册工具、命令、UI 与事件处理器；隔离靠会话切换时销毁并重建扩展实例，而不是注册表分层；撤销靠 `/reload` 或会话替换，而不是逐条 disposer。
- wo-agent 当前是**静态能力列表 + 固定槽位**：`Capability.mount(ctx)` 只往 `tools` / `skills` / `system_prompt` / `compaction` 写；没有 disposer、扩展点事件、按会话作用域、命名 preset 或组合期校验。
- 两种参考的共同点：核心循环本身不带业务；能力通过注册进入注册表；系统提示词由活注册表在每次请求前组装。
- 两种参考的分歧不在「是否可扩展」，而在**扩展的生命周期粒度**（dsh 到单条注册，pi 到单次扩展实例/会话）与**组合是否数据化**（dsh 是配置树，pi 是代码模块）。

---

## 1. 两种扩展哲学的根本差异

### 1.1 dsh：一切皆插件，注册即 effect

`docs/architecture.md` 的定义：

- 每个部件都是插件，包括模型适配器、工具注册表、session 日志与 agent 循环本身，因此都能从配置替换。
- 「没有可打补丁的特权核心」：扩展方式是在其他插件旁边再挂一个插件；注册是 effect，插件卸载时自动回卷。
- 运行中的 `dsh` 是启动时按有序层组合出的插件树：profile 列出 bundle，bundle 是配置行及其挂载代码的分发格式，patch 按 id 替换整行或插入新行。
- 扩展点按领域划分：session 事件是可重放的事实；`agent/*` 事件承载在途工作；capability 事件（`fs/*`、`tools/*`、`telemetry/*`）把策略挂到接缝上。

`docs/cordis-primer.md` 把机制压成五条：

1. 插件是对象/函数，实现 `apply(ctx)` 或 service 子类；
2. context 是 service 仓库，service 占据稳定的 `ctx.<key>`（`ctx.tools`、`ctx.llm`、`ctx.sessions`）；
3. 依赖用 `inject` 声明，加载顺序由「等所需 service 出现」表达，而不是手工排序；
4. 类型化事件用 `emit` / `waterfall` / `parallel` / `serial` / `bail` 五种派发语义；
5. 注册通过 `ctx.effect()` / `ctx.on()` 安装，重载与拆卸可预测地回卷。

因此 dsh 的组合层解决的是**拓扑与生命周期**问题：谁依赖谁、注册何时生效、卸载按什么顺序回卷、同一进程里多个 agent 如何看到不同的组合。

### 1.2 pi：核心克制，扩展是一个完整的宿主侧模块

`pi-agent/packages/coding-agent/README.md` 的 Philosophy：

- 「Pi is aggressively extensible so it doesn't have to dictate your workflow」：其他工具内置的功能，可以用扩展、skills 或第三方 pi package 实现，核心保持最小。
- 明确不做 MCP、子 agent、权限弹窗、plan mode、内置 todo、后台 bash。理由分别是：用带 README 的 CLI 工具或扩展加 MCP；用 tmux / 扩展 / 包；在容器里跑或自己写确认流；把计划写进文件；用 TODO.md；用 tmux。
- 扩展与 skill 都运行在用户完整权限下，第三方包需要自行审查源码。

`docs/extensions.md` 显示的扩展面非常宽：`registerTool`、`on(...)` 三十余个事件、`registerCommand`、`registerShortcut`、`registerFlag`、UI 组件、消息/条目渲染器、provider 注册、跨扩展 `pi.events`。一个扩展是 `export default function (pi: ExtensionAPI)`，由 jiti 直接加载 TypeScript，无需编译。

pi 的组合层解决的是**作者体验与行为覆盖**问题：在不改核心的前提下，尽可能多地替换工具、事件、UI 与 provider。它不提供注册表分层，也不提供按 agent 的注册隔离。

### 1.3 wo-agent：组合是启动时的一次函数调用

`src/compose/compose.py` 的 `ComposeContext` 只有固定字段：`tools`、`skills`、`system_prompt`、`compaction`、`commands`。`compose(*capabilities)` 新建上下文，按参数顺序调用每个 `mount(ctx)`，返回填好的上下文。循环只消费这三个字段（`ctx.tools`、`ctx.system_prompt`、`ctx.compaction`），不参与选择。`docs/compose.md` 与根 `CLAUDE.md` 都把这个边界写成设计约束。

### 1.4 差异对照

| 维度 | dsh | pi | wo-agent |
|---|---|---|---|
| 扩展单位 | 插件 + 单条注册（effect） | 整个扩展模块 + 会话 | Capability 对象 |
| 依赖表达 | `inject` service key | 扩展加载顺序 | 无，靠 `compose()` 参数顺序 |
| 撤销粒度 | 单条注册的 disposer | `/reload` 或会话替换重建整个扩展实例 | 无 |
| 组合是否数据化 | 是，profile / bundle / patch 配置树 | 部分，settings / packages 列表 | 否，宿主代码里的列表 |
| 每会话隔离 | scope key + 父链 + `isolate` realm | 会话替换时重绑扩展实例 | 无，一个 ctx 可跨会话替换复用 |
| 事件 | 类型化、五种派发模式、按 scope 过滤 | 三十余个具名事件，逐事件定制合并语义 | 只有持久 session 事件，没有扩展点事件 |
| 核心是否可替换 | 是，循环与注册表都是插件 | 否，扩展围绕既有核心 | 循环固定为 `ReactLoopAgent`，能力可换 |

---

## 2. dsh 侧事实

### 2.1 可逆 effect 与事件

- `docs/cordis-api/inherited.md`：`ctx.on / ctx.once` 注册监听器并返回 disposable；`ctx.effect` 注册与 fiber 绑定的可释放副作用；`ctx.emit / parallel / serial / bail / waterfall` 是五种派发。
- `docs/cordis-primer.md`：waterfall 是 around-middleware，监听器收到 `(...args, next)`；调用 `next()` 委托，返回而不调用则短路；只想观察的监听器必须委托，拥有决策的可以短路。
- `docs/architecture.md`：`agent/pre-step`、`agent/request`、`llm/stream`、`tools/pre-execute`、`tools/execute`、`tools/post-execute` 是 waterfall；`agent/turn-stopping` 是 serial，没有 `next()`。
- `docs/subsystems/tools.md`：`ctx.tools.register()` 返回精确的 disposer；`restrict()`、`guard()` 同样返回 disposer；`ToolGuard` 只能拒绝，不能放行（单调）。
- `packages/core/agent/src/index.ts`：`AgentRegistry.setFactory()` 返回清理槽位的 disposer；`ctx.effect(function* () { yield () => this.disposeInitiators() })` 把生命周期挂在 fiber 上；`AgentHandle.dispose()` 依次停循环、等退出、注销 agent、移除 session、展开 scoped world。
- `packages/core/agent/src/types.ts` 的 `Agent.ctx`：agent 作用域上下文，贡献是 agent-local 的，随 disposal 回卷，disposal 后拒绝注册。

### 2.2 profile / bundle / patch 分层

- `docs/architecture.md`：层顺序是 profile 列出的每个 bundle（按列出顺序）→ profile 的 `cordis.patch.yml` → home 级 patch → `--patch` 覆盖层。patch 按 id 命中一行，替换整行 config 或插入新行。
- `packages/boot/app-boot/README.md`：profile 位于 `$DSH_HOME/profiles/<name>`，组合 bundle、自己的 patch 与 `patchReload: live | startup`。`web` 是 live，`headless` / `sdk` / `sdk-minimal` / `acp` 只在启动时应用，因为一次性或 stdio 应用在拥有工作后替换依赖会破坏生命周期。
- 同一 README：patch **不做深合并**，要保留的字段必须重述；命中不到行的 patch 打 warning；空 patch 文件会让启动失败，应写 `[]` 关闭该层。
- `packages/boot/app-boot/README.md` 的失败语义：启动失败是一条带标签的行加非零退出，指出失败的插件与阶段，不是静默挂起或裸栈。

### 2.3 agent preset：每会话组合

`packages/preset/agent-presets/README.md`：

- 一个 preset 是一个目录，内含 `agent.cordis.yml`，列出该会话运行的插件；会话因此得到自己的工具、提示词段与 skills，其他会话不受影响，一个进程可同时跑多个不同组合的 agent。
- roster 来源：包内 `presets/`（system root，前置且同 id 胜出）与 `<dshHome>/.agent-presets`（user root，后置）；也可配置 `roots` 与 `trust`。`default` 是必填的默认 preset id。
- 子 agent 通过 `composeFrom(agentCtx, parentCtx)` 加入父 agent 的**同一代** standing composition，而不是按 id 重新解析；否则父 agent 运行期间文件被改，子 agent 会拿到不同代。
- 每个 preset 每进程只挂一次 standing mount；agent 通过把 scope key 的父指向该 mount 来加入，于是 mount 的注册与监听覆盖所有加入者，且不覆盖兄弟 preset。
- 组合文件是输入，不是持久化目标；mounted subtree 的 `write()` 被覆写为 no-op。
- 只有**尚未产生任何消息或工具调用**的会话能切换 preset；切换会重链父 scope 并写 `agent-preset/selected` 事件，恢复/分叉时按记录重建。
- 健康检查在发现阶段完成：缺失、不可解析、不是命名行列表、模块不可解析都会列为 broken 并给出原因；组合被拒绝，不会半装配。挂载审计还会拒绝三类：未加 scope 的目标（会全局注册）、永远等不到 service 的行、把 service 发布到 root realm 的行。
- 已知上限（同一 README）：对外部可写根的 preset 可见但不可删；会话一旦有产出不能换 preset；代数只按组合文件 mtime/size 判定，改旁边 skill 文件不触发新代；被取代的代不会回收，skill watcher 会一直存活到进程结束；复制出来的 preset 是快照，升级不会更新它。
- 注意同名概念：dsh 还有 `permission presets`（`docs/subsystems/permission-presets.md`），它把 sandbox mode 与 approval policy 两个开关打包成一个命名选项，是独立可选能力，不负责插件组合；本票讨论的是 agent preset。

### 2.4 scope / isolate：按 agent 的注册可见性

`docs/subsystems/scope.md` 与 `packages/core/scope/README.md`：

- `ScopeKey` 是不透明对象标识；`Scoped<T>` 是编译期品牌，只表示事件路由接收者，不暴露 subject 属性。
- `createScope(ctx, key)` 铸造注册作用域；通过它注册的东西只在该 scope 可见，scope 释放时回卷。
- `ScopedLayers<L>` 持有 eager 全局层与惰性 exact-scope 层；读取不创建层；`merge()` 先全局后 scoped shadow。
- parent chain 一个关系两个方向：**注册视图沿链向下继承**（子 scope 看见祖先层），**事件准入沿链向上扩展**（挂在祖先 key 上的监听器能收到后代事件），反向不成立。
- 绑定一次；已有 parent 的 key 再绑会抛错；只有返回的 binding 能重链；拒绝环。
- 限制：只有 scope-aware 的 API 才会隔离状态；任意 Cordis service 即使从 scoped context 调用仍是 context-global。一个 context 只带一个最近的 scope key，不支持多重成员。

`docs/subsystems/skills.md` 和 `tools.md` 展示了落地方式：registry 是 host + per-scope 分层，注册按调用 context 的 scope 归档；preset 的 standing mount 是父 scope，所以 preset 注册的行进入该 preset 的层；读取时合并全局层与查看 scope 的链。

### 2.5 「无特权核心」如何成立

- 事实基础是 service key 间接寻址：插件不 import 具体实现，按 `ctx.<key>` 查找（`docs/cordis-primer.md`）。因此模型适配器、工具注册表、session 日志、agent 循环都能被另一行配置替换。
- `docs/subsystems/core.md`：`agent-loop` 是默认驱动，扩展插件依赖 `agent` 接口而**不依赖 `agent-loop`**，所以循环保持可替换；`scope/` 是无 service 的库，放在 session/system-prompt 之下避免环。
- `packages/preset/agent-presets/presets/standard/agent.cordis.yml` 的注释把边界写得更直接：preset 文件是 agent-plane 组合，host 组合保留注册表、sandbox/approval、持久化与模型路由；preset 里发布 service 的行必须放在带 `isolate` 的 group 里，否则会发布到 root realm，被挂载审计拒绝。
- 结论：dsh 的「core」是**默认组合**，不是权限层。它可以被替换，但默认组合仍是所有 bundle 共享的第一层（`dsh-base`）。

### 2.6 dsh 侧的成本证据

`packages/preset/agent-presets/README.md` 的 Known Limitations 直接列出规模成本：每代 standing mount 不回收、每代可能有活 watcher、root 扫描不 watch 但每次 `list()` 都读盘、copy 是快照会漂移、健康检查只证明「可解析且模块存在」不证明「能 import/apply」。这些成本只有在多 preset、多贡献者的生态里才有回报。

---

## 3. pi 侧事实

### 3.1 扩展模型

`pi-agent/packages/coding-agent/docs/extensions.md` 与 `src/core/extensions/`：

- 扩展是默认导出工厂，接收 `ExtensionAPI`；可同步或异步，异步工厂会被 await 到启动继续之前。加载用 jiti，TypeScript 无需编译。
- 发现位置：`~/.pi/agent/extensions/*.ts`、`~/.pi/agent/extensions/*/index.ts`、`.pi/extensions/*.ts`、`.pi/extensions/*/index.ts`；项目本地扩展在项目被 trust 之后才加载。也可在 `settings.json` 的 `extensions` / `packages` 增加路径。
- `Extension` 对象持有 `handlers: Map<string, HandlerFn[]>`、`tools: Map<string, RegisteredTool>`、`commands`、`flags`、`shortcuts`、渲染器映射（`src/core/extensions/types.ts`）。
- `registerTool` 在扩展加载期与启动后都可用；启动后注册会立即刷新，模型下一次请求即可调用，无需 `/reload`。`setActiveTools()` 在运行时启停工具（包括动态注册的）。
- 同名工具：runner 的 `getAllTools()` 注释说明「first registration per name wins」；单个扩展内 `registerTool` 写同一个 map，后注册覆盖前注册。
- 扩展可覆盖内置工具（`read`、`bash`、`edit` 等）；交互模式会给出警告。渲染器按槽位独立继承。
- `src/core/extensions/wrapper.ts`：把扩展注册的 `RegisteredTool` 包成 agent-core 的 `AgentTool`，执行时用 `runner.createContext()` 保证工具与事件处理器共享同一份上下文；执行前后比较 active tool 集合，把新增的工具名记到结果的 `addedToolNames`，供动态加载使用。

### 3.2 生命周期与隔离

- `docs/extensions.md` 的 startup 时序：`project_trust` → `session_start {reason:"startup"}` → `resources_discover`。会话替换（`/new`、`/resume`、`/fork`、`/clone`）时：`session_before_*` → `session_shutdown` → 重载并重绑扩展 → 新的 `session_start`。
- 因此 pi 的「每会话隔离」是**重新实例化整个扩展集合**，不是注册表分层。旧实例的 `pi` / `ctx` 在替换后失效并抛错（`src/core/extensions/loader.ts` 的 stale message）。
- `ctx.reload()` 走同一重载流程：当前扩展先 `session_shutdown`，资源重载，再 `session_start {reason:"reload"}`；当前命令处理器继续在旧调用帧执行，之后的调用使用新版本。
- 没有逐注册 disposer：`on()` 没有取消订阅返回值；`registerTool` 没有 unregister；只有 `unregisterProvider` 存在。撤销的单位是扩展实例或整个重载。
- 多会话能力由 `createAgentSessionRuntime()` / `AgentSessionRuntime` 提供（README Programmatic Usage），但扩展仍是按会话运行时绑定。

### 3.3 事件语义

`src/core/extensions/runner.ts` 与 `docs/extensions.md`：

- 事件按扩展加载顺序遍历；每个事件有自己的合并语义，不是统一派发框架。
- `context`：传入一份深拷贝的 messages，处理器返回 `{ messages }` 替换，供下一次 LLM 调用。
- `tool_call`：在工具执行前触发；`event.input` 可就地修改，后续处理器能看到前面的修改；返回 `{ block: true, reason?, terminate? }` 阻断。处理器抛错会阻断工具（fail-safe）。
- `tool_result`：链式中间件，按加载顺序，返回 `content` / `details` / `isError` / `usage` 的局部补丁，未写字段保留原值。
- `message_end`：可返回替换后的消息，但 role 必须相同。
- `before_agent_start`：可注入一条持久消息，并替换本轮系统提示词；`event.systemPrompt` 在处理器之间链式传递。
- `before_provider_request` / `before_provider_headers` / `after_provider_response`：分别可替换 provider payload、改请求头、观察响应。
- 一般事件处理器抛错会被 `emitError` 记录并继续；`tool_call` 是例外，错误会阻断。
- 扩展之间还有 `pi.events` 共享 event bus，随意命名。

### 3.4 skills 与 resource loader

`src/core/skills.ts`：

- 发现规则：目录里有 `SKILL.md` 就视为 skill root，不再向下递归；否则加载根目录直接的 `.md`；再递归子目录找 `SKILL.md`。支持 `.gitignore` / `.ignore` / `.fdignore`，跳过隐藏目录与 `node_modules`。
- 校验：name 最长 64、只允许小写 a-z/0-9/hyphen、不能首尾 hyphen、不能连续 hyphen；description 必填且最长 1024。缺 description 的 skill 不加载；其他 warning 仍加载。
- 同名冲突产生 `ResourceDiagnostic` 的 `collision`，记录 winner/loser 路径；符号链接同一文件去重。
- `formatSkillsForPrompt()` 把可见 skill 以 XML `<available_skills>` 放进系统提示词，并明确告诉模型「用 read 工具在任务匹配时加载 skill 文件」；`disable-model-invocation: true` 的 skill 不进提示词，只能显式 `/skill:name` 调用。
- `resources_discover` 让扩展追加 `skillPaths` / `promptPaths` / `themePaths`；`resource-loader.ts` 汇总扩展、skills、prompts、themes、AGENTS 文件与系统提示词，并提供 `reload()`。

### 3.5 为什么核心不带 MCP / 子 agent / 权限弹窗

`README.md` 的 Philosophy 给出的理由是**把可变的产品决策留给扩展和外部工具**：

- 无 MCP：用带 README 的 CLI 工具（Skills），或写一个加 MCP 的扩展；链接到作者解释「为什么不需要 MCP」的文章。
- 无子 agent：做法很多，可用 tmux 起 pi 实例、用扩展自己写，或装一个按自己方式实现的包。
- 无权限弹窗：在容器里运行，或用扩展按自己的环境与安全要求写确认流。
- 无 plan mode / 内置 todo / 后台 bash：分别用文件、TODO.md、tmux。

这是产品哲学，不是架构能力缺失：扩展事件已经足以实现权限门（`tool_call`）、路径保护、git checkpoint、自定义压缩、子 agent（示例 `subagent/`）等。

### 3.6 pi 侧的成本与边界

- 扩展有完整系统权限，没有沙箱；安全模型是「只装信任来源」+ 项目 trust。
- 扩展 API 面很宽，事件语义逐事件定制，学习和维护成本集中在核心团队；第三方扩展可以依赖大量内部形状（工具 result shape、TUI 组件）。
- 没有细粒度卸载，重载是全局的；扩展状态要靠 `session_start` 从 session 重建（`pi.appendEntry` / tool result `details`）。
- 会话替换后的旧 `ctx` 失效，`withSession` 里只能用新 ctx；文档专门列了 footgun。

---

## 4. wo-agent 现状

### 4.1 compose 与 Capability

`src/compose/compose.py`：

- `ComposeContext` 在构造时创建 `RegistryToolExecutor`、`SkillRegistry`、`SystemPromptRegistry`，`compaction = None`，`commands = None`。
- `Capability` 是只有 `mount(ctx) -> None` 的 Protocol。
- `compose(*capabilities, commands=None)` 顺序 `mount`，返回 ctx；没有返回值收集、没有错误包装、没有卸载。
- `docs/compose.md` 明确这是 dsh 组合层思想的缩小版：`mount` 对应 `apply(ctx)`，`compose` 对应按名单 apply；不引入 Cordis / profile yaml。

### 4.2 注册表能力

- `src/tools/executor.py`：`RegistryToolExecutor.register(tool)` 直接 `self._tools[tool.name] = tool`，同名静默覆盖，没有 unregister；`add_guard()` 追加 guard，`ToolGuard` 只能拒绝（与 dsh 的单调 guard 一致）。
- `src/system_prompt/registry.py`：`section()` 遇到同名抛 `ValueError`；按 `order` 升序、同 order 按注册序拼接；没有移除。
- `src/skill/registry.py`：`add_provider()` 追加；同名 skill 先注册的 provider 胜出；没有移除。
- `src/compaction/capability.py`：直接赋值 `ctx.compaction = engine`；单槽，后挂覆盖先挂。
- `src/skill/capability.py`：挂 filesystem provider、注册 `skill` 工具、往系统提示词加 `skill:catalog` 段；catalog 是 lambda，每步 `assemble()` 时重新求值。
- `src/skill/filesystem.py`：只扫描目录第一层的 `*.md` / `*.md.txt`，按 frontmatter `name` 或文件名取 id；非法名或重复名静默跳过，没有 diagnostics。

### 4.3 宿主组装

- `cli/boot.py`：`boot()` 里硬编码 capability 列表：`SystemPromptCapability`、`AgentsMdCapability`、`SkillCapability(SKILLS_DIR)`、`WorkspaceCapability`、`BashCapability`，可选 `SearchCapability`，最后 `CompactionCapability`；`compose(*capabilities, commands=commands)`；随后 `ctx.tools = wrap_tools(...)` 包一层观察器，再构造 `ReactLoopAgent`。
- `Booted.replace_session()`：换会话时复用同一个 `ctx`，只重建 agent。也就是说组合生命周期长于会话生命周期。
- `examples/demo_agent.py`：另一份硬编码列表，少了 `AgentsMdCapability` 与 `SearchCapability`。两份列表事实上就是「代码里的 preset」。
- `src/agent/loop.py`：循环直接调用 `self._provider.stream()`、`self._tools.execute()`、`self._compaction.compact_if_needed()`；唯一的回调是 `on_chunk`（流式块观察），没有请求前/工具前/工具后的拦截点。

### 4.4 边界清单

当前 `compose/` 明确没有：

- **disposer / 卸载**：任何注册都无法撤销；`compose` 没有 dispose。
- **扩展点事件**：只有 session 的持久事件日志（append-only），没有可注册的 live 事件；`on_chunk` 是构造参数，不是可组合的监听器。
- **按会话 / 按 agent 作用域**：一个 ctx 可被 `replace_session` 跨会话复用；没有 scoped layers、父链或 isolate。
- **preset**：没有命名组合、默认 preset、从文件发现、健康检查或切换。
- **依赖声明**：没有 `inject` / `requires`；顺序完全由调用方参数决定。
- **组合期校验**：同名工具静默覆盖、同名 prompt 段抛裸 `ValueError`、skill 冲突静默跳过；没有汇总 diagnostics，也没有部分挂载失败的回滚。
- **热重载**：能力集合只在进程启动时确定；skill 内容因为每次 assemble 重新扫目录而近似实时，但工具/提示词段/能力集合不行。

### 4.5 已有的相近机制

- `ToolGuard` 已经是 dsh 工具守卫的单调拒绝版本；`RegistryToolExecutor` 已经有「注册表 → 守卫 → 解析 → 执行 → 错误转结果」的管线。
- `SystemPromptRegistry` 已经是有序段注册表，`order` 与同名检查已经具备最小元数据。
- `SkillRegistry` 已经是 provider 合并 + 先注册胜出，接近 dsh 的 rank/顺序的简化版。
- `Session` 是 append-only 事件日志，`derive_messages()` 派生模型历史，和 dsh 的 session 事件溯源同构；这是「持久事件」而不是「扩展事件」，两者不要混为一谈。

---

## 5. 候选机制清单

依赖关系先列出来，便于后续票排顺序：

```text
disposer ──┬─> 组合期校验的回滚
           ├─> 热重载 / 运行期换能力
           └─> 按 agent 作用域的释放
显式依赖 ──┬─> preset 的可校验组合
           └─> 组合期 diagnostics
extension 事件 ──> 工具前/后拦截、请求改写
preset ──> profile / patch 分层
```

### 5.1 可逆注册 / 卸载

- **dsh 事实**：`ctx.effect()` / `ctx.on()` 返回 disposer；`ctx.tools.register()` / `restrict()` / `guard()` 返回精确 disposer；`AgentHandle.dispose()` 按「停循环 → 等退出 → 注销 → 移除 session → 展开 scope」顺序释放（`docs/cordis-primer.md`、`docs/subsystems/tools.md`、`packages/core/agent/src/index.ts`）。
- **pi 事实**：没有逐注册 disposer；`on()` 与 `registerTool()` 都不返回撤销句柄；撤销单位是扩展实例或 `/reload`（`src/core/extensions/loader.ts`、`docs/extensions.md`）。
- **wo-agent 现状**：无。
- **前置依赖**：各注册表能返回 undo 闭包；`ComposeContext` 持有释放栈；`Capability.mount()` 允许返回 disposer 或接受 `ctx.on_dispose()`。同名注册的语义要先定：覆盖、拒绝还是按 token 区分。
- **改动面**：`src/compose/compose.py`、`src/tools/executor.py`、`src/system_prompt/registry.py`、`src/skill/registry.py`、`src/compaction/capability.py`；`src/agent/loop.py` 不需要改，因为循环只读槽位。
- **最小验收**：`compose(A(), B())` 后 `dispose()` 使 `tools.schemas() == []`、`system_prompt.assemble() == ""`、`skills.list() == []`、`compaction is None`；释放按 LIFO；重复 dispose 幂等；同名工具注册两次后释放第一条不会删掉第二条（或按选定语义报错）。
- **规模判断**：**不依赖插件生态**。测试隔离、宿主换能力、会话替换、失败回滚都立即受益，成本低。属于最值得先做的一档。

### 5.2 扩展点事件

- **dsh 事实**：事件按领域分三类；五种派发模式；waterfall 必须 `next()` 委托；`agent/pre-step` 可拒绝或改写进入 step 的消息；`agent/request` 可替换冻结的调用配置；`tools/pre-execute` / `execute` / `post-execute` 是工具管线；`agent/turn-stopping` 是 serial（`docs/architecture.md`、`docs/subsystems/core.md`、`docs/subsystems/tools.md`）。
- **pi 事实**：三十余个具名事件，逐事件定制合并语义；按扩展加载顺序；`tool_call` 可阻断、`tool_result` 可打补丁、`context` 可替换消息、`message_end` 可替换消息、`before_agent_start` 可改系统提示词；错误一般记录后继续，`tool_call` 错误阻断（`docs/extensions.md`、`src/core/extensions/runner.ts`）。
- **wo-agent 现状**：无 live 事件；只有 append-only session 事件与 `on_chunk` 观察回调。
- **前置依赖**：一个最小派发原语（同步/异步、注册顺序、返回值合并规则）；事件类型与 payload；循环中确定的调用点。若只做观察，前置很少；若做拦截/waterfall，需要决策类型与短路语义。
- **改动面**：新增 `src/events/`（或 `src/compose/events.py`）；`src/agent/loop.py` 在 `_run_turn` / `_run_step` 插入 pre-step、request、tool pre/post；`src/tools/executor.py` 可能要把守卫与事件统一；`src/compose/compose.py` 暴露 dispatcher 或挂到 ctx。
- **最小验收**：零监听器时请求字节与当前一致；观察者能收到 pre-step / request / tool 事件且顺序稳定；`tool/pre-execute` 的 deny 产生 `is_error` 结果且工具不执行；request 监听器能替换 model / max_tokens 等调用配置（messages 仍由 pre-step 决定，不能借 request 偷改模型可见内容）。
- **规模判断**：**部分回本**。两三个接缝对学习型 harness 有价值，也与 dsh 对齐；但完整五种派发、类型化事件目录、按 scope 过滤属于大规模生态成本，单宿主不需要。建议后续票只讨论「emit + 一个 waterfall」的最小集。

### 5.3 preset 组合

- **dsh 事实**：preset 是目录 + `agent.cordis.yml`；roster 有 shipped/user 根与 trust；`default` 必需；per-process standing mount；agent 以 scope 父链加入；子 agent 用 `composeFrom` 加入同一代；只有空白会话能切换；健康检查 + 挂载审计；切换写 session 事件（`packages/preset/agent-presets/README.md`、`docs/subsystems/core.md` 的 `ctx.agentPresets`）。
- **pi 事实**：没有组合级 preset；示例 `preset.ts` 保存的是 model / tools / thinking 选择，不是插件集合；包（pi packages）是分发单位，不是每会话组合（`docs/extensions.md` 示例表、`README.md` Pi Packages）。
- **wo-agent 现状**：只有 `cli/boot.py` 与 `examples/demo_agent.py` 两份硬编码列表。
- **前置依赖**：capability 的稳定 id 与可序列化配置；确定性的组合顺序；（若要文件发现）配置格式与 schema。普通 Python 数据类只需 id + capability 工厂。
- **改动面**：新增 `src/compose/preset.py` 或 `cli/presets.py`；`cli/boot.py` 从 preset 构造列表；`examples/demo_agent.py` 可选复用；`src/agent/loop.py` 不改。
- **最小验收**：两个命名 preset 产生不同工具列表；选择其中一个不影响另一个；未知 capability / preset 名报错并指出名字；同一 preset 两次构造结果一致。
- **规模判断**：**数据类层面立即回本，文件 roster 层面不回本**。命名组合 + 默认值对单宿主有用；shipped/user roots、trust、copy-only authoring、standing mount、generation、切换记录、健康检查都是插件生态成本。wo-agent 已有「组合即代码列表」，把它提成数据对象是低成本改进。

### 5.4 按 agent / 会话作用域

- **dsh 事实**：`ScopeKey` 不透明对象；`createScope`；`ScopedLayers` 全局 + exact-scope 层；父链注册向下继承、事件向上准入；一次绑定；`isolate` realm 让 preset 的 service 私有；只有 scope-aware API 才隔离（`docs/subsystems/scope.md`、`packages/core/scope/README.md`、`docs/subsystems/tools.md`、`docs/subsystems/skills.md`）。
- **pi 事实**：没有 scope 分层；每会话替换时销毁并重建扩展实例，旧 ctx 失效；隔离来自实例边界，不来自注册表（`docs/extensions.md`、`src/core/extensions/loader.ts`）。
- **wo-agent 现状**：一个 `ComposeContext` 可跨 `replace_session` 复用；没有层、父链或隔离。
- **前置依赖**：所有注册表都要 scope-aware（tools、prompt、skills、compaction、事件）；agent 拥有自己的 ctx；disposer 必须先有；scope key 与父链语义要先定。
- **改动面**：`src/compose/*`、`src/tools/executor.py`、`src/system_prompt/registry.py`、`src/skill/registry.py`、`src/agent/loop.py`（消费 per-agent ctx）、`cli/boot.py`（每 agent 组装）。这是所有候选里改动面最大的一项。
- **最小验收**：同一进程两个 agent，A 有 workspace 工具、B 没有；A 的释放不影响 B；全局能力对两者都可见；不存在跨 agent 的注册泄漏。
- **规模判断**：**完整分层与 isolate 只在大规模多 agent / 多租户下回本**。wo-agent 当前一次只跑一个会话（`Booted.replace_session` 顺序替换），不需要分层注册表。如果未来宿主想**并发**跑多个能力集不同的 agent，最小做法是「每个 agent 调一次 `compose()`」，而不是引入 ScopeKey / 父链 / realm；后者属于参考卡片内容。

### 5.5 组合期校验与 diagnostics

- **dsh 事实**：启动失败是一条带标签的行，指出失败插件与阶段；patch 未命中行有 warning；preset 发现阶段把 broken 行列为带原因的 roster 行；挂载审计拒绝未加 scope、等待 service、发布到 root realm 三类；invariant companion 在每次 service 通知时复查（`packages/boot/app-boot/README.md`、`packages/preset/agent-presets/README.md`）。
- **pi 事实**：`ResourceDiagnostic` 汇总 skill / prompt / theme 的 warning 与 collision；扩展加载错误收集在 `LoadExtensionsResult.errors`；快捷键冲突与工具覆盖产生诊断；`settings-diagnostics` 负责设置问题（`src/core/skills.ts`、`src/core/resource-loader.ts`、`src/core/extensions/runner.ts`、`docs/extensions.md`）。
- **wo-agent 现状**：同名 prompt 段抛裸 `ValueError`；同名工具静默覆盖；skill 非法名/冲突静默跳过；没有 diagnostics 容器，也没有部分失败回滚。
- **前置依赖**：注册表返回结构化错误或诊断；compose 能收集；若要「失败即回滚」需要 disposer。
- **改动面**：`src/compose/compose.py`、三个注册表、`cli/boot.py`、可能新增 `src/compose/diagnostics.py`。
- **最小验收**：两个 capability 注册同名工具时，compose 报错并同时指出两个 capability（或返回可枚举的 diagnostics）；非法 skill 路径产生 warning 而不是静默；失败信息包含 capability 名与原因。
- **规模判断**：**不依赖生态，立即回本**。单宿主也会遇到宿主接入时注册冲突；与 disposer 一起做可以顺带获得回滚。

### 5.6 延伸候选（票里未点名，但来源中反复出现）

| 机制 | dsh 依据 | pi 依据 | 前置 / 改动面 | 最小验收 | 规模判断 |
|---|---|---|---|---|---|
| 显式依赖 / `inject` 式排序 | `docs/cordis-primer.md` 的 `inject`；service key 间接寻址 | 无，靠加载顺序 | capability 元数据 + compose 拓扑排序；`src/compose` | 独立 capability 交换参数顺序结果一致；缺依赖时报出双方名字；环检测 | 中等规模（>10 个能力或宿主注入）才明显回本；当前 6 至 7 个能力，参数顺序已够用 |
| profile / bundle / patch | `docs/architecture.md`、`packages/boot/app-boot/README.md` | pi packages（npm/git）分发，无按 id patch | preset + 稳定行 id + 配置 schema + 加载器 | 按 id 替换一行 config 后启动结果改变，其余行不变 | 只有分发与第三方贡献才回本；单宿主过度设计 |
| 热重载 / HMR | profile `patchReload: live`、`ctx.hmr` | `/reload` 重载扩展、skill、prompt、theme、context | disposer + watcher + 稳定 id + 会话重绑 | 改一个 skill 或工具配置后无需重启生效；失败保留上一版 | 对学习型 harness 过度；skills 已因每步重扫而近似实时 |
| 类型化事件目录 / declaration merging | `docs/subsystems/core.md` 的 `…Map → derived-union`；`@mode` 标签 | TypeScript 类型合并 + 运行时无 | TS 专属；Python 可用 Protocol + 注册表近似 | 无对应 Python 等价物 | 不搬；类型目录是 TS 生态成本 |
| 跨扩展事件 bus | Cordis 事件本身 | `pi.events` | 最小 dispatcher | 两个能力互发自定义事件 | 单宿主没有多个独立扩展，收益低 |
| 动态工具激活 / deferred loading | `ctx.tools` 分 scope 可见性 | `setActiveTools()` + Anthropic/OpenAI 原生 deferred schema | 工具 schema 可增删 + 模型侧支持 | 运行中新增工具后下一次请求可见，前缀尽可能稳定 | 工具少时无收益；属于模型 API 优化，不是组合层 |
| skills 资源发现 diagnostics | `docs/subsystems/skills.md` 的 provider 分层、rank、incomplete observation | `SKILL.md` 规则、name/description 校验、collision、ignore 文件、`resources_discover` | `src/skill/filesystem.py` + registry + compose diagnostics | 非法名/冲突/缺失路径产生结构化 warning；同名按 rank/顺序解析 | 立即回本，成本小；不需要 scope 分层 |

---

## 6. 只有大规模插件生态才回本的机制

以下机制在 dsh 中成立，是因为它服务约 60 个包、多 profile、多 preset、第三方 bundle 与长期运行的多 agent 进程。对 wo-agent 这种「单宿主、教学、可控规模 Python 内核」，它们的成本结构不同：

- **profile / bundle / patch 分层**：需要稳定行 id、配置 schema、patch 语义、启动诊断、live/startup 策略。没有第三方分发时，等价物就是 `boot.py` 里的一份列表。
- **preset roster 与信任模型**：shipped/user roots、`trust`、copy-only authoring、默认 preset 设置、broken 行展示。单宿主的 preset 是代码里的常量。
- **standing mount / generation / reclaim**：为同一 preset 的多个会话共享一次挂载；代价是代际不回收与 watcher 存活。wo-agent 一次一个会话，没有共享收益。
- **`isolate` realm 与服务发布审计**：只有多个 preset 在同一进程发布同名 service 时才有意义。
- **完整 scope 父链**：注册向下继承、事件向上准入，是为 preset 挂载 + 子 agent 继承 + 多 agent 并发设计的；单 agent 顺序运行不需要。
- **五种派发模式与类型化事件目录**：`emit` / `waterfall` / `parallel` / `serial` / `bail` 与生成式 catalog 是给几十个插件作者用的公共契约；两三个接缝只需要 `emit` + 一个 `waterfall`。
- **HMR / live patch reload**：需要 watcher、稳定 id、失败保留上一版、会话重绑；重启进程对学习项目更简单。
- **扩展包管理器、信任提示、自动发现**：pi 的 npm/git 安装、项目 trust、自动扫描是生态入口；wo-agent 没有第三方扩展市场。
- **动态工具激活 / deferred schema**：工具数量大到需要按需加载、且模型/provider 支持 deferred 协议时才回本；wo-agent 工具数是个位数。
- **跨扩展 event bus**：只有多个互不认识的扩展需要协作时才有价值。

相对地，以下机制**不依赖生态规模**，单宿主也立即有收益：可逆注册/卸载、组合期校验与 diagnostics、命名 preset 的纯数据形态、最小扩展点事件（观察 + 单点拦截）、skill 发现的 diagnostics。按 agent 作用域处在中间：如果宿主未来并发跑多个能力集不同的 agent，最小 per-agent `compose()` 就够了；完整分层仍不必。

---

## 7. 明确不搬

- **Cordis 运行时本身**：fiber、service store、`ctx.extend` / `ctx.isolate` / `ctx.intercept`、`ctx.effect` 的生成器语义。只借「注册可逆、依赖声明、事件派发」的概念。
- **YAML profile 树与 `!!js` 配置表达式**：profile / bundle / patch 的加载器、`--dump-config`、snapshot replay、live patch watcher。
- **TypeScript 扩展宿主**：jiti 加载、`ExtensionAPI` 的完整面、TUI 组件与渲染器、`ctx.ui`、RPC/ACP 入口、npm/git 包管理器。
- **declaration merging / branded IDs / `…Map → derived-union` 的类型目录生成**：TypeScript 类型系统专属；Python 用 Protocol 与注册表表达，不复制代码生成。
- **`isolate` realm 与 root-realm 审计**：只有在同进程多 preset 发布 service 时才需要。
- **standing mount / generation / 回收、preset 的 copy-only authoring / trust roots / 每用户默认设置**：生态级 roster 功能。
- **pi 的逐事件定制合并语义全集与三十余个事件**：只挑与循环相关的少数接缝，不复制整个事件面。
- **pi 的 TUI 渲染扩展点**（`renderCall` / `renderResult` / `setFooter` / 自定义 editor / overlay）：wo-agent 的 TUI 是产品终端，不是扩展面。
- **热重载与扩展自动发现**：学习项目以重启为默认。

---

## 8. 留给后续 HITL 票的问题

以下只列问题，不做判断：

1. wo-agent 的宿主是否会在一个进程里**并发**运行多个能力集不同的 agent？如果只是顺序替换会话，按 agent 作用域的必要性下降。
2. 扩展点的目标使用者是谁：wo-agent 自己的宿主（Unity / UE / 服务器）还是第三方？前者可以接受 Python 类 + 显式导入，后者才需要 preset 文件、发现与信任。
3. 组合的默认形态是代码常量、Python 数据类，还是配置文件？这决定校验、patch 与热重载的必要性。
4. 失败语义要「启动即失败」还是「收集 diagnostics 后继续」？dsh 与 pi 在不同层分别采用了两种。
5. 是否需要运行期换能力（换工具集 / 换 skill 根），还是重启可接受？这决定 disposer 是仅用于测试与回滚，还是要支撑运行期生命周期。

---

## 来源索引

- dsh 文档：`deepseek-harness/docs/architecture.md`、`docs/cordis-primer.md`、`docs/subsystems/core.md`、`docs/subsystems/scope.md`、`docs/subsystems/tools.md`、`docs/subsystems/skills.md`、`docs/subsystems/permission-presets.md`、`docs/cordis-api/inherited.md`。
- dsh 包：`packages/core/agent/src/index.ts`、`packages/core/agent/src/types.ts`、`packages/core/scope/README.md`、`packages/core/tools/src/index.ts`、`packages/preset/agent-presets/README.md`、`packages/preset/agent-presets/src/index.ts`、`packages/preset/agent-presets/presets/*/agent.cordis.yml`、`packages/boot/app-boot/README.md`。
- pi 文档：`pi-agent/packages/coding-agent/README.md`（Philosophy、Pi Packages、Programmatic Usage）、`docs/extensions.md`。
- pi 源码：`packages/coding-agent/src/core/extensions/loader.ts`、`runner.ts`、`types.ts`、`wrapper.ts`、`src/core/skills.ts`、`src/core/resource-loader.ts`。
- wo-agent：`src/compose/compose.py`、`src/compose/tests/test_compose.py`、`src/tools/executor.py`、`src/system_prompt/registry.py`、`src/skill/registry.py`、`src/skill/capability.py`、`src/skill/filesystem.py`、`src/compaction/capability.py`、`src/agent/loop.py`、`cli/boot.py`、`examples/demo_agent.py`、`docs/compose.md`、`CLAUDE.md`。
