import CategoryBreakdownChart from './CategoryBreakdownChart.jsx';
import SpendingTrendChart from './SpendingTrendChart.jsx';
import { getCategoryBreakdown, getWeeklySpendingTrend } from '../../utils/insightsCalculations.js';
import { calculateTotalExpenses } from '../../utils/expenseCalculations.js';
import { formatCurrency } from '../../utils/formatters.js';

function SpendingInsights({ categories, expenses }) {
  const totalSpending = calculateTotalExpenses(expenses);

  return (
    <section className="section" aria-labelledby="insights-heading">
      <h2 id="insights-heading" className="section__title">
        Spending Insights
      </h2>

      {expenses.length === 0 ? (
        <div className="card">
          <p className="empty-state">
            No expenses yet — add your first expense to see your spending insights.
          </p>
        </div>
      ) : (
        <>
          <div className="card insights-total">
            <span className="insights-total__label">Total Spending</span>
            <span className="insights-total__amount">{formatCurrency(totalSpending)}</span>
          </div>

          <div className="insights-grid">
            <CategoryBreakdownChart breakdown={getCategoryBreakdown(categories, expenses)} />
            <SpendingTrendChart trend={getWeeklySpendingTrend(expenses)} />
          </div>
        </>
      )}
    </section>
  );
}

export default SpendingInsights;
