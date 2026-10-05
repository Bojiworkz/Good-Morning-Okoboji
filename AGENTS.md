# BojiWorkZ project workflow

For planning, building, reviewing, or releasing this project, use
`.agents/skills/bojiworkz-project-lifecycle/SKILL.md` as shared guidance.

Adapt the workflow to evidence from this repository. It does not require a
particular stack, folder layout, host, branch model, or business change. Give
agents and subagents the same desired outcome, evidence, constraints, and open
decisions. Evaluate their work from verification evidence, not metadata.
Continuously adapt and evolve: preserve differentiated value, replace
commodity parts when better supported capabilities are proven, and keep
components replaceable.


<!-- BOJIWORKZ-SHARED-LEARNING:START -->
## Shared learning
Read `docs/Governance/SHARED-LEARNING.md` and the shared-learning section of `Standards/PROJECT-MEMORY-STANDARD.md` at task start and significant handoff. In another repository, retrieve those exact paths from private `Bojiworkz/Master` through the authorized GitHub connector or an available checkout. Keep project-specific facts in the current project.
Apply the relevant expert's judgment: infer and research the likely audience, state material assumptions, produce concrete recommendations, and ask only for a true dependency. Capture explicit owner corrections and verified lessons with evidence, scope, and an acceptance check. Pass the same relevant lesson IDs to authorized subagents. If retrieval is unavailable, report that narrow gap and continue independent useful work; do not claim synchronization.
<!-- BOJIWORKZ-SHARED-LEARNING:END -->


<!-- BOJIWORKZ-EXECUTION-TARGET:START -->
## Execution target — check before any machine or browser work
All browser work, computer control, shell commands, local file writes, local servers and builds run on ONE machine only: the current target named in private `Bojiworkz/Master/docs/Governance/EXECUTION-TARGET.md` (read it through the authorized connector or current checkout; in Master read it directly). Before acting on a computer or in a browser, prove which machine the session is linked to (`hostname`/`whoami`, the device report, or the browser's own machine) and compare it with that file. On any mismatch, or if the file cannot be read, take no machine action, offer no override, tell Jeff the named and reported machines plus the one fix (start the task from the target machine), and continue only cloud-side work. Tailscale reachability does not change which machine a session acts on.
<!-- BOJIWORKZ-EXECUTION-TARGET:END -->
