import { useState } from "react";
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
  };
}

async function simulatePredictionRequest(payload) {
  return {
    churnRisk: "72%",
    confidenceScore: "81%",
    summary: "This customer may be at elevated risk of churn.",
    payload,
  };
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
  const [predictionResult, setPredictionResult] = useState({
    churnRisk: "--%",
    confidenceScore: "--%",
    summary: "Prediction output will appear here after backend and model wiring are added.",
  });

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

    const result = await simulatePredictionRequest(payload);

    setPredictionResult({
      churnRisk: result.churnRisk,
      confidenceScore: result.confidenceScore,
      summary: result.summary,
    });
  };

  return (
    <div className="dashboard-shell desktop-shell">
      <div className="subpage-single-column churn-page">
        <section className="card-surface subpage-table-panel churn-header-panel">
          <div className="section-heading">
            <div>
              <h3>Churn Prediction</h3>
              <p className="muted churn-page-description">
                Enter customer and activity information to estimate churn risk.
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
                  Fill in the available customer and activity fields below to simulate a churn prediction.
                </p>
              </div>
            </div>

            <form className="subpage-form churn-form" onSubmit={handleSubmit}>
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
                  <option value="Other">Other</option>
                </select>
              </label>

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
                Usage Frequency
                <input
                  type="number"
                  value={usageFrequency}
                  onChange={(event) => setUsageFrequency(event.target.value)}
                  placeholder="Enter usage frequency"
                />
              </label>

              <label>
                Support Calls
                <input
                  type="number"
                  value={supportCalls}
                  onChange={(event) => setSupportCalls(event.target.value)}
                  placeholder="Enter support calls"
                />
              </label>

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
                Subscription Type
                <select
                  value={subscriptionType}
                  onChange={(event) => setSubscriptionType(event.target.value)}
                >
                  <option value="">Select subscription type</option>
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                  <option value="Other">Other</option>
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
                  <option value="Other">Other</option>
                </select>
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

              <label>
                Days Since Last Interaction
                <input
                  type="number"
                  value={daysSinceLastInteraction}
                  onChange={(event) => setDaysSinceLastInteraction(event.target.value)}
                  placeholder="Enter days since last interaction"
                />
              </label>

              {formError ? <p className="subpage-error">{formError}</p> : null}

              <button className="subpage-submit" type="submit">
                Run Prediction
              </button>
            </form>
          </section>

          <section className="card-surface subpage-table-panel churn-results-panel">
            <div className="section-heading">
              <div>
                <h3>Prediction Result</h3>
                <p className="muted transaction-entry-copy">
                  This section will display the churn risk prediction once the model is connected.
                </p>
              </div>
            </div>

            <div className="churn-results-stack">
              <article className="subpage-metric-card churn-result-card">
                <span className="churn-result-card__label">Churn Risk</span>
                <strong>{predictionResult.churnRisk}</strong>
                <p className="muted">Prediction output is currently generated locally for UI testing only.</p>
              </article>

              <article className="subpage-metric-card churn-result-card">
                <span className="churn-result-card__label">Confidence Score</span>
                <strong>{predictionResult.confidenceScore}</strong>
                <p className="muted">This area will display the model confidence or probability output.</p>
              </article>

              <article className="subpage-metric-card churn-result-card">
                <span className="churn-result-card__label">Recommendation / Summary</span>
                <strong>Awaiting prediction</strong>
                <p className="muted">{predictionResult.summary}</p>
              </article>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ChurnPrediction;