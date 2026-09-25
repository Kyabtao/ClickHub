import { test, expect } from '@playwright/test';
const examples = [
 ['percentage-calculator', '20'], ['discount-calculator','total: 80'],
 ['compound-interest','total: 1,628.89462678'], ['loan-calculator','payment: 860.66429707'],
 ['bmi-calculator','Normal range'], ['aspect-ratio','Ratio: 16:9'],
 ['color-converter','#4A90E2'], ['url-inspector','example.com'], ['number-base','FF'],
];
for (const [id,expected] of examples) test(`${id} computes and clears stale output`, async ({page}) => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`./#tool/${id}`);
 await page.locator('#run-tool').click();
 await expect(page.locator('#result')).toHaveValue(new RegExp(expected));
 const input=page.locator('#tool-content input').first();
 await input.fill('');
 await expect(page.locator('#result')).toHaveValue('');
 await page.locator('#run-tool').click();
 await expect(page.locator('#result')).toHaveValue('');
 await expect(page.locator('#feedback')).not.toHaveText('Result ready.');
 expect(errors).toEqual([]);
});
test('hashes UTF-8 text and local file without network uploads',async({page})=>{
 await page.goto('./#tool/hash-calculator');
 const requests=[];page.on('request',r=>requests.push(r.url()));
 await page.locator('#text').fill('abc');
 await page.locator('#run-tool').click();
 const expected='ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
 await expect(page.locator('#result')).toHaveValue(expected);
 await page.locator('#mode').selectOption('file');
 await page.locator('#file').setInputFiles({name:'example.txt',mimeType:'text/plain',buffer:Buffer.from('abc')});
 await page.locator('#run-tool').click();
 await expect(page.locator('#result')).toHaveValue(expected);
 expect(requests).toEqual([]);
});
test('invalid routes, keyboard focus, JSON errors and password errors',async({page})=>{
 await page.goto('./#tool/not-a-tool');
 await expect(page.locator('#app-notice')).toContainText('not found');
 await page.locator('[data-open="json-formatter"]').click();
 await page.locator('#input').fill('{"a":1}');
 await page.getByRole('button',{name:'Format JSON',exact:true}).click();
 await expect(page.locator('#result')).not.toHaveValue('');
 await page.locator('#input').fill('{');
 await expect(page.locator('#result')).toHaveValue('');
 await page.getByRole('button',{name:'Format JSON',exact:true}).click();
 await expect(page.locator('#feedback')).toContainText('Invalid JSON');
 await page.keyboard.press('Escape');
 await expect(page.locator('[data-open="json-formatter"]')).toBeFocused();
 await page.locator('[data-open="password-generator"]').click();
 await page.locator('#length').fill('1');
 await page.locator('#generate').click();
 await expect(page.locator('#result')).toHaveValue('');
 await expect(page.locator('#feedback')).toContainText('8 and 128');
});
test('blocked storage shows warning without breaking navigation',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked');}});});
 await page.goto('./');
 await page.locator('[data-favorite="unit-converter"]').click();
 await expect(page.locator('#app-notice')).toContainText('storage is unavailable');
 await page.locator('[data-view="Favorites"]').click();
 await expect(page.locator('.tool-card')).toHaveCount(1);
});
test('category filters, recent list, back navigation and inert user text',async({page})=>{
 await page.goto('./');
 await page.locator('#category').selectOption('Finance');
 await expect(page.locator('.tool-card')).toHaveCount(5);
 await page.locator('#category').selectOption('All categories');
 await page.locator('[data-open="text-workbench"]').click();
 await page.locator('#input').fill('<img src=x onerror="window.bad=true">');
 await page.getByRole('button',{name:'UPPERCASE',exact:true}).click();
 expect(await page.evaluate(()=>window.bad)).toBeUndefined();
 await page.goBack();
 await expect(page.locator('dialog')).not.toBeVisible();
 await page.locator('[data-view="Recently used"]').click();
 await expect(page.locator('.tool-card')).toHaveCount(1);
 await expect(page.locator('.tool-card')).toContainText('Text Workbench');
});
