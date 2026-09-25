import { qrMatrix } from './logic.js';
export function mount(container,feedback){
 container.innerHTML='<label class="field-label" for="qr-input">Text or URL</label><textarea id="qr-input" maxlength="1000" spellcheck="false"></textarea><label class="field-label" for="qr-level">Error correction</label><select id="qr-level"><option value="M">Medium (M)</option><option value="Q">Quartile (Q)</option><option value="H">High (H)</option></select><p>Generated locally as black-on-white PNG with a four-module quiet zone. Verify with a scanner before printing. QR content is not encrypted.</p><div class="actions"><button id="generate-qr" class="primary">Generate QR code</button><a id="download-qr" hidden>Download PNG</a></div><div id="qr-preview"></div>';
 const $=selector=>container.querySelector(selector);
 function clear(){$('#qr-preview').replaceChildren();$('#download-qr').hidden=true;$('#download-qr').removeAttribute('href');feedback.textContent='';}
 $('#qr-input').oninput=clear;$('#qr-level').onchange=clear;
 $('#generate-qr').onclick=()=>{
  clear();try{
   const qr=qrMatrix($('#qr-input').value,$('#qr-level').value),size=qr.modules.size,scale=8,margin=4;
   const canvas=document.createElement('canvas');canvas.width=canvas.height=(size+margin*2)*scale;
   canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Generated QR code');
   const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.fillStyle='#000';
   for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(qr.modules.get(y,x))context.fillRect((x+margin)*scale,(y+margin)*scale,scale,scale);
   $('#qr-preview').append(canvas);const link=$('#download-qr');link.href=canvas.toDataURL('image/png');link.download='clickhub-qr.png';link.hidden=false;feedback.textContent='QR code ready. Test scanning before sharing.';
  }catch(error){feedback.textContent=error.message;}
 };
}
