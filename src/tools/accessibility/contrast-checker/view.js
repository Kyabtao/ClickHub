import { calculator } from '../../../components/ui/calculator.js';
import { contrast } from './logic.js';
export function mount(container, feedback) {
 calculator(container, feedback, [{"id": "foreground", "label": "Text color (HEX)", "type": "text", "value": "#000000"}, {"id": "background", "label": "Background color (HEX)", "type": "text", "value": "#ffffff"}], "Opaque sRGB colors only. WCAG large text: at least 18pt, or 14pt bold. Ratios alone do not establish complete accessibility compliance.", v => (() => {const r=contrast(v.foreground,v.background);return `Ratio: ${r.ratio.toFixed(2)}:1\nAA normal: ${r.aaNormal?'Pass':'Fail'}\nAA large: ${r.aaLarge?'Pass':'Fail'}\nAAA normal: ${r.aaaNormal?'Pass':'Fail'}\nAAA large: ${r.aaaLarge?'Pass':'Fail'}`;})());
 container.querySelector('#run-tool').textContent = 'Run tool';
}
