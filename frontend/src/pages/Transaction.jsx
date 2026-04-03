import React, { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import DecisionModal from "../components/DecisionModal";
import { DASHBOARD_REFRESH_EVENT } from "../constants/events";
import "../components/dashboard/DashboardLayouts.css";
import "./Subpages.css";
import { normalizeApiError } from "../utils/normalizeApiError";
import { buildDecisionSimulationModel } from "../utils/decisionSimulation";

const TransactionPage = () => {
  

  const [transactions, setTransactions] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");
  const [transactionType, setTransactionType] = useState("spend");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("monthly");
  const [keywords, setKeywords] = useState("");
  const [decisionSummary, setDecisionSummary] = useState("");
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
  const [simulationError, setSimulationError] = useState("");
  const [deletingTransactionId, setDeletingTransactionId] = useState(null);
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [editingTransactionData, setEditingTransactionData] = useState({
    store_name: "",
    cost: "",
    date: "",
    category: "Other",
  });
  const [updatingTransactionId, setUpdatingTransactionId] = useState(null);

  const buildDecisionSummary = (payload, simulationModel = null) => {
    const cadence = isRecurring ? `recurring ${recurringFrequency}` : "one-time";
    const action = transactionType === "deposit" ? "deposit" : "purchase";
    const amountLabel = `$${Math.abs(Number(payload.cost || 0)).toFixed(2)}`;
    const storeLabel = payload.store_name || "this merchant";
    const categoryLabel = payload.category || "Uncategorized";
    const detail = simulationModel?.recommendation?.headline || "Preview generated successfully.";

    return `${amountLabel} ${cadence} ${action} at ${storeLabel} in ${categoryLabel}. ${detail}`;
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
      window.dispatchEvent(new CustomEvent(DASHBOARD_REFRESH_EVENT));
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
      setDecisionSummary("");
      setSimulation(null);
      setSimulationError("");
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
    setSimulationError("");

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

      const simulationModel = buildDecisionSimulationModel({
        transactions,
        pendingTransaction: payload,
        apiSimulation: response.data,
      });

      setSimulation(simulationModel);
      setDecisionSummary(buildDecisionSummary(payload, simulationModel));
    } catch (error) {
      setSimulationError(normalizeApiError(error, "Could not simulate impact. You can still continue."));
      setDecisionSummary(buildDecisionSummary(payload));
    } finally {
      setLoadingSim(false);
    }
  };

  const filteredTransactions = useMemo(() => (
    transactions.filter((transaction) => {
      const categoryMatches = categoryFilter === "All"
        || (transaction.category || "Other") === categoryFilter;
      const monthMatches = monthFilter === "All"
        || String(transaction.date).slice(0, 7) === monthFilter;
      return categoryMatches && monthMatches;
    })
  ), [categoryFilter, monthFilter, transactions]);

  const availableCategories = useMemo(() => {
    const categories = new Set(transactions.map((transaction) => transaction.category || "Other"));
    return ["All", ...Array.from(categories).sort((a, b) => a.localeCompare(b))];
  }, [transactions]);

  const availableMonths = useMemo(() => {
    const months = new Set(
      transactions
        .map((transaction) => String(transaction.date).slice(0, 7))
        .filter((value) => /^\d{4}-\d{2}$/.test(value))
    );

    return ["All", ...Array.from(months).sort((a, b) => b.localeCompare(a))];
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
      window.dispatchEvent(new CustomEvent(DASHBOARD_REFRESH_EVENT));
    } catch (error) {
      setSubmitError(normalizeApiError(error, "Unable to delete transaction."));
    } finally {
      setDeletingTransactionId(null);
    }
  };

  const startEditingTransaction = (transaction) => {
    setSubmitError("");
    setEditingTransactionId(transaction.id);
    setEditingTransactionData({
      store_name: transaction.store_name || "",
      cost: String(Math.abs(Number(transaction.cost || 0)).toFixed(2)),
      date: String(transaction.date).slice(0, 10),
      category: transaction.category || "Other",
    });
  };

  const cancelEditingTransaction = () => {
    setEditingTransactionId(null);
    setEditingTransactionData({
      store_name: "",
      cost: "",
      date: "",
      category: "Other",
    });
  };

  const saveEditedTransaction = async (transaction) => {
    const enteredCost = Number(editingTransactionData.cost);
    const trimmedStore = editingTransactionData.store_name.trim();
    const selectedCategory = editingTransactionData.category || "Other";
    const signedCost = Number(transaction.cost) < 0 ? -Math.abs(enteredCost) : Math.abs(enteredCost);

    if (!trimmedStore || !editingTransactionData.date || !Number.isFinite(enteredCost) || enteredCost <= 0) {
      setSubmitError("Please enter a valid store, date, and amount greater than 0.");
      return;
    }

    setSubmitError("");
    setUpdatingTransactionId(transaction.id);

    try {
      await API.put(`/transaction/update/${transaction.id}`, {
        store_name: trimmedStore,
        cost: signedCost,
        date: editingTransactionData.date,
        category: selectedCategory,
      });
      await loadTransactions();
      window.dispatchEvent(new CustomEvent(DASHBOARD_REFRESH_EVENT));
      cancelEditingTransaction();
    } catch (error) {
      setSubmitError(normalizeApiError(error, "Unable to update transaction."));
    } finally {
      setUpdatingTransactionId(null);
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

            {decisionSummary && (
              <div className="subpage-metric-card">
                <h4>Decision Summary</h4>
                <p>{decisionSummary}</p>
              </div>
            )}
          </form>
        </section>

        <section className="card-surface subpage-table-panel">
          <div className="section-heading">
            <h3>Recent Transactions</h3>
          </div>

          <div className="subpage-filter-row">
            <label>Category:</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              {availableCategories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <label>Month:</label>
            <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
              {availableMonths.map((monthOption) => (
                <option key={monthOption} value={monthOption}>{monthOption}</option>
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
                const isEditing = editingTransactionId === t.id;
                const isRowBusy = deletingTransactionId === t.id || updatingTransactionId === t.id;

                return (
                  <div key={t.id} className="subpage-table-row transactions-table-row">
                    <span>
                      {isEditing ? (
                        <select
                          className="subpage-inline-input"
                          value={editingTransactionData.category}
                          onChange={(event) => (
                            setEditingTransactionData((previous) => ({
                              ...previous,
                              category: event.target.value,
                            }))
                          )}
                        >
                          <option value="Other">Other</option>
                          <option value="Groceries">Groceries</option>
                          <option value="Dining">Dining</option>
                          <option value="Transportation">Transportation</option>
                          <option value="Entertainment">Entertainment</option>
                          <option value="Utilities">Utilities</option>
                          <option value="Income">Income</option>
                          <option value="Gas">Gas</option>
                        </select>
                      ) : (
                        t.category || "Other"
                      )}
                    </span>
                    <span>
                      {isEditing ? (
                        <input
                          className="subpage-inline-input"
                          type="text"
                          value={editingTransactionData.store_name}
                          onChange={(event) => (
                            setEditingTransactionData((previous) => ({
                              ...previous,
                              store_name: event.target.value,
                            }))
                          )}
                        />
                      ) : (
                        t.store_name
                      )}
                    </span>
                    <span className={Number(t.cost) > 0 ? "tx-negative" : "tx-positive"}>
                      {isEditing ? (
                        <input
                          className="subpage-inline-input"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={editingTransactionData.cost}
                          onChange={(event) => (
                            setEditingTransactionData((previous) => ({
                              ...previous,
                              cost: event.target.value,
                            }))
                          )}
                        />
                      ) : (
                        currency(t.cost)
                      )}
                    </span>
                    <span>
                      {isEditing ? (
                        <input
                          className="subpage-inline-input"
                          type="date"
                          value={editingTransactionData.date}
                          onChange={(event) => (
                            setEditingTransactionData((previous) => ({
                              ...previous,
                              date: event.target.value,
                            }))
                          )}
                        />
                      ) : (
                        String(t.date).slice(0, 10)
                      )}
                    </span>
                    <div className="subpage-actions">
                      {isEditing ? (
                        <>
                          <button
                            className="subpage-inline-btn"
                            type="button"
                            onClick={() => saveEditedTransaction(t)}
                            disabled={isRowBusy}
                          >
                            {updatingTransactionId === t.id ? "Saving..." : "Save"}
                          </button>
                          <button
                            className="subpage-inline-btn ghost"
                            type="button"
                            onClick={cancelEditingTransaction}
                            disabled={isRowBusy}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          className="subpage-inline-btn"
                          type="button"
                          onClick={() => startEditingTransaction(t)}
                          disabled={isRowBusy}
                        >
                          Edit
                        </button>
                      )}

                      <button
                        className="subpage-inline-btn danger"
                        type="button"
                        onClick={() => deleteTransaction(t.id)}
                        disabled={isRowBusy}
                      >
                        {deletingTransactionId === t.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
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

      <DecisionModal
        open={modalOpen}
        loading={loadingSim || saving}
        error={simulationError}
        simulation={simulation}
        title={pendingTransaction?.store_name ? `Preview ${pendingTransaction.store_name}` : "Preview this decision"}
        confirmLabel={simulationError ? "Confirm Anyway" : "Confirm Action"}
        onCancel={() => {
          if (loadingSim || saving) {
            return;
          }
          setModalOpen(false);
        }}
        onAdjust={() => {
          if (loadingSim || saving) {
            return;
          }
          setModalOpen(false);
        }}
        onConfirm={async () => {
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
