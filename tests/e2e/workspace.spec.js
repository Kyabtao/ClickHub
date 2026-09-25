import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const definitions=[
 ['notes',{title:'My note',body:'Keep <img src=x onerror="window.bad=1"> as text'}],
 ['tasks',{title:'Read a book',due:'2026-09-25'}],
 ['habit-tracker',{title:'Daily walk'}],
 ['bookmarks',{title:'Example site',url:'https://example.com/path'}],
 ['expense-tracker',{title:'Lunch',amount:'12.34',date:'2026-09-25'}],
];
async function fill(page,values){for(const [key,value] of Object.entries(values))await page.locator(`#record-${key}`).fill(value);}
for(const [id,values] of definitions)test(`${id}: create, reload, edit, search, delete, export and restore`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`./#tool/${id}`);
 await expect(page.locator('.tool-privacy')).toContainText('Saved on this device');
 await fill(page,values);await page.locator('#save-record').click();
 await expect(page.locator('.saved-record')).toHaveCount(1);await expect(page.locator('#feedback')).toHaveText('Saved in this browser.');
 await page.reload();await expect(page.locator('.saved-record')).toHaveCount(1);
 await page.locator('.saved-record').getByRole('button',{name:'Edit',exact:true}).click();
 await page.locator('#record-title').fill('Edited title');await page.locator('#save-record').click();
 await expect(page.locator('.saved-record h3')).toHaveText('Edited title');
 await page.locator('#record-search').fill('does not exist');await expect(page.locator('.saved-record')).toHaveCount(0);
 await page.locator('#record-search').fill('');
 const downloadPromise=page.waitForEvent('download');await page.locator('#export-backup').click();const download=await downloadPromise;
 const stream=await download.createReadStream();const chunks=[];for await(const chunk of stream)chunks.push(chunk);const backup=Buffer.concat(chunks);
 expect(JSON.parse(backup.toString()).tool).toBe(id);
 page.once('dialog',d=>d.accept());await page.locator('.saved-record').getByRole('button',{name:'Delete',exact:true}).click();
 await expect(page.locator('.saved-record')).toHaveCount(0);
 await page.locator('#backup-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:backup});
 page.once('dialog',d=>d.accept());await page.locator('#import-backup').click();
 await expect(page.locator('.saved-record h3')).toHaveText('Edited title');
 expect(await page.evaluate(()=>window.bad)).toBeUndefined();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
});
test('task completion and habit dated completion survive reload',async({page})=>{
 await page.goto('./#tool/tasks');await fill(page,{title:'Done task'});await page.locator('#save-record').click();
 await page.getByRole('button',{name:'Mark complete',exact:true}).click();await page.reload();
 await expect(page.locator('#workspace-summary')).toHaveText('1 complete · 0 remaining');
 await page.getByRole('button',{name:'Mark incomplete',exact:true}).click();await expect(page.locator('#workspace-summary')).toHaveText('0 complete · 1 remaining');
 await page.locator('#close').click();await page.locator('[data-open="habit-tracker"]').click();
 await fill(page,{title:'Walk'});await page.locator('#save-record').click();await page.locator('#habit-date').fill('2026-09-25');
 await page.getByRole('button',{name:'Mark date complete',exact:true}).click();await page.reload();
 await expect(page.locator('.record-body')).toContainText('2026-09-25');
 await page.locator('#habit-date').fill('2026-09-25');await page.getByRole('button',{name:'Undo completion',exact:true}).click();
 await expect(page.locator('.record-body')).toHaveText('0 completed days');
});
test('expense currencies stay separate and bookmark links are safe',async({page})=>{
 await page.goto('./#tool/expense-tracker');await fill(page,{title:'Lunch',amount:'0.29'});await page.locator('#save-record').click();
 await fill(page,{title:'Book',amount:'2.50'});await page.locator('#record-currency').selectOption('USD');await page.locator('#save-record').click();
 await expect(page.locator('#workspace-summary')).toContainText('INR 0.29');await expect(page.locator('#workspace-summary')).toContainText('USD 2.50');
 await page.locator('#close').click();await page.locator('[data-open="bookmarks"]').click();
 await fill(page,{title:'Unsafe',url:'javascript:alert(1)'});await page.locator('#save-record').click();await expect(page.locator('.saved-record')).toHaveCount(0);
 await fill(page,{title:'Safe',url:'https://example.com'});await page.locator('#save-record').click();
 await expect(page.locator('.saved-record a')).toHaveAttribute('rel','noopener noreferrer');
});
test('invalid, wrong-tool, and cancelled imports do not destroy data',async({page})=>{
 await page.goto('./#tool/notes');await fill(page,{title:'Keep me',body:'Important'});await page.locator('#save-record').click();
 for(const contents of ['broken',JSON.stringify({version:1,tool:'tasks',records:[]}),JSON.stringify({version:1,tool:'notes',records:[{id:'bad',title:'x',body:''}]})]){
 await page.locator('#backup-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(contents)});
 await page.locator('#import-backup').click();await expect(page.locator('.saved-record h3')).toHaveText('Keep me');
 }
 await page.locator('#backup-file').setInputFiles({name:'empty.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,tool:'notes',records:[]}))});
 page.once('dialog',d=>d.dismiss());await page.locator('#import-backup').click();await expect(page.locator('.saved-record h3')).toHaveText('Keep me');
});
test('failed saves preserve form input and report storage failure',async({page})=>{
 await page.goto('./#tool/notes');await fill(page,{title:'Unsaved',body:'Keep this draft'});
 await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new Error('quota');};});
 await page.locator('#save-record').click();await expect(page.locator('#feedback')).toContainText('Not saved');
 await expect(page.locator('#record-body')).toHaveValue('Keep this draft');await expect(page.locator('.saved-record')).toHaveCount(0);
});
test('corrupt data is not overwritten and blocked storage is explicit',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('clickhub:workspace:notes','broken'));
 await page.goto('./#tool/notes');await expect(page.locator('#feedback')).toContainText('No data was overwritten');
 await expect(page.locator('#save-record')).toBeDisabled();expect(await page.evaluate(()=>localStorage.getItem('clickhub:workspace:notes'))).toBe('broken');
});
test('concurrent changes are detected before overwrite',async({page,context})=>{
 await page.goto('./#tool/notes');const other=await context.newPage();await other.goto('./#tool/notes');
 await fill(page,{title:'First tab',body:'Saved'});await page.locator('#save-record').click();
 await fill(other,{title:'Second tab',body:'Unsaved'});await other.locator('#save-record').click();
 await expect(other.locator('#feedback')).toContainText('another tab');await other.reload();await expect(other.locator('.saved-record h3')).toHaveText('First tab');
});
test('workspace accessibility and privacy copy reset across tools',async({page})=>{
 await page.goto('./#tool/notes');await fill(page,{title:'Accessible note',body:'Content'});await page.locator('#save-record').click();
 const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(results.violations).toEqual([]);
 await page.locator('#close').click();await page.locator('[data-open="json-formatter"]').click();
 await expect(page.locator('.tool-privacy')).toHaveText('Processed locally. Tool inputs are not saved.');
 await page.locator('#input').fill('{"ok":true}');await page.getByRole('button',{name:'Format JSON',exact:true}).click();
 await expect(page.locator('#result')).toHaveValue(/"ok": true/);
});
test('blocked local storage prevents pretending records were saved',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked');}}));
 await page.goto('./#tool/notes');await expect(page.locator('#feedback')).toContainText('Cannot open saved data');
 await expect(page.locator('#save-record')).toBeDisabled();
 await page.locator('#close').click();await page.locator('[data-open="unit-converter"]').click();
 await page.locator('#run-tool').click();await expect(page.locator('#result')).toHaveValue('0.001 Kilometres');
});
test('oversized import is rejected without clearing saved notes',async({page})=>{
 await page.goto('./#tool/notes');await fill(page,{title:'Keep',body:'Safe'});await page.locator('#save-record').click();
 await page.locator('#backup-file').setInputFiles({name:'large.json',mimeType:'application/json',buffer:Buffer.alloc(2*1024*1024+1,32)});
 await page.locator('#import-backup').click();await expect(page.locator('#feedback')).toContainText('2 MiB');await expect(page.locator('.saved-record h3')).toHaveText('Keep');
});
