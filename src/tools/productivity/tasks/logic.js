import { requiredText, dateOnly } from '../../../lib/storage/workspace.js';
export function validate(record) {
 if(typeof record.done !== 'boolean') throw new Error('Task status must be true or false.');
 return {title:requiredText(record.title,'Task'),due:dateOnly(record.due,true),done:record.done};
}
