import React, { useEffect, useMemo, useRef, useState } from 'react';

const LIVIN_MANDIRI_BODY_AND_SCRIPT = `<h2>EDIT STRUK MANDIRI</h2>

<div class="main-wrapper">
  <!-- CONTROL PANEL -->
  <div id="control-panel">
    <label class="full-width">
      Nominal Transfer (misal: 48800000)
      <input type="text" id="input-nominal" oninput="formatNominal(this); updateStruk();" placeholder="48.800.000" class="full-width">
    </label>

    <label class="full-width">
      Tanggal Transaksi (misal: 11 Jul 2025)
      <input type="text" id="input-tanggal" oninput="updateStruk()" placeholder="11 Jul 2025" class="full-width">
    </label>

    <label class="full-width">
      Waktu Transaksi Lengkap (misal: 14:21:38 WIB)
      <input type="text" id="input-waktu-lengkap" oninput="updateStruk()" placeholder="14:21:38 WIB" class="full-width">
    </label>

    <label class="full-width">
      Nomor Referensi (No. Ref.)
      <input type="text" id="input-ref" oninput="updateStruk()" placeholder="2507111421386591753" class="full-width">
    </label>

    <label class="full-width">
      Nama Penerima
      <input type="text" id="input-nama-penerima" oninput="updateStruk()" placeholder="Dtnhvcb Perzgp" class="full-width">
    </label>

    <label class="full-width">
      No. Rekening Penerima
      <input type="text" id="input-norek-penerima" oninput="updateStruk()" placeholder="107007926766023" class="full-width">
    </label>

    <label class="full-width">
      Nama Pengirim
      <input type="text" id="input-nama-pengirim" oninput="updateStruk()" placeholder="Ghwg Ofwtsro" class="full-width">
    </label>

    <label class="full-width">
      No. Rekening Pengirim (4 digit akhir)
      <input type="text" id="input-norek-pengirim-suffix" oninput="updateStruk()" placeholder="9435" maxlength="4" class="full-width">
    </label>

    <label class="full-width">
      Format File Unduhan
      <select id="input-format" class="full-width">
        <option value="png">PNG (Kualitas Tanpa Kompresi)</option>
        <option value="jpeg">JPEG / JPG (Ukuran Lebih Ringan)</option>
      </select>
    </label>

    <div class="blur-control-wrap full-width">
      <div class="blur-header">
        <button type="button" id="btn-blur" onclick="toggleBlur()" class="blur-toggle-btn">Efek Blur: NONAKTIF</button>
        <span id="blur-value" class="blur-hint">4 px</span>
      </div>
      <div class="blur-slider-row">
        <span class="blur-slider-label">Tingkat Blur (1–15 px)</span>
        <input id="input-blur" type="range" min="1" max="15" step="1" value="4" oninput="onBlurSliderChange()">
      </div>
    </div>

    <!-- BUTTONS -->
    <div class="button-wrap full-width">
      <button type="button" class="button-accent" onclick="acakData()">Acak Data &amp; Waktu Sekarang</button>
      <button type="button" class="button-primary" onclick="download()">Download Gambar</button>
    </div>
  </div>

  <!-- STRUK -->
  <div class="preview-column">
    <div class="container" id="struk">
      <img src="__TEMPLATE_IMG_URL__" onerror="if(!this.dataset.fb){this.dataset.fb='1';this.src='https://ik.imagekit.io/donpablo69/LIVIN.png';}" class="background" alt="Struk Mandiri" crossorigin="anonymous">
      <div class="overlay">
        <div class="field" id="tanggal">11 Nov 2026 • 15:33:32 WIB • No. Ref.<br>20261111153332179443</div>
        <div class="field" id="nama-penerima">TXXST KWYQ</div>
        <div class="field" id="bank-norek">Bank Mandiri - 10700942492743245</div>
        <div class="field" id="pengirim">WKHOD CHLV</div>
        <div class="field" id="bankpengirim">Bank Mandiri</div>
        <div class="field" id="norekpengirim">5845</div>
        <div class="field" id="nominal">Rp 46.000.000</div>
      </div>
    </div>
  </div>
</div>

<div id="message-box" role="alert"></div>

<script>
  const getInputValue = (id) => document.getElementById(id)?.value ?? "";
  let blurEnabled = false;

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
    let value = inputElement.value.replace(/[^\\d]/g, "");
    if (value) {
      inputElement.value = parseInt(value, 10).toLocaleString("id-ID");
    } else {
      inputElement.value = "";
    }
  }

  function generateRandomName() {
    const letters = "abcdefghijklmnopqrstuvwxyz";
    const randomWord = () => {
      let word = "";
      const len = Math.floor(Math.random() * 4) + 4;
      for (let i = 0; i < len; i++) {
        word += letters[Math.floor(Math.random() * letters.length)];
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    };
    return \`\${randomWord()} \${randomWord()}\`;
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
    const tanggalEl = document.getElementById("tanggal");
    const penEl = document.getElementById("nama-penerima");
    const bankNorekEl = document.getElementById("bank-norek");
    const pengEl = document.getElementById("pengirim");

    if (tanggalEl) {
      if (tanggalEl.dataset.rawHead === undefined || tanggalEl.dataset.rawRef === undefined) {
        const parts = (tanggalEl.innerText || "").split(/\\n/);
        tanggalEl.dataset.rawHead = parts[0] || "";
        tanggalEl.dataset.rawRef = parts[1] || "";
      }
      const rawHead = tanggalEl.dataset.rawHead || "";
      const rawRef = tanggalEl.dataset.rawRef || "";
      if (!blurEnabled || !rawRef) {
        tanggalEl.innerHTML = \`\${escapeHTML(rawHead)}<br>\${escapeHTML(rawRef)}\`;
      } else {
        const keepH = rawRef.length >= 8 ? 3 : 2;
        const keepT = rawRef.length >= 6 ? 3 : 1;
        tanggalEl.innerHTML = \`\${escapeHTML(rawHead)}<br>\${maskMiddleKeepEnds(rawRef, keepH, keepT)}\`;
      }
    }

    if (penEl) {
      if (penEl.dataset.raw === undefined) penEl.dataset.raw = penEl.innerText || "";
      const rawPen = penEl.dataset.raw || "";
      if (!blurEnabled) {
        penEl.textContent = rawPen;
      } else {
        const compactLen = rawPen.replace(/\\s+/g, "").length;
        const keepH = compactLen > 4 ? 2 : 1;
        const keepT = compactLen > 4 ? 2 : 1;
        penEl.innerHTML = maskMiddleKeepEnds(rawPen, keepH, keepT);
      }
    }

    if (bankNorekEl) {
      if (bankNorekEl.dataset.rawAcc === undefined) {
        const txt = bankNorekEl.innerText || "";
        bankNorekEl.dataset.rawAcc = txt.replace(/^Bank Mandiri\\s*-\\s*/i, "");
      }
      const rawAcc = bankNorekEl.dataset.rawAcc || "";
      if (!blurEnabled || !rawAcc) {
        bankNorekEl.textContent = \`Bank Mandiri - \${rawAcc}\`;
      } else {
        const keepH = rawAcc.length >= 7 ? 3 : 2;
        const keepT = rawAcc.length >= 7 ? 3 : 2;
        bankNorekEl.innerHTML = \`Bank Mandiri - \${maskMiddleKeepEnds(rawAcc, keepH, keepT)}\`;
      }
    }

    if (pengEl) {
      if (pengEl.dataset.raw === undefined) pengEl.dataset.raw = pengEl.innerText || "";
      const rawPeng = pengEl.dataset.raw || "";
      if (!blurEnabled) {
        pengEl.textContent = rawPeng;
      } else {
        const compactLen = rawPeng.replace(/\\s+/g, "").length;
        const keepH = compactLen > 3 ? 1 : 0;
        const keepT = compactLen > 3 ? 2 : 1;
        pengEl.innerHTML = maskMiddleKeepEnds(rawPeng, keepH, keepT);
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
    const nominalRaw = getInputValue("input-nominal").replace(/[^\\d]/g, "");
    const tanggal = getInputValue("input-tanggal");
    const waktuLengkap = getInputValue("input-waktu-lengkap");
    const ref = getInputValue("input-ref");
    const namaPenerima = getInputValue("input-nama-penerima");
    const norekPenerima = getInputValue("input-norek-penerima");
    const namaPengirim = getInputValue("input-nama-pengirim");
    const norekPengirim = getInputValue("input-norek-pengirim-suffix");

    const tanggalEl = document.getElementById("tanggal");
    tanggalEl.dataset.rawHead = \`\${tanggal} • \${waktuLengkap} • No. Ref.\`;
    tanggalEl.dataset.rawRef = ref;

    document.getElementById("nama-penerima").dataset.raw = namaPenerima;
    document.getElementById("bank-norek").dataset.rawAcc = norekPenerima;
    document.getElementById("pengirim").dataset.raw = namaPengirim;
    document.getElementById("bankpengirim").innerText = "Bank Mandiri";
    document.getElementById("norekpengirim").innerText = norekPengirim;

    document.getElementById("nominal").innerText =
      nominalRaw
        ? "Rp " + parseInt(nominalRaw, 10).toLocaleString("id-ID")
        : "";

    renderBlurState();
  }

  function acakData() {
    const now = new Date();
    const jam = \`\${String(now.getHours()).padStart(2, "0")}:\${String(
      now.getMinutes()
    ).padStart(2, "0")}:\${String(now.getSeconds()).padStart(2, "0")} WIB\`;

    const tanggal = now
      .toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(".", "");

    document.getElementById("input-nominal").value =
      ((Math.floor(Math.random() * 801) + 200) * 100000).toLocaleString("id-ID");

    document.getElementById("input-tanggal").value = tanggal;
    document.getElementById("input-waktu-lengkap").value = jam;
    const nowRef = new Date();

    const refTime =
      nowRef.getFullYear().toString() +
      String(nowRef.getMonth() + 1).padStart(2, "0") +
      String(nowRef.getDate()).padStart(2, "0") +
      String(nowRef.getHours()).padStart(2, "0") +
      String(nowRef.getMinutes()).padStart(2, "0") +
      String(nowRef.getSeconds()).padStart(2, "0");

    const refAjak = Math.floor(100000 + Math.random() * 900000);

    document.getElementById("input-ref").value = refTime + refAjak;

    document.getElementById("input-nama-penerima").value =
      generateRandomName().toUpperCase();

    document.getElementById("input-norek-penerima").value =
      "10700" + Math.floor(100000000000 + Math.random() * 900000000000);

    document.getElementById("input-nama-pengirim").value =
      generateRandomName().toUpperCase();

    document.getElementById("input-norek-pengirim-suffix").value =
      Math.floor(1000 + Math.random() * 9000);

    updateStruk();
  }

  function applyPixelBlur(canvas, rect, radius) {
    const r = Math.max(1, Math.round(radius));
    const x = Math.max(0, Math.floor(rect.x));
    const y = Math.max(0, Math.floor(rect.y));
    const w = Math.min(canvas.width - x, Math.ceil(rect.w));
    const h = Math.min(canvas.height - y, Math.ceil(rect.h));
    if (w <= 0 || h <= 0) return;

    const ctx = canvas.getContext("2d");
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
    updateStruk();

    const struk = document.getElementById("struk");
    const format = document.getElementById("input-format")?.value || "png";
    const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
    const quality = format === "jpeg" ? 0.95 : undefined;
    const ext = format === "jpeg" ? "jpg" : "png";

    struk.classList.add("clean-download");
    try {
      await document.fonts.ready;
      const base = struk.getBoundingClientRect();
      const targets = [];
      if (blurEnabled) {
        ["tanggal", "nama-penerima", "bank-norek", "pengirim"].forEach(id => {
          const wrap = document.getElementById(id);
          if (!wrap) return;
          wrap.querySelectorAll(".partial-blur").forEach(s => {
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

      struk.querySelectorAll(".partial-blur").forEach(node => {
        node.style.filter = "none";
        node.style.webkitFilter = "none";
      });

      const canvas = await html2canvas(struk, {
        useCORS: true,
        backgroundColor: "#ffffff",
        scale: 3,
        width: struk.offsetWidth,
        height: struk.offsetHeight,
        scrollX: 0,
        scrollY: 0
      });

      applyBlur();

      if (targets.length > 0) {
        const kx = canvas.width / base.width;
        const ky = canvas.height / base.height;
        const radiusCss = parseFloat(document.getElementById("input-blur")?.value || "4") || 4;
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

      canvas.toBlob(blob => {
        if (!blob) return showNotice("Gagal membuat gambar.");
        const link = document.createElement("a");
        link.download = \`struk-mandiri-\${Date.now()}.\${ext}\`;
        link.href = URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(link.href);
        showNotice(\`Struk \${format.toUpperCase()} berhasil diunduh!\`);
      }, mimeType, quality);
    } catch (err) {
      applyBlur();
      showNotice("Gagal mengunduh gambar.");
      console.error(err);
    } finally {
      struk.classList.remove("clean-download");
    }
  }

  window.onload = acakData;
</script>`;

