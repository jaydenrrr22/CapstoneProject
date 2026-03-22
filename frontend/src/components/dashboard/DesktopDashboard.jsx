import { Link } from "react-router-dom";
import FinancialHealthChart from "../FinancialHealthChart";
import "./DashboardLayouts.css";

function DesktopDashboard({
  loadingHealth,
  healthError,
  health,
  selectedPeriod,
  availablePeriods,
  onPeriodChange,
  transactions,
  onLogout,
}) {
  const budgetTotal = health ? `$${Number(health.budget_limit).toFixed(2)}` : "--";
  const spentTotal = health ? `$${Number(health.total_spent).toFixed(2)}` : "--";

  return (
    <div className="dashboard-shell desktop-shell">
      <header className="desktop-top-nav card-surface">
        <div>
          <p className="eyebrow">Financial Workspace</p>
          <h1>Dashboard</h1>
        </div>

        <nav className="desktop-links" aria-label="Primary">
          <Link to="/dashboard">Home</Link>
          <Link to="/transactions">Transactions</Link>
          <Link to="/subscriptions">Subscriptions</Link>
          <Link to="/budgets">Budgets</Link>
        </nav>

        <button className="action-btn" onClick={onLogout}>Logout</button>
      </header>

      <div className="desktop-grid">
        <section className="desktop-budget-row">
          <article className="budget-stat card-surface">
            <p>Total Budget</p>
            <h2>{budgetTotal}</h2>
          </article>
          <article className="budget-stat card-surface">
            <p>Spent This Period</p>
            <h2>{spentTotal}</h2>
          </article>
        </section>

        <section className="desktop-health-panel card-surface">
          <div className="section-heading">
            <h3>Financial Health</h3>
            <select
              className="health-period-select"
              value={selectedPeriod}
              onChange={(e) => onPeriodChange(e.target.value)}
              disabled={availablePeriods.length === 0}
            >
              {availablePeriods.length === 0 ? (
                <option value="">No budget periods</option>
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
                <span className="muted">{health.period}</span>
              </div>

              <FinancialHealthChart
                score={health.score}
                width={320}
                height={200}
                innerRadius={86}
                outerRadius={108}
                labelSize={36}
              />

              <div className="health-metrics-grid">
                <div>
                  <p>Spent</p>
                  <h4>${Number(health.total_spent).toFixed(2)}</h4>
                </div>
                <div>
                  <p>Remaining</p>
                  <h4>${Number(health.remaining_balance).toFixed(2)}</h4>
                </div>
                <div>
                  <p>Used</p>
                  <h4>{Number(health.percentage_used).toFixed(1)}%</h4>
                </div>
              </div>
            </>
          ) : (
            <p className="muted">Create a budget to unlock financial health insights.</p>
          )}
        </section>

        <section className="desktop-transactions-panel card-surface">
          <div className="section-heading">
            <h3>Recent Transactions</h3>
          </div>
          <div className="tx-table simple-list">
            {transactions.map((tx) => (
              <div key={tx.id} className="tx-table-row">
                <span>{tx.name}</span>
                <span className={tx.amount < 0 ? "tx-negative" : "tx-positive"}>
                  ${Math.abs(tx.amount).toFixed(2)}
                </span>
              </div>
            ))}

            {transactions.length === 0 && <p className="muted tx-empty">No transactions yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

export default DesktopDashboard;
