# compaction

对应 `src/compaction/`。对话太长时，把较早一段收成摘要。session 日志不删；下次发给模型的历史变成「摘要 + 后面还留着的消息」。摘要自己调 `provider.stream()`，不走 agent 循环。

```python
from compaction import BasicCompaction, CompactionOptions, LlmSummarizer

engine = BasicCompaction(
    LlmSummarizer(provider, provider_name="deepseek", model="deepseek-chat"),
    CompactionOptions(context_window=131_072),  # 阈值 80%，尾部保留 16%
)
await engine.compact_if_needed(session, trigger="pressure")
```

压力超过 `threshold_ratio × context_window` 才压；尾部约 `retain_ratio × context_window` 原样保留。没有可切的一段就什么也不做。

压力不是按字符直接算，而是走 `session.usage.context_pressure`：最近一次请求的 provider `usage` 作 token 锚点，其后的消息按 `chars_per_token` 粗估。锚点必须晚于最后一次压缩——压缩改变了真正会发出的上下文，之前的 usage 不再代表当前请求；此时退化为整段字符估算。没有真实 tokenizer 之前这个粗估系数是显式参数，不藏在实现里。

`context_window` 现在由宿主手写（DeepSeek 128K）。模型能力协商还没做，等第二个 provider 出现后改成 provider 声明的元数据。

## 文件

- `protocol.py` — `Summarizer`：一段消息进，摘要字符串出。`CompactionEngine`：`compact_if_needed` / `compact_now`。
- `engine.py` — `BasicCompaction`、`CompactionOptions`。按窗口比例判断要不要压，切哪一段。`options` 属性给宿主读窗口与比例（状态栏显示压力）。
- `pairing.py` — 切分不能拆开一对 tool-call / tool-result。
- `summarizer.py` — `LlmSummarizer`：用已有的 `LLMProvider` 做一次无工具请求。`frame_summary` 把摘要包成检查点正文。
- `capability.py` — `CompactionCapability`：`mount` 时把引擎放到 `ctx.compaction`。
