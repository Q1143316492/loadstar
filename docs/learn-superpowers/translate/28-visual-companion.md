## 28 visual-companion

> 译自 `reference/superpowers/skills/brainstorming/visual-companion.md`（原文 299 行）。全部 HTML 代码块、bash 命令、JSONL 事件示例与 CSS 类名按原样保留，仅翻译说明性正文与代码块前的一行说明。

> 对照 `READING-superpowers.md` 第 29 项。

**视觉同伴指南（Visual Companion Guide）**

基于浏览器的视觉头脑风暴同伴，用来展示原型图、示意图和选项。

### 28.1 何时使用（When to Use）

**逐个问题**判断，而不是逐个会话判断。判据是：**用户看见它，会比读它更明白吗？**

**当内容本身就是视觉的**，**用浏览器**：

- **UI 原型图**——线框图、布局、导航结构、组件设计
- **架构图**——系统组件、数据流、关系图
- **并排的视觉对比**——对比两种布局、两套配色、两个设计方向
- **设计打磨**——当问题关乎观感、间距、视觉层次时
- **空间关系**——状态机、流程图、以图呈现的实体关系

**当内容是文本或表格式的**，**用终端**：

- **需求与范围问题**——“X 是什么意思？”、“哪些功能在范围内？”
- **概念性的 A/B/C 选择**——在文字描述的方案之间挑选
- **取舍清单**——优点/缺点、对比表格
- **技术决策**——API 设计、数据建模、架构方案选择
- **澄清问题**——任何答案是文字、而非视觉偏好的问题

一个**关于** UI 话题的问题，不自动等于视觉问题。「你想要哪种向导？」是概念问题——用终端。「这些向导布局里哪一种感觉对？」是视觉问题——用浏览器。

### 28.2 工作原理（How It Works）

服务器监视一个目录里的 HTML 文件，并把最新的那个提供给浏览器。你把 HTML 内容写到 `screen_dir`，用户在浏览器里看到它，并且可以点击来选择选项。选择结果被记录到 `state_dir/events`，供你在下一轮读取。

**内容片段 vs 完整文档：** 如果你的 HTML 文件以 `<!DOCTYPE` 或 `<html` 开头，服务器就原样提供它（只注入辅助脚本）。否则，服务器会自动把你的内容包进框架模板——加上页头、CSS 主题、连接状态和所有交互基础设施。**默认写内容片段。** 只有当你需要对页面有完全控制时，才写完整文档。

### 28.3 启动会话（Starting a Session）

下面这段 bash 命令启动服务器：

```bash
# Start AFTER the user approves the companion. --open auto-opens their browser on
# the first screen; --project-dir persists mockups and enables same-port restart.
bash scripts/start-server.sh --project-dir /path/to/project --open

# Returns: {"type":"server-started","port":52341,
#           "url":"http://localhost:52341/?key=ab12…",
#           "screen_dir":"/path/to/project/.superpowers/brainstorm/12345-1706000000/content",
#           "state_dir":"/path/to/project/.superpowers/brainstorm/12345-1706000000/state"}
```

把响应里的 `screen_dir` 和 `state_dir` 存下来。用了 `--open` 之后，当你推入第一屏时浏览器会自己打开——你不需要请用户去打开它，但仍然要把 URL 分享出来作为兜底（无头/远程环境不会自动打开）。

**URL 里含有一个会话密钥（`?key=…`）。** 没有它服务器会拒绝任何请求，所以永远要把 `url` 字段里那个**完整** URL 给用户——绝不要剥掉查询字符串，也绝不要给出一个光秃秃的 `http://host:port`。这个密钥把守着 HTTP 和 WebSocket 访问，这样一个误开的浏览器标签页或网络上的另一台机器就无法读取这些屏幕内容或注入事件。首次加载之后，浏览器会通过 cookie 记住这个密钥，所以刷新和 `/files/*` 资源都能正常工作，不必重复携带。

**查找连接信息：** 服务器把它的启动 JSON 写到 `$STATE_DIR/server-info`。如果你是在后台启动服务器、没有捕获 stdout，就读这个文件来拿到 URL 和端口。使用 `--project-dir` 时，去 `<project>/.superpowers/brainstorm/` 里找会话目录。

**注意：** 把项目根目录作为 `--project-dir` 传进去，这样原型图会持久保存在 `.superpowers/brainstorm/` 里，并且能挺过服务器重启。不传的话，文件会落到 `/tmp` 并被清理掉。提醒用户把 `.superpowers/` 加进 `.gitignore`——如果还没加的话。

**按平台启动服务器：**

**Claude Code：**

```bash
# Default mode works — the script backgrounds the server itself.
bash scripts/start-server.sh --project-dir /path/to/project --open
```

在 Windows 上，脚本会自动检测并切换到前台模式（会阻塞工具调用）。在 Bash 工具调用上使用 `run_in_background: true`，让服务器能跨多轮对话存活，然后在下一轮读取 `$STATE_DIR/server-info` 拿到 URL 和端口。

