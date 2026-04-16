import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login, appName } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try { 
    
      await login(email, password);
      nav("/");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        padding: "1rem",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        .auth-card { width: 420px; max-width: 100%; }
        .auth-input {
          width: 100%;
          padding: 12px 16px;
          font-size: 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
          color: #1e293b;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          box-sizing: border-box;
        }
        .auth-input:focus {
          border-color: #6366f1;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }
        .auth-input::placeholder { color: #94a3b8; }
        .auth-btn {
          width: 100%;
          padding: 13px;
          font-size: 15px;
          font-weight: 600;
          color: #fff;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
          letter-spacing: 0.01em;
        }
        .auth-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        .auth-btn:active:not(:disabled) { transform: translateY(0); }
        .auth-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        .input-wrapper { position: relative; }
        .eye-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: #94a3b8;
          display: flex;
          align-items: center;
        }
        .eye-btn:hover { color: #6366f1; }
        .divider { display: flex; align-items: center; gap: 12px; margin: 20px 0; }
        .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; }
        .divider span { font-size: 12px; color: #94a3b8; white-space: nowrap; }
      `}</style>

      <div className="auth-card">
        {/* Card */}
        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              padding: "36px 32px 28px",
              textAlign: "center",
              position: "relative",
            }}
          >
            {/* Decorative circle */}
            <div
              style={{
                position: "absolute",
                top: -30,
                right: -30,
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.07)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: -20,
                left: -20,
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.05)",
              }}
            />

            {/* Logo */}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "#fff",
                margin: "0 auto 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                position: "relative",
                zIndex: 1,
              }}
            >
              <img
                src="/image/JSC Profile-modified.png"
                alt="Logo"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentNode.innerHTML =
                    '<span style="font-size:28px;font-weight:700;color:#6366f1">J</span>';
                }}
              />
            </div>

            <h2
              style={{
                color: "#fff",
                fontSize: 22,
                fontWeight: 700,
                margin: "0 0 4px",
                position: "relative",
                zIndex: 1,
              }}
            >
              {appName}
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.75)",
                fontSize: 13,
                margin: 0,
                position: "relative",
                zIndex: 1,
              }}
            >
              Welcome back! Sign in to continue.
            </p>
          </div>

          {/* Body */}
          <div style={{ padding: "32px" }}>
            {error && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1.5px solid #fecaca",
                  borderRadius: 10,
                  padding: "10px 14px",
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7.5" stroke="#ef4444" />
                  <path
                    d="M8 4.5v4M8 10.5v1"
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <span style={{ color: "#b91c1c", fontSize: 13 }}>{error}</span>
              </div>
            )}

            <form onSubmit={onSubmit}>
              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#374151",
                    marginBottom: 6,
                  }}
                >
                  Email address
                </label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ paddingLeft: 42 }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      left: 13,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 8 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#374151",
                    marginBottom: 6,
                  }}
                >
                  Password
                </label>
                <div className="input-wrapper">
                  <input
                    type={showPass ? "text" : "password"}
                    className="auth-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ paddingLeft: 42, paddingRight: 42 }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      left: 13,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPass(!showPass)}
                    tabIndex={-1}
                  >
                    {showPass ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div style={{ textAlign: "right", marginBottom: 20 }}>
                <Link
                  to="/forgot-password"
                  style={{
                    fontSize: 12,
                    color: "#6366f1",
                    textDecoration: "none",
                  }}
                >
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ animation: "spin 0.8s linear infinite" }}
                    >
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="divider">
              <span>Don't have an account?</span>
            </div>

            <Link
              to="/register"
              style={{
                display: "block",
                width: "100%",
                padding: "11px",
                textAlign: "center",
                fontSize: 14,
                fontWeight: 600,
                color: "#6366f1",
                border: "1.5px solid #6366f1",
                borderRadius: 10,
                textDecoration: "none",
                transition: "background 0.2s",
                boxSizing: "border-box",
              }}
              onMouseEnter={(e) => (e.target.style.background = "#f0f0ff")}
              onMouseLeave={(e) => (e.target.style.background = "transparent")}
            >
              Create new account
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
