import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Copy,
  Eraser,
  Gift,
  Pencil,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

interface BagiBonusPanelProps {
  onCopyText: (text: string, label: string, customToast?: string) => void;
}

type BonusTab = 'scatter-harian' | 'parlay';

interface ParsedBonusClaim {
  userId: string;
  accountName: string;
  accountNumber: string;
  provider: string;
  game: string;
  ticketCode: string;
  period: string;
  totalWin: number;
  betValue: number;
  multiplier: number;
  isBuyFeature: boolean;
  isSuperScatter: boolean;
  debitCount: number;
  ticketCount: number;
  scatterEligible: boolean;
  scatterBonus: number;
  scatterReason: string;
  harianEligible: boolean;
  harianBonus: number;
  harianReason: string;
}

const PG_BUY_FEATURE_TABLE = [
  { bet: 400, buyCost: 30000, minWin: 150000, bonus: 15000 },
  { bet: 800, buyCost: 60000, minWin: 300000, bonus: 30000 },
  { bet: 1200, buyCost: 90000, minWin: 450000, bonus: 50000 },
  { bet: 2000, buyCost: 150000, minWin: 750000, bonus: 100000 },
  { bet: 4000, buyCost: 300000, minWin: 1500000, bonus: 200000 },
  { bet: 10000, buyCost: 750000, minWin: 3750000, bonus: 500000 },
];

const BONUS_EXAMPLES: {
  id: string;
  label: string;
  sample: string;
}[] = [
  {
    id: 'beli-fitur-150k',
    label: 'Contoh: Beli Fitur PG 150k (medanxxxx)',
    sample: `User: medanxxxx | Rek: BAMBANG SUTEDJO (5220391823)\n2026-11-13 14:22:10 | PGSOFT | Mahjong Ways 2 | Ticket: PG-98412201\nDEBIT (Buy Spin): 150,000\nCREDIT (Win): 920,000`,
  },
  {
    id: 'buy-spin-pg',
    label: 'Contoh: Buy Spin PG (jayaxxxx - Bet 1.2k)',
    sample: `User: jayaxxxx | Rek: AHMAD FAUZI (1370019284719)\n2026-11-13 14:25:05 | PGSOFT | Mahjong Ways | Ticket: PG-77210498\nDEBIT: 1,200\nCREDIT: 480,000`,
  },
  {
    id: 'scatter-sah',
    label: 'Contoh: Scatter Sah (rubenxxxx)',
    sample: `User: rubenxxxx | Rek: RUBEN KUSUMA (8220192841)\n2026-11-13 14:31:19 | PGSOFT | Mahjong Ways 2 | Ticket: MW2-55190231\nDEBIT: 2,000\nCREDIT: 350,000`,
  },
  {
    id: 'keduanya-sah',
    label: 'Contoh: Keduanya Sah (isnaxxxx)',
    sample: `User: isnaxxxx | Rek: ISNAENI (034101002938501)\n2026-11-13 14:40:12 | PGSOFT | Mahjong Ways 2 | Ticket: MW2-88123904\nDEBIT: 2,000\nCREDIT: 850,000`,
  },
  {
    id: 'harian-sah',
    label: 'Contoh: Harian Sah (nirwanaxxxx)',
    sample: `User: nirwanaxxxx | Rek: NIRWANA (081392817401)\n2026-11-13 14:45:00 | PRAGMATIC PLAY | Gates of Olympus | Round: PP-44019283\nDEBIT: 2,000\nCREDIT: 720,000`,
  },
  {
    id: 'ditolak-2-tiket',
    label: 'Contoh: Ditolak (2 Tiket - 2409xxxx)',
    sample: `User: 2409xxxx | Rek: DEDI SURYADI (012901928471502)\n2026-11-13 14:50:11 | PGSOFT | Mahjong Ways | Ticket: MW-112233\n2026-11-13 14:51:04 | PGSOFT | Mahjong Ways | Ticket: MW-112234\nDEBIT: 2,000\nCREDIT: 400,000`,
  },
  {
    id: 'mahjong-ways',
    label: 'Contoh: Mahjong Ways (ceyaxxxx)',
    sample: `User: ceyaxxxx | Rek: CEYA PUTRI (1189029384)\n2026-11-13 15:02:33 | PGSOFT | Mahjong Ways | Ticket: MW1-9910283\nDEBIT: 1,600\nCREDIT: 240,000`,
  },
  {
    id: 'mighty-mania',
    label: 'Contoh: Mighty Mania (lepenxxxx)',
    sample: `User: lepenxxxx | Rek: HENDRA WIJAYA (0844192837)\n2026-11-13 15:10:44 | IDNSLOT | Mighty Mania | Round: IDN-8871203\nDEBIT: 1,000\nCREDIT: 420,000`,
  },
  {
    id: 'ditolak-debit-2x',
    label: 'Contoh: Ditolak (Debit 2x)',
    sample: `User: tolakxxxx | Rek: BUDI SANTOSO (5501928374)\n2026-11-13 15:15:20 | PRAGMATIC PLAY | Starlight Princess | Round: PP-990123\nDEBIT: 1,000\nDEBIT: 1,000\nCREDIT: 350,000`,
  },
];

