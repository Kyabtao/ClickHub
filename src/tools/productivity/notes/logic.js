import { requiredText } from '../../../lib/storage/workspace.js';
export function validate(record) {
 return {title:requiredText(record.title,'Title'),body:requiredText(record.body,'Note',20000)};
}
