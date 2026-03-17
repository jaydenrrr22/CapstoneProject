import FinancialHealthChart from "../components/FinancialHealthChart";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import "./Dashboard.css";

function Dashboard() {
  const { logout } = useAuth();

  const mockScore = 71; // Temporary mock score for testing

  const mockTransactions = [
    { id: 1, name: "Groceries", amount: -150 },
    { id: 2, name: "Salary", amount: 2000 },
    { id: 3, name: "Utilities", amount: -120 },
  ];

  return (
    <div className="dashboard-container">

      {/* Inner container constrained to 320px */}
      <div className="dashboard-inner">

        {/* Header */}
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <button className="notification-btn" onClick={() => logout()}>
            Logout
          </button>
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
          <FinancialHealthChart score={mockScore} />
        </div>

        {/* Transactions */}
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

        {/* Bottom Navigation — now part of inner container */}
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