import { requiredText, dateOnly } from '../../../lib/storage/workspace.js';
export function validate(record) {
 if(!Array.isArray(record.days) || record.days.length>3660)throw new Error('Habit must have at most 3660 completion dates.');
 const days=record.days.map(day=>dateOnly(day));
 if(new Set(days).size!==days.length)throw new Error('Duplicate completion date.');
 return {title:requiredText(record.title,'Habit'),days:days.sort()};
}
export function toggleDay(record,day) {
 dateOnly(day);
 return validate({...record,days:record.days.includes(day)?record.days.filter(d=>d!==day):[...record.days,day]});
}
