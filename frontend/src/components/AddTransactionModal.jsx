import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import DecisionModal from "./DecisionModal";
import TransactionEntryForm from "./transaction/TransactionEntryForm";
import useAddTransaction from "../hooks/useAddTransaction";
import useTransactionEntry from "../hooks/useTransactionEntry";
import "./AddTransactionModal.css";

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

function AddTransactionModal() {
  const modalRef = useRef(null);
  const { closeAddTransaction, isOpen } = useAddTransaction();
  const controller = useTransactionEntry({ active: isOpen });
  const previewOpenRef = useRef(controller.previewOpen);
  const handleCloseRef = useRef(() => {});

  const {
    closePreview,
    confirmPreviewSave,
    handlePreview,
    handleSave,
    loadingPreview,
    pendingTransaction,
    previewOpen,
    resetFormState,
    saving,
    setSubmitError,
    simulation,
    simulationError,
  } = controller;

  const handleClose = useCallback(() => {
    if (!isOpen || loadingPreview || saving) {
      return;
    }

    setSubmitError("");
    resetFormState();
    closePreview({ clearSummary: true });
    closeAddTransaction();
  }, [closeAddTransaction, closePreview, isOpen, loadingPreview, resetFormState, saving, setSubmitError]);

  useEffect(() => {
    previewOpenRef.current = previewOpen;
    handleCloseRef.current = handleClose;
  }, [handleClose, previewOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const modalNode = modalRef.current;
    const preferredFocusTarget = modalNode?.querySelector(
      "input:not([disabled]), select:not([disabled]), textarea:not([disabled])"
    );
    const fallbackFocusTarget = modalNode?.querySelector(FOCUSABLE_SELECTORS);
    const focusTarget = preferredFocusTarget || fallbackFocusTarget;

    focusTarget?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      const modalNode = modalRef.current;

      if (event.key === "Escape" && !previewOpenRef.current) {
        handleCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !modalNode) {
        return;
      }

      const focusableElements = Array.from(modalNode.querySelectorAll(FOCUSABLE_SELECTORS));

      if (focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <>
      <div
        className="add-transaction-modal__overlay"
        role="presentation"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            handleClose();
          }
        }}
      >
        <section
          ref={modalRef}
          className="add-transaction-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-transaction-modal-title"
        >
          <div className="add-transaction-modal__handle" aria-hidden="true" />
          <button
            type="button"
            className="add-transaction-modal__close"
            onClick={handleClose}
            aria-label="Close add transaction"
          >
            Close
          </button>

          <TransactionEntryForm
            controller={controller}
            onPreview={handlePreview}
            onSubmit={async (event) => {
              const saved = await handleSave(event);

              if (saved) {
                handleClose();
              }
            }}
            title="Add transaction"
            description="Capture an expense or income and predict the impact before you save it."
            variant="modal"
            headingId="add-transaction-modal-title"
          />
        </section>
      </div>

      <DecisionModal
        open={previewOpen}
        loading={loadingPreview}
        busy={saving}
        busyLabel="Saving transaction..."
        error={simulationError}
        simulation={simulation}
        title={pendingTransaction?.store_name ? `Prediction for ${pendingTransaction.store_name}` : "Prediction before saving"}
        confirmLabel={simulationError ? "Save without prediction" : "Save transaction"}
        cancelLabel="Close prediction"
        adjustLabel="Edit Details"
        onCancel={() => {
          if (loadingPreview || saving) {
            return;
          }

          closePreview();
        }}
        onAdjust={() => {
          if (loadingPreview || saving) {
            return;
          }

          closePreview();
        }}
        onConfirm={async () => {
          if (loadingPreview || saving) {
            return;
          }

          const saved = await confirmPreviewSave();

          if (saved) {
            handleClose();
          }
        }}
      />
    </>,
    document.body,
  );
}

export default AddTransactionModal;

