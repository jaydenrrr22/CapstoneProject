import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export const loginUser = async (credentials) => {
  const response = await axios.post(
    `${API_URL}/auth/login`,
    credentials
  );

  return response.data;
};

export const registerUser = async (userData) => {
  const response = await axios.post(
    "http://127.0.0.1:8000/auth/register",
    userData
  );

  return response.data;
};