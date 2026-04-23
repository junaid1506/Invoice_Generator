import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api.js";
import "./Companydetailsform.css";

function normalizeUpcase(v) {
  return String(v || "")
    .trim()
    .toUpperCase();
}

// ── Inline SVG icon ──────────────────────────────────────────
function Icon({ d, size = 16, color = "currentColor", style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
    >
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  building: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  id: "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z",
  card: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  invoice:
    "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  save: "M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4",
  spin: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  check: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  image:
    "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  trash:
    "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  receipt:
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  x: "M6 18L18 6M6 6l12 12",
};

// ── Section card ─────────────────────────────────────────────
function SectionCard({ icon, title, children }) {
  return (
    <div className="cdf-card">
      <div className="cdf-card-head">
        <div className="cdf-card-head-icon">
          <Icon d={icon} size={15} color="white" />
        </div>
        <span className="cdf-card-title">{title}</span>
      </div>
      <div className="cdf-card-body">{children}</div>
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────
function Field({ label, required, optional, hint, children }) {
  return (
    <div className="cdf-field">
      {label && (
        <label className="cdf-label">
          {label}
          {required && <span className="cdf-req"> *</span>}
          {optional && <span className="cdf-opt">Optional</span>}
        </label>
      )}
      {children}
      {hint && <div className="cdf-hint">{hint}</div>}
    </div>
  );
}

export default function CompanyDetailsForm({
  initialCompany,
  indianStates,
  onSaved,
  onCancel,
}) {
  const company = initialCompany || {};
  const topRef = useRef(null);
  const logoInputRef = useRef(null);

  const [companyName, setCompanyName] = useState(company.companyName || "");
  const [companyAddress, setCompanyAddress] = useState(
    company.companyAddress || "",
  );
  const [companyPhone, setCompanyPhone] = useState(company.companyPhone || "");
  const [companyEmail, setCompanyEmail] = useState(company.companyEmail || "");
  const [companyWebsite, setCompanyWebsite] = useState(
    company.companyWebsite || "",
  );
  const [companyLogo, setCompanyLogo] = useState(company.companyLogo || "");
  const [companyGstin, setCompanyGstin] = useState(company.companyGstin || "");
  const [companyHomeState, setCompanyHomeState] = useState(
    company.companyHomeState || "Delhi",
  );

  const [gstBankName, setGstBankName] = useState(company.gstBankName || "");
  const [gstAccountName, setGstAccountName] = useState(
    company.gstAccountName || "",
  );
  const [gstAccountNo, setGstAccountNo] = useState(company.gstAccountNo || "");
  const [gstIfsc, setGstIfsc] = useState(company.gstIfsc || "");
  const [gstBranch, setGstBranch] = useState(company.gstBranch || "");

  const [nongstBankName, setNongstBankName] = useState(
    company.nongstBankName || "",
  );
  const [nongstAccountName, setNongstAccountName] = useState(
    company.nongstAccountName || "",
  );
  const [nongstAccountNo, setNongstAccountNo] = useState(
    company.nongstAccountNo || "",
  );
  const [nongstIfsc, setNongstIfsc] = useState(company.nongstIfsc || "");
  const [nongstUpi, setNongstUpi] = useState(company.nongstUpi || "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [bankPaymentType, setBankPaymentType] = useState("gst");

  // Sync when parent refreshes initialCompany
  useEffect(() => {
    setCompanyName(company.companyName || "");
    setCompanyAddress(company.companyAddress || "");
    setCompanyPhone(company.companyPhone || "");
    setCompanyEmail(company.companyEmail || "");
    setCompanyWebsite(company.companyWebsite || "");
    setCompanyLogo(company.companyLogo || "");
    setCompanyGstin(company.companyGstin || "");
    setCompanyHomeState(company.companyHomeState || "Delhi");
    setGstBankName(company.gstBankName || "");
    setGstAccountName(company.gstAccountName || "");
    setGstAccountNo(company.gstAccountNo || "");
    setGstIfsc(company.gstIfsc || "");
    setGstBranch(company.gstBranch || "");
    setNongstBankName(company.nongstBankName || "");
    setNongstAccountName(company.nongstAccountName || "");
    setNongstAccountNo(company.nongstAccountNo || "");
    setNongstIfsc(company.nongstIfsc || "");
    setNongstUpi(company.nongstUpi || "");
  }, [initialCompany]); // eslint-disable-line react-hooks/exhaustive-deps

  const stateOptions = useMemo(() => indianStates || ["Delhi"], [indianStates]);

  function onLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file for the logo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCompanyLogo(typeof reader.result === "string" ? reader.result : "");
      setError("");
    };
    reader.onerror = () => setError("Failed to read file. Please try again.");
    reader.readAsDataURL(file);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
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
      const res = await api("/api/company/me", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      // ── Scroll to top & show success ──
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setSuccessMsg("Company details saved successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);

      onSaved?.(res.company);
    } catch (err) {
      setError(err.message || "Failed to save company details");
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="cdf-root" ref={topRef}>
      {/* ── Success toast ── */}
      {successMsg && (
        <div className="cdf-toast">
          <div className="cdf-toast-icon">
            <Icon d={ICONS.check} size={15} color="white" />
          </div>
          {successMsg}
        </div>
      )}

      {/* ── Page header ── */}
      <div className="cdf-page-header">
        <div className="cdf-page-header-icon">
          <Icon d={ICONS.building} size={20} color="white" />
        </div>
        <div>
          <h2 className="cdf-page-title">Company Details</h2>
          <p className="cdf-page-sub">
            Setup your company once for all invoices
          </p>
        </div>
      </div>

      {/* ── Step pills ── */}
      <div className="cdf-steps">
        {[
          {
            n: "01",
            label: "Business Identity",
            sub: "Name, logo, GSTIN & contact",
          },
          { n: "02", label: "Payment Setup", sub: "Bank & UPI details" },
          {
            n: "03",
            label: "Auto-fill",
            sub: "Details added to every invoice",
          },
        ].map((s, i) => (
          <div key={i} className="cdf-step">
            <div className="cdf-step-num">{s.n}</div>
            <div>
              <div className="cdf-step-label">{s.label}</div>
              <div className="cdf-step-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="cdf-error">
          <Icon d={ICONS.info} size={16} />
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} noValidate>
        <div className="cdf-two-col">
          {/* ═══ LEFT: Business Identity ═══ */}
          <SectionCard icon={ICONS.id} title="Business Identity">
            {/* Logo upload */}
            <Field
              label="Company Logo"
              optional
              hint="Square format works best. PNG or JPG, max 5 MB."
            >
              {/* Hidden file input triggered via ref */}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={onLogoChange}
                style={{ display: "none" }}
              />
              <div
                className="cdf-logo-zone"
                onClick={() => logoInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) onLogoChange({ target: { files: [file] } });
                }}
              >
                {companyLogo ? (
                  <>
                    <img
                      src={companyLogo}
                      alt="Company logo"
                      className="cdf-logo-preview"
                    />
                    <div className="cdf-logo-success">
                      <Icon d={ICONS.check} size={13} color="#22c55e" /> Logo
                      uploaded
                    </div>
                  </>
                ) : (
                  <>
                    <Icon
                      d={ICONS.image}
                      size={32}
                      color="var(--s300)"
                      style={{ marginBottom: 10 }}
                    />
                    <div className="cdf-logo-title">
                      Drag logo here or click to upload
                    </div>
                    <div className="cdf-logo-sub">PNG or JPG, max 5 MB</div>
                  </>
                )}
              </div>
              {companyLogo && (
                <button
                  type="button"
                  className="cdf-remove-btn"
                  onClick={() => setCompanyLogo("")}
                >
                  <Icon d={ICONS.trash} size={13} color="#dc2626" /> Remove Logo
                </button>
              )}
            </Field>

            <div className="cdf-divider" />

            {/* Company name */}
            <Field
              label="Company Name"
              required
              hint="Your official business name"
            >
              <input
                className="cdf-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., ABC Pvt Ltd"
                required
              />
            </Field>

            {/* Address */}
            <Field
              label="Address"
              required
              hint="Complete billing address for invoices"
            >
              <textarea
                className="cdf-input cdf-textarea"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="Full office address…"
                required
              />
            </Field>

            {/* Phone + Email */}
            <div className="cdf-field-row">
              <Field label="Phone" optional>
                <input
                  type="tel"
                  className="cdf-input"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  placeholder="+91 9999999999"
                />
              </Field>
              <Field label="Email" optional>
                <input
                  type="email"
                  className="cdf-input"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  placeholder="info@company.com"
                />
              </Field>
            </div>

            {/* Website */}
            <Field label="Website" optional>
              <input
                type="url"
                className="cdf-input"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                placeholder="www.company.com"
              />
            </Field>
          </SectionCard>

          {/* ═══ RIGHT: Tax & Payment ═══ */}
          <SectionCard icon={ICONS.card} title="Tax & Payment Details">
            {/* GSTIN */}
            <Field
              label="GSTIN"
              required
              hint="15-character GST identification number"
            >
              <input
                type="text"
                className="cdf-input cdf-mono"
                value={companyGstin}
                onChange={(e) => setCompanyGstin(e.target.value.toUpperCase())}
                placeholder="27AABCU9603R1Z0"
                maxLength={15}
                required
              />
            </Field>

            {/* Home state */}
            <Field
              label="Company Home State"
              required
              hint="Used for CGST / SGST / IGST calculations"
            >
              <select
                className="cdf-input cdf-select"
                value={companyHomeState}
                onChange={(e) => setCompanyHomeState(e.target.value)}
              >
                {stateOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>

            <div className="cdf-divider" />

            {/* Payment type toggle */}
            <Field label="Payment Details For">
              <div className="cdf-pay-toggle">
                <button
                  type="button"
                  className={`cdf-pay-btn ${bankPaymentType === "gst" ? "active" : ""}`}
                  onClick={() => setBankPaymentType("gst")}
                >
                  <Icon d={ICONS.receipt} size={15} />
                  GST Invoice
                </button>
                <button
                  type="button"
                  className={`cdf-pay-btn ${bankPaymentType === "nongst" ? "active" : ""}`}
                  onClick={() => setBankPaymentType("nongst")}
                >
                  <Icon d={ICONS.invoice} size={15} />
                  Non-GST Invoice
                </button>
              </div>
            </Field>

            {/* ── GST bank details ── */}
            {bankPaymentType === "gst" && (
              <>
                <div className="cdf-info-banner green">
                  <Icon d={ICONS.info} size={14} color="#15803d" />
                  Bank details printed on GST invoices
                </div>
                <Field label="Bank Name">
                  <input
                    className="cdf-input"
                    value={gstBankName}
                    onChange={(e) => setGstBankName(e.target.value)}
                    placeholder="e.g., HDFC Bank"
                  />
                </Field>
                <Field label="Account Name">
                  <input
                    className="cdf-input"
                    value={gstAccountName}
                    onChange={(e) => setGstAccountName(e.target.value)}
                    placeholder="Account holder name"
                  />
                </Field>
                <div className="cdf-field-row">
                  <Field label="Account No.">
                    <input
                      className="cdf-input cdf-mono"
                      value={gstAccountNo}
                      onChange={(e) => setGstAccountNo(e.target.value)}
                      placeholder="Account number"
                    />
                  </Field>
                  <Field label="IFSC Code">
                    <input
                      className="cdf-input cdf-mono"
                      value={gstIfsc}
                      onChange={(e) => setGstIfsc(e.target.value.toUpperCase())}
                      placeholder="HDFC0000001"
                    />
                  </Field>
                </div>
                <Field label="Branch">
                  <input
                    className="cdf-input"
                    value={gstBranch}
                    onChange={(e) => setGstBranch(e.target.value)}
                    placeholder="Branch name / location"
                  />
                </Field>
              </>
            )}

            {/* ── Non-GST bank details ── */}
            {bankPaymentType === "nongst" && (
              <>
                <div className="cdf-info-banner blue">
                  <Icon d={ICONS.info} size={14} color="#1d4ed8" />
                  Bank & UPI details for Non-GST invoices
                </div>
                <Field label="Bank Name">
                  <input
                    className="cdf-input"
                    value={nongstBankName}
                    onChange={(e) => setNongstBankName(e.target.value)}
                    placeholder="e.g., ICICI Bank"
                  />
                </Field>
                <Field label="Account Name">
                  <input
                    className="cdf-input"
                    value={nongstAccountName}
                    onChange={(e) => setNongstAccountName(e.target.value)}
                    placeholder="Account holder name"
                  />
                </Field>
                <div className="cdf-field-row">
                  <Field label="Account No.">
                    <input
                      className="cdf-input cdf-mono"
                      value={nongstAccountNo}
                      onChange={(e) => setNongstAccountNo(e.target.value)}
                      placeholder="Account number"
                    />
                  </Field>
                  <Field label="IFSC Code">
                    <input
                      className="cdf-input cdf-mono"
                      value={nongstIfsc}
                      onChange={(e) =>
                        setNongstIfsc(e.target.value.toUpperCase())
                      }
                      placeholder="ICIC0000001"
                    />
                  </Field>
                </div>
                <Field label="UPI ID" hint="Shown as QR / UPI on invoices">
                  <input
                    className="cdf-input cdf-mono"
                    value={nongstUpi}
                    onChange={(e) => setNongstUpi(e.target.value)}
                    placeholder="yourname@upi"
                  />
                </Field>
              </>
            )}
          </SectionCard>
        </div>

        {/* ── Submit row ── */}
        <div className="cdf-submit-row">
          <button type="submit" className="cdf-submit-btn" disabled={saving}>
            {saving ? (
              <>
                <Icon
                  d={ICONS.spin}
                  size={16}
                  color="white"
                  style={{ animation: "cdf-spin .7s linear infinite" }}
                />
                Saving…
              </>
            ) : (
              <>
                <Icon d={ICONS.save} size={16} color="white" />
                Save Company Details
              </>
            )}
          </button>
          {onCancel && (
            <button type="button" className="cdf-cancel-btn" onClick={onCancel}>
              <Icon d={ICONS.x} size={15} />
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
