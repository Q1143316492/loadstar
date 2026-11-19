# 用户级安装与桌宠自启

## 问题

把钩子装进用户级 `~/.claude/settings.json`、让桌宠跟着开机 / 登录自启，并写清楚怎么卸。

要办：

- 用户级配置怎么改才幂等：重复安装不产生重复钩子；已有钩子不受影响；给出卸载 = 删哪几行的确切说明。
- 钩子命令怎么写才跨项目可用：绝对路径、工作目录、Node 是否存在（用 `node` 还是 `py` 还是直接可执行脚本）。**若 01 表明可以直接跑可执行文件，就不引入解释器依赖。**
- 桌宠自启：登录启动项（注册表 Run / 启动文件夹 / 快捷方式）选哪一种；手动启动的方式也要有。
- 端口占用：47900 被占时桌宠怎么办（报错、换端口、还是静默）。
- 宠物没开时的行为验证：钩子必须 1 秒内静默放弃，会话无感。

类型：task
状态：已解决
阻塞于：01, 04

## 已知事实

- 用户级配置是 `~/.claude/settings.json`（本机 `C:\Users\chenweilin\.claude\settings.json`），钩子配置在**会话启动时加载**，改完要重启会话才生效——安装说明里写清楚。
- 钩子挂住不会阻塞会话（到超时即被杀、输出丢弃），但仍应把超时设成 1 秒级，避免每个工具调用白等。
- 钩子有多种类型：`command`（跑脚本）、`http`（直接 POST）。若「事件协议」票选定 `http`，本票就只剩改配置一件事，没有脚本要装。

## 答案

已按推荐默认实现，五条选择记为**假设**（未经逐条确认，都可逆，随时可改）：

| 选择 | 采用 | 产出 |
|---|---|---|
| 低完整性目录 | 用户手动修一次目录标签（已于 2026-11-20 完成，Medium） | [`agent-hook/README.md`](../../../../agent-hook/README.md) 第 1 步 |
| 自启机制 | 启动文件夹快捷方式（`shell:startup`） | `pet/launch.vbs` + README 第 4 步 |
| 脚本运行时 | Node（本机 v24） | `hooks/claude-code-hook.js` |
| 安装方式 | `install.js` 幂等合并 + 备份 | `hooks/install.js` |
| 卸载 | 同脚本 `--uninstall` | 同上 |

### 实测结果

- **桌宠没开**：钩子退出码 0、stdout/stderr 均为空、耗时约 115 ms。会话无感。
- **桌宠开着**：转发成功，载荷只含白名单字段（`event` / `session_id` / `cwd` / `ts` / `tool_name` / `tool_input` 小字段），大文本不转发。
- **回话透传**：桌宠返回 `hookSpecificOutput.additionalContext` 时，钩子原样打印到 stdout，Claude Code 会解析成模型上下文。
- **安装往返**：重复安装报「已是最新」不重复写；卸载后原有其他钩子（`Stop`、`PreToolUse` 带 matcher）与 `model` 等设置原样保留。
- **备份**：每次改动前生成 `settings.json.bak-<ISO 时间戳>`。

### 钩子配置

五个事件（`PostToolUse`、`SessionStart`、`SessionEnd`、`UserPromptSubmit`、`Stop`）各一条，`timeout: 1`，命令为 `"<node 绝对路径>" <仓库>/agent-hook/hooks/claude-code-hook.js`。

### 端口

47900 被占时桌宠报错退出，不换端口；README 的排错表写明改 `pet.config.json` 并同步 `PET_PORT`。

### 未做

- 没有在真实会话里跑过端到端（需要重启 Claude Code 会话，并让桌宠常驻）；这是 08 票的事。
- 自启快捷方式需要用户自己建（`launch.vbs` 已备好，说明在 README）。

## 后补：钩子在真会话里跑不起来（已修，2026-11-20）

用独立无头会话验证时发现 stderr：`Cannot find module 'D:\Workspace\lodestar\Workspacelodestaragent-hookhooksclaude-code-hook.js'`。

原因：Claude Code 在 Windows 上仍用 POSIX shell 执行命令钩子，**命令里的反斜杠被当成转义符吃掉**。写进 `settings.json` 的 Windows 路径因此失效，此前所有真会话里钩子一次都没成功执行（模拟器直连桌宠，所以没暴露）。

修复：`install.js` 把命令里的路径统一转成正斜杠（`C:/Program Files/nodejs/node.exe`、`D:/Workspace/lodestar/agent-hook/hooks/claude-code-hook.js`），cmd 与 sh 都接受；`install.js` 现在还会识别旧的反斜杠条目并原地更新命令，而不是当成已安装跳过。

修后实测（`claude -p` 独立会话，26 次 Read）：`pet/logs/<session>.jsonl` 出现，迁移链为 `session-created → working(session-start) → alert(consecutive-reads) → destroyed(session-end)`；`~/.claude/projects/.../<session>.jsonl` 里确认出现 `"type":"hook_additional_context"`，内容即注入话术。

## 后补：钩子默认不装（2026-11-20）

用户要求钩子不默认安装，文档只提及、由人决定何时开启。原因：它会改写用户的 `~/.claude/settings.json`，属于仓库之外的副作用，不该随仓库生效。

文档已改为「默认不装」：`agent-hook/README.md` 第 2 步标为可选，`workflow/cwl-pet/SKILL.md` 的「钩子」一节开头即写明默认不装、未装时桌宠照常启动只是收不到事件。`install.js` 本身不变，仍是幂等的按需入口。
