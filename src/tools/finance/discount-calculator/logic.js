import { number, finite } from '../../../lib/validation/numbers.js';
export function discount(price, rate, tax) {
 price = number(price, 'Price', 0); rate = number(rate, 'Discount', 0, 100); tax = number(tax, 'Tax', 0, 100);
 const saved = price * rate / 100, subtotal = price - saved, taxAmount = subtotal * tax / 100;
 return { saved, subtotal, tax: taxAmount, total: finite(subtotal + taxAmount) };
}
