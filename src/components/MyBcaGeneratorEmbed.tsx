import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ISOLATED_BLUR_HELPER_JS } from '../utils/isolatedBlurExport';

const MY_BCA_BODY_AND_SCRIPT = `<h2>BUKTI TRANSFER MY-BCA</h2>
<div class="main-wrapper">
  <section id="control-panel">
    <label>Nominal Transfer
      <input id="input-nominal" inputmode="numeric" placeholder="20.000.000–100.000.000" oninput="formatNominal(this);updatePreview()">
    </label>
    <label>Tanggal transaksi
      <input id="input-tanggal" placeholder="10 Nov 2026" oninput="updatePreview()">
    </label>
    <label>Waktu transaksi
      <input id="input-waktu" placeholder="15:32:13" oninput="updatePreview()">
    </label>
    <label>Nama penerima
      <input id="input-nama" placeholder="NAMA CONTOH" oninput="updatePreview()">
    </label>
    <label>Rekening Tujuan
      <input id="input-rekening" inputmode="numeric" placeholder="123 - 456 - 7890" oninput="updatePreview()">
    </label>
    <label>Tingkat Blur (1–15 px)
      <input id="input-blur" type="range" min="1" max="15" step="1" value="4" oninput="applyBlur()">
      <span id="blur-value" class="hint">4 px</span>
    </label>
    <label>Format File Unduhan
      <select id="input-format">
        <option value="png">PNG (Kualitas Tanpa Kompresi)</option>
        <option value="jpeg">JPEG / JPG (Ukuran Lebih Ringan)</option>
      </select>
    </label>
    <div class="button-wrap">
      <button onclick="randomizeData()">Acak Data</button>
      <button class="secondary" onclick="resetData()">Reset</button>
      <button class="success" onclick="downloadImage()">Download Gambar</button>
    </div>
    <p class="status" id="status"></p>
  </section>

  <section class="preview-area">
    <div id="struk">
      <img
        class="background"
        id="template-image"
        alt="Template BCA"
        src="__TEMPLATE_IMG_URL__"
        onerror="if(!this.dataset.fb){this.dataset.fb='1';this.src='https://ik.imagekit.io/donpablo69/MYBCA.png';}"
        crossorigin="anonymous"
      >
      <div class="field" id="tanggal"></div>
      <div class="field" id="nominal"></div>
      <div class="field" id="nama-penerima"></div>
      <div class="field" id="rekening"></div>
    </div>
  </section>
</div>

<script>
const $ = id => document.getElementById(id);

function formatNominal(el){
  const digits = el.value.replace(/\\D/g,'');
  el.value = digits ? Number(digits).toLocaleString('id-ID') : '';
}

function pad(n){ return String(n).padStart(2,'0'); }

function formatTime(date){
  return \`\${pad(date.getHours())}:\${pad(date.getMinutes())}:\${pad(date.getSeconds())}\`;
}

function updatePreview(){
  const rawNominal = $('input-nominal').value.replace(/\\D/g,'');
  const nominal = rawNominal ? String(Math.min(100000000, Math.max(20000000, Number(rawNominal)))) : '';
  const tanggal = $('input-tanggal').value.trim();
  const waktu = $('input-waktu').value.trim();
  const nama = $('input-nama').value.trim();
  const rekeningDigits = $('input-rekening').value.replace(/\\D/g,'').slice(0,10);
  const rekening = rekeningDigits.length === 10 
    ? \`\${rekeningDigits.slice(0,3)} - \${rekeningDigits.slice(3,6)} - \${rekeningDigits.slice(6)}\` 
    : rekeningDigits;

  $('tanggal').textContent = [tanggal, waktu].filter(Boolean).join(' ');
  $('nominal').textContent = nominal ? 'IDR ' + Number(nominal).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) : '';
  $('nama-penerima').innerHTML = maskPartially(nama, 0.75);
  $('rekening').innerHTML = maskAccount(rekening, 0.80);
  applyBlur();
}

function maskPartially(value, ratio){
  const chars = [...value];
  const eligible = chars.map((c,i)=>({c,i})).filter(x=>/[A-Za-zÀ-ÿ]/.test(x.c));
  const count = Math.floor(eligible.length * ratio);
  const blurred = new Set(eligible.slice(0,count).map(x=>x.i));
  return chars.map((c,i)=>c === ' ' ? ' ' : blurred.has(i) ? \`<span class="partial-blur">\${escapeHTML(c)}</span>\` : escapeHTML(c)).join('');
}

function maskAccount(value, ratio){
  const chars = [...value];
  const eligible = chars.map((c,i)=>({c,i})).filter(x=>/\\d/.test(x.c));
  const count = Math.floor(eligible.length * ratio);
  const blurred = new Set(eligible.slice(0,count).map(x=>x.i));
  return chars.map((c,i)=>c === ' ' || c === '-' ? escapeHTML(c) : blurred.has(i) ? \`<span class="partial-blur">\${escapeHTML(c)}</span>\` : escapeHTML(c)).join('');
}

function escapeHTML(value){
  return String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function applyBlur(){
  const blur = Math.min(15, Math.max(1, Number($('input-blur')?.value || 4)));
  document.querySelectorAll('.partial-blur').forEach(el=>{
    el.style.filter = \`blur(\${blur}px)\`;
    el.style.webkitFilter = \`blur(\${blur}px)\`;
  });
  if ($('blur-value')) $('blur-value').textContent = \`\${blur} px\`;
}

function randomWord(){
  const names = ['ARI','BIMA','DARA','NUSA','RAKA','SARI','TAMA','LOKA','MIRA','DEWA','ADITYA','PUTRI','NADIA','BAGUS','ANDIKA','PRATAMA','WIJAYA','SAPUTRA','MAULANA','PERMATA'];
  return names[Math.floor(Math.random()*names.length)];
}

function randomizeData(){
  const now = new Date();
  const date = now.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}).replace(/\\./g,'');
  const time = formatTime(now);
  const amount = 20000000 + Math.floor(Math.random() * 161) * 500000;
  const wordCount = Math.floor(Math.random()*3)+1;
  const parts = [];
  while(parts.length < wordCount){
    const candidate = randomWord();
    if(!parts.includes(candidate)) parts.push(candidate);
  }
  $('input-nominal').value = amount.toLocaleString('id-ID');
  $('input-tanggal').value = date;
  $('input-waktu').value = time;
  $('input-nama').value = parts.join(' ');
  $('input-rekening').value = String(Math.floor(1000000000 + Math.random()*9000000000));
  updatePreview();
}

function resetData(){
  ['input-nominal','input-tanggal','input-waktu','input-nama','input-rekening'].forEach(id=>$(id).value='');
  updatePreview();
}

${ISOLATED_BLUR_HELPER_JS}

async function downloadImage(){
  const format = $('input-format').value; // 'png' atau 'jpeg'
  const el = $('struk');
  $('status').textContent = \`Menyiapkan gambar \${format.toUpperCase()}...\`;

  try{
    await document.fonts.ready;

    const radiusCss = parseFloat($('input-blur')?.value || '4') || 4;
    const canvas = await renderReceiptWithIsolatedBlur(el, {
      scale: 3,
      backgroundColor: '#ffffff',
      useCORS: true
    }, radiusCss);

    // Ekspor sesuai pilihan format (PNG atau JPEG)
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const quality = format === 'jpeg' ? 0.95 : undefined;
    const ext = format === 'jpeg' ? 'jpg' : 'png';

    const link = document.createElement('a');
    link.download = \`template-bca-simulasi.\${ext}\`;
    link.href = canvas.toDataURL(mimeType, quality);
    document.body.appendChild(link);
    link.click();
    link.remove();

    $('status').textContent = \`Gambar \${format.toUpperCase()} berhasil diunduh dengan efek blur terjaga.\`;
  } catch(err){
    $('status').textContent = 'Gagal membuat gambar: ' + err.message;
  }
}

window.addEventListener('load', randomizeData);
</script>`;

