import { useEffect, useMemo, useState } from "react";
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
      <strong>After decision: {formatCurrency(point.decisionSelected, { precise: true })}</strong>
      <p>
        Impact:
        {" "}
        <span className={
          point.viewMode === "cash"
            ? point.deltaFromBaseline > 0
              ? "is-positive"
              : point.deltaFromBaseline < 0
                ? "is-negative"
                : ""
            : point.deltaFromBaseline > 0
              ? "is-negative"
              : point.deltaFromBaseline < 0
                ? "is-positive"
                : ""
        }>
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
  busy = false,
  busyLabel = "Working...",
  error = "",
  simulation = null,
  confirmLabel = "Confirm Action",
  cancelLabel = "Cancel",
  adjustLabel = "Adjust Plan",
  onConfirm,
  onCancel,
  onAdjust,
}) {
  const [selectedScenarioType, setSelectedScenarioType] = useState("");
  const isBusy = loading || busy;
  const recommendationStatus = simulation?.recommendation?.status || "neutral";
  const canConfirm = !isBusy && typeof onConfirm === "function";
  const defaultScenarioType = useMemo(() => {
    if (!simulation?.scenarios?.length) {
      return "";
    }

    return simulation.scenarios.find((scenario) => scenario.scenario_type === "Base Case")?.scenario_type
      || simulation.scenarios[0]?.scenario_type
      || "";
  }, [simulation]);
  const resolvedScenarioType = simulation?.scenarios?.some(
    (scenario) => scenario.scenario_type === selectedScenarioType,
  )
    ? selectedScenarioType
    : defaultScenarioType;
  const activeScenario = useMemo(() => {
    if (!simulation?.scenarios?.length) {
      return null;
    }

    return simulation.scenarios.find((scenario) => scenario.scenario_type === resolvedScenarioType)
      || simulation.scenarios[0];
  }, [resolvedScenarioType, simulation]);
  const labels = simulation?.labels || {};
  const activeImpact = activeScenario?.impactFromCurrent ?? simulation?.decisionDelta ?? 0;
  const activeProjectedValue = activeScenario?.display_value ?? simulation?.projectedMetricValue ?? 0;
  const impactToneClass = simulation?.viewMode === "cash"
    ? activeImpact > 0
      ? "is-positive"
      : activeImpact < 0
        ? "is-negative"
        : ""
    : activeImpact > 0
      ? "is-negative"
      : activeImpact < 0
        ? "is-positive"
        : "";
  const activeRemainingBudget = activeScenario?.remaining_budget_after_purchase ?? simulation?.remainingBudget ?? null;
  const activeUsageAfter = activeScenario?.projected_percentage_used ?? simulation?.usageAfter ?? null;
  const activeRiskLevel = activeScenario?.risk_level ?? simulation?.riskLevel ?? "Unknown";
  const chartData = useMemo(() => (
    (simulation?.chartData || []).map((point) => ({
      ...point,
      decisionSelected: point.isoDate >= simulation?.actionDate
        ? point.baseline + activeImpact
        : point.baseline,
      deltaFromBaseline: point.isoDate >= simulation?.actionDate ? activeImpact : 0,
      viewMode: simulation?.viewMode || "spend",
    }))
  ), [activeImpact, simulation]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isBusy && typeof onCancel === "function") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isBusy, onCancel, open]);

  if (!open) {
    return null;
  }

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !isBusy && typeof onCancel === "function") {
      onCancel();
    }
  };

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
              {labels.secondaryDescription || "Preview how this action changes your spending path before you commit it."}
            </p>
          </div>

          <button
            type="button"
            className="decision-modal__close"
            onClick={onCancel}
            disabled={isBusy}
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
                <span>{labels.currentMetric || "Current period spend"}</span>
                <strong>{formatCurrency(simulation.currentMetricValue, { precise: true })}</strong>
              </div>
              <div className="decision-modal__metric">
                <span>{labels.projectedMetric || "After this action"}</span>
                <strong>{formatCurrency(activeProjectedValue, { precise: true })}</strong>
              </div>
              <div className="decision-modal__metric">
                <span>{labels.impactMetric || "Decision impact"}</span>
                <strong className={impactToneClass}>
                  {formatCurrencyDelta(activeImpact)}
                </strong>
              </div>
            </div>

            {simulation.scenarios?.length ? (
              <div className="decision-modal__scenario-selector" aria-label="Projection scenarios">
                {simulation.scenarios.map((scenario) => (
                  <button
                    key={scenario.scenario_type}
                    type="button"
                    className={`decision-modal__scenario-pill${scenario.scenario_type === activeScenario?.scenario_type ? " is-active" : ""}`}
                    onClick={() => setSelectedScenarioType(scenario.scenario_type)}
                  >
                    <strong>{scenario.scenario_type}</strong>
                    <span>{scenario.risk_level}</span>
                  </button>
                ))}
              </div>
            ) : null}

            <div className="decision-modal__chart-shell">
              <div className="decision-modal__chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 8, bottom: 4, left: 0 }}>
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

                    {Number.isFinite(simulation.chartReferenceValue) && (
                      <ReferenceLine
                        y={simulation.chartReferenceValue}
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
                      key={`${simulation.chartKey}-${activeScenario?.scenario_type || "default"}`}
                      type="monotone"
                      dataKey="decisionSelected"
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
                <span><i className="decision" /> Selected scenario</span>
                {Number.isFinite(simulation.chartReferenceValue) ? <span><i className="budget" /> Budget line</span> : null}
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
                  {simulation.usageBefore !== null && activeUsageAfter !== null
                    ? `${simulation.usageBefore.toFixed(1)}% -> ${activeUsageAfter.toFixed(1)}%`
                    : "Unavailable"}
                </strong>
              </div>
              <div>
                <span>Remaining budget</span>
                <strong>{activeRemainingBudget !== null ? formatCurrency(activeRemainingBudget, { precise: true }) : "Unavailable"}</strong>
              </div>
              <div>
                <span>{labels.statusMetric || "Risk level"}</span>
                <strong>{activeRiskLevel || "Unknown"}</strong>
              </div>
            </div>

            {simulation.scenarios?.length ? (
              <div className="decision-modal__scenarios">
                {simulation.scenarios.map((scenario) => (
                  <button
                    type="button"
                    key={scenario.scenario_type}
                    className={`decision-modal__scenario${scenario.scenario_type === activeScenario?.scenario_type ? " is-active" : ""}`}
                    onClick={() => setSelectedScenarioType(scenario.scenario_type)}
                  >
                    <span>{scenario.scenario_type}</span>
                    <strong>{formatCurrency(scenario.display_value ?? scenario.projected_spent_this_period, { precise: true })}</strong>
                    <small>{scenario.risk_level}</small>
                  </button>
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
            disabled={isBusy}
          >
            {cancelLabel}
          </button>

          {typeof onAdjust === "function" ? (
            <button
              type="button"
              className="decision-modal__button tertiary"
              onClick={onAdjust}
              disabled={isBusy}
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
            {busy ? busyLabel : loading ? "Preparing preview..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

