---
name: optimize
description: Use when an algorithm-first quest should manage candidate briefs, optimization frontier, branch promotion, or fusion-aware search instead of the paper-oriented default loop.
---

# Optimize

Use this skill for algorithm-first quests where the goal is the strongest justified optimization result rather than paper packaging.

This skill is the lightweight optimization control layer for DeepScientist.
It does not replace the normal quest runtime. It tells you how to use the existing DeepScientist artifact, memory, bash_exec, Git, and worktree mechanisms as an optimization system.

## Interaction discipline

- Follow the shared interaction contract injected by the system prompt.
- For ordinary active work, prefer a concise progress update once work has crossed roughly 6 tool calls with a human-meaningful delta, and do not drift beyond roughly 12 tool calls or about 8 minutes without a user-visible update.
- Ordinary candidate creation, smoke checks, and route updates should stay concise.
- Use richer milestone updates only when a candidate is promoted, a strong run finishes, the frontier shifts materially, or a fusion/debug route becomes the new main path.
- When the user asks for the current optimization state, answer from the frontier and durable artifacts rather than from chat memory.

## Stage purpose

The optimize stage should do four things:

1. turn loose ideas into candidate briefs
2. rank and promote only the strongest briefs into durable lines
3. manage candidate attempts within a durable line
4. choose when to explore, exploit, fuse, debug, or stop

This skill is especially appropriate when `startup_contract.need_research_paper = false`.

Treat `optimize` as one stable stage skill with six internal submodes:

- `brief`
- `rank`
- `seed`
- `loop`
- `fusion`
- `debug`

Do not treat these as separate public skills.
Treat them as internal execution modes inside one optimize workflow.

InternAgent maps most naturally onto the `brief` and `rank` side of this stage.
MLEvolve maps most naturally onto the `seed`, `loop`, `fusion`, and `debug` side of this stage.
Do not collapse those two layers into one vague "optimize more" loop.

## Required working files

Before broad optimization search or candidate management becomes substantial, maintain these quest-visible control files:

- `OPTIMIZE_CHECKLIST.md`
- `CANDIDATE_BOARD.md`

Use:

- `references/optimize-checklist-template.md`
- `references/candidate-board-template.md`

`OPTIMIZE_CHECKLIST.md` is the execution control surface.
It should track:

- current frontier mode
- current optimize submode
- candidate brief count
- promoted line count
- current smoke queue
- current full-eval queue
- stagnation / fusion checks
- next concrete action

`CANDIDATE_BOARD.md` is the compact candidate ledger.
It should track:

- candidate id
- candidate type: brief or implementation attempt
- parent line or parent candidate
- strategy: explore / exploit / fusion / debug
- status
- expected gain
- observed result
- promote / archive recommendation

## Reference routing

Use the optimize references deliberately instead of opening them all at once.

- `references/method-brief-template.md`
  - use when a candidate brief is still under-specified
  - use before `submission_mode='candidate'` creation

- `references/brief-shaping-playbook.md`
  - use when a direction is still fuzzy and needs to be turned into a ranking-ready candidate brief
  - use before widening the slate with more half-specified variants
  - use to preserve the "clarify -> compare approaches -> recommend -> self-check" discipline for candidate briefs

- `references/candidate-ranking-template.md`
  - use when several candidate briefs compete for promotion
  - use before promoting briefs into durable lines

- `references/candidate-board-template.md`
  - use whenever the candidate pool becomes larger than a few items
  - use to keep brief-level and implementation-level candidates visible in one place

- `references/optimize-checklist-template.md`
  - use at the start of each meaningful optimize pass
  - use whenever the frontier or run queue changed materially

- `references/frontier-review-template.md`
  - use when the next route is unclear
  - use after a measured result, after repeated failures, or before fusion

- `references/codegen-route-playbook.md`
  - use before choosing between brief-only, stepwise generation, diff patching, or full rewrite

- `references/debug-response-template.md`
  - use when a candidate failed and still looks strategically valuable

