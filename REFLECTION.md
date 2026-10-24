<!--
DRAFT — please read before submitting.

This reflection was drafted by an AI agent (Claude) on your behalf,
based on the actual work done in this repo's commit history. It is
meant as a starting point, not a final answer: the workshop wants YOUR
own experience, in your own voice. Please read it, correct anything
that doesn't match how you actually experienced the exercise, add
anything personal/specific that's missing, and rewrite the phrasing so
it sounds like you rather than like an AI summary. Then delete this
comment block before submitting.
-->

# Reflection

For this assignment I used Claude (Anthropic's AI coding agent, running
inside Claude Code) as my AI pair programmer for the whole five-stage
process: writing SPEC.md and PLAN.md before touching any code, fixing the
pre-existing "Total Expenses" bug, implementing the Spending Insights
feature, writing automated tests, and updating the docs.

The agent helped most in the planning stages. Having it read through
`src/App.jsx`, `useLocalStorage.js`, and `expenseCalculations.js` first and
summarize how data flows through the app meant I wasn't guessing at the
architecture before deciding how to slot in a new feature. Writing SPEC.md
before any code also forced a decision I might otherwise have skipped past
quickly: whether the spending-trend chart should bucket by day or by week.
Having to write that decision down, with a reason, made it a real design
choice instead of an implicit one.

The easiest part was the bug fix. The regression test (`npm run test:bug`)
already pointed at the exact wrong line — `calculateTotalExpenses` was
deduplicating expenses by `date` instead of by `id`, so two expenses on the
same day silently collapsed into one. Once the test suite named the
expected output, confirming the fix was mechanical: run the test, see it
go from 4 failures to 4 passes.

The trickier part was building the charts without pulling in a chart
library. It would have been faster to reach for Chart.js, but the dataset
is genuinely tiny (six categories, a handful of weeks), so plain SVG/CSS
bars kept the dependency list unchanged and made the charts directly
testable with React Testing Library — no canvas, no mocked chart internals.
That trade-off is spelled out in PLAN.md.

One concrete example of catching and correcting an AI mistake: the first
draft of the new component tests asserted the total spending amount with
`screen.getByText('₦1,000.00')`, assuming it would appear once. It actually
appeared three times (once in the total card, once in the category bar,
once in the trend bar), so the test failed with a "multiple elements
found" error. I had the test rewritten to read the `.insights-total__amount`
element directly instead of guessing at a unique text match — a reminder
that an AI-generated test needs to actually be run before it can be
trusted, not just read and approved.

What I learned: writing the spec and plan as real documents *before*
implementation — not just as a formality — changes the kind of mistakes
you catch. The weekly-vs-daily trend-bucket decision and the "which
existing function do I reuse instead of reimplementing" questions both got
resolved on paper, where they were cheap to reconsider, instead of in code,
where they would have been more expensive to unwind.
