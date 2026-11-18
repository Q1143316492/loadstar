# 工具执行管线与权限

> dsh `0a53fb55be` · pi `853a80d26`
> 研究：[tool-pipeline-permissions.md](../../docs/workflow/maps/harness-evolution/research/tool-pipeline-permissions.md)

## dsh 怎么做

分阶段管线：`tool/call` 先落日志 → `tools/pre-execute` waterfall 给 allow/deny/ask → 单调 guard（只能拒绝）→ `ask` 经审批 seam 解析 → `tools/execute` around waterfall（超时、重试、指标）→ 工具 body → `tools/post-execute` waterfall → canonical output 规范化 → `tool/result` 落日志。参数不可改写；每个工具声明输出 schema、渲染与呈现。审批、权限 preset、sandbox 是三件独立机制。

## pi 怎么做

只有 `beforeToolCall`（可 block / reason / terminate）与 `afterToolCall`（可部分覆盖结果）。扩展层另有 `tool_call` / `tool_result` 事件，`tool_call` 可改参数且不重新校验。默认并行、按工具退回串行。核心不带权限系统，安全靠容器化。

## wo-agent 现状

已有注册表、单调守卫、错误转 `is_error`、取消事件与进程树终止；`bash` / `grep` / `glob` 已有 30 秒超时与尾部截断（2000 行或 50KB）。缺执行器级通用 deadline、审批 seam、并发安全标记、统一输出契约与核心层呈现契约；错误只有 `is_error` 加文本，没有机器可路由的 code。

## 可搬性与前置依赖

- **进路线**：pre-execute 三态（allow / deny / ask）加审批通道（`bash` 默认 ask、无 UI 时 fail closed）、执行器级协作超时、结构化错误码、并发安全标记（默认 exclusive）、bash 子进程剔除敏感环境变量。
- **只留卡片**：canonical output（schema / value / render）、presentation 契约、post-execute 各插件、sandbox seam、permission preset。
- **明确不搬**：Windows 全量沙箱与 ACL、permission preset 与审计、allow-always、完整 card union、滚动池调度器、hooks 生态。

威胁模型：个人机器上 `bash` 是真实权限面，文件围栏管不住它；子进程会继承 API key；AGENTS.md 自动注入是 prompt injection 通道。刚需是 bash 人工闸门、凭据清洗、进程超时与取消。
