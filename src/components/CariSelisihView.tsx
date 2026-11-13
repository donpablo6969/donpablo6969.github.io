import React, { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  AlertCircle,
  ArrowRightLeft,
  Copy,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Scale,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

interface CariSelisihViewProps {
  mode: 'admin-vs-garuda' | 'admin-vs-docs';
  onCopyText: (text: string, label: string, customToast?: string) => void;
}

type DocsAmountColumn = 'auto' | 'credit' | 'debet' | 'pendingan';
type AdminStatusFilter = 'ALL' | 'ACCEPT_ONLY';

interface ParsedAdminRow {
  userId: string;
  amount: number;
  action: string;
  dariBank: string;
  tujuanBank: string;
  status: string;
  operator: string;
  tanggal: string;
}

interface ParsedDocsRow {
  userId: string;
  namaRekening: string;
  tanggal: string;
  waktu: string;
  pendingan: number;
  credit: number;
  debet: number;
  biaya: number;
  amount: number;
}

interface UploadedSheetState {
  fileName: string;
  rows: string[][];
  workbook: XLSX.WorkBook | null;
  sheetNames: string[];
  selectedSheet: string;
}

interface DiffEntry {
  userId: string;
  adminAmount: number | null;
  adminCount: number;
  docsAmount: number | null;
  docsCount: number;
  diff: number;
  infoText: string;
  status:
    | 'COCOK'
    | 'SELISIH NOMINAL'
    | 'TIDAK ADA DI DOCS'
    | 'TIDAK ADA DI ADMIN';
}

const SAMPLE_ADMIN_TEXT = [
  'No\tTanggal Terima\tUser\tAction\tDari Bank\tTujuan Bank\tJumlah\tStatus\tOperator',
  '1\t13/11/2026 10:12:04\tbocahgacor88\tDeposit\tBCA\tBCA\t350,000\tAccept\tcs_rini',
  '2\t13/11/2026 10:15:22\tzeus_mania69\tDeposit\tBNI\tBNI\t500,000\tAccept\tcs_budi',
  '3\t13/11/2026 10:19:41\thoki_selalu77\tWithdraw\tMANDIRI\tMANDIRI\t1,250,000\tAccept\tkasir_andi',
  '4\t13/11/2026 10:25:10\tdono_slot99\tDeposit\tBRI\tBRI\t200,000\tAccept\tcs_rini',
].join('\n');

const SAMPLE_DOCS_TEXT = [
  'TANGGAL\tWAKTU\tuser id\tnama rekening\tpendingan\tcredit\tdebet\tbiaya',
  '13/11/2026\t10:12:04\tbocahgacor88\tBUDI HARTONO\t0\t350,000\t0\t0',
  '13/11/2026\t10:15:22\tzeus_mania69\tANDI WIJAYA\t0\t450,000\t0\t0',
  '13/11/2026\t10:19:41\thoki_selalu77\tSITI AMINAH\t0\t0\t1,250,000\t2,500',
  '13/11/2026\t10:31:05\tsultan_jp88\tHENDRA K\t0\t100,000\t0\t0',
].join('\n');

function normalizeKey(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[ _-]+/g, '');
}

function parseFlexibleMoney(raw: unknown): number {
  let s = String(raw ?? '')
    .trim()
    .replace(/Rp\.?\s*/gi, '')
    .replace(/\s+/g, '');

  if (!s || s === '-' || s === '—') return 0;

  const isNeg = /^\(.*\)$/.test(s) || s.startsWith('-');
  s = s.replace(/[()+-]/g, '');

  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) {
    s = s.replace(/,/g, '');
  } else if (s.includes(',') && !s.includes('.')) {
    const parts = s.split(',');
    s = parts[parts.length - 1].length === 3 ? s.replace(/,/g, '') : s.replace(',', '.');
  }

  const num = Number(s);
  if (!Number.isFinite(num)) return 0;
  return isNeg ? -Math.round(num) : Math.round(num);
}

function splitDelimitedLine(line: string, preferredSep?: string): string[] {
  if (line.includes('\t')) {
    return line.split('\t').map((c) => c.trim());
  }
  if (line.includes('|')) {
    return line.split('|').map((c) => c.trim());
  }
  if (line.includes(';')) {
    return line.split(';').map((c) => c.trim());
  }
  const sep = preferredSep || ',';
  const cells: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === sep && !inQuotes) {
      cells.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur.trim());
  return cells;
}

function parseTextToMatrix(rawText: string): string[][] {
  const cleaned = rawText
    .replace(/^\uFEFF/, '')
    .replace(/^\s*sep=([^\r\n]+)\r?\n/i, '');
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  return lines.map((l) => splitDelimitedLine(l));
}

