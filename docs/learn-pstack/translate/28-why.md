## 28 Why

> 译自 `reference/poteto-plugins/pstack/skills/why/SKILL.md`（原文 229 行）。frontmatter 按原样保留并附中译。参考文件（`references/`，共 8 篇）未译。

**frontmatter**

- `name`: `why`
- `description`: `Use for 'why does X work this way', 'why we picked Y', design rationale, regressions, postmortems, or data-backed thresholds. Discovers available MCPs and queries each evidence category (source control, issue tracker, long-form docs, real-time chat, infrastructure observability, error tracking, product analytics warehouse) in parallel, then returns a cited read on decisions and tradeoffs. Use how for runtime behavior.`（用于「X 为什么这样做」「我们为什么选 Y」、设计理由、回归、事后复盘，或有数据依据的阈值。运行时发现可用的 MCP，并行查询每类证据——版本控制、issue 追踪、长文档、实时聊天、基础设施可观测性、错误追踪、产品分析仓库——然后返回一份带引用的「决策与取舍」解读。要问运行时行为用 `how`。）

---

# Why

调查代码背后的动机与意图。它为什么做成这样？考虑过哪些边缘情况？哪些产品、业务或运维约束塑造了它的形状？哪些方案被否决了，为什么？

`how` 技能的搭档。`how` 回答代码做了什么、怎么工作；`why` 回答什么力量把它塑造成了现在这样。

## 这个技能怎么运作

历史上下文分散在七类证据里：版本控制历史、issue / 工单追踪、长文档、团队实时聊天、基础设施可观测性、错误 / 异常追踪、产品分析仓库。仅凭问题本身无法预知答案在哪一类里，所以该技能在运行时枚举可用的 MCP，把它们映射到各类证据，**并行查询全部七类**，再做综合并明确校准置信度。被查过却一无所获的类别，也是关于「这个决定当时是怎么做出的」的一等证据，要和正面发现一起报告。默认姿态是**覆盖，不是极简**。

## 工作姿态

像一名细致、谨慎、精确的调查员。像一个侦探，从零碎的记录里拼出一桩年代久远的案子。记录单薄时，就说记录单薄。

具体来说：

- **证据先于叙事（Evidence before narrative）。** 先收齐碎片，再看它们支持什么故事。绝不要先选一个故事，再招募顺从它的证据。
- **精确胜于漂亮（Precision over polish）。** 宁可给原句与引用，也不要流畅的转述。读者应当能顺着任何断言回到源头，在**一分钟内**核实。
- **想想你没看见的东西。** 找到的证据是样本，不是全部真相。下结论前问：如果另一种解释为真，我预期会看到什么？我找过它吗？
- **点名缺口。** 某条线索断了、某个来源不可检索、或某个问题根本无解时，把缺口记下来。不要用听起来很权威的猜测糊过去。
- **刻意含糊（Hedge on purpose）。** 证据是间接的，措辞就要表明这一点（「看起来是」「很可能」「表明」）。与置信度匹配的措辞是产物的特性，不是综合者可以随手覆盖的文风选择。
- **不靠读代码走捷径。** 代码告诉你它做什么，很少告诉你它为什么存在。抵住从代码形状反推意图的诱惑。

这个姿态是工作方法，不是免责声明。

## 核心认识论

该技能用零碎的历史证据拼出一幅**百衲衣式的理解**。工单会过期，聊天线程会被删，提交信息会撒谎，人会在 PR 描述和实施之间改变主意，原作者可能已经离职。

对「你知道什么」与「你在推断什么」保持彻头彻尾的诚实。目标不是讲一个令人满意的故事，而是**摆出证据、校准置信度、把判断留给用户**。

原则：

