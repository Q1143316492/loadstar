## cursor-team-kit verify-this

> 译自 `reference/poteto-plugins/cursor-team-kit/skills/verify-this/SKILL.md`（原文 74 行）。frontmatter 原样保留并附中译。

**frontmatter**

- `name`: `verify-this`
- `description`: `Verify a claim with fresh local evidence: restate it falsifiably, capture baseline and treatment, compare artifacts, and return VERIFIED, NOT VERIFIED, or INCONCLUSIVE.`（用新鲜的本地证据验证一个断言：把它改写成可证伪的形式，采集基线与处理后的结果，比对产物，然后返回「已证实」「未证实」或「无法判定」。）

---

# Verify This

**验证不是复述。** 它要用可重复的证据，证实或否证一个具体的断言。

## 何时用

- 用户说「验证一下」「证明它能工作」「这算修好了吗」「把证据给我看」。
- 一个 bug 修复需要前后复现对比。
- 一个关于 UI、CLI、API、性能或内存的断言需要实测。
- 测试通过了，但用户看得见的行为还需要确认。

**不要**用它来验证「代码更干净了」这种模糊断言。先要一个可度量的断言。

## 流程

1. 把断言改写成**可证伪**的形式：条件、指标、阈值。
2. 挑能推翻它的**最小本地界面**。
3. 从旧状态采集**基线**：merge base、父提交、出问题的分支，或当前复现出来的坏状态。
4. 从改动后的状态采集**处理结果**，用同一条命令、同一份数据、同样的预热、同样的环境。
5. 比对**原始产物**：数字、截图、终端记录、HTTP 响应、性能剖析、堆快照，或测试输出。
6. 只返回一个结论：`VERIFIED`、`NOT VERIFIED` 或 `INCONCLUSIVE`。

## 本地界面

- **代码行为**：聚焦的单元 / 集成测试，或一个最小的复现脚本。
- **CLI / TUI 行为**：`control-cli`、终端记录，或演示录像。
- **UI 行为**：`control-ui`、截图、无障碍树快照，或浏览器 trace。
- **API 行为**：本地 HTTP / RPC 的请求与响应 diff。
- **性能**：同机上的基线 / 处理后计时，或 CPU 剖析。
- **内存**：可疑操作前后的堆快照。

## 产物布局

可以安全落盘时：

```text
/tmp/verify-this/<claim-slug>/
├── claim.md
├── timeline.md
├── baseline/
├── treatment/
├── diff/
└── verdict.md
```

如果产物可能包含敏感代码、提示词、截图、HTTP 响应体或堆数据，只在对话里留最小证据，除非用户同意落盘。

## 判定规则

- `VERIFIED`：基线与处理结果按预测的方向不同，且达到断言给出的阈值，没有明显的混淆因素。
- `NOT VERIFIED`：行为没变、变化方向相反，或没达到阈值。
- `INCONCLUSIVE`：基线无效、信号噪声太大、测量失败，或环境差异让对比失效。

## 输出

用这个形状：

```text
VERIFIED | NOT VERIFIED | INCONCLUSIVE
Claim: <可证伪的断言>

Evidence:
<指标/产物>：baseline=<...>, treatment=<...>, delta=<...>, threshold=<...>

Reasoning:
<一段紧凑的文字，点名证据与任何混淆因素>
```

**不要把负面结果说软。** 一个明确的 `NOT VERIFIED` 就是有用的。
