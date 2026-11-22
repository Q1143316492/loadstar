"""会话事件目录：读写在一处，语义也在一处。

持久化格式就是会话在内存里跑的那套类型化词汇——不造平行持久化事件类型。
序列化用 `dataclasses.asdict`（每个多态值已带 `type`/`kind` 判别字段）；
重建按判别字段分派。

本模块是「一种事件怎么读、上不上表层、算什么」的唯一权威点。新增一种事件
只在 `_SPECS` 里加一行：序列化、投影、用量、工具配对、崩溃修复这些消费者
都向它要事实，不再各自匹配 type 字符串。
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Callable, Literal

from llm.types import (
    BlockEnd,
    BlockStart,
    ContentBlock,
    FinishChunk,
    FinishReason,
    ImageBlock,
    LlmCallConfig,
    LLMMessage,
    LlmFailure,
    MessageSource,
    ModelSource,
    PluginSource,
    ReasoningBlock,
    ReasoningDelta,
    StreamChunk,
    TextBlock,
    TextDelta,
    TokenUsage,
    ToolCallBlock,
    ToolCallDelta,
    ToolResultBlock,
    ToolSource,
    UsageChunk,
    UserSource,
)
from .events import (
    AssistantChunk,
    AssistantMessageEvent,
    CompactionEnd,
    CompactionStart,
    CompactionSummary,
    RequestHeaderEvent,
    SessionEventData,
    StepEnd,
    StepStart,
    SurfaceOp,
    SurfaceReplace,
    ToolCallEvent,
    ToolResultEvent,
    TurnEnd,
    TurnStart,
    UserMessageEvent,
)


# ---- 嵌套值的重建 ----


def _source_from_dict(d: dict) -> MessageSource:
    kind = d.get("kind")
    if kind == "user":
        return UserSource()
    if kind == "model":
        return ModelSource(provider=d.get("provider", ""), model=d.get("model", ""))
    if kind == "tool":
        return ToolSource(call_id=d.get("call_id", ""))
    if kind == "plugin":
        return PluginSource(plugin=d.get("plugin", ""), compaction_id=d.get("compaction_id", ""))
    raise ValueError(f"unknown source kind: {kind!r}")


def _block_from_dict(d: dict) -> ContentBlock:
    t = d.get("type")
    if t == "text":
        return TextBlock(text=d.get("text", ""))
    if t == "reasoning":
        return ReasoningBlock(text=d.get("text", ""))
    if t == "image":
        return ImageBlock(url=d.get("url", ""))
    if t == "tool-call":
        return ToolCallBlock(
            id=d.get("id", ""), name=d.get("name", ""), arguments=d.get("arguments", "")
        )
    if t == "tool-result":
        return ToolResultBlock(
            tool_call_id=d.get("tool_call_id", ""),
            content=tuple(_block_from_dict(b) for b in d.get("content", [])),
            is_error=d.get("is_error", False),
        )
    raise ValueError(f"unknown block type: {t!r}")


def _usage_from_dict(d: dict) -> TokenUsage:
    return TokenUsage(
        input=d.get("input", 0),
        output=d.get("output", 0),
        cache_read=d.get("cache_read", 0),
        cache_write=d.get("cache_write", 0),
        reasoning=d.get("reasoning", 0),
    )


def _call_config_from_dict(d: dict) -> LlmCallConfig:
    return LlmCallConfig(
        provider=d.get("provider", ""),
        model=d.get("model", ""),
        max_tokens=d.get("max_tokens"),
        temperature=d.get("temperature"),
        reasoning_effort=d.get("reasoning_effort"),
        stop=tuple(d.get("stop", []) or []),
    )


def _failure_from_dict(d: dict) -> LlmFailure:
    return LlmFailure(
        message=d.get("message", ""),
        code=d.get("code", ""),
        status=d.get("status"),
        provider_retry_after_ms=d.get("provider_retry_after_ms"),
    )


def _finish_from_dict(d: dict) -> FinishReason:
    failure = _failure_from_dict(d["failure"]) if d.get("failure") else None
    return FinishReason(kind=d["kind"], failure=failure)


def _chunk_from_dict(d: dict) -> StreamChunk:
    t = d.get("type")
    if t == "block-start":
        return BlockStart(index=d["index"], block_type=d["block_type"])
    if t == "text-delta":
        return TextDelta(index=d["index"], text=d.get("text", ""))
    if t == "reasoning-delta":
        return ReasoningDelta(index=d["index"], text=d.get("text", ""))
    if t == "tool-call-delta":
        return ToolCallDelta(
            index=d["index"],
            id=d.get("id", ""),
            name=d.get("name"),
            arguments_delta=d.get("arguments_delta", ""),
        )
    if t == "block-end":
        return BlockEnd(index=d["index"], block=_block_from_dict(d["block"]))
    if t == "usage":
        return UsageChunk(usage=_usage_from_dict(d["usage"]))
    if t == "finish":
        return FinishChunk(reason=_finish_from_dict(d["reason"]))
    raise ValueError(f"unknown chunk type: {t!r}")


def _message_from_dict(d: dict) -> LLMMessage:
    return LLMMessage(
        id=d["id"],
        role=d["role"],
        content=tuple(_block_from_dict(b) for b in d.get("content", [])),
        source=_source_from_dict(d["source"]),
    )


def _surface_op_from_dict(value) -> SurfaceOp:
    if value is None or value == "append":
        return "append"
    if isinstance(value, dict) and value.get("op") == "replace":
        return SurfaceReplace(start=int(value["start"]), end=int(value["end"]))
    raise ValueError(f"unknown surface_op: {value!r}")


# ---- 每种事件的编解码 ----


def _decode_turn_start(d: dict) -> TurnStart:
    return TurnStart(turn=d["turn"])


def _decode_turn_end(d: dict) -> TurnEnd:
    return TurnEnd(turn=d["turn"], reason=d.get("reason", "completed"), error=d.get("error"))


def _decode_step_start(d: dict) -> StepStart:
    return StepStart(turn=d["turn"], step=d["step"])


def _decode_step_end(d: dict) -> StepEnd:
    return StepEnd(turn=d["turn"], step=d["step"])


def _decode_user_message(d: dict) -> UserMessageEvent:
    return UserMessageEvent(
        message=_message_from_dict(d["message"]),
        surface_op=_surface_op_from_dict(d.get("surface_op", "append")),
        source_event_seqs=tuple(d.get("source_event_seqs") or ()),
    )


def _decode_assistant_chunk(d: dict) -> AssistantChunk:
    return AssistantChunk(turn=d["turn"], step=d["step"], chunk=_chunk_from_dict(d["chunk"]))


def _decode_assistant_message(d: dict) -> AssistantMessageEvent:
    return AssistantMessageEvent(
        turn=d["turn"],
        step=d["step"],
        message=_message_from_dict(d["message"]),
        usage=_usage_from_dict(d["usage"]) if d.get("usage") else None,
        surface_op=_surface_op_from_dict(d.get("surface_op", "append")),
        source_event_seqs=tuple(d.get("source_event_seqs") or ()),
    )


def _decode_tool_call(d: dict) -> ToolCallEvent:
    return ToolCallEvent(
        turn=d["turn"], step=d["step"],
        call_id=d["call_id"], name=d["name"], arguments=d["arguments"],
    )


def _decode_tool_result(d: dict) -> ToolResultEvent:
    return ToolResultEvent(
        turn=d["turn"], step=d["step"],
        message=_message_from_dict(d["message"]), error=d.get("error"),
        error_code=d.get("error_code"),
        surface_op=_surface_op_from_dict(d.get("surface_op", "append")),
        source_event_seqs=tuple(d.get("source_event_seqs") or ()),
    )


def _decode_request_header(d: dict) -> RequestHeaderEvent:
    return RequestHeaderEvent(
        header=_call_config_from_dict(d["header"]), reason=d.get("reason", "initial")
    )


def _decode_compaction_start(d: dict) -> CompactionStart:
    return CompactionStart(compaction_id=d["compaction_id"], turn=d.get("turn"))


def _decode_compaction_summary(d: dict) -> CompactionSummary:
    return CompactionSummary(
        compaction_id=d["compaction_id"],
        summary=d.get("summary", ""),
        shadowed_start=d["shadowed_start"],
        shadowed_end=d["shadowed_end"],
        shadowed_seqs=tuple(d.get("shadowed_seqs") or ()),
        shadowed_chars=d.get("shadowed_chars", 0),
    )


def _decode_compaction_end(d: dict) -> CompactionEnd:
    return CompactionEnd(
        compaction_id=d["compaction_id"],
        turn=d.get("turn"),
        error=d.get("error"),
    )


# ---- 投影：上表层的事件产出哪条模型消息 ----


def _project_user(event: UserMessageEvent) -> LLMMessage:
    return event.message


def _project_assistant(event: AssistantMessageEvent) -> LLMMessage | None:
    """空内容的 assistant/message 只为承载 max-tokens 步的 usage。

    它不能进 provider 的 transcript：一条没有内容的 assistant 回合会被
    provider 拒绝，也会让下一轮看到不存在的发言。
    """
    if len(event.message.content) == 0:
        return None
    return event.message


def _project_tool_result(event: ToolResultEvent) -> LLMMessage:
    return event.message


# ---- 工具配对：表层节点让 in-progress 计数增减多少 ----


def _assistant_tool_delta(event: AssistantMessageEvent) -> int:
    return sum(1 for block in event.message.content if block.type == "tool-call")


def _tool_result_delta(event: ToolResultEvent) -> int:
    return -1


# ---- 目录 ----


@dataclass(frozen=True)
class EventSpec:
    """一种会话事件的全部语义。

    ``project`` 非空即上表层；``usage`` 表示带可累计的 TokenUsage；
    ``tool_delta`` 是工具配对计数器的增量；``turn_boundary`` 标记崩溃修复
    要补的边界；``resets_usage_anchor`` 表示此事件之后更早的 usage 不再
    代表当前请求（压缩改写了真正发出去的上下文）。
    """

    type: str
    decode: Callable[[dict], SessionEventData]
    project: Callable[[SessionEventData], LLMMessage | None] | None = None
    usage: bool = False
    tool_delta: Callable[[SessionEventData], int] | None = None
    turn_boundary: Literal["start", "end"] | None = None
    resets_usage_anchor: bool = False

    @property
    def surface(self) -> bool:
        return self.project is not None


_SPECS: dict[str, EventSpec] = {
    spec.type: spec
    for spec in (
        EventSpec("turn/start", _decode_turn_start, turn_boundary="start"),
        EventSpec("turn/end", _decode_turn_end, turn_boundary="end"),
        EventSpec("step/start", _decode_step_start),
        EventSpec("step/end", _decode_step_end),
        EventSpec("user/message", _decode_user_message, project=_project_user),
        EventSpec("assistant/chunk", _decode_assistant_chunk),
        EventSpec(
            "assistant/message",
            _decode_assistant_message,
            project=_project_assistant,
            usage=True,
            tool_delta=_assistant_tool_delta,
        ),
        EventSpec("tool/call", _decode_tool_call),
        EventSpec(
            "tool/result",
            _decode_tool_result,
            project=_project_tool_result,
            tool_delta=_tool_result_delta,
        ),
        EventSpec("request/header", _decode_request_header),
        EventSpec("compaction/start", _decode_compaction_start),
        EventSpec("compaction/summary", _decode_compaction_summary),
        EventSpec("compaction/end", _decode_compaction_end, resets_usage_anchor=True),
    )
}


def spec_of(event_type: str) -> EventSpec:
    """按 type 取事件描述；未知类型是读不懂的日志，直接报错。"""
    try:
        return _SPECS[event_type]
    except KeyError:
        raise ValueError(f"unknown event type: {event_type!r}") from None


# ---- 消费者用的读取入口 ----


def decode_event(d: dict) -> SessionEventData:
    """从序列化 dict 重建一条事件。"""
    return spec_of(d.get("type")).decode(d)


def event_to_dict(event: SessionEventData) -> dict:
    """把一条事件（含嵌套值）序列化成可 JSON 的 dict。"""
    return asdict(event)


def project_event(event: SessionEventData) -> LLMMessage | None:
    """把一条事件投影成模型消息，或 None（不上表层 / 空内容）。"""
    spec = spec_of(event.type)
    return spec.project(event) if spec.project is not None else None


def is_surface_event(event: SessionEventData) -> bool:
    """这条事件类型是否上表层（不看内容是否为空）。"""
    return spec_of(event.type).surface


def event_usage(event: SessionEventData) -> TokenUsage | None:
    """参与累计用量的事件返回它的 usage；其余返回 None。"""
    if not spec_of(event.type).usage:
        return None
    return getattr(event, "usage", None)


def tool_pairing_delta(event: SessionEventData) -> int:
    """这条事件让工具调用/结果配对计数增减多少。"""
    spec = spec_of(event.type)
    return spec.tool_delta(event) if spec.tool_delta is not None else 0


def turn_boundary(event: SessionEventData) -> Literal["start", "end"] | None:
    """turn 的开 / 闭边界；崩溃修复靠它找孤儿 turn。"""
    return spec_of(event.type).turn_boundary
