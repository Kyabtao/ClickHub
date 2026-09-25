import { finite } from '../../../lib/validation/numbers.js';
export function statistics(text,mode){
 if(text.length>100000)throw new Error('Input limit: 100,000 characters.');
 const tokens=text.trim().split(/[\s,;]+/);
 if(!text.trim()||tokens.some(t=>!t||!/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(t)))throw new Error('Enter numbers separated by commas, spaces, or semicolons.');
 const values=tokens.map(Number);values.forEach(finite);
 if(!['population','sample'].includes(mode))throw new Error('Unknown variance mode.');
 if(mode==='sample'&&values.length<2)throw new Error('Sample variance needs at least two numbers.');
 let mean=0,m2=0,n=0,sum=0;
 for(const x of values){n++;const delta=x-mean;mean+=delta/n;m2+=delta*(x-mean);sum+=x;}
 const sorted=[...values].sort((a,b)=>a-b),mid=Math.floor(n/2),variance=m2/(mode==='sample'?n-1:n);
 const result={count:n,sum,mean,median:n%2?sorted[mid]:sorted[mid-1]/2+sorted[mid]/2,min:sorted[0],max:sorted[n-1],variance,standardDeviation:Math.sqrt(Math.max(0,variance))};
 Object.values(result).forEach(finite);return result;
}
