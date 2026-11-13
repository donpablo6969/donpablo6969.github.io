export function formatRupiah(amount: number): string {
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

export function cleanAccountString(raw: string): {
  digitsOnly: string;
  removedSpaces: number;
  removedChars: number;
  detectedBankHint: string;
} {
  const removedSpaces = (raw.match(/\s/g) || []).length;
  const digitsOnly = raw.replace(/\D/g, '');
  const removedChars = raw.length - digitsOnly.length;

  let detectedBankHint = 'Umum';
  if (digitsOnly.startsWith('08') && digitsOnly.length >= 10 && digitsOnly.length <= 13) {
    detectedBankHint = 'E-Wallet (DANA / OVO / GOPAY)';
  } else if (digitsOnly.length === 10) {
    detectedBankHint = 'BCA / BNI (10 digit)';
  } else if (digitsOnly.length === 13) {
    detectedBankHint = 'MANDIRI (13 digit)';
  } else if (digitsOnly.length === 15) {
    detectedBankHint = 'BRI (15 digit)';
  } else if (digitsOnly.length === 16) {
    detectedBankHint = 'Virtual Account / CIMB';
  }

  return {
    digitsOnly,
    removedSpaces,
    removedChars,
    detectedBankHint,
  };
}
