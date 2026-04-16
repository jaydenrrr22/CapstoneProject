import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../services/api";
import { DASHBOARD_REFRESH_EVENT } from "../constants/events";
import { normalizeApiError } from "../utils/normalizeApiError";
import { buildDecisionSimulationModel } from "../utils/decisionSimulation";
import { NOTE_LIMIT } from "../components/transaction/transactionEntryLimits";
import useDemoMode from "./useDemoMode";
import { buildDemoSimulationResponse } from "../demo/demoUtils";

export const CATEGORY_OPTIONS = [
  "Bills",
  "Dining",
  "Education",
  "Entertainment",
  "Gas",
  "Groceries",
  "Health",
  "Income",
  "Other",
  "Shopping",
  "Subscriptions",
  "Transport",
  "Travel",
  "Utilities",
];

export const TRANSACTION_TYPE_OPTIONS = [
  { value: "spend", label: "Expense", hint: "Money going out" },
  { value: "deposit", label: "Income", hint: "Money coming in" },
];

export const RECURRENCE_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "yearly", label: "Yearly" },
];

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getEmptyFormData() {
  return {
    store_name: "",
    cost: "",
    date: getTodayDate(),
    category: "Other",
    note: "",
  };
}

export function getTransactionSequenceValue(transaction, fallbackIndex = 0) {
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

export function sortTransactionsByDate(items = []) {
  return items
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
    .map(({ item }) => item);
}

export default function useTransactionEntry({
  active = false,
  transactions = null,
  loadTransactions = null,
  onTransactionsChange = null,
} = {}) {
  const {
    createDemoTransaction,
    currentDataset,
    isDemoMode,
  } = useDemoMode();

  const [internalTransactions, setInternalTransactions] = useState([]);
  const [hasLoadedInternalTransactions, setHasLoadedInternalTransactions] = useState(false);

  const [transactionType, setTransactionType] = useState("spend");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("monthly");
  const [fieldErrors, setFieldErrors] = useState({});
  const [decisionSummary, setDecisionSummary] = useState("");
  const [formData, setFormData] = useState(getEmptyFormData);

  const [pendingTransaction, setPendingTransaction] = useState(null);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [previewOpen, setPreviewOpen] = useState(false);
  const [simulation, setSimulation] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [simulationError, setSimulationError] = useState("");

  const usesExternalTransactions = Array.isArray(transactions);
  const transactionSnapshot = usesExternalTransactions ? transactions : internalTransactions;

  const clearFieldError = useCallback((fieldName) => {
    setFieldErrors((previous) => {
      if (!previous[fieldName]) {
        return previous;
      }

      const nextErrors = { ...previous };
      delete nextErrors[fieldName];
      return nextErrors;
    });
  }, []);

  const setFormValue = useCallback((fieldName, value) => {
    setFormData((previous) => ({ ...previous, [fieldName]: value }));
    clearFieldError(fieldName);
    setSubmitError("");
  }, [clearFieldError]);

  const buildDecisionSummary = useCallback((payload, simulationModel = null) => {
    const cadence = isRecurring ? `recurring ${recurringFrequency}` : "one-time";
    const action = transactionType === "deposit" ? "income entry" : "expense";
    const amountLabel = `$${Math.abs(Number(payload.cost || 0)).toFixed(2)}`;
    const storeLabel = payload.store_name || "this merchant";
    const categoryLabel = payload.category || "Uncategorized";
    const detail = simulationModel?.recommendation?.headline || "Saved to your ledger.";

    return `${amountLabel} ${cadence} ${action} at ${storeLabel} in ${categoryLabel}. ${detail}`;
  }, [isRecurring, recurringFrequency, transactionType]);

  const resetFormState = useCallback(() => {
    setFormData(getEmptyFormData());
    setTransactionType("spend");
    setIsRecurring(false);
    setRecurringFrequency("monthly");
    setFieldErrors({});
    setPendingTransaction(null);
    setSimulation(null);
    setSimulationError("");
    setPreviewOpen(false);
  }, []);

  const syncTransactions = useCallback(async ({ preserveLoadingState = true } = {}) => {
    if (typeof loadTransactions === "function") {
      const nextTransactions = await loadTransactions({ preserveLoadingState });

      if (!usesExternalTransactions && Array.isArray(nextTransactions)) {
        setInternalTransactions(nextTransactions);
        setHasLoadedInternalTransactions(true);
      }

      return Array.isArray(nextTransactions) ? nextTransactions : [];
    }

    if (isDemoMode) {
      const nextTransactions = sortTransactionsByDate(currentDataset?.transactions || []);
      setInternalTransactions(nextTransactions);
      setHasLoadedInternalTransactions(true);
      return nextTransactions;
    }

    const response = await API.get("/transaction/get", {
      params: {
        page: 1,
        page_size: 5000,
      },
    });

    const nextTransactions = sortTransactionsByDate(response.data || []);
    setInternalTransactions(nextTransactions);
    setHasLoadedInternalTransactions(true);
    return nextTransactions;
  }, [currentDataset, isDemoMode, loadTransactions, usesExternalTransactions]);

  useEffect(() => {
    if (!active || usesExternalTransactions) {
      return;
    }

    syncTransactions().catch(() => {
      setHasLoadedInternalTransactions(true);
    });
  }, [active, syncTransactions, usesExternalTransactions]);

  useEffect(() => {
    if (!active || !isDemoMode || usesExternalTransactions) {
      return;
    }

    setInternalTransactions(sortTransactionsByDate(currentDataset?.transactions || []));
    setHasLoadedInternalTransactions(true);
  }, [active, currentDataset, isDemoMode, usesExternalTransactions]);

  const validateAndBuildPayload = useCallback(() => {
    const nextErrors = {};
    const trimmedName = formData.store_name.trim();
    const enteredCost = Number(formData.cost);
    const trimmedNote = formData.note.trim();
    const selectedCategory = String(formData.category || "").trim();

    if (!trimmedName) {
      nextErrors.store_name = "Add a merchant or income source.";
    }

    if (!Number.isFinite(enteredCost) || enteredCost <= 0) {
      nextErrors.cost = "Enter an amount greater than 0.";
    }

    if (!formData.date) {
      nextErrors.date = "Choose a transaction date.";
    }

    if (transactionType === "spend" && selectedCategory.toLowerCase() === "income") {
      nextErrors.category = "Choose an expense category for expenses.";
    }

    if (trimmedNote.length > NOTE_LIMIT) {
      nextErrors.note = `Keep the note under ${NOTE_LIMIT} characters.`;
    }

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmitError("Please correct the highlighted fields.");
      return null;
    }

    setSubmitError("");

    const normalizedCategory = transactionType === "deposit"
      ? "Income"
      : (selectedCategory || "Other");

    const mappedCategory = isRecurring && transactionType === "spend"
      ? `Subscription - ${normalizedCategory}`
      : normalizedCategory;

    return {
      store_name: trimmedName,
      cost: Math.abs(enteredCost),
      date: formData.date,
      category: mappedCategory,
    };
  }, [formData, isRecurring, transactionType]);

  const ensureTransactions = useCallback(async () => {
    if (usesExternalTransactions) {
      if (transactionSnapshot.length > 0 || typeof loadTransactions !== "function") {
        return transactionSnapshot;
      }

      return syncTransactions();
    }

    if (hasLoadedInternalTransactions) {
      return transactionSnapshot;
    }

    return syncTransactions();
  }, [
    hasLoadedInternalTransactions,
    loadTransactions,
    syncTransactions,
    transactionSnapshot,
    usesExternalTransactions,
  ]);

  const savePayload = useCallback(async (payload, { persistHistory = false, analysisToPersist = null } = {}) => {
    setSaving(true);
    setSubmitError("");

    try {
      let nextTransactions = transactionSnapshot;

      if (isDemoMode) {
        nextTransactions = sortTransactionsByDate(createDemoTransaction(payload));

        if (!usesExternalTransactions) {
          setInternalTransactions(nextTransactions);
          setHasLoadedInternalTransactions(true);
        }

        if (typeof onTransactionsChange === "function") {
          onTransactionsChange(nextTransactions);
        }
      } else {
        await API.post("/transaction/create", payload);
        nextTransactions = await syncTransactions({ preserveLoadingState: true });

        if (persistHistory && analysisToPersist) {
          try {
            await API.post("/prediction/history", {
              ...analysisToPersist,
              source: "decision.modal.confirmed",
            });
          } catch (historyError) {
            console.warn("Could not persist intelligence history", historyError);
          }
        }
      }

      window.dispatchEvent(new CustomEvent(DASHBOARD_REFRESH_EVENT));
      setDecisionSummary(buildDecisionSummary(payload, simulation));
      resetFormState();
      return nextTransactions;
    } catch (error) {
      setSubmitError(normalizeApiError(error, "Unable to create transaction."));
      return null;
    } finally {
      setSaving(false);
    }
  }, [
    buildDecisionSummary,
    createDemoTransaction,
    isDemoMode,
    onTransactionsChange,
    resetFormState,
    simulation,
    syncTransactions,
    transactionSnapshot,
    usesExternalTransactions,
  ]);

  const handlePreview = useCallback(async (event) => {
    if (event) {
      event.preventDefault();
    }

    const payload = validateAndBuildPayload();

    if (!payload) {
      return false;
    }

    setSimulation(null);
    setPendingTransaction(payload);
    setPreviewOpen(true);
    setLoadingPreview(true);
    setSimulationError("");

    try {
      const liveTransactions = await ensureTransactions();
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
          transactions: liveTransactions,
          actionDate: payload.date,
          amount: analysisPayload.amount,
          merchant: payload.store_name,
          category: payload.category,
          transactionType,
          frequency: analysisPayload.frequency,
        })
        : (await API.post("/intelligence/analyze", analysisPayload)).data;

      const simulationModel = buildDecisionSimulationModel({
        transactions: liveTransactions,
        pendingTransaction: payload,
        apiSimulation: responseData,
      });

      setSimulation(simulationModel);
      return true;
    } catch (error) {
      setSimulationError(normalizeApiError(error, "Could not generate a prediction. You can still continue."));
      return false;
    } finally {
      setLoadingPreview(false);
    }
  }, [
    currentDataset,
    ensureTransactions,
    isDemoMode,
    isRecurring,
    recurringFrequency,
    transactionType,
    validateAndBuildPayload,
  ]);

  const handleSave = useCallback(async (event) => {
    if (event) {
      event.preventDefault();
    }

    const payload = validateAndBuildPayload();

    if (!payload) {
      return false;
    }

    const result = await savePayload(payload);
    return Boolean(result);
  }, [savePayload, validateAndBuildPayload]);

  const closePreview = useCallback(({ clearSummary = false } = {}) => {
    setPreviewOpen(false);
    setPendingTransaction(null);
    setSimulation(null);
    setSimulationError("");

    if (clearSummary) {
      setDecisionSummary("");
    }
  }, []);

  const confirmPreviewSave = useCallback(async () => {
    if (!pendingTransaction) {
      return false;
    }

    const result = await savePayload(pendingTransaction, {
      persistHistory: Boolean(simulation?.rawAnalysis),
      analysisToPersist: simulation?.rawAnalysis || null,
    });

    return Boolean(result);
  }, [pendingTransaction, savePayload, simulation]);

  const noteLength = useMemo(() => formData.note.trim().length, [formData.note]);

  return {
    categoryOptions: CATEGORY_OPTIONS,
    closePreview,
    confirmPreviewSave,
    decisionSummary,
    fieldErrors,
    formData,
    handlePreview,
    handleSave,
    isRecurring,
    loadingPreview,
    noteLength,
    pendingTransaction,
    previewOpen,
    recurringFrequency,
    recurrenceOptions: RECURRENCE_OPTIONS,
    resetFormState,
    saving,
    setFormValue,
    setIsRecurring,
    setRecurringFrequency,
    setSubmitError,
    setTransactionType,
    simulation,
    simulationError,
    submitError,
    transactionType,
    transactionTypeOptions: TRANSACTION_TYPE_OPTIONS,
  };
}

