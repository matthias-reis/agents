# Contributing with the Agent Workflow

This project uses a single CLI (`pnpm agent <issueNumber>`) to coordinate every phase of an issue: planning, implementation, review, and merge. The CLI keeps GitHub labels, pull requests, and local context in sync so any provider (Codex, Claude, etc.) can pick up the work seamlessly.

## Lifecycle in Labels

Issues move through a fixed set of labels:

1. `ready-for-agent` — Maintainers signal that the next agent should bootstrap context.
2. `plan-proposed` — A PLAN.md exists and is awaiting human approval.
3. `plan-approved` — Maintainers approved the plan; implementation can begin.
4. `in-review` — Code is ready and the QA checklist has been posted to the PR.
5. `ready-to-merge` — Maintainers approved; the CLI will tidy up and merge.

The CLI applies and removes these labels automatically. It also manages the `agent:locked` label to ensure only one run has control of an issue at a time.

## Local Working Directory

Every issue uses a dedicated working directory: `issues/<n>-<slug>/`. The folder is created on the feature branch, but **must be deleted before merge** (the CLI handles this cleanup).

Files inside the directory:

| File | Purpose |
| --- | --- |
| `task.md` | Canonical log of the issue. Contains summary, acceptance criteria draft, synced feedback, CI status, and conflicts. |
| `PLAN.md` | Agent-authored implementation plan used for async review. |
| `qa.md` | QA checklist the agent produces during implementation. The CLI posts this as a PR comment. |
| `pr.json` | Metadata cache for the open PR (number, URLs, sync timestamps, QA comment link). |
| `costs.md` | Ledger of token usage. Append a new line per agent invocation and keep totals accurate. |

`costs.md` format:

```
# Cost Ledger

- 2025-10-19T14:05:10Z | provider=openai | model=gpt-4o | input=3500 | output=2200 | total=5700 | estUSD=0.06
```

The CLI sums the ledger and inserts a `TOTAL` line when merging.

## Using the CLI

```
pnpm agent 3               # bootstrap, sync state, or merge depending on labels
pnpm agent 3 --dry-run     # show the planned actions without side effects
pnpm agent 3 --base main   # override the base branch (defaults to DEFAULT_BASE or main)
pnpm agent 3 --verbose     # log extra diagnostics
```

The CLI performs these actions:

- Reads `.env` (see `.env.example`) for GitHub credentials, repo slug, default base, and label names.
- Ensures branch `issues/<n>-<slug>` exists and is checked out.
- Syncs GitHub issue body, feedback, PR review comments, and CI signals into `task.md`.
- Creates or updates the PR (draft → ready) and pushes commits when new changes are detected.
- Posts a QA checklist comment (from `qa.md`) when entering review.
- On `ready-to-merge`, posts a final issue comment with costs, removes `issues/**`, merges the PR (squash), and deletes the remote branch.

The CLI is idempotent; you can run it repeatedly without worrying about duplicate labels or comments.

## Agent Responsibilities

1. **Plan-first**  
   - Run `pnpm agent <n>` once the issue has `ready-for-agent`.  
   - Author `PLAN.md` inside the working directory.  
   - Re-run the CLI to push the plan and trigger `plan-proposed`.

2. **Implementation & QA**  
   - Wait for maintainers to add `plan-approved`.  
   - Implement code following `PLAN.md`.  
   - Update `qa.md` with the validation steps you performed and mark completed checks.  
   - Record every agent pass in `costs.md`.

3. **Review loop**  
   - When code is ready, re-run the CLI; it undrafts the PR, applies `in-review`, and posts the QA checklist.  
   - Address review comments locally, update `task.md` with any feedback, and push fixes.  
   - Reviewers resolve GitHub threads manually; the CLI never auto-resolves discussions.  
   - The CLI imports new review/CI feedback into `task.md` each time.

4. **Merge**  
   - Maintainers add `ready-to-merge`.  
   - Run the CLI; it posts a final issue comment with token totals, deletes `issues/**` from the branch, merges (squash), removes labels, and unlocks the issue.

## Test Gate, ADRs, and Source of Truth

- Always run `pnpm lint`, `pnpm typecheck`, and `pnpm test` (or the scoped equivalents) before requesting review. Record failures under `## CI feedback` in `task.md`.
- Architecture-impacting changes require an ADR entry using the format in `docs/ADR/0001-record-format.md`.
- Link to docs under `docs/` instead of duplicating explanations. `.context/INDEX.md` lists canonical references.

## Environment Setup

1. Copy `.env.example` to `.env` and fill in `GH_TOKEN` (with `repo` scope) and confirm `REPO`.
2. Install dependencies:

   ```
   pnpm install
   ```

3. Run the CLI for your issue:

   ```
   pnpm agent 3
   ```

4. Follow the instructions printed by the CLI for each stage.

By following this workflow, any agent or maintainer can continue the work with full context and predictable automation.
