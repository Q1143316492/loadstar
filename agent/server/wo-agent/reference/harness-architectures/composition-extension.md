# 能力组装与扩展点

> dsh `0a53fb55be` · pi `853a80d26`
> 研究：[composition-extension.md](research/composition-extension.md)

## dsh 怎么做

细粒度、可逆、依赖注入的服务图。插件向共享 ctx 提供 service、注册类型化事件、安装可逆 effect；`ctx.effect()` / `ctx.on()` 返回 disposer，卸载即回卷。组合数据化为 profile / bundle / patch 分层，preset 是每会话的组合，scope 是每 agent 的可见性。

## pi 怎么做

粗粒度、按会话绑定的模块注入。一个 `ExtensionAPI` 覆盖工具、命令、UI 与三十余个事件；隔离靠会话重建扩展实例，撤销靠 `/reload`。核心刻意不带 MCP、子 agent、权限弹窗，功能走扩展。

## wo-agent 现状

`ComposeContext` 有固定槽位（`tools` / `skills` / `system_prompt` / `compaction` / `commands`），`compose(*capabilities)` 按参数顺序挂载，循环只消费挂载后的字段。没有 disposer、扩展点事件、按会话作用域、命名 preset 或组合期校验；同名工具静默覆盖，skill 冲突静默取先注册的，非法 skill 名静默返回 None。

## 可搬性与前置依赖

- **进路线**：组合期校验与 diagnostics、可逆注册与 disposer、skill 发现 diagnostics。单宿主也回本。
- **明确不搬**：Cordis 运行时、YAML profile / bundle / patch 分层、preset roster 与信任模型、`isolate` realm、完整 scope 父链、五种派发与类型目录、HMR、跨扩展事件总线、动态工具激活、TypeScript 扩展宿主。

判据：这些机制在 dsh 里服务约 60 个包、多 profile 与第三方 bundle；wo-agent 是单宿主学习项目，等价物只需一份 `boot.py` 列表。
