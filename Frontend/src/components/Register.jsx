import { useEffect, useState } from 'react';
import { FaEye, FaEyeSlash, FaShieldAlt } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import './Register.css';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: '',
    color: '#e0e0e0'
  });

  const checkPasswordStrength = (password) => {
    let score = 0;
    let message = '';
    let color = '#e0e0e0';

    if (password.length === 0) {
      return { score: 0, message: '', color: '#e0e0e0' };
    } else if (password.length < 6) {
      score = 1;
      message = 'Too short';
      color = '#ff4d4f';
    } else if (password.length < 8) {
      score = 2;
      message = 'Weak';
      color = '#ffa940';
    } else if (password.length < 10) {
      score = 3;
      message = 'Good';
      color = '#ffd666';
    } else {
      score = 4;
      message = 'Strong';
      color = '#52c41a';
    }

    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);

    if (hasSpecialChar) score = Math.min(score + 1, 4);
    if (hasNumber) score = Math.min(score + 0.5, 4);
    if (hasUpperCase) score = Math.min(score + 0.5, 4);

    score = Math.round(score);

    if (score === 1) {
      message = 'Too short';
      color = '#ff4d4f';
    } else if (score === 2) {
      message = 'Weak';
      color = '#ffa940';
    } else if (score === 3) {
      message = 'Good';
      color = '#ffd666';
    } else if (score === 4) {
      message = 'Strong';
      color = '#52c41a';
    }

    return { score, message, color };
  };

  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(checkPasswordStrength(formData.password));
    } else {
      setPasswordStrength({ score: 0, message: '', color: '#e0e0e0' });
    }
  }, [formData.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
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
      });

      console.log("Response:", res.data);
      // Navigate to documents page with the user ID
      navigate(`/documents?user_id=${res.data.user_id}`);
    } catch (err) {
      if (err.response) {
        alert("Error: " + JSON.stringify(err.response.data));
      } else {
        alert("Something went wrong");
      }
    }
  };

  return (
    <div className="register-container">
      <div className="logo-container">
        <FaShieldAlt className="logo-icon" />
        <h1>MediStock Pro</h1>
      </div>

      <div className="register-card">
        <div className="register-header">
          <h2>Create Your Account</h2>
          <p>Join our network of trusted retailers and wholesalers.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="password-strength">
              <div className="strength-meter">
                <div
                  className="strength-bar"
                  style={{
                    width: `${passwordStrength.score * 25}%`,
                    backgroundColor: passwordStrength.color,
                    transition: 'all 0.3s ease-in-out'
                  }}
                ></div>
              </div>

              {passwordStrength.message && (
                <span className="strength-text" style={{ color: passwordStrength.color }}>
                  Password Strength: {passwordStrength.message}
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <span
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          <button type="submit" className="submit-btn">
            Next
          </button>
        </form>

        <div className="login-link">
          Already have an account? <Link to="/login">Log In</Link>
        </div>
      </div>

      <div className="footer-links">
        <a href="#">Terms of Service</a>
        <span> · </span>
        <a href="#">Privacy Policy</a>
      </div>
    </div>
  );
};

export default Register;
