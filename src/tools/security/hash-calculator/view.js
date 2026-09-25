import { calculator } from '../../../components/ui/calculator.js';
import { hash, MAX_FILE_BYTES } from './logic.js';
export function mount(container, feedback) {
 calculator(container, feedback, [{"id": "mode", "label": "Input source", "options": [["text", "Text (UTF-8)"], ["file", "Local file"]]}, {"id": "text", "label": "Text to hash", "type": "textarea"}, {"id": "file", "label": "File to hash (up to 25 MiB)", "type": "file"}, {"id": "algorithm", "label": "Algorithm", "options": [["SHA-256", "SHA-256"], ["SHA-384", "SHA-384"], ["SHA-512", "SHA-512"]]}], "Files stay on your device. Hashing is not encryption or a password-storage scheme. File processing is limited to 25 MiB.", v => (async () => { if(v.mode === 'text') return hash(v.text,v.algorithm); if(!v.file) throw new Error('Choose a file.'); if(v.file.size > MAX_FILE_BYTES) throw new Error('Use a file no larger than 25 MiB.'); return hash(await v.file.arrayBuffer(),v.algorithm); })());
}
