# 工作流约定

本目录存放本项目的工作流产物。调用 `cwl-` 技能读写这里之前，先读完这份文件——这里记着本项目的特色做法。

## 目录

- `specs/<slug>/` —— 计划产物：`spec.md` 加 `tickets/<NN>-<slug>.md`（`cwl-to-plan`）。
- `maps/<地图名>/` —— 决策地图：`map.md` 加 `tickets/<NN>-<slug>.md` 与 `research/<名字>.md`（`cwl-wayfinder`）。
- `adr/NNNN-slug.md` —— 架构决策记录（`cwl-domain-modeling`）。
- `GLOSSARY.md` —— 领域词汇表；多上下文时用 `GLOSSARY-MAP.md` 指向 `glossary/<上下文>.md`（`cwl-domain-modeling`）。

## 约定

- **先 spec，后 ticket。** ticket 只能从 spec 推；spec 没覆盖的决定先回写 spec。
- **不自动提交。** 实现完把改动概要与建议的提交信息报告给用户，提交由用户做。
- **所有 Markdown 是严格 UTF-8、无 BOM。** 用 PowerShell 改含中文的文件时，不要用 `Set-Content` / `Out-File -Encoding UTF8`（会写成 ANSI 或加 BOM），用 `[System.IO.File]::WriteAllText($p, $txt, (New-Object System.Text.UTF8Encoding($false)))`。
- **术语沿用本仓既有词汇**：`ticket`、`地图`、`接缝`、`曳光弹`、`钉住`。不要擅自换词（例如改成 `slices` 或「需求」）——词的问题先问，别动手。
- **产物写决策，不写易变细节。** 不写行号、不贴工作 demo 的完整代码；只有某个代码片段精确编码了一项决策（状态机、schema、类型形状）时才内联，并注明它来自原型。
- **技能本体在仓库根的 `workflow/`**，目录名与 frontmatter 的 `name` 一致（`cwl-<名字>`）；跨技能引用一律用这个英文名。
