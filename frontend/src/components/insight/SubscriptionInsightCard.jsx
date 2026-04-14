import InsightCard from "./InsightCard";
import { SubscriptionIcon } from "./InsightIcons";
import { formatCurrency } from "../../utils/forecastUtils";

function SubscriptionInsightCard({
  count = 0,
  totalMonthly = 0,
  description = "Recurring payments detected from your transaction history.",
  className = "",
  loading = false,
  error = "",
}) {
  const hasSubscriptions = count > 0;
  const isEmpty = !loading && !error && !hasSubscriptions;
  const resolvedDescription = loading
    ? "Checking your transaction history for recurring charges."
    : error
      ? "Subscription insight is temporarily unavailable."
      : isEmpty
        ? "No recurring subscriptions detected from your current transaction history."
        : description;

  return (
    <InsightCard
      title="Recurring Subscriptions"
      value={loading ? "Loading..." : String(count)}
      description={resolvedDescription}
      status={error ? "negative" : hasSubscriptions ? "warning" : "neutral"}
      icon={<SubscriptionIcon />}
      className={className}
      collapsible={false}
    >
      {loading ? (
        <div className="insight-card__state insight-card__empty">
          <p className="insight-card__state-title">Loading subscription insights</p>
          <p className="insight-card__state-message">We are checking your recurring charges now.</p>
        </div>
      ) : error ? (
        <div className="insight-card__state insight-card__error" role="alert">
          <p className="insight-card__state-title">Could not load subscriptions</p>
          <p className="insight-card__state-message">{error}</p>
        </div>
      ) : isEmpty ? (
        <div className="insight-card__state insight-card__empty">
          <p className="insight-card__state-title">No recurring subscriptions found</p>
          <p className="insight-card__state-message">
            Add more transaction history and recurring services will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="insight-card__meta">
          <div className="insight-card__meta-row">
            <span>Monthly total</span>
            <strong>{formatCurrency(totalMonthly, { precise: true })}</strong>
          </div>
        </div>
      )}
    </InsightCard>
  );
}

export default SubscriptionInsightCard;

