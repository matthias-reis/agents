# Agents

Bootstrap SolidStart + Tailwind playground with shared documentation for agent-assisted workflows.

## Requirements

- Node 20.x (`.nvmrc` provided)
- pnpm 9.15+

## Quickstart

```bash
pnpm install
pnpm dev
```

The root `pnpm install` command installs dependencies inside `web/` via an automated preinstall step. The development server runs on <http://localhost:3000/>.

## Agent Workflow (Local)

1. Prepare or react to state:
   pnpm agent <issueNumber>
2. Run your code agent on files in `issues/<n>-<slug>/` (edit PLAN.md, implement code, update qa.md).
3. Run `pnpm agent <n>` again to push changes, update PR, and sync feedback.
4. When maintainers add `ready-to-merge`, the script posts cost summary, cleans up `issues/**`, and merges.

See docs/CONTRIBUTING.md for details.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start SolidStart dev server with hot reload. |
| `pnpm build` | Build production assets (Vinxi). |
| `pnpm start` | Serve the production build. |
| `pnpm lint` | Run ESLint with Solid + TypeScript rules. |
| `pnpm format` | Check formatting via Prettier + Tailwind plugin. |
| `pnpm format:write` | Apply Prettier formatting. |
| `pnpm typecheck` | Type-check via `tsc --noEmit`. |
| `pnpm test` | Execute Vitest unit tests (happy-dom). |

## Project layout

- `web/` — SolidStart application source, tests, and tooling config.
- `docs/` — Single Source of Truth documentation for architecture, ADRs, and API contracts.
- `.context/` — Agent index + rules linking to docs.
- `.github/` — GitHub Actions CI and templates.

Consult [docs/CODEBASE_OVERVIEW.md](docs/CODEBASE_OVERVIEW.md) for a deeper directory tour.

## Documentation (Single Source of Truth)

- [Architecture](docs/ARCHITECTURE.md)
- [Codebase overview](docs/CODEBASE_OVERVIEW.md)
- [ADR index](docs/ADR/README.md) & [ADR format](docs/ADR/0001-record-format.md)
- [API skeleton](docs/API/openapi.yaml)
- [Glossary](docs/GLOSSARY.md)

## Agent context

Provider instructions link back to the docs above:

- [Claude](CLAUDE.md)
- [GitHub Copilot](.github/copilot-instructions.md)
- [Cursor](.cursor/rules/00-start-here.md)
- [Continue](.continue/rules/00-start-here.md)
- [Windsurf](.windsurfrules)
- [Shared rules & registry](.context/INDEX.md)

## Continuous integration

GitHub Actions workflow (`.github/workflows/ci.yml`) runs lint, type-check, and unit tests on pushes and pull requests using Node 20 with cached pnpm dependencies.

## Contributing

Follow the plan-first and test-gate policies in [.context/RULES.md](.context/RULES.md). Architecture-affecting changes must include an ADR entry per [docs/ADR/0001-record-format.md](docs/ADR/0001-record-format.md).
