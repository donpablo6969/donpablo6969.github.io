import * as XLSX from 'xlsx';

export type NumberFormatMode = 'auto' | 'id' | 'en';
export type CompareSourceSide = 'A' | 'B';

export interface DiffResultItem {
  id: string;
  nominal: number; // stored in cents (x100) for exact integer arithmetic
  count: number;
  source: CompareSourceSide;
}

export interface SkippedRowItem {
  file: CompareSourceSide;
  row: number;
  nominal: string;
}

export interface LoadedCompareFile {
  name: string;
  rows: string[][];
  workbook: XLSX.WorkBook | null;
  sheetNames: string[];
  selectedSheet: string;
}

export interface CompareMetrics {
  matched: number;
  onlyA: number;
  onlyB: number;
  results: DiffResultItem[];
  skipped: SkippedRowItem[];
}

export function formatCompareNumber(n: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(n);
}

export function parseCSV(text: string): string[][] {
  const cleaned = text
    .replace(/^\uFEFF/, '')
    .replace(/^\s*sep=([^\r\n]+)\r?\n/i, '')
    .replace(/^\s*\r?\n/, '');

  const firstLine = cleaned.split(/\r?\n/)[0] || '';
  const separators = [',', ';', '\t'];
  const sep = separators.sort(
    (a, b) => firstLine.split(b).length - firstLine.split(a).length
  )[0];

  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;

  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned[i];

    if (c === '"') {
      if (quoted && cleaned[i + 1] === '"') {
        value += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (c === sep && !quoted) {
      row.push(value);
      value = '';
    } else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && cleaned[i + 1] === '\n') i++;
      row.push(value);
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
      value = '';
    } else {
      value += c;
    }
  }

  if (quoted) {
    throw new Error('Tanda kutip CSV tidak lengkap.');
  }

  row.push(value);
  if (row.some((x) => x.trim())) rows.push(row);

  if (rows.length < 2) {
    throw new Error('File harus memiliki judul kolom dan minimal satu baris data.');
  }

  return rows;
}

export function detectColumns(headers: unknown[]): { id: number; val: number } {
  const h = headers.map((x) =>
    String(x ?? '')
      .trim()
      .toLowerCase()
      .replace(/[ _-]+/g, '')
  );

  const isQris =
    (h.includes('originalamount') || h.includes('amountoriginal')) &&
    h.includes('note');

  const idNames = isQris
    ? ['note']
    : [
        'userid',
        'username',
        'user',
        'memberid',
        'member',
        'pengguna',
        'customerusername',
        'playerid',
        'login',
        'id',
      ];

  const amountNames = isQris
    ? ['originalamount', 'amountoriginal']
    : ['nominal', 'jumlah', 'amount', 'nilai', 'total', 'deposit'];

  const find = (names: string[]): number => {
    for (const name of names) {
      const index = h.indexOf(name);
      if (index >= 0) return index;
    }
    return -1;
  };

  return {
    id: find(idNames),
    val: find(amountNames),
  };
}

export function prepareRows(rawRows: unknown[][]): string[][] {
  let rows = rawRows.filter((r) => r.some((c) => String(c ?? '').trim()));

  const headerIndex = rows.findIndex((r) => {
    const cols = detectColumns(r);
    return cols.id >= 0 && cols.val >= 0 && cols.id !== cols.val;
  });

  if (headerIndex >= 0) {
    rows = rows.slice(headerIndex);
  }

  const heading = rows[0] || [];
  const columns = detectColumns(heading);
  const normalize = (value: unknown) =>
    String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/[ _-]+/g, '');

  rows = rows.filter((row, index) => {
    if (index === 0) return true;
    const repeatedHeader =
      columns.id >= 0 &&
      columns.val >= 0 &&
      normalize(row[columns.id]) === normalize(heading[columns.id]) &&
      normalize(row[columns.val]) === normalize(heading[columns.val]);
    const totalFooter =
      /^(totalall|grandtotal|total)$/.test(normalize(row[0])) &&
      !String(row[columns.id] ?? '').trim() &&
      !String(row[columns.val] ?? '').trim();
    return !repeatedHeader && !totalFooter;
  });

  if (rows.length < 2) {
    throw new Error('File harus memiliki judul kolom dan minimal satu baris data.');
  }

  return rows.map((r) => r.map((c) => String(c ?? '')));
}

