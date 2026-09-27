import { mountCollection } from '../../../components/workspace/collection.js';
import { validate, parseQuiz, scoreQuiz, shuffled, FORMAT_HELP } from './logic.js';
const SAMPLE = 'Q: What is the capital of Japan?\n- Osaka\n* Tokyo\n- Kyoto\n\nQ: Which of these are prime numbers?\n* 2\n* 7\n- 9\n- 15';
function player({ panel, records, commit, message, fail }) {
 let quiz = null, order = [], optionOrders = [], submitted = false;
 panel.className = 'study-panel';
 panel.innerHTML = `<h3>Take a quiz</h3><label class="field-label" for="quiz-select">Quiz</label><select id="quiz-select"></select><label class="check-label"><input id="quiz-shuffle" type="checkbox"> Shuffle questions and options</label><div class="actions"><button id="quiz-start" type="button" class="primary">Start quiz</button></div><p id="quiz-status" role="status"></p><form id="quiz-form" hidden novalidate><div id="quiz-questions"></div><div class="actions"><button id="quiz-submit" type="submit" class="primary">Submit answers</button><button id="quiz-retry" type="button" hidden>Try again</button></div></form><details class="quiz-help"><summary>Question format</summary><p>${FORMAT_HELP}</p><pre>${SAMPLE.replace(/</g, '&lt;')}</pre></details>`;
 const $ = selector => panel.querySelector(selector);
 function refresh(list) {
  const select = $('#quiz-select'), previous = select.value;
  select.replaceChildren();
  for (const record of list) { const option = document.createElement('option'); option.value = record.id; option.textContent = `${record.title}${record.best !== null ? ` (best ${record.best}%)` : ''}`; select.append(option); }
  if (list.some(r => r.id === previous)) select.value = previous;
  $('#quiz-start').disabled = !list.length;
  if (!list.length) { $('#quiz-status').textContent = 'Save a quiz below to take it here.'; $('#quiz-form').hidden = true; quiz = null; }
  else if (quiz && !list.some(r => r.id === quiz.id)) { quiz = null; $('#quiz-form').hidden = true; $('#quiz-status').textContent = 'That quiz was deleted.'; }
 }
 function render() {
  const container = $('#quiz-questions'); container.replaceChildren();
  order.forEach((qIndex, position) => {
   const question = quiz.questions[qIndex], fieldset = document.createElement('fieldset'), legend = document.createElement('legend');
   fieldset.className = 'quiz-question'; legend.textContent = `${position + 1}. ${question.prompt}${question.multiple ? ' (choose all that apply)' : ''}`; fieldset.append(legend);
   for (const oIndex of optionOrders[qIndex]) {
    const label = document.createElement('label'), input = document.createElement('input');
    label.className = 'check-label'; input.type = question.multiple ? 'checkbox' : 'radio'; input.name = `quiz-q${qIndex}`; input.value = String(oIndex);
    label.append(input, ` ${question.options[oIndex].text}`); fieldset.append(label);
   }
   const result = document.createElement('p'); result.className = 'quiz-result'; result.hidden = true; fieldset.append(result);
   container.append(fieldset);
  });
 }
 $('#quiz-start').onclick = () => {
  const record = records().find(r => r.id === $('#quiz-select').value);
  if (!record) return;
  try {
   const questions = parseQuiz(record.questions), shuffle = $('#quiz-shuffle').checked;
   quiz = { id: record.id, title: record.title, questions };
   order = shuffle ? shuffled(questions.length) : questions.map((_, i) => i);
   optionOrders = questions.map(q => shuffle ? shuffled(q.options.length) : q.options.map((_, i) => i));
   submitted = false; render(); $('#quiz-form').hidden = false; $('#quiz-submit').hidden = false; $('#quiz-retry').hidden = true;
   $('#quiz-status').textContent = `${record.title}: ${questions.length} question${questions.length === 1 ? '' : 's'}.`;
   panel.querySelector('#quiz-questions input')?.focus();
  } catch (error) { fail(error); }
 };
 $('#quiz-form').onsubmit = event => {
  event.preventDefault();
  if (!quiz || submitted) return;
  const answers = quiz.questions.map((_, qIndex) => [...panel.querySelectorAll(`[name="quiz-q${qIndex}"]:checked`)].map(input => Number(input.value)));
  const unanswered = answers.filter(a => !a.length).length;
  if (unanswered && !confirm(`${unanswered} question${unanswered === 1 ? ' is' : 's are'} unanswered and will be marked wrong. Submit anyway?`)) return;
  const score = scoreQuiz(quiz.questions, answers);
  submitted = true;
  panel.querySelectorAll('#quiz-questions input').forEach(input => { input.disabled = true; });
  panel.querySelectorAll('.quiz-question').forEach((fieldset, position) => {
   const qIndex = order[position], question = quiz.questions[qIndex], result = score.results[qIndex], line = fieldset.querySelector('.quiz-result');
   fieldset.classList.add(result.right ? 'quiz-right' : 'quiz-wrong');
   line.textContent = result.right ? '✓ Correct' : `✗ Correct answer${result.correct.length > 1 ? 's' : ''}: ${result.correct.map(i => question.options[i].text).join(', ')}`;
   line.hidden = false;
  });
  $('#quiz-submit').hidden = true; $('#quiz-retry').hidden = false;
  $('#quiz-status').textContent = `Score: ${score.right} of ${score.total} (${score.percent}%).`;
  try {
   const id = quiz.id;
   commit(records().map(r => r.id === id ? { ...r, attempts: r.attempts + 1, best: r.best === null ? score.percent : Math.max(r.best, score.percent) } : r));
   message(`Score: ${score.right} of ${score.total} (${score.percent}%). Attempt saved.`);
  } catch (error) { fail(error); }
  $('#quiz-retry').focus();
 };
 $('#quiz-retry').onclick = () => $('#quiz-start').click();
 return { refresh };
}
export const config = {
 id: 'quiz-builder', name: 'quizzes', validate,
 fields: [{ id: 'title', label: 'Quiz title', max: 200 }, { id: 'questions', label: 'Questions (see “Question format” above)', type: 'textarea', max: 20000, default: SAMPLE }],
 // Editing the questions resets the best score, because the old score no longer applies.
 fromFields: (values, old) => validate({ ...values, attempts: old && old.questions === values.questions ? old.attempts : 0, best: old && old.questions === values.questions ? old.best : null }),
 search: r => `${r.title} ${r.questions}`,
 describe: r => { let count = '?'; try { count = parseQuiz(r.questions).length; } catch { /* validated on save */ } return `${count} question${count === 1 ? '' : 's'} · ${r.attempts} attempt${r.attempts === 1 ? '' : 's'}${r.best !== null ? ` · best ${r.best}%` : ''}`; },
 summary: rows => `${rows.length} quiz${rows.length === 1 ? '' : 'zes'} saved`,
 extend: player,
};
export const mount = (container, feedback) => mountCollection(container, feedback, config);
