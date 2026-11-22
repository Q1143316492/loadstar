# pet 降为纯客户端

## 问题

pet 现在既持有状态机（`state.js` 213 行）、又跑分类规则（`classify.js` + `tool-rules.json`）、又做 HTTP 服务（`server.js`）、又渲染。合仓之后它只应做最后一件事。要定：

- **状态从哪来**：轮询 server 的 `/state`，还是 server 推给它（WebSocket / SSE / 长轮询）。现有实现是主进程把 `state.aggregate()` 通过 IPC 送给 renderer，这一层可以保留，只是数据源换掉。
- **配置拆两半**：`pet.config.json` 现在混了窗口尺寸/素材（归 client）与阈值/开关/话术（归 server）。拆成 `client/pet/pet.config.json` 与 server 侧的配置；`tool-rules.json` 是分类规则，跟判定一起走。
- **断连行为**：server 不在时 client 显示什么；重连后全量同步还是增量。
- **多客户端**：将来有第二个 client 时 server 怎么 fan-out；client 如何声明要哪些会话的状态。
- **不动的部分**：窗口拖动（`-webkit-app-region: drag`）、右键菜单拦截（`system-context-menu`）、三态素材、位置记忆——这些与 client 化无关。

## 已知事实

- 现有端点：`POST /event`、`GET /state`、`GET /health`、`POST /quit`。
- 气泡文案已支持多会话（`· N 会话`、`另 M 个预警`）。
- 静音功能已整条移除，不再回来。

类型：grilling
状态：待办
阻塞于：01
