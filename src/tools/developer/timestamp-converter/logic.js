export function fromTimestamp(value, unit) {
  if (!['seconds', 'milliseconds'].includes(unit)) throw new Error('Unknown timestamp unit.');
  if (!/^-?\d+$/.test(value.trim())) throw new Error('Enter a whole-number Unix timestamp.');
  const number = Number(value);
  const milliseconds = unit === 'seconds' ? number * 1000 : number;
  if (!Number.isSafeInteger(milliseconds)) throw new Error('Timestamp is outside the supported range.');
  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime())) throw new Error('Timestamp is outside the supported date range.');
  return `UTC: ${date.toISOString()}\nLocal: ${date.toString()}`;
}
export function toTimestamp(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)) throw new Error('Use UTC ISO format: 2026-09-25T12:00:00Z.');
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 19) !== value.slice(0, 19)) throw new Error('Enter a valid UTC date and time.');
  return `Seconds: ${Math.floor(date.getTime() / 1000)}\nMilliseconds: ${date.getTime()}`;
}
