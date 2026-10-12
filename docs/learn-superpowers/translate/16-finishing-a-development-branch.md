## 16 finishing-a-development-branch

> 译自 `reference/superpowers/skills/finishing-a-development-branch/SKILL.md`（原文 225 行）。frontmatter、全部 bash 代码块、以及面向用户的选项/确认菜单的英文原文按原样保留。
> 对照 `READING-superpowers.md` 第 17 项。

**frontmatter**

- `name`: `finishing-a-development-branch`
- `description`: `Use when implementation is complete, all tests pass, and you need to decide how to integrate the work`

### 16.1 概览（Overview）

**核心原则：** 验证测试 → 探测环境 → 呈现选项 → 执行选择 → 清理。

**开始时声明：** “I'm using the finishing-a-development-branch skill to complete this work.”

### 16.2 第 1 步：验证测试（Step 1: Verify Tests）

运行项目的完整测试套件（`npm test` / `cargo test` / `pytest` / `go test ./...`）。

**如果测试失败**，汇报失败并停下——菜单要等测试套件全绿之后才出现：

> 译文：「测试失败（<N> 个失败）。必须先修好才能收尾：
>
> [展示失败]」

原文：

```
Tests failing (<N> failures). Must fix before completing:

[Show failures]
```

**如果测试通过：** 继续第 2 步。

### 16.3 第 2 步：探测环境（Step 2: Detect Environment）

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
# Capture now, while still inside the workspace — Step 5 changes directory
# before cleanup (Step 6) needs this value
WORKTREE_PATH=$(git rev-parse --show-toplevel)
```

这决定了该展示哪套菜单、以及清理如何运作：

| 状态 | 菜单 | 清理 |
|-------|------|---------|
| `GIT_DIR == GIT_COMMON`（普通仓库） | 标准 3 选项 | 没有 worktree 需要清理 |
| `GIT_DIR != GIT_COMMON`，具名分支 | 标准 3 选项 | 基于来源判定（见第 6 步） |
| `GIT_DIR != GIT_COMMON`，分离头指针 | 精简 2 选项（无合并） | 由外部管理——保持原位 |

### 16.4 第 3 步：确定基础分支（Step 3: Determine Base Branch）

基础分支就是这项工作从哪儿分出来的——通常在计划、对话或该分支的上游里写着名字。如果它还不明确，就问：

> 译文：「这个分支是从 <你最好的猜测> 分出来的——对吗？」
>
> 原文：`"This branch split from <your best guess> - is that correct?"`

合并之前先确认：合错基础分支，收场很贵。

### 16.5 第 4 步：呈现选项（Step 4: Present Options）

**普通仓库和具名分支的 worktree——恰好呈现这 3 个选项：**

> 译文：「实现已完成。你想怎么做？
>
> 1. 合并回本地 <base-branch>
> 2. 推送并创建 Pull Request
> 3. 保持分支现状（我稍后自己处理）
>
> 选哪个？」

原文：

```
Implementation complete. What would you like to do?

1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)

Which option?
```

**分离头指针——恰好呈现这 2 个选项：**

> 译文：「实现已完成。你处在分离头指针状态（由外部管理的工作区）。
>
> 1. 作为新分支推送并创建 Pull Request
> 2. 保持现状（我稍后自己处理）
>
> 选哪个？」

原文：

```
Implementation complete. You're on a detached HEAD (externally managed workspace).

