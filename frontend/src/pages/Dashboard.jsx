import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import useIsMobile from "../hooks/useIsMobile";
import API from "../services/api";
import MobileDashboard from "../components/dashboard/MobileDashboard";
import DesktopDashboard from "../components/dashboard/DesktopDashboard";

function Dashboard() {
  const { logout, token } = useAuth();
  const isMobile = useIsMobile(768);

  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState("");
  const [loadingHealth, setLoadingHealth] = useState(true);

  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");

  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (!token) {
      setLoadingHealth(false);
      return;
    }

    const loadBaseDashboardData = async () => {
      try {
        const [budgetResponse, transactionResponse] = await Promise.all([
          API.get("/budget/get"),
          API.get("/transaction/get"),
        ]);

        const periods = [...new Set((budgetResponse.data || []).map((budget) => budget.period))]
          .sort((a, b) => b.localeCompare(a));

        setAvailablePeriods(periods);

        if (periods.length > 0) {
          setSelectedPeriod(periods[0]);
        } else {
          setHealth(null);
          setHealthError("No budget found yet. Create one in Budgets to activate financial health.");
          setLoadingHealth(false);
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
      } catch {
        setHealthError("Could not load dashboard data.");
        setLoadingHealth(false);
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
        onLogout={() => logout()}
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
      onLogout={() => logout()}
    />
  );
}

export default Dashboard;