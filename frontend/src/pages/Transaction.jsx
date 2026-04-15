import React, { useCallback, useEffect, useMemo, useState } from "react";
import API from "../services/api";
import AppBreadcrumbs from "../components/AppBreadcrumbs";
import DecisionModal from "../components/DecisionModal";
import TransactionEntryForm from "../components/transaction/TransactionEntryForm";
import { DASHBOARD_REFRESH_EVENT } from "../constants/events";
import "../components/dashboard/DashboardLayouts.css";
import "./Subpages.css";
import { normalizeApiError } from "../utils/normalizeApiError";
import { getExpenseAmount, getIncomeAmount, isIncomeAmount } from "../utils/finance";
import { toDate } from "../utils/forecastUtils";
import useDemoMode from "../hooks/useDemoMode";
import useTransactionEntry, {
  CATEGORY_OPTIONS,
  sortTransactionsByDate,
} from "../hooks/useTransactionEntry";

const TRANSACTIONS_PAGE_SIZE = 50;

const TransactionPage = () => {
  const {
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
  const [deletingTransactionId, setDeletingTransactionId] = useState(null);
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [editingTransactionData, setEditingTransactionData] = useState({
    store_name: "",
    cost: "",
    date: "",
    category: "Other",
  });
  const [updatingTransactionId, setUpdatingTransactionId] = useState(null);

  const loadTransactions = useCallback(async ({ preserveLoadingState = false } = {}) => {
    if (!preserveLoadingState) {
      setLoadingList(true);
    }
    setListError("");

    if (isDemoMode) {
      const nextTransactions = sortTransactionsByDate(currentDataset?.transactions || []);
      setTransactions(nextTransactions);
      setCurrentPage(1);
      setLoadingList(false);
      return nextTransactions;
    }

    try {
      const response = await API.get("/transaction/get", {
        params: {
          page: 1,
          page_size: 5000,
        },
      });
      const nextTransactions = sortTransactionsByDate(response.data || []);
      setTransactions(nextTransactions);
      setCurrentPage(1);
      return nextTransactions;
    } catch (error) {
      setListError(normalizeApiError(error, "Could not load transactions."));
      return [];
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

  const transactionEntry = useTransactionEntry({
    active: true,
    transactions,
    loadTransactions,
    onTransactionsChange: setTransactions,
  });

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

  const editCategoryOptions = useMemo(() => {
    const categories = new Set([
      ...CATEGORY_OPTIONS,
      ...transactions.map((transaction) => transaction.category || "Other"),
    ]);
    return Array.from(categories).sort((a, b) => a.localeCompare(b));
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

    transactionEntry.setSubmitError("");
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
      transactionEntry.setSubmitError(normalizeApiError(error, "Unable to delete transaction."));
    } finally {
      setDeletingTransactionId(null);
    }
  };

  const startEditingTransaction = (transaction) => {
    transactionEntry.setSubmitError("");
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
      transactionEntry.setSubmitError("Please enter a valid store, date, and amount greater than 0.");
      return;
    }

    transactionEntry.setSubmitError("");
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
      transactionEntry.setSubmitError(normalizeApiError(error, "Unable to update transaction."));
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
    const date = toDate(value);

    if (!date) {
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
      <AppBreadcrumbs />

      <div className="subpage-grid">
        <section className="subpage-form-panel transaction-entry-panel" data-demo-tour="simulation-tools">
          <TransactionEntryForm
            controller={transactionEntry}
            onPreview={transactionEntry.handlePreview}
            onSubmit={transactionEntry.handleSave}
            title="Add transaction"
            description="Capture an expense or income quickly, or open the same form from the floating action button anywhere in Trace."
            variant="page"
          />
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
                          {editCategoryOptions.map((option) => (
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
        open={transactionEntry.previewOpen}
        loading={transactionEntry.loadingPreview}
        busy={transactionEntry.saving}
        busyLabel="Saving transaction..."
        error={transactionEntry.simulationError}
        simulation={transactionEntry.simulation}
        title={transactionEntry.pendingTransaction?.store_name ? `Preview ${transactionEntry.pendingTransaction.store_name}` : "Preview this decision"}
        confirmLabel={transactionEntry.simulationError ? "Save Anyway" : "Save Transaction"}
        cancelLabel="Close Preview"
        adjustLabel="Edit Details"
        onCancel={() => {
          if (transactionEntry.loadingPreview || transactionEntry.saving) {
            return;
          }
          transactionEntry.closePreview({ clearSummary: true });
        }}
        onAdjust={() => {
          if (transactionEntry.loadingPreview || transactionEntry.saving) {
            return;
          }
          transactionEntry.closePreview({ clearSummary: true });
        }}
        onConfirm={async () => {
          if (transactionEntry.loadingPreview || transactionEntry.saving || !transactionEntry.pendingTransaction) {
            return;
          }
          try {
            await transactionEntry.confirmPreviewSave();
          } catch (error) {
            transactionEntry.setSubmitError(normalizeApiError(error, "Failed to submit transaction. Please try again."));
          }
        }}
      />
    </div>
  );
};

export default TransactionPage;

