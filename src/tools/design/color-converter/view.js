import { calculator } from '../../../components/ui/calculator.js';
import { color } from './logic.js';
export function mount(container, feedback) {
 calculator(container, feedback, [{"id": "hex", "label": "HEX color (3 or 6 digits)", "type": "text", "value": "#4a90e2"}], "Opaque sRGB colors only. Alpha channels are not supported.", v => Object.values(color(v.hex)).join('\n'));
}
