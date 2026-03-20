import { PieChart, Pie, Cell } from "recharts";

function FinancialHealthChart({
  score,
  width = 260,
  height = 160,
  innerRadius = 70,
  outerRadius = 90,
  labelSize = 28,
}) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));

  const data = [
    { name: "score", value: safeScore },
    { name: "remaining", value: 100 - safeScore }
  ];

  let scoreColor;

  // Color coding based on score thresholds
  if (safeScore <= 40) {
    scoreColor = "#ef4444";
  } else if (safeScore <= 70) {
    scoreColor = "#f59e0b";
  } else {
    scoreColor = "#22c55e";
  }

  const COLORS = [scoreColor, "#e5e7eb"];

  return (
    <div style={{
      position: "relative",
      width: `${width}px`,
      margin: "0 auto"
    }}>

      <PieChart width={width} height={height}>
        <Pie
          data={data}
          startAngle={180}
          endAngle={0}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={COLORS[index]} />
          ))}
        </Pie>
      </PieChart>

      {/* Center score */}
      <div
        style={{
          position: "absolute",
          top: "70%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: `${labelSize}px`,
          fontWeight: "bold",
          color: scoreColor
        }}
      >
        {safeScore}
      </div>

    </div>
  );
}

export default FinancialHealthChart;