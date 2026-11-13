import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ClipboardPaste,
  Copy,
  FileText,
  Lock,
  RotateCcw,
  ShieldCheck,
  UserCog,
  Zap,
} from 'lucide-react';

interface LaporanCsPanelProps {
  onCopyText: (text: string, label: string, customToast?: string) => void;
}

type LaporanMode = 'ganti-data' | 'locked-unlock' | 'crosscheck-locked';

interface ExtractedChangeRow {
  no: number;
  dateTime: string;
  userId: string;
  staff: string;
  beforeData: string;
  afterData: string;
  keterangan: string;
}

const QUICK_EXAMPLES: { id: string; label: string; raw: string }[] = [
  {
    id: 'ganti-rek',
    label: 'Ganti No Rek (lesi678xxxx)',
    raw: `8 12-09-2026 12:14:27 keoaaecs9 change user info lesi678xxxx bank : gopay -> GOPAY,rek : 08569404728 -> 085694047282,bank : gopay -> GOPAY,acc : Iwan Setiawan -> Iwan Setiawan,rek : 08569404728 -> 085694047282,color : #FFFFFF -> white lesi678xxxx`,
  },
  {
    id: 'ganti-nama',
    label: 'Ganti Nama Rek (lesi678xxxx)',
    raw: `3 12-09-2026 14:22:10 keoaaecs9 change user info lesi678xxxx bank : BCA -> BCA,acc : IWAN S -> IWAN SETIAWAN,rek : 5220391823 -> 5220391823`,
  },
  {
    id: 'spasi-nama',
    label: 'Spasi Nama (cawah09xxxx)',
    raw: `1 12-09-2026 20:38:31 keoaaecs9 change user info cawah09xxxx bank : gopay -> GOPAY,bank : Dahliasari -> Dahlia Sari,bank : gopay -> GOPAY,acc : Dahliasari -> Dahlia Sari,rek : 089638137501 -> 089638137501,color : #FFFFFF -> white cawah09xxxx`,
  },
  {
    id: 'ganti-bank',
    label: 'Ganti Bank (Dana => BRI)',
    raw: `5 12-09-2026 16:05:44 keoaaecs9 change user info bima7788 bank : DANA -> BRI,acc : BIMA PUTRA -> BIMA PUTRA,rek : 081234567890 -> 012901928471502`,
  },
];

