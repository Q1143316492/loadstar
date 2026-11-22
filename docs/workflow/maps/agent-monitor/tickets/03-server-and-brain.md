# server 侧的判定与 wo-agent 调用

## 问题

判定（读/写分类、阈值、会话桶、日志）要从 pet 挪到 `agent/server/`，但**不能被写进 wo-agent**——wo-agent 是通用的被调用库。要定：

- **server 的形态**：一个独立的 Python 服务（FastAPI / 标准库 `http.server` / 其他），它 import wo-agent 来跑大脑；判定逻辑（现状态机 + 分类规则）用 Python 重写还是从 JS 移植。
- **调用方向**：pet → server → wo-agent。server 是唯一知道 wo-agent 存在的一层；wo-agent 只对外提供「跑一个 agent、给会话事件」这类通用能力。
- **wo-agent 侧的事件出口**：事实是 `Session.append` 不通知任何人、运行中不落盘。可用的三样：包装 `ToolExecutor`（`ObservableToolExecutor` 在 `cli/observe.py`，不在打包范围）、`on_chunk`（无 turn/step）、轮询 `session.events`。要定包装层放哪（lodestar 的 `agent/server/` 下自建，不往 wo-agent 里塞宠物代码）。
- **大脑的职责**：确定性状态机决定「什么时候说话」，模型决定「说什么」——还是模型也能改判据。
- **大脑的输入与输出**：输入是原始事件流、摘要，还是状态机给出的结构化上下文；输出只出气泡话术，还是也回灌给 agent（现有 `additionalContext` 通道）。
- **失败降级**：模型超时、断网、key 失效时退回纯规则模式。
- **自指问题**：大脑自己跑的也是 wo-agent，它的事件会不会反过来触发监控。

## 已知事实

- 现有判定全部在 `agent-hook/pet/state.js`（213 行）与 `classify.js`（27 行）+ `tool-rules.json`。
- `compose()` 的 ctx 有 `tools`、`skills`、`system_prompt`、`compaction`、`commands`，没有观察者槽。
- 现有注入通道已跑通：server 在 `/event` 响应体里带 `hookSpecificOutput.additionalContext`，钩子透传 stdout，模型上下文里能收到（已实测）。
- 现有三个开关：`toggles.pet`、`toggles.systemMessage`、`toggles.agentNudge`。
- wo-agent 的 `context_pressure` 与 `sum_usage` 是现成的上下文压力与用量投影。

类型：grilling
状态：已关闭
阻塞于：01

## 关闭原因（2026-11-22）

pet 目前不接 wo-agent；不做 server 侧判定与大脑。判出本图范围，地图「尚未明确」里留了「pet 接入 wo-agent」一条，将来要回访时另起一张图。
