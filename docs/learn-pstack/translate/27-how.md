## 27 How

> 译自 `reference/poteto-plugins/pstack/skills/how/SKILL.md`（原文 134 行）。frontmatter 按原样保留并附中译。

**frontmatter**

- `name`: `how`
- `description`: `Use for "how does X work", code walkthroughs before changing something, and placement / ownership / layering questions ("where should this live", "which package owns this", "is this the right layer"). Explains subsystem architecture, runtime flow, onboarding mental models. Can critique architecture. Use why for motivation.`（用于「X 是怎么工作的」、改东西之前的代码走读，以及位置 / 归属 / 分层问题——「这块该放哪」「哪个包拥有它」「这是不是对的层」。解释子系统架构、运行时流程、上手心智模型。可以批评架构。要问动机用 `why`。）

---

# How

探索代码库，回答「X 是怎么工作的？」。产出的说明要达到「资深工程师刚接手一个子系统」的水平：够建立可用的心智模型，不做逐行注释的源码。

两种模式：

1. **Explain**（默认）。探索代码库，产出一份清晰的说明。
2. **Critique**。先解释，再拉起多个模型，各自独立找出架构问题。

## Explain 模式

### 第 1 步 理解问题、评估复杂度

拆解用户在问什么：

- 「限流器是怎么工作的？」，一个子系统
- 「按需用量的计费我们怎么处理？」，一条功能流
- 「鉴权服务是怎么组织的？」，一份架构概览
- 「带我走一遍用户提交表单后发生了什么」，一次运行时追踪

界定范围。含糊时，先说出你最佳猜测的解释，再开始探索——**不要问**。猜错了用户会纠正。

**评估复杂度，决定走哪条路：**

- **简单**（单个模块、一个小工具、像「函数 X 怎么工作」这样的窄问题）：跳过探索智能体，由解释者在一次探索里完成讲解。转第 2b 步。
- **复杂**（跨多文件 / 多服务的子系统、横切功能、完整的架构概览）：先并行拉起探索智能体，再交给解释者。转第 2a 步。

拿不准时，**往简单里靠**。解释者撞墙了，随时可以再拉探索者。

### 第 2a 步 探索（仅复杂问题）

把问题拆成 2–4 个并行的探索视角，每个是子系统的不同切片，避免重复劳动。以「限流器是怎么工作的？」为例：

- 探索者 1：数据模型与状态管理
- 探索者 2：请求路径与限额执行
- 探索者 3：配置与指标基础设施

怎么拆取决于问题，用你自己的判断。窄问题两个探索者就够，广的子系统最多四个。

在**同一条消息**里拉起全部探索者：

- `subagent_type`：`generalPurpose`
- `model`：你配置的 how-explorer 模型（默认 `composer-2.5-fast`）
- `readonly`：`true`

每个探索者拿到 `references/explorer-prompt.md` 里的基础提示，外加一条指明其切片的探索角度。每个探索者应当：

- 先铺开：用 Glob 找相关目录，用 Grep 搜关键类型 / 接口 / 类名
- 顺着线追：从一个入口点出发，追调用链（调用方、被调方、数据流、类型定义）
- 读真实代码，别凭文件名猜
- 当它能把从输入到输出（或从触发到效果）的完整路径讲清、每一步都不含糊时停下
- 记下意外之处、不显然之处，以及新人会搞错的地方

每个探索者返回结构化发现：找到的组件、追出的流程、读过的文件、不显然的地方。探索者之间重叠没关系，由解释者去调和。

然后进入第 3 步。

### 第 2b 步 直接解释（仅简单问题）

拉起单个 Task 子智能体，一次完成探索与解释：

- `subagent_type`：`generalPurpose`
- `model`：你配置的 how-explainer 模型（默认 `claude-opus-4-8-thinking-xhigh`）
- `readonly`：`true`

该智能体自己做探索（Glob、Grep、Read），直接写出说明。沟通风格与输出格式见 `references/explainer-prompt.md`。结构与 2a 相同，只是没有探索者的发现作为输入。

进入第 4 步。

### 第 3 步 综合（仅复杂问题）

所有探索者返回后，拉起单个 Task 子智能体，把他们的发现综合成一份连贯的说明：

- `subagent_type`：`generalPurpose`
- `model`：你配置的 how-explainer 模型（默认 `claude-opus-4-8-thinking-xhigh`）
- `readonly`：`true`

解释者拿到全部探索者的发现，写出给人看的说明（输出格式见下）。完整提示模板见 `references/explainer-prompt.md`。解释者负责调和重叠的发现、解决矛盾，把各个切片织成一幅统一的图景。

### 第 4 步 呈现

把解释者的输出呈现给用户。可以做轻微编辑让表达更清楚，或补一点对话里的上下文，但**不要大幅重写**。解释者的沟通本身就是产物。

### 输出格式

按下面的结构组织，根据问题调整。不是每个问题都需要每一节。

**Overview（概览）。** 一到两段：它是什么、做什么、为什么存在。够读者决定要不要读下去。

**Key Concepts（关键概念）。** 重要的类型、服务或抽象，每个给一句简短定义。不求穷尽，只挑理解后文所需的。

**How It Works（它如何工作）。** 说明的核心。把流程走一遍：什么触发它、逐步发生了什么、数据去了哪、决策点在哪。用散文，不要伪代码。引用具体文件与函数让读者能自己去看，但除非某段代码确实必要，不要大段贴代码。

**Where Things Live（东西在哪）。** 相关文件 / 目录的简图。不是每个文件，只是在这个区域开始工作时需要的那些。

**Gotchas（坑）。** 不显然或令人意外、会把人绊倒的地方。解释「为什么这里看起来怪」的历史背景。已知的锋利边缘。

## Critique 模式

用户不只想要理解，还问架构问题、毛病或改进方向时触发。

### 第 1 步 先解释

跑完上面完整的 Explain 流程（第 1–4 步）。必须先理解架构，才有资格批评它。

### 第 2 步 拉起批评者

说明完成后，对配置的 how-critics 列表里的每个模型各拉起一名架构批评者（默认 `claude-opus-4-8-thinking-xhigh`、`gpt-5.5-high-fast`、`composer-2.5-fast`），全部放在同一条消息里。

每名批评者：

- `subagent_type`：`generalPurpose`
- `model`：配置的 how-critics 列表里的一个模型。这些是**最低推理档**；架构值得更深分析时，主智能体应把任一模型往上提档。
- `readonly`：`true`

提示模板见 `references/critic-prompt.md`。每名批评者拿到：

1. 第 1 步的说明（以免他们重新探索）
2. 相关文件路径（以便读真实代码）
3. `references/critique-rubric.md` 里的架构批评评分表

### 第 3 步 主智能体裁决

与 `interrogate` 技能同一套框架。你是务实的负责人，不是汇总器。

把发现分档：

- **Act on（动手）。** 值得现在就修的架构问题
- **Consider（考虑）。** 真实存在的顾虑，但成本 / 收益不清楚
- **Noted（记下）。** 有效的观察，优先级低
- **Dismissed（驳回）。** 错的、缺上下文，或只是风格偏好

先呈现第 1 步的说明，批评裁决放在下面。说明本身应当能独立成立：只想理解系统的人不该被迫读批评。
