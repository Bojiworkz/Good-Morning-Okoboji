# BojiWorkZ project workflow

Use `.agents/skills/bojiworkz-project-lifecycle/SKILL.md` for project lifecycle
work. Adapt it to the repository's real stack and supported execution path.
Private development and Side-by-Side are intended outcomes for unfinished
projects when technically applicable. Production requires separate approval.
Preserve differentiated value, prefer supported replaceable components, and
re-evaluate earlier choices as current evidence changes.


<!-- BOJIWORKZ-SHARED-LEARNING:START -->
## Shared learning
Read `docs/Governance/SHARED-LEARNING.md` and the shared-learning section of `Standards/PROJECT-MEMORY-STANDARD.md` at task start and significant handoff. In another repository, retrieve those exact paths from private `Bojiworkz/Master` through the authorized GitHub connector or an available checkout. Keep project-specific facts in the current project.
Apply the relevant expert's judgment: infer and research the likely audience, state material assumptions, produce concrete recommendations, and ask only for a true dependency. Capture explicit owner corrections and verified lessons with evidence, scope, and an acceptance check. Pass the same relevant lesson IDs to authorized subagents. If retrieval is unavailable, report that narrow gap and continue independent useful work; do not claim synchronization.
<!-- BOJIWORKZ-SHARED-LEARNING:END -->


<!-- BOJIWORKZ-EXECUTION-TARGET:START -->
## Execution target — check before any machine or browser work
All browser work, computer control, shell commands, local file writes, local servers and builds run on ONE machine only: the current target named in private `Bojiworkz/Master/docs/Governance/EXECUTION-TARGET.md` (read it through the authorized connector or current checkout; in Master read it directly). Before acting on a computer or in a browser, prove which machine the session is linked to (`hostname`/`whoami`, the device report, or the browser's own machine) and compare it with that file. On any mismatch, or if the file cannot be read, take no machine action, offer no override, tell Jeff the named and reported machines plus the one fix (start the task from the target machine), and continue only cloud-side work. Tailscale reachability does not change which machine a session acts on.
<!-- BOJIWORKZ-EXECUTION-TARGET:END -->


<!-- BOJIWORKZ-AGENT-TEAM:START -->
## Agent team — shared roles for every project and every AI
When acting as, or handing work to, a project manager, scheduler, workflow expert, software engineer, GitHub steward, verifier, security-privacy reviewer, continuity agent or research scout, read that role's file in private `Bojiworkz/Master/.agents/agents/bojiworkz-team/` (start with `README.md`) through the authorized connector or current checkout, and follow its workflow and the team's shared contract: GitHub issues are the work record, every claim is labelled PROVEN, INFERRED or BLOCKED, no merge, deploy, DNS, spending or secrets without Jeff's yes, and nothing is done until an independent verifier has evidence from the real system. Keep project-specific facts in this repository. If the files cannot be read, say so and continue only with work that does not depend on them.
<!-- BOJIWORKZ-AGENT-TEAM:END -->
