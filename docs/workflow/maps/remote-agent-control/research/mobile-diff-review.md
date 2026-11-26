# 触屏上「局部浏览代码改动」：2026 年 11 月现状

调研日期：2026-11-26

只收事实，不含选型。每条事实都标注来源性质：

- **【官方】**：产品方文档或官方 changelog。
- **【用户】**：用户在公开 issue / 讨论里的实测报告（非官方结论）。
- **【厂商博客】**：产品方员工写的体验文，属于营销内容，但含可核对的细节。
- **【未查到】**：本次调研未能取得一手来源。

方法与限制：本环境没有可用的通用搜索引擎，部分域名（Google、Reddit、Hacker News、Conductor、JuiceSSH、应用商店）不可达。下文来源均为直接抓取的官方文档、官方 changelog、GitHub / GitLab 公开 issue 与仓库。凡标「访问 2026-11-26」的是无发布日期的在线文档。

---

## 1. 现成的移动端代码审阅界面

### 1.1 GitHub Mobile（iOS / Android）

官方产品定位（【官方】，访问 2026-11-26，<https://docs.github.com/en/get-started/using-github/github-mobile>）：GitHub Mobile 可「Read, review, and collaborate on issues and pull requests」「Edit files in pull requests」。这是官方文档对移动端审阅能力的唯一概括表述，没有单列 diff 视图规格。

逐项能力（均来自官方 changelog）：

| 能力 | 官方写明的事实 | 来源 |
| --- | --- | --- |
| 逐行评论 | 可在「Files Changed 视图」中任意行留评论；此前只能评论改动行两侧 | 【官方】2026-02-03 <https://github.blog/changelog/2026-02-03-github-mobile-comment-on-unchanged-lines-in-pull-request-files> |
| 折叠上下文 / 展开 | 评论未改动行需要「expand the diff to reveal unchanged code」；2022 年起就支持「expanding collapsed lines of code in a changed file」 | 【官方】2026-02-03 同上；【官方】2022-05-17 <https://github.blog/changelog/2022-05-17-expand-code-lines-while-you-are-reviewing-a-pull-request-on-github-mobile> |
| 文件级折叠 | 1.2 版支持 mark files as viewed、collapsing files、deleted files | 【官方】2020-06-22 <https://github.blog/changelog/2020-06-22-github-for-mobile-1-2-is-now-available-with-improvements-to-files-changed-and-reviewing-code> |
| 多行选择 | 「Select multiple code lines to add a review comment with keyboards」 | 【官方】2024-11-26 <https://github.blog/changelog/2024-11-26-whats-new-in-mobile-november-update> |
| 审查与合并 | 2021 年更新称 reviewing and merging PR「much easier on the go」，可直接在视图内合并 | 【官方】2021-05-12 <https://github.blog/changelog/2021-05-12-working-with-pull-requests-on-github-mobile-is-now-much-easier> |
| iPad | 2020 年修过「iPad 上打字时键盘消失」的 bug，说明 iPad 是受支持场景 | 【官方】2020-06-22 同上 |
| 侧栏/分屏 diff | **未查到**官方文档提及 side-by-side / split diff；官方描述均为单一 diff 视图 | — |

易混淆点（重要）：2026-01-22「Improved pull request 'Files changed' page on by default」与 2026-02-05「Improved pull request Files changed – February 5 updates」讲的是 **github.com 网页版**，不是 App。后者的「Small screens improvements」明确写「ensuring diffs, comments, headers, and controls render and behave correctly on mobile and smaller viewports」，同篇还写「Improved performance and stability when reviewing pull requests in Safari」（【官方】<https://github.blog/changelog/2026-02-05-improved-pull-request-files-changed-february-5-updates>）。它能说明网页版在窄屏上做过专门修整，不能当作 App 能力。

### 1.2 GitLab

