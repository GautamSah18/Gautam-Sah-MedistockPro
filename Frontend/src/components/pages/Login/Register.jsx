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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    try {
      const res = await api.post("/api/auth/register/step1/", {
        email: formData.email,
        password: formData.password,
        password_confirm: formData.confirmPassword,
        role: formData.role,
      });

      console.log("Registration response:", res.data);

      //  Save email and password for OTP auto-login
      localStorage.setItem("otp_email", formData.email);
      localStorage.setItem("otp_password", formData.password);

      // Navigate to OTP page with email and role
      navigate("/verify-otp", {
        state: { email: formData.email, role: formData.role },
      });

    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.error ||
        "Registration failed. Please try again."
      );
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
              >
                <option value="customer">Customer</option>
                <option value="delivery">Delivery Person</option>
              </select>
            </div>

            <button type="submit" className="submit-btn">
              Register
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