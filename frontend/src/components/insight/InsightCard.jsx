import { useEffect, useId, useRef, useState } from "react";
import "./InsightCard.css";

function InsightCard({
  title = "Insight",
  value = "",
  description = "",
  status = "neutral",
  icon = null,
  children = null,
  action = null,
  collapsible,
  defaultExpanded = false,
  className = "",
}) {
  const detailsId = useId();
  const detailsRef = useRef(null);
  const isCollapsible = typeof collapsible === "boolean" ? collapsible : Boolean(children);
  const [expanded, setExpanded] = useState(defaultExpanded || !isCollapsible);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (!isCollapsible || !expanded || !detailsRef.current) {
      return;
    }

    const updateHeight = () => {
      if (detailsRef.current) {
        setContentHeight(detailsRef.current.scrollHeight);
      }
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(detailsRef.current);

    return () => {
      observer.disconnect();
    };
  }, [children, expanded, isCollapsible]);

  const resolvedStatus = ["positive", "warning", "negative", "neutral"].includes(status)
    ? status
    : "neutral";

  return (
    <article className={`insight-card insight-card--${resolvedStatus}${className ? ` ${className}` : ""}`}>
      <div className="insight-card__header">
        <div className="insight-card__heading">
          {icon ? <div className="insight-card__icon">{icon}</div> : null}

          <div className="insight-card__title-block">
            <h3 className="insight-card__title">{title || "Insight"}</h3>
            {description ? <p className="insight-card__description">{description}</p> : null}
          </div>
        </div>

        {(action || isCollapsible) ? (
          <div className="insight-card__actions">
            {action ? <div className="insight-card__action">{action}</div> : null}
            {isCollapsible ? (
              <button
                type="button"
                className="insight-card__toggle"
                aria-expanded={expanded}
                aria-controls={detailsId}
                onClick={() => setExpanded((previousValue) => !previousValue)}
              >
                {expanded ? "Hide details" : "Show details"}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {value !== null && value !== undefined && value !== "" ? (
        <p className="insight-card__value">{value}</p>
      ) : null}

      {children ? (
        isCollapsible ? (
          <div
            id={detailsId}
            className={`insight-card__details${expanded ? " is-open" : ""}`}
            style={{ height: expanded ? (contentHeight > 0 ? `${contentHeight}px` : "auto") : "0px" }}
          >
            <div ref={detailsRef} className="insight-card__details-inner">
              {children}
            </div>
          </div>
        ) : (
          <div id={detailsId} className="insight-card__details-inner">
            {children}
          </div>
        )
      ) : null}
    </article>
  );
}

export default InsightCard;

