import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useAuth from "../hooks/useAuth";
import useIsMobile from "../hooks/useIsMobile";
import API from "../services/api";
import MobileDashboard from "../components/dashboard/MobileDashboard";
import DesktopDashboard from "../components/dashboard/DesktopDashboard";
import { DASHBOARD_REFRESH_EVENT } from "../constants/events";
import { normalizeApiError } from "../utils/normalizeApiError";
import { useIntelligence } from "../context/IntelligenceContext";

function Dashboard() {
  const { token } = useAuth();
  const {
    predictions,
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

  useEffect(() => {
    if (!token) return;

    const loadPredictions = async () => {
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
    };

    loadPredictions();
  }, [token, setPredictions, setLoadingPredictions, setPredictionError]);

  const loadSubscriptionInsight = useCallback(async () => {
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
  }, []);

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
    if (!token) {
      setLoadingHealth(false);
      return;
    }

    loadBaseDashboardData(selectedPeriod);
  }, [loadBaseDashboardData, token]);

  useEffect(() => {
    if (skipNextHealthLoadRef.current) {
      skipNextHealthLoadRef.current = false;
      return;
    }

    loadHealth(selectedPeriod);
  }, [loadHealth, selectedPeriod]);

  useEffect(() => {
    if (!token) return;

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
  }, [loadBaseDashboardData, loadHealth, selectedPeriod, token]);

  const selectedBudgetLimit = selectedPeriod
    ? budgetLimitsByPeriod[selectedPeriod] ?? null
    : null;

  const forecastError = !loadingBaseData ? baseDataError : "";

  if (isMobile) {
    return (
      <MobileDashboard
        loadingHealth={loadingHealth}
        healthError={healthError}
        health={health}
        selectedPeriod={selectedPeriod}
        availablePeriods={availablePeriods}
        onPeriodChange={setSelectedPeriod}
        transactions={recentTransactions}
        forecastTransactions={transactions}
        loadingForecast={loadingBaseData}
        forecastError={forecastError}
        selectedBudgetLimit={selectedBudgetLimit}
        subscriptionInsight={subscriptionInsight}
        predictedTransactions={predictions}
      />
    );
  }

  return (
    <DesktopDashboard
      loadingHealth={loadingHealth}
      healthError={healthError}
      health={health}
      selectedPeriod={selectedPeriod}
      availablePeriods={availablePeriods}
      onPeriodChange={setSelectedPeriod}
      transactions={recentTransactions}
      forecastTransactions={transactions}
      loadingForecast={loadingBaseData}
      forecastError={forecastError}
      selectedBudgetLimit={selectedBudgetLimit}
      subscriptionInsight={subscriptionInsight}
      predictedTransactions={predictions}
    />
  );
}

export default Dashboard;