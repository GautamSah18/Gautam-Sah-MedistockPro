import { ArrowLeft, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import "./ResetPassword.css";

export default function ResetPassword() {
  const [passwords, setPasswords] = useState({
    new_password: "",
    confirm_password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const email = localStorage.getItem("reset_email");
  const otp = localStorage.getItem("reset_otp");

  useEffect(() => {
    if (!email || !otp) {
      navigate("/forgot-password");
    }
  }, [email, otp, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (passwords.new_password !== passwords.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/api/auth/forgot-password/reset/", { 
        email: email, 
        otp: otp,
        new_password: passwords.new_password,
        confirm_password: passwords.confirm_password
      });

      setMessage(response.data.message || "Password reset successfully!");
      
      // Clear sensitive info from localStorage
      localStorage.removeItem("reset_email");
      localStorage.removeItem("reset_otp");
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error("Password reset failed:", err);
      const errorMessage = err.response?.data?.non_field_errors?.[0] || err.response?.data?.error || "Reset failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-card-wrapper">
        <button className="back-btn" onClick={() => navigate("/forgot-password/verify")}>
          <ArrowLeft size={16} /> Back
        </button>

        <div className="reset-password-card">
          <div className="top-bar"></div>
          <div className="reset-password-content">
            <div className="reset-password-header">
              <div className="reset-password-icon">
                <Lock size={40} />
              </div>
              <h2>Reset Password</h2>
              <p>Set your new password to regain access to your account.</p>
            </div>

            {error && <div className="alert error">{error}</div>}
             {message && <div className="alert success">{message}</div>}

            <form onSubmit={handleReset} className="reset-password-form">
              <div className="form-group">
                <label htmlFor="new_password">New Password</label>
                <div className="password-input">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="new_password"
                    name="new_password"
                    value={passwords.new_password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="password-input-field"
                  />
                  <span
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirm_password">Confirm New Password</label>
                <div className="password-input">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="confirm_password"
                    name="confirm_password"
                    value={passwords.confirm_password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="password-input-field"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="reset-btn">
                {loading ? (
                  <>
                    <Loader2 className="spin" size={18} /> Updating Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
