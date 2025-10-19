# You are an autonomous coding agent. Create a **single script** that orchestrates the full issue → plan → implement → review → merge flow, and update the repo docs so **any agent** can follow it.

## Context (high level)

We want a **local, one-shot CLI** that a human runs like:

```bash
pnpm agent 3
```

It must:

- Read **GitHub Issue #3**, inspect labels/state, and determine the next action.
- Prepare/update local context files under `issues/<n>-<slug>/` _(local working
  area)_.
- Create/switch to branch `issues/<n>-<slug>`.
- Push, open/update PR, apply/remove labels, post comments.
- During **merge**, **remove** any `issues/<n>-<slug>/` files from the branch so
  they **do not end up on `main`**.
- Never run as a daemon; it’s invoked by a human before/after agent coding
  passes.

The agent (you) will:

1. **Create the script and supporting code/config**.
2. **Update workflow docs/instructions** so any model (Codex/Claude/etc.) can
   operate with this flow.

We already use **pnpm** and prefer **TypeScript** + **esrun** for execution.

---

## Deliverables (create/modify these)

1. **CLI Script & code**

   - `tools/agent.ts` — the single entrypoint CLI (TypeScript, ESM).
   - `tools/github.ts` — Octokit client & helpers.
   - `tools/state.ts` — state machine logic (pure functions).
   - `tools/io.ts` — file ops for `issues/<n>-<slug>/`, parsing/serializing
     JSON/Markdown, slugify.
   - `tools/costs.ts` — read/append/aggregate `costs.md`.

2. **Package script & deps**

   - In `package.json` add:
     ```json
     {
       "scripts": {
         "agent": "esrun tools/agent.ts"
       }
     }
     ```
   - Add runtime deps: `octokit`, `dotenv`, `p-queue` (optional), `zod` (for
     schema safety).
   - Add dev deps if needed: `typescript`, `@types/node`, `esrun`.

3. **Dotenv template**

   - `.env.example` with:
     ```
     GH_TOKEN=
     REPO=matthias-reis/agents
     DEFAULT_BASE=main
     LABEL_READY=ready-for-agent
     LABEL_PLAN_PROPOSED=plan-proposed
     LABEL_PLAN_APPROVED=plan-approved
     LABEL_IN_REVIEW=in-review
     LABEL_LOCK=agent:locked
     LABEL_READY_TO_MERGE=ready-to-merge
     ```
   - Script loads `.env` at runtime.

4. **Docs / workflow instructions**

   - Update or create:
     - `.context/INDEX.md` — add a section **“Agent Orchestration”** linking to
       the flow.
     - `.context/RULES.md` — add the **plan-first / test-gate / ADR** rules and
       how this CLI enforces states.
     - `docs/CONTRIBUTING.md` — add a new **“Run the Agent Locally”** section
       with examples.
     - `README.md` — short “Quickstart for Agent workflow” linking to
       CONTRIBUTING.

5. **CI guard**
   - Add a small GitHub Action `/.github/workflows/block-issues-dir-on-main.yml`
     that **fails** if `issues/**` remains in the merge diff (as a safety net).
     The script will clean it before merge, but this ensures we never merge the
     local working dir.

---

## Core requirements for the CLI

### Usage

- Run:
  ```bash
  pnpm agent <issueNumber>
  ```
- Optional flags:
  - `--base <branch>` (default: env `DEFAULT_BASE` or `main`)
  - `--dry-run` (print planned actions, no side effects)
  - `--verbose`

### Environment & GitHub

- Read `GH_TOKEN` from `.env`.
- Parse `REPO` as `owner/repo`.
- All GitHub write ops (labels, comments, PR create/merge) go through Octokit
  REST.
- Store PR metadata locally as **`issues/<n>-<slug>/pr.json`** with
  `{ number, id, url, head, base, createdAt, lastSyncAt }`. Always have a
  **fallback** that can find the PR if the file is missing/stale.

### Local working dir (not merged)

- Create a local folder **`issues/<n>-<slug>/`** _(this folder is committed on
  the feature branch while planning/review, but must be deleted from the branch
  by the script before merge)_.
- Files within:
  - `task.md` — canonical accumulating context (seeded from issue title/body;
    later appends Feedback, CI feedback, Conflicts).
  - `PLAN.md` — plan for line-by-line review in PR.
  - `qa.md` — QA checklist (agent-generated) that the script posts as a PR
    comment.
  - `pr.json` — PR metadata cache.
  - `costs.md` — structured ledger; see schema below.

**`costs.md` schema (append entries)**

```md
# Cost Ledger

- 2025-10-19T14:05:10Z | provider=openai | model=gpt-4o | input=3500 |
  output=2200 | total=5700 | estUSD=0.06 | remainingTokensHdr=... | resetAt=...
- 2025-10-19T15:22:44Z | provider=anthropic | model=claude-3-5-sonnet |
  input=4100 | output=2600 | total=6700 | estUSD=0.07 | remainingTokensHdr=... |
  resetAt=...
```

