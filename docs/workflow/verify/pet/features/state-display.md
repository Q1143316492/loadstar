# 三态外观与状态气泡

宠物在窗口里的脸（灰 / 蓝 / 橙）和头顶气泡，是用户判断「有没有会话在干活、是不是该管管了」的主要渠道。窗口永远只显示一个会话：预警优先于工作中，工作中优先于空闲；多个预警按最早进入的那个排。气泡末尾会补上「另 N 个预警」「共 N 会话」，让人知道还有别的会话。

## Sub-features

- `display-idle` 没有会话或会话都空闲时，灰色 `idle.svg`，气泡隐藏。
- `display-working` 有会话在调工具时，蓝色 `working.svg`，气泡是 `工具 · 连续读次数/上限`。
- `display-alert` 越过预警阈值时，橙色 `alert.svg`，气泡是 `连续 N 次读未写`。
- `display-multi` 多会话时只显示最紧急的：预警 > 工作中 > 空闲，多个预警按 `alertSince` 最早；气泡带 `另 N 个预警` 与 `共 N 会话`。
- `display-visible-toggle` 副本配置 `toggles.pet=false` 时窗口恒为 idle（`/state.main` 直接是 `{state:'idle'}`）；doctor 把这条配置判为不可验证。

## How to get to it (user POV)

- 窗口由 `npm start` 常驻；用户不切换状态，状态由会话事件推动。
- 灰色带蓝/橙变化是唯一的「现在忙不忙」提示；气泡上的数字是连续读计数与阈值。
- 气泡本身可点，展开对话卡（见 [对话卡](./chat-card.md)）。

## Driving it with verify.js

Preconditions:

- 实例是刚 `launch` 的，`doctor` 全绿，`RUN_DIR` 已知。
- 从 doctor 或 `state` 读出 `consecutiveLimit`，下文记作 `<limit>`（默认 25；用户调过 `thresholds.consecutiveReads` 时会不同）。
- 钩子通道先设 `PET_PORT=<launch 打印的 port>`。

- **空闲基线。** 跑 `node docs/workflow/verify/pet/verify.js snap`。得到 `state: "idle"`、`img: "idle.svg"`、`bubbleHidden: true`、`window.width: 240`、`sessions` 为 0（`state` 命令里看）。
- **工作态。** 跑 `PET_PORT=<PORT> node agent/hooks/simulate.js --reads 3 --keep --session w1`。再 `snap`：`state: "working"`、`img: "working.svg"`、`bubbleHidden: false`、`bubble` 形如 `Read · 3/<limit>`；`state` 里 `main.session="w1"`、`reads=3`、`tool="Read"`。看完结束它：`simulate.js --end --session w1`。
- **预警态。** 跑 `PET_PORT=<PORT> node agent/hooks/simulate.js --reads <limit> --keep --session a1`。`snap`：`state: "alert"`、`img: "alert.svg"`、`bubble` 为 `连续 <limit> 次读未写`；`state` 里 `alerts=1`、`sessions=1`。日志里应有 `"reason":"consecutive-reads"`：
  `grep consecutive-reads "<RUN_DIR>/app/logs/a1.jsonl"`。
- **优先级与计数。** 在 a1 仍是预警时，再造第二个预警和一个工作中会话：
  `simulate.js --reads <limit> --keep --session a2`、`simulate.js --reads 3 --keep --session w1b`。
  `snap` 应得 `bubble` 为 `连续 <limit> 次读未写 · 另 1 个预警 · 共 3 会话`，`state` 里 `main.session="a1"`（最早进入预警）、`alerts=2`、`sessions=3`。此时跑 `evidence --label display-multi`，截到带「另 1 个预警」的那一屏。
- **预警退出后的接棒。** 跑 `simulate.js --end --session a1`。`snap`：`bubble` 为 `连续 <limit> 次读未写 · 共 2 会话`，`main.session="a2"`。再 `--end --session a2`：`bubble` 为 `Read · 3/<limit>`（`main.session="w1b"`，只剩一个会话时不带后缀）。
- **回到空闲。** `--end --session w1b`。`snap`：`state: "idle"`、`bubbleHidden: true`；`state` 里 `sessions=0`。
- **取证。** 每个形态各跑一次
  `node docs/workflow/verify/pet/verify.js evidence --label display-alert`（或 `display-working` / `display-multi`）。三件证据必须认得出：宠物颜色与表情、气泡文字（可见时）、`data-state`。

## Gotchas

- 气泡在 idle 时隐藏，但 `#bubble-text` 保留上一状态的字；断言「没有气泡」要用 `bubbleHidden: true`，不能看文字为空。
- `共 N 会话` 的 N 是 `/state.sessions`，包含已经空闲但没收到 `SessionEnd` 的会话。想让计数干净，先结束不用的会话。
- 气泡里的 `<limit>` 来自当前配置。用户调过阈值时，`simulate --reads 25` 会早早越线或根本越不过；先 doctor 拿实际值，或 `configure --set thresholds.consecutiveReads=25` 明确设定。
- 预警后继续读，气泡里的次数会继续涨（`reads` 是连续读总数），但不会再次喊话（见 [预警判定与喊话](./alert-rules.md)）。
- 窗口是透明无边框的，CDP 截图的背景透明；看图工具可能显示成白色。这不影响「认得出宠物与气泡」。
- 气泡宽度有限（约宠物宽 + 60px），多会话文字在窗口里会被省略号截断；断言用 DOM 文本，截图只证明大意。
- `toggles.pet=false` 时窗口恒 idle、气泡不出现；doctor 的 `config.pet-toggle` 会失败。`toggles.pet` 是热读的（下一次聚合与广播生效），要验证显示就先 `configure --set toggles.pet=true`，再等一次 `snap` 看到变化；只有端口是启动时读的。
