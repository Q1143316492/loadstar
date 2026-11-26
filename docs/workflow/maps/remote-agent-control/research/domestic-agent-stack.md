# 国内可用的远程编码会话底座：事实清单

调研日期：2026-11-26

> 服务对象：`remote-agent-control` 这张图的选型票。本文只收集事实，不做选型建议。
> 采集边界：所有事实取自厂商官方文档站、官方价格页与官方 GitHub 仓库，逐条附链接与访问日期（全部为 2026-11-26）。本次环境里 Google / Bing / 百度 均不可用或需人机验证，所以没有使用搜索引擎，也没有引用二手评测；能直连的官方站点逐个抓取，抓不到的写「未查到」。
> 口径：「官方支持的」= 厂商文档或官方仓库明确写明；「未查到」= 官方页面无此陈述或页面抓取失败。凡需要破解、共享账号、绕过地区限制的做法，本文一律不采集。

---

## 1. 国产模型的 Anthropic Messages API 兼容端点

三家都**官方**提供 Anthropic 兼容端点，配置方式都是让客户端读 `ANTHROPIC_BASE_URL` 一类环境变量。差异在兼容细节与计费方式。

### 1.1 DeepSeek

- 端点：`https://api.deepseek.com/anthropic`。官方文档写明「为满足使用 Anthropic API 生态的需求，我们的 API 增加了对 Anthropic API 格式的支持」。
- 客户端配置（官方《Integrate with Claude Code》原文，给的是完整一套）：

  ```sh
  export ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic
  export ANTHROPIC_AUTH_TOKEN=<DeepSeek API Key>
  export ANTHROPIC_MODEL=deepseek-flash[1m]
  export ANTHROPIC_DEFAULT_OPUS_MODEL=deepseek-flash[1m]
  export ANTHROPIC_DEFAULT_SONNET_MODEL=deepseek-flash[1m]
  export ANTHROPIC_DEFAULT_HAIKU_MODEL=deepseek-flash
  export CLAUDE_CODE_SUBAGENT_MODEL=deepseek-flash
  export CLAUDE_CODE_EFFORT_LEVEL=max
  export CLAUDE_CODE_AUTO_COMPACT_WINDOW=786432
  ```

  Windows 版本是同一组变量的 `$env:` 写法。除环境变量外，官方页也给了「从零安装 Claude Code」的步骤。
- 模型名映射：`claude-opus*` → `deepseek-v4-pro`，`claude-haiku*` / `claude-sonnet*` → `deepseek-flash`；不以 `claude` 开头且不受支持的模型名返回 400。官方明确说这条映射让「新版 Claude Desktop APP 的开发者模式只改 base_url 和 api_key 就能接 DeepSeek」。
- 官方列出的兼容差异（摘对本图有影响的）：`anthropic-beta` 在 `/messages` 上被忽略（Files API 例外）；`anthropic-version` 忽略；`mcp_servers` 忽略；`cache_control` 忽略（消息与工具块都是）；`thinking` 只认 `enabled`/`disabled`，`budget_tokens` 忽略；`tool_choice: any` / `tool` 在 thinking 模式下受限或报 400；`container` 忽略；`document` 只支持 `file`/`text` 源；`redacted_thinking`、`mcp_tool_use`、`container_upload` 不支持。Claude Code / OpenCode 的主 agent 请求在 thinking 模式下，服务端可能把 `max_tokens` 提高，**该参数不构成严格输出上限**。
- 官方说 Claude Code 里的 Web Search 原生可用：搜索请求本身不计费，但用来总结检索结果的额外推理按 token 计费。
- 价格（官方 Models & Pricing，美元/百万 tokens，1M 上下文，最大输出 384K）：

  | 模型 | 缓存命中（闲/峰） | 输入（闲/峰） | 输出（闲/峰） |
  |---|---|---|---|
  | deepseek-flash | $0.003 / $0.006 | $0.15 / $0.30 | $0.60 / $1.20 |
  | deepseek-v4-pro | $0.022 / $0.044 | $0.66 / $1.32 | $1.98 / $3.96 |

  峰时为 UTC 周一至周五 01:00–04:00 与 06:00–10:00，其余（含周末与中国法定假日）为闲时，闲时价是峰时一半。
- 来源：`https://api-docs.deepseek.com/guides/anthropic_api`、`https://api-docs.deepseek.com/quick_start/agent_integrations/claude_code/`、`https://api-docs.deepseek.com/quick_start/pricing/`（均访问 2026-11-26）。

