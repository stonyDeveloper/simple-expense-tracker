import { formatCurrency } from '../../utils/formatters.js';

/** Horizontal bar chart of spending per category. */
function CategoryBreakdownChart({ breakdown }) {
  const maxSpent = Math.max(...breakdown.map((category) => category.spent));

  return (
    <div className="card">
      <h3 className="card__title">Spending by Category</h3>
      <ul className="insights-bars insights-bars--horizontal">
        {breakdown.map((category) => (
          <li key={category.id} className="insights-bar-row">
            <span className="insights-bar-row__label">
              <span className="category-icon" aria-hidden="true">
                {category.icon}
              </span>
              {category.name}
            </span>
            <div
              className="insights-bar-row__track"
              role="img"
              aria-label={`${category.name}: ${formatCurrency(category.spent)}`}
            >
              <div
                className="insights-bar-row__fill"
                style={{ width: `${(category.spent / maxSpent) * 100}%` }}
              />
            </div>
            <span className="insights-bar-row__value">{formatCurrency(category.spent)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CategoryBreakdownChart;