- `references/fusion-playbook.md`
  - use when at least two lines have complementary strengths and fusion is genuinely under consideration

- `references/plateau-response-playbook.md`
  - use when a line keeps producing non-improving results

- `references/optimization-memory-template.md`
  - use when writing reusable success / failure / fusion lessons back into memory

- `references/prompt-patterns.md`
  - use when shaping or revising optimize sub-prompts so they remain stable and structurally consistent

## Non-negotiable rules

- Do not treat every patch or micro-attempt as a new durable idea line.
- Do not create a new Git branch/worktree for every implementation-level candidate.
- Use `artifact.submit_idea(..., submission_mode='candidate')` for candidate briefs that should be ranked before promotion.
- Use `artifact.submit_idea(..., submission_mode='line')` only for directions that deserve a durable optimization line and branch/worktree.
- Use `artifact.record(kind='report', report_type='optimization_candidate', ...)` for implementation-level candidate attempts inside one durable line.
- Before deciding the next route, call `artifact.get_optimization_frontier(...)` when available and use it as the primary optimization-state summary.
- Keep all major optimization successes and failures durable through artifacts and memory.
- Do not drift into paper-outline, bundle, or finalize work by default while this stage is active.
- Do not convert ranking uncertainty into premature branch creation.
- Do not treat an implementation-level candidate report as a new durable optimization line.
- Do not keep widening the frontier once a small serious slate already exists.
- Do not let one optimize pass mix multiple major route changes.
  One pass may inspect several possibilities, but it should finish with one dominant next action.

## When to use

- the quest is algorithm-first
- the baseline gate is already confirmed or waived
- the task has at least one plausible optimization direction
- multiple candidate directions exist and the system should rank them before promotion
- a durable line exists and the next step is to manage explore / exploit / fuse / debug

## Do not use when

- the baseline gate is unresolved
- the main need is a paper draft, rebuttal, or review task
- the quest is still in broad literature scouting with no concrete optimization handle

## Core object model

Use these three object levels consistently:

1. candidate brief
   `artifact.submit_idea(mode='create', submission_mode='candidate', ...)`
   This records a possible direction or method brief without opening a branch yet.

2. durable optimization line
   `artifact.submit_idea(mode='create', submission_mode='line', ...)`
   This opens a real branch/worktree and becomes a formal optimization path.

3. implementation-level candidate attempt
   `artifact.record(kind='report', report_type='optimization_candidate', ...)`
   This is a within-line attempt such as one patch, one smoke candidate, one debug candidate, or one fusion candidate.

## Recommended workflow

1. Read the current frontier and recent durable state.
2. If only loose candidate directions exist, create or refine candidate briefs first.
3. Rank the candidate briefs and promote only the best `1-3` into durable lines.
4. Inside a durable line, generate a small candidate pool, then run bounded smoke checks before full evaluations.
5. Record each implementation-level attempt durably with status, change plan, and result.
6. After each real result, decide whether to explore, exploit, fuse, debug, or stop.
7. Write optimization lessons to memory before leaving the stage.

At the start of each meaningful optimize pass, update `OPTIMIZE_CHECKLIST.md` before spending significant code or compute.

## Mandatory first-call sequence

At the start of a meaningful optimize pass, use this order unless a stronger local reason exists:

1. `artifact.get_optimization_frontier(...)`
2. `memory.search(...)`
3. `artifact.get_quest_state(detail='summary')`
4. `artifact.read_quest_documents(...)` when exact durable wording matters

Do not start generating new candidates before the frontier and recent optimization lessons are checked.

## Stage-start requirement

Stage-start requirement:

- run `memory.list_recent(scope='quest', limit=5)`
- run at least one `memory.search(...)`
- read `artifact.get_optimization_frontier(...)`
- update `OPTIMIZE_CHECKLIST.md`

If the frontier is missing or obviously stale, recover that state before proposing more work.

## Internal submode selection

