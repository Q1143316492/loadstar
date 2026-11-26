调研日期：2026-11-26

# DeepSeek Harness（dsh）能不能当「手机驱动电脑」的底座

> 起因：用户问「DSH 可以吗」。
> 来源：本机检出 `d:\Unity\Src\DSH\deepseek-harness` @ `0a53fb55be`（origin `git@github.com:deepseek-ai/deepseek-harness.git`，版本 `dsh 0.1.2-alpha.2`，MIT）。所有结论逐条引自该检出内的 README 与源码，路径已标。
> 未实测运行；未改动该仓库。
> 上游公开文档站：<https://deepseek-harness.github.io/deepseek-harness/>

---

## 1. 它是什么

DeepSeek AI 开源的 agent harness，「everything-is-a-plugin」，基于 Cordis。自述处于 **developer preview**，「THERE WILL BE COMPATIBILITY-BREAKING CHANGES」（`README.md`）。

`npx @deepseek-ai/dsh web` 起 Web UI，默认 `http://127.0.0.1:3080`，本机启动会自动开浏览器；`--no-open` 屏蔽（`README.md`）。

CLI profile 有 `web` / `headless` / `sdk` / `sdk-minimal` / `acp`，首次使用时从模板自动初始化（`apps/cli/README.md`）。

## 2. 对「移动端干活」直接相关的三件事

### 2.1 斜杠技能名：`/` 出候选菜单，点选即可

- `packages/client/ui-skill/README.md`：输入框里打 `/name` 时「the suggestion menu offers user-invocable skills from the `skills/list` Remote, and a pick lands the literal `/name ` text」；host 侧在 pre-step 边界识别 `/name` 并注入 `<skill_content>`。**菜单点选与手打 token 走同一条加载路径。**
- `packages/client/ui-input-trigger/README.md`：检测光标下的 `/` 与 `@`，弹「grouped candidate menu」，把选择路由到注册过的来源（命令源、文件/会话引用源、任意业务包）。

这条正面命中用户「斜杠命令 / skill 名打不出来」的痛点：不需要背名字，也不需要系统级文本替换。

### 2.2 改动怎么显示：DiffBlock

- `packages/client/ui-primitives/README.md`：共享 UI 原子里有 `DiffBlock`、`ReadBlock`、`TerminalBlock`、`SearchBlock`、`WebBlock`，分别渲染匹配的工具结果意图，带复制控件、溢出处理。
- `packages/client/ui-tool/README.md`：会话里的工具详情行按 terminal / read / **diff** / search / web 五类卡片渲染，有独立的设计记录（`.agents/notes/implemented/feature/2026-07-30-web-diff-card.md`）。

准确口径：这是**工具结果里的 diff 卡片**（看改了什么），不是「逐 hunk 接受/拒绝」的审阅流。会话里还有 `ui-approval`（审批）、`ui-user-questions`（agent 提问）、`ui-plan`、`ui-subagent`、`ui-jobs`、`ui-trajectory`、`ui-schedule`、`ui-workflow-run`、`ui-deliverables`。

### 2.3 其它入口

- `packages/acp/README.md`：ACP（Agent Client Protocol）服务器，程序可建/列/恢复/关闭会话、发文本与图片 prompt、收语义更新、回答权限提示、取消。
- `packages/sdk/README.md`：JSON-RPC 线协议 + TS 客户端 + server 插件；Python SDK（`python/`）说同一协议。
- `packages/webhook/README.md`：带签名校验的外部事件 → 程序化规则 → 在 Web Workspace 里建一个普通 Session。
- `docs/user/guide/github-review.md`：GitHub PR 从 draft 转 ready 时，自动开一个**只读 review Session**。
- `packages/schedule/README.md`：会话内定时提醒，**明确没有邮件、短信或推送通知**。

## 3. 关键限制：远程访问（**本机检出已过时，见 3.2**）

这几条必须原样知道，否则会误以为「起个 web 就能手机打开」：

1. **`--host 0.0.0.0` 直接拒绝启动**。`packages/bundle/web-app/src/startup.ts` 原文：
   > `--host 0.0.0.0 is intentionally not supported yet for safety: it would expose remote code execution to the network; use 127.0.0.1 instead`

   `packages/bundle/web-app/README.md` 的 Known Limitations 也写了同一条。
