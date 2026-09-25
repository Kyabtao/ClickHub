import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore, parseBackup, validateBackup, localToday } from '../../src/lib/storage/workspace.js';
import { config as notes } from '../../src/tools/productivity/notes/view.js';
import { validate as task } from '../../src/tools/productivity/tasks/logic.js';
import { validate as habit, toggleDay } from '../../src/tools/productivity/habit-tracker/logic.js';
import { validate as bookmark } from '../../src/tools/productivity/bookmarks/logic.js';
import { validate as expense, parseAmount, totals } from '../../src/tools/finance/expense-tracker/logic.js';
const record={id:'a',title:'First',body:'Hello'};
function memory(){const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};}
test('workspace persists, exports, reloads and returns defensive copies',()=>{
 const storage=memory(),store=createStore(notes,storage);store.replace([record]);
 assert.deepEqual(createStore(notes,storage).records,[record]);
 assert.deepEqual(parseBackup(store.export(),notes).records,[record]);
 const copy=store.records;copy[0].title='changed';assert.equal(store.records[0].title,'First');
});
test('workspace rejects invalid backups without overwriting saved records',()=>{
 const store=createStore(notes,memory());store.replace([record]);
 assert.throws(()=>store.replace([record,record]));assert.deepEqual(store.records,[record]);
 assert.throws(()=>validateBackup({version:2,tool:'notes',records:[]},notes));
 assert.throws(()=>parseBackup('{"version":1,"tool":"tasks","records":[]}',notes));
 assert.throws(()=>store.replace([{...record,body:''}]));
 assert.throws(()=>store.replace(Array.from({length:501},(_,i)=>({...record,id:String(i)}))));
});
test('corrupt storage never silently resets',()=>{
 const storage=memory();storage.setItem('clickhub:workspace:notes','broken');
 assert.throws(()=>createStore(notes,storage));assert.equal(storage.getItem('clickhub:workspace:notes'),'broken');
});
test('storage failure preserves previous records and unsaved transaction is rejected',()=>{
 const storage=memory(),store=createStore(notes,storage);store.replace([record]);
 storage.setItem=()=>{throw new Error('quota');};assert.throws(()=>store.replace([]),/Not saved/);assert.deepEqual(store.records,[record]);
});
test('conflicting tabs cannot silently replace known newer data',()=>{
 const storage=memory(),a=createStore(notes,storage),b=createStore(notes,storage);
 a.replace([record]);assert.throws(()=>b.replace([]),/another tab/);assert.deepEqual(createStore(notes,storage).records,[record]);
});
test('tasks require booleans and valid optional dates',()=>{
 assert.deepEqual(task({title:'Read',due:'',done:false}),{title:'Read',due:'',done:false});
 assert.throws(()=>task({title:'Read',due:'2026-02-30',done:false}));assert.throws(()=>task({title:'Read',due:'',done:'false'}));
});
test('habits toggle dates without duplicates and preserve historical dates',()=>{
 const r={title:'Walk',days:[]};const marked=toggleDay(r,'2026-09-25');assert.deepEqual(marked.days,['2026-09-25']);
 assert.deepEqual(toggleDay(marked,'2026-09-25').days,[]);
 assert.throws(()=>habit({title:'Walk',days:['2026-09-25','2026-09-25']}));
 assert.throws(()=>toggleDay(r,''));
 assert.equal(localToday(new Date(2026,8,25,23,59)),'2026-09-25');
});
test('bookmarks reject unsafe schemes and credentials',()=>{
 assert.equal(bookmark({title:'Site',url:'https://example.com'}).url,'https://example.com/');
 for(const url of ['javascript:alert(1)','data:text/html,hello','https://user:pass@example.com','/relative'])assert.throws(()=>bookmark({title:'Bad',url}));
});
test('expense amounts use integer cents and separate currency totals',()=>{
 assert.equal(parseAmount('0.29'),29);assert.equal(parseAmount('1.2'),120);
 for(const amount of ['0','-1','1.001','1e3','Infinity',''])assert.throws(()=>parseAmount(amount));
 const base={title:'Lunch',date:'2026-09-25',cents:29,currency:'INR'};
 assert.deepEqual(expense(base),base);assert.throws(()=>expense({...base,cents:1.5}));assert.throws(()=>expense({...base,currency:'BAD'}));
 assert.deepEqual(totals([base,base,{...base,currency:'USD',cents:100}]),{INR:58,USD:100});
});
test('oversized backups are rejected before parsing or writing',()=>{
 assert.throws(()=>parseBackup(' '.repeat(2*1024*1024+1),notes),/2 MiB/);
 const store=createStore(notes,memory());
 const records=Array.from({length:110},(_,index)=>({id:String(index),title:'Large',body:'x'.repeat(20000)}));
 assert.throws(()=>store.replace(records),/2 MiB/);assert.deepEqual(store.records,[]);
});