- **没有官方移动 App（截至 2026-11）**。2026-10-17 一份提交到 gitlab-org/gitlab 的社区提案（已关闭）开篇写：「GitLab has no mobile app. Anyone who wants to triage a todo, approve a merge request or restart a failed pipeline away from a laptop has to use the responsive web UI. That UI is not built for a phone, and it has no push notifications.」（【用户/社区提案】<https://gitlab.com/gitlab-org/gitlab/-/work_items/634386>）
- 但 GitLab 19.3 的服务端文档为 `com.gitlab-mobile.app` 提供 APNs 推送订阅（【官方】<https://docs.gitlab.com/omnibus/settings/mobile_push/>）。这与「没有 App」的社区说法矛盾；本次**未查到**对应的公开移动 App 文档，按矛盾记录。
- 移动网页版 MR diff 的真实表现（【用户】2026-10-19，已关闭）：在约 390px 宽视口打开 MR 的 Changes 标签，长文件路径在 sticky 文件头里被逐字符换行（`src/` `share` `d/ui/` `tech-`…），文件头「covers roughly half of the viewport, which makes reviewing code on a phone very uncomfortable」。（<https://gitlab.com/gitlab-org/gitlab/-/work_items/634621>）
- 网页版 diff 的行评论、suggestion 等能力在 GitLab 文档中有完整描述（【官方】，访问 2026-11-26，<https://docs.gitlab.com/user/project/merge_requests/reviews/>），但文档没有移动端专项章节。

### 1.3 Gitee

- 官方「APP 与插件下载」页列出的客户端只有：编辑器插件、浏览器插件 GitCodeTree、Jenkins 插件、Gitee 微信小程序（【官方】，访问 2026-11-26，<https://gitee.com/appclient>）。**未查到** iOS / Android 原生代码审阅 App。
- 以 iPhone UA 访问 gitee.com，返回 `<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">`，即移动网页是响应式的，但禁止用户缩放（访问 2026-11-26）。
- **未查到** Gitee 移动端 diff 审阅（逐行评论、上下文折叠）的官方文档或公开实测。

### 1.4 原生 iOS Git 客户端 Working Copy（触屏 diff 的成熟样本）

Working Copy 手册（【官方】，访问 2026-11-26，<https://workingcopy.app/manual/>）把「局部看改动」拆得很细：

- Changes 标签显示工作区与上次提交的差异；「The two-panel split-view ... requires the screen to be wide and for phones to be turned to landscape mode」——手机上必须横屏才有双栏。
- 「stage/unstage individual hunks by long-tapping and swiping」：长按 + 滑动按 hunk 暂存/取消。
- Diff 选项按钮可切 **Unified / Split**，可 Ignore Whitespace、Word Highlight、**Collapse All / Expand All files**。
- 「Pinch to change the text size, where very small text shows the overall shape of the changes」。
- 审阅时可长按文件名 **Approve / Flag**；已批准文件自动折叠，chips 可隐藏已批准或只看 flagged。
- 内置 Repository Agent（AI 助手），破坏性操作需确认，iPad 上 agent 面板可拖出成独立窗口与代码并排。

---

## 2. 可自托管的 Web 代码界面

### 2.1 VS Code for the Web / vscode.dev

- 官方文档：「Similar to GitHub Codespaces, VS Code for the Web can run on tablets, like iPads.」「You can use VS Code for the Web on mobile devices, but smaller screens may have certain limitations.」同时写明 webview 在 Safari 可能表现异常（【官方】，访问 2026-11-26，<https://code.visualstudio.com/docs/remote/vscode-web>）。
- 触屏选择文本的实际状况（【用户】）：
  - 2025-08-16，仍 open：「[iPadOS] Cannot select text in GitHub Codespaces editor (Safari/Chrome)」——双击选词无效、长按拖动不能稳定高亮；且点进编辑器不弹软键盘，必须先点终端再回来。报告者注明「Works fine on desktop browsers」。（<https://github.com/microsoft/vscode/issues/261958>）
  - 2024-08-19，已关闭：iPad 上无法可靠拖动选择手柄，双击后光标不对齐。（<https://github.com/microsoft/vscode/issues/225951>）
  - 2022-11-17，仍 open：CodeLens 控件在移动设备上不可点。（<https://github.com/microsoft/vscode/issues/166650>）
