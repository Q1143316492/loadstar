# 会话状态、聚合与日志

桌宠把每个 Claude Code 会话分开记：各自的状态、连续读计数、当前工具、标题。窗口只显示聚合后最紧急的那个；`/state` 把全部会话、预警数、通知队列和最近的迁移都摊开，是 agent 观察桌宠的主要只读口。每个会话还有一份 JSONL 日志，记原始事件与状态迁移。

## Sub-features

- `session-aggregate` `GET /state` 返回 `{main, sessions, alerts, notices, detail}`：`main` 是窗口正在显示的那个（无显示时 `{state:'idle'}`），`detail` 列出所有会话。
- `session-start` `SessionStart` 立刻把会话放进 working；首个事件会先记一条 `session-created` 迁移。
- `session-end` `SessionEnd` 把会话从 `detail` 删除、`sessions` 减少；日志记一条 `to:"destroyed"`。
- `session-idle` 无事件超过 `thresholds.sessionIdleMinutes` 时，主进程 30 秒一次的 tick 把 working 降级为 idle；预警不会被 tick 降级。
- `session-title` 钩子在 `Stop` 时从 transcript 尾部读最后一个 `ai-title`，写进 `/state.detail[].title` 与通知。
- `session-log` 每个会话 `logs/<session-id>.jsonl`，每行 `{kind:"event"|"transition", …}`；迁移带 `from`/`to`/`reason`。
- `session-notices` 通知队列按自增 `id` 排列，最多保留 20 条；窗口按 id 去重，不重放。

## How to get to it (user POV)

- 用户看到的是气泡上的会话数与「另 N 个预警」；`/state` 是给 agent 和排查用的完整视角。
- 会话结束后，它的预警、计数、标题一起消失，窗口换到下一个最紧急的会话。

## Driving it with verify.js

Preconditions:

- 刚 `launch` 的实例，`doctor` 全绿。
- 记下 `RUN_DIR`、`PORT`。

- **聚合形状。** 跑 `node docs/workflow/verify/pet/verify.js state`。基线是 `main.state:"idle"`、`sessions:0`、`alerts:0`、`detail:[]`。发一条
  `... event --json '{"event":"SessionStart","session_id":"s1","cwd":"D:/proj/one"}'`；再 `state`：`main.state:"working"`、`sessions:1`、`detail[0]` 有 `session:"s1"`、`cwd:"D:/proj/one"`、`title:null`。再发两次 `--event PostToolUse --session s1 --tool Read`，`main.reads` 为 2、`main.tool:"Read"`。
- **结束。** 跑 `PET_PORT=<PORT> node agent/hooks/simulate.js --end --session s1`（或 `event --json '{"event":"SessionEnd","session_id":"s1"}'`）。`state`：`sessions:0`、`detail` 里没有 s1；日志 `grep destroyed "<RUN_DIR>/app/logs/s1.jsonl"` 命中。
- **空闲回落。** 先 `... configure --set thresholds.sessionIdleMinutes=0.02`，`sleep 1.2`；发 `SessionStart`（会话 i1）确认 `state:"working"`。然后等可观察的变化（最多约 31 秒，tick 每 30 秒一次），用循环或间断 `state` 看：`state:"idle"`，会话仍在 `detail` 里。日志 `grep idle-timeout "<RUN_DIR>/app/logs/i1.jsonl"` 命中。
- **警告不被 tick 降级（同一次等待里顺手确认）。** 让另一个会话进入预警后再等一个 tick，它仍是 `alert`；tick 只处理 `working`。
- **标题链路。** 按 [对话卡](./chat-card.md) 的「会话标题」配方走一遍真实钩子 + 临时 transcript；确认 `/state.detail` 与 `notices` 都带同一个标题。
- **通知队列。** 两个会话各做一轮有工具的回合：
  `SessionStart`+`UserPromptSubmit`+一次 `PostToolUse --tool Read`+`Stop`，分别用 `n1`、`n2`。`state` 里 `notices` 末尾两条的 `session` 分别是 `n1`、`n2`，`id` 递增；同一轮重复 `Stop` 不再加条。
- **日志。** `node docs/workflow/verify/pet/verify.js logs` 打印目录；`grep '"kind":"event"'` 与 `grep '"kind":"transition"'` 应各有命中；迁移的 `reason` 覆盖到你这轮造出来的那些（`session-start`、`write`、`consecutive-reads`、`time-window`、`session-end` 等）。
- **取证。** 聚合形态跑 `evidence --label session-aggregate`；空闲回落跑 `evidence --label session-idle`，两者都以 `/state` 为主证据、截图认得出宠物状态。

## Gotchas

- 空闲降级依赖主进程每 30 秒的 tick：最坏要等满一个 tick。别用 1 秒 sleep 断言；等 `/state` 真的变了。
- `tick` 只把 `working` 降级为 `idle`；预警会一直保持到写、用户发言或会话结束。
- `sessions` 包含已经空闲但没收到 `SessionEnd` 的会话，所以气泡里的「共 N 会话」可能比你以为的多。想清理就显式 `SessionEnd`。
- `SessionEnd` 立即删掉会话（计数、标题、状态），但通知队列里的历史消息仍在，窗口按 id 去重不会重放。
- 标题只在 `Stop` 时读，且只读 transcript 尾部 256 KB；标题太旧、文件不在、`transcript_path` 缺失都退回 `null`，窗口显示「目录名 · 会话 id 前 8 位」。
- 通知最多留 20 条，超出丢最旧的；这条上限来自代码，配方没有逐条打满它——真要证明，得造 21 轮 `Stop`，成本不划算。
- 日志按会话分文件，文件名里的非法字符被替换成 `_`；`cleanup` 会把它们搬进 `evidence/logs/`。
- `/state` 是服务端事实；窗口里显示的是它的一次广播快照。两者短暂不一致时，以等到的 `snap` 为准，不要立刻判回归。
