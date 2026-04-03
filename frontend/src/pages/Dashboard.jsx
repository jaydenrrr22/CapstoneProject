import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useAuth from "../hooks/useAuth";
import useIsMobile from "../hooks/useIsMobile";
import API from "../services/api";
import MobileDashboard from "../components/dashboard/MobileDashboard";
import DesktopDashboard from "../components/dashboard/DesktopDashboard";
import { DASHBOARD_REFRESH_EVENT } from "../constants/events";
import { normalizeApiError } from "../utils/normalizeApiError";
import useIntelligence from "../hooks/useIntelligence";
import useDemoMode from "../hooks/useDemoMode";
import { buildDemoHealth, getAvailablePeriods, getBudgetLimitMap, getSubscriptionInsight } from "../demo/demoUtils";
import DemoWalkthrough from "../components/demo/DemoWalkthrough";

function Dashboard() {
  const { token } = useAuth();
  const { currentDataset, isDemoMode } = useDemoMode();
  const {
    predictions,
    loadingPredictions,
    predictionError,
    setPredictions,
    setLoadingPredictions,
    setPredictionError,
  } = useIntelligence();

  const isMobile = useIsMobile(768);
  const skipNextHealthLoadRef = useRef(false);

  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState("");
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [loadingBaseData, setLoadingBaseData] = useState(true);
  const [baseDataError, setBaseDataError] = useState("");

  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [budgetLimitsByPeriod, setBudgetLimitsByPeriod] = useState({});

  const [transactions, setTransactions] = useState([]);
  const [subscriptionInsight, setSubscriptionInsight] = useState({
    count: 0,
    totalMonthly: 0,
  });

  const demoBudgetMap = useMemo(
    () => getBudgetLimitMap(currentDataset?.budget || []),
    [currentDataset]
  );
  const demoAvailablePeriods = useMemo(
    () => getAvailablePeriods(currentDataset?.budget || []),
    [currentDataset]
  );
  const activePredictions = isDemoMode ? currentDataset?.predictions || [] : predictions;
  const activeLoadingPredictions = isDemoMode ? false : loadingPredictions;
  const activePredictionError = isDemoMode ? "" : predictionError;

  const recentTransactions = useMemo(
    () =>
      transactions
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)
        .map((tx) => ({
          id: tx.id,
          name: tx.store_name,
          amount: Number(tx.cost),
        })),
    [transactions]
  );

  const loadPredictions = useCallback(async () => {
    if (isDemoMode) {
      setLoadingPredictions(false);
      setPredictionError("");
      setPredictions(currentDataset?.predictions || []);
      return;
    }

    setLoadingPredictions(true);
    setPredictionError("");

    try {
      const response = await API.get("/prediction/history");

      const mapped = (response.data || []).map((item, index) => ({
        id: item.id || `pred-${index}`,
        name: item.target_data || "Predicted Transaction",
        amount: Number(item.predicted_spending) || 0,
      }));

      setPredictions(mapped);
    } catch (error) {
      setPredictionError(
        normalizeApiError(error, "Failed to load predicted transactions.")
      );
      setPredictions([]);
    } finally {
      setLoadingPredictions(false);
    }
  }, [
    currentDataset,
    isDemoMode,
    setPredictions,
    setLoadingPredictions,
    setPredictionError,
  ]);

  useEffect(() => {
    loadPredictions();
  }, [loadPredictions, token]);

  const loadSubscriptionInsight = useCallback(async () => {
    if (isDemoMode) {
      setSubscriptionInsight(getSubscriptionInsight(currentDataset?.subscriptions || []));
      return;
    }

    try {
      const response = await API.get("/subscription/detect");
      const subscriptions = response.data || [];
      const totalMonthly = subscriptions.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      );

      setSubscriptionInsight({
        count: subscriptions.length,
        totalMonthly,
      });
    } catch {
      setSubscriptionInsight({
        count: 0,
        totalMonthly: 0,
      });
    }
  }, [currentDataset, isDemoMode]);

  const loadBaseDashboardData = useCallback(
    async (preferredPeriod = "", shouldSyncSelectedPeriod = true) => {
      try {
        setLoadingBaseData(true);
        setBaseDataError("");

        const [budgetResponse, transactionResponse] = await Promise.all([
          API.get("/budget/get"),
          API.get("/transaction/get"),
        ]);

        const budgets = budgetResponse.data || [];

        const budgetMap = budgets.reduce((acc, budget) => {
          const numericAmount = Number(budget.amount);
          if (budget?.period && Number.isFinite(numericAmount)) {
            acc[budget.period] = numericAmount;
          }
          return acc;
        }, {});

        setBudgetLimitsByPeriod(budgetMap);

        const periods = [...new Set(budgets.map((b) => b.period))].sort((a, b) =>
          b.localeCompare(a)
        );

        setAvailablePeriods(periods);

        if (periods.length === 0) {
          setSelectedPeriod("");
          setHealth(null);
          setHealthError(
            "No budget found yet. Create one in Budgets to activate financial health."
          );
          setLoadingHealth(false);
        }

        const resolvedPeriod =
          periods.length === 0
            ? ""
            : periods.includes(preferredPeriod)
            ? preferredPeriod
            : periods[0];

        if (shouldSyncSelectedPeriod && resolvedPeriod) {
          setSelectedPeriod(resolvedPeriod);
        }

        setTransactions(transactionResponse.data || []);
        await loadSubscriptionInsight();

        return resolvedPeriod;
      } catch {
        setBaseDataError("Could not load dashboard data.");
        setHealthError("Could not load dashboard data.");
        setLoadingHealth(false);
        return "";
      } finally {
        setLoadingBaseData(false);
      }
    },
    [loadSubscriptionInsight]
  );

  const loadHealth = useCallback(
    async (period) => {
      if (!period || !token) return;

      setLoadingHealth(true);
      setHealthError("");

      try {
        const response = await API.get(
          `/analytics/financial-health/${period}`
        );
        setHealth(response.data);
      } catch (error) {
        setHealth(null);
        setHealthError(
          normalizeApiError(
            error,
            "Unable to load financial health for this period."
          )
        );
      } finally {
        setLoadingHealth(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (isDemoMode) {
      setLoadingBaseData(false);
      setBaseDataError("");
      setAvailablePeriods(demoAvailablePeriods);
      setBudgetLimitsByPeriod(demoBudgetMap);
      setTransactions(currentDataset?.transactions || []);
      setSubscriptionInsight(getSubscriptionInsight(currentDataset?.subscriptions || []));
      setSelectedPeriod((current) =>
        demoAvailablePeriods.includes(current) ? current : demoAvailablePeriods[0] || ""
      );
      return;
    }

    if (!token) {
      setLoadingHealth(false);
      return;
    }

    loadBaseDashboardData();
  }, [currentDataset, demoAvailablePeriods, demoBudgetMap, isDemoMode, loadBaseDashboardData, token]);

  useEffect(() => {
    if (isDemoMode) {
      setLoadingHealth(true);
      setHealthError("");
      setHealth(buildDemoHealth(selectedPeriod, demoBudgetMap, currentDataset?.transactions || []));
      setLoadingHealth(false);
      return;
    }

    if (skipNextHealthLoadRef.current) {
      skipNextHealthLoadRef.current = false;
      return;
    }

    loadHealth(selectedPeriod);
  }, [currentDataset, demoBudgetMap, isDemoMode, loadHealth, selectedPeriod]);

  useEffect(() => {
    if (isDemoMode || !token) return;

    const handleDashboardRefresh = async () => {
      const resolvedPeriod = await loadBaseDashboardData(
        selectedPeriod,
        false
      );

      if (resolvedPeriod) {
        if (resolvedPeriod !== selectedPeriod) {
          skipNextHealthLoadRef.current = true;
          setSelectedPeriod(resolvedPeriod);
        }

        await loadHealth(resolvedPeriod);
      }
    };

    window.addEventListener(
      DASHBOARD_REFRESH_EVENT,
      handleDashboardRefresh
    );

    return () => {
      window.removeEventListener(
        DASHBOARD_REFRESH_EVENT,
        handleDashboardRefresh
      );
    };
  }, [isDemoMode, loadBaseDashboardData, loadHealth, selectedPeriod, token]);

  const selectedBudgetLimit = selectedPeriod
    ? (isDemoMode ? demoBudgetMap[selectedPeriod] : budgetLimitsByPeriod[selectedPeriod]) ?? null
    : null;

  const forecastError = isDemoMode ? "" : !loadingBaseData ? baseDataError : "";

  if (isMobile) {
    return (
      <>
        <MobileDashboard
          loadingHealth={loadingHealth}
          healthError={healthError}
          health={health}
          selectedPeriod={selectedPeriod}
          availablePeriods={isDemoMode ? demoAvailablePeriods : availablePeriods}
          onPeriodChange={setSelectedPeriod}
          transactions={recentTransactions}
          forecastTransactions={transactions}
          loadingForecast={loadingBaseData}
          forecastError={forecastError}
          selectedBudgetLimit={selectedBudgetLimit}
          subscriptionInsight={subscriptionInsight}
          predictedTransactions={activePredictions}
          loadingPredictions={activeLoadingPredictions}
          predictionError={activePredictionError}
          onRetryPredictions={loadPredictions}
        />
        <DemoWalkthrough />
      </>
    );
  }

  return (
    <>
      <DesktopDashboard
        loadingHealth={loadingHealth}
        healthError={healthError}
        health={health}
        selectedPeriod={selectedPeriod}
        availablePeriods={isDemoMode ? demoAvailablePeriods : availablePeriods}
        onPeriodChange={setSelectedPeriod}
        transactions={recentTransactions}
        forecastTransactions={transactions}
        loadingForecast={loadingBaseData}
        forecastError={forecastError}
        selectedBudgetLimit={selectedBudgetLimit}
        subscriptionInsight={subscriptionInsight}
        predictedTransactions={activePredictions}
        loadingPredictions={activeLoadingPredictions}
        predictionError={activePredictionError}
        onRetryPredictions={loadPredictions}
      />
      <DemoWalkthrough />
    </>
  );
}

export default Dashboard;
