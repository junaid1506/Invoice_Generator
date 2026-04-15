import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import CreateInvoiceForm from '../components/CreateInvoiceForm.jsx';
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
  const { user, appName, isAdmin, logout } = useAuth();
  const nav = useNavigate();
  const [search, setSearch] = useSearchParams();
  const section = search.get('section') || 'dashboard';

  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [filterGst, setFilterGst] = useState('all');
  const [banner, setBanner] = useState('');

  const load = useCallback(async () => {
    const [cfg, st, inv] = await Promise.all([
      api('/api/config'),
      api('/api/invoices/stats'),
      api('/api/invoices'),
    ]);
    setConfig(cfg);
    setStats(st);
    setInvoices(inv.invoices || []);
    if (isAdmin) {
      const [u, l] = await Promise.all([api('/api/users'), api('/api/logs')]);
      setUsers(u.users || []);
      setLogs(l.logs || []);
    }
  }, [isAdmin]);

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

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <aside style={sidebarStyle} className="d-none d-md-flex">
        <div className="p-3 border-bottom border-light border-opacity-25">
          <h5 className="fw-bold mb-0 small">
            <i className="fas fa-file-invoice-dollar me-2" />
            {appName}
          </h5>
          <small className="opacity-75">{user?.role} panel</small>
        </div>
        <ul className="list-unstyled flex-grow-1 py-2 mb-0 small fw-semibold">
          {[
            ['dashboard', 'fa-tachometer-alt', 'Dashboard'],
            ['create-invoice', 'fa-plus-circle', 'Create Invoice'],
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
          {isAdmin && (
            <>
              <li
                className={`px-3 py-2 ${section === 'users' ? 'bg-white bg-opacity-20 border-start border-3 border-white' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setSection('users')}
              >
                <i className="fas fa-users me-2" style={{ width: 20 }} />
                Users
              </li>
              <li
                className={`px-3 py-2 ${section === 'logs' ? 'bg-white bg-opacity-20 border-start border-3 border-white' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setSection('logs')}
              >
                <i className="fas fa-history me-2" style={{ width: 20 }} />
                Activity logs
              </li>
            </>
          )}
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
            {isAdmin && <option value="users">Users</option>}
            {isAdmin && <option value="logs">Logs</option>}
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

              <div className="card border-0 shadow-sm rounded-3">
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
                    onClick={() => setSection('create-invoice')}
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
                        {isAdmin && <th>Created by</th>}
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
                            {isAdmin && <td>{inv.userName || '—'}</td>}
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
                              {isAdmin && (
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
            <CreateInvoiceForm
              companyHomeState={config.companyHomeState}
              indianStates={config.indianStates}
              fixedHsnSac={config.fixedHsnSac}
              onSuccess={() => {
                setBanner('Invoice created successfully.');
                load();
                setSection('dashboard');
              }}
            />
          )}

          {section === 'users' && isAdmin && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white fw-bold">Users</div>
              <div className="table-responsive">
                <table className="table table-hover mb-0 small">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Invoices</th>
                      <th>Revenue</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.id.slice(-6)}</td>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`badge ${u.role === 'admin' ? 'bg-primary' : 'bg-success'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>{fmtDate(u.createdAt)}</td>
                        <td>{u.invoiceCount}</td>
                        <td>₹{u.totalRevenueFormatted}</td>
                        <td>
                          <Link to={`/users/${u.id}`} className="btn btn-sm btn-outline-primary">
                            History
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === 'logs' && isAdmin && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white fw-bold">Activity logs</div>
              <div className="table-responsive">
                <table className="table table-hover mb-0 small">
                  <thead className="table-light">
                    <tr>
                      <th>Time</th>
                      <th>User</th>
                      <th>Action</th>
                      <th>Target</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td>{fmtDate(log.createdAt, true)}</td>
                        <td>{log.userName}</td>
                        <td>{log.action}</td>
                        <td>{log.targetId || '—'}</td>
                        <td>{log.details || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!logs.length && (
                  <p className="text-center text-muted py-4 mb-0">No logs yet.</p>
                )}
              </div>
            </div>
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