- **一切都要引用（Cite everything）。** 任何关于意图的断言都应指向具体的 commit hash、PR 号、工单 ID、文档 URL、聊天固定链接或代码注释。引不出来，它就是推断，不是事实，必须如此标注。
- **宁说「看起来是」，不说「因为」（Prefer "appears to" over "because"）。** 证据间接时就含糊其辞。自信的措辞只留给直接、明确的证据。
- **暴露矛盾（Surface contradictions）。** 两个来源不一致，就都摆出来。不要悄悄挑那个顺着自己叙事的。
- **承认缺口（Acknowledge gaps）。** 在你查过的所有来源里都找不到答案时，直说。「我们查不出为什么」比自信的猜测诚实得多。
- **多重假设都有效（Multiple hypotheses are valid）。** 证据能放进好几个故事时，把它们连同各自的证据一起呈现，让用户自己三角定位。
- **警惕合理化（Beware rationalization）。** 今天看来合理的代码，可能是为已经不再成立的理由写的，也可能根本没什么好理由。不要事后给它补意图。

完整的置信度框架与措辞指南见 `references/epistemics.md`。综合者必须遵守。

## 第 1 步 理解目标与问题

拆解用户在问什么。**目标**通常是一段代码、一种模式、一个功能，或一个具名的设计决定。**问题**通常是下列之一：

- 「X 为什么这样设计？」——设计理由。
- 「我们为什么做 X 而不是 Y？」——取舍或替代方案。
- 「什么边缘情况促成了这个？」——防御性推理。
- 「哪个业务或产品约束导致了它？」——外部强制力。
- 「这段代码为什么还在？」——死代码地带。
- 「X 的历史是什么？」——大范围考古清扫。

目标含糊时（「我们为什么这么做？」却没有明确所指），从对话上下文做最佳猜测（打开的文件、最近的编辑、光标位置、刚讨论的内容）。简要说明你的理解，让用户能纠正，然后继续。

## 第 2 步 建立代码锚点

拉起调查员之前，把调查锚定在具体代码上。你需要：

- 相关文件路径与行号范围
- 关键符号（函数名、类名、常量）
- 一份初始提交列表：最近几次触及目标的提交
- 合并提交里的 PR 号（subject 行里的 `(#1234)` 模式）

**就地构建这些信息。** 它很便宜，且每个调查员都需要。

```bash
# Blame target lines for last-touch commits
git blame -L <start>,<end> <file>

# Full file history, with patches, through renames
git log --follow -p -- <file>

# Last N commits touching the file, PR numbers visible
git log --oneline -20 -- <file>

# Extract PR numbers from a commit message
git log -1 --format=%B <commit>
```

对任何实质性提交，用 `gh` 拉取 PR 正文与讨论：

```bash
gh pr view <number> --json title,body,author,createdAt,mergedAt,labels,closingIssuesReferences,comments,reviews
```

把结果记为种子上下文（文件路径、符号、提交、PR 号、关联的工单 ID）。传给调查员，免得他们重新发现一遍。

## 第 3 步 并行拉起调查员（默认姿态）

**默认做完整的并行调查。** 每一类证据住在不同种类的系统里，单看问题无法判断哪一类装着答案——所以默认去看每一个可用的类别，并行地看。

### 发现

拉起调查员之前，先列出 Cursor 环境里可用的 MCP。有可用工具映射表就用它；否则检查 Cursor 暴露的 `mcps/` 目录里的已启用 MCP 服务。

把每个可用 MCP 映射到一类证据：

1. 版本控制历史
2. issue / 工单追踪
3. 长文档
4. 团队实时聊天
5. 基础设施可观测性
6. 错误 / 异常追踪
7. 产品分析仓库

版本控制永远可用，走 git 与 `gh`。其余六类根据 MCP 名称、服务说明、工具名与资源描述来归类。一个 MCP 可能跨多类时，选它**主要**证据所属的那一类。含糊的案例记入覆盖图。

目标是**完整的覆盖图（coverage map）**，不是最小的一份。issue 追踪器返回空，本身就是「这个决定当时没开票」的证据——一个有用的事实。把「空」记录下来，不要跳过搜索。

把匹配到的调查员放在同一条消息里启动，让它们并发运行。**每类一个调查员**，让每个专门熟悉一种工具的查询词汇与结果形状。不要让一个智能体同时覆盖多个 MCP。

子智能体配置（每个）：

- `subagent_type`：`generalPurpose`
- `model`：你配置的 why-investigators 模型（默认 `composer-2.5-fast`）
- `readonly`：`false`（agent 模式）。**不要用 readonly / Ask 模式。** 它会剥掉 MCP 访问权限，从而彻底禁用依赖 MCP 的调查员。版本控制调查员用 readonly 是安全的，但模式要保持统一。调查员仍然不该写任何东西——那是姿态，不是沙箱。

