import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ISOLATED_BLUR_HELPER_JS } from '../utils/isolatedBlurExport';

const BNI_WONDER_BODY_AND_SCRIPT = `<div class="container">
    <div class="left-panel">
      <label>Nominal Transfer</label>
      <input id="input-nominal" oninput="formatNominal(this); updateStruk();" placeholder="0">

      <label>Tanggal Transaksi</label>
      <input id="input-tanggal" oninput="updateStruk()" placeholder="04 Sep 2025">

      <label>Waktu Lengkap</label>
      <input id="input-waktu-lengkap" oninput="updateStruk()" placeholder="18:16:07 WIB">

      <label>Nomor Referensi</label>
      <input id="input-ref" oninput="updateStruk()" placeholder="0">

      <label>Nama Penerima</label>
      <input id="input-nama-penerima" oninput="updateStruk()" placeholder="ANDI SETIAWAN">

      <label>No. Rekening Penerima</label>
      <input id="input-norek-penerima" oninput="updateStruk()" placeholder="5678901234">

      <label>Nama Pengirim</label>
      <input id="input-nama-pengirim" oninput="updateStruk()" placeholder="HENDRA AJA">

      <label>4 Digit Akhir Rekening Pengirim</label>
      <input id="input-norek-pengirim-suffix" oninput="updateStruk()" maxlength="4" placeholder="012">

      <label>Format File Unduhan</label>
      <select id="input-format">
        <option value="png">PNG (Kualitas Tanpa Kompresi)</option>
        <option value="jpeg">JPEG / JPG (Ukuran Lebih Ringan)</option>
      </select>

      <div class="blur-control-wrap">
        <div class="blur-header">
          <button type="button" id="btn-blur" onclick="toggleBlur()" class="blur-toggle-btn">Efek Blur: NONAKTIF</button>
          <span id="blur-value" class="blur-hint">4 px</span>
        </div>
        <div class="blur-slider-row">
          <span class="blur-slider-label">Tingkat Blur (1–15 px)</span>
          <input id="input-blur" type="range" min="1" max="15" step="1" value="4" oninput="onBlurSliderChange()">
        </div>
      </div>

      <div class="button-group">
        <button class="btn-secondary" onclick="acakData()">Acak Data</button>
        <button class="btn-primary" onclick="downloadPNG()">Download Gambar</button>
      </div>
    </div>

    <div class="right-panel">
      <div class="frame" id="capture">
        <img src="__TEMPLATE_IMG_URL__" onerror="if(!this.dataset.fb){this.dataset.fb='1';this.src='https://ik.imagekit.io/donpablo69/WONDER.jpeg';}" class="background" alt="Struk WONDER" crossorigin="anonymous">
        <div class="overlay">
          <div class="header">
              <div class="amount" id="amount">Rp55.000.000</div>
              <div class="meta" id="datetime">11 Nov 2026 · 06:44:36 WIB ·</div>
              <div class="ref" id="ref">Ref ID: 20261111065336978946</div>
            </div>

          <div class="card rcv-card">
            <div class="line name">
              <span id="rcv_title" class="piece">Ibu</span>
              <span id="rcv_name" class="piece">LIA HERMAN</span>
            </div>
            <div class="line sub">
              <span id="rcv_bank" class="piece">BNI</span>
              <span id="src_dot1" class="piece">·</span>
              <span id="rcv_number" class="piece">5678901234</span>
            </div>
          </div>

          <div class="card src-card">
            <div class="line name"><span id="src_name" class="piece">ELLY SAFITRI</span></div>
            <div class="line sub">
              <span id="src_product" class="piece">TAPLUS</span>
              <span id="src_dot2" class="piece">·</span>
              <span id="src_number" class="piece">*******</span>
              <span id="src_number01" class="piece">989</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div id="message-box" role="alert"></div>
<script>
/* ================= UTIL ================= */
const $ = id => document.getElementById(id);

let blurEnabled = false;

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function showNotice(msg) {
  const box = $("message-box");
  if (!box) return;
  box.textContent = msg;
  box.style.display = "block";
  setTimeout(() => { box.style.display = "none"; }, 2500);
}

function rupiah(n) {
  return "Rp" + n.toLocaleString("id-ID");
}

function toNumberID(str) {
  const digits = (str || "").replace(/[^\\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

function formatNominal(el) {
  const val = toNumberID(el.value);
  el.value = val ? val.toLocaleString("id-ID") : "";
}

function maskRefId(text) {
  const str = String(text || "");
  const prefix = str.startsWith("Ref ID: ") ? "Ref ID: " : "";
  const body = prefix ? str.slice(prefix.length) : str;
  if (body.length <= 5) {
    return escapeHTML(prefix) + '<span class="partial-blur">' + escapeHTML(body) + '</span>';
  }
  const keepHead = body.length >= 9 ? 3 : 2;
  const keepTail = 4;
  const head = body.slice(0, keepHead);
  const mid = body.slice(keepHead, body.length - keepTail);
  const tail = body.slice(body.length - keepTail);
  return escapeHTML(prefix + head) + '<span class="partial-blur">' + escapeHTML(mid) + '</span>' + escapeHTML(tail);
}

function maskTrailingKeep(value, keepCount) {
  const chars = [...String(value || "")];
  const eligible = chars.map((c, i) => ({ c, i })).filter(x => /[A-Za-z0-9À-ÿ]/.test(x.c));
  const count = Math.max(0, eligible.length - keepCount);
  const blurred = new Set(eligible.slice(0, count).map(x => x.i));
  return chars
    .map((c, i) => c === " " ? " " : blurred.has(i) ? \`<span class="partial-blur">\${escapeHTML(c)}</span>\` : escapeHTML(c))
    .join("");
}

function applyBlur() {
  const blur = Math.min(15, Math.max(1, Number($("input-blur")?.value || 4)));
  document.querySelectorAll(".partial-blur").forEach(el => {
    el.style.filter = \`blur(\${blur}px)\`;
    el.style.webkitFilter = \`blur(\${blur}px)\`;
  });
  const valEl = $("blur-value");
  if (valEl) valEl.textContent = \`\${blur} px\`;
}

function renderBlurState() {
  const refEl = $("ref");
  const titleEl = $("rcv_title");
  const rcvNameEl = $("rcv_name");
  const rcvNumEl = $("rcv_number");
  const srcNameEl = $("src_name");

  [refEl, titleEl, rcvNameEl, rcvNumEl, srcNameEl].forEach(el => {
    if (el && el.dataset.raw === undefined) {
      el.dataset.raw = el.textContent || "";
    }
  });

  if (!blurEnabled) {
    if (refEl) refEl.textContent = refEl.dataset.raw;
    if (titleEl) titleEl.textContent = titleEl.dataset.raw;
    if (rcvNameEl) rcvNameEl.textContent = rcvNameEl.dataset.raw;
    if (rcvNumEl) rcvNumEl.textContent = rcvNumEl.dataset.raw;
    if (srcNameEl) srcNameEl.textContent = srcNameEl.dataset.raw;
  } else {
    if (refEl) refEl.innerHTML = maskRefId(refEl.dataset.raw);
    if (titleEl) titleEl.innerHTML = '<span class="partial-blur">' + escapeHTML(titleEl.dataset.raw) + '</span>';
    if (rcvNameEl) {
      const keepRcv = (rcvNameEl.dataset.raw || "").replace(/\\s+/g, "").length > 5 ? 3 : 2;
      rcvNameEl.innerHTML = maskTrailingKeep(rcvNameEl.dataset.raw, keepRcv);
    }
    if (rcvNumEl) rcvNumEl.innerHTML = maskTrailingKeep(rcvNumEl.dataset.raw, 3);
    if (srcNameEl) srcNameEl.innerHTML = maskTrailingKeep(srcNameEl.dataset.raw, 2);
  }

  applyBlur();
}

function updateBlurButtonUI() {
  const btn = $("btn-blur");
  if (!btn) return;
  btn.classList.toggle("is-active", blurEnabled);
  btn.textContent = blurEnabled ? "Efek Blur: AKTIF" : "Efek Blur: NONAKTIF";
}

function toggleBlur() {
  blurEnabled = !blurEnabled;
  updateBlurButtonUI();
  renderBlurState();
}

function onBlurSliderChange() {
  if (!blurEnabled) {
    blurEnabled = true;
    updateBlurButtonUI();
    renderBlurState();
  } else {
    applyBlur();
  }
}

/* ================= DATASET ACAK (WAJIB ADA) ================= */
const penerimaNames = [
  "HASAN BASRI","SITI NURHALIZA","AHMAD WIJAYA","DEWI SARTIKA","RIZKI PRATAMA",
  "MAYA SARI","ANDI SETIAWAN","BUDI PRASETYO","CINDY LESTARI","GITA NURANI",
  "JOKO SUDARSO","LISA PUTRI","YUDI PRATAMA","TANIA WULANDARI","HENDRIK KURNIAWAN",
  "VIVIANA KENCANA","FIRDAUS AHMAD","RINA MUNIR","EDY SULISTYO","ANITA KURNIATI",
  "SAMSON HALIM","LIA HERMAN","RUDI KUSUMA","NATASHA HASTARI","SYAIFUL HAKIM",
  "JESSICA NOVIANTI","IMAM ZULKIFLI","ARIYANTI SIREGAR","CATHERINE HARAHAP",
  "GUNAWAN SANTOSA","WAWAN KUSNADI","ZULFADLI MAHMUD","ELSA SUTANTO",
  "BANGKIT WIRAWAN","ANGGI YULIANTI"
];

const sumberNames = [
  "BAGASTIO ABDURRAJA","HENDRA AJA","MAYA KUSUMA","FAJAR PRATAMA","LINDA PERMATA",
  "WILLIAM SANTOSO","NADYA WULANDARI","DINO KURNIAWAN","SUSI HARTINI","BUDI ARIANTO",
  "TOMMY WINANTO","RINA MELANIA","ALDO RAHARDIAN","ELLY SAFITRI","MARCELLA HANDAYANI",
  "RAFAEL DWI","MADE WIRAWAN","FANYA KURNIA","DANI PERMANA","ANDREW TARING",
  "NADIA NURJANAH","REZA RIZAL","VINA NOVITA","YUDHI SETIAWAN","RIZKI FADILLAH",
  "JULIUS PRATAMA","EMILIA SARI","DEWANGGA ALIF","MELISSA SUTISNA","TINO KAWI",
  "RIZAL NOVIANTO","VIRGITA AGUSTINA","RAHMAT HIDAYAT","CINTA MAHARANI"
];

const rekNumbers = [
  "1908457073","5678901234","9876543210","1234567890","3456789012"
];

const srcTails = [
  "012","027","053","088","102","123","145","167","189","201",
  "234","256","278","299","301","321","345","367","389","401",
  "423","445","467","489","501","523","545","567","589","601",
  "623","645","667","689","701","723","745","767","789","801",
  "823","845","867","889","901","923","945","967","989"
];

/* ================= RANDOM NOMINAL (UNTUK ACAK SAJA) ================= */
function randNominal(){
  const MIN = 20_000_000;
  const MAX = 100_000_000;
  const STEP = 100_000;
  const P100 = 0.2;

  if (Math.random() < P100) return MAX;

  const hi = MAX - STEP;
  const steps = Math.floor((hi - MIN) / STEP) + 1;
  const idx = Math.floor(Math.random() * steps);
  return MIN + idx * STEP;
}

/* ================= GENDER (TIDAK DIUBAH) ================= */
function getGender(name) {
  const maleNames = [
    "HASAN BASRI","AHMAD WIJAYA","RIZKI PRATAMA","ANDI SETIAWAN","JOKO SUDARSO",
    "YUDI PRATAMA","HENDRIK KURNIAWAN","FIRDAUS AHMAD","EDY SULISTYO",
    "SAMSON HALIM","RUDI KUSUMA","SYAIFUL HAKIM","IMAM ZULKIFLI",
    "GUNAWAN SANTOSA","WAWAN KUSNADI","ZULFADLI MAHMUD","BANGKIT WIRAWAN"
  ];

  const femaleNames = [
    "SITI NURHALIZA","DEWI SARTIKA","MAYA SARI","CINDY LESTARI","GITA NURANI",
    "LISA PUTRI","TANIA WULANDARI","VIVIANA KENCANA","RINA MUNIR",
    "ANITA KURNIATI","LIA HERMAN","NATASHA HASTARI","JESSICA NOVIANTI",
    "CATHERINE HARAHAP","ELSA SUTANTO","ANGGI YULIANTI"
  ];

  if (maleNames.includes(name)) return "Bpk";
  if (femaleNames.includes(name)) return "Ibu";
  return "";
}

/* ================= UPDATE STRUK (INTI) ================= */
function updateStruk() {

  // Nominal (BEBAS, TANPA BATASAN)
  const n = toNumberID($("input-nominal").value);
  $("amount").textContent = n ? rupiah(n) : "Rp0";

  // Tanggal & Waktu
  const tgl = $("input-tanggal").value.trim();
  const wkt = $("input-waktu-lengkap").value.trim();
  if (tgl && wkt) {
    $("datetime").textContent = \`\${tgl} · \${wkt} ·\`;
  }

  // Ref ID
  const ref = $("input-ref").value.trim();
  if (ref) $("ref").dataset.raw = \`Ref ID: \${ref}\`;

  // Nama Penerima (LOGIKA ASLI)
  const namaPenerima = $("input-nama-penerima").value.trim();
  if (namaPenerima) {
    $("rcv_name").dataset.raw = namaPenerima;
    const title = getGender(namaPenerima.toUpperCase());
    $("rcv_title").dataset.raw = title ? title : "Bpk";
  }

  // Rekening Penerima
  const rekPenerima = $("input-norek-penerima").value.trim();
  if (rekPenerima) $("rcv_number").dataset.raw = rekPenerima;

  // Nama Pengirim (LOGIKA ASLI)
  const namaPengirim = $("input-nama-pengirim").value.trim();
  if (namaPengirim) $("src_name").dataset.raw = namaPengirim;

  // Rekening Pengirim
  const suf = $("input-norek-pengirim-suffix").value.trim();
  if (suf) {
    $("src_number").textContent = "*******";
    $("src_number01").textContent = suf;
  }

  renderBlurState();
}

/* ================= ACAK DATA ================= */
function acakData() {
  const now = new Date();

  const penerima = penerimaNames[Math.floor(Math.random() * penerimaNames.length)];
  const pengirim = sumberNames[Math.floor(Math.random() * sumberNames.length)];
  const rekening = rekNumbers[Math.floor(Math.random() * rekNumbers.length)];
  const suf = srcTails[Math.floor(Math.random() * srcTails.length)];

  const YYYY = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, "0");
  const DD = String(now.getDate()).padStart(2, "0");
  const HH = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  const random6 = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");

  $("input-ref").value = \`\${YYYY}\${MM}\${DD}\${HH}\${mm}\${ss}\${random6}\`;

  const nominal = randNominal();
  $("input-nominal").value = nominal.toString();
  formatNominal($("input-nominal"));

  $("input-tanggal").value = now.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  $("input-waktu-lengkap").value =
    now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).replaceAll(".", ":") + " WIB";

  $("input-nama-penerima").value = penerima;
  $("input-norek-penerima").value = rekening;
  $("input-nama-pengirim").value = pengirim;
  $("input-norek-pengirim-suffix").value = suf;

  updateStruk();
}

${ISOLATED_BLUR_HELPER_JS}

/* ================= DOWNLOAD PNG / JPEG ================= */
async function downloadPNG() {
  const el = document.getElementById("capture");
  const format = document.getElementById("input-format")?.value || "png";
  const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
  const quality = format === "jpeg" ? 0.95 : undefined;
  const ext = format === "jpeg" ? "jpg" : "png";

  el.classList.add("clean-download");
  try {
    await document.fonts.ready;
    const radiusCss = parseFloat($("input-blur")?.value || "4") || 4;
    const canvas = await renderReceiptWithIsolatedBlur(el, {
      useCORS: true,
      scale: 3,
      backgroundColor: "#ffffff"
    }, radiusCss);

    canvas.toBlob(blob => {
      if (!blob) return showNotice("Gagal membuat gambar.");
      const a = document.createElement("a");
      a.download = \`Struk-WONDER-BNI.\${ext}\`;
      a.href = URL.createObjectURL(blob);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      showNotice(\`Struk \${format.toUpperCase()} berhasil diunduh!\`);
    }, mimeType, quality);
  } catch (err) {
    showNotice("Gagal mengunduh gambar.");
    console.error(err);
  } finally {
    el.classList.remove("clean-download");
  }
}
</script>
</div>`;

