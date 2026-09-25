import { test,expect } from '@playwright/test';
import jsQR from 'jsqr';
import AxeBuilder from '@axe-core/playwright';
async function fixture(page){
 const data=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=40;canvas.height=20;const ctx=canvas.getContext('2d');ctx.fillStyle='red';ctx.fillRect(0,0,20,20);return canvas.toDataURL('image/png').split(',')[1];});
 return {name:'test.png',mimeType:'image/png',buffer:Buffer.from(data,'base64')};
}
async function downloadBytes(page,selector){const pending=page.waitForEvent('download');await page.locator(selector).click();const download=await pending,stream=await download.createReadStream(),chunks=[];for await(const c of stream)chunks.push(c);return Buffer.concat(chunks);}
test('QR preview decodes correctly and downloaded PNG is valid',async({page})=>{
 await page.goto('./#tool/qr-generator');const requests=[];page.on('request',r=>requests.push(r.url()));
 const text='https://example.com/ नमस्ते 👋';await page.locator('#qr-input').fill(text);await page.locator('#generate-qr').click();
 const pixels=await page.locator('#qr-preview canvas').evaluate(canvas=>({width:canvas.width,height:canvas.height,data:Array.from(canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data)}));
 expect(jsQR(new Uint8ClampedArray(pixels.data),pixels.width,pixels.height).data).toBe(text);
 const bytes=await downloadBytes(page,'#download-qr');expect(bytes.subarray(1,4).toString()).toBe('PNG');expect(bytes.readUInt32BE(16)).toBe(pixels.width);
 expect(requests).toEqual([]);
 await page.locator('#qr-input').fill('');await expect(page.locator('#download-qr')).toBeHidden();await page.locator('#generate-qr').click();await expect(page.locator('#feedback')).toContainText('Enter text');
});
test('resizer locks aspect ratio, exports exact dimensions and clears stale download',async({page})=>{
 await page.goto('./#tool/image-resizer');const file=await fixture(page);await page.locator('#image-file').setInputFiles(file);
 await expect(page.locator('#image-info')).toHaveText('Source: 40 × 20 pixels');
 await page.locator('#image-width').fill('20');await expect(page.locator('#image-height')).toHaveValue('10');
 await page.locator('#process-image').click();await expect(page.locator('#download-image')).toBeVisible();
 const bytes=await downloadBytes(page,'#download-image');expect(bytes.readUInt32BE(16)).toBe(20);expect(bytes.readUInt32BE(20)).toBe(10);
 await page.locator('#image-lock').uncheck();await page.locator('#image-height').fill('7');await expect(page.locator('#download-image')).toBeHidden();
 await page.locator('#process-image').click();await expect(page.locator('#feedback')).toContainText('20 × 7');
 await page.locator('#image-width').fill('0');await page.locator('#process-image').click();await expect(page.locator('#feedback')).toContainText('whole dimensions');await expect(page.locator('#download-image')).toBeHidden();
});
test('converter produces PNG, JPEG and WebP locally and flattens JPEG alpha',async({page})=>{
 await page.goto('./#tool/image-converter');const file=await fixture(page);await page.locator('#image-file').setInputFiles(file);await expect(page.locator('#process-image')).toBeEnabled();
 const requests=[];page.on('request',r=>requests.push(r.url()));
 for(const format of ['image/png','image/jpeg','image/webp']){
  await page.locator('#image-format').selectOption(format);await page.locator('#process-image').click();await expect(page.locator('#download-image')).toBeVisible();
  const bytes=await downloadBytes(page,'#download-image');
  if(format==='image/png')expect(bytes.subarray(1,4).toString()).toBe('PNG');
  if(format==='image/jpeg'){expect(bytes.subarray(0,2).toString('hex')).toBe('ffd8');const pixel=await page.locator('#image-preview canvas').evaluate(c=>Array.from(c.getContext('2d').getImageData(30,10,1,1).data));expect(pixel).toEqual([255,255,255,255]);}
  if(format==='image/webp')expect(bytes.subarray(8,12).toString()).toBe('WEBP');
 }
 expect(requests).toEqual([]);
});
test('bad and oversized images cannot leave an old downloadable result',async({page})=>{
 await page.goto('./#tool/image-resizer');await page.locator('#image-file').setInputFiles(await fixture(page));await expect(page.locator('#process-image')).toBeEnabled();await page.locator('#process-image').click();await expect(page.locator('#download-image')).toBeVisible();
 await page.locator('#image-file').setInputFiles({name:'bad.png',mimeType:'image/png',buffer:Buffer.from('not an image')});await expect(page.locator('#feedback')).toContainText('could not be decoded');await expect(page.locator('#download-image')).toBeHidden();
 await page.locator('#image-file').setInputFiles({name:'big.png',mimeType:'image/png',buffer:Buffer.alloc(10*1024*1024+1)});await expect(page.locator('#feedback')).toContainText('10 MiB');await expect(page.locator('#process-image')).toBeDisabled();
});
async function freeze(page){await page.clock.install({time:new Date('2026-09-25T12:00:00Z')});await page.clock.pauseAt(new Date('2026-09-25T12:00:01Z'));}
test('stopwatch starts, pauses, resumes, records laps, resets and cleans up on close',async({page})=>{
 await freeze(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('./#tool/stopwatch');
 await page.locator('#stopwatch-start').click();await page.clock.fastForward(12340);await expect(page.locator('#stopwatch-display')).toHaveText('00:12.34');
 await page.locator('#stopwatch-lap').click();await expect(page.locator('#stopwatch-laps')).toContainText('Lap 1: 00:12.34');
 await page.locator('#stopwatch-pause').click();await page.clock.fastForward(5000);await expect(page.locator('#stopwatch-display')).toHaveText('00:12.34');
 await page.locator('#stopwatch-start').click();await page.clock.fastForward(1000);await expect(page.locator('#stopwatch-display')).toHaveText('00:13.34');
 await page.locator('#stopwatch-reset').click();await expect(page.locator('#stopwatch-display')).toHaveText('00:00.00');await expect(page.locator('#stopwatch-laps li')).toHaveCount(0);
 await page.locator('#stopwatch-start').click();await page.locator('#close').click();await page.locator('[data-open="json-formatter"]').click();await page.clock.fastForward(10000);expect(errors).toEqual([]);
});
test('Pomodoro completes on time, pauses, switches mode, resets and validates duration',async({page})=>{
 await freeze(page);await page.goto('./#tool/pomodoro');await page.locator('#focus-minutes').fill('1');await page.locator('#pomodoro-start').click();await page.clock.fastForward(10000);await expect(page.locator('#pomodoro-display')).toHaveText('00:50');
 await page.locator('#pomodoro-pause').click();await page.clock.fastForward(5000);await expect(page.locator('#pomodoro-display')).toHaveText('00:50');
 await page.locator('#pomodoro-start').click();await page.clock.fastForward(50000);await expect(page.locator('#pomodoro-display')).toHaveText('00:00');await expect(page.locator('#feedback')).toContainText('Focus session complete');
 await page.locator('#timer-mode').selectOption('break');await expect(page.locator('#pomodoro-display')).toHaveText('05:00');await page.locator('#pomodoro-start').click();await page.clock.fastForward(1000);await page.locator('#pomodoro-reset').click();await expect(page.locator('#pomodoro-display')).toHaveText('05:00');
 await page.locator('#break-minutes').fill('0');await page.locator('#pomodoro-reset').click();await expect(page.locator('#feedback')).toContainText('1 to 180');await expect(page.locator('#pomodoro-start')).toBeDisabled();
});
test('QR, image and timer dialogs pass automated accessibility checks',async({page})=>{
 for(const id of ['qr-generator','image-resizer','pomodoro','stopwatch']){
  await page.goto(`./#tool/${id}`);const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations).toEqual([]);
 }
});