function parseNumericToken(s: string): number {
  const digits = s.replace(/[^\d]/g, '');
  return Number(digits) || 0;
}

function parseBonusLog(
  raw: string,
  manualName: string,
  manualAcc: string,
  overrideBet: number | null
): ParsedBonusClaim | null {
  const text = raw.trim();
  if (!text) return null;

  const userMatch = text.match(/(?:User(?:\s*ID)?|Member)\s*[:=]\s*([A-Za-z0-9_.-]+)/i);
  const userId = userMatch ? userMatch[1] : 'member_unknown';

  const rekMatch = text.match(/Rek\s*[:=]\s*([A-Za-z\s.'-]+?)\s*\((\d{6,})\)/i);
  const autoName = rekMatch ? rekMatch[1].trim().toUpperCase() : '-';
  const autoAcc = rekMatch ? rekMatch[2].trim() : '-';

  const periodMatch = text.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);
  const period = periodMatch ? periodMatch[1] : '-';

  let provider = '-';
  if (/pg\s*soft|pgsoft|mahjong/i.test(text)) provider = 'PGSOFT';
  else if (/pragmatic/i.test(text)) provider = 'PRAGMATIC PLAY';
  else if (/idnslot/i.test(text)) provider = 'IDNSLOT';
  else if (/slot\s*mania/i.test(text)) provider = 'SLOT MANIA';

  let game = '-';
  if (/mahjong\s*ways\s*2/i.test(text)) game = 'Mahjong Ways 2';
  else if (/mahjong\s*ways/i.test(text)) game = 'Mahjong Ways';
  else if (/gates\s*of\s*olympus/i.test(text)) game = 'Gates of Olympus';
  else if (/mighty\s*mania/i.test(text)) game = 'Mighty Mania';
  else if (/starlight\s*princess/i.test(text)) game = 'Starlight Princess';
  else {
    const gMatch = text.match(/\|\s*(?:PGSOFT|PRAGMATIC PLAY|IDNSLOT|SLOT MANIA)\s*\|\s*([^|\n]+)/i);
    if (gMatch) game = gMatch[1].trim();
  }

  const ticketMatches = text.match(/(?:Ticket|Round(?:\s*ID)?)\s*[:=]\s*([A-Za-z0-9_-]+)/gi) || [];
  const firstTicket = text.match(/(?:Ticket|Round(?:\s*ID)?)\s*[:=]\s*([A-Za-z0-9_-]+)/i);
  const ticketCode = firstTicket ? firstTicket[1] : '-';
  const ticketCount = Math.max(1, ticketMatches.length);

  const debitLines = text.match(/DEBIT[^\n]*/gi) || [];
  const creditLines = text.match(/CREDIT[^\n]*/gi) || [];

  let parsedBet = 0;
  debitLines.forEach((line) => {
    const numMatch = line.match(/[:=]\s*([\d.,]+)/);
    if (numMatch) parsedBet += parseNumericToken(numMatch[1]);
  });

  let parsedWin = 0;
  creditLines.forEach((line) => {
    const numMatch = line.match(/[:=]\s*([\d.,]+)/);
    if (numMatch) parsedWin += parseNumericToken(numMatch[1]);
  });

  const betValue = overrideBet !== null ? overrideBet : parsedBet;
  const totalWin = parsedWin;
  const multiplier = betValue > 0 ? totalWin / betValue : 0;
  const isBuyFeature = /buy\s*(?:spin|fitur)|beli\s*fitur|super\s*buy/i.test(text);
  const isSuperScatter = /super\s*scatter/i.test(text);
  const debitCount = debitLines.length;

  const isMahjong = /mahjong\s*ways/i.test(game);

  // Scatter rules: Mahjong Ways 1 & 2, Bet Min 1,200, Win Min 100,000, single ticket & single debit
  let scatterEligible = false;
  let scatterBonus = 0;
  let scatterReason = 'Data kosong atau belum ditempel transaksi DEBIT (nilai taruhan).';

  if (betValue <= 0) {
    scatterReason = 'Data kosong atau belum ditempel transaksi DEBIT (nilai taruhan).';
  } else if (ticketCount > 1) {
    scatterReason = `Ditolak: Terdeteksi ${ticketCount} tiket dalam satu klaim (maksimal 1 tiket).`;
  } else if (debitCount > 1) {
    scatterReason = `Ditolak: Terdeteksi DEBIT ${debitCount}x (hanya boleh 1 putaran).`;
  } else if (!isMahjong) {
    scatterReason = 'Tidak memenuhi syarat Scatter: Hanya berlaku untuk Mahjong Ways 1 & 2.';
  } else if (betValue < 1200) {
    scatterReason = `Ditolak: Nilai taruhan (${formatRupiah(betValue)}) di bawah minimal Rp 1.200.`;
  } else if (totalWin < 100000) {
    scatterReason = `Ditolak: Total kemenangan (${formatRupiah(totalWin)}) di bawah minimal Rp 100.000.`;
  } else {
    scatterEligible = true;
    scatterBonus = isBuyFeature ? Math.round(totalWin * 0.1) : Math.round(totalWin * 0.25);
    scatterReason = `SAH! Bonus Scatter ${isBuyFeature ? '10% (Beli Fitur)' : '25% (Spin Normal)'}: ${formatRupiah(scatterBonus)}`;
  }

  // Harian slot rules: Bet Min 1,000, Win Up >= x300 (or >= x2000 for Super Scatter), single ticket & single debit
  let harianEligible = false;
  let harianBonus = 0;
  let harianReason = 'Data kosong atau belum ditempel transaksi DEBIT (nilai taruhan).';
  const requiredX = isSuperScatter ? 2000 : 300;

  if (betValue <= 0) {
    harianReason = 'Data kosong atau belum ditempel transaksi DEBIT (nilai taruhan).';
  } else if (ticketCount > 1) {
    harianReason = `Ditolak: Terdeteksi ${ticketCount} tiket dalam satu pengajuan.`;
  } else if (debitCount > 1) {
    harianReason = `Ditolak: Terdeteksi transaksi DEBIT ganda (${debitCount}x).`;
  } else if (betValue < 1000) {
    harianReason = `Ditolak: Taruhan di bawah minimal Rp 1.000.`;
  } else if (multiplier < requiredX) {
    harianReason = `Belum memenuhi Win-Up Harian (x${multiplier.toFixed(1)} < minimal x${requiredX}).`;
  } else {
    harianEligible = true;
    harianBonus = Math.min(2000000, Math.round(totalWin * 0.2));
    harianReason = `SAH! Win-Up x${multiplier.toFixed(1)} — Bonus Harian Slot: ${formatRupiah(harianBonus)}`;
  }

  return {
    userId,
    accountName: manualName.trim() ? manualName.trim().toUpperCase() : autoName,
    accountNumber: manualAcc.trim() || autoAcc,
    provider,
    game,
    ticketCode,
    period,
    totalWin,
    betValue,
    multiplier,
    isBuyFeature,
    isSuperScatter,
    debitCount,
    ticketCount,
    scatterEligible,
    scatterBonus,
    scatterReason,
    harianEligible,
    harianBonus,
    harianReason,
  };
}

export const BagiBonusPanel: React.FC<BagiBonusPanelProps> = ({ onCopyText }) => {
  const [activeTab, setActiveTab] = useState<BonusTab>('scatter-harian');
  const [rawInput, setRawInput] = useState('');
  const [processedRaw, setProcessedRaw] = useState('');
  const [autoClearSec, setAutoClearSec] = useState<3 | 5 | 10>(5);
  const [showPgTable, setShowPgTable] = useState(false);

  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualAcc, setManualAcc] = useState('');
  const [editingBet, setEditingBet] = useState(false);
  const [betOverride, setBetOverride] = useState<number | null>(null);

  // Parlay Bonus Tab state
  const [parlayUserId, setParlayUserId] = useState('koko_parlay88');
  const [parlayTeams, setParlayTeams] = useState(5);
  const [parlayStake, setParlayStake] = useState(50000);
  const [parlayResult, setParlayResult] = useState<'MENANG_FULL' | 'KALAH_1_TIM'>('MENANG_FULL');

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const scheduleAutoClear = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setRawInput('');
    }, autoClearSec * 1000);
  };

  const handleProcess = () => {
    setProcessedRaw(rawInput);
    if (rawInput.trim()) scheduleAutoClear();
  };

  const handleLoadExample = (sample: string) => {
    setBetOverride(null);
    setEditingBet(false);
    setRawInput(sample);
    setProcessedRaw(sample);
  };

  const handleClear = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setRawInput('');
    setProcessedRaw('');
    setBetOverride(null);
    setEditingBet(false);
  };

  const parsed = useMemo(
    () =>
      parseBonusLog(
        processedRaw || rawInput,
        manualMode ? manualName : '',
        manualMode ? manualAcc : '',
        betOverride
      ),
    [processedRaw, rawInput, manualMode, manualName, manualAcc, betOverride]
  );

  const parlayBonusEstimate = useMemo(() => {
    if (parlayStake < 25000) return 0;
    if (parlayResult === 'KALAH_1_TIM') return Math.min(250000, parlayStake);
    if (parlayTeams >= 8) return Math.min(1500000, parlayStake * 3);
    if (parlayTeams >= 5) return Math.min(500000, parlayStake);
    return 0;
  }, [parlayTeams, parlayStake, parlayResult]);

  return (
    <div className="space-y-5">
      {/* Header Card */}
      <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-[#4A2B18] dark:text-[#E5B874]">
            <span className="px-2 py-0.5 rounded bg-[#EAE0D2] dark:bg-[#2E2017] border border-[#CBB9A0] dark:border-[#4D3627]">
              MODUL OPERASIONAL CS
            </span>
            <span>Sistem Pembagian Bonus 711</span>
          </div>
          <h1 className="text-2xl font-extrabold text-black dark:text-white flex items-center gap-2">
            <Gift className="w-6 h-6 text-[#4A2B18] dark:text-[#E5B874]" />
            <span>BAGI BONUS — SCATTER &amp; HARIAN SLOT</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#3D322B] dark:text-[#D6C7B5]">
            Pengecekan dan validasi otomatis tiket klaim scatter Mahjong Ways, PG
            Soft, dan event turnamen slot harian.
          </p>
        </div>

        {/* Right Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#EFE7DC] dark:bg-[#140D09] border border-[#D4C4AE] dark:border-[#3A281D] shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('scatter-harian')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-extrabold cursor-pointer whitespace-nowrap ${
              activeTab === 'scatter-harian'
                ? 'bg-[#4A2B18] text-white dark:bg-[#C59656] dark:text-[#140D09]'
                : 'text-black dark:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>SCATTER &amp; HARIAN SLOT</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('parlay')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-extrabold cursor-pointer whitespace-nowrap ${
              activeTab === 'parlay'
                ? 'bg-[#4A2B18] text-white dark:bg-[#C59656] dark:text-[#140D09]'
                : 'text-black dark:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>BONUS PARLAY</span>
          </button>
        </div>
      </div>

      {activeTab === 'parlay' ? (
        <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-black dark:text-white">
                VALIDATOR EVENT BONUS MIX PARLAY
              </h2>
              <p className="text-xs text-[#3D322B] dark:text-[#D6C7B5]">
                Hitung bonus ekstra kemenangan parlay 5-8 tim atau cashback kalah 1 tim.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onCopyText(
                  `BONUS PARLAY · ${parlayUserId}\nTim: ${parlayTeams} Partai | Stake: ${formatRupiah(parlayStake)}\nHasil: ${parlayResult}\nBonus: ${formatRupiah(parlayBonusEstimate)}`,
                  'Hasil Bonus Parlay'
                )
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4A2B18] dark:bg-[#C59656] text-white dark:text-[#140D09] text-xs font-extrabold cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Hasil Parlay</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
                User ID Member
              </label>
              <input
                type="text"
                value={parlayUserId}
                onChange={(e) => setParlayUserId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
                Jumlah Tim / Partai
              </label>
              <input
                type="number"
                min={3}
                max={15}
                value={parlayTeams}
                onChange={(e) => setParlayTeams(Number(e.target.value) || 3)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-mono-tabular font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
                Modal Taruhan (Rp)
              </label>
              <input
                type="number"
                value={parlayStake}
                onChange={(e) => setParlayStake(Number(e.target.value) || 0)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-mono-tabular font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
                Status Tiket
              </label>
              <select
                value={parlayResult}
                onChange={(e) =>
                  setParlayResult(e.target.value as 'MENANG_FULL' | 'KALAH_1_TIM')
                }
                className="w-full px-3 py-2.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-extrabold"
              >
                <option value="MENANG_FULL">MENANG FULL (JP)</option>
                <option value="KALAH_1_TIM">KALAH 1 TIM (REFUND)</option>
              </select>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] border border-[#D4C4AE] dark:border-[#3A281D] flex items-center justify-between">
            <span className="text-xs font-extrabold text-black dark:text-white">
              ESTIMASI BONUS PARLAY DIBERIKAN
            </span>
            <span className="text-xl font-extrabold font-mono-tabular text-[#147D4E] dark:text-[#6EE7A8]">
              {formatRupiah(parlayBonusEstimate)}
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* Validator Header + Quick Example Chips */}
          <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-5 space-y-3">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold">
                  <span className="px-2 py-0.5 rounded bg-[#EAE0D2] dark:bg-[#2E2017] text-[#4A2B18] dark:text-[#E5B874]">
                    VALIDATOR KELAYAKAN BONUS
                  </span>
                  <span className="text-[#5D4C3E] dark:text-[#D6C7B5]">
                    Auto Audit, Anti-Double &amp; Buy Spin Support
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-black dark:text-white">
                  BONUS HARIAN SLOT &amp; MAHJONG WAYS
                </h2>
                <p className="text-xs text-[#3D322B] dark:text-[#D6C7B5]">
                  Audit otomatis kelayakan klaim bonus member berdasarkan nilai
                  taruhan, total kemenangan, fitur buy spin, dan batas win-up.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 xl:max-w-[68%]">
                <button
                  type="button"
                  onClick={() => handleLoadExample(BONUS_EXAMPLES[0].sample)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-[11px] font-bold cursor-pointer"
                >
                  {BONUS_EXAMPLES[0].label}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPgTable((p) => !p)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#4A2B18] text-white dark:bg-[#C59656] dark:text-[#140D09] text-[11px] font-extrabold cursor-pointer"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Tabel 23 Beli Fitur PG</span>
                </button>
                {BONUS_EXAMPLES.slice(1).map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => handleLoadExample(ex.sample)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#F8F4EE] hover:bg-[#EAE0D2] dark:bg-[#140D09] dark:hover:bg-[#2C1E16] text-black dark:text-white border border-[#D4C4AE] dark:border-[#3A281D] text-[11px] font-bold cursor-pointer"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            {showPgTable && (
              <div className="pt-3 border-t border-[#E5DACB] dark:border-[#332218]">
                <div className="text-[11px] font-extrabold uppercase text-[#4A2B18] dark:text-[#E5B874] mb-2">
                  REFERENSI TABEL BELI FITUR PG SOFT (MAHJONG WAYS)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F4EDE3] dark:bg-[#291C14] text-[10px] font-extrabold uppercase text-[#3D322B] dark:text-[#D6C7B5]">
                        <th className="py-2 px-3">BET DASAR</th>
                        <th className="py-2 px-3">HARGA BUY FITUR</th>
                        <th className="py-2 px-3">MIN MENANG</th>
                        <th className="py-2 px-3 text-right">BONUS SCATTER</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE0D2] dark:divide-[#2E1F16] font-mono-tabular">
                      {PG_BUY_FEATURE_TABLE.map((row) => (
                        <tr key={row.bet}>
                          <td className="py-1.5 px-3 font-bold text-black dark:text-white">
                            {formatRupiah(row.bet)}
                          </td>
                          <td className="py-1.5 px-3 text-black dark:text-white">
                            {formatRupiah(row.buyCost)}
                          </td>
                          <td className="py-1.5 px-3 text-black dark:text-white">
                            {formatRupiah(row.minWin)}
                          </td>
                          <td className="py-1.5 px-3 text-right font-extrabold text-[#147D4E] dark:text-[#6EE7A8]">
                            {formatRupiah(row.bonus)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Middle Two-Column Split: Paste Log + Hasil Pembacaan */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Left Box: Paste Log */}
            <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-5 flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-black dark:text-white">
                    PASTE DATA DI BAWAH INI
                  </span>
                  <button
                    type="button"
                    disabled={!parsed}
                    onClick={() =>
                      parsed &&
                      onCopyText(
                        `BONUS SCATTER | ${parsed.userId} | ${parsed.game} | Menang ${formatRupiah(parsed.totalWin)} | Bonus ${formatRupiah(parsed.scatterBonus)}`,
                        'Bonus Scatter'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-[10px] font-extrabold disabled:opacity-45 cursor-pointer"
                  >
                    COPY BONUS SCATTER
                  </button>
                  <button
                    type="button"
                    disabled={!parsed}
                    onClick={() =>
                      parsed &&
                      onCopyText(
                        `BONUS HARIAN SLOT | ${parsed.userId} | ${parsed.provider} - ${parsed.game} | Win x${parsed.multiplier.toFixed(1)} | Bonus ${formatRupiah(parsed.harianBonus)}`,
                        'Bonus Harian Slot'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-[10px] font-extrabold disabled:opacity-45 cursor-pointer"
                  >
                    COPY HARIAN SLOT
                  </button>
                </div>

                {/* Auto Clear Selector */}
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F8F4EE] dark:bg-[#140D09] border border-[#CBB9A0] dark:border-[#4D3627] text-[10px] font-extrabold text-black dark:text-white">
                  <span>AUTO CLEAR: {autoClearSec}s</span>
                  {([3, 5, 10] as const).map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setAutoClearSec(sec)}
                      className={`px-1.5 py-0.5 rounded cursor-pointer ${
                        autoClearSec === sec
                          ? 'bg-[#4A2B18] text-white dark:bg-[#C59656] dark:text-[#140D09]'
                          : 'text-[#5D4C3E] dark:text-[#B8A592]'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={7}
                value={rawInput}
                onChange={(e) => {
                  setRawInput(e.target.value);
                  setProcessedRaw(e.target.value);
                }}
                placeholder={`Tempel data log statement transaksi di sini... (Otomatis dihapus dalam ${autoClearSec} detik setelah diproses untuk mencegah klaim dobel)`}
                className="flex-1 w-full p-3.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-mono-tabular focus:outline-none focus:ring-2 focus:ring-[#4A2B18] dark:focus:ring-[#C59656]"
              />

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleProcess}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#4A2B18] hover:bg-[#361F11] dark:bg-[#C59656] dark:hover:bg-[#B58342] text-white dark:text-[#140D09] text-xs font-extrabold cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>PROSES SESUAI RUMUS</span>
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-[#F4EDE3] dark:bg-[#211711] dark:hover:bg-[#2C1E16] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-extrabold cursor-pointer"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>BERSIHKAN</span>
                </button>
              </div>
            </div>

            {/* Right Box: Hasil Pembacaan */}
            <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wide text-black dark:text-white">
                  HASIL PEMBACAAN
                </span>
                <span className="px-2 py-0.5 rounded bg-[#EAE0D2] dark:bg-[#2E2017] text-[#4A2B18] dark:text-[#E5B874] text-[10px] font-extrabold">
                  FORMULA MODE
                </span>
              </div>

              <div className="rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] border border-[#DFD1BE] dark:border-[#3A281D] p-3">
                <div className="text-[10px] font-extrabold uppercase text-[#9A4212] dark:text-[#E5B874]">
                  PERIODE PATOKAN (Q2)
                </div>
                <div className="text-xs font-mono-tabular font-bold text-black dark:text-white mt-0.5">
                  {parsed ? parsed.period : '-'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] border border-[#DFD1BE] dark:border-[#3A281D] p-3">
                  <div className="text-[10px] font-extrabold uppercase text-[#3D322B] dark:text-[#D6C7B5]">
                    TOTAL KEMENANGAN
                  </div>
                  <div className="text-base font-extrabold font-mono-tabular text-[#147D4E] dark:text-[#6EE7A8] mt-1">
                    {formatRupiah(parsed ? parsed.totalWin : 0)}
                  </div>
                </div>

                <div className="rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] border border-[#DFD1BE] dark:border-[#3A281D] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-[#3D322B] dark:text-[#D6C7B5]">
                      NILAI TARUHAN
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingBet((p) => !p)}
                      className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-[#4A2B18] dark:text-[#E5B874] hover:underline cursor-pointer"
                    >
                      <Pencil className="w-2.5 h-2.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                  {editingBet ? (
                    <input
                      type="number"
                      value={betOverride ?? parsed?.betValue ?? 0}
                      onChange={(e) => setBetOverride(Number(e.target.value) || 0)}
                      className="mt-1 w-full px-2 py-1 rounded bg-white dark:bg-[#1F150F] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-mono-tabular font-bold"
                    />
                  ) : (
                    <div className="text-base font-extrabold font-mono-tabular text-black dark:text-white mt-1">
                      {formatRupiah(parsed ? parsed.betValue : 0)}
                    </div>
                  )}
                </div>

                <div className="rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] border border-[#DFD1BE] dark:border-[#3A281D] p-3">
                  <div className="text-[10px] font-extrabold uppercase text-[#3D322B] dark:text-[#D6C7B5]">
                    WIN MULTIPLIER (WIN UP)
                  </div>
                  <div className="text-base font-extrabold font-mono-tabular text-[#4A2B18] dark:text-[#E5B874] mt-1">
                    x{parsed ? parsed.multiplier.toFixed(1) : '0.0'}
                  </div>
                </div>

                <div className="rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] border border-[#DFD1BE] dark:border-[#3A281D] p-3">
                  <div className="text-[10px] font-extrabold uppercase text-[#3D322B] dark:text-[#D6C7B5]">
                    GAME &amp; PROVIDER
                  </div>
                  <div className="text-xs font-extrabold text-black dark:text-white mt-1 truncate">
                    {parsed ? `${parsed.provider} · ${parsed.game}` : '-'}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase">
                  <span className="text-[#3D322B] dark:text-[#D6C7B5]">
                    DATA REKENING (OPSIONAL):
                  </span>
                  <button
                    type="button"
                    onClick={() => setManualMode((p) => !p)}
                    className="text-[#4A2B18] dark:text-[#E5B874] hover:underline cursor-pointer"
                  >
                    {manualMode ? 'MODE MANUAL AKTIF' : 'OTOMATIS / MANUAL'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={manualMode ? manualName : parsed?.accountName || ''}
                    disabled={!manualMode}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Nama Rekening (-)"
                    className="px-3 py-2 rounded-lg bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-semibold disabled:opacity-80"
                  />
                  <input
                    type="text"
                    value={manualMode ? manualAcc : parsed?.accountNumber || ''}
                    disabled={!manualMode}
                    onChange={(e) => setManualAcc(e.target.value)}
                    placeholder="No Rekening (-)"
                    className="px-3 py-2 rounded-lg bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-mono-tabular font-semibold disabled:opacity-80"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Table 1: BONUS SCATTER MAHJONG WAYS 1 & 2 */}
          <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E5DACB] dark:border-[#332218] flex items-center justify-between bg-[#F4EDE3] dark:bg-[#261A12]">
              <span className="text-xs font-extrabold uppercase tracking-wider text-black dark:text-white">
                ● BONUS SCATTER MAHJONG WAYS 1 &amp; 2
              </span>
              <button
                type="button"
                disabled={!parsed}
                onClick={() =>
                  parsed &&
                  onCopyText(
                    `BONUS SCATTER MAHJONG WAYS\nUser ID: ${parsed.userId}\nRek: ${parsed.accountName} (${parsed.accountNumber})\nGame: ${parsed.game} | Ticket: ${parsed.ticketCode}\nMenang: ${formatRupiah(parsed.totalWin)} | Taruhan: ${formatRupiah(parsed.betValue)}\nStatus: ${parsed.scatterReason}`,
                    'Bonus Scatter'
                  )
                }
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#4A2B18] dark:bg-[#C59656] text-white dark:text-[#140D09] text-[11px] font-extrabold disabled:opacity-40 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>COPY &gt;&gt;</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="border-b border-[#DFD1BE] dark:border-[#3A281D] text-[10px] font-extrabold uppercase tracking-wider text-[#3D322B] dark:text-[#D6C7B5]">
                    <th className="py-2.5 px-4">USER ID</th>
                    <th className="py-2.5 px-4">NAMA REKENING</th>
                    <th className="py-2.5 px-4">NOMOR REKENING</th>
                    <th className="py-2.5 px-4">PERMAINAN</th>
                    <th className="py-2.5 px-4">KODE TICKET</th>
                    <th className="py-2.5 px-4 text-right">TOTAL KEMENANGAN</th>
                    <th className="py-2.5 px-4 text-right">NILAI TARUHAN</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {parsed ? (
                    <tr className="border-b border-[#EAE0D2] dark:border-[#2E1F16]">
                      <td className="py-3 px-4 font-extrabold text-black dark:text-white">
                        {parsed.userId}
                      </td>
                      <td className="py-3 px-4 font-bold text-black dark:text-white">
                        {parsed.accountName}
                      </td>
                      <td className="py-3 px-4 font-mono-tabular text-black dark:text-white">
                        {parsed.accountNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-black dark:text-white">
                        {parsed.game}
                      </td>
                      <td className="py-3 px-4 font-mono-tabular text-black dark:text-white">
                        {parsed.ticketCode}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-tabular font-extrabold text-[#147D4E] dark:text-[#6EE7A8]">
                        {formatRupiah(parsed.totalWin)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-tabular font-bold text-black dark:text-white">
                        {formatRupiah(parsed.betValue)}
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-6 px-4 text-center font-semibold text-[#9F1239] dark:text-[#FDA4AF]"
                      >
                        Data kosong atau belum ditempel transaksi DEBIT (nilai taruhan).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div
              className={`px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold ${
                parsed?.scatterEligible
                  ? 'bg-[#E4F4EC] dark:bg-[#143B27] text-[#0E603A] dark:text-[#7CE8AD]'
                  : 'bg-[#FBE7EB] dark:bg-[#3E1621] text-[#9F1239] dark:text-[#FDA4AF]'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {parsed?.scatterEligible ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )}
                <span>
                  STATUS BONUS:{' '}
                  {parsed
                    ? parsed.scatterReason
                    : 'Woy Jangan Dibagi !! Tidak Memenuhi Syarat Bonus (Data kosong).'}
                </span>
              </span>
              <span className="opacity-85">
                Syarat: Bet Min 1,200 | Menang Min 100,000 | Mahjong Ways 1 &amp; 2
              </span>
            </div>
          </div>

          {/* Bottom Table 2: BONUS HARIAN SLOT */}
          <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E5DACB] dark:border-[#332218] flex items-center justify-between bg-[#F4EDE3] dark:bg-[#261A12]">
              <span className="text-xs font-extrabold uppercase tracking-wider text-black dark:text-white">
                ● BONUS HARIAN SLOT PRAGMATIC PLAY - IDNSLOT - SLOT MANIA - PGSOFT
              </span>
              <button
                type="button"
                disabled={!parsed}
                onClick={() =>
                  parsed &&
                  onCopyText(
                    `BONUS HARIAN SLOT\nUser ID: ${parsed.userId}\nRek: ${parsed.accountName} (${parsed.accountNumber})\nProvider: ${parsed.provider} | Game: ${parsed.game}\nRound ID: ${parsed.ticketCode}\nWin: ${formatRupiah(parsed.totalWin)} | Bet: ${formatRupiah(parsed.betValue)} (x${parsed.multiplier.toFixed(1)})\nStatus: ${parsed.harianReason}`,
                    'Bonus Harian Slot'
                  )
                }
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#4A2B18] dark:bg-[#C59656] text-white dark:text-[#140D09] text-[11px] font-extrabold disabled:opacity-40 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>COPY &gt;&gt;</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[820px]">
                <thead>
                  <tr className="border-b border-[#DFD1BE] dark:border-[#3A281D] text-[10px] font-extrabold uppercase tracking-wider text-[#3D322B] dark:text-[#D6C7B5]">
                    <th className="py-2.5 px-4">USER ID</th>
                    <th className="py-2.5 px-4">NAMA REKENING</th>
                    <th className="py-2.5 px-4">NOMOR REKENING</th>
                    <th className="py-2.5 px-4">PROVIDER</th>
                    <th className="py-2.5 px-4">PERMAINAN</th>
                    <th className="py-2.5 px-4">ROUND ID</th>
                    <th className="py-2.5 px-4 text-center">SUPER BUY FREE SPIN</th>
                    <th className="py-2.5 px-4 text-right">KEMENANGAN</th>
                    <th className="py-2.5 px-4 text-right">TARUHAN</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {parsed ? (
                    <tr className="border-b border-[#EAE0D2] dark:border-[#2E1F16]">
                      <td className="py-3 px-4 font-extrabold text-black dark:text-white">
                        {parsed.userId}
                      </td>
                      <td className="py-3 px-4 font-bold text-black dark:text-white">
                        {parsed.accountName}
                      </td>
                      <td className="py-3 px-4 font-mono-tabular text-black dark:text-white">
                        {parsed.accountNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#4A2B18] dark:text-[#E5B874]">
                        {parsed.provider}
                      </td>
                      <td className="py-3 px-4 font-bold text-black dark:text-white">
                        {parsed.game}
                      </td>
                      <td className="py-3 px-4 font-mono-tabular text-black dark:text-white">
                        {parsed.ticketCode}
                      </td>
                      <td className="py-3 px-4 text-center font-extrabold">
                        {parsed.isBuyFeature ? 'YA (BUY)' : 'TIDAK'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-tabular font-extrabold text-[#147D4E] dark:text-[#6EE7A8]">
                        {formatRupiah(parsed.totalWin)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-tabular font-bold text-black dark:text-white">
                        {formatRupiah(parsed.betValue)}
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-6 px-4 text-center font-semibold text-[#9F1239] dark:text-[#FDA4AF]"
                      >
                        Data kosong atau belum ditempel transaksi DEBIT (nilai taruhan).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div
              className={`px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold ${
                parsed?.harianEligible
                  ? 'bg-[#E4F4EC] dark:bg-[#143B27] text-[#0E603A] dark:text-[#7CE8AD]'
                  : 'bg-[#FBE7EB] dark:bg-[#3E1621] text-[#9F1239] dark:text-[#FDA4AF]'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {parsed?.harianEligible ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )}
                <span>
                  STATUS BONUS:{' '}
                  {parsed
                    ? parsed.harianReason
                    : 'Woy Jangan Dibagi !! Tidak Memenuhi Syarat Bonus (Data kosong).'}
                </span>
              </span>
              <span className="opacity-85">
                Syarat: Bet Min 1,000 | Win Up Slot Biasa ≥ x300 | Super Scatter ≥
                x2,000
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
