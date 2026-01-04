import { useLayoutEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
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

// Customer
import CustomerCategories from "./components/pages/Dashboard/CustomerCategories";
import CustomerDashboard from "./components/pages/Dashboard/customerDashboard";
import CustomerPrescriptions from "./components/pages/Dashboard/CustomerPrescriptions";
import ExpiryReturn from "./components/pages/Dashboard/ExpiryReturn";
import Orders from "./components/pages/Dashboard/Orders";

function RouteLoader({ children }) {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 1000); // ✅ always 1 second
    return () => clearTimeout(t);
  }, [location.key]); // ✅ more reliable than pathname

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
    <div className="app">
      <RouteLoader>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Register />} />

          <Route path="/documents" element={<Document />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/billing" element={<Billing />} />

          <Route path="/customerDashboard" element={<CustomerDashboard />} />
          <Route path="/customer/categories" element={<CustomerCategories />} />
          <Route path="/customer/prescriptions" element={<CustomerPrescriptions />} />
          <Route path="/customer/orders" element={<Orders />} />
          <Route path="/customer/returns" element={<ExpiryReturn />} />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </RouteLoader>
    </div>
  );
}
