import { number, finite } from '../../../lib/validation/numbers.js';
export function aspect(width, height, target) {
 width = number(width, 'Width', 1, 1e9); height = number(height, 'Height', 1, 1e9); target = number(target, 'New width', 1, 1e9);
 if (![width,height,target].every(Number.isInteger)) throw new Error('Pixel dimensions must be whole numbers.');
 let a = width, b = height; while (b) [a,b] = [b,a % b];
 return { ratio: `${width / a}:${height / a}`, height: finite(target * height / width) };
}