function parseChangeLogs(
  raw: string,
  mode: LaporanMode,
  staffAlias: string
): ExtractedChangeRow[] {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const rows: ExtractedChangeRow[] = [];

  lines.forEach((line, idx) => {
    const dtMatch = line.match(
      /(\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}:\d{2}|\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/
    );
    const dateTime = dtMatch ? dtMatch[1] : '-';

    if (mode === 'locked-unlock' || mode === 'crosscheck-locked') {
      const tokens = line.split(/[\s|,;\t]+/).filter(Boolean);
      const userId =
        line.match(/(?:user|id)\s*[:=]\s*([A-Za-z0-9_.-]+)/i)?.[1] ||
        tokens.find((t) => /^[a-zA-Z][a-zA-Z0-9_.-]{3,}$/.test(t)) ||
        `user_${idx + 1}`;
      const isUnlock = /unlock/i.test(line);
      const ket =
        mode === 'crosscheck-locked'
          ? 'CROSSCHECK AKUN LOCKED'
          : isUnlock
            ? 'UNLOCK AKUN'
            : 'LOCKED AKUN';
      rows.push({
        no: rows.length + 1,
        dateTime,
        userId,
        staff: staffAlias || 'DON PABLO',
        beforeData: isUnlock ? 'LOCKED' : 'AKTIF',
        afterData: isUnlock ? 'AKTIF (UNLOCK)' : 'LOCKED',
        keterangan: ket,
      });
      return;
    }

    // Standard change user info parser
    const changeMatch = line.match(
      /change\s+user\s+info\s+([A-Za-z0-9_.-]+)\s+(.*)$/i
    );
    const staffInLogMatch = line.match(
      /\d{2}:\d{2}:\d{2}\s+([A-Za-z0-9_.-]+)\s+change\s+user/i
    );

    const userId = changeMatch
      ? changeMatch[1]
      : line.split(/[\s|,\t]+/)[0] || `user_${idx + 1}`;
    const staff =
      staffAlias.trim() || (staffInLogMatch ? staffInLogMatch[1] : 'DON PABLO');
    const body = changeMatch ? changeMatch[2] : line;

    const extractDiff = (keyRegex: RegExp) => {
      const matches = [...body.matchAll(keyRegex)];
      for (const m of matches) {
        const oldVal = (m[1] || '').trim();
        const newVal = (m[2] || '').trim();
        if (oldVal && newVal && oldVal.toLowerCase() !== newVal.toLowerCase()) {
          return { oldVal, newVal };
        }
      }
      return null;
    };

    const bankDiff = extractDiff(
      /bank\s*:\s*([^,\->]+?)\s*->\s*([^,]+)/gi
    );
    const accDiff = extractDiff(/acc\s*:\s*([^,\->]+?)\s*->\s*([^,]+)/gi);
    const rekDiff = extractDiff(/rek\s*:\s*([^,\->]+?)\s*->\s*([^,]+)/gi);

    const beforeParts: string[] = [];
    const afterParts: string[] = [];
    const ketTags: string[] = [];

    if (bankDiff) {
      beforeParts.push(`Bank: ${bankDiff.oldVal}`);
      afterParts.push(`Bank: ${bankDiff.newVal}`);
      ketTags.push(`GANTI BANK (${bankDiff.oldVal} -> ${bankDiff.newVal})`);
    }
    if (accDiff) {
      const cleanOld = accDiff.oldVal.replace(/\s+/g, '').toLowerCase();
      const cleanNew = accDiff.newVal.replace(/\s+/g, '').toLowerCase();
      beforeParts.push(`A/N: ${accDiff.oldVal}`);
      afterParts.push(`A/N: ${accDiff.newVal}`);
      ketTags.push(
        cleanOld === cleanNew ? 'PERBAIKI SPASI NAMA' : 'GANTI NAMA REKENING'
      );
    }
    if (rekDiff) {
      beforeParts.push(`Rek: ${rekDiff.oldVal}`);
      afterParts.push(`Rek: ${rekDiff.newVal}`);
      ketTags.push('GANTI NO REKENING');
    }

    if (beforeParts.length === 0) {
      beforeParts.push('-');
      afterParts.push('-');
      ketTags.push('UPDATE DATA USER');
    }

    rows.push({
      no: rows.length + 1,
      dateTime,
      userId,
      staff,
      beforeData: beforeParts.join(' | '),
      afterData: afterParts.join(' | '),
      keterangan: ketTags.join(' + '),
    });
  });

  return rows;
}

