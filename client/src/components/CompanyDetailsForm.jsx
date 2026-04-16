import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';

function normalizeUpcase(v) {
  return String(v || '').trim().toUpperCase();
}

export default function CompanyDetailsForm({
  initialCompany,
  indianStates,
  onSaved,
  onCancel,
}) {
  const company = initialCompany || {};

  const [companyName, setCompanyName] = useState(company.companyName || '');
  const [companyAddress, setCompanyAddress] = useState(company.companyAddress || '');
  const [companyPhone, setCompanyPhone] = useState(company.companyPhone || '');
  const [companyEmail, setCompanyEmail] = useState(company.companyEmail || '');
  const [companyWebsite, setCompanyWebsite] = useState(company.companyWebsite || '');
  const [companyLogo, setCompanyLogo] = useState(company.companyLogo || '');
  const [companyGstin, setCompanyGstin] = useState(company.companyGstin || '');
  const [companyHomeState, setCompanyHomeState] = useState(company.companyHomeState || 'Delhi');

  const [gstBankName, setGstBankName] = useState(company.gstBankName || '');
  const [gstAccountName, setGstAccountName] = useState(company.gstAccountName || '');
  const [gstAccountNo, setGstAccountNo] = useState(company.gstAccountNo || '');
  const [gstIfsc, setGstIfsc] = useState(company.gstIfsc || '');
  const [gstBranch, setGstBranch] = useState(company.gstBranch || '');

  const [nongstBankName, setNongstBankName] = useState(company.nongstBankName || '');
  const [nongstAccountName, setNongstAccountName] = useState(company.nongstAccountName || '');
  const [nongstAccountNo, setNongstAccountNo] = useState(company.nongstAccountNo || '');
  const [nongstIfsc, setNongstIfsc] = useState(company.nongstIfsc || '');
  const [nongstUpi, setNongstUpi] = useState(company.nongstUpi || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Keep form in sync if Dashboard refreshes after saving.
    setCompanyName(company.companyName || '');
    setCompanyAddress(company.companyAddress || '');
    setCompanyPhone(company.companyPhone || '');
    setCompanyEmail(company.companyEmail || '');
    setCompanyWebsite(company.companyWebsite || '');
    setCompanyLogo(company.companyLogo || '');
    setCompanyGstin(company.companyGstin || '');
    setCompanyHomeState(company.companyHomeState || 'Delhi');

    setGstBankName(company.gstBankName || '');
    setGstAccountName(company.gstAccountName || '');
    setGstAccountNo(company.gstAccountNo || '');
    setGstIfsc(company.gstIfsc || '');
    setGstBranch(company.gstBranch || '');

    setNongstBankName(company.nongstBankName || '');
    setNongstAccountName(company.nongstAccountName || '');
    setNongstAccountNo(company.nongstAccountNo || '');
    setNongstIfsc(company.nongstIfsc || '');
    setNongstUpi(company.nongstUpi || '');
  }, [initialCompany]); // eslint-disable-line react-hooks/exhaustive-deps

  const stateOptions = useMemo(() => indianStates || ['Delhi'], [indianStates]);

  function onLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file for the logo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCompanyLogo(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        companyName,
        companyAddress,
        companyPhone,
        companyEmail,
        companyWebsite,
        companyLogo,
        companyGstin: normalizeUpcase(companyGstin),
        companyHomeState,
        gstBankName,
        gstAccountName,
        gstAccountNo,
        gstIfsc,
        gstBranch,
        nongstBankName,
        nongstAccountName,
        nongstAccountNo,
        nongstIfsc,
        nongstUpi,
      };

      const res = await api('/api/company/me', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      onSaved?.(res.company);
    } catch (err) {
      setError(err.message || 'Failed to save company details');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card border-0 shadow-sm rounded-3">
      <div
        className="card-header border-bottom fw-bold text-white"
        style={{
          background: 'linear-gradient(135deg,#6366f1 0%, #8b5cf6 100%)',
        }}
      >
        <i className="fas fa-building me-2" />
        Your Company Details
      </div>
      <div className="card-body">
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="border rounded-4 p-3 h-100 bg-light">
              <div className="small text-uppercase text-primary fw-bold mb-2">Step 1</div>
              <h6 className="fw-bold mb-1">Business Identity</h6>
              <p className="small text-muted mb-0">Add your company name, logo, GSTIN, and contact details.</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="border rounded-4 p-3 h-100 bg-light">
              <div className="small text-uppercase text-primary fw-bold mb-2">Step 2</div>
              <h6 className="fw-bold mb-1">Payment Setup</h6>
              <p className="small text-muted mb-0">Add bank and UPI details so invoices are ready to share.</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="border rounded-4 p-3 h-100 bg-light">
              <div className="small text-uppercase text-primary fw-bold mb-2">Step 3</div>
              <h6 className="fw-bold mb-1">Create Invoices</h6>
              <p className="small text-muted mb-0">Once saved, every invoice will automatically use your company details.</p>
            </div>
          </div>
        </div>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <div className="border rounded-4 p-3 mb-3 bg-white">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <div className="small text-uppercase text-muted fw-bold">Branding</div>
                    <h6 className="fw-bold mb-0">Company Logo</h6>
                  </div>
                  {companyLogo ? (
                    <img
                      src={companyLogo}
                      alt="Company logo"
                      style={{ width: 64, height: 64, objectFit: 'contain' }}
                    />
                  ) : (
                    <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" style={{ width: 64, height: 64 }}>
                      <i className="fas fa-image text-muted" />
                    </div>
                  )}
                </div>
                <label className="form-label fw-semibold small">Upload Logo</label>
                <input type="file" accept="image/*" className="form-control" onChange={onLogoChange} />
                <div className="small text-muted mt-2">Best result: square PNG or JPG image. This logo will appear on invoices.</div>
                {companyLogo && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger mt-3"
                    onClick={() => setCompanyLogo('')}
                  >
                    Remove logo
                  </button>
                )}
              </div>

              <div className="border rounded-4 p-3 bg-white">
                <div className="small text-uppercase text-muted fw-bold mb-2">Basic Details</div>
              <label className="form-label fw-semibold small">
                Company Name <span className="text-danger">*</span>
              </label>
              <input
                className="form-control"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />

              <label className="form-label fw-semibold small mt-2">
                Address <span className="text-danger">*</span>
              </label>
              <textarea
                className="form-control"
                rows={3}
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                required
              />

              <label className="form-label fw-semibold small mt-2">Phone</label>
              <input
                className="form-control"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
              />

              <label className="form-label fw-semibold small mt-2">Email</label>
              <input
                type="email"
                className="form-control"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
              />

              <label className="form-label fw-semibold small mt-2">Website</label>
              <input
                className="form-control"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
              />
              </div>
            </div>

            <div className="col-md-6">
              <div className="border rounded-4 p-3 bg-white">
              <div className="small text-uppercase text-muted fw-bold mb-2">Tax & Payment Details</div>
              <label className="form-label fw-semibold small">
                GSTIN <span className="text-danger">*</span>
              </label>
              <input
                className="form-control font-monospace text-uppercase"
                value={companyGstin}
                onChange={(e) => setCompanyGstin(e.target.value)}
                required
              />

              <label className="form-label fw-semibold small mt-2">
                Company Home State <span className="text-danger">*</span>
              </label>
              <select
                className="form-select"
                value={companyHomeState}
                onChange={(e) => setCompanyHomeState(e.target.value)}
              >
                {stateOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <hr className="my-3" />
              <div className="small fw-bold text-primary mb-2">GST Payment Details</div>

              <label className="form-label fw-semibold small">Bank Name</label>
              <input className="form-control" value={gstBankName} onChange={(e) => setGstBankName(e.target.value)} />

              <label className="form-label fw-semibold small mt-2">Account Name</label>
              <input className="form-control" value={gstAccountName} onChange={(e) => setGstAccountName(e.target.value)} />

              <label className="form-label fw-semibold small mt-2">Account No.</label>
              <input className="form-control font-monospace" value={gstAccountNo} onChange={(e) => setGstAccountNo(e.target.value)} />

              <label className="form-label fw-semibold small mt-2">IFSC</label>
              <input className="form-control font-monospace" value={gstIfsc} onChange={(e) => setGstIfsc(e.target.value)} />

              <label className="form-label fw-semibold small mt-2">Branch</label>
              <input className="form-control" value={gstBranch} onChange={(e) => setGstBranch(e.target.value)} />

              <hr className="my-3" />
              <div className="small fw-bold text-primary mb-2">Non-GST Payment Details</div>

              <label className="form-label fw-semibold small">Bank Name</label>
              <input className="form-control" value={nongstBankName} onChange={(e) => setNongstBankName(e.target.value)} />

              <label className="form-label fw-semibold small mt-2">Account Name</label>
              <input className="form-control" value={nongstAccountName} onChange={(e) => setNongstAccountName(e.target.value)} />

              <label className="form-label fw-semibold small mt-2">Account No.</label>
              <input className="form-control font-monospace" value={nongstAccountNo} onChange={(e) => setNongstAccountNo(e.target.value)} />

              <label className="form-label fw-semibold small mt-2">IFSC</label>
              <input className="form-control font-monospace" value={nongstIfsc} onChange={(e) => setNongstIfsc(e.target.value)} />

              <label className="form-label fw-semibold small mt-2">UPI</label>
              <input className="form-control font-monospace" value={nongstUpi} onChange={(e) => setNongstUpi(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 mt-4">
            <button type="submit" className="btn btn-success" disabled={saving}>
              {saving ? 'Saving…' : 'Save Company Details'}
            </button>
            {onCancel && (
              <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

