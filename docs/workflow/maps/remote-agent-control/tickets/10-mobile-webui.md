# 要「像 Agent 那样对话 + Markdown」，该用哪个网页界面

## 问题

用户否掉 IM 通道：飞书那种「看起来像必须变成纯对话了」。他要的是**接近在 Agent 中对话的体验**，以及 **Markdown 格式的浏览**。

要查清：有没有自托管的、面向手机的 Agent 网页界面，能驱动本机的 Claude Code，且能显示 Markdown、工具调用、diff。

产出：[research/selfhosted-mobile-webui.md](../research/selfhosted-mobile-webui.md)

类型：research
状态：已解决
阻塞于：无

## 答案

2026-11-26 检索 GitHub 并读 README / 部署文档 / package.json（未实测）。

**他的判断在架构上是对的**：IM 消息流是线性的，拿不到工具调用的结构化展开、diff 面板、审批专用界面与会话分层浏览。要那个体验必须换 Web UI。

**最贴的一个：`Ike-li/claude-chat-mobile`（CCM）**
- Apache 2.0，Node ≥ 20，56 star，2026-06 创建、2026-11 仍在推送。
- 依赖 `@anthropic-ai/claude-agent-sdk@0.3.310`——**用 Agent SDK 驱动本机真实的 `claude` CLI**，同一份 CLAUDE.md、MCP、skills、登录与权限规则。
- 明确定位：「给官方 Remote Control 进不去的人做的：典型是在 `claude` CLI 里接了中转、第三方模型、国产模型」——正对用户情况。
- 手机端能力：审批卡（允许/拒绝/中止本轮）、`AskUserQuestion` 选项点选、锁屏推送、`/model` 与权限档 chip、`@` 文件引用、**`/` 斜杠命令含已装 skills 且带说明与参数提示**、工具卡预览变更、回合末文件变更汇总、`/rewind` 两步回退、PWA、上传图片与粘贴截图。
- 部署位置无假设：**跑在自己的开发机或一台远程服务器上都成立**。
- 不自带穿透，也不绑定任何一家（`CF_ACCESS_*` 留空即整层关闭）。

**最成熟的另一个：`siteboon/claudecodeui`（CloudCLI）**，14,761 star，`npx @cloudcli-ai/cloudcli` 即跑，支持 Claude Code / Cursor CLI / Codex，带内置终端、文件树、Git 暂存提交。定位更偏「远程项目管理台」。

**真正剩下的问题不是界面，是「怎么连」**：这些方案都不带国内可用的公网中继。对本人只有三条——跑在阿里云上（不算穿透）、SSH 反向隧道到阿里云（一行命令）、Cloudflare/Tailscale（已否决）。

**取舍**：跑在阿里云 = 零穿透但代码与 `claude` 都在服务器；SSH 反向隧道 = 保住 Windows 工作区但要维护长连接，且必须按 CCM 文档设 `DEVICE_APPROVAL_SCOPE=all`（纯 TCP 转发下 `Host: localhost` 可冒充本机、绕过设备审批）。
