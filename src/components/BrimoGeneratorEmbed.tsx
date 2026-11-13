import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ISOLATED_BLUR_HELPER_JS } from '../utils/isolatedBlurExport';

const BRIMO_BODY_AND_SCRIPT = `<div class="main-wrapper">
  <!-- LEFT PANEL -->
  <div id="control-panel">
    <div class="panel-header">
      <div class="panel-title">
        <span class="panel-dot"></span>
        <span>PENGATURAN STRUK BRI</span>
      </div>
      <button type="button" class="btn-time" onclick="setWaktuSekarang()">&#128338; Waktu Sekarang</button>
    </div>

    <div class="field-block">
      <div class="label-row">
        <label for="input-tanggal">1. Tanggal &amp; Waktu Transaksi (Otomatis)</label>
        <span class="badge-sync">Auto-Sync</span>
      </div>
      <input type="text" id="input-tanggal" oninput="updateStruk()" value="13 November 2026, 15:16:13 WIB">
    </div>

    <div class="field-block">
      <label for="input-nominal">2. Nominal Total Transaksi (Rp)</label>
      <input type="text" id="input-nominal" oninput="formatNominal(this); updateStruk();" value="6.000.000" class="input-nominal-val">
    </div>

    <div class="field-block">
      <label for="input-ref">3. Nomor Referensi (No. Ref)</label>
      <input type="text" id="input-ref" oninput="updateStruk()" value="205582210597" class="input-ref-val">
    </div>

    <div class="group-box">
      <div class="group-title">4. DATA SUMBER DANA (PENGIRIM)</div>
      <div class="two-col">
        <div>
          <label for="input-nama-pengirim">Nama Sumber Dana</label>
          <input type="text" id="input-nama-pengirim" oninput="updateStruk()" value="Adin">
        </div>
        <div>
          <label for="input-norek-pengirim">No. Rekening Pengirim</label>
          <input type="text" id="input-norek-pengirim" oninput="updateStruk()" value="3460 **** **** 508">
        </div>
      </div>
    </div>

    <div class="group-box">
      <div class="group-title">5. DATA TUJUAN (PENERIMA)</div>
      <div class="two-col">
        <div>
          <label for="input-nama-tujuan">Nama Tujuan</label>
          <input type="text" id="input-nama-tujuan" oninput="updateStruk()" value="ELIS KARTIWI">
        </div>
        <div>
          <label for="input-norek-tujuan">No. Rekening Tujuan</label>
          <input type="text" id="input-norek-tujuan" oninput="updateStruk()" value="3675 0100 4888 503" class="input-ref-val">
        </div>
      </div>
    </div>

    <div class="field-block">
      <label for="input-format">Format File Unduhan</label>
      <select id="input-format">
        <option value="png">PNG (Kualitas Tanpa Kompresi)</option>
        <option value="jpeg">JPEG / JPG (Ukuran Lebih Ringan)</option>
      </select>
    </div>

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

    <div class="button-row">
      <button type="button" class="btn-secondary" onclick="acakData()">&#8644; ACAK DATA</button>
      <button type="button" class="btn-primary" onclick="download()">&#11015; DOWNLOAD GAMBAR</button>
    </div>

    <button type="button" class="btn-copy-wa" onclick="copyWhatsAppText()">Salin Format Teks Chat / WhatsApp</button>
  </div>

  <!-- RIGHT PANEL -->
  <div class="preview-column">
    <div class="preview-caption">Pratinjau Struk Transfer BRImo (Presisi HD)</div>
    <div class="container" id="struk">
      <img src="__TEMPLATE_IMG_URL__" onerror="if(!this.dataset.fb){this.dataset.fb='1';this.src='https://ik.imagekit.io/donpablo69/BRIMOO';}" class="background" alt="Struk BRImo" crossorigin="anonymous">
      <div class="overlay">
        <div class="field" id="tanggal-waktu">13 November 2026, 15:16:13 WIB</div>
        <div class="field" id="nominal">Rp6.000.000</div>
        <div class="field" id="no-ref">205582210597</div>

        <div class="avatar" id="inisial-pengirim">A</div>
        <div class="field" id="nama-pengirim">Adin</div>
        <div class="field bank-label" id="bank-pengirim">BANK BRI</div>
        <div class="field norek-label" id="norek-pengirim">3460 **** **** 508</div>

        <div class="avatar avatar-tujuan" id="inisial-tujuan">EK</div>
        <div class="field" id="nama-tujuan">ELIS KARTIWI</div>
        <div class="field bank-label" id="bank-tujuan">BANK BRI</div>
        <div class="field norek-label" id="norek-tujuan">3675 0100 4888 503</div>
      </div>
    </div>
  </div>
</div>

<div id="message-box" role="alert"></div>

<script>
  const getInputValue = (id) => document.getElementById(id)?.value ?? "";
  let blurEnabled = false;

  const BULAN_ID = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember"
  ];

  const SENDER_SAMPLES = [
    "Adin", "Surya Pratama", "Budi Santoso", "Hendra Wijaya",
    "Rizki Ramadhan", "Bagas Kusuma", "Dimas Saputra", "Andi Nugroho"
  ];

  const RECIPIENT_SAMPLES = [
    "ELIS KARTIWI", "BENI RAHWALI", "HARTANTO WIJAYA", "SITI NURHALIZA",
    "BAMBANG SUTEDJO", "RIAN FIRMANSYAH", "DEWI SARTIKA", "AGUS SALIM"
  ];

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function showNotice(msg) {
    const box = document.getElementById("message-box");
    if (!box) return;
    box.textContent = msg;
    box.style.display = "block";
    setTimeout(() => { box.style.display = "none"; }, 2500);
  }

  function formatNominal(inputElement) {
    const value = inputElement.value.replace(/[^\\d]/g, "");
    inputElement.value = value ? parseInt(value, 10).toLocaleString("id-ID") : "";
  }

  function getInitials(name) {
    const words = String(name || "").trim().split(/\\s+/).filter(Boolean);
    if (words.length === 0) return "BR";
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }

  function formatCurrentBriTime() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = BULAN_ID[now.getMonth()];
    const year = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    return \`\${day} \${month} \${year}, \${hh}:\${mm}:\${ss} WIB\`;
  }

  function setWaktuSekarang() {
    document.getElementById("input-tanggal").value = formatCurrentBriTime();
    updateStruk();
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

  function maskMiddleKeepEnds(value, keepHead, keepTail) {
    const str = String(value || "");
    if (!str) return "";
    const chars = [...str];
    const total = chars.length;
    if (total <= keepHead + keepTail) {
      return '<span class="partial-blur">' + escapeHTML(str) + '</span>';
    }
    const head = chars.slice(0, keepHead).join("");
    const mid = chars.slice(keepHead, total - keepTail).join("");
    const tail = chars.slice(total - keepTail).join("");
    return escapeHTML(head) + '<span class="partial-blur">' + escapeHTML(mid) + '</span>' + escapeHTML(tail);
  }

  function applyBlur() {
    const blur = Math.min(15, Math.max(1, Number(document.getElementById("input-blur")?.value || 4)));
    document.querySelectorAll(".partial-blur").forEach(el => {
      el.style.filter = \`blur(\${blur}px)\`;
      el.style.webkitFilter = \`blur(\${blur}px)\`;
    });
    const valEl = document.getElementById("blur-value");
    if (valEl) valEl.textContent = \`\${blur} px\`;
  }

  function renderBlurState() {
    const refEl = document.getElementById("no-ref");
    const pengEl = document.getElementById("nama-pengirim");
    const tujEl = document.getElementById("nama-tujuan");
    const rekTujEl = document.getElementById("norek-tujuan");

    [refEl, pengEl, tujEl, rekTujEl].forEach(el => {
      if (el && el.dataset.raw === undefined) {
        el.dataset.raw = el.innerText || "";
      }
    });

    if (!blurEnabled) {
      if (refEl) refEl.textContent = refEl.dataset.raw;
      if (pengEl) pengEl.textContent = pengEl.dataset.raw;
      if (tujEl) tujEl.textContent = tujEl.dataset.raw;
      if (rekTujEl) rekTujEl.textContent = rekTujEl.dataset.raw;
    } else {
      if (refEl) {
        const rawRef = refEl.dataset.raw || "";
        refEl.innerHTML = maskTrailingKeep(rawRef, rawRef.length >= 4 ? 2 : 1);
      }
      if (pengEl) {
        const rawPeng = pengEl.dataset.raw || "";
        const compactLen = rawPeng.replace(/\\s+/g, "").length;
        const keepH = compactLen > 3 ? 1 : 0;
        const keepT = compactLen > 4 ? 2 : 1;
        pengEl.innerHTML = maskMiddleKeepEnds(rawPeng, keepH, keepT);
      }
      if (tujEl) {
        const rawTuj = tujEl.dataset.raw || "";
        const compactLen = rawTuj.replace(/\\s+/g, "").length;
        const keepH = compactLen > 4 ? 2 : 1;
        const keepT = compactLen > 7 ? 4 : compactLen > 4 ? 2 : 1;
        tujEl.innerHTML = maskMiddleKeepEnds(rawTuj, keepH, keepT);
      }
      if (rekTujEl) {
        const rawRek = rekTujEl.dataset.raw || "";
        const compactLen = rawRek.replace(/\\s+/g, "").length;
        const keepH = compactLen >= 8 ? 3 : 2;
        const keepT = compactLen >= 6 ? 2 : 1;
        rekTujEl.innerHTML = maskMiddleKeepEnds(rawRek, keepH, keepT);
      }
    }

    applyBlur();
  }

  function updateBlurButtonUI() {
    const btn = document.getElementById("btn-blur");
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

  function updateStruk() {
    const tgl = getInputValue("input-tanggal");
    const nominalRaw = getInputValue("input-nominal").replace(/[^\\d]/g, "");
    const ref = getInputValue("input-ref");
    const namaPengirim = getInputValue("input-nama-pengirim");
    const norekPengirim = getInputValue("input-norek-pengirim");
    const namaTujuan = getInputValue("input-nama-tujuan");
    const norekTujuan = getInputValue("input-norek-tujuan");

    document.getElementById("tanggal-waktu").innerText = tgl;
    document.getElementById("nominal").innerText = nominalRaw
      ? "Rp" + parseInt(nominalRaw, 10).toLocaleString("id-ID")
      : "Rp0";

    document.getElementById("no-ref").dataset.raw = ref;
    document.getElementById("inisial-pengirim").innerText = getInitials(namaPengirim);
    document.getElementById("nama-pengirim").dataset.raw = namaPengirim;
    document.getElementById("norek-pengirim").innerText = norekPengirim;

    document.getElementById("inisial-tujuan").innerText = getInitials(namaTujuan);
    document.getElementById("nama-tujuan").dataset.raw = namaTujuan;
    document.getElementById("norek-tujuan").dataset.raw = norekTujuan;

    renderBlurState();
  }

  function acakData() {
    document.getElementById("input-tanggal").value = formatCurrentBriTime();

    const nominal = (Math.floor(Math.random() * 190) + 10) * 100000;
    document.getElementById("input-nominal").value = nominal.toLocaleString("id-ID");

    const refNum = String(Math.floor(100000000000 + Math.random() * 899999999999));
    document.getElementById("input-ref").value = refNum;

    const pengirim = SENDER_SAMPLES[Math.floor(Math.random() * SENDER_SAMPLES.length)];
    const pHead = String(Math.floor(1000 + Math.random() * 8999));
    const pTail = String(Math.floor(100 + Math.random() * 899));
    document.getElementById("input-nama-pengirim").value = pengirim;
    document.getElementById("input-norek-pengirim").value = \`\${pHead} **** **** \${pTail}\`;

    const tujuan = RECIPIENT_SAMPLES[Math.floor(Math.random() * RECIPIENT_SAMPLES.length)];
    const r1 = String(Math.floor(1000 + Math.random() * 8999));
    const r2 = "0100";
    const r3 = String(Math.floor(1000 + Math.random() * 8999));
    const r4 = String(Math.floor(100 + Math.random() * 899));
    document.getElementById("input-nama-tujuan").value = tujuan;
    document.getElementById("input-norek-tujuan").value = \`\${r1} \${r2} \${r3} \${r4}\`;

    updateStruk();
  }

  function copyWhatsAppText() {
    const tgl = getInputValue("input-tanggal");
    const nominalRaw = getInputValue("input-nominal").replace(/[^\\d]/g, "");
    const nominalFmt = nominalRaw ? "Rp" + parseInt(nominalRaw, 10).toLocaleString("id-ID") : "Rp0";
    const ref = getInputValue("input-ref");
    const pengirim = getInputValue("input-nama-pengirim");
    const norekPengirim = getInputValue("input-norek-pengirim");
    const tujuan = getInputValue("input-nama-tujuan");
    const norekTujuan = getInputValue("input-norek-tujuan");

    const text = [
      "*BUKTI TRANSFER BRIMO*",
      "Status: Transaksi Berhasil",
      \`Tanggal: \${tgl}\`,
      \`Total Transaksi: \${nominalFmt}\`,
      \`No. Ref: \${ref}\`,
      \`Sumber Dana: \${pengirim} (BANK BRI - \${norekPengirim})\`,
      \`Tujuan: \${tujuan} (BANK BRI - \${norekTujuan})\`
    ].join("\\n");

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showNotice("Format WhatsApp berhasil disalin!");
      }).catch(() => {
        showNotice("Teks siap disalin.");
      });
    } else {
      showNotice("Clipboard tidak tersedia.");
    }
  }

  ${ISOLATED_BLUR_HELPER_JS}

  async function download() {
    updateStruk();

    const struk = document.getElementById("struk");
    const format = document.getElementById("input-format")?.value || "png";
    const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
    const quality = format === "jpeg" ? 0.95 : undefined;
    const ext = format === "jpeg" ? "jpg" : "png";

    struk.classList.add("clean-download");
    try {
      await document.fonts.ready;
      const radiusCss = parseFloat(document.getElementById("input-blur")?.value || "4") || 4;
      const canvas = await renderReceiptWithIsolatedBlur(struk, {
        useCORS: true,
        backgroundColor: "#ffffff",
        scale: 3,
        width: struk.offsetWidth,
        height: struk.offsetHeight,
        scrollX: 0,
        scrollY: 0
      }, radiusCss);

      canvas.toBlob(blob => {
        if (!blob) return showNotice("Gagal membuat gambar.");
        const link = document.createElement("a");
        link.download = \`struk-brimo-\${Date.now()}.\${ext}\`;
        link.href = URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(link.href);
        showNotice(\`Struk \${format.toUpperCase()} berhasil diunduh!\`);
      }, mimeType, quality);
    } catch (err) {
      showNotice("Gagal mengunduh gambar.");
      console.error(err);
    } finally {
      struk.classList.remove("clean-download");
    }
  }

  window.onload = function() {
    setWaktuSekarang();
  };
</script>`;