async function readSpreadsheetFile(file: File): Promise<UploadedSheetState> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const isExcel =
    /\.(xlsx|xls)$/i.test(file.name) ||
    (bytes[0] === 0x50 && bytes[1] === 0x4b) ||
    (bytes[0] === 0xd0 && bytes[1] === 0xcf);

  if (isExcel) {
    const workbook = XLSX.read(bytes, { type: 'array' });
    if (!workbook.SheetNames.length) {
      throw new Error('File Excel tidak memiliki sheet.');
    }
    const firstValidSheet =
      workbook.SheetNames.find(
        (name) =>
          XLSX.utils.sheet_to_json(workbook.Sheets[name], {
            header: 1,
            blankrows: false,
          }).length > 0
      ) || workbook.SheetNames[0];

    const raw = XLSX.utils.sheet_to_json<unknown[]>(
      workbook.Sheets[firstValidSheet],
      {
        header: 1,
        defval: '',
        raw: false,
        blankrows: false,
      }
    );
    const rows = raw
      .filter((r) => r.some((c) => String(c ?? '').trim().length > 0))
      .map((r) => r.map((c) => String(c ?? '').trim()));

    return {
      fileName: file.name,
      rows,
      workbook,
      sheetNames: workbook.SheetNames,
      selectedSheet: firstValidSheet,
    };
  }

  let encoding = 'utf-8';
  if (bytes[0] === 0xff && bytes[1] === 0xfe) encoding = 'utf-16le';
  if (bytes[0] === 0xfe && bytes[1] === 0xff) encoding = 'utf-16be';

  const text = new TextDecoder(encoding).decode(buffer);
  const rows = parseTextToMatrix(text);
  if (rows.length === 0) {
    throw new Error('File CSV kosong atau tidak memiliki baris data.');
  }

  return {
    fileName: file.name,
    rows,
    workbook: null,
    sheetNames: [],
    selectedSheet: '',
  };
}

function parseAdminMatrix(
  matrix: string[][],
  statusFilter: AdminStatusFilter
): ParsedAdminRow[] {
  if (matrix.length === 0) return [];

  // Find header row if present in first 5 rows
  let headerRowIdx = -1;
  let userIdx = -1;
  let amountIdx = -1;
  let dateIdx = -1;
  let actionIdx = -1;
  let dariBankIdx = -1;
  let tujuanBankIdx = -1;
  let statusIdx = -1;
  let operatorIdx = -1;

  for (let i = 0; i < Math.min(5, matrix.length); i++) {
    const norms = matrix[i].map(normalizeKey);
    const u = norms.findIndex((h) =>
      ['user', 'userid', 'username', 'member', 'playerid'].includes(h)
    );
    const a = norms.findIndex((h) =>
      ['jumlah', 'nominal', 'amount', 'total', 'nilai'].includes(h)
    );
    if (u >= 0 && a >= 0) {
      headerRowIdx = i;
      userIdx = u;
      amountIdx = a;
      dateIdx = norms.findIndex((h) =>
        ['tanggalterima', 'tanggal', 'waktu', 'date'].includes(h)
      );
      actionIdx = norms.findIndex((h) => ['action', 'aksi', 'tipe', 'jenis'].includes(h));
      dariBankIdx = norms.findIndex((h) => ['daribank', 'frombank', 'bank'].includes(h));
      tujuanBankIdx = norms.findIndex((h) => ['tujuanbank', 'tobank'].includes(h));
      statusIdx = norms.findIndex((h) => ['status', 'ket'].includes(h));
      operatorIdx = norms.findIndex((h) => ['operator', 'op', 'admin'].includes(h));
      break;
    }
  }

  const startIdx = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;
  const parsed: ParsedAdminRow[] = [];

  for (let r = startIdx; r < matrix.length; r++) {
    const row = matrix[r];
    if (!row || row.length === 0) continue;

    let user = '';
    let amount = 0;
    let tanggal = '';
    let action = '';
    let dariBank = '';
    let tujuanBank = '';
    let status = '';
    let operator = '';

    if (headerRowIdx >= 0) {
      user = String(row[userIdx] ?? '').trim().toLowerCase();
      amount = parseFlexibleMoney(row[amountIdx]);
      tanggal = dateIdx >= 0 ? String(row[dateIdx] ?? '').trim() : '';
      action = actionIdx >= 0 ? String(row[actionIdx] ?? '').trim() : '';
      dariBank = dariBankIdx >= 0 ? String(row[dariBankIdx] ?? '').trim() : '';
      tujuanBank = tujuanBankIdx >= 0 ? String(row[tujuanBankIdx] ?? '').trim() : '';
      status = statusIdx >= 0 ? String(row[statusIdx] ?? '').trim() : '';
      operator = operatorIdx >= 0 ? String(row[operatorIdx] ?? '').trim() : '';
    } else if (row.length >= 7) {
      // Exact positional Admin layout:
      // No | Tanggal Terima | User | Action | Dari Bank | Tujuan Bank | Jumlah | Status | Operator
      tanggal = String(row[1] ?? '').trim();
      user = String(row[2] ?? '').trim().toLowerCase();
      action = String(row[3] ?? '').trim();
      dariBank = String(row[4] ?? '').trim();
      tujuanBank = String(row[5] ?? '').trim();
      amount = parseFlexibleMoney(row[6]);
      status = String(row[7] ?? '').trim();
      operator = String(row[8] ?? '').trim();
    } else if (row.length >= 2) {
      user = String(row[0] ?? '').trim().toLowerCase();
      amount = parseFlexibleMoney(row[1]);
    }

    if (!user || /^(total|grand\s*total|user|userid)$/i.test(user)) continue;

    if (
      statusFilter === 'ACCEPT_ONLY' &&
      status &&
      !/accept|approve|sukses|success|done|selesai/i.test(status)
    ) {
      continue;
    }

    parsed.push({
      userId: user,
      amount,
      action,
      dariBank,
      tujuanBank,
      status,
      operator,
      tanggal,
    });
  }

  return parsed;
}

