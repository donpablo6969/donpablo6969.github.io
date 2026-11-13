export const ISOLATED_BLUR_HELPER_JS = `
function applyPixelBlur(canvas, rect, radius) {
  const r = Math.min(45, Math.max(1, Math.round(radius)));
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

function getTightBlurRects(el, baseRect) {
  const nodes = Array.from(el.querySelectorAll('.partial-blur'));
  if (nodes.length === 0) return [];

  const rawRects = [];
  nodes.forEach(node => {
    const text = node.textContent || '';
    if (!text.trim().length) return;
    const r = node.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;

    const cs = getComputedStyle(node);
    const fontSize = parseFloat(cs.fontSize) || r.height;
    const tightH = Math.min(r.height, fontSize * 1.06);
    const tightTop = (r.top - baseRect.top) + (r.height - tightH) * 0.5;

    const hasPrevSharp = Boolean(
      node.previousSibling &&
      node.previousSibling.nodeType === 3 &&
      (node.previousSibling.textContent || '').trim().length > 0
    );
    const hasNextSharp = Boolean(
      node.nextSibling &&
      node.nextSibling.nodeType === 3 &&
      (node.nextSibling.textContent || '').trim().length > 0
    );

    const padLeft = hasPrevSharp ? 0 : 0.8;
    const padRight = hasNextSharp ? 0 : 0.8;
    const padY = 0.5;

    rawRects.push({
      left: Math.max(0, (r.left - baseRect.left) - padLeft),
      top: Math.max(0, tightTop - padY),
      right: (r.right - baseRect.left) + padRight,
      bottom: tightTop + tightH + padY,
      fontSize
    });
  });

  if (rawRects.length === 0) return [];

  const merged = [];
  rawRects.forEach(cur => {
    const prev = merged[merged.length - 1];
    if (
      prev &&
      Math.abs(cur.top - prev.top) < Math.max(prev.fontSize, cur.fontSize) * 0.55 &&
      cur.left - prev.right <= Math.max(prev.fontSize, cur.fontSize) * 0.9 &&
      cur.right >= prev.left - 4
    ) {
      prev.left = Math.min(prev.left, cur.left);
      prev.top = Math.min(prev.top, cur.top);
      prev.right = Math.max(prev.right, cur.right);
      prev.bottom = Math.max(prev.bottom, cur.bottom);
    } else {
      merged.push({ ...cur });
    }
  });

  return merged.map(m => ({
    left: m.left,
    top: m.top,
    width: Math.max(1, m.right - m.left),
    height: Math.max(1, m.bottom - m.top)
  }));
}

async function renderReceiptWithIsolatedBlur(el, html2canvasOptions, radiusCss) {
  const baseRect = el.getBoundingClientRect();
  const targetId = el.id;
  const targets = getTightBlurRects(el, baseRect);
  const blurRadiusCss = parseFloat(radiusCss);

  const canvas = await html2canvas(el, {
    ...html2canvasOptions,
    onclone: (clonedDoc) => {
      if (typeof html2canvasOptions.onclone === 'function') {
        html2canvasOptions.onclone(clonedDoc);
      }
      const root = targetId ? clonedDoc.getElementById(targetId) : clonedDoc.body;
      if (!root) return;
      root.querySelectorAll('.partial-blur').forEach(node => {
        node.style.setProperty('filter', 'none', 'important');
        node.style.setProperty('-webkit-filter', 'none', 'important');
      });
    }
  });

  if (targets.length > 0 && blurRadiusCss > 0) {
    const kx = baseRect.width > 0 ? canvas.width / baseRect.width : (html2canvasOptions.scale || 3);
    const ky = baseRect.height > 0 ? canvas.height / baseRect.height : kx;
    const pixelRadius = Math.max(1, blurRadiusCss * kx * 0.55);

    targets.forEach(rect => {
      applyPixelBlur(canvas, {
        x: rect.left * kx,
        y: rect.top * ky,
        w: rect.width * kx,
        h: rect.height * ky
      }, pixelRadius);
    });
  }

  return canvas;
}
`;
