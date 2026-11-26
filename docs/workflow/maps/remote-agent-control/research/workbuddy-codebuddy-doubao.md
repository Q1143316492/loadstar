调研日期：2026-11-26

# WorkBuddy / CodeBuddy / 豆包：是否算「移动端调用电脑工作环境」

> 起因：用户直接问「豆包、WorkBuddy 可以吗」。
> 采集方式：`curl` 直取官方站点与官方文档（`workbuddy.cn`、`codebuddy.cn`、`doubao.com`），2026-11-26。`WebFetch`/`WebSearch` 在本机被网络门禁拦截，检索靠 Bing RSS / 搜狗。
> 只记官方文档写明的能力；推断的地方单独标出。

---

## 1. 结论摘要

| 产品 | 能否作为「手机驱动电脑上的 agent」 | 关键依据 |
|---|---|---|
| **WorkBuddy** | **能，现成**。官方把手机定义成桌面端 Agent 的「远程控制台」 | 官方文档《多端协同（连接电脑）》 |
| **CodeBuddy Code（CLI）** | **能，两条路**：`/gateway` 开 Web UI 扫码访问；微信 / 企业微信 channel 直接在聊天里驱动 | 官方文档《远程控制（Remote Control）》《Channels》 |
| **豆包** | **未查到官方能力**。它是全平台通用助手（Windows / macOS / Android / iOS），没有任何「连接我的电脑 / 在我的电脑上执行」的官方文档 | 官方站点与文档检索无对应条目 |

---

## 2. WorkBuddy（腾讯云代码助手出品）

