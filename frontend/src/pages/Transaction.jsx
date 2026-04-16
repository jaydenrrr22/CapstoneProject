import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  getTransactionSequenceValue,
  sortTransactionsByDate,
} from "../hooks/useTransactionEntry";

const TRANSACTIONS_PAGE_SIZE = 50;
const DEFAULT_SORT = {
  direction: "desc",
  key: "date",
};

function escapeCsvValue(value) {
  const stringValue = String(value ?? "");
  const safeValue = /^[=+\-@]/.test(stringValue) ? `'${stringValue}` : stringValue;

  if (/[",\n]/.test(safeValue)) {
    return `"${safeValue.replace(/"/g, "\"\"")}"`;
  }

  return safeValue;
}

function triggerCsvDownload(filename, content) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(objectUrl);
}

function formatSignedCurrency(amount) {
  const value = Number(amount || 0);
  const formattedAmount = Math.abs(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  if (value > 0) {
    return `+${formattedAmount}`;
  }

  if (value < 0) {
    return `\u2212${formattedAmount}`;
  }

  return formattedAmount;
}

function formatUnsignedCurrency(amount, { forceNegative = false, forcePositive = false } = {}) {
  const value = Math.abs(Number(amount || 0));
  const formattedAmount = value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  if (forcePositive) {
    return `+${formattedAmount}`;
  }

  if (forceNegative) {
    return `\u2212${formattedAmount}`;
  }

  return formattedAmount;
}

function compareTransactions(left, right, sortConfig, leftIndex, rightIndex) {
  if (sortConfig.key === "date") {
    const leftDate = toDate(left.date);
    const rightDate = toDate(right.date);
    const dateDifference = (leftDate?.getTime() || 0) - (rightDate?.getTime() || 0);

    if (dateDifference !== 0) {
      return sortConfig.direction === "asc" ? dateDifference : -dateDifference;
    }

    const sequenceDifference = getTransactionSequenceValue(left, leftIndex)
      - getTransactionSequenceValue(right, rightIndex);

    if (sequenceDifference !== 0) {
      return sortConfig.direction === "asc" ? sequenceDifference : -sequenceDifference;
    }

    return leftIndex - rightIndex;
  }

  if (sortConfig.key === "cost") {
    const amountDifference = Number(left.cost || 0) - Number(right.cost || 0);

    if (amountDifference !== 0) {
      return sortConfig.direction === "asc" ? amountDifference : -amountDifference;
    }

    return leftIndex - rightIndex;
  }

  const leftValue = String(left[sortConfig.key] || "").toLocaleLowerCase();
  const rightValue = String(right[sortConfig.key] || "").toLocaleLowerCase();
  const textDifference = leftValue.localeCompare(rightValue);

  if (textDifference !== 0) {
    return sortConfig.direction === "asc" ? textDifference : -textDifference;
  }

  return leftIndex - rightIndex;
}

const TransactionPage = () => {
  const {
    currentDataset,
    deleteDemoTransaction,
    isDemoMode,
    updateDemoTransaction,
  } = useDemoMode();

  const selectAllRef = useRef(null);

  const [transactions, setTransactions] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState(DEFAULT_SORT);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState([]);
  const [deletingTransactionId, setDeletingTransactionId] = useState(null);
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [editingTransactionData, setEditingTransactionData] = useState({
    store_name: "",
    cost: "",
    date: "",
    category: "Other",
  });
  const [updatingTransactionId, setUpdatingTransactionId] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

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

  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase();

  const filteredTransactions = useMemo(() => (
    transactions.filter((transaction) => {
      const categoryMatches = categoryFilter === "All"
        || (transaction.category || "Other") === categoryFilter;
      const monthMatches = monthFilter === "All"
        || String(transaction.date).slice(0, 7) === monthFilter;
      const searchMatches = normalizedSearchQuery.length === 0
        || String(transaction.store_name || "").toLocaleLowerCase().includes(normalizedSearchQuery);

      return categoryMatches && monthMatches && searchMatches;
    })
  ), [categoryFilter, monthFilter, normalizedSearchQuery, transactions]);

  const sortedTransactions = useMemo(() => (
    filteredTransactions
      .map((transaction, index) => ({ index, transaction }))
      .sort((left, right) => (
        compareTransactions(left.transaction, right.transaction, sortConfig, left.index, right.index)
      ))
      .map(({ transaction }) => transaction)
  ), [filteredTransactions, sortConfig]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(sortedTransactions.length / TRANSACTIONS_PAGE_SIZE)),
    [sortedTransactions.length]
  );

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * TRANSACTIONS_PAGE_SIZE;
    return sortedTransactions.slice(startIndex, startIndex + TRANSACTIONS_PAGE_SIZE);
  }, [currentPage, sortedTransactions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, monthFilter, normalizedSearchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    const visibleIds = new Set(sortedTransactions.map((transaction) => transaction.id));
    setSelectedTransactionIds((previous) => previous.filter((id) => visibleIds.has(id)));
  }, [sortedTransactions]);

  const availableCategories = useMemo(() => {
    const categories = new Set(transactions.map((transaction) => transaction.category || "Other"));
    return ["All", ...Array.from(categories).sort((left, right) => left.localeCompare(right))];
  }, [transactions]);

  const editCategoryOptions = useMemo(() => {
    const categories = new Set([
      ...CATEGORY_OPTIONS,
      ...transactions.map((transaction) => transaction.category || "Other"),
    ]);
    return Array.from(categories).sort((left, right) => left.localeCompare(right));
  }, [transactions]);

  const availableMonths = useMemo(() => {
    const months = new Set(
      transactions
        .map((transaction) => String(transaction.date).slice(0, 7))
        .filter((value) => /^\d{4}-\d{2}$/.test(value))
    );

    return ["All", ...Array.from(months).sort((left, right) => right.localeCompare(left))];
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

  const netBalance = ledgerSummary.inflow - ledgerSummary.outflow;
  const selectedTransactionSet = useMemo(
    () => new Set(selectedTransactionIds),
    [selectedTransactionIds]
  );
  const paginatedTransactionIds = useMemo(
    () => paginatedTransactions.map((transaction) => transaction.id),
    [paginatedTransactions]
  );
  const allVisibleRowsSelected = paginatedTransactionIds.length > 0
    && paginatedTransactionIds.every((transactionId) => selectedTransactionSet.has(transactionId));
  const someVisibleRowsSelected = paginatedTransactionIds.some((transactionId) => (
    selectedTransactionSet.has(transactionId)
  ));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = !allVisibleRowsSelected && someVisibleRowsSelected;
    }
  }, [allVisibleRowsSelected, someVisibleRowsSelected]);

  const clearEditingState = useCallback(() => {
    setEditingTransactionId(null);
    setEditingTransactionData({
      store_name: "",
      cost: "",
      date: "",
      category: "Other",
    });
  }, []);

  useEffect(() => {
    if (editingTransactionId === null) {
      return;
    }

    const stillExists = transactions.some((transaction) => transaction.id === editingTransactionId);

    if (!stillExists) {
      clearEditingState();
    }
  }, [clearEditingState, editingTransactionId, transactions]);

  const deleteTransaction = async (transactionId) => {
    if (!window.confirm("Delete this transaction? This action cannot be undone.")) {
      return;
    }

    transactionEntry.setSubmitError("");
    setDeletingTransactionId(transactionId);

    try {
      if (editingTransactionId === transactionId) {
        clearEditingState();
      }

      if (isDemoMode) {
        const nextTransactions = deleteDemoTransaction(transactionId);
        setTransactions(sortTransactionsByDate(nextTransactions));
      } else {
        await API.delete(`/transaction/delete/${transactionId}`);
        await loadTransactions();
      }

      setSelectedTransactionIds((previous) => previous.filter((id) => id !== transactionId));
      window.dispatchEvent(new CustomEvent(DASHBOARD_REFRESH_EVENT));
    } catch (error) {
      transactionEntry.setSubmitError(normalizeApiError(error, "Unable to delete transaction."));
    } finally {
      setDeletingTransactionId(null);
    }
  };

  const deleteSelectedTransactions = useCallback(async () => {
    if (selectedTransactionIds.length === 0) {
      return;
    }

    const itemLabel = selectedTransactionIds.length === 1 ? "transaction" : "transactions";
    const confirmed = window.confirm(
      `Delete ${selectedTransactionIds.length} selected ${itemLabel}? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    transactionEntry.setSubmitError("");
    setBulkDeleting(true);

    try {
      if (editingTransactionId !== null && selectedTransactionSet.has(editingTransactionId)) {
        clearEditingState();
      }

      if (isDemoMode) {
        let nextTransactions = currentDataset?.transactions || transactions;

        selectedTransactionIds.forEach((transactionId) => {
          nextTransactions = deleteDemoTransaction(transactionId);
        });

        setTransactions(sortTransactionsByDate(nextTransactions));
      } else {
        await Promise.all(
          selectedTransactionIds.map((transactionId) => API.delete(`/transaction/delete/${transactionId}`))
        );
        await loadTransactions();
      }

      setSelectedTransactionIds([]);
      window.dispatchEvent(new CustomEvent(DASHBOARD_REFRESH_EVENT));
    } catch (error) {
      transactionEntry.setSubmitError(normalizeApiError(error, "Unable to delete selected transactions."));
    } finally {
      setBulkDeleting(false);
    }
  }, [
    clearEditingState,
    currentDataset,
    deleteDemoTransaction,
    editingTransactionId,
    isDemoMode,
    loadTransactions,
    selectedTransactionIds,
    selectedTransactionSet,
    transactionEntry,
    transactions,
  ]);

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
    clearEditingState();
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
      clearEditingState();
    } catch (error) {
      transactionEntry.setSubmitError(normalizeApiError(error, "Unable to update transaction."));
    } finally {
      setUpdatingTransactionId(null);
    }
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

  const toggleTransactionSelection = (transactionId) => {
    setSelectedTransactionIds((previous) => {
      if (previous.includes(transactionId)) {
        return previous.filter((id) => id !== transactionId);
      }

      return [...previous, transactionId];
    });
  };

  const toggleVisibleSelection = () => {
    setSelectedTransactionIds((previous) => {
      const nextSelected = new Set(previous);

      if (allVisibleRowsSelected) {
        paginatedTransactionIds.forEach((transactionId) => nextSelected.delete(transactionId));
      } else {
        paginatedTransactionIds.forEach((transactionId) => nextSelected.add(transactionId));
      }

      return Array.from(nextSelected);
    });
  };

  const clearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleSortChange = (columnKey) => {
    setSortConfig((previous) => {
      if (previous.key === columnKey) {
        return {
          direction: previous.direction === "asc" ? "desc" : "asc",
          key: columnKey,
        };
      }

      return {
        direction: columnKey === "date" ? "desc" : "asc",
        key: columnKey,
      };
    });
  };

  const getSortIndicator = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return "";
    }

    return sortConfig.direction === "asc" ? "\u2191" : "\u2193";
  };

  const exportCsv = () => {
    const csvRows = [
      ["Date", "Store", "Category", "Amount"],
      ...sortedTransactions.map((transaction) => ([
        String(transaction.date).slice(0, 10),
        transaction.store_name || "",
        transaction.category || "Other",
        Number(transaction.cost || 0).toFixed(2),
      ])),
    ];

    const csvContent = csvRows
      .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
      .join("\n");

    triggerCsvDownload("transactions-export.csv", csvContent);
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
            description="Capture an expense or income, run a prediction before saving, or skip the prediction when you need a quick entry."
            variant="page"
          />
        </section>

        <section className="card-surface subpage-table-panel transaction-ledger-panel" data-demo-tour="transactions-ledger">
          <div className="section-heading transaction-ledger-heading">
            <div>
              <h3>Transaction Ledger</h3>
              <p className="muted transaction-entry-copy">
                Search, sort, edit, export, and manage the entries currently in view.
              </p>
            </div>

            <button
              className="subpage-inline-btn transaction-ledger-export"
              type="button"
              onClick={exportCsv}
              disabled={loadingList || sortedTransactions.length === 0}
            >
              Export CSV
            </button>
          </div>

          <div className="transaction-ledger-summary" aria-label="Ledger summary">
            <div className="transaction-ledger-summary__card">
              <span>Visible entries</span>
              <strong>{ledgerSummary.count}</strong>
            </div>
            <div className="transaction-ledger-summary__card">
              <span>Money in</span>
              <strong className="tx-positive">{formatUnsignedCurrency(ledgerSummary.inflow, { forcePositive: true })}</strong>
            </div>
            <div className="transaction-ledger-summary__card">
              <span>Money out</span>
              <strong className="tx-negative">{formatUnsignedCurrency(ledgerSummary.outflow, { forceNegative: true })}</strong>
            </div>
            <div className="transaction-ledger-summary__card">
              <span>Net balance</span>
              <strong className={netBalance >= 0 ? "tx-positive" : "tx-negative"}>
                {formatSignedCurrency(netBalance)}
              </strong>
            </div>
          </div>

          <div className="subpage-filter-row transaction-ledger-toolbar">
            {selectedTransactionIds.length > 0 ? (
              <div className="transaction-ledger-toolbar__primary">
                <button
                  className="subpage-inline-btn danger transaction-ledger-bulk-delete"
                  type="button"
                  onClick={deleteSelectedTransactions}
                  disabled={bulkDeleting}
                >
                  {bulkDeleting
                    ? "Deleting selected..."
                    : `Delete selected (${selectedTransactionIds.length})`}
                </button>
              </div>
            ) : (
              <div className="transaction-ledger-search">
                <span>Search</span>
                <div className="transaction-ledger-search__shell">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search by merchant"
                    aria-label="Search by merchant"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      className="transaction-ledger-search__clear"
                      onClick={clearSearch}
                      aria-label="Clear merchant search"
                    >
                      {"\u00D7"}
                    </button>
                  ) : null}
                </div>
              </div>
            )}

            <label className="transaction-ledger-filter">
              <span>Category</span>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                {availableCategories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>

            <label className="transaction-ledger-filter">
              <span>Month</span>
              <select value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)}>
                {availableMonths.map((monthOption) => (
                  <option key={monthOption} value={monthOption}>{monthOption}</option>
                ))}
              </select>
            </label>
          </div>

          {loadingList ? (
            <p className="muted">Loading transactions...</p>
          ) : listError ? (
            <p className="subpage-error">{listError}</p>
          ) : (
            <div className="subpage-table transactions-table">
              <div className="subpage-table-head transactions-table-head">
                <span className="transactions-table__cell transactions-table__cell--checkbox">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allVisibleRowsSelected}
                    onChange={toggleVisibleSelection}
                    aria-label="Select all visible transactions"
                  />
                </span>

                {[
                  { key: "date", label: "Date" },
                  { key: "store_name", label: "Store" },
                  { key: "category", label: "Category" },
                  { key: "cost", label: "Amount", className: "transactions-table__sort--amount" },
                ].map((column) => (
                  <button
                    key={column.key}
                    type="button"
                    className={`transactions-table__sort${column.className ? ` ${column.className}` : ""}`}
                    onClick={() => handleSortChange(column.key)}
                  >
                    <span>{column.label}</span>
                    <span className="transactions-table__sort-indicator">{getSortIndicator(column.key)}</span>
                  </button>
                ))}

                <span className="transactions-table__actions-header">Actions</span>
              </div>

              {paginatedTransactions.map((transaction, index) => {
                const isEditing = editingTransactionId === transaction.id;
                const isRowBusy = bulkDeleting
                  || deletingTransactionId === transaction.id
                  || updatingTransactionId === transaction.id;
                const isSelected = selectedTransactionSet.has(transaction.id);

                return (
                  <React.Fragment key={transaction.id}>
                    <div
                      className={`subpage-table-row transactions-table-row${isEditing ? " is-editing" : ""}${index % 2 === 1 ? " is-alt" : ""}`}
                    >
                      <span className="transactions-table__cell transactions-table__cell--checkbox">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleTransactionSelection(transaction.id)}
                          disabled={isRowBusy}
                          aria-label={`Select ${transaction.store_name || "transaction"}`}
                        />
                      </span>

                      <span className="transactions-table__cell">
                        <div className="transaction-ledger-date">
                          <strong>{formatLedgerDate(transaction.date)}</strong>
                        </div>
                      </span>

                      <span className="transactions-table__cell transaction-ledger-merchant">
                        {transaction.store_name}
                      </span>

                      <span className="transactions-table__cell">
                        {transaction.category || "Other"}
                      </span>

                      <span className={`transactions-table__cell transactions-table__cell--amount ${isIncomeAmount(transaction.cost) ? "tx-positive" : "tx-negative"}`}>
                        {formatSignedCurrency(transaction.cost)}
                      </span>

                      <div className="subpage-actions transactions-table__actions">
                        {isEditing ? (
                          <span className="transactions-table__editing-tag">Editing row</span>
                        ) : (
                          <button
                            className="subpage-inline-btn"
                            type="button"
                            onClick={() => startEditingTransaction(transaction)}
                            disabled={isRowBusy}
                          >
                            Edit
                          </button>
                        )}

                        <button
                          className="subpage-inline-btn danger"
                          type="button"
                          onClick={() => deleteTransaction(transaction.id)}
                          disabled={isRowBusy}
                        >
                          {deletingTransactionId === transaction.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="subpage-table-row transactions-table-row transactions-table-row--editor">
                        <div className="transactions-table-editor">
                          <div className="transactions-table-editor__grid">
                            <label className="transactions-table-editor__field">
                              <span>Store</span>
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
                            </label>

                            <label className="transactions-table-editor__field">
                              <span>Category</span>
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
                            </label>

                            <label className="transactions-table-editor__field">
                              <span>Amount</span>
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
                            </label>

                            <label className="transactions-table-editor__field">
                              <span>Date</span>
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
                            </label>
                          </div>

                          <div className="transactions-table-editor__actions">
                            <button
                              className="subpage-inline-btn"
                              type="button"
                              onClick={() => saveEditedTransaction(transaction)}
                              disabled={isRowBusy}
                            >
                              {updatingTransactionId === transaction.id ? "Saving..." : "Save"}
                            </button>
                            <button
                              className="subpage-inline-btn ghost"
                              type="button"
                              onClick={cancelEditingTransaction}
                              disabled={isRowBusy}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </React.Fragment>
                );
              })}

              {sortedTransactions.length === 0 ? (
                <div className="subpage-table-row subpage-empty-row transactions-table-row transactions-table-row--empty">
                  <span className="transactions-table__empty-cell">No transactions match the current filters.</span>
                </div>
              ) : null}
            </div>
          )}

          {!loadingList && !listError && sortedTransactions.length > 0 ? (
            <div className="transaction-ledger-pagination">
              <button
                className="subpage-inline-btn transaction-ledger-pagination__button"
                type="button"
                onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
                disabled={currentPage <= 1}
              >
                Previous
              </button>

              <span className="transaction-ledger-pagination__status">
                {currentPage} / {totalPages}
              </span>

              <button
                className="subpage-inline-btn transaction-ledger-pagination__button"
                type="button"
                onClick={() => setCurrentPage((previous) => Math.min(totalPages, previous + 1))}
                disabled={currentPage >= totalPages}
              >
                Next
              </button>
            </div>
          ) : null}
        </section>
      </div>

      <DecisionModal
        open={transactionEntry.previewOpen}
        loading={transactionEntry.loadingPreview}
        busy={transactionEntry.saving}
        busyLabel="Saving transaction..."
        error={transactionEntry.simulationError}
        simulation={transactionEntry.simulation}
        title={transactionEntry.pendingTransaction?.store_name ? `Prediction for ${transactionEntry.pendingTransaction.store_name}` : "Prediction before saving"}
        confirmLabel={transactionEntry.simulationError ? "Save without prediction" : "Save transaction"}
        cancelLabel="Close prediction"
        adjustLabel="Edit Details"
        onCancel={() => {
          if (transactionEntry.loadingPreview || transactionEntry.saving) {
            return;
          }
          transactionEntry.closePreview();
        }}
        onAdjust={() => {
          if (transactionEntry.loadingPreview || transactionEntry.saving) {
            return;
          }
          transactionEntry.closePreview();
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
