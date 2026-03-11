from __future__ import annotations

import json
from dataclasses import dataclass
from importlib import import_module
from importlib.metadata import PackageNotFoundError, version
from typing import Any


@dataclass(frozen=True)
class ACPBridgeStatus:
    available: bool
    module_name: str
    package_name: str
    package_version: str | None
    reason: str | None = None

    def as_dict(self) -> dict[str, Any]:
        return {
            "available": self.available,
            "module_name": self.module_name,
            "package_name": self.package_name,
            "package_version": self.package_version,
            "reason": self.reason,
        }


def get_acp_bridge_status() -> ACPBridgeStatus:
    package_name = "agent-client-protocol"
    module_name = "acp"
    try:
        import_module(module_name)
        try:
            package_version = version(package_name)
        except PackageNotFoundError:
            package_version = None
        return ACPBridgeStatus(
            available=True,
            module_name=module_name,
            package_name=package_name,
            package_version=package_version,
        )
    except ModuleNotFoundError as exc:
        return ACPBridgeStatus(
            available=False,
            module_name=module_name,
            package_name=package_name,
            package_version=None,
            reason=str(exc),
        )


class OptionalACPBridge:
    def __init__(self) -> None:
        self.status = get_acp_bridge_status()
        self._module = import_module(self.status.module_name) if self.status.available else None

    def is_available(self) -> bool:
        return bool(self.status.available and self._module is not None)

    def build_sdk_notification(self, *, session_id: str, event: dict[str, Any]) -> dict[str, Any] | None:
        if not self.is_available():
            return None
        acp = self._module
        event_type = str(event.get("type") or event.get("event_type") or "event")

        if event_type == "conversation.message":
            role = str(event.get("role") or "assistant")
            text = str(event.get("content") or "")
            if role == "user":
                update = acp.update_user_message_text(text)
            else:
                update = acp.update_agent_message_text(text)
        elif event_type == "runner.delta":
            update = acp.update_agent_message_text(str(event.get("text") or ""))
        elif event_type == "runner.agent_message":
            update = acp.update_agent_message_text(str(event.get("text") or ""))
        elif event_type == "runner.reasoning":
            update = acp.update_agent_thought_text(str(event.get("text") or ""))
        elif event_type == "artifact.recorded":
            fragments = [
                f"[artifact:{event.get('kind')}]",
                str(event.get("summary") or "").strip(),
                str(event.get("reason") or "").strip(),
            ]
            rendered = " ".join(item for item in fragments if item).strip() or "[artifact]"
            update = acp.update_agent_message_text(rendered)
        else:
            rendered = json.dumps(event, ensure_ascii=False)
            update = acp.update_agent_thought_text(rendered)

        notification = acp.session_notification(session_id, update)
        if hasattr(notification, "model_dump"):
            return notification.model_dump(by_alias=True, exclude_none=True)
        if hasattr(notification, "dict"):
            return notification.dict(by_alias=True, exclude_none=True)
        return dict(notification)
