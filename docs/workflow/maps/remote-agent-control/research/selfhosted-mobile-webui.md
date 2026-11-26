调研日期：2026-11-26

# 自托管的移动端 Agent 网页界面：比 IM 聊天更接近「终端里的对话」

> 起因：用户指出飞书那种「看起来像必须变成纯对话了」，他想要**接近在 Agent 中对话的体验 + Markdown 渲染**。
> 方法：GitHub API 检索 + 读仓库 README / 部署文档 / package.json。未安装实测。

---

## 1. 用户判断是对的：IM 通道有结构性的天花板

飞书/微信/钉钉的消息流是**线性文本**。你能拿到：

- 文本、Markdown（飞书支持较好的卡片渲染）
- 文件、图片
- 斜杠命令

拿不到：

- **工具调用的结构化展开**（哪个工具、参数、耗时、结果分开看）
- **diff 面板**
- **审批 / 提问的专用界面**（只能做成消息来回）
- 会话的分层浏览（回合折叠、跳回某一轮）

也就是说，IM 通道把你压回 L1（终端镜像）与半吊子的 L2。要「接近在 Agent 里对话」，必须换成真正的 Web UI。

---

## 2. 现成的自托管方案（按契合度）

### 2.1 `Ike-li/claude-chat-mobile`（CCM）——最贴的一个

- **Apache 2.0，Node ≥ 20，56 star，2026-06-17 创建，2026-11-18 最后推送**（活跃）。
- 自述：「电脑上的 Claude Code，出门用手机接着干。就是你电脑上那个 claude · 任何网关和 API key 都能用 · 控制面在你自己机器上」。
- **驱动方式**：依赖里明确有 `@anthropic-ai/claude-agent-sdk@0.3.310`，通过 Agent SDK 驱动本机的 `claude` CLI——**同一份 CLAUDE.md、MCP、skills、登录和权限规则**。
- 其它核心依赖：`express`、`socket.io`（流式）、`web-push`（锁屏推送）、`jose`（JWT）。依赖很少，前端在 `app/public/`。

**它明确对标的场景就是你的情况**（README 原文）：

> 能用官方 Remote Control、也接受它的账号与数据路径时，用官方——零部署，是默认推荐。这个项目是给官方路径进不去、或不接受其控制面的人做的：**前者典型是在 `claude` CLI 里接了中转、第三方模型、国产模型**，官方那扇门直接关着。

**手机上能做的事（README 原文整理）**：

| 终端里 | 手机上 |
|---|---|
| 工具审批（y/n） | 审批卡：允许 / 拒绝 / **中止本轮**（对齐 `Esc`）；可勾「总是允许」，选仅本会话或永久 |
| `AskUserQuestion` | 选项直接点，多选、「其他…」自填，可「不回答」或中止 |
| 任务跑完/卡住 | 推到锁屏；审批、提问、后台任务完成**无条件推** |
| `/model`、权限档、思考强度 | 底栏 chip 点开就改 |
| `@` 引用文件 | 输入 `@` 搜工作区文件 |
| `/` 斜杠命令 | 输入 `/` 列候选，**含你装的 skills，每条带说明和参数提示** |
| 看它改了什么 | 工具卡点开预览变更；回合末尾有文件变更汇总（± 行数） |
| `git diff` | 工作区面板的「改动」页 |
| `--resume` 翻历史 | 侧栏按项目列出全部会话，标题自动生成、可搜索、在跑的标「运行中」 |
| `/rewind` | 两步回退：选回到哪一轮之前，再选恢复代码和对话 / 只恢复对话 / 只恢复代码 |

另外：上传图片与粘贴截图、断线重连补齐事件、**PWA 装到主屏幕**、`doctor` 启动自检。

**安全设计（比 cc-connect 严谨）**：
- 设备准入：新设备持正确 token 仍需一次审批（`node scripts/device.js list` / `approve`）。
- `node scripts/qr.js` 把地址打成二维码，省得手输 64 位 token。
- 权限继承 Claude Code 的 `permissions.allow`。
- 内置编辑器**不经过 Agent 的工具审批链**，可用 `FILE_EDIT=off` 关闭，长期公网暴露建议关。
- ⚠️ 官方警告：纯 TCP 转发（`ssh -R`、`frp tcp`）下，远程来客可发 `Host: localhost` 冒充本机从而跳过设备审批；这类拓扑要设 `DEVICE_APPROVAL_SCOPE=all`。

