import { PieChart, Pie, Cell } from "recharts";

function FinancialHealthChart({ score }) {

  const data = [
    { name: "score", value: score },
    { name: "remaining", value: 100 - score }
  ];

  let scoreColor;

  // Color coding based on score thresholds
  if (score <= 40) {
    scoreColor = "#ef4444";
  } else if (score <= 70) {
    scoreColor = "#f59e0b";
  } else {
    scoreColor = "#22c55e";
  }

  const COLORS = [scoreColor, "#e5e7eb"];

  return (
    <div style={{
      position: "relative",
      width: "260px",
      margin: "0 auto"
    }}>

      <PieChart width={260} height={160}>
        <Pie
          data={data}
          startAngle={180}
          endAngle={0}
          innerRadius={70}
          outerRadius={90}
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
          fontSize: "28px",
          fontWeight: "bold",
          color: scoreColor
        }}
      >
        {score}
      </div>

    </div>
  );
}

export default FinancialHealthChart;