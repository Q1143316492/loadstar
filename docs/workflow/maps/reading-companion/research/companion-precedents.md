# 陪读先例调研

> 抓取日期：2026-10-17。执行：研究子智能体（约 52 分钟，写盘前被截断——本笔记自其会话日志回收整理；收尾验证点由主会话补核：LaToza DOI ✓、pi-mono 的 DeepWiki 页 ✓、Robillard PDF ✗ 抓取失败、不引用）。
> 服务对象：本图三张后续票——03 入口地图 / 04 陪读节拍 / 05 方法定稿。

已有先例大致分四代，逐节展开：

```
人工导览（CodeTour / Lions 注释本）
  → 代码导航原语（Sourcegraph）
    → 全库自动 wiki（DeepWiki）
      → 按需、接地解释（Codemaps；/explain 的交互；Copilot for Docs 的自省）
```

---

## 1. CodeTour（Microsoft）—— 人工导览的工程化

- **是什么**：VS Code 扩展。一份 tour = 一串交互步骤，每步锚到目录/文件/行，配一段 markdown 说明。
- **产物形态**：JSON tour 文件（`.tours/`、`.vscode/tours/`、`.github/tours/`），可入库、可独立导出（内嵌文件内容）；多份 tour 可串成序列；「primary tour」= 给新人的推荐起点。
- **可借鉴**：
  - 「推荐阅读主线」有现成的形状：primary tour（起点）+ 串接（顺序）；
  - 锚点两种：行号，或 `pattern`（按内容正则定位）——后者抗漂移；
  - 「目录步」「内容步」：步骤不必是代码行，可以是目录注解或一段话；
  - **漂移被当一等公民**：官方文档有「Versioning Tours」（git ref 钉版本）与「Maintaining Tours」（CI 跑 CodeTour Watch 检测 tour drift）。
- **教训**：工具靠人写导览，现实中没人写（v0.0.59 已是 3 年前、最后提交约 1 年前、4.6k stars / 29 open issues）——模型生成恰好补这个缺口。
- 来源：<https://github.com/microsoft/codetour>（README）

## 2. Sourcegraph—— 导航原语，与 Notebooks 之死

- **Code Navigation**：两档精度——搜索式（文本 + 语法启发，40 语言）与精确式（编译期索引，SCIP indexer）；操作原语 = hover / 跳定义 / 找引用 / 找实现。
- **Notebooks**：网页版 + 文件版（`.snb`）；块类型 Query / File / Symbol / Markdown——**活的代码搜索结果嵌进 markdown**。文档页 2026-10-17 实测 404（已退役）；存档快照（2025-01）显示 3.39 起 GA。
- **可借鉴**：
  - 两档精度对应两种成本：陪读的「跳一下」用搜索式够（模型 ≈ 会走路的 grep）；关键机制要落到精确实现；
  - **块会重跑 ⇒ 内容不漂移**——代码挪了，块报错而不说谎。机械防漂移的第二种形态（对照 CodeTour 的 CI 检查）；
  - `.snb` 是可入库的文本形态：导览产物应是可审阅的文件，不是一次性网页。
- **教训**：导览/笔记类产品生存艰难（Notebooks 已没），但导航原语是持久的。
- 来源：<https://sourcegraph.com/docs/code-navigation>；`/docs/notebooks`（404）；web.archive.org 快照

## 3. DeepWiki（Cognition）—— 全库自动 wiki 的现状与公开失败模式

- **产品形态**：给任意 GitHub 仓库自动生成 wiki（把 `github.com` 换成 `deepwiki.com`；发布时已索引 50,000 个热门仓库），「documentation you can talk to」——可对话；由 Devin Wiki + Devin Search 驱动（公告 2025-05-05）。
- **对试点库的实测**：`deepwiki.com/badlogic/pi-mono` 存在（Last indexed 2026-07-21，commit `dd6bea41`）。8 大节 + 子页（如 `pi-agent-core` 下分 Agent Loop & State Machine / Transport Abstraction / AgentHarness & Hooks）；**每句事实带来源链接**（形如 `packages/ai/package.json 54-66` → GitHub blob 带行区间）；含架构图与流程小节。
- **公开失败模式**（HN 45002092「DeepWiki: Understand Any Codebase」，231 点 / 53 评论，2025-08；另有 43796308）：
  1. **错误权重**：LibreOffice 的 build system 页以 Buck 为主角（"LibreOffice has never used Buck as a build system"）——对的文件、错误的重点；
  2. **错过核心**：LLVM 图把 Claude-AST 画进 clang 前端、漏 GlobalISel / InstCombine，"at no point does it even discuss... LLVM IR"——纠缠边角、绕开主干；
  3. **命名式幻觉**："hallucinating... because a struct / package / function was named for something it wasn't doing anymore"——名字暗示了它已不再做的事；
  4. **图不落地**："diagrams are too handwavy... not tied down enough to actual implementation details"；
  5. **深度配比失衡**："way too much depth on some trivial details, and glosses over more important stuff"；
  6. **意图在代码外**：评论者愿望 = "could read github issues etc... more context about the decisions"；
  7. **越权感**：任何人都能为任何仓库生成 wiki、无背书、SEO 上与官方文档混淆（"they just kind of barged in"）；还有 AI slop bug 报告浪费维护者时间（GitLab issue `purelb/purelb#147`）、下架机制缺失的争议。