- 触摸选择的近期进展只覆盖手写笔：2026-06-11 的 PR「Support stylus/pen text selection on Android tablets」说明「A finger drag still scrolls」——手指拖动是滚动，笔才选择。（<https://github.com/microsoft/vscode/pull/320994>）

### 2.2 code-server

- 官方有专门的 iPad 文档：推荐把 code-server 装成 PWA（Add to Home Screen），这样才能拿到顶层键盘快捷键；文档列出已知问题（【官方】，访问 2026-11-26，<https://coder.com/docs/code-server/ipad>）：
  - 键盘偶尔消失；
  - Magic Keyboard 默认没有 Esc 键，多数用户要自改快捷键；
  - iPadOS < 14.5 触控板滚动不可用；
  - Safari / 分屏下键盘失焦（issue #4182）；
  - 终端里的复制粘贴与键盘快捷键配合不好（issue #3491）。
- 用户实测（【用户】，均为公开 issue）：
  - 2025-11-08，open：「Clipboard copy in code-server on iPad is unreliable with dragged/keyboard selections」，环境为 iPadOS 26.0.1、Safari/PWA/Brave/Chrome 均复现。（<https://github.com/coder/code-server/issues/7556>）
  - 2026-01-28，closed：iPadOS 上把 code-server 当全屏 PWA 用时，切到别的 App 再回来终端面板会缩水。（<https://github.com/coder/code-server/issues/7648>）
  - 2026-05-17，closed：Safari/iPad 上 webview 重的扩展渲染空白，WebKit 特有。（<https://github.com/coder/code-server/issues/7801>）
  - 2026-06-08，已合并的 PR：Android 平板手写笔可选择文本，「finger drag still scrolls」，与 VS Code 上游同一套 pointer 逻辑。（<https://github.com/coder/code-server/pull/7841>）

### 2.3 Coder

- 官方博客（【厂商博客】2021-02-01）记录工程师 Joe Previte 用 iPad + Coder 工作两周：必须外接键盘才高效；把编辑器装成 PWA 才能自定义快捷键、避开系统快捷键冲突；iOS 浏览器缺开发者工具；结论是「Mobile browsers (Firefox, Chrome, & Safari) are still lacking in comparison to their desktop counterparts」。（<https://coder.com/blog/i-developed-on-an-ipad-for-two-weeks>）
- 同站另有《A guide to writing code on an iPad》，同样建议 iPad 作为瘦客户端连云端 IDE，并链接到 code-server 的 iPad 文档。（访问 2026-11-26，<https://coder.com/blog/a-guide-to-writing-code-on-an-ipad>）

### 2.4 Gitpod / Ona

- Gitpod 已改名 Ona（docs 站点为 ona.com）。其 sitemap（访问 2026-11-26）中没有 iPad / 平板 / 移动端专项页面；**未查到**可引用的 iPad Safari 实测。

---

## 3. Agent 专用 diff 前端

### 3.1 Cline / Cline Kanban

- Cline Kanban 官方文档明确面向手机远程访问：默认只绑 `127.0.0.1:3484`，可改绑 `0.0.0.0` 供同一 WiFi 的手机/平板访问；推荐 Tailscale；也支持 SSH 隧道、Cloudflare Tunnel（【官方】，访问 2026-11-26，<https://docs.cline.bot/kanban/remote-access>）。
- 审阅交互（【官方】，访问 2026-11-26，<https://docs.cline.bot/kanban/core-workflow>）：
  - 点卡片打开详情：agent TUI + 该 worktree 相对 base 分支的完整 diff；
  - diff viewer 带 checkpoint，可按消息区间看局部 diff，而不是只能看累计 diff；
  - 「Click on any line in the diff to leave a comment. Comments are sent back to the agent as feedback」；
  - 结束时的动作是 **Commit** 或 **Open PR**，**未查到**按 hunk「接受/拒绝」的交互。
