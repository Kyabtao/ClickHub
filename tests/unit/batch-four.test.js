import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCSV, convertCSV } from '../../src/tools/data/csv-json/logic.js';
import { inspectJWT } from '../../src/tools/developer/jwt-inspector/logic.js';
import { slug } from '../../src/tools/seo-marketing/slug-generator/logic.js';
import { contrast } from '../../src/tools/accessibility/contrast-checker/logic.js';
import { dateDifference } from '../../src/tools/productivity/date-difference/logic.js';
import { statistics } from '../../src/tools/data/statistics-calculator/logic.js';
import { resistor } from '../../src/tools/math-science/resistor-calculator/logic.js';
import { splitBill } from '../../src/tools/finance/bill-splitter/logic.js';
import { scaleRecipe } from '../../src/tools/home-lifestyle/recipe-scaler/logic.js';
import { morse } from '../../src/tools/language/morse-translator/logic.js';
test('CSV round trips quotes, blank fields, multiline data, and CRLF',()=>{
 const rows=[['name','note'],['a,b','hello\nworld'],['"quoted"',''],['','']];
 assert.deepEqual(parseCSV(convertCSV(JSON.stringify(rows),'csv')),rows);
 assert.deepEqual(parseCSV('a,b\r\n1,2\r\n'),[['a','b'],['1','2']]);
 assert.deepEqual(parseCSV('a,'),[['a','']]); assert.deepEqual(parseCSV('""'),[['']]);
 assert.deepEqual(parseCSV(''),[]);
 for(const input of ['"unclosed','"closed"x','bad"quote'])assert.throws(()=>parseCSV(input));
 assert.throws(()=>convertCSV('[{}]','csv')); assert.throws(()=>convertCSV('[[]]','csv'));
});
test('JWT is decoded but explicitly not verified',()=>{
 const encode=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
 const result=inspectJWT(`${encode({alg:'none'})}.${encode({name:'नमस्ते'})}.`);
 assert.equal(result.payload.name,'नमस्ते');assert.match(result.warning,/NOT VERIFIED/);assert.equal(result.signaturePresent,false);
 assert.throws(()=>inspectJWT('one.two'));assert.throws(()=>inspectJWT('!.!.signature'));
 assert.throws(()=>inspectJWT(`${encode([])}.${encode({})}.`));
});
test('slug handles accents, separators, and Unicode modes',()=>{
 assert.equal(slug(' Crème brûlée & Tea! ','ascii'),'creme-brulee-tea');
 assert.equal(slug('東京旅行','unicode'),'東京旅行');assert.equal(slug('東京旅行','ascii'),'');
 assert.equal(slug('---','ascii'),'');
});
test('contrast uses exact thresholds and symmetric ratios',()=>{
 assert.equal(contrast('#000','#fff').ratio,21);assert.equal(contrast('#fff','#000').ratio,21);
 assert.equal(contrast('#fff','#fff').aaLarge,false);assert.equal(contrast('#777','#fff').aaNormal,false);
 assert.equal(contrast('#000','#fff').aaaNormal,true);assert.throws(()=>contrast('bad color','#fff'));
});
test('calendar day differences include leap days but not DST shifts',()=>{
 assert.equal(dateDifference('2024-02-28','2024-03-01','no').days,2);
 assert.equal(dateDifference('2026-03-08','2026-03-09','no').days,1);
 assert.equal(dateDifference('2026-01-01','2026-01-01','yes').days,1);
 assert.throws(()=>dateDifference('2026-02-30','2026-03-01','no'));
 assert.throws(()=>dateDifference('2026-01-02','2026-01-01','no'));
});
test('statistics calculates sample and population variance and rejects invalid data',()=>{
 const r=statistics('1, 2; 3 4','population');assert.equal(r.mean,2.5);assert.equal(r.median,2.5);assert.equal(r.variance,1.25);
 assert.equal(statistics('2 2 2','sample').variance,0);assert.equal(statistics('1 2 3','sample').variance,1);
 assert.equal(statistics('-3 -1 -2','population').median,-2);
 for(const v of ['', 'abc','1,','1e999'])assert.throws(()=>statistics(v,'population'));
 assert.throws(()=>statistics('1','sample'));
});
test('four-band resistor supports fractional multipliers and tolerance',()=>{
 assert.deepEqual(resistor('Brown','Black','Red','Gold'),{ohms:1000,tolerance:5,min:950,max:1050});
 assert.equal(resistor('Red','Red','Gold','Silver').ohms,2.2);
 assert.throws(()=>resistor('Black','Red','Gold','Silver'));
});
test('bill shares add to total cents',()=>{
 for(const people of [1,3,7,1000]){
 const r=splitBill(100,10,people);
 const sum=Math.round(r.baseShare*100)*r.peoplePayingBase+Math.round(r.higherShare*100)*r.peoplePayingExtraCent;
 assert.equal(sum,Math.round(r.total*100));
 }
 assert.equal(splitBill(0,0,3).total,0);assert.throws(()=>splitBill(1,0,0));assert.throws(()=>splitBill(1,0,1.5));
});
test('recipes preserve labels and reject fractions and invalid servings',()=>{
 assert.deepEqual(scaleRecipe('200 g flour\n0.5 tsp salt',2,4),[{quantity:400,ingredient:'g flour'},{quantity:1,ingredient:'tsp salt'}]);
 assert.throws(()=>scaleRecipe('1/2 cup sugar',2,4));assert.throws(()=>scaleRecipe('1 g sugar',0,4));assert.throws(()=>scaleRecipe('',2,4));
});
test('Morse round trips supported alphabet with normalized case and spaces',()=>{
 assert.equal(morse('SOS 123','encode'),'... --- ... / .---- ..--- ...--');
 assert.equal(morse(morse('Hello world 09','encode'),'decode'),'HELLO WORLD 09');
 assert.throws(()=>morse('Hi!','encode'));assert.throws(()=>morse('.......','decode'));assert.equal(morse('','encode'),'');
});
