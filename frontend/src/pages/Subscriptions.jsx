import { useEffect, useState } from "react";
import API from "../services/api";
import "../components/dashboard/DashboardLayouts.css";
import "./Subpages.css";

function Subscriptions() {
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
            <div className="subpage-table subscriptions-table">
              <div className="subpage-table-head subscriptions-table-head">
                <span>Merchant</span>
                <span>Amount</span>
                <span>Frequency</span>
                <span>Flag</span>
              </div>

              {subscriptions.map((item, index) => (
                <div key={`${item.merchant}-${index}`} className="subpage-table-row subscriptions-table-row">
                  <span>{item.merchant}</span>
                  <span>${Number(item.amount).toFixed(2)}</span>
                  <span>{item.frequency}</span>
                  <span>{String(item.frequency).toLowerCase() === "marked" ? "Marked" : item.is_duplicate ? "Duplicate" : "Detected"}</span>
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
