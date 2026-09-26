import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const axe = async page => (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }));
const fitsWidth = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
// Draw printed text onto a canvas in the page and return it as PNG bytes.
const textImage = (page, lines) => page.evaluate(async lines => {
 const canvas = document.createElement('canvas'); canvas.width = 900; canvas.height = 80 + lines.length * 70;
 const c = canvas.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, canvas.width, canvas.height);
 c.fillStyle = '#111'; c.font = '44px sans-serif'; lines.forEach((line, i) => c.fillText(line, 40, 80 + i * 70));
 const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
 return [...new Uint8Array(await blob.arrayBuffer())];
}, lines);
test.beforeEach(async ({ page, context }) => {
 page.errors = []; page.requests = [];
 page.on('pageerror', e => page.errors.push(e.message));
 context.on('request', request => page.requests.push(request.url()));
});
test.afterEach(async ({ page }) => { expect(page.errors).toEqual([]); });
test('Image OCR extracts printed text using only self-hosted engine and language files', async ({ page, baseURL }) => {
 test.setTimeout(120_000);
 await page.goto('./#tool/image-ocr'); await page.reload();
 await expect(page.locator('#run-tool')).toBeDisabled();
 const png = await textImage(page, ['ClickHub reads text', 'Invoice 2026 total 4815']);
 await page.locator('#image-file').setInputFiles({ name: 'scan.png', mimeType: 'image/png', buffer: Buffer.from(png) });
 await expect(page.locator('#image-info')).toHaveText('Image: 900 × 220 pixels');
 await expect(page.getByRole('img', { name: 'Selected image for text recognition' })).toBeVisible();
 await page.locator('#run-tool').click();
 await expect(page.locator('#ocr-cancel')).toBeVisible();
 await expect(page.locator('#feedback')).toHaveText('Text extracted. Review it for mistakes before use.', { timeout: 90_000 });
 const text = await page.locator('#result').inputValue();
 expect(text).toMatch(/ClickHub reads text/); expect(text).toMatch(/Invoice 2026 total 4815/);
 await expect(page.locator('#ocr-summary')).toContainText(/7 words · 2 lines · confidence \d+%/);
 await expect(page.locator('#ocr-cancel')).toBeHidden();
 // Everything came from this site: worker, engine, and language model, and nothing else left the device.
 const origin = new URL(baseURL).origin, external = page.requests.filter(url => /^https?:/.test(url) && new URL(url).origin !== origin);
 expect(external).toEqual([]);
 expect(page.requests.some(url => url.endsWith('/ClickHub/ocr/worker.min.js'))).toBe(true);
 expect(page.requests.some(url => /\/ClickHub\/ocr\/core\/tesseract-core-.*lstm\.wasm\.js$/.test(url))).toBe(true);
 expect(page.requests.some(url => url.endsWith('/ClickHub/ocr/lang/eng.traineddata.gz'))).toBe(true);
 // Layout switch, editing, and download.
 await page.locator('#ocr-layout').selectOption('paragraphs');
 expect(await page.locator('#result').inputValue()).toMatch(/ClickHub reads text Invoice 2026 total 4815/);
 const pending = page.waitForEvent('download'); await page.locator('#ocr-download').click(); const file = await pending;
 expect(file.suggestedFilename()).toBe('clickhub-ocr.txt');
 const chunks = []; for await (const chunk of await file.createReadStream()) chunks.push(chunk);
 expect(Buffer.concat(chunks).toString()).toMatch(/Invoice 2026 total 4815/);
 await page.locator('#result').fill(''); await expect(page.locator('#ocr-download')).toBeDisabled();
 expect(await axe(page)).toEqual([]); expect(await fitsWidth(page)).toBe(true);
});
test('Image OCR accepts pasted screenshots, validates languages, rejects bad files, and can cancel', async ({ page }) => {
 test.setTimeout(120_000);
 await page.goto('./#tool/image-ocr');
 await page.locator('#image-file').setInputFiles({ name: 'fake.png', mimeType: 'image/png', buffer: Buffer.from('not an image') });
 await expect(page.locator('#image-info')).toHaveText('No image loaded.'); await expect(page.locator('#run-tool')).toBeDisabled();
 await expect(page.locator('#feedback')).not.toBeEmpty();
 const png = await textImage(page, ['Pasted screenshot']);
 await page.evaluate(bytes => {
  const data = new DataTransfer(); data.items.add(new File([new Uint8Array(bytes)], 'image.png', { type: 'image/png' }));
  document.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
 }, png);
 await expect(page.locator('#image-info')).toHaveText('Image: 900 × 150 pixels');
 for (const code of ['hin', 'spa', 'fra']) await page.locator(`[name="ocr-lang"][value="${code}"]`).check();
 await page.locator('#run-tool').click();
 await expect(page.locator('#feedback')).toHaveText(/at most 3 languages/);
 for (const code of ['eng', 'hin', 'spa', 'fra']) await page.locator(`[name="ocr-lang"][value="${code}"]`).uncheck();
 await page.locator('#run-tool').click(); await expect(page.locator('#feedback')).toHaveText('Choose at least one language.');
 await page.locator('[name="ocr-lang"][value="eng"]').check();
 // Hold the first language download so the cancel reliably lands mid-recognition.
 let held = false;
 await page.route('**/ocr/lang/eng.traineddata.gz', async route => { if (!held) { held = true; await new Promise(r => setTimeout(r, 4000)); } await route.continue().catch(() => {}); });
 await page.locator('#run-tool').click(); await expect(page.locator('#ocr-cancel')).toBeVisible();
 await expect(page.locator('#ocr-progress-label')).toHaveText(/Loading language data/);
 await expect(page.locator('[name="ocr-lang"][value="eng"]')).toBeDisabled();
 await page.locator('#ocr-cancel').click();
 await expect(page.locator('#feedback')).toHaveText('Recognition cancelled.'); await expect(page.locator('#ocr-cancel')).toBeHidden();
 await expect(page.locator('#run-tool')).toBeEnabled(); await expect(page.locator('#run-tool')).toBeFocused();
 await expect(page.locator('#result')).toHaveValue('');
 // Running again after a cancel starts a fresh worker and succeeds.
 await page.locator('#run-tool').click();
 await expect(page.locator('#feedback')).toHaveText('Text extracted. Review it for mistakes before use.', { timeout: 90_000 });
 expect(await page.locator('#result').inputValue()).toMatch(/Pasted screenshot/);
 // Closing the tool mid-way does not leave errors behind.
 await page.locator('#close').click(); await expect(page.locator('#tool-dialog')).toBeHidden();
});
