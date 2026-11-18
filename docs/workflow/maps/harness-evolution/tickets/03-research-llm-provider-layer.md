## 问题

dsh 与 pi-agent 的 LLM 接入层各是什么形状，wo-agent 的 `src/llm/` 与之差在哪，多 provider 与计量的接缝该怎么设计？

需要回答：

1. **pi 侧**：Provider / Api / Models 三层的职责边界；auth 解析与 credential store；`stream()` 失败不抛错、写进 `stopReason` 的约定；跨 provider 续聊时消息变换。
2. **dsh 侧**：`ctx.llm` seam 的 Service Definition / Provider / Consumer 三角色；模型请求与流式分片的线格式；tool schema 如何随请求组装；usage 计量落在哪。
3. **wo-agent 现状**：`src/llm/types.py`、`assembler.py`、`deepseek.py` 的分工；`BlockAssembler` 与 shard 流协议；重试判定 `is_retryable`；目前只有单 provider、无 token 计量。
4. **渐进可搬性**：候选接缝（provider 注册表、Api 层抽象、auth/凭据解析、usage 计量、错误分类、能力协商）逐条给出前置依赖、改动面与最小验收。
5. **明确不搬**：模型目录生成、几十家 provider 的适配、OAuth 等明显超出学习项目需要的部分。

产物写到 `research/llm-provider.md`，从本票链接。只给事实与选项，不做取舍决策。

类型：research
状态：已解决
阻塞于：无

## 答案

研究见 [llm-provider.md](../../../../../reference/harness-architectures/research/llm-provider.md)。

- **三层对照**：pi 把 Provider（身份、目录、auth）+ Api（线协议）+ Models（集合与分发）分开，失败写进 `stopReason` / `errorMessage` 而不抛出；dsh 的 `ctx.llm` 是 Cordis seam，请求是 `GenerateOptions`、流是 `StreamChunk`，usage 先落日志再由 token-meter 重放计价；wo-agent 已有同形的 shard 协议、唯一的 `BlockAssembler` 与最完整的 DeepSeek 适配器，但 `ModelRegistry` 没有调用点、auth 是构造参数、usage 只落日志不计量、400 一律判为窗口超限、重试只有循环内的固定码表与线性退避。
- **最值得搬的六个接缝（按依赖顺序）**：provider 注册表与路由选择；auth / 凭据解析；usage 计量（轻量 meter，可升级为 replay fold）；错误分类与 per-route 重试策略；能力协商（窗口、默认 max tokens、reasoning effort）；跨 provider 消息变换。其中 Api 层分离建议等第二个 provider 出现再做。
- **明确不搬**：模型目录生成链、数十家 provider 与十余个线协议实现、OAuth 与云凭据、图片与 Files API、deferred responses、成本定价目录、Cordis 的 waterfall / Remote / 动态 provider 目录、token-meter 的完整 projection 面。
- **留给 HITL 的七个问题**：路由粒度、auth 起点、usage 形态、重试位置、能力元数据来源、跨 provider 变换范围、Api 层拆分时机。这些在 [决定哪些架构进路线](06-decide-in-scope-capabilities.md) 与 [排定渐进顺序与接缝](07-decide-port-order-and-seams.md) 里裁决。
