import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Building2,
  Check,
  Copy,
  FileText,
  Landmark,
  Search,
  Wallet,
} from 'lucide-react';
import {
  BankChannel,
  CashierMutationItem,
  MemberLookupRecord,
  NavRoute,
  WdQueueItem,
} from '../types';
import { formatRupiah } from '../utils/formatters';

interface DashboardHomeProps {
  wdQueue: WdQueueItem[];
  bankChannels: BankChannel[];
  cashierQueue: CashierMutationItem[];
  memberDirectory: MemberLookupRecord[];
  onNavigate: (route: NavRoute) => void;
  onFlopNow: (id: string) => void;
  onCopyText: (text: string, label: string) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  wdQueue,
  bankChannels,
  cashierQueue,
  memberDirectory,
  onNavigate,
  onFlopNow,
  onCopyText,
}) => {
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<MemberLookupRecord | null>(null);
  const [lookupNotFound, setLookupNotFound] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const wdSuccessCount = useMemo(
    () => wdQueue.filter((item) => item.status === 'FLOP SUKSES').length,
    [wdQueue]
  );
  const wdWaitingCount = useMemo(
    () => wdQueue.filter((item) => item.status === 'WAITING').length,
    [wdQueue]
  );
  const pendingDpCount = useMemo(
    () => cashierQueue.filter((item) => item.type === 'DP' && item.status === 'PENDING').length,
    [cashierQueue]
  );
  const totalPendingCashier = useMemo(
    () => cashierQueue.filter((item) => item.status === 'PENDING').length,
    [cashierQueue]
  );
  const onlineBankCount = useMemo(
    () => bankChannels.filter((b) => b.status === 'ONLINE').length,
    [bankChannels]
  );
  const disruptedBankCount = bankChannels.length - onlineBankCount;

  const handleCopy = (text: string, id: string, label: string) => {
    onCopyText(text, label);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 1500);
  };

  const handleSearchMember = (queryToUse?: string) => {
    const q = (queryToUse ?? lookupQuery).trim().toLowerCase().replace(/^@/, '');
    if (!q) {
      setLookupResult(null);
      setLookupNotFound(false);
      return;
    }
    const found = memberDirectory.find(
      (m) =>
        m.userId.toLowerCase().includes(q) ||
        m.accountNumber.includes(q) ||
        m.fullName.toLowerCase().includes(q)
    );
    if (found) {
      setLookupResult(found);
      setLookupNotFound(false);
    } else {
      setLookupResult(null);
      setLookupNotFound(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Operational Shift Header Card */}
      <section className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-[#4A2B18] text-white dark:bg-[#D4A373] dark:text-[#140D09] font-extrabold tracking-wide">
                PORTAL KERJA OPERASIONAL
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black dark:text-white">
              Sistem Layanan Terpadu DON PABLO
            </h1>

            <p className="text-sm text-[#2E241E] dark:text-[#E2D6C8] leading-relaxed">
              Gunakan modul{' '}
              <button
                type="button"
                onClick={() => onNavigate('wd-auto-flop')}
                className="font-bold text-[#6E3E20] dark:text-[#E5B874] hover:underline cursor-pointer"
              >
                WD AUTO FLOP
              </button>{' '}
              untuk penarikan instan,{' '}
              <button
                type="button"
                onClick={() => onNavigate('bagi-bonus')}
                className="font-bold text-[#6E3E20] dark:text-[#E5B874] hover:underline cursor-pointer"
              >
                TOOLS CS
              </button>{' '}
              untuk kelola bonus &amp; rekapan, dan{' '}
              <button
                type="button"
                onClick={() => onNavigate('info-dp-wd')}
                className="font-bold text-[#6E3E20] dark:text-[#E5B874] hover:underline cursor-pointer"
              >
                TOOLS KASIR
              </button>{' '}
              untuk verifikasi mutasi rekening.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('wd-auto-flop')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4A2B18] hover:bg-[#361F11] dark:bg-[#C59656] dark:hover:bg-[#D4A76A] text-white dark:text-[#140D09] text-xs font-extrabold tracking-wide transition-colors cursor-pointer whitespace-nowrap"
            >
              <Wallet className="w-4 h-4" />
              <span>BUKA WD AUTO FLOP</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('info-dp-wd')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-extrabold tracking-wide transition-colors cursor-pointer whitespace-nowrap"
            >
              <ArrowUpDown className="w-4 h-4 text-[#4A2B18] dark:text-[#E5B874]" />
              <span>ANTRIAN DP/WD ({totalPendingCashier})</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4 KPI Summary Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold tracking-wide uppercase text-[#3D322B] dark:text-[#D6C7B5]">
              WD AUTO FLOP SUKSES
            </span>
            <div className="p-2 rounded-lg bg-[#EAE0D2] dark:bg-[#2C1E16] text-[#4A2B18] dark:text-[#E5B874]">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-3xl font-extrabold text-black dark:text-white tabular-nums">
              {wdSuccessCount}
            </span>
            <span className="text-xs font-bold text-[#147D4E] dark:text-[#6EE7A8]">
              Avg 1.2s / Flop
            </span>
          </div>
          <p className="text-xs text-[#3D322B] dark:text-[#D6C7B5]">
            {wdWaitingCount} antrian menunggu trigger
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold tracking-wide uppercase text-[#3D322B] dark:text-[#D6C7B5]">
              ANTRIAN DP PENDING
            </span>
            <div className="p-2 rounded-lg bg-[#EAE0D2] dark:bg-[#2C1E16] text-[#4A2B18] dark:text-[#E5B874]">
              <ArrowUpDown className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-3xl font-extrabold text-black dark:text-white tabular-nums">
              {pendingDpCount}
            </span>
            <span className="text-xs font-bold text-[#9A4212] dark:text-[#F4B183]">
              Perlu Verifikasi
            </span>
          </div>
          <p className="text-xs text-[#3D322B] dark:text-[#D6C7B5]">
            Validasi mutasi m-banking kasir
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold tracking-wide uppercase text-[#3D322B] dark:text-[#D6C7B5]">
              REKENING BANK CS
            </span>
            <div className="p-2 rounded-lg bg-[#EAE0D2] dark:bg-[#2C1E16] text-[#4A2B18] dark:text-[#E5B874]">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-black dark:text-white tabular-nums">
              {onlineBankCount} / {bankChannels.length}
            </span>
            <span className="text-xs font-bold text-[#147D4E] dark:text-[#6EE7A8]">
              Online
            </span>
          </div>
          <p className="text-xs text-[#3D322B] dark:text-[#D6C7B5]">
            {disruptedBankCount} bank sedang gangguan/offline
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold tracking-wide uppercase text-[#3D322B] dark:text-[#D6C7B5]">
              LAPORAN CS HARI INI
            </span>
            <div className="p-2 rounded-lg bg-[#EAE0D2] dark:bg-[#2C1E16] text-[#4A2B18] dark:text-[#E5B874]">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-3xl font-extrabold text-black dark:text-white tabular-nums">
              142
            </span>
            <span className="text-xs font-bold text-[#147D4E] dark:text-[#6EE7A8]">
              99.2% Resolved
            </span>
          </div>
          <p className="text-xs text-[#3D322B] dark:text-[#D6C7B5]">
            Respon chat rata-rata &lt; 15 detik
          </p>
        </div>
      </section>

      {/* Main Operational Split: WD Monitoring Table (Left) + Member Lookup & Bank Accounts (Right) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Monitoring Antrian WD Auto Flop */}
        <div className="lg:col-span-8 rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E5DACB] dark:border-[#332218] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-black dark:text-white">
                MONITORING ANTRIAN WD AUTO FLOP
              </h2>
              <p className="text-xs text-[#3D322B] dark:text-[#D6C7B5]">
                Transaksi penarikan dana member yang diproses via gateway otomatis
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('wd-auto-flop')}
              className="text-xs font-extrabold text-[#4A2B18] dark:text-[#E5B874] hover:underline cursor-pointer whitespace-nowrap"
            >
              Kelola Semua WD &rsaquo;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[680px]">
              <thead>
                <tr className="bg-[#F4EDE3] dark:bg-[#291C14] border-b border-[#DFD1BE] dark:border-[#3A281D] text-[11px] font-extrabold tracking-wider uppercase text-[#3D322B] dark:text-[#D6C7B5]">
                  <th className="py-3 px-4">ID &amp; WAKTU</th>
                  <th className="py-3 px-4">USER ID</th>
                  <th className="py-3 px-4">TUJUAN BANK</th>
                  <th className="py-3 px-4 text-right">NOMINAL</th>
                  <th className="py-3 px-4 text-center">STATUS</th>
                  <th className="py-3 px-4 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE0D2] dark:divide-[#2E1F16] text-xs">
                {wdQueue.slice(0, 5).map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-[#F9F5EF] dark:hover:bg-[#261A12] transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-black dark:text-white font-mono-tabular">
                        {row.id}
                      </div>
                      <div className="text-[11px] text-[#3D322B] dark:text-[#D6C7B5] font-mono-tabular">
                        {row.time}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-black dark:text-white">{row.userId}</div>
                      <div className="text-[11px] uppercase text-[#3D322B] dark:text-[#D6C7B5]">
                        {row.accountName}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-black dark:text-white">{row.bank}</div>
                      <div className="text-[11px] text-[#3D322B] dark:text-[#D6C7B5] font-mono-tabular">
                        {row.accountNumber}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-extrabold text-black dark:text-white font-mono-tabular whitespace-nowrap">
                      {formatRupiah(row.amount)}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {row.status === 'FLOP SUKSES' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#E4F4EC] text-[#0E603A] dark:bg-[#143B27] dark:text-[#7CE8AD] border border-[#9FD7B9] dark:border-[#246342]">
                          <Check className="w-3 h-3" /> FLOP SUKSES
                        </span>
                      )}
                      {row.status === 'WAITING' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#F9EDD7] text-[#854D0E] dark:bg-[#3A2810] dark:text-[#F8C471] border border-[#E6C58D] dark:border-[#69481A]">
                          WAITING
                        </span>
                      )}
                      {row.status === 'MANUAL' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#FBE7EB] text-[#9F1239] dark:bg-[#3E1621] dark:text-[#FDA4AF] border border-[#F2B8C6] dark:border-[#70263A]">
                          MANUAL
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {row.status === 'WAITING' ? (
                        <button
                          type="button"
                          onClick={() => onFlopNow(row.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#147D4E] hover:bg-[#0F633E] dark:bg-[#1E9A62] dark:hover:bg-[#177E4F] text-white text-[11px] font-extrabold tracking-wide transition-colors cursor-pointer"
                        >
                          FLOP NOW
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              `${row.userId} | ${row.bank} ${row.accountNumber} | ${formatRupiah(row.amount)}`,
                              row.id,
                              `Detail WD ${row.id}`
                            )
                          }
                          title="Salin detail transaksi"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#F4EDE3] hover:bg-[#EAE0D2] dark:bg-[#2B1D14] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#D4C4AE] dark:border-[#4D3627] transition-colors cursor-pointer"
                        >
                          {copiedId === row.id ? (
                            <Check className="w-3.5 h-3.5 text-[#147D4E] dark:text-[#6EE7A8]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Cari Cepat Member + Rekening Tujuan CS Siap Salin */}
        <div className="lg:col-span-4 space-y-6">
          {/* Cari Cepat Member & Rek */}
          <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#4A2B18] dark:text-[#E5B874]" />
              <h2 className="text-sm font-extrabold text-black dark:text-white">
                CARI CEPAT MEMBER &amp; REK
              </h2>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearchMember();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder="Ketik User ID / No Rek..."
                className="flex-1 min-w-0 px-3.5 py-2 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white placeholder-[#6B5D54] dark:placeholder-[#9E8B78] border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#4A2B18] dark:focus:ring-[#D4A373]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#4A2B18] hover:bg-[#361F11] dark:bg-[#C59656] dark:hover:bg-[#D4A76A] text-white dark:text-[#140D09] text-xs font-extrabold transition-colors cursor-pointer shrink-0"
              >
                Cek
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5">
              {['@bocahgacor88', '@zeus_mania69', '@hoki_selalu77'].map((handle) => (
                <button
                  key={handle}
                  type="button"
                  onClick={() => {
                    setLookupQuery(handle);
                    handleSearchMember(handle);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white text-[11px] font-bold transition-colors cursor-pointer"
                >
                  {handle}
                </button>
              ))}
            </div>

            {lookupResult && (
              <div className="rounded-xl bg-[#F4EDE3] dark:bg-[#291C14] border border-[#CBB9A0] dark:border-[#4D3627] p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-black dark:text-white">
                    {lookupResult.userId}
                  </span>
                  <span className="font-bold text-[#4A2B18] dark:text-[#E5B874]">
                    {lookupResult.tier}
                  </span>
                </div>
                <div className="text-[#2E241E] dark:text-[#E2D6C8]">
                  A/N: <strong className="text-black dark:text-white">{lookupResult.fullName}</strong>
                </div>
                <div className="flex items-center justify-between text-[#2E241E] dark:text-[#E2D6C8]">
                  <span>
                    {lookupResult.bank} ·{' '}
                    <span className="font-mono-tabular font-bold text-black dark:text-white">
                      {lookupResult.accountNumber}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        lookupResult.accountNumber,
                        `lookup-${lookupResult.userId}`,
                        'No Rekening Member'
                      )
                    }
                    className="text-[11px] font-extrabold text-[#4A2B18] dark:text-[#E5B874] hover:underline cursor-pointer"
                  >
                    Salin Rek
                  </button>
                </div>
                <div className="pt-1.5 border-t border-[#DFD1BE] dark:border-[#3D2B20] flex items-center justify-between">
                  <span className="text-[#3D322B] dark:text-[#D6C7B5]">Saldo Dompet:</span>
                  <span className="font-extrabold text-black dark:text-white font-mono-tabular">
                    {formatRupiah(lookupResult.balance)}
                  </span>
                </div>
              </div>
            )}

            {lookupNotFound && (
              <div className="rounded-xl bg-[#F9EDD7] dark:bg-[#3A2810] border border-[#E6C58D] dark:border-[#69481A] px-3.5 py-2.5 text-xs font-semibold text-[#7A4409] dark:text-[#F8C471]">
                User ID / No Rekening tidak ditemukan di direktori shift aktif.
              </div>
            )}
          </div>

          {/* Rekening Tujuan CS Siap Salin */}
          <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-[#4A2B18] dark:text-[#E5B874]" />
                <h2 className="text-sm font-extrabold text-black dark:text-white">
                  REK TUJUAN CS SIAP SALIN
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('edit-pembayaran')}
                className="text-xs font-extrabold text-[#4A2B18] dark:text-[#E5B874] hover:underline cursor-pointer"
              >
                Ubah
              </button>
            </div>

            <div className="space-y-2.5">
              {bankChannels.slice(0, 4).map((bank) => (
                <div
                  key={bank.id}
                  className="rounded-xl bg-[#F8F4EE] dark:bg-[#291C14] border border-[#DFD1BE] dark:border-[#3D2B20] p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-black dark:text-white">
                        {bank.bankName}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                          bank.status === 'ONLINE'
                            ? 'bg-[#E4F4EC] text-[#0E603A] dark:bg-[#143B27] dark:text-[#7CE8AD]'
                            : bank.status === 'GANGGUAN'
                              ? 'bg-[#F9EDD7] text-[#854D0E] dark:bg-[#3A2810] dark:text-[#F8C471]'
                              : 'bg-[#FBE7EB] text-[#9F1239] dark:bg-[#3E1621] dark:text-[#FDA4AF]'
                        }`}
                      >
                        {bank.status}
                      </span>
                    </div>
                    <div className="text-sm font-extrabold text-black dark:text-white font-mono-tabular mt-0.5">
                      {bank.accountNumber}
                    </div>
                    <div className="text-[11px] font-medium text-[#3D322B] dark:text-[#D6C7B5] truncate">
                      A/N {bank.holderName}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `${bank.bankName} ${bank.accountNumber} A/N ${bank.holderName}`,
                        bank.id,
                        `Rekening ${bank.bankName}`
                      )
                    }
                    title={`Salin rekening ${bank.bankName}`}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white hover:bg-[#EAE0D2] dark:bg-[#1F150F] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] transition-colors shrink-0 cursor-pointer"
                  >
                    {copiedId === bank.id ? (
                      <Check className="w-4 h-4 text-[#147D4E] dark:text-[#6EE7A8]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
