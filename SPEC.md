# SPEC — Spending Insights

## Problem Statement

ExpenseFlow lets a user record expenses against category budgets, but the only
analysis on offer today is a flat list (`Expense Breakdown`) of how much has
been spent per category. There is no visual breakdown of *where* money goes,
no way to see *how* spending has moved over time, and the previously existing
"Total Expenses" figure was wrong (see Bug Fix below). Users have to read
numbers out of a table and do the comparison in their head.

**Spending Insights** adds a dedicated analysis section to the dashboard that
visualizes category breakdown and spending trends, backed by the app's real,
locally-stored expense data, and that updates immediately as expenses are
added or removed.

## Bug Fix (prerequisite)

`calculateTotalExpenses` in `src/utils/expenseCalculations.js` deduplicated
expenses by `date` instead of by `id`. Any two expenses recorded on the same
calendar day were collapsed into one, undercounting the dashboard's "Total
Expenses" card. This is fixed (dedupe by `id`) and verified with
`npm run test:bug`. FR3 (total spending display) depends on this being
correct, since it reuses `calculateTotalExpenses`.

## Feature Overview

A new "Spending Insights" section on the dashboard, below the existing
Dashboard summary cards, containing:

1. A category breakdown chart (how much was spent per category).
2. A spending trend chart (how spending has moved over time).
3. A clear total spending figure for the data currently shown.
4. Live updates whenever the underlying expense data changes.
5. A friendly empty state when there is no expense data to chart.

All charts are computed from the real `expenses` state already held in
`App.jsx` (the same data `Dashboard` and `ExpenseList` use) — nothing is
hardcoded or sample-only.

## Functional Requirements

### FR1 — Category Breakdown Chart

Show a chart of total spending per category, using every category that has
at least one expense.

**Acceptance criteria**
- The chart renders one segment/bar per category that has ≥1 expense.
- Each segment's value equals `calculateCategorySpent(expenses, categoryId)`
  for that category (reusing the existing utility, not re-implemented).
- A category with zero expenses is omitted from the chart (it would be a
  meaningless zero-size slice/bar).
- Hovering or inspecting a segment surfaces the category name and its
  spent amount, formatted with `formatCurrency`.
- Adding an expense in a category not previously represented causes a new
  segment to appear without a page reload.

### FR2 — Spending Trend Chart

Show how spending has moved over time.

**Decision — time period: weekly buckets.** Expenses are grouped into
calendar weeks (Monday–Sunday, local time), and the chart plots one point/bar
per week that contains at least one expense, oldest to newest. Weekly
buckets were chosen over daily because the app's own sample data is spread
across 29 expenses in a single ~28-day window — a daily chart would have
many near-empty days and little visible trend, while week-over-week totals
read as an actual trend. Weekly buckets also scale better than daily ones as
a user's expense history grows over months. See **Assumptions** for the
bucketing rule.

**Acceptance criteria**
- The chart plots total spending per ISO-ish week (Monday-start), oldest
  week first.
- Only weeks that contain at least one expense are plotted (no padding of
  empty weeks).
- The sum of all plotted values equals `calculateTotalExpenses(expenses)`.
- Adding or deleting an expense updates the chart's buckets without a page
  reload (a new expense in a new week adds a new point; deleting the last
  expense in a week removes that week's point).

### FR3 — Total Spending Display

Show a clear total spending figure for the insights section.

**Acceptance criteria**
- Displays `calculateTotalExpenses(expenses)` formatted with
  `formatCurrency`.
- Matches the (now-fixed) "Total Expenses" card on the main Dashboard —
  both read from the same utility function, so they can never disagree.
- Updates immediately when an expense is added or deleted.

### FR4 — Live Updates

Insights reflect the current state of `expenses` (and `categories`, for
names/icons/colors) with no manual refresh.

**Acceptance criteria**
- Adding an expense via `ExpenseForm` updates all three insights (breakdown
  chart, trend chart, total) on the same render where `ExpenseList` updates.
- Deleting an expense via `ExpenseList` updates all three insights the same
  way.
- Editing an expense is **out of scope** (see Out of Scope) since the base
  app has no edit feature; if one is added later, insights must update on
  edit too, and the acceptance criteria above should be extended to cover
  it at that time.
- No insight value is ever stored in `localStorage` or component state —
  all three are derived on every render from `expenses`/`categories`, the
  same pattern `Dashboard.jsx` already uses.

### FR5 — Empty State

When `expenses` is empty, the Spending Insights section shows a message
instead of empty/broken charts.

**Acceptance criteria**
- When `expenses.length === 0`, no chart is rendered; a message such as
  "No expenses yet — add your first expense to see your spending insights."
  is shown instead.
- The message disappears and charts appear as soon as the first expense is
  added — no reload needed.
- Deleting the last remaining expense re-shows the empty state.

## Assumptions & Constraints

- **Week bucketing rule**: a week's bucket key is the Monday of the week
  (local time) containing the expense's `date`. This reuses the existing
  `YYYY-MM-DD` string format already used throughout the app, parsed with
  `parseISODate`.
- Charting is implemented as plain SVG/CSS (see `PLAN.md` for rationale) —
  no new runtime dependency is required.
- Category colors/order in the breakdown chart follow the order categories
  appear in `categories` (the same order `CategoryBudgets` uses).
- All amounts are in Nigerian Naira (₦), consistent with the rest of the
  app; no currency conversion.
- Insights are computed client-side from the same `expenses`/`categories`
  state the rest of the app already uses — no new storage key, no backend.
- Existing functionality (dashboard cards, category budgets, add/list/delete
  expenses, reset demo data) must continue to work unchanged.

## Out of Scope

- Editing an existing expense (the base app has no edit feature at all).
- Filtering insights by category, date range, or any other dimension.
- Exporting charts/data (image, CSV, PDF, etc.).
- Persisting chart preferences (e.g. a chosen chart type) across sessions.
- Budget-vs-trend forecasting or predictive analytics.
- Multi-currency support.
- Any backend, authentication, or multi-device sync — the app remains
  fully client-side with `localStorage`.
