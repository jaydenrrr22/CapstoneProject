import React, { useCallback, useEffect, useMemo, useState } from "react";
import API from "../services/api";
import DecisionModal from "../components/DecisionModal";
import { DASHBOARD_REFRESH_EVENT } from "../constants/events";
import "../components/dashboard/DashboardLayouts.css";
import "./Subpages.css";
import { normalizeApiError } from "../utils/normalizeApiError";
import { buildDecisionSimulationModel } from "../utils/decisionSimulation";
import { getExpenseAmount, getIncomeAmount, isIncomeAmount } from "../utils/finance";
import useDemoMode from "../hooks/useDemoMode";
import { buildDemoSimulationResponse } from "../demo/demoUtils";

const CATEGORY_OPTIONS = [
  "Other",
  "Groceries",
  "Dining",
  "Transportation",
  "Entertainment",
  "Utilities",
  "Income",
  "Gas",
];

const TRANSACTION_TYPES = [
  { value: "spend", label: "Expense", hint: "Record money going out" },
  { value: "deposit", label: "Income", hint: "Record money coming in" },
];

const TRANSACTIONS_PAGE_SIZE = 50;

function getTransactionSequenceValue(transaction, fallbackIndex = 0) {
  const numericId = Number(transaction?.id);

  if (Number.isFinite(numericId)) {
    return numericId;
  }

  const idValue = String(transaction?.id || "");
  const demoIdMatch = idValue.match(/^demo-tx-(\d+)-/);

  if (demoIdMatch) {
    return Number(demoIdMatch[1]);
  }

  return fallbackIndex;
}

