import {parseCSV} from '../csv-json/logic.js';
export function csvTable(text){
 const rows=parseCSV(text.replace(/^\uFEFF/,''));
 if(!rows.length)throw new Error('CSV is empty. The first row should contain headings.');
 const width=rows[0].length;
 if(width>100||rows.length>5001||rows.length*width>200000)throw new Error('Limit: 100 columns, 5,000 data rows, and 200,000 cells.');
 if(rows.some(row=>row.length!==width))throw new Error('Every row must have the same number of fields as the heading row.');
 return {headers:rows[0].map((cell,i)=>cell||`Column ${i+1}`),rows:rows.slice(1)};
}
export function filterSort(rows,query,column,direction,numeric){
 const filtered=rows.filter(row=>row.some(cell=>cell.toLowerCase().includes(query.toLowerCase())));
 if(column<0)return filtered;
 return filtered.map((row,i)=>({row,i})).sort((a,b)=>{
  let result;
  const x=a.row[column],y=b.row[column];
  if(numeric){const xn=Number(x),yn=Number(y),xok=x.trim()!==''&&Number.isFinite(xn),yok=y.trim()!==''&&Number.isFinite(yn);if(xok!==yok)return xok?-1:1;result=xok?xn-yn:x.localeCompare(y);}
  else result=x.localeCompare(y);
  return (direction==='desc'?-result:result)||a.i-b.i;
 }).map(item=>item.row);
}
export function tableCSV(headers,rows,safe=true){
 const encode=value=>{let text=value;if(safe&&/^[\s]*[=+\-@]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};
 return [headers,...rows].map(row=>row.map(encode).join(',')).join('\r\n');
}