(Your script only appends & **totals** for final comment; the actual token
numbers are provided by the operator after each agent call, or by a companion
wrapper if available.)

---

## State machine (implement these states & transitions)

> Always do **edge checks** first. The script must be **idempotent**: safe to
> run multiple times.

### 0) Edge & Lock

- If the issue doesn’t exist / is closed → print and exit.
- If label `agent:locked` is present → print and exit.
- Apply `agent:locked` at start; ensure it’s removed **on every return path**
  (use `try/finally`).

### 1) Bootstrap — **planning start**

**Preconditions**

- Issue has label **`ready-for-agent`**.
- No `PLAN.md` in `issues/<n>-<slug>/`.

**Actions**

- Create/switch to branch `issues/<n>-<slug>`.
- Create or refresh `task.md`:
  - Include issue title, body, labels, links to SoT docs (from
    `.context/CONTEXT_REGISTRY.yaml` if available).
  - Add headings: `## Summary`, `## Acceptance Criteria (draft)`, `## Feedback`,
    `## CI feedback`, `## Conflicts`, `## Links`.
- Commit `task.md` (if changed), push branch (create if needed).
- **Do not** create PR yet, or create a **Draft PR** (configurable).
- Print: “Open `issues/<n>-<slug>/task.md` in your editor. Run your agent to
  produce PLAN.md.”
- Exit (unlock).

### 2) Plan proposed — **PLAN.md present, awaiting approval**

**Preconditions**

- `PLAN.md` exists locally.
- No label `plan-approved`.

**Actions**

- Ensure PR exists (create **Draft PR** if missing).
- Commit & push `PLAN.md`.
- Add label **`plan-proposed`**.
- Sync any **issue comments** since last run into `task.md` under `## Feedback`
  (append, with permalinks); commit & push if changed.
- Post PR comment: “Plan ready for review: see `PLAN.md` in this branch.”
- Exit (unlock).

### 3) Implementation — **plan approved**

**Preconditions**

- Label **`plan-approved`** present.

**Actions**

- Ensure `qa.md` exists. If not, create an empty scaffold with a header; the
  human will run the agent to generate it while implementing.
- The human runs the agent to implement code according to `PLAN.md` and updates
  `qa.md`.
- If there are **local code commits** not pushed:
  - Push branch.
  - Ensure PR is **ready for review** (undraft if needed); set label
    **`in-review`**.
  - Post the **QA checklist** (from `qa.md`) as a PR comment titled “QA
    Checklist”.
- Exit (unlock).

### 4) In review — **iterate on feedback**

**Preconditions**

- Label **`in-review`** present.

**Actions**

- Sync **PR review comments/threads** since last run into `task.md` under
  `## Feedback`, with permalinks (do **not** auto-resolve).
- Check CI status:
  - If failed, collect failing job names + brief error excerpts (~100 lines
    max) + permalinks; append under `## CI feedback`.
- Commit & push `task.md` if changed.
- Exit (unlock).  
  (Human runs agent again; then re-run script to push and maintain PR.)

### 5) Conflict detected

**Preconditions**

- GitHub shows PR merge conflicts or `git merge-base` indicates conflict with
  base.

**Actions**

- Record conflict file paths and base/head SHAs under `## Conflicts` in
  `task.md` with guidance.
- Commit & push `task.md` if changed; exit (unlock).  
  (Human runs agent to resolve conflicts locally; re-run script.)

### 6) Ready to merge — **cleanup & merge**

**Preconditions**

- Maintainer adds label **`ready-to-merge`**.

**Actions**

- Aggregate **total costs** from `costs.md` (sum `total` tokens and `estUSD`).
  Add a new final line `- TOTAL | tokens=<sum> | estUSD=<sum>`.
- Post a final **Issue comment**:
  - Summary: PR number & title, commits count, tests status.
  - **Total costs** (tokens + $) from `costs.md`.
  - Link to QA checklist PR comment.
- In the branch, **delete the directory** `issues/<n>-<slug>/` (remove
  `task.md`, `PLAN.md`, `qa.md`, `pr.json`, `costs.md`), commit with message
  `chore: cleanup issues/<n>-<slug> before merge`.
- Push the cleanup commit.
- Merge the PR (**squash**) into base (default `main`), delete remote branch.
- Remove labels: `plan-proposed`, `plan-approved`, `in-review`,
  `ready-to-merge`, `agent:locked`.
- Close the issue if not auto-closed.
- Exit (unlock).

**Safety net**: The CI workflow should also fail if any `issues/**` remains in
the merge diff, but the script’s cleanup commit should avoid that.

---

## Implementation details (be explicit)

### Language & runner