- VS Code 内的 Cline 本体用 checkpoint 代替逐块确认：每个工具调用后生成快照，提供 **Compare**（打开编辑器 diff）与 **Restore**（恢复文件 / 只回退任务 / 两者都回退）（【官方】，访问 2026-11-26，<https://docs.cline.bot/core-workflows/checkpoints>）。

### 3.2 Roo Code

- `apply_diff` 工具的行为链是：显示 diff 视图 → 允许用户审阅并直接编辑 → 「Waits for user approval or rejection」→ 批准后才写入文件（【官方】，访问 2026-11-26，<https://roocodeinc.github.io/Roo-Code/advanced-usage/available-tools/apply-diff>）。这是明确的「先看后批」，但粒度是单次 diff 请求，不是逐 hunk 的接受/拒绝列表。
- 另有 auto-approving actions 可按类别放开（读文件、写文件、执行命令等）（【官方】，访问 2026-11-26，<https://roocodeinc.github.io/Roo-Code/features/auto-approving-actions>）。
- Roo 是 VS Code 扩展；其 docs sitemap 中没有 cloud / web / remote 页面，**未查到**官方远程访问方案。

### 3.3 Vibe Kanban

- 官方「Reviewing Code」文档：changes 面板中间是 diff viewer、右侧文件树；diff 有颜色区分与 **Unified / Split 切换**；行内评论不是逐条发送，而是收集后随下一条 chat 消息整批发给 agent（【官方】，访问 2026-11-26，<https://vibekanban.com/docs/reviewing-code>）。
- 远程访问：设置里生成 pairing code，在手机浏览器打开 `cloud.vibekanban.com` 登录并配对 host（【官方】，访问 2026-11-26，<https://vibekanban.com/docs/remote-access>）。
- 重大状态变化：2026-04-10 官方公告「Vibe Kanban is sunsetting」——公司 bloop 关闭，项目转为开源社区维护；远程服务只保留 30 天，之后「transition to a fully local architecture」，云端 kanban issues / comments / projects / organisations 移除，本地 workspace 继续可用（【官方】<https://www.vibekanban.com/blog/shutdown>）。也就是说它的「手机通过官方云配对」路径在 2026 年 5 月后不再成立，只剩自托管/反代。

### 3.4 OpenHands（Agent Canvas）

- 官方有「Phone & Tablet Access」文档（最后更新 2026-11-17）：用 Tailscale 或 ngrok 把本机 Agent Canvas 暴露给手机/平板；Canvas 带 web app manifest，可「install it to your home screen and open it as a standalone app」；手机上会话头与导航常驻，返回控件不用滚回顶部（【官方】<https://docs.openhands.dev/openhands/usage/agent-canvas/mobile-access>）。
- 改动查看：Conversation overview 的 **Commits drawer** 把提交历史与未提交改动合并在一处，「no longer need to switch between separate Diff and Commits surfaces」；git 操作（commit / pull / push / PR）通过给 agent 发提示完成（【官方】，访问 2026-11-26，<https://docs.openhands.dev/openhands/usage/agent-canvas/conversations>）。
- **未查到** OpenHands Web UI 提供逐 hunk 接受/拒绝；其模型是「agent 执行 git 动作」。

### 3.5 Conductor

- 站点 `https://conductor.build/` 对本次抓取持续返回 **403**（含浏览器 UA、HTTP/1.1、http://），文档子域不可达；**未查到**任何一手资料，无法确认其 diff 审阅与远程访问能力。

### 3.6 2026 年出现的「移动优先」agent 客户端（补充样本）

这三者不在原题目清单里，但恰好是「在手机上局部看 agent 改动」的直接先例，故单列。

**Orca**（桌面 + iOS/Android，开源）

