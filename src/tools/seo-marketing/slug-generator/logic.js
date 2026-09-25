export function slug(value, mode){
 let result=value.normalize('NFKD').replace(/\p{M}+/gu,'').toLowerCase().trim();
 if(mode==='ascii')result=result.replace(/[^a-z0-9]+/g,'-');
 else if(mode==='unicode')result=result.replace(/[^\p{L}\p{N}]+/gu,'-');
 else throw new Error('Unknown slug mode.');
 return result.replace(/^-+|-+$/g,'');
}
