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

  const handleClose = useCallback(() => {
    if (!isOpen || controller.loadingPreview || controller.saving) {
      return;
    }

    controller.setSubmitError("");
    controller.resetFormState();
    controller.closePreview({ clearSummary: true });
    closeAddTransaction();
  }, [closeAddTransaction, controller, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const modalNode = modalRef.current;
    const focusable = modalNode?.querySelectorAll(FOCUSABLE_SELECTORS);
    const firstFocusable = focusable?.[0];

    firstFocusable?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !controller.previewOpen) {
        handleClose();
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
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [controller.previewOpen, handleClose, isOpen]);

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
            onPreview={controller.handlePreview}
            onSubmit={async (event) => {
              const saved = await controller.handleSave(event);

              if (saved) {
                handleClose();
              }
            }}
            title="Add transaction"
            description="Capture an expense or income in a few fields."
            variant="modal"
            headingId="add-transaction-modal-title"
          />
        </section>
      </div>

      <DecisionModal
        open={controller.previewOpen}
        loading={controller.loadingPreview}
        busy={controller.saving}
        busyLabel="Saving transaction..."
        error={controller.simulationError}
        simulation={controller.simulation}
        title={controller.pendingTransaction?.store_name ? `Preview ${controller.pendingTransaction.store_name}` : "Preview this decision"}
        confirmLabel={controller.simulationError ? "Save Anyway" : "Save transaction"}
        cancelLabel="Close Preview"
        adjustLabel="Edit Details"
        onCancel={() => {
          if (controller.loadingPreview || controller.saving) {
            return;
          }

          controller.closePreview({ clearSummary: true });
        }}
        onAdjust={() => {
          if (controller.loadingPreview || controller.saving) {
            return;
          }

          controller.closePreview({ clearSummary: true });
        }}
        onConfirm={async () => {
          if (controller.loadingPreview || controller.saving) {
            return;
          }

          const saved = await controller.confirmPreviewSave();

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
