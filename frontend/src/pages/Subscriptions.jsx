import { useCallback, useEffect, useState } from "react";
import SubscriptionInsightCard from "../components/insight/SubscriptionInsightCard";
import InsightCard from "../components/insight/InsightCard";
import { SubscriptionIcon } from "../components/insight/InsightIcons";
import useDemoMode from "../hooks/useDemoMode";
import API from "../services/api";
import { normalizeApiError } from "../utils/normalizeApiError";
import "../components/dashboard/DashboardLayouts.css";
import "./Subpages.css";

function Subscriptions() {
  const { currentDataset, isDemoMode } = useDemoMode();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const totalMonthly = subscriptions.reduce(
    (sum, subscription) => sum + Number(subscription.amount || 0),
    0
  );

  const loadSubscriptions = useCallback(async () => {
    if (isDemoMode) {
      setSubscriptions(currentDataset?.subscriptions || []);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await API.get("/subscription/detect");
      setSubscriptions(response.data);
    } catch (requestError) {
      setError(normalizeApiError(requestError, "Could not detect subscriptions."));
    } finally {
      setLoading(false);
    }
  }, [currentDataset, isDemoMode]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

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
            <>
              <div className="subscriptions-insight-grid">
                <SubscriptionInsightCard
                  count={subscriptions.length}
                  totalMonthly={totalMonthly}
                  description="Recurring merchants detected across your recorded transaction history."
                />
              </div>

              <div className="subscriptions-insight-grid subscriptions-insight-grid--list">
              {subscriptions.map((item, index) => (
                <InsightCard
                  key={`${item.merchant}-${index}`}
                  title={item.merchant || "Subscription"}
                  value={`$${Number(item.amount || 0).toFixed(2)}`}
                  description={`${item.frequency || "Recurring"} cadence detected`}
                  status={item.is_duplicate ? "warning" : "neutral"}
                  icon={<SubscriptionIcon />}
                >
                  <div className="insight-card__meta">
                    <div className="insight-card__meta-row">
                      <span>Frequency</span>
                      <strong>{item.frequency || "Unknown"}</strong>
                    </div>
                    <div className="insight-card__meta-row">
                      <span>Flag</span>
                      <strong>
                        {String(item.frequency).toLowerCase() === "marked"
                          ? "Marked"
                          : item.is_duplicate
                            ? "Duplicate"
                            : "Detected"}
                      </strong>
                    </div>
                  </div>
                </InsightCard>
              ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default Subscriptions;