Choose exactly one primary optimize submode for the current meaningful pass.

Default selection order:

1. `fusion`
   - when the frontier explicitly says `fusion`
2. `debug`
   - when a strategically valuable candidate failed for a concrete and likely fixable reason
3. `rank`
   - when several candidate briefs already exist and promotion is the main unresolved question
4. `brief`
   - when the candidate-brief slate is too thin or too weak
5. `seed`
   - when a durable line exists but there is no live implementation-candidate pool
6. `loop`
   - when a live candidate pool or leading durable line already exists and the main need is bounded execution progress

Do not bounce among submodes repeatedly in one pass.
If the best submode changes after new evidence appears, record that route shift explicitly.

## Candidate brief protocol

When a direction is interesting but not yet worthy of a new branch:

- create a candidate brief with `submission_mode='candidate'`
- keep it branchless
- record enough structure that later ranking or promotion is possible

Good candidate-brief fields include:

- title
- problem
- hypothesis
- mechanism
- mechanism_family
- change_layer
- source_lens
- expected_gain
- risks
- decision_reason
- foundation_ref
- lineage_intent

Do not promote every candidate automatically.

Use `references/method-brief-template.md` for the minimum acceptable candidate-brief structure.
Use `references/brief-shaping-playbook.md` when the brief is still too vague, too implementation-first, or too collapsed onto one familiar mechanism.

Candidate briefs should explicitly answer:

- WHAT bottleneck is being targeted?
- WHY is the current line limited?
- HOW does this mechanism address the limitation?
- WHAT must remain unchanged for comparability?

If the brief cannot answer those four questions clearly, it is not ready for promotion or implementation.

Treat a candidate brief as the DeepScientist form of a method brief.
It should sit between "idea intuition" and "code implementation".

Preserve this brief-shaping discipline:

1. clarify the bottleneck, constraints, and comparability boundary first
2. generate a small differentiated slate, usually `2-3` serious approaches
3. recommend one approach with explicit tradeoffs against the alternatives
4. self-check the winning brief for ambiguity, overlap, and weak justification before submission

Do not jump from "interesting intuition" to branch creation.
Do not jump from "I know how to code this" to "this deserves promotion."

When running the `brief` submode:

- produce only `2-4` serious candidate briefs by default
- ask or answer the minimum clarifying questions needed to remove ambiguity around bottleneck, constraint fit, and comparability
- explicitly keep one incumbent-compatible refinement when possible
- explicitly keep one orthogonal alternative when possible
- explicitly keep one broader lens or paradigm shift candidate when possible
- avoid generating several renamed variants of the same mechanism
- prefer mechanism-level distinctness over volume
- present the differentiated slate on one shared comparison surface before choosing a recommended brief
- keep the questioning bounded and execution-oriented rather than open-ended brainstorming

Use a coverage contract for every serious brief slate:

- one `incumbent-deepening` direction when justified
- one `orthogonal-mechanism` direction when justified
- one `paradigm/objective/data-view shift` direction when justified

If all serious briefs belong to the same mechanism family, do one widening pass before ranking.
Do not treat a same-family slate as sufficient merely because the local scores look good.

For each serious brief, record at least:

- bottleneck
- why_current_line_is_limited
- mechanism
- why_now
- mechanism_family
- change_layer: `Tier1` / `Tier2` / `Tier3`
- source_lens
- keep_unchanged
- expected_gain
- implementation_surface
- main_risks
- promote_now: yes or no

InternAgent-style behavior to preserve here:

- generate candidate methods first
- critique them before promotion
- express them as method-layer objects rather than code patches
- defer branch creation until the candidate is actually chosen
- prefer one-question-at-a-time clarification when one missing assumption would otherwise contaminate the whole brief slate

Do not require a paper-style literature hard gate inside this submode unless the quest explicitly moved back toward paper work.

## Promotion protocol

Only promote a candidate brief into a durable line when at least one of the following is true:

- it clearly dominates the nearby alternatives
- it is top-ranked and sufficiently distinct
- the user explicitly asked to pursue it
- the current frontier indicates the line is the strongest next move

Promotion should use:

`artifact.submit_idea(mode='create', submission_mode='line', source_candidate_id=..., ...)`

When several candidate briefs are plausible, rank them explicitly before promotion.
Use `references/candidate-ranking-template.md` for the minimum acceptable ranking record.

Default promotion rule:

- promote only `1-3` candidate briefs into durable lines
- if one candidate clearly dominates, promote only that one
- if the frontier is still structurally uncertain, promote at most two sufficiently distinct lines

When running the `rank` submode:

- compare the current serious briefs on one explicit shared surface
- score or rank them with written reasons
- state why the winner is better now
- state why the main alternatives are deferred rather than erased
- never treat "all seem promising" as a sufficient reason to promote them all

Use a distinct promotion policy:

- default rule: each mechanism family should contribute at most one promoted line
- do not let one familiar family fill the whole promoted slate
- only override that family cap when one candidate clearly dominates the whole field

When ranking, explicitly check:

- family diversity
- change-layer diversity
- whether the brief slate is collapsing into one familiar lens

If the top briefs are all same-family, either:

- keep only the strongest one
- or return to `brief` for a widening pass

The output of `rank` should be promotion-ready.
The output of `brief` should be candidate-ready.

## Frontier protocol

At meaningful route boundaries, inspect:

- best branch
- best recent run
- stagnant branches
- candidate backlog
- possible fusion opportunities
- recommended mode

Prefer these route meanings:

- `explore`: widen search with fresh candidate directions
- `exploit`: focus on the strongest current line
- `fusion`: merge insights from multiple successful or complementary lines
- `debug`: rescue a candidate or line blocked by a concrete failure mode
- `stop`: the current frontier is saturated or the remaining routes are not justified

Use `references/frontier-review-template.md` when the next route is unclear.

Interpret frontier state with these default heuristics:

- `explore`
  - use when no line is clearly dominant
  - use when current lines are too similar
  - use when the search has not yet established a strong incumbent

- `exploit`
  - use when one line clearly leads on evidence and comparability
  - use when smoke results already narrowed the candidate pool

- `fusion`
  - use when at least two lines have meaningful strengths
  - use when one line is strong but another line contributes a complementary mechanism
  - use when the current incumbent is stagnating but the broader frontier is still promising

- `debug`
  - use when a candidate failed for a concrete and likely fixable reason
  - use when the candidate is still strategically valuable after the failure

- `stop`
  - use when the frontier is saturated
  - use when remaining routes are low-value, redundant, or too weak relative to cost

When the frontier says `explore`, the default optimize submode is `brief`.
When the frontier says `exploit`, the default optimize submode is `seed` or `loop`.
When the frontier says `fusion`, the default optimize submode is `fusion`.
When a candidate failure dominates the next move, the default optimize submode is `debug` even if the frontier does not yet say so explicitly.

## Seed protocol

Use `seed` after a durable line exists and before a broad execution loop begins.

The goal is not to launch a full run immediately.
The goal is to generate a small within-line candidate pool that can be smoke-tested and triaged.

When running `seed`:

- generate only `2-3` implementation-level candidates by default
- make each candidate meaningfully different in mechanism, implementation path, or risk profile
- prefer plan-first candidates over immediate large edits
- record each candidate as `report_type='optimization_candidate'`
- define which candidates enter smoke first
- for a newly promoted line, keep at least one `simple-first` candidate in the initial seed batch
- do not start a fresh line with ensemble stacking, broad HPO, or a heavy multi-stage pipeline unless durable evidence already proves the simple route is insufficient

For each seed candidate, record at least:

- candidate_id
- parent line
- strategy
- mechanism_family
- change_layer
- change_plan
- expected_gain
- keep_unchanged
- first validation step
- archive condition

MLEvolve-style behavior to preserve here:

- one durable line may produce multiple candidate attempts
- candidate generation is bounded
- smoke comes before full evaluation unless the task is explicitly `fast-check` and direct quick validation is cheaper and equally informative

Use a validation-cost-aware seed policy:

- `fast-check`: the first objective smoke signal is likely under about `20` minutes
- `slow-check`: the first objective smoke signal is likely over about `20` minutes or expensive enough that broad probing is wasteful

For `fast-check` seed work:

- widen a bit more aggressively inside the line
- a seed batch of `3-5` candidates can be justified when they are genuinely differentiated
- prefer multiple orthogonal quick tests over one over-discussed candidate
- a separate smoke stage is optional; direct submission into quick parallel validation is acceptable when the first check is already cheap
- only skip smoke when the parallel quick validations are expected to produce distinguishable conclusions rather than repeated near-duplicate outcomes

For `slow-check` seed work:

- keep the initial seed batch tighter, usually `1-2` candidates and rarely `3`
- insist on a stronger reason for every candidate entering smoke
- prefer one dominant hypothesis plus one hedge candidate over a broad exploratory pool
- do not spend long runs to discover that the brief itself was weak

Do not keep a live implementation pool dominated by the same mechanism family.
Default active-pool rule:

- at most `1-2` live candidates from the same family
- if one family already fills the live pool, new same-family candidates do not enter smoke by default

## Loop protocol

Use `loop` when a durable line and implementation-candidate pool already exist and the main need is bounded forward motion.

Before changing code in `loop`, inspect the same-line local attempt memory for the current line.
Treat recent sibling attempts on the same line as the first memory surface, ahead of broader quest memory.

When running `loop`, choose one primary action:

- `smoke`
- `promote_to_full_eval`
- `archive`
- `record_main_result`
- `switch_to_fusion`
- `switch_to_debug`
- `stop`

Every loop pass should end with:

- one updated candidate status
- one updated next action
- one frontier review trigger

Do not leave the line with several half-started directions and no dominant next move.

Default exploit rule: one atomic improvement per pass.
Do not bundle several unrelated changes into one exploit candidate unless:

- the changes are one tightly coupled design package
- or the pass is explicitly a fusion route

MLEvolve-style behavior to preserve here:

- bounded parallelism
- small live candidate pool
- explicit move from draft -> smoke -> full eval -> archive or result
- measured frontier review after real evidence

Use a validation-cost-aware loop policy:

- for `fast-check` tasks, it is acceptable to run more quick, different tests before converging
- for `fast-check` tasks, direct quick validation may replace a separate smoke stage if that saves time without losing decision quality
- for `slow-check` tasks, use fewer but sharper passes, and require objective gain before widening or evolving further
- if the validation loop is slow, do not keep paying for frontier uncertainty that could have been reduced in `brief`
- if the validation loop is fast, prefer resolving uncertainty with evidence instead of over-arguing in chat

Use a branch/family diversity cap during exploitation:

- do not keep selecting only the locally familiar family because it is easiest to elaborate
- when several strong candidates are close, prefer the one that preserves frontier diversity
- if one branch or family already dominates recent attempts, require stronger evidence before selecting another near-duplicate attempt

## Memory protocol

Before broad new search, run at least one `memory.search(...)` using:

- the current task name
- the active idea id
- a method keyword
- the most recent failure mode or successful mechanism

When the search appears too narrow, also retrieve one of:

- a similar failure pattern
- an orthogonal success pattern
- a deliberately dissimilar but high-value prior attempt

For `seed`, `loop`, and `debug`, also inspect the same-line local attempt memory from the current leading line before widening to broader quest memory.

Write at least one quest memory card when you learn something reusable, such as:

- a successful optimization pattern
- a repeated failure pattern
- a fusion lesson
- a reason a candidate should not be retried

Use `references/optimization-memory-template.md` for the minimum acceptable memory-card shape.

Do not write generic "we tried some optimization" memory cards.
Each card should be retrieval-friendly and decision-relevant.

