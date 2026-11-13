import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpDown,
  ClipboardPaste,
  Copy,
  RotateCcw,
  Timer,
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

interface InfoDpWdPanelProps {
  onCopyText: (text: string, label: string, customToast?: string) => void;
}

type NominalFilter = 'ALL' | '500K' | '1M';

interface CashierRow {
  rowKey: string;
  dateTime: string;
  userId: string;
  bankInfo: string;
  nominal: number;
  aliasCode: string;
  keterangan: string;
  status: string;
}

const KETERANGAN_OPTIONS = [
  'WD BARU',
  'WD Diatas 500rb',
  'WD Diatas 1jt',
  'GG FLOP Sudah Refund',
  'GG FLOP Belum Refund',
  'No Rek Tidak Valid',
  'Salah Nominal Depo',
  'Spam Form Kosong',
];

function parseKasirTransactions(raw: string, defaultAlias: string): CashierRow[] {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const parsed: CashierRow[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Format 2: Single-line log (e.g. 1 2026-08-28 05:54:45 goshjay Withdraw Pudja Arafat, 088279904053, GOPAY - 300,000 ACCEPT)
    const logMatch = line.match(
      /^(?:\d+\s+)?(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+([A-Za-z0-9_.-]+)\s+(?:Withdraw|Deposit|WD|DP)\s+(.+?)\s+[-–]\s+([\d.,]+)(?:\s+([A-Z]+))?/i
    );
    if (logMatch) {
      const dateTime = logMatch[1];
      const userId = logMatch[2];
      const bankParts = logMatch[3].split(',').map((p) => p.trim());
      const bankName = (bankParts[bankParts.length - 1] || 'BANK').toUpperCase();
      const nominal = Number(logMatch[4].replace(/[^\d]/g, '')) || 0;
      const status = (logMatch[5] || 'ACCEPT').toUpperCase();
      parsed.push({
        rowKey: `row-${parsed.length}-${userId}-${dateTime}`,
        dateTime,
        userId,
        bankInfo: bankName,
        nominal,
        aliasCode: defaultAlias,
        keterangan:
          nominal >= 1000000
            ? 'WD Diatas 1jt'
            : nominal >= 500000
              ? 'WD Diatas 500rb'
              : 'WD BARU',
        status,
      });
      i += 1;
      continue;
    }

    // Format 1: Multi-line block (1 goshjay / Withdraw 2026-08-28 05:54:45 600,000 145 / G4 / GOPAY, 088279904053, Pudja Arafat)
    const headerMatch = line.match(/^\d+\s+([A-Za-z0-9_.-]+)$/);
    if (headerMatch && i + 1 < lines.length) {
      const userId = headerMatch[1];
      let dateTime = '-';
      let nominal = 0;
      let aliasCode = defaultAlias;
      let bankInfo = '-';

      const nextLine = lines[i + 1] || '';
      const wdLineMatch = nextLine.match(
        /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+([\d.,]+)/
      );
      if (wdLineMatch) {
        dateTime = wdLineMatch[1];
        nominal = Number(wdLineMatch[2].replace(/[^\d]/g, '')) || 0;
      }

      let cursor = i + 2;
      if (cursor < lines.length && /^G\d+/i.test(lines[cursor])) {
        aliasCode = lines[cursor].trim();
        cursor += 1;
      }
      if (cursor < lines.length && !/^\d+\s+[A-Za-z0-9_.-]+$/.test(lines[cursor])) {
        const bankLine = lines[cursor];
        bankInfo = (bankLine.split(',')[0] || bankLine).trim().toUpperCase();
        cursor += 1;
      }

      parsed.push({
        rowKey: `row-${parsed.length}-${userId}-${dateTime}`,
        dateTime,
        userId,
        bankInfo,
        nominal,
        aliasCode,
        keterangan:
          nominal >= 1000000
            ? 'WD Diatas 1jt'
            : nominal >= 500000
              ? 'WD Diatas 500rb'
              : 'WD BARU',
        status: 'PROSES',
      });
      i = cursor;
      continue;
    }

    // Format 3: Flop line (e.g. pasti99 adi suryadi, 082219020312, DANA 5,000,000 5,000,000)
    const flopMatch = line.match(
      /^([A-Za-z0-9_.-]+)\s+([^,]+),\s*([^,]+),\s*([A-Za-z0-9_-]+)\s+([\d.,]+)/i
    );
    if (flopMatch) {
      const userId = flopMatch[1];
      const bankInfo = flopMatch[4].toUpperCase();
      const nominal = Number(flopMatch[5].replace(/[^\d]/g, '')) || 0;
      parsed.push({
        rowKey: `row-${parsed.length}-${userId}-${i}`,
        dateTime: '-',
        userId,
        bankInfo,
        nominal,
        aliasCode: defaultAlias,
        keterangan: 'GG FLOP Belum Refund',
        status: 'FLOP',
      });
      i += 1;
      continue;
    }

    i += 1;
  }

  return parsed;
}

export const InfoDpWdPanel: React.FC<InfoDpWdPanelProps> = ({ onCopyText }) => {
  const [aliasInput, setAliasInput] = useState('');
  const [includeNb, setIncludeNb] = useState(false);
  const [nominalFilter, setNominalFilter] = useState<NominalFilter>('ALL');
  const [timer5sActive, setTimer5sActive] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [rowOverrides, setRowOverrides] = useState<
    Record<string, { alias?: string; ket?: string }>
  >({});

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const scheduleAutoClear = () => {
    if (!timer5sActive) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setRawInput('');
      setRowOverrides({});
    }, 5000);
  };

  const baseRows = useMemo(
    () => parseKasirTransactions(rawInput, aliasInput.trim()),
    [rawInput, aliasInput]
  );

  const visibleRows = useMemo(() => {
    return baseRows
      .filter((r) => {
        if (nominalFilter === '500K') return r.nominal >= 500000;
        if (nominalFilter === '1M') return r.nominal >= 1000000;
        return true;
      })
      .map((r) => {
        const ov = rowOverrides[r.rowKey];
        return {
          ...r,
          aliasCode: ov?.alias !== undefined ? ov.alias : r.aliasCode,
          keterangan: ov?.ket !== undefined ? ov.ket : r.keterangan,
        };
      });
  }, [baseRows, nominalFilter, rowOverrides]);

  const compiledReport = useMemo(() => {
    if (visibleRows.length === 0) return '';
    const lines = visibleRows.map((r, idx) => {
      const aliasPart = r.aliasCode ? `${r.aliasCode} ` : '';
      const timePart = r.dateTime !== '-' ? `${r.dateTime} | ` : '';
      const ketPart = r.keterangan ? ` [${r.keterangan}]` : '';
      return `${idx + 1}. ${aliasPart}${timePart}${r.userId} | ${r.bankInfo} | ${formatRupiah(r.nominal)}${ketPart}`;
    });
    if (includeNb) {
      lines.push('');
      lines.push('NB: Mohon cek mutasi & validasi rekening tujuan sebelum proses.');
    }
    return lines.join('\n');
  }, [visibleRows, includeNb]);

  const handleCopyReport = () => {
    if (!compiledReport) return;
    onCopyText(
      compiledReport,
      'Laporan Info DP/WD',
      'Laporan transaksi kasir berhasil disalin & format input dibersihkan'
    );
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setRawInput('');
    setRowOverrides({});
  };

  const applyAllKeterangan = (ketValue: string) => {
    const next: Record<string, { alias?: string; ket?: string }> = { ...rowOverrides };
    visibleRows.forEach((r) => {
      next[r.rowKey] = { ...next[r.rowKey], ket: ketValue };
    });
    setRowOverrides(next);
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard?.readText) {
        const txt = await navigator.clipboard.readText();
        if (txt) {
          setRawInput(txt);
          setRowOverrides({});
          scheduleAutoClear();
        }
      }
    } catch {
      // ignore clipboard permission denial
    }
  };

  const handleCopyTable = () => {
    if (visibleRows.length === 0) return;
    const tsv = [
      ['NO', 'TANGGAL & JAM', 'USER ID', 'BANK', 'NOMINAL', 'KODE ALIAS', 'KETERANGAN', 'STATUS'].join('\t'),
      ...visibleRows.map((r, i) =>
        [
          i + 1,
          r.dateTime,
          r.userId,
          r.bankInfo,
          r.nominal,
          r.aliasCode || '-',
          r.keterangan || '-',
          r.status,
        ].join('\t')
      ),
    ].join('\n');
    onCopyText(tsv, 'Tabel Transaksi Kasir');
  };

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 p-5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-[#4A2B18] dark:text-[#E5B874]">
            <span className="px-2 py-0.5 rounded bg-[#EAE0D2] dark:bg-[#2E2017] border border-[#CBB9A0] dark:border-[#D4A373]/75">
              TOOLS KASIR
            </span>
            <span>Ekstraksi Laporan DP, WD &amp; Flop</span>
          </div>
          <h1 className="text-2xl font-extrabold text-black dark:text-white flex items-center gap-2">
            <ArrowUpDown className="w-6 h-6 text-[#4A2B18] dark:text-[#E5B874]" />
            <span>INFO DP / WD &amp; LAPORAN TRANSAKSI</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#3D322B] dark:text-[#D6C7B5]">
            Format otomatis laporan WD BARU, WD Diatas 500rb/1jt, Flop refund,
            Salah Nominal Depo, dan Spam Form Kosong.
          </p>
        </div>

        {/* Right Controls: Kode Alias, Sertakan NB, Nominal Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs">
            <span className="font-bold text-[#3D322B] dark:text-[#D6C7B5] whitespace-nowrap">
              Kode Alias:
            </span>
            <input
              type="text"
              value={aliasInput}
              onChange={(e) => setAliasInput(e.target.value)}
              placeholder="CONTOH: G1,"
              className="w-24 px-2 py-0.5 rounded bg-white dark:bg-[#1F150F] text-black dark:text-white border border-[#D4C4AE] dark:border-[#C59656]/60 text-xs font-mono-tabular font-bold focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setIncludeNb((p) => !p)}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border cursor-pointer whitespace-nowrap ${
              includeNb
                ? 'bg-[#4A2B18] text-white border-[#4A2B18] dark:bg-[#C59656] dark:text-[#140D09] dark:border-[#C59656]'
                : 'bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border-[#CBB9A0] dark:border-[#D4A373]/75'
            }`}
          >
            Sertakan NB: {includeNb ? 'YA' : 'TIDAK'}
          </button>

          <select
            value={nominalFilter}
            onChange={(e) => setNominalFilter(e.target.value as NominalFilter)}
            className="px-3.5 py-2 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-extrabold focus:outline-none"
          >
            <option value="ALL">Semua Nominal (Tanpa Filter)</option>
            <option value="500K">Minimal Rp 500.000</option>
            <option value="1M">Minimal Rp 1.000.000</option>
          </select>
        </div>
      </div>

      {/* Info Strip */}
      <div className="rounded-xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-[#3D322B] dark:text-[#D6C7B5]">
          Otomatis: Format mentah yang ditempel akan otomatis hilang setelah hasil
          laporan di-copy.
        </span>
        <button
          type="button"
          onClick={() => setTimer5sActive((p) => !p)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-extrabold border cursor-pointer ${
            timer5sActive
              ? 'bg-[#E4F4EC] text-[#0E603A] border-[#9FD7B9] dark:bg-[#143B27] dark:text-[#7CE8AD] dark:border-[#246342]'
              : 'bg-[#F8F4EE] text-black border-[#CBB9A0] dark:bg-[#140D09] dark:text-white dark:border-[#D4A373]/75'
          }`}
        >
          <Timer className="w-3.5 h-3.5" />
          <span>Timer 5s: {timer5sActive ? 'AKTIF' : 'NONAKTIF'}</span>
        </button>
      </div>

      {/* Middle 2-Column Workspace: Box 01 & Box 02 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Box 01 */}
        <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 p-5 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded bg-[#EAE0D2] dark:bg-[#2E2017] border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-extrabold font-mono-tabular text-[#4A2B18] dark:text-[#E5B874]">
                01
              </span>
              <div>
                <h2 className="text-sm font-extrabold text-black dark:text-white">
                  TEMPEL FORMAT KASIR (WD / DP / FLOP)
                </h2>
                <p className="text-[11px] text-[#5D4C3E] dark:text-[#B8A592]">
                  Siap Menampung Data
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-[10px] font-extrabold cursor-pointer"
              >
                <ClipboardPaste className="w-3 h-3" />
                <span>PASTE CLIPBOARD</span>
              </button>
              <span className="px-2 py-1 rounded-lg bg-[#F8F4EE] dark:bg-[#140D09] border border-[#D4C4AE] dark:border-[#C59656]/60 text-[10px] font-extrabold text-[#4A2B18] dark:text-[#E5B874]">
                INPUT KASIR
              </span>
            </div>
          </div>

          <textarea
            rows={10}
            value={rawInput}
            onChange={(e) => {
              setRawInput(e.target.value);
              setRowOverrides({});
            }}
            onPaste={() => scheduleAutoClear()}
            placeholder={`Tempelkan format report WD / DP / Flop di sini...\n\nFormat yang didukung otomatis:\n1. WD Multi-line:\n1 goshjay\nWithdraw 2026-08-28 05:54:45 600,000 145\nG4\nGOPAY, 088279904053, Pudja Arafat\n\n2. WD Baris Log:\n1 2026-08-28 05:54:45 goshjay Withdraw Pudja Arafat, 088279904053, GOPAY - 300,000 ACCEPT\n\n3. Format Flop:\npasti99 adi suryadi, 082219020312, DANA 5,000,000 5,000,000`}
            className="flex-1 w-full p-3.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-mono-tabular focus:outline-none focus:ring-2 focus:ring-[#4A2B18] dark:focus:ring-[#C59656]"
          />

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={!rawInput.trim()}
              onClick={() => onCopyText(rawInput, 'Data Mentah Kasir')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-extrabold disabled:opacity-45 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Data Mentah</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRawInput('');
                setRowOverrides({});
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FBE7EB] hover:bg-[#F7D0D8] dark:bg-[#3E1621] dark:hover:bg-[#521D2B] text-[#9F1239] dark:text-[#FDA4AF] border border-[#F2B8C6] dark:border-[#70263A] text-xs font-extrabold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Box 02 */}
        <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded bg-[#EAE0D2] dark:bg-[#2E2017] border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-extrabold font-mono-tabular text-[#4A2B18] dark:text-[#E5B874]">
                02
              </span>
              <div>
                <h2 className="text-sm font-extrabold text-black dark:text-white">
                  HASIL EKSTRAKSI LAPORAN (SIAP SALIN)
                </h2>
                <p className="text-[11px] text-[#5D4C3E] dark:text-[#B8A592]">
                  {visibleRows.length > 0
                    ? `${visibleRows.length} Transaksi Siap Salin`
                    : 'Menunggu Input Mentah'}
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-lg bg-[#EAE0D2] dark:bg-[#2C1E16] border border-[#CBB9A0] dark:border-[#D4A373]/75 text-[10px] font-extrabold text-[#4A2B18] dark:text-[#E5B874]">
              READY TO COPY
            </span>
          </div>

          <textarea
            readOnly
            rows={10}
            value={compiledReport}
            placeholder="Laporan hasil ekstraksi otomatis akan langsung muncul di sini sesuai format standar kasir..."
            className="flex-1 w-full p-3.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-mono-tabular focus:outline-none"
          />

          <button
            type="button"
            disabled={!compiledReport}
            onClick={handleCopyReport}
            className="w-full py-2.5 px-4 rounded-xl bg-[#4A2B18] hover:bg-[#361F11] dark:bg-[#C59656] dark:hover:bg-[#B58342] text-white dark:text-[#140D09] cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed shadow-xs text-center"
          >
            <div className="inline-flex items-center justify-center gap-2 text-xs font-extrabold">
              <Copy className="w-3.5 h-3.5" />
              <span>COPY LAPORAN TRANSAKSI</span>
            </div>
            <div className="text-[10px] opacity-85">
              • Format mentah yang ditempel otomatis hilang setelah disalin
            </div>
          </button>

          <div className="flex items-center justify-between text-xs pt-0.5">
            <span className="font-bold text-[#147D4E] dark:text-[#6EE7A8] font-mono-tabular">
              Jumlah Transaksi Terproses: {visibleRows.length} User
            </span>
            <span className="font-semibold text-[#5D4C3E] dark:text-[#B8A592]">
              {nominalFilter === 'ALL'
                ? 'Semua Transaksi'
                : nominalFilter === '500K'
                  ? 'Filter ≥ Rp 500rb'
                  : 'Filter ≥ Rp 1jt'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Box 03: Tabel Transaksi & Pengaturan Keterangan */}
      <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E5DACB] dark:border-[#C59656]/35 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded bg-[#EAE0D2] dark:bg-[#2E2017] border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-extrabold font-mono-tabular text-[#4A2B18] dark:text-[#E5B874]">
              03
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-black dark:text-white">
                TABEL TRANSAKSI &amp; PENGATURAN KETERANGAN / KODE ALIAS
              </h2>
              <p className="text-[11px] text-[#5D4C3E] dark:text-[#B8A592]">
                Ubah Keterangan (WD BARU, WD Diatas 500k/1jt, Salah Nominal Depo,
                Spam Form Kosong, Flop) per user ID:
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => applyAllKeterangan('')}
              className="px-2.5 py-1.5 rounded-lg bg-[#F8F4EE] hover:bg-[#EAE0D2] dark:bg-[#140D09] dark:hover:bg-[#2C1E16] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-[11px] font-bold cursor-pointer"
            >
              Kosongkan Ket
            </button>
            <button
              type="button"
              onClick={() => applyAllKeterangan('GG FLOP Sudah Refund')}
              className="px-2.5 py-1.5 rounded-lg bg-[#E4F4EC] dark:bg-[#143B27] text-[#0E603A] dark:text-[#7CE8AD] border border-[#9FD7B9] dark:border-[#246342] text-[11px] font-extrabold cursor-pointer"
            >
              + GG FLOP Sudah Refund
            </button>
            <button
              type="button"
              onClick={() => applyAllKeterangan('GG FLOP Belum Refund')}
              className="px-2.5 py-1.5 rounded-lg bg-[#F9EDD7] dark:bg-[#3A2810] text-[#854D0E] dark:text-[#F8C471] border border-[#E6C58D] dark:border-[#69481A] text-[11px] font-extrabold cursor-pointer"
            >
              + GG FLOP Belum Refund
            </button>
            <button
              type="button"
              onClick={() => applyAllKeterangan('No Rek Tidak Valid')}
              className="px-2.5 py-1.5 rounded-lg bg-[#FBE7EB] dark:bg-[#3E1621] text-[#9F1239] dark:text-[#FDA4AF] border border-[#F2B8C6] dark:border-[#70263A] text-[11px] font-extrabold cursor-pointer"
            >
              + No Rek Tidak Valid
            </button>

            <select
              value=""
              onChange={(e) => {
                if (e.target.value) applyAllKeterangan(e.target.value);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-[11px] font-bold"
            >
              <option value="">Ubah Semua: Pilih Keterangan...</option>
              {KETERANGAN_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={visibleRows.length === 0}
              onClick={handleCopyTable}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#4A2B18] dark:bg-[#C59656] text-white dark:text-[#140D09] text-[11px] font-extrabold disabled:opacity-45 cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>Copy Tabel</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[860px]">
            <thead>
              <tr className="bg-[#F4EDE3] dark:bg-[#291C14] border-b border-[#DFD1BE] dark:border-[#C59656]/60 text-[10px] font-extrabold uppercase tracking-wider text-[#3D322B] dark:text-[#D6C7B5]">
                <th className="py-2.5 px-4">NO</th>
                <th className="py-2.5 px-4">TANGGAL &amp; JAM</th>
                <th className="py-2.5 px-4">USER ID</th>
                <th className="py-2.5 px-4">BANK</th>
                <th className="py-2.5 px-4 text-right">NOMINAL</th>
                <th className="py-2.5 px-4">KODE ALIAS</th>
                <th className="py-2.5 px-4">KETERANGAN (KASIR)</th>
                <th className="py-2.5 px-4 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE0D2] dark:divide-[#C59656]/30 text-xs">
              {visibleRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-8 px-4 text-center font-semibold text-[#5D4C3E] dark:text-[#B8A592]"
                  >
                    Belum ada data transaksi. Silakan tempelkan format di Box 01
                    untuk mengekstrak data otomatis.
                  </td>
                </tr>
              ) : (
                visibleRows.map((r, idx) => (
                  <tr
                    key={r.rowKey}
                    className="hover:bg-[#F9F5EF] dark:hover:bg-[#261A12]"
                  >
                    <td className="py-2.5 px-4 font-mono-tabular font-bold text-black dark:text-white">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-4 font-mono-tabular text-black dark:text-white whitespace-nowrap">
                      {r.dateTime}
                    </td>
                    <td className="py-2.5 px-4 font-extrabold text-black dark:text-white">
                      {r.userId}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-[#4A2B18] dark:text-[#E5B874]">
                      {r.bankInfo}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono-tabular font-extrabold text-black dark:text-white">
                      {formatRupiah(r.nominal)}
                    </td>
                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        value={r.aliasCode}
                        onChange={(e) =>
                          setRowOverrides((prev) => ({
                            ...prev,
                            [r.rowKey]: {
                              ...prev[r.rowKey],
                              alias: e.target.value,
                            },
                          }))
                        }
                        placeholder="G1"
                        className="w-20 px-2 py-1 rounded bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-mono-tabular font-bold"
                      />
                    </td>
                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        list="kasir-ket-options"
                        value={r.keterangan}
                        onChange={(e) =>
                          setRowOverrides((prev) => ({
                            ...prev,
                            [r.rowKey]: {
                              ...prev[r.rowKey],
                              ket: e.target.value,
                            },
                          }))
                        }
                        className="w-48 px-2 py-1 rounded bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-bold"
                      />
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-[#EAE0D2] dark:bg-[#2C1E16] text-black dark:text-white text-[10px] font-extrabold">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <datalist id="kasir-ket-options">
            {KETERANGAN_OPTIONS.map((opt) => (
              <option key={opt} value={opt} />
            ))}
          </datalist>
        </div>
      </div>
    </div>
  );
};
