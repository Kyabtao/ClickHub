import { readImage, exportImage, proportional } from '../../lib/images/process.js';
export function mountImageTool(container,feedback,resize) {
 let active=true,revision=0,bitmap=null,outputURL=null;
 container.innerHTML=`<label class="field-label" for="image-file">PNG, JPEG, or WebP image (up to 10 MiB)</label><input id="image-file" type="file" accept="image/png,image/jpeg,image/webp"><p id="image-info">No image loaded.</p>${resize?'<div class="unit-pair"><div><label class="field-label" for="image-width">Width (px)</label><input id="image-width" type="number" min="1" max="8192"></div><div><label class="field-label" for="image-height">Height (px)</label><input id="image-height" type="number" min="1" max="8192"></div></div><label class="check-label"><input id="image-lock" type="checkbox" checked> Keep original aspect ratio</label>':''}<label class="field-label" for="image-format">Output format</label><select id="image-format"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select><label class="field-label" for="image-quality">JPEG/WebP quality (0.1–1; ignored for PNG)</label><input id="image-quality" type="number" min="0.1" max="1" step="0.1" value="0.9"><p>Images stay on your device. JPEG flattens transparency onto white. Animation is flattened to one frame. Export is a new raster image; do not rely on it to preserve metadata. Limits: 24 MP source, 16 MP output.</p><div class="actions"><button id="process-image" class="primary" disabled>${resize?'Resize image':'Convert image'}</button><a id="download-image" hidden>Download image</a></div><div id="image-preview"></div>`;
 const $=selector=>container.querySelector(selector);
 function ready(value){container.querySelectorAll('input:not(#image-file),select,#process-image').forEach(el=>el.disabled=!value);}
 ready(false);
 function clear(){revision++;if(outputURL)URL.revokeObjectURL(outputURL);outputURL=null;$('#download-image').hidden=true;$('#download-image').removeAttribute('href');$('#image-preview').replaceChildren();feedback.textContent='';}
 $('#image-file').onchange=async()=>{
  clear();const current=revision;if(bitmap)bitmap.close();bitmap=null;ready(false);$('#image-info').textContent='Loading…';
  try{
   const loaded=await readImage($('#image-file').files[0]);
   if(!active||revision!==current){loaded.close();return;}
   bitmap=loaded;$('#image-info').textContent=`Source: ${bitmap.width} × ${bitmap.height} pixels`;
   if(resize){$('#image-width').value=bitmap.width;$('#image-height').value=bitmap.height;}
   ready(true);feedback.textContent='Image loaded. Choose settings, then process.';
  }catch(error){if(active&&revision===current){$('#image-info').textContent='No image loaded.';feedback.textContent=error.message;}}
 };
 function adjust(axis){clear();if(!bitmap||!$('#image-lock').checked)return;try{const size=proportional(bitmap.width,bitmap.height,$(`#image-${axis}`).value,axis);$('#image-width').value=size.width;$('#image-height').value=size.height;}catch(error){feedback.textContent=error.message;}}
 if(resize){$('#image-width').oninput=()=>adjust('width');$('#image-height').oninput=()=>adjust('height');$('#image-lock').onchange=()=>adjust('width');}
 $('#image-format').onchange=clear;$('#image-quality').oninput=clear;
 $('#process-image').onclick=async()=>{
  clear();const current=revision;
  if(!bitmap){feedback.textContent='Choose an image first.';return;}
  feedback.textContent='Processing…';
  try{
   const type=$('#image-format').value;
   const result=await exportImage(bitmap,resize?$('#image-width').value:bitmap.width,resize?$('#image-height').value:bitmap.height,type,$('#image-quality').value);
   if(!active||revision!==current)return;
   outputURL=URL.createObjectURL(result.blob);const link=$('#download-image');link.href=outputURL;link.download=`clickhub-image.${type==='image/jpeg'?'jpg':type.split('/')[1]}`;link.hidden=false;
   result.canvas.setAttribute('role','img');result.canvas.setAttribute('aria-label','Processed image preview');$('#image-preview').replaceChildren(result.canvas);
   feedback.textContent=`Ready: ${result.canvas.width} × ${result.canvas.height} pixels, ${result.blob.size.toLocaleString()} bytes.`;
  }catch(error){if(active&&revision===current)feedback.textContent=error.message;}
 };
 return ()=>{active=false;revision++;bitmap?.close();if(outputURL)URL.revokeObjectURL(outputURL);};
}
