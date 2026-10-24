import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import SpendingInsights from '../src/components/SpendingInsights/index.jsx';

const categories = [
  { id: 'food', name: 'Food & Dining', icon: '🍽️', budget: 100000 },
  { id: 'transportation', name: 'Transportation', icon: '🚗', budget: 50000 },
];

const oneExpense = [
  { id: 'e1', description: 'Lunch', amount: 1000, categoryId: 'food', date: '2026-01-05' },
];

const twoExpenses = [
  ...oneExpense,
  { id: 'e2', description: 'Fuel', amount: 2000, categoryId: 'transportation', date: '2026-01-06' },
];

function getInsightsSection() {
  return screen.getByRole('region', { name: 'Spending Insights' });
}

function getTotalSpendingAmount() {
  return getInsightsSection().querySelector('.insights-total__amount').textContent;
}

describe('SpendingInsights', () => {
  it('shows an empty-state message and no charts when there are no expenses', () => {
    render(<SpendingInsights categories={categories} expenses={[]} />);
    const section = getInsightsSection();

    expect(within(section).getByText(/No expenses yet/)).toBeInTheDocument();
    expect(within(section).queryByText('Spending by Category')).not.toBeInTheDocument();
    expect(within(section).queryByText('Spending Trend (by week)')).not.toBeInTheDocument();
  });

  it('shows the total spending figure matching the expense data', () => {
    render(<SpendingInsights categories={categories} expenses={oneExpense} />);
    const section = getInsightsSection();

    expect(within(section).getByText('Total Spending')).toBeInTheDocument();
    expect(getTotalSpendingAmount()).toBe('₦1,000.00');
  });

  it('renders a category breakdown bar only for categories with spending', () => {
    render(<SpendingInsights categories={categories} expenses={oneExpense} />);
    const section = getInsightsSection();

    expect(within(section).getByText('Food & Dining')).toBeInTheDocument();
    expect(within(section).queryByText('Transportation')).not.toBeInTheDocument();
  });

  it('renders a spending trend bar for the week containing the expense', () => {
    render(<SpendingInsights categories={categories} expenses={oneExpense} />);
    const section = getInsightsSection();

    // 2026-01-05 is a Monday, so its own week-start date is shown.
    expect(within(section).getByText('5 Jan 2026')).toBeInTheDocument();
  });

  it('updates the total and breakdown when re-rendered with more expenses (simulates live update)', () => {
    const { rerender } = render(<SpendingInsights categories={categories} expenses={oneExpense} />);
    expect(getTotalSpendingAmount()).toBe('₦1,000.00');

    rerender(<SpendingInsights categories={categories} expenses={twoExpenses} />);
    const section = getInsightsSection();

    expect(getTotalSpendingAmount()).toBe('₦3,000.00');
    expect(within(section).getByText('Transportation')).toBeInTheDocument();
  });

  it('shows the empty state again when re-rendered with no expenses (simulates deleting the last expense)', () => {
    const { rerender } = render(<SpendingInsights categories={categories} expenses={oneExpense} />);
    expect(within(getInsightsSection()).queryByText(/No expenses yet/)).not.toBeInTheDocument();

    rerender(<SpendingInsights categories={categories} expenses={[]} />);
    expect(within(getInsightsSection()).getByText(/No expenses yet/)).toBeInTheDocument();
  });
});