export function extractExcelSheetRows(
  workbook: XLSX.WorkBook,
  sheetName: string
): string[][] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" tidak ditemukan.`);
  }
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
    blankrows: false,
  });
  return prepareRows(raw);
}

function normalizeZipDataDescriptors(sourceBytes: Uint8Array): Uint8Array {
  if (
    sourceBytes.length < 22 ||
    sourceBytes[0] !== 0x50 ||
    sourceBytes[1] !== 0x4b
  ) {
    return sourceBytes;
  }

  // Locate End of Central Directory (0x06054b50) from end of buffer (max comment 65535 + 22 bytes)
  const minScan = Math.max(0, sourceBytes.length - 65557);
  let eocdOffset = -1;
  for (let i = sourceBytes.length - 22; i >= minScan; i--) {
    if (
      sourceBytes[i] === 0x50 &&
      sourceBytes[i + 1] === 0x4b &&
      sourceBytes[i + 2] === 0x05 &&
      sourceBytes[i + 3] === 0x06
    ) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) return sourceBytes;

  const out = new Uint8Array(sourceBytes);
  const view = new DataView(out.buffer, out.byteOffset, out.byteLength);

  const entryCount = view.getUint16(eocdOffset + 10, true);
  const cdOffset = view.getUint32(eocdOffset + 16, true);
  if (
    entryCount === 0xffff ||
    cdOffset === 0xffffffff ||
    cdOffset + 46 > out.length
  ) {
    return sourceBytes;
  }

  let cursor = cdOffset;
  for (let idx = 0; idx < entryCount; idx++) {
    if (cursor + 46 > out.length) break;
    if (view.getUint32(cursor, true) !== 0x02014b50) break;

    const cdFlags = view.getUint16(cursor + 8, true);
    const crc32 = view.getUint32(cursor + 16, true);
    let csz = view.getUint32(cursor + 20, true);
    let usz = view.getUint32(cursor + 24, true);
    const nameLen = view.getUint16(cursor + 28, true);
    const extraLen = view.getUint16(cursor + 30, true);
    const commentLen = view.getUint16(cursor + 32, true);
    let localOffset = view.getUint32(cursor + 42, true);

    // Resolve ZIP64 extra field (0x0001) if any 32-bit field is 0xFFFFFFFF
    if (
      (usz === 0xffffffff ||
        csz === 0xffffffff ||
        localOffset === 0xffffffff) &&
      extraLen > 0 &&
      cursor + 46 + nameLen + extraLen <= out.length
    ) {
      let ex = cursor + 46 + nameLen;
      const exEnd = ex + extraLen;
      while (ex + 4 <= exEnd) {
        const tag = view.getUint16(ex, true);
        const size = view.getUint16(ex + 2, true);
        ex += 4;
        if (tag === 0x0001 && ex + size <= exEnd) {
          let p = ex;
          if (usz === 0xffffffff && p + 8 <= ex + size) {
            const lo = view.getUint32(p, true);
            const hi = view.getUint32(p + 4, true);
            if (hi === 0) usz = lo;
            p += 8;
          }
          if (csz === 0xffffffff && p + 8 <= ex + size) {
            const lo = view.getUint32(p, true);
            const hi = view.getUint32(p + 4, true);
            if (hi === 0) csz = lo;
            p += 8;
          }
          if (localOffset === 0xffffffff && p + 8 <= ex + size) {
            const lo = view.getUint32(p, true);
            const hi = view.getUint32(p + 4, true);
            if (hi === 0) localOffset = lo;
          }
          break;
        }
        ex += size;
      }
    }

    if (
      localOffset !== 0xffffffff &&
      csz !== 0xffffffff &&
      usz !== 0xffffffff &&
      localOffset + 30 <= out.length &&
      view.getUint32(localOffset, true) === 0x04034b50
    ) {
      const localFlags = view.getUint16(localOffset + 6, true);
      const localCsz = view.getUint32(localOffset + 18, true);
      const localUsz = view.getUint32(localOffset + 22, true);

      if (
        (cdFlags & 0x0008) !== 0 ||
        (localFlags & 0x0008) !== 0 ||
        localCsz !== csz ||
        localUsz !== usz
      ) {
        view.setUint16(cursor + 8, cdFlags & ~0x0008, true);
        view.setUint16(localOffset + 6, localFlags & ~0x0008, true);
        view.setUint32(localOffset + 14, crc32, true);
        view.setUint32(localOffset + 18, csz, true);
        view.setUint32(localOffset + 22, usz, true);
      }
    }

    cursor += 46 + nameLen + extraLen + commentLen;
  }

  return out;
}

