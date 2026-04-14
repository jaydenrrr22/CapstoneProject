import { useContext } from "react";
import DemoModeContext from "../context/demoModeContext";

export default function useDemoMode() {
  return useContext(DemoModeContext);
}

