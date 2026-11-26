# 对话卡

对话卡是宠物下方小胶囊展开的那块面板：看桌宠主动报的消息、发自己的话、清空或收起。卡片向右上方的反方向展开——宠物在屏幕上的位置不动，窗口变宽变高。卡片收起时，新的主动消息只在入口上留一个粉点与一圈粉边；打开即清。

## Sub-features

- `chat-open` 点入口胶囊（宠物下方）或可见的状态气泡，展开对话卡：窗口变宽、输入框拿到焦点、气泡让位、页眉显示与气泡同一状态文本。
- `chat-send` 输入并发送，消息以「你 · 时刻」出现在列表里，输入框清空；桌宠当前不回复。
- `chat-clear` 清空按钮只清窗口里这份消息；服务端通知队列不受影响，也不会回填。
- `chat-collapse` 收起按钮或 `Esc` 收回宠物大小；收起态再按 `Esc` 是退出应用。
- `chat-unread` 收起时收到新的主动消息，入口带 `.unread`（粉边 + 右上角点），不弹别的；打开卡片即清。
- `chat-turn-end` 一轮里调过工具、随后收到 `Stop`，桌宠报一条「这一轮结束了 · 会话名」；纯聊天回合、`stop_hook_active` 回合不报。
- `chat-session-label` 会话名优先用 Claude Code 生成的标题；读不到时退回「目录名 · 会话 id 前 8 位」。

## How to get to it (user POV)

- 左键球下方的小胶囊；有气泡时直接点气泡也行。
- 卡片右上角箭头或 `Esc` 收起；收起后 `Esc` 退出桌宠。
- 输入框回车或点「发送」；右上角垃圾桶清空。

## Driving it with verify.js

Preconditions:

- 刚 `launch` 的实例，`doctor` 全绿。
- **先跑一次 `snap` 或 `doctor` 再制造通知**：渲染页把第一次收到的 `/state` 里的通知当基线，之前进队列的通知不会回放；先让窗口活过一次状态广播，后面的通知才会出现。
- 所有命令在仓库根目录执行（`simulate.js` 用当前目录当会话的 `cwd`，会话名会用到目录名）。

- **展开。** 跑 `node docs/workflow/verify/pet/verify.js click --selector '#chat-open'`。得到 `chatHidden:false`、`focus:"chat-input"`、`window.width:521`、`window.height ≥ 320`；`bubbleHidden:true`（气泡让位）。
- **发送。** 依次 `click --selector '#chat-input'`、`type --text '回归测试消息'`、`click --selector '.chat-send'`。最后一条 `messages` 形如 `你 · HH:MM回归测试消息`，`inputValue:""`。
- **清空。** `click --selector '#chat-clear'`，`messages:[]`。
- **收起。** `key --key Escape`：`chatHidden:true`、`window.width:240`，宠物在屏幕上的位置与展开前一致（`window.x + pet.x` 不变）。**不要再按一次 Esc**——收起态按它会直接退出实例。
- **这一轮结束（收起态 + 未读）。** 先收起，再跑
  `PET_PORT=<PORT> node agent/hooks/simulate.js --reads 3 --stop --keep --session t1`。
  `snap`：`unread:true`、`messages` 里出现 `这一轮结束了 · lodestar · t1`；`state` 里 `notices` 最后一条的 `kind:"turn-end"`、`session:"t1"`、`title:null`、`cwd` 是仓库根。再 `click --selector '#chat-open'`，`unread:false`，消息仍在。
- **纯聊天回合不报。** 读一次 `state` 里的 `notices` 长度；发 `event --json '{"event":"SessionStart","session_id":"chat-only","cwd":"D:/x"}'`、`event --event UserPromptSubmit --session chat-only`、`event --event Stop --session chat-only`。`notices` 长度不变。
- **`stop_hook_active` 不报。** 新会话 `SessionStart`、`UserPromptSubmit`、一次 `PostToolUse --tool Read`，然后
  `event --json '{"event":"Stop","session_id":"active1","stop_hook_active":true}'`。`notices` 长度不变；`/state.detail` 里会话仍在。
- **会话标题。** 造一份带标题的 transcript，走真实钩子进程：
  ```bash
  TMPD=$(mktemp -d)
  printf '%s\n' '{"type":"user","message":"hi"}' '{"type":"ai-title","aiTitle":"回归验证标题"}' > "$TMPD/t.jsonl"
  echo '{"hook_event_name":"UserPromptSubmit","session_id":"title-e2e","cwd":"D:/x"}' | PET_PORT=<PORT> node agent/hooks/claude-code-hook.js
  echo '{"hook_event_name":"PostToolUse","session_id":"title-e2e","tool_name":"Read"}' | PET_PORT=<PORT> node agent/hooks/claude-code-hook.js
  echo "{\"hook_event_name\":\"Stop\",\"session_id\":\"title-e2e\",\"cwd\":\"D:/x\",\"transcript_path\":\"$(cygpath -m "$TMPD/t.jsonl")\"}" | PET_PORT=<PORT> node agent/hooks/claude-code-hook.js
  rm -rf "$TMPD"
  ```
  `state` 里 `detail` 的该会话 `title:"回归验证标题"`；`notices` 最后一条同样带标题；卡片里的消息是 `这一轮结束了 · 回归验证标题`。
- **取证。** 未读那一屏跑 `evidence --label chat-unread`（要截到粉点），卡片打开后跑 `evidence --label chat-turn-end`；两处都要同时抓 `/state.notices` 与 DOM `messages`。

## Gotchas

- 消息只在窗口内存里，没有持久化：重启桌宠、重开窗口都会清空。`chat-clear` 也只清窗口，不动服务端通知。
- 通知的去重基线是「窗口收到的第一份 `/state`」；实例刚起来就发 `Stop`，通知会被基线吞掉，看起来像没到。先 `doctor`/`snap` 再发。
- 纯聊天回合（这一轮没调工具）不报；`stop_hook_active`（别的钩子让模型继续）也不算结束。
- 会话名的兜底是「目录名 · 会话 id 前 8 位」，其中目录名取 `cwd` 最后一段。命令在别处执行时，标签会变。
- 标题只在 `Stop` 时由钩子从 transcript 尾部 256 KB 里读最后一个 `ai-title`；读不到就是 `null`，消息退回兜底标签。
- 点气泡展开只在气泡可见时有效；idle 没有气泡，用入口胶囊。
- 卡片展开时 `#bubble` 隐藏、`#chat-status` 显示同一段状态文本；别拿气泡去断言展开态。
- `Esc` 是两段语义，收场统一用 `cleanup`，不要靠连按 `Esc`。
