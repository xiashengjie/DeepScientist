# DeepScientist Core

`DeepScientist Core` is a local-first research operating system for long-running scientific quests driven by `codex` or `claude`.

This repository is intentionally centered on a small core:

- one quest = one Git repository
- Python daemon as the authoritative runtime
- `npm`-friendly installation and local UI delivery
- two first-class local UI surfaces: TUI + web
- only two built-in MCP namespaces: `memory` and `artifact`
- `artifact` owns Git behavior internally
- prompts + skills drive the research flow
- UI and connectors remain thin control surfaces over the daemon

![DeepScientist](assets/deepscientist_figure.png)

## Current Status

This repository now has a working core skeleton, but the architecture remains intentionally docs-led.

The goal is to implement a minimal but complete Core that can:

- bootstrap `~/DeepScientist`
- create quest-local Git repositories
- sync first-party skills into `codex` / `claude` skill directories
- run a full research loop with baseline reuse, idea selection, experiments, analysis campaigns, and writing
- support direct user interaction through a TUI, a local web UI, and connectors
- keep all durable state inspectable in files and Git

## Target Install and Bootstrap Flow

The default user path should feel like:

```bash
npm install -g deepscientist
research
```

For a source checkout, treat this repository as a development tree and install it into a separate runtime tree:

```bash
bash install.sh
ds
```

The local installer deploys the current working tree into `~/DeepScientist/cli` by default, writes launchers into `~/.local/bin`, builds the web/TUI bundles inside the install tree, and keeps `node_modules` out of the current development checkout. The default runtime home is the same root: `~/DeepScientist/`.

If you want a custom location:

```bash
bash install.sh --dir /data/deepscientist --bin-dir /data/deepscientist/bin
/data/deepscientist/bin/ds
```

The same custom install path works through `npm`:

```bash
npm run install:local -- --dir /data/deepscientist --bin-dir /data/deepscientist/bin
```

If you prefer exact paths instead of a base directory, use:

```bash
bash install.sh --install-dir /data/deepscientist/cli --bin-dir /data/deepscientist/bin
```

You can also drive this from environment variables:

```bash
DEEPSCIENTIST_BASE_DIR=/data/deepscientist \
DEEPSCIENTIST_BIN_DIR=/data/deepscientist/bin \
npm run install:local
```

Implementation direction:

- the published package is `npm`-installable
- the daemon/runtime code lives in Python under `src/deepscientist/`
- the launcher bootstraps or updates the Python runtime automatically under `~/DeepScientist/runtime/venv`
- launcher startup repairs first-party skills in `~/.codex/skills/` and `~/.claude/agents/` when they are missing or when `src/skills/` changed
- the launcher binds the daemon on `0.0.0.0:20999` by default and opens the local workspace through `0.0.0.0:20999`
- the default launcher opens both the Ink TUI and the web workspace together
- launcher aliases should include:
  - `research`
  - `resear`
  - `ds-cli`
  - `ds`
- daemon lifecycle control should feel direct:
  - `research --stop`
  - `research --restart`
  - `research --tui`
  - `research --web`
  - `research --both`
- TUI quest control now follows explicit semantics:
  - bare text in home mode continues the currently selected quest
  - `/new <goal>` is the explicit way to create a new quest
  - `/projects` opens the quest picker
  - `/stop [quest_id|index]` stops a quest
  - `/resume [quest_id|index]` resumes a stopped quest
  - `/stop` and `/resume` without arguments open a DS_2027-style selection page
- `ds init` validates local Git readiness and guides the user to set `git config user.name` and `git config user.email` when needed
- installation also syncs first-party skills into:
  - `~/.codex/skills/deepscientist-*`
  - `~/.claude/agents/deepscientist-*.md`
- each new quest also mirrors the required skill bundle into:
  - `<quest_root>/.codex/skills/`
  - `<quest_root>/.claude/agents/`

## Default Runtime Home

The default runtime root is:

```text
~/DeepScientist/
  config/
  memory/
  plugins/
  quests/
    <quest_id>/
```

Each `~/DeepScientist/quests/<quest_id>/` directory is a standalone Git repository.
Every durable quest file must remain inside that quest's absolute `quest_root`.

## Default Research Flow

The Core should not expose a rigid nine-step wizard.
Instead, it should provide one default playbook with a small set of anchors:

- `scout` (optional)
- `baseline`
- `idea`
- `experiment`
- `analysis_campaign`
- `write`
- `finalize`

`decision` is cross-cutting and can happen at any point:

- continue the current idea
- branch into a new idea
- reuse an existing baseline
- reset back to scouting
- stop, archive, or publish

