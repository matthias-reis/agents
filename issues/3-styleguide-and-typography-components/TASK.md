# CurrentTask: Work on Feedback for Implementation

- **ID**: `#3`
- **Title**: `Styleguide and Typography Components`
- **Workpackage Name**: `issues/3-styleguide-and-typography-components`

## Task Description

- A detailed plan has already been worked out and implemented, see `issues/3-styleguide-and-typography-components/PLAN.md` for more details. But there is feedback to address.
- Read the text below, especially the "Feedback Comments" and the "CI Status" section.
- Ensure that all relevant feedback is addressed in the codebase.
- Do **not** modify the plan.md as this has been previously approved.
- Append a line to `issues/3-styleguide-and-typography-components/cost.md` with:
  - timestamp (UTC), provider, model, input_tokens, output_tokens, total_tokens, estUSD, headers snapshot (remaining/reset if available).
- create a local commit if possible. If not propose a commit statement including message.


## Feedback Comments

__Comment__
Just another comment..

__Comment on web/src/components/typography/OL.tsx line 10__ 
`OL` needs a visual tweak. First lines and consecutive lines should have the same indentation / margin left. And an outset placement of numbers.

Same goes for `Ul` and bullet points..
__Comment on web/src/components/typography/H2.tsx line 10__ 
`H1` and `H2`: Provide balance for the top margin as well. Goal: always have more margin above than below. Also balance it out with the other elements who usually come with `mb-4`..


## CI Status

__tests__: ✅

__build__: ✅


## Pull Request Information

- **PR ID**: `#8`
- **Title**: `agent(#3): Styleguide and Typography Components`
- **State**: `open`
