import { number, finite } from '../../../lib/validation/numbers.js';
export function percentage(a, b, mode) {
 a = number(a, 'First value'); b = number(b, 'Second value');
 if (mode === 'of') return finite(a / 100 * b);
 if (mode === 'ratio') { if (b === 0) throw new Error('The total cannot be zero.'); return finite(a / b * 100); }
 if (mode === 'change') { if (a === 0) throw new Error('The starting value cannot be zero.'); return finite((b - a) / Math.abs(a) * 100); }
 throw new Error('Unknown operation.');
}
