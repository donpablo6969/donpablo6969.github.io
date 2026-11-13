import React, { useEffect, useMemo, useRef, useState } from 'react';

const BNI_MOBILE_BODY_AND_SCRIPT = `<div class="main-wrapper">
    <div class="editor-panel">
        <h2 style="color: #fff; text-align: center; margin: 0 0 15px 0; font-size: 16px;">BNI EDITOR PRO</h2>
        
        <div class="input-group"><label>Pengirim</label><input type="text" id="in-pengirim" oninput="updateStruk()" value="M. SULAEMAN"></div>
        <div class="input-group"><label>Penerima</label><input type="text" id="in-penerima" oninput="updateStruk()" value="Ibu ROHMAT"></div>
        <div class="input-group"><label>No. Rekening</label><input type="text" id="in-rek" oninput="updateStruk()" value="1910995890"></div>
        <div class="input-group"><label>Nominal</label><input type="text" id="in-nom" oninput="formatUang(this); updateStruk()" value="50.000.000"></div>
        
        <div style="display: flex; gap: 10px;">
            <div class="input-group" style="flex: 1;"><label>Tanggal</label><input type="text" id="in-tgl" oninput="updateStruk()" placeholder="DD-MM-YYYY"></div>
            <div class="input-group" style="flex: 1;"><label>Jam</label><input type="text" id="in-jam" oninput="updateStruk()" placeholder="HH:mm:ss"></div>
        </div>

        <div class="input-group">
            <label>Format File Unduhan</label>
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

        <div class="btn-group">
            <button class="btn" style="background: var(--bni-orange);" onclick="acakSistem()">🎲 ACAK</button>
            <button class="btn" style="background: var(--bni-teal);" onclick="download()">📥 DOWNLOAD</button>
        </div>
    </div>

    <div class="preview-area">
      <div class="container" id="strukBNI">
          <img src="__TEMPLATE_IMG_URL__" onerror="if(!this.dataset.fb){this.dataset.fb='1';this.src='https://ik.imagekit.io/donpablo69/BNIMOBILE.jpeg';}" class="background" alt="Struk BNI Mobile" crossorigin="anonymous">
          <div class="watermark-container">
              <div class="wm-text">BNI BNI BNI BNI BNI</div>
              <div class="wm-text">BNI BNI BNI BNI BNI</div>
          </div>
          <div class="overlay">
              <div class="st-header">
                  <div class="st-info-title">Informasi</div>
                  <div class="st-status-msg">Transaksi Berhasil</div>
              </div>
              <div class="st-row" id="row-rek"><div class="st-label">Rekening Tujuan</div><div class="st-value" id="v-rek">1910995890</div></div>
              <div class="st-row" id="row-penerima"><div class="st-label">Nama Penerima</div><div class="st-value" id="v-penerima">Ibu ROHMAT</div></div>
              <div class="st-row" id="row-tgl"><div class="st-label">Tanggal Transaksi</div><div class="st-value" id="v-tgl">11-11-2026</div></div>
              <div class="st-row" id="row-jam"><div class="st-label">Waktu Transaksi</div><div class="st-value" id="v-jam">15:31:56 WIB</div></div>
              <div class="st-row" id="row-email"><div class="st-label">Email Penerima</div><div class="st-value"></div></div>
              <div class="st-row" id="row-bank"><div class="st-label">Bank Tujuan</div><div class="st-value">BNI</div></div>
              <div class="st-row" id="row-pengirim"><div class="st-label">Nama Pengirim</div><div class="st-value" id="v-pengirim">M. SULAEMAN</div></div>
              <div class="st-row" id="row-nom"><div class="st-label">Nominal</div><div class="st-value" id="v-nom">Rp50.000.000</div></div>
              <div class="st-row" id="row-fee"><div class="st-label">Fee</div><div class="st-value">Rp0</div></div>
              <div class="st-row" id="row-total"><div class="st-label">Total</div><div class="st-value" id="v-total">Rp50.000.000</div></div>
              <div class="st-row" id="row-ket"><div class="st-label">Keterangan</div><div class="st-value"></div></div>
          </div>
      </div>
    </div>
</div>
    <script>
        let blurEnabled = false;

        function escapeHTML(value) {
            return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        }

        function maskTrailingKeep(value, keepCount) {
            const chars = [...String(value || '')];
            const eligible = chars.map((c, i) => ({ c, i })).filter(x => /[A-Za-z0-9À-ÿ]/.test(x.c));
            const count = Math.max(0, eligible.length - keepCount);
            const blurred = new Set(eligible.slice(0, count).map(x => x.i));
            return chars
                .map((c, i) => c === ' ' ? ' ' : blurred.has(i) ? \`<span class="partial-blur">\${escapeHTML(c)}</span>\` : escapeHTML(c))
                .join('');
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
            const rekEl = document.getElementById('v-rek');
            const penEl = document.getElementById('v-penerima');
            const pengEl = document.getElementById('v-pengirim');

            [rekEl, penEl, pengEl].forEach(el => {
                if (el && el.dataset.raw === undefined) {
                    el.dataset.raw = el.innerText;
                }
            });

            if (!blurEnabled) {
                if (rekEl) rekEl.textContent = rekEl.dataset.raw;
                if (penEl) penEl.textContent = penEl.dataset.raw;
                if (pengEl) pengEl.textContent = pengEl.dataset.raw;
            } else {
                if (rekEl) rekEl.innerHTML = maskTrailingKeep(rekEl.dataset.raw, 3);
                if (penEl) penEl.innerHTML = maskTrailingKeep(penEl.dataset.raw, 2);
                if (pengEl) {
                    const keepPeng = (pengEl.dataset.raw || '').replace(/\\s+/g, '').length > 6 ? 3 : 2;
                    pengEl.innerHTML = maskTrailingKeep(pengEl.dataset.raw, keepPeng);
                }
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

        function formatUang(input) {
            let value = input.value.replace(/[^0-9]/g, '');
            if (value !== "") input.value = parseInt(value).toLocaleString('id-ID');
        }

        function setWaktuSekarang() {
            const n = new Date();
            const tgl = n.toLocaleDateString('id-ID', {day:'2-digit', month:'2-digit', year:'numeric'}).replace(/\\//g, '-');
            const jam = n.toLocaleTimeString('id-ID', {hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'}).replace(/\\./g, ':');
            
            document.getElementById('in-tgl').value = tgl;
            document.getElementById('in-jam').value = jam;
        }

        function updateStruk() {
            const peng = document.getElementById('in-pengirim').value;
            const pen = document.getElementById('in-penerima').value;
            const rek = document.getElementById('in-rek').value;
            const nom = document.getElementById('in-nom').value;
            const tgl = document.getElementById('in-tgl').value;
            const jam = document.getElementById('in-jam').value;
            
            const fNom = nom ? "Rp" + nom : "Rp0";

            document.getElementById('v-pengirim').dataset.raw = peng;
            document.getElementById('v-penerima').dataset.raw = pen;
            document.getElementById('v-rek').dataset.raw = rek;
            document.getElementById('v-nom').innerText = fNom;
            document.getElementById('v-total').innerText = fNom;
            document.getElementById('v-tgl').innerText = tgl;
            document.getElementById('v-jam').innerText = jam + " WIB";

            renderBlurState();
        }

        function acakSistem() {
            const lPeng = ["M. SULAEMAN", "ACHMAD ZAENI", "HENDRA KUSUMA", "REZA RAHARDIAN"];
            const lPen = ["Ibu ROHMAT", "SITI AISYAH", "BUDI SANTOSO", "LANI MARLINA"];
            const lRek = ["1910995890", "1289614396", "1102301449", "0514208348"];

            document.getElementById('in-pengirim').value = lPeng[Math.floor(Math.random() * lPeng.length)];
            document.getElementById('in-penerima').value = lPen[Math.floor(Math.random() * lPen.length)];
            document.getElementById('in-rek').value = lRek[Math.floor(Math.random() * lRek.length)];

            let min = 200; 
            let max = 1000;
            let rNom = (Math.floor(Math.random() * (max - min + 1)) + min) * 100000;
            document.getElementById('in-nom').value = rNom.toLocaleString('id-ID');

            setWaktuSekarang();
            updateStruk();
        }

        function applyPixelBlur(canvas, rect, radius) {
            const r = Math.max(1, Math.round(radius));
            const x = Math.max(0, Math.floor(rect.x));
            const y = Math.max(0, Math.floor(rect.y));
            const w = Math.min(canvas.width - x, Math.ceil(rect.w));
            const h = Math.min(canvas.height - y, Math.ceil(rect.h));
            if (w <= 0 || h <= 0) return;

            const ctx = canvas.getContext('2d');
            const imgData = ctx.getImageData(x, y, w, h);
            const pixels = imgData.data;
            const temp = new Uint8ClampedArray(pixels);

            for (let pass = 0; pass < 3; pass++) {
                for (let row = 0; row < h; row++) {
                    for (let col = 0; col < w; col++) {
                        let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;
                        for (let k = -r; k <= r; k++) {
                            const c = Math.min(w - 1, Math.max(0, col + k));
                            const idx = (row * w + c) * 4;
                            rSum += pixels[idx];
                            gSum += pixels[idx + 1];
                            bSum += pixels[idx + 2];
                            aSum += pixels[idx + 3];
                            count++;
                        }
                        const outIdx = (row * w + col) * 4;
                        temp[outIdx] = rSum / count;
                        temp[outIdx + 1] = gSum / count;
                        temp[outIdx + 2] = bSum / count;
                        temp[outIdx + 3] = aSum / count;
                    }
                }
                for (let col = 0; col < w; col++) {
                    for (let row = 0; row < h; row++) {
                        let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;
                        for (let k = -r; k <= r; k++) {
                            const rw = Math.min(h - 1, Math.max(0, row + k));
                            const idx = (rw * w + col) * 4;
                            rSum += temp[idx];
                            gSum += temp[idx + 1];
                            bSum += temp[idx + 2];
                            aSum += temp[idx + 3];
                            count++;
                        }
                        const outIdx = (row * w + col) * 4;
                        pixels[outIdx] = rSum / count;
                        pixels[outIdx + 1] = gSum / count;
                        pixels[outIdx + 2] = bSum / count;
                        pixels[outIdx + 3] = aSum / count;
                    }
                }
            }
            ctx.putImageData(imgData, x, y);
        }

        async function download() {
            const el = document.getElementById("strukBNI");
            const format = document.getElementById("input-format")?.value || "png";
            const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
            const quality = format === "jpeg" ? 0.95 : 1.0;
            const ext = format === "jpeg" ? "jpg" : "png";

            el.classList.add("clean-download");
            try {
                await document.fonts.ready;
                const base = el.getBoundingClientRect();
                const targets = [];
                if (blurEnabled) {
                    ['v-rek', 'v-penerima', 'v-pengirim'].forEach(id => {
                        const wrap = document.getElementById(id);
                        if (!wrap) return;
                        wrap.querySelectorAll('.partial-blur').forEach(s => {
                            const r = s.getBoundingClientRect();
                            if (r.width > 0 && r.height > 0) {
                                targets.push({
                                    left: r.left - base.left,
                                    top: r.top - base.top,
                                    width: r.width,
                                    height: r.height
                                });
                            }
                        });
                    });
                }

                el.querySelectorAll('.partial-blur').forEach(node => {
                    node.style.filter = 'none';
                    node.style.webkitFilter = 'none';
                });

                window.scrollTo(0, 0);
                const canvas = await html2canvas(el, {
                    scale: 3,
                    useCORS: true,
                    backgroundColor: "#ffffff",
                    width: base.width,
                    height: base.height
                });

                applyBlur();

                if (targets.length > 0) {
                    const kx = canvas.width / base.width;
                    const ky = canvas.height / base.height;
                    const radiusCss = parseFloat(document.getElementById('input-blur')?.value || '4') || 4;
                    const padVal = radiusCss * 1.4;

                    targets.forEach(rect => {
                        applyPixelBlur(canvas, {
                            x: (rect.left - padVal) * kx,
                            y: (rect.top - padVal) * ky,
                            w: (rect.width + padVal * 2) * kx,
                            h: (rect.height + padVal * 2) * ky
                        }, radiusCss * kx * 0.65);
                    });
                }

                const link = document.createElement("a");
                link.download = \`BNI_Struk_\${Date.now()}.\${ext}\`;
                link.href = canvas.toDataURL(mimeType, quality);
                document.body.appendChild(link);
                link.click();
                link.remove();
            } catch (err) {
                applyBlur();
                console.error(err);
            } finally {
                el.classList.remove("clean-download");
            }
        }

        window.onload = () => {
            setWaktuSekarang();
            updateStruk();
        };
    </script>`;

