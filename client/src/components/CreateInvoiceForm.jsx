import { useMemo, useState } from 'react';
import { api } from '../api.js';

function fmtNum(n) {
  if (n === 0 || n === '0') return '0';
  let s = parseFloat(n.toPrecision(12)).toString();
  if (s.indexOf('e') !== -1) s = n.toFixed(10).replace(/\.?0+$/, '');
  return s;
}

export default function CreateInvoiceForm({
  companyHomeState,
  indianStates,
  fixedHsnSac,
  onSuccess,
}) {
  const [invoiceType, setInvoiceType] = useState('non_gst');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [clientState, setClientState] = useState('');
  const [taxRate, setTaxRate] = useState('0');
  const [termsOption, setTermsOption] = useState('predefined1');
  const [customTerms, setCustomTerms] = useState('');
  const [items, setItems] = useState([
    { description: '', quantity: '1', price: '' },
  ]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isGst = invoiceType === 'gst';

  const totals = useMemo(() => {
    let subtotal = 0;
    for (const it of items) {
      const q = parseFloat(it.quantity) || 0;
      const p = parseFloat(it.price) || 0;
      subtotal += q * p;
    }
    const rate = parseFloat(taxRate) || 0;
    const same = Boolean(clientState && clientState === companyHomeState);
    let taxAmount = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    if (isGst && rate > 0) {
      if (same) {
        cgst = sgst = (subtotal * (rate / 100)) / 2;
        taxAmount = cgst + sgst;
      } else {
        igst = subtotal * (rate / 100);
        taxAmount = igst;
      }
    } else if (!isGst) {
      taxAmount = subtotal * (rate / 100);
    }
    return { subtotal, taxAmount, total: subtotal + taxAmount, cgst, sgst, igst, same };
  }, [items, taxRate, isGst, clientState, companyHomeState]);

  function addRow() {
    setItems([...items, { description: '', quantity: '1', price: '' }]);
  }

  function removeRow(i) {
    if (items.length <= 1) return;
    setItems(items.filter((_, j) => j !== i));
  }

  function updateItem(i, field, val) {
    setItems(items.map((row, j) => (j === i ? { ...row, [field]: val } : row)));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          clientName,
          clientEmail,
          clientPhone,
          clientAddress,
          dueDate,
          invoiceType,
          gstNumber,
          clientState: isGst ? clientState : '',
          taxRate: parseFloat(taxRate) || 0,
          termsOption,
          customTerms,
          items: items.map((r) => ({
            description: r.description,
            quantity: r.quantity,
            price: r.price,
          })),
        }),
      });
      onSuccess?.();
      setClientName('');
      setClientEmail('');
      setClientPhone('');
      setClientAddress('');
      setDueDate('');
      setGstNumber('');
      setClientState('');
      setTaxRate(isGst ? '18' : '0');
      setTermsOption('predefined1');
      setCustomTerms('');
      setItems([{ description: '', quantity: '1', price: '' }]);
      setInvoiceType('non_gst');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const minDue = new Date().toISOString().slice(0, 10);

  return (
    <div className="card border-0 shadow-sm rounded-3">
      <div className="card-header bg-white border-bottom fw-bold">
        <i className="fas fa-file-invoice-dollar me-2 text-primary" />
        Create New Invoice
      </div>
      <div className="card-body">
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <form onSubmit={onSubmit}>
          <input type="hidden" name="invoice_type" value={invoiceType} />
          <div className="d-flex bg-light rounded p-1 mb-4 border" style={{ gap: 6 }}>
            <button
              type="button"
              className={`btn flex-fill ${!isGst ? 'btn-white shadow-sm' : 'btn-light'}`}
              style={!isGst ? { background: 'white' } : {}}
              onClick={() => {
                setInvoiceType('non_gst');
                setTaxRate('0');
              }}
            >
              Non-GST
            </button>
            <button
              type="button"
              className={`btn flex-fill ${isGst ? 'text-white' : 'btn-light'}`}
              style={isGst ? { background: '#4e73df' } : {}}
              onClick={() => {
                setInvoiceType('gst');
                setTaxRate((r) => (parseFloat(r) === 0 ? '18' : r));
              }}
            >
              GST
            </button>
          </div>

          {isGst && (
            <div className="alert alert-info py-2 small mb-3">
              GST numbers: <strong>JSC/00601…</strong> · Company GSTIN: <strong>07ITQPS9749H1ZG</strong>
            </div>
          )}

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold small">
                Client / Company <span className="text-danger">*</span>
              </label>
              <input
                className="form-control"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
              <label className="form-label fw-semibold small mt-2">Client email</label>
              <input
                type="email"
                className="form-control"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
              <label className="form-label fw-semibold small mt-2">Client phone</label>
              <input
                className="form-control"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
              />
              <label className="form-label fw-semibold small mt-2">Address</label>
              <textarea
                className="form-control"
                rows={3}
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
              />
              {isGst && (
                <div
                  className="mt-3 p-3 rounded border"
                  style={{ background: '#f0f4ff', borderColor: '#c5d5fb' }}
                >
                  <h6 className="text-primary fw-bold small">GST details</h6>
                  <label className="form-label small">Client GSTIN</label>
                  <input
                    className="form-control text-uppercase font-monospace"
                    maxLength={15}
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                  />
                  <label className="form-label small mt-2">
                    Client state <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={clientState}
                    onChange={(e) => setClientState(e.target.value)}
                  >
                    <option value="">Select state</option>
                    {(indianStates || []).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 small text-muted">
                    HSN/SAC: <code className="fw-bold">{fixedHsnSac}</code>
                  </div>
                  {clientState && (
                    <div className="alert alert-primary py-2 small mt-2 mb-0">
                      {totals.same
                        ? 'Same state → CGST + SGST'
                        : 'Inter-state → IGST'}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold small">
                Due date <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                className="form-control"
                min={minDue}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
              <label className="form-label fw-semibold small mt-2">
                {isGst ? 'GST rate (%)' : 'Tax rate (%)'}
              </label>
              <input
                type="number"
                className="form-control"
                step="any"
                min={0}
                max={100}
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
              {isGst && (
                <div className="small mt-1">
                  {[0, 5, 12, 18, 28].map((r) => (
                    <button
                      key={r}
                      type="button"
                      className="btn btn-sm btn-outline-secondary me-1 py-0"
                      onClick={() => setTaxRate(String(r))}
                    >
                      {r}%
                    </button>
                  ))}
                </div>
              )}
              <label className="form-label fw-semibold small mt-3">Terms</label>
              <div className="border rounded p-3 bg-light small">
                {[
                  ['predefined1', 'Virtual Panel T&C'],
                  ['predefined2', 'Whatsend Software T&C'],
                  ['meta_ads', 'Meta Ads T&C'],
                  ['google_ads', 'Google Ads T&C'],
                  ['api', 'API T&C'],
                  ['custom', 'Custom T&C'],
                ].map(([v, lbl]) => (
                  <div key={v} className="form-check mb-1">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="terms_option"
                      id={`t-${v}`}
                      checked={termsOption === v}
                      onChange={() => setTermsOption(v)}
                    />
                    <label className="form-check-label" htmlFor={`t-${v}`}>
                      {lbl}
                    </label>
                  </div>
                ))}
                {termsOption === 'custom' && (
                  <textarea
                    className="form-control mt-2"
                    rows={3}
                    placeholder="One term per line"
                    value={customTerms}
                    onChange={(e) => setCustomTerms(e.target.value)}
                  />
                )}
              </div>
            </div>
          </div>

          <h6 className="fw-bold mt-4 mb-2">
            <i className="fas fa-list me-2 text-primary" />
            Line items
          </h6>
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Description</th>
                  <th style={{ width: 90 }}>Qty</th>
                  <th style={{ width: 110 }}>Rate</th>
                  <th style={{ width: 100 }}>Amount</th>
                  <th style={{ width: 50 }} />
                </tr>
              </thead>
              <tbody>
                {items.map((row, i) => {
                  const amt =
                    (parseFloat(row.quantity) || 0) * (parseFloat(row.price) || 0);
                  return (
                    <tr key={i}>
                      <td>
                        <input
                          className="form-control form-control-sm"
                          value={row.description}
                          onChange={(e) => updateItem(i, 'description', e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          step="any"
                          min="0.000001"
                          value={row.quantity}
                          onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          step="any"
                          value={row.price}
                          onChange={(e) => updateItem(i, 'price', e.target.value)}
                          required
                        />
                      </td>
                      <td className="fw-bold">₹{fmtNum(amt)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeRow(i)}
                        >
                          <i className="fas fa-trash" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button type="button" className="btn btn-sm btn-primary mb-3" onClick={addRow}>
            <i className="fas fa-plus me-1" />
            Add item
          </button>

          <div className="text-end mb-4">
            <div
              className="d-inline-block border rounded p-3 text-start"
              style={{ minWidth: 280 }}
            >
              <div className="d-flex justify-content-between">
                <span className="text-muted">Subtotal</span>
                <span>₹{fmtNum(totals.subtotal)}</span>
              </div>
              {isGst && totals.same && (
                <>
                  <div className="d-flex justify-content-between small">
                    <span>CGST</span>
                    <span>₹{fmtNum(totals.cgst)}</span>
                  </div>
                  <div className="d-flex justify-content-between small">
                    <span>SGST</span>
                    <span>₹{fmtNum(totals.sgst)}</span>
                  </div>
                </>
              )}
              {isGst && !totals.same && (
                <div className="d-flex justify-content-between small">
                  <span>IGST</span>
                  <span>₹{fmtNum(totals.igst)}</span>
                </div>
              )}
              {!isGst && (
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Tax</span>
                  <span>₹{fmtNum(totals.taxAmount)}</span>
                </div>
              )}
              <div className="d-flex justify-content-between fw-bold border-top pt-2 mt-2 text-primary">
                <span>Total</span>
                <span>₹{fmtNum(totals.total)}</span>
              </div>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-success" disabled={saving}>
              {saving ? 'Saving…' : 'Create invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
