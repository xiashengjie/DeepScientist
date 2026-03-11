from __future__ import annotations

import json
from pathlib import Path

import pytest

from deepscientist.channels.qq_gateway import QQ_GROUP_AND_C2C_INTENT, QQGatewayService
from deepscientist.home import ensure_home_layout
from deepscientist.shared import read_json


class _FakeConnection:
    def __init__(self) -> None:
        self.sent: list[dict] = []

    def send(self, payload: str) -> None:
        self.sent.append(json.loads(payload))


def _service(home: Path, on_event) -> QQGatewayService:  # noqa: ANN001
    return QQGatewayService(
        home=home,
        config={
            "enabled": True,
            "app_id": "1903299925",
            "app_secret": "qq-secret",
        },
        on_event=on_event,
    )


def test_qq_gateway_identify_handshake_uses_direct_gateway(temp_home: Path) -> None:
    ensure_home_layout(temp_home)
    connection = _FakeConnection()
    service = _service(temp_home, lambda _event: None)

    service._send_handshake(connection, "qq-access-token")

    assert connection.sent == [
        {
            "op": 2,
            "d": {
                "token": "QQBot qq-access-token",
                "intents": QQ_GROUP_AND_C2C_INTENT,
                "shard": [0, 1],
            },
        }
    ]


def test_qq_gateway_resume_handshake_uses_session_state(temp_home: Path) -> None:
    ensure_home_layout(temp_home)
    connection = _FakeConnection()
    service = _service(temp_home, lambda _event: None)
    service._session_id = "session-001"
    service._seq = 42

    service._send_handshake(connection, "qq-access-token")

    assert connection.sent == [
        {
            "op": 6,
            "d": {
                "token": "QQBot qq-access-token",
                "session_id": "session-001",
                "seq": 42,
            },
        }
    ]


def test_qq_gateway_handles_ready_and_normalizes_messages(temp_home: Path) -> None:
    ensure_home_layout(temp_home)
    events: list[dict] = []
    service = _service(temp_home, events.append)

    service._handle_payload({"op": 0, "t": "READY", "d": {"session_id": "session-abc"}})
    service._handle_payload(
        {
            "op": 0,
            "s": 7,
            "t": "C2C_MESSAGE_CREATE",
            "d": {
                "id": "msg-direct-1",
                "content": "hello",
                "author": {
                    "user_openid": "user-openid-1",
                    "id": "user-1",
                },
            },
        }
    )
    service._handle_payload(
        {
            "op": 0,
            "s": 8,
            "t": "GROUP_AT_MESSAGE_CREATE",
            "d": {
                "id": "msg-group-1",
                "content": "@DeepScientist hi",
                "group_openid": "group-openid-1",
                "author": {
                    "member_openid": "member-openid-1",
                },
            },
        }
    )

    assert service._session_id == "session-abc"
    assert events[0]["conversation_id"] == "qq:direct:user-openid-1"
    assert events[0]["openid"] == "user-openid-1"
    assert events[1]["conversation_id"] == "qq:group:group-openid-1"
    assert events[1]["group_openid"] == "group-openid-1"
    assert events[1]["mentioned"] is True

    state = read_json(temp_home / "logs" / "connectors" / "qq" / "gateway.json", {})
    assert state["session_id"] == "session-abc"
    assert state["last_event_type"] == "GROUP_AT_MESSAGE_CREATE"
    assert state["last_conversation_id"] == "qq:group:group-openid-1"


def test_qq_gateway_requests_reconnect_on_gateway_opcode(temp_home: Path) -> None:
    ensure_home_layout(temp_home)
    service = _service(temp_home, lambda _event: None)

    with pytest.raises(EOFError, match="requested reconnect"):
        service._handle_payload({"op": 7})
