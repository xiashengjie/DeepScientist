from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from ..memory.frontmatter import load_markdown_document


@dataclass(frozen=True)
class SkillBundle:
    skill_id: str
    name: str
    description: str
    root: Path
    skill_md: Path
    openai_yaml: Path | None = None
    claude_md: Path | None = None


def _parse_frontmatter(path: Path) -> dict:
    metadata, _body = load_markdown_document(path)
    if not isinstance(metadata, dict):
        return {}
    return metadata


def discover_skill_bundles(repo_root: Path) -> list[SkillBundle]:
    bundles: list[SkillBundle] = []
    skills_root = repo_root / "src" / "skills"
    if not skills_root.exists():
        return bundles
    for skill_md in sorted(skills_root.glob("*/SKILL.md")):
        skill_id = skill_md.parent.name
        if skill_id.startswith("."):
            continue
        metadata = _parse_frontmatter(skill_md)
        bundles.append(
            SkillBundle(
                skill_id=skill_id,
                name=metadata.get("name", skill_id),
                description=metadata.get("description", ""),
                root=skill_md.parent,
                skill_md=skill_md,
                openai_yaml=(skill_md.parent / "agents" / "openai.yaml") if (skill_md.parent / "agents" / "openai.yaml").exists() else None,
                claude_md=(skill_md.parent / "agents" / "claude.md") if (skill_md.parent / "agents" / "claude.md").exists() else None,
            )
        )
    return bundles
