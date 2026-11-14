import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  CheckCircle2,
  ClipboardPaste,
  Copy,
  Eraser,
  FileText,
  Trophy,
  Zap,
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

interface BonusParlaySectionProps {
  onCopyText: (text: string, label: string, customToast?: string) => void;
}

interface ParsedParlayTicket {
  userId: string;
  provider: string;
  ticketNo: string;
  teamCount: number;
  loseCount: number;
  halfCount: number;
  stake: number;
  totalWin: number;
  totalOdds: number;
  winFullEligible: boolean;
  winFullPrize: number;
  winFullReason: string;
  lose1Eligible: boolean;
  lose1Reason: string;
  statusLabel: string;
}

const PARLAY_PRIZE_TIERS: {
  betLabel: string;
  minStake: number;
  rows: { teams: number; prize: number }[];
}[] = [
  {
    betLabel: 'BET 10.000',
    minStake: 10000,
    rows: [
      { teams: 5, prize: 100000 },
      { teams: 6, prize: 250000 },
      { teams: 7, prize: 500000 },
      { teams: 8, prize: 750000 },
      { teams: 9, prize: 1250000 },
      { teams: 10, prize: 1750000 },
    ],
  },
  {
    betLabel: 'BET 25.000',
    minStake: 25000,
    rows: [
      { teams: 5, prize: 250000 },
      { teams: 6, prize: 500000 },
      { teams: 7, prize: 750000 },
      { teams: 8, prize: 1250000 },
      { teams: 9, prize: 1750000 },
      { teams: 10, prize: 2500000 },
    ],
  },
  {
    betLabel: 'BET 50.000',
    minStake: 50000,
    rows: [
      { teams: 5, prize: 500000 },
      { teams: 6, prize: 750000 },
      { teams: 7, prize: 1250000 },
      { teams: 8, prize: 1750000 },
      { teams: 9, prize: 2500000 },
      { teams: 10, prize: 3500000 },
    ],
  },
  {
    betLabel: 'BET 100.000',
    minStake: 100000,
    rows: [
      { teams: 5, prize: 750000 },
      { teams: 6, prize: 1250000 },
      { teams: 7, prize: 1750000 },
      { teams: 8, prize: 2250000 },
      { teams: 9, prize: 3500000 },
      { teams: 10, prize: 5000000 },
    ],
  },
];

const PARLAY_PRESETS: { id: string; label: string; sample: string }[] = [
  {
    id: 'win-full-8',
    label: 'Win Full 8 Team (Stake 15k)',
    sample: `User ID: panjool123\nProvider: SBO Sportbook\nNo Tiket: 512726030\nMix Parlay 8 Team (Win Full)\nStake: 15,000\nTotal Odds: 34.50\nWin: 517,500\nStatus: WIN FULL`,
  },
  {
    id: 'lose-1-6',
    label: 'Lose 1 (6 Team, Stake 25k)',
    sample: `User ID: panjool123\nProvider: SBO Sportbook\nNo Tiket: 512726030\n1. Arsenal vs Chelsea @ 1.85 - WON\n2. Liverpool vs Everton @ 1.72 - WON\n3. Real Madrid vs Sevilla @ 1.68 - WON\n4. Barcelona vs Valencia @ 1.60 - WON\n5. Inter Milan vs Lazio @ 1.495 - WON\n6. Bayern vs Dortmund @ 1.90 - LOSE\nTotal Odds Menang: 12.7918652\nStake: 25,000\nWin: 0`,
  },
  {
    id: 'stake-25k-7',
    label: 'Stake 25k (7 Team Win Full)',
    sample: `User ID: koko_parlay88\nProvider: SABA Sportbook\nNo Tiket: 882910441\nMix Parlay 7 Team (Win Full)\nStake: 25,000\nTotal Odds: 22.40\nWin: 560,000\nStatus: WIN FULL`,
  },
  {
    id: 'stake-100k-10',
    label: 'Stake 100k (10 Team Win Full)',
    sample: `User ID: sultan_bola99\nProvider: CMD368 Sportbook\nNo Tiket: 993817264\nMix Parlay 10 Team (Win Full)\nStake: 100,000\nTotal Odds: 68.25\nWin: 6,825,000\nStatus: WIN FULL`,
  },
  {
    id: 'ditolak-kurang-10k',
    label: 'Ditolak (Bet < 10k)',
    sample: `User ID: test_bet5k\nProvider: SBO Sportbook\nNo Tiket: 400192837\nMix Parlay 5 Team (Win Full)\nStake: 5,000\nTotal Odds: 14.20\nWin: 71,000\nStatus: WIN FULL`,
  },
];

