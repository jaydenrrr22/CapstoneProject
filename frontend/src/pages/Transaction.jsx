import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import API from "../services/api";
import DecisionImpactModal from "../components/DecisionImpactModal";
import "../components/dashboard/DashboardLayouts.css";
import "./Subpages.css";

const TransactionPage = () => {
  const { logout } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");

  const [filter, setFilter] = useState("All");
  const [formData, setFormData] = useState({
    store_name: "",
    cost: "",
    date: new Date().toISOString().slice(0, 10),
    category: "Other",
  });

  const [pendingTransaction, setPendingTransaction] = useState(null);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [simulation, setSimulation] = useState(null);
  const [loadingSim, setLoadingSim] = useState(false);

  const loadTransactions = async () => {
    setLoadingList(true);
    setListError("");

    try {
      const response = await API.get("/transaction/get");
      const sorted = [...response.data].sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(sorted);
    } catch (error) {
      const detail = error?.response?.data?.detail;
      setListError(detail || "Could not load transactions.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const submitTransaction = async () => {
    if (!pendingTransaction) return;

    setSaving(true);
    setSubmitError("");

    try {
      await API.post("/transaction/create", pendingTransaction);
      await loadTransactions();
      setFormData({
        store_name: "",
        cost: "",
        date: new Date().toISOString().slice(0, 10),
        category: "Other",
      });
      setPendingTransaction(null);
    } catch (error) {
      const detail = error?.response?.data?.detail;
      setSubmitError(detail || "Unable to create transaction.");
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    const payload = {
      store_name: formData.store_name.trim(),
      cost: Number(formData.cost),
      date: formData.date,
      category: formData.category,
    };

    if (!payload.store_name || !payload.date || !Number.isFinite(payload.cost) || payload.cost <= 0) {
      setSubmitError("Please enter a valid store, date, and amount greater than 0.");
      return;
    }

    setPendingTransaction(payload);
    setModalOpen(true);
    setLoadingSim(true);

    try {
      const response = await API.post("/simulation/simulate_purchase", {
        amount: payload.cost,
        frequency: "monthly",
      });

      const data = response.data;
      const riskDelta = data.risk_level === "Risk" ? -12 : data.risk_level === "Moderate" ? -5 : 2;

      setSimulation({
        projectedCost: data.projected_yearly_cost,
        healthScoreChange: riskDelta,
        overlappingSubscription: null,
      });
    } catch (error) {
      const detail = error?.response?.data?.detail;
      setSubmitError(detail || "Could not simulate impact. You can still continue.");
      setSimulation({
        projectedCost: 0,
        healthScoreChange: 0,
        overlappingSubscription: null,
      });
    } finally {
      setLoadingSim(false);
    }
  };

  const filteredTransactions = useMemo(() => (
    filter === "All"
      ? transactions
      : transactions.filter((transaction) => transaction.category === filter)
  ), [filter, transactions]);

  const currency = (amount) => {
    const value = Number(amount);
    return `$${Math.abs(value).toFixed(2)}`;
  };

  return (
    <div className="dashboard-shell desktop-shell">
      <header className="desktop-top-nav card-surface">
        <div>
          <p className="eyebrow">Financial Workspace</p>
          <h1>Transactions</h1>
        </div>

        <nav className="desktop-links" aria-label="Primary">
          <Link to="/dashboard">Home</Link>
          <Link to="/transactions">Transactions</Link>
          <Link to="/subscriptions">Subscriptions</Link>
          <Link to="/budgets">Budgets</Link>
        </nav>

        <button className="action-btn" onClick={() => logout()}>Logout</button>
      </header>

      <div className="subpage-grid">
        <section className="card-surface subpage-form-panel">
          <div className="section-heading">
            <h3>Add Transaction</h3>
          </div>

          <form className="subpage-form" onSubmit={handleSubmit}>
            <label>
              Store
              <input
                type="text"
                value={formData.store_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, store_name: e.target.value }))}
                placeholder="Target"
                required
              />
            </label>

            <label>
              Amount
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.cost}
                onChange={(e) => setFormData((prev) => ({ ...prev, cost: e.target.value }))}
                placeholder="24.99"
                required
              />
            </label>

            <label>
              Date
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                required
              />
            </label>

            <label>
              Category
              <select
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
              >
                <option value="Other">Other</option>
                <option value="Groceries">Groceries</option>
                <option value="Dining">Dining</option>
                <option value="Transportation">Transportation</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Utilities">Utilities</option>
              </select>
            </label>

            {submitError && <p className="subpage-error">{submitError}</p>}

            <button className="subpage-submit" type="submit" disabled={loadingSim || saving}>
              {loadingSim ? "Simulating..." : saving ? "Saving..." : "Preview Impact"}
            </button>
          </form>
        </section>

        <section className="card-surface subpage-table-panel">
          <div className="section-heading">
            <h3>Recent Transactions</h3>
          </div>

          <div className="subpage-filter-row">
            <label>Filter:</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="All">All</option>
              <option value="Expense">Expense</option>
            </select>
          </div>

          {loadingList ? (
            <p className="muted">Loading transactions...</p>
          ) : listError ? (
            <p className="subpage-error">{listError}</p>
          ) : (
            <div className="subpage-table">
              <div className="subpage-table-head">
                <span>Type</span>
                <span>Store</span>
                <span>Amount</span>
                <span>Date</span>
              </div>

              {filteredTransactions.map((t) => {
                const txType = "Expense";
                return (
                  <div key={t.id} className="subpage-table-row">
                    <span>{txType}</span>
                    <span>{t.store_name}</span>
                    <span className="tx-negative">{currency(t.cost)}</span>
                    <span>{String(t.date).slice(0, 10)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <DecisionImpactModal
        open={modalOpen}
        loading={loadingSim || saving}
        simulation={simulation}
        onCancel={() => setModalOpen(false)}
        onConfirm={async () => {
          // Prevent duplicate submissions if already loading or saving
          if (loadingSim || saving) {
            return;
          }
          try {
            await submitTransaction();
            setModalOpen(false);
          } catch (error) {
            // Handle errors so they don't surface as unhandled promise rejections
            // and provide visible feedback to the user.
            // eslint-disable-next-line no-console
            console.error("Failed to submit transaction:", error);
            const message =
              error && typeof error.message === "string"
                ? error.message
                : "Failed to submit transaction. Please try again.";
            // Basic visible feedback without changing modal API
            window.alert(message);
          }
        }}
      />
    </div>
  );
};

export default TransactionPage;