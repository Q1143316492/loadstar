## 4 using-git-worktrees

> 译自 `reference/superpowers/skills/using-git-worktrees/SKILL.md`（原文 167 行）。frontmatter 与全部 bash 代码块按原样保留。

**frontmatter**

- `name`: `using-git-worktrees`
- `description`: `Use when starting feature work that needs isolation from current workspace or before executing implementation plans - ensures an isolated workspace exists via native tools or git worktree fallback`

### 4.1 概览（Overview）

确保工作在**隔离的工作区**里发生。优先用你所在平台的原生 worktree 工具。只有在没有任何原生工具时，才退回手工 git worktree。

**核心原则：** 先探测是否已被隔离。再用原生工具。最后才退回 git。**绝不跟 Harness 对着干。**

**开始时声明：** “I'm using the using-git-worktrees skill to set up an isolated workspace.”

### 4.2 第 0 步：探测已有隔离（Step 0: Detect Existing Isolation）

**在创建任何东西之前，先检查你是否已经在一个隔离工作区里。**

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

**子模块护栏：** `GIT_DIR != GIT_COMMON` 在 git 子模块里同样成立。在得出「已经在 worktree 里」这个结论之前，先确认自己不在子模块里：

```bash
# If this returns a path, you're in a submodule, not a worktree — treat as normal repo
git rev-parse --show-superproject-working-tree 2>/dev/null
```

**如果 `GIT_DIR != GIT_COMMON`（且不是子模块）：** 你已经在一个链接的工作树里。跳到第 2 步（项目初始化）。**不要**再创建一个 worktree。

带分支状态汇报：

- 在分支上：“Already in isolated workspace at `<path>` on branch `<name>`.”
- 分离头指针（detached HEAD）：“Already in isolated workspace at `<path>` (detached HEAD, externally managed). Branch creation needed at finish time.”

**如果 `GIT_DIR == GIT_COMMON`（或在子模块里）：** 你在一个普通仓库检出里。

用户是否已经在给你的指令里表明了 worktree 偏好？如果没有，**创建 worktree 之前先征求同意**：

> 译文：「要我帮你建一个隔离的 worktree 吗？它能保护你当前的分支不被改动。」
>
> 原文：`"Would you like me to set up an isolated worktree? It protects your current branch from changes."`

如果已有明确声明的偏好，照办、不要问。如果用户拒绝，就**就地工作**并跳到第 2 步。

### 4.3 第 1 步：创建隔离工作区（Step 1: Create Isolated Workspace）

**你有两种机制，按这个顺序尝试。**

#### 4.3.1 原生 worktree 工具（1a，首选）

用户已经要了隔离工作区（第 0 步的同意）。你手上是否已经有创建 worktree 的手段？它可能叫 `EnterWorktree`、`WorktreeCreate`，或是一条 `/worktree` 命令、一个 `--worktree` 参数。有就用它，跳到第 2 步。

原生工具会自动处理目录位置、分支创建和清理。**明明有原生工具却用 `git worktree add`，会造出你的 Harness 看不见、也管不了的幽灵状态。**

只有在没有任何原生 worktree 工具时，才往下走 1b。

#### 4.3.2 Git worktree 兜底（1b）

**只在 1a 不适用时使用**——也就是你没有原生 worktree 工具。此时用 git 手工创建 worktree。

##### 4.3.2.1 目录选择（Directory Selection）

按这个优先级来。**用户明确表达的偏好，永远压过观察到的文件系统状态。**

1. **检查你的指令里有没有声明 worktree 目录偏好。** 用户已经指定了就用它，不要问。
2. **检查项目里是否已有现成的 worktree 目录：**

   ```bash
   ls -d .worktrees 2>/dev/null     # Preferred (hidden)
   ls -d worktrees 2>/dev/null      # Alternative
   ```

   找到就用它。两个都存在时，`.worktrees` 胜出。
3. **没有任何其他指引时**，默认用项目根目录下的 `.worktrees/`。

##### 4.3.2.2 安全校验（Safety Verification，仅限项目内目录）

**创建 worktree 之前必须校验该目录已被忽略：**

```bash
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```

**如果没有被忽略：** 加进 `.gitignore`，提交这次改动，然后继续。

**为什么关键：** 防止把 worktree 的内容误提交进仓库。

##### 4.3.2.3 创建工作树（Create the Worktree）

```bash
# Determine path based on chosen location
path="$LOCATION/$BRANCH_NAME"

git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

**沙箱兜底：** 如果 `git worktree add` 因权限错误失败（沙箱拒绝），告诉用户沙箱拦下了 worktree 创建、你改为在当前目录工作，然后就地跑初始化和基线测试。

### 4.4 第 2 步：项目初始化（Step 2: Project Setup）

自动探测并执行相应初始化：

```bash
# Node.js
if [ -f package.json ]; then npm install; fi

# Rust
if [ -f Cargo.toml ]; then cargo build; fi

# Python
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f pyproject.toml ]; then poetry install; fi

# Go
if [ -f go.mod ]; then go mod download; fi
```

### 4.5 第 3 步：验证干净的基线（Step 3: Verify Clean Baseline）

跑测试，确认工作区是干净起点：

```bash
# Use project-appropriate command
npm test / cargo test / pytest / go test ./...
```

**测试失败：** 汇报失败，问是继续还是先查。

**测试通过：** 汇报就绪。

#### 4.5.1 汇报（Report）

```
Worktree ready at <full-path>
Tests passing (<N> tests, 0 failures)
Ready to implement <feature-name>
```

### 4.6 速查表（Quick Reference）

| 情形 | 动作 |
|---|---|
| 已在链接工作树里 | 跳过创建（第 0 步） |
| 在子模块里 | 当作普通仓库（第 0 步护栏） |
| 有原生 worktree 工具 | 用它（1a） |
| 没有原生工具 | git worktree 兜底（1b） |
| `.worktrees/` 已存在 | 用它（先校验被忽略） |
| `worktrees/` 已存在 | 用它（先校验被忽略） |
| 两者都存在 | 用 `.worktrees/` |
| 两者都不存在 | 查指令文件，再默认 `.worktrees/` |
| 目录未被忽略 | 加进 .gitignore 并提交 |
| 创建时权限错误 | 沙箱兜底，就地工作 |
| 基线测试失败 | 汇报失败并询问 |
| 没有 package.json / Cargo.toml | 跳过依赖安装 |

### 4.7 常见合理化（Common Rationalizations）

| 借口 | 真相 |
|---|---|
| “我显然不在 worktree 里——不用查” | 跑第 0 步。Harness 造的隔离和子模块都能骗过肉眼；检测命令才能定论。 |
| “`git worktree add` 比找原生工具快” | 原生工具（如 `EnterWorktree`）掌管位置、分支和清理。绕过它是头号错误——它会造出 Harness 看不见、管不了的幽灵状态。 |
| “worktree 目录肯定早就被忽略了” | 跑 `git check-ignore`。没被忽略的 worktree 目录会把整棵树提交进仓库。 |
| “目录叫什么都行” | 明确的指令 > 项目里已有的目录 > `.worktrees/` 默认值。 |
| “工作区是新的——基线测试可以等等” | 脏基线会让之后每一次失败都变得无法归因。现在就跑测试；带着失败继续走，是你人类搭档的决定。 |
