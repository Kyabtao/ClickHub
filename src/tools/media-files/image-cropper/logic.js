export const RATIOS = { free: null, '1:1': 1, '4:3': 4 / 3, '3:2': 3 / 2, '16:9': 16 / 9, '3:4': 3 / 4, '9:16': 9 / 16 };
export function ratioValue(key) {
 if (!(key in RATIOS)) throw new Error('Unknown aspect ratio.');
 return RATIOS[key];
}
// Largest centred rectangle with the requested ratio (or the whole image for free).
export function centeredCrop(width, height, ratio) {
 if (!(width > 0 && height > 0)) throw new Error('Invalid image dimensions.');
 if (!ratio) return { x: 0, y: 0, width, height };
 let w = width, h = Math.round(width / ratio);
 if (h > height) { h = height; w = Math.round(height * ratio); }
 w = Math.max(1, Math.min(width, w)); h = Math.max(1, Math.min(height, h));
 return { x: Math.floor((width - w) / 2), y: Math.floor((height - h) / 2), width: w, height: h };
}
export function validateCrop(rect, width, height) {
 const values = ['x', 'y', 'width', 'height'].map(key => Number(rect[key]));
 if (!values.every(Number.isInteger)) throw new Error('Crop values must be whole pixels.');
 const [x, y, w, h] = values;
 if (x < 0 || y < 0 || w < 1 || h < 1) throw new Error('Crop position must be 0 or more and size at least 1 pixel.');
 if (x + w > width || y + h > height) throw new Error(`Crop must stay inside the ${width} × ${height} image.`);
 return { x, y, width: w, height: h };
}
// Converts a drag between two image-space points into a crop, honouring a fixed ratio and image bounds.
export function rectFromDrag(start, end, ratio, width, height) {
 const clamp = (value, max) => Math.max(0, Math.min(max, value));
 const sx = clamp(start.x, width), sy = clamp(start.y, height);
 let ex = clamp(end.x, width), ey = clamp(end.y, height);
 let w = Math.abs(ex - sx), h = Math.abs(ey - sy);
 if (ratio) {
  const dirX = ex >= sx ? 1 : -1, dirY = ey >= sy ? 1 : -1;
  const maxW = dirX > 0 ? width - sx : sx, maxH = dirY > 0 ? height - sy : sy;
  if (w / ratio > h) h = w / ratio; else w = h * ratio;
  if (w > maxW) { w = maxW; h = w / ratio; }
  if (h > maxH) { h = maxH; w = h * ratio; }
  ex = sx + dirX * w; ey = sy + dirY * h;
 }
 const x = Math.round(Math.min(sx, ex)), y = Math.round(Math.min(sy, ey));
 return { x, y, width: Math.max(1, Math.min(width - x, Math.round(w))), height: Math.max(1, Math.min(height - y, Math.round(h))) };
}