### 1.2 智谱 GLM

- 端点：`https://open.bigmodel.cn/api/anthropic`。官方《Claude Code》页给出三种配置法：`npx @z_ai/coding-helper` 助手、官方 shell 脚本（仅 macOS/Linux）、手改 `~/.claude/settings.json`。
- 手改 `settings.json` 的官方示例（`env` 字段）：

  ```json
  {
    "env": {
      "ANTHROPIC_AUTH_TOKEN": "YOUR_API_KEY",
      "ANTHROPIC_BASE_URL": "https://open.bigmodel.cn/api/anthropic",
      "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.7",
      "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-5.2[1m]",
      "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-5.2[1m]",
      "CLAUDE_CODE_AUTO_COMPACT_WINDOW": "1000000",
      "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": 1,
      "API_TIMEOUT_MS": "3000000"
    }
  }
  ```

  另需在 `~/.claude.json` 写入 `"hasCompletedOnboarding": true`（官方脚本会自动做）。
- 模型与 effort：套餐默认映射到 `glm-4.7`；用 `glm-5.2[1m]` 需同时把压缩窗口设为 `1000000`。Claude Code 的 `/effort` 映射：`low/medium/high → high`，`xhigh/max/ultracode → max`，官方推荐编码任务切 `max`。
- **计费形态是订阅制，不是按量**：GLM Coding Plan 有 Lite / Pro / Max 三档，积分额度（5 小时 / 每周）分别为 2,000/10,000、12,000/60,000、28,000/140,000。官方明确「套餐仅限在指定工具与产品环境中使用」「禁止账号共享或多人共用」。
- 套餐可用模型：GLM-5.4、GLM-5.3、GLM-5.3-Flash；GLM-5.4 支持 1M 上下文，官方建议把客户端上下文设 512000。**GLM-5.4 的模型 API「将在完成安全评估后开放」**，目前只走 Coding Plan。
- 标准 API 价格（元/百万 tokens，官方 API 定价页）：GLM-5.3 1M 上下文 输入 8 / 输出 28 / 缓存命中 2；GLM-5.3-Flash 0.8 / 2.8 / 0.23；GLM-5.2 8 / 28 / 2；GLM-5.1 输入 <32K 档 6 / 24 / 1.3。
- **Coding Plan 月费数字：未查到**。`bigmodel.cn/pricing`、`bigmodel.cn/claude-code` 等页面由前端渲染，直连只返回 6.4KB 空壳；官方文档只给积分额度，不给价格。
- 来源：`https://docs.bigmodel.cn/cn/guide/develop/claude`、`https://docs.bigmodel.cn/cn/coding-plan/overview`、`https://docs.bigmodel.cn/cn/coding-plan/usage-notes`、`https://docs.bigmodel.cn/cn/guide/start/pricing`、`https://docs.bigmodel.cn/cn/guide/models/glm-5.4`（均访问 2026-11-26）。

### 1.3 Kimi（Moonshot）

- 端点：`https://api.moonshot.cn/anthropic`。官方文档标题就是《在 Claude Code 中使用 Kimi》，正文写明这是 Anthropic 兼容端点（Messages API）。
- 官方推荐的配置写在 `~/.claude/settings.json` 的 `env` 里（比环境变量优先）：

  ```json
  {
    "env": {
      "ANTHROPIC_BASE_URL": "https://api.moonshot.cn/anthropic",
      "ANTHROPIC_AUTH_TOKEN": "YOUR_MOONSHOT_API_KEY",
      "ANTHROPIC_MODEL": "kimi-k3[1m]",
      "ANTHROPIC_DEFAULT_OPUS_MODEL": "kimi-k3[1m]",
      "ANTHROPIC_DEFAULT_SONNET_MODEL": "kimi-k3[1m]",
      "ANTHROPIC_DEFAULT_HAIKU_MODEL": "kimi-k3[1m]",
      "ANTHROPIC_DEFAULT_FABLE_MODEL": "kimi-k3[1m]",
      "CLAUDE_CODE_SUBAGENT_MODEL": "kimi-k3[1m]",
      "CLAUDE_CODE_AUTO_COMPACT_WINDOW": "1000000",
      "CLAUDE_CODE_EFFORT_LEVEL": "max"
    }
  }
  ```

  文档逐条解释了每个变量不配的后果（后台摘要、子 Agent 会静默失败），还给了「清理历史 `ANTHROPIC_*` 残留」的脚本——因为 `settings.json` 的 `env` 会覆盖终端 export。
