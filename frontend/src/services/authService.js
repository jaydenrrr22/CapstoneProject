import apiClient from "../api/client";

// Login
export const loginUser = async (credentials) => {
  const response = await apiClient.post("/auth/login", credentials);

  // save token automatically on successful login
  localStorage.setItem("token", response.data.access_token);

  return response.data;
};

// Register
export const registerUser = async (userData) => {
  const response = await apiClient.post("/auth/register", userData);
  return response.data;
};