export const LaporanCsPanel: React.FC<LaporanCsPanelProps> = ({
  onCopyText,
}) => {
  const [staffAlias, setStaffAlias] = useState('DON PABLO');
  const [mode, setMode] = useState<LaporanMode>('ganti-data');
  const [autoClear, setAutoClear] = useState(true);
  const [rawInput, setRawInput] = useState('');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const scheduleAutoClear = () => {
    if (!autoClear) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setRawInput('');
    }, 5000);
  };

  const rows = useMemo(
    () => parseChangeLogs(rawInput, mode, staffAlias),
    [rawInput, mode, staffAlias]
  );

  const compiledReport = useMemo(() => {
    if (rows.length === 0) return '';
    const title =
      mode === 'ganti-data'
        ? 'LAPORAN GANTI DATA MEMBER'
        : mode === 'locked-unlock'
          ? 'LAPORAN LOCKED / UNLOCK AKUN'
          : 'LAPORAN CROSSCHECK LOCKED AKUN';

    const lines = rows.map(
      (r) =>
        `${r.no}. ${r.userId} | ${r.keterangan}\n   Sebelumnya: ${r.beforeData}\n   Terbaru: ${r.afterData} (${r.dateTime})`
    );
    return `${title}\nStaff: ${staffAlias || 'DON PABLO'}\nTotal: ${rows.length} Akun\n\n${lines.join('\n')}`;
  }, [rows, mode, staffAlias]);

  const handleCopyReport = () => {
    if (!compiledReport) return;
    onCopyText(
      compiledReport,
      'Laporan Ganti Data CS',
      'Laporan CS berhasil disalin ke clipboard'
    );
    if (autoClear) {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      setRawInput('');
    }
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setRawInput(text);
          scheduleAutoClear();
        }
      }
    } catch {
      // ignore clipboard read block
    }
  };

  const handleCopyTable = () => {
    if (rows.length === 0) return;
    const tsv = [
      ['NO', 'TANGGAL & JAM', 'USER ID', 'STAFF', 'DATA SEBELUMNYA', 'DATA TERBARU', 'KETERANGAN LAPORAN'].join('\t'),
      ...rows.map((r) =>
        [r.no, r.dateTime, r.userId, r.staff, r.beforeData, r.afterData, r.keterangan].join('\t')
      ),
    ].join('\n');
    onCopyText(tsv, 'Tabel Detail Ganti Data');
  };

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-[#4A2B18] dark:text-[#E5B874]">
            <span className="px-2 py-0.5 rounded bg-[#EAE0D2] dark:bg-[#2E2017] border border-[#CBB9A0] dark:border-[#4D3627]">
              TOOLS OPERASIONAL CS
            </span>
            <span>Live Extractor &amp; Formatter</span>
          </div>
          <h1 className="text-2xl font-extrabold text-black dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#4A2B18] dark:text-[#E5B874]" />
            <span>LAPORAN GANTI DATA CS</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#3D322B] dark:text-[#D6C7B5]">
            Ekstraksi log pergantian rekening/identitas member ke format laporan
            baku CS yang siap dikirim.
          </p>
        </div>

        {/* Right Alias + Mode Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] border border-[#CBB9A0] dark:border-[#4D3627] px-3 py-1.5 flex items-center gap-2">
            <UserCog className="w-4 h-4 text-[#4A2B18] dark:text-[#E5B874] shrink-0" />
            <div>
              <div className="text-[9px] font-extrabold uppercase tracking-wider text-[#5D4C3E] dark:text-[#B8A592]">
                NAMA / KODE ALIAS:
              </div>
              <input
                type="text"
                value={staffAlias}
                onChange={(e) => setStaffAlias(e.target.value)}
                className="w-32 bg-transparent text-xs font-extrabold text-black dark:text-white focus:outline-none border-b border-[#CBB9A0] dark:border-[#4D3627]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#EFE7DC] dark:bg-[#140D09] border border-[#D4C4AE] dark:border-[#3A281D]">
            <button
              type="button"
              onClick={() => setMode('ganti-data')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-extrabold cursor-pointer ${
                mode === 'ganti-data'
                  ? 'bg-[#4A2B18] text-white dark:bg-[#C59656] dark:text-[#140D09]'
                  : 'text-black dark:text-white'
              }`}
            >
              <UserCog className="w-3.5 h-3.5" />
              <span>GANTI DATA</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('locked-unlock')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-extrabold cursor-pointer ${
                mode === 'locked-unlock'
                  ? 'bg-[#4A2B18] text-white dark:bg-[#C59656] dark:text-[#140D09]'
                  : 'text-black dark:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>LOCKED / UNLOCK</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('crosscheck-locked')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-extrabold cursor-pointer ${
                mode === 'crosscheck-locked'
                  ? 'bg-[#4A2B18] text-white dark:bg-[#C59656] dark:text-[#140D09]'
                  : 'text-black dark:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>CROSSCHECK LOCKED</span>
            </button>
          </div>
        </div>
      </div>

      {/* Auto-Clear Info Strip */}
      <div className="rounded-xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-[#3D322B] dark:text-[#D6C7B5]">
          Auto-Clear {autoClear ? 'Aktif' : 'Nonaktif'}: Format input otomatis
          dibersihkan saat laporan disalin (atau 5 detik setelah tempel).
        </span>
        <button
          type="button"
          onClick={() => setAutoClear((p) => !p)}
          className={`px-3 py-1 rounded-lg text-[11px] font-extrabold border cursor-pointer ${
            autoClear
              ? 'bg-[#E4F4EC] text-[#0E603A] border-[#9FD7B9] dark:bg-[#143B27] dark:text-[#7CE8AD] dark:border-[#246342]'
              : 'bg-[#F8F4EE] text-black border-[#CBB9A0] dark:bg-[#140D09] dark:text-white dark:border-[#4D3627]'
          }`}
        >
          Auto-Clear: {autoClear ? 'AKTIF' : 'NONAKTIF'}
        </button>
      </div>

      {/* Middle 2-Column Workspace: Box 01 & Box 02 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Box 01: Tempel Format Mentah CS */}
        <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-5 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded bg-[#EAE0D2] dark:bg-[#2E2017] border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-extrabold font-mono-tabular text-[#4A2B18] dark:text-[#E5B874]">
                01
              </span>
              <div>
                <h2 className="text-sm font-extrabold text-black dark:text-white">
                  TEMPEL FORMAT MENTAH CS
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
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-[10px] font-extrabold cursor-pointer"
              >
                <ClipboardPaste className="w-3 h-3" />
                <span>PASTE CLIPBOARD</span>
              </button>
              <span className="px-2 py-1 rounded-lg bg-[#F8F4EE] dark:bg-[#140D09] border border-[#D4C4AE] dark:border-[#3A281D] text-[10px] font-extrabold text-[#4A2B18] dark:text-[#E5B874]">
                RAW INPUT
              </span>
            </div>
          </div>

          {/* Quick Sample Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-extrabold uppercase text-[#5D4C3E] dark:text-[#B8A592]">
              CONTOH CEPAT:
            </span>
            {QUICK_EXAMPLES.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => setRawInput(ex.raw)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F8F4EE] hover:bg-[#EAE0D2] dark:bg-[#140D09] dark:hover:bg-[#2C1E16] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-[10px] font-bold cursor-pointer"
              >
                <Zap className="w-2.5 h-2.5 text-[#4A2B18] dark:text-[#E5B874]" />
                <span>{ex.label}</span>
              </button>
            ))}
          </div>

          <textarea
            rows={9}
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            onPaste={() => scheduleAutoClear()}
            placeholder={`Tempelkan format log ganti data di sini...\n\nContoh 1 (Perbaiki Spasi Nama):\n1 12-09-2026 20:38:31 keoaaecs9 change user info cawah09xxxx bank : gopay -> GOPAY,bank : Dahliasari -> Dahlia Sari,acc : Dahliasari -> Dahlia Sari,rek : 089638137501 -> 089638137501\n\nContoh 2 (Ganti No Rekening):\n8 12-09-2026 12:14:27 keoaaecs9 change user info lesi678xxxx bank : gopay -> GOPAY,rek : 08569404728 -> 085694047282`}
            className="flex-1 w-full p-3.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-mono-tabular focus:outline-none focus:ring-2 focus:ring-[#4A2B18] dark:focus:ring-[#C59656]"
          />

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={!rawInput.trim()}
              onClick={() => onCopyText(rawInput, 'Data Mentah CS')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-extrabold disabled:opacity-45 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Data Mentah</span>
            </button>
            <button
              type="button"
              onClick={() => setRawInput('')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FBE7EB] hover:bg-[#F7D0D8] dark:bg-[#3E1621] dark:hover:bg-[#521D2B] text-[#9F1239] dark:text-[#FDA4AF] border border-[#F2B8C6] dark:border-[#70263A] text-xs font-extrabold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Box 02: Ganti Data Naik Laporan */}
        <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded bg-[#EAE0D2] dark:bg-[#2E2017] border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-extrabold font-mono-tabular text-[#4A2B18] dark:text-[#E5B874]">
                02
              </span>
              <div>
                <h2 className="text-sm font-extrabold text-black dark:text-white">
                  GANTI DATA NAIK LAPORAN
                </h2>
                <p className="text-[11px] text-[#5D4C3E] dark:text-[#B8A592]">
                  {rows.length > 0
                    ? `${rows.length} Akun Siap Naik Laporan`
                    : 'Menunggu Input Mentah'}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={!compiledReport}
              onClick={handleCopyReport}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-[10px] font-extrabold disabled:opacity-45 cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>COPY &gt;&gt;</span>
            </button>
          </div>

          <textarea
            readOnly
            rows={9}
            value={compiledReport}
            placeholder="Laporan hasil ekstraksi ganti data akan tampil otomatis di sini..."
            className="flex-1 w-full p-3.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-mono-tabular focus:outline-none"
          />

          <button
            type="button"
            disabled={!compiledReport}
            onClick={handleCopyReport}
            className="w-full py-2.5 px-4 rounded-xl bg-[#4A2B18] hover:bg-[#361F11] dark:bg-[#C59656] dark:hover:bg-[#B58342] text-white dark:text-[#140D09] cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed shadow-xs text-center"
          >
            <div className="inline-flex items-center justify-center gap-2 text-xs font-extrabold">
              <Copy className="w-3.5 h-3.5" />
              <span>COPY GANTI DATA NAIK LAPORAN</span>
            </div>
            <div className="text-[10px] opacity-85">
              • Input mentah otomatis dibersihkan saat tombol ini diklik
            </div>
          </button>

          <div className="flex items-center justify-between text-xs pt-0.5">
            <span className="font-bold text-[#147D4E] dark:text-[#6EE7A8] font-mono-tabular">
              Jumlah User Ganti Data: {rows.length} Akun
            </span>
            <span className="font-bold text-[#3D322B] dark:text-[#D6C7B5]">
              Staff:{' '}
              <strong className="text-[#4A2B18] dark:text-[#E5B874]">
                {staffAlias || 'DON PABLO'}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Box 03: Tabel Detail Ganti Data User */}
      <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E5DACB] dark:border-[#332218] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded bg-[#EAE0D2] dark:bg-[#2E2017] border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-extrabold font-mono-tabular text-[#4A2B18] dark:text-[#E5B874]">
              03
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-black dark:text-white">
                TABEL DETAIL GANTI DATA USER
              </h2>
              <p className="text-[11px] text-[#5D4C3E] dark:text-[#B8A592]">
                Data rincian pergantian rekening/identitas member yang berhasil
                diekstrak:
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-[#F8F4EE] dark:bg-[#140D09] border border-[#D4C4AE] dark:border-[#3A281D] text-xs font-extrabold font-mono-tabular text-black dark:text-white">
              {rows.length} Baris Terproses
            </span>
            <button
              type="button"
              disabled={rows.length === 0}
              onClick={handleCopyTable}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-extrabold disabled:opacity-45 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Tabel</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[820px]">
            <thead>
              <tr className="bg-[#F4EDE3] dark:bg-[#291C14] border-b border-[#DFD1BE] dark:border-[#3A281D] text-[10px] font-extrabold uppercase tracking-wider text-[#3D322B] dark:text-[#D6C7B5]">
                <th className="py-2.5 px-4">NO</th>
                <th className="py-2.5 px-4">TANGGAL &amp; JAM</th>
                <th className="py-2.5 px-4">USER ID</th>
                <th className="py-2.5 px-4">STAFF</th>
                <th className="py-2.5 px-4">DATA SEBELUMNYA</th>
                <th className="py-2.5 px-4">DATA TERBARU</th>
                <th className="py-2.5 px-4">KETERANGAN LAPORAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE0D2] dark:divide-[#2E1F16] text-xs">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 px-4 text-center font-semibold text-[#5D4C3E] dark:text-[#B8A592]"
                  >
                    Belum ada data ganti data yang ditempel... Silakan tempel log
                    mentah di Box 01.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.no}
                    className="hover:bg-[#F9F5EF] dark:hover:bg-[#261A12]"
                  >
                    <td className="py-3 px-4 font-mono-tabular font-bold text-black dark:text-white">
                      {r.no}
                    </td>
                    <td className="py-3 px-4 font-mono-tabular text-black dark:text-white whitespace-nowrap">
                      {r.dateTime}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-black dark:text-white">
                      {r.userId}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#4A2B18] dark:text-[#E5B874]">
                      {r.staff}
                    </td>
                    <td className="py-3 px-4 font-mono-tabular text-[#9F1239] dark:text-[#FDA4AF]">
                      {r.beforeData}
                    </td>
                    <td className="py-3 px-4 font-mono-tabular font-bold text-[#147D4E] dark:text-[#6EE7A8]">
                      {r.afterData}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-black dark:text-white">
                      {r.keterangan}
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