- **最重要的正面线索**："auto-overviews and diagrams are great, but where it truly shines is the 'deep research' follow-up questions"——**深挖问答 ≫ 静态 wiki**；"one of the few strictly net positive AI coding tools"。
- **与 01 的互证**：静产物 = 糊（01 §2.2 五代全灭）；「什么重要」不在代码里（01 §2.1，对应第 6 条）；「地图得有人画过」（rgoulter: "the map is not the territory... you do want someone to have come up with a map"）。
- 来源：<https://deepwiki.com/badlogic/pi-mono>；<https://cognition.com/blog/deepwiki>；<https://news.ycombinator.com/item?id=45002092>；<https://news.ycombinator.com/item?id=43796308>；<https://www.aitidbits.ai/p/deepwiki>

## 4. Codemaps（Cognition / Windsurf）—— 按需、接地解释的直系先例（最对口）

- **形态**：「AI 标注的结构图」，一次只做**一个任务/问题**的即时地图（just-in-time），不量产全库 wiki。两种视图：分组/嵌套的代码部件清单（密集链到精确行）+ 视觉图（节点跳回代码）；「See more」展开 trace guide——讲清这些行为什么被归在一起。产物可分享、可被 agent 引用（`@{codemap}`），有开放 `.codemap` 协议的野心（2025-11-04）。
- **定位宣言**（句句是票材）：
  - 对比项就是「在聊天里问通用 agent」："those solutions don't solve focused onboarding and strongly grounded navigation"；
  - "grounded in precise code navigation"——图钉在代码导航上；
  - "To understand is to be accountable"；"AI that turns your brain ON, not OFF"；
  - "onboarding isn't a one-time cost, you pay it every time you switch context"；
  - "AI as a partner that explains code in an accurate and consistent way, rather than generating tons of inscrutable slop"。
- **可借鉴**：按需生成（不是先全量后读）；清单视图 + 图视图双形态；trace guide = 「它们为何是一组、数据怎么流」的散文——比图更能承载机制；锚到行；产物可携带。
- 来源：<https://cognition.com/blog/codemaps>

## 5. Copilot for Docs（GitHub Next）—— 官方实验的自我总结

- **形态**：从维护者写的文档回答问题 + 引用原文；理念 "Instead of acting like an oracle, ...helps developers grow their understanding... by linking to the relevant docs"。
- **落日**：technical preview 于 2023-12-15 结束；官方说明较笼统（"make room for new projects"），但落日文里留了成串设计方向：highlight sentences / take notes / 按需定制教程 / 分支式对话 / 采访维护者 / "Instead of writing whole docsets... one paragraph at a time"。
- **可借鉴**：反 oracle 姿态、引用到一手；「一次一段」而非成套文档——与本图「浅入口 + 拉取深挖」同构。
- 来源：<https://githubnext.com/projects/copilot-for-docs/>；<https://gist.github.com/idan/325676d192b32f169b032fde2d866c2c>

## 6. `/explain`（GitHub Copilot）—— 拉取式解释是生态标准件

- 官方文档确认 `/explain` = "Explain how the code in your active editor works"。
- **可借鉴**：「就地、按需、以当前编辑区为单位」是头部产品给出的默认交互——陪读接口应与这类习惯兼容（选中即讲、跟着光标走）。
- 来源：GitHub Copilot Chat 官方文档 / cheat sheet

## 7. 程序理解文献—— 读法的既有知识