export async function readCompareFile(file: File): Promise<LoadedCompareFile> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const isExcel =
    /\.(xlsx|xls)$/i.test(file.name) ||
    (bytes[0] === 80 && bytes[1] === 75) ||
    (bytes[0] === 208 && bytes[1] === 207);

  if (isExcel) {
    const normalized = normalizeZipDataDescriptors(bytes);
    const workbook = XLSX.read(normalized, { type: 'array' });
    if (!workbook.SheetNames.length) {
      throw new Error('Tidak ada sheet Excel.');
    }

    const firstValidSheet =
      workbook.SheetNames.find(
        (name) =>
          XLSX.utils.sheet_to_json(workbook.Sheets[name], {
            header: 1,
            blankrows: false,
          }).length > 1
      ) || workbook.SheetNames[0];

    const rows = extractExcelSheetRows(workbook, firstValidSheet);
    return {
      name: file.name,
      rows,
      workbook,
      sheetNames: workbook.SheetNames,
      selectedSheet: firstValidSheet,
    };
  }

  let encoding = 'utf-8';
  if (bytes[0] === 255 && bytes[1] === 254) encoding = 'utf-16le';
  if (bytes[0] === 254 && bytes[1] === 255) encoding = 'utf-16be';

  const text = new TextDecoder(encoding).decode(buffer);
  const rows = prepareRows(parseCSV(text));
  return {
    name: file.name,
    rows,
    workbook: null,
    sheetNames: [],
    selectedSheet: '',
  };
}

export function parseAmount(input: unknown, mode: NumberFormatMode): number {
  let s = String(input ?? '')
    .trim()
    .replace(/Rp\.?\s*/gi, '')
    .replace(/\s/g, '');

  if (!s) throw new Error('Nominal kosong.');

  if (mode === 'id') {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (mode === 'en') {
    s = s.replace(/,/g, '');
  } else {
    if (/^[-+]?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else if (/^[-+]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) {
      s = s.replace(/,/g, '');
    } else if (s.includes(',') && !s.includes('.')) {
      s = s.replace(',', '.');
    }
  }

  if (!/^[-+]?\d+(\.\d+)?$/.test(s) || !Number.isFinite(Number(s))) {
    throw new Error('Nominal tidak valid: ' + String(input ?? ''));
  }

  return Math.round(Number(s) * 100);
}

interface AggregatedEntry {
  id: string;
  nominal: number;
  count: number;
}

function aggregateRows(
  rows: string[][],
  side: CompareSourceSide,
  idColRaw: string,
  valColRaw: string,
  mode: NumberFormatMode,
  skipped: SkippedRowItem[]
): Map<string, AggregatedEntry> {
  if (idColRaw === '' || valColRaw === '') {
    throw new Error(`Pilih kolom User ID dan nominal pada File ${side}`);
  }

  const idCol = Number(idColRaw);
  const valCol = Number(valColRaw);

  if (idCol === valCol) {
    throw new Error(`Kolom User ID dan nominal harus berbeda pada File ${side}`);
  }

  const map = new Map<string, AggregatedEntry>();

  rows.slice(1).forEach((row, index) => {
    const id = String(row[idCol] ?? '').trim();

    if (!id) {
      skipped.push({
        file: side,
        row: index + 2,
        nominal: String(row[valCol] || '—'),
      });
      return;
    }

    let amount: number;
    try {
      amount = parseAmount(row[valCol], mode);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`File ${side}, baris ${index + 2}: ${msg}`);
    }

    const key = JSON.stringify([id, amount]);
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, { id, nominal: amount, count: 1 });
    }
  });

  return map;
}

