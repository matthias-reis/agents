# Current Task: Create Plan

- **ID**: `#11`
- **Title**: `Introduce MDX`
- **Workpackage Name**: `issues/11-introduce-mdx`

## Task description

- Read the **Issue Summary** below and produce a detailed implementation plan.
- Write a single Markdown file: `issues/11-introduce-mdx/PLAN.md`.
- Include: Summary, Scope, Out-of-scope, File/dir map, Acceptance Criteria, Test Plan, Risks, Rollback, CI updates, Docs updates.
- Link to SoT docs instead of copying content.
- In case of architectural changes or added dependencies, consider an addition to the ADR and mention it in the `PLAN.md` docs update section
- Append a line to `issues/11-introduce-mdx/cost.md` with:
  - timestamp (UTC), provider, model, input_tokens, output_tokens, total_tokens, estUSD, headers snapshot (remaining/reset if available).
- Do **not** modify other files.
- create a local commit if possible. If not propose a commit statement including message.

## Issue Summary

__Introduce MDX__

### Summary

I want to be able to use MDX for Documentation and it should automatically appear as an html page.

The goal of this ticket is to create another route called `/mdx` and in that route, markdown from a file is turned into react and renders as content of the page. Of course it should still adhere to the style of the page and also it should use the styleguide components that are already available (H1, H2, P, LI ...).

### Acceptance criteria

- new page under /mdx
- content comes from markdown
- same global styling as the other pages (i.e. a layout is wrapped around the contents)

### Additional context

_No response_
Labels: ready-for-agent