2. **Web 服务器自身没有 TLS、认证与来源策略**。`packages/host/webserver/README.md`：`host` 只接受 `127.0.0.1`（默认，仅回环）与 `0.0.0.0`（「deliberate network exposure — the server carries no TLS, authentication, or origin policy of its own」）。
3. **远程场景官方只认两种**：
   - SSH：继承到 `SSH_CONNECTION` / `SSH_TTY` 时跳过浏览器交接，「the SSH client or editor must expose and open the local forwarded address」（`apps/cli/reference/README.md`、`packages/bundle/web-app/README.md`）。
   - TLS 反向代理或 tunnel：`docs/user/guide/github-review.md` 的前置条件原文「A TLS reverse proxy or tunnel that can forward one public URL to the loopback listener」。
4. `--trusted-host` 只能往 `/api` 的浏览器信任围栏里加具名 authority，不等于鉴权（`apps/cli/reference/README.md`）。

### 3.2 上游 0.2.x 已经放开了公网部署（本机检出停在 0.1.2-alpha.2）

本机检出是 `0.1.2-alpha.2`；npm 上 `@deepseek-ai/dsh` 已到 `0.2.2-rc.5`。取该版本的 `@deepseek-ai/dsh-web-app` 0.2.2-rc.5 核对，**上面第 1、2 条已经不成立**：

- `--host` 现在接受任意本地接口地址，help 示例写着 `--host 10.0.0.7  bind one local interface address`；`0.0.0.0` 的拒绝文案已消失。
- 新增 **`--public-url`**（`dsh --profile web --public-url https://app.example/ui/ --trusted-host app.example`）与 **原生 TLS**：`--tls-cert ./server-chain.pem --tls-key ./server-key.pem`，help 明写「serve HTTPS with an existing certificate and key」。
- 包内新增官方指南 `docs/user/guide/public-deployments.md`，《Publish the Web UI behind a reverse proxy》：讲清反代要保留 `Host`、剥掉挂载前缀、转发 `Upgrade`、改写 cookie 的 `Path`/`Secure`、`/ui` 要 302 到 `/ui/`；并声明「Native TLS needs no proxy」。
- 鉴权仍是**单进程凭据**：打印 URL 里带 launch token，换成签名的 session cookie；`--trusted-host` 只是信任围栏（「The fence only admits the request; the launch token... authenticate it」）。**没有多用户、没有账号体系。**

### 3.3 前端体积实测（0.0.1-rc.5 的 `dsh-web-frontend`）

解包后按扩展名统计，再用 `gzip -9` 量的是压缩后大小：

| 资源 | 原始 | gzip |
|---|---|---|
| `vendor-*.js`（React 等） | 727 KB | **175 KB** |
| `index-*.js`（应用主体） | 432 KB | **146 KB** |
| 全部 CSS | 95 KB | ~15 KB |
| 全部 JS+CSS+HTML | 3461 KB | **611 KB** |
| 字体 woff2 | 250 KB | 已是压缩格式 |

- **首屏约 330 KB（gzip）**：entry + vendor preload + 两个 CSS。其余按需分块。
- 语法高亮按语言切块懒加载：`cpp` 44 KB、`ruby` 39 KB、`html` 27 KB、`mdx` 22 KB……（均为 gzip 后）。
- `index.html` 带 `viewport` meta 与 `manifest.webmanifest`（`display: fullscreen`、`start_url: /`），**是可安装的 PWA**。
- 传输层：`packages/client/connection` 的注释写明「page uses the Gateway WebSocket」——**会话流走 WebSocket**，不是长轮询。
- 未实测：在 iOS Safari / 安卓 Chrome 上的实际渲染、软键盘、滚动与复制。

### 3.1 没有任何官方网络服务 / 中继 / 托管账号

逐项查过，结论是「没有」：

