const codes=['.-','-...','-.-.','-..','.','..-.','--.','....','..','.---','-.-','.-..','--','-.','---','.--.','--.-','.-.','...','-','..-','...-','.--','-..-','-.--','--..','-----','.----','..---','...--','....-','.....','-....','--...','---..','----.'];
const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const encode=Object.fromEntries([...letters].map((c,i)=>[c,codes[i]])),decode=Object.fromEntries(codes.map((c,i)=>[c,letters[i]]));
export function morse(value,mode){
 if(value.length>100000)throw new Error('Input limit: 100,000 characters.');
 if(!value.trim())return '';
 if(mode==='encode')return value.trim().toUpperCase().split(/\s+/).map(word=>[...word].map(c=>{if(!encode[c])throw new Error('Text supports only A–Z and 0–9.');return encode[c];}).join(' ')).join(' / ');
 if(mode==='decode')return value.trim().split(/\s*\/\s*/).map(word=>{if(!word)throw new Error('Empty Morse word.');return word.split(/\s+/).map(c=>{if(!decode[c])throw new Error(`Unknown Morse sequence: ${c}`);return decode[c];}).join('');}).join(' ');
 throw new Error('Unknown translation mode.');
}
