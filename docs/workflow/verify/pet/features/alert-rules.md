# 预警判定与喊话

桌宠盯着会话里的工具调用：连续读了很多次、或者很久没有写入还在不停调工具时，判定进入预警。预警要做三件事：窗口变橙、终端打一行 `⏳` 提示、往模型上下文里塞一句话让 agent 自己报进展。判据全部在状态机里，规则数据在 `tool-rules.json`；写操作或用户发言会解除预警。

## Sub-features

- `alert-consecutive` 连续读达到 `thresholds.consecutiveReads` 时进入预警；触发那一次的 HTTP 回包带 `hookSpecificOutput.additionalContext`（给模型）与 `systemMessage`（给终端）。
- `alert-once` 已经在预警时继续读不再喊话（回包为空），次数继续累加。
- `alert-write-clears` 写类工具（`Edit`/`Write`、`AskUserQuestion`、Bash 写命令等）清零连续读、重置时间窗锚点，回到 working。
- `alert-prompt-clears` `UserPromptSubmit` 把预警姿态拉回 working，但**不清零**连续读。
- `alert-neutral` 中性工具（`TodoWrite`、未知 MCP 工具、`node build.js` 这类无法判定的 Bash）不增不清。
- `alert-time-window` 距上次写 ≥ `thresholds.idleMinutes` 且期间调用 ≥ `thresholds.minCallsInWindow` 时进入预警（日志 `reason` 为 `time-window`）。
- `alert-hot-config` 改副本的 `pet.config.json`，1 秒内生效，不用重启。
- `alert-toggles` `toggles.agentNudge` 与 `toggles.systemMessage` 分别控制回包的两个字段；都关时判定与状态照旧，只是不喊话。

## How to get to it (user POV)

- 用户不直接触发：钩子把每次工具调用送给桌宠，越线时桌宠变橙并弹气泡。
- 终端里出现 `⏳ 连续 N 次读未写`；同一时刻模型收到「先向用户报一句」的注入。
- 用户发言、写文件、改代码都会让橙色消失。

## Driving it with verify.js

Preconditions:

- 刚 `launch` 的实例，`doctor` 全绿；记下 `RUN_DIR`、`PORT`、`<limit>`（`consecutiveReads` 的实际值）。
- 钩子通道用 `PET_PORT=<PORT>`；直连通道用 `verify.js event`。

- **连续读越线（真实钩子）。** 跑
  `PET_PORT=<PORT> node agent/hooks/simulate.js --reads <limit> --keep --session c1`。
  输出应出现「第 `<limit>` 次读越过阈值」、模型会收到的话术、终端提示。随后 `state`：`main.state="alert"`、`reads=<limit>`、`alerts=1`。日志：
  `grep consecutive-reads "<RUN_DIR>/app/logs/c1.jsonl"` 应有一条 `transition`，`to:"alert"`。
- **只喊一次。** 跑
  `node docs/workflow/verify/pet/verify.js event --event PostToolUse --session c1 --tool Read`。
  回包是 `{}`（`status:200, reply:{}`）；`state` 里 `reads=<limit+1>`，仍是 `alert`。
- **写解除。** 跑 `... event --event PostToolUse --session c1 --tool Edit`。回包 `{}`；`state`：`main.state="working"`、`reads=0`；日志里 `"reason":"write"`。
- **用户发言解除但不清零。** 用新会话 `simulate.js --reads <limit> --keep --session c2` 造一次预警；跑
  `... event --event UserPromptSubmit --session c2`。`state`：`state="working"`，`reads` 仍是 `<limit>`；日志 `"reason":"user-prompt"`。紧接着再发一次读，会立刻再次越线并带回话术——这是当前行为，不是缺陷。
- **中性工具不增不清。** 新会话：`... event --json '{"event":"SessionStart","session_id":"c3","cwd":"D:/x"}'`，两次 `--event PostToolUse --tool Read`，然后
  `... event --event PostToolUse --session c3 --tool TodoWrite` 与 `... event --event PostToolUse --session c3 --tool SomeMcpTool`。每次 `state` 里 `reads` 都停在 2，`state="working"`。
- **时间窗判据。** 先把阈值改小并等过热读窗口：
  `... configure --set thresholds.consecutiveReads=100 --set thresholds.idleMinutes=0.02 --set thresholds.minCallsInWindow=2`，`sleep 1.2`（这是配置缓存的已知窗口，不是拿 sleep 顶替状态同步）。
  依次发 `SessionStart`、`UserPromptSubmit`、一次 `PostToolUse --tool Read`，`sleep 1.6`，再发一次 `PostToolUse --tool Glob`。第二次读的回包应带 `hookSpecificOutput`；`state` 为 `alert`；日志 `grep time-window "<RUN_DIR>/app/logs/tw.jsonl"` 命中。气泡此时写的是「连续 2 次读未写」，**不能**用它判断是哪种预警。
- **配置热读。** 接着 `... configure --set thresholds.consecutiveReads=2`，`sleep 1.2`，跑
  `PET_PORT=<PORT> node agent/hooks/simulate.js --reads 2 --keep --session h1`：应直接在第 2 次读越过阈值，实例没有重启。
- **开关。** `... configure --set toggles.agentNudge=false --set toggles.systemMessage=false`，`sleep 1.2`；新会话发两次读（阈值此时是 2），第二次回包应为 `{}`，而 `state` 仍是 `alert`。再 `--set toggles.agentNudge=true`，新会话发两次读，第二次回包只含 `hookSpecificOutput`、没有 `systemMessage`。验证完 `configure --reset`。
- **取证。** 每次预警落一份 `... evidence --label alert-consecutive` / `alert-time-window`，同时保留日志行作为副作用证据。

## Gotchas

- `simulate.js` 只在回包里出现 `hookSpecificOutput` 时停；把 `toggles.agentNudge` 关掉后它会一路读到 `--reads` 上限并打印「没有越过阈值」，此时以 `/state` 为准。
- 用户发言只解除姿态、不清零连续读；下一次读会立刻再次越线并喊话。要真正清零只能写。
- 时间窗是「距上次写」，锚点在 `SessionStart` 和每次写时重置；用户发言不重置锚点。
- Bash 的分类是正则启发式：`git status` 算读，`npm install` 算写，`node build.js` 是中性，`npm test 2>nul` 会被当成重定向写。规则在 `tool-rules.json`，改规则后要重新 `launch` 才进副本。
- 阈值必须是正数，`idleMinutes` 以分钟计：`0.02` 是 1.2 秒。`minCallsInWindow` 数的是锚点之后的读调用。
- `systemMessage` 是终端提示，`hookSpecificOutput.additionalContext` 才是模型上下文；两者可以分别关闭。
- 配置改的是 `RUN_DIR/app/pet.config.json`（副本）。改仓库里的 `agent/client/pet/pet.config.json` 不会影响已启动的实例；`configure --reset` 才会重新取仓库版本。
- 已经是预警时再越线不会更新 `alertSince`，多预警的先后顺序按首次进入算。
