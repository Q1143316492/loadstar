"""用量投影：累计 token 与上下文压力估算。"""

from llm.types import ModelSource, TextBlock, TokenUsage, create_model_message, create_user_message
from session import Session, context_pressure, message_chars, sum_usage
from session.events import AssistantMessageEvent, UserMessageEvent


def _assistant(session, text="a", usage=None, *, empty=False):
    blocks = [] if empty else [TextBlock(text=text)]
    session.append(
        AssistantMessageEvent(
            turn=1,
            step=1,
            message=create_model_message(blocks, ModelSource(provider="x", model="m")),
            usage=usage,
        )
    )


def test_sum_usage_adds_assistant_messages():
    s = Session()
    _assistant(s, "a", TokenUsage(input=10, output=2, cache_read=3))
    _assistant(s, "b", TokenUsage(input=4, output=1))
    u = sum_usage(s)
    assert u.input == 14
    assert u.output == 3
    assert u.cache_read == 3


def test_sum_usage_skips_missing():
    assert sum_usage(Session()) == TokenUsage()


def test_message_chars_counts_all_block_kinds():
    message = create_user_message([TextBlock(text="abc")])
    assert message_chars(message) == 3


def test_pressure_without_anchor_estimates_from_chars():
    s = Session()
    s.append(UserMessageEvent(message=create_user_message([TextBlock(text="abcdefgh")])))
    pressure = context_pressure(s, chars_per_token=2.0)
    assert pressure.anchored is False
    assert pressure.tokens == 4


def test_pressure_uses_last_usage_as_anchor_plus_tail():
    s = Session()
    s.append(UserMessageEvent(message=create_user_message([TextBlock(text="old" * 50)])))
    _assistant(s, "ok", TokenUsage(input=100, output=20, cache_read=30))
    s.append(UserMessageEvent(message=create_user_message([TextBlock(text="abcdefgh")])))

    pressure = context_pressure(s, chars_per_token=2.0)

    # 150 = 100 + 20 + 30；尾部 8 字符按 2 字符/token 估 4。
    assert pressure.anchored is True
    assert pressure.tokens == 154


def test_empty_assistant_usage_still_anchors():
    # max-tokens 步写空内容 assistant；它不进表层，但 usage 仍有效。
    s = Session()
    s.append(UserMessageEvent(message=create_user_message([TextBlock(text="hi")])))
    _assistant(s, "", TokenUsage(input=100_000, output=4_000), empty=True)

    pressure = context_pressure(s)

    assert pressure.anchored is True
    assert pressure.tokens == 104_000


def test_compaction_invalidates_earlier_anchor():
    from session.events import CompactionEnd

    s = Session()
    s.append(UserMessageEvent(message=create_user_message([TextBlock(text="abcdefgh")])))
    _assistant(s, "ok", TokenUsage(input=100_000))
    s.append(CompactionEnd(compaction_id="c1"))

    pressure = context_pressure(s, chars_per_token=2.0)

    # 压缩前的 usage 不再代表当前请求；退回按字符估 (8 + 2) / 2 = 5。
    assert pressure.anchored is False
    assert pressure.tokens == 5
