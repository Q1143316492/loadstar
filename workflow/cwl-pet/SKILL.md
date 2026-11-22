---
name: cwl-pet
description: "操作桌宠预警（agent/）：看状态、重启、关闭、改阈值与话术、装或卸 Claude Code 钩子、排查钩子不生效。"
disable-model-invocation: true
---

# 桌宠

**先读 `docs/workflow/AGENTS.md`**（若存在）：本项目自己的工作流约定。

一个常驻屏幕的小窗口，盯着 Claude Code 会话：连续读很多次、或者很久没有任何写入时，变橙并弹一句提醒，同时让 agent 自己报一句进展。

代码在仓库根的 `agent/`：`hooks/` 是 Claude Code 钩子（事件来源），`client/pet/` 是桌宠界面，`server/` 放判定与大脑。第一次使用先按 [`agent/README.md`](../../agent/README.md) 装依赖（`npm install`）；钩子默认不装，需要时再按「钩子」一节开启。

这份技能按一次操作的顺序排：先确认它当前的状态，再启动或重启、关闭，然后是按需修改设置、装或卸钩子；最后是钩子不生效与窗口看不见两节排查。开机自启只留了指针，步骤在 README。

## 先看状态

```powershell
curl.exe http://127.0.0.1:47900/health   # 桌宠在不在
curl.exe http://127.0.0.1:47900/state    # 各会话状态、计数、当前工具
```

`/state` 里的 `main` 是窗口正在显示的那个会话：`state` 取 `idle` / `working` / `alert`，`reads` 是连续读次数，`consecutiveLimit` 是阈值。`detail` 列出全部会话。某个会话没出现在 `detail` 里，说明它已经结束或被清理。

多会话同时上报时，窗口只显示最紧急的一个（预警 > 工作中 > 空闲；多个预警按最早进入的排），气泡末尾会附会话总数，例如 `Bash · 8/25 · 3 会话` 或 `连续 25 次读未写 · 另 1 个预警 · 共 3 会话`。要逐个看，查 `/state`。

窗口外观与状态对应：

| 外观 | 含义 |
|---|---|
| 灰色笑脸 | 空闲：没有活跃会话，或超过 30 分钟无事件 |
| 蓝色笑脸 | 工作中：有会话在调工具 |
| 橙色皱眉 + 感叹号 | 预警：连续读越过阈值，或时间窗内没有写入 |

拖动宠物即可移动窗口（由系统执行，不会漂移）。在宠物上右键弹出菜单：重启桌宠 / 退出。桌宠当前不发任何声音；以后若要加声音，也放进这个菜单。

## 重启

```powershell
cd agent\client\pet
npm start
```

这样跑会占住终端、日志直接打在屏幕上，适合排查。要它脱离终端继续跑、命令立即返回：

```powershell
cd agent\client\pet
npm run start:detached
```

后台日志写到 `pet/state/pet.out`。

改动 `pet/` 下的代码后需要重启；只改配置不需要。

已经有一个在跑时，先按下一节的「关闭」停掉，避免端口冲突。

起来之后 `/health` 返回 `{"ok":true}` 才算成功；没返回就按「桌宠看不到时」一节查。

## 关闭

```powershell
curl.exe -X POST http://127.0.0.1:47900/quit
```

也可以在宠物上右键选「退出」；或按 `Esc`。命令都够不着时按进程名结束——这会连带结束机器上其他未改名的 Electron 程序，执行前先看看列表：

```powershell
Get-Process electron -ErrorAction SilentlyContinue | Select-Object Id, StartTime
Get-Process electron -ErrorAction SilentlyContinue | Stop-Process -Force
```

`/health` 不再响应，才算关掉了。

## 设置

两个文件都在 `agent/client/pet/`，改完**一秒内生效**，不用重启（写坏了会沿用上一份能读的配置）。

`pet.config.json`：

| 键 | 作用 |
|---|---|
| `thresholds.consecutiveReads` | 连续读多少次触发预警，默认 25 |
| `thresholds.idleMinutes` | 距上次写多久触发，默认 10 分钟 |
| `thresholds.minCallsInWindow` | 时间窗内至少多少次工具调用才算数，默认 8 |
| `thresholds.sessionIdleMinutes` | 多久没事件回落为空闲，默认 30 分钟 |
| `toggles.pet` | 控制窗口是否亮起 |
| `toggles.systemMessage` | 控制终端里那行 `⏳` 提示 |
| `toggles.agentNudge` | 控制是否把话注进模型上下文 |
| `nudge.text` | 注入给模型的话术，`{reads}` 会被替换成次数 |
| `nudge.systemMessage` | 终端提示的模板 |
| `port` | 监听端口，默认 47900；钩子从同一份配置读取，改这一处就够（`PET_PORT` 环境变量可临时覆盖） |
| `window` | 窗口尺寸与宠物图片大小 |
| `logs.keepDays` | 事件日志保留天数，默认 7 |

