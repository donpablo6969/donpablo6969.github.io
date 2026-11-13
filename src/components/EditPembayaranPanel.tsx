import React, { useMemo, useState } from 'react';
import {
  Check,
  Clock,
  Copy,
  CreditCard,
  Download,
  History,
  ReceiptText,
  RefreshCw,
  Shuffle,
  Smartphone,
} from 'lucide-react';
import { BankChannel } from '../types';
import { MyBcaGeneratorEmbed } from './MyBcaGeneratorEmbed';
import { BcaMobileGeneratorEmbed } from './BcaMobileGeneratorEmbed';
import { BniMobileGeneratorEmbed } from './BniMobileGeneratorEmbed';
import { BniWonderGeneratorEmbed } from './BniWonderGeneratorEmbed';
import { LivinMandiriGeneratorEmbed } from './LivinMandiriGeneratorEmbed';
import { BrimoGeneratorEmbed } from './BrimoGeneratorEmbed';
import { TransaksiSlotPanel } from './TransaksiSlotPanel';

interface EditPembayaranPanelProps {
  bankChannels: BankChannel[];
  onUpdateBankChannel: (updated: BankChannel) => void;
  onCopyText: (text: string, label: string, customToast?: string) => void;
}

type EditCategory =
  | 'struk'
  | 'history'
  | 'slot'
  | 'togel'
  | 'livegame'
  | 'seamless'
  | 'invoice-merah';

type ReceiptBankKey =
  | 'MY - BCA'
  | 'BCA MOBILE'
  | 'BNI MOBILE'
  | 'BNI WONDER'
  | 'BRIMO'
  | 'MANDIRI LIVIN';

const RECEIPT_BANKS: {
  key: ReceiptBankKey;
  badge: string;
  subtitle: string;
  accentHex: string;
  headerTitle: string;
  refPrefix: string;
}[] = [
  {
    key: 'MY - BCA',
    badge: 'MYBCA PRO',
    subtitle: 'Template struk resmi myBCA transfer dengan detail referensi lengkap & HD.',
    accentHex: '#005EB8',
    headerTitle: 'myBCA · Transfer Berhasil',
    refPrefix: 'MYBCA',
  },
  {
    key: 'BCA MOBILE',
    badge: 'BCA MOBILE PRO',
    subtitle: 'Template struk m-Transfer resmi Bank BCA dengan koordinat presisi & HD.',
    accentHex: '#003D79',
    headerTitle: 'm-Transfer',
    refPrefix: 'MBCA',
  },
  {
    key: 'BNI MOBILE',
    badge: 'BNI MOBILE PRO',
    subtitle: 'Template bukti transfer BNI Mobile Banking klasik dengan resi verifikasi.',
    accentHex: '#E55300',
    headerTitle: 'BNI Mobile Banking',
    refPrefix: 'BNIM',
  },
  {
    key: 'BNI WONDER',
    badge: 'WONDR BY BNI',
    subtitle: 'Template resi transaksi wondr by BNI modern dengan detail nominal presisi.',
    accentHex: '#00685E',
    headerTitle: 'wondr by BNI',
    refPrefix: 'WNDR',
  },
  {
    key: 'BRIMO',
    badge: 'BRIMO PRO',
    subtitle: 'Template bukti transaksi BRImo BRI resmi dengan nomor referensi BI-FAST.',
    accentHex: '#00529C',
    headerTitle: 'BRImo · Catatan Transaksi',
    refPrefix: 'BRIM',
  },
  {
    key: 'MANDIRI LIVIN',
    badge: "LIVIN' BY MANDIRI",
    subtitle: "Template resi transfer Livin' by Mandiri kuning-biru resolusi tinggi.",
    accentHex: '#003D79',
    headerTitle: "Livin' by Mandiri",
    refPrefix: 'LVIN',
  },
];

const CATEGORIES: { id: EditCategory; label: string }[] = [
  { id: 'struk', label: 'Struk Transfer' },
  { id: 'slot', label: 'Transaksi Slot' },
  { id: 'togel', label: 'Transaksi Togel' },
  { id: 'invoice-merah', label: 'Bet Togel' },
  { id: 'livegame', label: 'Transaksi Livegame' },
];

