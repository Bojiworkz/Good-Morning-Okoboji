---
name: bojiworkz-project-lifecycle
description: Onboard and evolve a BojiWorkZ project through research, its existing codebase, a private dev environment, Side-by-Side verification, approval, production, and health operations. Use for every new or unfinished BojiWorkZ website or application.
---

# BojiWorkZ Project Lifecycle

This is a flexible workflow, not a repository policy or a required technology
stack. Preserve the project's code, history, working behavior, and useful
decisions unless current evidence supports a change.

## Adapt and evolve

Re-evaluate the architecture against current evidence and supported
capabilities whenever the project changes materially. Preserve the parts that
create distinct value. Replace or delegate commodity parts when a better
supported option is proven. Keep components modular enough to replace without
rebuilding the entire project, and do not continue custom work only because it
already exists.

The currently accepted authentication candidates are Authentik and Microsoft
Azure when authentication is actually needed. Do not introduce another
identity or integration dependency through this starter. Reconsider even the
accepted candidates when current evidence supports a safer or better
owner-approved choice.

## Work the problem

1. State the complete problem, desired outcome, users, constraints, current
   state, and owner/client decisions that are genuinely still open.
2. Inspect the actual repository, supported startup path, dependencies,
   deployment evidence, and existing tests before designing changes.
3. Separate facts from assumptions. Record material conclusions as `PROVEN`,
   `INFERRED`, `CANDIDATE`, `BLOCKED`, or `NOT_RESEARCHED`.

## Research

Research only the categories relevant to the project. Include:

- the existing website or application and its real user journeys;
- current primary documentation for the technologies already in use;
- supported solutions that could avoid new custom code;
- current practices used by strong engineers, companies, and designers;
- comparable businesses, products, and user expectations;
- accessibility, performance, security, privacy, SEO, and compliance when they
  apply to the actual project;
- overlooked service, content, conversion, or operational opportunities.

For every external practice or comparison, preserve the source, date,
applicability, and limitation. Recommendations are options for the client to
research and choose. They do not direct the client to change its business.

## Shape and build

1. Prefer supported existing capabilities before custom automation.
2. Adapt the solution to the real repository. Do not impose a framework,
   folder layout, provider, branch model, database, or integration.
3. For an unfinished project, establish a private development result when it
   is technically applicable and authorized. Record the real build, test,
   functional-health, and representative-operation evidence as it becomes
   known.
4. Compare the candidate beside the accepted current site, design, behavior,
   or other baseline. Side-by-Side is an evidence method; it is not a required
   product, URL pattern, or command.
5. Keep early choices revisable. Replace `CANDIDATE` decisions when better
   evidence appears and record why the decision evolved.

## Review and release

Present the development result, Side-by-Side evidence, risks, costs, and open
choices for review. Do not equate a running process with functional health.
Production release is a separate owner decision and must not be inferred from
approval of research, design, code, or a development site.

After launch, use the project's supported monitoring and recovery capabilities
and route future changes through an appropriate development and comparison
path. Do not expose secrets, client data, or private development URLs in public
artifacts.

## Agents and updates

When delegating, give every agent and subagent the same desired outcome,
evidence, constraints, and open decisions. Judge results from reproducible
evidence. Workflow version information is for update visibility; a missing or
different digest is not, by itself, a reason to block useful work.
