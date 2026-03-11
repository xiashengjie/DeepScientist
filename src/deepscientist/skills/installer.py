from __future__ import annotations

import shutil
from pathlib import Path
from uuid import uuid4

from ..memory.frontmatter import load_markdown_document
from ..shared import ensure_dir
from .registry import discover_skill_bundles


class SkillInstaller:
    def __init__(self, repo_root: Path, home: Path) -> None:
        self.repo_root = repo_root
        self.home = home

    def discover(self):
        return discover_skill_bundles(self.repo_root)

    def sync_global(self) -> dict:
        codex_root = ensure_dir(Path.home() / ".codex" / "skills")
        claude_root = ensure_dir(Path.home() / ".claude" / "agents")
        copied_codex: list[str] = []
        copied_claude: list[str] = []
        expected_codex: set[str] = set()
        expected_claude: set[str] = set()
        for bundle in self.discover():
            target = codex_root / f"deepscientist-{bundle.skill_id}"
            expected_codex.add(target.name)
            self._sync_bundle_tree(bundle.root, target)
            copied_codex.append(str(target))
            claude_target = self._sync_claude_projection(bundle, claude_root)
            expected_claude.add(claude_target.name)
            copied_claude.append(str(claude_target))
        self._prune_bundle_targets(codex_root, expected_codex)
        self._prune_bundle_targets(claude_root, expected_claude)
        return {
            "codex": copied_codex,
            "claude": copied_claude,
            "notes": [],
        }

    def sync_quest(self, quest_root: Path) -> dict:
        codex_root = ensure_dir(quest_root / ".codex" / "skills")
        claude_root = ensure_dir(quest_root / ".claude" / "agents")
        copied_codex: list[str] = []
        copied_claude: list[str] = []
        expected_codex: set[str] = set()
        expected_claude: set[str] = set()
        for bundle in self.discover():
            target = codex_root / f"deepscientist-{bundle.skill_id}"
            expected_codex.add(target.name)
            self._sync_bundle_tree(bundle.root, target)
            copied_codex.append(str(target))
            claude_target = self._sync_claude_projection(bundle, claude_root)
            expected_claude.add(claude_target.name)
            copied_claude.append(str(claude_target))
        self._prune_bundle_targets(codex_root, expected_codex)
        self._prune_bundle_targets(claude_root, expected_claude)
        return {
            "codex": copied_codex,
            "claude": copied_claude,
            "notes": [],
        }

    def _sync_claude_projection(self, bundle, target_root: Path) -> Path:
        target = target_root / f"deepscientist-{bundle.skill_id}.md"
        if bundle.claude_md and bundle.claude_md.exists():
            self._write_bytes_atomic(target, bundle.claude_md.read_bytes())
            return target
        self._write_bytes_atomic(target, self._render_claude_projection(bundle).encode("utf-8"))
        return target

    @staticmethod
    def _render_claude_projection(bundle) -> str:
        metadata, body = load_markdown_document(bundle.skill_md)
        title = str(metadata.get("name") or bundle.name or bundle.skill_id)
        description = str(metadata.get("description") or "").strip()
        parts = [f"# {title}", ""]
        if description:
            parts.extend([description, ""])
        parts.append(body.strip())
        return "\n".join(parts).rstrip() + "\n"

    def _sync_bundle_tree(self, source_root: Path, target_root: Path) -> None:
        ensure_dir(target_root)
        expected_paths: set[Path] = set()

        for source_path in sorted(source_root.rglob("*")):
            relative = source_path.relative_to(source_root)
            expected_paths.add(relative)
            target_path = target_root / relative
            if source_path.is_dir():
                ensure_dir(target_path)
                continue
            self._sync_file(source_path, target_path)

        for target_path in sorted(target_root.rglob("*"), reverse=True):
            relative = target_path.relative_to(target_root)
            if relative in expected_paths:
                continue
            if target_path.is_dir():
                shutil.rmtree(target_path)
            else:
                target_path.unlink(missing_ok=True)

    def _sync_file(self, source_path: Path, target_path: Path) -> None:
        payload = source_path.read_bytes()
        if target_path.exists():
            try:
                if target_path.read_bytes() == payload:
                    return
            except OSError:
                pass
        self._write_bytes_atomic(target_path, payload)

    @staticmethod
    def _write_bytes_atomic(path: Path, payload: bytes) -> None:
        ensure_dir(path.parent)
        temp_path = path.parent / f".{path.name}.tmp-{uuid4().hex}"
        temp_path.write_bytes(payload)
        temp_path.replace(path)

    @staticmethod
    def _prune_bundle_targets(root: Path, expected_names: set[str]) -> None:
        for target in sorted(root.glob("deepscientist-*"), reverse=True):
            if target.name in expected_names:
                continue
            if target.is_dir():
                shutil.rmtree(target)
            else:
                target.unlink(missing_ok=True)
