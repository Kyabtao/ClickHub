import { number, finite } from '../../../lib/validation/numbers.js';
export function loan(principal, rate, months) {
 principal = number(principal, 'Principal', 0); rate = number(rate, 'Annual rate', 0, 1000); months = number(months, 'Months', 1, 1200);
 if (!Number.isInteger(months)) throw new Error('Months must be a whole number.');
 const r = rate / 1200;
 const payment = r === 0 ? principal / months : principal * r / -Math.expm1(-months * Math.log1p(r));
 const total = finite(payment * months);
 return { payment: finite(payment), total, interest: Math.max(0, total - principal) };
}
