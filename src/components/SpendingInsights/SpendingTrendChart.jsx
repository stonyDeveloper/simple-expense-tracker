import { formatCurrency, formatDate } from '../../utils/formatters.js';

/** Vertical bar chart of total spending per week. */
function SpendingTrendChart({ trend }) {
  const maxTotal = Math.max(...trend.map((week) => week.total));

  return (
    <div className="card">
      <h3 className="card__title">Spending Trend (by week)</h3>
      <ul className="insights-bars insights-bars--vertical">
        {trend.map((week) => (
          <li key={week.weekStart} className="insights-bar-col">
            <div
              className="insights-bar-col__track"
              role="img"
              aria-label={`Week of ${formatDate(week.weekStart)}: ${formatCurrency(week.total)}`}
            >
              <div
                className="insights-bar-col__fill"
                style={{ height: `${(week.total / maxTotal) * 100}%` }}
              />
            </div>
            <span className="insights-bar-col__value">{formatCurrency(week.total)}</span>
            <span className="insights-bar-col__label">{formatDate(week.weekStart)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SpendingTrendChart;
