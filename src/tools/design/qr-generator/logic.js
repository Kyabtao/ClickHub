import QRCode from 'qrcode';
export function qrMatrix(text,level) {
 if(!text.trim())throw new Error('Enter text or a URL.');
 if(new TextEncoder().encode(text).length>1000)throw new Error('Use at most 1,000 UTF-8 bytes.');
 if(!['M','Q','H'].includes(level))throw new Error('Choose a valid correction level.');
 return QRCode.create(text,{errorCorrectionLevel:level});
}
