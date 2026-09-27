export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_SOURCE_PIXELS = 24000000;
export function dimensions(width, height) {
 const w=Number(width),h=Number(height);
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w>8192||h>8192||w*h>16000000)throw new Error('Use whole dimensions from 1–8192 pixels, with at most 16 million output pixels.');
 return {width:w,height:h};
}
export function proportional(width,height,target,axis) {
 if(!(width>0&&height>0)||!['width','height'].includes(axis))throw new Error('Invalid source dimensions.');
 const n=Number(target);if(!Number.isInteger(n)||n<1)throw new Error('Enter a positive whole dimension.');
 return axis==='width'?{width:n,height:Math.max(1,Math.round(n*height/width))}:{width:Math.max(1,Math.round(n*width/height)),height:n};
}
export async function readImage(file) {
 if(!file)throw new Error('Choose an image first.');
 if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Choose a PNG, JPEG, or WebP image.');
 if(file.size>MAX_FILE_SIZE)throw new Error('Image file must be no larger than 10 MiB.');
 let bitmap;
 try{bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});}catch{throw new Error('This file could not be decoded as an image.');}
 if(bitmap.width*bitmap.height>MAX_SOURCE_PIXELS){bitmap.close();throw new Error('Source image exceeds 24 million pixels.');}
 return bitmap;
}
// `source` is an optional {x,y,width,height} crop rectangle in source pixels.
export async function exportImage(bitmap,width,height,type,quality,source=null) {
 dimensions(width,height);
 if(!['image/png','image/jpeg','image/webp'].includes(type))throw new Error('Unsupported output format.');
 const q=Number(quality);if(!Number.isFinite(q)||q<0.1||q>1)throw new Error('Quality must be between 0.1 and 1.');
 const canvas=document.createElement('canvas');canvas.width=Number(width);canvas.height=Number(height);
 const context=canvas.getContext('2d');if(!context)throw new Error('Canvas is not available in this browser.');
 if(type==='image/jpeg'){context.fillStyle='#ffffff';context.fillRect(0,0,canvas.width,canvas.height);}
 context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';if(source)context.drawImage(bitmap,source.x,source.y,source.width,source.height,0,0,canvas.width,canvas.height);else context.drawImage(bitmap,0,0,canvas.width,canvas.height);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,type,q));
 if(!blob||blob.type!==type)throw new Error('This browser cannot export the selected format. Try PNG or JPEG.');
 return {blob,canvas};
}
