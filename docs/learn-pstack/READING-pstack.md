# pstack 阅读路线

范围：`reference/poteto-plugins/pstack/`。**只读，不改**（这里只是取材）。
路径均相对 `reference/poteto-plugins/pstack/`。编号 = 读序。
译文按需落在 `docs/learn-pstack/translate/`，编号与此处一致。

> **快照**：`poteto-plugins` 于 2026-11-10 从 <https://github.com/poteto/plugins.git> 浅克隆，commit `74dd229`。上游是 Cursor 插件仓库，pstack 是其中一个插件。存档已裁剪到只剩 41 篇 `SKILL.md`（细节见 [`reference/README.md`](../../reference/README.md)）：`pstack` 33 篇（去掉 `setup-pstack`）、`cursor-team-kit` 6 篇、`thermos` 1 篇、`cli-for-agents` 1 篇。

**这份路线的筛选原则**：

- **只读 pstack**：其余插件多数是 Cursor 专有的画布 / SDK / 安装器，已从存档删除。留下的是 `cursor-team-kit/`（6 篇：`verify-this`、`deslop`、`make-pr-easy-to-review`、`thermo-nuclear-code-quality-review`、`control-ui`、`pr-review-canvas`）、`thermos/`（1 篇，安全与破坏性审计）、`cli-for-agents/`（1 篇）。这些等 pstack 读完再按需翻。
- **跳过 Cursor 机制层**：`.cursor-plugin/plugin.json`、`/loop`、多模型分角色配置（`setup-pstack`、`agents/poteto-agent.md` 的模型选择部分）。这些在 Claude Code / Codex 环境里跑不起来，读的是**原则**，不是机制。
- **先原则，后技能**：20 条 `principle-*` 是这套东西的骨架，`poteto-mode` 只是把它们串进一份 playbook。先读原则，再看它怎么编排。

## 0. 先看它怎么组织

- [ ] **01** `README.md` — 作者的定位自述：反对「ai 写出太多 slop」，主张「要快先要深」、少写但高质量。末尾「why are there no planning skills?」一节很关键：**他不信计划，最好的 spec 是代码**——这与本仓「先 spec 后 ticket」是正面冲突，读的时候要当成一个反方观点。
- [ ] **02** `skills/poteto-mode/SKILL.md` — 只有 124 行，但配了 16 份 playbook（`skills/poteto-mode/playbooks/`，65K）。先读 `SKILL.md`：它按任务类型给出手册清单，再路由到别的技能。playbook 按需读——最值得先看的是 `bug-fix.md`、`feature.md`、`multi-phase-plan.md`、`autonomous-run.md`。读完回答一个问题：它用什么形状把「一个任务从头做到尾」切段。
- [ ] **03** `skills/poteto-mode/SKILL.md` 里的 Principles 内联索引 — 20 条原则各自一句话。这是全仓的**词汇表**，后面所有技能都在引用这些名字。

## 1. 二十条原则（骨架，逐条读，每条 16–33 行）

按主题分组，与上游 `README.md` 的分类一致。

**核心**

- [ ] **04** `principle-laziness-protocol` — 偏向删除与最小改动；警惕新抽象、新分层、信号穿透。
- [ ] **05** `principle-foundational-thinking` — 先定核心类型与数据结构，让下游代码变显然。
- [ ] **06** `principle-redesign-from-first-principles` — 新需求进来时，按「它一开始就在」重设计，而不是外挂。
- [ ] **07** `principle-subtract-before-you-add` — 先删死重、冗余校验、桩引用，再在更简的底座上加。
- [ ] **08** `principle-minimize-reader-load` — 数「问题到答案」之间隔了几层、读者脑子里要记多少隐藏状态。
- [ ] **09** `principle-outcome-oriented-execution` — 迁移时直奔目标架构，不为中间态写一次性兼容层。
- [ ] **10** `principle-experience-first` — 产品/范围取舍时，选体验，少而精优于多而糙。
- [ ] **11** `principle-exhaust-the-design-space` — 无先例的交互或架构决定：先做 2–3 个竞争原型再定。
- [ ] **12** `principle-build-the-lever` — 别手工做，造那个能做/能证明的工具（codemod、脚本、生成器），**工具才是可复跑的产物**。

**架构**

