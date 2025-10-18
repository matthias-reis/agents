# Ground Rules for Agents

1. **Plan-first**: Share a concise implementation plan and wait for human approval before modifying files unless explicitly told otherwise. Update the plan as milestones complete.
2. **Single Source of Truth**: Do not restate documentation. Link back to the relevant file under `docs/` whenever guidance is needed.
3. **Test-gate**: Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` (or equivalent targeted commands) before requesting review.
4. **ADR discipline**: Architecture-impacting work must add or update an ADR under `docs/ADR/` using the format defined in [`0001-record-format.md`](../docs/ADR/0001-record-format.md).
5. **Context registry**: Keep `.context/CONTEXT_REGISTRY.yaml` updated if new canonical docs are introduced or paths move.
