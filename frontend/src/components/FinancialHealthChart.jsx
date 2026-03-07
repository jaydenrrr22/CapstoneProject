import { PieChart, Pie, Cell } from "recharts";

function FinancialHealthChart({ score }) {

  const data = [
    { name: "score", value: score },
    { name: "remaining", value: 100 - score }
  ];

  // Determine color based on score
  let scoreColor;

  if (score <= 40) {
    scoreColor = "#ef4444"; // red
  } else if (score <= 70) {
    scoreColor = "#f59e0b"; // yellow
  } else {
    scoreColor = "#22c55e"; // green
  }

  const COLORS = [scoreColor, "#e5e7eb"]; // second slice gray

  return (
    <div style={{ textAlign: "center", position: "relative", width: "250px" }}>

      <PieChart width={250} height={150}>
        <Pie
          data={data}
          startAngle={180}
          endAngle={0}
          innerRadius={60}
          outerRadius={80}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={COLORS[index]} />
          ))}
        </Pie>
      </PieChart>

      {/* score text */}
      <div
        style={{
          position: "absolute",
          top: "65%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "24px",
          fontWeight: "bold"
        }}
      >
        {score}
      </div>

    </div>
  );
}

export default FinancialHealthChart;