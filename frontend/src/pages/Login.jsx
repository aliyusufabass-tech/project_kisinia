import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../api/endpoints';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      // Clear the message from location state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(username, password);
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      // Fetch user profile to determine role
      const userResponse = await authAPI.me();
      let role = 'CUSTOMER';
      
      // Check if user is superuser first
      if (userResponse.data.is_superuser) {
        role = 'ADMIN';
      } else {
        // Try to get profile role
        try {
          const profileResponse = await authAPI.getProfile();
          role = profileResponse.data[0]?.role || 'CUSTOMER';
        } catch (profileError) {
          // If profile doesn't exist, default to CUSTOMER
          role = 'CUSTOMER';
        }
      }
      
      localStorage.setItem('user', JSON.stringify(userResponse.data));
      localStorage.setItem('role', role);
      
      // Redirect based on role
      if (role === 'ADMIN') {
        navigate('/admin');
      } else if (role === 'RESTAURANT_OWNER') {
        navigate('/owner');
      } else {
        navigate('/customer');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>🍽️ Kisinia</h1>
        <h2>Restaurant & Food Ordering</h2>
        
        <form onSubmit={handleLogin}>
          {success && <div className="success-message">{success}</div>}
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="register-link">
          <p>
            Don't have an account?{' '}
            <a href="/register" className="link">
              Register here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
