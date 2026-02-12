import { ArrowLeft, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const location = useLocation();
  const email = location.state?.email || localStorage.getItem("otp_email");

  useEffect(() => {
    if (location.state?.email) {
      localStorage.setItem("otp_email", location.state.email);
    }
    if (!email) navigate("/register");
  }, [location.state, email, navigate]);

  useEffect(() => {
    if (timer === 0) return;
    const i = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(i);
  }, [timer]);

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
      const res = await api.post("/api/auth/verify-otp/", {
        email,
        code: otp,
      });

      if (res.status === 200) {
        setMessage("OTP verified successfully!");
        setTimeout(() => navigate("/upload-documents"), 1500);
      }
    } catch (err) {
      setError("Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0 || resending) return;

    try {
      setResending(true);
      await api.post("/api/auth/send-otp/", { email });
      setMessage("A fresh OTP has been sent to your email.");
      setTimer(60);
    } catch {
      setError("Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="otp-page">
      <div className="otp-card-wrapper">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>

        <div className="otp-card">
          <div className="top-bar" />

          <div className="otp-content">
            <div className="otp-header">
              <div className="otp-icon">
                <ShieldCheck size={40} />
              </div>
              <h2>Verify Identity</h2>
              <p>
                We've sent a 6-digit code to
                <span>{email}</span>
              </p>
            </div>

            {error && <div className="alert error">{error}</div>}
            {message && <div className="alert success">{message}</div>}

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
                {timer > 0 ? `Resend in ${timer}s` : "Resend New Code"}
                {resending && <RefreshCw size={14} className="spin" />}
              </button>
            </div>
          </div>
        </div>

        <p className="support">
          Need help? <a href="mailto:support@medistock.com">Contact Medistock Support</a>
        </p>
      </div>
    </div>
  );
}
