# 陪读先例调研

## 问题

调研「陪读式读码」的已有形态与教训，供三张后续票借形（入口地图 / 陪读节拍 / 图规格）：

- 已有做法与工具（DeepWiki、CodeTour、Sourcegraph、AI 导师式讲码、annotated reading 等）各自的产物形态与适用面；
- 哪些规格值得借鉴：图式、分层与导航、深挖接口、怎么控制深度；
- 要避开的死法：01 已否「AI 讲一遍」的 wiki 形态（`docs/attempts/01-codeview.md` §1.1 v1.5），确认同类还有哪些。

发现写到 `../research/companion-precedents.md`（相对本票）。

类型：research
状态：已解决
阻塞于：无

## 答案

发现见 [`../research/companion-precedents.md`](../research/companion-precedents.md)（先例清单 + 对三票的输入）。五个要点：

- 最对口的先例是 **Codemaps**（Cognition/Windsurf）：按需生成、钉在精确导航上，明确反对「在聊天里泛泛地问」——与本图形态同向；
- **拉取式深挖被公共评价证实是最好的部分**（DeepWiki 用户名言：「真正出彩的是 follow-up 问答」；`/explain` 是生态标准交互）；
- DeepWiki 的公开失败清单与 01 互证：错误权重、错过核心、命名式幻觉、图不落地、深度配比失衡、意图在代码外；
- 防漂移三件套（可抄）：CodeTour 的 `pattern` 锚点 + CI drift 检查（CodeTour Watch）、Notebooks 的可重跑块；
- 读法有文献底：自顶向下先立骨架（Brooks）、beacons 停留点（Soloway）、问题驱动的 fact finding（LaToza 2007 / Robillard 2004）、非线形是常态（Busjahn）。
