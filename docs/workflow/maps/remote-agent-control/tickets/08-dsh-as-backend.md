# DSH 能不能当这个底座

## 问题

DeepSeek Harness（`dsh`）能不能作为「手机驱动电脑上的 agent」的底座：它自带 Web UI（`dsh web`），有 `/` 技能菜单与 diff 卡片，是国产开源（MIT），用户本机已有检出。要查清它能否被手机够到、有哪些官方限制。

产出：[research/dsh-assessment.md](../research/dsh-assessment.md)

类型：research
状态：已解决
阻塞于：无

## 答案

2026-11-26 直接读本机检出 `d:\Unity\Src\DSH\deepseek-harness` @ `0a53fb55be`（v0.1.2-alpha.2）。

- **能力上很对口**：Web UI 打 `/` 出**可点选的技能候选菜单**（`packages/client/ui-skill`、`ui-input-trigger`），点选与手打 `/name` 走同一条 skill 注入路径；工具结果有专门的 `DiffBlock` 渲染改动；另有审批、提问、计划、子代理、任务、轨迹、定时提醒等前端插件。
- **本机检出（0.1.2-alpha.2）**里它拒绝远程：`dsh web --host 0.0.0.0` 启动即报错，Web 服务器不带 TLS/认证。远程只有两条官方认可的路——**SSH 端口转发**与 **TLS 反向代理 / tunnel**。
- **但上游 0.2.x 已经放开**（npm `0.2.2-rc.5` 核对）：`--host <任意本机接口>`、`--public-url`、原生 `--tls-cert/--tls-key`，并附官方指南《Publish the Web UI behind a reverse proxy》（保留 Host、剥前缀、转发 Upgrade、改写 cookie、`/ui` 302 到 `/ui/`）。**本机检出需升级才可用。**
- 另有官方程序化入口：ACP server profile、TS/Python SDK、webhook 规则、GitHub PR 只读 review overlay。定时提醒**不推送**通知。
- **没有官方中继服务、没有托管账号**（只有一个匿名 UUID），`packages/e2b` 是「把执行搬进远程沙箱」的实验 POC 而非接入通道。与 Claude Remote Control、WorkBuddy 多端协同、CodeBuddy `/gateway` 那种「厂商出中继、用户零配置」正相反。
- **前端体积实测**（`dsh-web-frontend` 0.0.1-rc.5）：首屏约 **330 KB gzip**（vendor 175 + index 146 + CSS ~15），语法高亮按语言懒加载；`index.html` 带 viewport 与 PWA manifest（`display: fullscreen`），可装到主屏；会话流走 **WebSocket**。
- **未查到任何移动端/窄屏适配文档**，代码里只有零散 max-width 断点，无全局移动布局；iPad / 安卓实机效果未实测。

结论：DSH 是「电脑或服务器上的那个 agent 与网页前端」。要接到手机上，仍是 SSH 转发 / 反代+TLS / 自建前端三选一；但自 0.2 起「架在公网」已是官方文档化的场景，不再是缺口。
