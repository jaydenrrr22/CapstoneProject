import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useAddTransaction from "../hooks/useAddTransaction";
import useDemoMode from "../hooks/useDemoMode";
import "./AddTransactionModal.css";

function FAB() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { isDemoMode } = useDemoMode();
  const { isOpen, openAddTransaction } = useAddTransaction();

  const hideOnRoutes = ["/", "/login", "/signup"];
  const showFab = (isAuthenticated || isDemoMode)
    && !hideOnRoutes.includes(location.pathname)
    && !isOpen;

  if (!showFab || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <button
      type="button"
      className="add-transaction-fab"
      aria-label="Add transaction"
      onClick={openAddTransaction}
    >
      <span className="add-transaction-fab__icon">+</span>
      <span className="add-transaction-fab__label">Add transaction</span>
    </button>,
    document.body,
  );
}

export default FAB;

