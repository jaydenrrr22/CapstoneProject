import axios from "axios";
import { getStoredToken, clearStoredToken } from "./tokenService";

const rawApiBase = import.meta.env.VITE_API_BASE_URL || "/api";
const apiBaseUrl = rawApiBase.startsWith("http://")
  ? rawApiBase.replace("http://", "https://")
  : rawApiBase;

const API = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

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

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      console.warn("Unauthorized - redirecting to login");
      clearStoredToken();
      window.dispatchEvent(new Event("auth:unauthorized"));
    }

    return Promise.reject(error);
  }
);

export default API;