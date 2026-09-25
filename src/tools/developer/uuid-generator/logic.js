export function generateUUIDs(count) {
  if (!Number.isInteger(count) || count < 1 || count > 500) throw new Error('Choose a whole number from 1 to 500.');
  return Array.from({ length: count }, () => crypto.randomUUID()).join('\n');
}
