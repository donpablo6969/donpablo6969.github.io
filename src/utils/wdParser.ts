export type ExportDelimiter = 'TAB' | 'PIPE' | 'COMMA';
export type SortDirectionMode = 'MUTASI_ASC' | 'ASLI';

export interface ParsedWdRow {
  uid: string;
  date: string;
  time24: string; // HH:MM:SS (24-hour padded)
  userId: string;
  bankAsal: string; // "Nama, NoRek, BANK"
  amountFormatted: string; // e.g. "185,000"
  amountValue: number;
  sourceFormat: 'FORMAT_1' | 'FORMAT_2';
}

export interface ParseWdResult {
  rows: ParsedWdRow[];
  detectedFormats: Array<'FORMAT_1' | 'FORMAT_2'>;
}

const KNOWN_BANKS = new Set([
  'BCA',
  'BRI',
  'BNI',
  'MANDIRI',
  'BSI',
  'CIMB',
  'DANAMON',
  'PERMATA',
  'SEABANK',
  'JAGO',
  'NEO',
  'BNC',
  'DANA',
  'OVO',
  'GOPAY',
  'SHOPEEPAY',
  'LINKAJA',
  'QRIS',
  'OCBC',
  'PANIN',
  'MEGA',
  'BTN',
  'BTPN',
  'JENIUS',
  'MAYBANK',
]);

function padTime24(timeStr: string): string {
  const parts = timeStr.split(':');
  if (parts.length !== 3) return timeStr;
  return parts.map((p) => p.padStart(2, '0')).join(':');
}

function normalizeAmount(raw: string): { formatted: string; value: number } {
  const digits = raw.replace(/[^\d]/g, '');
  const value = Number(digits) || 0;
  return {
    formatted: value.toLocaleString('en-US'),
    value,
  };
}

function normalizeBankTuple(
  rawBankLine: string,
  preferredOrder: 'BANK_REK_NAMA' | 'NAMA_REK_BANK'
): string {
  const parts = rawBankLine
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 3) return rawBankLine.trim();

  const first = parts[0];
  const second = parts[1];
  const third = parts.slice(2).join(', ');

  const firstIsBank = KNOWN_BANKS.has(first.toUpperCase());
  const thirdIsBank = KNOWN_BANKS.has(third.toUpperCase());

  if (preferredOrder === 'BANK_REK_NAMA') {
    if (thirdIsBank && !firstIsBank) {
      return `${first}, ${second}, ${third}`;
    }
    return `${third}, ${second}, ${first}`;
  } else {
    if (firstIsBank && !thirdIsBank) {
      return `${third}, ${second}, ${first}`;
    }
    return `${first}, ${second}, ${third}`;
  }
}

function tryParseFormat2Line(line: string, lineIndex: number): ParsedWdRow | null {
  const cols = line.includes('\t')
    ? line.split('\t').map((c) => c.trim())
    : line.split(/\s{2,}/).map((c) => c.trim());

  if (cols.length < 5) return null;

  const dtIdx = cols.findIndex((c) => /\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}:\d{2}/.test(c));
  if (dtIdx === -1) return null;

  const dtMatch = cols[dtIdx].match(/(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2}:\d{2})/);
  if (!dtMatch) return null;

  const date = dtMatch[1];
  const time24 = padTime24(dtMatch[2]);
  const userId = cols[dtIdx + 1] || '';
  if (!userId) return null;

  const bankColIdx = cols.findIndex((c, idx) => idx > dtIdx && (c.match(/,/g) || []).length >= 2);
  if (bankColIdx === -1) return null;
  const bankAsal = normalizeBankTuple(cols[bankColIdx], 'NAMA_REK_BANK');

  let amountRaw = '';
  for (let i = bankColIdx + 1; i < cols.length; i++) {
    const cleaned = cols[i].trim();
    if (cleaned === '-' || cleaned === '') continue;
    if (/^[\d.,]+$/.test(cleaned)) {
      amountRaw = cleaned;
      break;
    }
  }
  if (!amountRaw) return null;

  const { formatted, value } = normalizeAmount(amountRaw);

  return {
    uid: `f2-${lineIndex}-${date}-${time24}-${userId}`,
    date,
    time24,
    userId,
    bankAsal,
    amountFormatted: formatted,
    amountValue: value,
    sourceFormat: 'FORMAT_2',
  };
}

export function parseWdRawText(rawText: string): ParseWdResult {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const rows: ParsedWdRow[] = [];
  const detectedSet = new Set<'FORMAT_1' | 'FORMAT_2'>();

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    const f2 = tryParseFormat2Line(line, i);
    if (f2) {
      rows.push(f2);
      detectedSet.add('FORMAT_2');
      i += 1;
      continue;
    }

    const headerMatch = line.match(/^\d+\s+([A-Za-z0-9_.-]+)$/);
    if (headerMatch && i + 1 < lines.length) {
      const userId = headerMatch[1];
      const detailLine = lines[i + 1];
      const detailMatch = detailLine.match(
        /(?:Withdraw|WD|Deposit)?\s*(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2}:\d{2})\s+([\d.,]+)/i
      );

      if (detailMatch) {
        const date = detailMatch[1];
        const time24 = padTime24(detailMatch[2]);
        const { formatted, value } = normalizeAmount(detailMatch[3]);

        let bankLineIdx = -1;
        for (let look = i + 2; look < Math.min(i + 5, lines.length); look++) {
          if ((lines[look].match(/,/g) || []).length >= 2) {
            bankLineIdx = look;
            break;
          }
          if (/^\d+\s+[A-Za-z0-9_.-]+$/.test(lines[look])) {
            break;
          }
        }

        if (bankLineIdx !== -1) {
          const bankAsal = normalizeBankTuple(lines[bankLineIdx], 'BANK_REK_NAMA');
          rows.push({
            uid: `f1-${i}-${date}-${time24}-${userId}`,
            date,
            time24,
            userId,
            bankAsal,
            amountFormatted: formatted,
            amountValue: value,
            sourceFormat: 'FORMAT_1',
          });
          detectedSet.add('FORMAT_1');
          i = bankLineIdx + 1;
          continue;
        }
      }
    }

    i += 1;
  }

  return {
    rows,
    detectedFormats: Array.from(detectedSet),
  };
}

export function sortWdRows(rows: ParsedWdRow[], mode: SortDirectionMode): ParsedWdRow[] {
  if (mode === 'ASLI') return rows;
  const copy = [...rows];
  copy.sort((a, b) => {
    const keyA = `${a.date} ${a.time24}`;
    const keyB = `${b.date} ${b.time24}`;
    return keyA.localeCompare(keyB);
  });
  return copy;
}

export function formatWdRowForExport(
  row: ParsedWdRow,
  delimiter: ExportDelimiter
): string {
  if (delimiter === 'TAB') {
    return `${row.time24}\t${row.userId}\t${row.bankAsal}\t\t${row.amountFormatted}`;
  }
  const sep = delimiter === 'PIPE' ? ' | ' : ', ';
  return `${row.time24}${sep}${row.userId}${sep}${row.bankAsal}${sep}${sep}${row.amountFormatted}`;
}
