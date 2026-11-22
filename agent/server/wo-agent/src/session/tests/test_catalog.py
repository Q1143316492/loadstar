"""事件目录：并集里的每种事件都必须有描述，语义按描述取。"""

from typing import get_args

import pytest
from llm.types import ModelSource, TextBlock, ToolCallBlock, create_model_message, create_tool_result_message
from session.catalog import is_surface_event, spec_of, tool_pairing_delta, turn_boundary
from session.events import (
    AssistantMessageEvent,
    SessionEventData,
    ToolResultEvent,
    TurnEnd,
    TurnStart,
)


def test_every_event_type_in_the_union_has_a_spec():
    """新增一种事件却忘了登记目录时，这条测试先红。"""
    for cls in get_args(SessionEventData):
        declared = cls.__dataclass_fields__["type"].default
        assert spec_of(declared).type == declared


def test_unknown_event_type_is_an_error():
    with pytest.raises(ValueError, match="unknown event type"):
        spec_of("no/such-event")


def test_surface_eligibility_comes_from_the_spec():
    user_like = AssistantMessageEvent(
        turn=0, step=0,
        message=create_model_message([TextBlock(text="x")], ModelSource(provider="p", model="m")),
    )
    assert is_surface_event(user_like)
    assert not is_surface_event(TurnStart(turn=0))


def test_pairing_delta_counts_tool_calls_and_results():
    assistant = AssistantMessageEvent(
        turn=0,
        step=0,
        message=create_model_message(
            [
                ToolCallBlock(id="c1", name="read", arguments="{}"),
                ToolCallBlock(id="c2", name="read", arguments="{}"),
            ],
            ModelSource(provider="p", model="m"),
        ),
    )
    result = ToolResultEvent(
        turn=0, step=0, message=create_tool_result_message("c1", [TextBlock(text="ok")])
    )
    assert tool_pairing_delta(assistant) == 2
    assert tool_pairing_delta(result) == -1
    assert tool_pairing_delta(TurnStart(turn=0)) == 0


def test_turn_boundaries_are_declared_by_the_spec():
    assert turn_boundary(TurnStart(turn=0)) == "start"
    assert turn_boundary(TurnEnd(turn=0)) == "end"
    assert turn_boundary(ToolResultEvent(
        turn=0, step=0, message=create_tool_result_message("c1", [])
    )) is None
