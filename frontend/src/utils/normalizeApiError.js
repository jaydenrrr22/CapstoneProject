// Standardized API error handler for consistent UI messages
export const normalizeApiError = (error, fallbackMessage = "Something went wrong.") => {
  if (error?.code === "ERR_NETWORK") {
    return "Unable to reach the server. Please check your connection and try again.";
  }

  if (error?.code === "ECONNABORTED") {
    return "The request timed out. Please try again.";
  }

  const detail = error?.response?.data?.detail;

  // Case 1: simple string
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  // Case 2: array of errors (FastAPI validation)
  if (Array.isArray(detail)) {
    const joined = detail
      .map((item) => {
        if (typeof item === "string") return item;

        if (item && typeof item === "object") {
          return item.msg || item.message || JSON.stringify(item);
        }

        return "";
      })
      .filter(Boolean)
      .join(". ");

    if (joined) return joined;
  }

  // Case 3: object
  if (detail && typeof detail === "object") {
    return detail.message || fallbackMessage;
  }

  // Default fallback
  return error?.message || fallbackMessage;
};

