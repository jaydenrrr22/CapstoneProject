import { lazy, memo, Suspense } from "react";
import { NavLink, useLocation } from "react-router-dom";
import FinancialHealthChart from "../FinancialHealthChart";
import { PRIMARY_NAV_ITEMS, isSectionPathActive } from "../../constants/routes";
import { isIncomeAmount } from "../../utils/finance";
import "./DashboardLayouts.css";

const ForecastChart = lazy(() => import("../forecast/ForecastChart"));
const PredictedTransactionsInsight = lazy(() => import("../insight/PredictedTransactionsInsight"));
const SubscriptionInsightCard = lazy(() => import("../insight/SubscriptionInsightCard"));

function MobileDashboard({
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

  const location = useLocation();
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
    <div className="dashboard-shell mobile-shell">
      <section className="mobile-budget-scroll" aria-label="Budget summary">
        <article className={`budget-chip card-surface budget-chip--${budgetTone}`}>
          <div className="budget-stat__label-row">
            <p>Total Budget</p>
            <span className="budget-stat__chip">Budget</span>
          </div>
          <h2 className="budget-stat__value">{budgetTotal}</h2>
          <span className="budget-stat__footnote">Current budget limit</span>
        </article>
        <article className={`budget-chip card-surface budget-chip--${periodTone}`}>
          <div className="budget-stat__label-row">
            <p>Net This Period</p>
            <span className="budget-stat__chip">Live</span>
          </div>
          <h2 className="budget-stat__value">{spentTotal}</h2>
          <span className="budget-stat__footnote">Income lowers this total</span>
        </article>
        <Suspense fallback={<p className="muted">Loading insights...</p>}>
          <SubscriptionInsightCard
            count={subscriptionInsight.count}
            totalMonthly={subscriptionInsight.totalMonthly}
            className="budget-chip budget-chip--insight"
            loading={loadingSubscriptions}
            error={subscriptionError}
          />
        </Suspense>
      </section>

      <section className="card-surface mobile-chart-card" data-demo-tour="dashboard-overview">
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
            />
          </>
        ) : (
          <p className="muted">Create a budget to unlock financial health insights.</p>
        )}
      </section>

      <section className="card-surface mobile-forecast-card">
        <Suspense fallback={<p className="muted">Loading forecast...</p>}>
          <ForecastChart
            transactions={forecastTransactions}
            selectedPeriod={selectedPeriod}
            budgetLimit={selectedBudgetLimit}
            loading={loadingForecast}
            error={forecastError}
            compact
          />
        </Suspense>
      </section>

      <section className="card-surface mobile-transactions-card">
        <div className="section-heading">
          <h3>Recent Transactions</h3>
        </div>
        <div className="tx-list">
          {loadingBaseData ? (
            <p className="muted">Loading recent transactions...</p>
          ) : hasBaseDataError ? (
            <p className="health-error" role="alert">{baseDataError}</p>
          ) : transactions.length === 0 ? (
            <p className="muted">No transactions yet.</p>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="tx-row">
                <span>{tx.name}</span>
                <span className={isIncomeAmount(tx.amount) ? "tx-positive" : "tx-negative"}>
                  {isIncomeAmount(tx.amount) ? "+" : "-"}${Math.abs(tx.amount).toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="card-surface mobile-predicted-card">
        <Suspense fallback={<p className="muted">Loading insights...</p>}>
          <PredictedTransactionsInsight
            transactions={predictedTransactions}
            loading={loadingPredictions}
            error={predictionError}
            onRetry={onRetryPredictions}
            defaultExpanded={false}
          />
        </Suspense>
      </section>

      <nav className="mobile-bottom-nav" aria-label="Primary">
        {PRIMARY_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.key}
            to={item.to}
            className={isSectionPathActive(location.pathname, item.matchPrefix) ? "active" : undefined}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default memo(MobileDashboard);
