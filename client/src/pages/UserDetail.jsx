import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtExact } from '../utils/format.js';

export default function UserDetail() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    api(`/api/users/${id}`)
      .then(setData)
      .catch((e) => setErr(e.message));
  }, [id, isAdmin]);

  if (!isAdmin) return <Navigate to="/" replace />;

  if (err) {
    return (
      <div className="p-4 app-main-offset">
        <div className="alert alert-danger">{err}</div>
        <Link to="/?section=users">Back to users</Link>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="d-flex justify-content-center p-5 app-main-offset">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  const { user, invoices, logs, stats } = data;

  return (
    <div className="app-main-offset p-3 p-md-4" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <Link to="/?section=users" className="btn btn-outline-secondary btn-sm mb-3">
        ← Users
      </Link>
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h4 className="mb-1">{user.name}</h4>
          <p className="text-muted mb-0 small">{user.email}</p>
          <span className={`badge ${user.role === 'admin' ? 'bg-primary' : 'bg-success'} mt-2`}>
            {user.role}
          </span>
          <p className="small mt-3 mb-0">
            Paid revenue: <strong>₹{fmtExact(stats.paidTotal)}</strong> · Invoices:{' '}
            <strong>{invoices.length}</strong>
          </p>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white fw-bold">Invoices</div>
        <div className="table-responsive">
          <table className="table table-hover mb-0 small">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Client</th>
                <th>Total</th>
                <th>Status</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="font-monospace">{inv.number}</td>
                  <td>{inv.clientName}</td>
                  <td>₹{fmtExact(inv.total)}</td>
                  <td className="text-capitalize">{inv.status}</td>
                  <td>{fmt(inv.createdAt)}</td>
                  <td>
                    <Link to={`/invoice/${inv.id}`} className="btn btn-sm btn-outline-primary">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!invoices.length && <p className="text-center text-muted py-3 mb-0">No invoices.</p>}
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white fw-bold">Activity</div>
        <div className="table-responsive">
          <table className="table table-hover mb-0 small">
            <thead className="table-light">
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Target</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{fmt(log.createdAt, true)}</td>
                  <td>{log.action}</td>
                  <td>{log.targetId || '—'}</td>
                  <td>{log.details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!logs.length && <p className="text-center text-muted py-3 mb-0">No logs.</p>}
        </div>
      </div>
    </div>
  );
}

function fmt(d, withTime) {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return String(d);
  return x.toLocaleString('en-IN', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' });
}
