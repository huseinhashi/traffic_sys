// ProtectedRoute.jsx - Updated for traffic jam system
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const ProtectedRoute = ({ children, allowedRoles = ["admin"] }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Redirect to root route (login page)
    return <Navigate to="/" replace />;
  }

  // Check if user has required role
  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};
