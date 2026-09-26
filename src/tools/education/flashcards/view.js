import { mountCollection } from '../../../components/workspace/collection.js';
import { validate, review, dueCards, deckSummary } from './logic.js';
import { localToday } from '../../../lib/storage/workspace.js';
function study({ panel, records, commit, message, fail }) {
 let current = null, revealed = false, answered = 0;
 panel.className = 'study-panel';
 panel.innerHTML = '<h3 id="study-heading">Study</h3><label class="field-label" for="study-deck">Deck</label><select id="study-deck"></select><p id="study-status" role="status"></p><div id="study-card" class="study-card" hidden><p class="study-side">Front</p><p id="study-front" class="study-text"></p><div id="study-answer" hidden><p class="study-side">Back</p><p id="study-back" class="study-text"></p></div></div><div class="actions"><button id="study-reveal" type="button" class="primary" hidden>Show answer</button><button id="study-knew" type="button" class="primary" hidden>I knew it</button><button id="study-again" type="button" hidden>Again</button></div>';
 const $ = selector => panel.querySelector(selector);
 function refreshDecks(cards) {
  const select = $('#study-deck'), chosen = select.value || 'all';
  const decks = [...new Set(cards.map(card => card.deck))].sort((a, b) => a.localeCompare(b));
  select.replaceChildren();
  for (const [value, label] of [['all', 'All decks'], ...decks.map(deck => [deck, deck])]) { const option = document.createElement('option'); option.value = value; option.textContent = label; select.append(option); }
  select.value = decks.includes(chosen) ? chosen : 'all';
 }
 function show() {
  const cards = records(), queue = dueCards(cards, $('#study-deck').value, localToday());
  current = queue.find(card => card.id === current?.id) || queue[0] || null;
  $('#study-card').hidden = !current; $('#study-reveal').hidden = !current || revealed; $('#study-knew').hidden = $('#study-again').hidden = !current || !revealed; $('#study-answer').hidden = !revealed;
  if (current) { $('#study-front').textContent = current.title; $('#study-back').textContent = current.back; }
  $('#study-status').textContent = !cards.length ? 'Add a card below to start studying.' : current ? `${queue.length} due in this deck · box ${current.box} of 5${answered ? ` · ${answered} reviewed this session` : ''}` : `All caught up for today.${answered ? ` ${answered} reviewed this session.` : ''} ${deckSummary(cards)}`;
 }
 $('#study-deck').onchange = () => { current = null; revealed = false; show(); };
 $('#study-reveal').onclick = () => { revealed = true; show(); $('#study-knew').focus(); };
 const grade = knew => () => {
  if (!current) return;
  try {
   const updated = review(current, knew, localToday());
   answered++; revealed = false; const reviewed = current.id; current = null;
   commit(records().map(card => card.id === reviewed ? updated : card));
   message(knew ? `Moved to box ${updated.box}; next review ${updated.due}.` : 'Back to box 1; it stays in today’s queue.');
   (panel.querySelector('#study-reveal:not([hidden])') || $('#study-deck')).focus();
  } catch (error) { fail(error); }
 };
 $('#study-knew').onclick = grade(true); $('#study-again').onclick = grade(false);
 return { refresh(cards) { refreshDecks(cards); show(); } };
}
export const config = {
 id: 'flashcards', name: 'flashcards', validate,
 fields: [{ id: 'title', label: 'Front (question or term)', type: 'textarea', max: 500 }, { id: 'back', label: 'Back (answer)', type: 'textarea', max: 2000 }, { id: 'deck', label: 'Deck', max: 60, default: 'General' }],
 fromFields: (values, old) => validate({ ...values, box: old?.box ?? 1, due: old?.due ?? localToday() }),
 search: card => `${card.title} ${card.back} ${card.deck}`,
 describe: card => `${card.deck} · box ${card.box} · next review ${card.due}\n\n${card.back}`,
 summary: deckSummary,
 extend: study,
};
export const mount = (container, feedback) => mountCollection(container, feedback, config);
