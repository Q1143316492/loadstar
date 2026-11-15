# archive —— 退役技能

暂不使用、但还没想好要不要删的技能放这里。目录结构与 `workflow/` 相同：`archive/<技能名>/SKILL.md`，frontmatter 原样保留。

## 与 `workflow/` 的区别

- **不参与同步**：`cwl-sync` 只认 `workflow/cwl-*/`，这里的东西不会装到任何技能目录，也不会出现在 README 的技能表里。
- **不再被引用**：`cwl-ask` 的路线图与速查、`docs/workflow-map.md` 的索引都不再指向这里。留在这儿的技能，等于从工作流里下线。

## 恢复

想重新启用就整体挪回去，再补上索引：

```bash
git mv archive/cwl-<名字> workflow/cwl-<名字>
```

然后更新 `README.md` 技能表、`docs/workflow-map.md`、`workflow/cwl-ask/SKILL.md`（路线图 + 速查 + 对应小节）。

## 删除

确认永远不用了，直接 `git rm -r archive/cwl-<名字>`，并把这一行从下面的清单里删掉。

## 清单

| 技能 | 归档日期 | 为什么退役 |
|---|---|---|
| `cwl-explore` | 2026-11-16 | 使用频率低；「只想聊清楚」的场合多半直接对话就够，需要产物时用 `cwl-grill-with-docs` / `cwl-to-plan`。先留着原文，观察一段时间 |
