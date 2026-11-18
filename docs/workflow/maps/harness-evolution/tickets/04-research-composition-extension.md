## 问题

dsh 的 Cordis 插件组合与 pi 的扩展机制各解决了什么问题，wo-agent 的 `compose/` + `Capability` 处于什么位置，哪些机制值得以最小代价引入 Python？

需要回答：

1. **dsh 侧**：插件 = 向共享 ctx 贡献服务、类型化事件与可逆 effect；`ctx.effect()` / `ctx.on()` 与 disposer；waterfall 监听器必须 `next()`；profile / bundle / patch 的分层组合；`scope` 与 `isolate` 的按会话隔离；「无特权核心」如何成立。
2. **pi 侧**：coding-agent 的 TypeScript 扩展（`registerTool`、`on("tool_call")`、扩展 runner/wrapper）；skills 与 resource loader；为什么核心刻意不带 MCP / 子 agent / 权限弹窗。
3. **wo-agent 现状**：`ComposeContext` 固定的 `tools` / `system_prompt` / `skills` / `compaction` 字段；`compose(*capabilities)` 顺序挂载；循环只消费挂载后的字段。指出它的边界：没有 disposer、没有事件、没有按会话隔离、没有 preset。
4. **渐进可搬性**：候选机制（可逆注册/卸载、扩展点事件、preset 组合、按 agent 作用域、配置校验）逐条给出前置依赖、改动面与最小验收；并判断哪些机制只有在大规模插件生态下才回本。
5. **明确不搬**：Cordis 运行时、yaml profile 树、TypeScript 扩展宿主。

产物写到 `research/composition-extension.md`，从本票链接。只给事实与选项，不做取舍决策。

类型：research
状态：已解决
阻塞于：无

## 答案

研究见 [composition-extension.md](../research/composition-extension.md)。

- **两种参考的差异**：dsh 是细粒度、可逆、依赖注入的服务图（插件 + `ctx.effect()` / `ctx.on()` + 类型化事件 + scope，组合数据化为 profile / bundle / patch 与 preset）；pi 是粗粒度、会话绑定的模块注入（一个 `ExtensionAPI`，隔离靠会话重建，撤销靠 `/reload`）；wo-agent 是静态能力列表加固定槽位，无 disposer、事件、作用域、preset、组合期校验。
- **单宿主也回本的机制**：可逆注册与 disposer、组合期校验与 diagnostics（当前同名工具静默覆盖、skill 冲突静默跳过）、最小扩展点事件（`emit` + 一个 `tool/pre-execute` waterfall）、纯数据形态的命名 preset、skill 发现 diagnostics。
- **只有大规模生态才回本**：profile / bundle / patch 分层、preset roster 与信任、standing mount、`isolate` realm、完整 scope 父链、五种派发与类型目录、HMR、扩展包管理器、动态工具激活、跨扩展 event bus。
- **明确不搬**：Cordis 运行时、YAML profile 树、TypeScript 扩展宿主与 jiti、declaration merging / branded IDs、TUI 扩展面。
- **留给 HITL 的开放问题**：宿主是否会并发跑多个能力集不同的 agent；扩展点使用者是自家宿主还是第三方；组合默认形态是代码常量、数据类还是配置文件；失败语义是启动即失败还是收集 diagnostics；是否需要运行期换能力。这五条在 [决定哪些架构进路线](06-decide-in-scope-capabilities.md) 与 [排定渐进顺序与接缝](07-decide-port-order-and-seams.md) 里裁决。
