import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import "./ForgotPasswordVerify.css";

export default function ForgotPasswordVerify() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const email = localStorage.getItem("reset_email");

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/api/auth/forgot-password/verify/", { 
        email: email, 
        code: otp 
      });
      setMessage(response.data.message || "OTP verified successfully!");
      
      // Store verified OTP in localStorage for the next step
      localStorage.setItem("reset_otp", otp);
      
      // Redirect to Reset Password page after a short delay
      setTimeout(() => {
        navigate("/forgot-password/reset");
      }, 1500);
    } catch (err) {
      console.error("OTP verification failed:", err);
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || "Invalid or expired OTP.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-verify-page">
      <div className="forgot-password-verify-card-wrapper">
        <button className="back-btn" onClick={() => navigate("/forgot-password")}>
          <ArrowLeft size={16} /> Back
        </button>

        <div className="forgot-password-verify-card">
          <div className="top-bar"></div>
          <div className="forgot-password-verify-content">
            <div className="forgot-password-verify-header">
              <div className="forgot-password-verify-icon">
                <ShieldCheck size={40} />
              </div>
              <h2>Verify OTP</h2>
              <p>We've sent a 6-digit code to <span>{email}</span></p>
            </div>

            {error && <div className="alert error">{error}</div>}
            {message && <div className="alert success">{message}</div>}

            <form onSubmit={handleVerify} className="forgot-password-verify-form">
              <div className="form-group">
                <label htmlFor="otp">Enter OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="000000"
                  className="otp-input"
                  required
                />
              </div>

              <button type="submit" disabled={loading || otp.length < 6} className="verify-btn">
                {loading ? (
                  <>
                    <Loader2 className="spin" size={18} /> Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </button>
            </form>

            <div className="resend-info">
              <p>Didn't receive the code? Wait for a few minutes or click below to resend.</p>
              <button 
                onClick={() => navigate("/forgot-password")} 
                className="resend-link-btn"
              >
                Go back and request again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
