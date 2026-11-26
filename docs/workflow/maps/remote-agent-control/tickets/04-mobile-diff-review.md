# 移动端怎么局部看改动、怎么顺手输入

## 问题

查清触屏上「局部浏览代码改动」的现有界面做法：GitHub/GitLab 移动端 diff、code-server 在 iPad Safari 的表现、Cline / OpenHands / Vibe Kanban 的逐块接受-拒绝交互、窄屏下的 `git diff` 工具。以及这些界面怎么处理「下一条指令」——按钮化、快捷短语、语音的既有实践。要有可引用来源。

产出：[research/mobile-diff-review.md](../research/mobile-diff-review.md)

类型：research
状态：已解决
阻塞于：无

## 答案

2026-11-26 由调研子智能体解决。本环境搜索引擎与应用商店不可达，事实全部来自官方文档、官方 changelog、公开 issue 与仓库。

- **主流移动端审阅的单位是「文件 + 可折叠上下文 + 行内评论」，不是逐块接受/拒绝**。GitHub Mobile 2026-02 起可在未改动行评论、能展开折叠上下文，但官方从未提供 split / 逐块视图。GitLab 没有官方移动 App，390px 下 sticky 文件头会吞掉约半屏（2026-10 公开 bug）。
- **VS Code 系 Web IDE 在 iPad 上的硬伤是触屏选文本与软键盘**：microsoft/vscode #261958（2025-08，仍 open）——双击/长按选词失败，手指拖动只滚动，只有手写笔能选；code-server 官方 iPad 文档自列键盘消失、无 Esc、终端复制粘贴问题。
- **逐块/逐行接受拒绝只存在于两处**：Working Copy（长按+滑动按 hunk 暂存）与 Orca 的桌面 diff viewer（按 hunk 或按行 stage）。移动端普遍做的是「行内评论 → 整批发回 agent」。
- **三个 2026 年的移动优先 agent 客户端值得记**：Orca（beta，手机是「遥控器」不是编辑器，可折叠上下文、行内评论、stage/commit）、T3 Code（手机 approve 下一步、标记文件已读、一键 commit/PR）、cmux（SwiftUI 原生 diff viewer，长行不折行、横向滑动、行号固定）。
- **输入范式可引用**：Roo 的 suggested-response 按钮、Orca 的 continue/yes/free-text + 口述、Termius 的 snippets 与 AI widget 语音、T3 的语音输入、GitHub Mobile 远程控制 CLI（排队消息、approve/deny）。
- **窄屏终端手段**：`git diff -U<n>` 调上下文、delta 的 `--side-by-side=<最小宽度>` 自动回退与 `--wrap-max-lines`；但 `n`/`N` 跳转依赖实体键盘。
- 远程可达做法：Tailscale、SSH 隧道、公网隧道（ngrok/Cloudflare）。Vibe Kanban 官方云配对已于 2026-04-10 随公司关闭终止。
- 未取得一手资料：Conductor（站点 403）、JuiceSSH（域名不可达）、Gitee 移动审阅文档、GitHub Mobile split diff 官方说明。
