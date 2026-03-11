from __future__ import annotations

from pathlib import Path
from typing import Any

from .local import LocalChannel
from .qq import QQRelayChannel
from .relay import GenericRelayChannel
from .registry import register_channel


def register_builtin_channels(*, home: Path, connectors_config: dict[str, Any]) -> None:
    register_channel("local", lambda **_: LocalChannel(home))
    register_channel("qq", lambda **_: QQRelayChannel(home, connectors_config.get("qq", {})))
    for name in ("telegram", "discord", "slack", "feishu", "whatsapp"):
        register_channel(
            name,
            lambda *, _name=name, **_: GenericRelayChannel(home, _name, connectors_config.get(_name, {})),
        )
