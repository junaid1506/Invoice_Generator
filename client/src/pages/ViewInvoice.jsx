import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import * as C from '../constants.js';
import { amountInWords, fmtExact, formatDate } from '../utils/format.js';
import './ViewInvoice.css';

export default function ViewInvoice() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [inv, setInv] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api(`/api/invoices/${id}`)
      .then((d) => setInv(d.invoice))
      .catch((e) => setErr(e.message));
  }, [id]);

  if (err) {
    return (
      <div className="p-4">
        <div className="alert alert-danger">{err}</div>
        <Link to="/">Back</Link>
      </div>
    );
  }
  if (!inv) {
    return (
      <div className="d-flex justify-content-center p-5">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  const gst = inv.isGst === 'yes';
  const igst = gst && Number(inv.igst) > 0;
  const taxWords = amountInWords(Number(inv.taxAmount));
  const totalWords = amountInWords(Number(inv.total));
  const hsn = inv.hsnSac || '998313';
  const useGstBank = gst;
  const colCount = gst ? (igst ? 7 : 8) : 5;
  const subLabelSpan = colCount - 1;

  const canEdit = inv.status !== 'paid';

  return (
    <div className="view-inv-root">
      <div className="action-bar">
        <span className="ab-title">
          <i className="fas fa-file-invoice me-2" />
          Invoice #{inv.number}
        </span>
        <span className={`status-pill status-${inv.status}`}>{inv.status}</span>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => window.print()}>
          <i className="fas fa-print me-1" />
          Print / Save PDF
        </button>
        {canEdit && (
          <Link to={`/invoice/${id}/edit`} className="btn btn-warning btn-sm">
            <i className="fas fa-edit me-1" />
            Edit
          </Link>
        )}
        <Link to="/" className="btn btn-outline-dark btn-sm">
          <i className="fas fa-arrow-left me-1" />
          Dashboard
        </Link>
      </div>

      <div className="page-wrap">
        <div className="invoice-col">
          <div className="invoice-paper">
            {inv.status === 'paid' && <div className="watermark">PAID</div>}
            {inv.status === 'draft' && <div className="watermark">DRAFT</div>}

            <div className="inv-header">
              <div className="logo-block">
                <img src={C.LOGO_URL} alt="Logo" onError={(e) => (e.target.style.display = 'none')} />
                <div className="co-name">{C.COMPANY_NAME}</div>
                <div className="co-meta">
                  {C.COMPANY_ADDRESS}
                  <br />
                  Ph: {C.COMPANY_PHONE} | {C.COMPANY_EMAIL}
                </div>
                {gst && <div className="gstin-chip">GSTIN: {C.GST_GSTIN}</div>}
              </div>
              <div className="inv-title-col text-end">
                <h2>{gst ? 'Tax Invoice' : 'Invoice'}</h2>
                <div className="mb-2">
                  {gst ? (
                    igst ? (
                      <span className="gst-badge gst-igst">GST — IGST</span>
                    ) : (
                      <>
                        <span className="gst-badge gst-cgst">CGST</span>{' '}
                        <span className="gst-badge gst-sgst ms-1">SGST</span>
                      </>
                    )
                  ) : (
                    <span className="non-gst-chip">Non-GST</span>
                  )}
                </div>
                <div className="inv-meta-row">
                  Invoice No: <strong>{inv.number}</strong>
                </div>
                <div className="inv-meta-row">
                  Issue: <strong>{formatDate(inv.createdAt)}</strong>
                </div>
                <div className="inv-meta-row">
                  Due: <strong>{formatDate(inv.dueDate)}</strong>
                </div>
                {isAdmin && inv.userName && (
                  <div className="inv-meta-row small text-muted">
                    By: <strong>{inv.userName}</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="info-grid">
              <div className="info-box">
                <div className="ib-label">From</div>
                <div className="ib-body">
                  <strong>{C.COMPANY_NAME}</strong>
                  <br />
                  {C.COMPANY_ADDRESS}
                  <br />
                  Ph: {C.COMPANY_PHONE}
                  <br />
                  {C.COMPANY_EMAIL}
                  {gst && (
                    <>
                      <br />
                      <span className="gstin-mono">GSTIN: {C.GST_GSTIN}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="info-box">
                <div className="ib-label">Bill To</div>
                <div className="ib-body">
                  <strong>{inv.clientName}</strong>
                  <br />
                  {inv.clientAddress && (
                    <>
                      {inv.clientAddress.split('\n').map((line, i) => (
                        <span key={i}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </>
                  )}
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
                      State: <strong>{inv.clientState || 'N/A'}</strong>
                      <br />
                      <span className="gstin-mono">GSTIN: {inv.gstNumber || 'N/A'}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {gst && (
              <div className="detail-row">
                <div className="dr-item">
                  <div className="drl">Place of supply</div>
                  <strong>{inv.clientState || '—'}</strong>
                </div>
                <div className="dr-item">
                  <div className="drl">Reverse charge</div>
                  <strong>No</strong>
                </div>
                <div className="dr-item">
                  <div className="drl">HSN / SAC</div>
                  <strong className="font-monospace">{hsn}</strong>
                </div>
              </div>
            )}

            <table className="items-tbl">
              <thead>
                <tr>
                  <th className="tl text-center" style={{ width: 28 }}>
                    Sl.
                  </th>
                  <th className="tl">Particulars{gst ? ' / HSN-SAC' : ''}</th>
                  {gst && <th className="text-center">HSN/SAC</th>}
                  {gst &&
                    (igst ? (
                      <th>IGST %</th>
                    ) : (
                      <>
                        <th>CGST %</th>
                        <th>SGST %</th>
                      </>
                    ))}
                  <th className="text-center">Qty</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(inv.items || []).map((it, idx) => (
                  <tr key={idx}>
                    <td className="tl text-center">{idx + 1}</td>
                    <td className="tl">{it.description}</td>
                    {gst && <td className="text-center font-monospace">{hsn}</td>}
                    {gst &&
                      (igst ? (
                        <td>{inv.taxRate}%</td>
                      ) : (
                        <>
                          <td>{Number(inv.taxRate) / 2}%</td>
                          <td>{Number(inv.taxRate) / 2}%</td>
                        </>
                      ))}
                    <td className="text-center">{fmtExact(it.quantity)}</td>
                    <td>₹{fmtExact(it.price)}</td>
                    <td>₹{fmtExact(it.amount)}</td>
                  </tr>
                ))}
                <tr className="row-sub">
                  <td colSpan={subLabelSpan} className="tl">
                    Subtotal
                  </td>
                  <td>₹{fmtExact(inv.subtotal)}</td>
                </tr>
                {Number(inv.taxAmount) > 0 && (
                  <tr className="row-tax">
                    <td colSpan={subLabelSpan} className="tl">
                      Tax
                    </td>
                    <td>₹{fmtExact(inv.taxAmount)}</td>
                  </tr>
                )}
                <tr className="row-tot">
                  <td colSpan={subLabelSpan} className="tl">
                    Grand total
                  </td>
                  <td>₹{fmtExact(inv.total)}</td>
                </tr>
              </tbody>
            </table>

            <div className="words-row">
              <div className="wbox">
                <div className="wlabel">Amount in words</div>
                <div className="wval">{totalWords}</div>
              </div>
              {gst && Number(inv.taxAmount) > 0 && (
                <div className="wbox">
                  <div className="wlabel">Tax in words</div>
                  <div className="wval">{taxWords}</div>
                </div>
              )}
            </div>

            {gst && (
              <div className="tbd-wrap">
                <div className="tbd-head">Tax analysis — HSN/SAC</div>
                <table className="tbd-tbl">
                  <thead>
                    <tr>
                      <th className="tl">HSN/SAC</th>
                      <th className="tl">Taxable</th>
                      {igst ? (
                        <>
                          <th>IGST %</th>
                          <th>IGST Amt</th>
                        </>
                      ) : (
                        <>
                          <th>CGST %</th>
                          <th>CGST Amt</th>
                          <th>SGST %</th>
                          <th>SGST Amt</th>
                        </>
                      )}
                      <th>Total tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="tl font-monospace">{hsn}</td>
                      <td className="tl">₹{fmtExact(inv.subtotal)}</td>
                      {igst ? (
                        <>
                          <td>{inv.taxRate}%</td>
                          <td>₹{fmtExact(inv.igst)}</td>
                        </>
                      ) : (
                        <>
                          <td>{Number(inv.taxRate) / 2}%</td>
                          <td>₹{fmtExact(inv.cgst)}</td>
                          <td>{Number(inv.taxRate) / 2}%</td>
                          <td>₹{fmtExact(inv.sgst)}</td>
                        </>
                      )}
                      <td>₹{fmtExact(inv.taxAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {inv.terms?.length > 0 && (
              <div className="terms-wrap">
                <h6>Terms &amp; conditions</h6>
                <ol>
                  {inv.terms.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ol>
              </div>
            )}

            <div className="inv-footer">
              <div className="pay-col">
                <h6>Payment details</h6>
                <div className="pgrid">
                  {useGstBank ? (
                    <>
                      <div className="prow">
                        <span className="pl">Bank</span>
                        <span className="pv">{C.GST_BANK_NAME}</span>
                      </div>
                      <div className="prow">
                        <span className="pl">Account</span>
                        <span className="pv">{C.GST_ACCOUNT_NAME}</span>
                      </div>
                      <div className="prow">
                        <span className="pl">A/C No.</span>
                        <span className="pv">{C.GST_ACCOUNT_NO}</span>
                      </div>
                      <div className="prow">
                        <span className="pl">IFSC</span>
                        <span className="pv">{C.GST_IFSC}</span>
                      </div>
                      <div className="prow">
                        <span className="pl">GSTIN</span>
                        <span className="pv">{C.GST_GSTIN}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="prow">
                        <span className="pl">Bank</span>
                        <span className="pv">{C.NONGST_BANK_NAME}</span>
                      </div>
                      <div className="prow">
                        <span className="pl">Account</span>
                        <span className="pv">{C.NONGST_ACCOUNT_NAME}</span>
                      </div>
                      <div className="prow">
                        <span className="pl">A/C No.</span>
                        <span className="pv">{C.NONGST_ACCOUNT_NO}</span>
                      </div>
                      <div className="prow">
                        <span className="pl">IFSC</span>
                        <span className="pv">{C.NONGST_IFSC}</span>
                      </div>
                      <div className="prow">
                        <span className="pl">UPI</span>
                        <span className="pv">{C.NONGST_UPI}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="sig-col">
                <p>For</p>
                <strong>{C.COMPANY_NAME}</strong>
                <p className="small text-muted mt-1">Authorised signatory</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
