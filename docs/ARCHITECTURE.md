# Architecture

## Overview

- Primary stack: SolidStart (SolidJS) UI served via Node runtime using Vinxi. Styling provided by Tailwind CSS with PostCSS tooling.
- Source lives under `web/` with routing, entry points, and tests colocated to streamline focus on front-end agent UX.
- Documentation is centralized here; see [CODEBASE_OVERVIEW.md](./CODEBASE_OVERVIEW.md) for directory-level details and [ADR index](./ADR/README.md) for decision history.

## Frontend

- SolidStart handles routing, data loading, and hydration. Root layout wraps routes with navigation and shared Tailwind theming defined in `web/src/app.tsx`.
- Tailwind is configured via `web/tailwind.config.ts` and driven by `web/src/root.css`. Component-level styling uses utility classes exclusively.
- Testing uses Vitest with the Solid Testing Library (`web/tests/`) to validate interactions and guard regressions.

## Future Backend

- No backend services are implemented yet. The current focus is on front-end scaffolding and agent context alignment.
- Future server APIs should be documented in [docs/API/openapi.yaml](./API/openapi.yaml) and referenced via new ADRs that capture architecture changes.

## Data

- No persistent data stores are configured. Client-side state is managed with Solid signals/components.
- Introduce shared stores or remote data access via new ADRs when a backend or durable storage is added.

## For Agents

- Treat this file and the linked SoT documents as canonical guidance—do not duplicate content in provider-specific contexts.
- When architecture shifts, update this document first, then cross-reference in [docs/ADR/README.md](./ADR/README.md) and the provider link files under `.context/`.
