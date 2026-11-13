import React, { useMemo, useState } from 'react';
import { Copy, Eraser, FileSpreadsheet } from 'lucide-react';

interface RekapanWlSportbooksPanelProps {
  onCopyText: (text: string, label: string, customToast?: string) => void;
}

function parseNumToken(token: string): number {
  let s = token.trim();
  const isParenNeg = /^\(.*\)$/.test(s);
  s = s.replace(/[()]/g, '');
  const isNeg = isParenNeg || s.startsWith('-');
  s = s.replace(/[^\d.,]/g, '');
  if (!s) return 0;

  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) {
    s = s.replace(/,/g, '');
  } else if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',') && !s.includes('.')) {
    const parts = s.split(',');
    if (parts[parts.length - 1].length === 3) {
      s = s.replace(/,/g, '');
    } else {
      s = s.replace(',', '.');
    }
  }

  const val = Number(s);
  if (!Number.isFinite(val)) return 0;
  return isNeg ? -Math.abs(val) : val;
}

function formatOut(n: number): string {
  if (n === 0) return '0';
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(n);
}

export const RekapanWlSportbooksPanel: React.FC<
  RekapanWlSportbooksPanelProps
> = ({ onCopyText }) => {
  const [rawInput, setRawInput] = useState('');

  const lineCount = useMemo(
    () =>
      rawInput
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean).length,
    [rawInput]
  );

  const converted = useMemo(() => {
    const lines = rawInput
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return {
        hasData: false,
        togelTo: 0,
        togelWl: 0,
        lcSpTo: 0,
        lcSpWl: 0,
        pokerTo: 0,
        pokerWl: 0,
        tsv: '',
      };
    }

    let togelTo = 0;
    let togelWl = 0;
    let lcSpTo = 0;
    let lcSpWl = 0;
    let pokerTo = 0;
    let pokerWl = 0;
    let foundAny = false;

    lines.forEach((line) => {
      const lower = line.toLowerCase();
      // Extract numeric columns from the line (tokens that look like numbers or negative/parenthesized numbers)
      const tokens = line.split(/\t+|\s{2,}|\|/).map((t) => t.trim()).filter(Boolean);
      const numTokens = tokens
        .filter((t) => /^[\s(+-]*[\d.,]+[)\s]*$/.test(t))
        .map(parseNumToken);

      // Fallback if single-space separated
      const nums =
        numTokens.length >= 2
          ? numTokens
          : (line.match(/[-(]?\d[\d.,]*\)?/g) || []).map(parseNumToken);

      if (nums.length === 0) return;

      const to = nums[0] ?? 0;
      const wl = nums.length >= 2 ? nums[nums.length - 1] : 0;

      if (/\b(?:togel|toto|4d)\b/i.test(lower)) {
        togelTo += to;
        togelWl += wl;
        foundAny = true;
      } else if (
        /\b(?:live\s*casino|casino|sports?books?|sport|sbobet|lc&?sp|lc)\b/i.test(
          lower
        )
      ) {
        lcSpTo += to;
        lcSpWl += wl;
        foundAny = true;
      } else if (/\b(?:idn\s*poker|poker|p2play)\b/i.test(lower)) {
        pokerTo += to;
        pokerWl += wl;
        foundAny = true;
      }
    });

    const tsv = foundAny
      ? [
          formatOut(togelTo),
          formatOut(togelWl),
          formatOut(lcSpTo),
          formatOut(lcSpWl),
          '', // AO: Kosong
          formatOut(pokerTo),
          formatOut(pokerWl),
        ].join('\t')
      : '';

    return {
      hasData: foundAny,
      togelTo,
      togelWl,
      lcSpTo,
      lcSpWl,
      pokerTo,
      pokerWl,
      tsv,
    };
  }, [rawInput]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-5 sm:p-7 space-y-5 shadow-xs">
        {/* Centered Header */}
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#4A2B18] dark:text-[#E5B874]">
            Converter Summary (Paste di Sel AK3)
          </h1>
          <p className="text-xs sm:text-sm text-[#3D322B] dark:text-[#D6C7B5]">
            Akurat Merekap TOGEL, LIVE CASINO &amp; SPORTSBOOK, dan IDNPOKER
          </p>
        </div>

        {/* Excel Column Layout Guide */}
        <div className="rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] border border-[#DFD1BE] dark:border-[#3A281D] p-4 space-y-1.5">
          <div className="text-xs font-extrabold text-black dark:text-white">
            Susunan Kolom Excel (Paste mulai dari Sel AK3):
          </div>
          <div className="text-xs font-mono-tabular font-bold text-[#4A2B18] dark:text-[#E5B874] break-words leading-relaxed">
            [AK: TOGEL TO] \t [AL: TOGEL W/L] \t [AM: LC&amp;SP TO] \t [AN:
            LC&amp;SP W/L] \t [AO: Kosong] \t [AP: POKER TO] \t [AQ: POKER W/L]
          </div>
        </div>

        {/* Raw Input Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="inline-flex items-center gap-1.5 font-extrabold uppercase tracking-wide text-black dark:text-white">
              <FileSpreadsheet className="w-4 h-4 text-[#4A2B18] dark:text-[#E5B874]" />
              <span>INPUT RAW DATA (Copy dari Laporan / Web)</span>
            </label>
            <span className="font-mono-tabular font-bold text-[#5D4C3E] dark:text-[#D6C7B5]">
              {lineCount} baris
            </span>
          </div>

          <textarea
            rows={8}
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="Tempelkan data tabel di sini..."
            className="w-full p-4 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-mono-tabular focus:outline-none focus:ring-2 focus:ring-[#4A2B18] dark:focus:ring-[#C59656]"
          />
        </div>

        {/* Right-Aligned Clear & Copy Output Excel Buttons */}
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => setRawInput('')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-extrabold cursor-pointer"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <button
            type="button"
            disabled={!converted.hasData}
            onClick={() =>
              onCopyText(
                converted.tsv,
                'Output Excel AK3',
                'Output 1 baris Excel (AK3-AQ3) berhasil disalin'
              )
            }
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#147D4E] hover:bg-[#0F633E] dark:bg-[#1E9A62] dark:hover:bg-[#177E4F] text-white text-xs font-extrabold cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed shadow-xs"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Output Excel</span>
          </button>
        </div>

        {/* Output Result Area */}
        <div className="space-y-2">
          <label className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-black dark:text-white">
            <FileSpreadsheet className="w-4 h-4 text-[#4A2B18] dark:text-[#E5B874]" />
            <span>OUTPUT RESULT (Siap Paste di Sel AK3 Excel)</span>
          </label>

          <textarea
            readOnly
            rows={5}
            value={converted.tsv}
            placeholder="Hasil konversi 1 baris berbentuk tab Excel..."
            className="w-full p-4 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-mono-tabular focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