- 移动端定位：「The mobile app is intentionally not a full editor — it's a remote control for the desktop you already have running.」；手机与桌面配对后，可看所有 host 的 worktree 状态、终端回滚、文件树（【官方】，访问 2026-11-26，<https://orca.dev/docs/mobile>）。该页同时写明「The mobile companion is in beta」。
- 手机上的 diff 交互（同页）：Source Control 里「jump between files, **fold context**, and read or add pull-request review comments alongside the code」，可 stage/unstage、commit、解决冲突、完成 merge。
- 桌面端的 diff viewer 规格（【官方】，访问 2026-11-26，<https://orca.dev/docs/review/diff-viewer>）：按 hunk 或按行暂存（「same as git add -p but visual」）、可折叠未改动区域（默认关闭）、word wrap 只作用于 file diff、快捷键 `n`/`p` 跳 hunk、`s` 暂存当前 hunk、`c` 评论。
- 「Annotate AI Diff」：在任意 AI 生成的 hunk 任意行留评论，**整批**发回 agent；评论钉在行上并跟随 diff 位移（【官方】，访问 2026-11-26，<https://orca.dev/docs/review/annotate-ai-diff>）。

**T3 Code**（桌面 / Web / iOS / Android，开源）

- README：agent 跑在自己机器上，「Start a thread at your desk, then approve the next step from your phone」；远程可走局域网、Tailscale 或 T3 Connect；「Review the diff, then commit, push, and open a pull request with one button」（【官方】，访问 2026-11-26，<https://github.com/pingdotgg/t3code>）。
- 手机端 PR 审阅（【官方】仓库文档 `docs/user/source-control.md`，访问 2026-11-26）：打开 review 可读描述、活动、提交、改动文件；行评论在提交 review 前保持 draft；「On mobile, open a changed file and mark it viewed from its header. Viewed files collapse.」

**cmux**（macOS 终端 + iOS 客户端）

- 2026-07-15 的 PR #8154「iOS native diff viewer (ndv2): GitHub Files-changed design over mobile.workspace.diffs RPC」：用 SwiftUI 原生实现，按 GitHub 网页「Files changed」的信息设计，从配对的 Mac 经一帧一页的 RPC 取 diff，不用 WebView。（<https://github.com/manaflow-ai/cmux/pull/8154>）
- 同一仓库（stablyai/orca）的 PR #40961（2026-11-11）描述手机 diff 的取舍：「Long lines stay on one line, and you swipe sideways to read them while the line numbers stay put on the left」——长行不折行，横向滑动，行号列固定。（<https://github.com/stablyai/orca/pull/40961>）

---

## 4. 终端里看 diff 的做法

### 4.1 `git diff` 本身

- 上下文行数由 `-U<n>` / `--unified=<n>` 控制，默认 3 行（`diff.context` 可改）（【官方】，访问 2026-11-26，<https://git-scm.com/docs/git-diff>）。这意味着窄屏上「看清上下文」可以在命令层解决一部分，而不依赖 UI。
- 终端输出没有横向滚动概念，长行只能靠终端折行；是否折行由终端/分页器决定。

### 4.2 delta（窄屏专门选项）

- `--side-by-side[=<WHEN>]` 可设最小终端宽度，低于该宽度自动退回 unified diff；也支持 `hunk` 模式，只把同时有增删的 hunk 并排（【官方】，访问 2026-11-26，<https://dandavison.github.io/delta/side-by-side-view.html>）。
- 单列 hunk 不折长行；`--wrap-max-lines <N>` 控制折行次数，`0` 表示从不折行、超出即截断，`unlimited` 表示折到放得下为止（【官方】<https://dandavison.github.io/delta/full---help-output.html>）。
- 大 diff 导航靠 `--navigate` 模式下的 `n` / `N` 跳文件（【官方】<https://dandavison.github.io/delta/navigation-keybindings-for-large-diffs.html>）——这要求有实体键盘，触屏软键盘难以使用。

