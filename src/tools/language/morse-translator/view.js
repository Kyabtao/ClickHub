import { calculator } from '../../../components/ui/calculator.js';
import { morse } from './logic.js';
export function mount(container, feedback) {
 calculator(container, feedback, [{"id": "input", "label": "Text or Morse code", "type": "textarea"}, {"id": "mode", "label": "Direction", "options": [["encode", "Text to Morse"], ["decode", "Morse to text"]]}], "Supports A\u2013Z and 0\u20139. Morse letters use spaces; words use a slash. Decoding returns uppercase. Punctuation and audio are not supported.", v => morse(v.input,v.mode));
 container.querySelector('#run-tool').textContent = 'Run tool';
}