- 验证方式：`curl https://api.moonshot.cn/anthropic/v1/messages` 带 `Authorization: Bearer`；`/status` 里 Base URL 与 Model 应显示上述值。
- 价格（元/百万 tokens，官方定价页）：

  | 模型 | 输入 | 输出 | 缓存命中 | 缓存写入 5min | 缓存写入 1h |
  |---|---|---|---|---|---|
  | kimi-k3.1-pro | ¥13.00 | ¥68.00 | ¥1.30 | ¥13.00 | ¥26.00 |
  | kimi-k3.1-pro-highspeed | ¥26.00 | ¥136.00 | ¥1.30 | ¥26.00 | ¥52.00 |
  | kimi-k3 | ¥20.00 | ¥100.00 | ¥2.00 | ¥20.00 | ¥40.00 |

  K3 系列 1,048,576 tokens 上下文；Batch API 为标准价 60%。K2 系列计划 2026 年 12 月底全部下线。
- Kimi API 是**纯按量**，官方明确「不提供订阅制方案」，与 Kimi 会员、Kimi Code 是不同产品。
- 来源：`https://platform.kimi.com/docs/guide/claude-code-kimi`、`https://platform.kimi.com/docs/pricing/chat`、`https://platform.kimi.com/docs/guide/product-plans`（均访问 2026-11-26）。

### 1.4 三家共同点（对「换底座」这件事直接相关）

- 都只需改客户端的 base URL + 凭据 + 模型名，Claude Code、Claude Desktop 开发者模式都被官方点名为目标客户端。
- 三家都**没有**声称实现完整的 Anthropic 语义：DeepSeek 明列了忽略/降级字段（缓存控制、MCP、budget_tokens 等）；GLM 与 Kimi 的文档没给同等细的兼容表（Kimi 另有一份 `/docs/api/messages` 参考页，本次未逐字段核对）。
- 国内部署、人民币/美元计费、需实名注册——这三条是三家的共同前提，无一条需要境外账号。

---

## 2. 国产 agent 产品能否远程 / 移动接入

### 2.1 字节 Trae

- 形态：TRAE（IDE，Agent 窗口 + IDE 窗口双形态）、TRAE Plugin（VS Code / JetBrains / Android Studio）、TRAE CLI 2.0、TRAE 企业版。官方产品矩阵页原话「覆盖 IDE、编辑器插件和 CLI 形态」。
- **不是只有 IDE**：
  - **移动端**：官方《快速开始：TRAE 移动端》写明手机可「选择电脑中的活跃项目，向 TRAE 桌面端下发任务，并在手机和电脑上同步查看对话、任务进度和最终产出」。限制：仅移动端 Code 模式可连桌面端；只能访问桌面端**当前打开**的项目；授权有效期 180 天；需开「保持电脑处于唤醒状态」。
  - **网页端**：`work.trae.cn`，但官方说明「TRAE 网页端仅支持云端环境」，云端任务在桌面端（仅 Agent 窗口）、网页端、移动端之间同步；本地任务只在桌面端与移动端之间同步。
  - **云端运行环境**：Agent 窗口可把任务跑在云端容器（官方 all-in-one 镜像，可选 Python/Node/Go/Rust/Java/Ruby/PHP/Swift 版本），但不能自定义容器镜像。
- CLI 与开放接口：
  - TRAE CLI 2.0 支持交互 TUI 与**非交互式命令**（可进脚本/CI），并支持 **Agent Client Protocol（ACP）**，官方原话「可作为智能体服务端接入支持 ACP 的编辑器或客户端」——这是第三方前端套壳的官方入口。
  - **使用限制**：官方页末尾写明「仅 TRAE 企业版的旗舰版套餐客户可使用 TRAE CLI 2.0」。
  - 企业版 OpenAPI 只覆盖成员管理、数据同步、审计追踪一类管理面，官方未描述用 API 驱动编码会话。
- 价格（官方定价页）：Free ¥0（500 积分/月，2 个云端任务并发）、Lite ¥49/月（首月 ¥39，2,000 积分，2 并发）、Pro ¥99/月（首月 ¥69，4,000 积分，10 并发）、Pro+ ¥239/月（首月 ¥219，12,000 积分，10 并发）、Ultra ¥699/月（首月 ¥629，40,000 积分，20 并发）。
- 旁证：`marscode.cn` 现在 302 到 `trae.cn/plugin`，即字节旧产品 MarsCode 已并入 Trae。
- 来源：`https://docs.trae.cn/`、`https://docs.trae.cn/ide_get-started-with-trae-mobile`、`https://docs.trae.cn/ide_trae-across-desktop-web-and-mobile`、`https://docs.trae.cn/cli_about-trae-code-cli-2`、`https://docs.trae.cn/ide_set-up-your-cloud-environment`、`https://www.trae.cn/pricing`（均访问 2026-11-26）。

