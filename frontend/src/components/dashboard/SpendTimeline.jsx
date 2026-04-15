import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "../../utils/forecastUtils";

function SpendTimelineTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="spend-timeline__tooltip">
      <strong>{label}</strong>
      <p>{formatCurrency(Number(payload[0]?.value || 0), { precise: true })} spent</p>
    </div>
  );
}

function SpendTimeline({
  data = [],
  title = "Spend Timeline",
  periodLabel = "",
}) {
  const hasData = data.some((point) => Number(point.spend || 0) > 0);

  return (
    <section className="dashboard-timeline card-surface" aria-label={title}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Month At A Glance</p>
          <h3>{title}</h3>
        </div>
        {periodLabel ? <span className="dashboard-timeline__period">{periodLabel}</span> : null}
      </div>

      {!hasData ? (
        <p className="muted">Weekly spend will appear here once this period has transaction activity.</p>
      ) : (
        <div className="spend-timeline__chart">
          <ResponsiveContainer width="100%" height={300} minWidth={280} minHeight={300}>
            <BarChart data={data} margin={{ top: 10, right: 6, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="rgba(34, 34, 59, 0.08)" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#4a4e69"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#4a4e69"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCurrency(value)}
                width={72}
              />
              <Tooltip content={<SpendTimelineTooltip />} cursor={{ fill: "rgba(34, 34, 59, 0.06)" }} />
              <Bar dataKey="spend" radius={[10, 10, 4, 4]} fill="#4a4e69" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export default SpendTimeline;

