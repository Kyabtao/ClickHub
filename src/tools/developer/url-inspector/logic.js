export function inspectURL(value) {
 let url;
 try { url = new URL(value.trim()); } catch { throw new Error('Enter a complete HTTP or HTTPS URL.'); }
 if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS URLs are supported.');
 return { protocol: url.protocol, hostname: url.hostname, port: url.port || '(default)', path: url.pathname, fragment: url.hash, query: [...url.searchParams.entries()], credentialsPresent: Boolean(url.username || url.password) };
}
