# 把桌宠和 wo-agent 合进一个仓库

## 目的地

把三样东西合进一个仓库、并保持宠物能独立工作：**①** wo-agent 带历史搬进 lodestar，目录定成 `agent/hooks`、`agent/client/pet`、`agent/server/wo-agent`（**已完成**）；**②** 路径改完、钩子重装、宠物能从新位置跑起来（**已完成**）。

**pet 接入 wo-agent 暂缓。** 用户目前只打算用自己的终端、按阶段手动查看宠物状态，不把宠物交给 agent 驱动。因此原来「pet 降为纯客户端」「server 侧判定与大脑」两张票判出范围。

**约束（仍成立）：wo-agent 是通用的被调用库，不是宿主。** 宠物逻辑一行都不准写进它里面。

## 备注

- 这是 [`agent-hook`](../agent-hook/map.md) 的续篇。那边 7 张票已解决，「跑通最小闭环」仍「已认领」；本图做完迁移后，那边的目录描述会失效，收尾票负责处理。
- 已确认的前提（不再是问题）：
  - wo-agent 带历史搬进来，原仓库冻结，lodestar 为唯一上游。
  - 通信走 HTTP，不追求同进程；Python 桌面 GUI 太丑，不重写现有 Electron UI。
  - **调用方向：pet → server → wo-agent。** wo-agent 只提供通用能力（跑一个 agent、给会话事件），不知道「宠物」的存在。
  - lodestar 继续保留 `workflow/cwl-pet/` 技能。
- 已核实的事实：
  - wo-agent 是独立仓库（`git@github.com:Q1143316492/wo-agent.git`），本地有未提交改动；`pyproject.toml` 打包列表只含 `src/` 下的包，`cli/` 不在其中。
  - `Session.append` 不通知任何人；运行中不落盘（JSONL 只在 `store.save()` 时整文件重写）→ 靠读日志监控不可行。
  - `ObservingToolExecutor` 在 `cli/observe.py`，而 `cli/` 不在打包范围。
  - 现有钩子命令是绝对路径，挪目录后必须重装。
  - `cwl-sync` 只同步 `workflow/cwl-*`，`agent/` 天然不受影响。
- 项目约定照旧：不自动提交；Markdown 严格 UTF-8 无 BOM。

## 已定决策

<!-- 索引：每条已解决的 ticket 一行 —— - [标题](tickets/NN-slug.md)：一行摘要 -->

- [桌宠与 wo-agent 怎么合进一个仓库](tickets/01-repo-layout.md)：`git subtree add` 引入（保留 10 提交），`agent/{hooks,client/pet,server/wo-agent}` 三者平级；hooks 是生产者不归 client；原仓库冻结。
- [动手搬家](tickets/04-migration.md)：目录用 `git mv` 搬迁保历史，路径全部改写，钩子重装；`npm test` 与手动探针均通过。旧地图 agent-hook 未归档，留作遗留项。

## 尚未明确

- pet 接入 wo-agent：什么时候做、做到什么程度（当前主动暂缓）。
- 多 agent 横向复盘：比什么、多久做一次；以及拿 DSH、pi-agent 当参考读物改设计。
- 统一事件格式：等真的接第二家 agent 时再谈；现在只有 Claude Code 与 wo-agent 两个来源。
- 监控越用越准的评价回路（误报/漏报的量化、标注入口）。
- 监控完整性的自检方法（钩子漏没漏事件）。
- 要不要第二个 client（VS Code 面板、状态栏）。
- 跨机器 / 远程会话收不收。
- 桌宠视觉（动画、AI 生成素材）与 client 化之后的关系。
- wo-agent 长期是否仍自成一库、单独发布。
- lodestar 的仓库叙事：放进一个产品之后 README 要不要改。

## 超出范围

- 动画 / AI 生成素材的制作流程。
- 阈值、话术的具体数值调优。
- 把桌宠做成支持任意 runtime 的通用产品。
- lodestar 其他技能的迭代。
- wo-agent 内核的大改：本图只做非侵入式调用。
