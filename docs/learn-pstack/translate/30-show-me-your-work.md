## 30 Show Me Your Work

> 译自 `reference/poteto-plugins/pstack/skills/show-me-your-work/SKILL.md`（原文 82 行）。另附两件配套：`references/decision-log-template.tsv`（表头行）与 `scripts/log.sh`（追加一行的辅助脚本），一并译注在末尾。

**frontmatter**

- `name`: `show-me-your-work`
- `description`: `Keep a reviewable decision trail for long-running or unattended work: a TSV log with one row per decision (what, why, evidence, result). Local by default; commit it when a reviewer needs the trail to trust the result. Use for /show-me-your-work, autonomous or multi-phase runs, or work a human reviews after stepping away.`（为长时间运行或无人值守的工作留一份可评审的决策痕迹：一份 TSV 日志，一行一个决策（是什么、为什么、证据、结果）。默认只在本地；当评审者需要靠这份痕迹才能信任结果时才提交。用于 /show-me-your-work、自主运行或多阶段运行，或人离开一段后回来评审的工作。）
- `disable-model-invocation`: `true`

---

# Show me your work

对于事后才由人评审的工作，一份决策痕迹（decision trail）让人能重建「决定了什么、为什么、凭的是什么证据」——不必重跑那遍工作，也不必通读整份对话记录。**保持一份唯一的日志**，这样痕迹前后一致，未来的 agent 也找得到。

## 格式

一个 TSV 文件，一行一个决策。之所以用 TSV，是因为 GitHub 会把它渲染成可排序的表格，`column -s$'\t' -t` 和电子表格都能读，追加一行只需一条命令。单元格保持单行。证据是一个指针，不是一段文字。

把 `references/decision-log-template.tsv`（表头行）复制一份，作为干净的日志起点。列定义：

- **ts。** ISO8601 时间戳。时间轴。
- **phase。** 阶段或工作流。
- **decision。** 选了什么或做了什么，一行。
- **why。** 理由，用大白话说。若有某条原则驱动，就直白说出它（`explored options first, this was a one-way door`），不要写成术语标签。
- **evidence。** 能证明它的链接或路径：commit SHA、PR 编号、`file:line`，或某份产物、trace、截图的路径。**永远不是一段文字**。
- **result。** 结果或断言状态：`tests green`、`reverted`、`pixel-diff 0`、`INCONCLUSIVE`、`open`。

一个例子，措辞平实，让评审者一眼读完。**仅作示意；不要把这些行抄进真实的日志。**

```
ts	phase	decision	why	evidence	result
2026-05-24T09:02:00Z	frame	counted the work first, about 100 components and roughly 75 hours	wanted to know the size before starting a long run	commit 3a9f1c2	found 5 things to sort out before starting
2026-05-24T09:40:00Z	harness	took screenshots of the old version before changing anything	so we can compare old against new and catch any visual change	scripts/snapshot.sh, baseline/	saved 120 reference screenshots
2026-05-24T11:15:00Z	widget	moved the widget styles over without changing how it looks	keep the change small and the result identical	commit 7c21e0a, pixel-diff 0	looks identical, tests pass
2026-05-24T12:30:00Z	widget	threw out a helper's work because its screenshots were blank	checked the real files instead of trusting its summary	worktree reset	reverted, tightened the instructions for next time
```

## 记录一行

每条都按「你会怎么向队友口述这件事」来写。平实的词、具体的动作，不用 AI 腔，不用抽象行话（**unslop** 技能同样适用于日志文字）。评审者读每一行都不该需要解码。

用辅助脚本让行保持格式正确：`scripts/log.sh <logfile> <phase> <decision> <why> <evidence> <result>`。它会盖时间戳、在首次使用时写入表头、剥掉多余的制表符与换行，并给任何以 `=`、`+`、`-`、`@` 开头的单元格补一个单引号——这样评审者用电子表格打开日志时不会触发公式执行。裸 `printf` 追加一行也行，但要留意同样的字节问题，尤其是单元格内容来自生成文本或用户输入时。

**记决策点与检查点，不记每一个动作**：选定的某个分叉、某个单元完成时的验证结果、某次转向或回滚及其触发点、暴露出来的阻碍、被修补的关卡。循环运行时，每轮迭代记一行。琐碎的和不言自明的跳过。

## 它放在哪

默认情况下日志是工作产物，**不提交**。放在工作目录的 `decisions.tsv`，或多个工作并行时放在 `.audit/<task-slug>.tsv`，并把它排除在 git 之外。大多数工作不需要一份被提交的痕迹；本地日志仍然让这轮工作保持诚实，做完就可以丢掉。

