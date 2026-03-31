import { useEffect, useState } from "react";
import API from "../services/api";
import "../components/dashboard/DashboardLayouts.css";
import "./Subpages.css";
import { normalizeApiError } from "../utils/normalizeApiError";

function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [saving, setSaving] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [editingAmount, setEditingAmount] = useState("");
  const [rowActionLoadingId, setRowActionLoadingId] = useState(null);

  const loadBudgets = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await API.get("/budget/get");
      const list = [...response.data].sort((a, b) => b.period.localeCompare(a.period));
      setBudgets(list);

      if (list.length > 0) {
        const targetPeriod = list[0].period;
        const progressResponse = await API.get(`/budget/progress/${targetPeriod}`);
        setProgress(progressResponse.data);
      } else {
        setProgress(null);
      }
    } catch (requestError) {
      setError(normalizeApiError(requestError, "Failed to load budgets."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  const createBudget = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await API.post("/budget/create", {
        amount: Number(amount),
        period,
      });

      setAmount("");
      await loadBudgets();
    } catch (requestError) {
      setError(normalizeApiError(requestError, "Could not create budget."));
    } finally {
      setSaving(false);
    }
  };

  const loadProgressForPeriod = async (targetPeriod) => {
    try {
      const response = await API.get(`/budget/progress/${targetPeriod}`);
      setProgress(response.data);
    } catch {
      setProgress(null);
    }
  };

  const startEditingBudget = (budget) => {
    setEditingBudgetId(budget.id);
    setEditingAmount(String(Number(budget.amount).toFixed(2)));
  };

  const cancelEditingBudget = () => {
    setEditingBudgetId(null);
    setEditingAmount("");
  };

  const saveBudgetAmount = async (budget) => {
    const nextAmount = Number(editingAmount);
    if (!Number.isFinite(nextAmount) || nextAmount <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    setError("");
    setRowActionLoadingId(budget.id);

    try {
      await API.put(`/budget/update/${budget.id}`, {
        amount: nextAmount,
        period: budget.period,
      });
      await loadBudgets();
      await loadProgressForPeriod(budget.period);
      cancelEditingBudget();
    } catch (requestError) {
      setError(normalizeApiError(requestError, "Could not update budget."));
    } finally {
      setRowActionLoadingId(null);
    }
  };

  const deleteBudget = async (budgetId) => {
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
    } catch (requestError) {
      setError(normalizeApiError(requestError, "Could not delete budget."));
    } finally {
      setRowActionLoadingId(null);
    }
  };

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

            <button className="subpage-submit" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Budget"}
            </button>
          </form>

          {progress && (
            <div className="subpage-metric-card">
              <h4>Current Progress ({progress.month})</h4>
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
                      >
                        Edit
                      </button>
                    )}

                    <button
                      className="subpage-inline-btn danger"
                      type="button"
                      onClick={() => deleteBudget(budget.id)}
                      disabled={rowActionLoadingId === budget.id}
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
