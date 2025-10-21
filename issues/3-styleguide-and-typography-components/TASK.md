# CurrentTask: work on Feedback

- **ID**: `#3`
- **Title**: `Styleguide and Typography Components`
- **Workpackage Name**: `issues/3-styleguide-and-typography-components`

## Task Description

- Read the text below, especially the "Feedback Comments" section.
- Update the existing implementation plan in `issues/3-styleguide-and-typography-components/PLAN.md` based on the feedback provided.
- Ensure that all relevant feedback is addressed in the updated plan.
- Append a line to `issues/3-styleguide-and-typography-components/cost.md` with:
  - timestamp (UTC), provider, model, input_tokens, output_tokens, total_tokens, estUSD, headers snapshot (remaining/reset if available).
- Do **not** modify other files.
- create a local commit if possible. If not propose a commit statement including message.

## Issue Summary

__Styleguide and Typography Components__

We need a set of common components that are shared throughout all site sections. This ticket is meant to prepare the system for this and add the first components.

### Part 1: Components (for Typography)

- Include the font &quot;Urbanist&quot; in the tailwind setup using Google Fonts. (https://fonts.google.com/specimen/Urbanist)
- Create the following components: H1, H2, P, UL, OL, LI with appropriate Interface using the font in Light as the default and ExtraBold as the bold and headline style. Also consider enough and balanced top and bottom spacing.

### Part 2: Preview Page

Create a page under the path `/styleguide` and add these components for reference and review. This page should have a centered content box with suitable paddings. The box should have a sane size for readable line lengths.

Labels: plan-proposed, locked

## Feedback Comments

__Comment on issues/3-styleguide-and-typography-components/PLAN.md line null__
... and also light weight.
__Comment on issues/3-styleguide-and-typography-components/PLAN.md line null__
Specify how to do that. What are optimal line lengths? What should be used from tailwind?.

## Pull Request Information
- **PR ID**: `#8`
- **Title**: `agent(#3): Styleguide and Typography Components`
- **State**: `open`
