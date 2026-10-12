## 45 message-map —— 文档覆盖矩阵

> 译自 `reference/openspec/docs-lab/message-map.md`（原文 65 行）。按 `READING-openspec.md` 第 45 项。
> 表格的列名、页面路径及其链接目标、状态关键词 `Answered` / `Skeleton` / `Gap` / `Off-site`、文件名与所有行内代码原样保留；只译正文。

### 45.1 这份矩阵的走向与状态含义（The message map's direction and status vocabulary）

[README](README.md) 索引是「页面 → 职责」。本文件反过来走：把「我们需要文档回答的问题」列成一张扁平清单，每一行指向拥有该答案的组与页面。Status 说明这个答案是否已经存在：**Answered**（归属页的正文已经落地）、**Skeleton**（已指派归属，但页面只有标题）、**Gap**（没有归属）、**Off-site**（按决定在这套文档之外回答）。某一行所属页面的正文一落地，就把这一行翻成 Answered。行的顺序跟随归属页在侧边栏中的顺序；Gap 行放在它预期的归属页会落到的位置，Off-site 行排在最后。保持行的粒度粗（问题对页面，绝不句子对章节），这样维护起来才便宜。

### 45.2 覆盖矩阵（The coverage matrix）

| Question | Answered by | Status |
|---|---|---|
| 我们如何推销核心理念（让更大的功能保持正轨并对齐，而不只是写代码前的一份计划）？ | [Start › Overview](start/overview.md)（2026-08-21 为从零重写而清空，并在此前从站点撤下；要点在 Notes.md） | Skeleton |
| 一个人如何判断 OpenSpec 值得他花时间？ | [Start › Overview](start/overview.md)（2026-08-21 清空，见上一行） | Skeleton |
| 用户应该如何安装 CLI、更新它、卸载它？ | [Start › Installation](start/installation.md) | Answered |
| 用户如何把安装与设置交给他们的 AI 助手？ | [Start › Installation](start/installation.md)，即 install.md 提示词 | Answered |
| 用户应该如何把 OpenSpec 加到自己的仓库里？ | [Start › Set up your project](start/setup.md) | Answered |
| 工作流是如何进入用户的工具里的，以及为什么 skills 与 commands 两种形态都要有？ | [Start › Set up your project](start/setup.md) | Answered |
| 我们如何教这个循环：propose、review、apply、archive？ | [Start › Quickstart](start/quickstart.md) | Answered |
| 用户应该如何端到端地跑完自己的第一个 change？ | [Start › Quickstart](start/quickstart.md) | Answered |
| 用户如何知道哪些提示词放进 AI 聊天、哪些命令放进终端？ | [Start › Quickstart](start/quickstart.md) 内联在每一步里，然后是 [Help › FAQ](help/faq.md) | Answered |
| 我们如何解释 specs 和 changes 是什么？ | [Guides › Understanding › Concepts](guides/concepts.md) | Skeleton |
| 用户应该在提议之前如何把一个想法想透？ | [Guides › Using › Explore an idea](guides/explore.md) | Skeleton |
| 用户应该如何评审一份计划？ | [Guides › Using › Review the plan](guides/review-the-plan.md) | Skeleton |
| 用户如何在归档之前检查实现与计划相符？ | [Guides › Using › Review the plan](guides/review-the-plan.md)，即 verify 环节 | Skeleton |
| 用户应该如何跨会话、跨上下文上限地执行一份计划？ | [Guides › Using › Apply a change](guides/apply.md) | Skeleton |
| 用户应该如何安排计划的节奏：一次起草全部，还是一个 artifact 一个 artifact 地来？ | [Guides › Using › Apply a change](guides/apply.md)，continue 与 fast-forward | Skeleton |
| 我们如何解释标准流程（propose 一步起草全部 artifact）与迭代流程（new 创建 change，continue 起草下一个 artifact，fast-forward 追上来）之间的区别？ | [Start › Quickstart](start/quickstart.md) 只教标准流程；[Guides › Using › Apply a change](guides/apply.md) 负责 change 一旦存在之后的节奏安排；[Reference › Skills](reference/skills.md) 承载 new/continue/ff 的契约；[Customize › Profiles](customize/profiles.md) 覆盖如何安装它们；[README](README.md) 里的一条 TODO 提议写一篇 Using 指南 | Gap |
| 用户应该如何在一个 change 进行到一半时改变方向，或者抽身退出？ | [Guides › Using › Change course](guides/change-course.md) | Skeleton |
| 一个团队应该如何一起使用 OpenSpec？ | [Guides › Adopting › Teams](guides/teams.md) | Skeleton |
| 用户应该如何同时进行多个 change？ | [Guides › Adopting › Teams](guides/teams.md) 负责触碰同一个 spec 的冲突场景；一般性的答案（也包括单人，不只是团队）目前还没有归属 | Gap |
| 用户应该如何在整个循环里处理 git：分支、提交、PR？ | 只有 archive 与 PR 的先后顺序有归属，由 [Guides › Adopting › Teams](guides/teams.md) 负责；README TODO 提议写一篇指南 | Gap |
| 一个好的 change 长什么样？ | `guides/examples.md` 被搁置，直到有真实的已归档 change 能填满它（README TODO）；没有已发布的归属 | Gap |
| 用户应该如何在一份已经存在的代码上采用 OpenSpec？ | [Guides › Adopting › Existing codebases](guides/existing-codebases.md) | Skeleton |
| 用户应该如何在一个 monorepo 里使用 OpenSpec？ | Legacy 的 `docs/existing-projects.md` 曾负责它（仓库根下一个 `openspec/`，domain 映射到 package）；可能的归属是 [Guides › Adopting › Existing codebases](guides/existing-codebases.md)，而把 package 当作独立仓库处理则归 [Multi-repo › Stores](multi-repo/stores.md) | Gap |
| 我们如何解释 OpenSpec 里有哪些东西是可自定义的？ | [Customize › Overview](customize/overview.md) | Answered |
| 用户如何选择合适的自定义层级，以及什么时候应该从 config 升级到 schemas？ | [Customize › Overview](customize/overview.md) 的 "Not sure which to use?" 一节 | Answered |
| 用户应该如何选择安装哪些工作流？ | [Customize › Profiles](customize/profiles.md) | Answered |
| 用户如何切换成只用 skills 或只用 commands？ | [Customize › Profiles](customize/profiles.md) 的 Delivery 一节；两种形态为什么都存在由 [Start › Set up your project](start/setup.md) 负责 | Answered |
| 用户如何让工作流按他们的方式规划 change：context、rules 和 guidance？ | [Customize › Project configuration](customize/project-config.md) | Answered |
| 用户如何让 artifact 用英语之外的语言写出来？ | [Customize › Project configuration](customize/project-config.md) 的 context 一节里的 "Another language" 注记 | Answered |
| 用户应该如何改变 OpenSpec 的产出？ | [Customize › Schemas](customize/schemas.md)，另见 "Creating your own custom schema" 里的 fork 走查 | Answered |
| 用户应该如何编辑已安装的技能提示词？ | 没有归属：`customize/skills.md` 被搁置（README TODO），直到 `openspec update` 覆盖编辑这个问题有了好答案 | Gap |
| 用户应该如何跨多个仓库使用 OpenSpec？ | [Multi-repo › Stores](multi-repo/stores.md)；[Start › Set up your project](start/setup.md) 从 "Pick where OpenSpec lives" 指到那里 | Answered |
| 用户应该如何规划一个跨仓库的 change？ | [Multi-repo › Stores](multi-repo/stores.md) | Answered |
| 每个技能做什么，用户什么时候该用它？ | [Reference › Skills](reference/skills.md) | Answered |
| 用户到哪里查一条终端命令？ | [Reference › CLI](reference/cli.md) | Answered |
| 用户如何了解收集了哪些遥测数据，以及如何退出？ | [Reference › Configuration › Environment variables](reference/configuration/environment-variables.md) 负责事实（曾经是一个 README-TODO 缺口）；[Help › FAQ](help/faq.md) 把搜索的人引到那里 | Skeleton |
| 用户到哪里查一个 artifact 的格式，或者一个 schema 定义的字段？ | [Reference › Schemas](reference/schemas/index.md) | Answered |
| 用户到哪里查一个会改变 OpenSpec 行为的设置或文件？ | [Reference › Configuration](reference/configuration/index.md) | Answered |
| 一条命令作用在哪一棵 openspec/ 树上？ | [Reference › Configuration › Stores](reference/configuration/stores.md) 负责整条解析阶梯，包括日常情形（最近的 openspec/ 胜出）；读者从 [Configuration overview](reference/configuration/index.md) 地图的 Stores 行到达它 | Skeleton |
| 用户应该如何跑一个对 spec 没有影响的 change，或者直接退役一个 capability？ | [Reference › Configuration › Change metadata](reference/configuration/change-metadata.md) 负责 `skip_specs` 与 `retire_capabilities` 契约；[Reference › Schemas › spec-driven](reference/schemas/spec-driven/index.md) 的 Delta specs 一节负责它们对 delta 与 archive 的影响；两半都没有指南归属 | Gap |
| 什么是 initiative，一个 change 如何加入其中一个？ | 没有归属：`initiative` 字段的契约在 [Reference › Configuration › Change metadata](reference/configuration/change-metadata.md) 上，但没有任何页面教 initiative（multi-repo 只有 Stores） | Gap |
| 什么是 workset，用户如何在编辑器里打开一个？ | [Multi-repo › Worksets](multi-repo/worksets.md)；`openers` 字段的契约留在 [Reference › Configuration › CLI settings](reference/configuration/config-json.md) | Answered |
| 哪些 AI 工具可用，各自的语法是什么？ | [Reference › Supported tools](reference/supported-tools.md) | Answered |
| 我的工具不在列表里，我还能用 OpenSpec 吗？ | [Help › FAQ](help/faq.md) 指路：共享的 `.agents` 目标或提一个 issue；[Reference › Supported tools](reference/supported-tools.md) 的 Per-tool notes 承载共享目标的契约 | Answered |
| 用户到哪里查一个术语？ | [Reference › Glossary](reference/glossary.md) | Answered |
| OPSX 是如何构建的？ | [Reference › Architecture](reference/architecture/index.md) | Skeleton |
| 我们如何解释这个工作流是流体的 —— 是动作，不是阶段？ | [Start › Overview](start/overview.md) 将在重写后承载这个推销（「共享的地图，而不是提前给出的计划」这套框架原本在被清空的骨架里）；[sources.md](sources.md) 把 opsx.md 的解释路由到 [Guides › Understanding › Concepts](guides/concepts.md)，但那一页在第 3 轮评审中收窄到只讲 artifact；可能的归属是 Guides › Understanding，把 [Concepts](guides/concepts.md) 拓宽或加一个兄弟页面，并让 [Reference › Architecture › Design decisions](reference/architecture/design-decisions.md) 保留其所以然 | Gap |
| 当 OpenSpec 没有做到用户预期时，用户该做什么？ | [Help › Troubleshooting](help/troubleshooting.md)，然后是 [Help › FAQ](help/faq.md) | Skeleton |
| 用户到哪里寻求帮助或报告 bug？ | [Help › Troubleshooting](help/troubleshooting.md) 的 Getting help 一节 | Skeleton |
| 用户应该如何从 legacy 的 `/openspec:*` 命令迁走？ | [Help › Migration](help/legacy/migration.md) | Skeleton |
| 脚本或 CI 如何以编程方式驱动 CLI？ | 按决定属于 Off-site：仓库侧的贡献者文档，见 [sources.md](sources.md) | Off-site |
