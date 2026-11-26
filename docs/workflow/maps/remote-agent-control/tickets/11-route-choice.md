# 最终走哪条路线

## 问题

调研全部完成，候选已收敛到四条可执行路线（见 [全景](../panorama.md) §3）：

- **甲**：WorkBuddy / TRAE —— 零配置、今天可用，代价是换掉自己的技能库与 agent
- **乙**：DSH 0.2 架到阿里云 —— `/` 技能菜单 + `DiffBlock` 都解决，代价是代码要有云端副本、自架 TLS
- **丙**：IM 长连接桥接（飞书 / 微信 ilink / 钉钉 + cc-connect）—— 保住自己的 agent、代码原地不动、零穿透，代价是没有 diff 面板、体验退回聊天
- **丁**：自托管移动网页界面（`claude-chat-mobile` 为主）—— 最接近终端里的 agent 体验，代价是要自己解决「手机怎么连」

还不止选一条：**甲和丁可以并存**（先用甲验证「外出时会不会真打开它」，再上丁），**乙和丙也可以并存**（DSH 网页 + IM 兜底）。

要定的是：**主选哪条、退路哪条、第一批先做哪个**。

类型：grilling
状态：已解决
阻塞于：无

## 答案

2026-11-26 用户决策：**四条都不选，自己开发定制。** 开发计划另行起草，本图到此收尾。

于是这张图的产物性质变了——它不是一份「照此装配」的方案，而是一份**自研的论据与素材**：

- 要做的界面长什么样、要复用哪些既有能力、哪些坑已经踩明，都在 [全景](../panorama.md) 与十一份 `research/` 里。
- 八类候选各自的真实门槛、连接方式、是否依赖境外服务、移动端表现，可以直接当需求清单的反面参照：**别人在哪里妥协，你就知道自研该在哪块用力**。

### 新计划应当继承的事实（本图已查明，不必重查）

**传输层**

- 国内可用、**不需要公网 IP 与穿透**的「机器主动外连」通道至少八个：飞书（官方 WebSocket SDK `lark_oapi/ws`）、钉钉（Stream）、企业微信（WebSocket 模式）、微信个人号 ilink（`ilinkai.weixin.qq.com` 长轮询）、QQ 官方机器人、WPS 协作（`wss://openapi.wps.cn/v7/event/ws`）、微博。
- 飞书开放平台**个人开发者即可建应用，无需企业认证**。
- 反例：LINE 只有 Webhook（要公网 URL）；企微 Webhook 模式同样要公网；Telegram / Slack / Discord 服务本身境内不可达。
- 官方的飞书长连接实现是现成的：`larksuite/oapi-sdk-python` 的 `lark_oapi/ws` 包，WebSocket + PING 心跳。
- 阿里云 Workbench / 会话管理官方明写「不必开通公网」，但需一次安全组放行 + 一次服务关联角色授权。

**Agent 侧**

- Claude Code 可无头驱动：`claude -p`，可 `--resume` 续会话；`claude-chat-mobile` 证明了走 `@anthropic-ai/claude-agent-sdk` 驱动本机 CLI 是可行的，且能继承 CLAUDE.md / MCP / skills / 权限规则。
- DSH 有官方程序化入口：`acp` profile（JSON-RPC over stdio，可建/列/恢复会话、发 prompt、收语义更新、回答权限提示）、TS/Python SDK、webhook 规则。
- 国产模型换底座是官方支持的路：DeepSeek（`api.deepseek.com/anthropic`）、GLM（`open.bigmodel.cn/api/anthropic`）、Kimi（`api.moonshot.cn/anthropic`）都提供 Anthropic 兼容端点；但兼容非无损（DeepSeek 忽略 `cache_control` / `mcp_servers` / `budget_tokens`）。

**界面侧（最值钱的部分）**

- 「记不住 skill 名」有三条已被验证的解法：输入 `/` 出**可点选的候选菜单**（DSH 的 `ui-skill`、CCM 的带说明与参数提示）、面板点选（WorkBuddy / TRAE）。点选与手打应走同一条加载路径。
- 触屏审 diff 的主流做法是**「文件 + 可折叠上下文 + 行内评论」**，逐块接受/拒绝只存在于 Working Copy 与 Orca 桌面端——**不要默认做逐 hunk stage**。
- VS Code 系 Web IDE 在 iPad 上的硬伤是**触屏选文本与软键盘**（microsoft/vscode #261958 仍 open）；code-server 官方自列键盘消失、无 Esc。
- 输入范式可参考：审批卡（允许 / 拒绝 / 中止本轮）、`AskUserQuestion` 点选、预设回复按钮、语音转写、snippets。
- 长行不折行 + 横向滑动 + 行号列固定（cmux）是窄屏 diff 的一个已验证取舍。

**带宽与体积**

- DSH 前端首屏约 **330 KB gzip**，PWA 可装，会话流走 WebSocket。几百 K 带宽够用，瓶颈在截图与大文件。

### 新计划必须先补上的一条空缺

**没有任何移动端界面的真机实测。** DSH Web UI、CCM 都只有文档与声明，iPad / 安卓上的实际渲染、软键盘遮挡、触屏选择文本，全部未验证。自研之前，值得先花十分钟拿现成方案在真机上跑一遍——那是判断「哪些妥协可以接受」的唯一依据，也是需求清单的起点。
