# LLM 接入与 provider 路由

> dsh `0a53fb55be` · pi `853a80d26`
> 研究：[llm-provider.md](research/llm-provider.md)

## dsh 怎么做

`ctx.llm` 是 Cordis 能力缝：Service Definition、Provider adapter、Consumer 三角色。请求是 `GenerateOptions`，流是 `StreamChunk`；tool schema 由 tools registry 白名单投影后随请求组装。usage 先随流落日志，再由 token-meter 从 durable log 重放计价。重试策略由 provider 声明，在 durable step 边界执行。

## pi 怎么做

拆成三层：Provider（身份、目录、auth）、Api（线协议）、Models（集合与分发）。失败不抛异常，写进最终消息的 `stopReason` / `errorMessage`。跨 provider 续聊时 `transformMessages()` 做 thinking 降级、tool call id 归一、孤立 tool result 补齐、图片降级。

## wo-agent 现状

已有分片流协议、唯一的 `BlockAssembler`、完整的 DeepSeek 适配器、稳定错误码与 `is_retryable`。provider 注册表已在循环里按 `AgentOptions.provider` 选路，auth 解析独立成 `llm/auth.py`。仍缺：usage 只落日志不计量（已由 `session/usage.py` 补上投影）、400 一律判为窗口超限、重试只有循环内的固定码表与线性退避、没有模型能力元数据。

## 可搬性与前置依赖

- **进路线**：provider 注册表与路由（已完成）、auth 解析（已完成）、usage 计量（已完成投影，压缩已改用）、错误分类与 per-route 重试策略。
- **只留卡片**：模型能力协商、跨 provider 消息变换、Api 层拆分——都需要第二个 provider 才能验证。
- **明确不搬**：模型目录生成链、数十家 provider 与十余个线协议实现、OAuth 与云凭据、图片与 Files API、deferred responses、成本定价目录。
