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
  formattedDate: string;
  userId: string;
  logStaff: string;
  staff: string;
  beforeData: string;
  afterData: string;
  ket: string;
  nb: string;
  reason: string;
  keterangan: string;
}

const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const KNOWN_BANKS = new Set([
  'bca',
  'bni',
  'bri',
  'bsi',
  'btn',
  'bjb',
  'btpn',
  'mandiri',
  'cimb',
  'danamon',
  'permata',
  'ocbc',
  'maybank',
  'panin',
  'mega',
  'sinarmas',
  'allobank',
  'seabank',
  'jago',
  'dana',
  'gopay',
  'ovo',
  'linkaja',
  'shopeepay',
]);

const BANK_DISPLAY_MAP: Record<string, string> = {
  bca: 'BCA',
  bni: 'BNI',
  bri: 'BRI',
  bsi: 'BSI',
  btn: 'BTN',
  bjb: 'BJB',
  btpn: 'BTPN',
  ocbc: 'OCBC',
  cimb: 'CIMB',
  ovo: 'OVO',
  gopay: 'Gopay',
  dana: 'Dana',
  mandiri: 'Mandiri',
  seabank: 'Seabank',
  jago: 'Jago',
  permata: 'Permata',
  danamon: 'Danamon',
  maybank: 'Maybank',
  panin: 'Panin',
  mega: 'Mega',
  sinarmas: 'Sinarmas',
  allobank: 'Allobank',
  linkaja: 'LinkAja',
  shopeepay: 'ShopeePay',
};

const UPPERCASE_REASON_TOKENS = new Set([
  '2D',
  '3D',
  '4D',
  'BCA',
  'BNI',
  'BRI',
  'BSI',
  'WD',
  'DP',
  'CS',
  'ID',
  'IP',
]);

function formatBankName(raw: string): string {
  const cleaned = raw.trim();
  if (!cleaned) return '-';
  const lower = cleaned.toLowerCase();
  if (BANK_DISPLAY_MAP[lower]) return BANK_DISPLAY_MAP[lower];
  return cleaned
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join(' ');
}

function capitalizeWord(word: string): string {
  const w = word.trim();
  if (!w) return '';
  return w[0].toUpperCase() + w.slice(1);
}

function formatLockedReason(rawReason: string): string {
  const cleaned = rawReason.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  const upper = cleaned.toUpperCase();
  if (upper === 'REK TIDAK VALID' || upper === 'NO REK TIDAK VALID') {
    return 'No Rek Tidak Valid';
  }
  if (upper === 'SPAM FORM KOSONG') {
    return 'Spam Form Kosong';
  }
  return cleaned
    .split(' ')
    .map((token) => {
      const tokUpper = token.toUpperCase();
      if (UPPERCASE_REASON_TOKENS.has(tokUpper) || /^\d+[A-Z]+$/i.test(token)) {
        return tokUpper;
      }
      return token[0].toUpperCase() + token.slice(1).toLowerCase();
    })
    .join(' ');
}

function formatIndonesianDate(dateTimeStr: string): string {
  const matchDmy = dateTimeStr.match(/^(\d{2})-(\d{2})-(\d{4})/);
  if (matchDmy) {
    const day = Number(matchDmy[1]);
    const monthIdx = Number(matchDmy[2]) - 1;
    const year = matchDmy[3];
    const monthName = INDONESIAN_MONTHS[monthIdx] || matchDmy[2];
    return `${day} ${monthName} ${year}`;
  }
  const matchYmd = dateTimeStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (matchYmd) {
    const year = matchYmd[1];
    const monthIdx = Number(matchYmd[2]) - 1;
    const day = Number(matchYmd[3]);
    const monthName = INDONESIAN_MONTHS[monthIdx] || matchYmd[2];
    return `${day} ${monthName} ${year}`;
  }
  return dateTimeStr;
}

