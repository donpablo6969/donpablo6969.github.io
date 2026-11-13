import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ISOLATED_BLUR_HELPER_JS } from '../utils/isolatedBlurExport';

const BCA_MOBILE_BODY_AND_SCRIPT = `<h2>Edit Struk m&#8209;BCA Instan</h2>
    
    <div class="main-wrapper">
        
        <!-- CONTROL PANEL UNTUK EDIT DATA -->
        <div id="control-panel">
            
            <label style="grid-column: 1 / 3;">Nominal (dengan titik)</label>
            <input type="text" id="input-nominal" oninput="formatInputNominal(this); updateStruk();" placeholder="Contoh: 2.000.000" style="grid-column: 1 / 3;">

            <label style="grid-column: 1 / 3;">Nama Penerima (UPPERCASE)</label>
            <input type="text" id="input-nama" oninput="this.value = this.value.toUpperCase(); updateStruk();" placeholder="HARTANTO" style="grid-column: 1 / 3;">

            <label>Rek. Pengirim</label>
            <input type="text" id="input-rek-dari" oninput="updateStruk()" placeholder="3780971991">

            <label>Rek. Penerima</label>
            <input type="text" id="input-rek-ke" oninput="updateStruk()" placeholder="3801435031">

            <label style="grid-column: 1 / 3;">Tanggal &amp; Waktu (DD/MM/YYYY HH:MM:SS)</label>
            <input type="text" id="input-tanggal" oninput="updateStruk()" placeholder="07/07/2025 19:29:03" style="grid-column: 1 / 3;">
            
            <!-- Blur Control -->
            <div class="blur-control-wrap" style="grid-column: 1 / 3;">
                <div class="blur-header">
                    <button type="button" id="btn-blur" onclick="toggleBlur()" class="blur-toggle-btn">Efek Blur: NONAKTIF</button>
                    <span id="blur-value" class="blur-hint">4 px</span>
                </div>
                <div class="blur-slider-row">
                    <span class="blur-slider-label">Tingkat Blur (1–15 px)</span>
                    <input id="input-blur" type="range" min="1" max="15" step="1" value="4" oninput="onBlurSliderChange()">
                </div>
            </div>

            <!-- Format Unduhan -->
            <div class="format-wrap" style="grid-column: 1 / 3;">
                <span class="format-label">Format File Unduhan</span>
                <select id="input-format">
                    <option value="png">PNG (Kualitas Tanpa Kompresi)</option>
                    <option value="jpeg">JPEG / JPG (Ukuran Lebih Ringan)</option>
                </select>
            </div>

            <!-- Button Group, dipindahkan ke dalam Control Panel -->
            <div class="button-wrap-cp">
                <button onclick="acakData()" class="random-btn">Acak Data</button>
                <button onclick="downloadStruk()" class="download-btn">Download Gambar</button>
            </div>
        </div>
        <!-- END CONTROL PANEL -->
        
        <!-- TAMPILAN STRUK ASLI (Preview Area) -->
        <div class="preview-area">
            <div class="container" id="strukBCA">
                <!-- Tambahkan crossorigin untuk html2canvas -->
                <img src="__TEMPLATE_IMG_URL__" onerror="if(!this.dataset.fb){this.dataset.fb='1';this.src='https://ik.imagekit.io/donpablo69/BCA%20MOBILE.jpeg';}" class="background" alt="Struk m-BCA" crossorigin="anonymous">
                <div class="overlay">
                    <!-- Data Pengirim/Penerima di bagian atas -->
                    <div class="field" id="dari-rek">3780971991</div>
                    <div class="field" id="ke-rek">3801435031 - HARTANTO</div>
                    
                    <!-- Data Hasil Transaksi (Posisi/Style sesuai permintaan user) -->
                    <div class="field" id="status-line">m-Transfer:</div>
                    <div class="field" id="status-bold">BERHASIL</div>
                    <div class="field" id="tanggal">07/07/2025 19:29:03</div>
                    <div class="field" id="rekening">Ke 3801435031</div>
                    <div class="field" id="nama">HARTANTO</div>
                    <div class="field" id="nominal">Rp 20.000.000,00</div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Message Box untuk menampilkan error/notifikasi (Pengganti alert) -->
    <div id="message-box" role="alert"></div>

    <script>
        // ===============================
        // HELPER FUNCTIONS
        // ===============================

        let blurEnabled = false;

        const getInputValue = (id) => (document.getElementById(id)?.value || "").trim();

        function escapeHTML(value) {
            return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        }

        function cleanNominal(raw) {
            // Bersihkan nominal dari format "2.000.000,00" -> "2000000"
            return String(raw || "").replace(/[^\\d]/g, "");
        }

        function formatRupiah(angka) {
            // format tampilan rupiah "2000000" -> "Rp 2.000.000,00" (Sesuai logic asli user)
            const num = parseInt(cleanNominal(angka), 10) || 0;
            // Pastikan format rupiah menggunakan koma untuk desimal dan titik untuk ribuan
            return "Rp " + num.toLocaleString("id-ID") + ",00"; 
        }

        function formatInputNominal(el) {
            // format input nominal realtime: user ketik -> jadi bertitik
            let value = cleanNominal(el.value);
            if (!value) {
                el.value = "";
                return;
            }
            el.value = Number(value).toLocaleString("id-ID");
        }

        function displayMessage(message, duration = 3000) {
            const msgBox = document.getElementById('message-box');
            msgBox.innerText = message;
            msgBox.style.display = 'block';
            setTimeout(() => {
                msgBox.style.display = 'none';
            }, duration);
        }

        // ===============================
        // BLUR FUNCTIONS (BAGIAN YANG DITANDAI)
        // ===============================
        function maskNamaSebagian(value) {
            const chars = [...String(value || '')];
            const eligible = chars.map((c, i) => ({ c, i })).filter(x => /[A-Za-zÀ-ÿ]/.test(x.c));
            const count = eligible.length >= 4 ? eligible.length - 2 : Math.floor(eligible.length * 0.75);
            const blurred = new Set(eligible.slice(0, count).map(x => x.i));
            return chars
                .map((c, i) => c === ' ' ? ' ' : blurred.has(i) ? \`<span class="partial-blur">\${escapeHTML(c)}</span>\` : escapeHTML(c))
                .join('');
        }

        function maskKeRekening(value) {
            const str = String(value || '');
            if (str.startsWith('Ke ')) {
                return 'Ke <span class="partial-blur">' + escapeHTML(str.slice(3)) + '</span>';
            }
            return '<span class="partial-blur">' + escapeHTML(str) + '</span>';
        }

        function applyBlur() {
            const blur = Math.min(15, Math.max(1, Number(document.getElementById('input-blur')?.value || 4)));
            document.querySelectorAll('.partial-blur').forEach(el => {
                el.style.filter = \`blur(\${blur}px)\`;
                el.style.webkitFilter = \`blur(\${blur}px)\`;
            });
            const valEl = document.getElementById('blur-value');
            if (valEl) valEl.textContent = \`\${blur} px\`;
        }

        function renderBlurState() {
            const dariEl = document.getElementById('dari-rek');
            const keEl = document.getElementById('ke-rek');
            const rekEl = document.getElementById('rekening');
            const namaEl = document.getElementById('nama');

            [dariEl, keEl, rekEl, namaEl].forEach(el => {
                if (el && !el.dataset.raw) {
                    el.dataset.raw = el.innerText;
                }
            });

            if (!blurEnabled) {
                if (dariEl) dariEl.textContent = dariEl.dataset.raw;
                if (keEl) keEl.textContent = keEl.dataset.raw;
                if (rekEl) rekEl.textContent = rekEl.dataset.raw;
                if (namaEl) namaEl.textContent = namaEl.dataset.raw;
            } else {
                if (dariEl) dariEl.innerHTML = '<span class="partial-blur">' + escapeHTML(dariEl.dataset.raw) + '</span>';
                if (keEl) keEl.innerHTML = '<span class="partial-blur">' + escapeHTML(keEl.dataset.raw) + '</span>';
                if (rekEl) rekEl.innerHTML = maskKeRekening(rekEl.dataset.raw);
                if (namaEl) namaEl.innerHTML = maskNamaSebagian(namaEl.dataset.raw);
            }

            applyBlur();
        }

        function updateBlurButtonUI() {
            const btn = document.getElementById('btn-blur');
            if (!btn) return;
            btn.classList.toggle('is-active', blurEnabled);
            btn.textContent = blurEnabled ? 'Efek Blur: AKTIF' : 'Efek Blur: NONAKTIF';
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

        // ===============================
        // UPDATE STRUK
        // ===============================
        function updateStruk() {
            const nominalRaw = getInputValue("input-nominal");
            const nama = (getInputValue("input-nama") || "NAMA PENERIMA").toUpperCase();
            const rekKe = getInputValue("input-rek-ke") || "0000000000";
            const rekDari = getInputValue("input-rek-dari") || "0000000000";
            const tanggalWaktu = getInputValue("input-tanggal") || "00/00/0000 00:00:00";

            // Batasi panjang nama agar tidak meluber di struk
            const namaPenerimaDisplay = nama.length > 25 ? nama.substring(0, 25) + '...' : nama;

            // Update elemen-elemen di struk
            document.getElementById("tanggal").innerText = tanggalWaktu;
            document.getElementById("nominal").innerText = formatRupiah(nominalRaw);

            document.getElementById("dari-rek").dataset.raw = rekDari;
            document.getElementById("ke-rek").dataset.raw = rekKe + " - " + namaPenerimaDisplay;
            document.getElementById("rekening").dataset.raw = "Ke " + rekKe;
            document.getElementById("nama").dataset.raw = namaPenerimaDisplay;

            renderBlurState();
        }

        // ===============================
        // ACAK DATA
        // ===============================
        function acakData() {
            const namaList = [
                "HARTANTO","AGUS SULISTYO","RINA WULANDARI","TONO WIRAWAN",
                "HASAN BASRI","SITI NURHALIZA","AHMAD WIJAYA","DEWI SARTIKA",
                "RIZKI PRATAMA","MAYA SARI","ANDI SETIAWAN","LINDA KUSUMA",
                "HENDRA GUNAWAN","RATNA DEWI"
            ];

            const rekeningList = [
                "3801435031","1234567890","3902019384","9283746501","5610928374"
            ];

            const dariRekeningList = ["3780971991","8123456789","7778889990"];

            // Nominal random (angka murni): 10 Juta sampai 50 Juta
            const nominal = (Math.floor(Math.random() * 41) + 10) * 1000000;

            // Tanggal DD/MM/YYYY HH:MM:SS
            const now = new Date();
            const tanggal =
                \`\${String(now.getDate()).padStart(2, "0")}/\${String(now.getMonth() + 1).padStart(2, "0")}/\${now.getFullYear()} \` +
                \`\${String(now.getHours()).padStart(2, "0")}:\${String(now.getMinutes()).padStart(2, "0")}:\${String(now.getSeconds()).padStart(2, "0")}\`;

            const nama = namaList[Math.floor(Math.random() * namaList.length)];
            const rekKe = rekeningList[Math.floor(Math.random() * rekeningList.length)];
            const rekDari = dariRekeningList[Math.floor(Math.random() * dariRekeningList.length)];

            // Set ke input (nominal dibuat bertitik)
            const inputNominal = document.getElementById("input-nominal");
            inputNominal.value = Number(nominal).toLocaleString("id-ID"); 

            document.getElementById("input-nama").value = nama;
            document.getElementById("input-rek-ke").value = rekKe;
            document.getElementById("input-rek-dari").value = rekDari;
            document.getElementById("input-tanggal").value = tanggal;

            updateStruk();
        }

${ISOLATED_BLUR_HELPER_JS}

        // ===============================
// DOWNLOAD STRUK SEGI EMPAT (BERSIH) – VERSI FINAL
// ===============================
async function downloadStruk() {
    const hasCustomInput = Boolean(
        getInputValue("input-nominal") ||
        getInputValue("input-nama") ||
        getInputValue("input-rek-dari") ||
        getInputValue("input-rek-ke") ||
        getInputValue("input-tanggal")
    );
    if (hasCustomInput) {
        updateStruk();
    } else {
        renderBlurState();
    }

    const strukElement = document.getElementById("strukBCA");

    // Tambahkan class untuk tampilan segi empat
    strukElement.classList.add("clean-download");

    try {
        await document.fonts.ready;

        const radiusCss = parseFloat(document.getElementById('input-blur')?.value || '4') || 4;
        const canvas = await renderReceiptWithIsolatedBlur(strukElement, {
            useCORS: true,
            scale: 3,
            backgroundColor: "#ffffff"
        }, radiusCss);

        // ==========================
        // POTONG 10px DARI BAWAH
        // ==========================
        const cropHeight = canvas.height - 10;
        const croppedCanvas = document.createElement("canvas");
        croppedCanvas.width = canvas.width;
        croppedCanvas.height = cropHeight;

        const ctx = croppedCanvas.getContext("2d");
        ctx.drawImage(canvas, 0, 0, canvas.width, cropHeight, 0, 0, canvas.width, cropHeight);

        const format = document.getElementById("input-format")?.value || "png";
        const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
        const quality = format === "jpeg" ? 0.95 : undefined;
        const ext = format === "jpeg" ? "jpg" : "png";

        // Buat & klik link unduhan
        const link = document.createElement("a");
        link.download = \`struk-bersih.\${ext}\`;
        link.href = croppedCanvas.toDataURL(mimeType, quality);
        document.body.appendChild(link);
        link.click();
        link.remove();

        displayMessage(\`✅ Struk \${format.toUpperCase()} berhasil diunduh!\`, 2000);

    } catch (err) {
        applyBlur();
        console.error("❌ Gagal saat screenshot:", err);
        displayMessage("❌ Gagal mengunduh struk!", 3000);
    } finally {
        strukElement.classList.remove("clean-download");
    }
}
    </script>`;