每个调查员拿到：

1. `references/investigator-prompt.md` 里的基础提示
2. 所选 MCP 对应的类别手册 `references/sources/<source>.md`，按 `references/source-playbook.md` 里的示例适配
3. **如果目标代码看起来是防御性的**（空值检查、重试逻辑、超时处理、限流、功能开关、出站守卫、OOM 处理器），再加横切的 `references/sources/incident-postmortem.md`
4. 第 2 步的代码锚点（文件路径、符号、commit hash、PR 号、工单 ID）
5. 用户原始问题

### 调查员名册：每个可用的证据类别一名

对每个有匹配 MCP 的类别拉一名调查员。每个调查员**只拥有一个**工具或 MCP。

每个条目列出该类证据在物理上装什么，以及它能唯一回答的那一种「why」。用它来预判会拿回什么、在某类返回空时如何命名缺口，以及（仅限极少数能证明无关的情况）为跳过提供理由。各类之间都重叠，但每一类都拥有其他类无法恢复的证据。

1. **版本控制调查员（Source control investigator）。** Git 历史、用 `gh` 查 PR、代码注释、测试。永远要拉——唯一的保底来源。最擅长呈现**评审期记录下来的实施理由**：PR 描述里的问题陈述、讨论替代方案的评审线程、编码了不显然约束的行内注释、编码了动机边缘情况的测试名，以及链接工单或事故的提交信息。它最可信，因为直接绑到已发布的 diff。

2. **issue / 工单追踪调查员（Issue / ticket tracker investigator）**（如 Linear、Jira、GitHub Issues、Plane、Shortcut 的 MCP）。工单、项目文档、状态更新、规格附件。最擅长呈现**产品 / 业务的强制力**：客户请求（「Acme 的 SOC2 审计需要 X」）、合规截止期限、母计划的框架（「Q3 企业就绪」）、工单级范围变更，以及给动机分类的标签（`customer:*`、`incident-followup`、`compliance`、`perf-regression`）。当「why」在工程之外时，它最强。

3. **长文档调查员（Long-form documents investigator）**（如 Notion、Confluence、Google Docs、Coda 的 MCP）。PRD、spec、RFC、设计文档、ADR、事后复盘、团队页、会议记录。最擅长呈现**长篇的设计理由**：问题陈述、明确的「考虑过的替代方案」与「被否决的做法」章节、定优先级的战略文档、已定案的 ADR，以及直接对应代码的复盘行动项。这里的「why」在变成代码之前就被写下来了。

4. **团队实时聊天调查员（Real-time team chat investigator）**（如 Slack、Discord、Microsoft Teams、Mattermost 的 MCP）。按功能名与符号搜索、PR URL 提及、事故频道（`#sev-*`、`#incident-*`）、发布日前后作者的账号活动。最擅长呈现**从未落到文档里的实时商议**：事故中的应急决定、PR 作者与评审者之间的问答、随口的「我们决定 X，因为 Y」线程，以及不值得写 PRD 的小改动的理由。当版本控制、工单、文档三条纸面线索都很薄时，它尤其重要。

5. **基础设施可观测性调查员（Infrastructure observability investigator）**（如 Datadog、New Relic、Honeycomb、Grafana、Splunk 的 MCP）。指标、监控、仪表盘、日志、APM trace、正式事故。基础设施 / 运行时视角。最擅长呈现**促使代码写成这样的基础设施与运行时现实**：阈值数字与代码常量吻合的监控项、PR 合并前窗口里的指标尖峰、作为复盘行动项建出来的仪表盘、引用到目标的事故时间线。当目标是在对基础设施信号（超时、重试、限流、熔断）做出反应时，它最强。

6. **错误 / 异常追踪调查员（Error / exception tracking investigator）**（如 Sentry、Rollbar、Bugsnag、Airbrake 的 MCP）。issue、事件、堆栈、发布版本。最擅长呈现**促成防御性或纠正性代码的具体异常与错误轨迹**：穿过目标函数的堆栈、首次 / 末次出现窗口刚好夹住 PR 发布日的 issue、显示某个错误在特定版本停止的发布关联。对 catch 块、空值守卫、类型检查、重试这类防御代码最强。

