import InsightCard from "./InsightCard";
import { PredictionIcon } from "./InsightIcons";
import { formatCurrency } from "../../utils/forecastUtils";
import { isIncomeAmount } from "../../utils/finance";

function PredictedTransactionsInsight({
  transactions = [],
  loading = false,
  error = "",
  defaultExpanded = true,
  onRetry,
}) {
  const validPredictions = (transactions || []).filter(
    (transaction) => transaction?.amount !== null && transaction?.amount !== undefined
  );

  const totalPredicted = validPredictions.reduce(
    (sum, transaction) => sum + Number(transaction.amount || 0),
    0
  );
  const canRetry = typeof onRetry === "function";
  const isFailureState = !loading && Boolean(error);
  const isEmptyState = !loading && !error && validPredictions.length === 0;
  const statusLabel = loading
    ? "Refreshing predictions"
    : isFailureState
      ? "Prediction service unavailable"
      : isEmptyState
        ? "No predicted transactions yet"
        : `${validPredictions.length} modeled transaction${validPredictions.length === 1 ? "" : "s"}`;

  return (
    <InsightCard
      title="Predicted Transactions"
      value={loading ? "Analyzing..." : String(validPredictions.length)}
      description={statusLabel}
      status={error ? "negative" : validPredictions.length > 0 ? "warning" : "neutral"}
      icon={<PredictionIcon />}
      defaultExpanded={defaultExpanded}
      className="prediction-insight-card"
      action={isFailureState && canRetry ? (
        <button
          type="button"
          className="insight-card__retry-btn"
          onClick={onRetry}
          disabled={loading}
        >
          Retry
        </button>
      ) : null}
    >
      {loading ? (
        <div className="insight-card__state insight-card__empty">
          <p className="insight-card__state-title">Loading prediction history</p>
          <p className="insight-card__state-message">We are calculating upcoming spending signals now.</p>
        </div>
      ) : error ? (
        <div className="insight-card__state insight-card__error" role="alert">
          <p className="insight-card__state-title">Could not load predictions</p>
          <p className="insight-card__state-message">{error}</p>
          {canRetry ? (
            <button
              type="button"
              className="insight-card__retry-btn insight-card__retry-btn--inline"
              onClick={onRetry}
              disabled={loading}
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : validPredictions.length === 0 ? (
        <div className="insight-card__state insight-card__empty">
          <p className="insight-card__state-title">No predicted transactions available</p>
          <p className="insight-card__state-message">
            Run an intelligence analysis or keep building history. Saved intelligence results will appear here.
          </p>
        </div>
      ) : (
        <div className="insight-card__list">
          <div className="insight-card__meta">
            <div className="insight-card__meta-row">
              <span>Predicted total</span>
              <strong className={isIncomeAmount(totalPredicted) ? "insight-card__tone-positive" : totalPredicted < 0 ? "insight-card__tone-warning" : ""}>
                {formatCurrency(totalPredicted, { precise: true })}
              </strong>
            </div>
          </div>

          {validPredictions.map((transaction) => (
            <div key={transaction.id} className="insight-card__list-row">
              <span>{transaction.name || "Predicted transaction"}</span>
              <strong className={isIncomeAmount(transaction.amount) ? "insight-card__tone-positive" : transaction.amount < 0 ? "insight-card__tone-warning" : ""}>
                {isIncomeAmount(transaction.amount) ? "+" : "-"}
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