### 2.2 腾讯 CodeBuddy（CodeBuddy Code）

- 形态（官方 llms.txt 原文）：VSCode / JetBrains 插件 + 独立 IDE + 命令行工具 CodeBuddy Code；内置混元 Code、DeepSeek、Kimi、Qwen，企业可接自有 API Key。
- **远程控制（Beta）是官方功能**，把「手机接管开发机」做成了产品内建：
  - 在会话里输入 `/gateway`，本地起 Gateway，通过 **Cloudflare Quick Tunnel**（`*.trycloudflare.com`）或局域网暴露 Web UI；终端打印二维码，手机扫码即连；也可复制带 token 的 URL 在任意浏览器打开。
  - 提供 Web 终端、多实例切换、亮/暗主题、中英界面；Web UI 基于 ACP 与本地 Agent 通信。
  - Webhook 端点可接企业微信 / 钉钉 / 飞书机器人。
  - 官方限制：每个实例同时只支持一个 Gateway；**终端需保持运行**，关掉进程远程即断；Quick Tunnel 域名临时，固定域名需 Cloudflare Named Tunnel。
  - **安全语义**：远程下发的任务自动以 `bypassPermissions` 运行（远程无法交互审批）。
- **常驻服务 + 开放 API**：`codebuddy daemon start`（可 `--host 0.0.0.0`、`--port`）以 detached 进程常驻，暴露 REST `/api/v1/*` 与 ACP `/api/v1/acp`（JSON-RPC over SSE），Swagger 在 `/api/docs`，OpenAPI 规范在 `/api/openapi.json`；另有 Python / TypeScript SDK。本地访问免密，**非本地地址强制密码认证**；绑定 `0.0.0.0` 且未设 CORS 时自动允许所有来源（认证仍强制）。
- 无头模式：官方有独立的《无头模式（Headless Mode）》文档；`codebuddy --bg "任务"` 后台跑，`ps/logs/attach/kill` 管理。
- 自定义模型：`~/.codebuddy/models.json` 可加 `url` + `apiKey`（支持 `${ENV}`），官方注明「**目前仅支持 OpenAI 接口格式的 API**」，`url` 要写到 `/chat/completions`。
- 定价数字：**未查到**。`codebuddy.cn/pricing` 由前端渲染，抓取只有标题；官方 llms.txt 只说分「免费版 / 专业版 / 企业版」三档。
- 来源：`https://www.codebuddy.cn/llms.txt`、`https://www.codebuddy.cn/docs/cli/remote-control`、`https://www.codebuddy.cn/docs/cli/daemon`、`https://www.codebuddy.cn/docs/cli/http-api`、`https://www.codebuddy.cn/docs/cli/headless`、`https://www.codebuddy.cn/docs/cli/models`（均访问 2026-11-26）。

### 2.3 阿里 Qoder CN（原通义灵码）

- 品牌事实：通义灵码**已于 2026-05-20 正式更名为 Qoder CN 系列**，现含 Qoder CN（桌面一体化工作空间）、Qoder CN IDE / JetBrains 插件、Qoder CN CLI、Qoder Agent SDK（TS/Python）、Qoder Cloud Agents、QoderWake CN（数字员工）、Qoder CN 移动端。
- 底座：官方写明「底层支持 GLM、DeepSeek、Kimi、MiniMax 等国内主流大模型，全链路在国内云上部署」。
- **移动端是官方形态**：手机 App 用同账号登录后可「远程控制 CLI 和 Qoder CN」，查看运行中/已就绪/已归档任务、处理审批、审核 Plan 方案。限制：任务仍在原执行环境运行，**需保持对应电脑/环境在线**；WSL 工作区要先在 Windows 上完成连接与初始化。
- CLI 侧两种远程模式（官方《Remote Control》）：在已有会话里开远程监听（扫码/URL 接入），或**以守护进程运行 CLI**，手机端可直接发起新任务。所有产物留在运行 CLI 的电脑上。
- 开放接口：CLI 支持 **ACP**（「可被集成到任何一种实现了 ACP 协议的客户端中」）、非交互（Headless）模式、Typescript/Python Agent SDK；Cloud Agents 是**全托管沙箱 + REST API + SSE 事件流**，可长时异步、批量并发，关闭客户端后任务继续跑。
- BYOK：CLI 的 `/model` → Custom 页签可接第三方模型（个人版；可选目录以向导实时展示为准），官方要求必须走向导、不要手改 `settings.json`。
- 价格（官方计费说明，元/月）：个人 Pro ¥59（年付 637.20）、Pro+ ¥169（1,825.20）、Ultra ¥559（6,037.20）；Teams ¥99/席位·月、企业标准版 ¥149、企业专属版（VPC）¥199；积分 Pro 2,000/月、Pro+ 6,000/月、Ultra 20,000/月；体验版含 2 周试用 + 300 Credits；资源包 40 元/1,000 Credits（1 个月有效）。
- 来源：`https://docs.qoder.cn/product-overview/introduction-of-qodercn`、`https://docs.qoder.cn/mobile/app/remote-control`、`https://docs.qoder.cn/cli/remote-control`、`https://docs.qoder.cn/cli/acp`、`https://docs.qoder.cn/cli/custom-models`、`https://docs.qoder.cn/cloud-agents/overview`、`https://docs.qoder.cn/product-overview/billing-description`（均访问 2026-11-26）。

