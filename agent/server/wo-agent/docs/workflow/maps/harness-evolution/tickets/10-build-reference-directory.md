## 问题

在 wo-agent 里建立 `reference/harness-architectures/`：README 钉住两份上游的本地路径与 commit、说明卡片用途与不 vendor 源码的原则；给出卡片模板（dsh 做法 / pi 做法 / wo-agent 现状 / 可搬性与前置 / 来源链接）；把四份研究整理成首批能力卡片。

范围：

1. 只搬运研究已确认的事实，不新增调研。
2. 卡片按能力命名，不按上游包名命名。
3. README 记录上游 commit，便于判断卡片是否过期。

这是 AFK 手工活，不涉及新的决策；完成时在研究文档与卡片之间建立双向链接。

类型：task
状态：已解决
阻塞于：02, 03, 04, 05

## 答案

已建立 `reference/harness-architectures/`：

- `README.md`——上游 pin（dsh `0a53fb55be`、pi `853a80d26`）、卡片索引与路线处置、加卡片的四步、回填纪律。
- 六张卡片：`session-durability`、`llm-provider`、`composition-extension`、`tool-pipeline`、`durable-session-model`、`sandbox-and-presets`。每张四段加一条指向研究文档的相对链接；前四张对应进路线的四个方向，后两张是明确只留卡片的项。
- 卡片是结论视图，细节只住在 `docs/workflow/maps/harness-evolution/research/`，避免两份事实源漂移。

形态与回填纪律来自 [08-decide-knowledge-output-loop](08-decide-knowledge-output-loop.md)。