export const BniWonderGeneratorEmbed: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState<number>(880);
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : false
  );

  useEffect(() => {
    const syncTheme = () => {
      const dark = document.documentElement.classList.contains('dark');
      setIsDark(dark);
      const doc = iframeRef.current?.contentDocument;
      if (doc?.documentElement) {
        doc.documentElement.classList.toggle('dark', dark);
      }
    };
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  const templateImgUrl = useMemo(() => {
    if (typeof document !== 'undefined') {
      try {
        return new URL('./assets/bniwonder-template.jpg', document.baseURI).href;
      } catch {
        return './assets/bniwonder-template.jpg';
      }
    }
    return './assets/bniwonder-template.jpg';
  }, []);

  const srcDoc = useMemo(() => {
    const bodyWithTemplate = BNI_WONDER_BODY_AND_SCRIPT.replace(
      '__TEMPLATE_IMG_URL__',
      templateImgUrl
    );
    return `<!DOCTYPE html>
<html lang="id" class="${isDark ? 'dark' : ''}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Struk WONDER by BNI</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<style>
*{box-sizing:border-box}
body{margin:0;padding:22px 20px 50px;background:transparent;color:#000000;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;transition:color .2s}
html.dark body{color:#ffffff}
.container{max-width:1120px;margin:auto;display:grid;grid-template-columns:minmax(320px,1fr) minmax(300px,0.95fr);gap:28px;align-items:start}
.left-panel{background:#ffffff;padding:22px;border-radius:16px;border:1px solid #D4C4AE;box-shadow:0 2px 10px rgba(74,43,24,.06)}
html.dark .left-panel{background:#1F150F;border-color:#3A281D;box-shadow:0 2px 10px rgba(0,0,0,.35)}
.left-panel label{display:block;font-size:12px;font-weight:800;margin:10px 0 5px;color:#000000}
.left-panel label:first-child{margin-top:0}
html.dark .left-panel label{color:#ffffff}
.left-panel input:not([type="range"]),.left-panel select{display:block;width:100%;padding:10px 12px;border:1px solid #CBB9A0;border-radius:10px;font-size:13px;font-weight:600;background:#F8F4EE;color:#000000}
html.dark .left-panel input:not([type="range"]),html.dark .left-panel select{background:#140D09;border-color:#4D3627;color:#ffffff}
.left-panel input:not([type="range"]):focus,.left-panel select:focus{outline:2px solid #4A2B18;outline-offset:1px}
html.dark .left-panel input:not([type="range"]):focus,html.dark .left-panel select:focus{outline-color:#C59656}
.blur-control-wrap{margin-top:12px;padding:12px;border-radius:12px;background:#F8F4EE;border:1px solid #DFD1BE;display:flex;flex-direction:column;gap:8px}
html.dark .blur-control-wrap{background:#140D09;border-color:#3A281D}
.blur-header{display:flex;align-items:center;justify-content:space-between;gap:10px}
.blur-toggle-btn{flex:1;border-radius:9px;padding:9px 12px;font-weight:800;font-size:12px;cursor:pointer;border:1px solid #CBB9A0;background:#EAE0D2;color:#000000;text-align:center}
html.dark .blur-toggle-btn{background:#2C1E16;color:#ffffff;border-color:#4D3627}
.blur-toggle-btn.is-active{background:#4A2B18;color:#ffffff;border-color:#4A2B18}
html.dark .blur-toggle-btn.is-active{background:#C59656;color:#140D09;border-color:#C59656}
.blur-hint{font-size:12px;font-weight:800;color:#4A2B18;min-width:40px;text-align:right}
html.dark .blur-hint{color:#E5B874}
.blur-slider-row{display:flex;align-items:center;gap:10px}
.blur-slider-label{font-size:11px;font-weight:700;color:#5D4C3E;white-space:nowrap}
html.dark .blur-slider-label{color:#D6C7B5}
.blur-slider-row input[type="range"]{flex:1;margin:0;padding:0;border:0;background:transparent;accent-color:#4A2B18;cursor:pointer}
html.dark .blur-slider-row input[type="range"]{accent-color:#C59656}
.button-group{display:flex;gap:10px;margin-top:16px}
.button-group button{flex:1;padding:11px 14px;border-radius:10px;font-size:12px;font-weight:800;cursor:pointer;transition:filter .15s;border:1px solid transparent}
.btn-secondary{background:#EAE0D2;color:#000000;border-color:#CBB9A0 !important}
html.dark .btn-secondary{background:#2C1E16;color:#ffffff;border-color:#4D3627 !important}
.btn-primary{background:#4A2B18;color:#ffffff;border-color:#4A2B18 !important}
html.dark .btn-primary{background:#C59656;color:#140D09;border-color:#C59656 !important}
.button-group button:hover{filter:brightness(.94)}
.right-panel{display:flex;justify-content:center;min-width:0}
.frame{position:relative;width:min(100%,365px);aspect-ratio:720 / 1459;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 12px 30px rgba(74,43,24,.18)}
.frame.clean-download{border-radius:0 !important;box-shadow:none !important}
.background{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;display:block}
.overlay{position:absolute;inset:0;font-family:Arial,Helvetica,sans-serif;color:#111827}
.partial-blur{display:inline-block;filter:blur(4px);-webkit-filter:blur(4px);color:inherit}
.header{position:absolute;top:25.4%;left:6%;width:88%;text-align:center}
.amount{font-size:clamp(22px,6.4vw,27px);font-weight:800;color:#111827;letter-spacing:-0.02em;line-height:1.15}
.meta{margin-top:8px;font-size:clamp(10px,2.8vw,11.5px);font-weight:500;color:#6b7280}
.ref{margin-top:4px;font-size:clamp(10px,2.8vw,11.5px);font-weight:500;color:#6b7280}
.card{position:absolute;left:6.3%;width:87.3%;height:8.6%;display:flex;flex-direction:column;justify-content:center;padding:0 4.6%}
.rcv-card{top:57.75%}
.src-card{top:71.5%}
.line.name{font-size:clamp(12px,3.4vw,14px);font-weight:700;color:#111827;line-height:1.25;white-space:nowrap}
#rcv_title{margin-right:4px}
.line.sub{margin-top:3px;display:flex;align-items:center;font-size:clamp(10.5px,3vw,12.5px);font-weight:500;color:#6b7280;line-height:1.25;white-space:nowrap}
#src_dot1,#src_dot2{margin:0 5px}
#message-box{display:none;position:fixed;bottom:18px;right:18px;padding:10px 16px;border-radius:10px;background:#4A2B18;color:#ffffff;font-size:12px;font-weight:800;box-shadow:0 8px 20px rgba(0,0,0,.22);z-index:50}
html.dark #message-box{background:#C59656;color:#140D09}
@media(max-width:760px){body{padding:10px 10px 50px}.container{grid-template-columns:1fr}.frame{width:min(100%,340px)}}
</style>
</head>
<body>
${bodyWithTemplate}
</body>
</html>`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateImgUrl]);

  const syncIframeHeight = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    doc.documentElement.classList.toggle(
      'dark',
      document.documentElement.classList.contains('dark')
    );
    const wrapper = doc.querySelector('.container') as HTMLElement | null;
    if (wrapper) {
      const nextHeight = Math.ceil(wrapper.offsetTop + wrapper.offsetHeight + 50);
      if (nextHeight > 200) {
        setIframeHeight((prev) => (prev === nextHeight ? prev : nextHeight));
      }
    }
  };

  useEffect(() => {
    const interval = window.setInterval(syncIframeHeight, 400);
    window.addEventListener('resize', syncIframeHeight);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('resize', syncIframeHeight);
    };
  }, []);

  return (
    <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 overflow-hidden">
      <iframe
        ref={iframeRef}
        title="Generator Struk BNI Wonder"
        srcDoc={srcDoc}
        onLoad={syncIframeHeight}
        style={{ height: `${iframeHeight}px` }}
        className="w-full border-0 block bg-transparent"
      />
    </div>
  );
};
