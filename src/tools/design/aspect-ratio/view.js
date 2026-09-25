import { calculator } from '../../../components/ui/calculator.js';
import { display } from '../../../lib/validation/numbers.js';
import { aspect } from './logic.js';
export function mount(container, feedback) {
 calculator(container, feedback, [{"id": "width", "label": "Original width (pixels)", "value": 1920}, {"id": "height", "label": "Original height (pixels)", "value": 1080}, {"id": "target", "label": "New width (pixels)", "value": 1280}], "Uses positive integer dimensions. The scaled height may be fractional; rounding can alter the ratio slightly.", v => (() => { const r=aspect(v.width,v.height,v.target); return `Ratio: ${r.ratio}\nScaled height: ${display(r.height)} px`; })());
}
