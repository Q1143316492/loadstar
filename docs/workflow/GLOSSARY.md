# 领域词汇表

本文件收项目里承重的概念：一个名字定下来，代码、文档与讨论都用它。

## 桌宠（`agent/`）

- **配置解析**（`agent/client/pet/config.js`）：把 `pet.config.json` 读成填好默认值的唯一配置对象。判定、窗口、日志目录与钩子都向它要值，代码里不再各写一份回落数字。

## wo-agent（`agent/server/wo-agent/`）

- **事件目录**（`src/session/catalog.py`）：会话事件类型的权威表——每种事件怎么读写、上不上表层、参与哪些计算（用量、工具配对、turn 边界）。
- **工具失败值**（`src/tools/errors.py` 的 `ToolFailure`）：工具失败的唯一结构化表示（`code` + `message`），从抛出点一路带到执行结果、模型可见文本与 `tool/result` 日志。
