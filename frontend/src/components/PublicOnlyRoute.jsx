import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useDemoMode from "../hooks/useDemoMode";

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { isDemoMode } = useDemoMode();

  if (isAuthenticated || isDemoMode) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicOnlyRoute;

