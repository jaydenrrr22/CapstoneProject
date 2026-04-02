import { useCallback, useEffect, useMemo, useState } from "react";
import DemoModeContext from "./demoModeContext";
import { getDemoDatasetById } from "../demo/demoDatasets";

const MODE_SELECTION_KEY = "trace_mode_selection";
const DEMO_MODE_KEY = "trace_is_demo_mode";
const DATASET_KEY = "trace_demo_dataset";
const WALKTHROUGH_KEY = "trace_demo_walkthrough_dismissed";
const MODE_ONBOARDING_KEY = "trace_mode_onboarding_pending";

export function DemoModeProvider({ children }) {
  const [hasSelectedMode, setHasSelectedMode] = useState(
    () => window.localStorage.getItem(MODE_SELECTION_KEY) === "true"
  );
  const [needsModeSelection, setNeedsModeSelection] = useState(
    () => window.localStorage.getItem(MODE_ONBOARDING_KEY) === "true"
  );
  const [isDemoMode, setIsDemoMode] = useState(
    () => window.localStorage.getItem(DEMO_MODE_KEY) === "true"
  );
  const [selectedDemoDataset, setSelectedDemoDataset] = useState(
    () => window.localStorage.getItem(DATASET_KEY) || "college-student"
  );
  const [walkthroughDismissed, setWalkthroughDismissed] = useState(
    () => window.localStorage.getItem(WALKTHROUGH_KEY) === "true"
  );

  useEffect(() => {
    window.localStorage.setItem(MODE_SELECTION_KEY, String(hasSelectedMode));
  }, [hasSelectedMode]);

  useEffect(() => {
    window.localStorage.setItem(MODE_ONBOARDING_KEY, String(needsModeSelection));
  }, [needsModeSelection]);

  useEffect(() => {
    window.localStorage.setItem(DEMO_MODE_KEY, String(isDemoMode));
  }, [isDemoMode]);

  useEffect(() => {
    window.localStorage.setItem(DATASET_KEY, selectedDemoDataset);
  }, [selectedDemoDataset]);

  useEffect(() => {
    window.localStorage.setItem(WALKTHROUGH_KEY, String(walkthroughDismissed));
  }, [walkthroughDismissed]);

  const selectDemoMode = useCallback((datasetId) => {
    window.localStorage.setItem(MODE_SELECTION_KEY, "true");
    window.localStorage.setItem(MODE_ONBOARDING_KEY, "false");
    window.localStorage.setItem(DEMO_MODE_KEY, "true");
    window.localStorage.setItem(DATASET_KEY, datasetId);
    window.localStorage.setItem(WALKTHROUGH_KEY, "false");
    setHasSelectedMode(true);
    setNeedsModeSelection(false);
    setIsDemoMode(true);
    setSelectedDemoDataset(datasetId);
    setWalkthroughDismissed(false);
  }, []);

  const selectNormalMode = useCallback(() => {
    window.localStorage.setItem(MODE_SELECTION_KEY, "true");
    window.localStorage.setItem(MODE_ONBOARDING_KEY, "false");
    window.localStorage.setItem(DEMO_MODE_KEY, "false");
    setHasSelectedMode(true);
    setNeedsModeSelection(false);
    setIsDemoMode(false);
  }, []);

  const resetModeSelection = useCallback(() => {
    window.localStorage.setItem(MODE_SELECTION_KEY, "false");
    window.localStorage.setItem(DEMO_MODE_KEY, "false");
    window.localStorage.setItem(MODE_ONBOARDING_KEY, "false");
    setHasSelectedMode(false);
    setIsDemoMode(false);
    setNeedsModeSelection(false);
  }, []);

  const beginModeOnboarding = useCallback(() => {
    window.localStorage.setItem(MODE_SELECTION_KEY, "false");
    window.localStorage.setItem(DEMO_MODE_KEY, "false");
    window.localStorage.setItem(MODE_ONBOARDING_KEY, "true");
    window.localStorage.setItem(WALKTHROUGH_KEY, "false");
    setHasSelectedMode(false);
    setIsDemoMode(false);
    setNeedsModeSelection(true);
    setWalkthroughDismissed(false);
  }, []);

  const dismissWalkthrough = useCallback(() => {
    setWalkthroughDismissed(true);
  }, []);

  const value = useMemo(
    () => ({
      currentDataset: isDemoMode ? getDemoDatasetById(selectedDemoDataset) : null,
      beginModeOnboarding,
      dismissWalkthrough,
      hasSelectedMode,
      isDemoMode,
      needsModeSelection,
      resetModeSelection,
      selectDemoMode,
      selectedDemoDataset,
      selectNormalMode,
      setSelectedDemoDataset,
      walkthroughDismissed,
    }),
    [
      beginModeOnboarding,
      dismissWalkthrough,
      hasSelectedMode,
      isDemoMode,
      needsModeSelection,
      resetModeSelection,
      selectDemoMode,
      selectedDemoDataset,
      selectNormalMode,
      walkthroughDismissed,
    ]
  );

  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>;
}