const GANTI_DATA_EXAMPLES: { id: string; label: string; raw: string }[] = [
  {
    id: 'ganti-rek',
    label: 'Ganti No Rek (lesi678xxxx)',
    raw: `2\t12-09-2026 12:14:27\tkeoaacs9\tchange user info lesi678xxxx\tbank : gopay => GOPAY,rek : 08569404728 => 085694047282,bank : gopay => GOPAY,acc : Iwan Setiawan => Iwan Setiawan,rek : 08569404728 => 085694047282,color : #FFFFFF => white\tlesi678xxxx`,
  },
  {
    id: 'ganti-nama',
    label: 'Ganti Nama Rek (lesi678xxxx)',
    raw: `2\t12-09-2026 12:14:27\tkeoaacs9\tchange user info lesi678xxxx\tbank : gopay => GOPAY,rek : 085694047282 => 085694047282,bank : gopay => GOPAY,acc : Iwan S => Iwan Setiawan,rek : 085694047282 => 085694047282,color : #FFFFFF => white\tlesi678xxxx`,
  },
  {
    id: 'spasi-nama',
    label: 'Spasi Nama (cawah09xxxx)',
    raw: `1\t17-09-2026 20:38:31\tjvsaacs9\tchange user info cawah09xxxx\tbank : gopay => GOPAY,bank : Dahliasari => Dahlia Sari,bank : gopay => GOPAY,acc : Dahliasari => Dahlia Sari,rek : 089638137501 => 089638137501,color : #FFFFFF => white\tcawah09xxxx`,
  },
  {
    id: 'ganti-bank',
    label: 'Ganti Bank (Dana => BRI)',
    raw: `4\t12-09-2026 14:10:05\tkeoaacs9\tchange user info budi01xxxx\tbank : dana => BRI,bank : dana => BRI,acc : BUDI SANTOSO => BUDI SANTOSO,rek : 081298765432 => 123401005678504,color : #FFFFFF => white\tbudi01xxxx`,
  },
];

