import { mountCollection } from '../../../components/workspace/collection.js';
import { validate } from './logic.js';
export const config={id:'bookmarks',name:'bookmarks',validate,fields:[{id:'title',label:'Bookmark title',max:200},{id:'url',label:'HTTP or HTTPS URL',type:'url',max:2000}],fromFields:values=>validate(values),search:r=>`${r.title} ${r.url}`,describe:r=>r.url,link:true};
export const mount=(container,feedback)=>mountCollection(container,feedback,config);
