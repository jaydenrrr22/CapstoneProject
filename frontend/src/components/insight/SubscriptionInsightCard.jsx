import InsightCard from "./InsightCard";
import { SubscriptionIcon } from "./InsightIcons";
import { formatCurrency } from "../../utils/forecastUtils";

function SubscriptionInsightCard({
  count = 0,
  totalMonthly = 0,
  description = "Recurring payments detected from your transaction history.",
  className = "",
}) {
  return (
    <InsightCard
      title="Recurring Subscriptions"
      value={String(count)}
      description={description}
      status={count > 0 ? "warning" : "neutral"}
      icon={<SubscriptionIcon />}
      className={className}
      collapsible={false}
    >
      <div className="insight-card__meta">
        <div className="insight-card__meta-row">
          <span>Monthly total</span>
          <strong>{formatCurrency(totalMonthly, { precise: true })}</strong>
        </div>
      </div>
    </InsightCard>
  );
}

export default SubscriptionInsightCard;
