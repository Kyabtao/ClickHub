import { mountCollection } from '../../../components/workspace/collection.js';
import { validate } from './logic.js';
export const config={id:'tasks',name:'tasks',validate,fields:[{id:'title',label:'Task title',max:200},{id:'due',label:'Due date (optional)',type:'date',optional:true}],fromFields:(v,old)=>validate({...v,done:old?.done??false}),search:r=>`${r.title} ${r.due}`,describe:r=>`${r.done?'Complete':'Incomplete'}${r.due?' · Due '+r.due:''}`,toggle:true,summary:rows=>`${rows.filter(r=>r.done).length} complete · ${rows.filter(r=>!r.done).length} remaining`};
export const mount=(container,feedback)=>mountCollection(container,feedback,config);
