// Generates the extension icons without any image library: rasterises a few
// polygons with 4x supersampling and writes PNGs with zlib.
import fs from 'node:fs';
import zlib from 'node:zlib';

const BLUE = [27, 116, 228];
const WHITE = [255, 255, 255];
const ORANGE = [245, 166, 35];

const inPoly = (x, y, pts) => {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const inRoundRect = (x, y, r) => {
  const cx = Math.min(Math.max(x, r), 1 - r);
  const cy = Math.min(Math.max(y, r), 1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
};
const tag = [[0.22, 0.30], [0.55, 0.30], [0.80, 0.55], [0.55, 0.80], [0.22, 0.80]];
const arrow = [[0.62, 0.08], [0.82, 0.28], [0.69, 0.28], [0.69, 0.42], [0.55, 0.42], [0.55, 0.28], [0.42, 0.28]];

function colorAt(x, y) {
  if (!inRoundRect(x, y, 0.2)) return null;
  if (inPoly(x, y, arrow)) return ORANGE;
  if (inPoly(x, y, tag) && (x - 0.33) ** 2 + (y - 0.43) ** 2 > 0.06 ** 2) return WHITE;
  return BLUE;
}

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (const b of buf) {
    c = (crc ^ b) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(size) {
  const SS = 4;
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const c = colorAt((x + (sx + 0.5) / SS) / size, (y + (sy + 0.5) / SS) / size);
        if (c) { r += c[0]; g += c[1]; b += c[2]; a += 255; }
      }
      const n = SS * SS, cov = a / 255 || 1;
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r / cov; raw[o + 1] = g / cov; raw[o + 2] = b / cov; raw[o + 3] = a / n;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const out = new URL('../extension/icons/', import.meta.url);
for (const size of [16, 48, 128]) fs.writeFileSync(new URL(`icon${size}.png`, out), png(size));
console.log('icons written');
