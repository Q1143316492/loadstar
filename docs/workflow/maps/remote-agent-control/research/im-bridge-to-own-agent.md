调研日期：2026-11-26

# 借厂商的「手机 ⇄ 电脑」渠道，驱动自己的 Agent

> 起因：用户发现豆包 / Qoder / WorkBuddy 都有移动端控制电脑的功能，但不信任它们的 Agent。问能否只借这个功能，去驱动自己电脑上的 Claude Code 或 DSH。
> 方法：`curl` 直取官方 SDK 仓库源码与 README，GitHub API 检索现成实现。未安装实测。

---

## 0. 关键区分：渠道与执行者是两件事

厂商 App 把两件事焊在一起：

```
手机 App  ──厂商中继──▶  厂商桌面客户端  ──▶  厂商自己的 Agent  ──▶  你的文件
```

你想保留的是前三段里「手机 → 中转 → 桌面机器」这条**传输**，换掉最后一段**执行者**。这在架构上是可分的。

判据：这条传输是不是「你的机器主动外连」的。

- 如果是（WebSocket / Stream / Long Polling），那它本质上就是一个**不需要公网 IP 的消息通道**，厂商只是消息搬运工。
- 如果不是（要求你暴露回调 URL），那厂商实际上在让你做穿透，不合算。

---

## 1. 国内可用的「主动外连」消息通道（一手核实）

### 1.1 飞书 —— 官方长连接（WebSocket）

- 官方 Python SDK `larksuite/oapi-sdk-python` 里有独立的 `lark_oapi/ws` 包，`__init__.py` 只有一行 `from .client import Client`。
- `lark_oapi/ws/client.py` 源码依赖 `websockets`、`requests`、protobuf `Frame` 与 PING 帧——是标准的**客户端主动建立并维持的 WebSocket 长连接**，带心跳。
- 含义：**你的电脑主动连出去**，因此不需要公网 IP、不需要端口映射、不需要反向代理。

### 1.2 钉钉 —— 官方 Stream 模式

- 官方仓库 `open-dingtalk/dingtalk-stream-sdk-python`，自述「Compared with the webhook mode, it is easier to access the DingTalk chatbot」。
- 同样是主动外连，无需公网。

### 1.3 反例

- 企业微信的 Webhook 模式**需要公网 URL**（这一点在 cc-connect 的能力表注释里也写明了：「Webhook 模式需要公网 URL；长连接等模式多数不需要」）。

---

## 2. 现成实现：cc-connect

仓库：`chenhg5/cc-connect`（MIT，GitHub 约 16.5k star，Go 实现，带 Web UI `:9820`）。

**它做的事正好就是本票要的**：把本地 AI 编码 agent 桥接到 IM，你在聊天里下指令，agent 在你机器上跑。

官方能力表（中文 README，2026-11-26 读取）：

| Agent | 支持 |
|---|---|
| Claude Code | ✅ 已支持 |
| Qoder CLI | ✅ |
| Kimi CLI | ✅ |
| Gemini CLI / iFlow CLI / Codex / Cursor Agent / OpenCode / Pi / Devin / Copilot | ✅ |
| **其他任意 agent** | **可通过 Agent Client Protocol (ACP) 接入** |

| 平台 | 接入方式 | 是否需要公网 IP |
|---|---|---|
| 飞书 | **WebSocket** | **无需** |
| 钉钉 | **Stream** | **无需** |
| WPS 协作 | WebSocket | 无需 |
| Telegram | Long Polling | 无需 |
| Slack | Socket Mode | 无需 |
| Discord | Gateway | 无需 |
| 企业微信 | Webhook 需公网；长连接多数不需 | 视模式 |

飞书侧的能力（同表）：文本与斜杠命令 ✅、Markdown/卡片 ✅、流式/分片回复 ✅、图片与文件 ✅、语音/STT ⚠️（需配置）、私聊 ✅、群聊 ✅。

其他已核实的功能点：
- 「聊天即控制」——`/model` 切模型、`/reasoning` 切推理强度、`/mode` 切权限模式、管理会话，全部通过斜杠命令。
- 语音与图片：发语音或截图，自动 STT/TTS 与多模态转发。
- 安全相关：支持 `run_as_user`（以不同 unix 用户跑 agent，需 supervisor 配置免密 sudo、自身不拥有 sudo）、权限模式开关。
- 安装顺序要求：**对应的 Agent CLI 必须先装好并完成登录认证**，否则启动即报错退出（如 `claudecode: claude CLI not found in PATH`）。

