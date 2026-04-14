import { useMemo, useState } from "react";
import { IntelligenceContext } from "./intelligenceContext";

export const IntelligenceProvider = ({ children }) => {
  const [predictions, setPredictions] = useState(null);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [predictionError, setPredictionError] = useState("");

  const value = useMemo(
    () => ({
      predictions,
      setPredictions,
      loadingPredictions,
      setLoadingPredictions,
      predictionError,
      setPredictionError,
    }),
    [
      predictions,
      loadingPredictions,
      predictionError,
    ]
  );

  return (
    <IntelligenceContext.Provider value={value}>
      {children}
    </IntelligenceContext.Provider>
  );
};