## Artifact protocol

Use:

- `artifact.submit_idea(..., submission_mode='candidate')` for candidate briefs
- `artifact.submit_idea(..., submission_mode='line')` for durable promoted lines
- `artifact.record(kind='report', report_type='optimization_candidate', ...)` for within-line attempts
- `artifact.record(kind='decision', action='iterate'|'branch'|'continue'|'stop', ...)` for route changes
- `artifact.record_main_experiment(...)` for real measured line results

When the optimize pass is about ranking or promotion, also record one durable decision explaining:

- which briefs were compared
- which one won
- why promotion was justified now
- why the others were held, fused, or rejected

When recording implementation-level candidates, prefer these status values:

- `proposed`
- `smoke_running`
- `smoke_passed`
- `smoke_failed`
- `promoted`
- `full_eval_running`
- `succeeded`
- `failed`
- `archived`

Use `report_type='optimization_candidate'` consistently for implementation-level attempts so they can later be summarized into the frontier.

## Execution protocol

- Use `bash_exec` for smoke checks and full runs.
- Prefer bounded smoke before full evaluation unless `fast-check` direct validation is cheaper and equally informative.
- Do not keep rerunning the same unchanged candidate.
- If a candidate fails with a clear root cause, either debug it deliberately or archive it.
- If the same line stalls repeatedly, switch to exploit or fusion rather than pretending more of the same is new evidence.

Use this execution order by default:

1. candidate brief selection
2. implementation-level candidate generation
3. smoke test or direct quick validation
4. promotion to fuller evaluation when justified
5. durable result recording
6. frontier review

Prefer only a small active pool at once:

- usually `2-4` candidate briefs before promotion
- usually `2-3` live implementation candidates in smoke
- usually `1-2` full evaluations running at once unless the environment clearly supports more

Validation-cost-aware override:

- if first-pass validation is under about `20` minutes, it is reasonable to increase smoke breadth modestly and compare more alternatives early
- if first-pass validation is under about `20` minutes, you may skip a separate smoke stage and submit several quick validations in parallel
- only do that when the validations are likely to yield different conclusions such as clear win / tie / fail / instability, rather than redundant repeats
- if first-pass validation is slower than that, keep the active pool narrow and gate evolution on clear objective signal
- for slow validation, do not promote a candidate into heavier resource investment until smoke or pilot evidence shows a real performance improvement, stability improvement, or comparability-preserving advantage

## Code-generation route selection

Do not use the same code-generation route for every optimization step.

Prefer:

1. brief-first, no code yet
   - when the direction is still unclear
   - stay at candidate-brief level

2. stepwise generation
   - for the first substantial implementation of a new durable line
   - especially when the line touches multiple subsystems such as data processing, model design, and training/evaluation

3. diff / patch generation
   - when a strong current implementation already exists
   - for improve, exploit, debug, and most fusion work

4. full rewrite
   - only when the current implementation is too broken or too structurally mismatched for diff patching to remain safe

Use `references/codegen-route-playbook.md` before committing to a larger rewrite.

## Debug protocol

Use `debug` when a candidate failed but still looks strategically valuable.

`debug` is bugfix-only.
Do not use a debug pass to sneak in a new performance-improvement idea.
If the proposed change goes beyond the minimal fix and becomes a new mechanism, stop and route back to `brief` or `loop` instead.

When a candidate fails:

- classify whether the failure is structural, local, or environmental
- retrieve similar failure patterns from memory before changing code
- prefer targeted fixes over broad rewrites
- define the exact post-fix bounded check before editing

Good debug prompts should make these explicit:

- the concrete error
- the likely root cause
- the minimal fix
- what must remain unchanged

Use `references/debug-response-template.md` for the minimum acceptable debug response shape.

Archive rather than debug when:

- the failure is mostly strategic rather than local
- the candidate no longer looks better than the nearby alternatives
- the fix would effectively turn it into a different candidate anyway

