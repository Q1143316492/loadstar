# 从移动端调用电脑上的 Agent 工作环境

> **状态：已收尾（2026-11-26）。** 目的地未按原计划抵达——用户在看完八类候选后决定**自研定制**，开发计划另行起草。本图保留为自研的论据与素材：候选全貌见 [panorama.md](panorama.md)，新计划该继承什么见 [最终走哪条路线](tickets/11-route-choice.md)。

## 目的地

手里（手机 / 平板）有一个入口，在外出或旅途中能直接调用电脑上的 Agent 工作环境——下指令、看它改了什么、继续推进。

走完这张地图：一份**候选方案全景**（有哪些路、各自的真实门槛与体验）+ **一组推荐组合**（主选与退路），以及两个具体痛点的做法：移动端如何局部浏览改动、如何顺手地输入斜杠命令与 skill 名。

**实际结局**：全景与痛点解法都完成了；推荐组合被用户换成「自研」，执行部分移出本图。

## 备注

- **约束（用户口径，不过度解读）**：
  - 中国大陆。手机端**不能**访问境外服务；桌面端维持现状即可。DeepSeek 之类的国产模型可接受。
  - **不自配内网穿透**（frp / tailscale / 自建中继都算配置），商业远控自带的中继可以。
  - 手上有**一台服务器**（配置未知，待查）。
  - 终端设备是 **iPad + 安卓**，两者都要能用。
  - Agent 底座**不锁定 Claude Code**，国产模型与国产 agent 产品都在候选里。
- **用户明确反感「先用问题把方案收窄」**：这一张图的产出应该是**全景与对比**，不是一份被约束逼出来的唯一解。盘问只用于澄清事实，不用于排除选项。
- **全景已成文**：[panorama.md](panorama.md) —— 八类候选、三个上游岔路、四条推荐路线、安全要点。后续会话先读它，再读票。
- 调研产物在 `research/`：
  - [移动端 agent 客户端现状](research/mobile-agent-clients.md)
  - [国内远程链路与穿透现状](research/china-remote-access.md)
  - [国产 agent 底座](research/domestic-agent-stack.md)
  - [移动端审 diff 与输入先例](research/mobile-diff-review.md)
  - [国内云端开发环境与移动终端](research/china-cloud-ide-and-mobile-terminal.md)
  - [WorkBuddy / CodeBuddy / 豆包 专项](research/workbuddy-codebuddy-doubao.md)
  - [DSH 能不能当底座](research/dsh-assessment.md)
  - [TRAE 移动端一手核实](research/trae-mobile-verified.md)
  - [借 IM 渠道驱动自己的 Agent](research/im-bridge-to-own-agent.md)
  - [主动外连通道清单](research/im-channel-options.md)
  - [自托管的移动端 Agent 网页界面](research/selfhosted-mobile-webui.md)
- 项目约定照旧：不自动提交；Markdown 严格 UTF-8 无 BOM。

## 已定决策

<!-- 索引：每条已解决的 ticket 一行 —— - [标题](tickets/NN-slug.md)：一行摘要 -->

