import ForecastChart from "../components/forecast/ForecastChart";
import AppBreadcrumbs from "../components/AppBreadcrumbs";
import IntelligenceGrid from "../components/intelligence/IntelligenceGrid";
import InsightCard from "../components/insight/InsightCard";
import PredictedTransactionsInsight from "../components/insight/PredictedTransactionsInsight";
import SubscriptionInsightCard from "../components/insight/SubscriptionInsightCard";
import { PredictionIcon, SubscriptionIcon } from "../components/insight/InsightIcons";
import useIntelligenceOverviewData from "../hooks/useIntelligenceOverviewData";
import { formatCurrency, formatCurrencyDelta, formatTooltipDate } from "../utils/forecastUtils";
import "../components/dashboard/DashboardLayouts.css";
import "./IntelligenceDashboard.css";

function getForecastStatus(projectedSavingsOrDeficit, trendDirection) {
  if (projectedSavingsOrDeficit !== null && projectedSavingsOrDeficit < 0) {
    return "negative";
  }

  if (trendDirection === "Increase") {
    return "warning";
  }

  if (trendDirection === "Decrease") {
    return "positive";
  }

  return "neutral";
}

function IntelligenceDashboard() {
  const {
    anomalySummary,
    forecast,
    loadingAnomalies,
    loadingOverview,
    loadingPredictions,
    overviewError,
    predictedSummary,
    predictionError,
    predictions,
    projectedMonthlySpend,
    projectedSavingsOrDeficit,
    selectedBudgetLimit,
    selectedPeriod,
    subscriptionSummary,
    subscriptions,
    transactions,
    trendDirection,
  } = useIntelligenceOverviewData();

  const forecastStatus = getForecastStatus(projectedSavingsOrDeficit, trendDirection);
  const duplicateRiskCount = subscriptionSummary.duplicates.length + subscriptionSummary.overlapping.length;
  const highCostCount = subscriptionSummary.highCost.length;

  return (
    <div className="dashboard-shell intelligence-page">
      <div className="intelligence-shell">
        <AppBreadcrumbs />

        <IntelligenceGrid>
          <section className="intelligence-panel intelligence-panel--hero">
            <div className="intelligence-hero">
              <div className="intelligence-hero__copy">
                <p className="intelligence-hero__eyebrow">Intelligence Overview</p>
                <h2>Your spending signals in one place</h2>
                <p>
                  Trace brings together forecast momentum, unusual transactions, recurring charges, and
                  predicted spending so you can see what is changing, what is coming next, and what needs attention first.
                </p>
              </div>

              <div className="intelligence-hero__stats">
                <div className="intelligence-hero__stat">
                  <span>Current period</span>
                  <strong>{selectedPeriod || "No budget period"}</strong>
                </div>
                <div className="intelligence-hero__stat">
                  <span>Active alerts</span>
                  <strong>{loadingAnomalies ? "..." : String(anomalySummary.count)}</strong>
                </div>
                <div className="intelligence-hero__stat">
                  <span>Prediction count</span>
                  <strong>{loadingPredictions ? "..." : String(predictedSummary.count)}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="intelligence-panel intelligence-panel--forecast">
            <div className="intelligence-stack">
              <InsightCard
                title="Projected monthly spend"
                value={loadingOverview ? "Loading..." : formatCurrency(projectedMonthlySpend, { precise: true })}
                description="Expected spend if your current pace continues through the selected horizon."
                status={forecastStatus}
              />
              <InsightCard
                title="Projected savings or deficit"
                value={loadingOverview ? "Loading..." : projectedSavingsOrDeficit === null ? "No budget" : formatCurrencyDelta(projectedSavingsOrDeficit)}
                description="Compares projected spend to your selected budget threshold."
                status={projectedSavingsOrDeficit !== null && projectedSavingsOrDeficit < 0 ? "negative" : projectedSavingsOrDeficit !== null && projectedSavingsOrDeficit > 0 ? "positive" : "neutral"}
              />
              <InsightCard
                title="Trend direction"
                value={loadingOverview ? "Loading..." : trendDirection}
                description="Shows whether modeled spending is moving up, down, or holding steady."
                status={trendDirection === "Increase" ? "warning" : trendDirection === "Decrease" ? "positive" : "neutral"}
              >
                <div className="insight-card__meta">
                  <div className="insight-card__meta-row">
                    <span>Observed spend</span>
                    <strong>{formatCurrency(forecast.currentValue, { precise: true })}</strong>
                  </div>
                  <div className="insight-card__meta-row">
                    <span>1M delta</span>
                    <strong>{formatCurrencyDelta(forecast.projectedDelta)}</strong>
                  </div>
                  <div className="insight-card__meta-row">
                    <span>Budget limit</span>
                    <strong>{selectedBudgetLimit !== null ? formatCurrency(selectedBudgetLimit, { precise: true }) : "Not set"}</strong>
                  </div>
                </div>
              </InsightCard>
            </div>
          </section>

          <section className="intelligence-panel intelligence-panel--chart" data-demo-tour="intelligence-panel">
            <div className="card-surface intelligence-section-card">
              <ForecastChart
                transactions={transactions}
                selectedPeriod={selectedPeriod}
                budgetLimit={selectedBudgetLimit}
                loading={loadingOverview}
                error={overviewError}
              />
            </div>
          </section>

          <section className="intelligence-panel intelligence-panel--anomalies">
            <InsightCard
              title="Anomaly alerts"
              value={loadingAnomalies ? "Loading..." : String(anomalySummary.count)}
              description="Unusual merchants, high-spend spikes, and unexpected category behavior."
              status={anomalySummary.count > 0 ? "negative" : "neutral"}
              icon={<PredictionIcon />}
            >
              {overviewError ? (
                <div className="intelligence-error" role="alert">{overviewError}</div>
              ) : loadingAnomalies ? (
                <div className="intelligence-empty">Scanning transactions for unusual patterns...</div>
              ) : anomalySummary.topAlerts.length === 0 ? (
                <div className="intelligence-empty">No unusual spending patterns detected.</div>
              ) : (
                <div className="intelligence-alert-list">
                  {anomalySummary.topAlerts.map((alert, index) => (
                    <div key={`${alert.merchant}-${alert.date}-${index}`} className="intelligence-alert-row">
                      <strong>{alert.merchant || alert.category || "Spending alert"}</strong>
                      <div className="intelligence-alert-meta">
                        <span>{alert.anomaly_type}</span>
                        <span>{formatTooltipDate(alert.date)}</span>
                      </div>
                      <div className="intelligence-alert-meta">
                        <span>Actual: {formatCurrency(alert.actual_amount, { precise: true })}</span>
                        <span>Expected: {formatCurrency(alert.expected_amount, { precise: true })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </InsightCard>
          </section>

          <section className="intelligence-panel intelligence-panel--subscriptions">
            <div className="intelligence-stack">
              <SubscriptionInsightCard
                count={subscriptions.length}
                totalMonthly={subscriptionSummary.totalMonthly}
                description="Recurring payments detected from your transaction history."
              />
              <InsightCard
                title="Subscription warnings"
                value={loadingOverview ? "Loading..." : String(duplicateRiskCount + highCostCount)}
                description="Duplicate services, overlapping merchants, and subscriptions that may deserve review."
                status={duplicateRiskCount > 0 || highCostCount > 0 ? "warning" : "neutral"}
                icon={<SubscriptionIcon />}
              >
                {overviewError ? (
                  <div className="intelligence-error" role="alert">{overviewError}</div>
                ) : loadingOverview ? (
                  <div className="intelligence-empty">Reviewing recurring charge risk...</div>
                ) : duplicateRiskCount === 0 && highCostCount === 0 ? (
                  <div className="intelligence-empty">No duplicate or high-cost subscription risks found.</div>
                ) : (
                  <div className="intelligence-subscription-list">
                    {subscriptionSummary.duplicates.slice(0, 3).map((item, index) => (
                      <div key={`dup-${item.merchant}-${index}`} className="intelligence-subscription-row">
                        <strong>{item.merchant}</strong>
                        <div className="intelligence-subscription-meta">
                          <span>Duplicate risk</span>
                          <span>{formatCurrency(item.amount, { precise: true })}</span>
                        </div>
                      </div>
                    ))}
                    {subscriptionSummary.highCost.slice(0, 3).map((item, index) => (
                      <div key={`high-${item.merchant}-${index}`} className="intelligence-subscription-row">
                        <strong>{item.merchant}</strong>
                        <div className="intelligence-subscription-meta">
                          <span>High monthly cost</span>
                          <span>{formatCurrency(item.amount, { precise: true })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </InsightCard>
            </div>
          </section>

          <section className="intelligence-panel intelligence-panel--predictions">
            <PredictedTransactionsInsight
              transactions={predictions}
              loading={loadingPredictions}
              error={predictionError}
            />
          </section>
        </IntelligenceGrid>
      </div>
    </div>
  );
}

export default IntelligenceDashboard;