**部署位置的自由度（原文）**：

> CCM 对部署位置没有假设：`claude` CLI 在哪台机器上能跑通，控制面就跟到哪。主场景是自己的开发机；**跑在一台远程服务器上同样成立，手机连的就是那台服务器。**

它的默认公网路径是 Cloudflare Tunnel + Access（对本用户不适用），但 README 明确：
> **Cloudflare 是默认路径，不是硬依赖。** `CF_ACCESS_*` 三项留空即整层关闭，server 侧零改动，换加密隧道、自建反代或只用局域网都能跑。各拓扑……
> 产品不安装任何第三方隧道工具，只指路。

即：**它不自带穿透，但也不绑定任何一家。**

### 2.2 `siteboon/claudecodeui`（CloudCLI）——最成熟的一个

- **14,761 star**，React + Node，Node ≥ 22，`npx @cloudcli-ai/cloudcli` 即可跑。
- 支持 Claude Code / Cursor CLI / Codex。
- 功能表：响应式（明写 mobile）、交互式聊天、**内置 Shell 终端**、文件树（语法高亮 + 在线编辑）、**Git Explorer（查看/暂存/提交/切分支）**、浏览器会话、会话管理。
- 有中文 README，多语言。
- 缺点：没有 claude-chat-mobile 那种「手机原生体验」的打磨（审批卡、锁屏推送、`/rewind`、skills 候选）；它的定位更偏「远程项目管理台」。

### 2.3 DSH 的 Web UI

见 [dsh-assessment.md](dsh-assessment.md)。Markdown 渲染 + `DiffBlock` + `/` 技能菜单 + PWA，但要自己架 TLS / 反代。

### 2.4 其它

| 仓库 | star | 说明 |
|---|---|---|
| `sugyan/claude-code-webui` | 1,136 | 流式聊天界面，较轻 |
| `wbopan/cui` | 1,138 | 「A web UI for Claude Code agents」 |
| `devswha/ovis` | 2,217 | 浏览器与手机客户端，支持经 SSH 连远程 PC、Web Push |
| `zhikunqingtao/zhikuncode` | 549 | 国产，Docker 一键部署，**原生直连千问/DeepSeek**，双入口 CLI & Web UI |
| `iOfficeAI/AionUi` | 34,503 | 支持 20+ CLI Agent 的桌面/协作 App，不是专门的移动端 |

---

## 3. 真正的难点不在界面，在「怎么连」

这些方案都把 UI 做得好，但**没有一个自带国内可用的公网中继**。CCM 的部署文档给出的选项是：Cloudflare Tunnel、ngrok、Tailscale、自建反代、局域网。

对本人（不自配穿透）而言，只有三条：

| 方案 | 命令/动作 | 是否算「配穿透」 |
|---|---|---|
| **跑在阿里云上** | `git clone` + `npm start` + 开端口 | **不算**——服务器本来就公网可达 |
| **SSH 反向隧道到阿里云** | `ssh -R 3000:localhost:3000 user@阿里云` + 一条安全组规则 | 算，但只有一行命令，不是 frp 那种两端配置文件 |
| Cloudflare / Tailscale | 注册账号 + 装客户端 | 已被否决 |

**关键取舍**：

- 跑在阿里云 → 手机直连，零穿透；但 **Claude Code 和代码也在服务器上**，你的 Windows 工作区不是那一份。
- SSH 反向隧道 → 代码与 `claude` 留在 Windows；但要维护一条长连接，且必须按 CCM 文档设 `DEVICE_APPROVAL_SCOPE=all`。

---

## 4. 选型建议

| 你的偏好 | 选 |
|---|---|
| 要**最像终端里那个 agent**（审批卡、skills 候选、rewind、锁屏推送） | **claude-chat-mobile** |
| 要**顺手管项目**（文件树、Git 暂存/提交、终端） | **claudecodeui / CloudCLI** |
| 要用 **DeepSeek 作为底座**、不介意换 harness | **DSH Web UI** |

---

## 5. 未验证

- 三者均**未实机安装**；CCM 的 `verifiedWith.claudeCli: 2.1.317` 只是作者声明。
- 前端打包体积未测（前端在 `app/public/`，dependencies 里没有独立 UI 框架包，推测较轻，但未量化）。
- CCM 在 iPad Safari 上的实际渲染、软键盘行为未测。
- 阿里云那台机的配置（内存、Node 版本）未知；CCM 要求 Node ≥ 20。
