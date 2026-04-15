import { COMPANY_HOME_STATE, FIXED_HSN_SAC, PREDEFINED_TERMS } from '../config.js';

export function formatExactAmount(amount) {
  const n = Number(amount);
  let str = n.toFixed(6).replace(/\.?0+$/, '');
  return str || '0';
}

function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (num === 0) return 'Zero';
  let words = '';
  if (num >= 10000000) {
    words += `${numberToWords(Math.floor(num / 10000000))} Crore `;
    num %= 10000000;
  }
  if (num >= 100000) {
    words += `${numberToWords(Math.floor(num / 100000))} Lakh `;
    num %= 100000;
  }
  if (num >= 1000) {
    words += `${numberToWords(Math.floor(num / 1000))} Thousand `;
    num %= 1000;
  }
  if (num >= 100) {
    words += `${ones[Math.floor(num / 100)]} Hundred `;
    num %= 100;
  }
  if (num >= 20) {
    words += tens[Math.floor(num / 10)];
    num %= 10;
    if (num) words += `-${ones[num]}`;
  } else if (num > 0) {
    words += ones[num];
  }
  return words.trim();
}

export function amountInWords(amount) {
  const a = Number(amount);
  const rupees = Math.floor(a);
  const paise = Math.round((a - rupees) * 100);
  let words = `INR ${numberToWords(rupees)} Only`;
  if (paise > 0) {
    words = `INR ${numberToWords(rupees)} and ${numberToWords(paise)} Paise Only`;
  }
  return words;
}

export function resolveTerms(termsOption, customTerms) {
  if (termsOption === 'custom' && customTerms?.trim()) {
    return customTerms.split('\n').map((t) => t.trim()).filter(Boolean);
  }
  return PREDEFINED_TERMS[termsOption] || PREDEFINED_TERMS.predefined1;
}

export function buildLineItems(rawItems, hsnSac = FIXED_HSN_SAC) {
  const valid = [];
  let subtotal = 0;
  for (const item of rawItems || []) {
    const desc = (item.description || '').trim();
    const qty = parseFloat(item.quantity);
    const price = parseFloat(item.price);
    if (!desc || Number.isNaN(qty) || Number.isNaN(price)) continue;
    if (qty <= 0) continue;
    const amount = qty * price;
    subtotal += amount;
    valid.push({ description: desc, quantity: qty, price, amount, hsn_sac: hsnSac });
  }
  return { validItems: valid, subtotal };
}

export function computeTax({ isGst, subtotal, taxRate, clientState }) {
  const rate = Math.max(0, Math.min(100, Number(taxRate) || 0));
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  let taxAmount = 0;

  if (isGst && rate > 0) {
    const state = clientState || null;
    if (state && state === COMPANY_HOME_STATE) {
      cgst = (subtotal * (rate / 100)) / 2;
      sgst = cgst;
      taxAmount = cgst + sgst;
    } else {
      igst = subtotal * (rate / 100);
      taxAmount = igst;
    }
  } else if (!isGst) {
    taxAmount = subtotal * (rate / 100);
  }

  return { cgst, sgst, igst, taxAmount, total: subtotal + taxAmount };
}

export async function nextInvoiceNumber(Invoice, isGst) {
  const filter = isGst ? { isGst: 'yes' } : { $or: [{ isGst: { $ne: 'yes' } }, { isGst: null }] };
  const last = await Invoice.findOne(filter).sort({ createdAt: -1 }).select('number').lean();
  if (isGst) {
    if (last?.number && /JSC\/(\d+)/.test(last.number)) {
      const m = last.number.match(/JSC\/(\d+)/);
      const n = parseInt(m[1], 10) + 1;
      return `JSC/${String(n).padStart(5, '0')}`;
    }
    return 'JSC/00601';
  }
  if (last?.number && /JSC00#3\$(\d+)/.test(last.number)) {
    const m = last.number.match(/JSC00#3\$(\d+)/);
    return `JSC00#3$${parseInt(m[1], 10) + 1}`;
  }
  return 'JSC00#3$1073';
}