| 文献 | 一句话 |
|---|---|
| Brooks 1983，*Towards a theory of the comprehension of computer programs* | 自顶向下、假设驱动的理解模型 |
| Soloway & Ehrlich 1984，*Empirical Studies of Programming Knowledge*，IEEE TSE，DOI `10.1109/TSE.1984.5010283` ✓ | beacons（路标）+ plans：专家靠路标停留、按计划框架读 |
| Pennington 1987，*Comprehension strategies in programming*，Cognitive Psychology，DOI `10.1016/0010-0285(87)90007-7` ✓ | 两种模型：program model（控制流）与 situation model（功能目标） |
| von Mayrhauser & Vans 1995，*Program Comprehension During Software Maintenance and Evolution*，IEEE Computer | 集成模型；读法随任务上下切换 |
| LaToza, Garlan, Herbsleb, Myers 2007，*Program comprehension as fact finding*，ESEC/FSE，DOI `10.1145/1287624.1287675` ✓ | 理解 = 带着具体问题的**事实查找**（fact finding）——问题驱动，不是通读 |
| Robillard et al. 2004，*How Effective Developers Investigate Source Code: An Exploratory Study*，IEEE TSE | 高效读码是线索驱动、按需、一次性的调查 |
| Busjahn et al. 2015，*Eye movements in code reading: relaxing the linear order*，ICPC | 读码非线形；经验读者跳读熟悉部分（具体结论为转述，未逐字核到摘要） |
| Lions 1976，*Lions' Commentary on UNIX 6th Edition* | 人类先例：**逐行陪读的形态就是它**——完整源码 + 行行注解，可线性读完一本 |

**对三票的启示**：入口地图 = 先立自顶向下的骨架（Brooks）+ 种 beacons（值得停留的点，Soloway）；陪读以「进行中的事实查找」为单位（LaToza / Robillard），非线形与跳读是合法读法（Busjahn）；讲机制时 program model 与 situation model 要分开给（「控制怎么走」≠「它在达成什么」，Pennington）。

## 8. 要避开的死法（汇总，与 01 互证）

| 死法 | 证据 |
|---|---|
| 全库静 wiki | DeepWiki 吐槽潮 + 01 五代 |
| 图无锚点 | IceHegel「handwavy」 vs Codemaps「grounded」 |
| 深度配比失衡 | swiftcoder（琐碎处过深、重要处掠过） |
| 名字当机制 | ignoramous 命名式幻觉 |
| 漂移 | CodeTour 的 drift 条款；Notebooks 用重跑对抗 |
| oracle 姿态 | Copilot for Docs 的自我纠正 |
| 越权产物 | tacker2000 等（无背书 wiki / 下架争议） |

## 9. 对三张决策票的输入

### → 03 入口地图
- 形状有现成对照：primary tour（推荐主线）+ 目录步 / 内容步（CodeTour）；「先读哪、什么可跳」= 主线 + beacons（Soloway）。
- 深度上限要**说出来**（swiftcoder 教训）：明确「这页到此为止，深的在哪个块」；入口地图是索引不是仓库。
- 锚：pattern 优于纯行号（CodeTour）；文件+行区间链可作补充（DeepWiki 的引用形态）。
- 对照基线：pi-mono 已有 DeepWiki 页（8 节 + 子页 + 引用）——入口地图**不与它比覆盖面**（那是推送式），只比「你从哪开始读」。

### → 04 陪读节拍
- 深挖问答是已被验证的亮点（nikisweeting）；`/explain` 是习惯界面——「选中/说明位置 → 就地解释」。
- 以问题为单位（LaToza fact finding）：每次讲的是「你手里这个问题的答案」，不是「这个文件在干嘛」。
- trace guide 形态（Codemaps）：一组行为何被归在一起、数据怎么流——**串脉络的模板**。
- 非线形是合法读法（Busjahn）：允许跳、提倡跳；block 颗粒度跟着问题走，不跟着文件走。

### → 05 方法定稿
- 防漂移三件套可抄：pattern 锚点（CodeTour）、CI drift 检查（CodeTour Watch）、可重跑块（Notebooks）。
- 反 oracle 纪律：讲机制时显式标「事实 / 推测 / 未展开」（01 §3.3 逐项表态 + Copilot for Docs 的 links-not-oracle）。
- **机制 vs 名字**：命名式幻觉是已知死法——「这名字暗示什么」与「它实际做什么」分开说。
- 深度控制：拉取式（问题驱动）+ 浅入口上限——两个方向都有先例背书。

## 来源汇总

- CodeTour：<https://github.com/microsoft/codetour>
- Sourcegraph：<https://sourcegraph.com/docs/code-navigation>（Notebooks 页已 404）
- DeepWiki：<https://deepwiki.com/>、<https://deepwiki.com/badlogic/pi-mono>、<https://cognition.com/blog/deepwiki>
- DeepWiki 公开讨论：<https://news.ycombinator.com/item?id=45002092>、<https://news.ycombinator.com/item?id=43796308>、<https://www.aitidbits.ai/p/deepwiki>
- Codemaps：<https://cognition.com/blog/codemaps>
- Copilot for Docs：<https://githubnext.com/projects/copilot-for-docs/>、<https://gist.github.com/idan/325676d192b32f169b032fde2d866c2c>
- 文献题录：Crossref / Semantic Scholar 检索（DOI 已标 ✓ 者为一手题录核对过）