只有当工作足够浩大、评审者必须靠这份痕迹才能信任结果时才提交它：一次大规模跨语言移植，一次数周的迁移，任何「信心必须被展示，而不是被假定」的场合。被提交的日志在 PR 里会渲染成表格。

## 规则

- 一行就是一个决策或检查点。若它一行放不下，说明这个决策本身还没想清楚。
- **只追加**。判断错了就新写一行取代它。永远不改、不删历史。
- 证据优先来自被提交的脚本，而不是手工的一次性操作，这样评审者能重跑它（**encode-lessons-in-structure** 原则技能）。

## 用对话记录审这份日志

一轮工作结束、交付之前，检查日志说的是不是真话。读当前工作区 `agent-transcripts/` 目录下这次运行的对话记录（系统提示里写明了该路径）。**不要**在 `~/.cursor/projects/*/` 上做通配搜索；那会读到无关项目的私密对话。拿日志与实际发生的事逐条对照：

- 每一行都对应一个真实动作。掐掉编造的或一厢情愿的条目。
- 每一行的证据都能解析，并且确实显示出这一行声称的东西。
- 一个塑造了这次工作、却没有被记录的分叉、转向或放弃的方案，是一处缺口。补上它。
- 去掉填充。如果没有人会去核查某一行，它就不配占这个位置。

**修改日志，不要修改故事。** 如果实际工作偏离了某一行所声称的，那是那一行错了。

## 对痕迹的跨模型评审

交付之前，**必须**在另一个模型家族上拉起一个子智能体（不能用做这项工作的那个模型家族）。自我评审不是替代品；这里要的就是你自己给不了的新鲜视角。子智能体读审计痕迹与本次运行的对话记录，然后指出用户应当注意什么。不是重做一遍工作，而是扫一遍哪里欠优、哪里有风险。

- 证据薄弱或缺失的决策。
- 被跳过、或被声称做过但对话记录里没有凭据的验证步骤。
- 事后回看显得冒险的选择（过早、范围蔓延、遮住症状）。
- 用户在随手一瞥中会漏掉的缺口。

**每一个产出了痕迹的运行，回复末尾都带一个「Attention」节。** 首行单独写评审者用的模型（`reviewed by <model>`），然后逐条列出每个标记，指向具体的行或时刻。`No flags` 是合法值；模型名不是。自我审计问的是「日志说没说真话」；这一节问的是「即便说了真话，用户仍然该盯着什么」。

## 评审这份痕迹

从上往下读，顺着证据指针走，抽查。被提交的 TSV 在 GitHub 里渲染成表格；`column -s$'\t' -t decisions.tsv` 在终端里渲染。某行的证据解析不出来，或结果未经核实，就是审计在抓一处缺口。

## 组合这个技能

其他技能把它们的审计痕迹路由到这里，而不是自己另造一份。**按名字引用它**，让格式归它管；不要重述那些列。

---

## 附一：`references/decision-log-template.tsv`

```
ts	phase	decision	why	evidence	result
```

## 附二：`scripts/log.sh`

```bash
#!/usr/bin/env bash
# Append a well-formed row to a show-me-your-work decision log (TSV).
# Usage: log.sh <logfile> <phase> <decision> <why> <evidence> <result>
set -euo pipefail

if [ "$#" -ne 6 ]; then
	printf 'usage: log.sh <logfile> <phase> <decision> <why> <evidence> <result>\n' >&2
	exit 1
fi

logfile="$1"
shift

logdir="$(dirname "$logfile")"
if [ -n "$logdir" ] && [ "$logdir" != "." ] && [ ! -d "$logdir" ]; then
	mkdir -p "$logdir"
fi

if [ ! -f "$logfile" ]; then
	printf 'ts\tphase\tdecision\twhy\tevidence\tresult\n' > "$logfile"
fi

ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
# Strip tabs/newlines/CR so cells stay on one line, and prefix any cell
# whose first char a spreadsheet would parse as a formula (=, +, -, @)
# with a single quote. The skill expects this log to be read in
# spreadsheets, so attacker-controlled evidence (PR titles, filenames,
# generated text) must not become formula execution when a reviewer
# opens the file.
clean() {
	local v
	v=$(printf '%s' "$1" | tr '\t\n\r' '   ')
	case "$v" in
		=*|+*|-*|@*) printf "'%s" "$v" ;;
		*) printf '%s' "$v" ;;
	esac
}
printf '%s\t%s\t%s\t%s\t%s\t%s\n' \
	"$ts" "$(clean "$1")" "$(clean "$2")" "$(clean "$3")" "$(clean "$4")" "$(clean "$5")" \
	>> "$logfile"
```
