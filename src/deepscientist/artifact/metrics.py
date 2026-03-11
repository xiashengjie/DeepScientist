from __future__ import annotations

from collections import OrderedDict
from typing import Any


def as_metric_id(value: object, *, fallback: str | None = None) -> str:
    text = str(value or "").strip()
    if text:
        return text
    if fallback:
        return fallback
    raise ValueError("Metric id is required.")


def to_number(value: object) -> float | None:
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip()
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def infer_metric_direction(metric_id: str) -> str:
    normalized = metric_id.strip().lower()
    if any(token in normalized for token in ("loss", "error", "wer", "cer", "perplex", "latency", "time")):
        return "minimize"
    return "maximize"


def normalize_metrics_summary(summary: object) -> dict[str, Any]:
    if not isinstance(summary, dict):
        return {}
    normalized: dict[str, Any] = {}
    for key, value in summary.items():
        metric_id = str(key or "").strip()
        if not metric_id:
            continue
        normalized[metric_id] = value
    return normalized


def _normalize_metric_entry(metric: object, *, fallback_id: str | None = None) -> dict[str, Any]:
    if isinstance(metric, str):
        metric_id = as_metric_id(metric, fallback=fallback_id)
        return {
            "metric_id": metric_id,
            "label": metric_id,
            "direction": infer_metric_direction(metric_id),
            "unit": None,
            "decimals": None,
            "chart_group": "default",
        }
    if not isinstance(metric, dict):
        metric_id = as_metric_id(fallback_id)
        return {
            "metric_id": metric_id,
            "label": metric_id,
            "direction": infer_metric_direction(metric_id),
            "unit": None,
            "decimals": None,
            "chart_group": "default",
        }

    metric_id = as_metric_id(
        metric.get("metric_id") or metric.get("id") or metric.get("name") or fallback_id,
    )
    direction = str(metric.get("direction") or "").strip().lower()
    if direction not in {"maximize", "minimize"}:
        direction = infer_metric_direction(metric_id)
    decimals_raw = metric.get("decimals")
    decimals = int(decimals_raw) if isinstance(decimals_raw, int) else None
    chart_group = str(metric.get("chart_group") or "default").strip() or "default"
    return {
        **metric,
        "metric_id": metric_id,
        "label": str(metric.get("label") or metric_id).strip() or metric_id,
        "direction": direction,
        "unit": str(metric.get("unit") or "").strip() or None,
        "decimals": decimals,
        "chart_group": chart_group,
    }


def normalize_metric_contract(
    contract: object,
    *,
    baseline_id: str | None = None,
    metrics_summary: object = None,
    primary_metric: object = None,
    baseline_variants: object = None,
) -> dict[str, Any]:
    contract_payload = contract if isinstance(contract, dict) else {}
    metrics_by_id: OrderedDict[str, dict[str, Any]] = OrderedDict()

    explicit_metrics = contract_payload.get("metrics") if isinstance(contract_payload.get("metrics"), list) else []
    for index, metric in enumerate(explicit_metrics):
        normalized = _normalize_metric_entry(metric, fallback_id=f"metric_{index + 1}")
        metrics_by_id[normalized["metric_id"]] = normalized

    summary_metrics = normalize_metrics_summary(metrics_summary)
    for metric_id in summary_metrics.keys():
        metrics_by_id.setdefault(metric_id, _normalize_metric_entry({}, fallback_id=metric_id))

    if isinstance(baseline_variants, list):
        for variant in baseline_variants:
            if not isinstance(variant, dict):
                continue
            for metric_id in normalize_metrics_summary(variant.get("metrics_summary")).keys():
                metrics_by_id.setdefault(metric_id, _normalize_metric_entry({}, fallback_id=metric_id))

    primary_metric_id = str(contract_payload.get("primary_metric_id") or "").strip()
    if not primary_metric_id:
        if isinstance(primary_metric, dict):
            primary_metric_id = str(
                primary_metric.get("metric_id") or primary_metric.get("name") or primary_metric.get("id") or ""
            ).strip()
        elif isinstance(primary_metric, str):
            primary_metric_id = primary_metric.strip()
    if not primary_metric_id and summary_metrics:
        primary_metric_id = next(iter(summary_metrics.keys()))
    if not primary_metric_id and metrics_by_id:
        primary_metric_id = next(iter(metrics_by_id.keys()))

    if primary_metric_id:
        metrics_by_id.setdefault(primary_metric_id, _normalize_metric_entry({}, fallback_id=primary_metric_id))

    return {
        "contract_id": str(contract_payload.get("contract_id") or baseline_id or "default").strip() or "default",
        "primary_metric_id": primary_metric_id or None,
        "metrics": list(metrics_by_id.values()),
    }


