# ADR 0001: Record Format

- **Status**: Accepted
- **Date**: 2024-11-13
- **Deciders**: Core maintainers
- **Related**: `.context/RULES.md`

## Context

Architectural decisions need a consistent structure so contributors and automated agents can trace reasoning, revisit tradeoffs, and keep implementation aligned with intent.

## Decision

All future Architectural Decision Records **must** follow this template:

```
# ADR ####: Short Descriptive Title

- **Status**: Proposed | Accepted | Superseded | Deprecated | Rejected
- **Date**: YYYY-MM-DD
- **Deciders**: Individuals or roles accountable for the decision
- **Related**: Optional links to issues, PRs, or other ADRs

## Context
- Concise explanation of the drivers, constraints, or problems being solved.

## Decision
- The action taken or approach chosen.
- Enumerate alternatives that were considered and why they were not selected.

## Consequences
- Positive outcomes expected from the decision.
- Risks, tradeoffs, or follow-up tasks created by this decision.

## Implementation Notes
- High-level steps or pointers to code/doc updates tied to this ADR.
- Link to any tracking issues or PRs once available.
```

Store ADRs under `docs/ADR/` with incrementing numeric prefixes (`0002`, `0003`, ...). Update the index in [docs/ADR/README.md](./README.md) whenever a new ADR is added or an existing one changes status.

## Consequences

- Provides a predictable format for both humans and agents to digest.
- Enables automated tooling to parse metadata blocks and status.
- Requires ongoing discipline: ADR updates must accompany architecture-affecting PRs (see `.context/RULES.md`).
