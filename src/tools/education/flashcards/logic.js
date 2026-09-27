import { requiredText, dateOnly, localToday } from '../../../lib/storage/workspace.js';
// Leitner boxes: a correct answer promotes a card and schedules it further out.
export const INTERVALS = [0, 1, 2, 4, 8, 16];
export function validate(record) {
 const box = Number(record.box);
 if (!Number.isInteger(box) || box < 1 || box > 5) throw new Error('Card box must be 1–5.');
 const deck = typeof record.deck === 'string' && record.deck.trim() ? requiredText(record.deck, 'Deck', 60) : 'General';
 return { title: requiredText(record.title, 'Front', 500), back: requiredText(record.back, 'Back', 2000), deck, box, due: dateOnly(record.due) };
}
export function addDays(day, count) {
 const date = new Date(dateOnly(day) + 'T00:00:00Z');
 date.setUTCDate(date.getUTCDate() + count);
 return date.toISOString().slice(0, 10);
}
export function review(card, knewIt, today = localToday()) {
 const box = knewIt ? Math.min(5, card.box + 1) : 1;
 return { ...card, box, due: knewIt ? addDays(today, INTERVALS[box]) : today };
}
export function dueCards(cards, deck = 'all', today = localToday()) {
 return cards.filter(card => (deck === 'all' || card.deck === deck) && card.due <= today).sort((a, b) => a.due.localeCompare(b.due) || a.box - b.box);
}
export function deckSummary(cards, today = localToday()) {
 const due = cards.filter(card => card.due <= today).length;
 const upcoming = cards.filter(card => card.due > today).map(card => card.due).sort()[0];
 return `${cards.length} card${cards.length === 1 ? '' : 's'} · ${due} due today${upcoming && !due ? ` · next review ${upcoming}` : ''}`;
}
