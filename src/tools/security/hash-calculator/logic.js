export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export async function hash(data, algorithm) {
 if (!['SHA-256','SHA-384','SHA-512'].includes(algorithm)) throw new Error('Choose a supported SHA algorithm.');
 const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
 if (!(bytes instanceof Uint8Array) && !(bytes instanceof ArrayBuffer)) throw new Error('Expected text or file bytes.');
 if (bytes.byteLength > MAX_FILE_BYTES) throw new Error('Use an input no larger than 25 MiB.');
 const digest = await crypto.subtle.digest(algorithm, bytes);
 return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}