产品定位：AI Agent 办公工具，桌面端 macOS / Windows，在**你选的文件夹**上跑，可读写其中的 PDF/Word/Excel/图片，产出 Word/Excel/PPT/PDF/Markdown；支持 Skills、MCP、权限模式、Worktree 任务。
来源：[官网 WorkBuddy](https://workbuddy.tencent.com/)、[文档首页](https://www.workbuddy.cn/docs/workbuddy/)

### 2.1 移动端 App 与「多端协同（连接电脑）」

官方原文：「WorkBuddy 多端协同让您的手机成为桌面端 Agent 的**远程控制台**。」
来源：[《多端协同（连接电脑）》](https://www.workbuddy.cn/docs/workbuddyapp/features/Multidevice)

- **安装**：iOS 在 App Store 搜「WorkBuddy」；Android 在华为应用市场 / 小米应用商店 / 应用宝。
- **登录**：QQ / 微信授权；**App 登录的微信账号必须与电脑端一致**，否则连不上。
- **执行模式两档**：☁️ 云端工作（云端沙箱，不依赖个人电脑）、🖥 连接电脑（远程操控桌面端）。
- **建联**：桌面端侧边栏底部「连接移动端」→ 打开「允许移动端连接此设备」；移动端选设备即可。**关系持久保留，不用每次配对**。二维码只作打开/下载引导，不参与配对。
- **远程续聊**：手机上发消息，指令路由到桌面端执行。可远程停止、看设备级+对话级状态、任务通知到手机（完成/中断/等待回答/等待审批）。
- **远程配置**：技能、专家、连接器、权限模式、自定义模型都能在手机上选，清单以电脑端为准。**「使用技能」是输入框旁的 `+` 面板里选，不是打斜杠命令。**
- **产物回传**：电脑产出的文件自动回到 App，可预览、导出 PDF/DOCX/Markdown、导出到腾讯文档。
- **前置条件**：桌面端必须开着「允许锁屏运行 / 保持唤醒状态，以便远程访问」；两端都联网。电脑关机则不可用。
- **通信**：官方称「移动端与桌面端的通信经过安全中继通道加密」，「设备关系一对一绑定」。**中继是腾讯自己的，用户侧零配置**——不需要公网 IP，不需要穿透。
- **计费**：手机查看状态与续聊不额外消耗积分；桌面端执行按桌面端规则消耗积分。

### 2.2 另外两个入口

- **WorkBuddy 小程序**（独立文档板块 `workbuddymini`）：同一套能力的小程序形态，文档结构几乎与 App 对应。
- **微信文件打开**：微信里收到的 md/html/svg 可直接用 WorkBuddy 打开预览或插入对话。
  来源：[《微信文件打开》](https://www.workbuddy.cn/docs/workbuddyapp/features/WeChat-Open)

---

## 3. CodeBuddy Code（CLI，编码向）

> WorkBuddy 与 CodeBuddy 同属腾讯云代码助手，文档站是同一个（`codebuddy.cn/docs`）。CodeBuddy 是编码那一支，具备 Skills、斜杠命令、子代理、Agent Teams、Hooks、插件市场、Worktree。
> 来源：[CLI 文档首页](https://www.codebuddy.cn/docs/cli/)

### 3.1 `/gateway` 远程控制（Beta）

官方原文：「通过 Remote Control，您可以从手机、平板或任意浏览器远程访问本地运行的 CodeBuddy Code 会话。会话始终在您的本机执行，Web 界面只是一个远程窗口。」
来源：[《远程控制（Remote Control）》](https://www.codebuddy.cn/docs/cli/remote-control)

- 本地起一个 Gateway 服务，默认用 **Cloudflare Quick Tunnel** 暴露公网临时域名（`*.trycloudflare.com`），**无需端口转发或 VPN**；未装 `cloudflared` 或 Tunnel 失败时自动回退**局域网模式**（默认 `127.0.0.1:8321`）。
- 终端里出二维码，手机扫码直接开 Web UI。
- Web UI 含：对话、**内置 Web 终端**（浏览器里直接操作远程终端）、实例管理（多项目目录切换）、亮/暗主题、中英切换。基于 ACP 协议，与终端体验一致。
- 权限：远程执行**自动 bypassPermissions**（远程无法交互审批）——官方明确要求只把链接分享给信任的人。
- 限制：每个实例同时只支持一个 Gateway；终端必须保持运行；Quick Tunnel 域名临时（固定端口可跨重启复用）。

**注意（推断，非官方原文）**：Tunnel 走 Cloudflare，在中国大陆的可用性没有官方承诺；局域网模式在「外出」场景不可用。这条路是否在国内稳定，需要实测。

### 3.2 Channels：用微信直接驱动会话（Beta）

来源：[《Channels》](https://www.codebuddy.cn/docs/cli/channels)

- Channel 是把外部消息推进正在运行的 CodeBuddy Code 会话的机制，**双向**：CodeBuddy 处理后在同一个 channel 回复。
- **微信是内置 channel**，通过「微信 ClawBot」实现，支持文本、图片、文件收发：
  - 前提：微信 iOS 8.0.70 及以上；微信 → 我 → 设置 → 插件 → 启用 ClawBot。
  - 执行 `/remote-control wechat` 出二维码，微信扫码绑定；凭证存本地，下次免扫。
  - 之后在微信里发消息即进入会话；回复显示在微信里。
- 另支持 Telegram、Discord（插件）、fakechat（演示）。
- 安全：只有扫码绑定的微信账号可发；他人消息静默丢弃；凭证权限 600。
- **这条路不依赖任何境外服务**，也不需要公网 IP —— agent 跑在你电脑上，消息走微信。

### 3.3 其他相关的官方能力

- **企业微信智能机器人接入**（CLI 文档里有独立页面）。
- **斜杠命令**可自定义、**自定义快捷键**有文档 —— 对「记不住 skill 名」有官方层面的抓手。
  来源：[斜杠命令](https://www.codebuddy.cn/docs/cli/)、[自定义快捷键](https://www.codebuddy.cn/docs/cli/)

---

## 4. 豆包

- 官方定位：字节跳动的通用 AI 助手，提供 Windows / macOS / Android / iOS 全平台客户端，能力为对话、搜索、写作、图像与视频生成、文档处理。
  来源：[豆包官网](https://www.doubao.com/)、Bing RSS 检索到的官网描述（2026-11-25 抓取）。
- **未查到**任何「连接我的电脑 / 在本地电脑上执行任务 / 远程操控」的官方文档或产品页。本次检索中出现的相关站点多为第三方导航/SEO 站，不能作为依据。
- 结论口径：**豆包目前不是这类产品**；它是「你直接和它对话」，不是「它在你机器上干活」。

---

## 5. 对下游决策最关键的事实

1. **WorkBuddy 已经是成品答案**：手机 App + 桌面端，官方明确定位是「桌面端 Agent 的远程控制台」，走厂商中继、零配置、不需公网 IP，iOS/Android 都有，还能语音下任务、技能在面板里点选。
2. **代价**：电脑必须开机且开了「保持唤醒」；账号是腾讯账号；执行消耗积分；agent 是 WorkBuddy 自己的，不是你的 Claude Code。
3. **CodeBuddy Code 更贴「自己这套工作流」**：CLI 里有 Skills、斜杠命令、Hooks、Worktree；远程两条路——`/gateway` 的 Web UI（含 Web 终端），和**微信内置 channel**（纯国内链路，不依赖境外服务）。
4. `gateway` 的默认 Tunnel 走 Cloudflare，国内可用性无官方承诺；微信 channel 反而更稳地适配国内。
5. **豆包不在候选里**（未查到该类能力）。
6. 两个产品都没有官方文档描述「移动端逐块审 diff」的界面；CodeBuddy Web UI 有内置 Web 终端，`git diff` 可用，但那是终端级而非逐块审阅级。