**关键推论**：cc-connect 支持 ACP 接入，而 DSH 自带 `acp` profile（`packages/acp`：JSON-RPC over stdio，支持建/列/恢复会话、发 prompt、收语义更新、回答权限提示）。**两者在协议层对得上**——但本次**未实测**这条组合。

---

## 3. 三条路线的对比

| | A：IM 长连接 + 桥接 | B：借用厂商 App 的 agent 当执行器 | C：DSH 自建 Web UI |
|---|---|---|---|
| 谁来干活 | **你自己**（Claude Code / DSH） | 厂商的 agent | 你自己（DSH） |
| 谁出中继 | 飞书 / 钉钉（只搬消息） | 厂商 | 没人，你自己架 |
| 需要公网 IP | **不需要** | 不需要 | 需要（除非只局域网） |
| 需要穿透 | 不需要 | 不需要 | 不需要，但要反代 |
| 界面形态 | 聊天（L2 之外，偏 L1/L2 混合） | 专用 App | 完整 Web UI（L2，有 DiffBlock） |
| 看 diff | 只能让 agent 贴 diff / 跑 `git diff` | 取决于厂商 | 有 diff 卡片 |
| 斜杠 skill | 靠聊天里打 `/` | 点选面板 | **`/` 出候选菜单** |
| 信任边界 | 只暴露聊天内容给 IM 厂商 | 把文件和执行交给厂商 agent | 只给飞书/你自己的域名 |
| 上手成本 | 中（建飞书自建应用 + 装桥接） | 低 | 中（架 TLS） |

**B 路线具体怎么做、以及为什么不做**：厂商桌面端 agent 能跑命令，所以理论上可以让它执行「运行 `xxx.ps1` 并把输出贴回来」。但这条路的代价是你仍然把任务交给了你不信任的 agent 去转述，权限审批、截断、幻觉都会介入；TRAE 还叠加 180 天授权与 `/documents` 目录限制。**它不是一个工程方案，是一个 hack。**

---

## 4. 实施骨架（A 路线）

```
手机飞书 App
   │  发消息「跑一下测试」
   ▼
飞书服务器
   ▲  WebSocket（你的机器主动外连，无需公网 IP）
   │
┌──┴──────────────────────────────────┐
│ 桥接进程（cc-connect 或自写）        │
│  1. 校验发送者 open_id 白名单        │
│  2. 投递到目标 agent                 │
│     - Claude Code: claude -p ...     │
│     - DSH: ACP profile / Python SDK  │
│  3. 把输出流式回发到聊天             │
└─────────────────────────────────────┘
   │
   ▼
你的项目目录（本机）
```

若自写，最小件：
- 飞书侧：自建应用 → 开事件订阅（长连接模式）→ 订阅 `im.message.receive_v1` → 用 `lark_oapi.ws.Client` 收。
- Agent 侧：Claude Code 用无头模式 `claude -p "<prompt>" --output-format json`（可配 `--resume` 续接会话）；DSH 用 ACP。
- 回发：调 `im/v1/messages` 发文本，或走流式卡片。

---

## 5. 安全边界（必须逐条过）

桥接进程 = **一个能以你身份在你机器上跑命令的聊天入口**。这比远程桌面危险，因为没有任何图形层面的确认。

1. **发送者白名单**：只认你自己的 `open_id`，其他人静默丢弃（cc-connect 对 Telegram/Discord 用配对码流程，飞书建议同理）。
2. **只开私聊**，不进群。
3. **令牌保管**：App Secret 存环境变量或凭据文件，不进仓库。
4. **低权限运行**：别用管理员/root 跑桥接进程，用 cc-connect 的 `run_as_user` 或自建等价物。
5. **危险命令闸门**：删除、推送、发布类操作应要求二次确认。
6. **数据边界**：消息内容会经过飞书服务器。含敏感代码时开飞书的隐私设置，或干脆不把敏感仓库接进来。

---

## 6. 未查到 / 未验证

- cc-connect 接 DSH（ACP）的实际可用性——协议对得上，但**没有实机验证**。
- cc-connect 在飞书侧是否提供 skill 候选菜单（它支持斜杠命令，但是否有自动补全未查到）。
- 豆包是否真有「移动端控制电脑」能力——此前调研（`china-cloud-ide-and-mobile-terminal.md`）在 App Store 文案里**未查到**任何「连接个人电脑」表述，本轮也未查到新证据。用户所说的可能是把它与 TRAE / WorkBuddy 混了。
- Qoder（用户称「Q Code」）的移动端能力细节，此前调研只记到「Qoder CN 有移动端远程控制 + CLI 守护进程 + Cloud Agents」，未展开。