## Fusion protocol

Use `fusion` only when the frontier justifies cross-line combination.

Before opening a fusion candidate:

- identify the real strength of each source line
- identify the real weakness of each source line
- explain why the strengths are complementary rather than redundant
- define what remains unchanged for comparability
- define the bounded evidence that would prove the fusion was worthwhile

Use `references/fusion-playbook.md` before launching cross-line fusion.

Do not fuse:

- two lines with the same mechanism under different names
- two weak lines that lack a clear strength
- merely because multiple branches exist

If the fusion hypothesis is still underspecified, return to `brief` instead of pretending fusion is ready.

## Prompt patterns worth preserving

For candidate-brief, improve, fusion, and debug prompts, preserve these recurring structures:

- Introduction
- Task description
- Memory
- Previous solution or previous line
- Instructions
- assistant_prefix when a stable response lead-in reduces drift
- explicit response format

And preserve these recurring reasoning contracts:

- root cause first
- WHAT / WHY / HOW
- KEEP UNCHANGED
- explicit next action

Use `references/prompt-patterns.md` as the canonical optimization prompt crib sheet.

## Plateau and fusion protocol

Treat repeated local edits without evidence gain as a search failure mode.

If one line shows repeated non-improving results:

- stop issuing near-duplicate attempts
- record the stagnation explicitly
- either widen the search or fuse with another line

Use `references/fusion-playbook.md` before launching cross-line fusion.
Use `references/plateau-response-playbook.md` when deciding how to respond to repeated non-improving results.

Good fusion candidates usually satisfy both:

- each source line has at least one real strength
- the strengths are complementary rather than redundant

Do not fuse merely because two lines both exist.

When a line plateaus:

- stop issuing near-duplicate low-information attempts
- say explicitly that the line is plateauing
- force one larger route change:
  - widen the brief slate
  - promote a stronger alternative
  - fuse
  - debug one blocked but valuable candidate
  - stop

Do not hide plateau under a sequence of tiny "one more tweak" loops.

Family-shift trigger:

- if recent attempts stay inside one mechanism family and there is no meaningful improvement
- or if `success_patience >= 2`
- or if `total_patience >= 5`
- the next pass must not be another same-family Tier1 tweak
- instead choose one of:
  - orthogonal family
  - Tier2 or Tier3 shift
  - fusion
  - stop

This is the default anti-collapse rule for optimize.

## Task-category primer

Before widening a stale frontier, classify the task briefly into one or more dominant structures:

- tabular
- vision / spatial
- sequence / language
- graph / topology
- systems / optimization
- mixed

Then ask whether the current brief slate overfits one familiar method family for that task.
If it does, require at least one serious candidate from a different plausible family or lens before promotion.

## Stall-recovery protocol

If the optimize stage appears to stall, diagnose the stall explicitly instead of idling.

Common stall classes:

- no frontier information
- no candidate clearly worth promotion
- candidate pool is too similar
- repeated failures on one line
- no active runs and no next action recorded

Preferred recovery order:

1. refresh the frontier
2. inspect the current candidate board
3. inspect recent optimization memory
4. record one explicit route decision
5. continue with exactly one concrete next action

Do not leave the stage parked without a recorded reason and a concrete reopen condition.

## Stage-end requirement

Stage-end requirement:

- write at least one `memory.write(...)` when the pass produced a reusable success pattern, repeated failure pattern, fusion lesson, or explicit non-retry rule
- update `OPTIMIZE_CHECKLIST.md`
- update `CANDIDATE_BOARD.md` when the candidate pool changed
- leave one durable next action or stop condition

If nothing reusable was learned, record why this pass was still necessary instead of writing a fake memory card.

## Completion rule

This stage is complete only when one of these is durably true:

- a stronger line was promoted and the next anchor is clear
- the current line produced a real measured result and the next route is recorded
- the optimization frontier says stop and that stop decision is durably recorded

Do not treat one candidate creation or one smoke pass as stage completion.
