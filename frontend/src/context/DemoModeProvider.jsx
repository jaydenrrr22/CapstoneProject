import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DemoModeContext from "./demoModeContext";
import { createInitialDemoDataset } from "../demo/demoDatasets";
import API from "../services/api";
import { mapIntelligenceHistoryRecords } from "../utils/intelligenceHistory";
import {
  DEMO_MODE_KEY,
  DEMO_SESSION_KEY,
  DEMO_WALKTHROUGH_KEY,
  LEGACY_DEMO_KEYS,
} from "../demo/storage";

const WALKTHROUGH_STEPS = [
  {
    id: "dashboard-overview",
    route: "/dashboard",
    selector: '[data-demo-tour="dashboard-overview"]',
    title: "Dashboard overview",
    description: "This is the live summary surface. It shows budget status, recent activity, and the key signals most teams open with in a demo.",
  },
  {
    id: "transactions-ledger",
    route: "/transactions",
    selector: '[data-demo-tour="transactions-ledger"]',
    title: "Transactions",
    description: "The ledger uses the same transaction schema as the real app, so income stays positive, expenses stay negative, and balances remain consistent.",
  },
  {
    id: "budget-panel",
    route: "/budgets",
    selector: '[data-demo-tour="budget-panel"]',
    title: "Budget",
    description: "This section shows how the demo data rolls into monthly budget tracking, remaining balance, and spend percentage without touching the database.",
  },
  {
    id: "intelligence-panel",
    route: "/intelligence",
    selector: '[data-demo-tour="intelligence-panel"]',
    title: "Intelligence and predictions",
    description: "Forecasting, anomaly signals, subscriptions, and predicted spend all read from the same demo dataset so the story stays numerically aligned.",
  },
  {
    id: "simulation-tools",
    route: "/transactions",
    selector: '[data-demo-tour="simulation-tools"]',
    title: "Simulation tools",
    description: "Use the transaction form and preview modal to demonstrate decision intelligence before saving changes into the session-only demo ledger.",
  },
];

function getStoredDemoSession() {
  const storedValue = window.sessionStorage.getItem(DEMO_SESSION_KEY);

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue);
  } catch {
    return null;
  }
}

function getStoredWalkthroughState() {
  const storedValue = window.sessionStorage.getItem(DEMO_WALKTHROUGH_KEY);

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue);
  } catch {
    return null;
  }
}

function persistDemoSession(session) {
  window.sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
}

function persistWalkthroughState(state) {
  window.sessionStorage.setItem(DEMO_WALKTHROUGH_KEY, JSON.stringify(state));
}

function removeLegacyDemoState() {
  LEGACY_DEMO_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  });
}

function getInitialDemoState() {
  const isDemoMode = window.localStorage.getItem(DEMO_MODE_KEY) === "true";
  const demoSession = isDemoMode ? getStoredDemoSession() || createInitialDemoDataset() : null;
  const walkthroughState = isDemoMode
    ? getStoredWalkthroughState() || { isOpen: true, stepIndex: 0 }
    : { isOpen: false, stepIndex: 0 };

  return {
    demoSession,
    isDemoMode,
    walkthroughState,
  };
}

