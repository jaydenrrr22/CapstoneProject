export const DEMO_MODE_KEY = "trace_demo_mode";
export const DEMO_SESSION_KEY = "trace_demo_session";
export const DEMO_WALKTHROUGH_KEY = "trace_demo_walkthrough";

export const LEGACY_DEMO_KEYS = [
  "trace_mode_selection",
  "trace_is_demo_mode",
  "trace_demo_dataset",
  "trace_demo_transactions",
  "trace_demo_walkthrough_dismissed",
  "trace_mode_onboarding_pending",
];

export function isDemoModeEnabled() {
  return window.localStorage.getItem(DEMO_MODE_KEY) === "true";
}

