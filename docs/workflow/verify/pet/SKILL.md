---
name: verify-pet
description: 驱动 cwl-pet 桌宠（Electron 透明窗口 + 本机 HTTP 服务）做回归验证：起隔离实例、体检、用真实钩子 / HTTP / CDP 驱动、抓状态与截图证据、收场。改过 agent/client/pet 或 agent/hooks，要证明行为还对不对时用。
---

# 验证 cwl-pet 桌宠

**先读 `docs/workflow/AGENTS.md`**（若存在）：本项目自己的工作流约定。

这个目录是验证桌宠用户可见行为的维护中事实源。先读功能索引 [`features/README.md`](features/README.md)，再按对应功能文件走。隔离、体检、取景与收场由同一份助手 `verify.js` 执行；事件由仓库自带的钩子模拟器或 `/event` 灌入。助手只碰自己启动的实例。

## 应用与边界

- **Surface**：一个常驻、置顶、透明的 Electron 窗口（宠物三态图 + 状态气泡 + 可展开的对话卡），外加一个只监听 `127.0.0.1` 的 HTTP 服务（`/health`、`/state`、`/event`、`/quit`）。窗口显示主进程聚合出的状态；事件来自 Claude Code 钩子。
- **真实边界**：Claude Code 钩子进程 → `POST /event` → 状态机 → 窗口。验证时优先走真实钩子客户端（`agent/hooks/claude-code-hook.js`，仓库自带 `hooks/simulate.js` 驱动它）；钩子表达不了的时序用 `POST /event` 直接打服务端契约；用户点按和输入走 CDP 打进渲染页。**不 mock 任何一层。**
- **日常实例不是验证对象**：用户自己的桌宠在 `47900` 上跑着，钩子可能已装、日志里有真实会话。验证永远用本助手起的隔离实例（副本源码 + 分配的空闲端口 + 独立 `--user-data-dir`），绝不对日常实例发 `/event`、`/quit` 或改它的配置。
- 单元测试（`agent/client/pet` 下 `npm test`）覆盖状态机与分类的纯逻辑；本手册补的是「真实进程 + 真实渲染 + 真实钩子」的集成行为。两者都不能替代对方。

## Launch

前置：`agent/client/pet` 下已 `npm install`（Electron 二进制在 `node_modules/electron/dist/`）；Node ≥ 22（助手用全局 `WebSocket` 连 CDP，本机是 24）。

```bash
node docs/workflow/verify/pet/verify.js launch
```

它做的事：把源码（`main.js`、`preload.js`、`server.js`、`state.js`、`storage.js`、`classify.js`、`config.js`、`pet.config.json`、`tool-rules.json`、`package.json`、`renderer/`、`assets/`）拷到 `RUN_DIR/app`，分配一个空闲端口写进副本配置，用 `--remote-debugging-port=<空闲端口>` 和 `--user-data-dir=<RUN_DIR>/profile` 拉起 Electron，然后等到三个条件同时成立才打印结果：

1. `GET http://127.0.0.1:<port>/health` 返回 `{"ok":true}`；
2. CDP 上出现了 URL 指向 `RUN_DIR/app` 的渲染页；
3. 渲染页 `document.readyState === 'complete'`、`#pet` 存在、`window.petAPI` 已注入——**这是「可用」，不是「进程应答了」**。

输出里有 `runDir`、`evidenceDir`、`port`、`debugPort`、`pid`、初始 `state`。把 `runDir` 记为 `RUN_DIR`：后续每条命令都要 `--run "<RUN_DIR>"`（或设 `PET_VERIFY_RUN`）。默认在系统临时目录 `.../pet-verify/<时间戳-随机>` 下，`--run` 可另选。

注意：

- 启动时拷贝的是**当时**的源码。改完 `agent/client/pet` 要 `cleanup` 后重新 `launch`；改副本里的配置则不必重启（热读 1 秒）。
- 隔离实例会出现在屏幕右下角，自己的窗口置顶（240×240）。这是被验证的对象，不是污染。
- 端口由助手分配并写进副本配置；不要手改 `run.json` 里的端口，也不要让实例去连 `47900`。
- 同一 `RUN_DIR` 里已有活实例时 `launch` 会拒绝——先 `cleanup`，不要并排驱动同一个实例。

## Doctor

```bash
node docs/workflow/verify/pet/verify.js doctor --run "<RUN_DIR>"
```

只读体检，逐项给 `ok`：进程活着；端口 `health` 正常；`/state` 形状合法（`main.state` 是字符串、`sessions` 是数字）；CDP 目标是 `cwl-pet` 且 URL 在 `RUN_DIR/app` 里；渲染页 DOM 状态在 `idle|working|alert` 内；副本配置的 `port` 与启动端口一致；`toggles.pet` 为 `true`（为 `false` 时窗口永远显示 idle，状态验证无从证明）；证据目录存在；实例确实从副本启动。

