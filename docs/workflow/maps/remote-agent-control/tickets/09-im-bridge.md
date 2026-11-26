# 怎么借厂商的移动渠道驱动自己的 Agent

## 问题

用户发现豆包 / Qoder / WorkBuddy 都有「移动端控制电脑」的功能，但不信任它们的 Agent。问：能否借这个功能，用手机发命令来控制自己电脑上的 Claude Code 或 DSH？

产出：[research/im-bridge-to-own-agent.md](../research/im-bridge-to-own-agent.md)

类型：research
状态：已解决
阻塞于：无

## 答案

2026-11-26 核实（官方 SDK 源码 + GitHub 检索，未实测）。

**核心区分：渠道和执行者可以拆开。** 厂商 App 把「手机 → 厂商中继 → 桌面客户端 → 厂商的 Agent」焊死，你要的是保留传输、换掉执行者。判据是这条传输是否为**你的机器主动外连**。

1. **飞书官方长连接可用**：`larksuite/oapi-sdk-python` 有独立 `lark_oapi/ws` 包，`client.py` 依赖 `websockets` + 心跳帧，是标准客户端主动 WebSocket。**不需要公网 IP、不需要穿透、不需要服务器。**
2. **钉钉 Stream 同理**：官方 `open-dingtalk/dingtalk-stream-sdk-python`，主动外连。反例是企业微信 Webhook，需要公网 URL。
3. **现成实现 cc-connect**（MIT，约 16.5k star）：官方支持 Claude Code / Qoder CLI / Kimi CLI 等，**并可通过 ACP 接入任意 agent**；飞书 WebSocket 与钉钉 Stream 均「无需公网 IP」；支持斜杠命令、流式回复、图片文件、语音 STT。要求目标 Agent CLI 先装好并完成登录。
4. **DSH 在协议层对得上**：它有 `acp` profile（JSON-RPC over stdio，可建/恢复会话、发 prompt、回答权限提示），而 cc-connect 支持 ACP 接入——但这条组合**未实测**。
5. **不推荐「让厂商 agent 执行脚本」的 hack**：你本来就不信任它，权限审批、截断、幻觉都会介入；TRAE 还叠加 180 天授权与 `/documents` 限制。
6. **安全**：桥接进程等于一个能以你身份跑命令的聊天入口。必须白名单发送者、只开私聊、低权限运行、危险命令二次确认，并意识到消息内容会经过 IM 厂商服务器。

顺带修正两条此前记录：**豆包**在 App Store 文案里始终未查到「连接个人电脑」的能力（用户可能把它与 TRAE / WorkBuddy 混了）；**Qoder**（用户称「Q Code」）此前只记到「有移动端远程控制 + CLI 守护进程 + Cloud Agents」，未展开细节。

### 追补（同日）：不只飞书和钉钉

用户追问「只有飞书和钉钉可以吗」，据此补查 cc-connect 的完整平台表与各平台接入文档，结论成文于 [im-channel-options.md](../research/im-channel-options.md)。

**国内可用的主动外连通道至少 8 个**：飞书（WebSocket）、钉钉（Stream）、企业微信（WebSocket 模式）、微信个人号 ilink（HTTP 长轮询，网关 `ilinkai.weixin.qq.com`）、QQ 官方机器人（WebSocket）、QQ NapCat/OneBot（WebSocket，非官方）、WPS 协作（`wss://openapi.wps.cn/v7/event/ws`）、微博（WebSocket）。

三个要点：
- **飞书个人开发者无需企业认证即可创建应用**（`docs/feishu.md` 原文），且 `cc-connect feishu setup` 一条命令扫码新建、自动预配权限与事件订阅。
- **微信个人号（ilink）不用装新 App**，扫码即绑；但只能私聊、拉不进群，且该通道的官方定性未核实。
- **企业微信要选 WebSocket 模式**，Webhook 模式需要公网 URL；LINE 只有 Webhook，直接排除。Telegram / Slack / Discord 服务本身境内不可达。
