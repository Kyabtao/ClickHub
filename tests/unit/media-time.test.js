import test from 'node:test';
import assert from 'node:assert/strict';
import jsQR from 'jsqr';
import { qrMatrix } from '../../src/tools/design/qr-generator/logic.js';
import { dimensions,proportional } from '../../src/lib/images/process.js';
import { formatDuration,durationMinutes,stopwatch,countdown } from '../../src/lib/time/clock.js';
test('QR matrix decodes to original UTF-8 input at each correction level',()=>{
 for(const level of ['M','Q','H']){
 const text='https://example.com/ नमस्ते 👋',qr=qrMatrix(text,level),size=(qr.modules.size+8)*4,rgba=new Uint8ClampedArray(size*size*4).fill(255);
 for(let y=0;y<qr.modules.size;y++)for(let x=0;x<qr.modules.size;x++)if(qr.modules.get(y,x))for(let dy=0;dy<4;dy++)for(let dx=0;dx<4;dx++){
 const i=(((y+4)*4+dy)*size+(x+4)*4+dx)*4;rgba[i]=rgba[i+1]=rgba[i+2]=0;
 }
 assert.equal(jsQR(rgba,size,size).data,text);
 }
});
test('QR rejects blank, oversized UTF-8, and invalid correction levels',()=>{
 assert.throws(()=>qrMatrix(' ','M'));assert.throws(()=>qrMatrix('👋'.repeat(300),'M'));assert.throws(()=>qrMatrix('hello','X'));
});
test('image dimensions and proportional resizing enforce bounds',()=>{
 assert.deepEqual(proportional(1920,1080,1280,'width'),{width:1280,height:720});
 assert.deepEqual(proportional(1920,1080,720,'height'),{width:1280,height:720});
 assert.deepEqual(dimensions('640','480'),{width:640,height:480});
 for(const [w,h] of [[0,1],[1.5,1],[8193,1],[5000,5000],['',1]])assert.throws(()=>dimensions(w,h));
});
test('stopwatch pause/resume/laps can use monotonic elapsed time',()=>{
 let now=0;const clock=stopwatch(()=>now);clock.start();now=1250;assert.equal(clock.value(),1250);clock.start();now=2000;assert.equal(clock.value(),2000);
 clock.pause();now=9000;assert.equal(clock.value(),2000);clock.start();now=10000;assert.equal(clock.value(),3000);clock.reset();assert.equal(clock.value(),0);assert.equal(clock.running,false);
});
test('countdown uses deadlines and clamps to zero after skipped ticks',()=>{
 let now=0;const clock=countdown(60000,()=>now);clock.start();now=10000;clock.pause();assert.equal(clock.value(),50000);
 now=40000;assert.equal(clock.value(),50000);clock.start();now=90001;assert.equal(clock.value(),0);clock.pause();clock.start();assert.equal(clock.running,false);
 clock.reset(300000);assert.equal(clock.value(),300000);
});
test('timer duration validation and readable formatting',()=>{
 assert.equal(durationMinutes('25'),1500000);for(const v of ['',0,181,1.5,Infinity])assert.throws(()=>durationMinutes(v));
 assert.equal(formatDuration(1500000),'25:00');assert.equal(formatDuration(3723120,true),'01:02:03.12');assert.equal(formatDuration(-1,true),'00:00.00');
});
