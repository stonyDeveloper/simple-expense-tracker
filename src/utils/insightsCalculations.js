/**
 * Pure helper functions for the Spending Insights feature.
 * Builds on top of expenseCalculations.js instead of re-deriving totals.
 */
import { calculateCategorySpent, roundToCents } from './expenseCalculations.js';
import { parseISODate, toISODate } from './formatters.js';

/**
 * Returns categories that have at least one expense, each with its
 * `spent` total, in `categories` order. Zero-spend categories are
 * omitted since a zero-size chart segment carries no information.
 */
export function getCategoryBreakdown(categories, expenses) {
  return categories
    .map((category) => ({
      id: category.id,
      name: category.name,
      icon: category.icon,
      spent: calculateCategorySpent(expenses, category.id),
    }))
    .filter((category) => category.spent > 0);
}

/** Returns the 'YYYY-MM-DD' Monday of the week containing `dateString`. */
export function getWeekStart(dateString) {
  const date = parseISODate(dateString);
  if (!date) return null;

  // getDay(): 0 = Sunday ... 6 = Saturday. Shift so Monday = 0.
  const dayOffset = (date.getDay() + 6) % 7;
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - dayOffset);
  return toISODate(monday);
}

/**
 * Groups expenses into Monday-start weekly buckets and returns the total
 * for each week that has at least one expense, sorted oldest first.
 */
export function getWeeklySpendingTrend(expenses) {
  const totalsByWeek = new Map();

  for (const expense of expenses) {
    const weekStart = getWeekStart(expense.date);
    if (!weekStart) continue;
    const current = totalsByWeek.get(weekStart) ?? 0;
    totalsByWeek.set(weekStart, current + Number(expense.amount));
  }

  return Array.from(totalsByWeek.entries())
    .map(([weekStart, total]) => ({ weekStart, total: roundToCents(total) }))
    .sort((a, b) => (a.weekStart < b.weekStart ? -1 : a.weekStart > b.weekStart ? 1 : 0));
}
