export function convertEncoding(text, mode) {
  if (mode === 'url-encode') return encodeURIComponent(text);
  if (mode === 'url-decode') return decodeURIComponent(text);
  if (mode === 'base64-encode') {
    let binary = '';
    for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
    return btoa(binary);
  }
  if (mode === 'base64-decode') {
    const binary = atob(text.replace(/\s/g, ''));
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, c => c.charCodeAt(0)));
  }
  throw new Error('Unknown encoding mode.');
}
