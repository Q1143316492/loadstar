# 国内云端开发环境与移动终端：2026-11 现状

调研日期：2026-11-26

范围：①国内云厂商的托管开发环境（天生有公网入口）；②国内可用的移动端 SSH / 终端客户端；③厂商官方的「网页终端连自己的机器」入口；④国内 AI 编程产品的移动端形态。只收事实，不做选型。

来源口径：

- **官方**＝厂商产品页、官方帮助文档、官方 App Store 商品页（App Store 文案由发行方填写，属第一方声明）。
- **实测**＝本次在国内网络下直接请求得到的结果（HTTP 状态、能否建连），不是厂商声明。
- 未标「实测」的链接均在 2026-11-26 打开过。查不到的写「未查到」，不推测。

---

## 1. 国内云厂商的托管开发环境

### 1.1 总表

| 产品 | 状态（2026-11-26） | 免费额度 | 计费 | 终端 | 代码来源 | 浏览器/移动 |
| --- | --- | --- | --- | --- | --- | --- |
| 腾讯 Cloud Studio | 在运营，文档最近更新 2026-08-11 | 绑定腾讯云账号首赠 20 机时 | 资源包 1 元/机时起；按量 0.1–7 元/小时（CPU） | 内置终端 | 模板/应用 + Git | 官方列出 Safari 15+ |
| 华为 CodeArts IDE Online | 在运营 | 官网写「免费试用体验版套餐，50 人内」 | 按需：计算+存储按使用时长 | WebTerminal | Git 仓库（含 GitHub） | 「不限设备和操作系统」 |
| 阿里云 云效 WebIDE | 在运营（文档在） | 未查到独立计费页 | 未查到 | 文档未提终端 | 仅 Codeup 代码库 | 浏览器 |
| 阿里云 云命令行 Cloud Shell | 在运营 | 免费 | 免费 | 是（本体就是 shell） | 空环境 + 挂载 NAS | 浏览器 |
| 阿里云 函数计算 WebIDE | 未查到官方文档页 | — | — | — | — | — |
| Gitee WebIDE | 产品页 404（实测） | — | — | — | — | — |
| Gitee Go | 在运营，但是 CI/CD 流水线 | 单仓库 200 分钟、企业每月 1000 分钟构建时长 | 见产品页 | 否（不是交互式环境） | 仓库 | 不是开发环境 |

### 1.2 腾讯 Cloud Studio

