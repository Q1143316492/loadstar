# 导览页格式

导览页是一个自包含 HTML 文件，写到系统临时目录，读完即可丢弃。Tailwind 与 Mermaid 都从 CDN 引入。风格对齐架构巡检报告：留白慷慨、颜色克制，图承担主要表达。

## 脚手架

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>{{仓库名}} 阅读路线</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module">
      import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
      mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "loose" });
    </script>
  </head>
  <body class="bg-stone-50 text-slate-900 font-sans">
    <main class="max-w-4xl mx-auto px-6 py-12 space-y-10">
      <header>…</header>
      <section id="route">…</section>
      <section id="stops">…</section>
      <section id="skipped">…</section>
    </main>
  </body>
</html>
```

## 页头

仓库名、日期，加一行路线摘要：`6 站 · 从入口读到副作用`。不加引言段，不写时长——没有依据的数字会让整页失掉可信度。

## 路线图

一张 Mermaid `flowchart LR`，按阅读顺序串起各站，站与站之间的边上写「因为」：

```html
<pre class="mermaid">
  flowchart LR
    A[入口] -->|定义了后一站要用的词| B[词汇表]
    B -->|在同一调用路径上| C[主循环]
    C -->|是它的稳定契约| D[接缝]
</pre>
```

站数多时把图横过来（`flowchart TD`），让节点保持可读的字号。

## 每站一张卡片

接口摊在一张小表里，深度用一段代码加一句话说明，最后一句解锁。读者扫一眼接口表就知道这个模块有多大，想核对深度时再读代码。

```html
<article class="bg-white border border-slate-200 rounded-xl p-8 space-y-5">
  <div class="flex items-baseline justify-between gap-4">
    <h2 class="font-serif text-2xl">2 · session</h2>
    <a class="text-xs underline text-slate-500" href="docs/session.md">docs/session.md</a>
  </div>

  <table class="w-full text-sm border border-slate-200 rounded">
    <thead class="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
      <tr><th class="p-2">接口</th><th class="p-2">承诺</th></tr>
    </thead>
    <tbody class="divide-y divide-slate-100">
      <tr><td class="p-2 font-mono text-xs">append(event)</td><td class="p-2">追加一条事实，返回它分配到的 seq</td></tr>
      <tr><td class="p-2 font-mono text-xs">events</td><td class="p-2">完整日志，只读快照</td></tr>
      <tr><td class="p-2 font-mono text-xs">derive_messages()</td><td class="p-2">当前模型可见的历史</td></tr>
    </tbody>
  </table>

  <p class="text-sm"><span class="font-semibold">深度。</span>三个名字背后是整条事件溯源链路。</p>

  <pre class="bg-slate-900 text-slate-100 rounded-lg p-4 text-xs overflow-x-auto"><code>entry = SessionEvent(seq=len(self._events), ...)
self._events.append(entry)

return [message for _, message in fold_surface(self._events)]</code></pre>
  <p class="text-sm text-slate-600">序号由长度给出，历史由折叠得出——两行里没有一个「保存消息」的动作。</p>

  <p class="text-sm"><span class="font-semibold">解锁。</span>你能解释压缩为什么不丢数据、回滚为什么免费。</p>
</article>
```

代码摘录只留证明那几行，省略处用 `...`，必须与仓库一致。

## 浅模块怎么标

接口表和实现差不多宽时，卡片里直接写一句：「这个模块的接口接近实现，读它等于读代码，先跳过。」并收进末尾的跳过表。

## 跳过的模块

一张两列表：模块、什么情况下读它。用等宽字体列模块名。

## 语气

平实、简洁，名词直接用项目自己的词汇。每一站先给接口，再说它有多深。实现细节只用来证明深度，不铺开讲。
