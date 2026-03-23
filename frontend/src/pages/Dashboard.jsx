import { useCallback, useEffect, useRef, useState } from "react";
import useAuth from "../hooks/useAuth";
import useIsMobile from "../hooks/useIsMobile";
import API from "../services/api";
import MobileDashboard from "../components/dashboard/MobileDashboard";
import DesktopDashboard from "../components/dashboard/DesktopDashboard";
import { DASHBOARD_REFRESH_EVENT } from "../constants/events";

function Dashboard() {
  const { token } = useAuth();
  const isMobile = useIsMobile(768);
  const skipNextHealthLoadRef = useRef(false);

  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState("");
  const [loadingHealth, setLoadingHealth] = useState(true);

  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [subscriptionInsight, setSubscriptionInsight] = useState({
    count: 0,
    totalMonthly: 0,
  });

  const loadSubscriptionInsight = useCallback(async () => {
    try {
      const subscriptionsResponse = await API.get("/subscription/detect");
      const subscriptions = subscriptionsResponse.data || [];
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

  const loadBaseDashboardData = useCallback(async (preferredPeriod = "", shouldSyncSelectedPeriod = true) => {
    try {
      const [budgetResponse, transactionResponse] = await Promise.all([
        API.get("/budget/get"),
        API.get("/transaction/get"),
      ]);

      const periods = [...new Set((budgetResponse.data || []).map((budget) => budget.period))]
        .sort((a, b) => b.localeCompare(a));

      setAvailablePeriods(periods);

      if (periods.length === 0) {
        setSelectedPeriod("");
        setHealth(null);
        setHealthError("No budget found yet. Create one in Budgets to activate financial health.");
        setLoadingHealth(false);
      }

      const resolvedPeriod = periods.length === 0
        ? ""
        : periods.includes(preferredPeriod)
          ? preferredPeriod
          : periods[0];

      if (shouldSyncSelectedPeriod && resolvedPeriod) {
        setSelectedPeriod(resolvedPeriod);
      }

      const recentTransactions = (transactionResponse.data || [])
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)
        .map((tx) => ({
          id: tx.id,
          name: tx.store_name,
          amount: Number(tx.cost),
        }));

      setTransactions(recentTransactions);
      await loadSubscriptionInsight();

      return resolvedPeriod;
    } catch {
      setHealthError("Could not load dashboard data.");
      setLoadingHealth(false);
      return "";
    }
  }, [loadSubscriptionInsight]);

  const loadHealth = useCallback(async (period) => {
    if (!period || !token) {
      return;
    }

    setLoadingHealth(true);
    setHealthError("");

    try {
      const response = await API.get(`/analytics/financial-health/${period}`);
      setHealth(response.data);
    } catch (error) {
      const detail = error?.response?.data?.detail;
      setHealth(null);
      setHealthError(detail || "Unable to load financial health for this period.");
    } finally {
      setLoadingHealth(false);
    }
  }, [token]);

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
    if (!token) {
      return;
    }

    const handleDashboardRefresh = async () => {
      const resolvedPeriod = await loadBaseDashboardData(selectedPeriod, false);

      if (resolvedPeriod) {
        if (resolvedPeriod !== selectedPeriod) {
          skipNextHealthLoadRef.current = true;
          setSelectedPeriod(resolvedPeriod);
        }

        await loadHealth(resolvedPeriod);
      }
    };

    window.addEventListener(DASHBOARD_REFRESH_EVENT, handleDashboardRefresh);

    return () => {
      window.removeEventListener(DASHBOARD_REFRESH_EVENT, handleDashboardRefresh);
    };
  }, [loadBaseDashboardData, loadHealth, selectedPeriod, token]);

  if (isMobile) {
    return (
      <MobileDashboard
        loadingHealth={loadingHealth}
        healthError={healthError}
        health={health}
        selectedPeriod={selectedPeriod}
        availablePeriods={availablePeriods}
        onPeriodChange={setSelectedPeriod}
        transactions={transactions}
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
      transactions={transactions}
      subscriptionInsight={subscriptionInsight}
    />
  );
}

export default Dashboard;
