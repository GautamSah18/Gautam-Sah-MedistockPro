import { useLayoutEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import "./App.css";

// Auth
import LoginPage from "./components/pages/Login/LoginPage";
import Register from "./components/pages/Login/Register";

// Docs
import Document from "./components/pages/Login/Document";

// Admin
import Billing from "./components/pages/Dashboard/Billing";
import Dashboard from "./components/pages/Dashboard/Dashboard";
import Inventory from "./components/pages/Inventory/Inventory";


import CustomerDashboard from "./components/pages/Dashboard/customerDashboard";
import CustomerPrescriptions from "./components/pages/Dashboard/CustomerPrescriptions";
import ExpiryReturn from "./components/pages/Dashboard/ExpiryReturn";
import Orders from "./components/pages/Dashboard/Orders";
import ProfileManagement from "./components/pages/Dashboard/ProfileManagement";

function RouteLoader({ children }) {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(t);
  }, [location.key]);

  return (
    <>
      {loading && (
  <div className="route-loader">
      <div className="spinner12" aria-label="Loading">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} />
        ))}
      </div>
      <div className="route-loader-text">Loading...</div>
    </div>
)}
      {children}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="app">
        <RouteLoader>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<Register />} />

            <Route path="/documents" element={<Document />} />

            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

            <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />

            <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />

            <Route path="/customerDashboard" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />
            <Route path="/customer/prescriptions" element={<ProtectedRoute><CustomerPrescriptions /></ProtectedRoute>} />
            <Route path="/customer/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/customer/returns" element={<ProtectedRoute><ExpiryReturn /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfileManagement /></ProtectedRoute>} />

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </RouteLoader>
      </div>
    </AuthProvider>
  );
}
