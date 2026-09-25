import { requiredText } from '../../../lib/storage/workspace.js';
export function validate(record) {
 const title=requiredText(record.title,'Title'),raw=requiredText(record.url,'URL',2000);
 let url; try {url=new URL(raw);}catch{throw new Error('Enter a complete HTTP or HTTPS URL.');}
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new Error('Only HTTP(S) links without embedded credentials are allowed.');
 return {title,url:url.href};
}
