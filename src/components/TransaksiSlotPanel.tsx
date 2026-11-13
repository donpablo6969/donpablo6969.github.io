import React, { useMemo, useRef, useState } from 'react';
import {
  Copy,
  Download,
  Edit3,
  Plus,
  Shield,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';

interface TransaksiSlotPanelProps {
  onCopyText: (text: string, label: string, customToast?: string) => void;
}

type SlotViewMode = 'mutasi' | 'seamless';

interface MutasiRow {
  id: string;
  periode: string;
  tanggal: string;
  keterangan: string;
  status: 'Withdraw' | 'Deposit';
  debet: number;
  kredit: number;
  saldo: number;
  via: string;
}

interface SeamlessRow {
  id: string;
  periode: string;
  tanggal: string;
  keterangan: string;
  status: 'Debit' | 'Credit';
  debet: number;
  kredit: number;
  saldo: number;
  via: string;
}

const PROVIDER_GAMES: Record<string, string[]> = {
  'Pragmatic Play': [
    'Gates of Olympus',
    'Starlight Princess 1000',
    'Sweet Bonanza',
    'Sugar Rush 1000',
    'Gates of Gatot Kaca',
  ],
  'PG Soft': [
    'Mahjong Ways 2',
    'Mahjong Ways',
    'Lucky Neko',
    'Wild Bandito',
    'Treasures of Aztec',
  ],
  'IDN Slot': [
    'Kutukan Medusa',
    'Naga Emas',
    'Pendekar Buta',
    'Pasar Malam',
  ],
  Habanero: ['Koi Gate', 'Hot Hot Fruit', '5 Lucky Lions', 'Fa Cai Shen'],
  NoLimitCity: ['Mental', 'San Quentin xWays', 'Tombstone RIP'],
};

function fmtComma(num: number): string {
  const n = Math.max(0, Math.round(Number(num) || 0));
  return n.toLocaleString('en-US');
}

function fmtDateTimeSql(date: Date): string {
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function randInt(min: number, max: number): number {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

const PLAYER_PREFIXES = [
  'udi', 'ari', 'bud', 'den', 'agu', 'bag', 'rez', 'ton', 'dim', 'hen',
  'bay', 'yus', 'put', 'eko', 'ran', 'fad', 'rio', 'wan', 'adi', 'iko',
  'jon', 'rah', 'san', 'ded', 'fir', 'zak', 'gil', 'rik',
];

function generateMaskedPlayerId(): string {
  const prefix = PLAYER_PREFIXES[Math.floor(Math.random() * PLAYER_PREFIXES.length)];
  const suffix = String(randInt(10, 99));
  return `${prefix}xxxx${suffix}`;
}

function stepBackWithUniqueMinSec(
  prevDate: Date,
  minMinutes: number,
  maxMinutes: number
): Date {
  const prevMin = prevDate.getMinutes();
  const prevSec = prevDate.getSeconds();
  const baseMins = randInt(minMinutes, maxMinutes);
  let candidate = new Date(
    prevDate.getTime() - baseMins * 60 * 1000 - randInt(7, 53) * 1000
  );
  if (candidate.getMinutes() === prevMin) {
    candidate = new Date(candidate.getTime() - randInt(3, 17) * 60 * 1000);
  }
  if (candidate.getSeconds() === prevSec) {
    candidate = new Date(candidate.getTime() - randInt(7, 29) * 1000);
  }
  return candidate;
}

function generateMutasiInitial(): {
  lastBalance: number;
  rows: MutasiRow[];
} {
  const rows: MutasiRow[] = [
    {
      id: 'm-1',
      periode: '',
      tanggal: '2026-11-13 15:42:44',
      keterangan: 'Tarik Dana',
      status: 'Withdraw',
      debet: 209000,
      kredit: 0,
      saldo: 136,
      via: 'Mobile',
    },
    {
      id: 'm-2',
      periode: '',
      tanggal: '2026-11-13 15:06:22',
      keterangan: 'Deposit Dana Manual',
      status: 'Deposit',
      debet: 0,
      kredit: 20000,
      saldo: 20106,
      via: '-',
    },
    {
      id: 'm-3',
      periode: '',
      tanggal: '2026-11-13 10:50:14',
      keterangan: 'Deposit Dana Manual',
      status: 'Deposit',
      debet: 0,
      kredit: 50000,
      saldo: 50126,
      via: '-',
    },
  ];
  return { lastBalance: 136, rows };
}

function generateSeamlessData(params: {
  rounds: number;
  betMin: number;
  betMax: number;
  startBalance: number;
  provider: string;
  game: string;
  scenario: 'random' | 'win' | 'lose';
}): SeamlessRow[] {
  const rounds = Math.min(30, Math.max(1, params.rounds));
  const now = new Date();
  let cursorTime = new Date(now.getTime() - rounds * 18000);
  let bal = Math.max(0, params.startBalance);
  const chronological: SeamlessRow[] = [];
  const betMin = Math.max(200, Math.min(params.betMin, params.betMax));
  const betMax = Math.max(betMin, params.betMax);

  for (let i = 0; i < rounds; i++) {
    const stepSteps = Math.max(1, Math.round((betMax - betMin) / 400));
    const bet =
      betMin +
      Math.floor(Math.random() * Math.max(1, Math.min(25, stepSteps))) * 400;
    const clampedBet = Math.min(betMax, Math.max(betMin, bet));
    const roundId = `IDN${Math.floor(10000000 + Math.random() * 89999999)}`;

    cursorTime = new Date(cursorTime.getTime() + randInt(3, 9) * 1000);
    const debitTime = fmtDateTimeSql(cursorTime);
    bal = Math.max(0, bal - clampedBet);
    chronological.push({
      id: `s-d-${Date.now()}-${i}`,
      periode: roundId,
      tanggal: debitTime,
      keterangan: `${params.provider} · ${params.game}`,
      status: 'Debit',
      debet: clampedBet,
      kredit: 0,
      saldo: bal,
      via: 'Seamless',
    });

    cursorTime = new Date(cursorTime.getTime() + randInt(1, 3) * 1000);
    const creditTime = fmtDateTimeSql(cursorTime);

    let win = 0;
    if (params.scenario === 'win') {
      const hit = i === rounds - 1 || Math.random() < 0.65;
      win = hit ? Math.round((clampedBet * randInt(15, 120)) / 10) : 0;
    } else if (params.scenario === 'lose') {
      win = Math.random() < 0.2 ? Math.round(clampedBet * 0.5) : 0;
    } else {
      win =
        Math.random() < 0.45
          ? Math.round((clampedBet * randInt(4, 38)) / 10)
          : 0;
    }

    bal += win;
    chronological.push({
      id: `s-c-${Date.now()}-${i}`,
      periode: roundId,
      tanggal: creditTime,
      keterangan: `${params.provider} · ${params.game}`,
      status: 'Credit',
      debet: 0,
      kredit: win,
      saldo: bal,
      via: 'Seamless',
    });
  }

  // Reverse chronological (newest on top) matching admin panel log tables
  return chronological.reverse();
}

function drawReceiptTableToCanvas(opts: {
  title: string;
  headers: string[];
  rows: {
    cells: string[];
    isOdd: boolean;
    statusColor: string;
    kreditColor: string;
    saldoColor: string;
  }[];
  lastBalanceRow?: string;
  watermarkText?: string;
}): HTMLCanvasElement {
  const scale = 3;
  const colWidths = [36, 95, 158, 175, 86, 86, 86, 92, 74];
  const cellGap = 2;
  const sidePad = 14;
  const topTitleH = 34;
  const rowH = 22;
  const totalTableW =
    colWidths.reduce((a, b) => a + b, 0) + cellGap * (colWidths.length + 1);
  const totalRowsCount =
    1 + (opts.lastBalanceRow !== undefined ? 1 : 0) + opts.rows.length;
  const totalTableH =
    totalRowsCount * rowH + cellGap * (totalRowsCount + 1);

  const canvasW = totalTableW + sidePad * 2;
  const canvasH = topTitleH + totalTableH + 14;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW * scale;
  canvas.height = canvasH * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.scale(scale, scale);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Top Header Title (matches <font color="#0000CC"><b>Transaksi Pemain : ...</b></font>)
  ctx.font = 'bold 14px Verdana, Geneva, sans-serif';
  const titleW = ctx.measureText(opts.title).width;
  const blockW = 20 + titleW + 16;
  const startTitleX = Math.max(sidePad, (canvasW - blockW) / 2);

  // Tiny log clipboard icon
  ctx.fillStyle = '#E5EEF8';
  ctx.strokeStyle = '#3B5998';
  ctx.lineWidth = 1;
  ctx.fillRect(startTitleX, 8, 13, 15);
  ctx.strokeRect(startTitleX, 8, 13, 15);
  ctx.fillStyle = '#3B5998';
  ctx.fillRect(startTitleX + 3, 11, 7, 1.5);
  ctx.fillRect(startTitleX + 3, 14, 7, 1.5);
  ctx.fillRect(startTitleX + 3, 17, 5, 1.5);

  ctx.fillStyle = '#0000CC';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(opts.title, startTitleX + 20, 16);

  // Glossy blue circular 'i' info icon on right beside user ID
  const infoCx = startTitleX + 20 + titleW + 12;
  const infoCy = 16;
  const infoR = 6.5;
  const grad = ctx.createRadialGradient(infoCx - 2, infoCy - 2.5, 0.8, infoCx, infoCy, infoR);
  grad.addColorStop(0, '#7CC4FF');
  grad.addColorStop(0.55, '#1D5CE5');
  grad.addColorStop(1, '#0B2E8A');
  ctx.beginPath();
  ctx.arc(infoCx, infoCy, infoR, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = '#092266';
  ctx.stroke();

  // Top gloss sheen
  ctx.beginPath();
  ctx.ellipse(infoCx, infoCy - 2.8, 3.8, 2.0, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.32)';
  ctx.fill();

  // White serif 'i'
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(infoCx, infoCy - 2.7, 1.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(infoCx - 0.9, infoCy - 0.7, 1.8, 4.4);
  ctx.fillRect(infoCx - 1.8, infoCy + 2.8, 3.6, 1.0);

  const drawRow = (
    y: number,
    bg: string,
    drawCells: (x: number, w: number, colIdx: number) => void,
    spanRanges?: { startCol: number; span: number; label: string; color: string; bold?: boolean }[]
  ) => {
    let x = sidePad + cellGap;
    if (spanRanges) {
      spanRanges.forEach((sp) => {
        let w = 0;
        for (let i = 0; i < sp.span; i++) {
          w += colWidths[sp.startCol + i];
        }
        w += cellGap * (sp.span - 1);
        ctx.fillStyle = bg;
        ctx.fillRect(x, y, w, rowH);
        if (sp.label) {
          ctx.fillStyle = sp.color;
          ctx.font = `${sp.bold ? 'bold ' : ''}12px Verdana, Geneva, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(sp.label, x + w / 2, y + rowH / 2);
        }
        x += w + cellGap;
      });
      return;
    }
    colWidths.forEach((w, idx) => {
      ctx.fillStyle = bg;
      ctx.fillRect(x, y, w, rowH);
      drawCells(x, w, idx);
      x += w + cellGap;
    });
  };

  let curY = topTitleH + cellGap;

  // Header row (#F5E363)
  drawRow(curY, '#F5E363', (x, w, idx) => {
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px Verdana, Geneva, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(opts.headers[idx] || '', x + w / 2, curY + rowH / 2);
  });
  curY += rowH + cellGap;

  // Last Balance row (#FFDBB7)
  if (opts.lastBalanceRow !== undefined) {
    drawRow(
      curY,
      '#FFDBB7',
      () => {},
      [
        { startCol: 0, span: 5, label: '', color: '#000000', bold: true },
        { startCol: 5, span: 2, label: 'Last Balance', color: '#000000', bold: true },
        { startCol: 7, span: 1, label: opts.lastBalanceRow, color: '#0000FF', bold: true },
        { startCol: 8, span: 1, label: '', color: '#000000', bold: true },
      ]
    );
    curY += rowH + cellGap;
  }

  // Data rows
  opts.rows.forEach((row) => {
    const bg = row.isOdd ? '#EFEFEF' : '#FFDBB7';
    drawRow(curY, bg, (x, w, idx) => {
      let color = '#000000';
      if (idx === 4) color = row.statusColor;
      else if (idx === 6) color = row.kreditColor;
      else if (idx === 7) color = row.saldoColor;

      ctx.fillStyle = color;
      ctx.font = '11.5px Verdana, Geneva, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const val = row.cells[idx] ?? '';
      ctx.fillText(val, x + w / 2, curY + rowH / 2, w - 6);
    });
    curY += rowH + cellGap;
  });

  // Optional diagonal watermark
  if (opts.watermarkText) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 204, 0.06)';
    ctx.font = 'bold 26px Verdana, Geneva, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let wy = 70; wy < canvasH; wy += 110) {
      for (let wx = 120; wx < canvasW; wx += 260) {
        ctx.save();
        ctx.translate(wx, wy);
        ctx.rotate(-0.32);
        ctx.fillText(opts.watermarkText, 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  return canvas;
}

export const TransaksiSlotPanel: React.FC<TransaksiSlotPanelProps> = ({
  onCopyText,
}) => {
  const [viewMode, setViewMode] = useState<SlotViewMode>('mutasi');

  // === FORMAT 1: MUTASI SALDO PEMAIN ===
  const initialMutasi = useMemo(() => generateMutasiInitial(), []);
  const [playerName, setPlayerName] = useState('udixxxx69');
  const [rowCount, setRowCount] = useState('10');
  const [depMin, setDepMin] = useState('100000');
  const [depMax, setDepMax] = useState('500000');
  const [wdMin, setWdMin] = useState('10000000');
  const [wdMax, setWdMax] = useState('100000000');
  const [jedaMin, setJedaMin] = useState('105');
  const [jedaMax, setJedaMax] = useState('135');
  const [lastBalance, setLastBalance] = useState<number>(initialMutasi.lastBalance);
  const [mutasiRows, setMutasiRows] = useState<MutasiRow[]>(initialMutasi.rows);
  const [mutasiWatermark, setMutasiWatermark] = useState(false);
  const [mutasiEditMode, setMutasiEditMode] = useState(false);
  const [mutasiFormat, setMutasiFormat] = useState<'png' | 'jpeg'>('png');

  // === FORMAT 2: DETAIL RONDE IDN (SEAMLESS) ===
  const [seamlessPlayer, setSeamlessPlayer] = useState('udixxxx69');
  const [seamlessProvider, setSeamlessProvider] = useState('Pragmatic Play');
  const [seamlessGame, setSeamlessGame] = useState('Gates of Olympus');
  const [seamlessRounds, setSeamlessRounds] = useState('6');
  const [seamlessBetMin, setSeamlessBetMin] = useState('2000');
  const [seamlessBetMax, setSeamlessBetMax] = useState('20000');
  const [seamlessStartBal, setSeamlessStartBal] = useState('500000');
  const [seamlessScenario, setSeamlessScenario] = useState<'random' | 'win' | 'lose'>('random');
  const [seamlessRows, setSeamlessRows] = useState<SeamlessRow[]>(() =>
    generateSeamlessData({
      rounds: 6,
      betMin: 2000,
      betMax: 20000,
      startBalance: 500000,
      provider: 'Pragmatic Play',
      game: 'Gates of Olympus',
      scenario: 'random',
    })
  );
  const [seamlessWatermark, setSeamlessWatermark] = useState(false);
  const [seamlessEditMode, setSeamlessEditMode] = useState(false);
  const [seamlessFormat, setSeamlessFormat] = useState<'png' | 'jpeg'>('png');

  const mutasiTableRef = useRef<HTMLDivElement>(null);
  const seamlessTableRef = useRef<HTMLDivElement>(null);

  const handleAutoGenerateMutasi = () => {
    const count = Math.min(40, Math.max(2, parseInt(rowCount, 10) || 10));
    const dMin = Math.max(10000, parseInt(depMin.replace(/\D/g, ''), 10) || 100000);
    const dMax = Math.max(dMin, parseInt(depMax.replace(/\D/g, ''), 10) || 500000);
    const wMax = Math.min(100000000, Math.max(500000, parseInt(wdMax.replace(/\D/g, ''), 10) || 100000000));
    const wMin = Math.min(wMax, Math.max(500000, parseInt(wdMin.replace(/\D/g, ''), 10) || 10000000));
    const jMin = Math.max(60, parseInt(jedaMin, 10) || 105);
    const jMax = Math.max(jMin, parseInt(jedaMax, 10) || 135);

    const generatedPlayer = generateMaskedPlayerId();
    const newLastBal = randInt(100, 999) + (Math.random() < 0.5 ? randInt(1, 550) * 1000 : 0);

    // Round Withdraw Debet strictly to clean 500,000 steps (e.g. 60,500,000), max 100,000,000
    const minStep = Math.ceil(wMin / 500000);
    const maxStep = Math.floor(wMax / 500000);
    const wdRaw = Math.min(
      100000000,
      randInt(minStep, Math.max(minStep, maxStep)) * 500000
    );

    let cursor = new Date();
    const generated: MutasiRow[] = [
      {
        id: `m-${Date.now()}-0`,
        periode: '',
        tanggal: fmtDateTimeSql(cursor),
        keterangan: 'Tarik Dana',
        status: 'Withdraw',
        debet: wdRaw,
        kredit: 0,
        saldo: newLastBal,
        via: 'Mobile',
      },
    ];

    for (let i = 1; i < count; i++) {
      // Gap from Tarik Dana -> Deposit: 3–4 hours; Deposit -> Deposit: ~2 hours (different min & sec)
      cursor =
        i === 1
          ? stepBackWithUniqueMinSec(cursor, 185, 240)
          : stepBackWithUniqueMinSec(cursor, jMin, jMax);

      const roll = Math.random();
      let ket = 'Deposit';
      let kredit = 0;
      let via = Math.random() < 0.55 ? 'Mobile' : 'Website';

      if (roll < 0.42) {
        ket = 'Deposit PGA';
        const baseRound = randInt(Math.floor(dMin / 1000), Math.floor(dMax / 1000)) * 1000;
        kredit = Math.min(dMax, baseRound + randInt(101, 987));
        via = Math.random() < 0.7 ? 'Website' : 'Mobile';
      } else if (roll < 0.62) {
        ket = 'Deposit Dana Manual';
        kredit = randInt(Math.floor(dMin / 10000), Math.floor(dMax / 10000)) * 10000;
        via = '-';
      } else {
        ket = 'Deposit';
        kredit = randInt(Math.floor(dMin / 1000), Math.floor(dMax / 1000)) * 1000;
      }

      const residual = Math.random() < 0.75 ? randInt(12, 3450) : 0;
      generated.push({
        id: `m-${Date.now()}-${i}`,
        periode: '',
        tanggal: fmtDateTimeSql(cursor),
        keterangan: ket,
        status: 'Deposit',
        debet: 0,
        kredit,
        saldo: kredit + residual,
        via,
      });
    }

    setPlayerName(generatedPlayer);
    setLastBalance(newLastBal);
    setMutasiRows(generated);
  };

  const handleAddMutasiRow = () => {
    const lastRow = mutasiRows[mutasiRows.length - 1];
    const baseDate = lastRow
      ? new Date(lastRow.tanggal.replace(' ', 'T'))
      : new Date();
    const safeBase = Number.isNaN(baseDate.getTime()) ? new Date() : baseDate;
    const jMin = Math.max(60, parseInt(jedaMin, 10) || 105);
    const jMax = Math.max(jMin, parseInt(jedaMax, 10) || 135);
    const safeDate = stepBackWithUniqueMinSec(safeBase, jMin, jMax);

    const dMin = Math.max(10000, parseInt(depMin.replace(/\D/g, ''), 10) || 100000);
    const dMax = Math.max(dMin, parseInt(depMax.replace(/\D/g, ''), 10) || 500000);
    const amt = randInt(Math.floor(dMin / 1000), Math.floor(dMax / 1000)) * 1000;

    setMutasiRows((prev) => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        periode: '',
        tanggal: fmtDateTimeSql(safeDate),
        keterangan: 'Deposit',
        status: 'Deposit',
        debet: 0,
        kredit: amt,
        saldo: amt + randInt(50, 999),
        via: 'Website',
      },
    ]);
  };

  const handleCopyMutasiText = () => {
    const header = ['No', 'Periode', 'Tanggal', 'Keterangan', 'Status', 'Debet', 'Kredit', 'Saldo', 'Via'].join('\t');
    const lbLine = ['', '', '', '', '', 'Last Balance', '', fmtComma(lastBalance), ''].join('\t');
    const body = mutasiRows
      .map((r, i) =>
        [
          i + 1,
          r.periode,
          r.tanggal,
          r.keterangan,
          r.status,
          fmtComma(r.debet),
          fmtComma(r.kredit),
          fmtComma(r.saldo),
          r.via,
        ].join('\t')
      )
      .join('\n');
    onCopyText(
      `Transaksi Pemain : ${playerName}\n${header}\n${lbLine}\n${body}`,
      'Tabel Mutasi Saldo Pemain'
    );
  };

  const handleDownloadMutasi = () => {
    const canvas = drawReceiptTableToCanvas({
      title: `Transaksi  Pemain : ${playerName}`,
      headers: ['No', 'Periode', 'Tanggal', 'Keterangan', 'Status', 'Debet', 'Kredit', 'Saldo', 'Via'],
      lastBalanceRow: fmtComma(lastBalance),
      rows: mutasiRows.map((r, i) => ({
        isOdd: i % 2 === 0,
        cells: [
          String(i + 1),
          r.periode,
          r.tanggal,
          r.keterangan,
          r.status,
          fmtComma(r.debet),
          fmtComma(r.kredit),
          fmtComma(r.saldo),
          r.via,
        ],
        statusColor: 'red',
        kreditColor: '#0000FF',
        saldoColor: '#0000FF',
      })),
      watermarkText: mutasiWatermark ? playerName.toUpperCase() : undefined,
    });

    const mime = mutasiFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
    const ext = mutasiFormat === 'jpeg' ? 'jpg' : 'png';
    const link = document.createElement('a');
    link.download = `transaksi-pemain-${playerName || 'user'}.${ext}`;
    link.href = canvas.toDataURL(mime, mutasiFormat === 'jpeg' ? 0.95 : undefined);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleAutoGenerateSeamless = () => {
    const generatedPlayer = generateMaskedPlayerId();
    const rows = generateSeamlessData({
      rounds: parseInt(seamlessRounds, 10) || 6,
      betMin: parseInt(seamlessBetMin.replace(/\D/g, ''), 10) || 2000,
      betMax: parseInt(seamlessBetMax.replace(/\D/g, ''), 10) || 20000,
      startBalance: parseInt(seamlessStartBal.replace(/\D/g, ''), 10) || 500000,
      provider: seamlessProvider,
      game: seamlessGame || 'Gates of Olympus',
      scenario: seamlessScenario,
    });
    setSeamlessPlayer(generatedPlayer);
    setSeamlessRows(rows);
  };

  const handleAddSeamlessPair = () => {
    const roundId = `IDN${Math.floor(10000000 + Math.random() * 89999999)}`;
    const prevTopSaldo = seamlessRows[0]?.saldo ?? (parseInt(seamlessStartBal, 10) || 500000);
    const bet = Math.max(400, parseInt(seamlessBetMin, 10) || 2000);
    const win = Math.round(bet * 2.5);
    const now = new Date();
    const tCredit = fmtDateTimeSql(now);
    const tDebit = fmtDateTimeSql(new Date(now.getTime() - 2000));

    const newPair: SeamlessRow[] = [
      {
        id: `s-c-${Date.now()}`,
        periode: roundId,
        tanggal: tCredit,
        keterangan: `${seamlessProvider} · ${seamlessGame}`,
        status: 'Credit',
        debet: 0,
        kredit: win,
        saldo: Math.max(0, prevTopSaldo - bet + win),
        via: 'Seamless',
      },
      {
        id: `s-d-${Date.now()}`,
        periode: roundId,
        tanggal: tDebit,
        keterangan: `${seamlessProvider} · ${seamlessGame}`,
        status: 'Debit',
        debet: bet,
        kredit: 0,
        saldo: Math.max(0, prevTopSaldo - bet),
        via: 'Seamless',
      },
    ];
    setSeamlessRows((prev) => [...newPair, ...prev]);
  };

  const handleCopySeamlessText = () => {
    const header = ['No', 'Periode', 'Tanggal', 'Keterangan', 'Status', 'Debet', 'Kredit', 'Saldo', 'Via'].join('\t');
    const body = seamlessRows
      .map((r, i) =>
        [
          i + 1,
          r.periode,
          r.tanggal,
          r.keterangan,
          r.status,
          fmtComma(r.debet),
          fmtComma(r.kredit),
          fmtComma(r.saldo),
          r.via,
        ].join('\t')
      )
      .join('\n');
    onCopyText(
      `Transaksi Seamless Pemain : ${seamlessPlayer}\n${header}\n${body}`,
      'Tabel Transaksi Seamless IDN'
    );
  };

  const handleDownloadSeamless = () => {
    const latestSaldo = seamlessRows[0]?.saldo ?? 0;
    const canvas = drawReceiptTableToCanvas({
      title: `Transaksi  Pemain : ${seamlessPlayer}`,
      headers: ['No', 'Periode', 'Tanggal', 'Keterangan', 'Status', 'Debet', 'Kredit', 'Saldo', 'Via'],
      lastBalanceRow: fmtComma(latestSaldo),
      rows: seamlessRows.map((r, i) => ({
        isOdd: i % 2 === 0,
        cells: [
          String(i + 1),
          r.periode,
          r.tanggal,
          r.keterangan,
          r.status,
          fmtComma(r.debet),
          fmtComma(r.kredit),
          fmtComma(r.saldo),
          r.via,
        ],
        statusColor: r.status === 'Debit' ? 'red' : '#0000FF',
        kreditColor: '#0000FF',
        saldoColor: '#0000FF',
      })),
      watermarkText: seamlessWatermark ? seamlessPlayer.toUpperCase() : undefined,
    });

    const mime = seamlessFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
    const ext = seamlessFormat === 'jpeg' ? 'jpg' : 'png';
    const link = document.createElement('a');
    link.download = `transaksi-seamless-${seamlessPlayer || 'user'}.${ext}`;
    link.href = canvas.toDataURL(mime, seamlessFormat === 'jpeg' ? 0.95 : undefined);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-4">
      {/* ================= FORMAT 1: MUTASI SALDO PEMAIN / HISTORY TRANSAKSI ================= */}
      {viewMode === 'mutasi' && (
        <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 p-4 space-y-4">
          {/* Controls Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#EAE0D2] dark:border-[#C59656]/35">
            <div className="flex flex-wrap items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#4A2B18] dark:text-[#E5B874]" />
              <span className="text-sm font-extrabold text-black dark:text-white">
                Generator Transaksi Simulasi
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setMutasiEditMode((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold border transition-colors cursor-pointer ${
                  mutasiEditMode
                    ? 'bg-[#4A2B18] text-white border-[#4A2B18] dark:bg-[#C59656] dark:text-[#140D09] dark:border-[#C59656]'
                    : 'bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border-[#CBB9A0] dark:border-[#D4A373]/75 hover:bg-[#EAE0D2] dark:hover:bg-[#2C1E16]'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{mutasiEditMode ? 'Edit Baris: AKTIF' : 'Edit Baris'}</span>
              </button>

              <button
                type="button"
                onClick={() => setMutasiWatermark((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold border transition-colors cursor-pointer ${
                  mutasiWatermark
                    ? 'bg-[#4A2B18] text-white border-[#4A2B18] dark:bg-[#C59656] dark:text-[#140D09] dark:border-[#C59656]'
                    : 'bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border-[#CBB9A0] dark:border-[#D4A373]/75 hover:bg-[#EAE0D2] dark:hover:bg-[#2C1E16]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Watermark: {mutasiWatermark ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* Input Fields Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2.5">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
                User ID Pemain
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
                Last Balance
              </label>
              <input
                type="number"
                value={lastBalance}
                onChange={(e) => setLastBalance(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-2.5 py-2 rounded-lg bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-mono-tabular font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
                Jumlah baris
              </label>
              <input
                type="number"
                min={2}
                max={40}
                value={rowCount}
                onChange={(e) => setRowCount(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-mono-tabular font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
                Deposit min
              </label>
              <input
                type="number"
                value={depMin}
                onChange={(e) => setDepMin(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-mono-tabular font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
                Deposit max
              </label>
              <input
                type="number"
                value={depMax}
                onChange={(e) => setDepMax(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-mono-tabular font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
                Withdraw min
              </label>
              <input
                type="number"
                value={wdMin}
                onChange={(e) => setWdMin(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-mono-tabular font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
                Withdraw max
              </label>
              <input
                type="number"
                max={100000000}
                value={wdMax}
                onChange={(e) => setWdMax(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-mono-tabular font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
                Jeda min (m)
              </label>
              <input
                type="number"
                value={jedaMin}
                onChange={(e) => setJedaMin(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-mono-tabular font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
                Jeda max (m)
              </label>
              <input
                type="number"
                value={jedaMax}
                onChange={(e) => setJedaMax(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-mono-tabular font-bold"
              />
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAutoGenerateMutasi}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4A2B18] hover:bg-[#361F11] dark:bg-[#C59656] dark:hover:bg-[#B58342] text-white dark:text-[#140D09] text-xs font-extrabold cursor-pointer shadow-xs"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>BUAT OTOMATIS</span>
              </button>

              <button
                type="button"
                onClick={handleAddMutasiRow}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-extrabold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyMutasiText}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F8F4EE] hover:bg-[#EAE0D2] dark:bg-[#140D09] dark:hover:bg-[#2C1E16] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-extrabold cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Text</span>
              </button>

              <select
                value={mutasiFormat}
                onChange={(e) => setMutasiFormat(e.target.value as 'png' | 'jpeg')}
                className="px-2.5 py-2 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-extrabold cursor-pointer"
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
              </select>

              <button
                type="button"
                onClick={handleDownloadMutasi}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4A2B18] hover:bg-[#361F11] dark:bg-[#C59656] dark:hover:bg-[#B58342] text-white dark:text-[#140D09] text-xs font-extrabold cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download {mutasiFormat.toUpperCase()}</span>
              </button>
            </div>
          </div>

          {/* Authentic HTML Admin Table Preview (Exact match to attached HTML table script) */}
          <div className="overflow-x-auto rounded-xl border border-[#DFD1BE] dark:border-[#C59656]/60 bg-white p-3">
            <div
              ref={mutasiTableRef}
              className="relative bg-white text-black min-w-[780px] max-w-[980px] mx-auto p-2"
              style={{ fontFamily: 'Verdana, Geneva, sans-serif' }}
            >
              {/* Title above table matching user's exact <font color="#0000CC"><b>Transaksi  Pemain : onggeh</b></font> */}
              <div className="flex items-center justify-center gap-1.5 mb-2 select-none">
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <rect x="2" y="1.5" width="12" height="13" rx="1" fill="#E5EEF8" stroke="#3B5998" strokeWidth="1.2" />
                  <line x1="4.5" y1="5" x2="11.5" y2="5" stroke="#3B5998" strokeWidth="1.2" />
                  <line x1="4.5" y1="8" x2="11.5" y2="8" stroke="#3B5998" strokeWidth="1.2" />
                  <line x1="4.5" y1="11" x2="9.5" y2="11" stroke="#3B5998" strokeWidth="1.2" />
                </svg>
                <span
                  style={{
                    color: '#0000CC',
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: 'Verdana, Geneva, sans-serif',
                  }}
                >
                  Transaksi&nbsp;&nbsp;Pemain&nbsp;:&nbsp;{playerName}
                </span>
                <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                  <defs>
                    <radialGradient id="infoSphereMutasi" cx="35%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#7CC4FF" />
                      <stop offset="55%" stopColor="#1D5CE5" />
                      <stop offset="100%" stopColor="#0B2E8A" />
                    </radialGradient>
                  </defs>
                  <circle cx="8" cy="8" r="7" fill="url(#infoSphereMutasi)" stroke="#092266" strokeWidth="1" />
                  <ellipse cx="8" cy="4.8" rx="4.2" ry="2.1" fill="#FFFFFF" fillOpacity="0.32" />
                  <circle cx="8" cy="4.6" r="1.15" fill="#FFFFFF" />
                  <rect x="7" y="6.8" width="2" height="4.8" fill="#FFFFFF" />
                  <rect x="6" y="10.8" width="4" height="1.1" fill="#FFFFFF" />
                </svg>
              </div>

              <table
                width="100%"
                style={{
                  borderCollapse: 'separate',
                  borderSpacing: '2px',
                  fontFamily: 'Verdana, Geneva, sans-serif',
                  fontSize: '12px',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <tbody>
                  <tr style={{ backgroundColor: '#F5E363' }}>
                    {['No', 'Periode', 'Tanggal', 'Keterangan', 'Status', 'Debet', 'Kredit', 'Saldo', 'Via'].map((h) => (
                      <td
                        key={h}
                        align="center"
                        style={{
                          padding: '3px 6px',
                          color: '#000000',
                          fontWeight: 700,
                          fontSize: '12px',
                        }}
                      >
                        {h}
                      </td>
                    ))}
                    {mutasiEditMode && (
                      <td align="center" style={{ padding: '3px 6px', color: '#000000', fontWeight: 700, fontSize: '11px' }}>
                        Aksi
                      </td>
                    )}
                  </tr>

                  {/* Last Balance Row */}
                  <tr style={{ backgroundColor: '#FFDBB7' }}>
                    <td align="center" colSpan={5} style={{ padding: '3px 6px', color: '#000000', fontWeight: 700 }}>
                      &nbsp;
                    </td>
                    <td align="center" colSpan={2} style={{ padding: '3px 6px', color: '#000000', fontWeight: 700 }}>
                      Last Balance
                    </td>
                    <td align="center" style={{ padding: '3px 6px', color: '#0000FF', fontWeight: 700 }}>
                      {fmtComma(lastBalance)}
                    </td>
                    <td align="center" style={{ padding: '3px 6px', color: '#000000', fontWeight: 700 }}>
                      &nbsp;
                    </td>
                    {mutasiEditMode && <td />}
                  </tr>

                  {/* Data Rows */}
                  {mutasiRows.map((row, idx) => {
                    const bg = idx % 2 === 0 ? '#EFEFEF' : '#FFDBB7';
                    const updateRow = (patch: Partial<MutasiRow>) =>
                      setMutasiRows((prev) =>
                        prev.map((item) => (item.id === row.id ? { ...item, ...patch } : item))
                      );

                    return (
                      <tr key={row.id} style={{ backgroundColor: bg }}>
                        <td align="center" style={{ padding: '3px 6px', color: '#000000' }}>
                          {idx + 1}
                        </td>
                        <td align="center" style={{ padding: '3px 6px', color: '#000000' }}>
                          {mutasiEditMode ? (
                            <input
                              type="text"
                              value={row.periode}
                              onChange={(e) => updateRow({ periode: e.target.value })}
                              className="w-16 px-1 py-0.5 text-center border border-neutral-400 bg-white text-[11px]"
                            />
                          ) : (
                            row.periode
                          )}
                        </td>
                        <td align="center" style={{ padding: '3px 6px', color: '#000000' }}>
                          {mutasiEditMode ? (
                            <input
                              type="text"
                              value={row.tanggal}
                              onChange={(e) => updateRow({ tanggal: e.target.value })}
                              className="w-36 px-1 py-0.5 text-center border border-neutral-400 bg-white text-[11px]"
                            />
                          ) : (
                            row.tanggal
                          )}
                        </td>
                        <td align="center" style={{ padding: '3px 6px', color: '#000000' }}>
                          {mutasiEditMode ? (
                            <input
                              type="text"
                              value={row.keterangan}
                              onChange={(e) => updateRow({ keterangan: e.target.value })}
                              className="w-36 px-1 py-0.5 text-center border border-neutral-400 bg-white text-[11px]"
                            />
                          ) : (
                            row.keterangan
                          )}
                        </td>
                        <td align="center" style={{ padding: '3px 6px', color: 'red' }}>
                          {mutasiEditMode ? (
                            <select
                              value={row.status}
                              onChange={(e) =>
                                updateRow({ status: e.target.value as 'Withdraw' | 'Deposit' })
                              }
                              className="px-1 py-0.5 border border-neutral-400 bg-white text-[11px] text-red-600"
                            >
                              <option value="Withdraw">Withdraw</option>
                              <option value="Deposit">Deposit</option>
                            </select>
                          ) : (
                            row.status
                          )}
                        </td>
                        <td align="center" style={{ padding: '3px 6px', color: '#000000' }}>
                          {mutasiEditMode ? (
                            <input
                              type="number"
                              value={row.debet}
                              onChange={(e) =>
                                updateRow({ debet: Math.max(0, parseInt(e.target.value, 10) || 0) })
                              }
                              className="w-20 px-1 py-0.5 text-center border border-neutral-400 bg-white text-[11px]"
                            />
                          ) : (
                            fmtComma(row.debet)
                          )}
                        </td>
                        <td align="center" style={{ padding: '3px 6px', color: '#0000FF' }}>
                          {mutasiEditMode ? (
                            <input
                              type="number"
                              value={row.kredit}
                              onChange={(e) =>
                                updateRow({ kredit: Math.max(0, parseInt(e.target.value, 10) || 0) })
                              }
                              className="w-20 px-1 py-0.5 text-center border border-neutral-400 bg-white text-[11px] text-blue-700"
                            />
                          ) : (
                            fmtComma(row.kredit)
                          )}
                        </td>
                        <td align="center" style={{ padding: '3px 6px', color: '#0000FF' }}>
                          {mutasiEditMode ? (
                            <input
                              type="number"
                              value={row.saldo}
                              onChange={(e) =>
                                updateRow({ saldo: Math.max(0, parseInt(e.target.value, 10) || 0) })
                              }
                              className="w-20 px-1 py-0.5 text-center border border-neutral-400 bg-white text-[11px] text-blue-700"
                            />
                          ) : (
                            fmtComma(row.saldo)
                          )}
                        </td>
                        <td align="center" style={{ padding: '3px 6px', color: '#000000' }}>
                          {mutasiEditMode ? (
                            <input
                              type="text"
                              value={row.via}
                              onChange={(e) => updateRow({ via: e.target.value })}
                              className="w-16 px-1 py-0.5 text-center border border-neutral-400 bg-white text-[11px]"
                            />
                          ) : (
                            row.via
                          )}
                        </td>
                        {mutasiEditMode && (
                          <td align="center" style={{ padding: '3px 4px' }}>
                            <button
                              type="button"
                              onClick={() =>
                                setMutasiRows((prev) => prev.filter((item) => item.id !== row.id))
                              }
                              className="p-1 rounded text-red-600 hover:bg-red-100 cursor-pointer"
                              title="Hapus baris"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {mutasiWatermark && (
                <div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none"
                  aria-hidden="true"
                >
                  <div className="rotate-[-18deg] text-3xl font-extrabold tracking-widest text-[#0000CC]/10 uppercase">
                    {playerName} · {playerName} · {playerName}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= FORMAT 2: DETAIL RONDE IDN (DEBIT & CREDIT) / TRANSAKSI SEAMLESS ================= */}
      {viewMode === 'seamless' && (
        <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#EAE0D2] dark:border-[#C59656]/35">
            <div className="flex flex-wrap items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#4A2B18] dark:text-[#E5B874]" />
              <span className="text-sm font-extrabold text-black dark:text-white">
                Generator Detail Ronde IDN (Transaksi Seamless · Debit &amp; Credit)
              </span>
              <span className="text-[11px] font-semibold text-[#5D4C3E] dark:text-[#D6C7B5]">
                · Pasangan Debit (Bet) &amp; Credit (Win) otomatis
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-[#F8F4EE] dark:bg-[#140D09] border border-[#CBB9A0] dark:border-[#D4A373]/75">
                <button
                  type="button"
                  onClick={() => setViewMode('mutasi')}
                  className="px-2.5 py-1 rounded-md text-[11px] font-extrabold text-black dark:text-white hover:bg-[#EAE0D2] dark:hover:bg-[#2C1E16] cursor-pointer whitespace-nowrap"
                >
                  Mutasi Saldo
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('seamless')}
                  className="px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-[#4A2B18] text-white dark:bg-[#C59656] dark:text-[#140D09] cursor-pointer whitespace-nowrap"
                >
                  Seamless IDN
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSeamlessEditMode((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold border transition-colors cursor-pointer ${
                  seamlessEditMode
                    ? 'bg-[#4A2B18] text-white border-[#4A2B18] dark:bg-[#C59656] dark:text-[#140D09] dark:border-[#C59656]'
                    : 'bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border-[#CBB9A0] dark:border-[#D4A373]/75 hover:bg-[#EAE0D2] dark:hover:bg-[#2C1E16]'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{seamlessEditMode ? 'Edit Baris: AKTIF' : 'Edit Baris'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSeamlessWatermark((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold border transition-colors cursor-pointer ${
                  seamlessWatermark
                    ? 'bg-[#4A2B18] text-white border-[#4A2B18] dark:bg-[#C59656] dark:text-[#140D09] dark:border-[#C59656]'
                    : 'bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border-[#CBB9A0] dark:border-[#D4A373]/75 hover:bg-[#EAE0D2] dark:hover:bg-[#2C1E16]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Watermark: {seamlessWatermark ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* Seamless Inputs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            <div>
              <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
                User ID Pemain
              </label>
              <input
                type="text"
                value={seamlessPlayer}
                onChange={(e) => setSeamlessPlayer(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
                Provider Slot
              </label>
              <select
                value={seamlessProvider}
                onChange={(e) => {
                  const prov = e.target.value;
                  setSeamlessProvider(prov);
                  const list = PROVIDER_GAMES[prov];
                  if (list?.length) setSeamlessGame(list[0]);
                }}
                className="w-full px-2.5 py-2 rounded-lg bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-bold"
              >
                {Object.keys(PROVIDER_GAMES).map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
                Nama Game
              </label>
              <input
                type="text"
                value={seamlessGame}
                onChange={(e) => setSeamlessGame(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
                Jumlah Ronde
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={seamlessRounds}
                onChange={(e) => setSeamlessRounds(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-mono-tabular font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
                Bet Min
              </label>
              <input
                type="number"
                value={seamlessBetMin}
                onChange={(e) => setSeamlessBetMin(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-mono-tabular font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
                Bet Max
              </label>
              <input
                type="number"
                value={seamlessBetMax}
                onChange={(e) => setSeamlessBetMax(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-mono-tabular font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
                Saldo Awal
              </label>
              <input
                type="number"
                value={seamlessStartBal}
                onChange={(e) => setSeamlessStartBal(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-mono-tabular font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-black dark:text-white mb-1">
                Skenario
              </label>
              <select
                value={seamlessScenario}
                onChange={(e) =>
                  setSeamlessScenario(e.target.value as 'random' | 'win' | 'lose')
                }
                className="w-full px-2.5 py-2 rounded-lg bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-bold"
              >
                <option value="random">Acak Realistis</option>
                <option value="win">Menang / JP</option>
                <option value="lose">Kalah / Rungkad</option>
              </select>
            </div>
          </div>

          {/* Seamless Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAutoGenerateSeamless}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4A2B18] hover:bg-[#361F11] dark:bg-[#C59656] dark:hover:bg-[#B58342] text-white dark:text-[#140D09] text-xs font-extrabold cursor-pointer shadow-xs"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>BUAT OTOMATIS</span>
              </button>

              <button
                type="button"
                onClick={handleAddSeamlessPair}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-extrabold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah 1 Ronde (Debit+Credit)</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopySeamlessText}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F8F4EE] hover:bg-[#EAE0D2] dark:bg-[#140D09] dark:hover:bg-[#2C1E16] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-extrabold cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Text</span>
              </button>

              <select
                value={seamlessFormat}
                onChange={(e) => setSeamlessFormat(e.target.value as 'png' | 'jpeg')}
                className="px-2.5 py-2 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-extrabold cursor-pointer"
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
              </select>

              <button
                type="button"
                onClick={handleDownloadSeamless}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4A2B18] hover:bg-[#361F11] dark:bg-[#C59656] dark:hover:bg-[#B58342] text-white dark:text-[#140D09] text-xs font-extrabold cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download {seamlessFormat.toUpperCase()}</span>
              </button>
            </div>
          </div>

          {/* Seamless HTML Table Preview */}
          <div className="overflow-x-auto rounded-xl border border-[#DFD1BE] dark:border-[#C59656]/60 bg-white p-3">
            <div
              ref={seamlessTableRef}
              className="relative bg-white text-black min-w-[780px] max-w-[980px] mx-auto p-2"
              style={{ fontFamily: 'Verdana, Geneva, sans-serif' }}
            >
              <div className="flex items-center justify-center gap-1.5 mb-2 select-none">
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <rect x="2" y="1.5" width="12" height="13" rx="1" fill="#E5EEF8" stroke="#3B5998" strokeWidth="1.2" />
                  <line x1="4.5" y1="5" x2="11.5" y2="5" stroke="#3B5998" strokeWidth="1.2" />
                  <line x1="4.5" y1="8" x2="11.5" y2="8" stroke="#3B5998" strokeWidth="1.2" />
                  <line x1="4.5" y1="11" x2="9.5" y2="11" stroke="#3B5998" strokeWidth="1.2" />
                </svg>
                <span
                  style={{
                    color: '#0000CC',
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: 'Verdana, Geneva, sans-serif',
                  }}
                >
                  Transaksi&nbsp;&nbsp;Pemain&nbsp;:&nbsp;{seamlessPlayer}
                </span>
                <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                  <defs>
                    <radialGradient id="infoSphereSeamless" cx="35%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#7CC4FF" />
                      <stop offset="55%" stopColor="#1D5CE5" />
                      <stop offset="100%" stopColor="#0B2E8A" />
                    </radialGradient>
                  </defs>
                  <circle cx="8" cy="8" r="7" fill="url(#infoSphereSeamless)" stroke="#092266" strokeWidth="1" />
                  <ellipse cx="8" cy="4.8" rx="4.2" ry="2.1" fill="#FFFFFF" fillOpacity="0.32" />
                  <circle cx="8" cy="4.6" r="1.15" fill="#FFFFFF" />
                  <rect x="7" y="6.8" width="2" height="4.8" fill="#FFFFFF" />
                  <rect x="6" y="10.8" width="4" height="1.1" fill="#FFFFFF" />
                </svg>
              </div>

              <table
                width="100%"
                style={{
                  borderCollapse: 'separate',
                  borderSpacing: '2px',
                  fontFamily: 'Verdana, Geneva, sans-serif',
                  fontSize: '12px',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <tbody>
                  <tr style={{ backgroundColor: '#F5E363' }}>
                    {['No', 'Periode', 'Tanggal', 'Keterangan', 'Status', 'Debet', 'Kredit', 'Saldo', 'Via'].map((h) => (
                      <td
                        key={h}
                        align="center"
                        style={{
                          padding: '3px 6px',
                          color: '#000000',
                          fontWeight: 700,
                          fontSize: '12px',
                        }}
                      >
                        {h}
                      </td>
                    ))}
                    {seamlessEditMode && (
                      <td align="center" style={{ padding: '3px 6px', color: '#000000', fontWeight: 700, fontSize: '11px' }}>
                        Aksi
                      </td>
                    )}
                  </tr>

                  {/* Last Balance Row */}
                  <tr style={{ backgroundColor: '#FFDBB7' }}>
                    <td align="center" colSpan={5} style={{ padding: '3px 6px', color: '#000000', fontWeight: 700 }}>
                      &nbsp;
                    </td>
                    <td align="center" colSpan={2} style={{ padding: '3px 6px', color: '#000000', fontWeight: 700 }}>
                      Last Balance
                    </td>
                    <td align="center" style={{ padding: '3px 6px', color: '#0000FF', fontWeight: 700 }}>
                      {fmtComma(seamlessRows[0]?.saldo ?? 0)}
                    </td>
                    <td align="center" style={{ padding: '3px 6px', color: '#000000', fontWeight: 700 }}>
                      &nbsp;
                    </td>
                    {seamlessEditMode && <td />}
                  </tr>

                  {seamlessRows.map((row, idx) => {
                    const bg = idx % 2 === 0 ? '#EFEFEF' : '#FFDBB7';
                    const updateRow = (patch: Partial<SeamlessRow>) =>
                      setSeamlessRows((prev) =>
                        prev.map((item) => (item.id === row.id ? { ...item, ...patch } : item))
                      );

                    return (
                      <tr key={row.id} style={{ backgroundColor: bg }}>
                        <td align="center" style={{ padding: '3px 6px', color: '#000000' }}>
                          {idx + 1}
                        </td>
                        <td align="center" style={{ padding: '3px 6px', color: '#000000' }}>
                          {seamlessEditMode ? (
                            <input
                              type="text"
                              value={row.periode}
                              onChange={(e) => updateRow({ periode: e.target.value })}
                              className="w-24 px-1 py-0.5 text-center border border-neutral-400 bg-white text-[11px]"
                            />
                          ) : (
                            row.periode
                          )}
                        </td>
                        <td align="center" style={{ padding: '3px 6px', color: '#000000' }}>
                          {seamlessEditMode ? (
                            <input
                              type="text"
                              value={row.tanggal}
                              onChange={(e) => updateRow({ tanggal: e.target.value })}
                              className="w-36 px-1 py-0.5 text-center border border-neutral-400 bg-white text-[11px]"
                            />
                          ) : (
                            row.tanggal
                          )}
                        </td>
                        <td align="center" style={{ padding: '3px 6px', color: '#000000' }}>
                          {seamlessEditMode ? (
                            <input
                              type="text"
                              value={row.keterangan}
                              onChange={(e) => updateRow({ keterangan: e.target.value })}
                              className="w-40 px-1 py-0.5 text-center border border-neutral-400 bg-white text-[11px]"
                            />
                          ) : (
                            row.keterangan
                          )}
                        </td>
                        <td
                          align="center"
                          style={{
                            padding: '3px 6px',
                            color: row.status === 'Debit' ? 'red' : '#0000FF',
                          }}
                        >
                          {seamlessEditMode ? (
                            <select
                              value={row.status}
                              onChange={(e) =>
                                updateRow({ status: e.target.value as 'Debit' | 'Credit' })
                              }
                              className="px-1 py-0.5 border border-neutral-400 bg-white text-[11px]"
                            >
                              <option value="Debit">Debit</option>
                              <option value="Credit">Credit</option>
                            </select>
                          ) : (
                            row.status
                          )}
                        </td>
                        <td align="center" style={{ padding: '3px 6px', color: '#000000' }}>
                          {seamlessEditMode ? (
                            <input
                              type="number"
                              value={row.debet}
                              onChange={(e) =>
                                updateRow({ debet: Math.max(0, parseInt(e.target.value, 10) || 0) })
                              }
                              className="w-20 px-1 py-0.5 text-center border border-neutral-400 bg-white text-[11px]"
                            />
                          ) : (
                            fmtComma(row.debet)
                          )}
                        </td>
                        <td align="center" style={{ padding: '3px 6px', color: '#0000FF' }}>
                          {seamlessEditMode ? (
                            <input
                              type="number"
                              value={row.kredit}
                              onChange={(e) =>
                                updateRow({ kredit: Math.max(0, parseInt(e.target.value, 10) || 0) })
                              }
                              className="w-20 px-1 py-0.5 text-center border border-neutral-400 bg-white text-[11px] text-blue-700"
                            />
                          ) : (
                            fmtComma(row.kredit)
                          )}
                        </td>
                        <td align="center" style={{ padding: '3px 6px', color: '#0000FF' }}>
                          {seamlessEditMode ? (
                            <input
                              type="number"
                              value={row.saldo}
                              onChange={(e) =>
                                updateRow({ saldo: Math.max(0, parseInt(e.target.value, 10) || 0) })
                              }
                              className="w-20 px-1 py-0.5 text-center border border-neutral-400 bg-white text-[11px] text-blue-700"
                            />
                          ) : (
                            fmtComma(row.saldo)
                          )}
                        </td>
                        <td align="center" style={{ padding: '3px 6px', color: '#000000' }}>
                          {seamlessEditMode ? (
                            <input
                              type="text"
                              value={row.via}
                              onChange={(e) => updateRow({ via: e.target.value })}
                              className="w-20 px-1 py-0.5 text-center border border-neutral-400 bg-white text-[11px]"
                            />
                          ) : (
                            row.via
                          )}
                        </td>
                        {seamlessEditMode && (
                          <td align="center" style={{ padding: '3px 4px' }}>
                            <button
                              type="button"
                              onClick={() =>
                                setSeamlessRows((prev) => prev.filter((item) => item.id !== row.id))
                              }
                              className="p-1 rounded text-red-600 hover:bg-red-100 cursor-pointer"
                              title="Hapus baris"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {seamlessWatermark && (
                <div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none"
                  aria-hidden="true"
                >
                  <div className="rotate-[-18deg] text-3xl font-extrabold tracking-widest text-[#0000CC]/10 uppercase">
                    {seamlessPlayer} · {seamlessPlayer} · {seamlessPlayer}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
