import "./DecisionImpactModal.css";
// This component displays a modal with the projected financial impact of a decision.
// Props:
// - open: boolean to control visibility
// - loading: boolean to indicate if data is being calculated
// - simulation: object containing projectedCost, healthScoreChange, and optional overlappingSubscription
// - onConfirm: function to call when user confirms the decision
// - onCancel: function to call when user cancels the decision

export default function DecisionImpactModal({
  open,
  loading,
  simulation,
  onConfirm,
  onCancel
}) {
  if (!open) return null;

  const safeOnCancel = typeof onCancel === "function" ? onCancel : () => {};
  const safeOnConfirm = typeof onConfirm === "function" ? onConfirm : () => {};

  const projectedCost = Number(simulation?.projectedCost ?? 0);
  const healthScoreChange = Number(simulation?.healthScoreChange ?? 0);

  const formattedCost = Number.isFinite(projectedCost)
    ? projectedCost.toLocaleString(undefined, {
      style: "currency",
      currency: "USD"
    })
    : "$0.00";

  const formattedHealthChange = Number.isFinite(healthScoreChange)
    ? `${healthScoreChange > 0 ? "+" : ""}${healthScoreChange}`
    : "0";

  const healthImpactClass =
    healthScoreChange < 0
      ? "decision-impact-value negative"
      : healthScoreChange > 0
        ? "decision-impact-value positive"
        : "decision-impact-value neutral";

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !loading) {
      safeOnCancel();
    }
  };

  return (
    <div
      className="decision-impact-overlay"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className="decision-impact-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="decision-impact-title"
      >
        <h2 id="decision-impact-title" className="decision-impact-title">
          Financial Impact Preview
        </h2>

        {loading ? (
          <p className="decision-impact-loading">Calculating impact...</p>
        ) : simulation ? (
          <>
            <div className="decision-impact-row">
              <span className="decision-impact-label">Projected Long-Term Cost</span>
              <span className="decision-impact-value">{formattedCost}</span>
            </div>

            <div className="decision-impact-row">
              <span className="decision-impact-label">Financial Health Impact</span>
              <span className={healthImpactClass}>{formattedHealthChange}</span>
            </div>

            {simulation?.aiSummary && (
              <div className="decision-impact-warning" role="note">
                {simulation.aiSummary}
              </div>
            )}

            {simulation?.overlappingSubscription && (
              <div className="decision-impact-warning" role="alert">
                Possible overlap with existing subscription: {simulation.overlappingSubscription}
              </div>
            )}
          </>
        ) : (
          <p className="decision-impact-loading">Preview unavailable. You can cancel and try again.</p>
        )}

        <div className="decision-impact-actions">
          <button
            type="button"
            className="decision-impact-btn secondary"
            onClick={safeOnCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="decision-impact-btn primary"
            onClick={safeOnConfirm}
            disabled={loading || !simulation}
          >
            {loading ? "Please wait..." : "Proceed"}
          </button>
        </div>
      </div>
    </div>
  );
}