export const MyBcaGeneratorEmbed: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState<number>(960);
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
        return new URL('./assets/mybca-template.png', document.baseURI).href;
      } catch {
        return './assets/mybca-template.png';
      }
    }
    return './assets/mybca-template.png';
  }, []);

  const srcDoc = useMemo(() => {
    const bodyWithTemplate = MY_BCA_BODY_AND_SCRIPT.replace(
      '__TEMPLATE_IMG_URL__',
      templateImgUrl
    );
    return `<!DOCTYPE html>
<html lang="id" class="${isDark ? 'dark' : ''}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Generator Template BCA — Simulasi</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<style>
*{box-sizing:border-box}
body{margin:0;padding:16px 16px 50px;background:transparent;color:#000000;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;transition:color .2s}
html.dark body{color:#ffffff}
h2{text-align:center;color:#4A2B18;margin:4px 0 20px;font-weight:800;letter-spacing:.02em}
html.dark h2{color:#E5B874}
.main-wrapper{max-width:1120px;margin:auto;display:grid;grid-template-columns:340px minmax(0,1fr);gap:24px;align-items:start}
#control-panel{background:#ffffff;padding:20px;border-radius:16px;border:1px solid #D4C4AE;box-shadow:0 2px 10px rgba(74,43,24,.06)}
html.dark #control-panel{background:#1F150F;border-color:#3A281D;box-shadow:0 2px 10px rgba(0,0,0,.35)}
label{display:block;font-size:12px;font-weight:800;margin-bottom:13px;color:#000000}
html.dark label{color:#ffffff}
input, select{display:block;width:100%;margin-top:6px;padding:10px 12px;border:1px solid #CBB9A0;border-radius:10px;font-size:13px;font-weight:600;background:#F8F4EE;color:#000000}
html.dark input, html.dark select{background:#140D09;border-color:#4D3627;color:#ffffff}
input:focus, select:focus{outline:2px solid #4A2B18;outline-offset:1px}
html.dark input:focus, html.dark select:focus{outline-color:#C59656}
input[type="range"]{padding:0;border:0;background:transparent;accent-color:#4A2B18}
html.dark input[type="range"]{background:transparent;accent-color:#C59656}
.hint{font-size:12px;color:#5D4C3E;line-height:1.5;margin:4px 0 0;display:inline-block}
html.dark .hint{color:#D6C7B5}
.preview-area{display:flex;justify-content:center;min-width:0}

/* Container struk dengan crop bagian atas */
#struk{position:relative;width:min(100%,416px);aspect-ratio:832/1760;background:#fff;overflow:hidden;box-shadow:0 5px 24px #172b451c}

/* Geser gambar ke atas untuk memotong status bar bawaan */
.background{position:absolute;top:-45px;left:0;width:100%;height:calc(100% + 45px);object-fit:fill}

.field{position:absolute;left:5.2%;width:89.6%;font-family:Arial,Helvetica,sans-serif;white-space:nowrap}
#tanggal{top:32.55%;text-align:center;font-size:clamp(10px,2.7vw,15px);font-weight:400;color:#555b60}
#nominal{top:35.75%;text-align:center;font-size:clamp(30px,5.5vw,33px);font-weight:700;color:#00345c;letter-spacing:.2px}
#nama-penerima{top:44.0%;text-align:right;font-size:clamp(13px,3.2vw,18px);font-weight:400;color:#555b60}
#rekening{top:50.75%;text-align:right;font-size:clamp(13px,3.2vw,18px);font-weight:600;color:#555b60}
.partial-blur{display:inline-block;filter:blur(3px);-webkit-filter:blur(3px);color:inherit}

.button-wrap{display:flex;gap:9px;flex-wrap:wrap;margin-top:18px}
button{border:1px solid #CBB9A0;border-radius:10px;background:#EAE0D2;color:#000000;padding:11px 14px;font-weight:800;font-size:12px;cursor:pointer;flex:1;transition:filter .15s,background .15s}
html.dark button{background:#2C1E16;color:#ffffff;border-color:#4D3627}
button.secondary{background:#FBE7EB;color:#9F1239;border-color:#F2B8C6}
html.dark button.secondary{background:#3E1621;color:#FDA4AF;border-color:#70263A}
button.success{background:#4A2B18;color:#ffffff;border-color:#4A2B18;flex:100%}
html.dark button.success{background:#C59656;color:#140D09;border-color:#C59656}
button:hover{filter:brightness(.94)}
.status{font-size:12px;color:#5D4C3E;margin:12px 0 0;line-height:1.5;font-weight:600}
.status:empty{display:none;margin:0}
html.dark .status{color:#D6C7B5}
@media(max-width:760px){body{padding:8px 8px 50px}.main-wrapper{grid-template-columns:1fr}#control-panel{order:1}.preview-area{order:2}#struk{width:min(100%,390px)}}
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
        title="Generator Bukti Transfer MY-BCA"
        srcDoc={srcDoc}
        onLoad={syncIframeHeight}
        style={{ height: `${iframeHeight}px` }}
        className="w-full border-0 block bg-transparent"
      />
    </div>
  );
};
