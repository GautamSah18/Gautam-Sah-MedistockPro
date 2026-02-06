import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, bootstrapped } = useAuth();
  const location = useLocation();
  console.log("Checking ProtectedRoute", { user, bootstrapped });

  if (!bootstrapped) {
    return <div style={{ padding: 20 }}>Checking authentication...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
