import { useCallback, useEffect, useMemo, useState } from "react";
import DemoModeContext from "./demoModeContext";
import { getDemoDatasetById } from "../demo/demoDatasets";

const MODE_SELECTION_KEY = "trace_mode_selection";
const DEMO_MODE_KEY = "trace_is_demo_mode";
const DATASET_KEY = "trace_demo_dataset";
const TRANSACTIONS_KEY = "trace_demo_transactions";
const WALKTHROUGH_KEY = "trace_demo_walkthrough_dismissed";
const MODE_ONBOARDING_KEY = "trace_mode_onboarding_pending";

function createDemoTransactionId() {
  return `demo-tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function persistDemoTransactions(nextTransactionsByDataset) {
  window.localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(nextTransactionsByDataset));
}

export function DemoModeProvider({ children }) {
  const [hasSelectedMode, setHasSelectedMode] = useState(
    () => window.localStorage.getItem(MODE_SELECTION_KEY) === "true"
  );
  const [needsModeSelection, setNeedsModeSelection] = useState(
    () => window.localStorage.getItem(MODE_ONBOARDING_KEY) === "true"
  );
  const [isDemoMode, setIsDemoMode] = useState(
    () => window.localStorage.getItem(DEMO_MODE_KEY) === "true"
  );
  const [selectedDemoDataset, setSelectedDemoDataset] = useState(
    () => window.localStorage.getItem(DATASET_KEY) || "college-student"
  );
  const [demoTransactionsByDataset, setDemoTransactionsByDataset] = useState(() => {
    const storedValue = window.localStorage.getItem(TRANSACTIONS_KEY);

    if (!storedValue) {
      return {};
    }

    try {
      return JSON.parse(storedValue);
    } catch {
      return {};
    }
  });
  const [walkthroughDismissed, setWalkthroughDismissed] = useState(
    () => window.localStorage.getItem(WALKTHROUGH_KEY) === "true"
  );

  useEffect(() => {
    window.localStorage.setItem(MODE_SELECTION_KEY, String(hasSelectedMode));
  }, [hasSelectedMode]);

  useEffect(() => {
    window.localStorage.setItem(MODE_ONBOARDING_KEY, String(needsModeSelection));
  }, [needsModeSelection]);

  useEffect(() => {
    window.localStorage.setItem(DEMO_MODE_KEY, String(isDemoMode));
  }, [isDemoMode]);

  useEffect(() => {
    window.localStorage.setItem(DATASET_KEY, selectedDemoDataset);
  }, [selectedDemoDataset]);

  useEffect(() => {
    window.localStorage.setItem(WALKTHROUGH_KEY, String(walkthroughDismissed));
  }, [walkthroughDismissed]);

  const selectDemoMode = useCallback((datasetId) => {
    window.localStorage.setItem(MODE_SELECTION_KEY, "true");
    window.localStorage.setItem(MODE_ONBOARDING_KEY, "false");
    window.localStorage.setItem(DEMO_MODE_KEY, "true");
    window.localStorage.setItem(DATASET_KEY, datasetId);
    window.localStorage.setItem(WALKTHROUGH_KEY, "false");
    setHasSelectedMode(true);
    setNeedsModeSelection(false);
    setIsDemoMode(true);
    setSelectedDemoDataset(datasetId);
    setWalkthroughDismissed(false);
  }, []);

  const selectNormalMode = useCallback(() => {
    window.localStorage.setItem(MODE_SELECTION_KEY, "true");
    window.localStorage.setItem(MODE_ONBOARDING_KEY, "false");
    window.localStorage.setItem(DEMO_MODE_KEY, "false");
    setHasSelectedMode(true);
    setNeedsModeSelection(false);
    setIsDemoMode(false);
  }, []);

  const resetModeSelection = useCallback(() => {
    window.localStorage.setItem(MODE_SELECTION_KEY, "false");
    window.localStorage.setItem(DEMO_MODE_KEY, "false");
    window.localStorage.setItem(MODE_ONBOARDING_KEY, "false");
    setHasSelectedMode(false);
    setIsDemoMode(false);
    setNeedsModeSelection(false);
  }, []);

  const beginModeOnboarding = useCallback(() => {
    window.localStorage.setItem(MODE_SELECTION_KEY, "false");
    window.localStorage.setItem(DEMO_MODE_KEY, "false");
    window.localStorage.setItem(MODE_ONBOARDING_KEY, "true");
    window.localStorage.setItem(WALKTHROUGH_KEY, "false");
    setHasSelectedMode(false);
    setIsDemoMode(false);
    setNeedsModeSelection(true);
    setWalkthroughDismissed(false);
  }, []);

  const dismissWalkthrough = useCallback(() => {
    setWalkthroughDismissed(true);
  }, []);

  const createDemoTransaction = useCallback((transaction) => {
    const nextTransaction = {
      ...transaction,
      id: transaction.id || createDemoTransactionId(),
    };

    let nextTransactionsByDataset = {};

    setDemoTransactionsByDataset((previous) => {
      const baseTransactions = previous[selectedDemoDataset] || getDemoDatasetById(selectedDemoDataset).transactions || [];
      nextTransactionsByDataset = {
        ...previous,
        [selectedDemoDataset]: [...baseTransactions, nextTransaction],
      };

      persistDemoTransactions(nextTransactionsByDataset);
      return nextTransactionsByDataset;
    });

    return nextTransactionsByDataset[selectedDemoDataset] || [nextTransaction];
  }, [selectedDemoDataset]);

  const updateDemoTransaction = useCallback((transactionId, updates) => {
    let nextTransactionsByDataset = {};

    setDemoTransactionsByDataset((previous) => {
      const baseTransactions = previous[selectedDemoDataset] || getDemoDatasetById(selectedDemoDataset).transactions || [];
      nextTransactionsByDataset = {
        ...previous,
        [selectedDemoDataset]: baseTransactions.map((transaction) =>
          transaction.id === transactionId
            ? { ...transaction, ...updates, id: transaction.id }
            : transaction
        ),
      };

      persistDemoTransactions(nextTransactionsByDataset);
      return nextTransactionsByDataset;
    });

    return nextTransactionsByDataset[selectedDemoDataset] || [];
  }, [selectedDemoDataset]);

  const deleteDemoTransaction = useCallback((transactionId) => {
    let nextTransactionsByDataset = {};

    setDemoTransactionsByDataset((previous) => {
      const baseTransactions = previous[selectedDemoDataset] || getDemoDatasetById(selectedDemoDataset).transactions || [];
      nextTransactionsByDataset = {
        ...previous,
        [selectedDemoDataset]: baseTransactions.filter((transaction) => transaction.id !== transactionId),
      };

      persistDemoTransactions(nextTransactionsByDataset);
      return nextTransactionsByDataset;
    });

    return nextTransactionsByDataset[selectedDemoDataset] || [];
  }, [selectedDemoDataset]);

  const value = useMemo(
    () => {
      const baseDataset = isDemoMode ? getDemoDatasetById(selectedDemoDataset) : null;
      const currentDataset = baseDataset
        ? {
          ...baseDataset,
          transactions: demoTransactionsByDataset[selectedDemoDataset] || baseDataset.transactions,
        }
        : null;

      return {
        currentDataset,
        beginModeOnboarding,
        createDemoTransaction,
        deleteDemoTransaction,
        dismissWalkthrough,
        hasSelectedMode,
        isDemoMode,
        needsModeSelection,
        resetModeSelection,
        selectDemoMode,
        selectedDemoDataset,
        selectNormalMode,
        setSelectedDemoDataset,
        updateDemoTransaction,
        walkthroughDismissed,
      };
    },
    [
      createDemoTransaction,
      deleteDemoTransaction,
      beginModeOnboarding,
      demoTransactionsByDataset,
      dismissWalkthrough,
      hasSelectedMode,
      isDemoMode,
      needsModeSelection,
      resetModeSelection,
      selectDemoMode,
      selectedDemoDataset,
      selectNormalMode,
      updateDemoTransaction,
      walkthroughDismissed,
    ]
  );

  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>;
}
