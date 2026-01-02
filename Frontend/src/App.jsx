import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useLayoutEffect, useState } from "react";
import "./App.css";

// Auth
import LoginPage from "./components/LoginPage";
import Register from "./components/Register";

// Docs
import Document from "./components/Document";

// Admin
import Dashboard from "./components/Dashboard";
import Inventory from "./components/Inventory";
import Billing from "./components/Billing";

// Customer
import CustomerDashboard from "./components/customerDashboard";
import CustomerCategories from "./components/CustomerCategories";
import CustomerPrescriptions from "./components/CustomerPrescriptions";
import Orders from "./components/Orders";
import ExpiryReturn from "./components/ExpiryReturn";

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
