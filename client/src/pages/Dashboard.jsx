import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import CreateInvoiceForm from '../components/CreateInvoiceForm.jsx';
import CompanyDetailsForm from '../components/CompanyDetailsForm.jsx';
import { fmtExact } from '../utils/format.js';

const sidebarStyle = {
  background: 'linear-gradient(180deg,#4e73df 0%,#2e59d9 100%)',
  color: 'white',
  minHeight: '100vh',
  width: 240,
  position: 'fixed',
  left: 0,
  top: 0,
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '4px 0 15px rgba(0,0,0,.12)',
};

export default function Dashboard() {
  const { user, appName, logout } = useAuth();
  const nav = useNavigate();
  const [search, setSearch] = useSearchParams();
  const section = search.get('section') || 'dashboard';

  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [company, setCompany] = useState(null);
  const [filterGst, setFilterGst] = useState('all');
  const [banner, setBanner] = useState('');

  const load = useCallback(async () => {
    const [cfg, st, inv, co] = await Promise.all([
      api('/api/config'),
      api('/api/invoices/stats'),
      api('/api/invoices'),
      api('/api/company/me'),
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
    setSearch(s === 'dashboard' ? {} : { section: s });
  }

  async function updateStatus(id, status) {
    if (!status || !window.confirm('Update status?')) return;
    await api(`/api/invoices/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await load();
  }

  async function deleteInvoice(id) {
    if (!window.confirm('Delete this invoice?')) return;
    await api(`/api/invoices/${id}`, { method: 'DELETE' });
    await load();
  }

  async function handleLogout() {
    await logout();
    nav('/login');
  }

  const filteredInvoices = invoices.filter((inv) => {
    const gst = inv.isGst === 'yes' ? 'gst' : 'nongst';
    if (filterGst === 'all') return true;
    return gst === filterGst;
  });

  const companyReady = Boolean(company?.companyName && company?.companyAddress && company?.companyHomeState);

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <aside style={sidebarStyle} className="d-none d-md-flex">
        <div className="p-3 border-bottom border-light border-opacity-25">
          <h5 className="fw-bold mb-0 small">
            <i className="fas fa-file-invoice-dollar me-2" />
            {appName}
          </h5>
          <small className="opacity-75">Personal panel</small>
        </div>
        <ul className="list-unstyled flex-grow-1 py-2 mb-0 small fw-semibold">
          {[
            ['dashboard', 'fa-tachometer-alt', 'Dashboard'],
            ['create-invoice', 'fa-plus-circle', 'Create Invoice'],
            ['company-details', 'fa-building', 'Your Company Details'],
          ].map(([key, icon, label]) => (
            <li
              key={key}
              className={`px-3 py-2 cursor-pointer ${section === key ? 'bg-white bg-opacity-20 border-start border-3 border-white' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setSection(key)}
            >
              <i className={`fas ${icon} me-2`} style={{ width: 20 }} />
              {label}
            </li>
          ))}
          <li className="px-3 py-2" style={{ cursor: 'pointer' }} onClick={handleLogout}>
            <i className="fas fa-sign-out-alt me-2" style={{ width: 20 }} />
            Logout
          </li>
        </ul>
        <div className="p-3 border-top border-light border-opacity-25 small opacity-75">
          <i className="fas fa-user-circle me-1" />
          {user?.name}
        </div>
      </aside>

      <div className="flex-grow-1" style={{ marginLeft: 0 }}>
        <div
          className="d-md-none bg-primary text-white p-2 d-flex flex-wrap gap-2 align-items-center"
          style={{ position: 'sticky', top: 0, zIndex: 99 }}
        >
          <span className="fw-bold me-auto">{appName}</span>
          <select
            className="form-select form-select-sm w-auto"
            value={section}
            onChange={(e) => setSection(e.target.value)}
          >
            <option value="dashboard">Dashboard</option>
            <option value="create-invoice">Create</option>
            <option value="company-details">Company Details</option>
          </select>
          <button type="button" className="btn btn-light btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <header
          className="bg-white shadow-sm d-none d-md-flex align-items-center justify-content-between px-4 py-2"
          style={{ marginLeft: 240, position: 'fixed', right: 0, top: 0, left: 0, zIndex: 90 }}
        >
          <span className="fw-bold text-primary">
            <i className="fas fa-file-invoice me-2" />
            {appName}
          </span>
          <span className="text-muted small rounded-pill bg-light px-3 py-1">
            Welcome, {user?.name}
          </span>
        </header>

        <main className="app-main-offset p-3 p-md-4 pt-5">
          {banner && (
            <div className="alert alert-success alert-dismissible">
              {banner}
              <button type="button" className="btn-close" onClick={() => setBanner('')} />
            </div>
          )}

          {section === 'dashboard' && stats && (
            <>
              <div className="dashboard-hero mb-4">
                <div>
                  <div className="dashboard-kicker">Personal Invoice Workspace</div>
                  <h2 className="dashboard-title mb-2">Welcome back, {user?.name}</h2>
                  <p className="dashboard-subtitle mb-0">
                    Save your company details once, then create invoices faster with your own branding.
                  </p>
                </div>
                <div className="dashboard-hero-actions">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => setSection('company-details')}
                  >
                    <i className="fas fa-building me-2" />
                    {companyReady ? 'Update Company Details' : 'Set Company Details'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-light"
                    onClick={() => setSection(companyReady ? 'create-invoice' : 'company-details')}
                  >
                    <i className="fas fa-file-invoice me-2" />
                    Create Invoice
                  </button>
                </div>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-lg-8">
              <div
                className="rounded-4 p-4 text-white mb-4 d-flex justify-content-between align-items-center"
                style={{
                  background: 'linear-gradient(135deg,#28a745,#20c997)',
                  boxShadow: '0 6px 20px rgba(40,167,69,.25)',
                }}
              >
                <div>
                  <h6 className="text-uppercase small opacity-75 mb-1">Total revenue (paid)</h6>
                  <h1 className="fw-bold mb-0">₹{fmtExact(stats.revenue)}</h1>
                </div>
                <i className="fas fa-indian-rupee-sign opacity-25" style={{ fontSize: '3rem' }} />
              </div>
                </div>
                <div className="col-lg-4">
                  <div className="dashboard-side-card h-100">
                    <div className="d-flex align-items-start justify-content-between mb-3">
                      <div>
                        <div className="dashboard-kicker">Company Status</div>
                        <h5 className="mb-1">{companyReady ? company.companyName : 'Setup required'}</h5>
                        <p className="text-muted small mb-0">
                          {companyReady
                            ? `Home state: ${company.companyHomeState}`
                            : 'Add company details before creating invoices.'}
                        </p>
                      </div>
                      <span className={`badge ${companyReady ? 'bg-success' : 'bg-warning text-dark'}`}>
                        {companyReady ? 'Ready' : 'Pending'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setSection('company-details')}
                    >
                      <i className="fas fa-pen me-2" />
                      {companyReady ? 'Edit Details' : 'Complete Setup'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="row g-2 g-lg-3 mb-4">
                {[
                  { label: 'Total', val: stats.total, cls: 'bg-primary', icon: 'fa-file-invoice' },
                  { label: 'Paid', val: stats.paid, cls: 'bg-success', icon: 'fa-check-circle' },
                  { label: 'Pending', val: stats.pending, cls: 'bg-warning text-dark', icon: 'fa-clock' },
                  { label: 'Overdue', val: stats.overdue, cls: 'bg-danger', icon: 'fa-exclamation-circle' },
                  { label: 'Draft', val: stats.draft, cls: 'bg-info', icon: 'fa-edit' },
                  { label: 'Submitted', val: stats.submitted, cls: 'bg-secondary', icon: 'fa-paper-plane' },
                  {
                    label: 'Rejected',
                    val: stats.rejected,
                    cls: 'text-white',
                    icon: 'fa-ban',
                    style: { background: 'linear-gradient(135deg,#fd7e14,#dc6000)' },
                  },
                ].map(({ label, val, cls, icon, style }) => (
                  <div key={label} className="col-6 col-lg">
                    <div
                      className={`rounded-3 p-3 text-white position-relative overflow-hidden ${cls}`}
                      style={style}
                    >
                      <h6 className="small text-uppercase opacity-90 mb-1">{label}</h6>
                      <h2 className="fw-bold mb-0">{val}</h2>
                      <i
                        className={`fas ${icon} position-absolute opacity-25`}
                        style={{ right: 10, bottom: 10, fontSize: '1.5rem' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-header bg-white d-flex flex-wrap gap-2 align-items-center justify-content-between">
                  <div className="d-flex flex-wrap align-items-center gap-1">
                    <span className="small text-muted fw-bold me-1">Filter:</span>
                    {[
                      ['all', 'All'],
                      ['gst', 'GST'],
                      ['nongst', 'Non-GST'],
                    ].map(([v, l]) => (
                      <button
                        key={v}
                        type="button"
                        className={`btn btn-sm rounded-pill ${filterGst === v ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setFilterGst(v)}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      if (!companyReady) {
                        setBanner('Please fill your company details first.');
                        setSection('company-details');
                        return;
                      }
                      setSection('create-invoice');
                    }}
                  >
                    <i className="fas fa-plus me-1" />
                    New invoice
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover mb-0 small">
                    <thead className="table-light">
                      <tr>
                        <th>Invoice #</th>
                        <th>Client</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Issue</th>
                        <th>Due</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.map((inv) => {
                        const paid = inv.status === 'paid';
                        const rejected = inv.status === 'rejected';
                        const gst = inv.isGst === 'yes';
                        const igst = gst && Number(inv.igst) > 0;
                        return (
                          <tr key={inv.id}>
                            <td className="font-monospace fw-bold">{inv.number}</td>
                            <td>{inv.clientName}</td>
                            <td>
                              {gst ? (
                                igst ? (
                                  <span className="badge bg-warning text-dark">IGST</span>
                                ) : (
                                  <>
                                    <span className="badge bg-success">CGST</span>{' '}
                                    <span className="badge bg-info text-dark">SGST</span>
                                  </>
                                )
                              ) : (
                                <span className="badge bg-secondary">Non-GST</span>
                              )}
                            </td>
                            <td className="fw-bold">₹{fmtExact(inv.total)}</td>
                            <td>
                              <span className={`badge text-capitalize bg-${inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'danger' : 'secondary'}`}>
                                {inv.status}
                              </span>
                              {!paid && !rejected && (
                                <select
                                  className="form-select form-select-sm d-inline-block w-auto ms-1"
                                  style={{ maxWidth: 130 }}
                                  defaultValue=""
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    e.target.value = '';
                                    if (v) updateStatus(inv.id, v);
                                  }}
                                >
                                  <option value="">Change…</option>
                                  <option value="draft">Draft</option>
                                  <option value="submitted">Submitted</option>
                                  <option value="pending">Pending</option>
                                  <option value="paid">Paid</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                              )}
                            </td>
                            <td>{fmtDate(inv.createdAt)}</td>
                            <td>{fmtDate(inv.dueDate)}</td>
                            <td>
                              <Link
                                to={`/invoice/${inv.id}`}
                                className="btn btn-sm btn-outline-primary me-1"
                              >
                                <i className="fas fa-eye" />
                              </Link>
                              {!paid && !rejected && (
                                <Link
                                  to={`/invoice/${inv.id}/edit`}
                                  className="btn btn-sm btn-outline-secondary me-1"
                                >
                                  <i className="fas fa-edit" />
                                </Link>
                              )}
                              {!paid && !rejected && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => deleteInvoice(inv.id)}
                                >
                                  <i className="fas fa-trash" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {!filteredInvoices.length && (
                    <p className="text-center text-muted py-5 mb-0">No invoices match this view.</p>
                  )}
                </div>
              </div>
            </>
          )}

          {section === 'create-invoice' && config && (
            companyReady ? (
              <CreateInvoiceForm
                companyHomeState={company.companyHomeState}
                indianStates={config.indianStates}
                fixedHsnSac={config.fixedHsnSac}
                companyGstin={company.companyGstin}
                onSuccess={() => {
                  setBanner('Invoice created successfully.');
                  load();
                  setSection('dashboard');
                }}
              />
            ) : (
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body p-4">
                  <h5 className="fw-bold text-danger mb-2">Please fill your company details</h5>
                  <p className="mb-3 text-muted">Please fill your company details to create invoices.</p>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setSection('company-details')}>
                    <i className="fas fa-building me-2" />
                    Your Company Details
                  </button>
                </div>
              </div>
            )
          )}

          {section === 'company-details' && (
            <CompanyDetailsForm
              initialCompany={company}
              indianStates={config?.indianStates}
              onSaved={async (nextCompany) => {
                setCompany(nextCompany || null);
                setBanner('Company details saved.');
              }}
              onCancel={() => setSection('dashboard')}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function fmtDate(d, withTime) {
  if (!d) return '—';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return String(d).slice(0, 10);
  const opts = withTime
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' };
  return x.toLocaleString('en-IN', opts);
}
