import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { IntelligenceProvider } from "./context/IntelligenceContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <IntelligenceProvider>
      <App />
    </IntelligenceProvider>
  </StrictMode>
);