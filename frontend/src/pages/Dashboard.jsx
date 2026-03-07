import FinancialHealthChart from "../components/FinancialHealthChart";

function Dashboard() {

  const mockScore = 71; // Temporary mock score for testing

  return (
    <div>
      <h1>Dashboard</h1>

      <FinancialHealthChart score={mockScore} />

    </div>
  );
}

export default Dashboard;