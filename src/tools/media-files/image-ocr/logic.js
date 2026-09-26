import { OCR_LANGUAGES } from './languages.js';
export const MAX_OCR_LANGUAGES = 3;
export function languageString(codes) {
 const known = new Set(OCR_LANGUAGES.map(l => l.code)), chosen = [...new Set(codes)];
 if (!chosen.length) throw new Error('Choose at least one language.');
 if (chosen.length > MAX_OCR_LANGUAGES) throw new Error(`Choose at most ${MAX_OCR_LANGUAGES} languages; each one adds download size and slows recognition.`);
 const unknown = chosen.find(code => !known.has(code));
 if (unknown) throw new Error(`Unsupported language: ${unknown}.`);
 return chosen.join('+');
}
// Absolute same-origin URLs for everything tesseract.js loads. Its defaults point to a public CDN,
// so every path must be set explicitly to keep images and code on this site.
export function workerOptions(baseURL, origin, logger = () => {}) {
 const root = new URL(`${baseURL.replace(/\/?$/, '/')}ocr/`, origin);
 if (root.origin !== new URL(origin).origin) throw new Error('OCR assets must be served from this site.');
 return {
  workerPath: new URL('worker.min.js', root).href,
  corePath: new URL('core/', root).href,
  langPath: new URL('lang', root).href,
  gzip: true,
  workerBlobURL: false,
  cacheMethod: 'none',
  logger,
 };
}
// Upscale small images (helps Tesseract with screenshots) and cap very large ones (memory/time).
export function ocrScale(width, height) {
 if (!(width > 0 && height > 0)) throw new Error('Invalid image dimensions.');
 const longest = Math.max(width, height);
 let scale = longest < 1000 ? Math.min(2, 2000 / longest) : 1;
 if (longest * scale > 4000) scale = 4000 / longest;
 return { scale, width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}
export function tidyText(text, layout = 'lines') {
 const clean = String(text).replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
 if (layout === 'lines') return clean;
 if (layout !== 'paragraphs') throw new Error('Unknown layout.');
 // Join wrapped lines inside each paragraph and repair words hyphenated across a line break.
 return clean.split(/\n\s*\n/).map(paragraph => paragraph.replace(/(\p{L})-\n(\p{Ll})/gu, '$1$2').replace(/\s*\n\s*/g, ' ')).join('\n\n');
}
export function summarize(text, confidence) {
 const words = text.trim() ? text.trim().split(/\s+/).length : 0, lines = text.trim() ? text.trim().split('\n').filter(l => l.trim()).length : 0;
 const score = Number.isFinite(confidence) ? Math.round(confidence) : null;
 return { words, lines, confidence: score, quality: score === null ? 'unknown' : score >= 85 ? 'high' : score >= 60 ? 'medium' : 'low' };
}
export function progressLabel(status, progress) {
 const labels = { 'loading tesseract core': 'Loading OCR engine', 'initializing tesseract': 'Starting OCR engine', 'loading language traineddata': 'Loading language data', 'initializing api': 'Preparing', 'recognizing text': 'Recognising text' };
 const label = labels[status] || 'Working';
 return Number.isFinite(progress) ? `${label}… ${Math.round(progress * 100)}%` : `${label}…`;
}