export const BniMobileGeneratorEmbed: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState<number>(850);
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
        return new URL('./assets/bnimobile-template.jpg', document.baseURI).href;
      } catch {
        return './assets/bnimobile-template.jpg';
      }
    }
    return './assets/bnimobile-template.jpg';
  }, []);

  const srcDoc = useMemo(() => {
    const bodyWithTemplate = BNI_MOBILE_BODY_AND_SCRIPT.replace(
      '__TEMPLATE_IMG_URL__',
      templateImgUrl
    );
    return `<!DOCTYPE html>
<html lang="id" class="${isDark ? 'dark' : ''}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BNI EDITOR PRO</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<style>
:root{--bni-orange:#EAE0D2;--bni-teal:#4A2B18}
html.dark{--bni-orange:#2C1E16;--bni-teal:#C59656}
*{box-sizing:border-box}
body{margin:0;padding:22px 20px 50px;background:transparent;color:#000000;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;transition:color .2s}
html.dark body{color:#ffffff}
.main-wrapper{max-width:1120px;margin:auto;display:grid;grid-template-columns:minmax(320px,1fr) minmax(300px,0.95fr);gap:28px;align-items:start}
.editor-panel{background:#ffffff;padding:22px;border-radius:16px;border:1px solid #D4C4AE;box-shadow:0 2px 10px rgba(74,43,24,.06)}
html.dark .editor-panel{background:#1F150F;border-color:#3A281D;box-shadow:0 2px 10px rgba(0,0,0,.35)}
.editor-panel h2{color:#4A2B18 !important;font-weight:800;letter-spacing:.03em}
html.dark .editor-panel h2{color:#E5B874 !important}
.input-group{margin-bottom:12px}
.input-group label{display:block;font-size:12px;font-weight:800;margin-bottom:5px;color:#000000}
html.dark .input-group label{color:#ffffff}
.input-group input,.input-group select{display:block;width:100%;padding:10px 12px;border:1px solid #CBB9A0;border-radius:10px;font-size:13px;font-weight:600;background:#F8F4EE;color:#000000}
html.dark .input-group input,html.dark .input-group select{background:#140D09;border-color:#4D3627;color:#ffffff}
.input-group input:focus,.input-group select:focus{outline:2px solid #4A2B18;outline-offset:1px}
html.dark .input-group input:focus,html.dark .input-group select:focus{outline-color:#C59656}
.blur-control-wrap{margin-top:6px;padding:12px;border-radius:12px;background:#F8F4EE;border:1px solid #DFD1BE;display:flex;flex-direction:column;gap:8px}
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
.btn-group{display:flex;gap:10px;margin-top:16px}
.btn{flex:1;padding:11px 14px;border-radius:10px;font-size:12px;font-weight:800;cursor:pointer;border:1px solid #CBB9A0;transition:filter .15s}
.btn-group .btn:first-child{color:#000000;border-color:#CBB9A0}
html.dark .btn-group .btn:first-child{color:#ffffff;border-color:#4D3627}
.btn-group .btn:last-child{color:#ffffff;border-color:#4A2B18}
html.dark .btn-group .btn:last-child{color:#140D09;border-color:#C59656}
.btn:hover{filter:brightness(.94)}
.preview-area{display:flex;justify-content:center;min-width:0}
.container{position:relative;width:min(100%,361px);aspect-ratio:361 / 711;background:#ffffff;border-radius:0;overflow:hidden;box-shadow:0 12px 30px rgba(74,43,24,.18)}
.container.clean-download{border-radius:0 !important;box-shadow:none !important}
.background{position:absolute;top:0;left:0;width:100%;height:106.1%;object-fit:fill;display:block}
.watermark-container{position:absolute;top:0;right:1.2%;width:20px;height:90%;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:48px;pointer-events:none;overflow:hidden;z-index:1}
.wm-text{writing-mode:vertical-rl;transform:rotate(180deg);font-size:14px;font-weight:700;color:rgba(0,94,106,.16);letter-spacing:3px;white-space:nowrap}
.overlay{position:absolute;inset:0;z-index:2;font-family:Arial,Helvetica,sans-serif;color:#555555}
.partial-blur{display:inline-block;filter:blur(4px);-webkit-filter:blur(4px);color:inherit}
.st-header{position:static}
.st-info-title{position:absolute;top:3.3%;left:0;width:100%;text-align:center;font-size:clamp(13px,3.6vw,15px);font-weight:500;color:#555555}
.st-status-msg{position:absolute;top:10.7%;left:0;width:100%;text-align:center;font-size:clamp(15px,4.2vw,18px);font-weight:500;color:#000000}
.st-row{position:absolute;left:10.0%;width:81.2%;display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:clamp(11px,3.1vw,12.5px);line-height:1.25;color:#555555;font-weight:400}
#row-rek{top:17.3%}
#row-penerima{top:22.6%}
#row-tgl{top:27.9%}
#row-jam{top:33.2%}
#row-email{top:38.5%}
#row-bank{top:43.8%}
#row-pengirim{top:49.1%}
#row-nom{top:54.4%}
#row-fee{top:59.7%}
#row-total{top:65.0%}
#row-ket{top:70.3%}
.st-label{color:#555555;font-weight:400;white-space:nowrap}
.st-value{color:#555555;font-weight:400;text-align:right;white-space:nowrap}
@media(max-width:760px){body{padding:10px 10px 50px}.main-wrapper{grid-template-columns:1fr}.container{width:min(100%,340px)}}
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
        title="Generator Struk BNI Mobile"
        srcDoc={srcDoc}
        onLoad={syncIframeHeight}
        style={{ height: `${iframeHeight}px` }}
        className="w-full border-0 block bg-transparent"
      />
    </div>
  );
};
