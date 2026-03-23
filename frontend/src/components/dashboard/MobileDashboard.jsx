import { NavLink } from "react-router-dom";
import FinancialHealthChart from "../FinancialHealthChart";
import "./DashboardLayouts.css";

function MobileDashboard({
  loadingHealth,
  healthError,
  health,
  selectedPeriod,
  availablePeriods,
  onPeriodChange,
  transactions,
  subscriptionInsight,
}) {
  const budgetTotal = health ? `$${Number(health.budget_limit).toFixed(2)}` : "--";
  const spentTotal = health ? `$${Number(health.total_spent).toFixed(2)}` : "--";

  return (
    <div className="dashboard-shell mobile-shell">
      <section className="mobile-budget-scroll" aria-label="Budget summary">
        <article className="budget-chip card-surface">
          <p>Total Budget</p>
          <h2>{budgetTotal}</h2>
        </article>
        <article className="budget-chip card-surface">
          <p>Spent This Period</p>
          <h2>{spentTotal}</h2>
        </article>
        <article className="budget-chip card-surface">
          <p>Subscriptions</p>
          <h2>{subscriptionInsight.count}</h2>
        </article>
      </section>

      <section className="card-surface mobile-chart-card">
        <div className="section-heading">
          <h3>Financial Health</h3>
          <select
            className="health-period-select"
            value={selectedPeriod}
            onChange={(e) => onPeriodChange(e.target.value)}
            disabled={availablePeriods.length === 0}
          >
            {availablePeriods.length === 0 ? (
              <option value="">No budgets</option>
            ) : (
              availablePeriods.map((period) => (
                <option key={period} value={period}>{period}</option>
              ))
            )}
          </select>
        </div>

        {loadingHealth ? (
          <p className="muted">Loading score...</p>
        ) : healthError ? (
          <p className="health-error">{healthError}</p>
        ) : health ? (
          <>
            <div className="health-status-row">
              <span className={`health-status-badge ${String(health.status || "").toLowerCase()}`}>
                {health.status}
              </span>
              <span className="muted">{Number(health.percentage_used).toFixed(1)}% used</span>
            </div>

            <FinancialHealthChart
              score={health.score}
              width={250}
              height={160}
              innerRadius={64}
              outerRadius={84}
              labelSize={28}
            />
          </>
        ) : (
          <p className="muted">Create a budget to unlock financial health insights.</p>
        )}
      </section>

      <section className="card-surface mobile-transactions-card">
        <div className="section-heading">
          <h3>Recent Transactions</h3>
        </div>
        <div className="tx-list">
          {transactions.map((tx) => (
            <div key={tx.id} className="tx-row">
              <span>{tx.name}</span>
              <span className={tx.amount > 0 ? "tx-negative" : "tx-positive"}>
                {tx.amount < 0 ? "+" : "-"}${Math.abs(tx.amount).toFixed(2)}
              </span>
            </div>
          ))}

          {transactions.length === 0 && <p className="muted">No transactions yet.</p>}
        </div>
      </section>

      <nav className="mobile-bottom-nav" aria-label="Primary">
        <NavLink to="/dashboard">Home</NavLink>
        <NavLink to="/transactions">Transactions</NavLink>
        <NavLink to="/subscriptions">Subscriptions</NavLink>
        <NavLink to="/budgets">Budgets</NavLink>
      </nav>
    </div>
  );
}

export default MobileDashboard;
