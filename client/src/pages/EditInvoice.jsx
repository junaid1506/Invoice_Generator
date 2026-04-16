import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";

const PREDEFINED = {
  predefined1: [
    "Messages will delivered in maximum 4 hours.",
    "Message will be delivered by virtual number.",
    "Send unlimited messages without banning issues with virtual number panel.",
    "The campaign should be submitted from 10 AM to 6 AM.",
  ],
  predefined2: [
    "Messages will be deliver by your number.",
    "Support will be 10am to 6pm monday to Saturday.",
    "Software can be reinstall maximum 3 times.",
  ],
  meta_ads: [
    "The client will provide the ad budget separately (paid directly to Meta).",
    "Agency fee of ₹8,000/- is non-refundable and payable in advance each month.",
    "Any additional campaigns beyond 4 per month will be chargeable separately.",
    "The client is responsible for providing accurate business details and approvals for creatives.",
    "JSC SOFTWARE will not be liable for any account restrictions or policy violations from Meta.",
    "Service is valid for one month and renewable with advance payment.",
  ],
  google_ads: [
    "The client will provide the ad budget separately (paid directly to Google Ads).",
    "Agency fee of ₹10,000/- is non-refundable and payable in advance each month.",
    "Any additional campaigns beyond 2 per month will be chargeable separately.",
    "The client is responsible for providing accurate business details and approvals for creatives.",
    "JSC SOFTWARE will not be liable for any account restrictions or policy violations from Google Ads.",
    "Service is valid for one month and renewable with advance payment.",
  ],
  api: [
    "Messages will be delivered through your official number.",
    "Onboarding time will be 7 working days.",
    "Message costs will be additional as per Meta charges.",
    "This will be a one-year service.",
  ],
};

function fmtNum(n) {
  let s = parseFloat(Number(n).toPrecision(12)).toString();
  if (s.indexOf("e") !== -1)
    s = Number(n)
      .toFixed(10)
      .replace(/\.?0+$/, "");
  return s || "0";
}

function detectTermsOption(terms) {
  if (!terms?.length) return "predefined1";
  for (const [k, arr] of Object.entries(PREDEFINED)) {
    if (JSON.stringify(terms) === JSON.stringify(arr)) return k;
  }
  return "custom";
}