function parseDocsMatrix(
  matrix: string[][],
  amountMode: DocsAmountColumn
): ParsedDocsRow[] {
  if (matrix.length === 0) return [];

  let headerRowIdx = -1;
  let dateIdx = 0;
  let timeIdx = 1;
  let userIdx = 2;
  let namaRekIdx = 3;
  let pendinganIdx = 4;
  let creditIdx = 5;
  let debetIdx = 6;
  let biayaIdx = 7;

  for (let i = 0; i < Math.min(5, matrix.length); i++) {
    const norms = matrix[i].map(normalizeKey);
    const u = norms.findIndex((h) =>
      ['userid', 'user', 'username', 'id', 'member'].includes(h)
    );
    const hasDocsCols = norms.some((h) =>
      ['credit', 'debet', 'debit', 'pendingan', 'namarekening', 'biaya'].includes(h)
    );
    if (u >= 0 && hasDocsCols) {
      headerRowIdx = i;
      userIdx = u;
      dateIdx = norms.findIndex((h) => ['tanggal', 'tgl', 'date'].includes(h));
      timeIdx = norms.findIndex((h) => ['waktu', 'jam', 'time'].includes(h));
      namaRekIdx = norms.findIndex((h) =>
        ['namarekening', 'namarek', 'rekening', 'nama'].includes(h)
      );
      pendinganIdx = norms.findIndex((h) => ['pendingan', 'pending'].includes(h));
      creditIdx = norms.findIndex((h) => ['credit', 'kredit', 'dp'].includes(h));
      debetIdx = norms.findIndex((h) => ['debet', 'debit', 'wd'].includes(h));
      biayaIdx = norms.findIndex((h) => ['biaya', 'fee', 'admin'].includes(h));
      break;
    }
  }

  const startIdx = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;
  const parsed: ParsedDocsRow[] = [];

  for (let r = startIdx; r < matrix.length; r++) {
    const row = matrix[r];
    if (!row || row.length === 0) continue;

    let user = '';
    let namaRekening = '';
    let tanggal = '';
    let waktu = '';
    let pendingan = 0;
    let credit = 0;
    let debet = 0;
    let biaya = 0;

    if (headerRowIdx >= 0) {
      user = String(row[userIdx] ?? '').trim().toLowerCase();
      tanggal = dateIdx >= 0 ? String(row[dateIdx] ?? '').trim() : '';
      waktu = timeIdx >= 0 ? String(row[timeIdx] ?? '').trim() : '';
      namaRekening = namaRekIdx >= 0 ? String(row[namaRekIdx] ?? '').trim() : '';
      pendingan = pendinganIdx >= 0 ? parseFlexibleMoney(row[pendinganIdx]) : 0;
      credit = creditIdx >= 0 ? parseFlexibleMoney(row[creditIdx]) : 0;
      debet = debetIdx >= 0 ? parseFlexibleMoney(row[debetIdx]) : 0;
      biaya = biayaIdx >= 0 ? parseFlexibleMoney(row[biayaIdx]) : 0;
    } else if (row.length >= 6) {
      // Exact positional Docs layout:
      // TANGGAL | WAKTU | user id | nama rekening | pendingan | credit | debet | biaya
      tanggal = String(row[0] ?? '').trim();
      waktu = String(row[1] ?? '').trim();
      user = String(row[2] ?? '').trim().toLowerCase();
      namaRekening = String(row[3] ?? '').trim();
      pendingan = parseFlexibleMoney(row[4]);
      credit = parseFlexibleMoney(row[5]);
      debet = parseFlexibleMoney(row[6]);
      biaya = parseFlexibleMoney(row[7]);
    } else if (row.length >= 2) {
      user = String(row[0] ?? '').trim().toLowerCase();
      credit = parseFlexibleMoney(row[1]);
    }

    if (!user || /^(total|grand\s*total|user\s*id|userid)$/i.test(user)) continue;

    let amount = 0;
    if (amountMode === 'credit') {
      amount = credit;
    } else if (amountMode === 'debet') {
      amount = debet;
    } else if (amountMode === 'pendingan') {
      amount = pendingan;
    } else {
      amount = credit > 0 || debet > 0 ? credit + debet : pendingan;
    }

    parsed.push({
      userId: user,
      namaRekening,
      tanggal,
      waktu,
      pendingan,
      credit,
      debet,
      biaya,
      amount,
    });
  }

  return parsed;
}

