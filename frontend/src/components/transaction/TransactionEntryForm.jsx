import { NOTE_LIMIT } from "./transactionEntryLimits";
import "./TransactionEntryForm.css";

function FieldError({ error }) {
  if (!error) {
    return null;
  }

  return <p className="transaction-form__error-message">{error}</p>;
}

function TransactionEntryForm({
  controller,
  onPreview,
  onSubmit,
  title = "Add transaction",
  description = "Capture an expense or income, then predict the impact before saving.",
  variant = "page",
  headingId = undefined,
}) {
  const {
    categoryOptions,
    decisionSummary,
    fieldErrors,
    formData,
    isRecurring,
    loadingPreview,
    noteLength,
    recurrenceOptions,
    recurringFrequency,
    saving,
    setFormValue,
    setIsRecurring,
    setRecurringFrequency,
    setTransactionType,
    submitError,
    transactionType,
    transactionTypeOptions,
  } = controller;

  return (
    <form className={`transaction-form transaction-form--${variant}`} onSubmit={onPreview}>
      <div className="transaction-form__header">
        <div>
          <h3 id={headingId}>{title}</h3>
          <p>{description}</p>
        </div>
      </div>

      <section className="transaction-form__section">
        <div className="transaction-form__type-selector" role="radiogroup" aria-label="Transaction type">
          {transactionTypeOptions.map((typeOption) => {
            const isActive = transactionType === typeOption.value;
            const tone = typeOption.value === "deposit" ? "income" : "expense";

            return (
              <button
                key={typeOption.value}
                type="button"
                className={`transaction-form__type-button transaction-form__type-button--${tone}${isActive ? " is-active" : ""}`}
                aria-pressed={isActive}
                onClick={() => setTransactionType(typeOption.value)}
              >
                <strong>{typeOption.label}</strong>
                <span>{typeOption.hint}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="transaction-form__section">
        <label className="transaction-form__field">
          <span className="transaction-form__label">Merchant or source</span>
          <input
            type="text"
            value={formData.store_name}
            onChange={(event) => setFormValue("store_name", event.target.value)}
            placeholder="e.g. Target, Venmo"
            autoComplete="off"
          />
          <FieldError error={fieldErrors.store_name} />
        </label>

        <div className="transaction-form__row">
          <label className="transaction-form__field">
            <span className="transaction-form__label">Amount</span>
            <span className="transaction-form__amount-shell">
              <span className="transaction-form__amount-prefix">$</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                value={formData.cost}
                onChange={(event) => setFormValue("cost", event.target.value)}
                placeholder="0.00"
              />
            </span>
            <FieldError error={fieldErrors.cost} />
          </label>

          <label className="transaction-form__field">
            <span className="transaction-form__label">Date</span>
            <input
              type="date"
              value={formData.date}
              onChange={(event) => setFormValue("date", event.target.value)}
            />
            <FieldError error={fieldErrors.date} />
          </label>
        </div>
      </section>

      <section className="transaction-form__section">
        <label className="transaction-form__field">
          <span className="transaction-form__label">Category</span>
          <select
            value={formData.category}
            onChange={(event) => setFormValue("category", event.target.value)}
          >
            {categoryOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <FieldError error={fieldErrors.category} />
        </label>
      </section>

      <section className="transaction-form__section">
        <label className="transaction-form__field">
          <span className="transaction-form__label">Note <em>(optional)</em></span>
          <textarea
            value={formData.note}
            onChange={(event) => setFormValue("note", event.target.value)}
            placeholder="Add context - e.g. birthday dinner, client lunch..."
            rows={3}
            maxLength={NOTE_LIMIT}
          />
          <div className="transaction-form__meta-row">
            <FieldError error={fieldErrors.note} />
            <span className="transaction-form__hint">{noteLength}/{NOTE_LIMIT}</span>
          </div>
        </label>
      </section>

      <section className="transaction-form__section transaction-form__section--options">
        <div className="transaction-form__toggle-row">
          <div className="transaction-form__toggle-copy">
            <span className="transaction-form__label">Options</span>
            <strong>Mark as recurring</strong>
          </div>

          <label className="transaction-form__toggle" aria-label="Mark transaction as recurring">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(event) => setIsRecurring(event.target.checked)}
            />
            <span className="transaction-form__toggle-track" aria-hidden="true" />
          </label>
        </div>

        {isRecurring ? (
          <label className="transaction-form__field transaction-form__field--inline">
            <span className="transaction-form__label">Recurrence</span>
            <select
              value={recurringFrequency}
              onChange={(event) => setRecurringFrequency(event.target.value)}
            >
              {recurrenceOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        ) : null}
      </section>

      <section className="transaction-form__section transaction-form__section--actions">
        {submitError ? <p className="transaction-form__submit-error">{submitError}</p> : null}

        <div className="transaction-form__actions">
          <button
            type="submit"
            className="transaction-form__save"
            disabled={loadingPreview || saving}
          >
            {loadingPreview ? "Preparing prediction..." : "Predict impact"}
          </button>
          <button
            type="button"
            className="transaction-form__preview"
            onClick={onSubmit}
            disabled={loadingPreview || saving}
          >
            {saving ? "Saving..." : "Save without prediction"}
          </button>
        </div>

        <div className="transaction-form__summary-shell" aria-live="polite">
          <span className="transaction-form__summary-label">Last saved</span>
          <div className="transaction-form__summary">
            <strong>Last action</strong>
            <p>{decisionSummary || "No transaction saved yet."}</p>
          </div>
        </div>
      </section>
    </form>
  );
}

export default TransactionEntryForm;
