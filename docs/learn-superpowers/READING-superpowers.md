# Superpowers 阅读路线

范围：`reference/superpowers/`。**只读，不改**（上游 94% PR 拒绝率，且这里只是取材）。
路径均相对 `reference/superpowers/`。编号 = 读序，按编号读；想按文件夹翻，见文末「按目录速查」。

## 0. 先装地图（两个文件，读完再往下）

- [x] **01** `README.md` — 只读四节：`How it works` / `The Basic Workflow` / `What's Inside` / `Philosophy`。安装、Harness、社区、遥测全部跳过。
- [x] **02** `skills/using-superpowers/SKILL.md` — 全域入口，65 行。看三件事：技能**如何被触发**（frontmatter 的 `description` 就是路由条件）、进程技能优先于实现技能、Red Flags 反诡辩表。这三件事正是 Lodestar 要解决的。

## 1. 主干七步（核心，按流程顺序读，不要按目录读）

- [x] **03** `skills/brainstorming/SKILL.md` — 提问法：怎么把模糊需求逼成设计。全套最值得抄的一篇。
- [x] **04** `skills/brainstorming/spec-document-reviewer-prompt.md` — 设计文档的评审提示词，很短。
- [x] **05** `skills/using-git-worktrees/SKILL.md` — 隔离工作区，含「先征求同意」的写法。
- [x] **06** `skills/writing-plans/SKILL.md` — 任务切到 2–5 分钟一粒，每粒自带确切路径 + 完整代码 + 验证步骤。
- [x] **07** `skills/subagent-driven-development/SKILL.md` — 最重的一篇（32KB）。每任务派新 subagent，两段式评审。
- [ ] **08** ├ `implementer-prompt.md` — 派给执行者的提示词
- [ ] **09** ├ `task-reviewer-prompt.md` — 评审者提示词
- [ ] **10** └ `re-review-prompt.md` — 返工后复审
- [ ] **11** `skills/executing-plans/SKILL.md` — **对照 07 读**：同一份计划的廉价路线（单 context 内联执行 + 最后一次性评审）。两种路线并存是刻意的取舍。
- [ ] **12** `skills/test-driven-development/SKILL.md` — RED-GREEN-REFACTOR，含「写测试前先删实现」的强制手法。
- [ ] **13** `skills/test-driven-development/writing-good-tests.md` — 什么算好测试。
- [ ] **14** `skills/requesting-code-review/SKILL.md` — 送审前的自检清单。
- [ ] **15** `skills/requesting-code-review/code-reviewer.md` — 评审角色提示词。
- [ ] **16** `skills/receiving-code-review/SKILL.md` — 怎么接评审意见（对应你环境里的同名技能）。
- [ ] **17** `skills/finishing-a-development-branch/SKILL.md` — 收尾：合并 / PR / 保留 / 丢弃。

> 这一层约 170KB 正文，够一个下午的密集阅读。**读完这 17 项，Superpowers 的骨架就完整了**，剩下的都是补丁与横向能力。

## 2. 横向能力（主干之外的独立技法）

- [ ] **18** `skills/systematic-debugging/SKILL.md` — 四阶段定位根因。
- [ ] **19** ├ `root-cause-tracing.md`
- [ ] **20** ├ `defense-in-depth.md`
- [ ] **21** └ `condition-based-waiting.md`（测试里的等待怎么写）
- [ ] **22** `skills/verification-before-completion/SKILL.md` — 只有 3.6KB：「真的修好了吗」的证据要求。
- [ ] **23** `skills/dispatching-parallel-agents/SKILL.md` — 并行派发，独立性判据。
- [ ] **24** `skills/writing-skills/SKILL.md` — 元技能：怎么写技能。**Lodestar 每一条「法」都要过这套标准，必读。**
- [ ] **25** ├ `persuasion-principles.md` — 为什么技能文案要写成那样才管得住 agent。
- [ ] **26** ├ `testing-skills-with-subagents.md` — 用 subagent 做对抗压测。
- [ ] **27** └ `anthropic-best-practices.md`（选读，46KB）— 官方指南。注意作者在 `AGENTS.md` 里明确说**不按它改**，读的时候当对照组看。
- [ ] **28** `skills/diagnosing-superpowers/SKILL.md` — 元技能：会话出问题时怎么取证归因。（可选，但和你手上这套技能同源）
- [ ] **29** `skills/brainstorming/visual-companion.md` — 可选：把设计稿渲染到浏览器。想看交互范式再读。