`ok:false` 时先修底座再驱动。体检同时打印生效的 `thresholds`、`toggles`、`nudge.text`、`nudge.systemMessage`——后面每条断言都按这些实际值来，不要背默认值。任何东西看起来不对劲（端口被占、窗口是旧实例、状态不动），先跑 doctor。

## Drive

三条通道，按需要混用：

1. **真实钩子路径（首选，覆盖钩子客户端）**：仓库自带的模拟器把事件灌进真实钩子进程，再由钩子转发给实例。

   ```bash
   PET_PORT=<port> node agent/hooks/simulate.js --reads 25 --keep --session sim-alert
   ```

   `PET_PORT` 让钩子读端口时优先用它（`hooks/port.js`），所以别写成实例配置以外的值。`--reads` 会在第一次越线喊话时停；`--keep` 保留会话；`--stop` 补一次 Stop；`--end --session <id>` 结束会话。

2. **服务端点（钩子表达不了的时序/字段）**：

   ```bash
   node docs/workflow/verify/pet/verify.js event --event PostToolUse --session tw --tool Read
   node docs/workflow/verify/pet/verify.js event --json '{"event":"Stop","session_id":"tw","stop_hook_active":true}'
   node docs/workflow/verify/pet/verify.js event --json '{"event":"Stop","session_id":"tw","session_title":"回归标题"}'
   ```

   这条通道**绕过钩子进程**，证明的是 `/event` 契约与状态机；钩子自身的转发另有配方覆盖。需要延时（时间窗判据）、`stop_hook_active`、直接给 `session_title` 时用它。

3. **渲染页（用户点按、输入、按键）**：

   ```bash
   node docs/workflow/verify/pet/verify.js click --selector '#chat-open'
   node docs/workflow/verify/pet/verify.js type --text '回归测试消息'
   node docs/workflow/verify/pet/verify.js click --selector '.chat-send'
   node docs/workflow/verify/pet/verify.js key --key Escape
   node docs/workflow/verify/pet/verify.js snap                 # DOM 快照
   node docs/workflow/verify/pet/verify.js snap --png <file>    # 附带截图
   ```

   稳定把手是元素 id 与类名：`#pet`（`data-state`）、`#pet-img`、`#bubble`、`#bubble-text`、`#chat-open`（入口胶囊，未读时带 `.unread`）、`#chat`、`#chat-status`、`#chat-input`、`.chat-send`、`#chat-clear`、`#chat-collapse`，以及消息行 `.chat-msg`。点击走 CDP 的鼠标事件、输入走 `Input.insertText`、按键走真实 `Escape/Enter/Tab`，不是调用页面内部函数。

**驱动约定**

- 每个配方从**刚 `launch` 的基线**开始（`sessions=0`、`idle`）。配方会自己造会话；结束时用 `simulate --end` 或直接 `cleanup`。
- 断言优先看 `/state`（服务端事实）与 DOM 快照（用户看到的事实），不要读源码里的数字。气泡里的 `consecutiveLimit` 来自配置，先 doctor 拿到实际值。
- 事件到达时 `/state` 立刻更新；渲染页由主进程广播，通常几十毫秒内跟上。用 `snap` 观察变化，不用固定 `sleep` 冒充同步——唯一的固定等待是空闲降级的 30 秒 tick（`main.js` 每 30 秒调一次 `state.tick()`）。
- 配置改动：副本的 `pet.config.json` 热读，1 秒内生效。

  ```bash
  node docs/workflow/verify/pet/verify.js configure --set thresholds.consecutiveReads=3
  node docs/workflow/verify/pet/verify.js configure --set thresholds.idleMinutes=0.02 --set thresholds.minCallsInWindow=2
  node docs/workflow/verify/pet/verify.js configure --reset      # 还原成仓库当前配置（端口保留）
  ```

  端口只在启动时读，改端口要么重启实例，要么重新 `launch`。

## Evidence

```bash
node docs/workflow/verify/pet/verify.js evidence --label alert-consecutive
```

一次取证写进 `RUN_DIR/evidence/`：`<label>.state.json`（`/state` 全文）、`<label>.dom.json`（渲染页快照）、`<label>.png`（窗口内容截图）。`--no-png` 可省截图。证据目录默认为 `RUN_DIR/evidence`，`launch --evidence <dir>` 可另选；无论选哪里，`cleanup` 都保留它。

**证明标准**

