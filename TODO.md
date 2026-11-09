# TODO

在思考中、还没定论、也还没进技能的东西。定了就移到对应技能里，从这里删掉。

## 1. PR 正文要不要分组

来源：`reference/poteto-plugins/cursor-team-kit/skills/pr-review-canvas`（一个给评审者看的交互页面）。

它把 PR 里的文件分成两类：**核心改动**（默认展开，配一句白话注解）和**机械改动**（重命名、格式化、批量替换，默认折叠）。

还没想好的是：

- 分组对 `cwl-pr` 有没有用。它是在给「脚本自动生成、读者没有任何上下文」补判断力；而 `cwl-pr` 是自己写的，作者本来就知道哪处是重点。
- 更轻的替代：Summary 开头一句「先看 X，其余 N 个文件是配套改动」，不做正式分组。
- 如果要分组，形状是什么：两组标题？还是只在机械改动后标一句「无逻辑变化」？

相关：`workflow/cwl-pr/SKILL.md` 的 Summary 一节。

## 2. 能不能复用一个 PR 报告的渲染模板

同一个技能目录里有可直接复用的三件套：

- `styles.css`（约 5.9K，深色主题）
- `renderer.js`（约 6.9K，diff 渲染：过滤 import、合并纯空白改动、检测搬移代码）
- `template.html`（注入 CSS / JS / body / diff 数据的骨架）

用到的地方可能是：

- `cwl-code-review` 输出一份可视化评审报告
- `cwl-direct` 收尾那份「最小视图」做成可点击的页面

还没想好的是：

- 值不值得引入 HTML 产出。纯文本报告在对话里就能读完，HTML 要写文件、起服务、再打开。
- 如果做，放在系统临时目录（像 `cwl-handoff` 那样）还是项目里。
- 搬移代码检测这类能力，纯文本报告做不了，是 HTML 独有的价值。

相关：`reference/poteto-plugins/cursor-team-kit/skills/pr-review-canvas/`。
