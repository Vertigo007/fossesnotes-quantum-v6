// Phone-side photo processing: EXIF-aware downscale and a gentle automatic
// levels correction (dim indoor photos are the #1 reason ads get skipped).

const MAX_SIDE = 2048;

/** Luminance histogram stretch between the 0.5th and 99.5th percentiles, capped so colours stay natural. */
function autoLevels(ctx, width, height) {
  const img = ctx.getImageData(0, 0, width, height);
  const d = img.data;
  const hist = new Uint32Array(256);
  const step = Math.max(1, Math.floor(d.length / 4 / 200000)) * 4; // sample ~200k pixels
  let samples = 0;
  for (let i = 0; i < d.length; i += step) {
    hist[(d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) | 0]++;
    samples++;
  }
  const pick = (q) => {
    let acc = 0;
    for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= samples * q) return v; }
    return 255;
  };
  const lo = pick(0.005);
  const hi = pick(0.995);
  const range = hi - lo;
  if (range < 40 || range > 235) return false; // already fine, or nearly uniform
  const gain = Math.min(1.35, 255 / range);
  const offset = lo * gain > 40 ? 40 : lo * gain;
  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) lut[v] = v * gain - offset;
  for (let i = 0; i < d.length; i += 4) { d[i] = lut[d[i]]; d[i + 1] = lut[d[i + 1]]; d[i + 2] = lut[d[i + 2]]; }
  ctx.putImageData(img, 0, 0);
  return true;
}

export async function preparePhoto(file, { enhance = true } = {}) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d', { willReadFrequently: enhance });
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  if (enhance) {
    try { autoLevels(ctx, canvas.width, canvas.height); } catch { /* keep the original pixels */ }
  }
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86));
}
