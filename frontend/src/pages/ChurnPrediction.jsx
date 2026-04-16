import { useState } from "react";
import API from "../services/api";
import AppBreadcrumbs from "../components/AppBreadcrumbs";
import { PredictionIcon } from "../components/insight/InsightIcons";
import { normalizeApiError } from "../utils/normalizeApiError";
import "../components/dashboard/DashboardLayouts.css";
import "./Subpages.css";
import "./ChurnPrediction.css";

function buildPredictionPayload({
  age,
  gender,
  monthsSubscribed,
  usageFrequency,
  supportCalls,
  paymentDelays,
  subscriptionType,
  contractLength,
  totalSpend,
  daysSinceLastInteraction,
}) {
  return {
    age: Number(age),
    gender,
    months_subscribed: Number(monthsSubscribed),
    usage_frequency: Number(usageFrequency),
    support_calls: Number(supportCalls),
    payment_delays: Number(paymentDelays),
    subscription_type: subscriptionType,
    contract_length: contractLength,
    total_spend: Number(totalSpend),
    days_since_last_interaction: Number(daysSinceLastInteraction),
  };
}

function formatPercent(value) {
  return `${Math.round(Number(value) || 0)}%`;
}

function ChurnPrediction() {
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [monthsSubscribed, setMonthsSubscribed] = useState("");
  const [usageFrequency, setUsageFrequency] = useState("");
  const [supportCalls, setSupportCalls] = useState("");
  const [paymentDelays, setPaymentDelays] = useState("");
  const [subscriptionType, setSubscriptionType] = useState("");
  const [contractLength, setContractLength] = useState("");
  const [totalSpend, setTotalSpend] = useState("");
  const [daysSinceLastInteraction, setDaysSinceLastInteraction] = useState("");
  const [formError, setFormError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [predictionResult, setPredictionResult] = useState({
    churnRisk: "--%",
    confidenceScore: "--%",
    summary: "Prediction output will appear here after backend and model wiring are added.",
  });
  const hasPrediction = predictionResult.churnRisk !== "--%";

  const handleSubmit = async (event) => {
    event.preventDefault();

    const fields = [
      age,
      gender,
      monthsSubscribed,
      usageFrequency,
      supportCalls,
      paymentDelays,
      subscriptionType,
      contractLength,
      totalSpend,
      daysSinceLastInteraction,
    ];

    const hasMissingField = fields.some((value) => String(value).trim() === "");

    if (hasMissingField) {
      setFormError("Please complete all fields before running the prediction.");
      return;
    }

    setFormError("");
    setRequestError("");

    const payload = buildPredictionPayload({
      age,
      gender,
      monthsSubscribed,
      usageFrequency,
      supportCalls,
      paymentDelays,
      subscriptionType,
      contractLength,
      totalSpend,
      daysSinceLastInteraction,
    });

    setIsSubmitting(true);

    try {
      const response = await API.post("/prediction/churn", payload);
      const result = response.data;

      setPredictionResult({
        churnRisk: formatPercent(result.churn_risk),
        confidenceScore: formatPercent(result.confidence_score),
        summary: result.summary,
      });
    } catch (error) {
      setRequestError(normalizeApiError(error, "Unable to run churn prediction right now."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-shell desktop-shell">
      <AppBreadcrumbs />

      <div className="subpage-single-column churn-page">
        <section className="card-surface subpage-table-panel churn-header-panel">
          <div className="section-heading">
            <div>
              <h3>Risk Assessment</h3>
              <p className="muted churn-page-description">
                Enter customer and activity information to estimate risk.
              </p>
            </div>
          </div>
        </section>

        <div className="churn-grid">
          <section className="card-surface subpage-form-panel churn-form-panel">
            <div className="section-heading">
              <div>
                <h3>Prediction Inputs</h3>
                <p className="muted transaction-entry-copy">
                  Fill in the available customer and activity fields below to run a prediction.
                </p>
              </div>
            </div>

            <form className="subpage-form churn-form" onSubmit={handleSubmit}>
              <div className="churn-form-group">
                <span className="churn-form-group__label">Demographic</span>
                <div className="churn-form-group__fields">
                  <label>
                    Age
                    <input
                      type="number"
                      value={age}
                      onChange={(event) => setAge(event.target.value)}
                      placeholder="Enter age"
                    />
                  </label>

                  <label>
                    Gender
                    <select value={gender} onChange={(event) => setGender(event.target.value)}>
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="churn-form-group">
                <span className="churn-form-group__label">Usage</span>
                <div className="churn-form-group__fields">
                  <label>
                    Months Subscribed
                    <input
                      type="number"
                      value={monthsSubscribed}
                      onChange={(event) => setMonthsSubscribed(event.target.value)}
                      placeholder="Enter months subscribed"
                    />
                  </label>

                  <label>
                    Average uses per week
                    <input
                      type="number"
                      value={usageFrequency}
                      onChange={(event) => setUsageFrequency(event.target.value)}
                      placeholder="Enter usage frequency"
                    />
                  </label>

                  <label>
                    Support contacts (last month)
                    <input
                      type="number"
                      value={supportCalls}
                      onChange={(event) => setSupportCalls(event.target.value)}
                      placeholder="Enter support calls"
                    />
                  </label>
                </div>
              </div>

              <div className="churn-form-group">
                <span className="churn-form-group__label">Financial</span>
                <div className="churn-form-group__fields">
                  <label>
                    Payment Delays
                    <input
                      type="number"
                      value={paymentDelays}
                      onChange={(event) => setPaymentDelays(event.target.value)}
                      placeholder="Enter payment delays"
                    />
                  </label>

                  <label>
                    Total Spend
                    <input
                      type="number"
                      value={totalSpend}
                      onChange={(event) => setTotalSpend(event.target.value)}
                      placeholder="Enter total spend"
                    />
                  </label>
                </div>
              </div>

              <div className="churn-form-group">
                <span className="churn-form-group__label">Contract</span>
                <div className="churn-form-group__fields">
                  <label>
                    Subscription Type
                    <select
                      value={subscriptionType}
                      onChange={(event) => setSubscriptionType(event.target.value)}
                    >
                      <option value="">Select subscription type</option>
                      <option value="Standard">Standard</option>
                      <option value="Premium">Premium</option>
                      <option value="Basic">Basic</option>
                    </select>
                  </label>

                  <label>
                    Contract Length
                    <select
                      value={contractLength}
                      onChange={(event) => setContractLength(event.target.value)}
                    >
                      <option value="">Select contract length</option>
                      <option value="Annual">Annual</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </label>

                  <label>
                    Days Since Last Interaction
                    <input
                      type="number"
                      value={daysSinceLastInteraction}
                      onChange={(event) => setDaysSinceLastInteraction(event.target.value)}
                      placeholder="Enter days since last interaction"
                    />
                  </label>
                </div>
              </div>

              <div className="churn-form__messages">
                {formError ? <p className="subpage-error">{formError}</p> : null}
                {requestError ? <p className="subpage-error">{requestError}</p> : null}
              </div>

              <div className="churn-form__actions">
                <button className="subpage-submit churn-form__submit" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Running prediction..." : "Run Prediction"}
                </button>
              </div>
            </form>
          </section>

          <section className="card-surface subpage-table-panel churn-results-panel">
            <div className="section-heading">
              <div>
                <h3>Prediction Result</h3>
              </div>
            </div>

            <div className="churn-results-stack">
              <article className="subpage-metric-card churn-result-card churn-result-card--risk">
                <span className="churn-result-card__label">Risk</span>
                <strong className={`churn-result-card__value${hasPrediction ? "" : " is-placeholder"}`}>{predictionResult.churnRisk}</strong>
              </article>

              <article className={`subpage-metric-card churn-result-card churn-result-card--summary${hasPrediction ? "" : " is-placeholder"}`}>
                <span className="churn-result-card__label">Recommendation / Summary</span>
                {hasPrediction ? (
                  <>
                    <strong>Prediction ready</strong>
                    <p className="muted">{predictionResult.summary}</p>
                  </>
                ) : (
                  <div className="churn-result-card__placeholder">
                    <div className="churn-result-card__placeholder-icon" aria-hidden="true">
                      <PredictionIcon />
                    </div>
                    <strong>Awaiting prediction</strong>
                    <p className="muted">Run the form to generate a churn-risk summary.</p>
                  </div>
                )}
              </article>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ChurnPrediction;

