import InsightCard from "./InsightCard";
import { PredictionIcon } from "./InsightIcons";
import { formatCurrency } from "../../utils/forecastUtils";

function PredictedTransactionsInsight({
  transactions = [],
  loading = false,
  error = "",
  defaultExpanded = true,
}) {
  const validPredictions = (transactions || []).filter(
    (transaction) => transaction?.amount !== null && transaction?.amount !== undefined
  );

  const totalPredicted = validPredictions.reduce(
    (sum, transaction) => sum + Number(transaction.amount || 0),
    0
  );

  return (
    <InsightCard
      title="Predicted Transactions"
      value={loading ? "Analyzing..." : String(validPredictions.length)}
      description="Upcoming modeled charges and spending events detected from prediction history."
      status={error ? "negative" : validPredictions.length > 0 ? "warning" : "neutral"}
      icon={<PredictionIcon />}
      defaultExpanded={defaultExpanded}
    >
      {loading ? (
        <div className="insight-card__empty">Loading prediction history...</div>
      ) : error ? (
        <div className="insight-card__error" role="alert">{error}</div>
      ) : validPredictions.length === 0 ? (
        <div className="insight-card__empty">No predicted transactions available yet.</div>
      ) : (
        <div className="insight-card__list">
          <div className="insight-card__meta">
            <div className="insight-card__meta-row">
              <span>Predicted total</span>
              <strong className={totalPredicted > 0 ? "insight-card__tone-warning" : totalPredicted < 0 ? "insight-card__tone-positive" : ""}>
                {formatCurrency(totalPredicted, { precise: true })}
              </strong>
            </div>
          </div>

          {validPredictions.map((transaction) => (
            <div key={transaction.id} className="insight-card__list-row">
              <span>{transaction.name || "Predicted transaction"}</span>
              <strong className={transaction.amount > 0 ? "insight-card__tone-warning" : transaction.amount < 0 ? "insight-card__tone-positive" : ""}>
                {transaction.amount < 0 ? "+" : "-"}
                {formatCurrency(Math.abs(transaction.amount), { precise: true })}
              </strong>
            </div>
          ))}
        </div>
      )}
    </InsightCard>
  );
}

export default PredictedTransactionsInsight;
