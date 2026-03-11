from __future__ import annotations

import re
from pathlib import Path

from ..artifact.metrics import normalize_metric_contract, normalize_metrics_summary
from ..shared import append_jsonl, ensure_dir, read_jsonl, read_yaml, resolve_within, utc_now, write_yaml


_BASELINE_ID_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")


class BaselineRegistry:
    def __init__(self, home: Path) -> None:
        self.home = home
        self.root = ensure_dir(home / "config" / "baselines")
        self.entries_root = ensure_dir(self.root / "entries")
        self.index_path = self.root / "index.jsonl"

    def list_entries(self) -> list[dict]:
        entry_files = sorted(self.entries_root.glob("*.yaml"))
        if entry_files:
            return sorted((self._load_entry_file(path) for path in entry_files), key=self._entry_sort_key)

        latest_by_id: dict[str, dict] = {}
        for item in self._history_entries():
            baseline_id = str(item.get("baseline_id") or item.get("entry_id") or "").strip()
            if baseline_id:
                latest_by_id[baseline_id] = item
        return sorted(latest_by_id.values(), key=self._entry_sort_key)

    def get(self, baseline_id: str) -> dict | None:
        normalized_id = self._normalize_identifier(baseline_id, field_name="Baseline id")
        path = self._entry_path(normalized_id)
        if path.exists():
            return self._load_entry_file(path)
        return next(
            (
                item
                for item in self.list_entries()
                if item.get("baseline_id") == normalized_id or item.get("entry_id") == normalized_id
            ),
            None,
        )

    def publish(self, entry: dict) -> dict:
        timestamp = utc_now()
        baseline_id = self._normalize_identifier(
            entry.get("baseline_id") or entry.get("entry_id") or "",
            field_name="Baseline id",
        )
        if not baseline_id:
            raise ValueError("Baseline entry requires baseline_id or entry_id")
        existing = self.get(baseline_id) or {}
        baseline_variants = self._normalize_variants(entry.get("baseline_variants") or existing.get("baseline_variants") or [])
        default_variant_id = entry.get("default_variant_id", existing.get("default_variant_id"))
        if baseline_variants and default_variant_id is None and len(baseline_variants) == 1:
            default_variant_id = baseline_variants[0]["variant_id"]
        if default_variant_id is not None:
            default_variant_id = self._normalize_identifier(
                default_variant_id,
                field_name="Default baseline variant id",
            )
            if baseline_variants and default_variant_id not in {item["variant_id"] for item in baseline_variants}:
                raise ValueError(
                    f"Default baseline variant `{default_variant_id}` is not present in baseline_variants."
                )
        if not baseline_variants:
            default_variant_id = None
        metric_contract = normalize_metric_contract(
            entry.get("metric_contract") or existing.get("metric_contract"),
            baseline_id=baseline_id,
            metrics_summary=entry.get("metrics_summary") or existing.get("metrics_summary"),
            primary_metric=entry.get("primary_metric") or existing.get("primary_metric"),
            baseline_variants=baseline_variants,
        )
        normalized = {
            **existing,
            **entry,
            "registry_kind": "baseline",
            "schema_version": 1,
            "entry_id": baseline_id,
            "baseline_id": baseline_id,
            "status": entry.get("status") or existing.get("status", "active"),
            "created_at": existing.get("created_at") or entry.get("created_at", timestamp),
            "updated_at": timestamp,
            "metrics_summary": normalize_metrics_summary(entry.get("metrics_summary") or existing.get("metrics_summary")),
            "baseline_variants": baseline_variants,
            "default_variant_id": default_variant_id,
            "metric_contract": metric_contract,
        }
        write_yaml(self._entry_path(baseline_id), normalized)
        append_jsonl(self.index_path, normalized)
        return normalized

    def attach(self, quest_root: Path, baseline_id: str, variant_id: str | None = None) -> dict:
        normalized_baseline_id = self._normalize_identifier(baseline_id, field_name="Baseline id")
        entry = self.get(normalized_baseline_id)
        if not entry:
            raise FileNotFoundError(f"Unknown baseline: {normalized_baseline_id}")
        selected_variant = None
        variants = entry.get("baseline_variants") or []
        if variant_id:
            normalized_variant_id = self._normalize_identifier(variant_id, field_name="Baseline variant id")
            for variant in variants:
                if variant.get("variant_id") == normalized_variant_id:
                    selected_variant = variant
                    break
            if selected_variant is None:
                raise FileNotFoundError(f"Unknown baseline variant: {normalized_variant_id}")
        elif variants:
            default_variant_id = entry.get("default_variant_id")
            if default_variant_id:
                selected_variant = next((item for item in variants if item.get("variant_id") == default_variant_id), None)
                if selected_variant is None:
                    raise ValueError(
                        f"Baseline `{normalized_baseline_id}` points to missing default variant `{default_variant_id}`."
                    )
            else:
                selected_variant = variants[0]

        attachment_root = ensure_dir(self._attachment_root(quest_root, normalized_baseline_id))
        attachment = {
            "attached_at": utc_now(),
            "source_baseline_id": normalized_baseline_id,
            "source_variant_id": selected_variant.get("variant_id") if selected_variant else None,
            "entry": entry,
            "selected_variant": selected_variant,
        }
        write_yaml(attachment_root / "attachment.yaml", attachment)
        return attachment

    def _history_entries(self) -> list[dict]:
        return read_jsonl(self.index_path)

    def _entry_path(self, baseline_id: str) -> Path:
        return resolve_within(self.entries_root, f"{baseline_id}.yaml")

    @staticmethod
    def _attachment_root(quest_root: Path, baseline_id: str) -> Path:
        return resolve_within(quest_root / "baselines" / "imported", baseline_id)

    @staticmethod
    def _entry_sort_key(entry: dict) -> tuple[str, str]:
        return (
            str(entry.get("updated_at") or entry.get("created_at") or ""),
            str(entry.get("baseline_id") or entry.get("entry_id") or ""),
        )

    @staticmethod
    def _normalize_identifier(value: object, *, field_name: str) -> str:
        normalized = str(value or "").strip()
        if not normalized or not _BASELINE_ID_PATTERN.fullmatch(normalized):
            raise ValueError(
                f"{field_name} must match `^[A-Za-z0-9][A-Za-z0-9._-]*$`."
            )
        return normalized

    def _load_entry_file(self, path: Path) -> dict:
        payload = read_yaml(path, {})
        if isinstance(payload, dict) and payload:
            return payload
        baseline_id = path.stem
        return {
            "registry_kind": "baseline",
            "schema_version": 1,
            "entry_id": baseline_id,
            "baseline_id": baseline_id,
            "status": "unhealthy",
            "path": str(path),
            "summary": "Registry entry could not be loaded as a mapping.",
        }

    def _normalize_variants(self, variants: list[dict]) -> list[dict]:
        normalized_variants: list[dict] = []
        seen_variant_ids: set[str] = set()
        for index, variant in enumerate(variants):
            if not isinstance(variant, dict):
                raise ValueError(f"Baseline variant #{index + 1} must be a mapping.")
            variant_id = self._normalize_identifier(
                variant.get("variant_id"),
                field_name="Baseline variant id",
            )
            if variant_id in seen_variant_ids:
                raise ValueError(f"Duplicate baseline variant id `{variant_id}`.")
            seen_variant_ids.add(variant_id)
            normalized_variants.append(
                {
                    **variant,
                    "variant_id": variant_id,
                    "metrics_summary": normalize_metrics_summary(variant.get("metrics_summary")),
                }
            )
        return normalized_variants
