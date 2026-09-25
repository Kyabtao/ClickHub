import { mountCollection } from '../../../components/workspace/collection.js';
import { validate,toggleDay } from './logic.js';
export const config={id:'habit-tracker',name:'habits',validate,fields:[{id:'title',label:'Habit name',max:200}],fromFields:(v,old)=>validate({...v,days:old?.days??[]}),search:r=>r.title,describe:r=>`${r.days.length} completed days${r.days.length?' · Recent dates: '+r.days.slice(-7).join(', '):''}`,toggleDay};
export const mount=(container,feedback)=>mountCollection(container,feedback,config);
