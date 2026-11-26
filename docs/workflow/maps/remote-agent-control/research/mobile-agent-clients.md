调研日期：2026-11-26

# 手机接入「跑在自家电脑上的编码 agent 会话」：2026-11 现状

> 只收事实，不做选型。凡是有官方文档/官方仓库能核实的，标「一手」；博客、对比页、README 里的营销话术标「厂商自述」；无法核实的写「未查到」。
>
> **采集方式与局限**：本机 `WebFetch`/`WebSearch` 被门禁拦成「无法验证域名安全」，全部事实用 `curl` 直取官方站点与官方仓库原始文件。`code.claude.com`（Claude Code 官方文档站）在本机 DNS 解析到 `127.0.0.1`，取不到原文；其正文通过第三方镜像仓库 `ericbuess/claude-code-docs`（4 次/日同步）取得。引用时给出 canonical URL，正文按镜像转抄；**镜像与官方原文是否逐字一致，本文未做比对**，涉及关键条款请以官方站点为准。
>
> **网络环境**：本次所有连通性实测发自中国大陆（福建，联通 AS4837，无代理），时间 2026-11-26 01:20–01:45 CST。连通性随时会变，数字只代表这一刻。

---

## 0. 先把「手机看到什么」分三层

手机的屏幕很小，同一个「远程驱动」在不同产品里指的可能是三件不同的事：

| 层 | 手机上看到的东西 | 决定体验的关键 |
| --- | --- | --- |
| L1 终端镜像 | 电脑上那个终端窗口的字符流 | 软键盘有没有 Esc/Ctrl、能不能滚动回看 |
| L2 会话视图 | 一轮轮对话、工具调用、权限弹窗、**diff 面板** | 产品是否把 diff 渲染出来，还是只给你一段文本 |
| L3 任务面板 | 任务/看板，点进去看改动、留评论 | 是否要额外跑一个服务、能不能从外网够到 |

后面第 1、2 节按产品讲，第 3 节讲「用现成工具自己搭」的做法，第 4 节讲输入。

---

## 1. Claude Code 官方：Remote Control

### 1.1 是什么

