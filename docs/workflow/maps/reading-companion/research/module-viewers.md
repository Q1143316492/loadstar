# 模块查看器先例：Uncle Bob 的两个 viewer

> 抓取日期：2026-10-19。来源：作者 GitHub 仓库列表 + 两个仓库的 README（未读源码）。
> 起因：「《代码简洁之道》作者有一个 module viewer 类似的东西」。
> 服务对象：03 入口地图；「图册的去向」这条尚未明确项。

## 0. 先校准作者

书名有两种可能，指向两个人：

- **Robert C. Martin（Uncle Bob）**《Clean Code》，中译《代码整洁之道》，部分渠道写作「代码简洁之道」——<https://github.com/unclebob>
- Max Kanat-Alexander《Code Simplicity》，中译《简约之美》——<https://github.com/mkanat>。**没有 viewer 类项目**，其公开仓库里与代码质量相关的只有 `skills`（cleanup 技能）

按「有 module viewer」这一线索，所指应为 **Uncle Bob**。其仓库列表里有两个对得上，都在活跃维护：`uml-viewer`（442★）与 `arch-view`（56★）。下文按「更可能」到「更轻量」排序。

## 1. `unclebob/uml-viewer` —— 最可能就是它

<https://github.com/unclebob/uml-viewer>

- **一句话**：Live Quil UML class-diagram viewer driven by EDN。
- **定位原文**：「This project displays a project as UML. The UML is dynamic. You can click elements to drill down — all the way to source code.」
- **模块观**：namespace 是 component，命名空间里的 module 是 component 的元素，嵌套可任意深。README 明令「**不要发明分层**」——图里的每一层都必须是代码里真实存在的 ns 段；想画代码里不存在的分组，用 `:proposals`，并标 `PROPOSAL — not instantiated in code`。
- **管道**：policy（人/agent 写，EDN）→ IR（EDN：ns 树 + classes + edges）→ viewer（布局、路由、着色）。README 对 agent 的纪律是「**agent 改 policy，不直接改 IR**」。
- **指标叠加**：CRAP 与变异测试数据来自 `.metrics/` 快照（配套工具 `crapper`、`mutator`），加载时按 `:ns` 再按函数名 join 到图上；缺数据的格子按红色（1 分）处理，而不是「未知」。
- **依赖规则**：`:levels` 定义内层/外层；从高层指向低层的依赖边染红（Clean Architecture 的 Dependency Rule）。同层允许；`:implements` / `:association` 永不违规。
- **导航**：双击 component 下钻，Esc/← 返回上一级；双击叶子模块出 class card；点成员直接打开源码并滚到该 `defn` 那一行。
- **语言**：Clojure / TypeScript / Rust / Python 四个扫描器；新增语言用 `graph/register!`（拓扑）与 `source/register!`（源码定位）注册，viewer 与 policy 层语言中立。
- **人机通道**：`.uml-viewer/to-viewer.edn`（agent → viewer）与 `to-agent.edn`（viewer → agent），每条命令带递增 `:id` 的队列，写入用 tmp-then-rename；tmux 只当门铃。
- **试用方式**：`scripts/get-uml-viewer` 在任意项目里落地一个 `./uml`，不需要本地 checkout；要求 Clojure CLI + Java 21，图在后台 JVM 里跑。

## 2. `unclebob/arch-view` —— 更「架构浏览器」一些

<https://github.com/unclebob/arch-view>

- **一句话**：交互式查看一个 Clojure 项目结构的 Clojure 工具。
- **依赖发现**：扫 `src` 下每个文件的 `ns` 表单，提取 `:require` 的项目内依赖；`defprotocol` / `defmulti` / `definterface` 的 ns 标记为抽象。
- **分层**：先识别环、删掉环上的依赖使图无环，再拓扑排序定垂直层；同层并列；被删掉的环边仍以标记显示，环在图底部列成 `a->b->c->a`。
- **视觉语言**：高层 ns = 左侧带两个凸起的矩形，叶子 = 粗黑框；顶边三角 = 入边，底边三角 = 出边；三角红 = 该方向存在环；悬停出 `from -> to` 列表。
- **导航**：点非叶下钻、点叶子看源码、`Back` 逐级返回并恢复滚动位置、`Reanalyze` 重扫重画。
- **无头模式**：`--no-gui --out architecture.edn` 只导出图数据。
- **接入方式**：在目标项目的 `deps.edn` 里加 `:arch-view` alias，用 `:replace-deps` 挂 git 依赖，隔离类路径冲突。

