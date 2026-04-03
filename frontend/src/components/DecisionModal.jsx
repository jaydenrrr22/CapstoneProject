import { useEffect } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatAxisDate,
  formatCurrency,
  formatCurrencyDelta,
  formatTooltipDate,
} from "../utils/forecastUtils";
import "./DecisionModal.css";

function DecisionTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0]?.payload;

  if (!point) {
    return null;
  }

  return (
    <div className="decision-modal__tooltip">
      <time>{formatTooltipDate(point.isoDate)}</time>
      <strong>Current path: {formatCurrency(point.baseline, { precise: true })}</strong>
      <strong>After decision: {formatCurrency(point.decision, { precise: true })}</strong>
      <p>
        Impact:
        {" "}
        <span className={point.deltaFromBaseline > 0 ? "is-negative" : point.deltaFromBaseline < 0 ? "is-positive" : ""}>
          {formatCurrencyDelta(point.deltaFromBaseline || 0)}
        </span>
      </p>
    </div>
  );
}

function DecisionLoadingState() {
  return (
    <div className="decision-modal__loading" aria-live="polite" aria-busy="true">
      <div className="decision-modal__loading-header" />
      <div className="decision-modal__loading-chart" />
      <div className="decision-modal__loading-row" />
      <div className="decision-modal__loading-row short" />
    </div>
  );
}

