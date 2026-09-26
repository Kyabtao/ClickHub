import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { encodeWAV } from '../../src/tools/media-files/audio-trimmer/logic.js';
const axe = async page => (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }));
const fitsWidth = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
async function downloadBytes(page, selector) { const pending = page.waitForEvent('download'); await page.locator(selector).click(); const download = await pending, chunks = []; for await (const c of await download.createReadStream()) chunks.push(c); return { name: download.suggestedFilename(), bytes: Buffer.concat(chunks) }; }
async function png(page) {
 // 80×40: left half red, right half blue.
 const data = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 80; c.height = 40; const x = c.getContext('2d'); x.fillStyle = '#f00'; x.fillRect(0, 0, 40, 40); x.fillStyle = '#00f'; x.fillRect(40, 0, 40, 40); return c.toDataURL('image/png').split(',')[1]; });
 return { name: 'split.png', mimeType: 'image/png', buffer: Buffer.from(data, 'base64') };
}
function wav(seconds = 2, rate = 8000) {
 const samples = new Float32Array(seconds * rate).map((_, i) => Math.sin(i / rate * 2 * Math.PI * 440) * 0.5);
 return { name: 'tone.wav', mimeType: 'audio/wav', buffer: Buffer.from(encodeWAV([samples], rate)) };
}
test.beforeEach(async ({ page }) => { page.errors = []; page.on('pageerror', e => page.errors.push(e.message)); });
test.afterEach(async ({ page }) => { expect(page.errors).toEqual([]); });
test('image cropper crops by ratio, typed values, and drag', async ({ page }) => {
 await page.goto('./#tool/image-cropper'); await page.reload();
 await expect(page.locator('#process-image')).toBeDisabled();
 await page.locator('#image-file').setInputFiles(await png(page));
 await expect(page.locator('#image-info')).toHaveText('Source: 80 × 40 pixels');
 await page.locator('#crop-ratio').selectOption('1:1');
 await expect(page.locator('#crop-x')).toHaveValue('20'); await expect(page.locator('#crop-width')).toHaveValue('40');
 await page.locator('#crop-x').fill('40'); await page.locator('#process-image').click();
 await expect(page.locator('#feedback')).toContainText('Ready: 40 × 40 pixels');
 const { name, bytes } = await downloadBytes(page, '#download-image');
 expect(name).toBe('clickhub-crop.png'); expect(bytes.subarray(1, 4).toString()).toBe('PNG');
 const colour = await page.evaluate(() => { const c = document.querySelector('#image-preview canvas'); return [...c.getContext('2d').getImageData(20, 20, 1, 1).data]; });
 expect(colour.slice(0, 3)).toEqual([0, 0, 255]);
 await page.locator('#crop-x').fill('60'); await expect(page.locator('#feedback')).toContainText('inside the 80 × 40 image'); await expect(page.locator('#download-image')).toBeHidden();
 await page.locator('#crop-ratio').selectOption('free');
 await page.locator('#crop-canvas').scrollIntoViewIfNeeded(); const box = await page.locator('#crop-canvas').boundingBox();
 await page.mouse.move(box.x + 2, box.y + 2); await page.mouse.down(); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 }); await page.mouse.up();
 await expect(page.locator('#crop-x')).toHaveValue(/^[01]$/); await expect(page.locator('#crop-width')).toHaveValue(/^(38|39|40|41)$/);
 expect(await axe(page)).toEqual([]); expect(await fitsWidth(page)).toBe(true);
});
test('chart builder draws bar, line, and pie charts and exports SVG and PNG', async ({ page }) => {
 await page.goto('./#tool/chart-builder');
 await page.locator('#run-tool').click();
 await expect(page.locator('#chart-output svg rect[fill="#2f6f4e"]')).toHaveCount(7);
 await expect(page.locator('#chart-table tbody tr')).toHaveCount(6);
 expect(await axe(page)).toEqual([]);
 const svg = await downloadBytes(page, '#chart-svg'); expect(svg.name).toBe('clickhub-chart.svg'); expect(svg.bytes.toString()).toContain('<svg');
 const pngFile = await downloadBytes(page, '#chart-png'); expect(pngFile.bytes.subarray(1, 4).toString()).toBe('PNG');
 await page.locator('#chart-type').selectOption('line'); await expect(page.locator('#chart-output svg')).toHaveCount(0);
 await page.locator('#run-tool').click(); await expect(page.locator('#chart-output polyline')).toHaveCount(2);
 await page.locator('#chart-type').selectOption('pie'); await page.locator('#run-tool').click(); await expect(page.locator('#feedback')).toHaveText('Pie charts use exactly one value column.');
 await page.locator('#input').fill('Label, Share\n<img src=x onerror="window.pwned=1">, 3\nOther, 1'); await page.locator('#run-tool').click();
 await expect(page.locator('#chart-output path')).toHaveCount(2); await expect(page.locator('#chart-output svg')).toContainText('<img src=x');
 expect(await page.evaluate(() => window.pwned)).toBeUndefined();
 await page.locator('#input').fill('a, lots'); await page.locator('#run-tool').click(); await expect(page.locator('#feedback')).toContainText('not a number'); await expect(page.locator('#chart-svg')).toBeDisabled();
 expect(await fitsWidth(page)).toBe(true);
});
test('audio trimmer decodes, trims with fades, and exports WAV', async ({ page }) => {
 await page.goto('./#tool/audio-trimmer');
 await page.locator('#audio-file').setInputFiles(wav());
 await expect(page.locator('#audio-info')).toHaveText(/^Length 0:02\.00 · 1 channel · [\d,]+ Hz$/);
 const rate = await page.evaluate(() => { const c = new AudioContext(); const r = c.sampleRate; c.close(); return r; });
 await page.locator('#audio-start').fill('0.5'); await page.locator('#audio-end').fill('0:01.5'); await page.locator('#audio-fade-in').fill('0.1');
 await page.locator('#process-audio').click();
 await expect(page.locator('#feedback')).toHaveText(`Ready: 0:01.00 of audio, ${(44 + rate * 2).toLocaleString('en-US')} bytes.`);
 await expect(page.locator('#audio-preview')).toBeVisible();
 const { name, bytes } = await downloadBytes(page, '#download-audio');
 expect(name).toBe('clickhub-trim.wav'); expect(bytes.subarray(0, 4).toString()).toBe('RIFF'); expect(bytes.length).toBe(44 + rate * 2); expect(bytes.readInt16LE(44)).toBe(0);
 await page.locator('#audio-end').fill('5'); await expect(page.locator('#download-audio')).toBeHidden();
 await page.locator('#process-audio').click(); await expect(page.locator('#feedback')).toContainText('beyond the audio length');
 expect(await axe(page)).toEqual([]);
 await page.locator('#audio-file').setInputFiles({ name: 'bad.mp3', mimeType: 'audio/mpeg', buffer: Buffer.from('not audio') });
 await expect(page.locator('#feedback')).toContainText('could not be decoded'); await expect(page.locator('#process-audio')).toBeDisabled();
});
test('flashcards save locally, schedule reviews, and survive reload', async ({ page }) => {
 await page.goto('./#tool/flashcards');
 await expect(page.locator('#study-status')).toHaveText('Add a card below to start studying.');
 await expect(page.locator('.tool-privacy')).toContainText('Saved on this device');
 for (const [front, back, deck] of [['Hola', 'Hello', 'Spanish'], ['2 + 2', '4', 'Maths']]) {
  await page.locator('#record-title').fill(front); await page.locator('#record-back').fill(back); await page.locator('#record-deck').fill(deck); await page.locator('#save-record').click();
 }
 await expect(page.locator('#workspace-summary')).toHaveText('2 cards · 2 due today');
 await page.locator('#study-deck').selectOption('Spanish');
 await expect(page.locator('#study-front')).toHaveText('Hola'); await expect(page.locator('#study-answer')).toBeHidden();
 await page.locator('#study-reveal').click(); await expect(page.locator('#study-back')).toHaveText('Hello');
 await expect(page.locator('#study-knew')).toBeFocused();
 await page.locator('#study-again').click(); await expect(page.locator('#feedback')).toContainText('Back to box 1');
 await expect(page.locator('#study-front')).toHaveText('Hola');
 await page.locator('#study-reveal').click(); await page.locator('#study-knew').click();
 await expect(page.locator('#feedback')).toContainText('Moved to box 2');
 await expect(page.locator('#study-status')).toContainText('All caught up for today.');
 expect(await axe(page)).toEqual([]);
 await page.reload();
 await expect(page.locator('#workspace-summary')).toHaveText('2 cards · 1 due today');
 await expect(page.locator('.saved-record').filter({ hasText: 'Hola' })).toContainText('box 2');
 await page.locator('.saved-record').filter({ hasText: '2 + 2' }).getByRole('button', { name: 'Edit', exact: true }).click();
 await page.locator('#record-back').fill('Four'); await page.locator('#save-record').click();
 await expect(page.locator('#study-back')).toHaveText('Four');
 const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('clickhub:workspace:flashcards')));
 expect(saved.records.map(r => [r.title, r.box])).toEqual([['2 + 2', 1], ['Hola', 2]]);
 expect(await fitsWidth(page)).toBe(true);
});
test('new tools appear under their categories in dark theme without contrast issues', async ({ page }) => {
 await page.goto('./');
 await page.locator('#category').selectOption('Education'); await expect(page.locator('.tool-card')).toHaveCount(2);
 await page.locator('#theme').click();
 await page.locator('[data-open="flashcards"]').click(); expect(await axe(page)).toEqual([]);
 await page.locator('#close').click(); await page.locator('#category').selectOption('Data'); await page.locator('[data-open="chart-builder"]').click();
 await page.locator('#run-tool').click(); expect(await axe(page)).toEqual([]);
});