**Codex：**

```bash
# Codex reaps background processes. The script auto-detects CODEX_CI and
# switches to foreground mode. Run it normally — no extra flags needed.
bash scripts/start-server.sh --project-dir /path/to/project --open
```

**Gemini CLI：**

```bash
# Use --foreground and set is_background: true on your shell tool call
# so the process survives across turns
bash scripts/start-server.sh --project-dir /path/to/project --open --foreground
```

**Copilot CLI：**

```bash
# Start it with Copilot CLI's non-blocking/background shell mechanism so the
# server survives across turns. Keep --foreground so the harness, not the
# script, owns backgrounding. The launcher is a .sh, so invoke it via bash
# (on Windows, call Git Bash's bash.exe from the PowerShell tool).
bash scripts/start-server.sh --project-dir /path/to/project --open --foreground
```

**其他环境：** 服务器必须在后台跨多轮对话持续运行。如果你的环境会回收分离的进程，就用 `--foreground`，并用你所在平台的后台执行机制来启动这条命令。

如果从你的浏览器访问不到这个 URL（在远程/容器化环境里很常见），就绑定一个非回环主机：

下面这段 bash 命令绑定了非回环主机：

```bash
bash scripts/start-server.sh \
  --project-dir /path/to/project \
  --host 0.0.0.0 \
  --url-host localhost
```

用 `--url-host` 控制返回的 URL JSON 里打印的是哪个主机名。

### 28.4 循环（The Loop）

1. **先确认服务器还活着**，然后**把 HTML 写到** `screen_dir` 里的一个新文件：
   - **必须做：在引用 URL 或推入屏幕之前，确认服务器还活着。** 检查 `$STATE_DIR/server-info` 存在、且 `$STATE_DIR/server-stopped` 不存在。如果它已经关闭，就用**同一个 `--project-dir`** 通过 `start-server.sh` 重启它——它会复用同一个端口，所以用户打开的标签页会自己重连（服务器下线期间它会显示一个「已暂停」的覆盖层），你不需要发送新 URL。服务器空闲 4 小时后会自动退出（可用 `--idle-timeout-minutes` 配置）。
   - 使用语义化文件名：`platform.html`、`visual-style.html`、`layout.html`
   - **绝不重用文件名**——每一屏都用一个新文件
   - 用你的文件创建工具——**绝不要用 cat/heredoc**（会把噪声倒进终端）
   - 服务器会自动提供最新的那个文件

2. **告诉用户该期待什么，然后结束你这轮：**
   - 提醒他们 URL（每一步都要，不只是第一步）
   - 用一小段文字概述屏幕上是什么（例如「正在展示主页的 3 个布局选项」）
   - 请他们在终端里回应：「看一眼，告诉我你怎么想。想选的话点一下来选中某个选项。」

3. **在你的下一轮**——在用户在终端里回应之后：
   - 如果 `$STATE_DIR/events` 存在就读它——它以 JSON 行的形式包含用户在浏览器里的交互（点击、选择）
   - 与用户的终端文本合并，得到完整图景
   - 终端里的消息是主要反馈；`state_dir/events` 提供结构化的交互数据

4. **迭代或前进**——如果反馈改变了当前屏幕，就写一个新文件（例如 `layout-v2.html`）。只有当前步骤得到确认，才推进到下一个问题。

5. **回到终端时卸载**——当下一步不需要浏览器时（例如一个澄清问题、一场取舍讨论），推入一个等待屏来清除过期内容：

   下面这段 HTML 就是那个等待屏：

   ```html
   <!-- filename: waiting.html (or waiting-2.html, etc.) -->
   <div style="display:flex;align-items:center;justify-content:center;min-height:60vh">
     <p class="subtitle">Continuing in terminal...</p>
   </div>
   ```

   这能避免用户在对话早已推进之后还盯着一个已了结的选择。当下一个视觉问题出现时，照常推入一个新的内容文件。

6. 重复，直到完成。

### 28.5 编写内容片段（Writing Content Fragments）

只写要放进页面里的内容。服务器会自动把它包进框架模板（页头、主题 CSS、连接状态和所有交互基础设施）。

**最小示例：**

下面这段 HTML 就是一个最小示例：

```html
<h2>Which layout works better?</h2>
<p class="subtitle">Consider readability and visual hierarchy</p>

<div class="options">
  <div class="option" data-choice="a" onclick="toggleSelect(this)">
    <div class="letter">A</div>
    <div class="content">
      <h3>Single Column</h3>
      <p>Clean, focused reading experience</p>
    </div>
  </div>
  <div class="option" data-choice="b" onclick="toggleSelect(this)">
    <div class="letter">B</div>
    <div class="content">
      <h3>Two Column</h3>
      <p>Sidebar navigation with main content</p>
    </div>
  </div>
</div>
```

就这样。不需要 `<html>`、不需要 CSS、不需要 `<script>` 标签。服务器提供了所有这些东西。

### 28.6 可用的 CSS 类（CSS Classes Available）

框架模板为你的内容提供这些 CSS 类：