export const BrimoGeneratorEmbed: React.FC = () => {
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
        return new URL('./assets/brimo-template.jpg', document.baseURI).href;
      } catch {
        return './assets/brimo-template.jpg';
      }
    }
    return './assets/brimo-template.jpg';
  }, []);

  const srcDoc = useMemo(() => {
    const bodyWithTemplate = BRIMO_BODY_AND_SCRIPT.replace(
      '__TEMPLATE_IMG_URL__',
      templateImgUrl
    );
    return `<!DOCTYPE html>
<html lang="id" class="${isDark ? 'dark' : ''}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PENGATURAN STRUK BRI</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<style>
*{box-sizing:border-box}
body{margin:0;padding:20px 20px 50px;background:transparent;color:#000000;font-family:'Plus Jakarta Sans','Inter',Arial,sans-serif;transition:color .2s}
html.dark body{color:#ffffff}
.main-wrapper{max-width:1160px;margin:auto;display:grid;grid-template-columns:minmax(340px,1.08fr) minmax(300px,0.92fr);gap:28px;align-items:start}
#control-panel{background:#ffffff;padding:22px;border-radius:16px;border:1px solid #D4C4AE;box-shadow:0 2px 10px rgba(74,43,24,.06);display:flex;flex-direction:column;gap:14px}
html.dark #control-panel{background:#1F150F;border-color:#3A281D;box-shadow:0 2px 10px rgba(0,0,0,.35)}
.panel-header{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-bottom:12px;border-bottom:1px solid #E5DACB}
html.dark .panel-header{border-bottom-color:#332218}
.panel-title{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:800;letter-spacing:.03em;color:#000000}
html.dark .panel-title{color:#ffffff}
.panel-dot{width:9px;height:9px;border-radius:999px;background:#4A2B18;display:inline-block}
html.dark .panel-dot{background:#E5B874}
.btn-time{padding:7px 12px;border-radius:9px;border:1px solid #CBB9A0;background:#EAE0D2;color:#000000;font-size:11px;font-weight:800;cursor:pointer}
html.dark .btn-time{background:#2C1E16;color:#ffffff;border-color:#4D3627}
.btn-time:hover{filter:brightness(.94)}
.field-block{display:flex;flex-direction:column;gap:5px}
.label-row{display:flex;align-items:center;justify-content:space-between;gap:8px}
#control-panel label{display:block;font-size:11.5px;font-weight:800;color:#2E221B}
html.dark #control-panel label{color:#F3ECE3}
.badge-sync{padding:2px 8px;border-radius:6px;font-size:10px;font-weight:800;background:#E4F4EC;color:#147D4E;border:1px solid #B7E4CE}
html.dark .badge-sync{background:#123824;color:#6EE7A8;border-color:#1F5A3B}
#control-panel input:not([type="range"]),#control-panel select{display:block;width:100%;padding:10px 12px;border:1px solid #CBB9A0;border-radius:10px;font-size:13px;font-weight:600;background:#F8F4EE;color:#000000}
html.dark #control-panel input:not([type="range"]),html.dark #control-panel select{background:#140D09;border-color:#4D3627;color:#ffffff}
#control-panel input:not([type="range"]):focus,#control-panel select:focus{outline:2px solid #4A2B18;outline-offset:1px}
html.dark #control-panel input:not([type="range"]):focus,html.dark #control-panel select:focus{outline-color:#C59656}
.input-nominal-val{font-weight:800 !important;color:#147D4E !important}
html.dark .input-nominal-val{color:#6EE7A8 !important}
.input-ref-val{font-weight:800 !important;color:#4A2B18 !important}
html.dark .input-ref-val{color:#E5B874 !important}
.group-box{padding:14px;border-radius:12px;background:#FBF8F3;border:1px solid #DFD1BE;display:flex;flex-direction:column;gap:10px}
html.dark .group-box{background:#17100B;border-color:#3A281D}
.group-title{font-size:11px;font-weight:800;letter-spacing:.03em;color:#4A2B18}
html.dark .group-title{color:#E5B874}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.two-col label{margin-bottom:4px}
.blur-control-wrap{padding:12px;border-radius:12px;background:#F8F4EE;border:1px solid #DFD1BE;display:flex;flex-direction:column;gap:8px}
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
.button-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.button-row button{padding:11px 14px;border-radius:10px;font-size:12px;font-weight:800;cursor:pointer;transition:filter .15s;border:1px solid transparent}
.btn-secondary{background:#EAE0D2;color:#000000;border-color:#CBB9A0 !important}
html.dark .btn-secondary{background:#2C1E16;color:#ffffff;border-color:#4D3627 !important}
.btn-primary{background:#4A2B18;color:#ffffff;border-color:#4A2B18 !important}
html.dark .btn-primary{background:#C59656;color:#140D09;border-color:#C59656 !important}
.button-row button:hover,.btn-copy-wa:hover{filter:brightness(.94)}
.btn-copy-wa{width:100%;padding:10px 14px;border-radius:10px;font-size:12px;font-weight:800;cursor:pointer;background:#F8F4EE;color:#000000;border:1px solid #CBB9A0}
html.dark .btn-copy-wa{background:#140D09;color:#ffffff;border-color:#4D3627}
.preview-column{display:flex;flex-direction:column;align-items:center;min-width:0;gap:10px}
.preview-caption{font-size:12px;font-weight:800;color:#4A2B18}
html.dark .preview-caption{color:#E5B874}
.container{position:relative;width:min(100%,365px);aspect-ratio:720 / 1571;background:#ffffff;border-radius:22px;border:5px solid #2C1E16;overflow:hidden;box-shadow:0 14px 34px rgba(74,43,24,.22)}
html.dark .container{border-color:#4D3627;box-shadow:0 14px 34px rgba(0,0,0,.45)}
.container.clean-download{border:none !important;border-radius:0 !important;box-shadow:none !important}
.background{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;display:block}
.overlay{position:absolute;inset:0;font-family:'Inter',Arial,Helvetica,sans-serif;color:#111827}
.partial-blur{display:inline-block;filter:blur(4px);-webkit-filter:blur(4px);color:inherit}
.field{position:absolute;line-height:1.25;white-space:nowrap}
#tanggal-waktu{top:19.85%;left:8%;width:84%;text-align:center;color:#ffffff;font-size:clamp(10px,2.75vw,11.3px);font-weight:500;letter-spacing:-0.01em}
#nominal{top:31.25%;left:10%;width:80%;text-align:center;color:#16528E;font-size:clamp(18.5px,5.3vw,21.5px);font-weight:800;letter-spacing:-0.02em}
#no-ref{top:36.25%;right:9.2%;text-align:right;color:#1F2937;font-size:clamp(10px,2.8vw,11.5px);font-weight:500}
.avatar{position:absolute;left:11.1%;top:45.55%;width:11.0%;height:4.9%;display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:clamp(12.5px,3.6vw,14.5px);font-weight:700;letter-spacing:-0.01em}
.avatar-tujuan{top:60.1%;height:5.05%;color:#1864AB}
#nama-pengirim{top:45.15%;left:24.5%;color:#111827;font-size:clamp(11px,3.15vw,12.5px);font-weight:700}
#bank-pengirim{top:47.45%;left:24.5%}
#norek-pengirim{top:49.5%;left:24.5%}
#nama-tujuan{top:59.9%;left:24.5%;color:#111827;font-size:clamp(11px,3.15vw,12.5px);font-weight:700}
#bank-tujuan{top:62.2%;left:24.5%}
#norek-tujuan{top:64.25%;left:24.5%}
.bank-label,.norek-label{color:#6B7280;font-size:clamp(9.5px,2.7vw,10.7px);font-weight:500}
#message-box{display:none;position:fixed;bottom:18px;right:18px;padding:10px 16px;border-radius:10px;background:#4A2B18;color:#ffffff;font-size:12px;font-weight:800;box-shadow:0 8px 20px rgba(0,0,0,.22);z-index:50}
html.dark #message-box{background:#C59656;color:#140D09}
@media(max-width:780px){body{padding:10px 10px 50px}.main-wrapper{grid-template-columns:1fr}.two-col{grid-template-columns:1fr}.container{width:min(100%,345px)}}
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
    const wrapper = doc.querySelector('.main-wrapper') as HTMLElement | null;
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
    <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] overflow-hidden">
      <iframe
        ref={iframeRef}
        title="Generator Struk BRImo"
        srcDoc={srcDoc}
        onLoad={syncIframeHeight}
        style={{ height: `${iframeHeight}px` }}
        className="w-full border-0 block bg-transparent"
      />
    </div>
  );
};
