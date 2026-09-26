import test from 'node:test';
import assert from 'node:assert/strict';
import { percentage } from '../../src/tools/math-science/percentage-calculator/logic.js';
import { discount } from '../../src/tools/finance/discount-calculator/logic.js';
import { compound } from '../../src/tools/finance/compound-interest/logic.js';
import { loan } from '../../src/tools/finance/loan-calculator/logic.js';
import { bmi } from '../../src/tools/health-fitness/bmi-calculator/logic.js';
import { aspect } from '../../src/tools/design/aspect-ratio/logic.js';
import { color } from '../../src/tools/design/color-converter/logic.js';
import { hash, MAX_FILE_BYTES } from '../../src/tools/security/hash-calculator/logic.js';
import { inspectURL } from '../../src/tools/developer/url-inspector/logic.js';
import { convertBase } from '../../src/tools/developer/number-base/logic.js';
import { load, save } from '../../src/lib/storage/index.js';
import { tools } from '../../src/app/registry.js';
test('percentage operations and zero denominators', () => {
 assert.equal(percentage(20,100,'of'),20); assert.equal(percentage(25,50,'ratio'),50); assert.equal(percentage(100,120,'change'),20); assert.equal(percentage(-100,-50,'change'),50);
 assert.throws(()=>percentage(0,1,'change')); assert.throws(()=>percentage(1,0,'ratio')); assert.throws(()=>percentage('',1,'of')); assert.throws(()=>percentage(1e308,1e308,'of'));
});
test('discount applies tax after savings and rejects out-of-range rates', () => {
 assert.deepEqual(discount(100,20,10),{saved:20,subtotal:80,tax:8,total:88}); assert.equal(discount(100,100,10).total,0);
 for(const n of [-1,101,'']) assert.throws(()=>discount(100,n,0));
});
test('compound growth with zero principal, zero time, and zero rate', () => {
 assert.ok(Math.abs(compound(1000,5,10,1).total-1628.894626777442)<1e-9);
 assert.equal(compound(1000,0,10,12).total,1000); assert.equal(compound(1000,5,0,12).total,1000); assert.equal(compound(0,5,10,12).total,0);
 assert.throws(()=>compound(1000,-1,10,12)); assert.throws(()=>compound(1000,1,10,2)); assert.throws(()=>compound(1e308,100,1000,365));
});
test('loan stable formula handles no interest and tiny positive rates', () => {
 assert.equal(loan(1200,0,12).payment,100); assert.ok(Math.abs(loan(10000,6,12).payment-860.664297)<0.001); assert.ok(Math.abs(loan(1200,1e-10,12).payment-100)<1e-8);
 assert.throws(()=>loan(100,1,1.5)); assert.throws(()=>loan(100,1,0)); assert.throws(()=>loan('',1,12));
});
test('adult BMI reference thresholds and invalid dimensions', () => {
 assert.ok(Math.abs(bmi(70,175).value-22.857142857)<1e-8); assert.equal(bmi(100,200).category,'Overweight'); assert.equal(bmi(120,200).category,'Obesity range');
 assert.throws(()=>bmi(70,0)); assert.throws(()=>bmi(-1,175));
});
test('aspect reduction and scaling', () => {
 assert.deepEqual(aspect(1920,1080,1280),{ratio:'16:9',height:720}); assert.equal(aspect(100,100,30).ratio,'1:1');
 assert.throws(()=>aspect(1.5,2,10)); assert.throws(()=>aspect(0,2,10));
});
test('color converts primaries, gray, shorthand and rejects markup', () => {
 assert.deepEqual(color('#f00'),{hex:'#FF0000',rgb:'rgb(255, 0, 0)',hsl:'hsl(0, 100%, 50%)'});
 assert.equal(color('000').hsl,'hsl(0, 0%, 0%)'); assert.equal(color('fff').hsl,'hsl(0, 0%, 100%)'); assert.equal(color('#00ff00').hsl,'hsl(120, 100%, 50%)');
 for(const c of ['', '#1234', '<img>', '#zzzzzz']) assert.throws(()=>color(c));
});
test('SHA known vectors, bytes and size guard', async () => {
 assert.equal(await hash('abc','SHA-256'),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
 assert.equal(await hash(new TextEncoder().encode('abc'),'SHA-256'),await hash('abc','SHA-256'));
 assert.equal((await hash('','SHA-512')).length,128); assert.equal((await hash('','SHA-384')).length,96);
 await assert.rejects(()=>hash('abc','MD5')); await assert.rejects(()=>hash(new Uint8Array(MAX_FILE_BYTES+1),'SHA-256'));
});
test('URL parsing preserves duplicates, masks credentials, refuses non-http schemes', () => {
 const r=inspectURL('https://user:secret@example.com:8443/path?a=1&a=2#here');
 assert.deepEqual(r.query,[['a','1'],['a','2']]); assert.equal(r.credentialsPresent,true); assert.equal(r.port,'8443'); assert.ok(!JSON.stringify(r).includes('secret'));
 for(const v of ['javascript:alert(1)','/relative','garbage']) assert.throws(()=>inspectURL(v));
});
test('base conversion uses exact arbitrary-size integers', () => {
 assert.equal(convertBase('255',10,16),'FF'); assert.equal(convertBase('-ff',16,10),'-255'); assert.equal(convertBase('9007199254740993',10,10),'9007199254740993'); assert.equal(convertBase('000',2,10),'0');
 for(const v of ['2','0b11','1.1','', '1'.repeat(4097)]) assert.throws(()=>convertBase(v,2,10));
});
test('storage degrades safely when unavailable or corrupted', () => {
 const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 try {
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem(){return 'broken';},setItem(){throw new Error('full');}}});
  assert.deepEqual(load('favorites',[]),[]); assert.equal(save('favorites',[]),false);
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('blocked');}});
  assert.equal(load('theme','light'),'light'); assert.equal(save('theme','dark'),false);
 } finally { if(previous) Object.defineProperty(globalThis,'localStorage',previous); else delete globalThis.localStorage; }
});
test('registry has exactly 54 unique tools', () => {assert.equal(tools.length,54);assert.equal(new Set(tools.map(t=>t.id)).size,54);});
