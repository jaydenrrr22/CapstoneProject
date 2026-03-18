import { useEffect, useState } from "react";
import FinancialHealthChart from "../components/FinancialHealthChart";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import "./Dashboard.css";

function Dashboard() {
  const { logout } = useAuth();

  // TODO (Launch):
  // Replace automatic current-month period with user-selected period (dropdown or date picker).
  // Also handle cases where no budget exists for the current month (fallback or prompt user to create one).

  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  const mockTransactions = [
    { id: 1, name: "Groceries", amount: -150 },
    { id: 2, name: "Salary", amount: 2000 },
    { id: 3, name: "Utilities", amount: -120 },
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");

    const today = new Date();
    const period = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

    fetch(`http://127.0.0.1:8000/analytics/financial-health/${period}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch financial health");
        }
        return res.json();
      })
      .then((data) => {
        setScore(data.score);
      })
      .catch((error) => {
        console.error("Financial health fetch error:", error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-inner">

        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <button className="notification-btn" onClick={() => logout()}>
            Logout
          </button>
        </div>

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

        <div className="chart-wrapper card">
          {loading ? <p>Loading...</p> : <FinancialHealthChart score={score} />}
        </div>

        <div className="transactions-section card">
          <h3>Recent Transactions</h3>
          {mockTransactions.map(tx => (
            <div key={tx.id} className="transaction-item">
              <span>{tx.name}</span>
              <span className={tx.amount < 0 ? "expense" : "income"}>
                ${Math.abs(tx.amount).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <nav className="bottom-nav">
          <Link to="/dashboard">Home</Link>
          <Link to="/transactions">Transactions</Link>
          <Link to="/subscriptions">Subscriptions</Link>
          <Link to="/budgets">Budgets</Link>
          <button onClick={() => logout()}>Sign Out</button>
        </nav>

      </div>
    </div>
  );
}

export default Dashboard;