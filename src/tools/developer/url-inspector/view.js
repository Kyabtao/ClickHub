import { calculator } from '../../../components/ui/calculator.js';
import { inspectURL } from './logic.js';
export function mount(container, feedback) {
 calculator(container, feedback, [{"id": "url", "label": "Complete HTTP or HTTPS URL", "type": "text", "value": "https://example.com/path?tag=one&tag=two#section"}], "Parses locally without visiting the address. Not a malicious-link detector. Embedded credentials are flagged but not displayed.", v => JSON.stringify(inspectURL(v.url),null,2));
}
