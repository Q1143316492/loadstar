# HTML 报告格式

架构巡检渲染为操作系统临时目录里的单个自包含 HTML 文件。Tailwind 与 Mermaid 都来自 CDN。Mermaid 可靠地处理图形状的图；手搭的 div 与内联 SVG 处理更有编排感的视觉（体量图、剖面）。两者混用：别什么都靠 Mermaid，它会显得千篇一律。

## 脚手架

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>{{仓库名}} 架构巡检</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module">
      import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
      mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "loose" });
    </script>
    <style>
      /* small custom layer for things Tailwind doesn't cover cleanly:
         dashed seam lines, hand-drawn-feeling arrow heads, etc. */
      .seam { stroke-dasharray: 4 4; }
      .leak { stroke: #dc2626; }
      .deep { background: linear-gradient(135deg, #0f172a, #1e293b); }
    </style>
  </head>
  <body class="bg-stone-50 text-slate-900 font-sans">
    <main class="max-w-5xl mx-auto px-6 py-12 space-y-12">
      <header>...</header>
      <section id="candidates" class="space-y-10">...</section>
      <section id="top-recommendation">...</section>
    </main>
  </body>
</html>
```

## 页头

仓库名、日期，以及一段紧凑的图例：实线框 = 模块，虚线 = 接缝，红箭头 = 泄漏，深色粗框 = 深模块。不要引言段。直接进候选。

## 候选卡片

图承担主要表达。文字稀疏、平实，直接用词汇表术语（来自 `/codebase-design` 技能），不加仪式。

每个候选是一个 `<article>`：

- **标题**：短，点名这次加深（如「合并订单接单流水线」）。
- **徽章行**：推荐强度（`强烈推荐` = emerald、`值得探索` = amber、`推测性` = slate），外加一个依赖类别标签（`进程内`、`本地可替代`、`端口与适配器`、`mock`）。
- **文件**：等宽列表，`font-mono text-sm`。
- **前 / 后对比图**：核心件。两列并排。见下文模式。
- **问题**：一句话。哪里在疼。
- **方案**：一句话。改变什么。
- **收益**：短句列表，每条尽量 ≤10 字。如「测试打在一个接口上」「定价逻辑不再泄漏」「删掉 4 个浅包装器」。
- **ADR 提示**（如适用）：一行，放在琥珀色框里。

不要解释性段落。如果图需要一段话才能被看懂，重画图。

## 图模式

选适合候选的模式。混着用。别让每张图长得一样——多样性本身就是要点之一。

### Mermaid 图（依赖 / 调用流的主力）

当要点是「X 调 Y、Y 调 Z，看看这一团乱」时，用 Mermaid 的 `flowchart` 或 `graph`。把它包在 Tailwind 样式的卡片里，免得像空降进来的。用 classDef 把泄漏边染红、把深模块染深。时序图适合「前：6 次往返；后：1 次」。

```html
<div class="rounded-lg border border-slate-200 bg-white p-4">
  <pre class="mermaid">
    flowchart LR
      A[OrderHandler] --> B[OrderValidator]
      B --> C[OrderRepo]
      C -.leak.-> D[PricingClient]
      classDef leak stroke:#dc2626,stroke-width:2px;
      class C,D leak
  </pre>
</div>
```

### 手搭方框与箭头（Mermaid 的布局跟你打架时）

模块是带边框和标签的 `<div>`。箭头是绝对定位在 relative 容器上的内联 SVG `<line>` 或 `<path>`。当你想让「后」图读起来像一个粗框深模块、内部灰掉时用它——Mermaid 渲染不出正确的重量感。

### 剖面图（适合分层式的浅）

堆叠水平条带（`h-12 border-l-4`）显示一次调用穿过的层。前：6 个薄层，每层什么都不做。后：1 个粗条带，标明合并后的职责。

### 体量图（适合「接口和实现一样宽」）

每个模块两个矩形：一个表示接口表面积，一个表示实现。前：接口矩形几乎跟实现矩形一样高（浅）。后：接口矩形矮，实现矩形高（深）。

### 调用图坍缩

前：函数调用树渲染为嵌套方框。后：同一棵树坍缩成一个方框，如今内部的调用在其中淡化显示。

## 样式指南

- 偏编排感，不要企业仪表盘。留白慷慨。标题可用衬线（`font-serif` 与 stone/slate 很搭）。
- 颜色克制：一个主色（emerald 或 indigo），加红表泄漏、琥珀表警告。
- 图保持在约 320px 高，让前后对比能舒适地并排放下、无需滚动。
- 图内模块标签用 `text-xs uppercase tracking-wider`，让它们读起来像示意图，而不像 UI。
- 唯一的脚本是 Tailwind CDN 和 Mermaid ESM import。除此之外报告是纯静态的：没有应用代码，除了 Mermaid 自身的渲染外没有交互。

## 最佳推荐一节

一张更大的卡片。候选名、一句话说明为什么、指向它卡片锚点的链接。就这些。

## 语气

平实、简洁，但架构名词和动词直接来自 `/codebase-design` 技能。简洁不是漂移的借口。

**严格使用**：模块、接口、实现、深度、深、浅、接缝、适配器、杠杆、局部性。

**绝不替换**：组件、服务、单元（对模块）· API、签名（对接口）· 边界（对接缝）· 层、包装器（对模块，当你指的是模块时）。

**符合风格的表述**：

- 「订单接单模块是浅的：接口几乎和实现一样大。」
- 「定价逻辑跨接缝泄漏。」
- 「加深：一个接口，一处测试。」
- 「两个适配器为接缝正名：生产用 HTTP，测试用内存。」

**收益短句**用词汇表术语点名所得：*「局部性：bug 集中在一个模块」*、*「杠杆：一个接口，N 个调用点」*、*「接口缩小；实现吸收掉那些包装器」*。不要写*「更易维护」*或*「代码更干净」*——那些词不在词汇表里，配不上一个位置。

不要含糊其辞、不要清嗓子、不要「值得注意的是……」。一句话能写成短句就写成短句；一条短句能删就删。术语不在 `/codebase-design` 词汇表里时，先去找一个在里面的，再考虑发明新词。