def selected_baseline_metrics(entry: dict[str, Any] | None, selected_variant_id: str | None = None) -> dict[str, Any]:
    if not isinstance(entry, dict) or not entry:
        return {}
    variants = entry.get("baseline_variants") if isinstance(entry.get("baseline_variants"), list) else []
    target_id = str(selected_variant_id or entry.get("default_variant_id") or "").strip()
    selected_variant = None
    if target_id:
        selected_variant = next(
            (item for item in variants if isinstance(item, dict) and str(item.get("variant_id") or "").strip() == target_id),
            None,
        )
    if selected_variant is None and variants:
        selected_variant = next((item for item in variants if isinstance(item, dict)), None)
    if isinstance(selected_variant, dict):
        summary = normalize_metrics_summary(selected_variant.get("metrics_summary"))
        if summary:
            return summary
    return normalize_metrics_summary(entry.get("metrics_summary"))


def baseline_metric_lines(entry: dict[str, Any] | None, selected_variant_id: str | None = None) -> list[dict[str, Any]]:
    if not isinstance(entry, dict) or not entry:
        return []
    baseline_id = str(entry.get("baseline_id") or entry.get("entry_id") or "").strip() or None
    selected_id = str(selected_variant_id or entry.get("default_variant_id") or "").strip() or None
    lines: list[dict[str, Any]] = []
    variants = entry.get("baseline_variants") if isinstance(entry.get("baseline_variants"), list) else []
    for variant in variants:
        if not isinstance(variant, dict):
            continue
        variant_id = str(variant.get("variant_id") or "").strip() or None
        metrics_summary = normalize_metrics_summary(variant.get("metrics_summary"))
        for metric_id, value in metrics_summary.items():
            numeric_value = to_number(value)
            lines.append(
                {
                    "metric_id": metric_id,
                    "label": f"{baseline_id or 'baseline'}:{variant_id or 'variant'}",
                    "baseline_id": baseline_id,
                    "variant_id": variant_id,
                    "selected": bool(selected_id and variant_id == selected_id),
                    "value": numeric_value,
                    "raw_value": value,
                }
            )
    if lines:
        return lines
    for metric_id, value in normalize_metrics_summary(entry.get("metrics_summary")).items():
        numeric_value = to_number(value)
        lines.append(
            {
                "metric_id": metric_id,
                "label": baseline_id or "baseline",
                "baseline_id": baseline_id,
                "variant_id": None,
                "selected": True,
                "value": numeric_value,
                "raw_value": value,
            }
        )
    return lines


