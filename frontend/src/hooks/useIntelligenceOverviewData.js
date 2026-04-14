import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../services/api";
import useAuth from "./useAuth";
import useForecastData from "./useForecastData";
import useIntelligence from "./useIntelligence";
import useDemoMode from "./useDemoMode";
import { resolveDefaultPeriod } from "../utils/forecastUtils";
import { normalizeApiError } from "../utils/normalizeApiError";
import { detectDemoSubscriptions, getAvailablePeriods, getBudgetLimitMap } from "../demo/demoUtils";
import { DASHBOARD_REFRESH_EVENT } from "../constants/events";
import { mapIntelligenceHistoryRecords } from "../utils/intelligenceHistory";

function toMonthPeriod(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default function useIntelligenceOverviewData() {
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

  const [transactions, setTransactions] = useState([]);
  const [budgetLimitsByPeriod, setBudgetLimitsByPeriod] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [subscriptions, setSubscriptions] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [overviewError, setOverviewError] = useState("");
  const [loadingAnomalies, setLoadingAnomalies] = useState(true);
  const [anomalyError, setAnomalyError] = useState("");
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState("");
  const activePredictions = useMemo(
    () => (isDemoMode ? currentDataset?.predictions || [] : predictions || []),
    [currentDataset, isDemoMode, predictions]
  );
  const demoSubscriptions = useMemo(
    () => detectDemoSubscriptions(currentDataset?.transactions || []),
    [currentDataset]
  );
  const activeLoadingPredictions = isDemoMode ? false : loadingPredictions;
  const activePredictionError = isDemoMode ? "" : predictionError;

  const loadPredictions = useCallback(async () => {
    if (!token || isDemoMode) {
      setLoadingPredictions(false);
      setPredictionError("");
      return;
    }

    setLoadingPredictions(true);
    setPredictionError("");

    try {
      const response = await API.get("/prediction/history");
      setPredictions(mapIntelligenceHistoryRecords(response.data || []));
    } catch (error) {
      setPredictionError(
        normalizeApiError(error, "Failed to load predicted transactions.")
      );
      setPredictions([]);
    } finally {
      setLoadingPredictions(false);
    }
  }, [isDemoMode, setLoadingPredictions, setPredictionError, setPredictions, token]);

  const loadOverview = useCallback(async () => {
    if (isDemoMode) {
      const budgets = currentDataset?.budget || [];
      const periods = getAvailablePeriods(budgets);

      setBudgetLimitsByPeriod(getBudgetLimitMap(budgets));
      setSelectedPeriod(resolveDefaultPeriod(periods));
      setTransactions(currentDataset?.transactions || []);
      setSubscriptions(demoSubscriptions);
      setAnomalies(currentDataset?.anomalies || []);
      setOverviewError("");
      setLoadingOverview(false);
      setLoadingSubscriptions(false);
      setLoadingAnomalies(false);
      return;
    }

    if (!token) {
      setLoadingOverview(false);
      setLoadingAnomalies(false);
      setLoadingSubscriptions(false);
      return;
    }

    setLoadingOverview(true);
    setOverviewError("");
    setLoadingSubscriptions(true);
    setSubscriptionError("");
    setLoadingAnomalies(true);
    setAnomalyError("");

    try {
      const [budgetResponse, transactionResponse, subscriptionResponse, anomalyResponse] = await Promise.all([
        API.get("/budget/get"),
        API.get("/transaction/get", {
          params: {
            page: 1,
            page_size: 5000,
          },
        }),
        API.get("/subscription/detect"),
        API.get("/insight/anomalies"),
      ]);

      const budgets = budgetResponse.data || [];
      const budgetMap = budgets.reduce((accumulator, budget) => {
        const numericAmount = Number(budget.amount);

        if (budget?.period && Number.isFinite(numericAmount)) {
          accumulator[budget.period] = numericAmount;
        }

        return accumulator;
      }, {});

      const periods = [...new Set(budgets.map((budget) => budget.period))]
        .sort((left, right) => right.localeCompare(left));

      setBudgetLimitsByPeriod(budgetMap);
      setSelectedPeriod(resolveDefaultPeriod(periods));
      setTransactions(transactionResponse.data || []);
      setSubscriptions(subscriptionResponse.data || []);
      setAnomalies(anomalyResponse.data || []);
    } catch (error) {
      setOverviewError(normalizeApiError(error, "Unable to load intelligence overview."));
      setTransactions([]);
      setBudgetLimitsByPeriod({});
      setSelectedPeriod("");
      setSubscriptions([]);
      setAnomalies([]);
    } finally {
      setLoadingOverview(false);
      setLoadingSubscriptions(false);
      setLoadingAnomalies(false);
    }
  }, [currentDataset, demoSubscriptions, isDemoMode, token]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (!token) {
      return;
    }

    loadPredictions();
  }, [loadPredictions, token]);

  useEffect(() => {
    if (!token || isDemoMode) {
      return undefined;
    }

    const handleRefresh = () => {
      loadOverview();
      loadPredictions();
    };

    window.addEventListener(DASHBOARD_REFRESH_EVENT, handleRefresh);

    return () => {
      window.removeEventListener(DASHBOARD_REFRESH_EVENT, handleRefresh);
    };
  }, [isDemoMode, loadOverview, loadPredictions, token]);

  const selectedBudgetLimit = selectedPeriod ? budgetLimitsByPeriod[selectedPeriod] ?? null : null;

  const forecast = useForecastData({
    transactions,
    selectedPeriod,
    budgetLimit: selectedBudgetLimit,
    horizon: "1M",
  });

  const projectedMonthlySpend = forecast.currentValue + forecast.projectedDelta;
  const projectedSavingsOrDeficit = selectedBudgetLimit !== null
    ? selectedBudgetLimit - projectedMonthlySpend
    : null;

  const trendDirection = forecast.projectedDelta > 0
    ? "Increase"
    : forecast.projectedDelta < 0
      ? "Decrease"
      : "Flat";

  const subscriptionSummary = useMemo(() => {
    const totalMonthly = subscriptions.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const duplicates = subscriptions.filter((item) => item.is_duplicate);
    const highCost = subscriptions.filter((item) => Number(item.amount || 0) >= 50);
    const repeatedMerchants = subscriptions.reduce((accumulator, item) => {
      const key = String(item.merchant || "").trim().toLowerCase();

      if (!key) {
        return accumulator;
      }

      accumulator[key] = accumulator[key] || [];
      accumulator[key].push(item);
      return accumulator;
    }, {});

    const overlapping = Object.values(repeatedMerchants)
      .filter((entries) => entries.length > 1)
      .flat();

    return {
      totalMonthly,
      duplicates,
      highCost,
      overlapping,
    };
  }, [subscriptions]);

  const anomalySummary = useMemo(() => {
    const sorted = [...anomalies].sort(
      (left, right) => Number(right.actual_amount || 0) - Number(left.actual_amount || 0)
    );

    return {
      topAlerts: sorted.slice(0, 6),
      count: sorted.length,
    };
  }, [anomalies]);

  const predictedSummary = useMemo(() => {
    const list = activePredictions;
    const total = list.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return {
      count: list.length,
      total,
    };
  }, [activePredictions]);

  const recentUnexpectedTransactions = useMemo(
    () => anomalies.filter((anomaly) => toMonthPeriod(anomaly.date) === selectedPeriod),
    [anomalies, selectedPeriod]
  );

  return {
    anomalyError: anomalyError || (overviewError ? "" : anomalyError),
    anomalySummary,
    forecast,
    loadingAnomalies,
    loadingOverview,
    loadingPredictions: activeLoadingPredictions,
    loadingSubscriptions,
    overviewError,
    predictedSummary,
    predictionError: activePredictionError,
    predictions: activePredictions,
    projectedMonthlySpend,
    projectedSavingsOrDeficit,
    recentUnexpectedTransactions,
    refresh: loadOverview,
    selectedBudgetLimit,
    selectedPeriod,
    subscriptionError: subscriptionError || (overviewError ? "" : subscriptionError),
    subscriptionSummary,
    subscriptions,
    transactions,
    trendDirection,
  };
}

