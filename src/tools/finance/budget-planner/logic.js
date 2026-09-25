const GROUPS = ['need', 'want', 'saving'];
export const GUIDE = { need: 50, want: 30, saving: 20 };
export function cents(value, label) {
 const text = String(value).trim().replace(/,/g, '');
 if (!/^\d{1,12}(\.\d{1,2})?$/.test(text)) throw new Error(`${label} must be a non-negative amount with up to 2 decimals.`);
 const [whole, fraction = ''] = text.split('.');
 return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}
const money = value => `${value < 0 ? '−' : ''}${(Math.abs(value) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const percent = (part, whole) => whole ? `${(part / whole * 100).toFixed(1)}%` : '—';
export function parseItems(text) {
 const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
 if (!lines.length) throw new Error('Add at least one budget line, such as “Rent, 1200, need”.');
 if (lines.length > 200) throw new Error('Maximum 200 budget lines.');
 return lines.map((line, index) => {
  const parts = line.split(/\s*[,;\t]\s*/);
  if (parts.length < 2 || parts.length > 3 || !parts[0]) throw new Error(`Line ${index + 1}: use “Category, amount” or “Category, amount, need/want/saving”.`);
  const group = (parts[2] || 'need').toLowerCase().replace(/s$/, '').replace(/^savings?$/, 'saving');
  if (!GROUPS.includes(group)) throw new Error(`Line ${index + 1}: group must be need, want, or saving.`);
  return { name: parts[0].slice(0, 80), amount: cents(parts[1], `Line ${index + 1} amount`), group };
 });
}
export function planBudget(income, text) {
 const incomeCents = cents(income, 'Income');
 if (!incomeCents) throw new Error('Income must be greater than zero.');
 const items = parseItems(text);
 const totals = Object.fromEntries(GROUPS.map(group => [group, items.filter(i => i.group === group).reduce((sum, i) => sum + i.amount, 0)]));
 const allocated = items.reduce((sum, i) => sum + i.amount, 0);
 return { income: incomeCents, items, totals, allocated, remaining: incomeCents - allocated };
}
export function describeBudget(plan) {
 const lines = [`Income: ${money(plan.income)}`, `Allocated: ${money(plan.allocated)} (${percent(plan.allocated, plan.income)})`, `${plan.remaining >= 0 ? 'Unallocated' : 'Over budget by'}: ${money(Math.abs(plan.remaining))}`, '', 'By line:'];
 for (const item of [...plan.items].sort((a, b) => b.amount - a.amount)) lines.push(`  ${item.name} (${item.group}): ${money(item.amount)} · ${percent(item.amount, plan.income)}`);
 lines.push('', 'Compared with the 50/30/20 guideline:');
 for (const group of GROUPS) {
  const target = Math.round(plan.income * GUIDE[group] / 100), diff = plan.totals[group] - target;
  lines.push(`  ${group === 'saving' ? 'Savings' : group === 'need' ? 'Needs' : 'Wants'}: ${money(plan.totals[group])} (${percent(plan.totals[group], plan.income)}) vs ${GUIDE[group]}% = ${money(target)} · ${diff === 0 ? 'on target' : `${money(Math.abs(diff))} ${diff > 0 ? 'above' : 'below'}`}`);
 }
 return lines.join('\n');
}
