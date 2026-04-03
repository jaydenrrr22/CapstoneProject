import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useDemoMode from "../hooks/useDemoMode";

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { needsModeSelection } = useDemoMode();

  if (isAuthenticated) {
    return <Navigate to={needsModeSelection ? "/mode-select" : "/dashboard"} replace />;
  }

  return children;
};

export default PublicOnlyRoute;
