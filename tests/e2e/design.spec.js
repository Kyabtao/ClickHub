import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { tools } from '../../src/app/registry.js';
const categories = [...new Set(tools.map(t => t.category))];
const axe = async page => (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }));
test('home groups tools by category with jump links, and filters switch to a flat list', async ({ page }) => {
 await page.goto('./');
 await expect(page.locator('.tool-group')).toHaveCount(categories.length);
 await expect(page.locator('.group-title').first()).toContainText(`${categories[0]} ${tools.filter(t => t.category === categories[0]).length}`);
 await expect(page.locator('#category-jump button')).toHaveCount(categories.length);
 await expect(page.locator('.hero-stats')).toContainText(`${tools.length}`);
 await expect(page.locator('.hero-stats')).toContainText(`${categories.length}`);
 // Jumping moves focus to the category heading.
 await page.locator('#category-jump').getByRole('button', { name: /^Education/ }).click();
 await expect(page.locator('#group-education')).toBeFocused();
 await expect(page.locator('#group-education')).toBeInViewport();
 // Headings no longer sit inside buttons; the button's name is just the tool name.
 await expect(page.getByRole('button', { name: 'Flashcards', exact: true })).toHaveCount(1);
 await expect(page.getByRole('heading', { level: 4, name: 'Flashcards' })).toHaveCount(1);
 // Icons are escaped text: the Encoding Converter icon "</>" is visible, not parsed as markup.
 await expect(page.locator('.tool-card').filter({ hasText: 'Encoding Converter' }).locator('.tool-icon')).toHaveText('</>');
 // Search, category filter, and favorites show a flat list without group headings.
 await page.locator('#search').fill('pdf');
 await expect(page.locator('.tool-group')).toHaveCount(0); await expect(page.locator('#category-jump')).toBeHidden();
 await expect(page.locator('.tool-card .card-category').first()).toBeVisible();
 await page.locator('#search').fill('');
 await expect(page.locator('.tool-group')).toHaveCount(categories.length);
 await page.locator('#category').selectOption('Finance'); await expect(page.locator('.tool-group')).toHaveCount(0);
 await page.locator('#category').selectOption('All categories');
 // Whole card is clickable (stretched button), and the dialog shows the tool icon.
 const card = page.locator('.tool-card').filter({ hasText: 'JSON Formatter' });
 const box = await card.boundingBox(); await page.mouse.click(box.x + box.width / 2, box.y + box.height - 8);
 await expect(page.locator('#tool-title')).toHaveText('JSON Formatter');
 await expect(page.locator('#tool-icon')).toHaveText('{ }');
 await expect(page.getByRole('button', { name: 'Format JSON', exact: true })).toHaveClass(/primary/);
 await page.locator('#close').click();
 // Favorite still works from a card and keeps focus on its star.
 await page.getByRole('button', { name: 'Favorite UUID Generator', exact: true }).click();
 await expect(page.getByRole('button', { name: 'Favorite UUID Generator', exact: true })).toBeFocused();
 await expect(page.getByRole('button', { name: 'Favorite UUID Generator', exact: true })).toHaveAttribute('aria-pressed', 'true');
 for (const theme of ['light', 'dark']) {
  if (theme === 'dark') await page.locator('#theme').click();
  expect(await axe(page)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 }
});
