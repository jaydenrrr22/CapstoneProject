import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppBreadcrumbs from "../components/AppBreadcrumbs";
import useDemoMode from "../hooks/useDemoMode";
import API from "../services/api";
import { normalizeApiError } from "../utils/normalizeApiError";
import { detectDemoSubscriptions } from "../demo/demoUtils";
import {
  buildSubscriptionSpyReports,
  buildSubscriptionSpySummary,
  filterSubscriptionSpyReports,
  SUBSCRIPTION_SPY_FILTERS,
} from "../utils/subscriptionSpy";
import "../components/dashboard/DashboardLayouts.css";
import "./Subpages.css";

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function Subscriptions() {
  const { currentDataset, isDemoMode } = useDemoMode();
  const [subscriptions, setSubscriptions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    setError("");

    if (isDemoMode) {
      const demoTransactions = currentDataset?.transactions || [];
      setTransactions(demoTransactions);
      setSubscriptions(detectDemoSubscriptions(demoTransactions));
      setLoading(false);
      return;
    }

    try {
      const [subscriptionResponse, transactionResponse] = await Promise.all([
        API.get("/subscription/detect"),
        API.get("/transaction/get", {
          params: {
            page: 1,
            page_size: 5000,
          },
        }),
      ]);

      setSubscriptions(subscriptionResponse.data || []);
      setTransactions(transactionResponse.data || []);
    } catch (requestError) {
      setError(normalizeApiError(requestError, "Could not build Subscription Spy."));
    } finally {
      setLoading(false);
    }
  }, [currentDataset, isDemoMode]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const spyReports = useMemo(
    () => buildSubscriptionSpyReports({ subscriptions, transactions }),
    [subscriptions, transactions]
  );
  const spySummary = useMemo(
    () => buildSubscriptionSpySummary(spyReports),
    [spyReports]
  );
  const filteredReports = useMemo(
    () => filterSubscriptionSpyReports(spyReports, activeFilter),
    [activeFilter, spyReports]
  );
  const filterCounts = useMemo(() => (
    SUBSCRIPTION_SPY_FILTERS.reduce((accumulator, filter) => {
      accumulator[filter.id] = filterSubscriptionSpyReports(spyReports, filter.id).length;
      return accumulator;
    }, {})
  ), [spyReports]);

  return (
    <div className="dashboard-shell desktop-shell">
      <AppBreadcrumbs />

      <div className="subpage-single-column">
        <section className="card-surface subpage-table-panel subscriptions-page-panel">
          <div className="section-heading">
            <div>
              <h3>Subscription Spy</h3>
              <p className="muted transaction-entry-copy">
                Trace scans recurring charges, estimates what they cost over a year, flags urgent cleanup,
                and tells you where to look if you want to cancel.
              </p>
            </div>

            <div className="subscriptions-page-actions">
              <Link className="subpage-inline-btn ghost" to="/transactions">
                Open Ledger
              </Link>
              <button className="subpage-inline-btn" type="button" onClick={loadSubscriptions}>
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <p className="muted">Analyzing recurring charges...</p>
          ) : error ? (
            <p className="subpage-error">{error}</p>
          ) : spyReports.length === 0 ? (
            <p className="muted">No recurring subscriptions detected yet.</p>
          ) : (
            <>
              <div className="subscriptions-summary-grid" aria-label="Subscription Spy summary">
                <div className="subscriptions-summary-card">
                  <span>Subscriptions found</span>
                  <strong>{spySummary.count}</strong>
                </div>
                <div className="subscriptions-summary-card">
                  <span>Monthly spend</span>
                  <strong>{formatCurrency(spySummary.monthlyTotal)}</strong>
                </div>
                <div className="subscriptions-summary-card">
                  <span>Estimated annual cost</span>
                  <strong>{formatCurrency(spySummary.annualTotal)}</strong>
                </div>
                <div className="subscriptions-summary-card">
                  <span>Review now</span>
                  <strong>{spySummary.priorityCount}</strong>
                </div>
              </div>

              <div className="subscription-spy-filter-row" aria-label="Subscription Spy filters">
                {SUBSCRIPTION_SPY_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    className={`subscription-spy-filter${activeFilter === filter.id ? " is-active" : ""}`}
                    onClick={() => setActiveFilter(filter.id)}
                  >
                    <strong>{filter.label}</strong>
                    <span>{filterCounts[filter.id] || 0}</span>
                  </button>
                ))}
              </div>

              {filteredReports.length === 0 ? (
                <p className="muted">No subscriptions match this filter.</p>
              ) : (
                <div className="subscription-spy-list" role="list" aria-label="Subscription Spy reports">
                  {filteredReports.map((report) => (
                    <article
                      key={report.id}
                      className={`subscription-spy-card is-${report.statusTone}`}
                      role="listitem"
                    >
                      <div className="subscription-spy-card__header">
                        <div>
                          <p className="subscription-spy-card__eyebrow">{report.useCase.label}</p>
                          <h4>{report.merchant}</h4>
                          <p>{report.recommendation.headline}</p>
                        </div>

                        <div className="subscription-spy-card__amounts">
                          <strong>{formatCurrency(report.amount)}</strong>
                          <span>{formatCurrency(report.annualCost)} estimated / year</span>
                        </div>
                      </div>

                      <div className="subscription-spy-card__facts">
                        <span>Frequency: {report.frequencyLabel}</span>
                        <span>Flag: {report.flagLabel}</span>
                        <span>Last charge: {report.lastChargeDateLabel}</span>
                        <span>Next likely bill: {report.nextChargeDateLabel}</span>
                        <span>Matched charges: {report.matchedChargeCount}</span>
                      </div>

                      <div className="subscription-spy-card__body">
                        <div className="subscription-spy-card__note">
                          <span className="subscription-spy-card__label">Use case</span>
                          <p>{report.useCase.detail}</p>
                        </div>

                        <div className="subscription-spy-card__guidance-grid">
                          <div className="subscription-spy-card__guidance">
                            <span>Where to cancel</span>
                            <strong>{report.guide.provider}</strong>
                            <p>{report.guide.cancelPath}</p>
                          </div>

                          <div className="subscription-spy-card__guidance">
                            <span>Watch for</span>
                            <p>{report.guide.watchout}</p>
                          </div>
                        </div>

                        {report.recentCharges.length > 0 ? (
                          <div className="subscription-spy-card__charges">
                            <span className="subscription-spy-card__label">Recent matching charges</span>
                            <div className="subscription-spy-card__charge-list">
                              {report.recentCharges.map((charge) => (
                                <span key={charge.id}>
                                  {charge.dateLabel} - {formatCurrency(charge.amount)}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default Subscriptions;

