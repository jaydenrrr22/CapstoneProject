import { startTransition, useId, useState } from "react";
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
import useForecastData from "../../hooks/useForecastData";
import InsightCard from "../insight/InsightCard";
import { ForecastIcon } from "../insight/InsightIcons";
import {
  FORECAST_HORIZONS,
  formatCurrency,
  formatCurrencyDelta,
  formatAxisDate,
  formatTooltipDate,
} from "../../utils/forecastUtils";
import "./ForecastChart.css";

function ForecastTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0]?.payload;

  if (!point) {
    return null;
  }

  const isProjectedPoint = point.actualSpent === null && point.projectedSpent !== null;
  const displayedValue = point.projectedSpent ?? point.actualSpent ?? 0;
  const deltaTone = point.deltaFromCurrent > 0 ? "delta-positive" : point.deltaFromCurrent < 0 ? "delta-negative" : "";

  return (
    <div className="forecast-tooltip">
      <time>{formatTooltipDate(point.isoDate)}</time>
      <strong>{isProjectedPoint ? "Projected value" : "Observed value"}: {formatCurrency(displayedValue, { precise: true })}</strong>
      <p>
        {isProjectedPoint
          ? (
            <>
              Delta from current:
              {" "}
              <span className={deltaTone}>{formatCurrencyDelta(point.deltaFromCurrent)}</span>
            </>
          )
          : "Historical period activity captured from recorded transactions in the selected budget period."}
      </p>
    </div>
  );
}

function ForecastSkeleton({ compact }) {
  return (
    <div className={`forecast-skeleton${compact ? " compact" : ""}`} aria-hidden="true">
      <div className="forecast-skeleton-bar" />
      <div className="forecast-skeleton-chart" />
      <div className="forecast-skeleton-stats">
        <div className="forecast-skeleton-stat" />
        <div className="forecast-skeleton-stat" />
        <div className="forecast-skeleton-stat" />
      </div>
    </div>
  );
}

function ForecastChart({
  transactions,
  selectedPeriod,
  budgetLimit,
  loading = false,
  error = "",
  compact = false,
}) {
  const [horizon, setHorizon] = useState("3M");
  const gradientId = useId().replace(/:/g, "");
  const forecast = useForecastData({
    budgetLimit,
    horizon,
    selectedPeriod,
    transactions,
  });

  const projectedDeltaClass = forecast.projectedDelta > 0
    ? "positive"
    : forecast.projectedDelta < 0
      ? "negative"
      : "";

  const handleHorizonChange = (nextHorizon) => {
    startTransition(() => {
      setHorizon(nextHorizon);
    });
  };

  const forecastStatus = error
    ? "negative"
    : forecast.projectedDelta > 0
      ? "warning"
      : forecast.projectedDelta < 0
        ? "positive"
        : "neutral";

  return (
    <InsightCard
      title="Forecast Outlook"
      value={loading ? "Loading..." : error ? "Unavailable" : formatCurrencyDelta(forecast.projectedDelta)}
      description="Historical period totals anchor the projection from the latest observed point."
      status={forecastStatus}
      icon={<ForecastIcon />}
      collapsible={false}
      action={(
        <div className="forecast-toggle" role="tablist" aria-label="Forecast horizon">
          {FORECAST_HORIZONS.map((option) => (
            <button
              key={option}
              type="button"
              className={option === horizon ? "active" : ""}
              aria-pressed={option === horizon}
              onClick={() => handleHorizonChange(option)}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    >
      {loading ? (
        <ForecastSkeleton compact={compact} />
      ) : error ? (
        <div className="forecast-error" role="alert">
          <p>{error}</p>
        </div>
      ) : forecast.isEmpty ? (
        <div className="forecast-empty">
          <p>{forecast.emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="forecast-summary" aria-label="Forecast summary">
            <div className="forecast-stat">
              <span>Current net spend</span>
              <strong>{formatCurrency(forecast.currentValue, { precise: true })}</strong>
            </div>
            <div className="forecast-stat">
              <span>Average daily change</span>
              <strong>{formatCurrency(forecast.averageDailyChange, { precise: true })}</strong>
            </div>
            <div className="forecast-stat">
              <span>{horizon} projection delta</span>
              <strong className={projectedDeltaClass}>{formatCurrencyDelta(forecast.projectedDelta)}</strong>
            </div>
          </div>

          <div className={`forecast-chart-shell${compact ? " compact" : ""}`}>
            <div className="forecast-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecast.data} margin={{ top: 12, right: 12, bottom: 8, left: 0 }}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#4a4e69" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#22223b" stopOpacity="1" />
                    </linearGradient>
                  </defs>

                  <CartesianGrid stroke="rgba(34, 34, 59, 0.08)" vertical={false} />
                  <XAxis
                    dataKey="isoDate"
                    tickFormatter={formatAxisDate}
                    minTickGap={compact ? 26 : 18}
                    stroke="#4a4e69"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={forecast.domain}
                    tickFormatter={(value) => formatCurrency(value)}
                    width={70}
                    stroke="#4a4e69"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<ForecastTooltip />} cursor={{ stroke: "rgba(34, 34, 59, 0.2)", strokeDasharray: "4 4" }} />

                  {forecast.budgetReference !== null && (
                    <ReferenceLine
                      y={forecast.budgetReference}
                      stroke="rgba(180, 35, 24, 0.55)"
                      strokeDasharray="5 5"
                      ifOverflow="extendDomain"
                      label={{ value: "Budget", position: "insideTopRight", fill: "#7a1510", fontSize: 12 }}
                    />
                  )}

                  <Line
                    type="monotone"
                    dataKey="actualSpent"
                    stroke="#8b5e57"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: "#8b5e57" }}
                    isAnimationActive={false}
                    connectNulls={false}
                  />
                  <Line
                    key={`projection-${horizon}-${forecast.lastActualDate}`}
                    type="monotone"
                    dataKey="projectedSpent"
                    stroke={`url(#${gradientId})`}
                    strokeDasharray="6 6"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 0, fill: "#22223b" }}
                    animationDuration={700}
                    animationEasing="ease-in-out"
                    isAnimationActive
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="forecast-legend" aria-label="Forecast legend">
              <span><i style={{ background: "#8b5e57" }} /> Historical total</span>
              <span><i style={{ background: "linear-gradient(90deg, #4a4e69, #22223b)" }} /> Projected total</span>
              {forecast.budgetReference !== null && <span><i style={{ background: "#b42318" }} /> Budget threshold</span>}
            </div>
          </div>
        </>
      )}
    </InsightCard>
  );
}

export default ForecastChart;