- TypeScript ES modules. Execute via:
  ```json
  "scripts": { "agent": "esrun tools/agent.ts" }
  ```

### Dependencies

- `octokit` (GitHub REST)
- `dotenv` (load `.env`)
- `zod` (optional for config schema)
- `p-queue` (optional; single concurrency is fine)
- Avoid heavy extras; use Node’s `fs`/`path` and `child_process` or a tiny git
  helper.

### Git/branch helpers

- Slugify title into `kebab-case` (letters/digits/hyphen only).
- Ensure branch checkout: if not exists, create from base; else switch.
- Detect unpushed commits via `git rev-list @{u}..` or compare local HEAD vs
  remote.
- PR link:
  - If `pr.json` missing, find PR by `head` ref (e.g.,
    `owner:issues/<n>-<slug>`).
  - Cache into `pr.json`.

### Label rules (functions)

- `addLabel(issue, name)`, `removeLabel(issue, name)`.
- Maintain lock: `agent:locked` add/remove.

### Comments

- `postIssueComment(number, markdown)`
- `postPRComment(prNumber, markdown)`

### Cost aggregation

- `appendCostEntry(dir, entry)`
- `readCostEntries(dir)` → array
- `sumCosts(entries)` → `{ totalTokens, totalUSD }`
- In “ready-to-merge”, include totals in final issue comment.

### CI guard

- Add `.github/workflows/block-issues-dir-on-main.yml`:
  - On PR events, fail if `git diff origin/${{ github.base_ref }}...HEAD`
    includes `^issues/`.

### Idempotency

- All operations must be safe to repeat:
  - Creating a PR that already exists → find and reuse.
  - Re-adding labels → ignore 422 conflicts.
  - Posting comments → post new messages (no overwrite).
  - Sync feedback → only append new items (track `lastSyncAt` in `pr.json`).

---

## Update docs (edit these files)

- **`README.md`** (short section):

  ```
  ## Agent Workflow (Local)

  1. Prepare or react to state:
     pnpm agent <issueNumber>
  2. Run your code agent on files in `issues/<n>-<slug>/` (edit PLAN.md, implement code, update qa.md).
  3. Run `pnpm agent <n>` again to push changes, update PR, and sync feedback.
  4. When maintainers add `ready-to-merge`, the script posts cost summary, cleans up `issues/**`, and merges.

  See docs/CONTRIBUTING.md for details.
  ```

- **`docs/CONTRIBUTING.md`** (full guide):

  - Explain labels: `ready-for-agent` → `plan-proposed` → `plan-approved` →
    `in-review` → `ready-to-merge`.
  - Explain local folder files and what agents should output (`PLAN.md`,
    `qa.md`, appending to `costs.md`).
  - Explain that **reviewers** resolve PR threads; the script does not
    auto-resolve.

- **`.context/RULES.md`**:

  - Add plan-first/test-gate/ADR rules.
  - Add “no duplication” rule: provider files link to SoT docs.
  - Add “`issues/**` is a working area and must be deleted before merge” rule.

- **`.context/INDEX.md`**:
  - Add entry “Agent Orchestration” → link to CONTRIBUTING section.

---

## Acceptance criteria (what I, the agent, must deliver)

- ✅ `tools/agent.ts` implements the full state machine above.
- ✅ Running `pnpm agent <n>`:
  - Handles edge cases & lock label.
  - Creates/switches branch `issues/<n>-<slug>`.
  - Creates/updates `issues/<n>-<slug>/task.md` / `PLAN.md` / `qa.md` /
    `pr.json` / `costs.md` as required.
  - Creates/updates PR and posts the QA checklist comment.
  - Syncs PR review comments & CI feedback into `task.md`.
  - On `ready-to-merge`: posts final **cost summary** comment on the issue,
    removes `issues/**` from the branch, pushes a cleanup commit, merges PR
    (squash), deletes remote branch, cleans labels, unlocks.
- ✅ `package.json` has `"agent": "esrun tools/agent.ts"`.
- ✅ `.env.example` included; `dotenv` used at runtime.
- ✅ Docs updated: `README.md`, `docs/CONTRIBUTING.md`,
  `.context/{INDEX.md,RULES.md}`.
- ✅ CI guard added to block `issues/**` on merges (safety net).
- ✅ Code is idempotent, with clear logs, and robust error handling (network
  errors, permissions, missing labels).

---

## Output format

- Create/modify files directly in the repo.
- For each file you add or change, include the full content in your response as
  a fenced code block with its **file path** in the info string, e.g.:

````md
```ts title="tools/agent.ts"
// … full code …
```

```

- After code blocks, provide a short “Runbook” section with:
  - Installation (`pnpm add …`)
  - `.env` setup
  - Example runs (`pnpm agent 3`)
  - Expected outputs/logs

**Do not** paste any secrets.
**Do not** attempt to run the code; just generate it.
```
````
