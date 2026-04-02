import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useDemoMode from "../hooks/useDemoMode";
import { DEMO_DATASETS } from "../demo/demoDatasets";
import "./ModeSelection.css";

function ModeSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    hasSelectedMode,
    needsModeSelection,
    selectedDemoDataset,
    selectDemoMode,
    selectNormalMode,
    setSelectedDemoDataset,
  } = useDemoMode();

  const destination = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (hasSelectedMode || !needsModeSelection) {
      navigate(destination, { replace: true });
    }
  }, [destination, hasSelectedMode, navigate, needsModeSelection]);

  return (
    <div className="mode-select-page">
      <div className="mode-select-shell">
        <header className="mode-select-header">
          <p className="mode-select-eyebrow">Choose Your Experience</p>
          <h1>Use Trace your way</h1>
          <p>
            Start a guided classroom demo with curated financial stories, or continue normally and work with your own account data.
          </p>
        </header>

        <div className="mode-select-grid">
          <section className="mode-card mode-card--demo">
            <div className="mode-card__stack">
              <h2>Start Demo</h2>
              <p>Explore a guided financial demo with sample data.</p>
            </div>

            <div className="dataset-picker" aria-label="Demo datasets">
              {DEMO_DATASETS.map((dataset) => (
                <button
                  key={dataset.id}
                  type="button"
                  className={dataset.id === selectedDemoDataset ? "active" : ""}
                  onClick={() => setSelectedDemoDataset(dataset.id)}
                >
                  <strong>{dataset.label}</strong>
                  <span>{dataset.shortDescription}</span>
                </button>
              ))}
            </div>

            <div className="mode-card__actions">
              <button
                type="button"
                onClick={() => {
                  selectDemoMode(selectedDemoDataset);
                  navigate(destination, { replace: true });
                }}
              >
                Launch Demo
              </button>
              <button type="button" onClick={() => setSelectedDemoDataset(DEMO_DATASETS[0].id)}>
                Reset Dataset
              </button>
            </div>
          </section>

          <section className="mode-card">
            <div className="mode-card__stack">
              <h2>Continue Normally</h2>
              <p>Use your own financial data.</p>
            </div>

            <div className="mode-card__highlights">
              <div>
                <strong>Real account workflows</strong>
                <span>Budgets, transactions, subscriptions, and intelligence all come from your live app data.</span>
              </div>
              <div>
                <strong>No sample injection</strong>
                <span>The app behaves exactly as it normally would for day-to-day usage.</span>
              </div>
            </div>

            <div className="mode-card__actions">
              <button
                type="button"
                onClick={() => {
                  selectNormalMode();
                  navigate(destination, { replace: true });
                }}
              >
                Continue
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ModeSelection;
