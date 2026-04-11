import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useDemoMode from "../../hooks/useDemoMode";
import "./DemoWalkthrough.css";

const HIGHLIGHT_PADDING = 12;

function DemoWalkthrough() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    closeWalkthrough,
    exitDemo,
    isDemoMode,
    isWalkthroughOpen,
    nextWalkthroughStep,
    openWalkthrough,
    previousWalkthroughStep,
    walkthroughStep,
    walkthroughStepIndex,
    walkthroughSteps,
  } = useDemoMode();
  const [highlightRect, setHighlightRect] = useState(null);

  const isFirstStep = walkthroughStepIndex === 0;
  const isLastStep = walkthroughStepIndex === walkthroughSteps.length - 1;

  useEffect(() => {
    if (!isDemoMode || !isWalkthroughOpen || !walkthroughStep?.route) {
      return;
    }

    if (location.pathname !== walkthroughStep.route) {
      navigate(walkthroughStep.route, { replace: true });
    }
  }, [isDemoMode, isWalkthroughOpen, location.pathname, navigate, walkthroughStep]);

  useEffect(() => {
    if (!isDemoMode || !isWalkthroughOpen || !walkthroughStep?.selector) {
      setHighlightRect(null);
      return undefined;
    }

    let animationFrameId = 0;
    let resizeObserver = null;

    const updateHighlight = () => {
      const target = document.querySelector(walkthroughStep.selector);

      if (!target) {
        setHighlightRect(null);
        return;
      }

      const rect = target.getBoundingClientRect();

      setHighlightRect({
        height: rect.height + HIGHLIGHT_PADDING * 2,
        left: rect.left - HIGHLIGHT_PADDING,
        top: rect.top - HIGHLIGHT_PADDING,
        width: rect.width + HIGHLIGHT_PADDING * 2,
      });
    };

    const initialTarget = document.querySelector(walkthroughStep.selector);

    if (initialTarget) {
      initialTarget.scrollIntoView({
        block: "center",
        inline: "nearest",
      });
    }

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = window.requestAnimationFrame(updateHighlight);
    };

    scheduleUpdate();

    if (initialTarget && "ResizeObserver" in window) {
      resizeObserver = new window.ResizeObserver(() => {
        scheduleUpdate();
      });
      resizeObserver.observe(initialTarget);
    }

    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, true);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate, true);
    };
  }, [isDemoMode, isWalkthroughOpen, location.pathname, walkthroughStep]);

  const stepLabel = useMemo(
    () => `${walkthroughStepIndex + 1} of ${walkthroughSteps.length}`,
    [walkthroughStepIndex, walkthroughSteps.length]
  );

  if (!isDemoMode || !isWalkthroughOpen || !walkthroughStep) {
    return null;
  }

  return (
    <div className="demo-tour" aria-live="polite">
      <div className="demo-tour__backdrop" />

      {highlightRect ? (
        <div
          className="demo-tour__highlight"
          style={{
            height: `${highlightRect.height}px`,
            left: `${highlightRect.left}px`,
            top: `${highlightRect.top}px`,
            width: `${highlightRect.width}px`,
          }}
        />
      ) : null}

      <aside className="demo-tour__panel" role="dialog" aria-modal="true" aria-labelledby="demo-tour-title">
        <p className="demo-tour__eyebrow">Guided Demo</p>
        <div className="demo-tour__body">
          <h3 id="demo-tour-title">{walkthroughStep.title}</h3>
          <p>{walkthroughStep.description}</p>
          <span className="demo-tour__step-label">{stepLabel}</span>
        </div>

        <div className="demo-tour__actions">
          <button
            type="button"
            className="demo-tour__ghost"
            onClick={() => {
              closeWalkthrough();
            }}
          >
            Skip
          </button>
          <button
            type="button"
            className="demo-tour__ghost"
            onClick={() => {
              exitDemo();
              navigate("/login", { replace: true });
            }}
          >
            Exit Demo
          </button>
          <div className="demo-tour__nav-actions">
            <button
              type="button"
              className="demo-tour__secondary"
              onClick={() => {
                if (isFirstStep) {
                  openWalkthrough(0);
                  return;
                }

                previousWalkthroughStep();
              }}
              disabled={isFirstStep}
            >
              Back
            </button>
            <button
              type="button"
              className="demo-tour__primary"
              onClick={() => {
                if (isLastStep) {
                  closeWalkthrough();
                  return;
                }

                nextWalkthroughStep();
              }}
            >
              {isLastStep ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default DemoWalkthrough;