function parseAmountValue(rawVal: string): number {
  const cleaned = rawVal.trim().toLowerCase();
  if (!cleaned) return 0;
  const hasK = cleaned.endsWith('k');
  const numOnly = cleaned.replace(/[^\d.,]/g, '');
  if (!numOnly) return 0;

  if (hasK) {
    const normalized = parseFloat(numOnly.replace(/,/g, '.'));
    return Number.isFinite(normalized) ? Math.round(normalized * 1000) : 0;
  }

  const digits = numOnly.replace(/[.,]/g, '');
  return Number(digits) || 0;
}

function formatNumberPlain(num: number): string {
  return num.toLocaleString('en-US');
}

function formatOddsDisplay(odds: number): string {
  if (!Number.isFinite(odds) || odds <= 0) return '1.00';
  const roundedStr = odds.toFixed(7).replace(/\.?0+$/, '');
  if (!roundedStr.includes('.')) return `${roundedStr}.00`;
  const [, dec] = roundedStr.split('.');
  return dec.length === 1 ? `${roundedStr}0` : roundedStr;
}

function getWinFullPrize(stake: number, teams: number): number {
  if (stake < 10000 || teams < 5) return 0;
  const clampedTeams = Math.min(10, teams);
  let matchedTier = PARLAY_PRIZE_TIERS[0];
  for (const tier of PARLAY_PRIZE_TIERS) {
    if (stake >= tier.minStake) {
      matchedTier = tier;
    }
  }
  const row = matchedTier.rows.find((r) => r.teams === clampedTeams);
  return row ? row.prize : 0;
}