#### 28.6.1 选项（Options (A/B/C choices)）

下面这段 HTML 就是选项的标记：

```html
<div class="options">
  <div class="option" data-choice="a" onclick="toggleSelect(this)">
    <div class="letter">A</div>
    <div class="content">
      <h3>Title</h3>
      <p>Description</p>
    </div>
  </div>
</div>
```

**多选：** 给容器加上 `data-multiselect`，就能让用户选中多个选项。每次点击都会切换该项的选中样式。

下面这段 HTML 就是多选的标记：

```html
<div class="options" data-multiselect>
  <!-- same option markup — users can select/deselect multiple -->
</div>
```

#### 28.6.2 卡片（Cards (visual designs)）

下面这段 HTML 就是卡片的标记：

```html
<div class="cards">
  <div class="card" data-choice="design1" onclick="toggleSelect(this)">
    <div class="card-image"><!-- mockup content --></div>
    <div class="card-body">
      <h3>Name</h3>
      <p>Description</p>
    </div>
  </div>
</div>
```

#### 28.6.3 原型图容器（Mockup container）

下面这段 HTML 就是原型图容器的标记：

```html
<div class="mockup">
  <div class="mockup-header">Preview: Dashboard Layout</div>
  <div class="mockup-body"><!-- your mockup HTML --></div>
</div>
```

#### 28.6.4 分栏视图（Split view (side-by-side)）

下面这段 HTML 就是分栏视图的标记：

```html
<div class="split">
  <div class="mockup"><!-- left --></div>
  <div class="mockup"><!-- right --></div>
</div>
```

#### 28.6.5 优点/缺点（Pros/Cons）

下面这段 HTML 就是优点/缺点的标记：

```html
<div class="pros-cons">
  <div class="pros"><h4>Pros</h4><ul><li>Benefit</li></ul></div>
  <div class="cons"><h4>Cons</h4><ul><li>Drawback</li></ul></div>
</div>
```

#### 28.6.6 模拟元素（Mock elements (wireframe building blocks)）

下面这段 HTML 就是模拟元素的标记：

```html
<div class="mock-nav">Logo | Home | About | Contact</div>
<div style="display: flex;">
  <div class="mock-sidebar">Navigation</div>
  <div class="mock-content">Main content area</div>
</div>
<button class="mock-button">Action Button</button>
<input class="mock-input" placeholder="Input field">
<div class="placeholder">Placeholder area</div>
```

#### 28.6.7 排版与区块（Typography and sections）

- `h2` — 页面标题
- `h3` — 小节标题
- `.subtitle` — 标题下方的次要文本
- `.section` — 带下边距的内容块
- `.label` — 小号大写字母的标签文本

### 28.7 浏览器事件格式（Browser Events Format）

当用户在浏览器里点击选项时，他们的交互会被记录到 `$STATE_DIR/events`（每行一个 JSON 对象）。当你推入新屏幕时，该文件会被自动清空。

下面这段 JSONL 就是事件记录的格式：

```jsonl
{"type":"click","choice":"a","text":"Option A - Simple Layout","timestamp":1706000101}
{"type":"click","choice":"c","text":"Option C - Complex Grid","timestamp":1706000108}
{"type":"click","choice":"b","text":"Option B - Hybrid","timestamp":1706000115}
```

完整的事件流展示了用户的探索路径——他们可能在定下来之前点击多个选项。最后一个 `choice` 事件通常就是最终选择，但点击的模式可能透露出犹豫或偏好，值得一问。

如果 `$STATE_DIR/events` 不存在，说明用户没有与浏览器交互——只用他们的终端文本。

### 28.8 设计提示（Design Tips）

- **保真度按问题缩放**——布局问题给线框图，打磨问题给打磨稿
- **每一页都解释问题**——写「哪种布局感觉更专业？」，而不只是「挑一个」
- **先迭代再前进**——如果反馈改变了当前屏幕，就写一个新版本
- 每屏**最多 2-4 个选项**
- **要紧时用真实内容**——做摄影作品集就用真实图片（Unsplash）。占位内容会掩盖设计问题。
- **保持原型图简单**——聚焦布局与结构，不做像素级完美的设计

### 28.9 文件命名（File Naming）

- 使用语义化名称：`platform.html`、`visual-style.html`、`layout.html`
- 绝不重用文件名——每一屏都必须是新文件
- 迭代时：追加版本后缀，如 `layout-v2.html`、`layout-v3.html`
- 服务器按修改时间提供最新的文件

### 28.10 清理（Cleaning Up）

下面这段 bash 命令停止服务器：

```bash
bash scripts/stop-server.sh $SESSION_DIR
```

如果会话用了 `--project-dir`，原型图文件会持久保存在 `.superpowers/brainstorm/` 里供日后参考。只有 `/tmp` 里的会话会在停止时被删除。

### 28.11 参考（Reference）

- 框架模板（CSS 参考）：`scripts/frame-template.html`
- 辅助脚本（客户端）：`scripts/helper.js`
