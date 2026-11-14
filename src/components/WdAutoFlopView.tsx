import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowUpDown,
  Clock,
  Copy,
  FileSpreadsheet,
  Layers,
  TableProperties,
  Trash2,
} from 'lucide-react';
import {
  ExportDelimiter,
  SortDirectionMode,
  formatWdRowForExport,
  parseWdRawText,
  sortWdRows,
} from '../utils/wdParser';

interface WdAutoFlopViewProps {
  onCopyText: (text: string, label: string, customToast?: string) => void;
}

type AutoClearDelay = 0 | 3 | 5 | 10;

export const WdAutoFlopView: React.FC<WdAutoFlopViewProps> = ({ onCopyText }) => {
  const [rawInput, setRawInput] = useState('');
  const [delimiter, setDelimiter] = useState<ExportDelimiter>('TAB');
  const [sortMode, setSortMode] = useState<SortDirectionMode>('MUTASI_ASC');
  const [autoClearDelay, setAutoClearDelay] = useState<AutoClearDelay>(0);
  const [removedUids, setRemovedUids] = useState<Set<string>>(() => new Set());
  const [pendingClearSeconds, setPendingClearSeconds] = useState<number | null>(null);

  const clearTimerRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
      if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const cancelPendingClear = () => {
    if (clearTimerRef.current) {
      window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setPendingClearSeconds(null);
  };

  const parsedResult = useMemo(() => parseWdRawText(rawInput), [rawInput]);

  const displayRows = useMemo(() => {
    const visible = parsedResult.rows.filter((r) => !removedUids.has(r.uid));
    return sortWdRows(visible, sortMode);
  }, [parsedResult.rows, removedUids, sortMode]);

  const handleInputChange = (val: string) => {
    cancelPendingClear();
    setRawInput(val);
    if (removedUids.size > 0) {
      setRemovedUids(new Set());
    }
  };

  const resetAllDataAndFormat = () => {
    cancelPendingClear();
    setRawInput('');
    setRemovedUids(new Set());
  };

  const handleCopyAll = () => {
    if (displayRows.length === 0) return;

    const outputLines = displayRows.map((row) =>
      formatWdRowForExport(row, delimiter)
    );
    const payload = outputLines.join('\n');
    const rowCount = displayRows.length;

    if (autoClearDelay === 0) {
      onCopyText(
        payload,
        `Salin Semua (${rowCount} baris)`,
        `Berhasil menyalin ${rowCount} baris! Data dan tabel otomatis dihapus.`
      );
      resetAllDataAndFormat();
    } else {
      onCopyText(
        payload,
        `Salin Semua (${rowCount} baris)`,
        `Berhasil menyalin ${rowCount} baris! Data dan tabel terhapus dalam ${autoClearDelay} detik.`
      );
      cancelPendingClear();
      setPendingClearSeconds(autoClearDelay);

      countdownIntervalRef.current = window.setInterval(() => {
        setPendingClearSeconds((prev) => (prev !== null && prev > 1 ? prev - 1 : prev));
      }, 1000);

      clearTimerRef.current = window.setTimeout(() => {
        resetAllDataAndFormat();
      }, autoClearDelay * 1000);
    }
  };

  const handleCopySingleRow = (rowIdx: number) => {
    const row = displayRows[rowIdx];
    if (!row) return;
    const line = formatWdRowForExport(row, delimiter);
    onCopyText(
      line,
      `Baris ${row.userId}`,
      `Berhasil menyalin data WD ${row.userId} (${row.amountFormatted})`
    );
  };

  const toggleSortMode = () => {
    setSortMode((prev) => (prev === 'MUTASI_ASC' ? 'ASLI' : 'MUTASI_ASC'));
  };

  const sortLabel =
    sortMode === 'MUTASI_ASC' ? 'BAWAH KE ATAS (MUTASI)' : 'URUTAN ASLI (TEMPEL)';

  return (
    <div className="space-y-5">
      {/* Top Module Header Card */}
      <section className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#4A2B18] dark:bg-[#C59656] text-white dark:text-[#140D09] flex items-center justify-center shrink-0">
            <TableProperties className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-black dark:text-white">
                AUTO WD FLOP (4 KOLOM)
              </h1>
              <span className="px-2.5 py-0.5 rounded-md bg-[#147D4E] text-white text-[11px] font-extrabold font-mono-tabular">
                {displayRows.length} BARIS
              </span>
            </div>
            <p className="text-xs text-[#3D322B] dark:text-[#D6C7B5] mt-0.5">
              Parser Otomatis Antrean Withdraw 4 Kolom (Waktu, User, Bank Asal, Amount)
            </p>
          </div>
        </div>

        {/* Auto Clear Timer Selector */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#F4EDE3] dark:bg-[#140D09] border border-[#D4C4AE] dark:border-[#C59656]/60">
            <span className="text-[11px] font-extrabold tracking-wide uppercase text-[#3D322B] dark:text-[#D6C7B5] px-1">
              AUTO CLEAR:
            </span>
            {([0, 3, 5, 10] as AutoClearDelay[]).map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setAutoClearDelay(sec)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
                  autoClearDelay === sec
                    ? 'bg-[#4A2B18] text-white dark:bg-[#C59656] dark:text-[#140D09]'
                    : 'text-black dark:text-white hover:bg-[#E5DACB] dark:hover:bg-[#2A1D15]'
                }`}
              >
                {sec === 0 ? 'LANGSUNG' : `${sec}s`}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Paste Input & Format Toolbar Card */}
      <section className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 p-5 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-black dark:text-white">
              TEMPEL FORMAT DATA WD
            </span>
            <span className="px-2.5 py-0.5 rounded bg-[#EAE0D2] dark:bg-[#2C1E16] text-[#4A2B18] dark:text-[#E5B874] text-[11px] font-extrabold font-mono-tabular border border-[#CBB9A0] dark:border-[#D4A373]/75">
              {displayRows.length} BARIS SIAP SALIN
            </span>
            {pendingClearSeconds !== null && (
              <span className="px-2.5 py-0.5 rounded bg-[#F9EDD7] text-[#854D0E] dark:bg-[#3A2810] dark:text-[#F8C471] text-[11px] font-extrabold">
                Terhapus dalam {pendingClearSeconds}s...
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleCopyAll}
            disabled={displayRows.length === 0}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap ${
              displayRows.length > 0
                ? 'bg-[#4A2B18] hover:bg-[#361F11] dark:bg-[#C59656] dark:hover:bg-[#D4A76A] text-white dark:text-[#140D09] cursor-pointer shadow-xs'
                : 'bg-[#E8E2DA] dark:bg-[#2A1F18] text-[#8D8178] dark:text-[#6E5E52] cursor-not-allowed'
            }`}
          >
            <Copy className="w-4 h-4" />
            <span>SALIN SEMUA</span>
          </button>
        </div>

        <textarea
          rows={6}
          value={rawInput}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Tempel / Paste data mentah withdraw di sini... (Data otomatis diparsing ke 4 kolom: Waktu, User ID, Bank Asal, Amount)"
          className="w-full p-4 rounded-xl bg-[#FAF6F0] dark:bg-[#140D09] text-black dark:text-white placeholder-[#6B5D54] dark:placeholder-[#9E8B78] border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-mono-tabular leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#4A2B18] dark:focus:ring-[#D4A373]"
        />

        {/* Format, Time 24H, & Sort Controls */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#3D322B] dark:text-[#D6C7B5] mr-1">
                FORMAT:
              </span>
              {(
                [
                  { id: 'TAB', label: 'TAB (EXCEL)' },
                  { id: 'PIPE', label: 'PIPE (|)' },
                  { id: 'COMMA', label: 'KOMA (,)' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDelimiter(opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold border transition-colors cursor-pointer whitespace-nowrap ${
                    delimiter === opt.id
                      ? 'bg-[#C59656] text-[#140D09] border-[#A87A3E] dark:bg-[#D4A373] dark:text-[#140D09]'
                      : 'bg-white dark:bg-[#241811] text-black dark:text-white border-[#CBB9A0] dark:border-[#D4A373]/75 hover:bg-[#F4EDE3] dark:hover:bg-[#2F2017]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F4EDE3] dark:bg-[#291C14] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-[11px] font-extrabold whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 text-[#4A2B18] dark:text-[#E5B874]" />
              <span>JAM: 24 JAM (HH:MM:SS)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#3D322B] dark:text-[#D6C7B5]">
                SUSUNAN:
              </span>
              <button
                type="button"
                onClick={toggleSortMode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#147D4E] hover:bg-[#0F633E] text-white text-[11px] font-extrabold cursor-pointer whitespace-nowrap transition-colors"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>{sortLabel}</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-[#3D322B] dark:text-[#D6C7B5]">
            Kolom Otomatis:{' '}
            <span className="font-mono-tabular font-semibold text-black dark:text-white">
              A (Waktu) · B (User) · C (Bank Asal) · D (Kosong) · E (Amount)
            </span>
          </p>
        </div>
      </section>

      {/* Parsed Results Table Card */}
      <section className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-[#E5DACB] dark:border-[#C59656]/35 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C59656]/25 dark:bg-[#C59656]/20 text-[#4A2B18] dark:text-[#E5B874] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-black dark:text-white">
              HASIL PARSING ({displayRows.length} BARIS)
            </h2>
            {parsedResult.detectedFormats.map((fmt) => (
              <span
                key={fmt}
                className="px-2 py-0.5 rounded bg-[#EAE0D2] dark:bg-[#2C1E16] text-black dark:text-white text-[10px] font-extrabold border border-[#CBB9A0] dark:border-[#D4A373]/75"
              >
                {fmt === 'FORMAT_1' ? 'FORMAT 1' : 'FORMAT 2'}
              </span>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[780px]">
            <thead>
              <tr className="bg-[#FAF6F0] dark:bg-[#291C14] border-b border-[#DFD1BE] dark:border-[#C59656]/60 text-[11px] font-extrabold uppercase tracking-wider text-black dark:text-white">
                <th className="py-3 px-4 w-12 text-[#3D322B] dark:text-[#D6C7B5]">#</th>
                <th className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-[#B45309] text-white text-[10px] inline-flex items-center justify-center font-extrabold">
                      A
                    </span>
                    <span>WAKTU</span>
                  </span>
                </th>
                <th className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-[#1D4ED8] text-white text-[10px] inline-flex items-center justify-center font-extrabold">
                      B
                    </span>
                    <span>USER ID</span>
                  </span>
                </th>
                <th className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-[#6D28D9] text-white text-[10px] inline-flex items-center justify-center font-extrabold">
                      C
                    </span>
                    <span>BANK ASAL (NAMA, REK, BANK)</span>
                  </span>
                </th>
                <th className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5 text-[#3D322B] dark:text-[#D6C7B5]">
                    <span className="w-4 h-4 rounded bg-[#6B5D54] text-white text-[10px] inline-flex items-center justify-center font-extrabold">
                      D
                    </span>
                    <span>(KOSONG)</span>
                  </span>
                </th>
                <th className="py-3 px-4 text-right">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-[#147D4E] text-white text-[10px] inline-flex items-center justify-center font-extrabold">
                      E
                    </span>
                    <span>AMOUNT / NOMINAL</span>
                  </span>
                </th>
                <th className="py-3 px-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE0D2] dark:divide-[#C59656]/30 text-xs">
              {displayRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 px-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-2.5 max-w-md mx-auto">
                      <div className="w-10 h-10 rounded-full bg-[#F4EDE3] dark:bg-[#291C14] border border-[#D4C4AE] dark:border-[#C59656]/60 flex items-center justify-center text-[#4A2B18] dark:text-[#E5B874]">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-[#3D322B] dark:text-[#D6C7B5]">
                        Belum ada data yang diparsing. Tempel data mentah withdraw di kolom atas.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayRows.map((row, idx) => (
                  <tr
                    key={row.uid}
                    className="hover:bg-[#F9F5EF] dark:hover:bg-[#261A12] transition-colors"
                  >
                    <td className="py-3 px-4 font-mono-tabular font-bold text-[#3D322B] dark:text-[#D6C7B5]">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono-tabular font-bold text-black dark:text-white whitespace-nowrap">
                      {row.time24}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-black dark:text-white whitespace-nowrap">
                      {row.userId}
                    </td>
                    <td className="py-3 px-4 font-medium text-black dark:text-white">
                      {row.bankAsal}
                    </td>
                    <td className="py-3 px-4 text-[#8D8178] dark:text-[#6E5E52] font-mono-tabular">
                      —
                    </td>
                    <td className="py-3 px-4 text-right font-mono-tabular font-extrabold text-black dark:text-white whitespace-nowrap">
                      {row.amountFormatted}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopySingleRow(idx)}
                          title="Salin baris ini"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#F4EDE3] hover:bg-[#EAE0D2] dark:bg-[#2B1D14] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#D4C4AE] dark:border-[#D4A373]/75 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setRemovedUids((prev) => new Set(prev).add(row.uid))
                          }
                          title="Hapus baris dari tabel"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white hover:bg-[#FBE7EB] dark:bg-[#1F150F] dark:hover:bg-[#3E1621] text-[#9F1239] dark:text-[#FDA4AF] border border-[#D4C4AE] dark:border-[#D4A373]/75 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="px-5 py-3 bg-[#FAF6F0] dark:bg-[#19100B] border-t border-[#E5DACB] dark:border-[#C59656]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#3D322B] dark:text-[#D6C7B5]">
          <div className="flex items-center gap-2 italic">
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#4A2B18] dark:text-[#E5B874] shrink-0" />
            <span>
              Kolom D sengaja dikosongkan agar saat di-copy dan ditempel ke Excel, nominal otomatis
              tepat masuk di Kolom E.
            </span>
          </div>
          <span className="font-extrabold text-black dark:text-white whitespace-nowrap">
            Total {displayRows.length} Baris Siap Ekspor
          </span>
        </div>
      </section>
    </div>
  );
};
