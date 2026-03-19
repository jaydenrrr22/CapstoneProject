import { useEffect, useState } from "react";
import apiClient from "../api/client";
import FinancialHealthChart from "../components/FinancialHealthChart";
import "./Dashboard.css";

function Dashboard() {

  // TODO (Launch):
  // Replace automatic current-month period with user-selected period (dropdown or date picker).
  // Also handle cases where no budget exists for the current month.

  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  // Temporary mock data (replace with real API later)
  const mockTransactions = [
    { id: 1, name: "Groceries", amount: -150 },
    { id: 2, name: "Salary", amount: 2000 },
    { id: 3, name: "Utilities", amount: -120 },
  ];

  useEffect(() => {
    const today = new Date();

    // Format period as YYYY-MM 
    const period = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}`;

    // Use centralized API client (handles token automatically)
    apiClient
      .get(`/analytics/financial-health/${period}`)
      .then((res) => {
        setScore(res.data.score);
      })
      .catch((error) => {
        console.error(
          "Financial health fetch error:",
          error.message
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-inner">

        {/* Header */}
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <button className="notification-btn">Notifications</button>
        </div>

        {/* Budget Summary */}
        <div className="budget-summary">
          <div className="budget-card">
            <p>Total Budget</p>
            <h2>$5000</h2>
          </div>
          <div className="budget-card">
            <p>Upcoming Expenses</p>
            <h2>$1200</h2>
          </div>
        </div>

        {/* Financial Health Chart */}
        <div className="chart-wrapper card">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <FinancialHealthChart score={score} />
          )}
        </div>

        {/* Transactions (mock for now) */}
        <div className="transactions-section card">
          <h3>Recent Transactions</h3>
          {mockTransactions.map((tx) => (
            <div key={tx.id} className="transaction-item">
              <span>{tx.name}</span>
              <span className={tx.amount < 0 ? "expense" : "income"}>
                ${Math.abs(tx.amount).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom Navigation */}
        <nav className="bottom-nav">
          <button>Home</button>
          <button>Transactions</button>
          <button>Subscriptions</button>
          <button>Recommendations</button>
          <button>About Us</button>
        </nav>

      </div>
    </div>
  );
}

export default Dashboard;