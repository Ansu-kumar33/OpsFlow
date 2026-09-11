import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('opsflow_token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await loginUser(email.trim(), password);

      localStorage.setItem('opsflow_token', response.token);
      localStorage.setItem('opsflow_user', JSON.stringify(response.user));

      navigate('/dashboard', { replace: true });
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : 'Login failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-wrapper">
        <div className="brand-section">
          <div className="brand-logo">O</div>
          <h1>OpsFlow</h1>
          <h2>Mini ERP + CRM Operations Portal</h2>
          <p className="brand-text">
            Manage customers, products, inventory, and sales operations from one secure workspace.
          </p>

          <div className="features">
            <div className="feature">
              <span>✓</span>
              <p>Customer Management</p>
            </div>
            <div className="feature">
              <span>✓</span>
              <p>Inventory Tracking</p>
            </div>
            <div className="feature">
              <span>✓</span>
              <p>Sales Operations</p>
            </div>
            <div className="feature">
              <span>✓</span>
              <p>Business Dashboard</p>
            </div>
          </div>
        </div>

        <div className="login-section">
          <div className="login-card">
            <div className="mobile-logo">O</div>
            <h2>Welcome back</h2>
            <p className="login-subtitle">Sign in to continue to your OpsFlow account</p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              {error && <div className="message error-message">{error}</div>}

              <button type="submit" className="sign-in-button" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Login'}
              </button>
            </form>

            <div className="divider">
              <span>Secure Operations Portal</span>
            </div>
            <p className="login-footer">OpsFlow © 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