- [ ] **13** `principle-boundary-discipline` — 校验集中在系统边界，内部类型可信，业务逻辑保持纯函数。
- [ ] **14** `principle-type-system-discipline` — 让非法状态不可表示；语义原语打品牌类型；外部数据在边界解析。
- [ ] **15** `principle-make-operations-idempotent` — 崩溃、重启、重试后收敛到同一终态。
- [ ] **16** `principle-migrate-callers-then-delete-legacy-apis` — 迁移调用方与删除旧 API 同一波完成，不留兼容层。
- [ ] **17** `principle-separate-before-serializing-shared-state` — 先把共享消掉，再考虑结构化串行化。

**验证**

- [ ] **18** `principle-prove-it-works` — 拿**真实产物**验证：跑功能、读实际值、看 diff；不看代理指标、不看自我报告、不看「能编译」。
- [ ] **19** `principle-fix-root-causes` — 先复现，再一路问 why 到根因；拒绝用 nil 检查把崩溃静音。
- [ ] **20** `principle-sequence-verifiable-units` — 把工作切成每个都终结于可验证状态的小单元，逐个验再往下。

**委派**

- [ ] **21** `principle-guard-the-context-window` — 大输出、长文件、重复读、扇出规划交给子智能体；主线程只留摘要。
- [ ] **22** `principle-never-block-on-the-human` — 可逆的活直接做、事后给人纠偏；确认只留给不可逆动作。**这条和本仓 `cwl-direct` 的停手条件是同一问题的两种答案。**

**元**

- [ ] **23** `principle-encode-lessons-in-structure` — 同一条指令写第二遍时，把它变成 lint、元数据、运行时检查或脚本。

## 2. 有独立技能形态的流程

- [ ] **24** `skills/architect/SKILL.md` — 写代码前先定类型、签名、模块形状，实现期间人保持在回路里。与本仓「先 spec 后 ticket」互补：它只定**代码形状**，不定需求。
- [ ] **25** `skills/interrogate/SKILL.md` — 拿 diff 让多个评审者从独立角度拆。是本仓 `cwl-code-review` 的对照物：那边两轴（标准 / spec），这边多模型独立视角。
- [ ] **26** `skills/arena/SKILL.md` — 同一任务并行 N 个候选，选一个做底，把输家的强处移植进来。
- [ ] **27** `skills/how/SKILL.md` — 解释子系统怎么工作：Overview / Key Concepts / How It Works / Where Things Live / Gotchas，复杂问题拆 2–4 个并行探索视角。
- [ ] **28** `skills/why/SKILL.md` — 为什么长这样：运行时发现可用 MCP，并行查询版本控制、issue、文档、聊天、可观测、错误追踪、分析仓。
- [ ] **29** `skills/figure-it-out/SKILL.md` — 没有现成 playbook 时的兜底：设计一份可审计的手册，跑假设回路，用 `show-me-your-work` 记决策。
- [ ] **30** `skills/show-me-your-work/SKILL.md` — 一行一个决策的 TSV 决策痕迹（what / why / evidence / result），可提交给评审者。
- [ ] **31** `skills/tdd/SKILL.md` — 只在这一步的测试路径便宜且本地时用；路径不清、昂贵、集成重时跳过。**明确的「TDD 不是万能」立场。**
- [ ] **32** `skills/reflect/SKILL.md` — 一段活干完，三个并行评审者读当前会话，把学到的落到某份既有技能的**具体改动**上。
- [ ] **33** `skills/unslop/SKILL.md` — 去掉 AI 腔。与本仓 `cwl-doc-quality` 是同一问题的两种切法。
- [ ] **34** `skills/typescript-best-practices/SKILL.md` — 把 `type-system-discipline` 落到 TS 语法。
- [ ] **35** `skills/automate-me/SKILL.md` — 从会话记录里挖出用户的真实工作方式，起草一份 `<名字>-mode` 技能。

## 与本仓的关系（读之前先记住这几处冲突）

| 本仓 | pstack | 冲突点 |
|---|---|---|
| 先 spec，后 ticket（`cwl-to-plan`） | 不信计划，「最好的 spec 是代码」 | 正面相反。取其「什么情况下计划是浪费」，不取其结论 |
| `cwl-code-review` 两轴 | `interrogate` 多模型独立拆解 | 一个按维度分，一个按模型分 |
| 盘问到决策收敛（`cwl-grilling`） | `never-block-on-the-human` | 可逆的活直接做 vs 先把决策问清 |
| `cwl-direct` 停手条件 | 同上 | 它的门槛更松：只有不可逆才确认 |
| `cwl-tdd` 红绿循环 | `tdd` 有明确的能力边界 | 它更愿意说「这里不值得做测试」 |