## 3. 值得借的骨架

两个工具共用一套四段式，和本图（尤其是 03）几乎同一假设：

```
语言扫描器 ──► IR（拓扑：ns 树 + 实体 + 边）──► 渲染器
                    ▲
              policy（层级 / 分组 / 外部库）  ← 人/agent 只改这一层
```

- **分析、IR、渲染三层分离**：IR 是纯 EDN，不绑语言也不绑 UI；换渲染器或换语言都不互相牵动。
- **policy ≠ IR**：agent 改 policy、程序生成 IR，从机制上堵住「agent 编造拓扑」。可作为 01 §2.1「什么重要不在代码里」的一个工程答案——重要性由 policy 显式写下，而不是让模型猜。
- **可注册的缝**：`register!` 两个入口（拓扑 + 源码定位），加语言不动 viewer。和 `cwl-codebase-design` 的「端口 + 适配器」同形。
- **下钻即导航，末端落到源码行**：结构的每一层都能点到底、最后停在某个 `defn` 上——这正是「陪读」里「讲到哪」的自然落点。
- **文件邮箱而非聊天**：带 id 的队列、pop 语义、tmp-then-rename。比对话式交接可重放、可审计，也不怕 agent 忙。
- **图不只是好看，是判据**：环、违反依赖规则、指标为红——这些把结构问题变成一眼可见，而 static 文档做不到。

## 4. 对本图的具体输入

- **03 入口地图**：可借「分层矩形 + 入/出边三角 + 下钻」的画法；「深度有上限」可直接实现为「只画到第 N 层，叶子点开才展开」。
- **04 陪读节拍**：点成员 → 打开文件并滚到行，是「读到哪讲到哪」的天然交互；比一次性长文档更符合拉取式。
- **图册的去向（尚未明确项）**：`proposals` 回答了「图不是代码的镜像，也可以是讨论的载体」——同一份代码可以有多张图、图可入库、可重生成。入口地图的产物大概也该是「可重跑 + 可批注」的文本，而不是一次性的截图。
- **反面提醒**：两者都需要人/agent 写 policy。纯自动生成依旧要面对 DeepWiki 那批失败模式（错误权重、错过核心）——「什么地方重要」仍是外部输入。

## 5. 不能直接搬

- **技术栈**：两者都是 Clojure + Quil（JVM / Processing）画图；Unity / TS 项目不适用，但 IR 与 policy 的结构完全可复刻。
- **授权**：两个仓库的文件列表里都**没有 LICENSE 文件**（`uml-viewer` 有 `.gitignore` / `README.md` / `deps.edn` 等，`arch-view` 同）。直接复制代码前需向作者确认；抄设计思路不受此限。
- **编排过重**：`uml-viewer` 深度绑 Grok companion + tmux（`companion.edn`、`session.edn`、`--restart` 协议）。对我们过重，值得抄的只是「文件邮箱」这一层。

## 来源

- <https://github.com/unclebob/uml-viewer>（README：Abstract / Tech / Run / Navigation / Policy / Companion mailbox / Language graphs / IR / Source extractors）
- <https://github.com/unclebob/arch-view>（README：Dependency Discovery / Layer Rationale / Visual Legend / Navigation / Use From Another Project / Run）
- <https://github.com/unclebob?tab=repositories>、<https://github.com/mkanat?tab=repositories>（作者校准）
- <https://github.com/unclebob/crapper>、<https://github.com/unclebob/mutator>（指标来源）
