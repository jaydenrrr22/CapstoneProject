import { useMemo, useState } from "react";
import { AddTransactionContext } from "./addTransactionContextValue";

export function AddTransactionProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo(() => ({
    closeAddTransaction: () => setIsOpen(false),
    isOpen,
    openAddTransaction: () => setIsOpen(true),
  }), [isOpen]);

  return (
    <AddTransactionContext.Provider value={value}>
      {children}
    </AddTransactionContext.Provider>
  );
}

