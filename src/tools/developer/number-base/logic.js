export function convertBase(value, from, to) {
 from = Number(from); to = Number(to);
 if (![2,8,10,16].includes(from) || ![2,8,10,16].includes(to)) throw new Error('Choose base 2, 8, 10, or 16.');
 let input = value.trim(), negative = input.startsWith('-');
 if (negative) input = input.slice(1);
 if (!input || input.length > 4096) throw new Error('Enter 1–4096 digits without a prefix.');
 let result = 0n;
 for (const char of input.toLowerCase()) {
   const digit = '0123456789abcdef'.indexOf(char);
   if (digit < 0 || digit >= from) throw new Error(`Invalid digit for base ${from}.`);
   result = result * BigInt(from) + BigInt(digit);
 }
 if (negative) result = -result;
 return result.toString(to).toUpperCase();
}
