import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument } from 'pdf-lib';
import AxeBuilder from '@axe-core/playwright';
import { OFFLINE_MESSAGES } from '../../src/app/offline.js';
test.use({ serviceWorkers: 'allow' });
// Wait for the dialog's close handler to clear the #tool/ hash before navigating again.
const closeTool = async page => { await page.locator('#close').click(); await expect(page.locator('#tool-dialog')).toBeHidden(); await expect(page).not.toHaveURL(/#tool\//); };
const precacheList = () => JSON.parse(readFileSync(new URL('../../dist/sw.js', import.meta.url), 'utf8').match(/const PRECACHE = (\[.*?\]);/)[1]);
async function installed(page) {
 await page.goto('./');
 await expect(page.locator('#app-notice')).toHaveText(OFFLINE_MESSAGES.ready);
 await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
}
const textImage = (page, text) => page.evaluate(async text => {
 const canvas = document.createElement('canvas'); canvas.width = 800; canvas.height = 140;
 const c = canvas.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, 800, 140); c.fillStyle = '#111'; c.font = '44px sans-serif'; c.fillText(text, 30, 85);
 const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png')); return [...new Uint8Array(await blob.arrayBuffer())];
}, text);
test.beforeEach(async ({ page }) => { page.errors = []; page.on('pageerror', e => page.errors.push(e.message)); });
test.afterEach(async ({ page }) => { expect(page.errors).toEqual([]); });
test('the app installs a service worker, precaches every app file, and works fully offline', async ({ page, context }) => {
 await installed(page);
 const manifest = await page.evaluate(async () => (await fetch(document.querySelector('link[rel=manifest]').href)).json());
 expect(manifest).toMatchObject({ short_name: 'ClickHub', start_url: './', scope: './', display: 'standalone' });
 const cache = await page.evaluate(async () => {
  const names = await caches.keys(), app = names.find(name => name.startsWith('clickhub-app-'));
  return { names, paths: (await (await caches.open(app)).keys()).map(r => new URL(r.url).pathname).sort() };
 });
 const expected = precacheList();
 expect(cache.paths).toEqual([...expected].sort());
 expect(expected).toContain('/ClickHub/index.html');
 expect(expected.some(p => p.includes('/ocr/') || p.endsWith('sw.js') || p.endsWith('.map'))).toBe(false);
 expect(cache.names.filter(n => n.startsWith('clickhub-ocr-'))).toEqual([]);
 await context.setOffline(true);
 await page.reload();
 await expect(page.locator('.tool-card')).toHaveCount(54);
 await expect(page.locator('#app-notice')).toHaveText(OFFLINE_MESSAGES.offline);
 // Lazily loaded code works offline: the regex worker and the pdf-lib chunk.
 await page.goto('./#tool/regex-tester'); await page.locator('#run-tool').click();
 await expect(page.locator('#result')).toHaveValue(/^2 matches/);
 await closeTool(page);
 const pdf = await PDFDocument.create(); pdf.addPage([100, 400]); pdf.addPage([200, 400]);
 await page.goto('./#tool/pdf-merger');
 await page.locator('#document-files').setInputFiles({ name: 'a.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await pdf.save()) });
 await page.locator('#build-pdf').click(); await expect(page.locator('#download-pdf')).toBeVisible();
 await closeTool(page);
 // A query string on the start URL still gets the cached app shell.
 await page.goto('./?source=homescreen'); await expect(page.locator('.tool-card')).toHaveCount(54);
 await context.setOffline(false); await page.evaluate(() => window.dispatchEvent(new Event('online')));
 await expect(page.locator('#app-notice')).toBeHidden();
});
test('OCR files are cached on first use so recognition works offline afterwards', async ({ page, context }) => {
 test.setTimeout(120_000);
 await installed(page);
 await page.goto('./#tool/image-ocr');
 await page.locator('#image-file').setInputFiles({ name: 'a.png', mimeType: 'image/png', buffer: Buffer.from(await textImage(page, 'Offline reading works')) });
 await page.locator('#run-tool').click();
 await expect(page.locator('#feedback')).toHaveText('Text extracted. Review it for mistakes before use.', { timeout: 90_000 });
 const ocrFiles = await page.evaluate(async () => {
  const name = (await caches.keys()).find(n => n.startsWith('clickhub-ocr-'));
  return (await (await caches.open(name)).keys()).map(r => new URL(r.url).pathname.replace('/ClickHub/ocr/', '')).sort();
 });
 expect(ocrFiles).toContain('worker.min.js'); expect(ocrFiles).toContain('lang/eng.traineddata.gz');
 expect(ocrFiles.filter(f => f.startsWith('core/'))).toHaveLength(1);
 expect(ocrFiles.some(f => f.includes('deu'))).toBe(false);
 await context.setOffline(true);
 await page.reload();
 await page.locator('#image-file').setInputFiles({ name: 'b.png', mimeType: 'image/png', buffer: Buffer.from(await textImage(page, 'Second offline run')) });
 await page.locator('#run-tool').click();
 await expect(page.locator('#feedback')).toHaveText('Text extracted. Review it for mistakes before use.', { timeout: 90_000 });
 expect(await page.locator('#result').inputValue()).toMatch(/Second offline run/);
 // A language that was never downloaded explains how to make it available offline.
 await page.locator('[name="ocr-lang"][value="deu"]').check();
 await page.locator('#run-tool').click();
 await expect(page.locator('#feedback')).toContainText('hasn’t been saved for offline use yet', { timeout: 30_000 });
 // The failed start does not leave an OCR worker running.
 await expect.poll(() => page.workers().filter(w => w.url().includes('/ocr/worker.min.js')).length).toBe(0);
});
test('a new version waits for the user and reloads into it on request', async ({ page }) => {
 // A private static server over dist/ whose sw.js the test can change, simulating a new deploy
 // without touching files that parallel tests are using.
 const dist = fileURLToPath(new URL('../../dist/', import.meta.url));
 const original = readFileSync(join(dist, 'sw.js'), 'utf8');
 let swBody = original;
 const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain', '.gz': 'application/gzip' };
 const server = createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url, 'http://x').pathname);
  if (!path.startsWith('/ClickHub/')) { response.writeHead(404).end(); return; }
  const file = path === '/ClickHub/' ? 'index.html' : path.slice('/ClickHub/'.length);
  if (file === 'sw.js') { response.writeHead(200, { 'content-type': 'text/javascript', 'cache-control': 'no-cache' }).end(swBody); return; }
  const full = normalize(join(dist, file));
  if (!full.startsWith(dist) || !existsSync(full)) { response.writeHead(404).end(); return; }
  response.writeHead(200, { 'content-type': types[extname(full)] || 'application/octet-stream' }).end(readFileSync(full));
 });
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 const root = `http://127.0.0.1:${server.address().port}/ClickHub/`;
 try {
  await page.goto(root);
  await expect(page.locator('#app-notice')).toHaveText(OFFLINE_MESSAGES.ready);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  const firstCache = await page.evaluate(async () => (await caches.keys()).find(n => n.startsWith('clickhub-app-')));
  swBody = original.replace(/const APP_VERSION = '[^']+'/, "const APP_VERSION = 'next-version'");
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
  const banner = page.locator('#app-update');
  await expect(banner).toBeVisible(); await expect(banner).toContainText(OFFLINE_MESSAGES.update);
  // Nothing switches until the user asks: the new cache is ready, the old one still serves the page.
  const names = () => page.evaluate(async () => (await caches.keys()).filter(n => n.startsWith('clickhub-app-')).sort());
  expect(await names()).toEqual([firstCache, 'clickhub-app-next-version'].sort());
  expect((await new AxeBuilder({ page }).include('#app-update').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Later' }).click(); await expect(banner).toBeHidden();
  await page.reload(); await expect(banner).toBeVisible();
  const reloaded = page.waitForEvent('load');
  await page.getByRole('button', { name: 'Reload to update' }).click();
  await reloaded;
  await expect(page.locator('.tool-card')).toHaveCount(54); await expect(banner).toBeHidden();
  await expect.poll(names).toEqual(['clickhub-app-next-version']);
 } finally { server.close(); }
});
