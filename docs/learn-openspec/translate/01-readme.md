## 1 openspec README

> 译自 `reference/openspec/README.md`（原文 269 行）。按 `READING-openspec.md` 第 01 项，只译四节：`Our philosophy` / `Why OpenSpec?` / `How we compare` / `Usage Notes`。徽章与图片块、`The most loved spec framework` 折叠块、Stores beta 宣传、Quick Start、Docs 索引、Community schemas、Updating OpenSpec、Contributing、Other（Telemetry / Maintainers）、License 均略去不译。

### 1.1 我们的纲领（Our philosophy）

```text
→ 流体而非僵化（fluid not rigid）
→ 迭代而非瀑布（iterative not waterfall）
→ 简单而非复杂（easy not complex）
→ 为存量项目而生，不只是绿地（built for brownfield not just greenfield）
→ 从个人项目到企业规模都可扩展（scalable from personal projects to enterprises）
```

### 1.2 为什么是 OpenSpec？（Why OpenSpec?）

当需求只活在聊天记录里时，AI 编码助手很强大，却不可预测。OpenSpec 加了一层轻量的 spec 层，让你在写任何代码之前先就把要建什么达成一致。

- **建之前先达成一致** —— 人和 AI 在写代码之前先对齐 spec
- **保持有条理** —— 每个 change 有自己的目录，装着 proposal、specs、design 和 tasks
- **流体地工作** —— 任何时候都能更新任何 artifact，没有僵硬的阶段闸门
- **用你手上的工具** —— 通过 slash command 支持 30 多种 AI 助手

### 1.3 我们如何对比（How we compare）

**对比 [Spec Kit](https://github.com/github/spec-kit)**（GitHub）—— 详尽但笨重。僵硬的阶段闸门、海量 Markdown、Python 环境配置。OpenSpec 更轻，让你自由迭代。

**对比 [Kiro](https://kiro.dev)**（AWS）—— 强大，但你被锁进它的 IDE，且只能用 Claude 系列模型。OpenSpec 配合你已经在用的工具工作。

**对比什么都没有** —— 没有 spec 的 AI 编码意味着模糊的提示词和不可预测的结果。OpenSpec 带来可预测性，而不带来仪式感。

### 1.4 使用须知（Usage Notes）

**模型选择**：OpenSpec 在高推理能力模型上效果最好。规划和实现两个阶段我们都推荐 Codex 5.5 与 Opus 4.7。

**上下文卫生**：OpenSpec 受益于干净的上下文窗口。开始实现之前清空你的上下文，并在整个会话中保持良好的上下文卫生。
