import { requiredText, dateOnly } from '../../../lib/storage/workspace.js';
export const currencies=['INR','USD','EUR','GBP'];
export function validate(record) {
 if(!Number.isSafeInteger(record.cents)||record.cents<=0||record.cents>100000000000)throw new Error('Amount must be positive and at most 1 billion.');
 if(!currencies.includes(record.currency))throw new Error('Choose a supported currency.');
 return {title:requiredText(record.title,'Description'),date:dateOnly(record.date),cents:record.cents,currency:record.currency};
}
export function parseAmount(value) {
 if(!/^\d+(?:\.\d{1,2})?$/.test(value))throw new Error('Enter a positive amount with up to two decimal places.');
 const [whole,fraction='']=value.split('.');
 const cents=Number(whole)*100+Number(fraction.padEnd(2,'0'));
 if(!Number.isSafeInteger(cents)||cents<=0||cents>100000000000)throw new Error('Amount must be positive and at most 1 billion.');
 return cents;
}
export function totals(records) {
 const result={};for(const r of records)result[r.currency]=(result[r.currency]||0)+r.cents;return result;
}
