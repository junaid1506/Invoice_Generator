import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login, appName } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      nav('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  }

  return (
    <div
      className="d-flex align-items-center justify-content-center vh-100"
      style={{
        background: 'linear-gradient(135deg, #4e73df 0%, #6f42c1 100%)',
      }}
    >
      <div
        className="bg-white rounded overflow-hidden shadow"
        style={{ width: 400, maxWidth: '95vw' }}
      >
        <div className="text-white text-center p-4" style={{ background: '#4e73df' }}>
          <div className="d-flex justify-content-center mb-3">
            <div
              className="rounded-circle bg-white d-flex align-items-center justify-content-center overflow-hidden"
              style={{ width: 80, height: 80, boxShadow: '0 0 10px rgba(0,0,0,.1)' }}
            >
              <img
                src="/image/JSC Profile-modified.png"
                alt="Logo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          </div>
          <h3 className="mb-0">{appName}</h3>
          <p className="mb-0 small opacity-75">Sign in to your account</p>
        </div>
        <div className="p-4">
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <form onSubmit={onSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">
              Sign In
            </button>
          </form>
          <p className="text-center small mt-3 mb-0">
            <Link to="/register">Create new account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