function parseParlayTicket(raw: string): ParsedParlayTicket | null {
  const text = raw.trim();
  if (!text) return null;

  const userMatch = text.match(/(?:User(?:\s*ID)?|Member|Username)\s*[:=]\s*([A-Za-z0-9_.-]+)/i);
  const userId = userMatch ? userMatch[1] : 'member_parlay';

  let provider = 'SBO Sportbook';
  const provMatch = text.match(/Provider\s*[:=]\s*([^\n|]+)/i);
  if (provMatch) {
    provider = provMatch[1].trim();
  } else if (/saba/i.test(text)) {
    provider = 'SABA Sportbook';
  } else if (/cmd\s*368/i.test(text)) {
    provider = 'CMD368 Sportbook';
  } else if (/afb/i.test(text)) {
    provider = 'AFB Sportbook';
  } else if (/ibc/i.test(text)) {
    provider = 'IBC Sportbook';
  }

  const ticketMatch = text.match(/(?:No\.?\s*Tiket|Ticket|Ref|Bet\s*ID|Invoice)\s*[:=#]?\s*([A-Za-z0-9_-]+)/i);
  const fallbackNumTicket = text.match(/\b(\d{7,12})\b/);
  const ticketNo = ticketMatch ? ticketMatch[1] : fallbackNumTicket ? fallbackNumTicket[1] : '-';

  const stakeMatch = text.match(/(?:Stake|Taruhan|Nilai\s*Taruhan|Total\s*Taruhan|Bet|Modal)\s*[:=]?\s*(?:Rp\.?\s*)?([\d.,]+k?)/i);
  const stake = stakeMatch ? parseAmountValue(stakeMatch[1]) : 0;

  const winMatch = text.match(/(?:Total\s*Kemenangan|Kemenangan|Win(?!\s*Full|\s*Multiplier)|Payout|Return)\s*[:=]?\s*(?:Rp\.?\s*)?([\d.,]+k?)/i);
  let totalWin = winMatch ? parseAmountValue(winMatch[1]) : 0;

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const legLines = lines.filter((l) => /@\s*\d|\b(?:WON|WIN|LOSE|LOST|DRAW|HALF)\b/i.test(l) && !/^(?:Status|Total|Mix\s*Parlay)/i.test(l));

  const teamExplicitMatch = text.match(/(\d+)\s*(?:Team|Tim|Partai)\b/i);
  const teamCount = teamExplicitMatch
    ? Number(teamExplicitMatch[1])
    : legLines.length > 0
      ? legLines.length
      : 0;

  let loseCount = 0;
  let halfCount = 0;
  if (legLines.length > 0) {
    legLines.forEach((l) => {
      if (/\b(?:HALF|WIN HALF|LOSE HALF|DRAW)\b/i.test(l)) {
        halfCount += 1;
      } else if (/\b(?:LOSE|LOST|KALAH)\b/i.test(l)) {
        loseCount += 1;
      }
    });
  } else {
    if (/\b(?:lose\s*1|kalah\s*1|1\s*lose)\b/i.test(text)) {
      loseCount = 1;
    } else if (/\b(?:lose\s*2|kalah\s*2)\b/i.test(text)) {
      loseCount = 2;
    }
    if (/\b(?:win\s*half|lose\s*half|draw)\b/i.test(text)) {
      halfCount = 1;
    }
  }

  const oddsExplicitMatch = text.match(/(?:Total\s*Odds(?:\s*Menang)?|Win\s*Multiplier|Odds)\s*[:=@x]?\s*(\d+(?:[.,]\d+)?)/i);
  let totalOdds = 0;
  if (oddsExplicitMatch) {
    totalOdds = parseFloat(oddsExplicitMatch[1].replace(',', '.')) || 0;
  } else if (legLines.length > 0) {
    const wonOdds = legLines
      .filter((l) => !/\b(?:LOSE|LOST|KALAH)\b/i.test(l))
      .map((l) => {
        const m = l.match(/@\s*(\d+(?:[.,]\d+)?)/);
        return m ? parseFloat(m[1].replace(',', '.')) : 1;
      });
    if (wonOdds.length > 0) {
      totalOdds = wonOdds.reduce((acc, v) => acc * v, 1);
    }
  } else if (stake > 0 && totalWin > 0) {
    totalOdds = totalWin / stake;
  }

  if (totalWin === 0 && loseCount === 0 && stake > 0 && totalOdds > 0) {
    totalWin = Math.round(stake * totalOdds);
  }

  // Validate Win Full: min 5 team, loseCount === 0, halfCount === 0, stake >= 10,000
  let winFullEligible = false;
  let winFullPrize = 0;
  let winFullReason = 'Belum ada data klaim Win Full yang memenuhi syarat.';

  if (teamCount < 5) {
    winFullReason = `Ditolak: Jumlah team (${teamCount}) di bawah minimal 5 Team.`;
  } else if (stake < 10000) {
    winFullReason = `Ditolak: Nilai taruhan (${formatRupiah(stake)}) di bawah minimal Rp 10.000.`;
  } else if (loseCount > 0 || halfCount > 0) {
    winFullReason = 'Tidak memenuhi syarat Win Full Murni (terdapat partai Lose/Half/Draw).';
  } else {
    winFullEligible = true;
    winFullPrize = getWinFullPrize(stake, teamCount);
    winFullReason = `SAH WIN FULL! ${teamCount} Team · Hadiah ${formatRupiah(winFullPrize)}`;
  }

  // Validate Lose 1: min 5 team (4 Win Full + 1 Lose Full), loseCount === 1, halfCount === 0, stake >= 25,000
  let lose1Eligible = false;
  let lose1Reason = 'Belum ada data klaim Lose 1 yang memenuhi syarat.';

  if (teamCount < 5) {
    lose1Reason = `Ditolak: Jumlah team (${teamCount}) di bawah minimal 5 Team.`;
  } else if (stake < 25000) {
    lose1Reason = `Ditolak: Minimal taruhan Lose 1 adalah Rp 25.000 (saat ini ${formatRupiah(stake)}).`;
  } else if (loseCount !== 1 || halfCount > 0) {
    lose1Reason = loseCount === 0
      ? 'Tiket Win Full (bukan Lose 1).'
      : `Tidak memenuhi syarat Lose 1 (${loseCount} kalah / ${halfCount} half/draw).`;
  } else {
    lose1Eligible = true;
    lose1Reason = `SAH LOSE 1! ${teamCount} Team (${teamCount - 1} Win + 1 Lose) · Odds Menang ${formatOddsDisplay(totalOdds)}`;
  }

  let statusLabel = '-';
  if (teamCount > 0) {
    if (winFullEligible) statusLabel = `${teamCount} Team · WIN FULL SAH`;
    else if (lose1Eligible) statusLabel = `${teamCount} Team · LOSE 1 SAH`;
    else if (loseCount === 1) statusLabel = `${teamCount} Team · LOSE 1 (TOLAK)`;
    else statusLabel = `${teamCount} Team · TIDAK SAH`;
  }

  return {
    userId,
    provider,
    ticketNo,
    teamCount,
    loseCount,
    halfCount,
    stake,
    totalWin,
    totalOdds,
    winFullEligible,
    winFullPrize,
    winFullReason,
    lose1Eligible,
    lose1Reason,
    statusLabel,
  };
}

export const BonusParlaySection: React.FC<BonusParlaySectionProps> = ({ onCopyText }) => {
  const [rawInput, setRawInput] = useState('');
  const [processedRaw, setProcessedRaw] = useState('');
  const [autoClearSec, setAutoClearSec] = useState<3 | 5 | 10>(5);
  const [remainingClearSec, setRemainingClearSec] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  const stopAutoClearTimers = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setRemainingClearSec(null);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const clearAllParlayData = () => {
    stopAutoClearTimers();
    setRawInput('');
    setProcessedRaw('');
  };

  const scheduleAutoClear = (secondsOverride?: 3 | 5 | 10) => {
    const duration = secondsOverride ?? autoClearSec;
    stopAutoClearTimers();
    setRemainingClearSec(duration);

    countdownIntervalRef.current = window.setInterval(() => {
      setRemainingClearSec((prev) => {
        if (prev === null || prev <= 1) return null;
        return prev - 1;
      });
    }, 1000);

    timerRef.current = window.setTimeout(() => {
      clearAllParlayData();
    }, duration * 1000);
  };

  const parsed = useMemo(
    () => parseParlayTicket(processedRaw || rawInput),
    [processedRaw, rawInput]
  );

  const handleLoadPreset = (sample: string) => {
    setRawInput(sample);
    setProcessedRaw(sample);
    scheduleAutoClear();
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setRawInput(text);
          setProcessedRaw(text);
          scheduleAutoClear();
        }
      }
    } catch {
      // ignore clipboard read block
    }
  };

  const handleProcess = () => {
    setProcessedRaw(rawInput);
    if (rawInput.trim()) {
      scheduleAutoClear();
    } else {
      stopAutoClearTimers();
    }
  };

  const handleReset = () => {
    clearAllParlayData();
  };

  const handleCopyWinFull = () => {
    if (!parsed || !parsed.winFullEligible) return;
    const line = `${parsed.userId}\t${parsed.provider}\t${parsed.ticketNo}\t${parsed.teamCount}\t${formatNumberPlain(parsed.stake)}`;
    onCopyText(line, 'Hasil Parlay Win Full');
    clearAllParlayData();
  };

  const handleCopyLose1 = () => {
    if (!parsed || !parsed.lose1Eligible) return;
    const line = `${parsed.userId}\t${parsed.provider}\t${parsed.ticketNo}\t${parsed.teamCount}\t${formatOddsDisplay(parsed.totalOdds)}`;
    onCopyText(line, 'Hasil Parlay Lose 1');
    clearAllParlayData();
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Strip */}
      <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Trophy className="w-5 h-5 text-[#4A2B18] dark:text-[#E5B874]" />
            <h2 className="text-base sm:text-lg font-extrabold text-black dark:text-white tracking-tight">
              BONUS PARLAY CHECKER &amp; CONVERTER
            </h2>
            <span className="px-2 py-0.5 rounded bg-[#EAE0D2] dark:bg-[#2E2017] border border-[#CBB9A0] dark:border-[#D4A373]/75 text-[10px] font-extrabold text-[#4A2B18] dark:text-[#E5B874]">
              WIN FULL &amp; LOSE 1
            </span>
          </div>
          <p className="text-xs text-[#3D322B] dark:text-[#D6C7B5]">
            Validasi otomatis syarat bonus Parlay Win Full (Min. Bet 10k) &amp; Parlay Lose 1 (Min. Bet 25k)
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold shrink-0 ${
            parsed?.winFullEligible || parsed?.lose1Eligible
              ? 'bg-[#E4F4EC] dark:bg-[#143B27] border-[#A7DFC3] dark:border-[#246644] text-[#0E603A] dark:text-[#7CE8AD]'
              : 'bg-[#EAE0D2] dark:bg-[#2C1E16] border-[#CBB9A0] dark:border-[#D4A373]/75 text-[#4A2B18] dark:text-[#E5B874]'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>
            {parsed
              ? parsed.winFullEligible
                ? 'Win Full Sah'
                : parsed.lose1Eligible
                  ? 'Lose 1 Sah'
                  : 'Tidak Memenuhi'
              : 'Siap Validasi'}
          </span>
        </span>
      </div>

      {/* 2. Quick Copy Bar */}
      <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Copy className="w-4 h-4 text-[#4A2B18] dark:text-[#E5B874]" />
            <span className="text-xs font-extrabold uppercase tracking-wide text-black dark:text-white">
              TOMBOL CEPAT COPY HASIL PARLAY
            </span>
            <span className="px-2 py-0.5 rounded bg-[#EAE0D2] dark:bg-[#2E2017] text-[10px] font-extrabold text-[#4A2B18] dark:text-[#E5B874]">
              AUTO-CLIPBOARD
            </span>
          </div>
          <p className="text-[11px] text-[#3D322B] dark:text-[#D6C7B5]">
            Salin data tiket langsung ke clipboard (hanya angka team, tanpa kata &apos;Team&apos;)
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={!parsed?.winFullEligible}
            onClick={handleCopyWinFull}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4A2B18] hover:bg-[#361F11] dark:bg-[#C59656] dark:hover:bg-[#D4A76A] text-white dark:text-[#140D09] text-[11px] font-extrabold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <Copy className="w-3 h-3" />
            <span>COPY WIN FULL</span>
          </button>
          <button
            type="button"
            disabled={!parsed?.lose1Eligible}
            onClick={handleCopyLose1}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-[11px] font-extrabold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <Copy className="w-3 h-3" />
            <span>COPY LOSE 1</span>
          </button>
        </div>
      </div>

      {/* 3. Presets Row */}
      <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 px-5 py-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-extrabold text-[#3D322B] dark:text-[#D6C7B5] mr-1">
          Preset Contoh:
        </span>
        {PARLAY_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handleLoadPreset(preset.sample)}
            className="px-3 py-1 rounded-full bg-[#F8F4EE] hover:bg-[#EAE0D2] dark:bg-[#140D09] dark:hover:bg-[#2C1E16] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-[11px] font-bold cursor-pointer transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* 4. Middle Two-Column Split: Tempel Format Tiket Parlay (Left) & Hasil Pembacaan & Metrik (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left: Tempel Format Tiket Parlay + Mahjong-style Auto Clear inside header */}
        <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 p-5 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#EAE0D2] dark:bg-[#2C1E16] text-[#4A2B18] dark:text-[#E5B874]">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wide text-black dark:text-white">
                  TEMPEL FORMAT TIKET PARLAY
                </div>
                <div className="text-[10px] text-[#3D322B] dark:text-[#D6C7B5]">
                  Area kotak input lebih besar &amp; leluasa
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {/* Auto Clear Selector matching Bonus Mahjong */}
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F8F4EE] dark:bg-[#140D09] border border-[#CBB9A0] dark:border-[#D4A373]/75 text-[10px] font-extrabold text-black dark:text-white font-mono-tabular">
                <span>
                  AUTO CLEAR: {autoClearSec}s
                  {remainingClearSec !== null ? ` (${remainingClearSec}s)` : ''}
                </span>
                {([3, 5, 10] as const).map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      setAutoClearSec(sec);
                      if (rawInput.trim()) scheduleAutoClear(sec);
                    }}
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

              <button
                type="button"
                onClick={handlePasteClipboard}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-[10px] font-extrabold cursor-pointer"
              >
                <ClipboardPaste className="w-3 h-3" />
                <span>PASTE CLIPBOARD</span>
              </button>

              <button
                type="button"
                onClick={handleProcess}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#4A2B18] hover:bg-[#361F11] dark:bg-[#C59656] dark:hover:bg-[#D4A76A] text-white dark:text-[#140D09] text-[10px] font-extrabold cursor-pointer"
              >
                <Zap className="w-3 h-3" />
                <span>PROSES</span>
              </button>
            </div>
          </div>

          <textarea
            rows={8}
            value={rawInput}
            onChange={(e) => {
              const val = e.target.value;
              setRawInput(val);
              setProcessedRaw(val);
              if (val.trim()) {
                scheduleAutoClear();
              } else {
                stopAutoClearTimers();
              }
            }}
            placeholder={`Tempel format tiket mix parlay dari Sportbook di sini... (Otomatis terhapus dalam ${autoClearSec} detik atau saat selesai disalin)`}
            className="flex-1 w-full p-3.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-mono-tabular focus:outline-none focus:ring-2 focus:ring-[#4A2B18] dark:focus:ring-[#C59656]"
          />

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[11px] font-semibold text-[#3D322B] dark:text-[#D6C7B5]">
              {parsed
                ? `Terbaca: ${parsed.userId} · ${parsed.teamCount} Team · Stake ${formatRupiah(parsed.stake)}`
                : 'Menunggu input tiket...'}
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#FBE7EB] hover:bg-[#F7D0D8] dark:bg-[#3E1621] dark:hover:bg-[#521D2B] text-[#9F1239] dark:text-[#FDA4AF] border border-[#F2B8C6] dark:border-[#70263A] text-[11px] font-extrabold cursor-pointer"
            >
              <Eraser className="w-3 h-3" />
              <span>Reset Data</span>
            </button>
          </div>
        </div>

        {/* Right: Hasil Pembacaan & Metrik */}
        <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 p-5 flex flex-col justify-between gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wide text-black dark:text-white">
              ● HASIL PEMBACAAN &amp; METRIK
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={!parsed?.winFullEligible}
                onClick={handleCopyWinFull}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EAE0D2] dark:bg-[#2C1E16] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-[10px] font-extrabold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <Copy className="w-2.5 h-2.5" />
                <span>COPY WIN FULL</span>
              </button>
              <button
                type="button"
                disabled={!parsed?.lose1Eligible}
                onClick={handleCopyLose1}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EAE0D2] dark:bg-[#2C1E16] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-[10px] font-extrabold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <Copy className="w-2.5 h-2.5" />
                <span>COPY LOSE 1</span>
              </button>
              <span className="px-2 py-1 rounded-lg bg-[#4A2B18] text-white dark:bg-[#C59656] dark:text-[#140D09] text-[10px] font-extrabold">
                FORMULA
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
            <div className="rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] border border-[#DFD1BE] dark:border-[#C59656]/60 p-4 flex flex-col justify-center">
              <div className="text-[10px] font-extrabold uppercase text-[#3D322B] dark:text-[#D6C7B5]">
                TOTAL KEMENANGAN
              </div>
              <div className="text-lg font-extrabold font-mono-tabular text-[#147D4E] dark:text-[#6EE7A8] mt-1">
                {formatRupiah(parsed ? parsed.totalWin : 0)}
              </div>
            </div>

            <div className="rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] border border-[#DFD1BE] dark:border-[#C59656]/60 p-4 flex flex-col justify-center">
              <div className="text-[10px] font-extrabold uppercase text-[#3D322B] dark:text-[#D6C7B5]">
                TOTAL TARUHAN (BET)
              </div>
              <div className="text-lg font-extrabold font-mono-tabular text-black dark:text-white mt-1">
                {formatRupiah(parsed ? parsed.stake : 0)}
              </div>
            </div>

            <div className="rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] border border-[#DFD1BE] dark:border-[#C59656]/60 p-4 flex flex-col justify-center">
              <div className="text-[10px] font-extrabold uppercase text-[#3D322B] dark:text-[#D6C7B5]">
                WIN MULTIPLIER (ODDS)
              </div>
              <div className="text-lg font-extrabold font-mono-tabular text-[#B45309] dark:text-[#E5B874] mt-1">
                x{parsed ? formatOddsDisplay(parsed.totalOdds) : '1.00'}
              </div>
            </div>

            <div className="rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] border border-[#DFD1BE] dark:border-[#C59656]/60 p-4 flex flex-col justify-center">
              <div className="text-[10px] font-extrabold uppercase text-[#3D322B] dark:text-[#D6C7B5]">
                JUMLAH PARTAI &amp; STATUS
              </div>
              <div className="text-sm font-extrabold text-black dark:text-white mt-1">
                {parsed ? parsed.statusLabel : '-'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Table 1: BONUS PARLAY WIN FULL MINIMAL 5 TEAM */}
      <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E5DACB] dark:border-[#C59656]/35 flex flex-wrap items-center justify-between gap-2 bg-[#F4EDE3] dark:bg-[#261A12]">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-black dark:text-white">
              ● BONUS PARLAY WIN FULL MINIMAL 5 TEAM
            </div>
            <div className="text-[11px] text-[#3D322B] dark:text-[#D6C7B5]">
              Kata &apos;Team&apos; tampil di tabel, hasil salinan hanya menyalin angka
            </div>
          </div>

          <button
            type="button"
            disabled={!parsed?.winFullEligible}
            onClick={handleCopyWinFull}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#4A2B18] dark:bg-[#C59656] text-white dark:text-[#140D09] text-[11px] font-extrabold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <Copy className="w-3 h-3" />
            <span>COPY WIN FULL &gt;&gt;</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-[#DFD1BE] dark:border-[#C59656]/60 text-[10px] font-extrabold uppercase tracking-wider text-[#3D322B] dark:text-[#D6C7B5]">
                <th className="py-2.5 px-4">USER ID</th>
                <th className="py-2.5 px-4">PROVIDER</th>
                <th className="py-2.5 px-4">NO TIKET</th>
                <th className="py-2.5 px-4 text-center">JUMLAH TEAM</th>
                <th className="py-2.5 px-4 text-right">NILAI TARUHAN</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {parsed?.winFullEligible ? (
                <tr className="border-b border-[#EAE0D2] dark:border-[#C59656]/35">
                  <td className="py-3 px-4 font-extrabold text-black dark:text-white">
                    {parsed.userId}
                  </td>
                  <td className="py-3 px-4 font-bold text-[#4A2B18] dark:text-[#E5B874]">
                    {parsed.provider}
                  </td>
                  <td className="py-3 px-4 font-mono-tabular font-bold text-black dark:text-white">
                    {parsed.ticketNo}
                  </td>
                  <td className="py-3 px-4 text-center font-extrabold text-[#147D4E] dark:text-[#6EE7A8]">
                    {parsed.teamCount} Team
                  </td>
                  <td className="py-3 px-4 text-right font-mono-tabular font-extrabold text-black dark:text-white">
                    {formatRupiah(parsed.stake)}
                  </td>
                </tr>
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="py-5 px-4 text-center font-semibold text-[#5D4C3E] dark:text-[#D6C7B5]"
                  >
                    {parsed
                      ? parsed.winFullReason
                      : '- Belum ada data klaim Win Full yang memenuhi syarat -'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-2.5 bg-[#F8F4EE] dark:bg-[#140D09] border-t border-[#E5DACB] dark:border-[#C59656]/35 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <span className="font-semibold text-[#3D322B] dark:text-[#D6C7B5]">
            Syarat: Min. 5 Team Win Full | Minimal Taruhan Rp 10.000
          </span>
          <span className="text-[#3D322B] dark:text-[#D6C7B5]">
            Format Copy:{' '}
            <code className="px-2 py-0.5 rounded bg-[#E4F4EC] dark:bg-[#143B27] text-[#0E603A] dark:text-[#7CE8AD] font-mono-tabular font-bold">
              {parsed?.winFullEligible
                ? `${parsed.userId} ${parsed.provider} ${parsed.ticketNo} ${parsed.teamCount} ${formatNumberPlain(parsed.stake)}`
                : 'panjool123 SBO Sportbook 512726030 8 15,000'}
            </code>
          </span>
        </div>
      </div>

      {/* 6. Table 2: BONUS PARLAY LOSE 1 MINIMAL 5 TEAM */}
      <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E5DACB] dark:border-[#C59656]/35 flex flex-wrap items-center justify-between gap-2 bg-[#F4EDE3] dark:bg-[#261A12]">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-black dark:text-white">
              ● BONUS PARLAY LOSE 1 MINIMAL 5 TEAM
            </div>
            <div className="text-[11px] text-[#3D322B] dark:text-[#D6C7B5]">
              Kata &apos;Team&apos; tampil di tabel, hasil salinan menyalin angka jumlah team &amp; odds tim menang
            </div>
          </div>

          <button
            type="button"
            disabled={!parsed?.lose1Eligible}
            onClick={handleCopyLose1}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#4A2B18] dark:bg-[#C59656] text-white dark:text-[#140D09] text-[11px] font-extrabold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <Copy className="w-3 h-3" />
            <span>COPY LOSE 1 &gt;&gt;</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-[#DFD1BE] dark:border-[#C59656]/60 text-[10px] font-extrabold uppercase tracking-wider text-[#3D322B] dark:text-[#D6C7B5]">
                <th className="py-2.5 px-4">USER ID</th>
                <th className="py-2.5 px-4">PROVIDER</th>
                <th className="py-2.5 px-4">NO TIKET</th>
                <th className="py-2.5 px-4 text-center">JUMLAH TEAM</th>
                <th className="py-2.5 px-4 text-center">TOTAL ODDS</th>
                <th className="py-2.5 px-4 text-right">NILAI TARUHAN</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {parsed?.lose1Eligible ? (
                <tr className="border-b border-[#EAE0D2] dark:border-[#C59656]/35">
                  <td className="py-3 px-4 font-extrabold text-black dark:text-white">
                    {parsed.userId}
                  </td>
                  <td className="py-3 px-4 font-bold text-[#4A2B18] dark:text-[#E5B874]">
                    {parsed.provider}
                  </td>
                  <td className="py-3 px-4 font-mono-tabular font-bold text-black dark:text-white">
                    {parsed.ticketNo}
                  </td>
                  <td className="py-3 px-4 text-center font-extrabold text-[#B45309] dark:text-[#FBBF24]">
                    {parsed.teamCount} Team
                  </td>
                  <td className="py-3 px-4 text-center font-mono-tabular font-extrabold text-[#147D4E] dark:text-[#6EE7A8]">
                    {formatOddsDisplay(parsed.totalOdds)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-tabular font-extrabold text-black dark:text-white">
                    {formatRupiah(parsed.stake)}
                  </td>
                </tr>
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="py-5 px-4 text-center font-semibold text-[#5D4C3E] dark:text-[#D6C7B5]"
                  >
                    {parsed
                      ? parsed.lose1Reason
                      : '- Belum ada data klaim Lose 1 yang memenuhi syarat -'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-2.5 bg-[#F8F4EE] dark:bg-[#140D09] border-t border-[#E5DACB] dark:border-[#C59656]/35 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <span className="font-semibold text-[#3D322B] dark:text-[#D6C7B5]">
            Syarat: Min. 5 Team (4 Win Full + 1 Lose Full) | Minimal Taruhan Rp 25.000
          </span>
          <span className="text-[#3D322B] dark:text-[#D6C7B5]">
            Format Copy:{' '}
            <code className="px-2 py-0.5 rounded bg-[#FFF3E0] dark:bg-[#2E2017] text-[#B45309] dark:text-[#E5B874] font-mono-tabular font-bold">
              {parsed?.lose1Eligible
                ? `${parsed.userId} ${parsed.provider} ${parsed.ticketNo} ${parsed.teamCount} ${formatOddsDisplay(parsed.totalOdds)}`
                : 'panjool123 SBO Sportbook 512726030 6 12.7918652'}
            </code>
          </span>
        </div>
      </div>

      {/* 7. Moved to Very Bottom per User Request #1: INFORMASI HADIAH PARLAY WIN FULL */}
      <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#EAE0D2] dark:bg-[#2C1E16] text-[#4A2B18] dark:text-[#E5B874]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-black dark:text-white">
                INFORMASI HADIAH PARLAY WIN FULL
              </h3>
              <p className="text-[11px] text-[#3D322B] dark:text-[#D6C7B5]">
                Syarat: Min. Stake Rp 10.000 &amp; Min. 5 Team Win Full Murni
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-[#EAE0D2] dark:bg-[#2E2017] border border-[#CBB9A0] dark:border-[#D4A373]/75 text-[10px] font-extrabold uppercase tracking-wider text-[#4A2B18] dark:text-[#E5B874]">
            TABEL HADIAH
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PARLAY_PRIZE_TIERS.map((tier) => (
            <div
              key={tier.betLabel}
              className="rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] border border-[#DFD1BE] dark:border-[#C59656]/60 p-3.5 space-y-2.5"
            >
              <div className="text-center pb-2 border-b border-[#DFD1BE] dark:border-[#C59656]/35 text-xs font-extrabold tracking-wide text-[#4A2B18] dark:text-[#E5B874]">
                {tier.betLabel}
              </div>

              <div className="space-y-1.5 text-xs">
                {tier.rows.map((row) => (
                  <div
                    key={row.teams}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="font-semibold text-[#3D322B] dark:text-[#D6C7B5]">
                      {row.teams} Team:
                    </span>
                    <span className="font-mono-tabular font-extrabold text-black dark:text-white">
                      {row.prize.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {parsed?.winFullEligible && (
          <div className="px-4 py-2.5 rounded-xl bg-[#E4F4EC] dark:bg-[#143B27] text-[#0E603A] dark:text-[#7CE8AD] text-xs font-extrabold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              Estimasi Hadiah Win Full Tiket Ini ({parsed.teamCount} Team, Stake{' '}
              {formatRupiah(parsed.stake)}): {formatRupiah(parsed.winFullPrize)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