export const BcaMobileGeneratorEmbed: React.FC = () => {
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
        return new URL('./assets/bcamobile-template.jpg', document.baseURI).href;
      } catch {
        return './assets/bcamobile-template.jpg';
      }
    }
    return './assets/bcamobile-template.jpg';
  }, []);

  const srcDoc = useMemo(() => {
    const bodyWithTemplate = BCA_MOBILE_BODY_AND_SCRIPT.replace(
      '__TEMPLATE_IMG_URL__',
      templateImgUrl
    );
    return `<!DOCTYPE html>
<html lang="id" class="${isDark ? 'dark' : ''}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Edit Struk m-BCA Instan</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<style>
*{box-sizing:border-box}
body{margin:0;padding:18px 18px 50px;background:transparent;color:#000000;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;transition:color .2s}
html.dark body{color:#ffffff}
h2{text-align:center;color:#4A2B18;margin:4px 0 20px;font-weight:800;letter-spacing:.01em}
html.dark h2{color:#E5B874}
.main-wrapper{max-width:1120px;margin:auto;display:grid;grid-template-columns:minmax(320px,1.05fr) minmax(300px,0.95fr);gap:28px;align-items:start}
#control-panel{background:#ffffff;padding:22px;border-radius:16px;border:1px solid #D4C4AE;box-shadow:0 2px 10px rgba(74,43,24,.06);display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;align-items:start}
html.dark #control-panel{background:#1F150F;border-color:#3A281D;box-shadow:0 2px 10px rgba(0,0,0,.35)}
#control-panel > label{display:block;font-size:12px;font-weight:800;margin:4px 0 0;color:#000000}
html.dark #control-panel > label{color:#ffffff}
#control-panel > label:nth-of-type(3){grid-column:1;grid-row:5}
#input-rek-dari{grid-column:1;grid-row:6}
#control-panel > label:nth-of-type(4){grid-column:2;grid-row:5}
#input-rek-ke{grid-column:2;grid-row:6}
#control-panel input:not([type="range"]){display:block;width:100%;padding:10px 12px;border:1px solid #CBB9A0;border-radius:10px;font-size:13px;font-weight:600;background:#F8F4EE;color:#000000;margin-bottom:4px}
html.dark #control-panel input:not([type="range"]){background:#140D09;border-color:#4D3627;color:#ffffff}
#control-panel input:not([type="range"]):focus{outline:2px solid #4A2B18;outline-offset:1px}
html.dark #control-panel input:not([type="range"]):focus{outline-color:#C59656}
.blur-control-wrap{margin-top:4px;padding:12px;border-radius:12px;background:#F8F4EE;border:1px solid #DFD1BE;display:flex;flex-direction:column;gap:8px}
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
.format-wrap{display:flex;flex-direction:column;gap:6px;margin-top:2px}
.format-label{font-size:12px;font-weight:800;color:#000000}
html.dark .format-label{color:#ffffff}
#control-panel select{display:block;width:100%;padding:10px 12px;border:1px solid #CBB9A0;border-radius:10px;font-size:13px;font-weight:600;background:#F8F4EE;color:#000000}
html.dark #control-panel select{background:#140D09;border-color:#4D3627;color:#ffffff}
#control-panel select:focus{outline:2px solid #4A2B18;outline-offset:1px}
html.dark #control-panel select:focus{outline-color:#C59656}
.button-wrap-cp{grid-column:1 / 3;display:flex;gap:10px;margin-top:6px}
button{border-radius:10px;padding:11px 16px;font-weight:800;font-size:12px;cursor:pointer;flex:1;transition:filter .15s,background .15s;border:1px solid transparent}
.random-btn{background:#EAE0D2;color:#000000;border-color:#CBB9A0}
html.dark .random-btn{background:#2C1E16;color:#ffffff;border-color:#4D3627}
.download-btn{background:#4A2B18;color:#ffffff;border-color:#4A2B18}
html.dark .download-btn{background:#C59656;color:#140D09;border-color:#C59656}
button:hover{filter:brightness(.94)}
.preview-area{display:flex;justify-content:center;min-width:0}
.container{position:relative;width:min(100%,355px);aspect-ratio:720 / 1546;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 12px 30px rgba(74,43,24,.18)}
.container.clean-download{border-radius:0 !important;box-shadow:none !important}
.background{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;display:block}
.overlay{position:absolute;inset:0}
.field{position:absolute;font-family:Arial,Helvetica,sans-serif;white-space:nowrap;line-height:1.25}
.partial-blur{display:inline-block;filter:blur(4px);-webkit-filter:blur(4px);color:inherit}
#dari-rek{top:15.35%;left:7.0%;width:85%;font-size:clamp(9.5px,2.3vw,11px);font-weight:500;color:#2c353f}
#ke-rek{top:21.35%;left:7.0%;width:80%;font-size:clamp(9.5px,2.3vw,11px);font-weight:500;color:#2c353f}
#status-line{top:26.15%;left:14.2%;width:72%;font-size:clamp(11px,2.8vw,13px);font-weight:400;color:#0d3c78}
#status-bold{top:28.35%;left:14.2%;width:72%;font-size:clamp(11px,2.8vw,13px);font-weight:400;color:#0d3c78}
#tanggal{top:30.65%;left:14.2%;width:72%;font-size:clamp(11px,2.8vw,13px);font-weight:500;color:#0d3c78}
#rekening{top:32.85%;left:14.2%;width:72%;font-size:clamp(11px,2.8vw,13px);font-weight:500;color:#0d3c78}
#nama{top:35.05%;left:14.2%;width:72%;font-size:clamp(11px,2.8vw,13px);font-weight:500;color:#0d3c78}
#nominal{top:37.25%;left:14.2%;width:72%;font-size:clamp(11px,2.8vw,13px);font-weight:500;color:#0d3c78}
#message-box{display:none;position:fixed;bottom:18px;right:18px;padding:10px 16px;border-radius:10px;background:#4A2B18;color:#ffffff;font-size:12px;font-weight:800;box-shadow:0 8px 20px rgba(0,0,0,.22);z-index:50}
html.dark #message-box{background:#C59656;color:#140D09}
@media(max-width:760px){body{padding:10px 10px 50px}.main-wrapper{grid-template-columns:1fr}#control-panel{order:1}.preview-area{order:2}.container{width:min(100%,330px)}}
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
        title="Generator Struk BCA Mobile"
        srcDoc={srcDoc}
        onLoad={syncIframeHeight}
        style={{ height: `${iframeHeight}px` }}
        className="w-full border-0 block bg-transparent"
      />
    </div>
  );
};
