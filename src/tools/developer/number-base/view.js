import { calculator } from '../../../components/ui/calculator.js';
import { convertBase } from './logic.js';
export function mount(container, feedback) {
 calculator(container, feedback, [{"id": "input", "label": "Integer (no 0x or 0b prefix)", "type": "text", "value": "255"}, {"id": "from", "label": "From base", "options": [["10", "Decimal (10)"], ["2", "Binary (2)"], ["8", "Octal (8)"], ["16", "Hexadecimal (16)"]]}, {"id": "to", "label": "To base", "options": [["16", "Hexadecimal (16)"], ["10", "Decimal (10)"], ["2", "Binary (2)"], ["8", "Octal (8)"]]}], "Exact signed integers using BigInt. No fractions. Maximum input length: 4096 digits.", v => convertBase(v.input,v.from,v.to));
}
