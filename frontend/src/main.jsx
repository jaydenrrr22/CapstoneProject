import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { IntelligenceProvider } from "./context/IntelligenceContext.jsx";
import { DemoModeProvider } from "./context/DemoModeProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <DemoModeProvider>
      <IntelligenceProvider>
        <App />
      </IntelligenceProvider>
    </DemoModeProvider>
  </StrictMode>
);