export default function EditInvoice() {
  const { id } = useParams();
  const nav = useNavigate();
  const [config, setConfig] = useState(null);
  const [companyHomeState, setCompanyHomeState] = useState("Delhi");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invoiceType, setInvoiceType] = useState("non_gst");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [clientState, setClientState] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [termsOption, setTermsOption] = useState("predefined1");
  const [customTerms, setCustomTerms] = useState("");
  const [items, setItems] = useState([
    { description: "", quantity: "1", price: "" },
  ]);
  const [saving, setSaving] = useState(false);

  const isGst = invoiceType === "gst";

  useEffect(() => {
    Promise.all([api("/api/config"), api(`/api/invoices/${id}`)])
      .then(([cfg, data]) => {
        setConfig(cfg);
        const inv = data.invoice;
        if (inv.status === "paid") {
          nav(`/invoice/${id}`);
          return;
        }
        setCompanyHomeState(inv.companyState || "Delhi");
        setInvoiceType(inv.isGst === "yes" ? "gst" : "non_gst");
        setClientName(inv.clientName || "");
        setClientEmail(inv.clientEmail || "");
        setClientPhone(inv.clientPhone || "");
        setClientAddress(inv.clientAddress || "");
        setDueDate(String(inv.dueDate || "").slice(0, 10));
        setGstNumber(inv.gstNumber || "");
        setClientState(inv.clientState || "");
        setTaxRate(String(inv.taxRate ?? 0));
        const to = detectTermsOption(inv.terms);
        setTermsOption(to);
        setCustomTerms(to === "custom" ? (inv.terms || []).join("\n") : "");
        setItems(
          (inv.items || []).length
            ? inv.items.map((it) => ({
                description: it.description || "",
                quantity: String(it.quantity ?? ""),
                price: String(it.price ?? ""),
              }))
            : [{ description: "", quantity: "1", price: "" }],
        );
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, nav]);

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
    return { subtotal, taxAmount, total: subtotal + taxAmount, same };
  }, [items, taxRate, isGst, clientState, companyHomeState]);

  function addRow() {
    setItems([...items, { description: "", quantity: "1", price: "" }]);
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
    setSaving(true);
    setError("");
    try {
      await api(`/api/invoices/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          clientName,
          clientEmail,
          clientPhone,
          clientAddress,
          dueDate,
          invoiceType,
          gstNumber,
          clientState: isGst ? clientState : "",
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
      nav(`/invoice/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center p-5">
        <div className="spinner-border text-primary" />
      </div>
    );
  }
  if (error && !clientName) {
    return (
      <div className="p-4">
        <div className="alert alert-danger">{error}</div>
        <Link to="/">Back</Link>
      </div>
    );
  }

  return (
    <div
      className="app-main-offset p-3 p-md-4"
      style={{ maxWidth: 1100, margin: "0 auto" }}
    >
      <div className="d-flex align-items-center gap-2 mb-4">
        <Link
          to={`/invoice/${id}`}
          className="btn btn-outline"
          style={{ fontSize: "13px", padding: "6px 12px" }}
        >
          <i className="fas fa-arrow-left me-1" />
          View Invoice
        </Link>
        <h3 style={{ marginBottom: 0, fontWeight: "700", color: "#1e293b" }}>
          <i className="fas fa-edit me-2" style={{ color: "#6366f1" }} />
          Edit Invoice
        </h3>
      </div>
      {error && (
        <div className="alert alert-error" style={{ marginBottom: "20px" }}>
          <i className="fas fa-exclamation-circle me-2" />
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="card-modern">
        <div className="card-modern-header mb-4">
          <h4 className="card-modern-title">
            <i
              className="fas fa-file-invoice me-2"
              style={{ color: "#6366f1" }}
            />
            Invoice Details
          </h4>
        </div>
        <div style={{ marginBottom: "28px" }}>
          <label className="form-label" style={{ marginBottom: "12px" }}>
            Invoice Type
          </label>
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
              onClick={() => setInvoiceType("non_gst")}
              style={{
                flex: 1,
                padding: "10px 16px",
                border: "none",
                borderRadius: "6px",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                backgroundColor: !isGst ? "white" : "transparent",
                color: !isGst ? "#6366f1" : "#64748b",
                boxShadow: !isGst
                  ? "0 2px 8px rgba(99, 102, 241, 0.2)"
                  : "none",
              }}
            >
              Non-GST
            </button>
            <button
              type="button"
              onClick={() => setInvoiceType("gst")}
              style={{
                flex: 1,
                padding: "10px 16px",
                border: "none",
                borderRadius: "6px",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                backgroundColor: isGst ? "white" : "transparent",
                color: isGst ? "#6366f1" : "#64748b",
                boxShadow: isGst ? "0 2px 8px rgba(99, 102, 241, 0.2)" : "none",
              }}
            >
              GST
            </button>
          </div>
        </div>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label small fw-bold">
              Client <span className="text-danger">*</span>
            </label>
            <input
              className="form-control"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
            <label className="form-label small fw-bold mt-2">
              Email
              <span className="form-label-optional">Optional</span>
            </label>
            <input
              type="email"
              className="form-control"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
            <label className="form-label small fw-bold mt-2">
              Phone
              <span className="form-label-optional">Optional</span>
            </label>
            <input
              className="form-control"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
            />
            <label className="form-label small fw-bold mt-2">
              Address
              <span className="form-label-optional">Optional</span>
            </label>
            <textarea
              className="form-control"
              rows={3}
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
            />
            {isGst && (
              <div className="mt-3 p-3 border rounded bg-light">
                <label className="form-label small">GSTIN</label>
                <input
                  className="form-control font-monospace text-uppercase"
                  maxLength={15}
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                />
                <label className="form-label small mt-2">Client state</label>
                <select
                  className="form-select"
                  value={clientState}
                  onChange={(e) => setClientState(e.target.value)}
                >
                  <option value="">—</option>
                  {(config?.indianStates || []).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="col-md-6">
            <label className="form-label small fw-bold">Due date *</label>
            <input
              type="date"
              className="form-control"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
            <label className="form-label small fw-bold mt-2">
              Tax / GST rate %
            </label>
            <input
              type="number"
              className="form-control"
              step="any"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
            />
            <label className="form-label small fw-bold mt-2">Terms</label>
            <div className="border rounded p-2 small bg-white">
              {Object.keys(PREDEFINED).map((k) => (
                <div key={k} className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="terms"
                    id={`term-${k}`}
                    checked={termsOption === k}
                    onChange={() => setTermsOption(k)}
                  />
                  <label className="form-check-label" htmlFor={`term-${k}`}>
                    {k}
                  </label>
                </div>
              ))}
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="terms"
                  id="term-custom"
                  checked={termsOption === "custom"}
                  onChange={() => setTermsOption("custom")}
                />
                <label className="form-check-label" htmlFor="term-custom">
                  Custom
                </label>
              </div>
              {termsOption === "custom" && (
                <textarea
                  className="form-control mt-2"
                  rows={4}
                  value={customTerms}
                  onChange={(e) => setCustomTerms(e.target.value)}
                />
              )}
            </div>
          </div>
        </div>

        <h6 className="mt-4">Items</h6>
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Description</th>
              <th style={{ width: 90 }}>Qty</th>
              <th style={{ width: 100 }}>Rate</th>
              <th style={{ width: 90 }}>Amt</th>
              <th />
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
                      onChange={(e) =>
                        updateItem(i, "description", e.target.value)
                      }
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="any"
                      className="form-control form-control-sm"
                      value={row.quantity}
                      onChange={(e) =>
                        updateItem(i, "quantity", e.target.value)
                      }
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="any"
                      className="form-control form-control-sm"
                      value={row.price}
                      onChange={(e) => updateItem(i, "price", e.target.value)}
                      required
                    />
                  </td>
                  <td>₹{fmtNum(amt)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removeRow(i)}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button
          type="button"
          className="btn-gradient"
          onClick={addRow}
          style={{
            marginBottom: "20px",
            fontSize: "13px",
            padding: "8px 16px",
          }}
        >
          <i className="fas fa-plus me-1" />
          Add Item
        </button>
        <div
          style={{
            textAlign: "right",
            fontSize: "13px",
            marginBottom: "20px",
            padding: "12px 16px",
            background: "#f1f5f9",
            borderRadius: "8px",
          }}
        >
          <div style={{ marginBottom: "4px" }}>
            Subtotal: ₹{fmtNum(totals.subtotal)}
          </div>
          <div style={{ marginBottom: "4px" }}>
            Tax: ₹{fmtNum(totals.taxAmount)}
          </div>
          <div
            style={{ fontWeight: "700", color: "#6366f1", fontSize: "15px" }}
          >
            Total: ₹{fmtNum(totals.total)}
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button type="submit" className="btn-gradient" disabled={saving}>
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin me-2" />
                Saving…
              </>
            ) : (
              <>
                <i className="fas fa-save me-2" />
                Save Changes
              </>
            )}
          </button>

          <Link
            to={`/invoice/${id}`}
            className="btn-outline"
            style={{ display: "flex", alignItems: "center" }}
          >
            Cancel
          </Link>
        </div>
      </form>{" "}
      {/* ✅ YE MISSING THA */}
    </div>
  );
}
