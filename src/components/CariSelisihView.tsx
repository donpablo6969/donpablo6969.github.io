import React, { useMemo, useState } from 'react';
import { ArrowRightLeft, Copy, RefreshCw, Scale } from 'lucide-react';
import {
  SAMPLE_ADMIN_ROWS,
  SAMPLE_DOCS_ROWS,
  SAMPLE_GARUDA_ROWS,
} from '../data/initialData';
import { formatRupiah } from '../utils/formatters';

interface CariSelisihViewProps {
  mode: 'admin-vs-garuda' | 'admin-vs-docs';
  onCopyText: (text: string, label: string) => void;
}

interface ParsedRow {
  userId: string;
  amount: number;
  bank: string;
  time: string;
}

interface DiffEntry {
  userId: string;
  adminAmount: number | null;
  targetAmount: number | null;
  diff: number;
  status: 'COCOK' | 'SELISIH NOMINAL' | 'TIDAK ADA DI PEMBANDING' | 'TIDAK ADA DI ADMIN';
}

function parseLedgerText(raw: string): ParsedRow[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[|,\t;]+/).map((p) => p.trim());
      const userId = (parts[0] || '').toLowerCase();
      const rawAmt = (parts[1] || '0').replace(/\D/g, '');
      const amount = Number(rawAmt) || 0;
      const bank = (parts[2] || '-').toUpperCase();
      const time = parts[3] || '-';
      return { userId, amount, bank, time };
    })
    .filter((r) => r.userId.length > 0);
}

