# 常驻前台桌宠窗口的形状

## 问题

做一个能跑的最小窗口原型，让人看着它回答：这个宠物长什么样、怎么待在屏幕上。

必须验证的：

- Electron 透明无边框窗口在 Windows 11 上能否稳定置顶在其他应用之上；失焦后会不会掉到后面。
- 点击穿透（`setIgnoreMouseEvents` + 转发）与「可拖动位置」如何共存：哪里可点、哪里穿透。
- 多显示器与分辨率变化时的行为。
- 状态切换时换静态图的最小实现：图片路径约定、重启是否恢复上次位置。
- 静态图先用手画的占位（三个状态各一张）即可；GIF / 动画后期替换。

原型不追求好看，只求「能看见它、能拖它、能换图」。产物链接进票。

类型：prototype
状态：已解决
阻塞于：无

## 答案

原型位于 [`agent-hook/pet/`](../../../../agent-hook/pet/)，三态渲染截图：`../artifacts/pet-idle.png`、`../artifacts/pet-working.png`、`../artifacts/pet-alert.png`（由原型自带的 `--shot=` 输出）。

### 已跑通

- **透明无边框置顶窗口**：`frame:false` + `transparent:true` + `setAlwaysOnTop(true, 'screen-saver')`。层级用 `screen-saver` 而非默认 `floating`——后者会被部分置顶窗口压住。
- **点击穿透与拖动共存**：整窗默认 `setIgnoreMouseEvents(true, {forward:true})`；renderer 用 `elementFromPoint` 判断指针是否落在宠物图上，命中时才临时接管鼠标。于是「宠物身上可点可拖、其余区域透传给下面的应用」两者不冲突。按下滑动超过 4px 算拖动，否则算点击（点击 = 静音开关）。
- **三态换图**：`assets/idle.svg`、`working.svg`、`alert.svg` + 兜底 `unknown.svg`，renderer 只改 `<img src>`；`--state=` 可指定启动状态，键盘 1/2/3 可切换。
- **位置记忆**：`state/position.json`，重启恢复。
- 气泡文案、静音标记、退出按钮均已可见。

### 实现细则（后续实现的起点）

- Electron **33.4.11** 在本机可用；**45.4.1 在仓库目录下起不来**（直接退出，无输出），未进一步定位，版本先钉 33。
- **环境坑（已解决）**：`D:\Workspace\lodestar` 目录曾带 Low integrity 标签，Electron/Chromium 的沙箱在此目录下无法启动（`--version` 都失败）；当时用 `--no-sandbox` 运行，进程也因此写 `%TEMP%` 被拒（EPERM）。**2026-11-20 用户执行 `icacls ... /setintegritylevel "(OI)(CI)M"` 后标签变为 Medium，不加 `--no-sandbox` 即可启动，且能正常写临时目录。** 正式路径不再需要任何绕行。

### 尚未验证（原型未覆盖）

- 失焦后是否真的不沉底（需要人工盯着看）。
- 多显示器与分辨率变化。原型只取主屏工作区定位。
- 真实鼠标交互的手感（本次用渲染截图验证，未做真人拖动）。
- 打包成独立 exe 后的行为。

### 留给后续的

- 调试提示行已按试用反馈删除；`Esc` 退出保留。
- 拖动最终实现：**主进程按 8 ms 节拍读系统光标位移并设置窗口位置**；renderer 用 Pointer Events + `setPointerCapture`，只负责判断「点击还是拖动」并保证在 `pointerup` / `pointercancel` / `lostpointercapture` / 窗口失焦任一路径发出 `drag-end`。
  - 为什么不用 renderer 的 `screenX` 驱动窗口位置：Chromium 会在窗口移动后重新合成鼠标事件的屏幕坐标，拿它算目标位置会形成「移动窗口 → 坐标变 → 再移动」的正反馈，表现为**鼠标停住宠物还在加速漂走**。
  - 为什么不用「每帧发 IPC 目标位置」：除上条外，松手事件一旦丢失（例如拖动中切换点击穿透会取消鼠标捕获），窗口就会一直跟着光标滑。现在定时器由主进程持有、`drag-end` 必达，且拖动期间不切换点击穿透。
  - 坐标口径实测（本机 125% 缩放）：`screen.getCursorScreenPoint()` 与 `win.getPosition()` 同为 DIP，物理光标 1280,720 对应 DIP 1024,576，不需要按缩放比换算。
  - 目标位置与当前窗口位置相同则不调用 `setPosition`，避免空转；位置在 `drag-end` 落盘，非拖动期间的移动另走 500 ms 防抖保存。
  - 模拟拖动实测：按住、移动、停住 1.5 秒期间，窗口位置一格未动；松手后立即停止。拖动节拍日志由 `PET_DRAG_LOG=1` 开启。
- **去掉所有 CSS 动画**：此前给「工作中」加了上下浮动、给「预警」加了呼吸缩放，视觉上就是「宠物自己在动」——与 05 票「第一版静态图」冲突，已删除。
- **多显示器**：启动时把保存的位置夹到最近显示器的工作区内（换屏、拔副屏、改缩放后不会整块跑到屏幕外）；`display-added/removed/metrics-changed` 时重新夹一次。本机三块屏实测：位置 (2018,-60) 启动后被夹到 (2048,0)。
- 气泡已贴到宠物头顶（`bottom: 268px`），窗口高度随之下调到 320。

- 操作入口改到**右键菜单**（系统原生 `Menu.popup`）：静音此会话 / 重启桌宠 / 退出。原先气泡上的 `×` 一点就退出、挨着鼠标，太容易误触；HTML 自绘菜单在 240×240 的透明窗口里放不下，会压住宠物，故用原生菜单。左键仍是静音开关。

- **拖动最终定案：CSS `-webkit-app-region: drag`**，由 Windows 自己移动窗口。此前三种自研方案（renderer 用 screenX 算、主进程轮询光标、借 PowerShell 发 WM_NCLBUTTONDOWN）在这台机器上都会漂移或直接失效：日志显示主进程读到的光标位移与窗口位移不是 1:1，且原生移动消息发出后 1 ms 即返回。系统拖动不受这些影响。
  - 代价：拖动区内不接收鼠标事件，窗口也不再做点击穿透（整块 240×240 接管鼠标，透明边角会挡住下面应用的点击）。静音与「更多」因此移到气泡这一行；Esc 仍可退出。
- **右键菜单与系统菜单**：`-webkit-app-region: drag` 在 Windows 上等同标题栏，右键会弹系统的「还原/移动/大小/关闭」。用 Electron 官方的 `win.on('system-context-menu')` + `event.preventDefault()` 拦下，改为弹本应用菜单（重启桌宠 / 退出）；气泡上的 `⋯` 走同一函数。