const LOCKED_EXAMPLES: { id: string; label: string; raw: string }[] = [
  {
    id: 'locked-spam-multi',
    label: 'Locked: Multi Spam Kosong (4 ID)',
    raw: `1\t17-09-2026 01:35:46\tjvsaacs9\tchange user info rivaldi01xxxx\tupdate info : -> SPAM FORM KOSONG, Status -> Locked\trivaldi01xxxx\n2\t17-09-2026 01:36:12\tjvsaacs9\tchange user info rivaldi02xxxx\tupdate info : -> SPAM FORM KOSONG, Status -> Locked\trivaldi02xxxx\n3\t17-09-2026 01:37:05\tjvsaacs9\tchange user info rivaldi03xxxx\tupdate info : -> SPAM FORM KOSONG, Status -> Locked\trivaldi03xxxx\n4\t17-09-2026 01:38:40\tjvsaacs9\tchange user info rivaldi04xxxx\tupdate info : -> SPAM FORM KOSONG, Status -> Locked\trivaldi04xxxx`,
  },
  {
    id: 'locked-rek',
    label: 'Locked: Rek Tidak Valid',
    raw: `1\t17-09-2026 02:10:15\tkeoaacs9\tchange user info budi88xxxx\tupdate info : -> REK TIDAK VALID, Status -> Locked\tbudi88xxxx`,
  },
  {
    id: 'locked-invest',
    label: 'Locked: Multi Invest 2D (4 ID)',
    raw: `2\t17-09-2026 03:15:30\tlelaacs9\tchange user info sandi01xxxx\tupdate info : -> INVEST 2D, Status -> Locked\tsandi01xxxx\n3\t17-09-2026 03:16:30\tlelaacs9\tchange user info sandi01xxxx\tupdate info : -> INVEST 2D, Status -> Locked\tsandi02xxxx\n4\t17-09-2026 03:17:30\tlelaacs9\tchange user info sandi01xxxx\tupdate info : -> INVEST 2D, Status -> Locked\tsandi03xxxx\n5\t17-09-2026 03:18:30\tlelaacs9\tchange user info sandi01xxxx\tupdate info : -> INVEST 2D, Status -> Locked\tsandi04xxxx`,
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

  const aliasTrimmed = staffAlias.trim();
  const rows: ExtractedChangeRow[] = [];

  lines.forEach((line, idx) => {
    const dtMatch = line.match(
      /(\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}:\d{2}|\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/
    );
    const dateTime = dtMatch ? dtMatch[1] : '-';
    const formattedDate = dateTime !== '-' ? formatIndonesianDate(dateTime) : '-';

    if (mode === 'locked-unlock' || mode === 'crosscheck-locked') {
      const tabCols = line.split('\t').map((c) => c.trim()).filter(Boolean);
      const lastCol = tabCols.length > 0 ? tabCols[tabCols.length - 1] : '';
      const trailingAfterStatus = line.match(
        /Status\s*(?:=>|->)\s*(?:Locked|Unlocked|Lock|Unlock)\s+([A-Za-z0-9_.-]+)\s*$/i
      )?.[1];
      const changeInfoUser = line.match(
        /change\s+user\s+info\s+([A-Za-z0-9_.-]+)/i
      )?.[1];

      const isLastColPureUserId =
        lastCol &&
        /^[A-Za-z0-9_.-]+$/.test(lastCol) &&
        !/^(Locked|Unlocked|Lock|Unlock)$/i.test(lastCol);

      const tokens = line.split(/[\s|,;\t]+/).filter(Boolean);
      const userId =
        trailingAfterStatus ||
        (isLastColPureUserId ? lastCol : '') ||
        changeInfoUser ||
        line.match(/(?:user|id)\s*[:=]\s*([A-Za-z0-9_.-]+)/i)?.[1] ||
        tokens.find((t) => /^[a-zA-Z][a-zA-Z0-9_.-]{3,}$/.test(t)) ||
        `user_${idx + 1}`;

      const staffInLogMatch = line.match(
        /\d{2}:\d{2}:\d{2}\s+([A-Za-z0-9_.-]+)/i
      );
      const logStaff = capitalizeWord(staffInLogMatch ? staffInLogMatch[1] : 'Staff');
      const staffDisplay = aliasTrimmed ? `${logStaff} / ${aliasTrimmed}` : `${logStaff} /`;

      const statusMatch = line.match(
        /Status\s*(?:=>|->)\s*(Unlocked|Unlock|Locked|Lock)/i
      );
      const isUnlock = statusMatch
        ? /unlock/i.test(statusMatch[1])
        : /\bunlocked?\b/i.test(line);

      const reasonRaw =
        line
          .match(
            /(?:update\s+info\s*:?|info\s*:)\s*(?:=>|->)?\s*([^,\n]+?)(?:,\s*Status|\s+Status|$)/i
          )?.[1]
          ?.replace(/^[:=\->\s]+/, '') || '';
      const formattedReason = formatLockedReason(reasonRaw);

      const ket =
        mode === 'crosscheck-locked'
          ? 'Crosscheck Akun Locked'
          : isUnlock
            ? 'Unlocked Member'
            : 'Locked Member';

      const nb = /\binvest\b/i.test(formattedReason)
        ? 'Untuk Member Invest Diatas Sudah Di Manualkan 2.000'
        : '';

      rows.push({
        no: rows.length + 1,
        dateTime,
        formattedDate,
        userId,
        logStaff,
        staff: staffDisplay,
        beforeData: isUnlock ? 'LOCKED' : 'AKTIF',
        afterData: isUnlock ? 'UNLOCKED' : 'LOCKED',
        ket,
        nb,
        reason: formattedReason,
        keterangan: formattedReason ? `${ket} · ${formattedReason}` : ket,
      });
      return;
    }

    // Standard "change user info <userId> <body>" parser (supports both "=>" and "->")
    const changeMatch = line.match(
      /change\s+user\s+info\s+([A-Za-z0-9_.-]+)\s+(.*)$/i
    );
    const staffInLogMatch = line.match(
      /\d{2}:\d{2}:\d{2}\s+([A-Za-z0-9_.-]+)\s+change\s+user/i
    );

    const userId = changeMatch
      ? changeMatch[1]
      : line.split(/[\s|,\t]+/)[0] || `user_${idx + 1}`;
    const rawLogStaff = staffInLogMatch ? staffInLogMatch[1] : 'Staff';
    const logStaff = capitalizeWord(rawLogStaff);
    const staffDisplay = aliasTrimmed ? `${logStaff} / ${aliasTrimmed}` : `${logStaff} /`;
    const body = changeMatch ? changeMatch[2] : line;

    interface KeyDiff {
      oldVal: string;
      newVal: string;
    }
    const bankPairs: KeyDiff[] = [];
    const accPairs: KeyDiff[] = [];
    const rekPairs: KeyDiff[] = [];

    const pairRegex = /\b(bank|acc|rek)\s*:\s*([^,\t\n]+?)\s*(?:=>|->)\s*([^,\t\n]+)/gi;
    let m: RegExpExecArray | null;
    while ((m = pairRegex.exec(body)) !== null) {
      const key = m[1].toLowerCase();
      const oldVal = m[2].trim();
      const newVal = m[3].trim();
      if (key === 'bank') bankPairs.push({ oldVal, newVal });
      else if (key === 'acc') accPairs.push({ oldVal, newVal });
      else if (key === 'rek') rekPairs.push({ oldVal, newVal });
    }

    const pickedAcc =
      accPairs.find((p) => p.oldVal.toLowerCase() !== p.newVal.toLowerCase()) ||
      accPairs[accPairs.length - 1] ||
      null;

    const pickedRek =
      rekPairs.find((p) => p.oldVal !== p.newVal) ||
      rekPairs[rekPairs.length - 1] ||
      null;

    // Filter out spurious `bank : <accName> => <accName>` duplicates that mirror `acc`
    const validBankPairs = bankPairs.filter((bp) => {
      if (
        pickedAcc &&
        bp.oldVal.toLowerCase() === pickedAcc.oldVal.toLowerCase() &&
        bp.newVal.toLowerCase() === pickedAcc.newVal.toLowerCase() &&
        !KNOWN_BANKS.has(bp.oldVal.toLowerCase()) &&
        !KNOWN_BANKS.has(bp.newVal.toLowerCase())
      ) {
        return false;
      }
      return true;
    });

    const pickedBank =
      validBankPairs.find(
        (p) =>
          p.oldVal.toLowerCase() !== p.newVal.toLowerCase() &&
          (KNOWN_BANKS.has(p.oldVal.toLowerCase()) ||
            KNOWN_BANKS.has(p.newVal.toLowerCase()))
      ) ||
      validBankPairs.find(
        (p) =>
          KNOWN_BANKS.has(p.oldVal.toLowerCase()) ||
          KNOWN_BANKS.has(p.newVal.toLowerCase())
      ) ||
      validBankPairs[0] ||
      null;

    const bankBefore = pickedBank ? formatBankName(pickedBank.oldVal) : '-';
    const bankAfter = pickedBank ? formatBankName(pickedBank.newVal) : '-';
    const accBefore = pickedAcc ? pickedAcc.oldVal.toUpperCase() : '-';
    const accAfter = pickedAcc ? pickedAcc.newVal.toUpperCase() : '-';
    const rekBefore = pickedRek ? pickedRek.oldVal : '-';
    const rekAfter = pickedRek ? pickedRek.newVal : '-';

    const bankChanged =
      pickedBank !== null &&
      bankBefore.toLowerCase() !== bankAfter.toLowerCase();
    const accChanged =
      pickedAcc !== null &&
      pickedAcc.oldVal.trim().toLowerCase() !== pickedAcc.newVal.trim().toLowerCase();
    const isSpacingOnlyAccChange =
      accChanged &&
      pickedAcc !== null &&
      pickedAcc.oldVal.replace(/\s+/g, '').toLowerCase() ===
        pickedAcc.newVal.replace(/\s+/g, '').toLowerCase();
    const rekChanged =
      pickedRek !== null &&
      pickedRek.oldVal.trim() !== pickedRek.newVal.trim();

    let ket = 'Pergantian Data Rekening';
    let nb = 'Pergantian Data Rekening';

    if (isSpacingOnlyAccChange && !bankChanged && !rekChanged) {
      ket = 'Perbaiki Spasi Pada Nama Rekening';
      nb = 'Perbaiki Spasi Pada Nama Rekening';
    } else if (bankChanged) {
      ket = 'Pergantian Data Rekening';
      nb = 'Pergantian Pada Jenis Bank';
    } else if (accChanged && !rekChanged) {
      ket = 'Pergantian Data Rekening';
      nb = 'Pergantian Pada Nama Rekening';
    } else if (rekChanged && !accChanged) {
      ket = 'Pergantian Data Rekening';
      nb = 'Pergantian Pada No Rekening';
    } else if (accChanged && rekChanged) {
      ket = 'Pergantian Data Rekening';
      nb = 'Pergantian Pada Nama & No Rekening';
    }

    const beforeData = `${bankBefore}, ${accBefore}, ${rekBefore}`;
    const afterData = `${bankAfter}, ${accAfter}, ${rekAfter}`;

    rows.push({
      no: rows.length + 1,
      dateTime,
      formattedDate,
      userId,
      logStaff,
      staff: staffDisplay,
      beforeData,
      afterData,
      ket,
      nb,
      reason: '',
      keterangan: nb,
    });
  });

  return rows;
}

export const LaporanCsPanel: React.FC<LaporanCsPanelProps> = ({
  onCopyText,
}) => {
  const [staffAlias, setStaffAlias] = useState('');
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

    if (mode === 'locked-unlock' || mode === 'crosscheck-locked') {
      interface LockedGroup {
        staff: string;
        formattedDate: string;
        ket: string;
        items: ExtractedChangeRow[];
        nbs: string[];
      }
      const groups: LockedGroup[] = [];
      const groupMap = new Map<string, LockedGroup>();

      rows.forEach((r) => {
        const key = r.ket;
        let grp = groupMap.get(key);
        if (!grp) {
          grp = {
            staff: r.staff,
            formattedDate: r.formattedDate,
            ket: r.ket,
            items: [],
            nbs: [],
          };
          groupMap.set(key, grp);
          groups.push(grp);
        }
        grp.items.push(r);
        if (r.nb && !grp.nbs.includes(r.nb)) {
          grp.nbs.push(r.nb);
        }
      });

      return groups
        .map((grp) => {
          const userList = grp.items
            .map((item) =>
              item.reason ? `* ${item.userId} - ${item.reason}` : `* ${item.userId}`
            )
            .join('\n');
          const nbBlock = grp.nbs.length > 0 ? `\n\nNB : ${grp.nbs.join(' | ')}` : '';
          return (
            `Staff : ${grp.staff}\n` +
            `Tanggal : ${grp.formattedDate}\n` +
            `Ket : ${grp.ket}\n\n` +
            `User ID :\n` +
            `${userList}${nbBlock}`
          );
        })
        .join('\n\n\n');
    }

    return rows
      .map(
        (r) =>
          `Staff : ${r.staff}\n` +
          `Tanggal : ${r.formattedDate}\n\n` +
          `User ID : ${r.userId}\n` +
          `Ket : ${r.ket}\n` +
          `Data Sebelumnya : ${r.beforeData}\n` +
          `Data Terbarunya : ${r.afterData}\n\n` +
          `NB : ${r.nb}`
      )
      .join('\n\n\n');
  }, [rows, mode]);

  const activeExamples =
    mode === 'ganti-data' ? GANTI_DATA_EXAMPLES : LOCKED_EXAMPLES;

  const handleCopyReport = () => {
    if (!compiledReport) return;
    onCopyText(
      compiledReport,
      'Laporan CS',
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
      <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 p-5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-[#4A2B18] dark:text-[#E5B874]">
            <span className="px-2 py-0.5 rounded bg-[#EAE0D2] dark:bg-[#2E2017] border border-[#CBB9A0] dark:border-[#D4A373]/75">
              TOOLS OPERASIONAL CS
            </span>
            <span>Live Extractor &amp; Formatter</span>
          </div>
          <h1 className="text-2xl font-extrabold text-black dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#4A2B18] dark:text-[#E5B874]" />
            <span>LAPORAN GANTI DATA CS</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#3D322B] dark:text-[#D6C7B5]">
            Ekstraksi log pergantian rekening/identitas dan laporan locked/unlocked member ke format baku CS.
          </p>
        </div>

        {/* Right Alias + Mode Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] border border-[#CBB9A0] dark:border-[#D4A373]/75 px-3 py-1.5 flex items-center gap-2">
            <UserCog className="w-4 h-4 text-[#4A2B18] dark:text-[#E5B874] shrink-0" />
            <div>
              <div className="text-[9px] font-extrabold uppercase tracking-wider text-[#5D4C3E] dark:text-[#B8A592]">
                NAMA / KODE ALIAS:
              </div>
              <input
                type="text"
                value={staffAlias}
                onChange={(e) => setStaffAlias(e.target.value)}
                placeholder="DON PABLO"
                className="w-32 bg-transparent text-xs font-extrabold text-black dark:text-white placeholder-[#8D7B6A] focus:outline-none border-b border-[#CBB9A0] dark:border-[#D4A373]/75"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#EFE7DC] dark:bg-[#140D09] border border-[#D4C4AE] dark:border-[#C59656]/60">
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
              <span>LOCKED / UNLOCKED</span>
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
      <div className="rounded-xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
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
              : 'bg-[#F8F4EE] text-black border-[#CBB9A0] dark:bg-[#140D09] dark:text-white dark:border-[#D4A373]/75'
          }`}
        >
          Auto-Clear: {autoClear ? 'AKTIF' : 'NONAKTIF'}
        </button>
      </div>

      {/* Middle 2-Column Workspace: Box 01 & Box 02 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Box 01: Tempel Format Mentah CS */}
        <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 p-5 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded bg-[#EAE0D2] dark:bg-[#2E2017] border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-extrabold font-mono-tabular text-[#4A2B18] dark:text-[#E5B874]">
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
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-[10px] font-extrabold cursor-pointer"
              >
                <ClipboardPaste className="w-3 h-3" />
                <span>PASTE CLIPBOARD</span>
              </button>
              <span className="px-2 py-1 rounded-lg bg-[#F8F4EE] dark:bg-[#140D09] border border-[#D4C4AE] dark:border-[#C59656]/60 text-[10px] font-extrabold text-[#4A2B18] dark:text-[#E5B874]">
                RAW INPUT
              </span>
            </div>
          </div>

          {/* Quick Sample Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-extrabold uppercase text-[#5D4C3E] dark:text-[#B8A592]">
              CONTOH CEPAT:
            </span>
            {activeExamples.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => setRawInput(ex.raw)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F8F4EE] hover:bg-[#EAE0D2] dark:bg-[#140D09] dark:hover:bg-[#2C1E16] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-[10px] font-bold cursor-pointer"
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
            placeholder={
              mode === 'ganti-data'
                ? `Tempelkan format log ganti data di sini...\n\nContoh:\n2\t12-09-2026 12:14:27\tkeoaacs9\tchange user info lesi678xxxx\tbank : gopay => GOPAY,rek : 08569404728 => 085694047282,...`
                : `Tempelkan format log locked / unlocked di sini...\n\nContoh:\n3\t17-09-2026 01:35:46\tjvsaacs9\tchange user info rivaldi123xxxx\tupdate info : -> SPAM FORM KOSONG, Status -> Locked\trivaldi123xxxx`
            }
            className="flex-1 w-full p-3.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-mono-tabular focus:outline-none focus:ring-2 focus:ring-[#4A2B18] dark:focus:ring-[#C59656]"
          />

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={!rawInput.trim()}
              onClick={() => onCopyText(rawInput, 'Data Mentah CS')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-extrabold disabled:opacity-45 cursor-pointer"
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
        <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded bg-[#EAE0D2] dark:bg-[#2E2017] border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-extrabold font-mono-tabular text-[#4A2B18] dark:text-[#E5B874]">
                02
              </span>
              <div>
                <h2 className="text-sm font-extrabold text-black dark:text-white">
                  {mode === 'ganti-data'
                    ? 'GANTI DATA NAIK LAPORAN'
                    : mode === 'locked-unlock'
                      ? 'LOCKED / UNLOCKED NAIK LAPORAN'
                      : 'CROSSCHECK LOCKED NAIK LAPORAN'}
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
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-[10px] font-extrabold disabled:opacity-45 cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>COPY &gt;&gt;</span>
            </button>
          </div>

          <textarea
            readOnly
            rows={9}
            value={compiledReport}
            placeholder="Laporan hasil ekstraksi akan tampil otomatis di sini..."
            className="flex-1 w-full p-3.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-mono-tabular focus:outline-none"
          />

          <button
            type="button"
            disabled={!compiledReport}
            onClick={handleCopyReport}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#4A2B18] hover:bg-[#361F11] dark:bg-[#C59656] dark:hover:bg-[#B58342] text-white dark:text-[#140D09] text-xs font-extrabold cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed shadow-xs"
          >
            <Copy className="w-3.5 h-3.5 shrink-0" />
            <span>
              {mode === 'ganti-data'
                ? 'COPY GANTI DATA NAIK LAPORAN'
                : 'COPY LAPORAN LOCKED / UNLOCKED'}
            </span>
          </button>

          <div className="flex items-center justify-between text-xs pt-0.5">
            <span className="font-bold text-[#147D4E] dark:text-[#6EE7A8] font-mono-tabular">
              Jumlah User Terproses: {rows.length} Akun
            </span>
            <span className="font-bold text-[#3D322B] dark:text-[#D6C7B5]">
              Alias:{' '}
              <strong className="text-[#4A2B18] dark:text-[#E5B874]">
                {staffAlias.trim() || 'DON PABLO'}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Box 03: Tabel Detail Ganti Data User */}
      <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E5DACB] dark:border-[#C59656]/35 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded bg-[#EAE0D2] dark:bg-[#2E2017] border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-extrabold font-mono-tabular text-[#4A2B18] dark:text-[#E5B874]">
              03
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-black dark:text-white">
                TABEL DETAIL LAPORAN USER
              </h2>
              <p className="text-[11px] text-[#5D4C3E] dark:text-[#B8A592]">
                Data rincian pergantian / status akun member yang berhasil diekstrak:
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-[#F8F4EE] dark:bg-[#140D09] border border-[#D4C4AE] dark:border-[#C59656]/60 text-xs font-extrabold font-mono-tabular text-black dark:text-white">
              {rows.length} Baris Terproses
            </span>
            <button
              type="button"
              disabled={rows.length === 0}
              onClick={handleCopyTable}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-extrabold disabled:opacity-45 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Tabel</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[820px]">
            <thead>
              <tr className="bg-[#F4EDE3] dark:bg-[#291C14] border-b border-[#DFD1BE] dark:border-[#C59656]/60 text-[10px] font-extrabold uppercase tracking-wider text-[#3D322B] dark:text-[#D6C7B5]">
                <th className="py-2.5 px-4">NO</th>
                <th className="py-2.5 px-4">TANGGAL &amp; JAM</th>
                <th className="py-2.5 px-4">USER ID</th>
                <th className="py-2.5 px-4">STAFF</th>
                <th className="py-2.5 px-4">DATA SEBELUMNYA</th>
                <th className="py-2.5 px-4">DATA TERBARU</th>
                <th className="py-2.5 px-4">KETERANGAN LAPORAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE0D2] dark:divide-[#C59656]/30 text-xs">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 px-4 text-center font-semibold text-[#5D4C3E] dark:text-[#B8A592]"
                  >
                    Belum ada data yang ditempel... Silakan tempel log mentah di Box 01.
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
