import { useEffect, useState } from "react";
import { GLOBAL_API_ERROR_EVENT } from "../utils/globalErrors";

function GlobalErrorBanner() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    let timeoutId = null;

    const showMessage = (nextMessage) => {
      if (!nextMessage) {
        return;
      }

      setMessage(nextMessage);

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(() => {
        setMessage("");
      }, 6000);
    };

    const handleApiError = (event) => {
      showMessage(event.detail?.message || "Something went wrong while contacting the server.");
    };

    const handleUnhandledRejection = (event) => {
      const rejectionMessage = event.reason?.response?.data?.detail
        || event.reason?.message
        || "";

      if (rejectionMessage) {
        showMessage(rejectionMessage);
      }
    };

    window.addEventListener(GLOBAL_API_ERROR_EVENT, handleApiError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      window.removeEventListener(GLOBAL_API_ERROR_EVENT, handleApiError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  if (!message) {
    return null;
  }

  return (
    <div className="global-error-banner" role="alert" aria-live="assertive">
      <span>{message}</span>
      <button type="button" onClick={() => setMessage("")}>Dismiss</button>
    </div>
  );
}

export default GlobalErrorBanner;

