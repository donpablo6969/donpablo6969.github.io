import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  FileSpreadsheet,
  RotateCcw,
  Scale,
  Search,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  buildCopySummary,
  buildExportCsv,
  compareLedgers,
  CompareSourceSide,
  detectColumns,
  DiffResultItem,
  extractExcelSheetRows,
  formatCompareNumber,
  LoadedCompareFile,
  NumberFormatMode,
  parseCSV,
  readCompareFile,
  SkippedRowItem,
} from '../utils/fileCompare';

interface AdminVsGarudaViewProps {
  onCopyText: (text: string, label: string, customToast?: string) => void;
}

interface SideSlotState {
  fileData: LoadedCompareFile | null;
  metaText: string;
  isLoading: boolean;
  isError: boolean;
  idCol: string;
  valCol: string;
  mode: NumberFormatMode;
  isDragging: boolean;
}

const createEmptySlot = (): SideSlotState => ({
  fileData: null,
  metaText: 'Belum ada file dipilih',
  isLoading: false,
  isError: false,
  idCol: '',
  valCol: '',
  mode: 'auto',
  isDragging: false,
});

export const AdminVsGarudaView: React.FC<AdminVsGarudaViewProps> = ({
  onCopyText,
}) => {
  const [slotA, setSlotA] = useState<SideSlotState>(createEmptySlot);
  const [slotB, setSlotB] = useState<SideSlotState>(createEmptySlot);

  const [compared, setCompared] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [results, setResults] = useState<DiffResultItem[]>([]);
  const [skipped, setSkipped] = useState<SkippedRowItem[]>([]);
  const [stats, setStats] = useState<[number, number, number, number] | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [compareStatus, setCompareStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const inputRefA = useRef<HTMLInputElement | null>(null);
  const inputRefB = useRef<HTMLInputElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const generationsRef = useRef<[number, number]>([0, 0]);

  const invalidateComparison = () => {
    setCompared(false);
    setResults([]);
    setSkipped([]);
    setStats(null);
    setCompareStatus('');
    setErrorMsg('');
  };

  const applyParsedFile = (
    sideIndex: 0 | 1,
    loaded: LoadedCompareFile
  ): { idCol: string; valCol: string } => {
    const detected = detectColumns(loaded.rows[0]);
    const idCol = detected.id >= 0 ? String(detected.id) : '';
    const valCol = detected.val >= 0 ? String(detected.val) : '';
    const rowCount = (loaded.rows.length - 1).toLocaleString('id-ID');
    const colSummary =
      detected.id >= 0 && detected.val >= 0
        ? `${loaded.rows[0][detected.id]} + ${loaded.rows[0][detected.val]}`
        : 'Pilih kolom User ID dan nominal secara manual';

    const metaText = `${loaded.name} • ${rowCount} baris • Kolom: ${colSummary}`;

    const updater = (prev: SideSlotState): SideSlotState => ({
      ...prev,
      fileData: loaded,
      metaText,
      isLoading: false,
      isError: false,
      idCol,
      valCol,
    });

    if (sideIndex === 0) setSlotA(updater);
    else setSlotB(updater);

    return { idCol, valCol };
  };

  const handleFileChange = async (sideIndex: 0 | 1, file: File | null) => {
    const gen = ++generationsRef.current[sideIndex];
    const setSlot = sideIndex === 0 ? setSlotA : setSlotB;
    const sideLabel = sideIndex === 0 ? 'A' : 'B';

    invalidateComparison();

    if (!file) {
      setSlot((prev) => ({
        ...prev,
        fileData: null,
        metaText: 'Belum ada file dipilih',
        isLoading: false,
        isError: false,
        idCol: '',
        valCol: '',
      }));
      return;
    }

    setSlot((prev) => ({
      ...prev,
      fileData: null,
      metaText: `Membaca ${file.name}...`,
      isLoading: true,
      isError: false,
      idCol: '',
      valCol: '',
    }));

    try {
      const loaded = await readCompareFile(file);
      if (gen !== generationsRef.current[sideIndex]) return;
      applyParsedFile(sideIndex, loaded);
    } catch (e) {
      if (gen !== generationsRef.current[sideIndex]) return;
      const msg = e instanceof Error ? e.message : String(e);
      setSlot((prev) => ({
        ...prev,
        fileData: null,
        metaText: `${file.name} • Gagal dibaca`,
        isLoading: false,
        isError: true,
        idCol: '',
        valCol: '',
      }));
      setErrorMsg(`File ${sideLabel}: ${msg}`);
    }
  };

  const handleSheetChange = (sideIndex: 0 | 1, sheetName: string) => {
    const slot = sideIndex === 0 ? slotA : slotB;
    const setSlot = sideIndex === 0 ? setSlotA : setSlotB;
    if (!slot.fileData?.workbook) return;

    invalidateComparison();
    try {
      const rows = extractExcelSheetRows(slot.fileData.workbook, sheetName);
      applyParsedFile(sideIndex, {
        ...slot.fileData,
        selectedSheet: sheetName,
        rows,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setSlot((prev) => ({
        ...prev,
        fileData: null,
        metaText: `${slot.fileData?.name || 'Excel'} • Gagal dibaca`,
        isError: true,
        idCol: '',
        valCol: '',
      }));
      setErrorMsg(msg);
    }
  };

  const executeComparison = async (
    customSlotA?: {
      rows: string[][];
      idCol: string;
      valCol: string;
      mode: NumberFormatMode;
    },
    customSlotB?: {
      rows: string[][];
      idCol: string;
      valCol: string;
      mode: NumberFormatMode;
    }
  ) => {
    const dataA = customSlotA || (slotA.fileData ? {
      rows: slotA.fileData.rows,
      idCol: slotA.idCol,
      valCol: slotA.valCol,
      mode: slotA.mode,
    } : null);

    const dataB = customSlotB || (slotB.fileData ? {
      rows: slotB.fileData.rows,
      idCol: slotB.idCol,
      valCol: slotB.valCol,
      mode: slotB.mode,
    } : null);

    if (!dataA || !dataB) {
      setErrorMsg(
        'Silakan pilih kedua file Admin dan GARUDA, lalu tunggu sampai selesai dibaca.'
      );
      return;
    }

    setIsComparing(true);
    setErrorMsg('');
    setCompareStatus('');
    setResults([]);
    setSkipped([]);
    setCompared(false);

    await new Promise((resolve) => setTimeout(resolve, 80));

    try {
      const out = compareLedgers({
        rowsA: dataA.rows,
        idColA: dataA.idCol,
        valColA: dataA.valCol,
        modeA: dataA.mode,
        rowsB: dataB.rows,
        idColB: dataB.idCol,
        valColB: dataB.valCol,
        modeB: dataB.mode,
      });

      const mismatchTotal = out.onlyA + out.onlyB;
      setResults(out.results);
      setSkipped(out.skipped);
      setStats([out.matched, out.onlyA, out.onlyB, mismatchTotal]);
      setCompared(true);
      setCompareStatus(
        `Perbandingan selesai. ${formatCompareNumber(
          out.matched
        )} transaksi cocok dan ${formatCompareNumber(
          mismatchTotal
        )} transaksi tidak cocok.`
      );

      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setResults([]);
      setCompared(false);
      setStats(null);
      setCompareStatus('');
      setErrorMsg(msg);
    } finally {
      setIsComparing(false);
    }
  };

  const handleLoadDemo = () => {
    try {
      const rowsA = parseCSV(
        'User ID;Nominal\nandi01;100000\nbudi02;75000\ncitra03;50000\n00045;25000'
      );
      const rowsB = parseCSV(
        'Username;Amount\nandi01;120000\nbudi02;75000\ndewi04;60000\n00045;25000'
      );

      if (inputRefA.current) inputRefA.current.value = '';
      if (inputRefB.current) inputRefB.current.value = '';

      const colsA = applyParsedFile(0, {
        name: 'contoh-A.csv',
        rows: rowsA,
        workbook: null,
        sheetNames: [],
        selectedSheet: '',
      });

      const colsB = applyParsedFile(1, {
        name: 'contoh-B.csv',
        rows: rowsB,
        workbook: null,
        sheetNames: [],
        selectedSheet: '',
      });

      executeComparison(
        { rows: rowsA, idCol: colsA.idCol, valCol: colsA.valCol, mode: 'auto' },
        { rows: rowsB, idCol: colsB.idCol, valCol: colsB.valCol, mode: 'auto' }
      );
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
    }
  };

  const handleReset = () => {
    generationsRef.current[0]++;
    generationsRef.current[1]++;
    if (inputRefA.current) inputRefA.current.value = '';
    if (inputRefB.current) inputRefB.current.value = '';
    setSlotA(createEmptySlot());
    setSlotB(createEmptySlot());
    setSearchQuery('');
    invalidateComparison();
  };

  const visibleRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return results.filter((r) => !q || r.id.toLowerCase().includes(q));
  }, [results, searchQuery]);

  const groupA = useMemo(
    () => visibleRows.filter((r) => r.source === 'A'),
    [visibleRows]
  );
  const groupB = useMemo(
    () => visibleRows.filter((r) => r.source === 'B'),
    [visibleRows]
  );

  const amountACents = useMemo(
    () => groupA.reduce((sum, r) => sum + r.nominal, 0),
    [groupA]
  );
  const amountBCents = useMemo(
    () => groupB.reduce((sum, r) => sum + r.nominal, 0),
    [groupB]
  );
  const totalCombinedCents = amountACents + amountBCents;
  const netDiffCents = amountACents - amountBCents;

  const handleExportCsv = () => {
    const csv = buildExportCsv(visibleRows);
    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hasil-perbandingan-admin-vs-garuda.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleCopySide = (side?: CompareSourceSide) => {
    const summary = buildCopySummary(visibleRows, side);
    const label =
      side === 'A'
        ? 'Selisih Lebih di Admin'
        : side === 'B'
          ? 'Selisih Lebih di GARUDA'
          : 'Hasil Selisih Admin vs GARUDA';
    onCopyText(summary, label, 'Data berhasil disalin ke clipboard');
  };

  const renderUploadCard = (
    sideIndex: 0 | 1,
    badgeNumber: string,
    title: string,
    dropPrompt: string,
    slot: SideSlotState,
    setSlot: React.Dispatch<React.SetStateAction<SideSlotState>>,
    inputRef: React.RefObject<HTMLInputElement | null>
  ) => {
    const headers = slot.fileData?.rows[0] || [];
    const hasFile = Boolean(slot.fileData);

    return (
      <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-5 space-y-4 shadow-xs">
        {/* Card Header */}
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-[#EAE0D2] dark:bg-[#2E2017] border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-extrabold font-mono-tabular text-[#4A2B18] dark:text-[#E5B874]">
            {badgeNumber}
          </span>
          <h2 className="text-base font-extrabold text-black dark:text-white">
            {title}
          </h2>
        </div>

        {/* Dashed Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setSlot((prev) => ({ ...prev, isDragging: true }));
          }}
          onDragLeave={() => {
            setSlot((prev) => ({ ...prev, isDragging: false }));
          }}
          onDrop={(e) => {
            e.preventDefault();
            setSlot((prev) => ({ ...prev, isDragging: false }));
            const droppedFile = e.dataTransfer.files?.[0] || null;
            if (droppedFile) handleFileChange(sideIndex, droppedFile);
          }}
          className={`rounded-xl border-2 border-dashed px-4 py-4 transition-colors text-center ${
            slot.isDragging
              ? 'border-[#4A2B18] bg-[#EFE7DC] dark:border-[#C59656] dark:bg-[#2B1D14]'
              : 'border-[#CBB9A0] dark:border-[#4D3627] bg-[#F8F4EE] dark:bg-[#140D09]'
          }`}
        >
          <p className="text-xs font-extrabold text-[#4A2B18] dark:text-[#E5B874] mb-2">
            {dropPrompt}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.tsv,.txt,.xlsx,.xls"
              onChange={(e) =>
                handleFileChange(sideIndex, e.target.files?.[0] || null)
              }
              className="hidden"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#B8A286] dark:border-[#5C4130] text-xs font-extrabold cursor-pointer whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Pilih File</span>
            </button>
            <span className="text-xs font-semibold text-[#3D322B] dark:text-[#D6C7B5] truncate max-w-[240px]">
              {slot.fileData ? slot.fileData.name : 'Tidak ada file yang dipilih'}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-[#5D4C3E] dark:text-[#B8A592]">
            Mendukung .csv, .tsv, .txt, .xlsx, .xls (klik atau seret file ke sini)
          </p>
        </div>

        {/* File Meta Line */}
        <div
          className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border ${
            slot.isError
              ? 'bg-[#FBE7EB] dark:bg-[#3E1621] border-[#F4B6C2] dark:border-[#6B2135] text-[#9F1239] dark:text-[#FDA4AF]'
              : hasFile
                ? 'bg-[#F4EDE3] dark:bg-[#261A12] border-[#DFD1BE] dark:border-[#3A281D] text-black dark:text-white'
                : 'bg-[#F8F4EE] dark:bg-[#18100B] border-[#E5DACB] dark:border-[#2E1F16] text-[#5D4C3E] dark:text-[#B8A592]'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-[#4A2B18] dark:text-[#E5B874]" />
          <span className="truncate">{slot.metaText}</span>
        </div>

        {/* Optional Multi-Sheet Excel Selector */}
        {slot.fileData && slot.fileData.sheetNames.length >= 2 && (
          <div>
            <label className="block text-xs font-extrabold text-black dark:text-white mb-1">
              Sheet Excel
            </label>
            <select
              value={slot.fileData.selectedSheet}
              onChange={(e) => handleSheetChange(sideIndex, e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#4A2B18] dark:focus:ring-[#C59656]"
            >
              {slot.fileData.sheetNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Column Mapping Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-extrabold text-black dark:text-white mb-1">
              Kolom User ID
            </label>
            <select
              disabled={!hasFile}
              value={slot.idCol}
              onChange={(e) => {
                const val = e.target.value;
                setSlot((prev) => ({ ...prev, idCol: val }));
                invalidateComparison();
              }}
              className="w-full px-3 py-2 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#4A2B18] dark:focus:ring-[#C59656]"
            >
              {!hasFile ? (
                <option value="">—</option>
              ) : (
                <>
                  <option value="">Pilih kolom...</option>
                  {headers.map((h, idx) => (
                    <option key={idx} value={String(idx)}>
                      {h || `Kolom ${idx + 1}`}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-black dark:text-white mb-1">
              Kolom nominal
            </label>
            <select
              disabled={!hasFile}
              value={slot.valCol}
              onChange={(e) => {
                const val = e.target.value;
                setSlot((prev) => ({ ...prev, valCol: val }));
                invalidateComparison();
              }}
              className="w-full px-3 py-2 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#4A2B18] dark:focus:ring-[#C59656]"
            >
              {!hasFile ? (
                <option value="">—</option>
              ) : (
                <>
                  <option value="">Pilih kolom...</option>
                  {headers.map((h, idx) => (
                    <option key={idx} value={String(idx)}>
                      {h || `Kolom ${idx + 1}`}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        </div>

        {/* Number Format Mode */}
        <div>
          <label className="block text-xs font-extrabold text-black dark:text-white mb-1">
            Format angka
          </label>
          <select
            value={slot.mode}
            onChange={(e) => {
              const mode = e.target.value as NumberFormatMode;
              setSlot((prev) => ({ ...prev, mode }));
              invalidateComparison();
            }}
            className="w-full px-3 py-2 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#4A2B18] dark:focus:ring-[#C59656]"
          >
            <option value="auto">Otomatis</option>
            <option value="id">Indonesia (1.000,50)</option>
            <option value="en">Internasional (1,000.50)</option>
          </select>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#4A2B18] dark:text-[#E5B874] mb-1">
          <Scale className="w-4 h-4" />
          <span>MODUL AUDIT CARI SELISIH · BANDING FILE</span>
        </div>
        <h1 className="text-2xl font-extrabold text-black dark:text-white">
          ADMIN vs GARUDA
        </h1>
        <p className="text-xs sm:text-sm text-[#3D322B] dark:text-[#D6C7B5] mt-1">
          Masukkan laporan Admin di File A dan laporan GARUDA di File B. Hasil utama
          menampilkan transaksi di File B yang tidak memiliki pasangan User ID dan
          nominal yang sama di File A.
        </p>
      </div>

      {/* Dual File Upload Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {renderUploadCard(
          0,
          '01',
          'File A — Admin Report',
          'Pilih file pembanding A',
          slotA,
          setSlotA,
          inputRefA
        )}
        {renderUploadCard(
          1,
          '02',
          'File B — GARUDA acuan',
          'Pilih file pembanding B',
          slotB,
          setSlotB,
          inputRefB
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={isComparing}
          onClick={() => executeComparison()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4A2B18] hover:bg-[#361F11] dark:bg-[#C59656] dark:hover:bg-[#B58342] text-white dark:text-[#140D09] text-xs font-extrabold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap shrink-0 shadow-xs"
        >
          <span>
            {isComparing ? 'Sedang membandingkan...' : 'Bandingkan file'}
          </span>
          {!isComparing && <ArrowRight className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-[#F4EDE3] dark:bg-[#211711] dark:hover:bg-[#2C1E16] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-extrabold cursor-pointer whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        <button
          type="button"
          onClick={handleLoadDemo}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-extrabold cursor-pointer whitespace-nowrap shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#4A2B18] dark:text-[#E5B874]" />
          <span>Coba data contoh</span>
        </button>

        <span className="text-xs text-[#3D322B] dark:text-[#D6C7B5]">
          User ID dan nominal harus sama. Transaksi duplikat dipasangkan satu per
          satu. Huruf besar/kecil User ID dibedakan.
        </span>
      </div>

      {/* Error / Status Messages */}
      {errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[#FBE7EB] dark:bg-[#3E1621] border border-[#F4B6C2] dark:border-[#6B2135] text-xs font-bold text-[#9F1239] dark:text-[#FDA4AF]"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {compareStatus && !errorMsg && (
        <div
          role="status"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E4F4EC] dark:bg-[#143B27] border border-[#A7DFC1] dark:border-[#236342] text-xs font-extrabold text-[#0E603A] dark:text-[#7CE8AD]"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{compareStatus}</span>
        </div>
      )}

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Transaksi cocok', val: stats ? stats[0] : null },
          { label: 'Hanya di File A', val: stats ? stats[1] : null },
          { label: 'Tanpa pasangan di A', val: stats ? stats[2] : null },
          { label: 'Total transaksi tidak cocok', val: stats ? stats[3] : null },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-4 shadow-xs"
          >
            <div className="text-xs font-bold text-[#3D322B] dark:text-[#D6C7B5]">
              {card.label}
            </div>
            <div className="mt-2 text-2xl font-extrabold font-mono-tabular text-black dark:text-white">
              {card.val !== null ? formatCompareNumber(card.val) : '—'}
            </div>
          </div>
        ))}
      </div>

      {/* Collapsible Skipped Rows Details */}
      {skipped.length > 0 && (
        <details className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] px-4 py-3 text-xs">
          <summary className="font-extrabold text-[#4A2B18] dark:text-[#E5B874] cursor-pointer select-none">
            {skipped.length} baris tanpa User ID dilewati — klik untuk melihat
          </summary>
          <div className="mt-3 max-h-48 overflow-y-auto space-y-1.5 border-t border-[#E5DACB] dark:border-[#332218] pt-2.5 font-mono-tabular text-black dark:text-white">
            {skipped.map((item, idx) => (
              <p key={idx}>
                File {item.file} • Baris {item.row} • Nominal: {item.nominal}
              </p>
            ))}
          </div>
        </details>
      )}

      {/* Main Results Container */}
      <section
        ref={resultsRef}
        className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] overflow-hidden shadow-xs"
      >
        {/* Results Toolbar */}
        <div className="p-4 sm:p-5 border-b border-[#E5DACB] dark:border-[#332218] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-base sm:text-lg font-extrabold text-black dark:text-white">
            Hasil — Selisih Admin dan GARUDA
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-[#5D4C3E] dark:text-[#B8A592] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari User ID..."
                className="w-full sm:w-52 pl-8 pr-3 py-2 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-semibold placeholder:text-[#7A6858] dark:placeholder:text-[#8E7A66] focus:outline-none focus:ring-2 focus:ring-[#4A2B18] dark:focus:ring-[#C59656]"
              />
            </div>

            <button
              type="button"
              disabled={!compared || visibleRows.length === 0}
              onClick={() => handleCopySide()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#4A2B18] hover:bg-[#361F11] dark:bg-[#C59656] dark:hover:bg-[#B58342] text-white dark:text-[#140D09] text-xs font-extrabold cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Salin hasil</span>
            </button>

            <button
              type="button"
              disabled={!compared || visibleRows.length === 0}
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F4EDE3] dark:bg-[#211711] dark:hover:bg-[#2C1E16] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-extrabold cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh CSV</span>
            </button>
          </div>
        </div>

        {/* Two-Column Split Result Tables */}
        <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left Panel: Lebih di Admin */}
          <div className="rounded-xl border border-[#DFD1BE] dark:border-[#3A281D] bg-[#FCF9F5] dark:bg-[#18100B] flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E5DACB] dark:border-[#332218] flex items-center justify-between gap-2 bg-[#F4EDE3] dark:bg-[#261A12]">
              <div className="flex items-baseline gap-2 min-w-0">
                <h3 className="text-sm font-extrabold text-black dark:text-white truncate">
                  Lebih di Admin
                </h3>
                <span className="text-xs font-bold font-mono-tabular text-[#5D4C3E] dark:text-[#D6C7B5] whitespace-nowrap">
                  ({groupA.length} transaksi)
                </span>
              </div>
              <button
                type="button"
                disabled={!compared || groupA.length === 0}
                onClick={() => handleCopySide('A')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#4A2B18] hover:bg-[#361F11] dark:bg-[#C59656] dark:hover:bg-[#B58342] text-white dark:text-[#140D09] text-[11px] font-extrabold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
              >
                <Copy className="w-3 h-3" />
                <span>Salin Admin</span>
              </button>
            </div>

            <div className="flex-1 overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#F8F4EE] dark:bg-[#1F150F] border-b border-[#DFD1BE] dark:border-[#3A281D]">
                  <tr className="text-[11px] font-extrabold uppercase tracking-wider text-[#3D322B] dark:text-[#D6C7B5]">
                    <th className="py-2.5 px-4">User ID</th>
                    <th className="py-2.5 px-4 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE0D2] dark:divide-[#2E1F16] text-xs">
                  {groupA.map((r, idx) => (
                    <tr
                      key={`${r.id}-${r.nominal}-${idx}`}
                      className="hover:bg-[#F4EDE3] dark:hover:bg-[#241811]"
                    >
                      <td className="py-2.5 px-4 font-extrabold text-black dark:text-white">
                        {r.id}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono-tabular font-bold text-black dark:text-white">
                        {formatCompareNumber(r.nominal / 100)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {groupA.length === 0 && (
                <div className="py-8 px-4 text-center text-xs font-semibold text-[#5D4C3E] dark:text-[#B8A592]">
                  {compared
                    ? 'Tidak ada selisih yang sesuai pencarian.'
                    : 'Hasil muncul setelah kedua file dibandingkan.'}
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-[#DFD1BE] dark:border-[#3A281D] bg-[#EFE7DC] dark:bg-[#221710] flex items-center justify-between text-xs font-extrabold">
              <span className="text-black dark:text-white">
                Total lebih di Admin
              </span>
              <span className="font-mono-tabular text-black dark:text-white">
                {formatCompareNumber(amountACents / 100)}
              </span>
            </div>
          </div>

          {/* Right Panel: Lebih di GARUDA */}
          <div className="rounded-xl border border-[#DFD1BE] dark:border-[#3A281D] bg-[#FCF9F5] dark:bg-[#18100B] flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E5DACB] dark:border-[#332218] flex items-center justify-between gap-2 bg-[#F4EDE3] dark:bg-[#261A12]">
              <div className="flex items-baseline gap-2 min-w-0">
                <h3 className="text-sm font-extrabold text-black dark:text-white truncate">
                  Lebih di GARUDA
                </h3>
                <span className="text-xs font-bold font-mono-tabular text-[#5D4C3E] dark:text-[#D6C7B5] whitespace-nowrap">
                  ({groupB.length} transaksi)
                </span>
              </div>
              <button
                type="button"
                disabled={!compared || groupB.length === 0}
                onClick={() => handleCopySide('B')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#4A2B18] hover:bg-[#361F11] dark:bg-[#C59656] dark:hover:bg-[#B58342] text-white dark:text-[#140D09] text-[11px] font-extrabold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
              >
                <Copy className="w-3 h-3" />
                <span>Salin GARUDA</span>
              </button>
            </div>

            <div className="flex-1 overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#F8F4EE] dark:bg-[#1F150F] border-b border-[#DFD1BE] dark:border-[#3A281D]">
                  <tr className="text-[11px] font-extrabold uppercase tracking-wider text-[#3D322B] dark:text-[#D6C7B5]">
                    <th className="py-2.5 px-4">User ID</th>
                    <th className="py-2.5 px-4 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE0D2] dark:divide-[#2E1F16] text-xs">
                  {groupB.map((r, idx) => (
                    <tr
                      key={`${r.id}-${r.nominal}-${idx}`}
                      className="hover:bg-[#F4EDE3] dark:hover:bg-[#241811]"
                    >
                      <td className="py-2.5 px-4 font-extrabold text-black dark:text-white">
                        {r.id}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono-tabular font-bold text-black dark:text-white">
                        {formatCompareNumber(r.nominal / 100)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {groupB.length === 0 && (
                <div className="py-8 px-4 text-center text-xs font-semibold text-[#5D4C3E] dark:text-[#B8A592]">
                  {compared
                    ? 'Tidak ada selisih yang sesuai pencarian.'
                    : 'Hasil muncul setelah kedua file dibandingkan.'}
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-[#DFD1BE] dark:border-[#3A281D] bg-[#EFE7DC] dark:bg-[#221710] flex items-center justify-between text-xs font-extrabold">
              <span className="text-black dark:text-white">
                Total lebih di GARUDA
              </span>
              <span className="font-mono-tabular text-black dark:text-white">
                {formatCompareNumber(amountBCents / 100)}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Hint Note */}
        <div className="px-5 pb-3 text-[11px] font-medium text-[#5D4C3E] dark:text-[#B8A592]">
          Total mengikuti pencarian User ID. File A = Admin, File B = GARUDA.
        </div>

        {/* Combined & Net Totals */}
        <div className="border-t border-[#DFD1BE] dark:border-[#3A281D] bg-[#EFE7DC] dark:bg-[#241811] divide-y divide-[#DFD1BE] dark:divide-[#3A281D]">
          <div className="px-5 py-3.5 flex items-center justify-between gap-4 text-sm font-extrabold">
            <div className="flex items-baseline gap-2">
              <span className="text-black dark:text-white">Total gabungan</span>
              <span className="text-xs font-bold font-mono-tabular text-[#5D4C3E] dark:text-[#D6C7B5]">
                ({visibleRows.length} transaksi)
              </span>
            </div>
            <span className="font-mono-tabular text-black dark:text-white">
              {formatCompareNumber(totalCombinedCents / 100)}
            </span>
          </div>

          <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-extrabold text-black dark:text-white">
                Selisih bersih (Admin − GARUDA)
              </div>
              <div className="text-xs font-mono-tabular text-[#5D4C3E] dark:text-[#D6C7B5] mt-0.5">
                {formatCompareNumber(amountACents / 100)} −{' '}
                {formatCompareNumber(amountBCents / 100)} ={' '}
                {formatCompareNumber(netDiffCents / 100)}
              </div>
            </div>
            <span
              className={`text-base font-extrabold font-mono-tabular ${
                netDiffCents === 0
                  ? 'text-[#147D4E] dark:text-[#6EE7A8]'
                  : 'text-black dark:text-white'
              }`}
            >
              {formatCompareNumber(netDiffCents / 100)}
            </span>
          </div>
        </div>
      </section>

      {/* Local Privacy & Verification Footer Note */}
      <p className="text-xs text-[#5D4C3E] dark:text-[#B8A592] leading-relaxed">
        Data diproses di browser Anda. CSV dibaca secara lokal. Pembaca Excel
        disertakan dalam dashboard dan dapat digunakan tanpa koneksi internet.
        Periksa kembali hasil sebelum digunakan sebagai laporan final.
      </p>
    </div>
  );
};