`tool-rules.json` 决定哪些调用算「读」、算「写」：`readTools` / `writeTools` 是工具名清单，`bash.write` / `bash.read` 是正则表。漏判某条 Bash 写命令时加一条正则即可，不用改代码。

`agent/` 下的事件日志按会话分文件，`pet/logs/<session-id>.jsonl` 每行一条，`kind` 为 `event`（原始事件）或 `transition`（状态变化及原因）。

## 钩子

**默认不装。** 钩子是桌宠唯一的事件来源，但它会改写用户的 `~/.claude/settings.json`，所以只有明确要开启时才动手；没装时桌宠照样能启动，只是收不到会话事件。

开启：

```powershell
node agent\hooks\install.js
```

它给 `PostToolUse`、`SessionStart`、`SessionEnd`、`UserPromptSubmit`、`Stop` 各加一条超时 1 秒的命令钩子，改动前先把 `~/.claude/settings.json` 备份成带时间戳的 `.bak`。重复运行只会更新自己的条目，其他钩子不动。

**改动在 Claude Code 会话启动时才加载**，装完要重启会话。

卸掉：

```powershell
node agent\hooks\install.js --uninstall
```

只删本项目的条目，日志与窗口状态留在 `pet/logs/`、`pet/state/`，可以手动删。

不想重启当前会话时，用模拟器验证链路：

```powershell
cd agent
node hooks\simulate.js --reads 3            # 桌宠应变蓝
node hooks\simulate.js --reads 25           # 越过阈值，打印模型会收到的话术
node hooks\simulate.js --reads 25 --keep    # 会话留着，方便盯着看
node hooks\simulate.js --end --session <id> # 结束模拟会话
```

## 钩子不生效时

按这个顺序查：

1. **钩子在不在配置里**：`~/.claude/settings.json` 的 `hooks` 下应能看到本项目五条。没有就先确认自己**有没有装过**——钩子默认不装；装过则重跑 `install.js`。
2. **命令能不能跑**：手动执行一次，正常应当没有任何输出、退出码 0。JSON 要用单引号整体包住，PowerShell 和 bash 才都不会把它拆开：
   ```powershell
   echo '{"hook_event_name":"PostToolUse","session_id":"probe","tool_name":"Read"}' | node agent\hooks\claude-code-hook.js
   ```
3. **路径写法**：命令里的路径必须是正斜杠。Claude Code 在 Windows 上也用 POSIX shell 执行钩子，反斜杠会被当成转义符吃掉，报错信息里路径中段会出现 `Workspacelodestar` 这种两段粘连的假路径。重跑 `install.js` 会自动把旧的反斜杠条目改成正确写法。
4. **会话重启过没有**：钩子配置只在会话启动时加载。
5. **桌宠在不在**：`/health` 无响应就先启动它。
6. **事件有没有到桌宠**：`pet/logs/` 下应有当前会话的 `.jsonl`；有 `event` 没有 `transition`，说明只是没越过阈值。
7. **模型有没有收到话术**：在 `~/.claude/projects/<项目>/<session-id>.jsonl` 里搜话术开头，应有 `"type":"hook_additional_context"` 的一条。

钩子没装或桌宠没开时，会话行为不受影响：客户端一秒内放弃、退出码 0、不写任何输出。

## 桌宠看不到时

- **先区分「没在跑」和「看不见」**：`/health` 无响应就是在跑的问题，按「重启」一节拉起；有响应则看下一条。
- **位置可能跑到屏幕外**：位置记忆存在 `pet/state/position.json`，删掉即回到主屏右下角。启动时它会被夹进最近的显示器工作区，换屏或拔副屏后不会停在屏幕外。
- **可能被别的窗口盖住**：窗口是透明的，位置与别的窗口重叠时看着像消失。

## 开机自启

给 `agent/client/pet/launch.vbs` 建启动文件夹快捷方式，步骤见 [`agent/README.md`](../../agent/README.md) 的「开机自启」一节。