7. **产品分析仓库调查员（Product analytics warehouse investigator）**（如 Databricks、Snowflake、BigQuery、ClickHouse、dbt、Redshift 的 MCP）。产品分析事件、实验与功能开关暴露表、用量与计费事件、查询历史、仓库遥测。产品 / 数据视角。它补上基础设施可观测性缺的那块——发布日前后**用户行为与数据现实**，而非基础设施指标。最擅长呈现**塑造了代码的产品与数据现实**：功能使用量轨迹（从零阶跃式起跳，是「这个 PR 上线了它」的强证据）、与发布决定绑定的实验 / 开关暴露数据、能揭示阈值常量来源的上线前分布（例如 `limit = 128 * 1024` 正好等于某上传大小列的 p99），以及迁移 / 回填的数据管道规模证据。对开关门控代码、实验驱动上线、数据迁移，以及「这个数字从哪来的」类问题最强。

### 何时跳过某名调查员

只能带着**明确、书面的理由**跳过，且理由写进最终的「Sources Consulted」一节。只有两种正当原因：

- **本环境里没有该类别的 MCP。** 把它标为缺口，而不是选择。例如：「跳过实时聊天。无匹配 MCP，对话记录不可检索。」
- **该来源可证明地无关**，而不只是「大概无关」。这是很高的门槛。例如：「跳过错误追踪。目标是构建期脚本，没有运行时代码路径。」不能说「大概不在错误追踪里，这是个功能又不是错误。」

「这是纯功能代码，错误追踪不会有东西」**不够**，「我怀疑长文档里不会有这个」也不够。去搜，让空结果说话。一名调查员空手而归的代价是一个子智能体；漏掉一份真实存在的设计文档的代价是一个错误答案。

如果范围评估表明这是个单提交的琐碎目标、PR 描述已包含完整答案，你可以内联回答——但**必须先确认**全部七个可用类别查下来都会冗余。要明确说出来。这种情况应当极少。

## 第 4 步 综合

拉起一个综合者子智能体：

- `subagent_type`：`generalPurpose`
- `model`：你配置的 why-synthesizer 模型（默认 `claude-opus-4-8-thinking-xhigh`）
- `readonly`：`false`（agent 模式）。综合者的质量检查会抽查引用，可能需要 MCP 访问。readonly / Ask 模式会剥掉 MCP，破坏这一步。

综合者拿到：

1. 调查员的发现，包括任何空结果和以理由跳过的类别
2. 第 2 步的代码锚点（文件路径、符号、commit hash、PR 号、工单 ID）
3. 用户原始问题
4. `references/epistemics.md` 里的认识论框架
5. `references/synthesizer-prompt.md` 里的综合者提示模板

它的职责是最终产物：一份按置信度加权、带证据引用的叙述，明确分开「我们知道什么」与「我们在推断什么」，并诚实交代缺口与空结果来源。

## 第 5 步 呈现

拿综合者的输出呈现给用户。可以为清晰做轻微编辑，或补上对话里的上下文，但**不要重写置信度相关的措辞**。认识论式的框定就是产物本身。为了让口气更权威而删掉含糊限定，正是这个技能要防的失败模式。

## 输出格式

最终输出使用下面的结构。按需调整，但**保留置信度分层**。

**The Question（问题）。** 简洁复述用户问的。

**The Code in Question（相关代码）。** 文件路径、行号范围、关键符号。一两行，让读者有锚点。

**What We Found（直接证据）**。带明确引用的断言（PR 号、工单 ID、文档 URL、聊天固定链接、commit hash、带 `file:line` 的代码注释）。每条都是我们手里有文本证据的事。用现在时，引用或转述来源。

**What We Can Reasonably Infer（可以合理推断的）**。由间接证据或信号组合充分支持、但没有任何地方明确写出的断言。每条都必须解释推理链：「给定 A 与 B，C 很可能成立。」用带限定的语言（「看起来是」「很可能」「表明」）。

