import { useState } from 'react';
import { FaEye, FaEyeSlash, FaShieldAlt, FaArrowLeft } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import './LoginPage.css';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'customer' // Default to customer
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = { email: '', password: '', general: '' };
    let isValid = true;

    if (!formData.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors(prev => ({ ...prev, general: '' }));

    try {
      const res = await api.post("/api/auth/login/", {
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      console.log("Login response:", res.data);
      
      // Check if registration is incomplete (backend returns warning instead of tokens)
      if (res.data.warning && res.data.user_id) {
        setErrors(prev => ({
          ...prev,
          general: res.data.warning || 'Please complete your registration by uploading documents.'
        }));
        setIsLoading(false);
        // Optionally redirect to document upload page
        // navigate('/documents');
        return;
      }
      
      // Check for error message
      if (res.data.error) {
        setErrors(prev => ({
          ...prev,
          general: res.data.error
        }));
        setIsLoading(false);
        return;
      }
      
      // Verify response has required JWT tokens
      if (!res.data.access || !res.data.refresh) {
        setErrors(prev => ({
          ...prev,
          general: res.data.message || 'Login failed. Please contact administrator.'
        }));
        setIsLoading(false);
        return;
      }
      
      // Store JWT tokens and user data
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      localStorage.setItem('userRole', res.data.user?.role || formData.role);
      localStorage.setItem('userEmail', res.data.user?.email || formData.email);
      
      // Redirect based on role - admin goes to inventory page
      const userRole = res.data.user?.role || formData.role;
      switch(userRole) {
        case 'admin':
          navigate('/inventory');
          break;
        case 'customer':
          navigate('/customer/dashboard');
          break;
        case 'delivery':
          navigate('/delivery/dashboard');
          break;
        default:
          navigate('/dashboard');
      }
      
    } catch (err) {
      console.error("Login error:", err);
      
      if (err.response) {
        if (err.response.status === 401) {
          setErrors(prev => ({
            ...prev,
            general: 'Invalid email or password'
          }));
        } else if (err.response.status === 403) {
          setErrors(prev => ({
            ...prev,
            general: 'Access denied for this role'
          }));
        } else {
          setErrors(prev => ({
            ...prev,
            general: err.response.data?.message || 'Login failed'
          }));
        }
      } else {
        setErrors(prev => ({
          ...prev,
          general: 'Network error. Please try again.'
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className='body'>
      <div className="login-container">
        <div className="logo-container">
          <FaShieldAlt className="logo-icon" />
          <h1>MediStock Pro</h1>
        </div>

        <div className="login-card">
          <div className="login-header">
            <h2>Welcome Back</h2>
            <p>Sign in to your account</p>
          </div>

          {errors.general && (
            <div className="error-alert">
              {errors.general}
            </div>
          )}

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
                className={errors.email ? 'input-error' : ''}
              />
              {errors.email && (
                <span className="error-text">{errors.email}</span>
              )}
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
                  className={errors.password ? 'input-error' : ''}
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              {errors.password && (
                <span className="error-text">{errors.password}</span>
              )}
            </div>

            {/* Role Selection */}
            <div className="form-group">
              <label htmlFor="role">Select Your Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="role-dropdown"
              >
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
                <option value="delivery">Delivery Person</option>
              </select>
            </div>

            <div className="forgot-password">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="register-link">
            Don't have an account? <Link to="/register">Sign Up</Link>
          </div>

          <div className="back-link">
            <button onClick={handleGoBack} className="back-btn">
              <FaArrowLeft className="back-icon" />
              Go Back
            </button>
          </div>
        </div>

        <div className="footer-links">
          <a href="#">Terms of Service</a>
          <span> · </span>
          <a href="#">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
};

export default Login;