export const CariSelisihView: React.FC<CariSelisihViewProps> = ({ mode, onCopyText }) => {
  const isGaruda = mode === 'admin-vs-garuda';
  const targetLabel = isGaruda ? 'GARUDA GATEWAY' : 'DOCS / SHEET';

  const [adminInput, setAdminInput] = useState(SAMPLE_ADMIN_ROWS);
  const [targetInput, setTargetInput] = useState(
    isGaruda ? SAMPLE_GARUDA_ROWS : SAMPLE_DOCS_ROWS
  );
  const [filterMode, setFilterMode] = useState<'ALL' | 'DIFF_ONLY'>('ALL');

  const handleLoadSample = () => {
    setAdminInput(SAMPLE_ADMIN_ROWS);
    setTargetInput(isGaruda ? SAMPLE_GARUDA_ROWS : SAMPLE_DOCS_ROWS);
  };

  const handleClear = () => {
    setAdminInput('');
    setTargetInput('');
  };

  const auditResult = useMemo(() => {
    const adminRows = parseLedgerText(adminInput);
    const targetRows = parseLedgerText(targetInput);

    const adminMap = new Map<string, number>();
    adminRows.forEach((r) => {
      adminMap.set(r.userId, (adminMap.get(r.userId) || 0) + r.amount);
    });

    const targetMap = new Map<string, number>();
    targetRows.forEach((r) => {
      targetMap.set(r.userId, (targetMap.get(r.userId) || 0) + r.amount);
    });

    const allIds = Array.from(new Set([...adminMap.keys(), ...targetMap.keys()]));
    const rows: DiffEntry[] = allIds.map((userId) => {
      const a = adminMap.has(userId) ? adminMap.get(userId)! : null;
      const t = targetMap.has(userId) ? targetMap.get(userId)! : null;

      if (a !== null && t !== null) {
        const diff = a - t;
        return {
          userId,
          adminAmount: a,
          targetAmount: t,
          diff,
          status: diff === 0 ? 'COCOK' : 'SELISIH NOMINAL',
        };
      }
      if (a !== null && t === null) {
        return {
          userId,
          adminAmount: a,
          targetAmount: null,
          diff: a,
          status: 'TIDAK ADA DI PEMBANDING',
        };
      }
      return {
        userId,
        adminAmount: null,
        targetAmount: t,
        diff: -(t || 0),
        status: 'TIDAK ADA DI ADMIN',
      };
    });

    const totalAdmin = adminRows.reduce((s, r) => s + r.amount, 0);
    const totalTarget = targetRows.reduce((s, r) => s + r.amount, 0);
    const mismatchCount = rows.filter((r) => r.status !== 'COCOK').length;

    return {
      rows,
      totalAdmin,
      totalTarget,
      netDiff: totalAdmin - totalTarget,
      mismatchCount,
    };
  }, [adminInput, targetInput]);

  const visibleRows = useMemo(() => {
    if (filterMode === 'DIFF_ONLY') {
      return auditResult.rows.filter((r) => r.status !== 'COCOK');
    }
    return auditResult.rows;
  }, [auditResult.rows, filterMode]);

  const copyAuditReport = () => {
    const mismatchLines = auditResult.rows
      .filter((r) => r.status !== 'COCOK')
      .map(
        (r) =>
          `- ${r.userId}: ADMIN ${r.adminAmount !== null ? formatRupiah(r.adminAmount) : 'KOSONG'} vs ${targetLabel} ${r.targetAmount !== null ? formatRupiah(r.targetAmount) : 'KOSONG'} (${r.status})`
      );

    const report = [
      `AUDIT SELISIH ADMIN vs ${targetLabel}`,
      `Total ADMIN: ${formatRupiah(auditResult.totalAdmin)}`,
      `Total ${targetLabel}: ${formatRupiah(auditResult.totalTarget)}`,
      `Selisih Bersih: ${formatRupiah(auditResult.netDiff)}`,
      '',
      mismatchLines.length > 0
        ? `Temuan (${mismatchLines.length}):\n${mismatchLines.join('\n')}`
        : 'Semua transaksi cocok 100%.',
    ].join('\n');

    onCopyText(report, `Laporan Audit ADMIN vs ${targetLabel}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-5 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#4A2B18] dark:text-[#E5B874] mb-1">
            <Scale className="w-4 h-4" />
            <span>MODUL AUDIT CARI SELISIH</span>
          </div>
          <h1 className="text-2xl font-extrabold text-black dark:text-white">
            {isGaruda ? 'ADMIN vs GARUDA' : 'ADMIN vs DOCS'}
          </h1>
          <p className="text-xs sm:text-sm text-[#3D322B] dark:text-[#D6C7B5] mt-1">
            Tempel data baris transaksi dengan format{' '}
            <code className="px-1.5 py-0.5 rounded bg-[#EAE0D2] dark:bg-[#2C1E16] text-black dark:text-white font-mono-tabular">
              userid | nominal | bank | waktu
            </code>{' '}
            untuk mendeteksi selisih otomatis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-extrabold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Muat Contoh</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F4EDE3] dark:bg-[#211711] dark:hover:bg-[#2C1E16] text-black dark:text-white border border-[#D4C4AE] dark:border-[#4D3627] text-xs font-bold cursor-pointer"
          >
            Bersihkan
          </button>
          <button
            type="button"
            onClick={copyAuditReport}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4A2B18] hover:bg-[#361F11] dark:bg-[#C59656] dark:text-[#140D09] text-white text-xs font-extrabold cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Salin Laporan Audit</span>
          </button>
        </div>
      </div>

      {/* Dual Paste Input */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wide text-black dark:text-white">
              DATA PANEL ADMIN
            </label>
            <span className="text-xs font-mono-tabular font-bold text-[#4A2B18] dark:text-[#E5B874]">
              Total: {formatRupiah(auditResult.totalAdmin)}
            </span>
          </div>
          <textarea
            rows={6}
            value={adminInput}
            onChange={(e) => setAdminInput(e.target.value)}
            placeholder="userid | nominal | bank | waktu"
            className="w-full p-3 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-mono-tabular focus:outline-none focus:ring-2 focus:ring-[#4A2B18] dark:focus:ring-[#D4A373]"
          />
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wide text-black dark:text-white">
              DATA {targetLabel}
            </label>
            <span className="text-xs font-mono-tabular font-bold text-[#4A2B18] dark:text-[#E5B874]">
              Total: {formatRupiah(auditResult.totalTarget)}
            </span>
          </div>
          <textarea
            rows={6}
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            placeholder="userid | nominal | bank | waktu"
            className="w-full p-3 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-mono-tabular focus:outline-none focus:ring-2 focus:ring-[#4A2B18] dark:focus:ring-[#D4A373]"
          />
        </div>
      </div>

      {/* Audit Summary Bar & Table */}
      <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] overflow-hidden">
        <div className="p-4 border-b border-[#E5DACB] dark:border-[#332218] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-[#4A2B18] dark:text-[#E5B874]" />
              <span className="font-bold text-[#3D322B] dark:text-[#D6C7B5]">Selisih Bersih:</span>
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
              Temuan Selisih:{' '}
              <strong className="text-black dark:text-white tabular-nums">
                {auditResult.mismatchCount} item
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#EFE7DC] dark:bg-[#140D09] border border-[#D4C4AE] dark:border-[#3A281D]">
            <button
              type="button"
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold cursor-pointer ${
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
              className={`px-3 py-1 rounded-lg text-xs font-extrabold cursor-pointer ${
                filterMode === 'DIFF_ONLY'
                  ? 'bg-[#4A2B18] text-white dark:bg-[#C59656] dark:text-[#140D09]'
                  : 'text-black dark:text-white'
              }`}
            >
              Hanya Selisih ({auditResult.mismatchCount})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-[#F4EDE3] dark:bg-[#291C14] border-b border-[#DFD1BE] dark:border-[#3A281D] text-[11px] font-extrabold uppercase tracking-wider text-[#3D322B] dark:text-[#D6C7B5]">
                <th className="py-3 px-4">USER ID</th>
                <th className="py-3 px-4 text-right">NOMINAL ADMIN</th>
                <th className="py-3 px-4 text-right">NOMINAL {targetLabel}</th>
                <th className="py-3 px-4 text-right">SELISIH</th>
                <th className="py-3 px-4 text-center">STATUS AUDIT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE0D2] dark:divide-[#2E1F16] text-xs">
              {visibleRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 px-4 text-center font-semibold text-[#3D322B] dark:text-[#D6C7B5]"
                  >
                    Tidak ada baris selisih yang ditemukan.
                  </td>
                </tr>
              ) : (
                visibleRows.map((row) => (
                  <tr key={row.userId} className="hover:bg-[#F9F5EF] dark:hover:bg-[#261A12]">
                    <td className="py-3 px-4 font-extrabold text-black dark:text-white">
                      {row.userId}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-tabular font-bold text-black dark:text-white">
                      {row.adminAmount !== null ? formatRupiah(row.adminAmount) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-tabular font-bold text-black dark:text-white">
                      {row.targetAmount !== null ? formatRupiah(row.targetAmount) : '—'}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono-tabular font-extrabold ${
                        row.diff === 0
                          ? 'text-[#147D4E] dark:text-[#6EE7A8]'
                          : 'text-[#B91C1C] dark:text-[#FCA5A5]'
                      }`}
                    >
                      {row.diff === 0 ? 'Rp 0' : formatRupiah(row.diff)}
                    </td>
                    <td className="py-3 px-4 text-center">
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
