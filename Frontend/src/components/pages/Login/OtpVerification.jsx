import { ArrowLeft, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../../services/api";

export default function OTPVerification() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [timer, setTimer] = useState(60);

  const navigate = useNavigate();
  const location = useLocation();

  // Get email from router state OR localStorage
  const email = location.state?.email || localStorage.getItem("otp_email");

  // Persist email if it comes from router state
  useEffect(() => {
    if (location.state?.email) {
      localStorage.setItem("otp_email", location.state.email);
    }
    if (!email) {
      navigate("/register");
    }
  }, [location.state, email, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email) {
      setError("Email not found. Please register again.");
      return;
    }

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/api/auth/verify-otp/", {
        email: email,
        code: otp,
      });

      if (res.status === 200) {
        if (res.data.next_step === "upload_documents") {
          navigate("/upload-documents", {
            state: { userId: res.data.user_id },
          });
        } else {
          setMessage("OTP verified successfully!");
          setTimeout(() => navigate("/login"), 2000);
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Invalid or expired OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0 || resending) return;

    setError("");
    setMessage("");
    try {
      setResending(true);
      await api.post("/api/auth/send-otp/", { email });
      setMessage("A fresh OTP has been sent to your email.");
      setTimer(60); // Reset timer
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 font-sans">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-green-50 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-emerald-50 rounded-full blur-3xl opacity-60"></div>
      </div>

      <div className="w-full max-w-md relative">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="group mb-6 flex items-center text-sm font-medium text-slate-500 hover:text-green-600 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
          {/* Top colored bar */}
          <div className="h-2 bg-gradient-to-r from-green-400 to-emerald-600"></div>

          <div className="p-8 sm:p-10">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-green-50 text-green-600 shadow-inner">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                Verify Identity
              </h2>
              <p className="mt-4 text-slate-500 text-base leading-relaxed">
                We've sent a 6-digit verification code to
                <span className="block font-semibold text-slate-700 mt-1">{email}</span>
              </p>
            </div>

            {/* Notifications */}
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-600 flex items-start">
                <span className="font-medium">{error}</span>
              </div>
            )}
            {message && (
              <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-100 text-sm text-green-700 font-medium">
                {message}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleVerify} className="space-y-8">
              <div className="relative group">
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    setOtp(val);
                  }}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-center text-3xl font-bold tracking-[0.5em] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all"
                  placeholder="000000"
                  required
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-green-100 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full relative group overflow-hidden bg-slate-900 rounded-2xl py-5 font-bold text-white shadow-xl shadow-slate-200 hover:shadow-green-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600 active:scale-[0.98]"
              >
                <span className="relative z-10 flex items-center justify-center">
                  {loading ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Code"
                  )}
                </span>
              </button>
            </form>

            {/* Resend Logic */}
            <div className="mt-10 pt-8 border-t border-slate-50 text-center">
              <p className="text-sm text-slate-500 mb-4">
                Didn't receive the code?
              </p>

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={timer > 0 || resending}
                className={`inline-flex items-center px-6 py-3 rounded-full text-sm font-bold transition-all ${timer > 0
                  ? "bg-slate-50 text-slate-400 cursor-default"
                  : "bg-green-50 text-green-600 hover:bg-green-100 active:scale-95"
                  }`}
              >
                {resending ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {timer > 0 ? (
                  `Resend in ${timer}s`
                ) : (
                  "Resend New Code"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Support Link */}
        <p className="mt-8 text-center text-xs text-slate-400 font-medium">
          Need help? <a href="mailto:support@medistock.com" className="text-green-600 hover:underline">Contact Medistock Support</a>
        </p>
      </div>
    </div>
  );
}

