import { color } from '../../design/color-converter/logic.js';
function luminance(value){
 const hex=color(value).hex.slice(1);
 const [r,g,b]=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
 return r*0.2126+g*0.7152+b*0.0722;
}
export function contrast(foreground,background){
 const a=luminance(foreground),b=luminance(background),ratio=(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
 return {ratio,aaNormal:ratio>=4.5,aaLarge:ratio>=3,aaaNormal:ratio>=7,aaaLarge:ratio>=4.5};
}
