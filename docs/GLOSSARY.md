# Glossary

| Term | Meaning |
| --- | --- |
| Agent | Automated assistant contributing to the codebase, expected to respect `.context/` rules and link back to docs. |
| SoT (Single Source of Truth) | Canonical documentation stored under `docs/`; provider files must link here instead of duplicating content. |
| ADR | Architectural Decision Record documenting why significant technical choices were made (see `docs/ADR/`). |
| Plan-first | Workflow requirement to propose a plan before executing major changes; enforced in `.context/RULES.md`. |
| Test-gate | Policy to run relevant test suites (lint, typecheck, unit) before merging, referenced in `.context/RULES.md` and CI. |
