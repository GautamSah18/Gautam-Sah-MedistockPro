import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import api from "../../../services/api.js";
import "./Register.css";

// Password strength checker
const checkPasswordStrength = (password) => {
  if (!password) return { score: 0, message: "", color: "#e0e0e0" };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { message: "Very Weak", color: "#ff4444" },
    { message: "Weak", color: "#ff8800" },
    { message: "Fair", color: "#ffbb33" },
    { message: "Good", color: "#00C851" },
    { message: "Strong", color: "#007E33" },
  ];

  return levels[score - 1] || { score: 0, message: "", color: "#e0e0e0" };
};

const Register = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "customer",
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: "",
    color: "#e0e0e0",
  });

  useEffect(() => {
    setPasswordStrength(checkPasswordStrength(formData.password));
  }, [formData.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setErrorMsg("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords don't match!");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/api/auth/register/step1/", {
        email: formData.email,
        password: formData.password,
        password_confirm: formData.confirmPassword,
        role: formData.role,
      });

      console.log("Registration response:", res.data);

      // Save email and password for OTP auto-login
      localStorage.setItem("otp_email", formData.email);
      localStorage.setItem("otp_password", formData.password);

      // Navigate to OTP page with email and role
      navigate("/verify-otp", {
        state: { email: formData.email, role: formData.role },
      });

    } catch (err) {
      console.error(err);

      // Parse backend field-level errors like { email: ["Email already registered"] }
      const errorData = err.response?.data;
      if (errorData && typeof errorData === "object") {
        const messages = Object.entries(errorData)
          .map(([field, msgs]) =>
            `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`
          )
          .join("\n");
        setErrorMsg(messages);
      } else {
        setErrorMsg(errorData?.error || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="body">
      <div className="register-container">
        <div className="register-card">
          <div className="register-header">
            <h2>Create Your Account</h2>
            <p>Select your role to get started</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@company.com"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <span onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              <div className="password-strength">
                <div className="strength-meter">
                  <div
                    className="strength-bar"
                    style={{
                      width: `${passwordStrength.score * 20}%`,
                      backgroundColor: passwordStrength.color,
                    }}
                  />
                </div>
                {passwordStrength.message && (
                  <span style={{ color: passwordStrength.color }}>
                    Password Strength: {passwordStrength.message}
                  </span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <div className="password-input">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <span onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label>Select Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="customer">Customer</option>
                <option value="delivery">Delivery Person</option>
              </select>
            </div>

            {errorMsg && (
              <div
                style={{
                  color: "#ff4444",
                  fontSize: "0.875rem",
                  marginBottom: "12px",
                  whiteSpace: "pre-line",
                  backgroundColor: "#fff0f0",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  border: "1px solid #ffcccc",
                }}
              >
                {errorMsg}
              </div>
            )}

            {loading && (
              <div
                style={{
                  color: "#888",
                  fontSize: "0.8rem",
                  marginBottom: "8px",
                  textAlign: "center",
                }}
              >
                Please wait, this may take up to 30 seconds on first request...
              </div>
            )}

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          <div className="login-link">
            Already have an account? <Link to="/login">Log In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;