- 定位与能力：基于 VS Code 的云端 IDE，「内置终端、Git、插件」；平台还带课程中心、模板中心、应用广场、弹性算力（最高 A800）。来源：[产品概述](https://cloud.tencent.com/document/product/1039/72021)（页面标注最近更新 2026-05-20）。
- 界面分区：插件区「使用 Git、终端、调试、扩展、AI 助手等工具」。来源：[布局介绍](https://cloud.tencent.com/document/product/1039/131805)（2026-05-19）。
- 代码从哪来：模板中心/应用广场一键复刻，或从模板与应用创建后自行用 Git 管理。来源：[为什么选择 CloudStudio](https://cloud.tencent.com/document/product/1039/131764)（2026-05-19）。
- 计费（原文要点）：必须先绑定腾讯云账号；首次完成绑定赠 20 个机时；资源包 1 元/机时（量大降至 0.85）；按量付费 1 核 2G 0.1 元/小时 … 64 核 128G 7 元/小时，GPU A800 14 元/小时；资源包用尽自动转后付费。来源：[机时购买](https://cloud.tencent.com/document/product/1039/131894)（2026-08-11）。
- 移动浏览器：官方「浏览器兼容性」写明内置 VS Code 1.89，「Safari 15 及以上」可用，并提示 Safari 下 Web 视图可能出现差异。来源：[浏览器兼容性](https://cloud.tencent.com/document/product/1039/131931)（2026-05-20）。这是官方对「iPad Safari 可用」最接近的明文，**没有**逐字写「手机可用」。
- 用户可查证的「手机上打开」体验描述：未查到（本次未能访问第三方评测站，未做转述）。

### 1.3 华为 CodeArts IDE Online

- 定位：「轻量级 WebIDE，通过浏览器即可实现环境快速获取和环境访问，完成编码、构建、调试、运行、访问代码仓库和命令执行等工作」，内置插件市场。来源：[产品页](https://www.huaweicloud.com/product/cloudide.html)（页脚日期 2026-07-14）。
- 终端：官方写明「提供页面终端（WebTerminal）直接访问后端容器环境，以命令行设置变量、处理文件和配置其他环境因素」。来源：[什么是 CodeArts IDE Online](https://support.huaweicloud.com/productdesc-cloudide/brief_introduction.html)。
- 环境：全容器化，7 种预置技术栈，40+ 语言语法高亮，支持对接 Git 仓库（代码托管服务内仓库或 GitHub 等）。同上。
- 计费：按需开通，按存储资源与计算资源的使用时长计费；关闭服务后数据立即释放。来源：[按需开通](https://support.huaweicloud.com/usermanual-cloudide/purchase_cloudide.html)。**具体单价：未查到**（价格页为 JS 计算器，未取到数值）。
- 免费额度：产品页写「免费试用体验版套餐，50 人内免费试用」，额度与期限以购买页为准，**具体数值未查到**。
- 移动：官方措辞是「不限设备和操作系统」「通过浏览器访问」「实现移动办公」，未点名手机型号或移动浏览器。

### 1.4 阿里云

阿里云侧没有一个与 Cloud Studio 对位的独立「Cloud IDE」产品页（`https://www.aliyun.com/product/cloudide` 返回 404，实测 2026-11-26）。能对上的是三个不同东西：

**a) 云效 WebIDE（仓库内轻量编辑）**

- 原文：「WebIDE 提供了可以在浏览器中在线编辑代码的IDE界面……Codeup 集成 WebIDE 提供轻量级工作空间，面向一些需要快速编码提交的场景」，入口在 Codeup 源文件页与合并请求页的「⋯」菜单。来源：[云效 WebIDE](https://help.aliyun.com/zh/yunxiao/user-guide/webide)。
- 文档全篇只讲在线浏览/编辑/提交，**未提终端、未提运行环境**。代码来源限定为 Codeup 代码库。

**b) 云命令行 Cloud Shell（免费浏览器 shell，最接近「公网可用的开发环境」）**

- 原文：「免费网页版命令行工具」，启动时自动创建一台 Linux 虚拟机，「预装阿里云CLI、Terraform等常用工具和多种开发语言」，可直接访问 `shell.aliyun.com`。来源：[什么是云命令行](https://help.aliyun.com/zh/cloud-shell/what-is-the-cloud-command-line)。
- 内置：可视化代码编辑器（「简化版WebIDE的设计……在一个页面内进行在线开发」）、文件上传下载、Web 应用预览、自定义快捷配置。来源：[功能特性](https://help.aliyun.com/zh/cloud-shell/product-function-custom-node-cloudshell-normal)、[可视化代码编辑器](https://help.aliyun.com/zh/cloud-shell/user-guide/visual-code-editor)。
- 限制（关键）：「同一时刻只会创建一台虚拟机」「最多 5 个会话窗口」「无操作 30 分钟或关闭全部窗口 → 15 分钟后销毁」「虚拟机只有 1 小时使用期限」「10 GB 临时存储」「长时间使用以及计算或网络密集型等恶意进程将不受支持」。来源：[使用限制](https://help.aliyun.com/zh/cloud-shell/restrictions-on-use)。
- 持久化：挂载 NAS，主目录文件可跨实例保留。来源：[持久化存储](https://help.aliyun.com/zh/cloud-shell/user-guide/persistent-storage)。

**c) 函数计算 WebIDE**

- 按任务给的路径逐个探测（`/zh/functioncompute/fc/user-guide/webide`、`fc-2-0/…`、`fc-3-0/…`）均返回阿里云 404 页。**未查到**官方 WebIDE 文档页，因此不对其能力下任何结论。

### 1.5 Gitee

- `https://gitee.com/features/webide` 返回 404（实测 2026-11-26）；`https://gitee.com/features` 的产品列表里也没有 WebIDE 条目。帮助中心首页的分类是「AI 生产力 / 企业管理 / 项目管理 / 代码管理 / 流水线管理 / 效能度量」，无 WebIDE 分类。来源：[Gitee 帮助中心](https://gitee.com/help)、[Gitee 产品页](https://gitee.com/features)。
- **官方下线公告：未查到**。只能说公开入口已撤，不能断言服务终止。
- Gitee Go 仍在：CI/CD 流水线，「单个代码仓库 200 分钟免费构建时长，企业/组织每月 1000 分钟」。来源：[Gitee Go](https://gitee.com/features/gitee-go)。它是流水线，不是可交互的云端 IDE。

---

## 2. 国内可用的移动端 SSH / 终端客户端

### 2.1 国际产品在中国区 App Store 的实况

以 Apple 官方查询接口 `itunes.apple.com/cn/lookup` 的商品数据为准（返回即表示上架中国区）。

| App | 中国区上架 | 价格 | 版本 / 更新 | 系统要求 | 账号要求 |
| --- | --- | --- | --- | --- | --- |
| Termius | 是（id549039908） | 免费（Starter） | 8.2.0 / 2026-11-11 | iOS 17.0+ | 不强制；云同步需账号+订阅 |
| Blink Shell, Build & Code | 是（id1594898306） | 免费下载，含 14 天试用 | 18.7.3 / 2026-11-16 | iOS 17.6+ | 未查到强制账号 |
| JuiceSSH | 否（iOS 端并不存在该 App） | — | — | — | — |

- Termius 是否必须登录：官方 FAQ 原文「Can you use Termius without an account? Yes. You can log out and use Termius locally without one.」，并注明「To encrypt and sync your data with your cloud vault, you need an account and a subscription.」。来源：[Why am I required to create an account?](https://docs.termius.com/help-center/faq/why-am-i-required-to-create-an-account)（访问 2026-11-26）。
- Termius 移动端体验：官方有独立的 [Mobile terminal](https://docs.termius.com/terminal/mobile-terminal) 页，写触摸手势、可定制键盘、语音输入、Snippets 等；App Store 文案列 SSH/SFTP/Mosh/Telnet/端口转发。
- Blink Shell：App Store 文案写「first professional, desktop-grade terminal for iOS」，支持 Mosh/SSH、Secure Enclave 密钥、端口转发、SOCKS5、完整 ssh config，另有 Blink Code / Blink Build；「Start your 14-day free trial now!」表明试用后转订阅。来源：App Store 中国区商品页（id1594898306，访问 2026-11-26）。
- JuiceSSH：官方站 `https://juicessh.com/` 本次**实测无法建连**（curl: Failed to connect port 443），Google Play 页面**实测连接被重置**。因此它的国内可用性、是否需境外账号，**未查到**官方说法；能确认的只有「iOS 端没有这个 App」（中国区查询无结果）。

### 2.2 Android 侧

| App | 官方安装渠道 | 说明 |
| --- | --- | --- |
| Termux | F-Droid、GitHub Releases | 官网明确链接到 `termux-app#f-droid`、`termux-app#github`，并单列 `#google-play-store-deprecated` |
| JuiceSSH | 未查到可访问的官方渠道 | 见上 |

- Termux 官网原文：Android terminal emulator and Linux environment app，「works directly with no rooting or setup required」，可用 OpenSSH 的 ssh 客户端连远程服务器，APT 装包。来源：[termux.dev](https://termux.dev/en/)（访问 2026-11-26）。它本地就能跑，不依赖账号；但安装渠道是 F-Droid/GitHub 而非国内应用商店。

### 2.3 国内出品的同类

| 产品 | 移动端 | 依据 |
| --- | --- | --- |
| FinalShell | **无** | 官网只列 Windows / macOS / Linux，版本 4.6.3（2025-05-21）。来源：[hostbuf.com](https://www.hostbuf.com/)（访问 2026-11-26） |
| 华为云 App | **有 SSH** | 中国区 App Store 文案：「提供云服务移动控制台、告警监控、SSH、API调试、备案等基础操作」。id1247814104，3.64.1，2026-11-10 |
| 阿里云 App | 文案未提 SSH | 文案列「购买、管理云资源，监控产品数据，接收报警，AI 助理，工单」。id981011420，7.12.0，2026-04-16 |
| 腾讯云 App | **未查到** | 中国区 App Store 搜「腾讯云」「腾讯云控制台」均 0 条结果（2026-11-26） |

- 华为云 App 的 SSH 只有 App Store 文案这一条第一方证据；**具体操作路径、是否支持密钥/跳板、是否需公网 IP，未查到官方文档**。
- 另：中国区 App Store 还有第三方「面向 AI coding agent 的移动终端」Moshi（id6757859949，4.6.0，2026-11-24），文案主打 Mosh + tmux、语音输入、任务完成 Webhook 通知。属第三方商业产品，能力未独立核实。

---

## 3. 用厂商官方入口访问「自己的开发机」

### 3.1 阿里云 ECS

官方「选择ECS远程连接方式」表（[链接](https://help.aliyun.com/zh/ecs/user-guide/connection-methods)）直接给了结论：

| 工具 | 需本地装软件 | 必须开通公网 | 需登录阿里云 |
| --- | --- | --- | --- |
| Workbench（浏览器） | 否 | **否** | 是 |
| 会话管理（浏览器） | 否 | **否** | 是 |
| VNC（浏览器） | 否 | **否** | 是 |

- Workbench 能力：浏览器直接 SSH/RDP，带文件管理、AI Agent 模式、终端助手、多屏终端、录屏审计、脚本库。来源：[通过 Workbench 连接实例](https://help.aliyun.com/zh/ecs/user-guide/workbench-overview)。
- 但**仍要改安全组**：需放行来自 Workbench 服务端的入方向流量，公网连接放行 `47.96.60.0/24`、`118.31.243.0/24`、`8.139.112.0/24`、`8.139.99.192/26`，私网连接放行 `100.104.0.0/16`，端口按 SSH(22)/RDP(3389)。首次使用还要创建服务关联角色 `AliyunServiceRoleForECSWorkbench`。来源：同上。
- 换言之：**不需要公网 IP，但需要一次安全组配置 + 一次服务授权**；这不是「零配置」，也不是自建穿透。

### 3.2 腾讯云 CVM

- 官方推荐「OrcaTerm」网页登录：Windows/Linux/macOS 都能用浏览器登录，支持快捷键复制粘贴、鼠标滚屏、中文输入法，每次登录需密码或密钥。来源：[使用 OrcaTerm 方式登录 Linux 实例](https://cloud.tencent.com/document/product/213/5436)（2025-07-17）。
- 前提：**安全组需放通来源为 OrcaTerm 代理 IP 的 22 端口**（快速配置购买的机器默认已开通）。来源同上。
- 未查到 OrcaTerm 是否要求公网 IP 的明文；文档只写「放通 OrcaTerm 代理 IP」，未区分公网/私网。

### 3.3 华为云

- 未查到与 Workbench/OrcaTerm 对位的「网页 SSH 登录 ECS」官方文档页；华为云 App 的 SSH 见 2.3。

---

## 4. 国内 AI 编程产品的移动端

判断标准：App 是否能触达「我的代码 / 我的电脑 / 我的仓库」，而不只是通用对话。

| 产品 | 移动 App | 能否驱动远端编码任务 | 依据 |
| --- | --- | --- | --- |
| TRAE（字节） | 有（id6761400733，0.0.26，2026-11-20） | **能**：任务发往「云端环境或多台已配对的个人电脑」，电脑端设置页开启设备连接，支持文件夹级授权；手机端可看 Unified Diff View | [App Store 文案](https://apps.apple.com/cn/app/id6761400733)；[trae.cn/download](https://www.trae.cn/download) 列「移动端」 |
| Kimi（月之暗面） | 有（id6474233312，3.2.0，2026-11-19） | **能（限自家客户端）**：文案「远程控制：随时随地，你都可以通过手机控制电脑上的 Kimi Work。尚未完成的任务，都可以在手机上接着做」 | App Store 文案 |
| 豆包（字节） | 有（id6459478672，15.9.0，2026-11-23） | 文案只有通用助手/工作任务/生成文档 PPT，**未提**连接个人电脑或仓库 | App Store 文案 |
| 千问（阿里，原通义） | 有（id6466733523，7.7.2，2026-11-21） | 文案为对话、工作助理、定时任务、智能体广场，**未提**本机/仓库 | App Store 文案 |
| CodeBuddy（腾讯） | **未查到** | — | 中国区 App Store 搜 CodeBuddy 无腾讯条目；同名「Code Buddy 2.0」发行方是 Code Buddy LLC，非腾讯 |
| WorkBuddy（腾讯云） | 有（id6761374913，2.11.0，2026-11-25） | 办公向 AI 助理，文案「云上、本机双模式运行」，但产物是办公文档，**不是编码 agent** | App Store 文案 |

- TRAE 与 Kimi 的「手机驱动电脑」都要求**电脑端先装同名桌面客户端并完成配对**，走厂商自带中继，不需要用户自建穿透——与用户约束一致。这一条是产品文案层面的，**未实测**。
- 「手机 App 里远程驱动一个编码任务」的国内产品：目前查到的是 TRAE（编码为主）与 Kimi（通用任务 + 可接桌面端未完成任务）。二者都要装桌面端。

---

## 5. 明确「未查到」的项

1. 阿里云 函数计算 WebIDE 的官方文档页（多个候选路径 404）。
2. Gitee WebIDE 的官方下线公告；只能确认产品页 404、帮助中心无入口。
3. 华为 CodeArts IDE Online 的具体单价与免费试用额度数值（价格页为 JS 计算器）。
4. JuiceSSH 的国内可用性与官方安装渠道（官网不可达、Google Play 不可达）。
5. 腾讯云是否有一款面向中国区的 iOS 控制台 App。
6. 任何「在手机上打开 Cloud Studio / CodeArts IDE Online」的用户实测帖（本次未取到第三方评测来源，未做转述）。
7. 华为云 App 内 SSH 的操作文档（只有 App Store 文案）。
8. 腾讯 OrcaTerm 是否可用私网（无公网 IP）登录的明文说明。

## 对下游决策最关键的事实

1. 国内云 IDE 的三家都还活着：Cloud Studio（Safari 15+ 明文兼容）、CodeArts IDE Online（WebTerminal 明文）、阿里云只剩「云效 WebIDE（仅编辑 Codeup 仓库）+ 云命令行（免费，但 1 小时销毁）」。
2. Cloud Studio 绑定腾讯云账号首赠 20 机时，之后约 0.1 元/小时（1 核 2G）起；华为按计算+存储时长计费，单价未查到。
3. 免费且立即可用的浏览器 shell 是阿里云 Cloud Shell：`shell.aliyun.com`，自带编辑器与 CLI，但 30 分钟无操作即回收、总寿命 1 小时，只能当临时落脚点。
4. 手机连自己的服务器，国内不需要穿透也不必买公网 IP：阿里云 Workbench / 会话管理 / VNC 明确「不必开通公网」，代价是一次安全组放行 + 服务授权；腾讯 OrcaTerm 同理但要放通其代理 IP。
5. iOS 侧终端客户端在中国区可直接下载：Termius（免费、可完全离线不登录）、Blink（免费试用后订阅）。JuiceSSH 没有 iOS 版，官网与 Play 站本次均不可达。
6. Android 侧 Termux 可用，但官方渠道是 F-Droid / GitHub，Play 版已弃用，国内商店上架情况未查到。
7. 国产 SSH 客户端里，FinalShell 无移动端；华为云 App 文案明确含 SSH，阿里云 App 文案没有。
8. 真正「手机下发编码任务到我的电脑」的国内产品是 TRAE（云端或已配对个人电脑、文件夹级授权、手机看 diff）与 Kimi（控制桌面端 Kimi Work）；豆包、千问只是通用对话，CodeBuddy 未查到移动端。
9. 这些「手机驱动电脑」都依赖厂商自带中继 + 电脑端常驻客户端，符合「不自配穿透」的约束，但均未实测。
