import { describe, expect, it } from 'vitest';
import {
  getCategoryBreakdown,
  getWeekStart,
  getWeeklySpendingTrend,
} from '../src/utils/insightsCalculations.js';
import { calculateTotalExpenses } from '../src/utils/expenseCalculations.js';
import { createSampleCategories, createSampleExpenses } from '../src/data/sampleData.js';

const categories = [
  { id: 'food', name: 'Food', icon: '🍽️', budget: 100 },
  { id: 'fun', name: 'Fun', icon: '🎬', budget: 50 },
  { id: 'travel', name: 'Travel', icon: '✈️', budget: 200 },
];

const expenses = [
  { id: 'e1', amount: 12.5, categoryId: 'food', date: '2026-01-03' },
  { id: 'e2', amount: 30.25, categoryId: 'food', date: '2026-01-05' },
  { id: 'e3', amount: 60, categoryId: 'fun', date: '2026-01-04' },
];

describe('getCategoryBreakdown', () => {
  it('returns spent totals matching calculateCategorySpent, in category order', () => {
    expect(getCategoryBreakdown(categories, expenses)).toEqual([
      { id: 'food', name: 'Food', icon: '🍽️', spent: 42.75 },
      { id: 'fun', name: 'Fun', icon: '🎬', spent: 60 },
    ]);
  });

  it('omits categories with no expenses', () => {
    const breakdown = getCategoryBreakdown(categories, expenses);
    expect(breakdown.find((c) => c.id === 'travel')).toBeUndefined();
  });

  it('returns an empty array when there are no expenses', () => {
    expect(getCategoryBreakdown(categories, [])).toEqual([]);
  });
});

describe('getWeekStart', () => {
  it('returns the same date when given a Monday', () => {
    expect(getWeekStart('2026-01-05')).toBe('2026-01-05');
  });

  it('returns the preceding Monday for a Sunday', () => {
    expect(getWeekStart('2026-01-11')).toBe('2026-01-05');
  });

  it('returns the preceding Monday for a midweek date', () => {
    expect(getWeekStart('2026-01-08')).toBe('2026-01-05');
  });

  it('handles a week that crosses a month boundary', () => {
    // Sunday 1 Feb 2026 belongs to the week starting Monday 26 Jan 2026.
    expect(getWeekStart('2026-02-01')).toBe('2026-01-26');
  });

  it('returns null for an invalid date', () => {
    expect(getWeekStart('not-a-date')).toBeNull();
  });
});

describe('getWeeklySpendingTrend', () => {
  it('buckets expenses by week and sums each bucket', () => {
    // e1 (Sat 3 Jan) and e3 (Sun 4 Jan) fall in the week of Mon 29 Dec;
    // e2 (Mon 5 Jan) starts the next week.
    expect(getWeeklySpendingTrend(expenses)).toEqual([
      { weekStart: '2025-12-29', total: 72.5 },
      { weekStart: '2026-01-05', total: 30.25 },
    ]);
  });

  it('returns one entry per week, sorted oldest first', () => {
    const multiWeek = [
      { id: 'a', amount: 10, categoryId: 'food', date: '2026-01-20' },
      { id: 'b', amount: 5, categoryId: 'food', date: '2026-01-01' },
      { id: 'c', amount: 20, categoryId: 'food', date: '2026-01-10' },
    ];
    expect(getWeeklySpendingTrend(multiWeek).map((w) => w.weekStart)).toEqual([
      '2025-12-29',
      '2026-01-05',
      '2026-01-19',
    ]);
  });

  it('omits weeks with no expenses (no padding)', () => {
    const sparse = [
      { id: 'a', amount: 10, categoryId: 'food', date: '2026-01-01' },
      { id: 'b', amount: 20, categoryId: 'food', date: '2026-02-01' },
    ];
    expect(getWeeklySpendingTrend(sparse)).toHaveLength(2);
  });

  it('returns an empty array when there are no expenses', () => {
    expect(getWeeklySpendingTrend([])).toEqual([]);
  });

  it('sums across all buckets to the same total as calculateTotalExpenses (sample data)', () => {
    const sampleExpenses = createSampleExpenses();
    const trend = getWeeklySpendingTrend(sampleExpenses);
    const trendSum = Math.round(trend.reduce((sum, week) => sum + week.total, 0) * 100) / 100;
    expect(trendSum).toBe(calculateTotalExpenses(sampleExpenses));
  });

  it('sums across all breakdown categories to the same total as calculateTotalExpenses (sample data)', () => {
    const sampleCategories = createSampleCategories();
    const sampleExpenses = createSampleExpenses();
    const breakdown = getCategoryBreakdown(sampleCategories, sampleExpenses);
    const breakdownSum = Math.round(breakdown.reduce((sum, c) => sum + c.spent, 0) * 100) / 100;
    expect(breakdownSum).toBe(calculateTotalExpenses(sampleExpenses));
  });
});