function createDemoTransactionId() {
  return `demo-tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createDemoBudgetId() {
  return `demo-budget-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toMonthKey(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildHardcodedDemoBudgets(transactions = [], existingBudgets = []) {
  const incomesByMonth = new Map();
  const expensesByMonth = new Map();

  transactions.forEach((transaction) => {
    const period = toMonthKey(transaction?.date);
    const amount = Number(transaction?.cost || 0);

    if (!period || !Number.isFinite(amount)) {
      return;
    }

    if (amount > 0) {
      incomesByMonth.set(period, (incomesByMonth.get(period) || 0) + amount);
      return;
    }

    expensesByMonth.set(period, (expensesByMonth.get(period) || 0) + Math.abs(amount));
  });

  const allPeriods = Array.from(new Set([
    ...Array.from(incomesByMonth.keys()),
    ...Array.from(expensesByMonth.keys()),
  ])).sort((left, right) => left.localeCompare(right));

  if (allPeriods.length === 0) {
    return existingBudgets || [];
  }

  return allPeriods.map((period, index) => {
    const income = incomesByMonth.get(period) || 0;
    const expense = expensesByMonth.get(period) || 0;
    const baseline = income > 0 ? income * 0.72 : Math.max(900, expense * 0.55);
    const variationMultiplier = 1 + (((index % 5) - 2) * 0.03);
    const computedAmount = Math.max(600, Math.round((baseline * variationMultiplier) / 10) * 10);

    return {
      id: `demo-budget-${period}`,
      amount: Number(computedAmount.toFixed(2)),
      period,
      user_id: 999,
    };
  });
}

async function fetchDemoSessionFromApi() {
  const [budgetResult, transactionResult, predictionResult, anomalyResult] = await Promise.allSettled([
    API.get("/budget/get"),
    API.get("/transaction/get", {
      params: {
        page: 1,
        page_size: 5000,
      },
    }),
    API.get("/prediction/history"),
    API.get("/insight/anomalies"),
  ]);

  const results = [budgetResult, transactionResult, predictionResult, anomalyResult];
  const allRequestsFailed = results.every((result) => result.status === "rejected");

  if (allRequestsFailed) {
    throw new Error("Unable to hydrate demo session from API.");
  }

  const budgets = budgetResult.status === "fulfilled" ? budgetResult.value?.data || [] : [];
  const transactions = transactionResult.status === "fulfilled" ? transactionResult.value?.data || [] : [];
  const rawPredictions = predictionResult.status === "fulfilled" ? predictionResult.value?.data || [] : [];
  const anomalies = anomalyResult.status === "fulfilled" ? anomalyResult.value?.data || [] : [];
  const generatedBudgets = buildHardcodedDemoBudgets(transactions, budgets);
  const demoSession = {
    budget: generatedBudgets,
    transactions,
    predictions: mapIntelligenceHistoryRecords(rawPredictions),
    anomalies,
  };
  const isEffectivelyEmpty =
    demoSession.budget.length === 0 &&
    demoSession.transactions.length === 0 &&
    demoSession.predictions.length === 0 &&
    demoSession.anomalies.length === 0;

  if (isEffectivelyEmpty) {
    throw new Error("Demo session payload was empty.");
  }

  return demoSession;
}

export function DemoModeProvider({ children }) {
  const initialState = getInitialDemoState();
  const [isDemoMode, setIsDemoMode] = useState(initialState.isDemoMode);
  const [demoSession, setDemoSession] = useState(initialState.demoSession);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [walkthroughState, setWalkthroughState] = useState(initialState.walkthroughState);

  const isFreshStartRef = useRef(false);

  useEffect(() => {
    removeLegacyDemoState();
  }, []);

  useEffect(() => {
    window.localStorage.setItem(DEMO_MODE_KEY, String(isDemoMode));

    if (!isDemoMode) {
      window.sessionStorage.removeItem(DEMO_SESSION_KEY);
      window.sessionStorage.removeItem(DEMO_WALKTHROUGH_KEY);
    }
  }, [isDemoMode]);

  useEffect(() => {
    if (isDemoMode && demoSession) {
      persistDemoSession(demoSession);
    }
  }, [demoSession, isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      persistWalkthroughState(walkthroughState);
    }
  }, [isDemoMode, walkthroughState]);

  useEffect(() => {
    if (!isDemoMode) {
      return;
    }

    if (isFreshStartRef.current) {
      isFreshStartRef.current = false;
      return;
    }

    let isCancelled = false;

    const hydrateExistingDemoSession = async () => {
      setIsDemoLoading(true);

      try {
        const hydratedSession = await fetchDemoSessionFromApi();

        if (!isCancelled) {
          setDemoSession(hydratedSession);
        }
      } catch {
        // Keep existing persisted session if API hydration is unavailable.
      } finally {
        if (!isCancelled) {
          setIsDemoLoading(false);
        }
      }
    };

    hydrateExistingDemoSession();

    return () => {
      isCancelled = true;
    };
  }, [isDemoMode]);

  const startDemo = useCallback(async () => {
    const nextSession = createInitialDemoDataset();
    const nextWalkthroughState = { isOpen: true, stepIndex: 0 };

    window.localStorage.setItem(DEMO_MODE_KEY, String(true));
    persistDemoSession(nextSession);
    persistWalkthroughState(nextWalkthroughState);

    isFreshStartRef.current = true;
    setIsDemoMode(true);
    setDemoSession(nextSession);
    setWalkthroughState(nextWalkthroughState);

    setIsDemoLoading(true);

    try {
      const hydratedSession = await fetchDemoSessionFromApi();
      setDemoSession(hydratedSession);
    } catch {
      // Keep local fallback dataset if demo API bootstrap is unavailable.
    } finally {
      setIsDemoLoading(false);
    }
  }, []);

  const exitDemo = useCallback(() => {
    setIsDemoMode(false);
    setDemoSession(null);
    setWalkthroughState({ isOpen: false, stepIndex: 0 });
    window.localStorage.removeItem(DEMO_MODE_KEY);
    window.sessionStorage.removeItem(DEMO_SESSION_KEY);
    window.sessionStorage.removeItem(DEMO_WALKTHROUGH_KEY);
  }, []);

  const createDemoTransaction = useCallback((transaction) => {
    const nextTransaction = {
      ...transaction,
      id: transaction.id || createDemoTransactionId(),
    };

    let nextTransactions = [];

    setDemoSession((previous) => {
      const baseSession = previous || createInitialDemoDataset();
      nextTransactions = [...(baseSession.transactions || []), nextTransaction];
      return {
        ...baseSession,
        transactions: nextTransactions,
      };
    });

    return nextTransactions;
  }, []);

  const createDemoBudget = useCallback((budget) => {
    const nextBudget = {
      ...budget,
      id: budget.id || createDemoBudgetId(),
    };

    let nextBudgets = [];

    setDemoSession((previous) => {
      const baseSession = previous || createInitialDemoDataset();
      nextBudgets = [...(baseSession.budget || []), nextBudget];

      return {
        ...baseSession,
        budget: nextBudgets,
      };
    });

    return nextBudgets;
  }, []);

  const updateDemoBudget = useCallback((budgetId, updates) => {
    let nextBudgets = [];

    setDemoSession((previous) => {
      const baseSession = previous || createInitialDemoDataset();
      nextBudgets = (baseSession.budget || []).map((budget) =>
        budget.id === budgetId
          ? { ...budget, ...updates, id: budget.id }
          : budget
      );

      return {
        ...baseSession,
        budget: nextBudgets,
      };
    });

    return nextBudgets;
  }, []);

  const deleteDemoBudget = useCallback((budgetId) => {
    let nextBudgets = [];

    setDemoSession((previous) => {
      const baseSession = previous || createInitialDemoDataset();
      nextBudgets = (baseSession.budget || []).filter((budget) => budget.id !== budgetId);

      return {
        ...baseSession,
        budget: nextBudgets,
      };
    });

    return nextBudgets;
  }, []);

  const updateDemoTransaction = useCallback((transactionId, updates) => {
    let nextTransactions = [];

    setDemoSession((previous) => {
      const baseSession = previous || createInitialDemoDataset();
      nextTransactions = (baseSession.transactions || []).map((transaction) =>
        transaction.id === transactionId
          ? { ...transaction, ...updates, id: transaction.id }
          : transaction
      );

      return {
        ...baseSession,
        transactions: nextTransactions,
      };
    });

    return nextTransactions;
  }, []);

  const deleteDemoTransaction = useCallback((transactionId) => {
    let nextTransactions = [];

    setDemoSession((previous) => {
      const baseSession = previous || createInitialDemoDataset();
      nextTransactions = (baseSession.transactions || []).filter(
        (transaction) => transaction.id !== transactionId
      );

      return {
        ...baseSession,
        transactions: nextTransactions,
      };
    });

    return nextTransactions;
  }, []);

  const openWalkthrough = useCallback((stepIndex = 0) => {
    setWalkthroughState({
      isOpen: true,
      stepIndex: Math.max(0, Math.min(WALKTHROUGH_STEPS.length - 1, stepIndex)),
    });
  }, []);

  const closeWalkthrough = useCallback(() => {
    setWalkthroughState((previous) => ({
      ...previous,
      isOpen: false,
    }));
  }, []);

  const setWalkthroughStepIndex = useCallback((stepIndex) => {
    setWalkthroughState((previous) => ({
      ...previous,
      isOpen: true,
      stepIndex: Math.max(0, Math.min(WALKTHROUGH_STEPS.length - 1, stepIndex)),
    }));
  }, []);

  const nextWalkthroughStep = useCallback(() => {
    setWalkthroughState((previous) => {
      if (previous.stepIndex >= WALKTHROUGH_STEPS.length - 1) {
        return {
          ...previous,
          isOpen: false,
        };
      }

      return {
        isOpen: true,
        stepIndex: previous.stepIndex + 1,
      };
    });
  }, []);

  const previousWalkthroughStep = useCallback(() => {
    setWalkthroughState((previous) => ({
      isOpen: true,
      stepIndex: Math.max(0, previous.stepIndex - 1),
    }));
  }, []);

  const value = useMemo(() => ({
    createDemoBudget,
    createDemoTransaction,
    currentDataset: isDemoMode ? demoSession : null,
    deleteDemoBudget,
    deleteDemoTransaction,
    exitDemo,
    isDemoLoading,
    isDemoMode,
    startDemo,
    updateDemoBudget,
    updateDemoTransaction,
    walkthroughStep: WALKTHROUGH_STEPS[walkthroughState.stepIndex] || WALKTHROUGH_STEPS[0],
    walkthroughStepIndex: walkthroughState.stepIndex,
    walkthroughSteps: WALKTHROUGH_STEPS,
    isWalkthroughOpen: isDemoMode && walkthroughState.isOpen,
    openWalkthrough,
    closeWalkthrough,
    nextWalkthroughStep,
    previousWalkthroughStep,
    setWalkthroughStepIndex,
  }), [
    createDemoBudget,
    createDemoTransaction,
    demoSession,
    deleteDemoBudget,
    deleteDemoTransaction,
    exitDemo,
    isDemoLoading,
    isDemoMode,
    nextWalkthroughStep,
    openWalkthrough,
    closeWalkthrough,
    previousWalkthroughStep,
    setWalkthroughStepIndex,
    startDemo,
    updateDemoBudget,
    updateDemoTransaction,
    walkthroughState.isOpen,
    walkthroughState.stepIndex,
  ]);

  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>;
}
