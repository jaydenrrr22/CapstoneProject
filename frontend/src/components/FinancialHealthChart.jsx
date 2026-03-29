import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, Sector } from "recharts";
import "./FinancialHealthChart.css";

function FinancialHealthChart({
  score,
  width = 260,
  height = 160,
  innerRadius = 70,
  outerRadius = 90,
  labelSize = 28,
}) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  const [activeIndex, setActiveIndex] = useState(0);

  const tone = useMemo(() => {
    if (safeScore <= 40) {
      return { color: "#ef4444", glow: "rgba(239,68,68,0.45)" };
    }
    if (safeScore <= 70) {
      return { color: "#f59e0b", glow: "rgba(245,158,11,0.45)" };
    }
    return { color: "#22c55e", glow: "rgba(34,197,94,0.42)" };
  }, [safeScore]);

  const data = useMemo(
    () => [
      { name: "Health Score", value: safeScore, color: tone.color },
      { name: "Remaining Gap", value: 100 - safeScore, color: "#e5e7eb" },
    ],
    [safeScore, tone.color],
  );

  const activeSlice = data[activeIndex] || data[0];

  const renderActiveShape = (props) => (
    <g>
      <Sector
        cx={props.cx}
        cy={props.cy}
        innerRadius={props.innerRadius}
        outerRadius={props.outerRadius + 4}
        startAngle={props.startAngle}
        endAngle={props.endAngle}
        fill={props.fill}
      />
    </g>
  );

  return (
    <div className="health-gauge-wrap" style={{ width: `${width}px` }}>
      <div className="health-gauge-canvas" style={{ height: `${height}px` }}>
        <PieChart width={width} height={height}>
          <defs>
            <linearGradient id="healthGaugeTrack" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f0f1f7" />
              <stop offset="100%" stopColor="#dde0ea" />
            </linearGradient>
            <filter id="healthGlow">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={tone.glow} floodOpacity="1" />
            </filter>
          </defs>

          <Pie
            data={data}
            startAngle={180}
            endAngle={0}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey="value"
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(0)}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={index === 1 ? "url(#healthGaugeTrack)" : entry.color}
                filter={index === 0 ? "url(#healthGlow)" : undefined}
              />
            ))}
          </Pie>
        </PieChart>

        <div className="health-gauge-center" style={{ color: tone.color }}>
          <span style={{ fontSize: `${labelSize}px` }}>{safeScore.toFixed(1)}</span>
          <small>/100</small>
        </div>
      </div>

      <div className="health-gauge-meta">
        <div className="health-gauge-meta-row">
          <span>{activeSlice.name}</span>
          <strong>{activeSlice.value.toFixed(1)}%</strong>
        </div>
        <div className="health-gauge-scale">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
}

export default FinancialHealthChart;