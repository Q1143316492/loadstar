# reference —— 外部参考仓库

只读学习材料。目标是读完归纳成 Lodestar 自己的东西，不改这三套源码。

> **存档模式（2026-10-13 起）**：本目录**已纳入 Lodestar 自己的版本管理**，三个子目录中的 `.git` 均已删除，作为**纯文件存档**存在。这样做是因为嵌套 git 仓库会让 Lodestar 只记录一个空引用、内容根本无法提交；而三者原本就是 `--depth 1` 浅克隆（只为读，不带历史），`.git` 里本就没有历史可丢。
>
> 代价：**无法再在本目录 `git pull`**，也无法查那时的历史。需要更新时按下面「重新拉取」重新克隆对应仓库，并在此表登记新的 commit。

| 本地目录 | 来源 | 存档时的 commit |
|---|---|---|
| `superpowers/` | <https://github.com/obra/superpowers.git> | `8ca22db`（v6.4.2，2026-09-25） |
| `openspec/` | <https://github.com/Fission-AI/openspec.git> | `79b6aa9`（2026-09-25） |
| `mattpocock-skills/` | <https://github.com/mattpocock/skills.git> | `49dd158`（2026-10-09） |

三个都是 `--depth 1` 浅克隆的产物（只为读，不带历史），现已作为存档。上表的 commit 是**唯一**能证明「当时存的是哪一版」的记录，更新前先照抄新值再动手。

## 阅读路线

路线与译文都已移到 `docs/learn-<主题>/` 下，与各自源仓库分开：`READING-<主题>.md` 是读序，`translate/` 是对应译文。

- superpowers → [`docs/learn-superpowers/READING-superpowers.md`](../docs/learn-superpowers/READING-superpowers.md)
- openspec → [`docs/learn-openspec/READING-openspec.md`](../docs/learn-openspec/READING-openspec.md)（编号 = 读序 = 译序，译文见同目录 `translate/`；工具适配层已剔除）
- mattpocock → [`docs/learn-mattpocock/READING-mattpocock.md`](../docs/learn-mattpocock/READING-mattpocock.md)

## 从哪读起

- `superpowers/skills/<法名>/SKILL.md` —— 15 篇，最强制的一套，入口先看 `using-superpowers`
- `openspec/skills/openspec-*/SKILL.md` —— 12 篇，围绕 change 的 propose → apply → archive 生命周期
- `mattpocock-skills/skills/{engineering,productivity,misc,in-progress}/<法名>/SKILL.md` —— 小而可组合，招牌是 `grilling`
- 各仓库的 `README.md` / `AGENTS.md` 是作者自述的设计意图，比读单个 SKILL 更快抓到定位

## 重新拉取

`.git` 已删除，本目录无法 `pull`。要更新某个仓库时，把它重新克隆到 `.staging/`，用**纯文件**方式覆盖过来（`robocopy` 的 `/XD .git` 排除掉 `.git`，否则会再次引入嵌套仓库），再把 `.staging/` 删掉、并更新上表的 commit：

```powershell
# 以 mattpocock-skills 为例
git clone --depth 1 https://github.com/mattpocock/skills.git D:\Workspace\lodestar\.staging\mattpocock-skills
# 先记下新 commit：git -C D:\Workspace\lodestar\.staging\mattpocock-skills rev-parse HEAD
robocopy 'D:\Workspace\lodestar\.staging\mattpocock-skills' 'D:\Workspace\lodestar\reference\mattpocock-skills' /MIR /XD .git /NFL /NDL /NJH /NJS /NP
Remove-Item 'D:\Workspace\lodestar\.staging' -Recurse -Force
```

`/MIR` 会**镜像**（删除目标端多余的文件），所以覆盖后目录与上游一致；这也是 2026-10-13 那次从 `c55ee46` 追到 `49dd158` 用的命令。

`.staging/` 已在根目录 `.gitignore` 里，临时克隆不会被提交。覆盖后记得按需同步 `docs/learn-<主题>/` 下的译文与 `READING-*.md`（`docs/learn-mattpocock/translate/README.md` 里有一份同步记录可参照）。
