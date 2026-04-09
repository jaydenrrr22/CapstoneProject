import { normalizeApiError } from "./normalizeApiError";

export const GLOBAL_API_ERROR_EVENT = "trace:api-error";

export function emitGlobalApiError(error, fallbackMessage = "Something went wrong while contacting the server.") {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(GLOBAL_API_ERROR_EVENT, {
    detail: {
      message: normalizeApiError(error, fallbackMessage),
    },
  }));
}
