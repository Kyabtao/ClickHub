import { number, finite } from '../../../lib/validation/numbers.js';
export function bmi(weight, height) {
 weight = number(weight, 'Weight in kilograms', 1, 1000); height = number(height, 'Height in centimetres', 30, 300);
 const value = finite(weight / (height / 100) ** 2);
 return { value, category: value < 18.5 ? 'Underweight' : value < 25 ? 'Normal range' : value < 30 ? 'Overweight' : 'Obesity range' };
}
