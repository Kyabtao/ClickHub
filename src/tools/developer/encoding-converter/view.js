import { toolForm } from '../../../components/ui/tool-form.js';
import { convertEncoding } from './logic.js';
export function mount(container, feedback) {
  toolForm(container, feedback, '<label class="field-label" for="mode">Operation</label><select id="mode"><option value="base64-encode">Text → Base64 (UTF-8)</option><option value="base64-decode">Base64 → Text (UTF-8)</option><option value="url-encode">Encode URL component</option><option value="url-decode">Decode URL component</option></select><label class="field-label" for="input">Input</label><textarea id="input" spellcheck="false"></textarea><p>Base64 is encoding, not encryption. URL mode operates on a component, not an entire URL.</p>', () => convertEncoding(container.querySelector('#input').value, container.querySelector('#mode').value));
}
