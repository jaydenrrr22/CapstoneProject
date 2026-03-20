import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import API from "../services/api";
import "../components/dashboard/DashboardLayouts.css";
import "./Subpages.css";

function Subscriptions() {
  const { logout } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSubscriptions = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("/subscription/detect");
      setSubscriptions(response.data);
    } catch (requestError) {
      const detail = requestError?.response?.data?.detail;
      setError(detail || "Could not detect subscriptions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  return (
    <div className="dashboard-shell desktop-shell">
      <header className="desktop-top-nav card-surface">
        <div>
          <p className="eyebrow">Financial Workspace</p>
          <h1>Subscriptions</h1>
        </div>

        <nav className="desktop-links" aria-label="Primary">
          <Link to="/dashboard">Home</Link>
          <Link to="/transactions">Transactions</Link>
          <Link to="/subscriptions">Subscriptions</Link>
          <Link to="/budgets">Budgets</Link>
        </nav>

        <button className="action-btn" onClick={() => logout()}>Logout</button>
      </header>

      <div className="subpage-single-column">
        <section className="card-surface subpage-table-panel">
          <div className="section-heading">
            <h3>Detected Recurring Charges</h3>
            <button className="subpage-inline-btn" type="button" onClick={loadSubscriptions}>
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="muted">Analyzing transactions...</p>
          ) : error ? (
            <p className="subpage-error">{error}</p>
          ) : subscriptions.length === 0 ? (
            <p className="muted">No recurring subscriptions detected yet.</p>
          ) : (
            <div className="subpage-table">
              <div className="subpage-table-head">
                <span>Merchant</span>
                <span>Amount</span>
                <span>Frequency</span>
                <span>Flag</span>
              </div>

              {subscriptions.map((item, index) => (
                <div key={`${item.merchant}-${index}`} className="subpage-table-row">
                  <span>{item.merchant}</span>
                  <span>${Number(item.amount).toFixed(2)}</span>
                  <span>{item.frequency}</span>
                  <span>{item.is_duplicate ? "Duplicate" : "Normal"}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Subscriptions;
