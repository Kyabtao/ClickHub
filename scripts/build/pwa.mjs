// Vite plugin: after the build, list the app files, derive version hashes, and write dist/sw.js
// from src/sw/service-worker.js. OCR assets are excluded from the precache (they are large and
// cached on first use instead).
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
export const EXCLUDE = [/^sw\.js$/, /^ocr\//, /\.map$/, /(^|\/)\.[^/]*$/];
export function precacheEntries(files, base) {
 return files.map(file => file.split(sep).join('/')).filter(file => !EXCLUDE.some(pattern => pattern.test(file))).sort().map(file => `${base}${file}`);
}
export function versionOf(parts) {
 const hash = createHash('sha256');
 for (const [name, data] of parts) hash.update(name).update('\0').update(data).update('\0');
 return hash.digest('hex').slice(0, 12);
}
export function renderServiceWorker(template, { appVersion, ocrVersion, precache }) {
 for (const marker of ['__APP_VERSION__', '__OCR_VERSION__', '/*__PRECACHE__*/[]']) if (!template.includes(marker)) throw new Error(`Service worker template is missing ${marker}`);
 return template.replace('__APP_VERSION__', appVersion).replace('__OCR_VERSION__', ocrVersion).replace('/*__PRECACHE__*/[]', JSON.stringify(precache));
}
async function walk(dir, root = dir) {
 const out = [];
 for (const entry of await readdir(dir, { withFileTypes: true })) {
  const full = join(dir, entry.name);
  if (entry.isDirectory()) out.push(...await walk(full, root)); else out.push(relative(root, full));
 }
 return out;
}
export default function pwa() {
 let config;
 return {
  name: 'clickhub-pwa',
  apply: 'build',
  configResolved(resolved) { config = resolved; },
  async closeBundle() {
   const outDir = join(config.root, config.build.outDir), base = config.base;
   const files = await walk(outDir), precache = precacheEntries(files, base);
   const appVersion = versionOf(await Promise.all(precache.map(async url => [url, await readFile(join(outDir, url.slice(base.length)))])));
   const ocrVersion = versionOf([['VERSIONS.txt', await readFile(join(outDir, 'ocr', 'VERSIONS.txt')).catch(() => 'none')]]);
   const template = await readFile(join(config.root, 'src', 'sw', 'service-worker.js'), 'utf8');
   await writeFile(join(outDir, 'sw.js'), renderServiceWorker(template, { appVersion, ocrVersion, precache }));
   config.logger.info(`sw.js: ${precache.length} files precached (app ${appVersion}, ocr ${ocrVersion})`);
  },
 };
}
