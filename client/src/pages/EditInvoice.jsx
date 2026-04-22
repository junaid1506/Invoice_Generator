import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import "./EditInvoice.css";

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

const TERMS_LABELS = {
  predefined1: "Virtual Number Campaign",
  predefined2: "Personal Number Software",
  meta_ads: "Meta Ads Management",
  google_ads: "Google Ads Management",
  api: "WhatsApp API Onboarding",
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

// ── SVG icons ──
function Icon({ d, size = 15, color = "currentColor", style }) {
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
  edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  back: "M10 19l-7-7m0 0l7-7m-7 7h18",
  save: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  client: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  invoice:
    "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  items:
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  terms:
    "M9 12h6m-6 4h6M5 8h14M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  plus: "M12 5v14m-7-7h14",
  trash:
    "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  spin: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
};

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
      subtotal += (parseFloat(it.quantity) || 0) * (parseFloat(it.price) || 0);
    }
    const rate = parseFloat(taxRate) || 0;
    const same = Boolean(clientState && clientState === companyHomeState);
    let taxAmount = 0,
      cgst = 0,
      sgst = 0,
      igst = 0;
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
    if (items.length > 1) setItems(items.filter((_, j) => j !== i));
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

  if (loading)
    return (
      <div className="ei-loading">
        <div className="ei-spinner" />
        <span>Loading invoice…</span>
      </div>
    );

  if (error && !clientName)
    return (
      <div className="ei-error-wrap">
        <div className="ei-error-box">{error}</div>
        <Link to="/" className="ei-btn ei-btn-ghost">
          ← Back
        </Link>
      </div>
    );

  return (
    <div className="ei-root">
      {/* ── Top bar ── */}
      <header className="ei-bar">
        <div className="ei-bar-left">
          <div className="ei-bar-icon">
            <Icon d={ICONS.edit} size={16} color="white" />
          </div>
          <div>
            <div className="ei-bar-title">Edit Invoice</div>
            <div className="ei-bar-sub">#{id}</div>
          </div>
        </div>
        <div className="ei-bar-right">
          <Link to={`/invoice/${id}`} className="ei-btn ei-btn-ghost">
            <Icon d={ICONS.back} size={14} /> View Invoice
          </Link>
        </div>
      </header>

      <main className="ei-main">
        {error && (
          <div className="ei-alert">
            <Icon
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              size={16}
              color="#dc2626"
            />
            {error}
          </div>
        )}

        <form onSubmit={onSubmit}>
          {/* ── Card 1: Invoice Type ── */}
          <div className="ei-card">
            <div className="ei-card-head">
              <div className="ei-card-head-icon">
                <Icon d={ICONS.invoice} size={15} color="white" />
              </div>
              <span className="ei-card-title">Invoice Type</span>
            </div>
            <div className="ei-card-body">
              <div className="ei-type-toggle">
                <button
                  type="button"
                  className={`ei-type-btn${!isGst ? " active" : ""}`}
                  onClick={() => setInvoiceType("non_gst")}
                >
                  Non-GST
                </button>
                <button
                  type="button"
                  className={`ei-type-btn${isGst ? " active" : ""}`}
                  onClick={() => setInvoiceType("gst")}
                >
                  GST Invoice
                </button>
              </div>
              <div className="ei-grid">
                <div className="ei-field">
                  <label className="ei-label">
                    Due Date <span className="ei-label-req">*</span>
                  </label>
                  <input
                    type="date"
                    className="ei-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
                <div className="ei-field">
                  <label className="ei-label">Tax / GST Rate %</label>
                  <input
                    type="number"
                    step="any"
                    className="ei-input"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Card 2: Client Details ── */}
          <div className="ei-card">
            <div className="ei-card-head">
              <div className="ei-card-head-icon">
                <Icon d={ICONS.client} size={15} color="white" />
              </div>
              <span className="ei-card-title">Client Details</span>
            </div>
            <div className="ei-card-body">
              <div className="ei-grid">
                {/* Left col */}
                <div>
                  <div className="ei-field">
                    <label className="ei-label">
                      Client Name <span className="ei-label-req">*</span>
                    </label>
                    <input
                      className="ei-input"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      required
                      placeholder="e.g. Rahul Sharma"
                    />
                  </div>
                  <div className="ei-field">
                    <label className="ei-label">
                      Email <span className="ei-label-opt">Optional</span>
                    </label>
                    <input
                      type="email"
                      className="ei-input"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="client@example.com"
                    />
                  </div>
                  <div className="ei-field">
                    <label className="ei-label">
                      Phone <span className="ei-label-opt">Optional</span>
                    </label>
                    <input
                      className="ei-input"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="ei-field">
                    <label className="ei-label">
                      Address <span className="ei-label-opt">Optional</span>
                    </label>
                    <textarea
                      className="ei-textarea"
                      rows={3}
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      placeholder="Street, City, State, PIN"
                    />
                  </div>
                </div>

                {/* Right col — GST fields (only when GST) */}
                {isGst && (
                  <div>
                    <div className="ei-gst-panel">
                      <div className="ei-field">
                        <label className="ei-label">GSTIN</label>
                        <input
                          className="ei-input ei-input-mono"
                          maxLength={15}
                          value={gstNumber}
                          onChange={(e) => setGstNumber(e.target.value)}
                          placeholder="22AAAAA0000A1Z5"
                        />
                      </div>
                      <div className="ei-field">
                        <label className="ei-label">Client State</label>
                        <select
                          className="ei-select"
                          value={clientState}
                          onChange={(e) => setClientState(e.target.value)}
                        >
                          <option value="">— Select State —</option>
                          {(config?.indianStates || []).map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      {clientState && (
                        <div
                          style={{
                            marginTop: 10,
                            fontSize: 12,
                            color: "#4338ca",
                            fontWeight: 600,
                            background: "#e0e7ff",
                            padding: "8px 12px",
                            borderRadius: 7,
                          }}
                        >
                          {clientState === companyHomeState
                            ? "⚡ Same state — CGST + SGST will apply"
                            : "🔄 Different state — IGST will apply"}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Card 3: Items ── */}
          <div className="ei-card">
            <div className="ei-card-head">
              <div className="ei-card-head-icon">
                <Icon d={ICONS.items} size={15} color="white" />
              </div>
              <span className="ei-card-title">Line Items</span>
            </div>
            <div className="ei-card-body">
              <table className="ei-items-table">
                <thead>
                  <tr>
                    <th style={{ width: 32 }} className="ta-c">
                      SL.
                    </th>
                    <th>Description</th>
                    <th style={{ width: 90 }} className="ta-c">
                      Qty
                    </th>
                    <th style={{ width: 110 }} className="ta-r">
                      Rate (₹)
                    </th>
                    <th style={{ width: 110 }} className="ta-r">
                      Amount (₹)
                    </th>
                    <th style={{ width: 40 }} />
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, i) => {
                    const amt =
                      (parseFloat(row.quantity) || 0) *
                      (parseFloat(row.price) || 0);
                    return (
                      <tr key={i}>
                        <td className="ei-item-sl">{i + 1}</td>
                        <td>
                          <input
                            className="ei-input"
                            value={row.description}
                            onChange={(e) =>
                              updateItem(i, "description", e.target.value)
                            }
                            placeholder="Service / product description"
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="any"
                            className="ei-input"
                            value={row.quantity}
                            onChange={(e) =>
                              updateItem(i, "quantity", e.target.value)
                            }
                            style={{ textAlign: "center" }}
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="any"
                            className="ei-input"
                            value={row.price}
                            onChange={(e) =>
                              updateItem(i, "price", e.target.value)
                            }
                            style={{ textAlign: "right" }}
                            placeholder="0.00"
                            required
                          />
                        </td>
                        <td className="ei-item-amt">₹{fmtNum(amt)}</td>
                        <td>
                          <button
                            type="button"
                            className="ei-remove-row"
                            onClick={() => removeRow(i)}
                            disabled={items.length <= 1}
                            title="Remove row"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <button type="button" className="ei-add-row" onClick={addRow}>
                <Icon d={ICONS.plus} size={13} color="#6366f1" /> Add Item
              </button>

              {/* Totals */}
              <div className="ei-totals" style={{ marginTop: 20 }}>
                <div className="ei-totals-row">
                  <span>Subtotal</span>
                  <span>₹{fmtNum(totals.subtotal)}</span>
                </div>
                <div className="ei-totals-row">
                  <span>
                    Tax ({taxRate}%)
                    {isGst && totals.subtotal > 0 && (
                      <span
                        style={{
                          fontSize: 11,
                          color: "#818cf8",
                          marginLeft: 6,
                        }}
                      >
                        {totals.same ? "(CGST + SGST)" : "(IGST)"}
                      </span>
                    )}
                  </span>
                  <span>₹{fmtNum(totals.taxAmount)}</span>
                </div>
                <div className="ei-totals-grand">
                  <span>Grand Total</span>
                  <span>₹{fmtNum(totals.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Card 4: Terms ── */}
          <div className="ei-card">
            <div className="ei-card-head">
              <div className="ei-card-head-icon">
                <Icon d={ICONS.terms} size={15} color="white" />
              </div>
              <span className="ei-card-title">Terms &amp; Conditions</span>
            </div>
            <div className="ei-card-body">
              <div className="ei-terms-panel">
                {Object.keys(PREDEFINED).map((k) => (
                  <label
                    key={k}
                    className={`ei-terms-option${termsOption === k ? " selected" : ""}`}
                    onClick={() => setTermsOption(k)}
                  >
                    <input
                      type="radio"
                      name="terms"
                      checked={termsOption === k}
                      onChange={() => setTermsOption(k)}
                    />
                    <span className="ei-terms-option-label">
                      {TERMS_LABELS[k] || k}
                    </span>
                  </label>
                ))}
                <label
                  className={`ei-terms-option${termsOption === "custom" ? " selected" : ""}`}
                  onClick={() => setTermsOption("custom")}
                >
                  <input
                    type="radio"
                    name="terms"
                    checked={termsOption === "custom"}
                    onChange={() => setTermsOption("custom")}
                  />
                  <span className="ei-terms-option-label">Custom Terms</span>
                </label>
                {termsOption === "custom" && (
                  <div className="ei-terms-custom">
                    <textarea
                      className="ei-textarea"
                      rows={5}
                      value={customTerms}
                      onChange={(e) => setCustomTerms(e.target.value)}
                      placeholder="Enter each term on a new line…"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="ei-actions">
            <button
              type="submit"
              className="ei-btn ei-btn-primary"
              disabled={saving}
            >
              <Icon
                d={saving ? ICONS.spin : ICONS.save}
                size={14}
                color="white"
                style={
                  saving ? { animation: "ei-spin .7s linear infinite" } : {}
                }
              />
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <Link to={`/invoice/${id}`} className="ei-btn ei-btn-ghost">
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
