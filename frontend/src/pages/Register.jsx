import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/endpoints';
import './Register.css';

export default function Register() {
  const [selectedRole, setSelectedRole] = useState('');
  const [showRoleSelection, setShowRoleSelection] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
    role: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const roles = [
    {
      value: 'CUSTOMER',
      label: 'Customer',
      description: 'Order food from restaurants',
      icon: '🍽️'
    },
    {
      value: 'RESTAURANT_OWNER',
      label: 'Restaurant Owner',
      description: 'Manage your restaurant and menu',
      icon: '🏪'
    }
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setFormData({ ...formData, role });
    setShowRoleSelection(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.register(formData);
      if (response.data) {
        // Registration successful, redirect to login
        navigate('/login', { 
          state: { message: 'Registration successful! Please login.' } 
        });
      }
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData) {
        if (typeof errorData === 'string') {
          setError(errorData);
        } else if (typeof errorData === 'object') {
          // Handle field-specific errors
          const errorMessages = Object.entries(errorData)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
          setError(errorMessages);
        }
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const backToRoleSelection = () => {
    setShowRoleSelection(true);
    setSelectedRole('');
    setFormData({ ...formData, role: '' });
  };

  if (showRoleSelection) {
    return (
      <div className="register-container">
        <div className="register-card">
          <h1 className="register-title">Join Kisinia</h1>
          <p className="register-subtitle">Choose your role to get started</p>
          
          <div className="role-selection">
            {roles.map((role) => (
              <button
                key={role.value}
                className="role-card"
                onClick={() => handleRoleSelect(role.value)}
              >
                <div className="role-icon">{role.icon}</div>
                <h3>{role.label}</h3>
                <p>{role.description}</p>
              </button>
            ))}
          </div>

          <div className="register-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="login-link">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const selectedRoleData = roles.find(r => r.value === selectedRole);

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <button 
            className="back-button" 
            onClick={backToRoleSelection}
          >
            ← Back
          </button>
          <div className="selected-role">
            <span className="role-icon">{selectedRoleData.icon}</span>
            <span>Register as {selectedRoleData.label}</span>
          </div>
        </div>

        <h2 className="register-title">Create Account</h2>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="last_name">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number (Optional)</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength="8"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password_confirm">Confirm Password</label>
            <input
              type="password"
              id="password_confirm"
              name="password_confirm"
              value={formData.password_confirm}
              onChange={handleInputChange}
              required
              minLength="8"
            />
          </div>

          <button 
            type="submit" 
            className="register-button"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="login-link">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
