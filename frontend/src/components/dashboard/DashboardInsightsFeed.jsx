function DashboardInsightsFeed({
  items = [],
  maxItems,
  title = "Insights Feed",
}) {
  const visibleItems = typeof maxItems === "number" ? items.slice(0, maxItems) : items;

  return (
    <section className="dashboard-feed card-surface" aria-label={title}>
      <div className="section-heading dashboard-feed__heading">
        <div>
          <p className="eyebrow">Intelligence</p>
          <h3>{title}</h3>
        </div>
        <span className="dashboard-feed__count">{visibleItems.length} live</span>
      </div>

      {visibleItems.length === 0 ? (
        <p className="muted">New intelligence will appear here as Trace evaluates spending patterns.</p>
      ) : (
        <div className="dashboard-feed__list">
          {visibleItems.map((item, index) => (
            <article
              key={`${item.kind || "item"}-${index}`}
              className={`dashboard-feed__item dashboard-feed__item--${item.tone || "neutral"}`}
            >
              <div className="dashboard-feed__item-head">
                <strong>{item.title}</strong>
                <span>{item.kind === "action" ? "Next step" : "Signal"}</span>
              </div>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default DashboardInsightsFeed;

