import { number, finite } from '../../../lib/validation/numbers.js';
export function compound(principal, rate, years, frequency) {
 principal = number(principal, 'Principal', 0); rate = number(rate, 'Annual rate', 0, 1000); years = number(years, 'Years', 0, 1000); frequency = number(frequency, 'Frequency', 1, 365);
 if (![1, 4, 12, 365].includes(frequency)) throw new Error('Choose a supported compounding frequency.');
 const total = finite(principal * Math.pow(1 + rate / 100 / frequency, frequency * years));
 return { total, interest: total - principal };
}
