import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument,degrees} from 'pdf-lib';
import {pageSelection,mergePDFs,selectPDF,loadPDF,fitOnPage,checkFiles} from '../../src/lib/pdf/process.js';
import {csvTable,filterSort,tableCSV} from '../../src/tools/data/csv-viewer/logic.js';
import {parseCSV} from '../../src/tools/data/csv-json/logic.js';
async function fixture(widths){const doc=await PDFDocument.create();for(const width of widths)doc.addPage([width,400]);return doc.save();}
test('page selections retain requested order and duplicates with strict limits',()=>{
 assert.deepEqual(pageSelection('3,1,2-3',3),[2,0,1,2]);assert.deepEqual(pageSelection('all',3),[0,1,2]);
 for(const s of ['', '0','4','3-1','1.5','1,','1-999999999'])assert.throws(()=>pageSelection(s,3));
 assert.throws(()=>pageSelection(Array(201).fill('1').join(','),1));
});
test('PDF merger preserves file order and page dimensions',async()=>{
 const output=await PDFDocument.load(await mergePDFs([await fixture([100,200]),await fixture([300])]));
 assert.deepEqual(output.getPages().map(p=>p.getWidth()),[100,200,300]);
 await assert.rejects(()=>mergePDFs([]));
});
test('PDF extraction duplicates/removes/reorders and rotation adds to source rotation',async()=>{
 const source=await PDFDocument.load(await fixture([100,200,300]));source.getPage(2).setRotation(degrees(90));
 const bytes=await source.save(),output=await PDFDocument.load(await selectPDF(bytes,'3,1,3',90));
 assert.deepEqual(output.getPages().map(p=>p.getWidth()),[300,100,300]);
 assert.deepEqual(output.getPages().map(p=>p.getRotation().angle),[180,90,180]);
 await assert.rejects(()=>selectPDF(bytes,'9'));await assert.rejects(()=>selectPDF(bytes,'all',45));
});
test('PDF damaged, encrypted, and oversized page-count files are rejected',async()=>{
 await assert.rejects(()=>loadPDF(new Uint8Array([1,2,3])),/Could not read/);
 const doc=await PDFDocument.create();doc.addPage();doc.context.trailerInfo.Encrypt=doc.context.obj({Filter:'Standard'});
 const encrypted=await doc.save();await assert.rejects(()=>loadPDF(encrypted),/Encrypted PDFs/);
 const many=await fixture(Array(201).fill(100));await assert.rejects(()=>loadPDF(many),/1–200 pages/);
});
test('file limits and A4 fitting are enforced',()=>{
 assert.throws(()=>checkFiles([]));assert.throws(()=>checkFiles([{name:'big.pdf',type:'application/pdf',size:26*1024*1024}]));
 assert.throws(()=>checkFiles([{name:'x.svg',type:'image/svg+xml',size:10}],true));
 const r=fitOnPage(100,200);assert.ok(r.x>=24&&r.y>=24);assert.ok(r.width<=595.28-48);assert.ok(Math.abs(r.height/r.width-2)<1e-10);
 assert.throws(()=>fitOnPage(0,1));
});
test('CSV table supports BOM, headers, strict rectangular rows and cell limits',()=>{
 assert.deepEqual(csvTable('\uFEFFname,age\nA,2'),{headers:['name','age'],rows:[['A','2']]});
 assert.equal(csvTable(',age\nA,2').headers[0],'Column 1');
 assert.throws(()=>csvTable('a,b\nx'));assert.throws(()=>csvTable(''));assert.throws(()=>csvTable(Array(101).fill('x').join(',')));
});
test('CSV filtering and sorting preserve input, stable ties, and nonnumeric cells last',()=>{
 const rows=[['A','10'],['B','2'],['C',''],['D','text'],['E','2']];
 assert.deepEqual(filterSort(rows,'',1,'asc',true).map(r=>r[0]),['B','E','A','C','D']);
 assert.deepEqual(filterSort(rows,'',1,'desc',true).map(r=>r[0]),['A','B','E','D','C']);
 assert.deepEqual(filterSort(rows,'a',-1,'asc',false),[['A','10']]);assert.equal(rows[0][0],'A');
});
test('CSV export quotes values and optionally prefixes formula-like cells',()=>{
 const rows=[['=1+1','hello,"world"'],['-3','<img>']];
 assert.deepEqual(parseCSV(tableCSV(['a','b'],rows,false)),[['a','b'],...rows]);
 assert.equal(parseCSV(tableCSV(['a','b'],rows,true))[1][0],"'=1+1");
});
