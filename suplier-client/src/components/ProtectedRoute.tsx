import { type FC, type ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../services/authService";

interface ProtectedRouteProps {
  children: ReactElement;
}

/**
 * Route wrapper that redirects unauthenticated users to `/login`.
 * If a token exists in localStorage, the wrapped children render normally.
 */
const ProtectedRoute: FC<ProtectedRouteProps> = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
