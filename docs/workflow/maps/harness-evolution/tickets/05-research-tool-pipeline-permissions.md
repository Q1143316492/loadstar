## 问题

dsh 与 pi 的工具执行、权限与沙箱各是什么形状，wo-agent 的 `tools/` 管线差在哪，个人使用场景下最小可行的权限形态是什么？

需要回答：

1. **dsh 侧**：`tools/pre-execute` → `tools/execute` → `tools/post-execute` 与 waterfall 语义；守卫的单调拒绝；timeout、并发安全分类、输出 canonical schema、presentation；approval / permission preset / sandbox 三道防线分别管什么。
2. **pi 侧**：`beforeToolCall`、扩展对工具调用的拦截；核心明确不带权限系统，靠容器化/沙箱；工具输出如何回填。
3. **wo-agent 现状**：`RegistryToolExecutor` 的守卫（只能拒绝不能放行）、错误转 `is_error`、取消事件与进程树终止、`bash` 围栏管不住的边界。指出缺少的环节（审批、超时、并发、输出规范化、presentation）。
4. **渐进可搬性**：候选机制（审批询问、超时策略、并发安全标记、工具输出 schema、presentation 与 UI 解耦）逐条给出前置依赖、改动面与最小验收。
5. **风险面**：个人机器上运行 `bash` 的真实威胁模型；哪些权限机制是「教学价值高但个人使用过度」，哪些是刚需。

产物写到 `research/tool-pipeline-permissions.md`，从本票链接。只给事实与选项，不做取舍决策。

类型：research
状态：已解决
阻塞于：无

## 答案

研究见 [tool-pipeline-permissions.md](../../../../../reference/harness-architectures/research/tool-pipeline-permissions.md)。

- **三种形状**：dsh 是分阶段管线（`tool/call` 落日志 → pre-execute 的 allow/deny/ask → 单调 guard → approval → execute → post-execute → canonical output → 最终通知），参数不可改写，输出强制 schema + render，超时是工具声明的协作式预算，审批 / 权限 preset / sandbox 是三件独立机制；pi 只有 `beforeToolCall`（可 block）与 `afterToolCall`（可改结果），默认并行、按工具退回串行，明确不带权限系统、靠容器化；wo-agent 已有注册表、单调 guard、错误转 `is_error`、取消与进程树终止，`bash` / `grep` / `glob` 已有 30s 超时与尾部截断。
- **票面假设的校正**：超时与输出截断在 `workspace` 的进程工具里已经存在，缺的是执行器级的通用 deadline 与统一输出契约；presentation 在 CLI 宿主里存在（`cli/observe.py`），缺的是核心层可声明的呈现契约。
- **最小闭环**：pre-execute 三态（allow / deny / ask）加 approval seam、执行器级协作超时加 `TOOL_TIMEOUT`、结构化错误码。
- **结构性升级**：并发安全标记（默认 exclusive）、canonical output（schema / value / render / meta）、presentation 契约。
- **架构卡片**：post-execute 各插件、sandbox seam、permission preset——教学价值高，个人使用成本也高。
- **个人机器的威胁模型**：bash 是真实权限面，文件围栏管不住；子进程会继承 API key；AGENTS.md 自动注入是 prompt injection 通道。刚需是 bash 的人工闸门、凭据清洗、进程超时与取消；Windows 全量 sandbox、permission preset 与审计、allow-always、完整 card union 属过度设计。
- **留给 HITL 的八个问题**：approval 通道由谁提供、审批范围、是否接受协作式超时、并发调度做到哪层、canonical output 是否引入 JSON Schema、presentation 是否进核心、sandbox 只做卡片还是选一个平台验证、凭据清洗是否先于审批。
