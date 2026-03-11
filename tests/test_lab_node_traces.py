from __future__ import annotations

from pathlib import Path

from deepscientist.home import ensure_home_layout
from deepscientist.quest import QuestService
from deepscientist.shared import append_jsonl, ensure_dir, utc_now, write_json


def test_node_traces_materialize_branch_stage_and_event_views(temp_home: Path) -> None:
    ensure_home_layout(temp_home)
    service = QuestService(temp_home)
    quest = service.create("trace materialization quest", quest_id="trace-quest")
    quest_id = quest["quest_id"]
    quest_root = Path(quest["quest_root"])

    run_id = "run-idea-1"
    run_root = ensure_dir(quest_root / ".ds" / "runs" / run_id)
    history_root = ensure_dir(quest_root / ".ds" / "codex_history" / run_id)
    write_json(
        history_root / "meta.json",
        {
            "run_id": run_id,
            "skill_id": "idea",
            "summary": "Generated idea branch plan.",
            "created_at": utc_now(),
            "updated_at": utc_now(),
            "history_root": str(history_root),
            "run_root": str(run_root),
        },
    )
    append_jsonl(
        history_root / "events.jsonl",
        {
            "timestamp": utc_now(),
            "event": {
                "type": "item.started",
                "item": {
                    "type": "web_search",
                    "id": "call-1",
                    "query": "arxiv graph reasoning",
                },
            },
        },
    )
    append_jsonl(
        history_root / "events.jsonl",
        {
            "timestamp": utc_now(),
            "event": {
                "type": "reasoning",
                "item": {
                    "type": "reasoning",
                    "text": "Compare prior graph reasoning methods before drafting the idea.",
                },
            },
        },
    )

    artifact_path = ensure_dir(quest_root / "artifacts" / "reports") / "idea-report.json"
    write_json(
        artifact_path,
        {
            "artifact_id": "idea-report",
            "kind": "report",
            "branch": "idea/graph-reasoning",
            "run_id": run_id,
            "summary": "Idea report saved.",
            "updated_at": utc_now(),
        },
    )

    payload = service.node_traces(quest_id)

    assert payload["quest_id"] == quest_id
    assert Path(payload["materialized_path"]).exists()

    branch_trace = next(
        item
        for item in payload["items"]
        if item["selection_type"] == "branch_node" and item["selection_ref"] == "idea/graph-reasoning"
    )
    assert branch_trace["counts"]["actions"] >= 2

    stage_trace = next(
        item
        for item in payload["items"]
        if item["selection_type"] == "stage_node"
        and item["selection_ref"] == "stage:idea/graph-reasoning:idea"
    )
    assert stage_trace["stage_key"] == "idea"

    event_trace = next(item for item in payload["items"] if item["selection_type"] == "event_node")
    detail = service.node_trace(
        quest_id,
        event_trace["selection_ref"],
        selection_type="event_node",
    )
    assert detail["trace"]["selection_ref"] == event_trace["selection_ref"]
    assert detail["trace"]["actions"]


def test_node_traces_include_worktree_artifacts(temp_home: Path) -> None:
    ensure_home_layout(temp_home)
    service = QuestService(temp_home)
    quest = service.create("trace worktree quest", quest_id="trace-worktree")
    quest_id = quest["quest_id"]
    quest_root = Path(quest["quest_root"])

    worktree_root = ensure_dir(quest_root / ".ds" / "worktrees" / "idea-adapter")
    artifact_path = ensure_dir(worktree_root / "artifacts" / "runs") / "analysis-run.json"
    write_json(
        artifact_path,
        {
            "artifact_id": "analysis-run",
            "kind": "run",
            "branch": "analysis/idea-1/slice-a",
            "run_id": "analysis-run-1",
            "run_kind": "analysis.ablation",
            "summary": "Analysis slice recorded from worktree.",
            "worktree_rel_path": ".ds/worktrees/idea-adapter",
            "updated_at": utc_now(),
        },
    )

    payload = service.node_traces(quest_id)
    branch_trace = next(
        item
        for item in payload["items"]
        if item["selection_type"] == "branch_node" and item["selection_ref"] == "analysis/idea-1/slice-a"
    )
    assert branch_trace["counts"]["artifacts"] >= 1