const TransactionPage = () => {
  const {
    createDemoTransaction,
    currentDataset,
    deleteDemoTransaction,
    isDemoMode,
    updateDemoTransaction,
  } = useDemoMode();

  const [transactions, setTransactions] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionType, setTransactionType] = useState("spend");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("monthly");
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

  const sortTransactionsByDate = (items = []) => (
    items
      .map((item, index) => ({ item, index }))
      .sort((left, right) => {
        const dateDifference = new Date(right.item.date) - new Date(left.item.date);

        if (dateDifference !== 0) {
          return dateDifference;
        }

        const sequenceDifference = getTransactionSequenceValue(right.item, right.index)
          - getTransactionSequenceValue(left.item, left.index);

        if (sequenceDifference !== 0) {
          return sequenceDifference;
        }

        return right.index - left.index;
      })
      .map(({ item }) => item)
  );

  const buildDecisionSummary = (payload, simulationModel = null) => {
    const cadence = isRecurring ? `recurring ${recurringFrequency}` : "one-time";
    const action = transactionType === "deposit" ? "deposit" : "purchase";
    const amountLabel = `$${Math.abs(Number(payload.cost || 0)).toFixed(2)}`;
    const storeLabel = payload.store_name || "this merchant";
    const categoryLabel = payload.category || "Uncategorized";
    const detail = simulationModel?.recommendation?.headline || "Preview generated successfully.";

    return `${amountLabel} ${cadence} ${action} at ${storeLabel} in ${categoryLabel}. ${detail}`;
  };

  const loadTransactions = useCallback(async ({ preserveLoadingState = false } = {}) => {
    if (!preserveLoadingState) {
      setLoadingList(true);
    }
    setListError("");

    if (isDemoMode) {
      setTransactions(sortTransactionsByDate(currentDataset?.transactions || []));
      setCurrentPage(1);
      setLoadingList(false);
      return;
    }

    try {
      const response = await API.get("/transaction/get", {
        params: {
          page: 1,
          page_size: 5000,
        },
      });
      setTransactions(sortTransactionsByDate(response.data || []));
      setCurrentPage(1);
    } catch (error) {
      setListError(normalizeApiError(error, "Could not load transactions."));
    } finally {
      setLoadingList(false);
    }
  }, [currentDataset, isDemoMode]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    const refreshTransactions = () => {
      loadTransactions({ preserveLoadingState: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshTransactions();
      }
    };

    window.addEventListener("focus", refreshTransactions);
    window.addEventListener(DASHBOARD_REFRESH_EVENT, refreshTransactions);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", refreshTransactions);
      window.removeEventListener(DASHBOARD_REFRESH_EVENT, refreshTransactions);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadTransactions]);

  const submitTransaction = async () => {
    if (!pendingTransaction) return;

    setSaving(true);
    setSubmitError("");

    try {
      if (isDemoMode) {
        const nextTransactions = createDemoTransaction(pendingTransaction);
        setTransactions(sortTransactionsByDate(nextTransactions));
      } else {
        await API.post("/transaction/create", pendingTransaction);
        await loadTransactions();

        if (simulation?.rawAnalysis) {
          try {
            await API.post("/prediction/history", {
              ...simulation.rawAnalysis,
              source: "decision.modal.confirmed",
            });
          } catch (historyError) {
            console.warn("Could not persist intelligence history", historyError);
          }
        }
      }

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

  const closePreview = ({ clearSummary = false } = {}) => {
    setModalOpen(false);
    setPendingTransaction(null);
    setSimulation(null);
    setSimulationError("");

    if (clearSummary) {
      setDecisionSummary("");
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

    const signedCost = transactionType === "deposit" ? Math.abs(enteredCost) : -Math.abs(enteredCost);

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
      const analysisPayload = {
        amount: Math.abs(payload.cost),
        action_date: payload.date,
        category: payload.category,
        merchant: payload.store_name,
        transaction_type: transactionType,
        frequency: isRecurring ? recurringFrequency : "one_time",
        save_to_history: false,
      };
      const responseData = isDemoMode
        ? buildDemoSimulationResponse({
          budgets: currentDataset?.budget || [],
          transactions,
          actionDate: payload.date,
          amount: analysisPayload.amount,
          merchant: payload.store_name,
          category: payload.category,
          transactionType,
          frequency: analysisPayload.frequency,
        })
        : (await API.post("/intelligence/analyze", analysisPayload)).data;

      const simulationModel = buildDecisionSimulationModel({
        transactions,
        pendingTransaction: payload,
        apiSimulation: responseData,
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

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredTransactions.length / TRANSACTIONS_PAGE_SIZE)),
    [filteredTransactions.length]
  );

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * TRANSACTIONS_PAGE_SIZE;
    return filteredTransactions.slice(startIndex, startIndex + TRANSACTIONS_PAGE_SIZE);
  }, [currentPage, filteredTransactions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, monthFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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

  const ledgerSummary = useMemo(() => {
    return filteredTransactions.reduce((summary, transaction) => {
      const amount = Number(transaction.cost || 0);

      summary.inflow += getIncomeAmount(amount);
      summary.outflow += getExpenseAmount(amount);

      summary.count += 1;
      return summary;
    }, {
      count: 0,
      inflow: 0,
      outflow: 0,
    });
  }, [filteredTransactions]);

  const deleteTransaction = async (transactionId) => {
    if (!window.confirm("Delete this transaction? This action cannot be undone.")) {
      return;
    }

    setSubmitError("");
    setDeletingTransactionId(transactionId);

    try {
      if (isDemoMode) {
        const nextTransactions = deleteDemoTransaction(transactionId);
        setTransactions(sortTransactionsByDate(nextTransactions));
      } else {
        await API.delete(`/transaction/delete/${transactionId}`);
        await loadTransactions();
      }

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
    const signedCost = isIncomeAmount(transaction.cost) ? Math.abs(enteredCost) : -Math.abs(enteredCost);

    if (!trimmedStore || !editingTransactionData.date || !Number.isFinite(enteredCost) || enteredCost <= 0) {
      setSubmitError("Please enter a valid store, date, and amount greater than 0.");
      return;
    }

    setSubmitError("");
    setUpdatingTransactionId(transaction.id);

    try {
      if (isDemoMode) {
        const nextTransactions = updateDemoTransaction(transaction.id, {
          store_name: trimmedStore,
          cost: signedCost,
          date: editingTransactionData.date,
          category: selectedCategory,
        });
        setTransactions(sortTransactionsByDate(nextTransactions));
      } else {
        await API.put(`/transaction/update/${transaction.id}`, {
          store_name: trimmedStore,
          cost: signedCost,
          date: editingTransactionData.date,
          category: selectedCategory,
        });
        await loadTransactions();
      }

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
    const sign = value > 0 ? "+" : "-";
    return `${sign}$${Math.abs(value).toFixed(2)}`;
  };

  const formatLedgerDate = (value) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value).slice(0, 10);
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="dashboard-shell desktop-shell">
      <div className="subpage-grid">
        <section className="card-surface subpage-form-panel transaction-entry-panel" data-demo-tour="simulation-tools">
          <div className="section-heading">
            <div>
              <h3>Add Transaction</h3>
              <p className="muted transaction-entry-copy">
                Capture a new expense or deposit in a few fields, then preview the impact before saving.
              </p>
            </div>
          </div>

          <form className="subpage-form" onSubmit={handleSubmit}>
            <div className="transaction-entry-group">
              <span className="transaction-entry-group__label">Transaction type</span>
              <div className="transaction-type-toggle" role="radiogroup" aria-label="Transaction type">
                {TRANSACTION_TYPES.map((typeOption) => (
                  <button
                    key={typeOption.value}
                    type="button"
                    className={`transaction-type-toggle__button ${transactionType === typeOption.value ? "active" : ""}`}
                    onClick={() => setTransactionType(typeOption.value)}
                    aria-pressed={transactionType === typeOption.value}
                  >
                    <strong>{typeOption.label}</strong>
                    <span>{typeOption.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="transaction-entry-group transaction-entry-group--surface">
              <label>
                Merchant or source
                <input
                  type="text"
                  value={formData.store_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, store_name: e.target.value }))}
                  placeholder={transactionType === "deposit" ? "Paycheck" : "Target"}
                  required
                />
              </label>

              <div className="transaction-entry-row">
                <label className="transaction-entry-field transaction-entry-field--amount">
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

                <label className="transaction-entry-field">
                  Date
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </label>
              </div>

              <label>
                Category
                <select
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="transaction-entry-advanced">
              <span className="transaction-entry-group__label">Advanced options</span>
              <label className="subpage-check-row transaction-entry-check">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                />
                <span>Mark as recurring</span>
              </label>

              {isRecurring ? (
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
              ) : null}
            </div>

            {submitError && <p className="subpage-error">{submitError}</p>}

            <button className="subpage-submit" type="submit" disabled={loadingSim || saving}>
              {loadingSim ? "Preparing preview..." : saving ? "Saving..." : "Preview Before Saving"}
            </button>

            {decisionSummary && (
              <div className="subpage-metric-card transaction-entry-summary">
                <h4>Last Preview</h4>
                <p>{decisionSummary}</p>
              </div>
            )}
          </form>
        </section>

        <section className="card-surface subpage-table-panel transaction-ledger-panel" data-demo-tour="transactions-ledger">
          <div className="section-heading">
            <div>
              <h3>Transaction Ledger</h3>
              <p className="muted transaction-entry-copy">
                Newest entries appear first. Transactions from the same day stay ordered by entry sequence.
              </p>
            </div>
          </div>

          <div className="transaction-ledger-summary" aria-label="Ledger summary">
            <div className="transaction-ledger-summary__card">
              <span>Visible entries</span>
              <strong>{ledgerSummary.count}</strong>
            </div>
            <div className="transaction-ledger-summary__card">
              <span>Money in</span>
              <strong className="tx-positive">+${ledgerSummary.inflow.toFixed(2)}</strong>
            </div>
            <div className="transaction-ledger-summary__card">
              <span>Money out</span>
              <strong className="tx-negative">-${ledgerSummary.outflow.toFixed(2)}</strong>
            </div>
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
                <span>Date</span>
                <span>Store</span>
                <span>Category</span>
                <span>Amount</span>
                <span>Actions</span>
              </div>

              {paginatedTransactions.map((t) => {
                const isEditing = editingTransactionId === t.id;
                const isRowBusy = deletingTransactionId === t.id || updatingTransactionId === t.id;

                return (
                  <div key={t.id} className="subpage-table-row transactions-table-row">
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
                        <div className="transaction-ledger-date">
                          <strong>{formatLedgerDate(t.date)}</strong>
                        </div>
                      )}
                    </span>
                    <span className="transaction-ledger-merchant">
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
                          {CATEGORY_OPTIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        t.category || "Other"
                      )}
                    </span>
                    <span className={isIncomeAmount(t.cost) ? "tx-positive" : "tx-negative"}>
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
                  <span>No transactions match these filters.</span>
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              )}
            </div>
          )}

          {!loadingList && !listError && filteredTransactions.length > 0 && (
            <div className="subpage-filter-row">
              <label>Page:</label>
              <button
                className="subpage-inline-btn"
                type="button"
                onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
                disabled={currentPage <= 1}
              >
                Previous
              </button>
              <span>{currentPage} / {totalPages}</span>
              <button
                className="subpage-inline-btn"
                type="button"
                onClick={() => setCurrentPage((previous) => Math.min(totalPages, previous + 1))}
                disabled={currentPage >= totalPages}
              >
                Next
              </button>
            </div>
          )}
        </section>
      </div>

      <DecisionModal
        open={modalOpen}
        loading={loadingSim}
        busy={saving}
        busyLabel="Saving transaction..."
        error={simulationError}
        simulation={simulation}
        title={pendingTransaction?.store_name ? `Preview ${pendingTransaction.store_name}` : "Preview this decision"}
        confirmLabel={simulationError ? "Save Anyway" : "Save Transaction"}
        cancelLabel="Close Preview"
        adjustLabel="Edit Details"
        onCancel={() => {
          if (loadingSim || saving) {
            return;
          }
          closePreview({ clearSummary: true });
        }}
        onAdjust={() => {
          if (loadingSim || saving) {
            return;
          }
          closePreview({ clearSummary: true });
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
