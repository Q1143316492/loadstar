# 预警判据的默认阈值与「写」的识别

## 问题

判据形状已定（连续只读计数 + 时间窗，任一触发，只软提醒），要钉的是可落地的参数与识别规则：

- 连续只读计数默认取多少（初拟 25 次），时间窗默认多长（初拟 10 分钟），且时间窗内至少多少次工具调用才够格。
- 哪些工具算「只读」：Read / Grep / Glob / WebFetch / WebSearch / Task 之外还有谁（如 Bash 的 `cat`、`ls` 这类纯查询命令算不算）。
- 「写」的识别：Edit / Write / NotebookEdit 之外，Bash 命令里哪些模式算写（`npm install`、`rm`、`git commit`、`mv`、重定向 `>`…）。给一张**宁可漏算不可多算**的匹配表。
- 同一会话重复预警的冷却：多久内不重复亮。
- 阈值放哪（桌宠配置文件），改阈值要不要重启。

票的产出是一份可以直接写进配置默认值与代码常量的表格，不是一段讨论。

类型：grilling
状态：已解决
阻塞于：01

## 答案

### 工具三分类

| 类别 | 工具 | 对连续计数的作用 |
|---|---|---|
| 读 | `Read` `Grep` `Glob` `WebFetch` `WebSearch` `ToolSearch` `Skill` `Agent`/`Task` | **+1** |
| 写 | `Edit` `Write` `NotebookEdit` `AskUserQuestion` | **清零**，并重置时间锚点 |
| 中性 | 其余（`Bash` 由命令模式决定，见下；`TodoWrite`、`ExitPlanMode` 等） | **既不增也不清** |

`AskUserQuestion` 归写：它等于 agent 向用户报了一次进展，而本图的痛点就是「不报进展」。

### 默认阈值

任一成立即预警：

- 连续读 **≥ 25 次**；
- 距时间锚点 **≥ 10 分钟**，且期间工具调用 **≥ 8 次**（防止 agent 只是在慢慢想、根本没在动工具）。

时间锚点 = 会话内最后一次写操作的时刻；会话开始也算一个锚点。三个数值都可配。

### Bash 命令模式

`Bash` 默认**中性**，命中下表才算。模式表数据驱动、单独存一个可编辑文件，加模式不改代码。

- **写**：`rm|del|rmdir|mv|move|cp|copy|mkdir|touch|tee`、重定向 `>`/`>>`、`sed -i`、`git (add|commit|checkout|reset|merge|rebase|stash|rm|mv)`、`(npm|pnpm|yarn|pip|uv) (install|add|remove|uninstall)`、`Set-Content`/`Out-File`。
- **读**：`cat|head|tail|less|type|ls|dir|find|grep|rg|wc|git (status|log|diff|show|branch)`。
- 其余中性。原则：**宁可漏算，不可多算**。

### 冷却

与「解除」同一条件：预警亮起后，直到该会话出现写操作或用户发新消息才复原，**不设额外冷却**。第一版不做「升级式二次提醒」。

### 配置位置与生效

- 桌宠目录下 `pet.config.json`，**每次判定时重读**（缓存 1 秒），改完立即生效。
- `~/.claude/settings.json` 里的钩子配置保持最简，不放阈值。
- 基调：默认值只是起点，全部可调；`Bash` 模式表同样是可编辑数据。

下游约束：配置字段名由 05 状态机与素材契约票与 03 协议票共同收口，本票只定语义与默认值。