### 2.4 豆包 / 字节的编码产品

- `doubao.com` 首页只把「编程工具」列为聊天助手能力之一（写作、翻译、编程），**未查到**任何官方文档说明豆包有网页版/移动端可以驱动一台开发机的形态。
- 字节这一侧的编码 agent 产品线就是 Trae（见 2.1）；MarsCode 域名已跳转 Trae。
- 结论口径：**豆包 = 聊天产品，不作为远程编码会话底座；未查到相反证据。**

### 2.5 这一节的横向事实（不做推荐，只列差异）

| 产品 | 手机接开发机 | 网页/浏览器接 | 常驻服务 | 第三方可套壳的开放接口 |
|---|---|---|---|---|
| Trae | 官方支持（连桌面端，仅当前项目，180 天授权） | 有，但只跑云端环境 | 云端运行环境（不能自定义镜像） | ACP（CLI 2.0，**限企业旗舰版**）；管理面 OpenAPI |
| CodeBuddy | 官方支持（`/gateway` + 扫码，需终端在跑） | 有（同一个 Web UI） | `daemon start` 常驻 + REST/ACP + SDK | REST `/api/v1/*`、ACP、Python/TS SDK |
| Qoder CN | 官方支持（远程控制 + 守护进程两种） | 官方文档未单列浏览器形态 | CLI 守护进程；Cloud Agents 全托管沙箱 | ACP、Agent SDK、Cloud Agents REST + SSE |
| 豆包 | 未查到 | 未查到 | 未查到 | 未查到 |

---

## 3. 开源、可自托管的编码 agent

### 3.1 OpenHands

- 开源版叫 **Agent Canvas**，官方定位「free, open-source workspace on your own machine or server」，可跑在笔记本、VM、Docker；企业版自托管在自有基础设施。
- **能做成常驻服务并被远程接入**，官方给了四种形态：
  - `agent-canvas --backend-only --public`：VM 只跑后端，前端在本机，用 **Manage Backends** 填 VM 地址；
  - `agent-canvas --public`：UI + 后端都在 VM，浏览器开 VM / 反代 / ngrok 地址；
  - Docker（`127.0.0.1:8000` 只发布到本机，容器内监听所有接口）；
  - Kubernetes（官方 Helm chart）。
  - VM 规格建议：Ubuntu 24.04、2 vCPU / 4 GB 够单用户。
- 官方安全前提：agent server 会读写宿主文件、执行 shell、访问网络，暴露到公网前要 `--public` + 强 `LOCAL_BACKEND_API_KEY` + 网络访问控制；Docker 场景用 `AGENT_CANVAS_ALLOW_LAN_SESSION_KEY=true` 时官方警告「能访问前端的人就能拿到内嵌会话密钥」，必须配合 `-p 127.0.0.1:8000:8000`。
- 模型：官方「可接 LiteLLM 支持的任何 LLM，但需要强模型」；有 Moonshot 专页（示例还是 `kimi-k2-0711-preview`，文档偏旧）；Agent Canvas 的 `Advanced` 页签可填任意 **OpenAI 兼容**端点（LM Studio / Ollama / vLLM / SGLang 一类）。
- 有无境外依赖：代码开源、可全自托管；模型可指向国内端点（OpenAI 兼容即可），不强制境外 API。
- 来源：`https://docs.openhands.dev/overview/introduction`、`https://docs.openhands.dev/openhands/usage/agent-canvas/setup`、`https://docs.openhands.dev/openhands/usage/agent-canvas/backend-setup/vm`、`https://docs.openhands.dev/openhands/usage/agent-canvas/model-configuration`、`https://docs.openhands.dev/openhands/usage/llms/llms`、`https://docs.openhands.dev/openhands/usage/llms/moonshot`（均访问 2026-11-26）。

