# 沙箱与权限预设

> dsh `0a53fb55be` · pi `853a80d26`
> 研究：[tool-pipeline-permissions.md](../../docs/workflow/maps/harness-evolution/research/tool-pipeline-permissions.md) §1.7–§1.10、§4

## dsh 怎么做

两件独立机制。**sandbox** 是 `ctx.sandbox` 能力缝：按调用携带策略（`read-only` / `workspace-write` / 更大范围），用 bwrap、Landlock、Seatbelt、Windows ACL restricted token 等平台后端包装 argv；无可用后端时 fail closed。**permission preset** 把「sandbox 模式」与「审批策略」两个旋钮打包成一个可选择项，按 session 持久化，切换时写日志。两者之上还有升权阶梯（`sandbox_permissions` 加 justification）。

## pi 怎么做

不带权限系统。进程以启动它的用户权限运行；项目 trust 只控制是否加载项目资源，不是沙箱。README 给出三种隔离路径：Gondolin 扩展（工具路由进本地 Linux 微 VM）、整个进程跑 Docker、OpenShell 策略控制。

## wo-agent 现状

两样都没有。文件工具用路径围栏限制在工作区根下；`bash` 完全不受围栏约束，模型可以在本机做任何事。工具描述与系统提示里已写明「不沙箱」，不让模型假装有沙箱。

## 可搬性与前置依赖

- **处置：只留卡片。** 个人机器、有人看着、只跑自己仓库的默认场景里，审批加凭据清洗的前置最少、收益最直接；多平台 sandbox 后端是很大的维护面，而沙箱升权阶梯在没有沙箱时是无坐标的字段。
- **若将来要做**：先选定单一平台（Docker 最容易），只做 `read-only` 与 `workspace-write` 两档；无后端时抛错，不静默无约束运行。
- **顺序**：preset 只有在 sandbox 存在后才有意义，否则只能打包审批策略，不构成一个服务。

学习价值：这是「三层防线」讲得最清楚的一处——围栏管文件、审批管调用、沙箱管进程；每一层单独看都不够，缺一层时要明确知道缺的是哪一层。
