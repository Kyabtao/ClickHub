import { mountCollection } from '../../../components/workspace/collection.js';
import { validate } from './logic.js';
export const config={id:'notes',name:'notes',validate,fields:[{id:'title',label:'Note title',max:200},{id:'body',label:'Note text',type:'textarea',max:20000}],fromFields:values=>validate(values),search:r=>`${r.title} ${r.body}`,describe:r=>r.body};
export const mount=(container,feedback)=>mountCollection(container,feedback,config);