export default function DecisionModal({
  open,
  title = "Decision Intelligence",
  loading = false,
  error = "",
  simulation = null,
  confirmLabel = "Confirm Action",
  cancelLabel = "Cancel",
  adjustLabel = "Adjust Plan",
  onConfirm,
  onCancel,
  onAdjust,
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading && typeof onCancel === "function") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [loading, onCancel, open]);

  if (!open) {
    return null;
  }

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !loading && typeof onCancel === "function") {
      onCancel();
    }
  };

  const recommendationStatus = simulation?.recommendation?.status || "neutral";
  const canConfirm = !loading && typeof onConfirm === "function";

  return (
    <div className="decision-modal__overlay" onClick={handleBackdropClick} role="presentation">
      <div
        className="decision-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="decision-modal-title"
        aria-describedby="decision-modal-description"
      >
        <div className="decision-modal__header">
          <div>
            <p className="decision-modal__eyebrow">Decision-Time Intelligence</p>
            <h2 id="decision-modal-title">{title}</h2>
            <p id="decision-modal-description">
              Preview how this action changes your spending path before you commit it.
            </p>
          </div>

          <button
            type="button"
            className="decision-modal__close"
            onClick={onCancel}
            disabled={loading}
            aria-label="Close decision preview"
          >
            Close
          </button>
        </div>

        {loading ? (
          <DecisionLoadingState />
        ) : error && !simulation ? (
          <div className="decision-modal__error" role="alert">
            <strong>Simulation unavailable</strong>
            <p>{error}</p>
            <p>You can still continue with the transaction, but this preview could not be generated.</p>
          </div>
        ) : simulation ? (
          <div className="decision-modal__content">
            <div className="decision-modal__metrics" aria-label="Decision summary">
              <div className="decision-modal__metric">
                <span>Current period spend</span>
                <strong>{formatCurrency(simulation.currentSpent, { precise: true })}</strong>
              </div>
              <div className="decision-modal__metric">
                <span>After this action</span>
                <strong>{formatCurrency(simulation.projectedSpent, { precise: true })}</strong>
              </div>
              <div className="decision-modal__metric">
                <span>Decision impact</span>
                <strong className={simulation.monthlyImpact > 0 ? "is-negative" : simulation.monthlyImpact < 0 ? "is-positive" : ""}>
                  {formatCurrencyDelta(simulation.monthlyImpact)}
                </strong>
              </div>
            </div>

            <div className="decision-modal__chart-shell">
              <div className="decision-modal__chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={simulation.chartData} margin={{ top: 10, right: 8, bottom: 4, left: 0 }}>
                    <CartesianGrid stroke="rgba(34, 34, 59, 0.08)" vertical={false} />
                    <XAxis
                      dataKey="isoDate"
                      tickFormatter={formatAxisDate}
                      stroke="#4a4e69"
                      tickLine={false}
                      axisLine={false}
                      minTickGap={22}
                    />
                    <YAxis
                      domain={simulation.chartDomain}
                      tickFormatter={(value) => formatCurrency(value)}
                      stroke="#4a4e69"
                      tickLine={false}
                      axisLine={false}
                      width={74}
                    />
                    <Tooltip content={<DecisionTooltip />} cursor={{ stroke: "rgba(34, 34, 59, 0.18)", strokeDasharray: "4 4" }} />

                    {Number.isFinite(simulation.budgetLimit) && (
                      <ReferenceLine
                        y={simulation.budgetLimit}
                        stroke="rgba(180, 35, 24, 0.55)"
                        strokeDasharray="5 5"
                        ifOverflow="extendDomain"
                        label={{ value: "Budget", position: "insideTopRight", fill: "#7a1510", fontSize: 12 }}
                      />
                    )}

                    <Line
                      type="monotone"
                      dataKey="baseline"
                      stroke="#8b5e57"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0, fill: "#8b5e57" }}
                      isAnimationActive={false}
                    />
                    <Line
                      key={simulation.chartKey}
                      type="monotone"
                      dataKey="decision"
                      stroke="#22223b"
                      strokeWidth={3}
                      strokeDasharray="7 5"
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 0, fill: "#22223b" }}
                      animationDuration={700}
                      animationEasing="ease-in-out"
                      isAnimationActive
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="decision-modal__legend" aria-label="Simulation legend">
                <span><i className="baseline" /> Current path</span>
                <span><i className="decision" /> If you proceed</span>
                {Number.isFinite(simulation.budgetLimit) ? <span><i className="budget" /> Budget line</span> : null}
              </div>
            </div>

            <section className={`decision-modal__recommendation decision-modal__recommendation--${recommendationStatus}`}>
              <span className="decision-modal__recommendation-label">Recommendation</span>
              <strong>{simulation.recommendation?.headline || "Preview generated successfully."}</strong>
              <p>{simulation.recommendation?.detail || "Review the chart and confirm when you are ready."}</p>
            </section>

            <div className="decision-modal__stats">
              <div>
                <span>Budget use</span>
                <strong>
                  {simulation.usageBefore !== null && simulation.usageAfter !== null
                    ? `${simulation.usageBefore.toFixed(1)}% -> ${simulation.usageAfter.toFixed(1)}%`
                    : "Unavailable"}
                </strong>
              </div>
              <div>
                <span>Remaining budget</span>
                <strong>{simulation.remainingBudget !== null ? formatCurrency(simulation.remainingBudget, { precise: true }) : "Unavailable"}</strong>
              </div>
              <div>
                <span>Risk level</span>
                <strong>{simulation.riskLevel || "Unknown"}</strong>
              </div>
            </div>

            {simulation.scenarios?.length ? (
              <div className="decision-modal__scenarios">
                {simulation.scenarios.map((scenario) => (
                  <div key={scenario.scenario_type} className="decision-modal__scenario">
                    <span>{scenario.scenario_type}</span>
                    <strong>{formatCurrency(scenario.projected_spent_this_period, { precise: true })}</strong>
                    <small>{scenario.risk_level}</small>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="decision-modal__error" role="alert">
            <strong>Preview unavailable</strong>
            <p>We could not build a simulation for this decision.</p>
          </div>
        )}

        <div className="decision-modal__actions">
          <button
            type="button"
            className="decision-modal__button secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>

          {typeof onAdjust === "function" ? (
            <button
              type="button"
              className="decision-modal__button tertiary"
              onClick={onAdjust}
              disabled={loading}
            >
              {adjustLabel}
            </button>
          ) : null}

          <button
            type="button"
            className="decision-modal__button primary"
            onClick={onConfirm}
            disabled={!canConfirm}
          >
            {loading ? "Preparing preview..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