### 3.2 Cline

- 形态：IDE 插件、桌面 App、CLI（交互 + headless）、Kanban（多 agent 并行、git worktree）。
- **Kanban 是个可远程访问的 Web 面**：默认绑 `127.0.0.1:3484`；`kanban --host 0.0.0.0` 或 `KANBAN_RUNTIME_HOST=0.0.0.0 cline` 可让局域网设备（手机/平板）访问；官方**推荐 Tailscale** 做异地接入，也列了隧道/VPN/云服务。官方警告：能访问 Kanban 就等于拿到仓库与终端的完整权限。
- **Cline Desktop 可对远程 Linux/macOS 主机跑会话**（SSH）：本机不用装东西，首次连接会往远端 `~/.cline/remote/` 放一个约 30MB 的 helper，会话历史留在远端；要求密钥登录、主机已被信任、Linux x64/arm64 或 macOS。
- **Cline Cloud Agents**：浏览器里用，GitHub 仓库 + 云沙箱，关掉标签页任务继续跑，手机浏览器可查进度；限制 10 并发 / 50 会话每天；Rules、skills、MCP 在云会话里不加载。
- 模型：官方支持 DeepSeek、Z AI（智谱 GLM）、Qwen、MiniMax、OpenAI Compatible 等 provider——不强制境外 API。
- 来源：`https://docs.cline.bot/kanban/remote-access`、`https://docs.cline.bot/usage/cline-desktop-ssh`、`https://docs.cline.bot/usage/cloud-agents`、`https://docs.cline.bot/cli/cli-reference`、`https://docs.cline.bot/provider-config/zai`（均访问 2026-11-26）。

### 3.3 Roo Code

- 官方文档站首页公告：**「The Roo Code Extension was shut down on May 15th.」**（页面未标年份），建议改用社区 fork **ZooCode** 或 Cline。付费账单问题给 `billing@roocode.com`。
- 即：Roo Code 不再是可选项；原「VS Code 插件 + 是否 headless」的问题对它已无意义。
- 来源：`https://docs.roocode.com/`（访问 2026-11-26）。

### 3.4 Aider

- 有实验性浏览器 UI：`aider --browser`，在本地浏览器里协作改本地 git 仓库。
- 模型：官方有 DeepSeek provider 页（`DEEPSEEK_API_KEY`，模型写 `deepseek/deepseek-chat`），也有 OpenAI compatible APIs 页——可用国内端点。
- **未查到**官方文档描述「常驻服务 + 监听地址 + 远程/手机接入」的形态；浏览器 UI 的文档只讲本地启动。按「可自建服务被远程接入」这一条，Aider 没有官方支持。
- 来源：`https://aider.chat/docs/usage/browser.html`、`https://aider.chat/docs/llms/deepseek.html`、`https://aider.chat/docs/llms/openai-compat.html`（访问 2026-11-26）。

### 3.5 OpenAI Codex CLI

- 本地 CLI，装法 `npm i -g @openai/codex` 或独立安装器；也有 IDE 扩展与 `codex app` 桌面形态、以及云端的 Codex Web。
- 可换底座：官方仓库配置文档有 `model_providers` 表，支持 `base_url` + `env_key` + `wire_api`（`"chat"` 或 `"responses"`），文档原话「这让 Codex CLI 能配合非 OpenAI 模型使用，只要对端兼容 OpenAI chat completions 线协议」，并给了 Ollama / Mistral 例子。
  - 注意版本：该段来自仓库 `docs/config.md`（本次读到的是 tag `rust-v0.44.0`）。当前官方文档已迁到 `developers.openai.com/codex/*`，该域在本机被 403 拦下，**最新配置键未核对**。
- 账号前提：README 首推「Sign in with ChatGPT」（Plus / Pro / Business / Edu / Enterprise），也支持 API key（需额外配置）。两条都需要 OpenAI 账号与境外可达的端点——官方没有面向中国大陆的接入说明。
- 来源：`https://github.com/openai/codex`（README，访问 2026-11-26）、`https://raw.githubusercontent.com/openai/codex/rust-v0.44.0/docs/config.md`（访问 2026-11-26）。

