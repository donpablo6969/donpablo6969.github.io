import React, { useMemo, useState } from 'react';
import { Copy, Eraser, Space } from 'lucide-react';
import { CashierMutationItem, MutationStatus, NavRoute } from '../types';
import { cleanAccountString } from '../utils/formatters';
import { InfoDpWdPanel } from './InfoDpWdPanel';

interface ToolsKasirViewsProps {
  route: Extract<NavRoute, 'info-dp-wd' | 'info-spasi'>;
  cashierQueue: CashierMutationItem[];
  onUpdateMutationStatus: (id: string, status: MutationStatus) => void;
  onCopyText: (text: string, label: string, customToast?: string) => void;
}

const InfoSpasiPanel: React.FC<{
  onCopyText: (t: string, l: string, customToast?: string) => void;
}> = ({ onCopyText }) => {
  const [rawInput, setRawInput] = useState(
    '5220 - 3918  23   a/n BAMBANG\n0129 0192 8471 502\n0813-9281 7401 (DANA)'
  );

  const parsedLines = useMemo(() => {
    return rawInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => ({
        index: index + 1,
        original: line,
        ...cleanAccountString(line),
      }));
  }, [rawInput]);

  const allCleanNumbers = useMemo(
    () => parsedLines.map((l) => l.digitsOnly).filter(Boolean).join('\n'),
    [parsedLines]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#4A2B18] dark:text-[#E5B874] mb-1">
            <Space className="w-4 h-4" />
            <span>TOOLS KASIR · INFO SPASI</span>
          </div>
          <h1 className="text-2xl font-extrabold text-black dark:text-white">
            Pembersih No Rekening &amp; Penghapus Spasi Otomatis
          </h1>
          <p className="text-xs sm:text-sm text-[#3D322B] dark:text-[#D6C7B5] mt-1">
            Tempel nomor rekening kotor (mengandung spasi, strip, kurung, atau
            huruf) untuk membersihkan digit siap tempel ke sistem kasir.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setRawInput('')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-extrabold cursor-pointer"
          >
            <Eraser className="w-4 h-4" />
            <span>Kosongkan</span>
          </button>
          <button
            type="button"
            disabled={!allCleanNumbers}
            onClick={() =>
              onCopyText(allCleanNumbers, 'Semua Nomor Rekening Bersih')
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4A2B18] hover:bg-[#361F11] disabled:opacity-50 dark:bg-[#C59656] dark:text-[#140D09] text-white text-xs font-extrabold cursor-pointer"
          >
            <Copy className="w-4 h-4" />
            <span>Salin Semua Bersih</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-5 space-y-3">
          <label className="block text-xs font-extrabold uppercase tracking-wide text-black dark:text-white">
            TEMPEL NO REKENING KOTOR (BISA BANYAK BARIS)
          </label>
          <textarea
            rows={7}
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="Contoh: 5220 3918 23 - BCA"
            className="w-full p-3.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-mono-tabular focus:outline-none focus:ring-2 focus:ring-[#4A2B18] dark:focus:ring-[#D4A373]"
          />
        </div>

        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-5 space-y-3">
          <div className="text-xs font-extrabold uppercase tracking-wide text-black dark:text-white">
            HASIL PEMBERSIHAN SPASI &amp; KARAKTER ({parsedLines.length} BARIS)
          </div>

          {parsedLines.length === 0 ? (
            <div className="py-10 text-center text-xs font-semibold text-[#3D322B] dark:text-[#D6C7B5]">
              Tempel teks nomor rekening di sebelah kiri untuk membersihkan spasi
              secara instan.
            </div>
          ) : (
            <div className="space-y-2.5">
              {parsedLines.map((row) => (
                <div
                  key={`${row.index}-${row.original}`}
                  className="p-3.5 rounded-xl bg-[#F8F4EE] dark:bg-[#291C14] border border-[#DFD1BE] dark:border-[#3D2B20] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="text-[11px] text-[#3D322B] dark:text-[#D6C7B5] truncate">
                      Asli:{' '}
                      <span className="font-mono-tabular">{row.original}</span>
                    </div>
                    <div className="text-base font-extrabold text-black dark:text-white font-mono-tabular tracking-wide">
                      {row.digitsOnly || '(Tidak ada angka)'}
                    </div>
                    <div className="text-[11px] font-semibold text-[#4A2B18] dark:text-[#E5B874]">
                      {row.detectedBankHint} · {row.digitsOnly.length} digit ·{' '}
                      {row.removedSpaces} spasi dihapus
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!row.digitsOnly}
                    onClick={() =>
                      onCopyText(row.digitsOnly, `No Rek ${row.digitsOnly}`)
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#4A2B18] hover:bg-[#361F11] disabled:opacity-40 dark:bg-[#C59656] dark:text-[#140D09] text-white text-xs font-extrabold cursor-pointer shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Digit</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ToolsKasirViews: React.FC<ToolsKasirViewsProps> = ({
  route,
  onCopyText,
}) => {
  if (route === 'info-dp-wd') {
    return <InfoDpWdPanel onCopyText={onCopyText} />;
  }
  return <InfoSpasiPanel onCopyText={onCopyText} />;
};