**Competing Hypotheses（竞争假设）**。证据能放进多个故事时，逐条列出：假设本身、支持它的证据、反对它的证据。记录不支持赢家时，不要硬选一个。（有明确答案时省略本节。）

**What We Don't Know（我们不知道的）**。明确的缺口：用户问过但证据没答上的问题，查过却一无所获的来源。要具体。「我们用工单追踪器搜了『rate limit』，没有讨论这个具体阈值的工单」比「我们不知道为什么」有用得多。

**Sources Consulted（查过的来源）**。每名调查员一行，包括空手而归的。读者应当一眼看到：(a) 查了哪些 MCP，(b) 哪些返回空，(c) 哪些被跳过及原因。这张覆盖图让用户判断广度，并在漏掉明显来源时纠偏。

每行格式为：`- <Source>: <what was searched>. <what was found, or "no relevant results," or "skipped. reason">.`

例如：

- Source control (git/gh): `git log --follow backend/retry.ts`, PRs #49074, #47812. Found PR #49074 introduced exponential backoff and linked ENG-4421.
- Issue tracker (Linear): searched for "retry" and ENG-4421. Found ENG-4421 parent issue but no discussion of backoff parameters.
- Long-form docs (Notion): searched for "retry policy," "backend retries," "ENG-4421." No relevant results.
- Real-time team chat (Slack): skipped. No matching MCP available in this environment. Gap: conversational record not searched.
- Infrastructure observability (Datadog): searched for `retry_count` metric and monitors around 2024-08-14. Found monitor "Upstream 5xx rate > 1%" created same day as PR #49074.
- Error / exception tracking (Sentry): searched for issues first-seen in Aug 2024 with stack through `retry.ts`. Found issue SENTRY-3821 spiking in the week before the PR.
- Product analytics warehouse (Databricks): queried `<your_analytics_db>.<schema>.stg_backend_upstream_retry` for the 30-day window around 2024-08-14. Daily failure-classified event count fell from ~1.2k/day pre-PR to <50/day post-PR. Also checked `system.query.history` for relevant migration queries. None found.

「Sources Consulted」块之后，如果用户的 `why` 问题确实是接下来要改这段代码的前奏，把血统发现转成一组 **Preserve / Change / Avoid / Risk** 约束，供规划这次改动使用。

## 要避免的常见失败模式

- **自信地讲故事（Confident storytelling）。** 用单薄证据搭出貌似合理的叙事。没有引用的条目要么进「推断」，要么进「假设」，**不能**进「我们找到了」。
- **拿代码当作它自身意图的证据。** 「处理了空值，因为它检查了空值」是机制，不是动机。动机来自外部来源（PR 讨论、工单、注释、对话），否则就要标注为推断。
- **新近偏误（Recency bias）。** 假定最近的提交最权威。现在的形状往往是许多更早决定的层层堆积。往前追。
- **谄媚式附和（Sycophantic agreement）。** 用户提示了一个理由（「我猜这是为了性能？」）时，把它当作假设，独立检查证据，不要直接确认。
- **跳过缺口一节（Skipping the gaps section）。** 诚实交代你没能查出什么，本身就是价值的一部分。
- **凭预判跳过调查员（Skipping investigators by anticipation）。** 先入为主地决定「长文档大概没有这个」或「这不是错误追踪的事」，而不去搜。默认全查七类的姿态正是用来防这个的。空结果是一个数据点；跳过的搜索是一个盲区。
- **把调查员合并成一个智能体（Collapsing investigators into one agent）。** 每个 MCP 有自己的查询词汇、结果形状与陷阱；混在一起会稀释专业性，让覆盖情况更难推理。始终每类一名调查员。

## 参考文件

- `references/epistemics.md`。置信度分层与措辞指南。综合者必须遵守。
- `references/investigator-prompt.md`。调查员子智能体的基础提示模板。
- `references/source-playbook.md`。指向下面各类别手册的索引。
- `references/sources/*.md`。每类一份自包含的示例手册，另加横切的 `incident-postmortem.md`。给调查员只发匹配其类别的那一篇，并按可用 MCP 适配。
- `references/synthesizer-prompt.md`。综合者子智能体的提示模板，含输出格式。
