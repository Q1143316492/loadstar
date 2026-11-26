# 不锁 Claude Code 的底座有哪些

## 问题

查清在国内可直连的 agent 底座：DeepSeek / GLM / Kimi 是否官方提供 Anthropic 兼容端点；Trae、CodeBuddy、通义灵码、豆包有没有可远程驱动的形态；OpenHands、Aider、Cline 等开源 agent 能否在自建服务器上常驻并被网页/手机接入。决定「换底座」是选项之一还是必须。

产出：[research/domestic-agent-stack.md](../research/domestic-agent-stack.md)

类型：research
状态：已解决
阻塞于：无

## 答案

2026-11-26 由调研子智能体解决，全部取自官方文档/官方仓库（本机搜索引擎不可用，无二手评测）。

- **换模型不用换客户端**：DeepSeek（`api.deepseek.com/anthropic`）、智谱 GLM（`open.bigmodel.cn/api/anthropic`）、Kimi（`api.moonshot.cn/anthropic`）**三家都官方提供 Anthropic 兼容端点**，Claude Code 只改 `ANTHROPIC_BASE_URL` + 凭据 + 模型名，三家官方文档都直接教这套配法。也就是说「桌面继续用 Claude Code、模型换国产」是官方支持的路。
- **但兼容不是无损**：DeepSeek 明确忽略 `cache_control`、`mcp_servers`、`budget_tokens`，thinking 模式下 `max_tokens` 不是硬上限——换底座会改变缓存成本与上下文行为。
- **计费两类**：DeepSeek / Kimi 按量（DeepSeek flash 输出 $0.6–1.2/M，闲时半价）；GLM 编码走 Coding Plan 订阅、**禁止账号共享**、限指定工具，月费未查到。
- **官方内建「手机接管电脑会话」的国产 agent**：CodeBuddy（`/gateway` + Cloudflare Quick Tunnel 扫码 Web UI；`daemon start` 常驻；另有微信 channel）、Qoder CN（原通义灵码，移动端远程控制 + CLI 守护进程 + Cloud Agents）。Trae 是移动端连桌面端（限当前项目）+ 网页端只跑云端。
- **想自建移动控制台的官方入口**：ACP + REST/SSE —— CodeBuddy（`/api/v1/*`、ACP、Python/TS SDK）、Qoder CN（ACP、Agent SDK、Cloud Agents API）；Trae 的 ACP 只在企业旗舰版 CLI 2.0。
- **开源侧**：OpenHands（Agent Canvas `--public` 常驻，官方警告需反代+密钥+ACL）、Cline（Kanban Web UI 可绑 0.0.0.0、Desktop SSH 远程）都有官方远程形态且能接国产模型；Aider 无官方远程；**Roo Code 官方文档宣布已于 5 月 15 日关停**；Codex CLI、Gemini CLI 都要境外账号。
- 基准数字不可横比（harness 不同）；GLM Coding Plan 月费与 CodeBuddy 各档价格两个缺口未查到。
