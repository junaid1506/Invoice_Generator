import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import CreateInvoiceForm from "../components/CreateInvoiceForm.jsx";
import CompanyDetailsForm from "../components/CompanyDetailsForm.jsx";
import AppShell from "../components/AppShell.jsx";
import { fmtExact } from "../utils/format.js";

/* ── Stat card config ─────────────────────────────────────────── */
const STAT_CARDS = [
  {
    key: "total",
    label: "Total",
    color: "#3b82f6",
    bg: "#eff6ff",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    key: "paid",
    label: "Paid",
    color: "#10b981",
    bg: "#ecfdf5",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    key: "pending",
    label: "Pending",
    color: "#f59e0b",
    bg: "#fffbeb",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    key: "overdue",
    label: "Overdue",
    color: "#ef4444",
    bg: "#fef2f2",
    icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  },
  {
    key: "draft",
    label: "Draft",
    color: "#8b5cf6",
    bg: "#f5f3ff",
    icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  },
  {
    key: "submitted",
    label: "Submitted",
    color: "#0ea5e9",
    bg: "#f0f9ff",
    icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
  },
  {
    key: "rejected",
    label: "Rejected",
    color: "#f97316",
    bg: "#fff7ed",
    icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
  },
];

const STATUS_STYLES = {
  paid: { bg: "#dcfce7", color: "#16a34a" },
  pending: { bg: "#fef9c3", color: "#ca8a04" },
  overdue: { bg: "#fee2e2", color: "#dc2626" },
  draft: { bg: "#ede9fe", color: "#7c3aed" },
  submitted: { bg: "#e0f2fe", color: "#0369a1" },
  rejected: { bg: "#ffedd5", color: "#ea580c" },
};

