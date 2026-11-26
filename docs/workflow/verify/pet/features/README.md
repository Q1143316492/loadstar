# cwl-pet 验证地图

这个目录是验证桌宠用户可见行为的维护中事实源。驱动之前先读这份索引，再按对应功能文件走。所有命令都由 `../verify.js` 执行，实例由它隔离启动。

## 覆盖范围

覆盖：窗口三态外观与状态气泡；连续读 / 时间窗 / 写解除 / 用户发言解除 / 中性工具 / 配置热读这些判定；对话卡（展开、发送、清空、收起、未读、这一轮结束通知、会话标题）；会话聚合、结束、空闲回落与日志；实例的启动、/quit、Esc 退出与对话卡展开时的窗口尺寸。

不覆盖：钩子的安装与卸载（它会改写 `~/.claude/settings.json`，按 `workflow/cwl-pet/SKILL.md` 的「钩子」一节手工做）；拖动窗口、位置落盘与离屏夹回；右键原生菜单；置顶层级；开机自启；真实 Claude Code 长会话（可另用 README 里的 `claude -p` 轻量跑一次，但不属于本手册的配方）。

## 基线前提

- Windows 桌面会话，`agent/client/pet` 已 `npm install`；Node ≥ 22（助手用全局 `WebSocket` 连 CDP）。
- 每次验证用 `node docs/workflow/verify/pet/verify.js launch` 起隔离实例：副本源码、分配的空闲端口、独立 `--user-data-dir`、独立日志与证据目录。`RUN_DIR` 是它打印的目录，后续命令一律 `--run "<RUN_DIR>"` 或设 `PET_VERIFY_RUN`。
- 日常桌宠可能正在 `47900` 上跑、钩子可能已装；**它不是验证对象**。不要对它发事件、不要 `/quit`、不要改它的配置。
- 开始前跑一次 `doctor`，`ok:false` 先修。把 doctor 报出的 `thresholds`、`toggles`、`nudge.text` 记下来，配方里的断言按这些实际值写。
- 钩子通道用 `PET_PORT=<launch 打印的 port>` 指路，否则钩子会发给日常实例。

## 驱动约定

- 每个配方从刚 `launch` 的基线开始：`sessions=0`、`state=idle`。配方自己造会话，结束时 `simulate --end` 或直接 `cleanup`。
- 命令照字面执行；`<RUN_DIR>`、`<PORT>`、`<limit>` 换成 launch / doctor / `/state` 里的实际值。
- 事件优先走真实钩子：`PET_PORT=<PORT> node agent/hooks/simulate.js ...`；钩子表达不了的时序与字段（延时、`stop_hook_active`、直接给标题）走 `verify.js event`；用户点按与输入走 `verify.js click/type/key`。
- 选择器用稳定把手：`#pet`、`#bubble`、`#bubble-text`、`#chat-open`、`#chat`、`#chat-input`、`.chat-send`、`#chat-clear`、`#chat-collapse`、`.chat-msg`。
- 配置改动走 `verify.js configure --set …`（副本热读，1 秒生效），`--reset` 还原；端口只在启动时读。
- 用 `snap` / `state` 等待可观察的变化，不用固定 `sleep` 顶替同步；唯一要等的是空闲降级的 30 秒 tick。

## 证明标准

- 抓用户动作和它造成的结果：触发命令 + `/state` 形态 + 窗口截图，三件齐。
- 截图认得出应用与状态：宠物图、气泡文字（可见时）、`data-state`。截图只含窗口内容，不证明位置、置顶、拖动。
- 写操作看副作用：预警要同时有 `/state` 与日志里的 `transition`；「这一轮结束」要同时有 `/state.notices` 与对话卡消息；会话结束要看到 `detail` 消失与 `sessions` 下降。
- 时间窗预警断言日志 `"reason":"time-window"`，不拿气泡文字当判据（两种预警的气泡都写「连续 N 次读未写」）。
- 气泡在 idle 时隐藏，`#bubble-text` 可能残留旧字；断言可见性必须带 `bubbleHidden`。
- 不用 mock，不用内部 setter；`--state=` 只配 `--shot` 用，活实例上用它等于伪造。
- 证据落在 `RUN_DIR/evidence/`，`cleanup` 会保留它并把实例日志搬进 `evidence/logs/`。

## 功能索引

- [三态外观与状态气泡](./state-display.md) —— 灰蓝橙三张小脸、气泡文字、多会话的优先级与计数
- [预警判定与喊话](./alert-rules.md) —— 连续读、时间窗、写解除、用户发言解除、中性工具、配置热读、开关
- [对话卡](./chat-card.md) —— 展开、发送、清空、收起、未读点、这一轮结束通知、会话标题
- [会话状态、聚合与日志](./session-lifecycle.md) —— `/state` 形状、结束、空闲回落、标题读取、JSONL 日志
- [窗口与实例生命周期](./window-lifecycle.md) —— 启动就绪、`/quit`、Esc 退出、展开时的窗口尺寸；系统层行为的未覆盖项
