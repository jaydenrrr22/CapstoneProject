import { lazy, memo, Suspense } from "react";
import FinancialHealthChart from "../FinancialHealthChart";
import { isIncomeAmount } from "../../utils/finance";
import "./DashboardLayouts.css";

const ForecastChart = lazy(() => import("../forecast/ForecastChart"));
const PredictedTransactionsInsight = lazy(() => import("../insight/PredictedTransactionsInsight"));
const SubscriptionInsightCard = lazy(() => import("../insight/SubscriptionInsightCard"));

function DesktopDashboard({
  loadingHealth,
  healthError,
  health,
  selectedPeriod,
  availablePeriods,
  onPeriodChange,
  transactions,
  forecastTransactions,
  loadingForecast,
  forecastError,
  selectedBudgetLimit,
  subscriptionInsight,
  loadingSubscriptions,
  subscriptionError,
  predictedTransactions,
  loadingPredictions,
  predictionError,
  onRetryPredictions,
  loadingBaseData,
  baseDataError,
}) {
  const formatSignedCurrency = (value) => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return "--";
    }

    return `${numericValue < 0 ? "-" : ""}$${Math.abs(numericValue).toFixed(2)}`;
  };
  const resolveValueTone = (value) => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return "neutral";
    }

    if (numericValue < 0) {
      return "positive";
    }

    if (numericValue > 0) {
      return "negative";
    }

    return "neutral";
  };

  const hasBaseDataError = Boolean(baseDataError);
  const budgetTotal = loadingHealth || loadingBaseData
    ? "Loading..."
    : health
      ? `$${Number(health.budget_limit).toFixed(2)}`
      : hasBaseDataError
        ? "Unavailable"
        : "--";
  const spentTotal = loadingHealth || loadingBaseData
    ? "Loading..."
    : health
      ? formatSignedCurrency(health.total_spent)
      : hasBaseDataError
        ? "Unavailable"
        : "--";
  const budgetTone = resolveValueTone(health?.budget_limit);
  const periodTone = resolveValueTone(health?.total_spent);

  return (
    <div className="dashboard-shell desktop-shell">
      <div className="desktop-grid">
        <section className="desktop-budget-row">
          <article className={`budget-stat card-surface budget-stat--${budgetTone}`}>
            <div className="budget-stat__label-row">
              <p>Total Budget</p>
              <span className="budget-stat__chip">Budget</span>
            </div>
            <h2 className="budget-stat__value">{budgetTotal}</h2>
            <span className="budget-stat__footnote">Current budget limit for the selected month</span>
          </article>
          <article className={`budget-stat card-surface budget-stat--${periodTone}`}>
            <div className="budget-stat__label-row">
              <p>Net This Period</p>
              <span className="budget-stat__chip">Live</span>
            </div>
            <h2 className="budget-stat__value">{spentTotal}</h2>
            <span className="budget-stat__footnote">Expenses push this up. Income pulls it down.</span>
          </article>
          <Suspense fallback={<p className="muted">Loading insights...</p>}>
            <SubscriptionInsightCard
              count={subscriptionInsight.count}
              totalMonthly={subscriptionInsight.totalMonthly}
              className="budget-stat budget-stat--insight"
              loading={loadingSubscriptions}
              error={subscriptionError}
            />
          </Suspense>
        </section>

        <section className="desktop-health-panel card-surface" data-demo-tour="dashboard-overview">
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
              />

              <div className="health-metrics-grid">
                <div>
                  <p>Net total</p>
                  <h4>{formatSignedCurrency(health.total_spent)}</h4>
                </div>
                <div>
                  <p>Remaining</p>
                  <h4>{formatSignedCurrency(health.remaining_balance)}</h4>
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
            {loadingBaseData ? (
              <p className="muted tx-empty">Loading recent transactions...</p>
            ) : hasBaseDataError ? (
              <p className="health-error tx-empty" role="alert">{baseDataError}</p>
            ) : transactions.length === 0 ? (
              <p className="muted tx-empty">No transactions yet.</p>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="tx-table-row">
                  <span>{tx.name}</span>
                  <span className={isIncomeAmount(tx.amount) ? "tx-positive" : "tx-negative"}>
                    {isIncomeAmount(tx.amount) ? "+" : "-"}${Math.abs(tx.amount).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="desktop-forecast-panel card-surface">
          <Suspense fallback={<p className="muted">Loading forecast...</p>}>
            <ForecastChart
              transactions={forecastTransactions}
              selectedPeriod={selectedPeriod}
              budgetLimit={selectedBudgetLimit}
              loading={loadingForecast}
              error={forecastError}
            />
          </Suspense>
        </section>

        <section className="desktop-predicted-panel card-surface">
          <Suspense fallback={<p className="muted">Loading insights...</p>}>
            <PredictedTransactionsInsight
              transactions={predictedTransactions}
              loading={loadingPredictions}
              error={predictionError}
              onRetry={onRetryPredictions}
            />
          </Suspense>
        </section>
      </div>
    </div>
  );
}

export default memo(DesktopDashboard);
