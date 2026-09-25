export function parseCSV(text) {
 if (text.length > 1000000) throw new Error('Input limit: 1 million characters.');
 if (!text) return [];
 const rows=[]; let row=[], field='', quoted=false, ended=false, start=true;
 for(let i=0;i<text.length;i++) {
  const c=text[i];
  if(quoted) { if(c==='"') { if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;ended=true;} }else field+=c; continue; }
  if(c===','){row.push(field);field='';start=true;ended=false;}
  else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);rows.push(row);row=[];field='';start=true;ended=false;}
  else if(c==='"'&&start){quoted=true;start=false;}
  else {if(ended||c==='"')throw new Error('Invalid CSV quoting.');field+=c;start=false;}
 }
 if(quoted)throw new Error('Unclosed CSV quote.');
 if(row.length||field||ended||text.endsWith(',')){row.push(field);rows.push(row);}
 return rows;
}
export function convertCSV(text,mode){
 if(text.length>1000000)throw new Error('Input limit: 1 million characters.');
 if(mode==='json')return JSON.stringify(parseCSV(text),null,2);
 if(mode!=='csv')throw new Error('Unknown conversion.');
 const rows=JSON.parse(text);
 if(!Array.isArray(rows)||rows.some(r=>!Array.isArray(r)||r.length===0||r.some(v=>typeof v!=='string')))throw new Error('JSON must be an array of rows, each a non-empty array of strings.');
 return rows.map(row=>row.map(v=>/[",\r\n]/.test(v)||v===''?'"'+v.replaceAll('"','""')+'"':v).join(',')).join('\r\n');
}
