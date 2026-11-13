import React, { useMemo, useState } from 'react';
import {
  Check,
  ClipboardPaste,
  Coins,
  Copy,
  Eraser,
  FileSpreadsheet,
  MessageSquare,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

interface RekapanTotoPanelProps {
  onCopyText: (text: string, label: string, customToast?: string) => void;
}

type TotoMode = 'validasi-pl' | 'rekap-koin' | 'data-turnover';

const BANK_COLUMNS = [
  'BANK JAGO',
  'BCA',
  'BNI',
  'BRI',
  'BSI',
  'CIMB',
  'DANA',
  'DANAMON',
  'GOPAY',
  'LINKAJA',
  'MANDIRI',
  'MAYBANK',
  'MEGA',
  'OCBC',
  'OVO',
  'PANIN',
  'PERMATA',
  'SEABANK',
  'SINARMAS',
  'ALLOBANK',
] as const;

type BankColumnName = (typeof BANK_COLUMNS)[number];

const BANK_MATCHERS: { bank: BankColumnName; regex: RegExp }[] = [
  { bank: 'BANK JAGO', regex: /\b(?:bank\s*)?jago\b/i },
  { bank: 'BCA', regex: /\bbca\b|\bmy\s*bca\b|\bm-?bca\b/i },
  { bank: 'BNI', regex: /\bbni\b|\bwondr\b/i },
  { bank: 'BRI', regex: /\bbri\b|\bbrimo\b/i },
  { bank: 'BSI', regex: /\bbsi\b|\bsyariah\s*indonesia\b/i },
  { bank: 'CIMB', regex: /\bcimb\b|\bniaga\b/i },
  { bank: 'DANA', regex: /\bdana\b/i },
  { bank: 'DANAMON', regex: /\bdanamon\b/i },
  { bank: 'GOPAY', regex: /\bgopay\b|\bgo-?pay\b/i },
  { bank: 'LINKAJA', regex: /\blink\s*aja\b/i },
  { bank: 'MANDIRI', regex: /\bmandiri\b|\blivin\b/i },
  { bank: 'MAYBANK', regex: /\bmaybank\b/i },
  { bank: 'MEGA', regex: /\bmega\b|\bbank\s*mega\b/i },
  { bank: 'OCBC', regex: /\bocbc\b|\bnisp\b/i },
  { bank: 'OVO', regex: /\bovo\b/i },
  { bank: 'PANIN', regex: /\bpanin\b/i },
  { bank: 'PERMATA', regex: /\bpermata\b/i },
  { bank: 'SEABANK', regex: /\bsea\s*bank\b/i },
  { bank: 'SINARMAS', regex: /\bsinar\s*mas\b/i },
  { bank: 'ALLOBANK', regex: /\ballo\s*bank\b|\ballo\b/i },
];

const SAMPLE_41_LOG = [
  ...Array(6).fill('08:12:04 | jago_user | BANK JAGO | 100,000 | ACCEPT'),
  ...Array(9).fill('08:15:22 | bca_member | BCA | 250,000 | ACCEPT'),
  ...Array(4).fill('08:18:10 | bni_member | BNI | 150,000 | ACCEPT'),
  ...Array(5).fill('08:21:44 | bri_member | BRI | 200,000 | ACCEPT'),
  ...Array(4).fill('08:25:01 | dana_member | DANA | 50,000 | ACCEPT'),
  ...Array(3).fill('08:30:19 | mandiri_user | MANDIRI | 500,000 | ACCEPT'),
  ...Array(2).fill('08:34:50 | gopay_user | GOPAY | 100,000 | ACCEPT'),
  ...Array(2).fill('08:39:11 | seabank_user | SEABANK | 300,000 | ACCEPT'),
  ...Array(2).fill('08:42:08 | ovo_user | OVO | 75,000 | ACCEPT'),
  '08:44:00 | cimb_user | CIMB | 100,000 | ACCEPT',
  '08:46:12 | bsi_user | BSI | 120,000 | ACCEPT',
  '08:48:33 | bonus_1 | BONUS711 | 50,000 | BONUS',
  '08:50:19 | bonus_2 | BONUS711 | 25,000 | BONUS',
].join('\n');

const SAMPLE_SHORT_LOG = [
  '12:01:10 | andi01 | BCA | 100,000',
  '12:02:15 | budi02 | DANA | 50,000',
  '12:03:20 | citra03 | BANK JAGO | 150,000',
  '12:04:30 | dewi04 | MANDIRI | 200,000',
  '12:05:45 | eka05 | BONUS711 | 25,000',
].join('\n');

export const RekapanTotoPanel: React.FC<RekapanTotoPanelProps> = ({
  onCopyText,
}) => {
  const [mode, setMode] = useState<TotoMode>('validasi-pl');
  const [rawInput, setRawInput] = useState('');

  // Rekap Koin & Data Turnover quick states
  const [coinRaw, setCoinRaw] = useState(
    'SGP | 12,500,000 | 8,200,000\nHK | 18,400,000 | 11,900,000\nSDY | 9,150,000 | 6,400,000'
  );
  const [turnoverRaw, setTurnoverRaw] = useState(
    'bocahgacor88 | TO: 25,000,000 | WL: +4,200,000\nzeus_mania69 | TO: 62,500,000 | WL: -12,800,000\nsultan_toto99 | TO: 14,200,000 | WL: +1,950,000'
  );

  const analysis = useMemo(() => {
    const lines = rawInput
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const counts: Record<BankColumnName, number> = {
      'BANK JAGO': 0,
      BCA: 0,
      BNI: 0,
      BRI: 0,
      BSI: 0,
      CIMB: 0,
      DANA: 0,
      DANAMON: 0,
      GOPAY: 0,
      LINKAJA: 0,
      MANDIRI: 0,
      MAYBANK: 0,
      MEGA: 0,
      OCBC: 0,
      OVO: 0,
      PANIN: 0,
      PERMATA: 0,
      SEABANK: 0,
      SINARMAS: 0,
      ALLOBANK: 0,
    };

    let detectedBankLines = 0;
    let bonus711Count = 0;
    let unknownCount = 0;

    lines.forEach((line) => {
      if (/\bbonus\s*711\b/i.test(line)) {
        bonus711Count += 1;
        return;
      }
      const matched = BANK_MATCHERS.find((m) => m.regex.test(line));
      if (matched) {
        counts[matched.bank] += 1;
        detectedBankLines += 1;
      } else {
        unknownCount += 1;
      }
    });

    const totalBankTx = BANK_COLUMNS.reduce((sum, b) => sum + counts[b], 0);

    return {
      totalInputLines: lines.length,
      detectedBankLines,
      bonus711Count,
      unknownCount,
      totalBankTx,
      counts,
    };
  }, [rawInput]);

  const coinSummary = useMemo(() => {
    const lines = coinRaw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    let totalIn = 0;
    let totalOut = 0;
    const rows = lines.map((line) => {
      const parts = line.split(/[|;\t]+/).map((p) => p.trim());
      const market = parts[0] || '-';
      const koinIn = Number((parts[1] || '0').replace(/[^\d]/g, '')) || 0;
      const koinOut = Number((parts[2] || '0').replace(/[^\d]/g, '')) || 0;
      totalIn += koinIn;
      totalOut += koinOut;
      return { market, koinIn, koinOut, net: koinIn - koinOut };
    });
    return { rows, totalIn, totalOut, net: totalIn - totalOut };
  }, [coinRaw]);

  const turnoverSummary = useMemo(() => {
    const lines = turnoverRaw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    let totalTo = 0;
    let totalWl = 0;
    const rows = lines.map((line) => {
      const parts = line.split(/[|;\t]+/).map((p) => p.trim());
      const user = parts[0] || '-';
      const to = Number((parts[1] || '0').replace(/[^\d]/g, '')) || 0;
      const wlRaw = (parts[2] || '0').replace(/[^\d-]/g, '');
      const wl = Number(wlRaw) || 0;
      totalTo += to;
      totalWl += wl;
      return { user, to, wl };
    });
    return { rows, totalTo, totalWl };
  }, [turnoverRaw]);

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard?.readText) {
        const txt = await navigator.clipboard.readText();
        if (txt) setRawInput(txt);
      }
    } catch {
      // ignore permission denial in iframe
    }
  };

  const handleCopyAllColumns = () => {
    const header = [...BANK_COLUMNS, 'TOTAL', 'BONUS711'].join('\t');
    const values = [
      ...BANK_COLUMNS.map((b) => analysis.counts[b]),
      analysis.totalBankTx,
      analysis.bonus711Count,
    ].join('\t');
    onCopyText(`${header}\n${values}`, 'Semua Kolom Validasi PL');
  };

  const handleCopyTsv20 = () => {
    const values = BANK_COLUMNS.map((b) => analysis.counts[b]).join('\t');
    onCopyText(values, 'Baris Count TSV (20 Bank)');
  };

  const handleCopyChatFormat = () => {
    const nonZero = BANK_COLUMNS.filter((b) => analysis.counts[b] > 0).map(
      (b) => `- ${b}: ${analysis.counts[b]}`
    );
    const lines = [
      `*VALIDASI PL HARIAN CS*`,
      ...(nonZero.length > 0 ? nonZero : ['- Tidak ada transaksi bank']),
      `TOTAL BANK (20 Bank): ${analysis.totalBankTx}`,
      `BONUS711: ${analysis.bonus711Count}`,
    ];
    onCopyText(lines.join('\n'), 'Format Chat CS');
  };

  return (
    <div className="space-y-5">
      {/* Header Card */}
      <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-[#4A2B18] dark:text-[#E5B874]">
            <span className="px-2 py-0.5 rounded bg-[#EAE0D2] dark:bg-[#2E2017] border border-[#CBB9A0] dark:border-[#4D3627]">
              TOOLS KERJA CS
            </span>
            <span>Otomatisasi Rekapan Data Harian &amp; Validasi PL</span>
          </div>
          <h1 className="text-2xl font-extrabold text-black dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-[#4A2B18] dark:text-[#E5B874]" />
            <span>ISI REKAPAN &amp; VALIDASI DATA CS</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#3D322B] dark:text-[#D6C7B5]">
            Form khusus CS &amp; Kasir untuk menghitung cepat transaksi per bank,
            total validasi PL harian, rekapitulasi koin, dan data turnover shift.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EAE0D2] dark:bg-[#2C1E16] border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-extrabold text-[#4A2B18] dark:text-[#E5B874] shrink-0">
          <Zap className="w-3.5 h-3.5" />
          <span>3 MODE REKAPAN</span>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setMode('validasi-pl')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold border cursor-pointer ${
            mode === 'validasi-pl'
              ? 'bg-[#4A2B18] text-white border-[#4A2B18] dark:bg-[#C59656] dark:text-[#140D09] dark:border-[#C59656]'
              : 'bg-white dark:bg-[#1F150F] text-black dark:text-white border-[#D4C4AE] dark:border-[#3A281D]'
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          <span>Validasi PL</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('rekap-koin')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold border cursor-pointer ${
            mode === 'rekap-koin'
              ? 'bg-[#4A2B18] text-white border-[#4A2B18] dark:bg-[#C59656] dark:text-[#140D09] dark:border-[#C59656]'
              : 'bg-white dark:bg-[#1F150F] text-black dark:text-white border-[#D4C4AE] dark:border-[#3A281D]'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>Rekap Koin</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('data-turnover')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold border cursor-pointer ${
            mode === 'data-turnover'
              ? 'bg-[#4A2B18] text-white border-[#4A2B18] dark:bg-[#C59656] dark:text-[#140D09] dark:border-[#C59656]'
              : 'bg-white dark:bg-[#1F150F] text-black dark:text-white border-[#D4C4AE] dark:border-[#3A281D]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Data Turnover</span>
        </button>
      </div>

      {mode === 'validasi-pl' && (
        <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-5 space-y-4">
          {/* Centered Pill Header */}
          <div className="text-center space-y-1">
            <span className="inline-block px-4 py-1 rounded-full bg-[#4A2B18] dark:bg-[#C59656] text-white dark:text-[#140D09] text-xs font-extrabold uppercase tracking-wider">
              ISI DATA VALIDASI
            </span>
            <p className="text-xs text-[#3D322B] dark:text-[#D6C7B5]">
              Tempel data transaksi. Tombol Copy Baris Count menyalin semua hasil.
            </p>
          </div>

          {/* Preset & Clipboard Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#3D322B] dark:text-[#D6C7B5]">
                Contoh Data:
              </span>
              <button
                type="button"
                onClick={() => setRawInput(SAMPLE_41_LOG)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-extrabold cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#4A2B18] dark:text-[#E5B874]" />
                <span>Format Log CS 41 Transaksi (Jago &amp; Bonus711)</span>
              </button>
              <button
                type="button"
                onClick={() => setRawInput(SAMPLE_SHORT_LOG)}
                className="px-3 py-1.5 rounded-lg bg-[#F8F4EE] hover:bg-[#EAE0D2] dark:bg-[#140D09] dark:hover:bg-[#2C1E16] text-black dark:text-white border border-[#D4C4AE] dark:border-[#3A281D] text-xs font-bold cursor-pointer"
              >
                Preset Singkat
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-extrabold cursor-pointer"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Tempel Clipboard</span>
              </button>
              <button
                type="button"
                onClick={() => setRawInput('')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FBE7EB] hover:bg-[#F7D0D8] dark:bg-[#3E1621] dark:hover:bg-[#521D2B] text-[#9F1239] dark:text-[#FDA4AF] border border-[#F2B8C6] dark:border-[#70263A] text-xs font-extrabold cursor-pointer"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Bersihkan</span>
              </button>
            </div>
          </div>

          {/* Paste Input Area */}
          <textarea
            rows={7}
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="Tempel data transaksi di sini..."
            className="w-full p-4 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-mono-tabular focus:outline-none focus:ring-2 focus:ring-[#4A2B18] dark:focus:ring-[#C59656]"
          />

          {/* Live Detection Counters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3 text-[#3D322B] dark:text-[#D6C7B5] font-mono-tabular">
              <span>
                Baris input:{' '}
                <strong className="text-black dark:text-white">
                  {analysis.totalInputLines}
                </strong>
              </span>
              <span>|</span>
              <span>
                Terdeteksi Bank:{' '}
                <strong className="text-[#147D4E] dark:text-[#6EE7A8]">
                  {analysis.detectedBankLines}
                </strong>
              </span>
              <span>|</span>
              <span>
                Bonus711:{' '}
                <strong className="text-[#4A2B18] dark:text-[#E5B874]">
                  {analysis.bonus711Count}
                </strong>
              </span>
              <span>|</span>
              <span>
                Tidak dikenali:{' '}
                <strong className="text-[#9F1239] dark:text-[#FDA4AF]">
                  {analysis.unknownCount}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[#3D322B] dark:text-[#D6C7B5] font-semibold">
                Total Transaksi Bank (20 Bank):
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#EAE0D2] dark:bg-[#2C1E16] border border-[#CBB9A0] dark:border-[#4D3627] font-mono-tabular font-extrabold text-black dark:text-white">
                {analysis.totalBankTx}
              </span>
            </div>
          </div>

          {/* 22-Column Matrix Header */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="font-extrabold uppercase tracking-wider text-black dark:text-white">
              HASIL VALIDASI PER JENIS BANK (PL HARIAN)
            </span>
            <span className="font-bold text-[#4A2B18] dark:text-[#E5B874]">
              20 Bank Terdaftar + Total &amp; Bonus
            </span>
          </div>

          {/* Horizontal Bank Matrix Table */}
          <div className="overflow-x-auto rounded-xl border border-[#CBB9A0] dark:border-[#4D3627]">
            <table className="w-full text-center border-collapse min-w-[1180px]">
              <thead>
                <tr className="text-[10px] font-extrabold uppercase tracking-wider">
                  {BANK_COLUMNS.map((bank) => (
                    <th
                      key={bank}
                      className="py-2.5 px-2 bg-[#4A2B18] dark:bg-[#C59656] text-white dark:text-[#140D09] border-r border-[#6B4229] dark:border-[#A87A3F] whitespace-nowrap"
                    >
                      {bank}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 bg-[#140D09] dark:bg-[#2B1D14] text-white border-r border-[#3A281D] whitespace-nowrap">
                    TOTAL
                  </th>
                  <th className="py-2.5 px-3 bg-[#9F1239] text-white whitespace-nowrap">
                    BONUS711
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-[#F8F4EE] dark:bg-[#140D09] font-mono-tabular text-sm font-extrabold">
                  {BANK_COLUMNS.map((bank) => (
                    <td
                      key={bank}
                      className={`py-3 px-2 border-r border-[#DFD1BE] dark:border-[#2E1F16] ${
                        analysis.counts[bank] > 0
                          ? 'text-[#4A2B18] dark:text-[#E5B874]'
                          : 'text-black dark:text-white'
                      }`}
                    >
                      {analysis.counts[bank]}
                    </td>
                  ))}
                  <td className="py-3 px-3 border-r border-[#DFD1BE] dark:border-[#2E1F16] text-black dark:text-white bg-[#EFE7DC] dark:bg-[#1F150F]">
                    {analysis.totalBankTx}
                  </td>
                  <td className="py-3 px-3 text-[#9F1239] dark:text-[#FDA4AF] bg-[#FBE7EB]/60 dark:bg-[#3E1621]/50">
                    {analysis.bonus711Count}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-[#5D4C3E] dark:text-[#B8A592]">
            Catatan: Tombol &quot;Copy Baris Count (TSV)&quot; hanya menyalin 20
            nilai bank (TOTAL &amp; BONUS711 dikecualikan sesuai format master).
          </p>

          {/* Bottom 4 Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleCopyAllColumns}
              className="lg:col-span-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-extrabold cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Semua Kolom (20 Bank)</span>
            </button>

            <button
              type="button"
              onClick={handleCopyTsv20}
              className="lg:col-span-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#4A2B18] hover:bg-[#361F11] dark:bg-[#C59656] dark:hover:bg-[#B58342] text-white dark:text-[#140D09] text-xs font-extrabold cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Copy Baris Count (TSV) - 20 Bank</span>
            </button>

            <button
              type="button"
              onClick={handleCopyChatFormat}
              className="lg:col-span-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#F4EDE3] dark:bg-[#211711] dark:hover:bg-[#2C1E16] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-extrabold cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Salin Format Chat CS</span>
            </button>

            <button
              type="button"
              onClick={() => setRawInput('')}
              className="lg:col-span-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#FBE7EB] hover:bg-[#F7D0D8] dark:bg-[#3E1621] dark:hover:bg-[#521D2B] text-[#9F1239] dark:text-[#FDA4AF] border border-[#F2B8C6] dark:border-[#70263A] text-xs font-extrabold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      )}

      {mode === 'rekap-koin' && (
        <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-black dark:text-white">
                REKAP KOIN PASARAN TOGEL
              </h2>
              <p className="text-xs text-[#3D322B] dark:text-[#D6C7B5]">
                Format: <code className="font-mono-tabular">PASARAN | KOIN MASUK | KOIN KELUAR</code>
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onCopyText(
                  `REKAP KOIN TOGEL\nTotal Masuk: ${formatRupiah(coinSummary.totalIn)}\nTotal Keluar: ${formatRupiah(coinSummary.totalOut)}\nNet Koin: ${formatRupiah(coinSummary.net)}`,
                  'Rekap Koin'
                )
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4A2B18] dark:bg-[#C59656] text-white dark:text-[#140D09] text-xs font-extrabold cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Salin Rekap Koin</span>
            </button>
          </div>

          <textarea
            rows={4}
            value={coinRaw}
            onChange={(e) => setCoinRaw(e.target.value)}
            className="w-full p-3.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-mono-tabular"
          />

          <div className="overflow-x-auto rounded-xl border border-[#DFD1BE] dark:border-[#3A281D]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F4EDE3] dark:bg-[#291C14] text-[11px] font-extrabold uppercase text-[#3D322B] dark:text-[#D6C7B5]">
                  <th className="py-2.5 px-4">PASARAN</th>
                  <th className="py-2.5 px-4 text-right">KOIN MASUK</th>
                  <th className="py-2.5 px-4 text-right">KOIN KELUAR</th>
                  <th className="py-2.5 px-4 text-right">NETTO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE0D2] dark:divide-[#2E1F16] font-mono-tabular">
                {coinSummary.rows.map((r, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-4 font-extrabold text-black dark:text-white">
                      {r.market}
                    </td>
                    <td className="py-2.5 px-4 text-right text-black dark:text-white">
                      {formatRupiah(r.koinIn)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-black dark:text-white">
                      {formatRupiah(r.koinOut)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-extrabold text-[#147D4E] dark:text-[#6EE7A8]">
                      {formatRupiah(r.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mode === 'data-turnover' && (
        <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-black dark:text-white">
                DATA TURNOVER SHIFT CS
              </h2>
              <p className="text-xs text-[#3D322B] dark:text-[#D6C7B5]">
                Format: <code className="font-mono-tabular">USER_ID | TO: NOMINAL | WL: NOMINAL</code>
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onCopyText(
                  `DATA TURNOVER SHIFT\nTotal TO: ${formatRupiah(turnoverSummary.totalTo)}\nTotal W/L: ${formatRupiah(turnoverSummary.totalWl)}`,
                  'Data Turnover'
                )
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4A2B18] dark:bg-[#C59656] text-white dark:text-[#140D09] text-xs font-extrabold cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Salin Data Turnover</span>
            </button>
          </div>

          <textarea
            rows={4}
            value={turnoverRaw}
            onChange={(e) => setTurnoverRaw(e.target.value)}
            className="w-full p-3.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-mono-tabular"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] border border-[#DFD1BE] dark:border-[#3A281D]">
              <div className="text-[11px] font-bold text-[#3D322B] dark:text-[#D6C7B5]">
                TOTAL TURNOVER
              </div>
              <div className="text-lg font-extrabold font-mono-tabular text-black dark:text-white mt-0.5">
                {formatRupiah(turnoverSummary.totalTo)}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] border border-[#DFD1BE] dark:border-[#3A281D]">
              <div className="text-[11px] font-bold text-[#3D322B] dark:text-[#D6C7B5]">
                TOTAL WIN / LOSE
              </div>
              <div className="text-lg font-extrabold font-mono-tabular text-[#4A2B18] dark:text-[#E5B874] mt-0.5">
                {formatRupiah(turnoverSummary.totalWl)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
