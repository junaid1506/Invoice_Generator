import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const NAV_ITEMS = [
  {
    key: "dashboard",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    label: "Dashboard",
  },
  { key: "create-invoice", icon: "M12 4v16m8-8H4", label: "Create Invoice" },
  {
    key: "company-details",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    label: "Company Details",
  },
];

export default function AppShell({ children, section, setSection }) {
  const { user, appName, logout } = useAuth();
  const nav = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    nav("/login");
  }

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className={`app-sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        {/* Logo / Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <div className="sidebar-brand-name">JND Invoice</div>
            <div className="sidebar-brand-sub">Generator</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">Menu</div>
          {NAV_ITEMS.map(({ key, icon, label }) => (
            <button
              key={key}
              className={`sidebar-nav-item ${section === key ? "active" : ""}`}
              onClick={() => {
                setSection(key);
                setMobileOpen(false);
              }}
            >
              <span className="sidebar-nav-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={icon} />
                </svg>
              </span>
              <span className="sidebar-nav-label-text">{label}</span>
              {section === key && <span className="sidebar-active-dot" />}
            </button>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">Personal Workspace</div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="16"
              height="16"
            >
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Main area ── */}
      <div className="app-content">
        {/* Topbar */}
        <header className="app-topbar">
          <button
            className="topbar-hamburger"
            onClick={() => setMobileOpen(true)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="20"
              height="20"
            >
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>

          <div className="topbar-brand-mobile">JND Invoice Generator</div>

          <div className="topbar-right">
            <div className="topbar-welcome">
              <span className="topbar-welcome-text">Welcome back,</span>
              <span className="topbar-welcome-name">{user?.name}</span>
            </div>
            <div className="topbar-avatar">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="app-page">{children}</main>
      </div>
    </div>
  );
}
