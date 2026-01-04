import { useEffect, useState } from 'react';
import { FaEye, FaEyeSlash, FaShieldAlt } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../services/api.js';
import './Register.css';

// Add the missing checkPasswordStrength function
const checkPasswordStrength = (password) => {
  if (!password) return { score: 0, message: 'Enter a password', color: '#e0e0e0' };
  
  let score = 0;
  
  // Check length
  if (password.length >= 8) score += 1;
  
  // Check for lowercase
  if (/[a-z]/.test(password)) score += 1;
  
  // Check for uppercase
  if (/[A-Z]/.test(password)) score += 1;
  
  // Check for numbers
  if (/[0-9]/.test(password)) score += 1;
  
  // Check for special characters
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  // Determine strength message and color
  let message = '';
  let color = '';
  
  if (score === 0) {
    message = 'Enter a password';
    color = '#e0e0e0';
  } else if (score === 1) {
    message = 'Very Weak';
    color = '#ff4444';
  } else if (score === 2) {
    message = 'Weak';
    color = '#ff8800';
  } else if (score === 3) {
    message = 'Fair';
    color = '#ffbb33';
  } else if (score === 4) {
    message = 'Good';
    color = '#00C851';
  } else {
    message = 'Strong';
    color = '#007E33';
  }
  
  return { score, message, color };
};




const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer' // Default to customer
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: '',
    color: '#e0e0e0'
  });

  // ... keep your existing checkPasswordStrength function ...

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
        role: formData.role
      });

      console.log("Response:", res.data);
      
      
      if (formData.role === 'customer') {
        // Customer needs to upload documents
        navigate(`/documents?user_id=${res.data.user_id}`);
      } else if (formData.role === 'delivery') {
        // Delivery person goes directly to login
        alert('Registration successful! Please login with your credentials.');
        navigate('/login');
      }
      
    } catch (err) {
      if (err.response) {
        alert("Error: " + JSON.stringify(err.response.data));
      } else {
        alert("Something went wrong");
      }
    }
  };

  return (
    <div className='body'>
      <div className="register-container">
        <div className="logo-container">
          <FaShieldAlt className="logo-icon" />
          <h1>MediStock Pro</h1>
        </div>

        <div className="register-card">
          <div className="register-header">
            <h2>Create Your Account</h2>
            <p>Select your role to get started</p>
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

            {/* Role Selection */}
            <div className="form-group">
              <label htmlFor="role">Select Your Role</label>
              <div className="role-info-text">
              </div>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="role-dropdown"
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

        <div className="footer-links">
          <a href="#">Terms of Service</a>
          <span> · </span>
          <a href="#">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
};

export default Register;