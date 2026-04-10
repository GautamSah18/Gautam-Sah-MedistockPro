import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await api.post("/api/auth/forgot-password/request/", { email });
      setMessage(response.data.message || "OTP sent to your email.");
      
      // Store email in localStorage for the next step
      localStorage.setItem("reset_email", email);
      
      // Redirect to OTP verification after a short delay
      setTimeout(() => {
        navigate("/forgot-password/verify");
      }, 2000);
    } catch (err) {
      console.error("Forgot password request failed:", err);
      setError(err.response?.data?.email?.[0] || err.response?.data?.error || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-card-wrapper">
        <button className="back-btn" onClick={() => navigate("/login")}>
          <ArrowLeft size={16} /> Back to Login
        </button>

        <div className="forgot-password-card">
          <div className="top-bar"></div>
          <div className="forgot-password-content">
            <div className="forgot-password-header">
              <div className="forgot-password-icon">
                <Mail size={40} />
              </div>
              <h2>Forgot Password?</h2>
              <p>Enter your email address and we'll send you an OTP to reset your password.</p>
            </div>

            {error && <div className="alert error">{error}</div>}
            {message && <div className="alert success">{message}</div>}

            <form onSubmit={handleSubmit} className="forgot-password-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="email-input"
                />
              </div>

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? (
                  <>
                    <Loader2 className="spin" size={18} /> Sending OTP...
                  </>
                ) : (
                  "Send OTP"
                )}
              </button>
            </form>

            <div className="footer-links">
              <p>Remembered your password? <Link to="/login">Login</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
