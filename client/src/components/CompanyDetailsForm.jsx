import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";

function normalizeUpcase(v) {
  return String(v || "")
    .trim()
    .toUpperCase();
}

export default function CompanyDetailsForm({
  initialCompany,
  indianStates,
  onSaved,
  onCancel,
}) {
  const company = initialCompany || {};

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
  const [bankPaymentType, setBankPaymentType] = useState("gst");

  useEffect(() => {
    // Keep form in sync if Dashboard refreshes after saving.
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
    reader.onerror = () => {
      setError("Failed to read file. Please try again.");
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
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
      onSaved?.(res.company);
    } catch (err) {
      setError(err.message || "Failed to save company details");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card-modern">
      <div className="card-modern-header mb-4">
        <div>
          <h3 className="card-modern-title">
            <i className="fas fa-building me-2" style={{ color: "#6366f1" }} />
            Your Company Details
          </h3>
          <p className="card-modern-subtitle">
            Setup your company once for all invoices
          </p>
        </div>
      </div>

      {/* Quick Setup Guide */}
      <div className="row g-3 mb-4">
        {[
          {
            step: 1,
            title: "Business Identity",
            desc: "Company name, logo, GSTIN, and contact",
          },
          {
            step: 2,
            title: "Payment Setup",
            desc: "Bank and UPI details for invoices",
          },
          {
            step: 3,
            title: "Create Invoices",
            desc: "Auto-fill details in every invoice",
          },
        ].map(({ step, title, desc }) => (
          <div key={step} className="col-md-4">
            <div
              style={{
                padding: "16px",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                borderRadius: "8px",
                background:
                  "linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05))",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#6366f1",
                  fontWeight: "700",
                  marginBottom: "8px",
                }}
              >
                STEP {step}
              </div>
              <h6 style={{ fontWeight: "700", marginBottom: "4px" }}>
                {title}
              </h6>
              <p
                style={{ fontSize: "13px", color: "#64748b", marginBottom: 0 }}
              >
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "20px" }}>
          <i className="fas fa-exclamation-circle me-2" />
          {error}
        </div>
      )}

      <form onSubmit={onSubmit}>
        <div className="row g-4">
          {/* LEFT COLUMN - BASIC DETAILS */}
          <div className="col-lg-6">
            <h5 className="section-header">
              <i className="fas fa-id-card me-2" />
              Business Identity
            </h5>

            {/* Logo Upload */}
            <div className="form-group" style={{ marginBottom: "28px" }}>
              <div className="form-label-wrapper">
                <label className="form-label">Company Logo</label>
                <span className="form-label-optional">Optional</span>
              </div>
              <div
                style={{
                  border: "2px dashed #e2e8f0",
                  borderRadius: "8px",
                  padding: "20px",
                  textAlign: "center",
                  marginBottom: "12px",
                  backgroundColor: "#f8fafc",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    const event = { target: { files: [file] } };
                    onLogoChange(event);
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.backgroundColor = "#ede9fe";
                }}
                onDragLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                }}
              >
                {companyLogo ? (
                  <div>
                    <img
                      src={companyLogo}
                      alt="Company logo"
                      style={{
                        maxHeight: "80px",
                        maxWidth: "180px",
                        objectFit: "contain",
                        marginBottom: "12px",
                      }}
                    />
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        marginBottom: 0,
                      }}
                    >
                      <i
                        className="fas fa-check-circle"
                        style={{ color: "#10b981" }}
                      />{" "}
                      Logo uploaded
                    </p>
                  </div>
                ) : (
                  <div>
                    <i
                      className="fas fa-image"
                      style={{
                        fontSize: "32px",
                        color: "#cbd5e1",
                        marginBottom: "12px",
                        display: "block",
                      }}
                    />
                    <p style={{ marginBottom: "4px", fontWeight: "600" }}>
                      Drag logo here or click to upload
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        marginBottom: 0,
                      }}
                    >
                      PNG or JPG, max 5MB
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={onLogoChange}
                  style={{ display: "none" }}
                  onClick={(e) => {
                    const input = e.target;
                    input.click();
                  }}
                  ref={(input) => {
                    if (input) {
                      input.parentElement.onclick = () => input.click();
                    }
                  }}
                />
              </div>
              {companyLogo && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCompanyLogo("")}
                  style={{ fontSize: "13px", padding: "6px 12px" }}
                >
                  <i className="fas fa-trash-alt me-1" />
                  Remove Logo
                </button>
              )}
              <div className="form-hint-text">
                This logo will appear on all your invoices. Square format works
                best.
              </div>
            </div>

            {/* Company Name */}
            <div className="form-group">
              <label className="form-label">
                Company Name <span className="form-label-required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., ABC Pvt Ltd"
                required
              />
              <div className="form-hint-text">Your official business name</div>
            </div>

            {/* Address */}
            <div className="form-group">
              <label className="form-label">
                Address <span className="form-label-required">*</span>
              </label>
              <textarea
                className="form-textarea"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="Full office address"
                required
              />
              <div className="form-hint-text">
                Complete business address for invoices
              </div>
            </div>

            {/* Phone */}
            <div className="form-group">
              <div className="form-label-wrapper">
                <label className="form-label">Phone</label>
                <span className="form-label-optional">Optional</span>
              </div>
              <input
                type="tel"
                className="form-input"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                placeholder="e.g., +91 9999999999"
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <div className="form-label-wrapper">
                <label className="form-label">Email</label>
                <span className="form-label-optional">Optional</span>
              </div>
              <input
                type="email"
                className="form-input"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                placeholder="e.g., info@company.com"
              />
            </div>

            {/* Website */}
            <div className="form-group">
              <div className="form-label-wrapper">
                <label className="form-label">Website</label>
                <span className="form-label-optional">Optional</span>
              </div>
              <input
                type="url"
                className="form-input"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                placeholder="e.g., www.company.com"
              />
            </div>
          </div>

          {/* RIGHT COLUMN - TAX & PAYMENT DETAILS */}
          <div className="col-lg-6">
            <h5 className="section-header">
              <i className="fas fa-credit-card me-2" />
              Tax & Payment Details
            </h5>

            {/* GSTIN */}
            <div className="form-group">
              <label className="form-label">
                GSTIN <span className="form-label-required">*</span>
              </label>
              <input
                type="text"
                className="form-input font-monospace"
                value={companyGstin}
                onChange={(e) => setCompanyGstin(e.target.value)}
                placeholder="e.g., 27AABCU9603R1Z0"
                required
                style={{ letterSpacing: "1px" }}
              />
              <div className="form-hint-text">15-character GSTIN number</div>
            </div>

            {/* Company Home State */}
            <div className="form-group">
              <label className="form-label">
                Company Home State{" "}
                <span className="form-label-required">*</span>
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
              <div className="form-hint-text">
                Used for CGST/SGST/IGST calculations
              </div>
            </div>

            {/* Bank Payment Type Toggle */}
            <div style={{ marginTop: "32px", marginBottom: "24px" }}>
              <label className="form-label">Payment Details Type</label>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  backgroundColor: "#f1f5f9",
                  padding: "4px",
                  borderRadius: "8px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setBankPaymentType("gst")}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    backgroundColor:
                      bankPaymentType === "gst" ? "white" : "transparent",
                    color: bankPaymentType === "gst" ? "#6366f1" : "#64748b",
                    boxShadow:
                      bankPaymentType === "gst"
                        ? "0 2px 8px rgba(99, 102, 241, 0.2)"
                        : "none",
                  }}
                >
                  <i className="fas fa-receipt me-2" />
                  GST Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setBankPaymentType("nongst")}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    backgroundColor:
                      bankPaymentType === "nongst" ? "white" : "transparent",
                    color: bankPaymentType === "nongst" ? "#6366f1" : "#64748b",
                    boxShadow:
                      bankPaymentType === "nongst"
                        ? "0 2px 8px rgba(99, 102, 241, 0.2)"
                        : "none",
                  }}
                >
                  <i className="fas fa-file-alt me-2" />
                  Non-GST Invoice
                </button>
              </div>
              <div className="form-hint-text">
                Choose the type to edit payment details for that invoice type
              </div>
            </div>

            {/* GST PAYMENT DETAILS */}
            {bankPaymentType === "gst" && (
              <div>
                <div
                  style={{
                    padding: "12px 16px",
                    background:
                      "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(20, 184, 166, 0.1))",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    borderRadius: "8px",
                    marginBottom: "20px",
                    fontSize: "13px",
                    color: "#047857",
                  }}
                >
                  <i className="fas fa-info-circle me-2" />
                  Payment details for GST invoices
                </div>

                <div className="form-group">
                  <label className="form-label">Bank Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={gstBankName}
                    onChange={(e) => setGstBankName(e.target.value)}
                    placeholder="e.g., HDFC Bank"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Account Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={gstAccountName}
                    onChange={(e) => setGstAccountName(e.target.value)}
                    placeholder="Account holder name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Account No.</label>
                  <input
                    type="text"
                    className="form-input font-monospace"
                    value={gstAccountNo}
                    onChange={(e) => setGstAccountNo(e.target.value)}
                    placeholder="Bank account number"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">IFSC Code</label>
                  <input
                    type="text"
                    className="form-input font-monospace"
                    value={gstIfsc}
                    onChange={(e) => setGstIfsc(e.target.value)}
                    placeholder="e.g., HDFC0000001"
                    style={{ letterSpacing: "1px" }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Branch</label>
                  <input
                    type="text"
                    className="form-input"
                    value={gstBranch}
                    onChange={(e) => setGstBranch(e.target.value)}
                    placeholder="Branch name/location"
                  />
                </div>
              </div>
            )}

            {/* NON-GST PAYMENT DETAILS */}
            {bankPaymentType === "nongst" && (
              <div>
                <div
                  style={{
                    padding: "12px 16px",
                    background:
                      "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1))",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                    borderRadius: "8px",
                    marginBottom: "20px",
                    fontSize: "13px",
                    color: "#1e40af",
                  }}
                >
                  <i className="fas fa-info-circle me-2" />
                  Payment details for Non-GST invoices (Bank & UPI)
                </div>

                <div className="form-group">
                  <label className="form-label">Bank Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={nongstBankName}
                    onChange={(e) => setNongstBankName(e.target.value)}
                    placeholder="e.g., ICICI Bank"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Account Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={nongstAccountName}
                    onChange={(e) => setNongstAccountName(e.target.value)}
                    placeholder="Account holder name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Account No.</label>
                  <input
                    type="text"
                    className="form-input font-monospace"
                    value={nongstAccountNo}
                    onChange={(e) => setNongstAccountNo(e.target.value)}
                    placeholder="Bank account number"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">IFSC Code</label>
                  <input
                    type="text"
                    className="form-input font-monospace"
                    value={nongstIfsc}
                    onChange={(e) => setNongstIfsc(e.target.value)}
                    placeholder="e.g., ICIC0000001"
                    style={{ letterSpacing: "1px" }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">UPI ID</label>
                  <input
                    type="text"
                    className="form-input font-monospace"
                    value={nongstUpi}
                    onChange={(e) => setNongstUpi(e.target.value)}
                    placeholder="e.g., yourname@upi"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
          <button
            type="submit"
            className="btn-gradient"
            disabled={saving}
            style={{
              minWidth: "180px",
              opacity: saving ? 0.7 : 1,
              pointerEvents: saving ? "none" : "auto",
            }}
          >
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin me-2" />
                Saving…
              </>
            ) : (
              <>
                <i className="fas fa-save me-2" />
                Save Company Details
              </>
            )}
          </button>
          {onCancel && (
            <button
              type="button"
              className="btn-outline"
              onClick={onCancel}
              style={{ minWidth: "120px" }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