### 4.3 移动 SSH 客户端

**Termius（iOS / iPadOS）**

- 官方移动终端文档（【官方】，访问 2026-11-26，<https://docs.termius.com/terminal/mobile-terminal>）：
  - 触屏手势代替方向键：长按终端拖动移动光标，按住空格滑动发送方向键，双击发 Tab；
  - 双指捏合缩放调整字号；
  - 键盘上方常驻 keyboard add-on，放 Extended keyboard 的前三组热键；
  - 选择/复制走 iOS 标准手势（长按选词、拖手柄、点 Copy）；
  - AI widget 支持 Paste mode 与语音输入。
- iPad 产品页强调外接键盘、分屏多终端、「seamless experience just like on your computer」（【厂商博客/产品页】，访问 2026-11-26，<https://termius.com/free-ssh-client-for-ipad>）。
- Snippets：带标签的 shell 脚本库，云端同步，可从终端侧栏粘贴或直接运行（【官方】，访问 2026-11-26，<https://docs.termius.com/terminal/snippets>）。

**Blink Shell（iOS / iPadOS）**

- 定位「professional, desktop grade terminal for iOS」，Mosh + SSH，强调网络切换不断线、外接键盘、开源（【官方】，访问 2026-11-26，<https://blink.sh>）。未查到 diff 相关专门功能。

**JuiceSSH**

- 站点 `juicessh.com` 本次不可达（curl 连接失败），**未查到**一手资料。

### 4.4 原生客户端路线

Working Copy（见 1.4）把 hunk 级操作做成了触屏手势（长按 + 滑动暂存），是终端之外、又不需要 Web IDE 的一条现成路径。

---

## 5. 输入配合：下一条指令怎么发

### 5.1 按钮化

- **Roo Code Suggested Responses**：Roo 提问后，聊天界面下方出现可点击按钮，预置与问题相关的答案；第一个按钮默认选中，点击即发送；按住 Shift 点击可直接发送而不采用默认；也可悬停后点铅笔改成自由文本（【官方】，访问 2026-11-26，<https://roocodeinc.github.io/Roo-Code/features/suggested-responses>）。
- **Orca 手机端快捷回复**：「Send a short reply (continue, yes, free-text) when an agent is waiting on input」，可附图片/文件，或点麦克风口述；终端 accessory row 提供 Tab、Shift+Tab、Shift/Ctrl/Alt latch 这些手机键盘难按的键（【官方】，访问 2026-11-26，<https://orca.dev/docs/mobile>）。
- **GitHub Mobile 远程控制 Copilot CLI**：手机端可「Steer midsession, or queue the next message as soon as the current step finishes」「Approve or deny permission requests」「Respond to Copilot's questions」；会话从 CLI 用 `copilot --remote` 或 `/remote` 开启，扫二维码进入（【官方】2026-05-18 <https://github.blog/changelog/2026-05-18-remote-control-for-copilot-cli-sessions-now-generally-available-on-mobile-web-and-vs-code>）。
- **T3 Code**：手机端可 approve 下一步；PR 行评论以 draft 形式攒着，提交 review 时一起发（见 3.6）。

### 5.2 语音

- **T3 Code 语音输入**：口述进 composer，转写落在草稿里，只有发送才给 agent；「Dictation also works in citation comments, diff and file annotations, pull request comments, replies, and review summaries」；iPhone / Android 默认本机转写（【官方】仓库文档 `docs/user/voice-input.md`，访问 2026-11-26）。
- **Orca**：点麦克风口述回复；「Phone dictation can run on the device on Android and on iPhone with iOS 26 or later, with the computer as fallback」；有 floating dictation pill，切屏也能继续说（【官方】，访问 2026-11-26，<https://orca.dev/docs/mobile>）。
- **Termius**：AI widget 的 Paste mode 可语音听写，听写文本可先编辑再执行（【官方】，访问 2026-11-26，<https://docs.termius.com/terminal/mobile-terminal>）。
- **GitHub Copilot CLI**：桌面终端里按住空格说话，或 Ctrl+X 后按 V 录音；转写在本机完成（【官方】2026-06-02 <https://github.blog/changelog/2026-06-02-copilot-cli-improved-ui-rubber-duck-prompt-scheduling-and-voice-input>）。这是键盘操作，不是触屏方案，但说明语音输入已进入 agent 的命令入口。
- **Working Copy**：Repository Agent 可开启「voice output」把回答读出来（【官方】，访问 2026-11-26，<https://workingcopy.app/manual/>）。