一手（[Remote Control 文档](https://code.claude.com/docs/en/remote-control)，镜像 `ericbuess/claude-code-docs/docs/remote-control.md`，访问 2026-11-26）：Remote Control 把 `claude.ai/code` 网页或 Claude 手机 App（[iOS](https://apps.apple.com/us/app/claude-by-anthropic/id6473753684) / [Android](https://play.google.com/store/apps/details?id=com.anthropic.claude)）接到**你机器上正在跑的那个 Claude Code 会话**。

- Claude 始终在本地跑：文件系统、MCP server、工具、项目配置都在本机；手机上按 `@` 补全的是**本地**路径。
- 终端、浏览器、手机三边消息互通，subagent 进度同步。
- 手机可以发图片和文件：图片 Claude 直接看图，并另存到 `~/.claude/uploads/`；其它文件下载到本机后作为 `@` 引用。
- 电脑睡眠或断网后会自动重连（有例外，见 Limitations）。

### 1.2 前置条件（一手）

| 条件 | 官方原文要点 |
| --- | --- |
| 订阅档位 | Pro / Max / Ultra / Team / Enterprise。**不支持 API key** |
| Team/Enterprise | 需要 Owner 先在 [Claude Code 管理设置](https://claude.ai/admin-settings/claude-code) 打开 Remote Control 开关 |
| 登录方式 | 必须 `claude` → `/login` 走 claude.ai 账号；没有合格登录时 `claude remote-control` 直接报错退出 |
| 端点 | 用 Bedrock / Google Cloud Agent Platform / Microsoft Foundry，或把 `ANTHROPIC_BASE_URL` 指到 `api.anthropic.com` 以外（LLM 网关、代理）时**不可用** |
| feature flag | 设了 `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` 或 `CLAUDE_CODE_DISABLE_FEATURE_FLAGS` 时不可用 |

档位表（一手，[feature availability](https://code.claude.com/docs/en/feature-availability)）：Remote Control 在 Pro/Max/Ultra 为 ✓，Team/Enterprise 为「Admin-enabled」。

### 1.3 走什么中继：不需要内网穿透

一手（Remote Control 文档「Connection and security」）：本机会话**只发外向 HTTPS，从不开入站端口**；启动时向 Anthropic API 注册并轮询，手机/浏览器接入后由**服务端在两端之间转发**，全程走 Anthropic API 的 TLS，使用多份短期凭证。

即：不需要公网 IP、不需要端口映射、不需要 frp/Tailscale。代价是**流量与转录都经过 Anthropic**——文档写明「连接期间，会话转录（含你的消息、Claude 的回复、工具活动）存储在 Anthropic 服务器上」，遵循其 Data usage 政策。

### 1.4 手机上能不能看 diff（一手）

能。文档「What connected devices see」列出「**Diff of your changes**」：会话目录在 git 仓库里时，接入设备的 diff 面板显示你的改动；若当前分支领先默认分支，显示自分叉点起的变化（含未提交编辑）；在默认分支上或未领先时，只显示未提交改动。

官方 CHANGELOG 2.1.330 有对应的修复条目：「Remote Control: Fixed the mobile apps hiding the Diff and pull request buttons…」，可确认手机 App 内有 Diff 与 PR 两个按钮（一手，[CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)，当前版本 2.1.332，2026-11-25 抓取）。

### 1.5 手机端的限制（一手）

- 会话进程必须一直活着：关终端 / 退出 Desktop / 退出 VS Code，会话就离线；从服务器模式停掉后，约 **4 小时**内可用 `--continue`/`--session-id` 恢复，之后要重开。
- 终端专属命令不可用：`/plugin`、`/resume` 只能在本机 CLI 跑；`/mcp`、`/config` 在手机上是文本降级形态。
- 权限模式：手机可选 Manual / Accept edits / Plan / Auto，**不能**选 Bypass。
- 推送：可在 `/config` 打开「Push when Claude decides」「Push when actions required」；`/config` 显示 `No mobile registered` 时要先打开一次手机 App 刷新推送 token。
- 配对：终端会显示 URL，按空格显示二维码；CLI 里 `/mobile` 也能出二维码。

### 1.6 另一条官方路径：云端会话（不需要电脑开机）

一手（[Use Claude Code in the cloud](https://code.claude.com/docs/en/claude-code-on-the-web)）：cloud session 跑在 Anthropic 托管的云基础设施上，需接 GitHub 仓库；关掉笔记本仍在跑，可从浏览器 `claude.ai/code`、手机 App 的 **Code** 标签、Desktop、终端 `claude --cloud` 任一入口进入。它和 Remote Control 的区别是**执行环境不在你电脑上**。

### 1.7 中国大陆可用性

**官方文档口径**：

- Remote Control 文档、mobile 文档、云会话文档里**都没有提及中国大陆**（本次逐篇 grep `china` / `mainland` / `hong kong`，零命中）——即官方对这块没有明说，属于**未查到**。
- Claude 整体的可用地区清单是第一手的：[Where can I access Claude?](https://support.claude.com/en/articles/8461763-where-can-i-access-claude)（访问 2026-11-26）列出 178 行国家/地区，按字母序从 Albania 到 Zimbabwe，**不含 China、Hong Kong、Macau**；含 Taiwan。

**实测（2026-11-26，中国大陆联通，无代理）**：

| 目标 | 结果 |
| --- | --- |
| `https://claude.ai/`、`https://claude.ai/code` | HTTP 302 → `https://claude.com/app-unavailable-in-region` |
| `https://code.claude.com/docs/en/...` | DNS 解析到 `127.0.0.1`，连不上（文档站本身打不开） |
| `https://api.anthropic.com/` | TLS 可建连，返回 403（未带凭证的正常响应） |
| `https://support.claude.com/` | 200（帮助中心可达） |
| `https://platform.claude.com/docs/...` | 307 → `anthropic.com/app-unavailable-in-region` |
| Apple App Store 中国区（`itunes.apple.com/lookup?id=6473753684&country=cn`） | `resultCount = 0`；同 id 在 `country=us` 返回 1 条「Claude by Anthropic」 |
| `https://play.google.com/store/apps/details?id=com.anthropic.claude` | 连接被重置 |

结论只用一句事实表述：**官方两条入口（claude.ai/code 与 Claude 手机 App）在中国大陆网络与中区应用商店都够不到**；同一网络下 `api.anthropic.com` 本身是通的。至于「用外区账号」之类的做法，本文不采集。

---

## 2. 开源 / 第三方移动端客户端

### 2.1 Happy（`slopus/happy`）——目前最完整的第三方

**存在性与维护状态（一手，GitHub API，2026-11-25）**：仓库 `slopus/happy`，MIT，24,829 star，2,139 fork，1,154 open issue，最后 push 2026-11-25T11:22Z，未归档；最近提交是 `Release Happy CLI v1.2.7` 与若干 iOS/Android 界面提交。**在活跃维护**。

**架构（一手）**：README 列出的仓库结构就是架构图——

| 组件 | 是什么 |
| --- | --- |
| `happy-ios` | 原生 Swift/UIKit iOS App |
| `happy-android` | 原生 Kotlin/Jetpack Compose Android App |
| `happy-cli` | 原始 CLI（npm 包 `happy`，前身 `happy-coder`），`happy claude` 包住 Claude Code |
| `happy-server` | 中继服务器，做「encrypted sync」 |
| `happy-push-server` | Cloudflare Worker，经 APNs/FCM 发推送 |
| `happy-desktop` / `happy-agent` | 独立仓库：桌面端与其 agent 运行时 |

**有没有中继、能不能自建（一手）**：有中继，且可自建。

- 默认中继地址写在源码里：`packages/happy-cli/src/configuration.ts` 中 `HAPPY_SERVER_URL` 的默认值是 `https://api.cluster-fluster.com`，Web 端默认 `https://app.happy.engineering`，前者可被环境变量或 `~/.happy/settings.json` 的 `serverUrl` 覆盖。
- 自建步骤见 [Self-Host Your Own Happy Server](https://happy.engineering/docs/guides/self-hosting/)：`git clone` → `Dockerfile` 构建 → 带 `HANDY_MASTER_SECRET` 启动，监听 3005；后端是 Fastify + Socket.IO + Postgres + Redis + S3 兼容存储（[deployment.md](https://github.com/slopus/happy/blob/main/docs/deployment.md)），Docker 镜像跑的是 Rust 版服务器实现，与 TS 版线协议兼容。
- **手机 App 侧也能改服务器地址**：未登录时点首屏右上齿轮 → Server，填 `http://your-server:3005`；已登录则要在设置里连点 Version 十次进开发者菜单 → API Endpoint。（一手，同上自建文档）
- 例外：**Happy Desktop 目前没有服务器设置**，其 Mobile Access 只认环境变量或配对时保存的地址。

**是否端到端加密（一手）**：[Security & Encryption](https://happy.engineering/docs/security/) 与 [docs/encryption.md](https://github.com/slopus/happy/blob/main/docs/encryption.md)：内容在客户端加密后才出设备，服务器只存密文；有两条加密变体（legacy NaCl `secretbox` / XSalsa20-Poly1305，与基于 dataKey 的 AES-256-GCM）。文档明说「relay server can't read anything」。这属于**厂商自述**，但源码与文档同仓可审。

**平台（一手）**：iPhone 与 Android，App Store 与 Google Play（[Happy on your phone](https://happy.engineering/mobile-app/)）。桌面端 macOS/Windows/Linux（README 下载徽章）。**Windows 11 跑 CLI**：没有专门的 Windows 文档页（未查到），但仓库自带的社区分析 [docs/current-community.md](https://github.com/slopus/happy/blob/main/docs/current-community.md) 统计到 29 个 Windows 平台兼容 issue，并称「Windows support 是这一人群的高优先级」。

**手机端能不能看 diff**：能看，但粗。CLI 向 App 暴露了 `difftastic` RPC（[cli-architecture.md](https://github.com/slopus/happy/blob/main/docs/cli-architecture.md) 的 handler 列表：`bash`、文件读写、`ripgrep`、`difftastic`）；[roadmap.md](https://github.com/slopus/happy/blob/main/docs/roadmap.md) 里仍写着「Better diff viewer」待做——即当前是「能取到 diff 文本」，不是打磨过的 diff 面板。

**维护状态的重要限定（一手）**：[自建文档页顶部横幅](https://happy.engineering/docs/guides/self-hosting/) 写明「原来的 Happy CLI（npm 上的 `happy`）进入维护模式：继续能用、继续修关键问题，但新功能都进 Happy Desktop；Happy 手机 App 两个都能用」。所以「活跃」指的是整个项目，CLI 这条线是冻结功能、只修 bug。

**中国大陆实测（2026-11-26，无代理）**：

| 目标 | 结果 |
| --- | --- |
| `https://api.cluster-fluster.com/`（默认中继） | 200，TCP 建连 0.21 s，总耗时 2.4 s |
| `https://happy.engineering/` | 200，建连 0.20 s |
| `https://app.happy.engineering/` | 首次超时，重试 200，建连 0.22 s |
| App Store 中国区（`id=6748571505`） | `resultCount = 0`；美区返回「Happy: Codex & Claude Code App」 |
| `https://play.google.com/...` | 连接被重置 |

即：**中继与官网从国内网络可达；官方分发的 App 不在中区商店**。自建服务器时，链接的两端（电脑、手机）都只需能访问你自己那台服务器。

**语音（厂商自述，[Voice Coding](https://happy.engineering/docs/features/voice-coding-with-claude-code/)）**：手机上点麦克风说话，由一个 ElevenLabs 语音 agent 把整段话变成一条消息发给会话；它会播报权限请求，**只有你口头同意才放行**；可切换语言；免费 20 分钟/30 天，订阅后 5 小时。

### 2.2 Omnara（`omnara-ai/omnara`）——已经转向，不再是「接管你本地会话」的客户端

- **现状（一手，GitHub API 2026-11-25）**：3,452 star，Apache-2.0，最后 push 2026-11-25；README 自述为「the open-source managed agent platform / self-hostable alternative to Claude Managed Agents」，跑自己的 agent（`agent.yaml` + `npx omnara agents launch`），有 Web dashboard。仓库根目录**没有** `apps/mobile` 一类目录（2026-11-25 的树里只有 `frontend`、`api`、`cmd`、`internal` 等）。
- **它以前是什么（一手，README 的 2025-12-27 版本 `500a82a`）**：`omnara claude` 把终端里跑的 Claude Code 会话「镜像」到 Web dashboard 与 iOS/Android App，可以在手机上看 agent 在做什么、回答它的问题、远程启动。
- **转向说明（同一份旧 README 顶部）**：「We've migrated to a new voice-first coding agent platform… The new service keeps the features you love — **web and mobile access to your machine** — but we've built our own integrated experience instead of wrapping the Claude Code CLI.」
- 结论：**移动端入口还在，但形态从「镜像你本机的 Claude Code」变成「用 Omnara 自己的 agent」**；旧 App（`id6748426727`）在美区 App Store 已查不到（`itunes.apple.com/lookup` 返回 0 条）。

### 2.3 Vibe Kanban（`BloopAI/vibe-kanban`）——公司已关停，项目转社区

- **一手（[Goodbye bloop](https://www.vibekanban.com/blog/shutdown)，2026-04-10）**：运营公司 bloop 关停，项目「open source and community maintained」；远程服务（kanban issues、comments、projects、organisations）保留 30 天后移除，**转为完全本地架构**，本地 workspace 继续可用。
- 仓库仍活跃：28,814 star，Apache-2.0，最后 push 2026-11-15。启动方式是 `npx vibe-kanban`，UI 是浏览器里的本地服务；功能含「Review diffs and leave inline comments」（一手，README）。
- 它自己承认的定位就是 **L3 任务面板**（规划 → 工作区 → 审 diff → 提交 PR），**没有手机 App**；要在手机上用只能靠浏览器够到那台机器上的本地服务。公告里被点名撤除的是 kanban issues、comments、projects、organisations 四项，并称整体转向纯本地架构；**「remote access 这项功能是否保留」公告没有单独说明，本文记为未查到**。

### 2.4 VibeTunnel（`amantus-ai/vibetunnel`）——把终端搬进浏览器

- 一手（README，2026-11-26）：把终端代理进浏览器，「Turn any browser into your terminal」。装法：macOS 14+/Apple Silicon 原生 App，或 Linux 上 `npm i -g vibetunnel`。**没有 Windows 版**（README 只列 macOS 与 Linux）。
- 远程访问一节推荐 **Tailscale**（WireGuard 组网），也提供其它隧道方式；即在「手机够到家里机器」这件事上它自己不做中继。
- 维护：4,709 star，MIT，最后 push 2026-08-05（GitHub API）——自那以后无提交，比 Happy 冷得多。
- 它是 L1：手机上是终端，不是 diff 面板。README 有 Git Follow Mode 一节，把 git 状态带进终端界面。

### 2.5 Conductor（`conductor.build`）——未查到可核实事实

站点的所有路径从本机均返回 403（Cloudflare 质询）或连接超时，`docs.conductor.build` 同样超时；无公开仓库可查。**是否支持手机、是否要自跑服务、平台范围，本文一律记为「未查到」**，不采信二手转述。

### 2.6 官方自带的第三条路：Channels（把手机聊天软件接进会话）

一手（[Push events into a running session with channels](https://code.claude.com/docs/en/channels)）：Channels 是一个向运行中会话推事件的 MCP server，当前为 **research preview**，内置 Telegram、Discord、iMessage 三个插件，需要 Bun；双向——Claude 的回复出现在聊天软件那边，终端只显示「sent」。事件只在会话开着时到达。

同一网络实测（2026-11-26）：`api.telegram.org` 连接超时，`discord.com/api` 连接超时。iMessage 需要 Apple 设备作桥。

---

## 3. 用现成工具在手机上看改动：四条常见路

### 3.1 code-server（浏览器里的 VS Code）

- 一手（[docs/ipad.md](https://github.com/coder/code-server/blob/main/docs/ipad.md)）：官方**推荐把 code-server 加成 PWA**（Safari → 分享 → 添加到主屏幕），理由是「更多屏幕面积 + 能拿到顶层键盘快捷键」。
- 官方列出的已知问题（同一页）：键盘会消失（issue #979）；`cmd+n` 被浏览器抢成新窗口且难改；Magic Keyboard 没有 Esc 键，多数人把地球仪键改 Esc；分屏下键盘丢焦点（#4182）；终端里文字默认不显示（#3824）；终端复制粘贴快捷键不工作（#3491）；**`ctrl+c` 停不掉长任务**（上游 VS Code #114009，官方给了自定义键位绕法）。
- 注意：`docs/ios.md` 与 `docs/android.md` 讲的是**在手机上跑 code-server**（iSH / UserLAnd / Nix-on-Droid），不是「手机当客户端看电脑」。别把这两个当成移动端支持。
- 定位：L2。VS Code 自带的 diff 视图可用，但整套 IDE 的交互是为鼠标键盘设计的。

### 3.2 VS Code Web（`vscode.dev`）与 Remote Tunnels

- 一手（[vscode-web 文档](https://code.visualstudio.com/docs/remote/vscode-web)）：原文只有一句「You can use VS Code for the Web on mobile devices, but smaller screens may have certain limitations.」，随后列了若干快捷键在浏览器里行为不同（如 Firefox 下 `Ctrl+Shift+P` 打不开命令面板）。它在手机上打开的是浏览器里能访问的仓库/目录，**不是**那台 Windows 机上的工作副本。
- 要让 `vscode.dev` 看到那台机器，官方做法是 [Remote Tunnels](https://code.visualstudio.com/docs/remote/tunnels)：在电脑上跑 `code tunnel`，两端用同一个 GitHub/Microsoft 账号认证，**只向 Azure 上的服务发外向连接、不监听任何端口、不用改防火墙**，隧道内再走 SSH 做端到端加密（AES-256-CTR，实现开源）；每账号最多 10 条隧道，有带宽限额。
- 实测（2026-11-26，国内联通）：`global.rel.tunnels.api.visualstudio.com` 可建连（根路径返回 404，属正常）。隧道本体是否稳定未做长跑验证。

### 3.3 GitHub 手机 App

- 一手（[About GitHub Mobile](https://docs.github.com/en/get-started/using-github/github-mobile)）：iOS/Android；能力清单含「Read, review, and collaborate on issues and pull requests」「Edit files in pull requests」「Search through code in a specific repository」。
- 边界很清楚：**只能看到已经 push 上去的东西**。agent 在本地改完但没提交、没推送的部分，手机上看不到。

### 3.4 tmux + SSH 客户端（含 mosh）

- 一手（[Blink Shell 文档](https://blink.sh/docs)）：iOS 客户端，支持 `mosh [user@]hostname`，并给出「Tailscale + Mosh」的组合教程。
- 事实层面：tmux 让会话在断开 SSH 后继续跑；mosh 处理漫游与断线重连。这两件事与「看 diff」无关——手机上是 `git diff` 的**文本输出**，没有语法高亮/并排视图，窄屏上长行会折行。
- 这是 L1，且需要手机能直连那台机器（公网 IP、内网、或组网），属于「要自己配穿透」的一类。

---

## 4. 手机端输入：各家怎么处理

| 做法 | 事实 | 来源性质 |
| --- | --- | --- |
| 系统听写 | Claude 手机 App 有 dictation，**支持语言列表不含中文**（英/法/德/印地/意/日/韩/葡/俄/西/土/乌）；默认转完文本即删音频 | 一手，[Use dictation on Claude Mobile](https://support.claude.com/en/articles/10065434-use-dictation-on-claude-mobile) |
| 语音 agent | Happy 用 ElevenLabs：说完整段再发；会念出权限请求、口头确认才放行；语言可在 Settings → Voice 选；免费 20 分钟/30 天，订阅 5 小时 | 厂商自述，Happy Voice Coding 页 |
| 附件代替打字 | Remote Control 支持手机直接拍照/传文件；图片 Claude 直接看，其它文件落到本机再当 `@` 引用 | 一手，Remote Control 文档「What connected devices see」 |
| 路径补全 | Remote Control 在手机上按 `@` 补全的是**本机**路径 | 一手，Remote Control 文档开头 |
| 斜杠命令 | 手机上不能用 `/plugin`、`/resume`；`/model`、`/effort` 必须带参数（没有选择器）；`/mcp` 在手机上是文本摘要、在网页上变成 claude.ai 连接器目录；`/config` 变成「传 key=value」或设置页 | 一手，Remote Control 文档 Limitations |
| 外接键盘 | code-server 在 iPad 上的官方已知问题：Esc 缺失、`cmd+n` 被抢、`ctrl+c` 失效、分屏丢焦点 | 一手，code-server docs/ipad.md |
| 快捷短语/预设键 | 未查到有任何一家官方文档描述「预设按键面板」；Happy 的社区文档把「Buttons, sidebar, scroll, layout」列为 80 条 issue 的主题，但未给结论 | 未查到 |

关于「实测评价可引用」：本次只拿到官方 issue 编号与官方文档措辞，**没有**找到可引用的一手实测文章（无检索工具，见文首局限）。因此不写「某某说手感好/差」。

---

## 5. 回到那个问题：手机上能不能顺手地看 diff、下指令

按「能核实的事实」摆在一起，不排序：

1. **官方路径把「看 diff」做进了产品里**：Remote Control 的手机端有 Diff 与 PR 按钮，diff 面板按分支状态决定显示范围；代价是必须订阅 claude.ai 档位、电脑常开、且中国大陆的 claude.ai 与中区 App Store 都够不到（§1.7 实测）。
2. **不依赖境外服务的路径里，Happy 是唯一把「手机 App + 会话 + diff 取数」三件事都做完的开源项目**：中继国内可达、可自建、App 可在 App 设置里改服务器地址；但 App 不在中区商店，diff 视图自己列在 roadmap 待改进项里，CLI 处于维护模式（新功能进桌面端）。
3. **其余第三方要么改了形态**（Omnara 转成自有 agent 平台）、**要么关了公司**（Vibe Kanban 转本地）、**要么只做 L1 终端**（VibeTunnel 无 Windows 版、自 2026-08-05 后无提交；tmux+SSH 要自己解决连通）。
4. **「用现成工具看 diff」的现实是三种妥协**：GitHub App 只看到已 push 的内容；code-server/VS Code Web 有官方列明的键盘与终端缺陷（VS Code 侧的 Remote Tunnels 能不用开端口把电脑接进浏览器，但那是整个 IDE，不是为手机设计的界面）；SSH 客户端只有纯文本 diff。
5. **输入这一环，中文化的缺口是实的**：Claude 官方听写不支持中文；Happy 的语音走 ElevenLabs（可换语言，但按分钟计费）；外接键盘在浏览器 IDE 里有 Esc/Ctrl 类硬伤。

---

## 6. 来源清单

一手（官方文档 / 官方仓库 / 官方 API）：

- Claude Code：[Remote Control](https://code.claude.com/docs/en/remote-control)、[Mobile](https://code.claude.com/docs/en/mobile)、[Cloud sessions](https://code.claude.com/docs/en/claude-code-on-the-web)、[Feature availability](https://code.claude.com/docs/en/feature-availability)、[Platforms](https://code.claude.com/docs/en/platforms)、[Channels](https://code.claude.com/docs/en/channels)；本机不可达，正文经镜像仓库 [`ericbuess/claude-code-docs`](https://github.com/ericbuess/claude-code-docs) 的 `docs/*.md` 取得（同步于 2026-11-25）
- Anthropic：[CHANGELOG.md](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)（版本 2.1.332）、[Where can I access Claude?](https://support.claude.com/en/articles/8461763-where-can-i-access-claude)、[Use dictation on Claude Mobile](https://support.claude.com/en/articles/10065434-use-dictation-on-claude-mobile)
- GitHub：[About GitHub Mobile](https://docs.github.com/en/get-started/using-github/github-mobile)
- code-server：[docs/ipad.md](https://github.com/coder/code-server/blob/main/docs/ipad.md)、[docs/ios.md](https://github.com/coder/code-server/blob/main/docs/ios.md)、[docs/android.md](https://github.com/coder/code-server/blob/main/docs/android.md)
- VS Code：[VS Code for the Web](https://code.visualstudio.com/docs/remote/vscode-web)、[Remote Tunnels](https://code.visualstudio.com/docs/remote/tunnels)
- Blink Shell：[docs](https://blink.sh/docs)
- Happy：[README](https://github.com/slopus/happy)、[encryption.md](https://github.com/slopus/happy/blob/main/docs/encryption.md)、[deployment.md](https://github.com/slopus/happy/blob/main/docs/deployment.md)、[backend-architecture.md](https://github.com/slopus/happy/blob/main/docs/backend-architecture.md)、[cli-architecture.md](https://github.com/slopus/happy/blob/main/docs/cli-architecture.md)、[roadmap.md](https://github.com/slopus/happy/blob/main/docs/roadmap.md)、[configuration.ts](https://github.com/slopus/happy/blob/main/packages/happy-cli/src/configuration.ts)
- Omnara：[README](https://github.com/omnara-ai/omnara)、[README @ 500a82a（2025-12-27）](https://github.com/omnara-ai/omnara/blob/500a82ad85ba35d0a478810bb00e944ba93071b1/README.md)
- Vibe Kanban：[README](https://github.com/BloopAI/vibe-kanban)、[Goodbye bloop](https://www.vibekanban.com/blog/shutdown)（2026-04-10）
- VibeTunnel：[README](https://github.com/amantus-ai/vibetunnel)

厂商自述（同一家公司介绍自家产品，非第三方评测）：happy.engineering 的 [mobile-app](https://happy.engineering/mobile-app/)、[Security & Encryption](https://happy.engineering/docs/security/)、[Self-Hosting](https://happy.engineering/docs/guides/self-hosting/)、[Voice Coding](https://happy.engineering/docs/features/voice-coding-with-claude-code/)、[Happy vs Remote Control](https://happy.engineering/claude-code-remote-control/)（该页自注「Remote Control 事实取自 Anthropic 文档，2026-10-09 核对」——本文凡涉及 Remote Control 的条款均已回到官方文档复核）。

实测数据：2026-11-26 01:20–01:45 CST，中国大陆联通 AS4837，无代理，`curl` 直连；出口 IP 经 `ipinfo.io` 确认为 CN / Fujian / China Unicom。涉及检索工具的结论一律记为「未查到」。

---

## 对下游决策最关键的事实

1. Remote Control 是官方遥控本机会话的正式功能：只发外向 HTTPS、**不开入站端口**，不需要公网 IP 或内网穿透；代价是连接期间转录存在 Anthropic 服务器上。
2. 它的门槛是硬的：Pro/Max/Ultra/Team/Enterprise 的 claude.ai 订阅，API key 与自建网关不可用；电脑须常开，服务器停掉后约 4 小时内可恢复。
3. 中国大陆口径：官方文档未提中国，Claude 可用地区清单不含大陆与香港；实测 `claude.ai/code` 302 到 `app-unavailable-in-region`，`code.claude.com` 被解析到 `127.0.0.1` 而连不上。
4. 中区 App Store 查不到 Claude App（`country=cn` 返回 0 条，美区有），Google Play 从国内连不上——装官方 App 本身就是一道门槛。
5. 官方手机端内置 diff：Diff 与 PR 按钮存在，显示范围按「是否领先默认分支」决定（含未提交改动），不是外挂能力。
6. Happy 是唯一把「原生手机 App + 中继 + diff 取数」做齐的开源方案：默认中继国内可达（0.21 s 建连）、可 Docker 自建、手机 App 内可改服务器地址。
7. Happy 的三处折扣：App 不在中区商店；diff 面板仍在 roadmap 待改进；原 CLI 进维护模式，新功能进桌面端，而桌面端目前不能配自建服务器。
8. Omnara 已转型为自有 agent 平台（不再镜像本机 Claude Code，旧移动 App 下架）；Vibe Kanban 公司 2026-04 关停并撤除远程服务；VibeTunnel 仅 macOS/Linux 且三个月无提交；Conductor 无可核实来源。
9. 现成工具三条路的硬妥协：GitHub App 只看到已 push 的代码；code-server 官方列明 iPad 上 Esc 缺失、`ctrl+c` 失效、键盘丢失；SSH 只有纯文本 diff。
10. 输入侧：Claude 官方听写不支持中文；Happy 语音走 ElevenLabs 按分钟计费；官方 Channels（Telegram/Discord/iMessage）为 research preview，且两个端点在国内均超时。
