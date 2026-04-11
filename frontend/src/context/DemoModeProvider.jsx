import { useCallback, useEffect, useMemo, useState } from "react";
import DemoModeContext from "./demoModeContext";
import { createInitialDemoDataset } from "../demo/demoDatasets";
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

export function DemoModeProvider({ children }) {
  const initialState = getInitialDemoState();
  const [isDemoMode, setIsDemoMode] = useState(initialState.isDemoMode);
  const [demoSession, setDemoSession] = useState(initialState.demoSession);
  const [walkthroughState, setWalkthroughState] = useState(initialState.walkthroughState);

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

  const startDemo = useCallback(() => {
    const nextSession = createInitialDemoDataset();
    const nextWalkthroughState = { isOpen: true, stepIndex: 0 };

    window.localStorage.setItem(DEMO_MODE_KEY, String(true));
    persistDemoSession(nextSession);
    persistWalkthroughState(nextWalkthroughState);

    setIsDemoMode(true);
    setDemoSession(nextSession);
    setWalkthroughState(nextWalkthroughState);
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
    createDemoTransaction,
    currentDataset: isDemoMode ? demoSession : null,
    deleteDemoTransaction,
    exitDemo,
    isDemoMode,
    startDemo,
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
    createDemoTransaction,
    demoSession,
    deleteDemoTransaction,
    exitDemo,
    isDemoMode,
    nextWalkthroughStep,
    openWalkthrough,
    closeWalkthrough,
    previousWalkthroughStep,
    setWalkthroughStepIndex,
    startDemo,
    updateDemoTransaction,
    walkthroughState.isOpen,
    walkthroughState.stepIndex,
  ]);

  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>;
}
