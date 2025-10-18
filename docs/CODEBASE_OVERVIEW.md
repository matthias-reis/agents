# Codebase Overview

## Top-level

- `web/` — SolidStart application code, configuration, and tests. Entry points live under `web/src/entry-*.tsx`; routes under `web/src/routes/`; tests under `web/tests/`.
- `docs/` — Single Source of Truth documentation (architecture, ADRs, glossary, API docs). See [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) for context.
- `.context/` — Agent-facing index and rules that link back to this documentation bundle. No unique content should exist outside `docs/`.
- `.github/` — GitHub metadata including workflows, issue templates, Copilot guidance, and CODEOWNERS.

## Application internals

- `web/src/app.tsx` — Root component establishing layout, navigation, and global providers.
- `web/src/root.css` — Tailwind entry stylesheet; global utility layers only.
- `web/tailwind.config.ts` & `web/postcss.config.cjs` — Styling pipeline configuration.
- `web/tests/` — Vitest suites using Solid Testing Library to validate components.

Keep this file synchronized with structural changes and ensure agent context files under `.context/` refer back here for directory explanations.
