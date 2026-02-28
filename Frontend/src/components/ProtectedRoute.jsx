import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, role }) => {
  const { user, bootstrapped } = useAuth();
  const location = useLocation();
  console.log("Checking ProtectedRoute", { user, bootstrapped, requiredRole: role });

  if (!bootstrapped) {
    return <div style={{ padding: 20 }}>Checking authentication...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Role based protection
  if (role && user.role !== role) {
    console.warn(`Access denied: User role '${user.role}' does not match required role '${role}'`);

    // Redirect based on user's actual role
    if (user.role === 'admin') return <Navigate to="/inventory" replace />;
    if (user.role === 'customer') return <Navigate to="/customerDashboard" replace />;
    if (user.role === 'delivery') return <Navigate to="/delivery/dashboard" replace />;

    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
