import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import API from "../services/api";
import "../components/dashboard/DashboardLayouts.css";
import "./Subpages.css";

function Budgets() {
  const { logout } = useAuth();

  const [budgets, setBudgets] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [saving, setSaving] = useState(false);

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
      const detail = requestError?.response?.data?.detail;
      setError(detail || "Could not load budgets.");
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
      const detail = requestError?.response?.data?.detail;
      setError(detail || "Could not create budget.");
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

  return (
    <div className="dashboard-shell desktop-shell">
      <header className="desktop-top-nav card-surface">
        <div>
          <p className="eyebrow">Financial Workspace</p>
          <h1>Budgets</h1>
        </div>

        <nav className="desktop-links" aria-label="Primary">
          <Link to="/dashboard">Home</Link>
          <Link to="/transactions">Transactions</Link>
          <Link to="/subscriptions">Subscriptions</Link>
          <Link to="/budgets">Budgets</Link>
        </nav>

        <button className="action-btn" onClick={() => logout()}>Logout</button>
      </header>

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
            <div className="subpage-table">
              <div className="subpage-table-head">
                <span>Period</span>
                <span>Amount</span>
                <span>Actions</span>
              </div>

              {budgets.map((budget) => (
                <div key={budget.id} className="subpage-table-row">
                  <span>{budget.period}</span>
                  <span>${Number(budget.amount).toFixed(2)}</span>
                  <button
                    className="subpage-inline-btn"
                    type="button"
                    onClick={() => loadProgressForPeriod(budget.period)}
                  >
                    View Progress
                  </button>
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
