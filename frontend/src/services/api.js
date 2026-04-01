import axios from "axios";
import { getStoredToken, clearStoredToken } from "./tokenService";

const rawApiBase = import.meta.env.VITE_API_BASE_URL || "/api";

let apiBaseUrl = rawApiBase;

if (rawApiBase.startsWith("http://")) {
  try {
    const url = new URL(rawApiBase);
    const hostname = url.hostname;
    const isLocalhost =
      hostname === "localhost" || hostname === "127.0.0.1";

    // Only enforce HTTPS in non-dev, non-localhost contexts
    if (!import.meta.env.DEV && !isLocalhost) {
      apiBaseUrl = rawApiBase.replace("http://", "https://");
    }
  } catch {
    // If parsing fails, leave the base URL unchanged
    apiBaseUrl = rawApiBase;
  }
}
const API = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request automatically
API.interceptors.request.use(
  (config) => {
    const token = getStoredToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

    // Handle unauthorized access globally
    if (status === 401) {
      console.warn("Unauthorized - redirecting to login");

      // Clear invalid/expired token
      clearStoredToken();

      // Notify app to redirect (handled in AuthProvider)
      window.dispatchEvent(new Event("auth:unauthorized"));
    }

    // Let components handle all other errors (400, 403, 500, etc.)
    return Promise.reject(error);
  }
);

export default API;