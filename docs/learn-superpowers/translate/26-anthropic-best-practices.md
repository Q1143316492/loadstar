## 26 anthropic-best-practices

> 译自 `reference/superpowers/skills/writing-skills/anthropic-best-practices.md`（原文 1150 行）。全部代码块（含 `theme={null}` 标注与四反引号包裹的嵌套块）、`<Note>` / `<Warning>` / `<Tip>` / `<CardGroup>` 标签、URL 与标签属性按原样保留；源文无 YAML frontmatter，标题下方仅一条引用块。
> 对照 `READING-superpowers.md` 第 27 项。

**技能撰写最佳实践（Skill authoring best practices）**

> 学习如何写出智能体能够发现并成功使用的有效技能。

好的技能是简洁的、结构良好的，并且经过真实使用的检验。本指南给出实用的撰写决策，帮助你写出智能体能够发现并有效使用的技能。

关于技能如何运作的概念性背景，见 [Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)。

### 26.1 核心原则（Core principles）

#### 26.1.1 简洁是关键（Concise is key）

[上下文窗口](https://platform.claude.com/docs/en/build-with-claude/context-windows)是一种公共资源。你的技能与你的智能体需要知道的其他一切共享这个上下文窗口，包括：

* 系统提示词
* 对话历史
* 其他技能的元数据
* 你实际的请求

并非技能里的每一个 token 都有即时成本。在启动时，只有所有技能的元数据（名称和描述）会被预加载。智能体只在技能变得相关时才读 SKILL.md，并且只在需要时才读其他文件。不过，在 SKILL.md 里保持简洁仍然重要：一旦智能体加载了它，每一个 token 都在和对话历史及其他上下文竞争。

**默认假设**：智能体已经非常聪明

只添加智能体原本没有的上下文。对每一条信息都提出质疑：

* “智能体真的需要这段解释吗？”
* “我能假定智能体已经知道这件事吗？”
* “这一段对得起它的 token 成本吗？”

**好例子：简洁**（约 50 个 token）：

````markdown  theme={null}
## Extract PDF text

Use pdfplumber for text extraction:

```python
import pdfplumber

with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```
````

**坏例子：过于啰嗦**（约 150 个 token）：

```markdown  theme={null}
## Extract PDF text

PDF (Portable Document Format) files are a common file format that contains
text, images, and other content. To extract text from a PDF, you'll need to
use a library. There are many libraries available for PDF processing, but we
recommend pdfplumber because it's easy to use and handles most cases well.
First, you'll need to install it using pip. Then you can use the code below...
```

简洁的版本假定智能体知道 PDF 是什么、库是怎么工作的。

#### 26.1.2 设定合适的自由度（Set appropriate degrees of freedom）

让具体的程度匹配任务的脆弱性与可变性。

**高自由度**（基于文字的指令）：

适用于：

* 多种做法都成立
* 决策依赖上下文
* 用启发式方法引导做法

例子：

```markdown  theme={null}
## Code review process

1. Analyze the code structure and organization
2. Check for potential bugs or edge cases
3. Suggest improvements for readability and maintainability
4. Verify adherence to project conventions
```

**中等自由度**（带参数的伪代码或脚本）：

适用于：

* 已经存在一种首选模式
* 允许一定程度的变体
* 配置会影响行为

例子：

````markdown  theme={null}
## Generate report

Use this template and customize as needed:

```python
def generate_report(data, format="markdown", include_charts=True):
    # Process data
    # Generate output in specified format
    # Optionally include visualizations
```
````

**低自由度**（特定脚本，参数很少或没有）：

适用于：

* 操作脆弱且容易出错
* 一致性至关重要
* 必须遵循特定顺序

例子：

````markdown  theme={null}
## Database migration

Run exactly this script:

```bash
python scripts/migrate.py --verify --backup
```

Do not modify the command or add additional flags.
````

**类比**：把智能体想象成在一条路上探索的机器人：

* **两侧都是悬崖的窄桥**：只有一条安全的前进方式。给出具体的护栏和确切的指令（低自由度）。例子：必须按确切顺序运行的数据库迁移。
* **没有任何危险的旷野**：许多路径都能通向成功。给出大方向，并信任智能体能找到最佳路线（高自由度）。例子：由上下文决定最佳做法的代码评审。

#### 26.1.3 用你打算使用的所有模型来测试（Test with all models you plan to use）

技能是模型的附加物，因此效果取决于底层模型。用你打算搭配使用的所有模型来测试你的技能。

**按模型划分的测试考量**：

* **Claude Haiku**（快速、经济）：技能提供的指导够不够？
* **Claude Sonnet**（均衡）：技能是否清晰高效？
* **Claude Opus**（推理强大）：技能有没有避免过度解释？

对 Opus 来说完美的东西，对 Haiku 可能需要更多细节。如果你打算在多个模型上使用你的技能，就瞄准那套对所有模型都好用的指令。

### 26.2 技能结构（Skill structure）

<Note>
  **YAML Frontmatter**：SKILL.md 的 frontmatter 需要两个字段：

  * `name` - 人类可读的技能名称（最多 64 个字符）
  * `description` - 一行描述，说明这个技能做什么、什么时候用它（最多 1024 个字符）

  完整的技能结构细节，见 [Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview#skill-structure)。
</Note>

#### 26.2.1 命名约定（Naming conventions）

使用一致的命名模式，让技能更容易被引用和讨论。我们推荐技能名使用**动名词形式**（动词 + -ing），因为它清楚地描述了技能所提供的活动或能力。

**好的命名例子（动名词形式）**：

* “Processing PDFs”
* “Analyzing spreadsheets”
* “Managing databases”
* “Testing code”
* “Writing documentation”

**可接受的替代方案**：

* 名词短语：“PDF Processing”、“Spreadsheet Analysis”
* 动作导向：“Process PDFs”、“Analyze Spreadsheets”

**避免**：

* 含糊的名称：“Helper”、“Utils”、“Tools”
* 过于宽泛：“Documents”、“Data”、“Files”
* 你的技能集合内部模式不一致

一致的命名让下面这些事更容易：

* 在文档和对话里引用技能
* 一眼看懂一个技能是做什么的
* 组织并检索多个技能
* 维护一个专业、内聚的技能库

#### 26.2.2 写有效的描述（Writing effective descriptions）

`description` 字段让技能能被发现，它应该同时包含技能做什么、以及什么时候用它。

<Warning>
  **始终用第三人称写**。描述会被注入系统提示词，视角不一致会导致发现问题。

  * **好：** “Processes Excel files and generates reports”
  * **避免：** “I can help you process Excel files”
  * **避免：** “You can use this to process Excel files”
</Warning>

**要具体，并包含关键词**。同时包含技能做什么，以及什么时候用它的具体触发条件/场景。

每个技能恰好有一个 description 字段。description 对技能选择至关重要：智能体用它从可能 100 多个可用技能里挑出正确的那个。你的描述必须提供足够的细节，让智能体知道什么时候该选这个技能，而 SKILL.md 的其余部分则提供实现细节。

有效的例子：

**PDF Processing 技能：**

```yaml  theme={null}
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
```

**Excel Analysis 技能：**

```yaml  theme={null}
description: Analyze Excel spreadsheets, create pivot tables, generate charts. Use when analyzing Excel files, spreadsheets, tabular data, or .xlsx files.
```

**Git Commit Helper 技能：**

```yaml  theme={null}
description: Generate descriptive commit messages by analyzing git diffs. Use when the user asks for help writing commit messages or reviewing staged changes.
```

避免像下面这样含糊的描述：

```yaml  theme={null}
description: Helps with documents
```

```yaml  theme={null}
description: Processes data
```

```yaml  theme={null}
description: Does stuff with files
```

#### 26.2.3 渐进式披露模式（Progressive disclosure patterns）

SKILL.md 充当一份概览，按需把智能体指向详细材料，就像入职指南里的目录。关于渐进式披露如何运作的解释，见概览里的 [How Skills work](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview#how-skills-work)。

**实用指引：**

* 为获得最佳表现，把 SKILL.md 的正文控制在 500 行以内
* 接近这个上限时，把内容拆到单独的文件里
* 用下面的模式来有效地组织指令、代码和资源

##### 26.2.3.1 可视化概览：从简单到复杂（Visual overview: From simple to complex）

一个基本的技能开始时只有一个 SKILL.md 文件，里面装着元数据和指令：

<img src="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=87782ff239b297d9a9e8e1b72ed72db9" alt="Simple SKILL.md file showing YAML frontmatter and markdown body" data-og-width="2048" width="2048" data-og-height="1153" height="1153" data-path="images/agent-skills-simple-file.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=280&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=c61cc33b6f5855809907f7fda94cd80e 280w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=560&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=90d2c0c1c76b36e8d485f49e0810dbfd 560w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=840&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=ad17d231ac7b0bea7e5b4d58fb4aeabb 840w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=1100&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=f5d0a7a3c668435bb0aee9a3a8f8c329 1100w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=1650&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=0e927c1af9de5799cfe557d12249f6e6 1650w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=2500&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=46bbb1a51dd4c8202a470ac8c80a893d 2500w" />

随着技能成长，你可以捆绑额外的内容，让智能体只在需要时加载：

<img src="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=a5e0aa41e3d53985a7e3e43668a33ea3" alt="Bundling additional reference files like reference.md and forms.md." data-og-width="2048" width="2048" data-og-height="1327" height="1327" data-path="images/agent-skills-bundling-content.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=280&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=f8a0e73783e99b4a643d79eac86b70a2 280w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=560&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=dc510a2a9d3f14359416b706f067904a 560w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=840&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=82cd6286c966303f7dd914c28170e385 840w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=1100&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=56f3be36c77e4fe4b523df209a6824c6 1100w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=1650&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=d22b5161b2075656417d56f41a74f3dd 1650w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=2500&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=3dd4bdd6850ffcc96c6c45fcb0acd6eb 2500w" />

完整的技能目录结构可能长这样：

```
pdf/
├── SKILL.md              # Main instructions (loaded when triggered)
├── FORMS.md              # Form-filling guide (loaded as needed)
├── reference.md          # API reference (loaded as needed)
├── examples.md           # Usage examples (loaded as needed)
└── scripts/
    ├── analyze_form.py   # Utility script (executed, not loaded)
    ├── fill_form.py      # Form filling script
    └── validate.py       # Validation script
```

##### 26.2.3.2 模式 1：带引用文件的高层指南（Pattern 1: High-level guide with references）

````markdown  theme={null}
---
name: PDF Processing
description: Extracts text and tables from PDF files, fills forms, and merges documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
---

# PDF Processing

## Quick start

Extract text with pdfplumber:
```python
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```

## Advanced features

**Form filling**: See [FORMS.md](FORMS.md) for complete guide
**API reference**: See [REFERENCE.md](REFERENCE.md) for all methods
**Examples**: See [EXAMPLES.md](EXAMPLES.md) for common patterns
````

智能体只在需要时才加载 FORMS.md、REFERENCE.md 或 EXAMPLES.md。

##### 26.2.3.3 模式 2：按领域组织（Pattern 2: Domain-specific organization）

对拥有多个领域的技能，按领域组织内容，以避免加载无关的上下文。当用户问到销售指标时，智能体只需要读与销售相关的 schema，而不需要财务或市场数据。这能让 token 用量保持低位，让上下文保持聚焦。

```
bigquery-skill/
├── SKILL.md (overview and navigation)
└── reference/
    ├── finance.md (revenue, billing metrics)
    ├── sales.md (opportunities, pipeline)
    ├── product.md (API usage, features)
    └── marketing.md (campaigns, attribution)
```

````markdown SKILL.md theme={null}
# BigQuery Data Analysis

## Available datasets

**Finance**: Revenue, ARR, billing → See [reference/finance.md](reference/finance.md)
**Sales**: Opportunities, pipeline, accounts → See [reference/sales.md](reference/sales.md)
**Product**: API usage, features, adoption → See [reference/product.md](reference/product.md)
**Marketing**: Campaigns, attribution, email → See [reference/marketing.md](reference/marketing.md)

## Quick search

Find specific metrics using grep:

```bash
grep -i "revenue" reference/finance.md
grep -i "pipeline" reference/sales.md
grep -i "api usage" reference/product.md
```
````

##### 26.2.3.4 模式 3：条件化细节（Pattern 3: Conditional details）

先展示基础内容，再链接到进阶内容：

```markdown  theme={null}
# DOCX Processing

## Creating documents

Use docx-js for new documents. See [DOCX-JS.md](DOCX-JS.md).

## Editing documents

For simple edits, modify the XML directly.

**For tracked changes**: See [REDLINING.md](REDLINING.md)
**For OOXML details**: See [OOXML.md](OOXML.md)
```

智能体只在用户需要那些功能时才读 REDLINING.md 或 OOXML.md。

#### 26.2.4 避免深层嵌套的引用（Avoid deeply nested references）

当文件是从其他被引用的文件里被引用时，智能体可能会只读一部分。遇到嵌套引用时，智能体可能会用 `head -100` 这类命令预览内容，而不是读完整文件，结果拿到不完整的信息。

**让引用距离 SKILL.md 只有一层深**。所有引用文件都应该直接从 SKILL.md 链接过去，以确保智能体在需要时读到完整的文件。

**坏例子：太深**：

```markdown  theme={null}
# SKILL.md
See [advanced.md](advanced.md)...

# advanced.md
See [details.md](details.md)...

# details.md
Here's the actual information...
```

**好例子：一层深**：

```markdown  theme={null}
# SKILL.md

**Basic usage**: [instructions in SKILL.md]
**Advanced features**: See [advanced.md](advanced.md)
**API reference**: See [reference.md](reference.md)
**Examples**: See [examples.md](examples.md)
```

#### 26.2.5 用目录来组织较长的引用文件（Structure longer reference files with table of contents）

对超过 100 行的引用文件，在顶部加一份目录。这能确保智能体即使只做部分读取、只是在预览，也能看到可用信息的完整范围。

**例子**：

```markdown  theme={null}
# API Reference

## Contents
- Authentication and setup
- Core methods (create, read, update, delete)
- Advanced features (batch operations, webhooks)
- Error handling patterns
- Code examples

## Authentication and setup
...

## Core methods
...
```

随后智能体就可以读完整文件，或按需跳到特定章节。

关于这种基于文件系统的架构如何实现渐进式披露的细节，见下文「进阶」部分里的 [Runtime environment](#runtime-environment) 一节。

### 26.3 工作流与反馈回路（Workflows and feedback loops）

#### 26.3.1 用工作流处理复杂任务（Use workflows for complex tasks）

把复杂的操作拆成清晰、顺序分明的步骤。对特别复杂的工作流，提供一份清单，让智能体可以把它复制进回复里，边推进边打勾。

**例子 1：研究综合工作流**（面向不含代码的技能）：

````markdown  theme={null}
## Research synthesis workflow

Copy this checklist and track your progress:

```
Research Progress:
- [ ] Step 1: Read all source documents
- [ ] Step 2: Identify key themes
- [ ] Step 3: Cross-reference claims
- [ ] Step 4: Create structured summary
- [ ] Step 5: Verify citations
```

**Step 1: Read all source documents**

Review each document in the `sources/` directory. Note the main arguments and supporting evidence.

**Step 2: Identify key themes**

Look for patterns across sources. What themes appear repeatedly? Where do sources agree or disagree?

**Step 3: Cross-reference claims**

For each major claim, verify it appears in the source material. Note which source supports each point.

**Step 4: Create structured summary**

Organize findings by theme. Include:
- Main claim
- Supporting evidence from sources
- Conflicting viewpoints (if any)

**Step 5: Verify citations**

Check that every claim references the correct source document. If citations are incomplete, return to Step 3.
````

这个例子展示了工作流如何应用于不需要代码的分析类任务。清单模式对任何复杂的多步流程都适用。

**例子 2：PDF 表单填写工作流**（面向含代码的技能）：

````markdown  theme={null}
## PDF form filling workflow

Copy this checklist and check off items as you complete them:

```
Task Progress:
- [ ] Step 1: Analyze the form (run analyze_form.py)
- [ ] Step 2: Create field mapping (edit fields.json)
- [ ] Step 3: Validate mapping (run validate_fields.py)
- [ ] Step 4: Fill the form (run fill_form.py)
- [ ] Step 5: Verify output (run verify_output.py)
```

**Step 1: Analyze the form**

Run: `python scripts/analyze_form.py input.pdf`

This extracts form fields and their locations, saving to `fields.json`.

**Step 2: Create field mapping**

Edit `fields.json` to add values for each field.

**Step 3: Validate mapping**

Run: `python scripts/validate_fields.py fields.json`

Fix any validation errors before continuing.

**Step 4: Fill the form**

Run: `python scripts/fill_form.py input.pdf fields.json output.pdf`

**Step 5: Verify output**

Run: `python scripts/verify_output.py output.pdf`

If verification fails, return to Step 2.
````

清晰的步骤能防止智能体跳过关键的校验。这份清单帮助你本人和智能体一起跟踪多步工作流的进度。

#### 26.3.2 实现反馈回路（Implement feedback loops）

**常见模式**：跑校验器 → 修错误 → 重复

这个模式能大幅提升输出质量。

**例子 1：风格指南合规**（面向不含代码的技能）：

```markdown  theme={null}
## Content review process

1. Draft your content following the guidelines in STYLE_GUIDE.md
2. Review against the checklist:
   - Check terminology consistency
   - Verify examples follow the standard format
   - Confirm all required sections are present
3. If issues found:
   - Note each issue with specific section reference
   - Revise the content
   - Review the checklist again
4. Only proceed when all requirements are met
5. Finalize and save the document
```

这展示了用参考文档代替脚本的校验回路模式。「校验器」是 STYLE\_GUIDE.md，智能体通过阅读和比较来执行检查。

**例子 2：文档编辑流程**（面向含代码的技能）：

```markdown  theme={null}
## Document editing process

1. Make your edits to `word/document.xml`
2. **Validate immediately**: `python ooxml/scripts/validate.py unpacked_dir/`
3. If validation fails:
   - Review the error message carefully
   - Fix the issues in the XML
   - Run validation again
4. **Only proceed when validation passes**
5. Rebuild: `python ooxml/scripts/pack.py unpacked_dir/ output.docx`
6. Test the output document
```

校验回路能及早抓住错误。

### 26.4 内容指引（Content guidelines）

#### 26.4.1 避免有时效性的信息（Avoid time-sensitive information）

不要包含会过时的信息：

**坏例子：有时效性**（会变得不正确）：

```markdown  theme={null}
If you're doing this before August 2025, use the old API.
After August 2025, use the new API.
```

**好例子**（使用「旧模式」一节）：

```markdown  theme={null}
## Current method

Use the v2 API endpoint: `api.example.com/v2/messages`

## Old patterns

<details>
<summary>Legacy v1 API (deprecated 2025-08)</summary>

The v1 API used: `api.example.com/v1/messages`

This endpoint is no longer supported.
</details>
```

「旧模式」一节提供了历史背景，又不会弄乱主体内容。

#### 26.4.2 使用一致的术语（Use consistent terminology）

选定一个词，并在整个技能里一直用它：

**好 - 一致**：

* 始终用“API endpoint”
* 始终用“field”
* 始终用“extract”

**坏 - 不一致**：

* 混用“API endpoint”、“URL”、“API route”、“path”
* 混用“field”、“box”、“element”、“control”
* 混用“extract”、“pull”、“get”、“retrieve”

一致性帮助智能体理解并遵循指令。

### 26.5 常见模式（Common patterns）

#### 26.5.1 模板模式（Template pattern）

为输出格式提供模板。让严格程度匹配你的需要。

**用于严格要求**（比如 API 响应或数据格式）：

````markdown  theme={null}
## Report structure

ALWAYS use this exact template structure:

```markdown
# [Analysis Title]

## Executive summary
[One-paragraph overview of key findings]

## Key findings
- Finding 1 with supporting data
- Finding 2 with supporting data
- Finding 3 with supporting data

## Recommendations
1. Specific actionable recommendation
2. Specific actionable recommendation
```
````

**用于灵活指引**（当允许变通有用时）：

````markdown  theme={null}
## Report structure

Here is a sensible default format, but use your best judgment based on the analysis:

```markdown
# [Analysis Title]

## Executive summary
[Overview]

## Key findings
[Adapt sections based on what you discover]

## Recommendations
[Tailor to the specific context]
```

Adjust sections as needed for the specific analysis type.
````

#### 26.5.2 例子模式（Examples pattern）

对输出质量取决于看到例子的技能，就像在普通提示里那样提供输入/输出对：

````markdown  theme={null}
## Commit message format

Generate commit messages following these examples:

**Example 1:**
Input: Added user authentication with JWT tokens
Output:
```
feat(auth): implement JWT-based authentication

Add login endpoint and token validation middleware
```

**Example 2:**
Input: Fixed bug where dates displayed incorrectly in reports
Output:
```
fix(reports): correct date formatting in timezone conversion

Use UTC timestamps consistently across report generation
```

**Example 3:**
Input: Updated dependencies and refactored error handling
Output:
```
chore: update dependencies and refactor error handling

- Upgrade lodash to 4.17.21
- Standardize error response format across endpoints
```

Follow this style: type(scope): brief description, then detailed explanation.
````

比起只有描述，例子能帮助智能体更清楚地理解想要的风格和细节程度。

#### 26.5.3 条件工作流模式（Conditional workflow pattern）

引导智能体走过决策点：

```markdown  theme={null}
## Document modification workflow

1. Determine the modification type:

   **Creating new content?** → Follow "Creation workflow" below
   **Editing existing content?** → Follow "Editing workflow" below

2. Creation workflow:
   - Use docx-js library
   - Build document from scratch
   - Export to .docx format

3. Editing workflow:
   - Unpack existing document
   - Modify XML directly
   - Validate after each change
   - Repack when complete
```

<Tip>
  如果工作流变得很大或很复杂、步骤很多，可以考虑把它们推入单独的文件，并告诉智能体根据手头的任务去读相应的文件。
</Tip>

### 26.6 评测与迭代（Evaluation and iteration）

#### 26.6.1 先建评测（Build evaluations first）

**在写大量文档之前先创建评测。** 这能确保你的技能解决的是真实问题，而不是为你想象出来的问题写文档。

**评测驱动开发：**

1. **找出缺口**：在没有技能的情况下，让你的智能体跑有代表性的任务。记录具体的失败或缺失的上下文
2. **创建评测**：构建三个场景来测试这些缺口
3. **建立基线**：在没有技能的情况下测量智能体的表现
4. **写最小指令**：只写足够补齐缺口、通过评测的内容
5. **迭代**：执行评测，与基线比较，然后改进

这个做法确保你解决的是实际问题，而不是去满足那些可能永远不会出现的需求。

**评测结构**：

```json  theme={null}
{
  "skills": ["pdf-processing"],
  "query": "Extract all text from this PDF file and save it to output.txt",
  "files": ["test-files/document.pdf"],
  "expected_behavior": [
    "Successfully reads the PDF file using an appropriate PDF processing library or command-line tool",
    "Extracts text content from all pages in the document without missing any pages",
    "Saves the extracted text to a file named output.txt in a clear, readable format"
  ]
}
```

<Note>
  这个例子展示了一个数据驱动的评测，带一份简单的测试评分标准。我们目前不提供运行这些评测的内置方式。用户可以自建评测系统。评测是你衡量技能有效性的唯一事实来源。
</Note>

#### 26.6.2 与智能体一起迭代开发技能（Develop Skills iteratively with the agent）

最有效的技能开发过程会把智能体本身卷进来。与一个实例（“Agent A”）一起创建一个将被其他实例（“Agent B”）使用的技能。Agent A 帮你设计和打磨指令，而 Agent B 在真实任务中测试它们。这之所以可行，是因为底层模型既懂怎么写有效的智能体指令，也懂智能体需要什么信息。

**创建一个新技能：**

1. **在没有技能的情况下完成一个任务**：用普通提示和 Agent A 一起处理一个问题。在做的过程中，你会自然地提供上下文、解释偏好、分享流程性知识。留意你反复提供的是哪些信息。

2. **找出可复用的模式**：任务完成后，找出你提供的、对将来类似任务有用的那些上下文。

   **例子**：如果你做了一次 BigQuery 分析，你可能提供了表名、字段定义、过滤规则（比如“始终排除测试账号”），以及常见的查询模式。

3. **让 Agent A 创建一个技能**：“创建一个技能，把我们刚用过的这个 BigQuery 分析模式记录下来。包含表 schema、命名约定，以及过滤测试账号的那条规则。”

   <Tip>
     现代智能体天然理解技能的格式和结构。你不需要特殊的系统提示词，也不需要什么“写技能”的技能来获得创建技能的帮助。只要让智能体创建一个技能，它就会生成结构正确、frontmatter 和正文都恰当的 SKILL.md 内容。
   </Tip>

4. **检查简洁性**：检查 Agent A 有没有加上不必要的解释。可以要求：“把关于胜率是什么意思的那段解释删掉——智能体已经知道了。”

5. **改进信息架构**：让 Agent A 更有效地组织内容。例如：“把它整理一下，让表 schema 放在单独的引用文件里。我们以后可能会加更多表。”

6. **在类似任务上测试**：在相关的用例上，用 Agent B（一个加载了该技能的全新实例）使用这个技能。观察 Agent B 是否能找到正确的信息、正确应用规则、成功完成任务。

7. **根据观察迭代**：如果 Agent B 卡住了或漏掉了什么，带着具体细节回到 Agent A：“智能体用这个技能时，忘了按日期过滤 Q4。我们是不是该加一节讲日期过滤模式？”

**迭代已有技能：**

改进技能时，同样的分层模式会继续。你在下面几件事之间交替：

* **与 Agent A 一起工作**（帮你打磨技能的专家）
* **用 Agent B 测试**（用这个技能做真实工作的智能体）
* **观察 Agent B 的行为**，并把见解带回给 Agent A

1. **在真实工作流里使用技能**：给 Agent B（已加载该技能）真实任务，而不是测试场景

2. **观察 Agent B 的行为**：留意它在哪里卡住、在哪里成功、在哪里做出意料之外的选择

   **观察例子**：“当我让 Agent B 出一份分区销售报表时，它写好了查询，却忘了过滤掉测试账号，尽管技能里提到了这条规则。”

3. **回到 Agent A 求改进**：把当前的 SKILL.md 给它，并描述你观察到的现象。可以问：“我注意到我要求出分区报表时 Agent B 忘了过滤测试账号。技能里提到了过滤，但也许它不够显眼？”

4. **审阅 Agent A 的建议**：Agent A 可能会建议重新组织，让规则更显眼；或者用更强的措辞，比如把“always filter”改成“MUST filter”；或者重构工作流那一节。

5. **应用并测试改动**：用 Agent A 的改进更新技能，然后拿类似的请求再和 Agent B 测一遍

6. **根据使用情况重复**：遇到新场景就继续这个“观察—改进—测试”循环。每一次迭代都根据真实的智能体行为改进技能，而不是根据假设。

**收集团队反馈：**

1. 与队友分享技能，并观察他们的使用情况
2. 问：技能是否在预期的时候被激活？指令是否清晰？缺了什么？
3. 吸收反馈，补齐你自己使用模式里的盲点

**为什么这个做法有效**：Agent A 理解智能体的需求，你提供领域专长，Agent B 通过真实使用暴露缺口，而迭代打磨则根据观察到的行为、而不是假设来改进技能。

#### 26.6.3 观察智能体如何穿行技能（Observe how agents navigate Skills）

在你迭代技能时，注意智能体在实践中实际是怎么用它们的。留意：

* **意料之外的探索路径**：智能体读文件的顺序是不是你没预料到的？这可能说明你的结构没有你想的那么直观
* **被漏掉的连接**：智能体是不是没能顺着引用找到重要文件？你的链接可能需要更明确或更显眼
* **对某些章节的过度依赖**：如果智能体反复读同一个文件，考虑那些内容是不是该放进主 SKILL.md
* **被忽略的内容**：如果智能体从不访问某个捆绑文件，它可能是不必要的，或者在主指令里没有被清楚地标示出来

根据这些观察来迭代，而不是根据假设。技能元数据里的 'name' 和 'description' 尤其关键。智能体在决定是否针对当前任务触发技能时就是看它们。确保它们清楚地描述技能做什么、以及什么时候该用。

### 26.7 要避免的反模式（Anti-patterns to avoid）

#### 26.7.1 避免 Windows 风格路径（Avoid Windows-style paths）

路径里始终使用正斜杠，即使在 Windows 上：

* ✓ **好**：`scripts/helper.py`、`reference/guide.md`
* ✗ **避免**：`scripts\helper.py`、`reference\guide.md`

Unix 风格路径在所有平台上都能用，而 Windows 风格路径会在 Unix 系统上导致错误。

#### 26.7.2 避免给出太多选项（Avoid offering too many options）

除非必要，不要给出多种做法：

````markdown  theme={null}
**Bad example: Too many choices** (confusing):
"You can use pypdf, or pdfplumber, or PyMuPDF, or pdf2image, or..."

**Good example: Provide a default** (with escape hatch):
"Use pdfplumber for text extraction:
```python
import pdfplumber
```

For scanned PDFs requiring OCR, use pdf2image with pytesseract instead."
````

### 26.8 进阶：带可执行代码的技能（Advanced: Skills with executable code）

以下各节聚焦于包含可执行脚本的技能。如果你的技能只使用 markdown 指令，跳到 [Checklist for effective Skills](#checklist-for-effective-skills)。

#### 26.8.1 解决问题，而不是把球踢出去（Solve, don't punt）

为技能写脚本时，要处理错误情况，而不是把问题踢给智能体。

**好例子：显式处理错误**：

```python  theme={null}
def process_file(path):
    """Process a file, creating it if it doesn't exist."""
    try:
        with open(path) as f:
            return f.read()
    except FileNotFoundError:
        # Create file with default content instead of failing
        print(f"File {path} not found, creating default")
        with open(path, 'w') as f:
            f.write('')
        return ''
    except PermissionError:
        # Provide alternative instead of failing
        print(f"Cannot access {path}, using default")
        return ''
```

**坏例子：把球踢给智能体**：

```python  theme={null}
def process_file(path):
    # Just fail and let the agent figure it out
    return open(path).read()
```

配置参数也应该有理由、有文档，以避免「巫毒常量」（Ousterhout 定律）。如果你不知道正确的值，智能体又怎么能确定它？

**好例子：自我说明**：

```python  theme={null}
# HTTP requests typically complete within 30 seconds
# Longer timeout accounts for slow connections
REQUEST_TIMEOUT = 30

# Three retries balances reliability vs speed
# Most intermittent failures resolve by the second retry
MAX_RETRIES = 3
```

**坏例子：魔法数字**：

```python  theme={null}
TIMEOUT = 47  # Why 47?
RETRIES = 5   # Why 5?
```

#### 26.8.2 提供工具脚本（Provide utility scripts）

即使你的智能体能自己写脚本，预先做好的脚本也有优势：

**工具脚本的好处**：

* 比生成的代码更可靠
* 省 token（不需要把代码放进上下文）
* 省时间（不需要生成代码）
* 确保各次使用之间保持一致

<img src="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=4bbc45f2c2e0bee9f2f0d5da669bad00" alt="Bundling executable scripts alongside instruction files" data-og-width="2048" width="2048" data-og-height="1154" height="1154" data-path="images/agent-skills-executable-scripts.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=280&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=9a04e6535a8467bfeea492e517de389f 280w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=560&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=e49333ad90141af17c0d7651cca7216b 560w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=840&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=954265a5df52223d6572b6214168c428 840w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=1100&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=2ff7a2d8f2a83ee8af132b29f10150fd 1100w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=1650&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=48ab96245e04077f4d15e9170e081cfb 1650w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=2500&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=0301a6c8b3ee879497cc5b5483177c90 2500w" />

上图展示了可执行脚本如何与指令文件协同工作。指令文件（forms.md）引用该脚本，智能体可以执行它，而无需把它的内容加载进上下文。

**重要区分**：在指令里说清楚智能体应该：

* **执行脚本**（最常见）：“运行 `analyze_form.py` 来提取字段”
* **把它当作参考资料阅读**（用于复杂逻辑）：“字段提取算法见 `analyze_form.py`”

对大多数工具脚本来说，执行是首选，因为它更可靠、更高效。关于脚本执行如何运作的细节，见下文 [Runtime environment](#runtime-environment) 一节。

**例子**：

````markdown  theme={null}
## Utility scripts

**analyze_form.py**: Extract all form fields from PDF

```bash
python scripts/analyze_form.py input.pdf > fields.json
```

Output format:
```json
{
  "field_name": {"type": "text", "x": 100, "y": 200},
  "signature": {"type": "sig", "x": 150, "y": 500}
}
```

**validate_boxes.py**: Check for overlapping bounding boxes

```bash
python scripts/validate_boxes.py fields.json
# Returns: "OK" or lists conflicts
```

**fill_form.py**: Apply field values to PDF

```bash
python scripts/fill_form.py input.pdf fields.json output.pdf
```
````

#### 26.8.3 使用视觉分析（Use visual analysis）

当输入可以被渲染成图像时，让智能体去分析它们：

````markdown  theme={null}
## Form layout analysis

1. Convert PDF to images:
   ```bash
   python scripts/pdf_to_images.py form.pdf
   ```

2. Analyze each page image to identify form fields
3. The agent can see field locations and types visually
````

<Note>
  在这个例子里，你需要自己写 `pdf_to_images.py` 脚本。
</Note>

智能体的视觉能力有助于理解布局和结构。

#### 26.8.4 创建可校验的中间产物（Create verifiable intermediate outputs）

当智能体执行复杂的、开放式的任务时，它们可能犯错。「计划—校验—执行」模式让智能体先用结构化格式写出一份计划，再在执行前用脚本校验这份计划，从而及早抓住错误。

**例子**：设想你让智能体根据一张电子表格更新 PDF 里的 50 个表单字段。没有校验的话，它可能引用不存在的字段、造出互相冲突的值、漏掉必填字段，或者把更新应用错。

**解决方案**：使用上面展示的工作流模式（PDF 表单填写），但增加一个中间的 `changes.json` 文件，在应用改动之前先校验它。工作流变成：分析 → **创建计划文件** → **校验计划** → 执行 → 验证。

**为什么这个模式有效：**

* **及早抓住错误**：校验在改动被应用之前就发现问题
* **可机器校验**：脚本提供客观的验证
* **计划可回退**：智能体可以在不碰原始文件的情况下迭代计划
* **调试清晰**：错误信息直指具体问题

**什么时候用**：批量操作、破坏性改动、复杂的校验规则、高风险操作。

**实现提示**：让校验脚本详细一些，给出具体的错误信息，比如“Field 'signature\_date' not found. Available fields: customer\_name, order\_total, signature\_date\_signed”，以帮助智能体修复问题。

#### 26.8.5 打包依赖（Package dependencies）

技能运行在代码执行环境里，而该环境有平台特有的限制：

* **claude.ai**：可以从 npm 和 PyPI 安装包，也可以从 GitHub 仓库拉取
* **Anthropic API**：没有网络访问，也不能在运行时安装包

在你的 SKILL.md 里列出所需的包，并在[代码执行工具文档](https://platform.claude.com/docs/en/agents-and-tools/tool-use/code-execution-tool)里核实它们可用。

#### 26.8.6 运行环境（Runtime environment）

技能运行在一个具备文件系统访问、bash 命令和代码执行能力的代码执行环境里。关于这套架构的概念性解释，见概览里的 [The Skills architecture](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview#the-skills-architecture)。

**这对你的撰写有什么影响：**

**智能体如何访问技能：**

1. **元数据预加载**：启动时，所有技能 YAML frontmatter 里的 name 和 description 会被加载进系统提示词
2. **文件按需读取**：智能体在需要时用它们的文件读取工具从文件系统访问 SKILL.md 和其他文件
3. **脚本高效执行**：工具脚本可以通过 bash 执行，而不必把完整内容加载进上下文。只有脚本的输出消耗 token
4. **大文件没有上下文代价**：引用文件、数据或文档在被真正读取之前不消耗上下文 token

* **文件路径很重要**：智能体像浏览文件系统一样浏览你的技能目录。使用正斜杠（`reference/guide.md`），不要用反斜杠
* **给文件起描述性的名字**：用能表明内容的名字：`form_validation_rules.md`，而不是 `doc2.md`
* **为发现而组织**：按领域或功能组织目录
  * 好：`reference/finance.md`、`reference/sales.md`
  * 坏：`docs/file1.md`、`docs/file2.md`
* **捆绑完整的资源**：包含完整的 API 文档、大量示例、大数据集；在被访问之前没有上下文代价
* **确定性操作优先用脚本**：写 `validate_form.py`，而不是让智能体生成校验代码
* **把执行意图说清楚**：
  * “运行 `analyze_form.py` 来提取字段”（执行）
  * “提取算法见 `analyze_form.py`”（当作参考资料阅读）
* **测试文件访问模式**：用真实请求测试，验证智能体能否浏览你的目录结构

**例子：**

```
bigquery-skill/
├── SKILL.md (overview, points to reference files)
└── reference/
    ├── finance.md (revenue metrics)
    ├── sales.md (pipeline data)
    └── product.md (usage analytics)
```

当用户问到收入时，智能体读 SKILL.md，看到指向 `reference/finance.md` 的引用，然后调用 bash 只读那一个文件。sales.md 和 product.md 留在文件系统上，在被需要之前消耗零个上下文 token。正是这种基于文件系统的模型实现了渐进式披露。智能体可以浏览，并有选择地只加载每个任务恰好需要的东西。

关于这套技术架构的完整细节，见技能概览里的 [How Skills work](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview#how-skills-work)。

#### 26.8.7 MCP 工具引用（MCP tool references）

如果你的技能使用 MCP（Model Context Protocol）工具，始终使用完全限定的工具名，以避免「tool not found」错误。

**格式**：`ServerName:tool_name`

**例子**：

```markdown  theme={null}
Use the BigQuery:bigquery_schema tool to retrieve table schemas.
Use the GitHub:create_issue tool to create issues.
```

其中：

* `BigQuery` 和 `GitHub` 是 MCP 服务器名
* `bigquery_schema` 和 `create_issue` 是这些服务器里的工具名

没有服务器前缀，智能体可能找不到工具，尤其是在有多个 MCP 服务器可用的时候。

#### 26.8.8 避免假定工具已安装（Avoid assuming tools are installed）

不要假定包已经可用：

````markdown  theme={null}
**Bad example: Assumes installation**:
"Use the pdf library to process the file."

**Good example: Explicit about dependencies**:
"Install required package: `pip install pypdf`

Then use it:
```python
from pypdf import PdfReader
reader = PdfReader("file.pdf")
```"
````

### 26.9 技术说明（Technical notes）

#### 26.9.1 YAML frontmatter 要求（YAML frontmatter requirements）

SKILL.md 的 frontmatter 需要 `name`（最多 64 个字符）和 `description`（最多 1024 个字符）字段。完整的结构细节见 [Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview#skill-structure)。

#### 26.9.2 Token 预算（Token budgets）

为获得最佳表现，把 SKILL.md 正文控制在 500 行以内。如果你的内容超过这个量，就按前面描述的渐进式披露模式把它拆到单独的文件里。架构细节见 [Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview#how-skills-work)。

### 26.10 有效技能检查清单（Checklist for effective Skills）

在分享一个技能之前，核实：

#### 26.10.1 核心质量（Core quality）

* [ ] 描述具体，且包含关键词
* [ ] 描述同时包含技能做什么和什么时候用它
* [ ] SKILL.md 正文在 500 行以内
* [ ] 额外的细节放在单独的文件里（如果需要）
* [ ] 没有时效性信息（或放在「旧模式」一节）
* [ ] 通篇术语一致
* [ ] 例子是具体的，不是抽象的
* [ ] 文件引用只有一层深
* [ ] 渐进式披露使用得当
* [ ] 工作流有清晰的步骤

#### 26.10.2 代码与脚本（Code and scripts）

* [ ] 脚本解决问题，而不是把球踢给智能体
* [ ] 错误处理是显式的、有帮助的
* [ ] 没有「巫毒常量」（所有值都有理由）
* [ ] 指令里列出了所需的包，并核实它们可用
* [ ] 脚本有清晰的文档
* [ ] 没有 Windows 风格路径（全部用正斜杠）
* [ ] 关键操作有校验/验证步骤
* [ ] 对质量至关重要的任务包含反馈回路

#### 26.10.3 测试（Testing）

* [ ] 至少创建了三个评测
* [ ] 用 Haiku、Sonnet 和 Opus 测试过
* [ ] 用真实使用场景测试过
* [ ] 吸收了团队反馈（如果适用）

### 26.11 下一步（Next steps）

<CardGroup cols={2}>
  <Card title="Get started with Agent Skills" icon="rocket" href="https://platform.claude.com/docs/en/agents-and-tools/agent-skills/quickstart">
    创建你的第一个技能
  </Card>

  <Card title="Use Skills in Claude Code" icon="terminal" href="https://code.claude.com/docs/en/skills">
    在 Claude Code 里创建和管理技能
  </Card>

  <Card title="Use Skills with the API" icon="code" href="https://platform.claude.com/docs/en/build-with-claude/skills-guide">
    以编程方式上传和使用技能
  </Card>
</CardGroup>