def normalize_metric_rows(
    metric_rows: object,
    *,
    metrics_summary: object = None,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    if isinstance(metric_rows, list):
        for row in metric_rows:
            if not isinstance(row, dict):
                continue
            metric_id = str(row.get("metric_id") or row.get("name") or row.get("metric") or "").strip()
            if not metric_id:
                candidate_keys = [key for key in row.keys() if key not in {"split", "seed", "note", "notes"}]
                if len(candidate_keys) == 1:
                    metric_id = candidate_keys[0]
            if not metric_id:
                continue
            value = row.get("value", row.get(metric_id))
            rows.append(
                {
                    **row,
                    "metric_id": metric_id,
                    "value": value,
                    "numeric_value": to_number(value),
                }
            )
    if rows:
        return rows
    for metric_id, value in normalize_metrics_summary(metrics_summary).items():
        rows.append(
            {
                "metric_id": metric_id,
                "value": value,
                "numeric_value": to_number(value),
            }
        )
    return rows


def compare_with_baseline(
    *,
    metrics_summary: object,
    metric_contract: object,
    baseline_metrics: object,
) -> dict[str, Any]:
    run_summary = normalize_metrics_summary(metrics_summary)
    baseline_summary = normalize_metrics_summary(baseline_metrics)
    contract = normalize_metric_contract(metric_contract, metrics_summary=run_summary)
    items: list[dict[str, Any]] = []
    metric_ids = [item["metric_id"] for item in contract.get("metrics", [])]
    for metric_id in baseline_summary.keys():
        if metric_id not in metric_ids:
            metric_ids.append(metric_id)
    for metric_id in run_summary.keys():
        if metric_id not in metric_ids:
            metric_ids.append(metric_id)

    metric_meta = {
        item["metric_id"]: item
        for item in contract.get("metrics", [])
        if isinstance(item, dict) and item.get("metric_id")
    }
    for metric_id in metric_ids:
        meta = metric_meta.get(metric_id) or _normalize_metric_entry({}, fallback_id=metric_id)
        run_value = run_summary.get(metric_id)
        baseline_value = baseline_summary.get(metric_id)
        run_number = to_number(run_value)
        baseline_number = to_number(baseline_value)
        delta = None
        relative_delta = None
        better = None
        if run_number is not None and baseline_number is not None:
            delta = run_number - baseline_number
            if baseline_number not in {0.0, -0.0}:
                relative_delta = delta / abs(baseline_number)
            direction = meta.get("direction") or infer_metric_direction(metric_id)
            if direction == "maximize":
                better = run_number > baseline_number
            else:
                better = run_number < baseline_number
        items.append(
            {
                "metric_id": metric_id,
                "label": meta.get("label") or metric_id,
                "direction": meta.get("direction") or infer_metric_direction(metric_id),
                "unit": meta.get("unit"),
                "decimals": meta.get("decimals"),
                "chart_group": meta.get("chart_group"),
                "run_value": run_value,
                "baseline_value": baseline_value,
                "run_numeric": run_number,
                "baseline_numeric": baseline_number,
                "delta": delta,
                "relative_delta": relative_delta,
                "better": better,
            }
        )

    primary_metric_id = str(contract.get("primary_metric_id") or "").strip() or None
    primary_item = next((item for item in items if item["metric_id"] == primary_metric_id), None)
    if primary_item is None and items:
        primary_item = items[0]
        primary_metric_id = primary_item["metric_id"]

    improved = [item["metric_id"] for item in items if item.get("better") is True]
    regressed = [item["metric_id"] for item in items if item.get("better") is False]
    comparable = [item["metric_id"] for item in items if item.get("better") is not None]
    return {
        "primary_metric_id": primary_metric_id,
        "items": items,
        "summary": {
            "comparable_metric_ids": comparable,
            "improved_metric_ids": improved,
            "regressed_metric_ids": regressed,
        },
        "primary": primary_item,
    }


def compute_progress_eval(
    *,
    comparisons: dict[str, Any],
    previous_primary_best: float | None,
) -> dict[str, Any]:
    primary = comparisons.get("primary") if isinstance(comparisons, dict) else None
    if not isinstance(primary, dict):
        return {
            "primary_metric_id": None,
            "beats_baseline": None,
            "improved_over_previous_best": None,
            "breakthrough": False,
            "breakthrough_level": "none",
            "reason": "Primary metric is unavailable.",
        }

    direction = str(primary.get("direction") or infer_metric_direction(str(primary.get("metric_id") or ""))).strip()
    run_value = primary.get("run_numeric")
    baseline_value = primary.get("baseline_numeric")
    beats_baseline = primary.get("better")
    improved_over_previous = None
    delta_vs_previous = None
    if run_value is not None and previous_primary_best is not None:
        delta_vs_previous = run_value - previous_primary_best
        improved_over_previous = run_value > previous_primary_best if direction == "maximize" else run_value < previous_primary_best
    breakthrough = bool(improved_over_previous or (improved_over_previous is None and beats_baseline))
    if improved_over_previous:
        level = "major"
        reason = "Primary metric set a new best main-experiment result."
    elif beats_baseline:
        level = "minor"
        reason = "Primary metric beat the attached baseline."
    else:
        level = "none"
        reason = "No verified breakthrough over the active baseline or previous best."
    return {
        "primary_metric_id": primary.get("metric_id"),
        "direction": direction,
        "run_value": run_value,
        "baseline_value": baseline_value,
        "delta_vs_baseline": primary.get("delta"),
        "relative_delta_vs_baseline": primary.get("relative_delta"),
        "previous_best_value": previous_primary_best,
        "delta_vs_previous_best": delta_vs_previous,
        "beats_baseline": beats_baseline,
        "improved_over_previous_best": improved_over_previous,
        "breakthrough": breakthrough,
        "breakthrough_level": level,
        "reason": reason,
    }


def build_metrics_timeline(
    *,
    quest_id: str,
    run_records: list[dict[str, Any]],
    baseline_entry: dict[str, Any] | None = None,
    selected_variant_id: str | None = None,
) -> dict[str, Any]:
    ordered_runs = sorted(
        [item for item in run_records if isinstance(item, dict)],
        key=lambda item: str(item.get("updated_at") or item.get("created_at") or ""),
    )
    contract = normalize_metric_contract(
        None,
        baseline_id=str((baseline_entry or {}).get("baseline_id") or ""),
        metrics_summary=(baseline_entry or {}).get("metrics_summary"),
        primary_metric=(baseline_entry or {}).get("primary_metric"),
        baseline_variants=(baseline_entry or {}).get("baseline_variants"),
    )
    for record in ordered_runs:
        run_contract = record.get("metric_contract")
        if run_contract:
            contract = normalize_metric_contract(run_contract, metrics_summary=record.get("metrics_summary"))
            break

    series_map: OrderedDict[str, dict[str, Any]] = OrderedDict()
    for metric in contract.get("metrics", []):
        metric_id = str(metric.get("metric_id") or "").strip()
        if not metric_id:
            continue
        series_map[metric_id] = {
            "metric_id": metric_id,
            "label": metric.get("label") or metric_id,
            "direction": metric.get("direction") or infer_metric_direction(metric_id),
            "unit": metric.get("unit"),
            "decimals": metric.get("decimals"),
            "chart_group": metric.get("chart_group"),
            "baselines": [],
            "points": [],
        }

    for line in baseline_metric_lines(baseline_entry, selected_variant_id):
        metric_id = str(line.get("metric_id") or "").strip()
        if not metric_id:
            continue
        series_map.setdefault(
            metric_id,
            {
                "metric_id": metric_id,
                "label": metric_id,
                "direction": infer_metric_direction(metric_id),
                "unit": None,
                "decimals": None,
                "chart_group": "default",
                "baselines": [],
                "points": [],
            },
        )
        series_map[metric_id]["baselines"].append(line)

    for index, record in enumerate(ordered_runs, start=1):
        summary = normalize_metrics_summary(record.get("metrics_summary"))
        progress = record.get("progress_eval") if isinstance(record.get("progress_eval"), dict) else {}
        comparisons = record.get("baseline_comparisons") if isinstance(record.get("baseline_comparisons"), dict) else {}
        comparison_by_id = {
            str(item.get("metric_id") or "").strip(): item
            for item in comparisons.get("items", [])
            if isinstance(item, dict) and item.get("metric_id")
        }
        for metric_id, raw_value in summary.items():
            series_map.setdefault(
                metric_id,
                {
                    "metric_id": metric_id,
                    "label": metric_id,
                    "direction": infer_metric_direction(metric_id),
                    "unit": None,
                    "decimals": None,
                    "chart_group": "default",
                    "baselines": [],
                    "points": [],
                },
            )
            comparison = comparison_by_id.get(metric_id, {})
            series_map[metric_id]["points"].append(
                {
                    "seq": index,
                    "run_id": record.get("run_id"),
                    "artifact_id": record.get("artifact_id"),
                    "created_at": record.get("updated_at") or record.get("created_at"),
                    "branch": record.get("branch"),
                    "idea_id": record.get("idea_id"),
                    "value": to_number(raw_value),
                    "raw_value": raw_value,
                    "delta_vs_baseline": comparison.get("delta"),
                    "relative_delta_vs_baseline": comparison.get("relative_delta"),
                    "breakthrough": bool(progress.get("breakthrough")),
                    "breakthrough_level": progress.get("breakthrough_level"),
                    "result_path": ((record.get("paths") or {}) if isinstance(record.get("paths"), dict) else {}).get("result_json"),
                }
            )

    primary_metric_id = str(contract.get("primary_metric_id") or "").strip() or None
    series = [item for item in series_map.values() if item["points"] or item["baselines"]]
    return {
        "quest_id": quest_id,
        "primary_metric_id": primary_metric_id,
        "series": series,
        "total_runs": len(ordered_runs),
        "baseline_ref": {
            "baseline_id": (baseline_entry or {}).get("baseline_id"),
            "variant_id": selected_variant_id,
        }
        if baseline_entry
        else None,
    }
