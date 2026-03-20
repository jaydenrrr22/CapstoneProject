import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthContext from "./authContext";
import {
  clearStoredToken,
  getStoredToken,
  isTokenExpired,
  setStoredToken,
} from "../services/tokenService";

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [token, setToken] = useState(() => {
    const storedToken = getStoredToken();

    if (storedToken && !isTokenExpired(storedToken)) {
      return storedToken;
    }

    clearStoredToken();
    return null;
  });

  const logout = useCallback(({ redirectTo = "/login" } = {}) => {
    clearStoredToken();
    setToken(null);

    if (location.pathname !== redirectTo) {
      navigate(redirectTo, { replace: true });
    }
  }, [location.pathname, navigate]);

  const isAuthenticated = Boolean(token) && !isTokenExpired(token);

  useEffect(() => {
    if (token && !isAuthenticated) {
      clearStoredToken();
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    const onUnauthorized = () => {
      logout();
    };

    window.addEventListener("auth:unauthorized", onUnauthorized);

    return () => {
      window.removeEventListener("auth:unauthorized", onUnauthorized);
    };
  }, [logout]);

  const login = useCallback((nextToken) => {
    setStoredToken(nextToken);
    setToken(nextToken);
  }, []);

  const value = useMemo(
    () => ({
      token,
      isAuthenticated,
      login,
      logout,
    }),
    [isAuthenticated, login, logout, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
