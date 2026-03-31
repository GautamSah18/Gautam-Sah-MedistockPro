import { ArrowLeft, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import "./OTPVerification.css";

export default function OTPVerification() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [timer, setTimer] = useState(60);

  const navigate = useNavigate();

  // ✅ Get email & password from localStorage
  const email = localStorage.getItem("otp_email");
  const password = localStorage.getItem("otp_password");

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate("/register");
    }
  }, [email, navigate]);

  // Countdown timer
  useEffect(() => {
    if (timer === 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // 🔐 VERIFY OTP + AUTO LOGIN
  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      // Step 1: Verify OTP
      const res = await api.post("/api/auth/verify-otp/", {
        email: email,
        code: otp,
      });

      if (res.status === 200) {
        setMessage("OTP verified successfully!");

        // Handle auto-login from verify-otp response (e.g., for delivery role)
        if (res.data.access && res.data.refresh) {
          localStorage.setItem("access_token", res.data.access);
          localStorage.setItem("refresh_token", res.data.refresh);

          const user = res.data.user || {};
          if (user.id) localStorage.setItem("userId", user.id);
          if (user.email) localStorage.setItem("userEmail", user.email);
          if (user.role) localStorage.setItem("userRole", user.role);

          // Remove temp password if it exists
          localStorage.removeItem("otp_password");

          setMessage("Verification successful! Redirecting to dashboard...");
          setTimeout(() => {
            window.location.href = "/delivery/dashboard";
          }, 1500);
          return;
        }

        // For roles that need document upload (like pharmacy/customer)
        if (res.data.next_step === "upload_documents") {
          setTimeout(() => {
            navigate("/upload-documents");
          }, 1500);
        } else {
          // Default fallback
          setTimeout(() => {
            navigate("/login", { state: { message: "Account verified. Please log in." } });
          }, 1500);
        }
      }
    } catch (err) {
      console.error("OTP verification failed:", err);
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || "Invalid or expired OTP.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 🔁 RESEND OTP
  const handleResendOTP = async () => {
    if (timer > 0 || resending) return;

    try {
      setResending(true);

      await api.post("/api/auth/send-otp/", {
        email: email,
      });

      setMessage("A fresh OTP has been sent to your email.");
      setTimer(60);
    } catch (err) {
      setError("Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="otp-page">
      <div className="otp-card-wrapper">
        <button
          className="back-btn"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="otp-card">
          <div className="top-bar"></div>

          <div className="otp-content">
            <div className="otp-header">
              <div className="otp-icon">
                <ShieldCheck size={40} />
              </div>
              <h2>Verify Identity</h2>
              <p>
                We've sent a 6-digit code to{" "}
                <span>{email}</span>
              </p>
            </div>

            {error && <div className="alert error">{error}</div>}
            {message && (
              <div className="alert success">{message}</div>
            )}

            <form onSubmit={handleVerify} className="otp-form">
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="000000"
                className="otp-input"
                required
              />

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="verify-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="spin" size={18} /> Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </button>
            </form>

            <div className="resend">
              <p>Didn't receive the code?</p>
              <button
                onClick={handleResendOTP}
                disabled={timer > 0 || resending}
                className="resend-btn"
              >
                {timer > 0
                  ? `Resend in ${timer}s`
                  : "Resend New Code"}
                {resending && (
                  <RefreshCw size={14} className="spin" />
                )}
              </button>
            </div>
          </div>
        </div>

        <p className="support">
          Need help?{" "}
          <a href="mailto:support@medistock.com">
            Contact Medistock Support
          </a>
        </p>
      </div>
    </div>
  );
}