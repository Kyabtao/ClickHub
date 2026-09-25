import { createStore, parseBackup, MAX_BACKUP_BYTES, localToday } from '../../lib/storage/workspace.js';
export function mountCollection(container, feedback, config) {
 let active=true,editing=null,store;
 container.innerHTML=`<p class="workspace-warning">Saved only in this browser, not encrypted or synced. Export backups regularly. Unsaved form edits are discarded when you close this tool.</p><div class="actions"><button id="export-backup">Export JSON backup</button><button id="import-backup">Replace from backup…</button></div><label class="field-label" for="backup-file">Backup JSON file (up to 2 MiB)</label><input id="backup-file" type="file" accept=".json,application/json"><p id="workspace-summary" role="status"></p><form id="record-form"><div id="record-fields"></div><div class="actions"><button id="save-record" class="primary" type="submit">Add record</button><button id="cancel-edit" type="button" hidden>Cancel edit</button></div></form><label class="field-label" for="record-search">Search saved records</label><input id="record-search" type="search"><div id="record-list"></div>`;
 const $=selector=>container.querySelector(selector);
 function message(text){if(active)feedback.textContent=text;}
 function fail(error){message(error.message||String(error));}
 try {store=createStore(config);}catch(error){
  message(`Cannot open saved data: ${error.message}. No data was overwritten. Check browser storage permissions or recover the saved JSON before making changes.`);
  container.querySelectorAll('button,input').forEach(el=>el.disabled=true);
  return ()=>{active=false;};
 }
 const fields=$('#record-fields');
 for(const field of config.fields){
  const label=document.createElement('label');label.className='field-label';label.htmlFor=`record-${field.id}`;label.textContent=field.label;
  const input=document.createElement(field.type==='textarea'?'textarea':field.options?'select':'input');input.id=`record-${field.id}`;
  if(input.tagName==='INPUT')input.type=field.type||'text';
  if(field.options)for(const value of field.options){const option=document.createElement('option');option.value=value;option.textContent=value;input.append(option);}
  if(field.max)input.maxLength=field.max;
  if(field.step)input.step=field.step;
  if(!field.optional)input.required=true;
  fields.append(label,input);
 }
 let selectedDate=localToday();
 if(config.toggleDay){
  const label=document.createElement('label');label.className='field-label';label.htmlFor='habit-date';label.textContent='Completion date';
  const input=document.createElement('input');input.type='date';input.id='habit-date';input.value=selectedDate;
  input.onchange=()=>{selectedDate=input.value;render();};
  $('#record-list').before(label,input);
 }
 function reset(){editing=null;$('#record-form').reset();for(const field of config.fields)if(field.default) $(`#record-${field.id}`).value=typeof field.default==='function'?field.default():field.default;$('#save-record').textContent='Add record';$('#cancel-edit').hidden=true;}
 function action(label,fn){const button=document.createElement('button');button.type='button';button.textContent=label;button.onclick=fn;return button;}
 function commit(records){store.replace(records);render();message('Saved in this browser.');}
 function render(){
  const records=store.records;const query=$('#record-search').value.toLowerCase();const list=$('#record-list');list.replaceChildren();
  $('#workspace-summary').textContent=config.summary?config.summary(records):`${records.length} saved records`;
  const visible=records.filter(record=>config.search(record).toLowerCase().includes(query));
  if(!visible.length){const empty=document.createElement('p');empty.textContent='No matching records. Add a record or change your search.';list.append(empty);}
  for(const record of visible){
   const article=document.createElement('article');article.className='saved-record';
   const title=document.createElement('h3');title.textContent=record.title;
   const description=document.createElement('p');description.className='record-body';description.textContent=config.describe(record);
   const controls=document.createElement('div');controls.className='actions';
   controls.append(action('Edit',()=>{editing=record.id;for(const field of config.fields)$(`#record-${field.id}`).value=config.fieldValue?config.fieldValue(record,field.id):record[field.id];$('#save-record').textContent='Save changes';$('#cancel-edit').hidden=false;$(`#record-${config.fields[0].id}`).focus();}));
   controls.append(action('Delete',()=>{if(!confirm(`Delete “${record.title}”?`))return;try{commit(store.records.filter(r=>r.id!==record.id));if(editing===record.id)reset();$('#record-search').focus();}catch(error){fail(error);}}));
   if(config.toggle){const button=action(record.done?'Mark incomplete':'Mark complete',()=>{try{commit(store.records.map(r=>r.id===record.id?{...r,done:!r.done}:r));$('#record-search').focus();}catch(error){fail(error);}});controls.append(button);}
   if(config.toggleDay){const button=action(record.days.includes(selectedDate)?'Undo completion':'Mark date complete',()=>{try{commit(store.records.map(r=>r.id===record.id?{...config.toggleDay(r,selectedDate),id:r.id}:r));$('#habit-date').focus();}catch(error){fail(error);}});controls.append(button);}
   if(config.link){const link=document.createElement('a');link.textContent='Open bookmark ↗';link.href=record.url;link.target='_blank';link.rel='noopener noreferrer';controls.append(link);}
   article.append(title,description,controls);list.append(article);
  }
 }
 $('#record-form').onsubmit=event=>{
  event.preventDefault();try{
   const previous=store.records.find(r=>r.id===editing);
   const values=Object.fromEntries(config.fields.map(field=>[field.id,$(`#record-${field.id}`).value]));
   const record={...config.fromFields(values,previous),id:editing||crypto.randomUUID()};
   const records=store.records;
   commit(editing?records.map(r=>r.id===editing?record:r):[record,...records]);reset();$(`#record-${config.fields[0].id}`).focus();
  }catch(error){fail(error);}
 };
 $('#cancel-edit').onclick=reset;$('#record-search').oninput=render;
 $('#export-backup').onclick=()=>{
  const url=URL.createObjectURL(new Blob([store.export()],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`clickhub-${config.id}-${localToday()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('Backup exported. Keep it private: it is not encrypted.');
 };
 $('#import-backup').onclick=async()=>{
  const file=$('#backup-file').files[0];
  if(!file){message('Choose a backup file first.');return;}
  try{
   if(file.size>MAX_BACKUP_BYTES)throw new Error('Backup exceeds 2 MiB.');
   const imported=parseBackup(await file.text(),config);
   if(!active)return;
   if(!confirm(`Replace all saved ${config.name} records with ${imported.records.length} records? Export a backup first if needed.`))return;
   commit(imported.records);reset();$('#backup-file').value='';
  }catch(error){fail(error);}
 };
 reset();render();
 return ()=>{active=false;};
}
