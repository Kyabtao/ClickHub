export function generatePassword(length = 20) {
 if (!Number.isInteger(length) || length < 8 || length > 128) throw new Error('Length must be an integer between 8 and 128.');
 const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*_-+=';
 const limit = 256 - (256 % alphabet.length);
 let result = '';
 while (result.length < length) { const values = crypto.getRandomValues(new Uint8Array(128)); for (const n of values) { if (n < limit) result += alphabet[n % alphabet.length]; if (result.length === length) break; } }
 return result;
}
