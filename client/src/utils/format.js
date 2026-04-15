export function fmtExact(amount) {
  const n = Number(amount);
  let str = n.toFixed(6).replace(/\.?0+$/, '');
  return str || '0';
}

function numberToWords(num) {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
  ];
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

export function formatDate(d) {
  if (!d) return '';
  const x = typeof d === 'string' ? d.slice(0, 10) : d;
  const date = new Date(x.includes('T') ? x : `${x}T12:00:00`);
  if (Number.isNaN(date.getTime())) return x;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
