import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useDemoMode from "../../hooks/useDemoMode";
import "./DemoWalkthrough.css";

const STEPS = [
  {
    title: "This is your forecast",
    description: "Use the horizon toggle to see how spending pace changes your projected month-end outcome.",
  },
  {
    title: "These are your subscriptions",
    description: "Recurring services are summarized so you can quickly spot duplicate or high-cost charges.",
  },
  {
    title: "Watch trend direction",
    description: "Trend cards and prediction panels highlight where spending may drift next so you can tell a demo story fast.",
  },
];

function DemoWalkthrough() {
  const navigate = useNavigate();
  const { dismissWalkthrough, isDemoMode, selectNormalMode, walkthroughDismissed } = useDemoMode();
  const [stepIndex, setStepIndex] = useState(0);

  const step = useMemo(() => STEPS[stepIndex], [stepIndex]);

  if (!isDemoMode || walkthroughDismissed) {
    return null;
  }

  const isLastStep = stepIndex === STEPS.length - 1;

  return (
    <aside className="demo-walkthrough" aria-live="polite">
      <p className="demo-walkthrough__eyebrow">Guided Demo</p>
      <div className="demo-walkthrough__body">
        <h3>{step.title}</h3>
        <p>{step.description}</p>
        <p>{stepIndex + 1} of {STEPS.length}</p>
      </div>

      <div className="demo-walkthrough__actions">
        <button
          type="button"
          className="demo-walkthrough__exit"
          onClick={() => {
            selectNormalMode();
            navigate("/dashboard", { replace: true });
          }}
        >
          Exit Demo
        </button>
        <button type="button" onClick={dismissWalkthrough}>Dismiss</button>
        <button
          type="button"
          onClick={() => {
            if (isLastStep) {
              dismissWalkthrough();
              return;
            }

            setStepIndex((current) => current + 1);
          }}
        >
          {isLastStep ? "Finish" : "Next"}
        </button>
      </div>
    </aside>
  );
}

export default DemoWalkthrough;