export function compareLedgers(params: {
  rowsA: string[][];
  idColA: string;
  valColA: string;
  modeA: NumberFormatMode;
  rowsB: string[][];
  idColB: string;
  valColB: string;
  modeB: NumberFormatMode;
}): CompareMetrics {
  const skipped: SkippedRowItem[] = [];
  const mapA = aggregateRows(
    params.rowsA,
    'A',
    params.idColA,
    params.valColA,
    params.modeA,
    skipped
  );
  const mapB = aggregateRows(
    params.rowsB,
    'B',
    params.idColB,
    params.valColB,
    params.modeB,
    skipped
  );

  let matched = 0;
  let onlyA = 0;
  let onlyB = 0;
  const results: DiffResultItem[] = [];

  for (const key of new Set([...mapA.keys(), ...mapB.keys()])) {
    const x = mapA.get(key);
    const y = mapB.get(key);
    const countA = x ? x.count : 0;
    const countB = y ? y.count : 0;
    const item = x || y;
    if (!item) continue;

    matched += Math.min(countA, countB);

    for (let n = 0; n < Math.max(0, countA - countB); n++) {
      results.push({ ...item, source: 'A' });
      onlyA++;
    }

    for (let n = 0; n < Math.max(0, countB - countA); n++) {
      results.push({ ...item, source: 'B' });
      onlyB++;
    }
  }

  results.sort((x, y) => x.id.localeCompare(y.id) || x.nominal - y.nominal);

  return {
    matched,
    onlyA,
    onlyB,
    results,
    skipped,
  };
}

export function explainDiffRow(item: DiffResultItem): string {
  return item.source === 'A'
    ? 'LEBIH DI ADMIN — tidak ada pasangan di GARUDA'
    : 'LEBIH DI GARUDA — tidak ada pasangan di Admin';
}

export function buildExportCsv(rows: DiffResultItem[]): string {
  const cell = (value: string) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csvRows: string[][] = [
    ['User ID', 'Nominal', 'Keterangan'],
    ...rows.map((r) => [
      /^[=+\-@]/.test(r.id) ? `'${r.id}` : r.id,
      (r.nominal / 100).toFixed(2),
      explainDiffRow(r),
    ]),
  ];

  return '\uFEFF' + csvRows.map((r) => r.map(cell).join(';')).join('\r\n');
}

export function buildCopySummary(
  rows: DiffResultItem[],
  side?: CompareSourceSide
): string {
  const keys: CompareSourceSide[] = side ? [side] : ['A', 'B'];
  return keys
    .map((key) => {
      const group = rows.filter((r) => r.source === key);
      const totalCents = group.reduce((sum, r) => sum + r.nominal, 0);
      const header = `LEBIH DI ${key === 'A' ? 'ADMIN' : 'GARUDA'}`;
      const lines = group.map(
        (r) => `${r.id} : ${formatCompareNumber(r.nominal / 100)}`
      );
      const footer = `Total (${group.length} transaksi) : ${formatCompareNumber(
        totalCents / 100
      )}`;
      return [header, ...lines, footer].join('\n');
    })
    .join('\n\n');
}
