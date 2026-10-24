# PLAN — Spending Insights

Implementation plan for the feature described in `SPEC.md`.

## Technical Approach

Keep the existing data flow unchanged: `App.jsx` remains the single owner of
`expenses`/`categories` state (via `useLocalStorage`). Spending Insights is a
new, purely-presentational section that receives `expenses` and `categories`
as props, exactly like `Dashboard` does today. No new state, no new storage
key — insights are *derived*, recomputed on every render, so FR4 (live
updates) falls out of React's normal render cycle for free.

```
App.jsx
 └─ <SpendingInsights categories={categories} expenses={expenses} />
      ├─ uses utils/insightsCalculations.js  (pure data functions)
      ├─ <CategoryBreakdownChart />           (FR1)
      ├─ <SpendingTrendChart />               (FR2)
      ├─ <SummaryCard> (reused)               (FR3 — total)
      └─ empty-state branch                   (FR5)
```

## Files / Components to Change or Add

| File | Change |
| --- | --- |
| `src/utils/expenseCalculations.js` | **Bug fix** — dedupe by `id` not `date` (done). |
| `src/utils/insightsCalculations.js` | **New.** Pure functions: `getCategoryBreakdown`, `getWeeklySpendingTrend`. No React, no DOM — unit-testable in isolation, per `SPEC.md`'s "reuse `expenseCalculations.js`" requirement. |
| `src/components/SpendingInsights/index.jsx` | **New.** Section container: renders empty state or the two charts + total, wires props through. |
| `src/components/SpendingInsights/CategoryBreakdownChart.jsx` | **New.** FR1 — renders a horizontal bar chart (plain SVG/CSS) from `getCategoryBreakdown` output. |
| `src/components/SpendingInsights/SpendingTrendChart.jsx` | **New.** FR2 — renders a simple bar chart (plain SVG/CSS) from `getWeeklySpendingTrend` output. |
| `src/App.jsx` | Add one line: render `<SpendingInsights categories={categories} expenses={expenses} />` under `<Dashboard />`. No other change — existing functionality untouched. |
| `src/styles.css` | Append styles for the new section/charts, following existing class-naming conventions (`.insights-*`). No existing rules touched. |
| `tests/insightsCalculations.test.js` | **New.** Unit tests for the two new pure functions (category totals, weekly trend, empty input). |
| `tests/spendingInsights.test.jsx` | **New.** Component tests: empty state, renders with sample data, updates on add/delete. |

## New Functions (data layer)

In `src/utils/insightsCalculations.js`:

- `getCategoryBreakdown(categories, expenses)` → array of
  `{ id, name, icon, spent }`, **filtered to `spent > 0`**, in `categories`
  order. Built on top of the existing `calculateCategorySpent` from
  `expenseCalculations.js` — not reimplemented.
- `getWeekStart(dateString)` → `'YYYY-MM-DD'` of the Monday of the week
  containing `dateString` (pure date-math helper, used only by the function
  below; exported for unit testing).
- `getWeeklySpendingTrend(expenses)` → array of `{ weekStart, total }`
  sorted ascending by `weekStart`, one entry per week that has ≥1 expense.
  Each `total` is computed with the same per-item summation approach as
  `calculateTotalExpenses` (sum of `Number(expense.amount)`, rounded with
  the existing `roundToCents`).

Both functions are pure (input → output, no side effects), satisfying the
"keep calculation logic separate from chart rendering" requirement — the
chart components only format and lay out numbers they're given.

## Charting Approach

**Decision: plain inline SVG + CSS, no new dependency.**

Alternatives considered:
- **Chart.js / Recharts** — more polish, animated transitions, tooltips for
  free. Rejected for this feature: the dataset is tiny (≤6 categories, a
  handful of weeks), the app currently has zero chart-library dependencies,
  and pulling one in for two simple bar charts adds install size and an
  API surface we don't need. `PLAN.md` keeps the option open if insights
  grow more complex later.
- **Plain SVG/CSS (chosen)** — zero new dependencies, full control over
  markup/accessibility (can label bars with real text, not canvas pixels),
  and trivially testable with React Testing Library (`getByText`,
  `getByRole`) since everything is real DOM, not a `<canvas>`.

Both charts are simple bar layouts:
- `CategoryBreakdownChart`: one horizontal `<div>` bar per category, width
  proportional to `spent / max(spent)`, with icon, name, and
  `formatCurrency(spent)` as text.
- `SpendingTrendChart`: one vertical `<div>` bar per week, height
  proportional to `total / max(total)`, with a week-start label
  (`formatDate(weekStart)`) and `formatCurrency(total)` as text.

No `<canvas>`, no SVG path math for bars — `<div>` bars sized with inline
`style` are sufficient, consistent with the app's existing CSS-driven style
(`styles.css`), and keep the components trivial to test and inspect in
React Testing Library.

## Implementation Steps (incremental, one commit-worthy step at a time)

1. ~~Fix the `calculateTotalExpenses` bug~~ (done, already committed).
2. Add `insightsCalculations.js` with `getCategoryBreakdown` — implement,
   eyeball in isolation, no UI yet.
3. Add `getWeekStart` + `getWeeklySpendingTrend` to the same file.
4. Build `CategoryBreakdownChart.jsx` consuming `getCategoryBreakdown` —
   wire into a temporary spot in `App.jsx` to see it render against real
   sample data in the browser.
5. Build `SpendingTrendChart.jsx` consuming `getWeeklySpendingTrend` —
   same real-data check in the browser.
6. Build `SpendingInsights/index.jsx`: compose both charts + total +
   empty-state branch (FR3, FR5); move the wiring in `App.jsx` to its final
   place under `<Dashboard />`.
7. Manually verify FR4 in the browser: add an expense in a new category /
   new week, confirm both charts and the total update without reload;
   delete expenses down to zero, confirm the empty state reappears.
8. Add CSS for `.insights-*` classes.

Each step is implemented, the diff reviewed, checked in the running dev
server, then committed — per the assignment's documented process.

## Testing Strategy

- **Unit tests** (`tests/insightsCalculations.test.js`): `getCategoryBreakdown`
  (zero-spend categories excluded, order preserved, amounts match
  `calculateCategorySpent`), `getWeekStart` (boundary dates — Monday itself,
  Sunday, a date that crosses a month), `getWeeklySpendingTrend` (buckets
  sum correctly, sorted ascending, only non-empty weeks present, total
  across all buckets equals `calculateTotalExpenses`).
- **Component tests** (`tests/spendingInsights.test.jsx`, React Testing
  Library): empty state renders when `expenses` is `[]`; charts render
  category/amount text for sample data; re-rendering with one more/one
  fewer expense updates the displayed total and bar count (simulating
  FR4 without needing a full `App` interaction test, since `App.jsx`'s
  add/delete flow is already covered by existing/new component tests).
- **Manual browser verification** after each UI-facing step (per
  Implementation Steps above), using the running `npm run dev` server and
  the existing sample data plus manually added/deleted expenses.
- **Regression**: `npm test` and `npm run test:bug` must both stay green
  throughout — no existing test is modified to make this feature pass.
- **Build check**: `npm run build` must succeed before Stage 4 is
  considered complete.

Actual commands run and their results are recorded in `TESTING.md` once
implementation is complete (Stage 4) — this file only states the strategy.