### 3.6 Gemini CLI

- 官方 README 的现状（2026-11 抓取）：**只面向企业**——「Designed for Gemini Code Assist Standard / Enterprise licenses and Code Assist for GitHub on Google Cloud」；免费个人额度与 Google AI Pro/Ultra 已于 **2026-06-18** 迁到 **Antigravity CLI**（`agy`）；Gemini CLI 本身也不再针对 Gemini 4 系列调优。
- 认证：Google 账号 OAuth、Gemini API Key（`aistudio.google.com/apikey`）或 Vertex AI——三者都是 Google 体系。
- 结论：作为「国内可用的自托管底座」不成立（需 Google Cloud/账号）；同一仓库还提供 headless 模式（`-p`、`--output-format json/stream-json`），这对自建控制台有用，但底座本身是境外的。
- 来源：`https://github.com/google-gemini/gemini-cli`（README，访问 2026-11-26）。

### 3.7 这一节的横向事实

| 项目 | 常驻服务 | 网页/手机接入 | 官方 remote 形态 | 是否强制境外模型 |
|---|---|---|---|---|
| OpenHands (Agent Canvas) | 是（`--public` / backend-only / Docker / Helm） | 是（浏览器，可反代/ngrok） | 官方文档专门有一节 | 否（任意 LiteLLM / OpenAI 兼容端点） |
| Cline | 是（Kanban 可绑 0.0.0.0） | 是（局域网 / Tailscale / 隧道） | 是（Kanban Remote Access、Desktop SSH、Cloud Agents） | 否（有 DeepSeek/GLM/Qwen provider） |
| Roo Code | — | — | 已于 5 月 15 日关停 | — |
| Aider | 未查到 | 本地浏览器 UI | 未查到 | 否（DeepSeek 官方 provider） |
| Codex CLI | 否（本地进程） | 未查到 | 无（云端是 Codex Web 托管产品） | 是（ChatGPT 账号或 OpenAI API） |
| Gemini CLI | 否（本地进程） | 未查到 | 无 | 是（Google 账号 / Cloud） |

---

## 4. 模型在编程 / 长任务上的可查评价（只列有出处的）

「有出处」在这里的含义：数字出自模型厂商自己的官方页面或官方 benchmark 图，附链接。第三方独立评测本轮**未查到**（无法使用搜索引擎，故没有采集任何媒体或社区转述）。

### 4.1 DeepSeek（官方 benchmark 表，V4.1-Flash-1017 发布页）

- Terminal-Bench 4.0：**42.3**（官方脚注：该项用 **Claude Code 框架**跑）；DeepSWE v1.1：**77.0**（Mini-SWE-V2 框架）；Automation-Bench v1.0.6：60.5；Agents' Last Exam：35.4；Apex Bench v1.1：72.1；NL2Repo-Bench：68.2。
- 同表对照列（官方自己放的）：Kimi K3 的 Terminal-Bench 12.6 / GLM-5.3 37.9 / GPT-5.6-Sol 39.9 / Claude Opus 5 51.8。注意这两个对照数是 DeepSeek 侧跑出来的，与 Kimi 自己页面的 65.7 不可直接对比（harness 不同）。
- 来源：`https://api-docs.deepseek.com/news/news261017`（含 `v4.1_261017_benchmark_table_en.png`，访问 2026-11-26）。

### 4.2 Kimi K3.1 Pro（官方 benchmark 总览图）

- Terminal-Bench 4.0：**65.7**（页面对照：Claude Opus 5.5 66.4、GPT-6 Astra 58.2、Fable 5.1 57.9、DS-V4.1-Flash-1017 42.3、GLM-5.3 41.8）。
- SWE Marathon：**51.7**（Opus 5.5 46.3）。Kimi Code Bench 3.0 Long-horizon：**61.2**——官方注明这是**内部**基准（K3 为 55.95）。Terminal-Bench Science 0.1：38.1。Agents' Last Exam：43.2。Office QA Pro v2：64.4。
- 官方自述口径：代码 / Agent / 知识类基准「达到或接近最强闭源模型的水平」；并给了事实准确性的压力测试（单条事实错误率 23.35% → 6.85%，官方强调样本刻意挑易错场景，不代表日常水平）。
- 来源：`https://platform.kimi.com/docs/guide/kimi-k3-1-pro-quickstart`（含 `benchmark-grid.png`，访问 2026-11-26）。

