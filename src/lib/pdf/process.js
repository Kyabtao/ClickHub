export const MAX_BYTES=25*1024*1024;
export const MAX_PAGES=200;
export function pageSelection(text,total){
 if(!Number.isInteger(total)||total<1||total>MAX_PAGES)throw new Error('PDF must contain 1–200 pages.');
 if(text.trim().toLowerCase()==='all')return Array.from({length:total},(_,i)=>i);
 if(!text.trim())throw new Error('Enter pages, for example 1,3-5, or all.');
 const result=[];
 for(const part of text.split(',')){
  const match=part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
  if(!match)throw new Error('Use comma-separated page numbers or ascending ranges such as 1,3-5.');
  const start=Number(match[1]),end=Number(match[2]||match[1]);
  if(start<1||end<start||end>total)throw new Error(`Page numbers must be between 1 and ${total}; ranges must ascend.`);
  if(result.length+end-start+1>MAX_PAGES)throw new Error('Output is limited to 200 pages.');
  for(let n=start;n<=end;n++)result.push(n-1);
 }
 return result;
}
export function checkFiles(files,images=false){
 if(!files.length||files.length>20)throw new Error('Choose 1–20 files.');
 if(files.reduce((sum,file)=>sum+file.size,0)>MAX_BYTES)throw new Error('Combined file size must be no larger than 25 MiB.');
 for(const file of files){
  if(images?!['image/png','image/jpeg','image/webp'].includes(file.type):!(file.type==='application/pdf'||file.name?.toLowerCase().endsWith('.pdf')))throw new Error(images?'Use PNG, JPEG, or WebP images.':'Choose PDF files.');
 }
}
async function library(){return import('pdf-lib');}
export async function loadPDF(bytes){
 if(bytes.byteLength>MAX_BYTES)throw new Error('PDF exceeds 25 MiB.');
 const {PDFDocument}=await library();let pdf;
 try{pdf=await PDFDocument.load(bytes,{updateMetadata:false});}catch(error){if(/encrypt/i.test(error.message))throw new Error('Encrypted PDFs are not supported. Export an unencrypted copy first.');throw new Error('Could not read this PDF. It may be damaged or unsupported.');}
 if(pdf.getPageCount()<1||pdf.getPageCount()>MAX_PAGES)throw new Error('PDF must contain 1–200 pages.');
 return pdf;
}
export async function mergePDFs(inputs){
 if(!inputs.length||inputs.length>20||inputs.reduce((sum,bytes)=>sum+bytes.byteLength,0)>MAX_BYTES)throw new Error('Choose 1–20 PDFs with a combined size up to 25 MiB.');
 const {PDFDocument}=await library(),output=await PDFDocument.create();
 for(const bytes of inputs){const source=await loadPDF(bytes);if(output.getPageCount()+source.getPageCount()>MAX_PAGES)throw new Error('Merged output is limited to 200 pages.');for(const page of await output.copyPages(source,source.getPageIndices()))output.addPage(page);}
 return output.save();
}
export async function selectPDF(bytes,selection,rotation=0){
 if(![0,90,180,270].includes(rotation))throw new Error('Rotation must be 0, 90, 180, or 270 degrees.');
 const {PDFDocument,degrees}=await library(),source=await loadPDF(bytes),output=await PDFDocument.create();
 const pages=await output.copyPages(source,pageSelection(selection,source.getPageCount()));
 for(const page of pages){page.setRotation(degrees((page.getRotation().angle+rotation)%360));output.addPage(page);}
 return output.save();
}
export function fitOnPage(width,height,pageWidth=595.28,pageHeight=841.89,margin=24){
 if(![width,height,pageWidth,pageHeight,margin].every(Number.isFinite)||width<=0||height<=0||margin<0||pageWidth<=margin*2||pageHeight<=margin*2)throw new Error('Invalid image or page dimensions.');
 const scale=Math.min((pageWidth-2*margin)/width,(pageHeight-2*margin)/height),w=width*scale,h=height*scale;
 return {x:(pageWidth-w)/2,y:(pageHeight-h)/2,width:w,height:h};
}
export async function imagePDF(images,landscape=false){
 if(!images.length||images.length>20)throw new Error('Choose 1–20 images.');
 const {PDFDocument}=await library(),output=await PDFDocument.create(),pageSize=landscape?[841.89,595.28]:[595.28,841.89];
 for(const bytes of images){const image=await output.embedJpg(bytes);const page=output.addPage(pageSize);page.drawImage(image,fitOnPage(image.width,image.height,...pageSize));}
 return output.save();
}
