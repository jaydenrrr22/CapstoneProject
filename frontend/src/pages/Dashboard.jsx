import { useEffect, useMemo, useState } from "react";
import useAuth from "../hooks/useAuth";
import useIsMobile from "../hooks/useIsMobile";
import API from "../services/api";
import MobileDashboard from "../components/dashboard/MobileDashboard";
import DesktopDashboard from "../components/dashboard/DesktopDashboard";

function Dashboard() {
  const { token } = useAuth();
  const isMobile = useIsMobile(768);

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
    () => transactions
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map((tx) => ({
        id: tx.id,
        name: tx.store_name,
        amount: Number(tx.cost),
      })),
    [transactions],
  );

  useEffect(() => {
    if (!token) {
      setLoadingBaseData(false);
      setLoadingHealth(false);
      return;
    }

    const loadBaseDashboardData = async () => {
      setLoadingBaseData(true);
      setBaseDataError("");

      try {
        const [budgetResponse, transactionResponse] = await Promise.all([
          API.get("/budget/get"),
          API.get("/transaction/get"),
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
          .sort((a, b) => b.localeCompare(a));

        setBudgetLimitsByPeriod(budgetMap);
        setAvailablePeriods(periods);

        if (periods.length > 0) {
          setSelectedPeriod(periods[0]);
        } else {
          setHealth(null);
          setLoadingHealth(false);
        }

        setTransactions(transactionResponse.data || []);

        try {
          const subscriptionsResponse = await API.get("/subscription/detect");
          const subscriptions = subscriptionsResponse.data || [];
          const totalMonthly = subscriptions.reduce(
            (sum, item) => sum + Number(item.amount || 0),
            0,
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
      } catch {
        setBaseDataError("Could not load dashboard data.");
        setHealthError("Could not load dashboard data.");
        setHealth(null);
        setAvailablePeriods([]);
        setBudgetLimitsByPeriod({});
        setTransactions([]);
        setLoadingHealth(false);
      } finally {
        setLoadingBaseData(false);
      }
    };

    loadBaseDashboardData();
  }, [token]);

  useEffect(() => {
    if (!selectedPeriod || !token) {
      return;
    }

    const loadHealth = async () => {
      setLoadingHealth(true);
      setHealthError("");
      setHealth(null);

      try {
        const response = await API.get(`/analytics/financial-health/${selectedPeriod}`);
        setHealth(response.data);
      } catch (error) {
        const detail = error?.response?.data?.detail;
        setHealth(null);
        setHealthError(detail || "Unable to load financial health for this period.");
      } finally {
        setLoadingHealth(false);
      }
    };

    loadHealth();
  }, [selectedPeriod, token]);

  const selectedBudgetLimit = selectedPeriod ? budgetLimitsByPeriod[selectedPeriod] ?? null : null;
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
    />
  );
}

export default Dashboard;