- 全仓搜 `tunnel` / `relay` / `ngrok` / `cloudflare` 只有两类命中：内部 `postMessage` 的 **worker tunnel**（页面与 Web Worker 之间的通信，`packages/experimental/webworker-runtime`），与第三方沙箱 `packages/e2b`。**没有任何公网中继服务。**
- `packages/e2b` 是「把文件与命令执行搬进远程 Linux 沙箱」的实验 POC（README 明写 experimental、默认没有任何 composition 启用它），它移动的是**执行世界**，不是「让你从外面连进来」。而且用的是第三方 E2B。
- **没有账号体系**。`packages/identity` 只有一个匿名 UUID（`$DSH_HOME/.anonymous-user-id`），供遥测与反馈关联，「no account」。
- `packages/credentials` 管的是 API key 这类密钥的存取与轮换，`authorization/` 只是「需要人参与才能拿到凭据」的流程注册表（OAuth 之类），不是登录 DSH 的账号。
- 官方给远程的唯一建议仍是「TLS 反向代理或 tunnel」（`docs/user/guide/github-review.md`），主语是**你自己搭**。

对比参照：Claude Code 的 Remote Control、WorkBuddy 的「多端协同」、CodeBuddy 的 `/gateway` 都是**厂商提供中继**，用户侧零配置。**DSH 没有这一层**——它把「怎么让外部够到 loopback」整个留给了部署者。

## 4. 「手机打开」的三种走法（事实层面）

| 走法 | 服务端要做什么 | 手机端要做什么 | 代价 |
|---|---|---|---|
| SSH 本地端口转发 | 无（保持 loopback） | SSH 客户端里配一条转发，把远端 3080 映射到本机，再用浏览器开 `127.0.0.1:3080` | 手机端一次性设置；不暴露公网；需要 SSH 客户端支持端口转发（Termius 支持，见 `china-cloud-ide-and-mobile-terminal.md`） |
| TLS 反向代理 | 域名 + 证书 + 反代 + 自建鉴权 | 浏览器 | 正是用户不想做的「配置」，且必须自己补认证，否则等于把 RCE 暴露在公网 |
| 自建前端 | 用 ACP profile 或 TS/Python SDK 驱动 dsh | 任意 | 开发工作量；但接口是官方的，不需要逆向 |

## 5. 未查到 / 未验证

- **没有任何移动端或窄屏适配的文档**。代码里只有零散的 `@media (max-width: 480px / 560px / 680px / 720px / 760px)` 断点（`TurnUsagePanel`、`OnboardingModal`、`PluginInventorySettingsTab`、`TrajectoryTable`、`PlanReviewPanel`、`QuestionComposer`、`WorkflowRunPanel`），**没有全局的移动布局声明**，也没找到手机/平板截图或使用说明。实际在 iPad/安卓上开是什么样，**未实测**。
- 未查到官方的多个用户 / 多设备 / 会话共享说明；Web UI 默认是单人本机使用。
- 未验证 `dsh web` 前端在 iOS Safari 的键盘、滚动、复制行为。

## 6. 对下游决策最关键的事实

1. **DSH 是国产、开源、MIT 的官方 agent harness，且用户本机已有检出**，不是又一个要引入的第三方。
2. 它的 Web UI 正面解掉「记不住 skill 名」：打 `/` 就出可点选的技能菜单，点选与手打走同一条注入路径。
3. 它能看 diff（`DiffBlock` 工具卡片），但不是逐块接受/拒绝的审阅流。
4. **本机检出（0.1.2-alpha.2）里它故意不让你远程访问**：`--host 0.0.0.0` 启动即报错，服务器不带 TLS/认证。
4b. **但上游 0.2.x 已经放开**：`--host <任意接口>`、`--public-url`、原生 `--tls-cert/--tls-key`，并附官方《Publish the Web UI behind a reverse proxy》指南。本机检出需要升级才能用这些。
5. **它没有官方中继 / 托管账号**：全仓没有公网 tunnel、没有 relay 服务、没有登录体系（只有一个匿名 UUID）。跟 Claude Remote Control、WorkBuddy 多端协同、CodeBuddy `/gateway` 那种「厂商出中继、用户零配置」形成明确对比——DSH 把「怎么让外部够到端口」留给部署者，但自 0.2 起把这件事写成了官方文档。
5b. **前端首屏约 330 KB gzip，传输走 WebSocket**，带 PWA manifest 可安装到主屏；语法高亮按语言懒加载。
6. 因此 DSH 的定位是「**电脑 / 服务器上的那个 agent 与网页前端**」，不是「手机入口」。要接到手机上，是 SSH 转发、反代 + TLS、自建前端三者里选一个。
7. 会话内的 schedule 不推送通知；要做「任务完成通知到手机」得自己接 webhook 或轮询。
