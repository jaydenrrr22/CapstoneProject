import { useCallback, useEffect, useState } from "react";
import API from "../services/api";
import "../components/dashboard/DashboardLayouts.css";
import "./Subpages.css";
import { normalizeApiError } from "../utils/normalizeApiError";
import { DASHBOARD_REFRESH_EVENT } from "../constants/events";
import useDemoMode from "../hooks/useDemoMode";
import { buildDemoBudgetProgress } from "../demo/demoUtils";

function Budgets() {
  const { currentDataset, isDemoMode } = useDemoMode();
  const [budgets, setBudgets] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [saving, setSaving] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [editingAmount, setEditingAmount] = useState("");
  const [editingPeriod, setEditingPeriod] = useState("");
  const [rowActionLoadingId, setRowActionLoadingId] = useState(null);
  const [progressPeriod, setProgressPeriod] = useState("");

  const loadBudgets = useCallback(async (preferredProgressPeriod = "") => {
    setLoading(true);
    setError("");

    if (isDemoMode) {
      const list = [...(currentDataset?.budget || [])].sort((a, b) => b.period.localeCompare(a.period));
      setBudgets(list);

      if (list.length > 0) {
        const targetPeriod = (preferredProgressPeriod && list.some((item) => item.period === preferredProgressPeriod))
          ? preferredProgressPeriod
          : (progressPeriod && list.some((item) => item.period === progressPeriod))
            ? progressPeriod
            : list[0].period;

        setProgressPeriod(targetPeriod);
        setProgress(buildDemoBudgetProgress(targetPeriod, list, currentDataset?.transactions || []));
      } else {
        setProgressPeriod("");
        setProgress(null);
      }

      setLoading(false);
      return;
    }

    try {
      const response = await API.get("/budget/get");
      const list = [...response.data].sort((a, b) => b.period.localeCompare(a.period));
      setBudgets(list);

      if (list.length > 0) {
        const targetPeriod = (preferredProgressPeriod && list.some((item) => item.period === preferredProgressPeriod))
          ? preferredProgressPeriod
          : (progressPeriod && list.some((item) => item.period === progressPeriod))
            ? progressPeriod
          : list[0].period;
        setProgressPeriod(targetPeriod);
        const progressResponse = await API.get(`/budget/progress/${targetPeriod}`);
        setProgress(progressResponse.data);
      } else {
        setProgressPeriod("");
        setProgress(null);
      }
    } catch (requestError) {
      setError(normalizeApiError(requestError, "Failed to load budgets."));
    } finally {
      setLoading(false);
    }
  }, [currentDataset, isDemoMode, progressPeriod]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  const createBudget = async (event) => {
    event.preventDefault();

    if (isDemoMode) {
      setError("Budget editing is disabled in demo mode so the sample story stays consistent.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await API.post("/budget/create", {
        amount: Number(amount),
        period,
      });

      setAmount("");
      await loadBudgets(period);
      window.dispatchEvent(new CustomEvent(DASHBOARD_REFRESH_EVENT));
    } catch (requestError) {
      setError(normalizeApiError(requestError, "Could not create budget."));
    } finally {
      setSaving(false);
    }
  };

  const loadProgressForPeriod = async (targetPeriod) => {
    if (isDemoMode) {
      setProgressPeriod(targetPeriod);
      setProgress(buildDemoBudgetProgress(targetPeriod, budgets, currentDataset?.transactions || []));
      return;
    }

    try {
      const response = await API.get(`/budget/progress/${targetPeriod}`);
      setProgressPeriod(targetPeriod);
      setProgress(response.data);
    } catch {
      setProgress(null);
    }
  };

  const startEditingBudget = (budget) => {
    setEditingBudgetId(budget.id);
    setEditingAmount(String(Number(budget.amount).toFixed(2)));
    setEditingPeriod(budget.period);
  };

  const cancelEditingBudget = () => {
    setEditingBudgetId(null);
    setEditingAmount("");
    setEditingPeriod("");
  };

  const saveBudgetAmount = async (budget) => {
    if (isDemoMode) {
      setError("Budget editing is disabled in demo mode so the sample story stays consistent.");
      return;
    }

    const nextAmount = Number(editingAmount);
    if (!Number.isFinite(nextAmount) || nextAmount <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(editingPeriod)) {
      setError("Please select a valid period in YYYY-MM format.");
      return;
    }

    setError("");
    setRowActionLoadingId(budget.id);

    try {
      await API.put(`/budget/update/${budget.id}`, {
        amount: nextAmount,
        period: editingPeriod,
      });
      await loadBudgets(editingPeriod);
      await loadProgressForPeriod(editingPeriod);
      window.dispatchEvent(new CustomEvent(DASHBOARD_REFRESH_EVENT));
      cancelEditingBudget();
    } catch (requestError) {
      setError(normalizeApiError(requestError, "Could not update budget."));
    } finally {
      setRowActionLoadingId(null);
    }
  };

  const deleteBudget = async (budgetId) => {
    if (isDemoMode) {
      setError("Budget editing is disabled in demo mode so the sample story stays consistent.");
      return;
    }

    if (!window.confirm("Delete this budget? This cannot be undone.")) {
      return;
    }

    setError("");
    setRowActionLoadingId(budgetId);

    try {
      await API.delete(`/budget/delete/${budgetId}`);
      await loadBudgets();
      if (editingBudgetId === budgetId) {
        cancelEditingBudget();
      }
      window.dispatchEvent(new CustomEvent(DASHBOARD_REFRESH_EVENT));
    } catch (requestError) {
      setError(normalizeApiError(requestError, "Could not delete budget."));
    } finally {
      setRowActionLoadingId(null);
    }
  };

  const progressUsed = progress ? Math.max(0, Math.min(100, Number(progress.percentage_used) || 0)) : 0;
  const progressRemainingRatio = progress
    ? Math.max(0, Math.min(100, Number((progress.remaining_balance / progress.budget_limit) * 100) || 0))
    : 0;

  return (
    <div className="dashboard-shell desktop-shell">
      <div className="subpage-grid">
        <section className="card-surface subpage-form-panel">
          <div className="section-heading">
            <h3>Create Budget</h3>
          </div>

          <form className="subpage-form" onSubmit={createBudget}>
            <label>
              Budget Amount
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1500"
                required
              />
            </label>

            <label>
              Period (YYYY-MM)
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                required
              />
            </label>

            {error && <p className="subpage-error">{error}</p>}

            {isDemoMode && (
              <p className="muted">
                Demo mode uses sample budgets tied to the selected scenario. Switch to normal mode to create or edit real budgets.
              </p>
            )}

            <button className="subpage-submit" type="submit" disabled={saving || isDemoMode}>
              {saving ? "Saving..." : "Create Budget"}
            </button>
          </form>

          {progress && (
            <div className="subpage-metric-card">
              <h4>Budget Progress ({progress.month})</h4>
              <div className="budget-progress-track" aria-label="Budget used">
                <div
                  className={`budget-progress-fill ${progress.status.toLowerCase()}`}
                  style={{ width: `${progressUsed}%` }}
                />
              </div>
              <div className="budget-progress-labels">
                <span>Used: {progressUsed.toFixed(1)}%</span>
                <span>Remaining: {progressRemainingRatio.toFixed(1)}%</span>
              </div>
              <p>Budget Limit: ${progress.budget_limit.toFixed(2)}</p>
              <p>Total Spent: ${progress.total_spent.toFixed(2)}</p>
              <p>Remaining: ${progress.remaining_balance.toFixed(2)}</p>
              <p>Status: {progress.status}</p>
            </div>
          )}
        </section>

        <section className="card-surface subpage-table-panel">
          <div className="section-heading">
            <h3>Saved Budgets</h3>
          </div>

          {budgets.length > 0 && (
            <div className="subpage-filter-row">
              <label>Progress Month:</label>
              <select
                value={progressPeriod || budgets[0].period}
                onChange={(event) => loadProgressForPeriod(event.target.value)}
              >
                {budgets.map((budget) => (
                  <option key={budget.id} value={budget.period}>{budget.period}</option>
                ))}
              </select>
            </div>
          )}

          {loading ? (
            <p className="muted">Loading budgets...</p>
          ) : error ? (
            <p className="subpage-error">{error}</p>
          ) : budgets.length === 0 ? (
            <p className="muted">No budgets yet. Create your first one.</p>
          ) : (
            <div className="subpage-table budgets-table">
              <div className="subpage-table-head budgets-table-head">
                <span>Period</span>
                <span>Amount</span>
                <span>Actions</span>
              </div>

              {budgets.map((budget) => (
                <div key={budget.id} className="subpage-table-row budgets-table-row">
                  <span>{budget.period}</span>
                  <span>
                    {editingBudgetId === budget.id ? (
                      <input
                        className="subpage-inline-input"
                        type="number"
                        min="1"
                        step="0.01"
                        value={editingAmount}
                        onChange={(event) => setEditingAmount(event.target.value)}
                      />
                    ) : (
                      `$${Number(budget.amount).toFixed(2)}`
                    )}
                  </span>
                  <div className="subpage-actions">
                    <button
                      className="subpage-inline-btn"
                      type="button"
                      onClick={() => loadProgressForPeriod(budget.period)}
                    >
                      View
                    </button>

                    {editingBudgetId === budget.id ? (
                      <>
                        <input
                          className="subpage-inline-input"
                          type="month"
                          value={editingPeriod}
                          onChange={(event) => setEditingPeriod(event.target.value)}
                        />
                        <button
                          className="subpage-inline-btn"
                          type="button"
                          onClick={() => saveBudgetAmount(budget)}
                          disabled={rowActionLoadingId === budget.id}
                        >
                          Save
                        </button>
                        <button
                          className="subpage-inline-btn ghost"
                          type="button"
                          onClick={cancelEditingBudget}
                          disabled={rowActionLoadingId === budget.id}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className="subpage-inline-btn"
                        type="button"
                        onClick={() => startEditingBudget(budget)}
                        disabled={isDemoMode}
                      >
                        Edit
                      </button>
                    )}

                    <button
                      className="subpage-inline-btn danger"
                      type="button"
                      onClick={() => deleteBudget(budget.id)}
                      disabled={rowActionLoadingId === budget.id || isDemoMode}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Budgets;
