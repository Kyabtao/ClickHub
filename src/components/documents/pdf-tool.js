import {checkFiles,mergePDFs,selectPDF,imagePDF} from '../../lib/pdf/process.js';
import {readImage,exportImage} from '../../lib/images/process.js';
export function mountPDFTool(container,feedback,mode){
 let files=[],busy=false,active=true,url=null;
 const images=mode==='images',multiple=images||mode==='merge';
 container.innerHTML=`<p>Files stay in your browser. Limit: 20 files, 25 MiB combined, 200 output pages. ${images?'Images are re-encoded as JPEG on white and fitted within A4 pages.':'Encrypted PDFs are unsupported. Forms, bookmarks, attachments, and digital signatures may not survive page copying. This is not a PDF sanitizer; use trusted files.'}</p><label class="field-label" for="document-files">${multiple?'Choose files (displayed order is output order)':'Choose one PDF'}</label><input id="document-files" type="file" accept="${images?'image/png,image/jpeg,image/webp':'application/pdf,.pdf'}" ${multiple?'multiple':''}><ol id="document-list"></ol>${!multiple?'<label class="field-label" for="page-selection">Pages in output order (e.g. 3,1,2-4, or all)</label><input id="page-selection" type="text" value="all"><p>Page numbers start at 1. Repeated numbers duplicate pages. Omitted pages are removed from the new PDF.</p>':''}${mode==='organize'?'<label class="field-label" for="page-rotation">Rotate every output page clockwise</label><select id="page-rotation"><option value="0">No additional rotation</option><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option></select>':''}${images?'<label class="field-label" for="page-layout">A4 page orientation</label><select id="page-layout"><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select><p>Each image: up to 10 MiB, 24 MP decoded, and 16 MP/8192 px for re-encoding. Animation is flattened. A 24-point page margin is used.</p>':''}<div class="actions"><button id="build-pdf" class="primary">Create PDF</button><a id="download-pdf" hidden>Download PDF</a></div>`;
 const $=selector=>container.querySelector(selector);
 function clear(){if(url)URL.revokeObjectURL(url);url=null;$('#download-pdf').hidden=true;$('#download-pdf').removeAttribute('href');feedback.textContent='';}
 function render(){const list=$('#document-list');list.replaceChildren();files.forEach((file,i)=>{const li=document.createElement('li'),name=document.createElement('span');name.textContent=`${file.name} (${Math.ceil(file.size/1024)} KiB)`;li.append(name);if(multiple){for(const [label,delta] of [['Move up',-1],['Move down',1]]){const button=document.createElement('button');button.textContent=label;button.setAttribute('aria-label',`${label}: ${file.name}`);button.disabled=busy||i+delta<0||i+delta>=files.length;button.onclick=()=>{clear();[files[i],files[i+delta]]=[files[i+delta],files[i]];render();$('#document-files').focus();};li.append(button);}}list.append(li);});}
 $('#document-files').onchange=()=>{clear();files=Array.from($('#document-files').files);render();};
 for(const selector of ['#page-selection','#page-rotation','#page-layout'])if($(selector)){$(selector).oninput=clear;$(selector).onchange=clear;}
 $('#build-pdf').onclick=async()=>{
  if(busy)return;clear();busy=true;container.querySelectorAll('input,select,button').forEach(el=>el.disabled=true);feedback.textContent='Processing locally…';
  try{
   checkFiles(files,images);if(!multiple&&files.length!==1)throw new Error('Choose exactly one PDF.');
   let bytes;
   if(images){const prepared=[];for(const file of files){let bitmap;try{bitmap=await readImage(file);if(!active)return;const {blob}=await exportImage(bitmap,bitmap.width,bitmap.height,'image/jpeg',0.92);prepared.push(new Uint8Array(await blob.arrayBuffer()));}finally{bitmap?.close();}if(!active)return;}bytes=await imagePDF(prepared,$('#page-layout').value==='landscape');}
   else{const inputs=[];for(const file of files){inputs.push(new Uint8Array(await file.arrayBuffer()));if(!active)return;}bytes=mode==='merge'?await mergePDFs(inputs):await selectPDF(inputs[0],$('#page-selection').value,mode==='organize'?Number($('#page-rotation').value):0);}
   if(!active)return;
   url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));const link=$('#download-pdf');link.href=url;link.download=`clickhub-${mode}.pdf`;link.hidden=false;feedback.textContent=`PDF ready (${bytes.length.toLocaleString()} bytes). Review the downloaded pages before replacing originals.`;
  }catch(error){if(active)feedback.textContent=error.message;}finally{busy=false;if(active){container.querySelectorAll('input,select,button').forEach(el=>el.disabled=false);render();}}
 };
 return ()=>{active=false;if(url)URL.revokeObjectURL(url);};
}
