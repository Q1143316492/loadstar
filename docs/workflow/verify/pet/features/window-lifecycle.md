# 窗口与实例生命周期

桌宠是一个常驻的透明置顶窗口：从 `npm start` 起到 `/quit`（或 Esc）止。它要能从一个空数据目录一次起干净、能被关干净、展开对话卡时不带着宠物跳位置。窗口拖动、原生右键菜单、置顶层级与开机自启属于系统层，本手册只标注怎么人工看，不假装驱动过。

## Sub-features

- `window-launch` `launch` 从空目录到可用：`/health` 应答、CDP 上有渲染页、渲染页拿到 `petAPI` 且 `#pet` 存在。
- `window-quit-endpoint` `POST /quit` 先回包再退出，端口与进程都释放。
- `window-quit-esc` 收起态按 `Esc` 退出；展开态第一次 `Esc` 只收起。
- `window-chat-resize` 展开对话卡时窗口从 240 宽变到约 520 宽、高度 ≥ 320，宠物在屏幕上的右下锚点不动；收起回到 240×240。
- `window-position` 拖动移动、松手落盘、换屏后夹回可见区——**未覆盖**，系统层。
- `window-menu` 宠物上右键的系统原生菜单「重启桌宠 / 退出」——**未覆盖**，原生菜单。
- `window-top` `screen-saver` 层级的置顶——**未覆盖**，需要另一个窗口来观察层级。
- `window-autostart` 开机自启的启动文件夹快捷方式——**未覆盖**，属于安装步骤。

## How to get to it (user POV)

- 日常启动：`agent/client/pet` 下 `npm start`（前台）或 `npm run start:detached`（后台，日志在 `state/pet.out`）。
- 关闭：宠物上右键「退出」、`/quit`、或收起态按 `Esc`。
- 展开/收起：点小胶囊或气泡；箭头或 `Esc` 收回。
- 拖动：抓住宠物本体移动，位置会被记住。

## Driving it with verify.js

Preconditions:

- 没有本手册的实例在跑（`RUN_DIR` 目录里没有活实例），否则 `launch` 会拒绝。

- **启动就绪。** 跑 `node docs/workflow/verify/pet/verify.js launch`。输出 `ok:true` 且带 `runDir`/`port`/`debugPort`/`pid`；紧接着 `doctor --run "<RUN_DIR>"` 全绿；`snap` 得 `state:"idle"`、`window` 为 240×240。`evidence --label window-launch` 留一份基线。
- **对话卡尺寸与锚点。** 记下收起态的 `window.x + pet.x + pet.width`（宠物右边缘的屏幕 x）与 `window.y + pet.y + pet.height`（下边缘）。`click --selector '#chat-open'`，再 `snap`：`window.width` 约 520、`window.height ≥ 320`，而宠物的屏幕右边缘/下边缘与收起态相差不超过 1–2 像素（DPI 取整）。`key --key Escape` 收起，确认回到 240×240、锚点仍不动。`evidence --label window-chat-resize` 抓展开态截图。
- **`/quit`。** 跑 `node docs/workflow/verify/pet/verify.js quit --run "<RUN_DIR>"`。输出 `portDown:true`、`pidAlive:false`、`stoppedCleanly:true`；再用 `curl -s -m 2 http://127.0.0.1:<PORT>/health` 确认连不上。之后 `cleanup --run "<RUN_DIR>"` 仍会把日志搬进证据目录。
- **Esc 退出。** 重新 `launch` 一个实例，保持卡片收起，跑
  `node docs/workflow/verify/pet/verify.js key --key Escape --no-snapshot`。命令打印 `snapshot:"skipped"`、`pageGone:true`（按键后页面随即消失，不再取 DOM）。随后 `curl` 到 `/health` 失败、`tasklist /FI "PID eq <pid>"` 里没有这个 pid。再 `cleanup` 收尾。
- **人工看的部分。** 下面几条每次改动窗口相关代码后各看一眼，不写进自动配方：
  - 拖动宠物到别处，松手后 `RUN_DIR/app/state/position.json` 出现且坐标变了；重开实例还在原位。
  - 把 `position.json` 的 `x`/`y` 改到屏幕外，重启实例后窗口被夹回最近的显示器工作区。
  - 在宠物上右键，弹出「重启桌宠 / 退出」；点「重启桌宠」后窗口回来、`/health` 重新应答。
  - 打开一个全屏或置顶窗口，宠物仍压在最上层。
  - 启动文件夹里的 `launch.vbs` 快捷方式能让桌宠在登录后自己起来。

## Gotchas

- `quit` 与 `cleanup` 都只按 `run.json` 里的端口与 pid 收尾；**不要**用 `Get-Process electron | Stop-Process` 这种按进程名的关法，会连带结束用户的日常桌宠。
- `Esc` 是两段语义：展开时收起，收起时退出。自动配方里收起之后不要再按第二次。
- 展开态的窗口宽度来自 `main.js` 的 `CHAT_WIDTH`，高度是 `max(320, petSize + 300)`；宠物尺寸可配，所以高度别写死。实测外框比 `setBounds` 多 1 像素左右（DPI 取整），用区间断言。
- 收起/展开的锚点计算带 DPI 取整，允许 1–2 像素误差；超过就不是取整，是回归。
- `--shot=<png>` 是主进程里的原型截图开关：它**不启动 HTTP 服务**，只把窗口内容存图后退出。`PET_SHOT_MENU=1` 只是在渲染页里派发一个 DOM `contextmenu` 事件，不会打开系统的原生菜单——别拿它证明右键菜单。
- 位置、置顶、菜单、自启这四项没有可信的自动驱动路径：CDP 只到渲染页，截图只含窗口内容。地图里标它们「未覆盖」，用人工步骤补，别用别处的证明冒充。