### 4.3 GLM

- GLM-5.4 官方页只给定性结论：在「200 个真实编程场景的内部实战评测」中「整体编程体验在参评国产模型中位居前列」，视觉 Coding、视觉复刻、长程任务突出；**没有给分数表**，也没有第三方对照。GLM-5.4 的 API 尚未开放（只走 Coding Plan）。
- 可比的硬数字只有上面两张他方表格里的 GLM-5.3（Terminal-Bench 37.9 / 41.8，两表不一致，harness 不同）。
- 来源：`https://docs.bigmodel.cn/cn/guide/models/glm-5.4`（访问 2026-11-26）。

### 4.4 口径提醒（写进图里免得被误用）

- 三家的 Terminal-Bench 数字**不可横比**：DeepSeek 明说用 Claude Code 框架，Kimi 的图注明「所有模型都开到最大 thinking effort」，GLM 没说自己怎么跑。
- 「Kimi Code Bench」「200 个真实场景」都是厂商内部基准，不是公开可复现的第三方评测。
- **中文 / 长任务的独立实测：未查到**（本轮检索渠道受限）。

---

## 5. 未查到清单（明确留白，别当结论用）

1. GLM Coding Plan 的**月费金额**（Lite / Pro / Max）——官方价格页是 JS 渲染，直连只拿到空壳。
2. CodeBuddy 的**价格数字**——同上原因；只有「免费 / 专业 / 企业」三档的文字描述。
3. Codex CLI **当前版本**的 `model_providers` 配置键——`developers.openai.com` 在本机 403，只能引仓库 tag `rust-v0.44.0` 的 `docs/config.md`。
4. 豆包是否有任何「驱动开发机」形态——官方站点只描述聊天能力。
5. Aider 是否有官方远程/常驻服务形态——只有本地 `--browser`。
6. 第三方独立评测（LMArena、SWE-bench 官方榜、各家媒体实测）——检索渠道不可用，本轮不引。
7. 各家 Anthropic 兼容端点的**逐字段兼容表**，除 DeepSeek 外都没查到同等细度的官方文档。

---

## 对下游决策最关键的事实

1. DeepSeek、智谱、Kimi **三家都有官方 Anthropic 兼容端点**，Claude Code 只需改 `ANTHROPIC_BASE_URL` + 凭据 + 模型名；三家官方文档都直接教这套配法。
2. 计费形态分两类：DeepSeek、Kimi 按量（Kimi 明说不做订阅），GLM 的编码场景是 **Coding Plan 订阅**且**禁止账号共享**、限指定工具。
3. 国产 agent 里，**CodeBuddy 和 Qoder CN 都把「手机接管电脑上的会话」做成了官方内建**；Trae 靠移动端连桌面端 + 网页端只跑云端；豆包没有这类形态。
4. 想自建移动控制台，官方入口是 **ACP + REST/SSE**：CodeBuddy（`/api/v1/*`、ACP、Python/TS SDK）、Qoder CN（ACP、Agent SDK、Cloud Agents API）；Trae 的 ACP 只在**企业旗舰版**的 CLI 2.0 里。
5. 「跑在云服务器上」两条现成路：CodeBuddy `daemon start --host 0.0.0.0`（非本地强制密码），或 OpenHands Agent Canvas `--public`（官方警告需反代 + 密钥 + 网络 ACL）。
6. 开源侧，**OpenHands 与 Cline 都有官方远程形态**且能接国产模型（OpenAI 兼容端点/LiteLLM）；Aider 无官方远程；Roo Code **已关停**；Codex CLI、Gemini CLI 都要境外账号，且 Gemini CLI 现已只面向企业 Code Assist。
7. 兼容性不是无损的：DeepSeek 明确忽略 `cache_control`、`mcp_servers`、`budget_tokens`，`max_tokens` 在 thinking 下也不是硬上限——换底座会改变缓存成本与上下文行为。
8. 基准数字**不可横比**：DeepSeek 的 Terminal-Bench 用 Claude Code harness，Kimi 的图是各模型最大 thinking effort，GLM 未披露方法；「Kimi Code Bench」「200 场景评测」都是厂商内部基准。
9. 两个关键价格缺口未查到：GLM Coding Plan 月费、CodeBuddy 各档价格（均为前端渲染页）。
10. 所有条目都来自官方文档/官方仓库，本轮没有采集任何社区 workaround、破解或共享账号做法；三家端点均需实名注册，不涉及境外账号。
