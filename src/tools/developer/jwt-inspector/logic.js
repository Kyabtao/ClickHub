function decode(segment){
 if(!/^[A-Za-z0-9_-]+$/.test(segment)||segment.length%4===1)throw new Error('Invalid Base64URL segment.');
 const binary=atob(segment.replaceAll('-','+').replaceAll('_','/')+'='.repeat((4-segment.length%4)%4));
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(binary,c=>c.charCodeAt(0))));
}
export function inspectJWT(value){
 if(value.length>100000)throw new Error('Token is too large (100,000 character limit).');
 const parts=value.trim().split('.');
 if(parts.length!==3)throw new Error('Expected a three-part compact JWT, not an encrypted JWE.');
 const header=decode(parts[0]),payload=decode(parts[1]);
 if(!header||typeof header!=='object'||Array.isArray(header)||!payload||typeof payload!=='object'||Array.isArray(payload))throw new Error('Header and payload must be JSON objects.');
 return {warning:'NOT VERIFIED: decoding does not validate the signature or trust claims.',header,payload,signaturePresent:Boolean(parts[2])};
}
