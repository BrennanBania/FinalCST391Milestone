import React, { useState, useEffect } from 'react';
import { fetchAPI, API_BASE_URL } from '../utils/api';

function LoginPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const username = params.get('username');
    const role = params.get('role');

    if (token && username) {
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Login with the token
      onLogin(token, { username, role });
    }
  }, [onLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { email, password }
        : { username, email, password };
      
      const response = await fetchAPI(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      if (response.ok && response.data && response.data.token) {
        onLogin(response.data.token, response.data.user);
      } else {
        setError(response.error || 'Authentication failed');
      }
    } catch (error) {
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = () => {
    setGithubLoading(true);
    setError('');
    // Redirect to GitHub OAuth endpoint
    window.location.href = `${API_BASE_URL}/api/auth/github`;
  };

  return (
    <div className="page-container login-page">
      <div className="login-form-container">
        <h1>{isLogin ? 'Login' : 'Register'}</h1>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Username:</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}

          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        {isLogin && (
          <>
            <div className="divider">
              <span>OR</span>
            </div>
            <button 
              type="button" 
              onClick={handleGitHubLogin} 
              disabled={githubLoading}
              className="github-button"
            >
              {githubLoading ? 'Redirecting...' : '🔓 Login with GitHub'}
            </button>
          </>
        )}

        <p className="toggle-auth">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              if (isLogin) {
                // Switching to register, clear username only
                setUsername('');
              }
            }}
            className="link-button"
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
