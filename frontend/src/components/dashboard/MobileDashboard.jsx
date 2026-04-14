import { lazy, memo, Suspense, useMemo } from "react";
import { Link } from "react-router-dom";
import FinancialHealthChart from "../FinancialHealthChart";
import DashboardInsightsFeed from "./DashboardInsightsFeed";
import SpendTimeline from "./SpendTimeline";
import {
  buildBudgetProgress,
  buildFreshnessLabel,
  buildInsightsFeed,
  buildNetDelta,
  buildPulseBar,
  buildSpendTimeline,
  buildTransactionAnnotations,
  formatSignedCurrency,
} from "./dashboardSignals";
import { formatCurrency } from "../../utils/forecastUtils";
import "./DashboardLayouts.css";

const ForecastChart = lazy(() => import("../forecast/ForecastChart"));

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
  predictedTransactions,
  loadingBaseData,
  baseDataError,
  anomalies,
  lastUpdatedAt,
}) {
  const safePredictedTransactions = predictedTransactions || [];

  const netDelta = useMemo(
    () => buildNetDelta(selectedPeriod, forecastTransactions),
    [forecastTransactions, selectedPeriod]
  );
  const budgetProgress = useMemo(
    () => buildBudgetProgress(selectedPeriod, selectedBudgetLimit, health, forecastTransactions),
    [forecastTransactions, health, selectedBudgetLimit, selectedPeriod]
  );
  const pulse = useMemo(
    () => buildPulseBar({
      anomalies,
      budgetProgress,
      predictionCount: safePredictedTransactions.length,
      selectedPeriod,
      subscriptionCount: subscriptionInsight.count,
      subscriptionTotal: subscriptionInsight.totalMonthly,
    }),
    [anomalies, budgetProgress, safePredictedTransactions.length, selectedPeriod, subscriptionInsight.count, subscriptionInsight.totalMonthly]
  );
  const insightFeedItems = useMemo(
    () => buildInsightsFeed({
      anomalies,
      budgetProgress,
      predictions: safePredictedTransactions,
      selectedPeriod,
      subscriptionCount: subscriptionInsight.count,
      subscriptionTotal: subscriptionInsight.totalMonthly,
    }),
    [anomalies, budgetProgress, safePredictedTransactions, selectedPeriod, subscriptionInsight.count, subscriptionInsight.totalMonthly]
  );
  const annotatedTransactions = useMemo(
    () => buildTransactionAnnotations(transactions, anomalies)
      .slice()
      .sort((left, right) => new Date(right.date) - new Date(left.date))
      .slice(0, 5),
    [anomalies, transactions]
  );
  const spendTimeline = useMemo(
    () => buildSpendTimeline(selectedPeriod, forecastTransactions),
    [forecastTransactions, selectedPeriod]
  );
  const freshnessLabel = useMemo(
    () => buildFreshnessLabel(lastUpdatedAt),
    [lastUpdatedAt]
  );

  return (
    <div className="dashboard-shell mobile-shell">
      <div className="dashboard-meta-row dashboard-meta-row--mobile">
        <div>
          <p className="eyebrow">Trace Command Center</p>
          <h1>Financial decision surface</h1>
        </div>
        <span className="dashboard-meta-pill dashboard-meta-pill--live">{freshnessLabel}</span>
      </div>

      <section className={`dashboard-pulse dashboard-pulse--${pulse.tone}`}>
        <div>
          <p className="dashboard-pulse__label">{pulse.title}</p>
          <h2>{pulse.message}</h2>
        </div>
      </section>

      <section className="mobile-summary-scroll" aria-label="Dashboard summary">
        <article className="dashboard-summary-card card-surface">
          <div className="dashboard-summary-card__header">
            <p>Total Budget</p>
            <span className="budget-stat__chip">Budget</span>
          </div>
          <strong>{selectedBudgetLimit ? formatCurrency(selectedBudgetLimit, { precise: true }) : "--"}</strong>
          <span>For the selected month</span>
        </article>

        <article className={`dashboard-summary-card card-surface dashboard-summary-card--${netDelta.direction === "up" ? "positive" : netDelta.direction === "down" ? "negative" : "neutral"}`}>
          <div className="dashboard-summary-card__header">
            <p>Net This Period</p>
            <span className="budget-stat__chip">Trend</span>
          </div>
          <strong>{formatSignedCurrency(netDelta.currentNet)}</strong>
          <span>{netDelta.deltaLabel}</span>
        </article>

        <article className={`dashboard-summary-card card-surface dashboard-summary-card--${budgetProgress?.tone || "neutral"}`}>
          <div className="dashboard-summary-card__header">
            <p>Budget Used</p>
            <span className="budget-stat__chip">Pace</span>
          </div>
          {budgetProgress ? (
            <>
              <strong>{budgetProgress.percentageUsed.toFixed(0)}%</strong>
              <div className="dashboard-progress">
                <div
                  className="dashboard-progress__fill"
                  style={{ width: `${Math.min(100, budgetProgress.percentageUsed)}%` }}
                />
                <div
                  className="dashboard-progress__marker"
                  style={{ left: `${budgetProgress.dayProgress}%` }}
                />
              </div>
              <span>{budgetProgress.paceStatus}</span>
            </>
          ) : (
            <span className="muted">Set a budget to unlock pacing guidance.</span>
          )}
        </article>
      </section>

      <section className="card-surface mobile-chart-card" data-demo-tour="dashboard-overview">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Status</p>
            <h3>Financial Health</h3>
          </div>
          <select
            className="health-period-select"
            value={selectedPeriod}
            onChange={(event) => onPeriodChange(event.target.value)}
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
              <span className="muted">{budgetProgress ? `${budgetProgress.percentageUsed.toFixed(0)}% used` : selectedPeriod}</span>
            </div>

            <FinancialHealthChart score={health.score} />

            <div className="health-metrics-grid">
              <div>
                <p>Net total</p>
                <h4>{formatSignedCurrency(netDelta.currentNet)}</h4>
              </div>
              <div>
                <p>Remaining</p>
                <h4>{formatCurrency(health.remaining_balance, { precise: true })}</h4>
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

      <section className="card-surface mobile-forecast-card">
        <div className="dashboard-section-kicker">
          <p className="eyebrow">Forward View</p>
          <span>Projected trend and budget threshold</span>
        </div>
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

      <DashboardInsightsFeed items={insightFeedItems} maxItems={4} />

      <section className="card-surface mobile-transactions-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Latest Activity</p>
            <h3>Recent Transactions</h3>
          </div>
          <Link className="dashboard-inline-link" to="/transactions">
            View all
          </Link>
        </div>

        {loadingBaseData ? (
          <p className="muted">Loading recent transactions...</p>
        ) : baseDataError ? (
          <p className="health-error" role="alert">{baseDataError}</p>
        ) : annotatedTransactions.length === 0 ? (
          <p className="muted">No transactions yet.</p>
        ) : (
          <div className="dashboard-transactions-list">
            {annotatedTransactions.map((transaction) => (
              <article key={transaction.id} className={`dashboard-transaction-row${transaction.anomaly ? " is-flagged" : ""}`}>
                <div className="dashboard-transaction-row__body">
                  <div className="dashboard-transaction-row__title">
                    <strong>{transaction.merchant}</strong>
                    {transaction.anomaly ? <span className="dashboard-flag-pill">Flagged</span> : null}
                  </div>
                  <div className="dashboard-transaction-row__meta">
                    <span className="dashboard-category-pill">{transaction.category}</span>
                    <span>{transaction.date}</span>
                  </div>
                </div>
                <strong className={transaction.isIncome ? "tx-positive" : "tx-negative"}>
                  {formatSignedCurrency(transaction.amount)}
                </strong>
              </article>
            ))}
          </div>
        )}
      </section>

      <SpendTimeline
        data={spendTimeline}
        periodLabel={selectedPeriod}
        title="Spend Timeline"
      />
    </div>
  );
}

export default memo(MobileDashboard);
