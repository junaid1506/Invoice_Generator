import { useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { amountInWords, fmtExact, formatDate } from "../utils/format.js";
import "./ViewInvoice.css";

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
  invoice:
    "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  download: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
  edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  back: "M10 19l-7-7m0 0l7-7m-7 7h18",
  print:
    "M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z",
  spin: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  money:
    "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  bank: "M3 10h18M3 6h18M3 14h18M3 18h18",
  building: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
};

// ─── Load external script once ───────────────────────────────────────────────
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ─── Direct-download PDF — content height, pixel-perfect ─────────────────────
// Strategy:
//   1. Clone the invoice paper into an off-screen container with fixed 900px width
//   2. Measure its ACTUAL rendered height after layout
//   3. Pass that exact height to html2canvas → one tall canvas, no page breaks
//   4. Convert canvas pixels → mm, create a jsPDF with custom page size = content size
//   5. Embed the image, trigger download — done. No dialog, no popup.
async function downloadInvoicePDF(paperElement, invoiceNumber) {
  await loadScript(
    "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
  );
  await loadScript(
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  );

  const { jsPDF } = window.jspdf;

  // --- 1. Build an off-screen clone with all styles inlined ---
  const RENDER_WIDTH = 860; // px — wide enough for the layout

  // Collect all CSS text from the page
  const cssText = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .map((r) => r.cssText)
          .join("\n");
      } catch {
        return "";
      }
    })
    .join("\n");

  // Create a wrapper div that lives off-screen
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `
    position: fixed;
    top: 0; left: -9999px;
    width: ${RENDER_WIDTH}px;
    background: #fff;
    z-index: -1;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  `;

  // Inject a <style> tag so our CSS applies inside
  const styleEl = document.createElement("style");
  styleEl.textContent =
    cssText +
    `
    /* Reset wrappers */
    .vi-bar, .vi-sidebar { display: none !important; }
    .vi-root { background: #fff !important; min-height: unset !important; }
    .vi-main { display: block !important; padding: 0 !important; margin: 0 !important; }
    .vi-paper {
      width: ${RENDER_WIDTH}px !important;
      border-radius: 8px !important;
      box-shadow: none !important;
      overflow: visible !important;
      margin: 0 !important;
    }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  `;
  wrapper.appendChild(styleEl);

  // Clone the paper node
  const clone = paperElement.cloneNode(true);
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  // --- 2. Wait a tick for layout, then measure real height ---
  await new Promise((r) =>
    requestAnimationFrame(() => requestAnimationFrame(r)),
  );
  const contentHeight = clone.getBoundingClientRect().height;

  // --- 3. Render to canvas at 2× for retina sharpness ---
  const SCALE = 2.5;
  const canvas = await window.html2canvas(clone, {
    scale: SCALE,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    width: RENDER_WIDTH,
    height: contentHeight,
    windowWidth: RENDER_WIDTH,
    windowHeight: contentHeight,
    logging: false,
    // Tell html2canvas not to scroll
    scrollX: 0,
    scrollY: 0,
  });

  document.body.removeChild(wrapper);

  // --- 4. Create PDF with custom page size = exact content size ---
  // Convert px → mm  (96 dpi screen: 1px = 0.2646mm)
  const PX_TO_MM = 0.2646;
  const pdfW = RENDER_WIDTH * PX_TO_MM;
  const pdfH = contentHeight * PX_TO_MM;

  const pdf = new jsPDF({
    orientation: pdfW > pdfH ? "landscape" : "portrait",
    unit: "mm",
    format: [pdfW, pdfH], // custom size!
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);

  // --- 5. Direct download ---
  pdf.save(`Invoice_${invoiceNumber}.pdf`);
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function ViewInvoice() {
  const { id } = useParams();
  useAuth();
  const [inv, setInv] = useState(null);
  const [err, setErr] = useState("");
  const [downloading, setDownloading] = useState(false);
  const paperRef = useRef(null);

  useEffect(() => {
    api(`/api/invoices/${id}`)
      .then((d) => setInv(d.invoice))
      .catch((e) => setErr(e.message));
  }, [id]);

  const handleDownload = async () => {
    if (!inv || !paperRef.current || downloading) return;
    setDownloading(true);
    try {
      await downloadInvoicePDF(paperRef.current, inv.number);
    } catch (e) {
      console.error("PDF error:", e);
      alert("PDF generation failed: " + e.message);
    } finally {
      setDownloading(false);
    }
  };

  if (err)
    return (
      <div className="vi-error">
        <div className="vi-error-box">{err}</div>
        <Link to="/">← Back</Link>
      </div>
    );

  if (!inv)
    return (
      <div className="vi-loading">
        <div className="vi-spinner" />
        <span>Loading invoice…</span>
      </div>
    );

  const gst = inv.isGst === "yes";
  const igst = gst && Number(inv.igst) > 0;
  const hsn = inv.hsnSac || "998313";
  const canEdit = inv.status !== "paid";

  return (
    <div className="vi-root">
      {/* ── Action Bar ── */}
      <header className="vi-bar">
        <div className="vi-bar-left">
          <div className="vi-bar-icon">
            <Icon d={ICONS.invoice} size={16} color="white" />
          </div>
          <div>
            <div className="vi-bar-title">Invoice #{inv.number}</div>
            <div className="vi-bar-sub">{inv.companyName}</div>
          </div>
        </div>
        <div className="vi-bar-right">
          <span className={`vi-pill vi-pill-${inv.status}`}>{inv.status}</span>
          <button
            className="vi-btn vi-btn-primary"
            onClick={handleDownload}
            disabled={downloading}
          >
            <Icon
              d={downloading ? ICONS.spin : ICONS.download}
              size={14}
              color="white"
              style={
                downloading ? { animation: "vi-spin .7s linear infinite" } : {}
              }
            />
            {downloading ? "Generating…" : "Download PDF"}
          </button>
          {canEdit && (
            <Link to={`/invoice/${id}/edit`} className="vi-btn vi-btn-warn">
              <Icon d={ICONS.edit} size={14} color="white" /> Edit
            </Link>
          )}
          <button
            className="vi-btn vi-btn-ghost"
            onClick={() => window.print()}
          >
            <Icon d={ICONS.print} size={14} /> Print
          </button>
          <Link to="/" className="vi-btn vi-btn-ghost">
            <Icon d={ICONS.back} size={14} /> Dashboard
          </Link>
        </div>
      </header>

      {/* ── Two-column layout ── */}
      <main className="vi-main">
        {/* ══ LEFT: Invoice Paper ══ */}
        <div className="vi-paper" id="invoice-paper-pdf" ref={paperRef}>
          {(inv.status === "paid" || inv.status === "draft") && (
            <div className="vi-watermark">{inv.status}</div>
          )}

          {/* Header */}
          <div className="vi-head">
            <div className="vi-head-left">
              {inv.companyLogo ? (
                <img src={inv.companyLogo} alt="logo" className="vi-logo" />
              ) : (
                <div className="vi-logo-placeholder">
                  <Icon d={ICONS.building} size={22} color="#6366f1" />
                </div>
              )}
              <div className="vi-company-name">{inv.companyName}</div>
              <div className="vi-company-meta">
                {inv.companyAddress}
                <br />
                Ph: {inv.companyPhone}&nbsp;&nbsp;|&nbsp;&nbsp;
                {inv.companyEmail}
              </div>
              {gst && (
                <div className="vi-gstin-badge">
                  GSTIN: {inv.companyGstin || "—"}
                </div>
              )}
            </div>
            <div className="vi-head-right">
              <div className="vi-invoice-title">
                {gst ? "Tax Invoice" : "Invoice"}
              </div>
              <div className="vi-gst-tags">
                {gst ? (
                  igst ? (
                    <span className="vi-tag vi-tag-igst">IGST</span>
                  ) : (
                    <>
                      <span className="vi-tag vi-tag-cgst">CGST</span>
                      <span className="vi-tag vi-tag-sgst">SGST</span>
                    </>
                  )
                ) : (
                  <span className="vi-tag vi-tag-nongst">Non-GST</span>
                )}
              </div>
              <table className="vi-meta-table">
                <tbody>
                  <tr>
                    <td className="vi-mk">Invoice No</td>
                    <td className="vi-mv">{inv.number}</td>
                  </tr>
                  <tr>
                    <td className="vi-mk">Issue Date</td>
                    <td className="vi-mv">{formatDate(inv.createdAt)}</td>
                  </tr>
                  <tr>
                    <td className="vi-mk">Due Date</td>
                    <td className="vi-mv">{formatDate(inv.dueDate)}</td>
                  </tr>
                </tbody>
              </table>
              <div className={`vi-status-badge vi-status-${inv.status}`}>
                {inv.status}
              </div>
            </div>
          </div>

          {/* From / To */}
          <div className="vi-parties">
            <div className="vi-party">
              <div className="vi-party-label">From</div>
              <strong>{inv.companyName}</strong>
              {inv.companyAddress}
              <br />
              Ph: {inv.companyPhone}
              <br />
              {inv.companyEmail}
              {gst && (
                <>
                  <br />
                  <span className="vi-mono">
                    GSTIN: {inv.companyGstin || "—"}
                  </span>
                </>
              )}
            </div>
            <div className="vi-party">
              <div className="vi-party-label">Bill To</div>
              <strong>{inv.clientName}</strong>
              {inv.clientAddress &&
                inv.clientAddress.split("\n").map((l, i) => (
                  <span key={i}>
                    {l}
                    <br />
                  </span>
                ))}
              {inv.clientPhone && (
                <>
                  Ph: {inv.clientPhone}
                  <br />
                </>
              )}
              {inv.clientEmail && (
                <>
                  {inv.clientEmail}
                  <br />
                </>
              )}
              {gst && (
                <>
                  State: <strong>{inv.clientState || "N/A"}</strong>
                  <br />
                  <span className="vi-mono">
                    GSTIN: {inv.gstNumber || "N/A"}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* GST Strip */}
          {gst && (
            <div className="vi-gst-strip">
              <div className="vi-gst-item">
                <div className="vi-gst-k">Place of Supply</div>
                <strong>{inv.clientState || "—"}</strong>
              </div>
              <div className="vi-gst-item">
                <div className="vi-gst-k">Reverse Charge</div>
                <strong>No</strong>
              </div>
              <div className="vi-gst-item">
                <div className="vi-gst-k">HSN / SAC</div>
                <strong className="vi-mono">{hsn}</strong>
              </div>
              <div className="vi-gst-item">
                <div className="vi-gst-k">GST Type</div>
                <strong>{igst ? "IGST" : "CGST + SGST"}</strong>
              </div>
            </div>
          )}

          {/* Items Table */}
          <table className="vi-table">
            <thead>
              <tr>
                <th className="ta-c" style={{ width: 32 }}>
                  SL.
                </th>
                <th className="ta-l">Particulars</th>
                {gst && <th className="ta-c">HSN/SAC</th>}
                {gst &&
                  (igst ? (
                    <th className="ta-r">IGST %</th>
                  ) : (
                    <>
                      <th className="ta-r">CGST %</th>
                      <th className="ta-r">SGST %</th>
                    </>
                  ))}
                <th className="ta-c">QTY</th>
                <th className="ta-r">Rate</th>
                <th className="ta-r">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(inv.items || []).map((it, idx) => (
                <tr key={idx}>
                  <td className="ta-c vi-sl">{idx + 1}</td>
                  <td className="ta-l">{it.description}</td>
                  {gst && <td className="ta-c vi-mono">{hsn}</td>}
                  {gst &&
                    (igst ? (
                      <td className="ta-r">{inv.taxRate}%</td>
                    ) : (
                      <>
                        <td className="ta-r">{Number(inv.taxRate) / 2}%</td>
                        <td className="ta-r">{Number(inv.taxRate) / 2}%</td>
                      </>
                    ))}
                  <td className="ta-c">{fmtExact(it.quantity)}</td>
                  <td className="ta-r">₹{fmtExact(it.price)}/-</td>
                  <td className="ta-r vi-amount">₹{fmtExact(it.amount)}/-</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="vi-subtotal">
                <td colSpan={gst ? (igst ? 6 : 7) : 4} className="ta-r">
                  Subtotal:
                </td>
                <td className="ta-r">₹{fmtExact(inv.subtotal)}/-</td>
              </tr>
              {Number(inv.taxAmount) > 0 && (
                <tr className="vi-tax">
                  <td colSpan={gst ? (igst ? 6 : 7) : 4} className="ta-r">
                    Tax ({inv.taxRate}%):
                  </td>
                  <td className="ta-r">₹{fmtExact(inv.taxAmount)}/-</td>
                </tr>
              )}
              <tr className="vi-total">
                <td colSpan={gst ? (igst ? 6 : 7) : 4} className="ta-r">
                  TOTAL
                </td>
                <td className="ta-r">₹{fmtExact(inv.total)}/-</td>
              </tr>
            </tfoot>
          </table>

          {/* Amount in words */}
          <div className="vi-words-row">
            <div className="vi-words">
              <div className="vi-words-label">Amount Chargeable (in words)</div>
              <div className="vi-words-val">
                {amountInWords(Number(inv.total))}
              </div>
            </div>
            {gst && Number(inv.taxAmount) > 0 && (
              <div className="vi-words">
                <div className="vi-words-label">Tax in words</div>
                <div className="vi-words-val">
                  {amountInWords(Number(inv.taxAmount))}
                </div>
              </div>
            )}
          </div>

          {/* GST Tax Analysis */}
          {gst && (
            <div className="vi-taxbox">
              <div className="vi-taxbox-head">Tax Analysis — HSN/SAC</div>
              <table className="vi-taxtbl">
                <thead>
                  <tr>
                    <th className="ta-l">HSN/SAC</th>
                    <th className="ta-r">Taxable</th>
                    {igst ? (
                      <>
                        <th className="ta-r">IGST %</th>
                        <th className="ta-r">IGST Amt</th>
                      </>
                    ) : (
                      <>
                        <th className="ta-r">CGST %</th>
                        <th className="ta-r">CGST Amt</th>
                        <th className="ta-r">SGST %</th>
                        <th className="ta-r">SGST Amt</th>
                      </>
                    )}
                    <th className="ta-r">Total Tax</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="ta-l vi-mono">{hsn}</td>
                    <td className="ta-r">₹{fmtExact(inv.subtotal)}</td>
                    {igst ? (
                      <>
                        <td className="ta-r">{inv.taxRate}%</td>
                        <td className="ta-r">₹{fmtExact(inv.igst)}</td>
                      </>
                    ) : (
                      <>
                        <td className="ta-r">{Number(inv.taxRate) / 2}%</td>
                        <td className="ta-r">₹{fmtExact(inv.cgst)}</td>
                        <td className="ta-r">{Number(inv.taxRate) / 2}%</td>
                        <td className="ta-r">₹{fmtExact(inv.sgst)}</td>
                      </>
                    )}
                    <td className="ta-r">₹{fmtExact(inv.taxAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Terms */}
          {inv.terms?.length > 0 && (
            <div className="vi-terms">
              <div className="vi-terms-head">Terms &amp; Conditions</div>
              <ol>
                {inv.terms.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Footer */}
          <div className="vi-footer">
            <div className="vi-footer-pay">
              <div className="vi-footer-head">
                Payment Details{" "}
                {inv.isGst === "yes"
                  ? `— ${inv.gstBankName || ""}`
                  : `— ${inv.nongstBankName || ""}`}
              </div>
              <div className="vi-pgrid">
                {inv.isGst === "yes" ? (
                  <>
                    <span className="vi-pk">Account Name</span>
                    <span className="vi-pv">{inv.gstAccountName}</span>
                    <span className="vi-pk">A/C No.</span>
                    <span className="vi-pv vi-mono">{inv.gstAccountNo}</span>
                    <span className="vi-pk">IFSC</span>
                    <span className="vi-pv vi-mono">{inv.gstIfsc}</span>
                    <span className="vi-pk">GSTIN</span>
                    <span className="vi-pv vi-mono">
                      {inv.companyGstin || "—"}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="vi-pk">Account Name</span>
                    <span className="vi-pv">{inv.nongstAccountName}</span>
                    <span className="vi-pk">A/C No.</span>
                    <span className="vi-pv vi-mono">{inv.nongstAccountNo}</span>
                    <span className="vi-pk">IFSC</span>
                    <span className="vi-pv vi-mono">{inv.nongstIfsc}</span>
                    <span className="vi-pk">UPI ID</span>
                    <span className="vi-pv vi-mono">{inv.nongstUpi}</span>
                  </>
                )}
              </div>
            </div>
            <div className="vi-footer-sig">
              {inv.companyLogo && (
                <img
                  src={inv.companyLogo}
                  alt="logo"
                  style={{
                    maxHeight: 36,
                    maxWidth: 100,
                    objectFit: "contain",
                    marginBottom: 8,
                    filter: "brightness(0) invert(1)",
                    opacity: 0.7,
                  }}
                />
              )}
              <div className="vi-sig-line" />
              <div className="vi-sig-name">{inv.companyName}</div>
              <div className="vi-sig-sub">Authorised Signatory</div>
            </div>
          </div>
        </div>

        {/* ══ RIGHT: Sidebar ══ */}
        <aside className="vi-sidebar">
          <div className="vi-side-card">
            <div className="vi-side-card-head">
              <div className="vi-side-card-head-icon">
                <Icon d={ICONS.money} size={13} color="white" />
              </div>
              <span className="vi-side-card-title">Amount Summary</span>
            </div>
            <div className="vi-side-card-body">
              <div className="vi-summary-row">
                <span>Subtotal</span>
                <span>₹{fmtExact(inv.subtotal)}</span>
              </div>
              {Number(inv.taxAmount) > 0 && (
                <div className="vi-summary-row">
                  <span>Tax ({inv.taxRate}%)</span>
                  <span>₹{fmtExact(inv.taxAmount)}</span>
                </div>
              )}
              <div className="vi-summary-total">
                <span className="vi-summary-total-label">Grand Total</span>
                <span className="vi-summary-total-val">
                  ₹{fmtExact(inv.total)}
                </span>
              </div>
              {inv.status !== "paid" && (
                <div className="vi-balance-due">
                  Balance Due: ₹{fmtExact(inv.total)}
                </div>
              )}
            </div>
          </div>

          <div className="vi-side-card">
            <div className="vi-side-card-head">
              <div className="vi-side-card-head-icon">
                <Icon d={ICONS.bank} size={13} color="white" />
              </div>
              <span className="vi-side-card-title">Payment Details</span>
            </div>
            <div className="vi-side-card-body">
              <div className="vi-pay-grid">
                {inv.isGst === "yes" ? (
                  <>
                    <span className="vi-pay-k">Bank</span>
                    <span className="vi-pay-v">{inv.gstBankName || "—"}</span>
                    <span className="vi-pay-k">Account Name</span>
                    <span className="vi-pay-v">
                      {inv.gstAccountName || "—"}
                    </span>
                    <span className="vi-pay-k">Acc No.</span>
                    <span className="vi-pay-v vi-pay-mono">
                      {inv.gstAccountNo || "—"}
                    </span>
                    <span className="vi-pay-k">IFSC</span>
                    <span className="vi-pay-v vi-pay-mono">
                      {inv.gstIfsc || "—"}
                    </span>
                    <span className="vi-pay-k">GSTIN</span>
                    <span className="vi-pay-v vi-pay-mono">
                      {inv.companyGstin || "—"}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="vi-pay-k">Bank</span>
                    <span className="vi-pay-v">
                      {inv.nongstBankName || "—"}
                    </span>
                    <span className="vi-pay-k">Account Name</span>
                    <span className="vi-pay-v">
                      {inv.nongstAccountName || "—"}
                    </span>
                    <span className="vi-pay-k">Acc No.</span>
                    <span className="vi-pay-v vi-pay-mono">
                      {inv.nongstAccountNo || "—"}
                    </span>
                    <span className="vi-pay-k">IFSC</span>
                    <span className="vi-pay-v vi-pay-mono">
                      {inv.nongstIfsc || "—"}
                    </span>
                    <span className="vi-pay-k">UPI ID</span>
                    <span className="vi-pay-v vi-pay-mono">
                      {inv.nongstUpi || "—"}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
