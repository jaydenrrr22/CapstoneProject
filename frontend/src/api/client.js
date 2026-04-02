import axios from "axios";

const rawApiBase = import.meta.env.VITE_API_BASE_URL || "/api";
const isProduction = !import.meta.env.DEV;
const isLoopbackBase =
  rawApiBase.includes("127.0.0.1") ||
  rawApiBase.includes("localhost") ||
  rawApiBase.includes("[::1]") ||
  rawApiBase.includes("::1");
const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "::1");
const resolvedApiBase =
  isProduction && isLoopbackBase
    ? "/api"
    : rawApiBase;
const apiBaseUrl =
  resolvedApiBase.startsWith("http://") && !isLocalhost
    ? resolvedApiBase.replace("http://", "https://")
    : resolvedApiBase;

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      console.warn("Unauthorized - redirecting to login");

      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default apiClient;