export const CariSelisihView: React.FC<CariSelisihViewProps> = ({
  mode: _mode,
  onCopyText,
}) => {
  const [adminText, setAdminText] = useState('');
  const [docsText, setDocsText] = useState('');
  const [adminFile, setAdminFile] = useState<UploadedSheetState | null>(null);
  const [docsFile, setDocsFile] = useState<UploadedSheetState | null>(null);
  const [adminFileError, setAdminFileError] = useState('');
  const [docsFileError, setDocsFileError] = useState('');

  const [docsAmountMode, setDocsAmountMode] = useState<DocsAmountColumn>('auto');
  const [adminStatusFilter, setAdminStatusFilter] =
    useState<AdminStatusFilter>('ALL');
  const [filterMode, setFilterMode] = useState<'ALL' | 'DIFF_ONLY' | 'MATCH_ONLY'>(
    'ALL'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const adminInputRef = useRef<HTMLInputElement | null>(null);
  const docsInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadFile = async (side: 'admin' | 'docs', file: File | null) => {
    if (!file) return;
    try {
      const parsed = await readSpreadsheetFile(file);
      if (side === 'admin') {
        setAdminFile(parsed);
        setAdminFileError('');
      } else {
        setDocsFile(parsed);
        setDocsFileError('');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal membaca file.';
      if (side === 'admin') {
        setAdminFile(null);
        setAdminFileError(msg);
      } else {
        setDocsFile(null);
        setDocsFileError(msg);
      }
    }
  };

  const handleChangeSheet = (side: 'admin' | 'docs', sheetName: string) => {
    const current = side === 'admin' ? adminFile : docsFile;
    if (!current || !current.workbook) return;
    const sheet = current.workbook.Sheets[sheetName];
    if (!sheet) return;

    const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: '',
      raw: false,
      blankrows: false,
    });
    const rows = raw
      .filter((r) => r.some((c) => String(c ?? '').trim().length > 0))
      .map((r) => r.map((c) => String(c ?? '').trim()));

    const updated: UploadedSheetState = {
      ...current,
      rows,
      selectedSheet: sheetName,
    };

    if (side === 'admin') setAdminFile(updated);
    else setDocsFile(updated);
  };

  const handleLoadSample = () => {
    setAdminFile(null);
    setDocsFile(null);
    setAdminFileError('');
    setDocsFileError('');
    setAdminText(SAMPLE_ADMIN_TEXT);
    setDocsText(SAMPLE_DOCS_TEXT);
  };

  const handleClear = () => {
    setAdminFile(null);
    setDocsFile(null);
    setAdminFileError('');
    setDocsFileError('');
    setAdminText('');
    setDocsText('');
    setSearchQuery('');
    if (adminInputRef.current) adminInputRef.current.value = '';
    if (docsInputRef.current) docsInputRef.current.value = '';
  };

  const adminRows = useMemo(() => {
    const matrix = adminFile ? adminFile.rows : parseTextToMatrix(adminText);
    return parseAdminMatrix(matrix, adminStatusFilter);
  }, [adminFile, adminText, adminStatusFilter]);

  const docsRows = useMemo(() => {
    const matrix = docsFile ? docsFile.rows : parseTextToMatrix(docsText);
    return parseDocsMatrix(matrix, docsAmountMode);
  }, [docsFile, docsText, docsAmountMode]);

  const auditResult = useMemo(() => {
    const adminMap = new Map<
      string,
      { amount: number; count: number; meta: string[] }
    >();
    adminRows.forEach((r) => {
      const existing = adminMap.get(r.userId);
      const tag = [r.action, r.tujuanBank || r.dariBank, r.status]
        .filter(Boolean)
        .join(' · ');
      if (existing) {
        existing.amount += r.amount;
        existing.count += 1;
        if (tag && !existing.meta.includes(tag)) existing.meta.push(tag);
      } else {
        adminMap.set(r.userId, {
          amount: r.amount,
          count: 1,
          meta: tag ? [tag] : [],
        });
      }
    });

    const docsMap = new Map<
      string,
      { amount: number; count: number; rek: string[] }
    >();
    docsRows.forEach((r) => {
      const existing = docsMap.get(r.userId);
      if (existing) {
        existing.amount += r.amount;
        existing.count += 1;
        if (r.namaRekening && !existing.rek.includes(r.namaRekening)) {
          existing.rek.push(r.namaRekening);
        }
      } else {
        docsMap.set(r.userId, {
          amount: r.amount,
          count: 1,
          rek: r.namaRekening ? [r.namaRekening] : [],
        });
      }
    });

    const allIds = Array.from(new Set([...adminMap.keys(), ...docsMap.keys()]));
    const rows: DiffEntry[] = allIds.map((userId) => {
      const a = adminMap.get(userId);
      const d = docsMap.get(userId);
      const infoParts: string[] = [];
      if (d?.rek.length) infoParts.push(`A/N: ${d.rek.join(', ')}`);
      if (a?.meta.length) infoParts.push(a.meta[0]);

      if (a && d) {
        const diff = a.amount - d.amount;
        return {
          userId,
          adminAmount: a.amount,
          adminCount: a.count,
          docsAmount: d.amount,
          docsCount: d.count,
          diff,
          infoText: infoParts.join(' | ') || '—',
          status: diff === 0 ? 'COCOK' : 'SELISIH NOMINAL',
        };
      }
      if (a && !d) {
        return {
          userId,
          adminAmount: a.amount,
          adminCount: a.count,
          docsAmount: null,
          docsCount: 0,
          diff: a.amount,
          infoText: infoParts.join(' | ') || '—',
          status: 'TIDAK ADA DI DOCS',
        };
      }
      return {
        userId,
        adminAmount: null,
        adminCount: 0,
        docsAmount: d?.amount ?? 0,
        docsCount: d?.count ?? 0,
        diff: -(d?.amount ?? 0),
        infoText: infoParts.join(' | ') || '—',
        status: 'TIDAK ADA DI ADMIN',
      };
    });

    const totalAdmin = adminRows.reduce((s, r) => s + r.amount, 0);
    const totalDocs = docsRows.reduce((s, r) => s + r.amount, 0);
    const totalCredit = docsRows.reduce((s, r) => s + r.credit, 0);
    const totalDebet = docsRows.reduce((s, r) => s + r.debet, 0);
    const totalPending = docsRows.reduce((s, r) => s + r.pendingan, 0);
    const totalBiaya = docsRows.reduce((s, r) => s + r.biaya, 0);
    const mismatchCount = rows.filter((r) => r.status !== 'COCOK').length;
    const matchCount = rows.length - mismatchCount;

    return {
      rows,
      totalAdmin,
      totalDocs,
      totalCredit,
      totalDebet,
      totalPending,
      totalBiaya,
      netDiff: totalAdmin - totalDocs,
      mismatchCount,
      matchCount,
    };
  }, [adminRows, docsRows]);

  const visibleRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return auditResult.rows.filter((r) => {
      if (filterMode === 'DIFF_ONLY' && r.status === 'COCOK') return false;
      if (filterMode === 'MATCH_ONLY' && r.status !== 'COCOK') return false;
      if (
        q &&
        !r.userId.includes(q) &&
        !r.infoText.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [auditResult.rows, filterMode, searchQuery]);

  const copyAuditReport = () => {
    const mismatchLines = auditResult.rows
      .filter((r) => r.status !== 'COCOK')
      .map(
        (r) =>
          `- ${r.userId}: ADMIN ${
            r.adminAmount !== null ? formatRupiah(r.adminAmount) : 'KOSONG'
          } vs DOCS ${
            r.docsAmount !== null ? formatRupiah(r.docsAmount) : 'KOSONG'
          } (${r.status})`
      );

    const report = [
      'AUDIT SELISIH ADMIN vs DOCS',
      `Total ADMIN (${adminRows.length} baris): ${formatRupiah(auditResult.totalAdmin)}`,
      `Total DOCS (${docsRows.length} baris): ${formatRupiah(auditResult.totalDocs)}`,
      `Selisih Bersih: ${formatRupiah(auditResult.netDiff)}`,
      '',
      mismatchLines.length > 0
        ? `Temuan Selisih (${mismatchLines.length}):\n${mismatchLines.join('\n')}`
        : 'Semua transaksi cocok 100%.',
    ].join('\n');

    onCopyText(report, 'Laporan Audit ADMIN vs DOCS');
  };

  const handleDownloadCsv = () => {
    const targetRows = visibleRows.length > 0 ? visibleRows : auditResult.rows;
    if (targetRows.length === 0) return;

    const escapeCell = (v: string | number) =>
      `"${String(v ?? '').replace(/"/g, '""')}"`;

    const csvLines = [
      ['User ID', 'Nominal Admin', 'Nominal Docs', 'Selisih', 'Keterangan', 'Status'],
      ...targetRows.map((r) => [
        r.userId,
        r.adminAmount ?? 0,
        r.docsAmount ?? 0,
        r.diff,
        r.infoText,
        r.status,
      ]),
    ]
      .map((row) => row.map(escapeCell).join(';'))
      .join('\r\n');

    const blob = new Blob(['\uFEFF' + csvLines], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-admin-vs-docs-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 p-5 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-400 mb-1">
            <Scale className="w-4 h-4" />
            <span>MODUL AUDIT CARI SELISIH</span>
          </div>
          <h1 className="text-2xl font-extrabold text-black dark:text-white">
            ADMIN vs DOCS
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-extrabold cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Muat Contoh</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F4EDE3] dark:bg-[#211711] dark:hover:bg-[#2C1E16] text-black dark:text-white border border-[#D4C4AE] dark:border-[#D4A373]/75 text-xs font-bold cursor-pointer whitespace-nowrap"
          >
            Bersihkan
          </button>
          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={auditResult.rows.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EAE0D2] hover:bg-[#DFD1BE] disabled:opacity-50 dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-extrabold cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={copyAuditReport}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4A2B18] hover:bg-[#361F11] dark:bg-[#C59656] dark:text-[#140D09] text-white text-xs font-extrabold cursor-pointer whitespace-nowrap"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Salin Laporan Audit</span>
          </button>
        </div>
      </div>

      {/* Dual Upload + Paste Inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT: DATA PANEL ADMIN */}
        <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wide text-black dark:text-white">
              DATA PANEL ADMIN
            </h2>
            <span className="text-xs font-mono-tabular font-extrabold text-[#4A2B18] dark:text-[#E5B874]">
              {adminRows.length} baris · {formatRupiah(auditResult.totalAdmin)}
            </span>
          </div>

          {/* Upload CSV / Excel Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] border border-dashed border-[#CBB9A0] dark:border-[#D4A373]/75">
            <input
              ref={adminInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => handleUploadFile('admin', e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => adminInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4A2B18] hover:bg-[#361F11] dark:bg-[#C59656] dark:hover:bg-[#B58342] text-white dark:text-[#140D09] text-xs font-extrabold cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload CSV / Excel</span>
              </button>
              {adminFile ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#147D4E] dark:text-[#6EE7A8] truncate">
                  <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{adminFile.fileName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminFile(null);
                      setAdminFileError('');
                      if (adminInputRef.current) adminInputRef.current.value = '';
                    }}
                    title="Hapus file"
                    className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-[#B91C1C] dark:text-[#FCA5A5] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span className="text-[11px] text-[#5D4C3E] dark:text-[#9E8B78]">
                  atau tempel data di bawah
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {adminFile && adminFile.sheetNames.length > 1 && (
                <select
                  value={adminFile.selectedSheet}
                  onChange={(e) => handleChangeSheet('admin', e.target.value)}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-[#1F150F] border border-[#CBB9A0] dark:border-[#D4A373]/75 text-[11px] font-bold text-black dark:text-white"
                >
                  {adminFile.sheetNames.map((name) => (
                    <option key={name} value={name}>
                      Sheet: {name}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={adminStatusFilter}
                onChange={(e) =>
                  setAdminStatusFilter(e.target.value as AdminStatusFilter)
                }
                className="px-2 py-1 rounded-lg bg-white dark:bg-[#1F150F] border border-[#CBB9A0] dark:border-[#D4A373]/75 text-[11px] font-bold text-black dark:text-white"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACCEPT_ONLY">Hanya Accept / Sukses</option>
              </select>
            </div>
          </div>

          {adminFileError && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FBE7EB] dark:bg-[#3E1621] text-[#9F1239] dark:text-[#FDA4AF] text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{adminFileError}</span>
            </div>
          )}

          <textarea
            rows={6}
            value={adminText}
            onChange={(e) => {
              setAdminFile(null);
              setAdminFileError('');
              setAdminText(e.target.value);
            }}
            placeholder={
              adminFile
                ? `File aktif: ${adminFile.fileName} (${adminRows.length} baris terbaca). Hapus file di atas jika ingin tempel teks manual.`
                : 'Copy-tempel baris tabel Admin di sini (Tab / Pipe / Titik Koma / CSV):\nNo\tTanggal Terima\tUser\tAction\tDari Bank\tTujuan Bank\tJumlah\tStatus\tOperator'
            }
            className="w-full p-3 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-mono-tabular focus:outline-none focus:ring-2 focus:ring-[#4A2B18] dark:focus:ring-[#D4A373]"
          />
        </div>

        {/* RIGHT: DATA DOCS / SHEET */}
        <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wide text-black dark:text-white">
              DATA DOCS / SHEET
            </h2>
            <span className="text-xs font-mono-tabular font-extrabold text-[#4A2B18] dark:text-[#E5B874]">
              {docsRows.length} baris · {formatRupiah(auditResult.totalDocs)}
            </span>
          </div>

          {/* Upload CSV / Excel Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] border border-dashed border-[#CBB9A0] dark:border-[#D4A373]/75">
            <input
              ref={docsInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => handleUploadFile('docs', e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => docsInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4A2B18] hover:bg-[#361F11] dark:bg-[#C59656] dark:hover:bg-[#B58342] text-white dark:text-[#140D09] text-xs font-extrabold cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload CSV / Excel</span>
              </button>
              {docsFile ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#147D4E] dark:text-[#6EE7A8] truncate">
                  <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{docsFile.fileName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDocsFile(null);
                      setDocsFileError('');
                      if (docsInputRef.current) docsInputRef.current.value = '';
                    }}
                    title="Hapus file"
                    className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-[#B91C1C] dark:text-[#FCA5A5] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span className="text-[11px] text-[#5D4C3E] dark:text-[#9E8B78]">
                  atau tempel data di bawah
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {docsFile && docsFile.sheetNames.length > 1 && (
                <select
                  value={docsFile.selectedSheet}
                  onChange={(e) => handleChangeSheet('docs', e.target.value)}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-[#1F150F] border border-[#CBB9A0] dark:border-[#D4A373]/75 text-[11px] font-bold text-black dark:text-white"
                >
                  {docsFile.sheetNames.map((name) => (
                    <option key={name} value={name}>
                      Sheet: {name}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={docsAmountMode}
                onChange={(e) =>
                  setDocsAmountMode(e.target.value as DocsAmountColumn)
                }
                className="px-2 py-1 rounded-lg bg-white dark:bg-[#1F150F] border border-[#CBB9A0] dark:border-[#D4A373]/75 text-[11px] font-bold text-black dark:text-white"
              >
                <option value="auto">Auto (Credit / Debet)</option>
                <option value="credit">Credit (DP) saja</option>
                <option value="debet">Debet (WD) saja</option>
                <option value="pendingan">Pendingan saja</option>
              </select>
            </div>
          </div>

          {docsFileError && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FBE7EB] dark:bg-[#3E1621] text-[#9F1239] dark:text-[#FDA4AF] text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{docsFileError}</span>
            </div>
          )}

          <textarea
            rows={6}
            value={docsText}
            onChange={(e) => {
              setDocsFile(null);
              setDocsFileError('');
              setDocsText(e.target.value);
            }}
            placeholder={
              docsFile
                ? `File aktif: ${docsFile.fileName} (${docsRows.length} baris terbaca). Hapus file di atas jika ingin tempel teks manual.`
                : 'Copy-tempel dari Google Sheets / Excel di sini:\nTANGGAL\tWAKTU\tuser id\tnama rekening\tpendingan\tcredit\tdebet\tbiaya'
            }
            className="w-full p-3 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-mono-tabular focus:outline-none focus:ring-2 focus:ring-[#4A2B18] dark:focus:ring-[#D4A373]"
          />
        </div>
      </div>

      {/* Docs Breakdown Strip */}
      {docsRows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 p-3">
            <div className="text-[11px] font-bold text-[#5D4C3E] dark:text-[#D6C7B5]">
              Total Credit (DP)
            </div>
            <div className="text-sm font-extrabold font-mono-tabular text-[#147D4E] dark:text-[#6EE7A8] mt-0.5">
              {formatRupiah(auditResult.totalCredit)}
            </div>
          </div>
          <div className="rounded-xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 p-3">
            <div className="text-[11px] font-bold text-[#5D4C3E] dark:text-[#D6C7B5]">
              Total Debet (WD)
            </div>
            <div className="text-sm font-extrabold font-mono-tabular text-[#B91C1C] dark:text-[#FCA5A5] mt-0.5">
              {formatRupiah(auditResult.totalDebet)}
            </div>
          </div>
          <div className="rounded-xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 p-3">
            <div className="text-[11px] font-bold text-[#5D4C3E] dark:text-[#D6C7B5]">
              Total Pendingan
            </div>
            <div className="text-sm font-extrabold font-mono-tabular text-black dark:text-white mt-0.5">
              {formatRupiah(auditResult.totalPending)}
            </div>
          </div>
          <div className="rounded-xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 p-3">
            <div className="text-[11px] font-bold text-[#5D4C3E] dark:text-[#D6C7B5]">
              Total Biaya
            </div>
            <div className="text-sm font-extrabold font-mono-tabular text-black dark:text-white mt-0.5">
              {formatRupiah(auditResult.totalBiaya)}
            </div>
          </div>
        </div>
      )}

      {/* Audit Summary Bar & Table */}
      <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 overflow-hidden">
        <div className="p-4 border-b border-[#E5DACB] dark:border-[#C59656]/35 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-[#4A2B18] dark:text-[#E5B874]" />
              <span className="font-bold text-[#3D322B] dark:text-[#D6C7B5]">
                Selisih Bersih:
              </span>
              <span
                className={`font-extrabold font-mono-tabular ${
                  auditResult.netDiff === 0
                    ? 'text-[#147D4E] dark:text-[#6EE7A8]'
                    : 'text-[#B91C1C] dark:text-[#FCA5A5]'
                }`}
              >
                {formatRupiah(auditResult.netDiff)}
              </span>
            </div>
            <span className="text-[#3D322B] dark:text-[#D6C7B5]">
              Cocok:{' '}
              <strong className="text-[#147D4E] dark:text-[#6EE7A8] tabular-nums">
                {auditResult.matchCount}
              </strong>{' '}
              · Selisih:{' '}
              <strong className="text-[#B91C1C] dark:text-[#FCA5A5] tabular-nums">
                {auditResult.mismatchCount}
              </strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B5D54] dark:text-[#9E8B78]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari User ID / Nama..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs focus:outline-none focus:ring-2 focus:ring-[#4A2B18] dark:focus:ring-[#C59656]"
              />
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#EFE7DC] dark:bg-[#140D09] border border-[#D4C4AE] dark:border-[#C59656]/60">
              <button
                type="button"
                onClick={() => setFilterMode('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold cursor-pointer whitespace-nowrap ${
                  filterMode === 'ALL'
                    ? 'bg-[#4A2B18] text-white dark:bg-[#C59656] dark:text-[#140D09]'
                    : 'text-black dark:text-white'
                }`}
              >
                Semua ({auditResult.rows.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('DIFF_ONLY')}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold cursor-pointer whitespace-nowrap ${
                  filterMode === 'DIFF_ONLY'
                    ? 'bg-[#4A2B18] text-white dark:bg-[#C59656] dark:text-[#140D09]'
                    : 'text-black dark:text-white'
                }`}
              >
                Selisih ({auditResult.mismatchCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('MATCH_ONLY')}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold cursor-pointer whitespace-nowrap ${
                  filterMode === 'MATCH_ONLY'
                    ? 'bg-[#4A2B18] text-white dark:bg-[#C59656] dark:text-[#140D09]'
                    : 'text-black dark:text-white'
                }`}
              >
                Cocok ({auditResult.matchCount})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-[#F4EDE3] dark:bg-[#291C14] border-b border-[#DFD1BE] dark:border-[#C59656]/60 text-[11px] font-extrabold uppercase tracking-wider text-[#3D322B] dark:text-[#D6C7B5]">
                <th className="py-3 px-4">USER ID</th>
                <th className="py-3 px-4 text-right">NOMINAL ADMIN</th>
                <th className="py-3 px-4 text-right">NOMINAL DOCS</th>
                <th className="py-3 px-4 text-right">SELISIH</th>
                <th className="py-3 px-4">INFO / REKENING</th>
                <th className="py-3 px-4 text-center">STATUS AUDIT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE0D2] dark:divide-[#C59656]/30 text-xs">
              {visibleRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 px-4 text-center font-semibold text-[#3D322B] dark:text-[#D6C7B5]"
                  >
                    {auditResult.rows.length === 0
                      ? 'Upload file CSV/Excel atau copy-tempel data Admin dan Docs di atas untuk mulai audit selisih.'
                      : 'Tidak ada baris yang cocok dengan filter pencarian.'}
                  </td>
                </tr>
              ) : (
                visibleRows.map((row) => (
                  <tr
                    key={row.userId}
                    className="hover:bg-[#F9F5EF] dark:hover:bg-[#261A12]"
                  >
                    <td className="py-3 px-4 font-extrabold text-black dark:text-white">
                      {row.userId}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-tabular font-bold text-black dark:text-white whitespace-nowrap">
                      {row.adminAmount !== null ? (
                        <>
                          {formatRupiah(row.adminAmount)}
                          {row.adminCount > 1 && (
                            <span className="ml-1 text-[10px] text-[#6E3E20] dark:text-[#E5B874]">
                              ({row.adminCount}x)
                            </span>
                          )}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-tabular font-bold text-black dark:text-white whitespace-nowrap">
                      {row.docsAmount !== null ? (
                        <>
                          {formatRupiah(row.docsAmount)}
                          {row.docsCount > 1 && (
                            <span className="ml-1 text-[10px] text-[#6E3E20] dark:text-[#E5B874]">
                              ({row.docsCount}x)
                            </span>
                          )}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono-tabular font-extrabold whitespace-nowrap ${
                        row.diff === 0
                          ? 'text-[#147D4E] dark:text-[#6EE7A8]'
                          : 'text-[#B91C1C] dark:text-[#FCA5A5]'
                      }`}
                    >
                      {row.diff === 0 ? 'Rp 0' : formatRupiah(row.diff)}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-[#3D322B] dark:text-[#D6C7B5] max-w-[260px] truncate">
                      {row.infoText}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                          row.status === 'COCOK'
                            ? 'bg-[#E4F4EC] text-[#0E603A] dark:bg-[#143B27] dark:text-[#7CE8AD]'
                            : row.status === 'SELISIH NOMINAL'
                              ? 'bg-[#F9EDD7] text-[#854D0E] dark:bg-[#3A2810] dark:text-[#F8C471]'
                              : 'bg-[#FBE7EB] text-[#9F1239] dark:bg-[#3E1621] dark:text-[#FDA4AF]'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