- 抓用户动作和它造成的结果，不是只抓最后一屏：状态变化要有「触发事件的命令」+「`/state` 的形态」+「截图」。
- 截图认得出应用身份与状态：宠物图（灰/蓝/橙）、气泡文字、`data-state`。截图只含窗口内容，透明背景，**不证明**窗口位置、置顶层级、拖动。
- 写操作与副作用一起抓：预警要有 `evidence` 的 `/state`，外加日志里的 `transition`（`<RUN_DIR>/app/logs/<session>.jsonl`）；「这一轮结束」要有 `/state.notices` 与对话卡里的消息两处。
- 用第二个视角做只读确认：会话结束要同时看到 `/state.detail` 里消失与 `sessions` 计数下降；通知要同时看到服务端 `notices` 与窗口 `messages`。
- 每个证据记录功能 id 与入口（例如 `display-multi` 走「第二个会话开始预警」这条路径）。
- 时间窗预警断言日志里的 `"reason":"time-window"`，不要拿气泡文字当判据——气泡在两种预警下都写「连续 N 次读未写」，其中 N 是连续读次数。
- 气泡在 idle 时是隐藏的，`#bubble-text` 里可能残留上一状态的字；断言可见性要带 `bubbleHidden`。
- 所有层都是真实的，不需要 mock，也不要用测试专用端点或内部 setter 伪造状态；`--state=` 是截图原型开关，只在 `--shot` 模式下用，活实例上用它等于造假。
- `cleanup` 会把 `app/logs/*.jsonl` 搬进 `evidence/logs/`，日志证据不会随实例消失。

## Cleanup

```bash
node docs/workflow/verify/pet/verify.js cleanup --run "<RUN_DIR>"
```

顺序：先抓一份 `final` 证据（实例还活着时）、把实例日志复制进 `evidence/logs/`，再 `POST /quit` 并等端口与进程都消失（5 秒内没退出才按 `run.json` 的 pid 杀整棵进程树），最后删 `app/`、`profile/`、`pet.out`，保留 `run.json` 与 `evidence/`。输出里 `kept` 列出留下的证据。

- 只关自己启动的实例：端口来自 `run.json`，兜底按 `run.json` 的 pid 收尾。**绝不对 `47900` 发 `/quit`，也绝不按进程名杀 Electron**——那会连带结束用户的日常桌宠。
- 失败的迭代也要 `cleanup`，否则残留窗口、端口和临时配置会让下一次 `launch`/doctor 读到旧实例。
- 观测到但没取证的中间状态，用 `evidence` 当场落盘；不要指望在 cleanup 之后还能从实例里读回来。

## Helpers

`docs/workflow/verify/pet/verify.js`，纯 Node 内置模块（`http`/`net`/`child_process` + 全局 `WebSocket`），无需安装：

| 命令 | 用途 |
|---|---|
| `launch [--run <dir>] [--evidence <dir>] [--id <name>]` | 起隔离实例，等待可用，打印 `runDir`/端口/pid |
| `doctor --run <dir>` | 只读体检；任何 `ok:false` 先修 |
| `state --run <dir>` | 打印 `GET /state` |
| `event --run <dir> (--json '<payload>' \| --event <E> --session <id> [--tool <T>] [--cwd <P>] [--title <S>] [--stop-active])` | 发一条事件，打印回复 |
| `dom --run <dir>` | 打印渲染页快照 |
| `snap --run <dir> [--png <file>]` | 快照 + 可选截图 |
| `click --run <dir> --selector <CSS>` | CDP 点按元素 |
| `type --run <dir> --text <内容>` | 向焦点输入文本 |
| `key --run <dir> --key Escape\|Enter\|Tab [--no-snapshot]` | 真实按键；收起态 `Esc` 会退出应用，用 `--no-snapshot` 免得快照失败 |
| `configure --run <dir> (--set <键>=<值> ... \| --reset)` | 改副本配置（热读 1 秒）或还原 |
| `evidence --run <dir> --label <名字> [--no-png]` | 取证到 `evidence/` |
| `logs --run <dir>` | 打印实例日志目录与文件 |
| `quit --run <dir>` | 只关闭实例（不删目录） |
| `cleanup --run <dir>` | 取证、搬日志、关实例、删临时状态；保留证据 |

所有命令需要 `--run` 或环境变量 `PET_VERIFY_RUN`；缺了会直接报错而不是猜一个实例。帮助：不带命令运行 `verify.js`。

## Gotchas（跨功能）

- **日常桌宠在跑**：`47900` 与它自己的窗口、日志都归用户。只碰 `run.json` 里的端口与 `RUN_DIR`。
- **`ELECTRON_RUN_AS_NODE`**：环境里若设了它，Electron 会以纯 Node 运行、拿不到 `app` 对象。助手启动前会删掉；手敲 `electron.exe` 时用 `env -u ELECTRON_RUN_AS_NODE`。
- **空闲降级按 30 秒 tick**：`working` 回落到 `idle` 最多等一整个 tick，配方里要等可观察的变化，不要用 1 秒 sleep 断言。
- **对话卡展开会改窗口**：收起 240×240，展开约 520×470（高度随宠物尺寸，本机实测 521×471），宠物在屏幕上原位不动。涉及窗口尺寸或截图的断言要区分两态。
- **通知只由 Stop 触发**：`PostToolUse` 再多也不产生「这一轮结束」；`Stop` 与钩子客户端里读会话标题是同一时刻，所以标题证据要带 `transcript_path`。
- **右键菜单、拖动、置顶层级、开机自启**：系统层行为，CDP 与截图都驱动不到（`--shot` 的 `PET_SHOT_MENU` 也只触发 DOM 事件，打不开原生菜单）。这些在功能地图里标成未覆盖，需要人工看一眼，不要用别处的证明冒充。
