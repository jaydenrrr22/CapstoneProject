import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useDemoMode from "../hooks/useDemoMode";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { isDemoMode } = useDemoMode();

  if (!isAuthenticated && !isDemoMode) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