### 5.3 快捷短语

- **Termius Snippets**：见 4.3，云端同步的「带标签 shell 脚本」，可在多台 host 上运行，也可做成启动片段（【官方】）。
- **Orca / T3 / Roo** 的「预置回复」在语义上就是针对 agent 提问的快捷短语（见 5.1）。

---

## 6. 未查到清单

- GitHub Mobile 的 side-by-side / split diff 官方说明。
- GitHub Mobile 「一次只看一个改动块」的官方交互（其模型是文件列表 + 折叠文件 + 展开上下文，不是逐块翻页）。
- GitLab 官方移动 App 的公开文档（社区提案说没有，服务端文档又出现 `com.gitlab-mobile.app` 的推送配置，二者矛盾）。
- Gitee 移动端代码审阅的官方文档或公开实测。
- Gitpod / Ona 的 iPad 专项说明或实测。
- Conductor 的任何一手资料（站点 403）。
- JuiceSSH 的一手资料（站点不可达）。

---

## 对下游决策最关键的事实

1. 2026 年 GitHub Mobile 已能「展开未改动代码并在任意行评论」，但官方从未提供 split/逐块视图；它的单位是文件 + 可折叠上下文。
2. github.com 网页版在 2026-02 专门修过窄屏/Safari 的 diff 渲染，成果不自动等于 App 能力，需分开评估。
3. GitLab 至今没有官方移动 App，手机审阅只能走响应式网页；390px 宽下 sticky 文件头会吞掉约半屏（2026-10 的公开 bug）。
4. Gitee 官方客户端列表里只有编辑器/浏览器/Jenkins 插件与微信小程序，没有移动审阅 App。
5. VS Code 系 Web IDE 在 iPad 上的核心短板是触屏选文本与软键盘：2025-08 的 issue 仍 open，手指拖动只滚动、只有手写笔能选。
6. code-server 官方 iPad 文档本身就把「键盘消失、无 Esc、终端复制粘贴」列为已知问题；PWA + 外接键盘是事实上的前提。
7. Cline Kanban、Vibe Kanban、Orca、T3 Code 都把「行内评论 → 发回 agent」作为手机审阅的主交互（Vibe、Orca 明确整批），而不是逐块接受/拒绝。
8. 逐块/逐行接受拒绝只出现在原生 Git 客户端（Working Copy 的 hunk 滑动暂存）和 Orca 桌面 diff viewer（按 hunk/行 stage）。
9. 远程可达性有三种成熟做法：Tailscale（Cline/OpenHands/Orca/T3）、SSH 隧道（Cline）、公网隧道（OpenHands 的 ngrok、Cloudflare）。
10. Vibe Kanban 的官方云配对已于 2026-04-10 随公司关闭而终止，之后只剩本地/自托管——选它等于选「自己解决远程」。
11. 终端路线在窄屏的可用手段是 `git diff -U<n>` 调上下文、delta 的 `--side-by-side=最小宽度` 自动回退与 `--wrap-max-lines`；但 `n`/`N` 跳转依赖实体键盘。
12. 触屏输入的现成范式是「按钮 + 语音 + 片段」：Roo 的 suggested-response 按钮、Orca 的 continue/yes/free-text 与口述、Termius 的 snippets，均可直接引用。
13. Conductor 与 JuiceSSH 本次无法取得一手资料，任何关于它们的结论都还没有证据。