const SAMPLE_RECIPIENTS = [
  { name: 'HARTANTO', recAcc: '3801435031', sendAcc: '3780971991', amt: '20.000.000' },
  { name: 'BAMBANG SUTEDJO', recAcc: '5220391823', sendAcc: '8220918731', amt: '3.500.000' },
  { name: 'RIAN FIRMANSYAH', recAcc: '8220192841', sendAcc: '1420019283741', amt: '8.500.000' },
  { name: 'SITI NURHALIZA', recAcc: '081392817401', sendAcc: '034101002938501', amt: '1.250.000' },
  { name: 'HENDRA WIJAYA', recAcc: '0844192837', sendAcc: '1189029384', amt: '5.000.000' },
];

function formatNowDdMmYyyy(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatDots(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '0';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export const EditPembayaranPanel: React.FC<EditPembayaranPanelProps> = ({
  bankChannels: _bankChannels,
  onUpdateBankChannel: _onUpdateBankChannel,
  onCopyText,
}) => {
  const [activeCategory, setActiveCategory] = useState<EditCategory>('struk');
  const [selectedBank, setSelectedBank] = useState<ReceiptBankKey>('MY - BCA');

  // Transfer receipt state
  const [nominal, setNominal] = useState('20.000.000');
  const [recipientName, setRecipientName] = useState('HARTANTO');
  const [senderAcc, setSenderAcc] = useState('3780971991');
  const [recipientAcc, setRecipientAcc] = useState('3801435031');
  const [dateTime, setDateTime] = useState(() => formatNowDdMmYyyy());
  const [refCode, setRefCode] = useState('FT26111398412');

  // Extra fields for non-struk categories
  const [memberId, setMemberId] = useState('zeus_mania69');
  const [providerGame, setProviderGame] = useState('PG Soft · Mahjong Ways 2');
  const [betPeriod, setBetPeriod] = useState('SGP-20261113 · 4D: 8492');
  const [betStatus, setBetStatus] = useState<'SUKSES' | 'MENANG' | 'KALAH' | 'SETTLED'>('SUKSES');

  const bankMeta = useMemo(
    () => RECEIPT_BANKS.find((b) => b.key === selectedBank) || RECEIPT_BANKS[0],
    [selectedBank]
  );

  const handleCycleBank = () => {
    const idx = RECEIPT_BANKS.findIndex((b) => b.key === selectedBank);
    const next = RECEIPT_BANKS[(idx + 1) % RECEIPT_BANKS.length];
    setSelectedBank(next.key);
  };

  const handleRandomize = () => {
    const pick =
      SAMPLE_RECIPIENTS[Math.floor(Math.random() * SAMPLE_RECIPIENTS.length)];
    setNominal(pick.amt);
    setRecipientName(pick.name);
    setSenderAcc(pick.sendAcc);
    setRecipientAcc(pick.recAcc);
    setDateTime(formatNowDdMmYyyy());
    setRefCode(
      `${bankMeta.refPrefix}${Math.floor(10000000 + Math.random() * 89999999)}`
    );
  };

  const handleDownloadPng = () => {
    const scale = 3;
    const width = 375;
    const height = 640;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(scale, scale);

    if (activeCategory === 'invoice-merah') {
      // Red Togel Invoice Slip
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#9F1239';
      ctx.fillRect(0, 0, width, 110);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('INVOICE SLIP BET TOGEL', 24, 48);
      ctx.font = '12px monospace';
      ctx.fillText(`REF: ${refCode}`, 24, 74);
      ctx.fillText(dateTime, 24, 92);

      const rows: [string, string][] = [
        ['USER ID', memberId],
        ['PASARAN & ANGKA', betPeriod],
        ['NOMINAL BET', `Rp ${nominal},00`],
        ['STATUS TIKET', betStatus],
        ['WAKTU CETAK', dateTime],
      ];
      let y = 150;
      rows.forEach(([k, v]) => {
        ctx.fillStyle = '#6B7280';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(k, 24, y);
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 15px monospace';
        ctx.fillText(v, 24, y + 22);
        ctx.strokeStyle = '#E5E7EB';
        ctx.beginPath();
        ctx.moveTo(24, y + 36);
        ctx.lineTo(width - 24, y + 36);
        ctx.stroke();
        y += 60;
      });
    } else if (activeCategory !== 'struk') {
      // History / Slot / Togel / Livegame / Seamless Slip
      ctx.fillStyle = '#F8F4EE';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#4A2B18';
      ctx.fillRect(0, 0, width, 96);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(
        CATEGORIES.find((c) => c.id === activeCategory)?.label.toUpperCase() ||
          'TRANSAKSI',
        22,
        46
      );
      ctx.font = '12px monospace';
      ctx.fillText(`${selectedBank} · ${dateTime}`, 22, 72);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(20, 118, width - 40, 440);
      ctx.strokeStyle = '#D4C4AE';
      ctx.strokeRect(20, 118, width - 40, 440);

      const rows: [string, string][] = [
        ['USER ID', memberId],
        ['MODUL / GAME', providerGame],
        ['NOMINAL', `Rp ${nominal},00`],
        ['REKENING', `${recipientAcc} (${recipientName})`],
        ['STATUS', betStatus],
        ['REFERENSI', refCode],
      ];
      let y = 160;
      rows.forEach(([k, v]) => {
        ctx.fillStyle = '#5D4C3E';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(k, 38, y);
        ctx.fillStyle = '#111111';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(v, 38, y + 20);
        y += 62;
      });
    } else {
      // Authentic Bank Transfer Canvas
      ctx.fillStyle = '#E6E9EE';
      ctx.fillRect(0, 0, width, height);

      // Header Bar
      ctx.fillStyle = bankMeta.accentHex;
      ctx.fillRect(0, 0, width, 64);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 17px sans-serif';
      ctx.fillText(bankMeta.headerTitle, 20, 40);

      // Underlying form lines
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 64, width, height - 64);
      ctx.fillStyle = '#1F2937';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('Dari Rekening', 20, 95);
      ctx.font = '13px monospace';
      ctx.fillStyle = '#4B5563';
      ctx.fillText(senderAcc, 20, 115);

      ctx.fillStyle = '#1F2937';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('Ke Rekening', 20, 150);
      ctx.font = '13px monospace';
      ctx.fillStyle = '#4B5563';
      ctx.fillText(`${recipientAcc} - ${recipientName}`, 20, 170);

      // Popup/Receipt Card
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(0, 64, width, height - 64);

      const cardX = 28;
      const cardY = 175;
      const cardW = width - 56;
      const cardH = 315;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(cardX, cardY, cardW, cardH);

      // Subtle watermark text
      ctx.save();
      ctx.fillStyle = 'rgba(0, 94, 184, 0.06)';
      ctx.font = 'bold 20px sans-serif';
      ctx.translate(cardX + 35, cardY + 180);
      ctx.rotate(-0.45);
      ctx.fillText(selectedBank, 0, 0);
      ctx.fillText(selectedBank, 40, 70);
      ctx.restore();

      ctx.fillStyle = bankMeta.accentHex;
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(`${bankMeta.headerTitle}:`, cardX + 20, cardY + 38);
      ctx.fillText('BERHASIL', cardX + 20, cardY + 60);

      ctx.fillStyle = '#111827';
      ctx.font = '13px monospace';
      ctx.fillText(dateTime, cardX + 20, cardY + 86);
      ctx.fillText(`Ke ${recipientAcc}`, cardX + 20, cardY + 110);
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(recipientName, cardX + 20, cardY + 134);
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`Rp ${nominal},00`, cardX + 20, cardY + 162);

      ctx.fillStyle = '#6B7280';
      ctx.font = '11px monospace';
      ctx.fillText(`Dari: ${senderAcc}`, cardX + 20, cardY + 190);
      ctx.fillText(`Ref: ${refCode}`, cardX + 20, cardY + 208);

      // Bottom OK Button
      ctx.fillStyle = bankMeta.accentHex;
      ctx.fillRect(cardX + 120, cardY + 252, cardW - 140, 40);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('OK', cardX + 120 + (cardW - 140) / 2 - 11, cardY + 277);
    }

    const link = document.createElement('a');
    link.download = `struk-${selectedBank.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleCopyWhatsappText = () => {
    const lines =
      activeCategory === 'struk'
        ? [
            `*BUKTI TRANSFER ${selectedBank}*`,
            `Status: BERHASIL`,
            `Tanggal: ${dateTime}`,
            `Dari Rek: ${senderAcc}`,
            `Ke Rek: ${recipientAcc} (${recipientName})`,
            `Nominal: Rp ${nominal},00`,
            `Ref: ${refCode}`,
          ]
        : [
            `*${CATEGORIES.find((c) => c.id === activeCategory)?.label.toUpperCase()}*`,
            `User ID: ${memberId}`,
            `Bank / Kanal: ${selectedBank}`,
            `Game / Pasaran: ${activeCategory === 'togel' || activeCategory === 'invoice-merah' ? betPeriod : providerGame}`,
            `Nominal: Rp ${nominal},00`,
            `Status: ${betStatus}`,
            `Waktu: ${dateTime}`,
          ];

    onCopyText(lines.join('\n'), `Format Teks ${selectedBank}`);
  };

  return (
    <div className="space-y-5">
      {/* Compact Header + Category Bar */}
      <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] px-4 py-3 space-y-2.5">
        <div className="space-y-0.5">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#4A2B18] dark:text-[#E5B874]">
            PAYMENT &amp; TRANSACTION SUITE
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-black dark:text-white tracking-tight">
            EDIT PEMBAYARAN &amp; TRANSAKSI
          </h1>
        </div>

        <div className="pt-2 border-t border-[#EAE0D2] dark:border-[#332218] flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#4A2B18] dark:text-[#E5B874] mr-1 whitespace-nowrap">
            PILIHAN KATEGORI EDIT :
          </span>
          {CATEGORIES.map((cat) => {
            const isInvoiceRed = cat.id === 'invoice-merah';
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  active
                    ? isInvoiceRed
                      ? 'bg-[#9F1239] text-white border-[#9F1239]'
                      : 'bg-[#4A2B18] text-white border-[#4A2B18] dark:bg-[#C59656] dark:text-[#140D09] dark:border-[#C59656]'
                    : isInvoiceRed
                      ? 'bg-[#FBE7EB] dark:bg-[#3E1621] text-[#9F1239] dark:text-[#FDA4AF] border-[#F2B8C6] dark:border-[#70263A] hover:brightness-95'
                      : 'bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border-[#CBB9A0] dark:border-[#4D3627] hover:bg-[#EAE0D2] dark:hover:bg-[#2C1E16]'
                }`}
              >
                {cat.id === 'slot' ? (
                  <History className="w-3.5 h-3.5 shrink-0" />
                ) : cat.id === 'invoice-merah' ? (
                  <ReceiptText className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <CreditCard className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeCategory !== 'slot' && (
        <>
          {/* Bank Channel Selector Strip (Strictly the 6 user-requested channels) */}
          <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] px-4 py-3 flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#4A2B18] dark:text-[#E5B874] mr-1">
              PILIH BANK / STRUK:
            </span>
            {RECEIPT_BANKS.map((bank) => {
              const active = selectedBank === bank.key;
              return (
                <button
                  key={bank.key}
                  type="button"
                  onClick={() => setSelectedBank(bank.key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#4A2B18] text-white border-[#4A2B18] dark:bg-[#C59656] dark:text-[#140D09] dark:border-[#C59656] shadow-xs'
                      : 'bg-[#F8F4EE] hover:bg-[#EAE0D2] dark:bg-[#140D09] dark:hover:bg-[#2C1E16] text-black dark:text-white border-[#CBB9A0] dark:border-[#4D3627]'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{bank.key}</span>
                </button>
              );
            })}
          </div>

          {/* Selected Bank Banner */}
          <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-extrabold text-black dark:text-white uppercase">
                  EDIT STRUK {selectedBank}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#4A2B18] dark:bg-[#C59656] text-white dark:text-[#140D09] text-[10px] font-extrabold">
                  {bankMeta.badge}
                </span>
              </div>
              <p className="text-xs text-[#3D322B] dark:text-[#D6C7B5]">{bankMeta.subtitle}</p>
            </div>

            <button
              type="button"
              onClick={handleCycleBank}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-extrabold cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Pilih Bank Lain &rarr;</span>
            </button>
          </div>
        </>
      )}

      {/* Main Editor Workspace */}
      {activeCategory === 'slot' ? (
        <TransaksiSlotPanel onCopyText={onCopyText} />
      ) : selectedBank === 'MY - BCA' && activeCategory === 'struk' ? (
        <MyBcaGeneratorEmbed />
      ) : selectedBank === 'BCA MOBILE' && activeCategory === 'struk' ? (
        <BcaMobileGeneratorEmbed />
      ) : selectedBank === 'BNI MOBILE' && activeCategory === 'struk' ? (
        <BniMobileGeneratorEmbed />
      ) : selectedBank === 'BNI WONDER' && activeCategory === 'struk' ? (
        <BniWonderGeneratorEmbed />
      ) : selectedBank === 'MANDIRI LIVIN' && activeCategory === 'struk' ? (
        <LivinMandiriGeneratorEmbed />
      ) : selectedBank === 'BRIMO' && activeCategory === 'struk' ? (
        <BrimoGeneratorEmbed />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Editor Form Card */}
        <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E5DACB] dark:border-[#332218]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4A2B18] dark:bg-[#E5B874]" />
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-black dark:text-white">
                {selectedBank} EDITOR PRO
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setDateTime(formatNowDdMmYyyy())}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-[11px] font-extrabold cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Waktu Sekarang</span>
            </button>
          </div>

          {activeCategory !== 'struk' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
                  User ID Member
                </label>
                <input
                  type="text"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-mono-tabular font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
                  {activeCategory === 'togel' || activeCategory === 'invoice-merah'
                    ? 'Pasaran & Angka Bet'
                    : 'Provider / Permainan'}
                </label>
                <input
                  type="text"
                  value={
                    activeCategory === 'togel' || activeCategory === 'invoice-merah'
                      ? betPeriod
                      : providerGame
                  }
                  onChange={(e) =>
                    activeCategory === 'togel' || activeCategory === 'invoice-merah'
                      ? setBetPeriod(e.target.value)
                      : setProviderGame(e.target.value)
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-bold"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
              Nominal (dengan titik)
            </label>
            <input
              type="text"
              value={nominal}
              onChange={(e) => setNominal(formatDots(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-[#147D4E] dark:text-[#6EE7A8] border border-[#CBB9A0] dark:border-[#4D3627] text-sm font-mono-tabular font-extrabold focus:outline-none focus:ring-2 focus:ring-[#4A2B18] dark:focus:ring-[#C59656]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
              Nama Penerima (UPPERCASE)
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-extrabold uppercase focus:outline-none focus:ring-2 focus:ring-[#4A2B18] dark:focus:ring-[#C59656]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
                Rek. Pengirim
              </label>
              <input
                type="text"
                value={senderAcc}
                onChange={(e) => setSenderAcc(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-mono-tabular font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
                Rek. Penerima
              </label>
              <input
                type="text"
                value={recipientAcc}
                onChange={(e) => setRecipientAcc(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-[#4A2B18] dark:text-[#E5B874] border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-mono-tabular font-extrabold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
                Tanggal &amp; Waktu (DD/MM/YYYY HH:MM:SS)
              </label>
              <input
                type="text"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-mono-tabular font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
                {activeCategory === 'struk' ? 'Nomor Referensi' : 'Status Transaksi'}
              </label>
              {activeCategory === 'struk' ? (
                <input
                  type="text"
                  value={refCode}
                  onChange={(e) => setRefCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-mono-tabular font-semibold"
                />
              ) : (
                <select
                  value={betStatus}
                  onChange={(e) => setBetStatus(e.target.value as typeof betStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-extrabold"
                >
                  <option value="SUKSES">SUKSES</option>
                  <option value="MENANG">MENANG</option>
                  <option value="SETTLED">SETTLED</option>
                  <option value="KALAH">KALAH</option>
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handleRandomize}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-extrabold cursor-pointer"
            >
              <Shuffle className="w-4 h-4" />
              <span>ACAK DATA</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPng}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#4A2B18] hover:bg-[#361F11] dark:bg-[#C59656] dark:hover:bg-[#B58342] text-white dark:text-[#140D09] text-xs font-extrabold cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD PNG</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyWhatsappText}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#F8F4EE] hover:bg-[#EAE0D2] dark:bg-[#140D09] dark:hover:bg-[#261A12] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-extrabold cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Salin Format Teks Chat / WhatsApp</span>
          </button>
        </div>

        {/* Right: Live Phone / Canvas Preview */}
        <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-black dark:text-white">
              Pratinjau Struk {selectedBank}
            </span>
            <span className="font-mono-tabular text-[#5D4C3E] dark:text-[#D6C7B5]">
              Resolusi Canvas: 375px Auto (3x HD)
            </span>
          </div>

          <div className="flex justify-center py-2">
            {/* Phone Bezel Frame */}
            <div className="w-[310px] rounded-[28px] border-[6px] border-[#2C1E16] dark:border-[#4D3627] bg-[#140D09] shadow-xl overflow-hidden">
              {activeCategory === 'invoice-merah' ? (
                <div className="bg-white text-black min-h-[470px] flex flex-col">
                  <div className="bg-[#9F1239] text-white p-4 space-y-1">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider opacity-90">
                      INVOICE SLIP BET TOGEL
                    </div>
                    <div className="text-base font-extrabold">{betPeriod}</div>
                    <div className="text-[11px] font-mono-tabular opacity-85">
                      {dateTime}
                    </div>
                  </div>
                  <div className="p-4 flex-1 space-y-3 text-xs">
                    <div className="flex justify-between border-b border-neutral-200 pb-2">
                      <span className="text-neutral-600 font-bold">USER ID</span>
                      <span className="font-extrabold">{memberId}</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-200 pb-2">
                      <span className="text-neutral-600 font-bold">NOMINAL BET</span>
                      <span className="font-mono-tabular font-extrabold text-[#9F1239]">
                        Rp {nominal},00
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-200 pb-2">
                      <span className="text-neutral-600 font-bold">STATUS</span>
                      <span className="px-2 py-0.5 rounded bg-[#FBE7EB] text-[#9F1239] font-extrabold">
                        {betStatus}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-200 pb-2">
                      <span className="text-neutral-600 font-bold">REK TUJUAN</span>
                      <span className="font-mono-tabular font-bold">
                        {recipientAcc}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600 font-bold">REF TIKET</span>
                      <span className="font-mono-tabular">{refCode}</span>
                    </div>
                  </div>
                  <div className="bg-neutral-100 p-3 text-center text-[11px] font-bold text-neutral-600">
                    SLIP RESMI TRANSAKSI TOGEL
                  </div>
                </div>
              ) : activeCategory !== 'struk' ? (
                <div className="bg-[#F8F4EE] text-black min-h-[470px] flex flex-col">
                  <div className="bg-[#4A2B18] text-white p-4">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#E5B874]">
                      {selectedBank} · LOG TRANSAKSI
                    </div>
                    <div className="text-sm font-extrabold mt-0.5">
                      {CATEGORIES.find((c) => c.id === activeCategory)?.label}
                    </div>
                  </div>
                  <div className="p-4 flex-1 space-y-2.5 text-xs">
                    <div className="rounded-xl bg-white p-3.5 border border-[#D4C4AE] space-y-2.5">
                      <div className="flex justify-between">
                        <span className="text-[#5D4C3E]">User ID</span>
                        <span className="font-extrabold">{memberId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5D4C3E]">Game / Modul</span>
                        <span className="font-bold text-right">{providerGame}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5D4C3E]">Nominal</span>
                        <span className="font-mono-tabular font-extrabold text-[#147D4E]">
                          Rp {nominal},00
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5D4C3E]">A/N Penerima</span>
                        <span className="font-bold">{recipientName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5D4C3E]">Waktu</span>
                        <span className="font-mono-tabular">{dateTime}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-[#EAE0D2]">
                        <span className="text-[#5D4C3E]">Status</span>
                        <span className="font-extrabold text-[#147D4E]">
                          {betStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Bank Mobile Transfer Receipt Preview */
                <div className="relative bg-[#E2E6EC] text-black min-h-[470px] flex flex-col">
                  {/* Top Bank App Bar */}
                  <div
                    style={{ backgroundColor: bankMeta.accentHex }}
                    className="px-4 py-3 text-white flex items-center justify-between"
                  >
                    <span className="text-sm font-extrabold tracking-tight">
                      {bankMeta.headerTitle}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold">
                      {selectedBank}
                    </span>
                  </div>

                  {/* Background underlying transfer fields */}
                  <div className="p-4 space-y-3 text-[11px] bg-white flex-1">
                    <div className="border-b border-neutral-200 pb-2">
                      <div className="font-bold text-neutral-500">Dari Rekening</div>
                      <div className="font-mono-tabular font-semibold text-neutral-700">
                        {senderAcc}
                      </div>
                    </div>
                    <div className="border-b border-neutral-200 pb-2">
                      <div className="font-bold text-neutral-500">Ke Rekening</div>
                      <div className="font-mono-tabular font-semibold text-neutral-700">
                        {recipientAcc} - {recipientName}
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-neutral-500">Jumlah Uang</div>
                      <div className="font-mono-tabular font-semibold text-neutral-700">
                        Rp {nominal},00
                      </div>
                    </div>
                  </div>

                  {/* Authentic Receipt Dialog Overlay */}
                  <div className="absolute inset-0 top-11 bg-black/30 flex items-center justify-center p-4">
                    <div className="w-full rounded-xl bg-white shadow-2xl border border-neutral-200 overflow-hidden">
                      <div className="p-4 space-y-2 relative">
                        <div className="flex items-center justify-between">
                          <span
                            style={{ color: bankMeta.accentHex }}
                            className="text-xs font-extrabold"
                          >
                            {bankMeta.headerTitle}:
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#147D4E] bg-[#E4F4EC] px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" /> BERHASIL
                          </span>
                        </div>
                        <div className="text-[11px] font-mono-tabular text-neutral-700">
                          {dateTime}
                        </div>
                        <div className="text-xs font-mono-tabular text-neutral-800 pt-1">
                          Ke {recipientAcc}
                        </div>
                        <div className="text-xs font-extrabold text-black uppercase">
                          {recipientName}
                        </div>
                        <div className="text-base font-extrabold font-mono-tabular text-black">
                          Rp {nominal},00
                        </div>
                        <div className="pt-2 border-t border-dashed border-neutral-200 text-[10px] font-mono-tabular text-neutral-500 space-y-0.5">
                          <div>Dari: {senderAcc}</div>
                          <div>No. Ref: {refCode}</div>
                        </div>
                      </div>
                      <div className="px-4 py-2.5 bg-neutral-50 border-t border-neutral-200 flex justify-end">
                        <span
                          style={{ backgroundColor: bankMeta.accentHex }}
                          className="px-6 py-1.5 rounded text-white text-xs font-extrabold"
                        >
                          OK
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Phone Nav Bar */}
                  <div className="bg-[#1A1A1A] text-white/70 py-2 px-8 flex items-center justify-between text-[10px] font-mono-tabular z-10">
                    <span>III</span>
                    <span>O</span>
                    <span>&lt;</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
