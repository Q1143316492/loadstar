# 桌宠预警地图

## 目的地

在 lodestar 里落成 `agent-hook/`，把「AI 一直读、不写、不报进展」变成桌宠上看得见的预警：Claude Code 钩子把工具调用事件发给本机桌宠服务，桌宠按会话判状态、亮静态图、弹气泡。**链路真实跑通即抵达**；素材与动画是后期的事。

## 备注

- 领域：Claude Code 钩子机制、本机常驻小窗口（Electron）、多会话状态聚合。
- 每个会话先看：`cwl-research`（钩子的事实边界由它查）；拿不准时 `cwl-grilling` + `cwl-domain-modeling`。
- **钩子事实基线**：CLI 2.1.283 / VS Code 扩展 2.1.327 的内嵌注册表，见 [`research/cc-hook-facts.md`](research/cc-hook-facts.md)。公开文档在本机被网络门禁挡住，未能对照；升级 Claude Code 后复核。
- 本图**把执行也纳入**：`跑通最小闭环` 与 `安装与自启` 是 task 票，不只是决策。
- 日常操作收进了技能 [`cwl-pet`](../../../workflow/cwl-pet/SKILL.md)：看状态、重启、关闭、改阈值与话术、装或卸钩子、不生效时按序排查。
- **当前进度（2026-11-20）**：`agent-hook/` 已落成并跑通端到端；只剩 `08` 的真实会话人工验收（装钩子 → 重启会话 → 只读长任务里观察）。
- 固定偏好（画图前已与你逐条确认）：
  - 布局：`agent-hook/hooks/`（发送端）+ `agent-hook/pet/`（桌宠 app）同仓同目录，与 `workflow/`、`docs/` 并列；桌宠有自己的 `package.json`。
  - 修订（03 票）：发送端是**命令钩子 + 薄客户端脚本**，不是 `http` 钩子——后者失败会在回合里刷 `hookErrors` 告警，违反「连不上静默放弃」。脚本一律 `exit 0`。
  - 修订（03 票）：桌宠在 `/event` 的**响应体**里携带 `hookSpecificOutput.additionalContext` 话术，脚本原样透传 stdout——这是回灌 agent 的通道，话术归桌宠。
  - 传输：HTTP POST 到 `127.0.0.1` 固定端口（初值 47900），钩子 1 秒超时、连不上静默退出，**永不阻塞会话**；桌宠可被 curl 直接打，作为观测面。这是「效果与后端分离」的那道接缝。
  - 状态归属：钩子无状态，只发原始事件（session_id、工具名、时间）；计数、状态机、静音全在桌宠。
  - 判据：连续只读计数 **与** 时间窗，任一触发；「写」= Edit / Write / NotebookEdit 加 Bash 里白名单式的写操作；只软提醒，不阻断。
  - 预警同时两路：桌宠亮起，**并**把一句「已连续读 N 次没写，先向用户报进展」推回 agent 自己。
  - 多会话：主形象只显示最紧急的一个（预警 > 工作中 > 空闲），旁附一行小字如 `3 sessions · 1 alert`。
  - 解除：该会话出现写操作 / 用户发新消息 / 会话结束，任一自动解除；点击宠物静音到该会话下次写或结束。
  - 桌宠第一版：透明无边框置顶窗口，每状态一张静态图 + 头顶短气泡；可拖、可点击穿透（不挡住代码）。
  - 安装：钩子装到用户级 `~/.claude/settings.json`（所有项目生效），但**默认不装**，按需运行 `install.js`。
  - 覆盖：协议中立、**客户端只做 Claude Code**；不为将来抽象，不提前写适配器。
  - 事件落盘：滚动日志（每个会话一个文件，约 7 天），供回看与调阈值。
- 项目约定照旧：不自动提交；Markdown 严格 UTF-8 无 BOM。

## 已定决策

<!-- 索引：每条已解决的 ticket 一行 —— - [标题](tickets/NN-slug.md)：一行摘要 -->

- [Claude Code 钩子的事实边界](tickets/01-cc-hook-facts.md)：33 个事件；`additionalContext` 可注话进模型；超时不阻塞会话；引擎不计数，状态归客户端；插件面无法浮于桌面 → 桌宠须独立；另有 `http` 钩子可能免写发送端。事实版本 CLI 2.1.283，见 [research](research/cc-hook-facts.md)。
- [预警判据的默认阈值与「写」的识别](tickets/02-alert-thresholds.md)：读 +1（8 种只读工具）、写清零（含 `AskUserQuestion`）、中性不动；阈值 25 次 / 10 分钟且 ≥8 次调用；Bash 按可编辑正则表判读写；冷却与解除同条件；配置放 `pet.config.json` 且热读。
- [钩子与桌宠之间的事件协议](tickets/03-event-protocol.md)：命令钩子套一个 30 行脚本（一律 `exit 0`）；挂 `PostToolUse`/`SessionStart`/`SessionEnd`/`UserPromptSubmit`/`Stop`；分类在桌宠侧；端点 `/event` `/state` `/health`；回话用响应体透传 `additionalContext`；每会话一个 JSONL 日志。
- [预警如何回到 agent 自己](tickets/06-agent-nudge.md)：越过阈值那一次注入一句「先向用户报进展」，附一行短 `systemMessage`；不加重、不阻断；注入 / 提示人 / 桌宠三路各有开关，默认全开。
- [桌宠状态机与素材切换契约](tickets/05-state-and-assets.md)：每会话三态（空闲 / 工作中 / 预警），静音是标记；聚合器按预警优先选主形象；素材 `assets/<状态>.png` 256×256 启动加载；气泡文案由桌宠生成。
- [常驻前台桌宠窗口的形状](tickets/04-pet-window.md)：Electron 33 原型已跑通——透明置顶、点击穿透 + 拖动共存、三态换图、位置记忆；截图在 `artifacts/`。环境坑：仓库目录 Low integrity 导致沙箱起不来，需 `--no-sandbox` 或修目录标签。
- [用户级安装与桌宠自启](tickets/07-install-and-autostart.md)：`hooks/install.js` 幂等装/卸五个事件（timeout 1 秒）+ 自动备份；钩子客户端桌宠没开时约 115 ms 静默退出；自启走启动文件夹 + `launch.vbs`；目录标签已修为 Medium。五条选择按推荐默认实现，标为假设。

## 尚未明确

- 多会话的容量上限与降级：Q8 只定了「主形象 + 一行小字」，十几个会话平铺时怎么收。
- 素材规格：图/动画的尺寸、透明边距、帧率，以及「状态 → 素材」的映射怎么扩展才不牵动代码。
- 宠物的状态要不要外供（比如给 VS Code 面板、状态栏复用同一份状态源）。
- 「agent 周期性自报在查什么」这条更聪明的判据（Q2 的 d）值不值得做。
- 跨机器 / 远程会话要不要收；同一台机器上多用户账户时的共享行为。
- 预警阈值要不要按项目或会话类型区分（lodestar 内 vs. 其他项目）。
- 模型收到提醒后继续闷头读时要不要加重（更高阈值再喊一次 / 更重话术）。

## 超出范围

- 其他 runtime 的适配器（Codex、Cursor 等）：协议保持中立，本图不实现。
- AI 生成图 / GIF 素材的制作流程本身：本图只保证「换文件即可」。
- 让宠物反向给 agent 发指令、对话式操控：本图只做单向预警。
- lodestar 技能库本体的其他迭代：另起地图。
