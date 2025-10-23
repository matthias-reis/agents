# Current Task: Create Plan

- **ID**: `#9`
- **Title**: `Tailwind 4`
- **Workpackage Name**: `issues/9-tailwind-4`

## Task description

- Read the **Issue Summary** below and produce a detailed implementation plan.
- Write a single Markdown file: `issues/9-tailwind-4/PLAN.md`.
- Include: Summary, Scope, Out-of-scope, File/dir map, Acceptance Criteria, Test Plan, Risks, Rollback, CI updates, Docs updates.
- Link to SoT docs instead of copying content.
- In case of architectural changes or added dependencies, consider an addition to the ADR and mention it in the `PLAN.md` docs update section
- Append a line to `issues/9-tailwind-4/cost.md` with:
  - timestamp (UTC), provider, model, input_tokens, output_tokens, total_tokens, estUSD, headers snapshot (remaining/reset if available).
- Do **not** modify other files.
- create a local commit if possible. If not propose a commit statement including message.

## Issue Summary

__Tailwind 4__

### Summary

I&#39;ve noticed that the project bootstrap added tailwind 3.x as a dependency, which is outdated.
We want to rely on tailwind 4, so please update all occurences. Please also adapt the description in the docs accordingly and add an ADR entry.

I&#39;m talking about the app in the `web` folder.

### Acceptance criteria

- tailwind 4 (use the latest version) is added as a dependency
- configs are updated / migrated accordingly (from js file to css)
- page still looks the same

### Additional context

_No response_
Labels: ready-for-agent