## Interfaces

Users should mainly think in terms of:

- quests
- status
- notes
- approvals
- pause / resume
- direct chat with the active quest agent

The system should support:

- CLI
- required local TUI
- required local web UI bound on `0.0.0.0:20999` and locally reachable at `0.0.0.0:20999`
- optional connectors such as QQ, Telegram, Discord, Slack, Gmail, Feishu, and WhatsApp

QQ is gateway-direct only in DeepScientist Core:

- inbound chat comes from the built-in QQ gateway client
- outbound sends use Tencent `app_id` + `app_secret`
- `openid` / `group_openid` are the only valid active send targets

Connectors are not notification-only.
They must be able to:

- receive commands
- carry direct user-agent conversation
- receive proactive progress and milestone updates from the daemon
- expose user-facing inspection actions such as current status, summary, and Git graph

The local web UI should also stay usable on phone-sized screens:

- copilot-first
- single-column on narrow viewports
- bottom-fixed composer
- drawers or sheets for memory, graph, skills, and settings

## Current Runtime Layout

The current codebase is split like this:

- Python daemon and core services:
  - `src/deepscientist/`
- React/Vite web workspace:
  - `src/ui/`
- Ink/React local TUI:
  - `src/tui/`
- npm launcher and bootstrap:
  - `bin/ds.js`

The local web workspace now uses path-based routes such as `/projects` and `/projects/<quest_id>` and is served by the same daemon API/event surface as the TUI.

## Canonical Docs

Start here if the goal is to implement the actual system:

- `docs/CORE_BLUEPRINT.md`
- `docs/CORE_ARCHITECTURE.md`
- `docs/UI_AND_WEB.md`
- `docs/MEMORY_AND_MCP.md`
- `docs/PROTOCOL_SCHEMAS.md`
- `docs/WORKFLOW_AND_SKILLS.md`
- `docs/PROMPTS_AND_CONNECTORS.md`
- `docs/SRC_IMPLEMENTATION.md`
- `docs/REGISTRIES.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/PLUGINS_AND_MARKETPLACE.md`

## Key External References

These references directly informed the current design:

- UI interaction and chat composition:
  - `/home/air/DeepScientist_latest/DS_2027/cli/ui/src/app/AppContainer.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/cli/ui/src/components/MainContent.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/cli/ui/src/components/Composer.tsx`
- web workspace, notebook chat, and visual system:
  - `/home/air/DeepScientist_latest/DS_2027/frontend/app/(main)/projects/page.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/app/(main)/projects/[projectId]/page.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/ProjectsAppBar.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/ProjectsHero.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/ProjectCard.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/CreateProjectDialog.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/features/projects/WorkspaceCreateCard.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/workspace/WorkspaceLayout.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/workspace/CopilotDockOverlay.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/aceternity/aurora-background.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/ai-manus/AiManusChatView.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/ai-manus/components/NotebookChatBox.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/ai-manus/components/ChatMessage.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/components/plugin/PluginRenderer.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/app/globals.css`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/markdown-viewer/MarkdownViewerPlugin.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/code-viewer/CodeViewerPlugin.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/code-editor/CodeEditorPlugin.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/notebook/components/NotebookEditor.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/i18n/useI18n.ts`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/i18n/messages/projects.ts`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabSurface.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabQuestPage.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabCopilotPanel.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabOverviewCanvas.tsx`
  - `/home/air/DeepScientist_latest/DS_2027/frontend/lib/plugins/lab/components/LabQuestGraphCanvas.tsx`
- agent role prompts and skill-driven research behavior:
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/pi.md`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/reproducer.md`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/analysis-experimenter.md`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/agents/writer.md`
  - `/home/air/DeepScientist_latest/DS_2027/cli/core/meta/prompt_compiler.py`
- runner parsing and MCP/runtime configuration:
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/services/codex_service.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/services/claude_service.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/agent_kernel/mcp/codex_config.py`
  - `/home/air/DeepScientist_latest/DS_2027/cli/backend/app/agent_kernel/template_manager.py`
- connector registry and routing ideas:
  - `/ssdwork/deepscientist/_references/nanoclaw/src/channels/registry.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/index.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/group-queue.ts`
  - `/ssdwork/deepscientist/_references/nanoclaw/src/ipc.ts`
- QQ connector background:
  - `https://cloud.tencent.com.cn/developer/article/2635190`
  - `https://cloud.tencent.com.cn/developer/article/2626045`
  - `https://cloud.tencent.com.cn/developer/article/2628828`
