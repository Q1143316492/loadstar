# 待读笔记：statechart / TLA+ / 反模式

来源：[`cursor/plugins`](https://github.com/cursor/plugins) 的 `harness/pstack/claude-code/skills/`，2026-11-23 从 GitHub 在线读的。**不在本地存档里**——`reference/poteto-plugins/` 停在 `74dd229`（2026-11-10），`statechart` 是之后新增的。要落地存档得按 [`reference/README.md`](../../reference/README.md) 的「重新拉取」流程重克隆。

这篇只记「是什么、要盯什么」，不搬运原文；细读时直接开上游 `SKILL.md`。

## 1. `statechart` 技能

- 入口：<https://github.com/cursor/plugins/blob/main/harness/pstack/claude-code/skills/statechart/SKILL.md>（另有 `references/render.md` 和 `scripts/statechart.ts`）。
- 一句话：**把「在状态间迁移的系统」写成 TLA+ 规格，用 TLC 跑一遍，再画成 Mermaid statechart**，报告给出到达每条违规状态的最短路径。
- 适用：产品流程、协议、服务里「事件顺序错了就出事」的部分——并发、重试、支付/订单类状态机。
- 流程：写 TLA+ 规格 → 写 view 模块（`state()` 决定状态标签，`step()` 决定箭头文案，`group()`/`colors` 决定配色，`title`）→ 跑 `scripts/statechart SPEC.tla --view ... --out ...` → 读报告 → 交接。
- 运行成本：首次用 `mise` 装 TLC 和 Java，需联网；`statechart.ts` 要 Node 22.18–22.x 或 23.6+ 跑（原生 Windows 用 `node --disable-warning=ExperimentalWarning`）。
- 触发：`disable-model-invocation: true`，只能手打 `/statechart`。
- 配套还有 `create-formal-verification-skill` / `maintain-formal-verification-skill`：给项目生成一个「本地验证技能」，把「哪段代码被哪项检查覆盖、上次核对到哪个 commit」记进去。statechart 是其中 TLA+ 路线指定的结果阅读器。

## 2. TLA+ 与 TLC

- **TLA+**：Lamport 的形式化规格语言。写三样东西——变量（状态）、`Init`（初始状态）、`Next`（迁移，`x'` 是下一步的 x）；再加规则：INVARIANT（每一刻都真）或 PROPERTY（涉及时间，如 `~>` 终将）。
- 它**不执行代码**、没有 I/O。建模的是**设计**（状态、步、规则），不是代码本身。这让它便宜地覆盖代码里很难测到的「顺序」维度，代价是模型可能与代码脱节。
- **TLC**：TLA+ 自带的模型检查器。从 `Init` 广度优先穷举所有可达状态与步序，在每个状态上检查不变量；状态去重，所以反例是**最短路径**。
- 它是**有界穷举**不是证明：通过 = 「这个范围内没找到反例」。状态爆炸是天花板，statechart 靠小常量、`CONSTRAINT`、十万状态上限、500 图状态预算来控制。真要证明是 TLAPS 那一类工具；要验证代码本身（内存安全、溢出）则换 SMT/符号执行的验证器。

## 3. 「反模式」指的是什么

这个词不是 statechart 原文里的章节名，是从它一堆规则里归纳出来的一类错误——**把检查做得一定能通过，或把图做得一定好读**。细读时对着原文核对：

- **照着代码逐行建模**：状态爆炸，且把实现细节当成设计问题。
- **为了让检查通过而放宽规则**：原文原句「Never weaken a rule to make it hold」。同理，发现真实 bug 时只报告，不改业务代码去迁就模型。
- **原子性搞错**：把一个实际会被打断的步骤当成一步走完，正好把要查的竞态藏起来。
- **不设边界**：无限状态空间，TLC 跑不完。原文对应「常量取小，或加 `CONSTRAINT`」。
- **检查从没失败过**：没验证过检查本身能失败，等于没检查。`create-formal-verification-skill` 要求先在故意改坏的版本上跑一遍，必须报错。
- **把模型通过当成系统正确**：模型与代码可能不一致。原文要求把每条 bug 路径回放到真代码上，复现成测试或 live repro；「如果 bug 没复现，先认为模型错了」。
- **模型太细 / 标签太碎**：图超过约 20 个箭头就没人读。原文要求先粗后细合并状态，藏步时保持可达性、保留每个出口、整条箭头一起藏，并在交接里说明藏了哪些。

几条容易被误当成怪癖的规则，其实都是上面这些的防御：终态必须加 no-op 自环（否则 `NoDeadlock` 误报）、`Next` 写成 action 的析取（否则 TLC 每步都叫 `Next`）、并行区域里别用方括号写条件、图上一步不出标签就不画。

## 细读时要回答的问题

- 这套东西值不值得进 Lodestar？`cwl-tdd` / `cwl-code-review` 覆盖的是测试和评审，形式化验证是另一档成本。
- 如果要做，是本仓自带一份（TLA+ 的安装成本、Windows 下的运行方式都要先验），还是只在需要时借用上游技能？
- `statechart` 的「先写规则、再画图、最后把 bug 回放到真代码」这套顺序，有没有可搬进自有技能的纪律（哪怕不碰 TLA+）？
