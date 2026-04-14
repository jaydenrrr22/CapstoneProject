import { useContext } from "react";
import { AddTransactionContext } from "../context/addTransactionContextValue";

export default function useAddTransaction() {
  const context = useContext(AddTransactionContext);

  if (!context) {
    throw new Error("useAddTransaction must be used within AddTransactionProvider.");
  }

  return context;
}