function fmtDate(d) {
  if (!d) return "—";
  const x = new Date(d);
  if (isNaN(x)) return String(d).slice(0, 10);
  return x.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ── Component ─────────────────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuth();
  const [search, setSearch] = useSearchParams();
  const section = search.get("section") || "dashboard";

  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [company, setCompany] = useState(null);
  const [filterGst, setFilterGst] = useState("all");
  const [banner, setBanner] = useState("");

  const load = useCallback(async () => {
    const [cfg, st, inv, co] = await Promise.all([
      api("/api/config"),
      api("/api/invoices/stats"),
      api("/api/invoices"),
      api("/api/company/me"),
    ]);
    setConfig(cfg);
    setStats(st);
    setInvoices(inv.invoices || []);
    setCompany(co.company);
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  function setSection(s) {
    setSearch(s === "dashboard" ? {} : { section: s });
  }

  async function updateStatus(id, status) {
    if (!status || !window.confirm("Update status?")) return;
    await api(`/api/invoices/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await load();
  }

  async function deleteInvoice(id) {
    if (!window.confirm("Delete this invoice?")) return;
    await api(`/api/invoices/${id}`, { method: "DELETE" });
    await load();
  }

  const companyReady = Boolean(
    company?.companyName &&
    company?.companyAddress &&
    company?.companyHomeState,
  );

  const filteredInvoices = invoices.filter((inv) => {
    if (filterGst === "all") return true;
    return (inv.isGst === "yes" ? "gst" : "nongst") === filterGst;
  });

  return (
    <AppShell section={section} setSection={setSection}>
      {/* ── Banner ── */}
      {banner && (
        <div className="dash-banner">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {banner}
          <button onClick={() => setBanner("")} className="dash-banner-close">
            ×
          </button>
        </div>
      )}

      {/* ══════════ DASHBOARD SECTION ══════════ */}
      {section === "dashboard" && stats && (
        <div className="dash-root">
          {/* Hero */}
          <div className="dash-hero">
            <div className="dash-hero-bg-circle dash-hero-bg-circle-1" />
            <div className="dash-hero-bg-circle dash-hero-bg-circle-2" />
            <div className="dash-hero-content">
              <div className="dash-hero-kicker">
                <span className="dash-hero-kicker-dot" /> Personal Invoice
                Workspace
              </div>
              <h1 className="dash-hero-title">Welcome back, {user?.name} 👋</h1>
              <p className="dash-hero-sub">
                Manage your invoices, track payments and grow your business —
                all in one place.
              </p>
            </div>
            <div className="dash-hero-actions">
              <button
                className="dash-hero-btn-primary"
                onClick={() =>
                  setSection(
                    companyReady ? "create-invoice" : "company-details",
                  )
                }
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M12 4v16m8-8H4" strokeLinecap="round" />
                </svg>
                New Invoice
              </button>
              <button
                className="dash-hero-btn-ghost"
                onClick={() => setSection("company-details")}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {companyReady ? "Edit Company" : "Setup Company"}
              </button>
            </div>
          </div>

          {/* Revenue + Company status */}
          <div className="dash-top-row">
            {/* Revenue card */}
            <div className="dash-revenue-card">
              <div className="dash-revenue-label">Total Revenue (Paid)</div>
              <div className="dash-revenue-amount">
                ₹{fmtExact(stats.revenue || 0)}
              </div>
              <div className="dash-revenue-sub">
                From {stats.paid || 0} paid invoice{stats.paid !== 1 ? "s" : ""}
              </div>
              <div className="dash-revenue-icon">₹</div>
            </div>

            {/* Company status card */}
            <div className="dash-company-card">
              <div className="dash-company-header">
                <div>
                  <div className="dash-company-kicker">Company Status</div>
                  <div className="dash-company-name">
                    {companyReady ? company.companyName : "Setup Required"}
                  </div>
                  <div className="dash-company-meta">
                    {companyReady
                      ? `Home state: ${company.companyHomeState}`
                      : "Complete your company profile to start creating invoices"}
                  </div>
                </div>
                <span
                  className={`dash-status-badge ${companyReady ? "badge-ready" : "badge-pending"}`}
                >
                  {companyReady ? "✓ Ready" : "! Pending"}
                </span>
              </div>
              <button
                className="dash-company-btn"
                onClick={() => setSection("company-details")}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {companyReady ? "Edit Details" : "Complete Setup"}
              </button>
            </div>
          </div>

          {/* Stat cards */}
          <div className="dash-stats-grid">
            {STAT_CARDS.map(({ key, label, color, bg, icon }) => (
              <div
                key={key}
                className="dash-stat-card"
                style={{ "--card-color": color, "--card-bg": bg }}
              >
                <div className="dash-stat-icon-wrap">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={icon} />
                  </svg>
                </div>
                <div className="dash-stat-val">{stats[key] ?? 0}</div>
                <div className="dash-stat-label">{label}</div>
                <div className="dash-stat-bar">
                  <div
                    className="dash-stat-bar-fill"
                    style={{
                      width: stats.total
                        ? `${Math.min(100, ((stats[key] || 0) / stats.total) * 100)}%`
                        : "0%",
                      background: color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Invoice table */}
          <div className="dash-table-card">
            <div className="dash-table-header">
              <div className="dash-table-title">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                All Invoices
                <span className="dash-table-count">
                  {filteredInvoices.length}
                </span>
              </div>
              <div className="dash-table-controls">
                <div className="dash-filter-group">
                  {[
                    ["all", "All"],
                    ["gst", "GST"],
                    ["nongst", "Non-GST"],
                  ].map(([v, l]) => (
                    <button
                      key={v}
                      className={`dash-filter-btn ${filterGst === v ? "active" : ""}`}
                      onClick={() => setFilterGst(v)}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <button
                  className="dash-new-btn"
                  onClick={() =>
                    setSection(
                      companyReady ? "create-invoice" : "company-details",
                    )
                  }
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M12 4v16m8-8H4" strokeLinecap="round" />
                  </svg>
                  New Invoice
                </button>
              </div>
            </div>

            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Client</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv) => {
                    const paid = inv.status === "paid";
                    const rejected = inv.status === "rejected";
                    const gst = inv.isGst === "yes";
                    const igst = gst && Number(inv.igst) > 0;
                    const st = STATUS_STYLES[inv.status] || {
                      bg: "#f1f5f9",
                      color: "#64748b",
                    };
                    return (
                      <tr key={inv.id}>
                        <td>
                          <span className="dash-inv-number">{inv.number}</span>
                        </td>
                        <td>
                          <span className="dash-client-name">
                            {inv.clientName}
                          </span>
                        </td>
                        <td>
                          {gst ? (
                            igst ? (
                              <span
                                className="dash-type-badge"
                                style={{
                                  background: "#fff7ed",
                                  color: "#c2410c",
                                }}
                              >
                                IGST
                              </span>
                            ) : (
                              <>
                                <span
                                  className="dash-type-badge"
                                  style={{
                                    background: "#ecfdf5",
                                    color: "#15803d",
                                  }}
                                >
                                  CGST
                                </span>{" "}
                                <span
                                  className="dash-type-badge"
                                  style={{
                                    background: "#eff6ff",
                                    color: "#1d4ed8",
                                  }}
                                >
                                  SGST
                                </span>
                              </>
                            )
                          ) : (
                            <span
                              className="dash-type-badge"
                              style={{
                                background: "#f1f5f9",
                                color: "#475569",
                              }}
                            >
                              Non-GST
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="dash-amount">
                            ₹{fmtExact(inv.total)}
                          </span>
                        </td>
                        <td>
                          <div className="dash-status-cell">
                            <span
                              className="dash-status-tag"
                              style={{ background: st.bg, color: st.color }}
                            >
                              {inv.status}
                            </span>
                            {!paid && !rejected && (
                              <select
                                className="dash-status-select"
                                defaultValue=""
                                onChange={(e) => {
                                  const v = e.target.value;
                                  e.target.value = "";
                                  if (v) updateStatus(inv.id, v);
                                }}
                              >
                                <option value="">Change…</option>
                                {[
                                  "draft",
                                  "submitted",
                                  "pending",
                                  "paid",
                                  "rejected",
                                ].map((s) => (
                                  <option key={s} value={s}>
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </td>
                        <td className="dash-date">{fmtDate(inv.createdAt)}</td>
                        <td className="dash-date">{fmtDate(inv.dueDate)}</td>
                        <td>
                          <div className="dash-actions">
                            <Link
                              to={`/invoice/${inv.id}`}
                              className="dash-action-btn dash-action-view"
                              title="View"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                            {!paid && !rejected && (
                              <Link
                                to={`/invoice/${inv.id}/edit`}
                                className="dash-action-btn dash-action-edit"
                                title="Edit"
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </Link>
                            )}
                            {!paid && !rejected && (
                              <button
                                className="dash-action-btn dash-action-del"
                                title="Delete"
                                onClick={() => deleteInvoice(inv.id)}
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {!filteredInvoices.length && (
                <div className="dash-empty">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="1.5"
                  >
                    <path
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="dash-empty-title">No invoices yet</div>
                  <div className="dash-empty-sub">
                    Create your first invoice to get started
                  </div>
                  <button
                    className="dash-new-btn"
                    style={{ marginTop: 12 }}
                    onClick={() =>
                      setSection(
                        companyReady ? "create-invoice" : "company-details",
                      )
                    }
                  >
                    + New Invoice
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ CREATE INVOICE ══════════ */}
      {section === "create-invoice" &&
        config &&
        (companyReady ? (
          <CreateInvoiceForm
            companyHomeState={company.companyHomeState}
            indianStates={config.indianStates}
            fixedHsnSac={config.fixedHsnSac}
            companyGstin={company.companyGstin}
            onSuccess={() => {
              setBanner("Invoice created successfully.");
              load();
              setSection("dashboard");
            }}
          />
        ) : (
          <div className="dash-setup-prompt">
            <div className="dash-setup-icon">🏢</div>
            <h3>Company Details Required</h3>
            <p>
              Please complete your company profile before creating invoices.
            </p>
            <button
              className="dash-new-btn"
              onClick={() => setSection("company-details")}
            >
              Complete Setup →
            </button>
          </div>
        ))}

      {/* ══════════ COMPANY DETAILS ══════════ */}
      {section === "company-details" && (
        <CompanyDetailsForm
          initialCompany={company}
          indianStates={config?.indianStates}
          onCancel={() => setSection("dashboard")}
        />
      )}
    </AppShell>
  );
}
