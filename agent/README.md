# agent

Claude Code 钩子 + 本机桌宠：会话连续只读、久不写时，桌宠亮起并让模型报一句进展。

- [`hooks/`](hooks/) —— 钩子客户端与安装脚本。
- [`pet/`](pet/) —— 桌宠（Electron）。

设计与决策记录在 [`docs/workflow/maps/agent-monitor/map.md`](../docs/workflow/maps/agent-monitor/map.md)。

## 安装

桌宠与钩子分开：**装依赖、启动桌宠**是必需的；**装钩子**只有想让桌宠看见会话时才需要，默认不做。

### 1. 修目录完整性标签（本机特有，已完成）

本仓目录曾被打上 **Low integrity** 标签，Electron 的 Chromium 沙箱在里面起不来。在一个普通（非沙箱）终端里执行一次：

```powershell
icacls D:\Workspace\lodestar /setintegritylevel "(OI)(CI)M"
```

用 cmd 也行：

```cmd
icacls D:\Workspace\lodestar /setintegritylevel (OI)(CI)M
```

**2026-11-20 已修好**：标签现为 Medium，Electron 33 不加 `--no-sandbox` 即可启动。若之后桌宠写缓存或删除文件又报权限错误，再清掉根目录那条「禁止删除子项」的 ACE：

```powershell
icacls D:\Workspace\lodestar /remove:d Everyone
```

### 2. 钩子（默认不装，按需开启）

钩子是桌宠唯一的事件来源，但它会改写你的用户级配置，所以**默认不安装，也不随仓库生效**。

想开启时执行：

```powershell
node agent\hooks\install.js
```

它会备份 `~/.claude/settings.json`，再给 `PostToolUse`、`SessionStart`、`SessionEnd`、`UserPromptSubmit`、`Stop` 各加一条超时 1 秒的命令钩子；已经装过就跳过。**改动要重启 Claude Code 会话才生效。**

对应写入的形状（路径一律正斜杠——Claude Code 在 Windows 上也用 POSIX shell 执行钩子，反斜杠会被当成转义符吃掉）：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "hooks": [
          { "type": "command", "command": "\"C:/Program Files/nodejs/node.exe\" D:/Workspace/lodestar/agent/hooks/claude-code-hook.js", "timeout": 1 }
        ]
      }
    ]
  }
}
```

不想要了就 `node agent\hooks\install.js --uninstall`，只删本项目的条目。

不装钩子时桌宠仍然可以启动、`/health` 与 `/state` 也正常，只是收不到任何会话事件。

### 3. 装依赖并启动桌宠

```powershell
cd agent\client\pet
npm install
npm start
```

`npm start` 走 `bin/start.js`：它清掉环境里可能存在的 `ELECTRON_RUN_AS_NODE` 再拉起 Electron——那个变量会让 Electron 以纯 Node 模式运行，桌宠起不来。

想让它脱离终端继续跑（命令立即返回、日志写到 `pet/state/pet.out`），用 `npm run start:detached`。

首次安装若 Electron 二进制下载失败，用镜像重试：

```powershell
$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
npm install
```

### 4. 开机自启（可选）

给桌宠建一个快捷方式放进启动文件夹：

1. `Win+R` 输入 `shell:startup` 回车，打开启动文件夹；
2. 右键 → 新建快捷方式；
3. 目标填：

   ```
   "C:\Windows\System32\wscript.exe" "<仓库路径>\agent\client\pet\launch.vbs"
   ```

   （`launch.vbs` 在 `pet/` 下，负责隐藏控制台窗口启动 Electron。）
4. 想取消自启，删掉这个快捷方式即可。

## 配置

配置键、阈值含义、开关与话术模板见 [`workflow/cwl-pet/SKILL.md`](../workflow/cwl-pet/SKILL.md) 的「设置」一节；文件本身是 [`client/pet/pet.config.json`](client/pet/pet.config.json) 与 [`client/pet/tool-rules.json`](client/pet/tool-rules.json)，改完一秒内生效。

默认值由 [`client/pet/config.js`](client/pet/config.js) 一处填好：判定、窗口、日志目录与钩子都向它要值，代码里不再各写一份回落数字。配置文件里出现没有消费方的键会在启动时告警。**端口也在这份配置里**，钩子从同一个文件读取，改 `port` 不用再同步别处（临时覆盖可用环境变量 `PET_PORT`）。

默认判据（任一成立即预警，任一写操作解除）：

- 连续读 ≥ 25 次；
- 距上次写 ≥ 10 分钟且期间工具调用 ≥ 8 次。

## 端点

| 端点 | 用途 |
|---|---|
| `POST /event` | 钩子送事件；有话说时响应体带 `hookSpecificOutput.additionalContext` |
| `GET /state` | 当前各会话状态 JSON |
| `GET /health` | 存活探测 |
| `POST /quit` | 关闭桌宠；重启前也可用它先停干净 |

## 测试

### 单元测试

```powershell
cd agent\client\pet
npm test
```

覆盖工具三分类、Bash 规则、连续阈值、时间窗阈值、中性工具不清零、写操作解除、用户发言解除、空闲降级、会话销毁、日志两种记录。

### 真会话验证

钩子配置只在会话启动时加载，**装完要重启 Claude Code**。重启后：

1. 让 agent 做一件只读的长活（例如「逐个读 workflow/ 下 25 个 SKILL.md」）；
2. 看 `agent/client/pet/logs/<session-id>.jsonl` 是否出现，`transition` 里应有 `to: "alert"`；
3. 验证模型确实收到话术：在 `~/.claude/projects/<项目>/<session-id>.jsonl` 里搜「先向用户报一句」，应有一条 `"type":"hook_additional_context"`。

不想重启当前会话，也可以用独立会话跑一次：

```powershell
claude -p "逐个读取 workflow 下全部 25 个 SKILL.md，每个说一行。只读，不要改文件。" --allowedTools "Read,Glob"
```

模拟会话、查状态、排查钩子不生效，见 [`workflow/cwl-pet/SKILL.md`](../workflow/cwl-pet/SKILL.md)。

## 验证

桌宠开着时，随便跑一次工具调用，看 `agent/client/pet/logs/` 是否出现按会话命名的 `.jsonl`；关掉桌宠再跑一次，会话应当毫无变化——钩子 1 秒内放弃，不打扰任何东西。查状态与排查见 [`workflow/cwl-pet/SKILL.md`](../workflow/cwl-pet/SKILL.md)。

## 卸载

```powershell
node agent\hooks\install.js --uninstall
```

只删除本项目的钩子条目，其他钩子保留。日志与状态目录（`pet/logs/`、`pet/state/`）可以手动删除。桌宠自启的快捷方式见第 4 步。

## 排错

钩子不生效、桌宠不亮、窗口看不见，按 [`workflow/cwl-pet/SKILL.md`](../workflow/cwl-pet/SKILL.md) 的「钩子不生效时」与「桌宠看不到时」两节排查。
