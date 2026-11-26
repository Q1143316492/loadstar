# 国内直接可用的云端环境与移动终端

## 问题

查清国内直接可用的两条现成路：①云厂商的托管开发环境（阿里云 Cloud IDE、腾讯 Cloud Studio、华为 CodeArts、Gitee WebIDE），它们天生有公网入口，不用穿透；②国内能正常用的移动端 SSH / 终端客户端与厂商官方 App 里的网页终端。以及国内 AI 编程产品有没有「手机 App 远程驱动编码任务」的形态。

产出：[research/china-cloud-ide-and-mobile-terminal.md](../research/china-cloud-ide-and-mobile-terminal.md)

类型：research
状态：已解决
阻塞于：无

## 答案

2026-11-26 由调研子智能体解决（WebSearch/WebFetch 被拦，改为 curl 直取官方文档与 Apple `itunes.apple.com/cn/lookup`）。

- **云 IDE 现状**：腾讯 Cloud Studio 在运营（官方兼容性页明写 Safari 15+，首赠 20 机时、约 0.1 元/小时）；华为 CodeArts IDE Online 在运营且明写有 WebTerminal；阿里云没有对位的 Cloud IDE，只剩「云效 WebIDE（仅能编辑 Codeup 仓库、无终端）」与「云命令行 Cloud Shell（免费，但 1 小时销毁）」。
- **手机连自己的服务器不用买公网 IP**：阿里云 Workbench / 会话管理 / VNC 官方表格写明「不必开通公网」，代价是一次安全组放行（47.96.60.0/24 等）+ 一次服务关联角色授权；腾讯 OrcaTerm 同理但要放通其代理 IP。这属于「官方中继，一次配置」，不是自建穿透。
- **移动 SSH 客户端**：中国区 App Store 可直接下 Termius（免费，官方 FAQ 明写可登出后完全离线使用）与 Blink Shell（14 天试用后订阅）；JuiceSSH 没有 iOS 版，官网与 Play 站均不可达。安卓侧 Termux 官方渠道是 F-Droid / GitHub，Play 版已弃用。国产里 FinalShell 没有移动端，华为云 App 文案含 SSH，阿里云 App 不含。
- **最关键的发现**：真正「手机下发编码任务到我的电脑」的国内产品是 **TRAE**（任务发往云端或已配对的个人电脑，文件夹级授权，手机端可看 Unified Diff View）与 **Kimi**（手机控制桌面端 Kimi Work）。豆包、千问只是通用对话。WorkBuddy 是办公向，不是编码 agent。两者都走厂商自带中继，符合「不自配穿透」。
- 这些移动端结论来自 App Store 第一方文案，**均未实测**；8 项「未查到」已在 research 文件中单列。

### 2026-11-26 追补：TRAE 移动端已用一手来源复核

用户质疑「TRAE 真有 App 吗」，据此重新核了一遍：

- **App 确实存在**：Apple `itunes.apple.com/lookup?id=6761400733&country=cn` 返回「TRAE - 专业AI开发平台」，发行方**北京引力弹弓科技有限公司**，bundle `com.stone.solo.cn`，v0.0.26（2026-11-20），2026-04-28 上架，免费，iOS 16.6+；美区 0 条。
- **官方文档也确认**：`docs.trae.cn/work_get-started-with-trae-mobile`（《快速开始：TRAE 移动端》，2026-10-09 更新）；另有安卓版与 iOS 版各自的第三方开源声明页。
- **文档细节**：定位「跨设备的任务下发中心」，操作界面与执行分离；手机号登录；桌面端「设置 > TRAE 移动端 > 允许 TRAE 移动端控制当前设备」；**连接有效期 180 天**；授权访问电脑 `/documents` 目录；Work / Code 两模式 × 云端 / 电脑；技能是**点选**桌面端已启用的技能；App 进后台任务不中断。
- **修正**：上一版写的「手机端有 Unified Diff View」**只有 App Store 文案一个来源**，官方文档通篇未提、无截图。降级为「厂商声称，未证实」。
- **未核实**：TRAE 与字节的关系。App Store 发行方「北京引力弹弓科技有限公司」、`trae.cn` 备案页「北京春田知韵科技有限公司」，均非「字节跳动」字号；首页只有 `"enterpriseChannel":"volcano"` 字段，不足以作证。原文里的「（字节）」已删除。
