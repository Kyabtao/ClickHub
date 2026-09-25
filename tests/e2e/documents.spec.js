import {test,expect} from '@playwright/test';
import {PDFDocument} from 'pdf-lib';
import AxeBuilder from '@axe-core/playwright';
async function pdfFile(name,widths){const pdf=await PDFDocument.create();for(const width of widths)pdf.addPage([width,400]);return {name,mimeType:'application/pdf',buffer:Buffer.from(await pdf.save())};}
async function download(page,selector){const pending=page.waitForEvent('download');await page.locator(selector).click();const stream=await(await pending).createReadStream(),chunks=[];for await(const c of stream)chunks.push(c);return Buffer.concat(chunks);}
test('PDF merger reorders files and downloads a readable three-page document',async({page})=>{
 await page.goto('./#tool/pdf-merger');await page.locator('#document-files').setInputFiles([await pdfFile('first.pdf',[100,200]),await pdfFile('second.pdf',[300])]);
 await page.getByRole('button',{name:'Move up: second.pdf',exact:true}).click();await page.locator('#build-pdf').click();await expect(page.locator('#download-pdf')).toBeVisible();
 const bytes=await download(page,'#download-pdf'),pdf=await PDFDocument.load(bytes);expect(pdf.getPages().map(p=>p.getWidth())).toEqual([300,100,200]);
 await page.locator('#document-files').setInputFiles([]);await expect(page.locator('#download-pdf')).toBeHidden();await page.locator('#build-pdf').click();await expect(page.locator('#feedback')).toContainText('Choose 1–20');
});
for(const [id,rotation] of [['pdf-extractor',0],['pdf-organizer',90]])test(`${id} preserves selected order and validates page ranges`,async({page})=>{
 await page.goto(`./#tool/${id}`);await page.locator('#document-files').setInputFiles(await pdfFile('source.pdf',[100,200,300]));await page.locator('#page-selection').fill('3,1');
 if(rotation)await page.locator('#page-rotation').selectOption(String(rotation));await page.locator('#build-pdf').click();await expect(page.locator('#download-pdf')).toBeVisible();
 const pdf=await PDFDocument.load(await download(page,'#download-pdf'));expect(pdf.getPages().map(p=>p.getWidth())).toEqual([300,100]);expect(pdf.getPages().map(p=>p.getRotation().angle)).toEqual([rotation,rotation]);
 await page.locator('#page-selection').fill('9');await expect(page.locator('#download-pdf')).toBeHidden();await page.locator('#build-pdf').click();await expect(page.locator('#feedback')).toContainText('between 1 and 3');await expect(page.locator('#download-pdf')).toBeHidden();
});
test('images to PDF exports A4 pages with embedded image content',async({page})=>{
 await page.goto('./#tool/images-to-pdf');const data=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=20;c.height=10;c.getContext('2d').fillRect(0,0,20,10);return c.toDataURL('image/png').split(',')[1];});
 await page.locator('#document-files').setInputFiles([{name:'one.png',mimeType:'image/png',buffer:Buffer.from(data,'base64')},{name:'two.png',mimeType:'image/png',buffer:Buffer.from(data,'base64')}]);
 await page.locator('#page-layout').selectOption('landscape');await page.locator('#build-pdf').click();await expect(page.locator('#download-pdf')).toBeVisible();
 const pdf=await PDFDocument.load(await download(page,'#download-pdf'));expect(pdf.getPageCount()).toBe(2);expect(pdf.getPage(0).getWidth()).toBeCloseTo(841.89,2);expect(pdf.getPage(0).getHeight()).toBeCloseTo(595.28,2);expect(pdf.getPage(0).node.Contents()).toBeTruthy();
});
test('corrupt and oversized PDF inputs fail without a download',async({page})=>{
 await page.goto('./#tool/pdf-merger');await page.locator('#document-files').setInputFiles({name:'bad.pdf',mimeType:'application/pdf',buffer:Buffer.from('bad PDF')});await page.locator('#build-pdf').click();await expect(page.locator('#feedback')).toContainText('Could not read');await expect(page.locator('#download-pdf')).toBeHidden();
 await page.locator('#document-files').setInputFiles({name:'large.pdf',mimeType:'application/pdf',buffer:Buffer.alloc(25*1024*1024+1)});await page.locator('#build-pdf').click();await expect(page.locator('#feedback')).toContainText('25 MiB');
});
test('CSV viewer paginates, sorts numerically, filters, exports safely and treats markup as text',async({page})=>{
 await page.goto('./#tool/csv-viewer');const csv='name,value\n'+Array.from({length:55},(_,i)=>`item${i},${55-i}`).join('\n')+'\n=1+1,<img src=x onerror="window.bad=1">';
 // Quote the markup field properly for CSV.
 const text=csv.replace('<img src=x onerror="window.bad=1">','"<img src=x onerror=""window.bad=1"">"');
 await page.locator('#table-input').fill(text);await page.locator('#load-table').click();await expect(page.locator('#table-view tbody tr')).toHaveCount(50);
 await page.locator('#next-page').click();await expect(page.locator('#table-view tbody tr')).toHaveCount(6);expect(await page.evaluate(()=>window.bad)).toBeUndefined();
 await page.locator('#table-sort').selectOption('1');await page.locator('#table-numeric').check();await expect(page.locator('#table-view tbody tr').first()).toContainText('item54');
 await page.locator('#table-filter').fill('=1+1');await expect(page.locator('#table-view tbody tr')).toHaveCount(1);
 const bytes=await download(page,'#export-table');expect(bytes.toString()).toContain("'=1+1");expect(bytes.toString()).not.toContain('item54');
 await page.locator('#table-input').fill('a,b\nx');await expect(page.locator('#table-controls')).toBeHidden();await page.locator('#load-table').click();await expect(page.locator('#feedback')).toContainText('same number');
});
test('CSV file loading and document dialogs pass automated accessibility checks',async({page})=>{
 await page.goto('./#tool/csv-viewer');await page.locator('#table-file').setInputFiles({name:'data.csv',mimeType:'text/csv',buffer:Buffer.from('name,value\na,2\nb,1')});await expect(page.locator('#table-view tbody tr')).toHaveCount(2);
 for(const id of ['csv-viewer','pdf-organizer','images-to-pdf']){if(id!=='csv-viewer')await page.goto(`./#tool/${id}`);const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});
