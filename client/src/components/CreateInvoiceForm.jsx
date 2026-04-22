import { useMemo, useState } from "react";
import { api } from "../api.js";
import "./CreateInvoiceForm.css";

function fmtNum(n) {
  if (n === 0 || n === "0") return "0";
  let s = parseFloat(n.toPrecision(12)).toString();
  if (s.indexOf("e") !== -1) s = n.toFixed(10).replace(/\.?0+$/, "");
  return s;
}

const TERMS_OPTIONS = [
  { value: "predefined1", label: "Virtual Panel T&C" },
  { value: "predefined2", label: "Whatsend Software T&C" },
  { value: "meta_ads", label: "Meta Ads T&C" },
  { value: "google_ads", label: "Google Ads T&C" },
  { value: "api", label: "API T&C" },
  { value: "custom", label: "Custom T&C" },
];

const GST_RATES = [0, 5, 12, 18, 28];

// ── Icons (inline SVG helpers) ──────────────────────────────────
function Icon({ d, size = 16, color = "currentColor", ...props }) {
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
      style={{ flexShrink: 0 }}
      {...props}
    >
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  invoice:
    "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  tax: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
  list: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  plus: "M12 4v16m8-8H4",
  trash:
    "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  save: "M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4",
  calendar:
    "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  terms:
    "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  check: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  spin: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
};

// ── Section card wrapper ────────────────────────────────────────
function SectionCard({ icon, title, badge, className, children }) {
  return (
    <div className={`cif-card${className ? " " + className : ""}`}>
      <div className="cif-card-head">
        <div className="cif-card-head-icon">
          <Icon d={icon} size={15} color="white" />
        </div>
        <span className="cif-card-title">{title}</span>
        {badge && <span className="cif-card-badge">{badge}</span>}
      </div>
      <div className="cif-card-body">{children}</div>
    </div>
  );
}

// ── Field wrapper ───────────────────────────────────────────────
function Field({ label, required, optional, hint, error, children }) {
  return (
    <div className="cif-field">
      {label && (
        <label className="cif-label">
          {label}
          {required && <span className="cif-req"> *</span>}
          {optional && <span className="cif-opt">Optional</span>}
        </label>
      )}
      {children}
      {hint && <div className="cif-hint">{hint}</div>}
      {error && <div className="cif-err">{error}</div>}
    </div>
  );
}