1. Push as new branch and create a Pull Request
2. Keep as-is (I'll handle it later)

Which option?
```

按写好的样子原样呈现菜单——简洁，每个选项都来自上面那份清单。丢弃这项工作，只在你的人类搭档明确要求时才发生（见下文「如果你的人类搭档要求丢弃这项工作」）。等他们的回答；集成方式由他们决定。

### 16.6 第 5 步：执行选择（Step 5: Execute Choice）

#### 16.6.1 选项 1：本地合并（Option 1: Merge Locally）

```bash
# Get main repo root for CWD safety
MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
cd "$MAIN_ROOT"

# Merge first — verify success before removing anything
git checkout <base-branch>
git pull
git merge <feature-branch>

# Verify tests on merged result
<test command>
```

如果合并后的结果测试失败：停下，让 worktree 和分支留在原位，去调查——什么都还没推送，所以这次合并是本地的、可恢复的。

一旦合并后的结果全绿：清理 worktree（第 6 步），然后删除分支：

```bash
git branch -d <feature-branch>
```

#### 16.6.2 选项 2：推送并创建 PR（Option 2: Push and Create PR）

```bash
git push -u origin <feature-branch>
# From a detached HEAD, name the new branch on the remote:
# git push origin HEAD:refs/heads/<new-branch>
```

然后用托管平台（forge）的工具，针对 <base-branch> 创建 pull/merge request——平台有 CLI 就用它的 CLI，否则用大多数平台在你推送时会打印出来的创建 URL——如果仓库有 PR 模板和约定，就照着来，并把 URL 汇报给你的人类搭档。

保留 worktree——你的人类搭档要在那里根据 PR 反馈反复修改。

#### 16.6.3 选项 3：保持现状（Option 3: Keep As-Is）

汇报：

> 译文：「保留分支 <name>。worktree 保留在 <path>。」
>
> 原文：`"Keeping branch <name>. Worktree preserved at <path>."`

#### 16.6.4 如果你的人类搭档要求丢弃这项工作（If your human partner asks to discard the work）

这条路径只在回应「把工作扔掉」的明确请求时才存在。先确认：

> 译文：「这会永久删除：
>
> - 分支 <name>
> - 所有提交：<commit-list>
> - 位于 <path> 的 worktree
>
> 输入 `discard` 以确认。」

原文：

```
This will permanently delete:
- Branch <name>
- All commits: <commit-list>
- Worktree at <path>

Type 'discard' to confirm.
```

等这个确切的确认。等到之后：

```bash
MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
cd "$MAIN_ROOT"
```

然后清理 worktree（第 6 步）并强制删除分支：

```bash
git branch -D <feature-branch>
```

### 16.7 第 6 步：清理工作区（Step 6: Cleanup Workspace）

**对选项 1 和已确认的丢弃运行。** 选项 2 和 3 始终保留 worktree。这两个调用方都已经把目录切到了主仓库根目录——worktree 的移除必须从 worktree 外面运行——并且使用第 2 步捕获的、在那次切目录之前的 `GIT_DIR`/`GIT_COMMON`/`WORKTREE_PATH` 值。

**如果 `GIT_DIR == GIT_COMMON`：** 普通仓库，没有 worktree 需要清理。完成。

**如果 `WORKTREE_PATH` 位于 `.worktrees/` 或 `worktrees/` 之下：** 这个 worktree 是 Superpowers 创建的——清理由我们负责：

```bash
git worktree remove "$WORKTREE_PATH"
git worktree prune  # Self-healing: clean up any stale registrations
```

**如果移除被拒绝**（`contains modified or untracked files`）：这个 worktree 里装着别处不存在的文件——未提交的计划、笔记或草稿。绝不主动 `--force`。把利害关系摆给你的人类搭档看，然后问：

```bash
git -C "$WORKTREE_PATH" status --porcelain -uall
```

> 译文：「worktree 移除被拒绝——这些文件从未被提交过：
>
> <file list>
>
> 1. 在清理之前把它们提交到 <branch>
> 2. 把它们移到 <main repo root>
> 3. 删除它们（不可恢复）
>
> 选哪个？」

原文：

```
Worktree removal refused — these files were never committed:

<file list>

1. Commit them to <branch> before cleanup
2. Move them into <main repo root>
3. Delete them (unrecoverable)

Which?
```

执行所选的那一项，然后移除 worktree。

**否则：** 这个工作区归宿主环境所有——保持原位。如果你的平台提供了退出工作区的工具，就用它。

### 16.8 速查表（Quick Reference）

| 选项 | 合并 | 推送 | 保留 Worktree | 清理分支 |
|--------|-------|------|---------------|----------------|
| 1. 本地合并 | 是 | - | - | 是 |
| 2. 创建 PR | - | 是 | 是 | - |
| 3. 保持现状 | - | - | 是 | - |
| 丢弃（仅限明确请求） | - | - | - | 是（强制） |

### 16.9 常见合理化（Common Rationalizations）

| 借口 | 真相 |
|--------|---------|
| “本次会话早前测试通过了” | 在你即将集成的这棵树上跑一遍测试套件。一次绿色的运行只能证明它跑过的那棵树。 |
| “他们显然想把它合进去” | 集成是你的人类搭档的决定。呈现菜单并等待。 |
| “他们看起来对这个功能已经没兴趣了——我主动提议丢弃它” | 菜单照写好的样子就是完整的。只有你的人类搭档把话明确说出口时，才会发生丢弃。 |
| “‘行，把它删了吧’也算确认” | 只有亲手输入的 `discard` 这个词才授权删除。 |
| “PR 都开出来了，这个 worktree 现在是多余的” | PR 反馈要在那个 worktree 里修。在成果落地之前，它一直留着。 |
| “这个别的 worktree 看起来已经废弃了——我一并清理掉” | 只清理 `.worktrees/` 或 `worktrees/` 之下的 worktree。其他一切都归宿主所有。 |
| “移除被拒绝了——`--force` 只是把清理做完” | 拒绝意味着有文件只存在于那个 worktree 里。`--force` 会永久毁掉它们。给你的人类搭档看清楚，然后问。 |
| “合并结果的失败大概只是不稳定” | 合并结果失败就让一切停下。在你调查期间，分支和 worktree 都留在原地。 |
| “基础分支显然是 main” | 确认分叉点，或者直接问。合错基础分支，收场很贵。 |
| “推送被拒绝了——force-push 能解决” | 推送被拒意味着远端已经动了。去调查；只有你的人类搭档明确要求时才 force-push。 |
