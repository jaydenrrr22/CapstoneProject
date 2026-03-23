import React, { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import DecisionImpactModal from "../components/DecisionImpactModal";
import "../components/dashboard/DashboardLayouts.css";
import "./Subpages.css";

const TransactionPage = () => {
  const normalizeApiError = (error, fallbackMessage) => {
    const detail = error?.response?.data?.detail;

    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }

    if (Array.isArray(detail)) {
      const joined = detail
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          if (item && typeof item === "object") {
            return item.msg || item.message || JSON.stringify(item);
          }

          return "";
        })
        .filter(Boolean)
        .join(". ");

      if (joined) {
        return joined;
      }
    }

    if (detail && typeof detail === "object") {
      return detail.message || fallbackMessage;
    }

    return fallbackMessage;
  };

  const [transactions, setTransactions] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");

  const [filter, setFilter] = useState("All");
  const [transactionType, setTransactionType] = useState("spend");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("monthly");
  const [keywords, setKeywords] = useState("");
  const [aiSummary, setAiSummary] = useState("");
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
  const [deletingTransactionId, setDeletingTransactionId] = useState(null);

  const buildPurchaseSummary = (payload, simulationData = null) => {
    const keywordList = keywords
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const cadence = isRecurring ? `recurring ${recurringFrequency}` : "one-time";
    const action = transactionType === "deposit" ? "deposit" : "purchase";
    const amountLabel = `$${Math.abs(Number(payload.cost || 0)).toFixed(2)}`;
    const storeLabel = payload.store_name || "this merchant";
    const categoryLabel = payload.category || "Uncategorized";

    const usageText = simulationData
      ? `Projected budget usage moves from ${Number(simulationData.current_percentage_used || 0).toFixed(1)}% to ${Number(simulationData.projected_percentage_used || 0).toFixed(1)}%.`
      : "Budget impact preview is currently unavailable.";

    const keywordText = keywordList.length > 0
      ? ` Keywords: ${keywordList.join(", ")}.`
      : "";

    return `AI summary: ${amountLabel} ${cadence} ${action} at ${storeLabel} in ${categoryLabel}.${keywordText} ${usageText}`;
  };

  const loadTransactions = async () => {
    setLoadingList(true);
    setListError("");

    try {
      const response = await API.get("/transaction/get");
      const sorted = [...response.data].sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(sorted);
    } catch (error) {
      setListError(normalizeApiError(error, "Could not load transactions."));
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
      setTransactionType("spend");
      setIsRecurring(false);
      setRecurringFrequency("monthly");
      setKeywords("");
      setPendingTransaction(null);
    } catch (error) {
      setSubmitError(normalizeApiError(error, "Unable to create transaction."));
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    const enteredCost = Number(formData.cost);
    const normalizedCategory = transactionType === "deposit"
      ? (formData.category === "Other" ? "Income" : formData.category)
      : formData.category;

    const mappedCategory = isRecurring && transactionType === "spend"
      ? `Subscription - ${normalizedCategory}`
      : normalizedCategory;

    const signedCost = transactionType === "deposit" ? -Math.abs(enteredCost) : Math.abs(enteredCost);

    const payload = {
      store_name: formData.store_name.trim(),
      cost: signedCost,
      date: formData.date,
      category: mappedCategory,
    };

    if (!payload.store_name || !payload.date || !Number.isFinite(enteredCost) || enteredCost <= 0) {
      setSubmitError("Please enter a valid store, date, and amount greater than 0.");
      return;
    }

    setSimulation(null);
    setPendingTransaction(payload);
    setModalOpen(true);
    setLoadingSim(true);

    try {
      const response = await API.post("/simulation/simulate_purchase", {
        amount: Math.abs(payload.cost),
        category: payload.category,
        transaction_type: transactionType,
        frequency: isRecurring ? recurringFrequency : "one_time",
      });

      const data = response.data;
      const toScore = (percentageUsed) => {
        const raw = 100 - Number(percentageUsed || 0);
        return Math.max(0, Math.min(100, Math.round(raw)));
      };

      const currentScore = toScore(data.current_percentage_used);
      const projectedScore = toScore(data.projected_percentage_used);
      const riskDelta = projectedScore - currentScore;
      const summary = buildPurchaseSummary(payload, data);

      setSimulation({
        projectedCost: data.projected_yearly_cost,
        healthScoreChange: riskDelta,
        aiSummary: summary,
        overlappingSubscription: null,
      });
      setAiSummary(summary);
    } catch (error) {
      setSubmitError(normalizeApiError(error, "Could not simulate impact. You can still continue."));
      const summary = buildPurchaseSummary(payload);
      setSimulation({
        projectedCost: 0,
        healthScoreChange: 0,
        aiSummary: summary,
        overlappingSubscription: null,
      });
      setAiSummary(summary);
    } finally {
      setLoadingSim(false);
    }
  };

  const filteredTransactions = useMemo(() => (
    filter === "All"
      ? transactions
      : transactions.filter((transaction) => transaction.category === filter)
  ), [filter, transactions]);

  const availableCategories = useMemo(() => {
    const categories = new Set(transactions.map((transaction) => transaction.category || "Other"));
    return ["All", ...Array.from(categories).sort((a, b) => a.localeCompare(b))];
  }, [transactions]);

  const deleteTransaction = async (transactionId) => {
    if (!window.confirm("Delete this transaction? This action cannot be undone.")) {
      return;
    }

    setSubmitError("");
    setDeletingTransactionId(transactionId);

    try {
      await API.delete(`/transaction/delete/${transactionId}`);
      await loadTransactions();
    } catch (error) {
      setSubmitError(normalizeApiError(error, "Unable to delete transaction."));
    } finally {
      setDeletingTransactionId(null);
    }
  };

  const currency = (amount) => {
    const value = Number(amount);
    const sign = value < 0 ? "+" : "-";
    return `${sign}$${Math.abs(value).toFixed(2)}`;
  };

  return (
    <div className="dashboard-shell desktop-shell">
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
                <option value="Income">Income</option>
              </select>
            </label>

            <label>
              Type
              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
              >
                <option value="spend">Spend</option>
                <option value="deposit">Deposit</option>
              </select>
            </label>

            <label className="subpage-check-row">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
              <span>Recurring transaction</span>
            </label>

            {isRecurring && (
              <label>
                Recurrence
                <select
                  value={recurringFrequency}
                  onChange={(e) => setRecurringFrequency(e.target.value)}
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </label>
            )}

            <label>
              Keywords (comma separated)
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. grocery run, weekly essentials"
              />
            </label>

            {submitError && <p className="subpage-error">{submitError}</p>}

            <button className="subpage-submit" type="submit" disabled={loadingSim || saving}>
              {loadingSim ? "Simulating..." : saving ? "Saving..." : "Preview Impact"}
            </button>

            {aiSummary && (
              <div className="subpage-metric-card">
                <h4>AI Purchase Summary</h4>
                <p>{aiSummary}</p>
              </div>
            )}
          </form>
        </section>

        <section className="card-surface subpage-table-panel">
          <div className="section-heading">
            <h3>Recent Transactions</h3>
          </div>

          <div className="subpage-filter-row">
            <label>Filter:</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              {availableCategories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {loadingList ? (
            <p className="muted">Loading transactions...</p>
          ) : listError ? (
            <p className="subpage-error">{listError}</p>
          ) : (
            <div className="subpage-table transactions-table">
              <div className="subpage-table-head transactions-table-head">
                <span>Category</span>
                <span>Store</span>
                <span>Amount</span>
                <span>Date</span>
                <span>Actions</span>
              </div>

              {filteredTransactions.map((t) => {
                return (
                  <div key={t.id} className="subpage-table-row transactions-table-row">
                    <span>{t.category || "Other"}</span>
                    <span>{t.store_name}</span>
                    <span className={Number(t.cost) > 0 ? "tx-negative" : "tx-positive"}>{currency(t.cost)}</span>
                    <span>{String(t.date).slice(0, 10)}</span>
                    <span>
                      <button
                        className="subpage-inline-btn danger"
                        type="button"
                        onClick={() => deleteTransaction(t.id)}
                        disabled={deletingTransactionId === t.id}
                      >
                        {deletingTransactionId === t.id ? "Deleting..." : "Delete"}
                      </button>
                    </span>
                  </div>
                );
              })}

              {filteredTransactions.length === 0 && (
                <div className="subpage-table-row subpage-empty-row">
                  <span>No transactions in this category.</span>
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <DecisionImpactModal
        open={modalOpen}
        loading={loadingSim || saving}
        simulation={simulation}
        onCancel={() => {
          if (loadingSim || saving) {
            return;
          }
          setModalOpen(false);
        }}
        onConfirm={async () => {
          // Prevent duplicate submissions if already loading or saving
          if (loadingSim || saving || !pendingTransaction) {
            return;
          }
          try {
            await submitTransaction();
            setModalOpen(false);
          } catch (error) {
            setSubmitError(normalizeApiError(error, "Failed to submit transaction. Please try again."));
          }
        }}
      />
    </div>
  );
};

export default TransactionPage;