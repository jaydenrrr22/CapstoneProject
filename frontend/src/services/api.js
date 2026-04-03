import axios from "axios";
import { getStoredToken, clearStoredToken } from "./tokenService";

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
