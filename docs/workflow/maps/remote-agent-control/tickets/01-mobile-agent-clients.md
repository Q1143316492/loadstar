# 移动端 Agent 客户端有哪些现成产品

## 问题

查清 2026 年 11 月的现状：从手机上接入「跑在自家电脑上的编码 agent」有哪些现成产品（官方 Remote Control、Happy、Omnara、Vibe Kanban 之类），各自解决的是「下指令」还是「看改动」，架构上是否需要中继、能否自建、在纯国内链路下能不能用。

产出：[research/mobile-agent-clients.md](../research/mobile-agent-clients.md)

类型：research
状态：已解决
阻塞于：无

## 答案

2026-11-26 由调研子智能体解决。连通性实测发自福建联通 AS4837、无代理。注意：`code.claude.com` 本机被解析到 127.0.0.1，官方文档正文经第三方镜像仓库取得，镜像逐字一致性未比对。

先把「手机看到什么」分三层：L1 终端镜像、L2 会话视图（含 diff 面板）、L3 任务面板。这比「哪个产品好」更能解释体验差异。

- **Claude 官方 Remote Control**：只发外向 HTTPS、不开入站端口，不需要公网 IP 或穿透；门槛是 claude.ai 订阅（API key 与自建网关不可用），电脑须常开。官方手机端**内置 diff 面板**（Diff 与 PR 按钮），含未提交改动。**但中国大陆不可用**：可用地区清单不含大陆与香港，实测 `claude.ai/code` 302 到 `app-unavailable-in-region`；中区 App Store 查不到 Claude App。
- **Happy**：唯一把「原生手机 App + 中继 + diff 取数」做齐的开源方案。默认中继国内可达（0.21 s 建连）、可 Docker 自建、App 内可改服务器地址。折扣：App 不在中区商店；diff 面板仍在 roadmap；原 CLI 进维护模式，新功能进桌面端，而桌面端不能配自建服务器。
- **其他曾经的候选**：Omnara 已转型自有 agent 平台（旧移动 App 下架）；Vibe Kanban 公司 2026-04 关停、远程服务撤除；VibeTunnel 仅 macOS/Linux 且三个月无提交；Conductor 无可核实来源。
- **自己搭的三条现成路都有硬妥协**：GitHub App 只看到已 push 的代码；code-server 官方列明 iPad 上 Esc 缺失、`ctrl+c` 失效、键盘丢失；SSH 只有纯文本 diff。VS Code Remote Tunnels 可不开端口把电脑接进浏览器（Azure 中继），端点国内可建连，但那是整个 IDE。
- **输入侧**：Claude 官方听写不支持中文；Happy 语音走 ElevenLabs 按分钟计费（免费 20 分钟/30 天）；官方 Channels（Telegram/Discord/iMessage）为 research preview，两个端点在本次网络下均超时。