## 3. 设计稿：为什么是这样（`docs/superpowers/specs/`）

skills 是结论，这些是作者的决策过程与实测数据。**只在想深挖某个机制时读**，不必按序。

- [ ] **30** `2026-06-10-positive-instruction-redesign-design.md` — 「正面指令」改写：为什么少写「不要」。
- [ ] **31** `2026-04-06-worktree-rototill-design.md` — worktree 技能改成「探测到就交给平台」。
- [ ] **32** `2026-06-09-sdd-task-scoped-review-dispatch-design.md` — 评审派发范围的演进。
- [ ] **33** `2026-07-06-sdd-plan-scoped-workspace.md` — 状态账本（ledger）放在哪。
- [ ] **34** `2026-07-06-sdd-plan-scoped-workspace-eval-results.md` — 上面那篇的实测结果，含反例设计。
- [ ] **35** `2026-07-15-sdd-fix-loop-redesign-design.md` — 返工循环的重做。
- [ ] **36** `2026-06-10-strict-cost-sdd-design.md` — 省钱模式，对应「是否随任务降级」这个你关心的问题。
- [ ] **37** `2026-01-22-document-review-system-design.md` — 文档评审系统。
- [ ] **38** `2026-08-27-diagnosing-superpowers-design.md` — 会话诊断技能的设计（76KB plan + 27KB spec）。
- [ ] **39** `2026-05-05-platform-neutral-prose-design.md` — 怎么让技能文案跨 Harness 通用。若 Lodestar 想跨工具，这篇是关键。

## 4. 现在不读（工具性 / 适配层，读了也是负担）

| 类别 | 位置 | 为什么不读 |
|---|---|---|
| 插件外壳 | `.claude-plugin/` `.codex-plugin/` `.cursor-plugin/` `.devin-plugin/` `.hermes-plugin/` `.kimi-plugin/` `.muse-plugin/` `.opencode/` `.pi/` `.agents/` | 各 Harness 的安装与注册配置，与「法」无关 |
| 脚本 | `hooks/` `scripts/` `skills/*/scripts/` `skills/*/references/*-tools.md` | 工具映射与自动化实现（`*-tools.md` 是各平台工具名对照表） |
| 工程配置 | `index.js` `package.json` `gemini-extension.json` `GEMINI.md` `.version-bump.json` `.pre-commit-config.yaml` `tests/` | 插件开发与 CI |
| 平台文档 | `docs/README.kimi.md` `docs/README.opencode.md` `docs/porting-to-a-new-harness.md` `docs/windows/polyglot-hooks.md` `docs/testing.md` | 移植与平台细节 |
| 视觉同伴 | `docs/superpowers/specs/2026-0[236]-*visual*` `2026-03-11-zero-dep-brainstorm-server` | 一个可选功能的实现史 |
| 实现计划 | `docs/plans/**` `docs/superpowers/plans/**` | 与 specs 成对；specs 讲设计，plans 讲怎么改代码。先读 specs 就够 |
| 发布流水 | `RELEASE-NOTES.md`（102KB） | 值得在「想追某次改动」时反查，不值得通读 |
| 贡献规则 | `AGENTS.md` | 只在你想理解它**拒绝什么**时读，反推它的品味 |

## 按目录速查

```
README.md                              → 01
skills/brainstorming/                  → 03 04 (29 可选)
skills/diagnosing-superpowers/         → 28
skills/dispatching-parallel-agents/    → 23
skills/executing-plans/                → 11
skills/finishing-a-development-branch/ → 17
skills/receiving-code-review/          → 16
skills/requesting-code-review/         → 14 15
skills/subagent-driven-development/    → 07 08 09 10
skills/systematic-debugging/           → 18 19 20 21
skills/test-driven-development/        → 12 13
skills/using-git-worktrees/            → 05
skills/using-superpowers/              → 02
skills/verification-before-completion/ → 22
skills/writing-plans/                  → 06
skills/writing-skills/                 → 24 25 26 27
docs/superpowers/specs/                → 30–39
```

## 读的时候盯住这四个问题（为 Lodestar 取材）

1. **触发条件怎么写的** —— 每个 `SKILL.md` 的 frontmatter `description`，这是路由的全部依据。
2. **强制力从哪来** —— 祈使句、Red Flags 表、反合理化清单，各起什么作用。
3. **状态放在哪** —— 哪些信息落盘（设计文档、计划、ledger），哪些留在对话里。
4. **什么时候不降级** —— 作者在 cost 与 rigor 之间怎么选，这是 Lodestar 要自己回答的。
