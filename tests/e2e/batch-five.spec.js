import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const axe = async page => (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }));
const fitsWidth = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
test.beforeEach(async ({ page }) => { page.errors = []; page.on('pageerror', e => page.errors.push(e.message)); });
test.afterEach(async ({ page }) => { expect(page.errors).toEqual([]); });
test('text diff highlights changes and clears stale output', async ({ page }) => {
 await page.goto('./#tool/text-diff'); await page.reload();
 await page.locator('#diff-before').fill('alpha\nbeta\ngamma'); await page.locator('#diff-after').fill('alpha\nBETA\ngamma\ndelta');
 await page.locator('#run-tool').click();
 await expect(page.locator('#result')).toHaveValue('  alpha\n- beta\n+ BETA\n  gamma\n+ delta');
 await expect(page.locator('#diff-summary')).toHaveText('2 added · 1 removed · 2 unchanged lines');
 await expect(page.locator('.diff-add')).toHaveCount(2); await expect(page.locator('.diff-remove')).toHaveCount(1);
 expect(await axe(page)).toEqual([]);
 await page.locator('#diff-case').check(); await expect(page.locator('#result')).toHaveValue('');
 await page.locator('#run-tool').click(); await expect(page.locator('#diff-summary')).toHaveText('1 added · 0 removed · 3 unchanged lines');
 await page.locator('#diff-after').fill('<img src=x onerror="window.pwned=1">'); await page.locator('#run-tool').click();
 await expect(page.locator('.diff-add .diff-text')).toHaveText('<img src=x onerror="window.pwned=1">');
 expect(await page.evaluate(() => window.pwned)).toBeUndefined(); expect(await fitsWidth(page)).toBe(true);
});
test('regex tester runs in a worker, previews replacements, and stops runaway patterns', async ({ page }) => {
 await page.goto('./#tool/regex-tester');
 await page.locator('#run-tool').click();
 await expect(page.locator('#result')).toHaveValue(/^2 matches\n#1 \[8–25\] "alice@example\.com"\n   group 1: "alice"/);
 await page.locator('#regex-replace-on').check(); await page.locator('#run-tool').click();
 await expect(page.locator('#regex-replaced')).toHaveValue('Contact [alice at example] or [BOB at test]');
 await page.locator('#regex-flags').fill('gg'); await page.locator('#run-tool').click();
 await expect(page.locator('#feedback')).toHaveText('Each flag may appear only once.'); await expect(page.locator('#result')).toHaveValue('');
 await page.locator('#regex-flags').fill(''); await page.locator('#regex-pattern').fill('(a+)+$'); await page.locator('#input').fill('a'.repeat(40) + 'b');
 await page.locator('#run-tool').click();
 await expect(page.locator('#feedback')).toContainText('Stopped after 2 seconds', { timeout: 6000 });
 await expect(page.locator('#run-tool')).toBeEnabled();
 await page.locator('#regex-pattern').fill('b$'); await page.locator('#run-tool').click();
 await expect(page.locator('#result')).toHaveValue(/first match only/);
 expect(await axe(page)).toEqual([]);
});
test('markdown editor previews safely and exports HTML and .md', async ({ page }) => {
 await page.goto('./#tool/markdown-editor');
 await expect(page.locator('#markdown-preview h1')).toHaveText('Meeting notes');
 await expect(page.locator('#markdown-preview input[type=checkbox]')).toHaveCount(2);
 expect(await axe(page)).toEqual([]);
 await page.locator('#input').fill('## Hi **there**\n\n<img src=x onerror="window.pwned=1"> [x](javascript:window.pwned=2) [ok](https://example.com)');
 await expect(page.locator('#markdown-preview h2')).toHaveText('Hi there');
 await expect(page.locator('#markdown-preview img')).toHaveCount(0);
 await expect(page.locator('#markdown-preview a')).toHaveCount(1);
 await expect(page.locator('#markdown-preview a')).toHaveAttribute('rel', 'noopener noreferrer');
 await expect(page.locator('#result')).toHaveValue(/&lt;img src=x/);
 expect(await page.evaluate(() => window.pwned)).toBeUndefined();
 await expect(page.locator('#markdown-stats')).toContainText('words');
 const download = page.waitForEvent('download'); await page.locator('#download-md').click();
 expect((await download).suggestedFilename()).toBe('clickhub-note.md');
 expect(await fitsWidth(page)).toBe(true);
});
test('time zone planner compares zones and rejects DST gaps', async ({ page }) => {
 await page.goto('./#tool/time-zone-planner');
 await page.locator('#tz-date').fill('2026-09-25'); await page.locator('#tz-time').fill('23:00'); await page.locator('#tz-source').fill('Asia/Kolkata');
 await page.locator('#input').fill('America/Los_Angeles\nPacific/Kiritimati');
 await page.locator('#run-tool').click();
 await expect(page.locator('#result')).toHaveValue('UTC instant: 2026-09-25T17:30:00.000Z\nAmerica/Los_Angeles: Fri 2026-09-25 10:30 (UTC−07:00) · working hours\nPacific/Kiritimati: Sat 2026-09-26 07:30 (UTC+14:00) +1 day · outside 09:00–17:00 Mon–Fri');
 await page.locator('#tz-date').fill('2026-03-08'); await page.locator('#tz-time').fill('02:30'); await page.locator('#tz-source').fill('America/New_York');
 await page.locator('#run-tool').click(); await expect(page.locator('#feedback')).toContainText('does not exist'); await expect(page.locator('#result')).toHaveValue('');
 await page.locator('#tz-source').fill('Not/AZone'); await page.locator('#run-tool').click(); await expect(page.locator('#feedback')).toContainText('Unknown time zone');
 expect(await axe(page)).toEqual([]); expect(await fitsWidth(page)).toBe(true);
});
test('budget planner summarises sample lines and validates input', async ({ page }) => {
 await page.goto('./#tool/budget-planner');
 await page.locator('#run-tool').click();
 await expect(page.locator('#result')).toHaveValue(/Allocated: 2,940\.00 \(73\.5%\)\nUnallocated: 1,060\.00/);
 await expect(page.locator('#result')).toHaveValue(/Savings: 800\.00 \(20\.0%\) vs 20% = 800\.00 · on target/);
 await page.locator('#input').fill('Rent, lots'); await page.locator('#run-tool').click();
 await expect(page.locator('#feedback')).toContainText('Line 1 amount'); await expect(page.locator('#result')).toHaveValue('');
 expect(await axe(page)).toEqual([]);
});
test('new tools are searchable and appear in categories', async ({ page }) => {
 await page.goto('./');
 await page.locator('#category').selectOption('Travel'); await expect(page.locator('.tool-card')).toHaveCount(1); await expect(page.locator('.tool-card')).toContainText('Time Zone Planner');
 await page.locator('#category').selectOption('All categories'); await page.locator('#search').fill('regex'); await expect(page.locator('.tool-card')).toContainText('Regex Tester');
 for (const theme of ['light', 'dark']) {
  if (theme === 'dark') { await page.locator('#close').click(); await page.locator('#theme').click(); }
  await page.goto('./#tool/text-diff'); await page.locator('#diff-before').fill('a'); await page.locator('#diff-after').fill('b'); await page.locator('#run-tool').click();
  expect(await axe(page)).toEqual([]);
 }
});
