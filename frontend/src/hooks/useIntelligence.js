import { useContext } from "react";
import { IntelligenceContext } from "../context/intelligenceContext";

export default function useIntelligence() {
  return useContext(IntelligenceContext);
}