- [国内能用的远程控制链路有哪些](tickets/02-china-remote-access.md)：商业远控零配置自带中转、不需公网 IP；UU 远程基础版免费且自带端口映射与终端连接；自建打洞/中继一律要公网服务器；Tailscale/ZeroTier 国内不成立；最省事的绕法是 agent 跑云主机（约 ￥45/月）。
- [国内直接可用的云端环境与移动终端](tickets/05-china-cloud-ide.md)：云 IDE 里腾讯 Cloud Studio 与华为 CodeArts 仍在运营；阿里云 Workbench/会话管理「不必开通公网」但需一次安全组放行；iOS 可直下 Termius（可离线免登录）；**TRAE 与 Kimi 是唯二「手机驱动个人电脑上的编码任务」的国内产品**：TRAE 移动端已用 Apple 接口 + 官方文档复核（id 6761400733，连接有效期 180 天、授权 `/documents`、技能点选），但其「Unified Diff View」只有商城文案、文档未提，**属未证实**；豆包、千问只是通用对话。
- [不锁 Claude Code 的底座有哪些](tickets/03-domestic-agent-stack.md)：DeepSeek / GLM / Kimi 三家都官方提供 Anthropic 兼容端点（改 base_url 即可，但兼容非无损）；**CodeBuddy 与 Qoder CN 官方内建「手机接管电脑会话」**；CodeBuddy 的 `/gateway`、`daemon`、ACP/REST 可自建移动控制台；开源侧 OpenHands 与 Cline 有官方远程形态，Roo Code 已关停。
- [移动端 Agent 客户端有哪些现成产品](tickets/01-mobile-agent-clients.md)：把「手机上看到什么」分 L1 终端镜像 / L2 会话视图（含 diff 面板）/ L3 任务面板；Claude 官方 Remote Control 免穿透且自带 diff，但**中国大陆不可用**；Happy 是唯一做齐「App + 中继 + diff」的开源方案且中继国内可达、可自建，但 App 不在中区商店；Omnara / Vibe Kanban / VibeTunnel 均已退出或停滞。
- [移动端怎么局部看改动、怎么顺手输入](tickets/04-mobile-diff-review.md)：主流做法是「文件 + 可折叠上下文 + 行内评论」，**逐块接受/拒绝只存在于 Working Copy 与 Orca 桌面端**；VS Code 系 Web IDE 在 iPad 上的硬伤是触屏选文本与软键盘（#261958 仍 open）；Orca / T3 Code / cmux 是 2026 年的三个移动优先先例；输入范式是「按钮 + 语音 + 片段」。
- [候选方案全景与推荐组合](tickets/06-options-and-recommendation.md)：六类候选成文于 [panorama.md](panorama.md)。三个上游岔路（代码在哪台机器 / 中继由谁出 / 换不换 agent）；两条路线——甲（WorkBuddy 或 TRAE，零配置，今天可用，代价是换掉技能库）、乙（DSH 0.2 架阿里云，`/` 菜单 + DiffBlock 同时解两个痛点，首屏 330 KB gzip，代价是代码云端副本 + 自架 TLS + 移动端未验证）。自建中控先别做。
- [要「像 Agent 那样对话 + Markdown」，该用哪个网页界面](tickets/10-mobile-webui.md)：IM 通道有结构天花板（线性文本、无工具展开/无 diff 面板）。**`Ike-li/claude-chat-mobile`** 最贴——Agent SDK 驱动本机真实 `claude` CLI，审批卡、skills 斜杠候选、`/rewind`、diff 汇总、锁屏推送、PWA，且明说为「接了国产模型的」人做；`siteboon/claudecodeui`（14.7k）更偏项目管理台。剩下的是「怎么连」，只有跑阿里云 / SSH 反向隧道两条可行。
- [怎么借厂商的移动渠道驱动自己的 Agent](tickets/09-im-bridge.md)：**渠道与执行者可拆**。飞书官方长连接（`lark_oapi/ws`）与钉钉 Stream 都是「你的机器主动外连」，**不需要公网 IP、不需要穿透**；现成实现 cc-connect（16.5k star）支持 Claude Code 并可通过 **ACP 接入任意 agent**（DSH 有 acp profile，协议对得上但未实测）。不推荐「让厂商 agent 跑脚本」的 hack。安全上是「聊天入口 = 命令入口」，需白名单 + 低权限。
- [DSH 能不能当这个底座](tickets/08-dsh-as-backend.md)：能力对口（`/` 出可点选技能菜单、DiffBlock 看改动、ACP/SDK 开放）。**本机检出 0.1.2 拒绝 `--host 0.0.0.0`，但上游 0.2.x 已支持 `--host` / `--public-url` / 原生 TLS，并附官方反代部署指南**。无官方中继与托管账号。前端首屏约 330 KB gzip、PWA 可装、流走 WebSocket。它是「电脑或服务器上的 agent 与网页前端」，接手机仍需 SSH 转发 / 反代+TLS / 自建前端三选一。
- [最终走哪条路线](tickets/11-route-choice.md)：**四条现成路线都不选，转为自研定制开发**，开发计划另行起草。本图随之从「装配方案」变成「自研的论据与素材」；该票末尾列了新计划应继承的事实（传输层 / Agent 侧 / 界面侧 / 带宽）与必须先补的真机实测空缺。

## 尚未明确

本图已收尾。**剩余未知全部移交新计划**，清单与已查明的事实见 [最终走哪条路线](tickets/11-route-choice.md)。其中唯一共同的关键空缺是：**没有任何移动端界面的真机实测**。

## 超出范围

- 自建内网穿透（frp / tailscale / headscale / 自建 RustDesk 中继）——用户已明确否决配置成本。
- 在触屏上直接改代码——只读浏览与留反馈即可。
- 绕过地区限制、共享账号之类的做法。
- [跑通一条最小闭环](tickets/07-minimal-loop.md)（已关闭）——原为「按选中的现成路线跑一遍」，路线本身不成立；其内容移交新计划。
