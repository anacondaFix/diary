# UI Coding Standards

These standards apply to all UI code throughout this project.

## Components: shadcn/ui only

**ONLY shadcn/ui components may be used to build the UI in this project.**

- **ABSOLUTELY NO custom components may be created.** Do not write bespoke buttons, cards, inputs, modals, layout wrappers, or any other reusable UI element.
- Every piece of UI must be composed directly from shadcn/ui components.
- If you need a UI element, find the matching shadcn/ui component and use it. If one does not exist for the need, rethink the design so it can be built from existing shadcn/ui components rather than creating a new one.
- Add shadcn/ui components to the project with the CLI (`npx shadcn@latest add <component>`), and do not hand-edit them into something custom.
- Page files (e.g. `src/app/**/page.tsx`) should compose shadcn/ui components directly, with Tailwind utility classes for layout and spacing only.

## Date formatting

All date formatting must be done with [date-fns](https://date-fns.org/). Do not use `Intl.DateTimeFormat`, `toLocaleDateString`, `moment`, `dayjs`, or manual string building.

Dates are displayed with an ordinal day, abbreviated month, and four-digit year:

| Input date    | Output     |
| ------------- | ---------- |
| 2025-09-01    | 1st Sep 2025 |
| 2025-08-02    | 2nd Aug 2025 |
| 2026-01-03    | 3rd Jan 2026 |
| 2024-06-04    | 4th Jun 2024 |

Use the format string `"do MMM yyyy"`:

```ts
import { format } from "date-fns";

format(new Date(2025, 8, 1), "do MMM yyyy"); // "1st Sep 2025"
```