export default function CreateInvoiceForm({
  companyHomeState,
  indianStates,
  fixedHsnSac,
  companyGstin,
  onSuccess,
}) {
  const [invoiceType, setInvoiceType] = useState("non_gst");
  const [invoiceNumber, setInvoiceNumber] = useState("");
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
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isGst = invoiceType === "gst";

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
    return {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
      cgst,
      sgst,
      igst,
      same,
    };
  }, [items, taxRate, isGst, clientState, companyHomeState]);

  function addRow() {
    setItems([...items, { description: "", quantity: "1", price: "" }]);
  }
  function removeRow(i) {
    if (items.length > 1) setItems(items.filter((_, j) => j !== i));
  }
  function updateItem(i, field, val) {
    setItems(items.map((r, j) => (j === i ? { ...r, [field]: val } : r)));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!invoiceNumber.trim()) {
      setError("Invoice number is required.");
      return;
    }
    setSaving(true);
    try {
      await api("/api/invoices", {
        method: "POST",
        body: JSON.stringify({
          invoiceNumber,
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
      onSuccess?.();
      // reset
      setInvoiceType("non_gst");
      setInvoiceNumber("");
      setClientName("");
      setClientEmail("");
      setClientPhone("");
      setClientAddress("");
      setDueDate("");
      setGstNumber("");
      setClientState("");
      setTaxRate("0");
      setTermsOption("predefined1");
      setCustomTerms("");
      setItems([{ description: "", quantity: "1", price: "" }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const minDue = new Date().toISOString().slice(0, 10);

  return (
    <div className="cif-root">
      {/* ── Page title ── */}
      <div className="cif-page-header">
        <div className="cif-page-header-icon">
          <Icon d={ICONS.invoice} size={20} color="white" />
        </div>
        <div>
          <h2 className="cif-page-title">Create New Invoice</h2>
          <p className="cif-page-sub">
            Fill in the details below to generate a professional invoice
          </p>
        </div>
      </div>

      {/* ── Step pills ── */}
      <div className="cif-steps">
        {[
          {
            n: "01",
            label: "Invoice Basics",
            sub: "Number, client & due date",
          },
          { n: "02", label: "Tax & Terms", sub: "GST type, rate & conditions" },
          { n: "03", label: "Items & Total", sub: "Line items & final amount" },
        ].map((s, i) => (
          <div key={i} className="cif-step">
            <div className="cif-step-num">{s.n}</div>
            <div>
              <div className="cif-step-label">{s.label}</div>
              <div className="cif-step-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="cif-error">
          <Icon d={ICONS.info} size={16} />
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} noValidate>
        {/* ── Invoice type toggle ── */}
        <div className="cif-type-toggle">
          <button
            type="button"
            className={`cif-type-btn ${!isGst ? "active-nongst" : ""}`}
            onClick={() => {
              setInvoiceType("non_gst");
              setTaxRate("0");
            }}
          >
            <div className="cif-type-icon">
              <Icon
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                size={20}
              />
            </div>
            <div>
              <div className="cif-type-name">Non-GST Invoice</div>
              <div className="cif-type-desc">
                Simple invoice without GST registration
              </div>
            </div>
            {!isGst && (
              <div className="cif-type-check">
                <Icon d={ICONS.check} size={14} color="white" />
              </div>
            )}
          </button>
          <button
            type="button"
            className={`cif-type-btn ${isGst ? "active-gst" : ""}`}
            onClick={() => {
              setInvoiceType("gst");
              setTaxRate((r) => (parseFloat(r) === 0 ? "18" : r));
            }}
          >
            <div className="cif-type-icon">
              <Icon
                d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"
                size={20}
              />
            </div>
            <div>
              <div className="cif-type-name">GST Tax Invoice</div>
              <div className="cif-type-desc">
                Official tax invoice with CGST/SGST/IGST
              </div>
            </div>
            {isGst && (
              <div className="cif-type-check">
                <Icon d={ICONS.check} size={14} color="white" />
              </div>
            )}
          </button>
        </div>

        {isGst && (
          <div className="cif-gstin-info">
            <Icon d={ICONS.info} size={14} color="#3b82f6" />
            Your company GSTIN:{" "}
            <strong>
              {companyGstin || "Not set — update Company Details"}
            </strong>
          </div>
        )}

        {/* ── Two column layout ── */}
        <div className="cif-two-col">
          {/* LEFT: Client Details */}
          <SectionCard icon={ICONS.user} title="Client & Invoice Details">
            <Field label="Invoice Number" required>
              <input
                className="cif-input cif-mono"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-001 or JSC/00001"
                required
              />
            </Field>
            <Field label="Client / Company Name" required>
              <input
                className="cif-input"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </Field>
            <div className="cif-field-row">
              <Field label="Email" optional>
                <input
                  type="email"
                  className="cif-input"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@email.com"
                />
              </Field>
              <Field label="Phone" optional>
                <input
                  className="cif-input"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </Field>
            </div>
            <Field label="Address" optional>
              <textarea
                className="cif-input cif-textarea"
                rows={3}
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="Client's billing address…"
              />
            </Field>

            {/* GST sub-section */}
            {isGst && (
              <div className="cif-gst-sub">
                <div className="cif-gst-sub-title">
                  <Icon
                    d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
                    size={14}
                    color="#6366f1"
                  />
                  GST Details
                </div>
                <Field
                  label="Client GSTIN"
                  hint="Leave blank if client is unregistered"
                >
                  <input
                    className="cif-input cif-mono"
                    maxLength={15}
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                    placeholder="22AAAAA0000A1Z5"
                  />
                </Field>
                <Field label="Client State" required>
                  <select
                    className="cif-input cif-select"
                    value={clientState}
                    onChange={(e) => setClientState(e.target.value)}
                  >
                    <option value="">Select state…</option>
                    {(indianStates || []).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="cif-hsn-row">
                  <span>HSN/SAC Code:</span>
                  <code className="cif-code">{fixedHsnSac}</code>
                </div>
                {clientState && (
                  <div
                    className={`cif-tax-type-badge ${totals.same ? "same-state" : "inter-state"}`}
                  >
                    <Icon
                      d={
                        totals.same
                          ? "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          : "M13 10V3L4 14h7v7l9-11h-7z"
                      }
                      size={13}
                    />
                    {totals.same
                      ? "Same state → CGST + SGST"
                      : "Inter-state → IGST"}
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          {/* RIGHT: Tax, Due Date & Terms */}
          <SectionCard icon={ICONS.tax} title="Tax, Due Date & Terms">
            <Field label="Due Date" required>
              <div className="cif-date-wrap">
                <Icon d={ICONS.calendar} size={15} color="#94a3b8" />
                <input
                  type="date"
                  className="cif-input cif-date-input"
                  min={minDue}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </Field>

            <Field label={isGst ? "GST Rate (%)" : "Tax Rate (%)"}>
              <input
                type="number"
                className="cif-input"
                step="any"
                min={0}
                max={100}
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
              {isGst && (
                <div className="cif-rate-pills">
                  {GST_RATES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`cif-rate-pill ${parseFloat(taxRate) === r ? "active" : ""}`}
                      onClick={() => setTaxRate(String(r))}
                    >
                      {r}%
                    </button>
                  ))}
                </div>
              )}
            </Field>

            <Field label="Terms & Conditions">
              <div className="cif-terms-list">
                {TERMS_OPTIONS.map(({ value, label }) => (
                  <label
                    key={value}
                    className={`cif-terms-option ${termsOption === value ? "active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="terms_option"
                      checked={termsOption === value}
                      onChange={() => setTermsOption(value)}
                    />
                    <span className="cif-terms-radio" />
                    <span className="cif-terms-label">{label}</span>
                    {termsOption === value && (
                      <Icon d={ICONS.check} size={13} color="#6366f1" />
                    )}
                  </label>
                ))}
                {termsOption === "custom" && (
                  <textarea
                    className="cif-input cif-textarea cif-custom-terms"
                    rows={3}
                    placeholder="Enter one term per line…"
                    value={customTerms}
                    onChange={(e) => setCustomTerms(e.target.value)}
                  />
                )}
              </div>
            </Field>
          </SectionCard>
        </div>

        {/* ── Line Items ── */}
        <SectionCard
          icon={ICONS.list}
          title="Line Items"
          badge={`${items.length} item${items.length !== 1 ? "s" : ""}`}
          className="cif-items-card"
        >
          <div className="cif-items-table-wrap">
            <table className="cif-items-table">
              <colgroup>
                <col style={{ width: "32px" }} />
                <col />
                <col style={{ width: "70px" }} />
                <col style={{ width: "90px" }} />
                <col style={{ width: "90px" }} />
                <col style={{ width: "40px" }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="ta-l">#</th>
                  <th className="ta-l">Description</th>
                  <th className="ta-r">Qty</th>
                  <th className="ta-r">Rate (₹)</th>
                  <th className="ta-r">Amount</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((row, i) => {
                  const amt =
                    (parseFloat(row.quantity) || 0) *
                    (parseFloat(row.price) || 0);
                  return (
                    <tr key={i} className="cif-item-row">
                      <td className="cif-item-sl">{i + 1}</td>
                      <td>
                        <input
                          className="cif-input cif-item-input"
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
                          className="cif-input cif-item-input cif-ta-r"
                          step="any"
                          min="0.000001"
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
                          className="cif-input cif-item-input cif-ta-r"
                          step="any"
                          value={row.price}
                          onChange={(e) =>
                            updateItem(i, "price", e.target.value)
                          }
                          required
                        />
                      </td>
                      <td className="cif-item-amt">₹{fmtNum(amt)}</td>
                      <td>
                        <button
                          type="button"
                          className="cif-del-btn"
                          onClick={() => removeRow(i)}
                          disabled={items.length === 1}
                          title="Remove item"
                        >
                          <Icon d={ICONS.trash} size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button type="button" className="cif-add-row-btn" onClick={addRow}>
            <Icon d={ICONS.plus} size={14} />
            Add Item
          </button>
        </SectionCard>

        {/* ── Bottom: Submit + Totals side by side ── */}
        <div className="cif-bottom-row">
          {/* Submit (left) */}
          <div className="cif-submit-row">
            <button type="submit" className="cif-submit-btn" disabled={saving}>
              {saving ? (
                <>
                  <Icon
                    d={ICONS.spin}
                    size={16}
                    color="white"
                    style={{ animation: "cif-spin .7s linear infinite" }}
                  />
                  Saving…
                </>
              ) : (
                <>
                  <Icon d={ICONS.save} size={16} color="white" />
                  Create Invoice
                </>
              )}
            </button>
            <span className="cif-submit-hint">
              <Icon d={ICONS.info} size={13} color="#94a3b8" />
              Invoice will be saved as Draft status
            </span>
          </div>

          {/* Invoice Summary (right) */}
          <div className="cif-totals-wrap">
            <div className="cif-totals-card">
              <div className="cif-totals-title">Invoice Summary</div>
              <div className="cif-totals-rows">
                <div className="cif-total-row">
                  <span>Subtotal</span>
                  <span>₹{fmtNum(totals.subtotal)}</span>
                </div>
                {isGst && totals.same ? (
                  <>
                    <div className="cif-total-row">
                      <span>
                        <span className="cif-tax-badge cgst">CGST</span>
                      </span>
                      <span>₹{fmtNum(totals.cgst)}</span>
                    </div>
                    <div className="cif-total-row">
                      <span>
                        <span className="cif-tax-badge sgst">SGST</span>
                      </span>
                      <span>₹{fmtNum(totals.sgst)}</span>
                    </div>
                  </>
                ) : isGst && !totals.same ? (
                  <div className="cif-total-row">
                    <span>
                      <span className="cif-tax-badge igst">IGST</span>
                    </span>
                    <span>₹{fmtNum(totals.igst)}</span>
                  </div>
                ) : (
                  <div className="cif-total-row">
                    <span>Tax ({taxRate}%)</span>
                    <span>₹{fmtNum(totals.taxAmount)}</span>
                  </div>
                )}
                <div className="cif-total-row cif-grand-total">
                  <span>Grand Total</span>
                  <span>₹{fmtNum(totals.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
