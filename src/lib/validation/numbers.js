export function number(value, label, min = -Infinity, max = Infinity) {
  const text = String(value).trim();
  const n = Number(text);
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(text) || !Number.isFinite(n) || n < min || n > max) throw new Error(`${label} must be a finite number between ${min} and ${max}.`);
  return n;
}
export function finite(value) {
  if (!Number.isFinite(value)) throw new Error('Result exceeds the supported numeric range.');
  return value;
}
export function display(value) { return finite(value).toLocaleString('en-US', { maximumFractionDigits: 8 }); }
