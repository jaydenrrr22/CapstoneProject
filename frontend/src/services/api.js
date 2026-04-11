import axios from "axios";
import { getStoredToken, clearStoredToken } from "./tokenService";
import { emitGlobalApiError } from "../utils/globalErrors";
import { isDemoModeEnabled } from "../demo/storage";

const API = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request automatically
API.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    const isDemoRequest = isDemoModeEnabled() && !token;
    const method = String(config.method || "get").toLowerCase();
    const isWriteMethod = ["post", "put", "patch", "delete"].includes(method);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (isDemoModeEnabled()) {
      config.headers["X-Trace-Demo-Mode"] = "true";
    }

    if (isDemoRequest) {
      config.headers["X-Trace-Demo-Session"] = "local-only";
    }

    if (isDemoModeEnabled() && isWriteMethod) {
      const error = new Error("Demo mode blocks backend writes")
      error.name = "DemoWriteBlockedError";
      throw error;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Global response interceptor for centralized error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const hasToken = Boolean(getStoredToken());
    const isDemoSession = isDemoModeEnabled() && !hasToken;

    // Handle unauthorized access globally
    if (status === 401) {
      if (isDemoSession) {
        return Promise.reject(error);
      }

      console.warn("Unauthorized - redirecting to login");

      // Clear invalid/expired token
      clearStoredToken();

      // Notify app to redirect (handled in AuthProvider)
      window.dispatchEvent(new Event("auth:unauthorized"));
      return Promise.reject(error);
    }

    if (!status || status >= 500) {
      emitGlobalApiError(error);
    }

    // Let components handle all other errors (400, 403, 500, etc.)
    return Promise.reject(error);
  }
);

export default API;