export const LivinMandiriGeneratorEmbed: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState<number>(920);
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
        return new URL('./assets/livin-template.png', document.baseURI).href;
      } catch {
        return './assets/livin-template.png';
      }
    }
    return './assets/livin-template.png';
  }, []);

  const srcDoc = useMemo(() => {
    const bodyWithTemplate = LIVIN_MANDIRI_BODY_AND_SCRIPT.replace(
      '__TEMPLATE_IMG_URL__',
      templateImgUrl
    );
    return `<!DOCTYPE html>
<html lang="id" class="${isDark ? 'dark' : ''}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>EDIT STRUK MANDIRI</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<style>
*{box-sizing:border-box}
body{margin:0;padding:22px 20px 50px;background:transparent;color:#000000;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;transition:color .2s}
html.dark body{color:#ffffff}
h2{margin:0 0 18px;text-align:center;font-size:18px;font-weight:800;letter-spacing:.03em;color:#4A2B18}
html.dark h2{color:#E5B874}
.main-wrapper{max-width:1120px;margin:auto;display:grid;grid-template-columns:minmax(320px,1fr) minmax(300px,0.95fr);gap:28px;align-items:start}
#control-panel{background:#ffffff;padding:22px;border-radius:16px;border:1px solid #D4C4AE;box-shadow:0 2px 10px rgba(74,43,24,.06);display:flex;flex-direction:column;gap:10px}
html.dark #control-panel{background:#1F150F;border-color:#3A281D;box-shadow:0 2px 10px rgba(0,0,0,.35)}
#control-panel label.full-width{display:block;font-size:12px;font-weight:800;color:#000000}
html.dark #control-panel label.full-width{color:#ffffff}
#control-panel input:not([type="range"]),#control-panel select{display:block;width:100%;margin-top:5px;padding:10px 12px;border:1px solid #CBB9A0;border-radius:10px;font-size:13px;font-weight:600;background:#F8F4EE;color:#000000}
html.dark #control-panel input:not([type="range"]),html.dark #control-panel select{background:#140D09;border-color:#4D3627;color:#ffffff}
#control-panel input:not([type="range"]):focus,#control-panel select:focus{outline:2px solid #4A2B18;outline-offset:1px}
html.dark #control-panel input:not([type="range"]):focus,html.dark #control-panel select:focus{outline-color:#C59656}
.blur-control-wrap{margin-top:2px;padding:12px;border-radius:12px;background:#F8F4EE;border:1px solid #DFD1BE;display:flex;flex-direction:column;gap:8px}
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
.button-wrap{display:flex;gap:10px;margin-top:6px}
.button-wrap button{flex:1;padding:11px 14px;border-radius:10px;font-size:12px;font-weight:800;cursor:pointer;transition:filter .15s;border:1px solid transparent}
.button-accent{background:#EAE0D2;color:#000000;border-color:#CBB9A0 !important}
html.dark .button-accent{background:#2C1E16;color:#ffffff;border-color:#4D3627 !important}
.button-primary{background:#4A2B18;color:#ffffff;border-color:#4A2B18 !important}
html.dark .button-primary{background:#C59656;color:#140D09;border-color:#C59656 !important}
.button-wrap button:hover{filter:brightness(.94)}
.preview-column{display:flex;justify-content:center;min-width:0}
.container{position:relative;width:min(100%,375px);aspect-ratio:720 / 1536;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 12px 30px rgba(74,43,24,.18)}
.container.clean-download{border-radius:0 !important;box-shadow:none !important}
.background{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;display:block}
.overlay{position:absolute;inset:0;font-family:'Roboto',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#111827}
.partial-blur{display:inline-block;filter:blur(4px);-webkit-filter:blur(4px);color:inherit}
.field{position:absolute;line-height:1.35;white-space:nowrap}
#tanggal{top:19.85%;left:8.3%;right:8%;white-space:normal;font-size:clamp(10px,2.8vw,11.2px);font-weight:400;line-height:1.42;color:#7B828E}
#nama-penerima{top:34.7%;left:12.6%;font-size:clamp(13px,3.8vw,14.8px);font-weight:700;letter-spacing:-0.01em;color:#000000}
#bank-norek{top:38.4%;left:12.6%;font-size:clamp(10.5px,3.1vw,11.6px);font-weight:400;color:#5B626E}
#nominal{top:53.78%;right:12.6%;text-align:right;font-size:clamp(12.5px,3.68vw,14px);font-weight:700;line-height:1;letter-spacing:0;color:#000000}
#pengirim{top:63.3%;left:12.6%;font-size:clamp(13px,3.8vw,14.8px);font-weight:700;letter-spacing:-0.01em;color:#000000}
#bankpengirim{top:67.15%;left:12.6%;font-size:clamp(10px,3.0vw,11.2px);font-weight:400;color:#5B626E}
#norekpengirim{top:67.15%;left:46.2%;font-size:clamp(10px,3.0vw,11.2px);font-weight:400;color:#5B626E}
#message-box{display:none;position:fixed;bottom:18px;right:18px;padding:10px 16px;border-radius:10px;background:#4A2B18;color:#ffffff;font-size:12px;font-weight:800;box-shadow:0 8px 20px rgba(0,0,0,.22);z-index:50}
html.dark #message-box{background:#C59656;color:#140D09}
@media(max-width:760px){body{padding:10px 10px 50px}.main-wrapper{grid-template-columns:1fr}.container{width:min(100%,350px)}}
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
        title="Generator Struk Mandiri Livin"
        srcDoc={srcDoc}
        onLoad={syncIframeHeight}
        style={{ height: `${iframeHeight}px` }}
        className="w-full border-0 block bg-transparent"
      />
    </div>
  );
};
