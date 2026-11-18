# harness-architectures

dsh 与 pi-agent 的架构对照卡片，按*能力*组织，不按上游包名。

卡片是**结论视图**：每张固定四段——dsh 怎么做、pi 怎么做、wo-agent 现状、可搬性与前置依赖——每段三到六行，末尾链到 `research/` 下的研究文档。细节只住在
[`research/`](research/)，这里不重复，避免两份事实源互相漂移。

研究文档是长期资产，与卡片同住；`docs/workflow/maps/` 下的规划产物（地图与票）在路线走完后即可丢弃，卡片不依赖它们。

## 上游 pin

| 仓库 | 本地路径 | commit |
|---|---|---|
| dsh | `d:\Unity\Src\DSH\deepseek-harness` | `0a53fb55be` |
| pi-agent | `d:\Unity\Src\DSH\pi-agent` | `853a80d26` |

卡片内容对应上面两个 commit。上游升级时先比 pin：没变就不用重读；变了再按需重跑
`cwl-research`，然后更新卡片头里的 pin。

## 卡片

| 卡片 | 能力 | 路线处置 |
|---|---|---|
| [session-durability](session-durability.md) | 会话日志、崩溃恢复 | 部分进路线（A 组 + 增量 append + intent） |
| [llm-provider](llm-provider.md) | Provider 接入与路由 | 部分进路线（注册表、auth、usage、错误分类） |
| [composition-extension](composition-extension.md) | 能力组装与扩展点 | 部分进路线（校验、disposer、skill 诊断） |
| [tool-pipeline](tool-pipeline.md) | 工具执行管线与权限 | 部分进路线（审批、超时、错误码、并发标记） |
| [durable-session-model](durable-session-model.md) | entry tree / lane / fork | 只留卡片 |
| [sandbox-and-presets](sandbox-and-presets.md) | 沙箱与权限预设 | 只留卡片 |

## 研究文档

| 文档 | 覆盖 |
|---|---|
| [session-durability.md](research/session-durability.md) | 会话日志、持久化、崩溃恢复 |
| [llm-provider.md](research/llm-provider.md) | Provider / Api / Models、auth、usage、重试 |
| [composition-extension.md](research/composition-extension.md) | 插件组合、扩展点、preset |
| [tool-pipeline-permissions.md](research/tool-pipeline-permissions.md) | 工具管线、审批、沙箱、威胁模型 |

## 怎么加一张卡片

1. 先跑 `cwl-research`，产物写进本目录的 `research/`，**不要**直接写卡片。
2. 从研究里压出四段结论，每段三到六行，末尾放一条相对链接指向研究文档。
3. 在上表加一行，写清路线处置：进路线、只留卡片、还是判出范围。
4. 卡片头写 dsh / pi 的 commit。

## 回填纪律

- 移植一个能力后：只改那张卡片的「wo-agent 现状」段，并在 `docs/workflow/maps/` 的「已定决策」加一行。
- 发现研究结论有误：先改 `research/` 里的那份文档，再同步卡片，不反向。
- 卡片命名按能力，不按上游包名。
