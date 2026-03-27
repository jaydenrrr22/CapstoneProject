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
  subscriptionInsight,
  predictedTransactions, // <-- NEW PROP ADDED
}) {
  const budgetTotal = health ? `$${Number(health.budget_limit).toFixed(2)}` : "--";
  const spentTotal = health ? `$${Number(health.total_spent).toFixed(2)}` : "--";

  return (
    <div className="dashboard-shell desktop-shell">
      <div className="desktop-grid">
        {/* ---------- Budget Row ---------- */}
        <section className="desktop-budget-row">
          <article className="budget-stat card-surface">
            <p>Total Budget</p>
            <h2>{budgetTotal}</h2>
          </article>
          <article className="budget-stat card-surface">
            <p>Spent This Period</p>
            <h2>{spentTotal}</h2>
          </article>
          <article className="budget-stat card-surface">
            <p>Recurring Subscriptions</p>
            <h2>{subscriptionInsight.count}</h2>
            <small className="muted">${subscriptionInsight.totalMonthly.toFixed(2)}/mo</small>
          </article>
        </section>

        {/* ---------- Financial Health Panel ---------- */}
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
                width={360}
                height={220}
                innerRadius={86}
                outerRadius={108}
                labelSize={38}
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

        {/* ---------- Recent Transactions Panel ---------- */}
        <section className="desktop-transactions-panel card-surface">
          <div className="section-heading">
            <h3>Recent Transactions</h3>
          </div>
          <div className="tx-table simple-list">
            {transactions.map((tx) => (
              <div key={tx.id} className="tx-table-row">
                <span>{tx.name}</span>
                <span className={tx.amount > 0 ? "tx-negative" : "tx-positive"}>
                  {tx.amount < 0 ? "+" : "-"}${Math.abs(tx.amount).toFixed(2)}
                </span>
              </div>
            ))}

            {transactions.length === 0 && <p className="muted tx-empty">No transactions yet.</p>}
          </div>
        </section>

        {/* ---------- NEW Predicted Spending Section ADDED ---------- */}
        <section className="desktop-predicted-panel card-surface">
          <div className="section-heading">
            <h3>Upcoming Predicted Transactions</h3>
          </div>
          <div className="tx-table simple-list">
            {predictedTransactions && predictedTransactions.length > 0 ? (
              predictedTransactions.map((tx) => (
                <div key={tx.id} className="tx-table-row">
                  <span>{tx.name}</span>
                  <span className={tx.amount > 0 ? "tx-negative" : "tx-positive"}>
                    {tx.amount < 0 ? "+" : "-"}${Math.abs(tx.amount).toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <p className="muted tx-empty">No predicted transactions.</p>
            )}
          </div>
        </section>
        {/* ---------- END Predicted Spending Section ---------- */}
      </div>
    </div>
  );
}

export default DesktopDashboard;