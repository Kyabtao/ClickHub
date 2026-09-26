import { requiredText } from '../../../lib/storage/workspace.js';
export const MAX_QUESTIONS = 100, MAX_OPTIONS = 10;
export const FORMAT_HELP = 'One question per block, separated by a blank line. Start the question with “Q:”, then list options with “-” for wrong and “*” for correct. Mark several “*” for multiple-answer questions.';
// Parses the plain-text quiz format into questions; throws with a line number on mistakes.
export function parseQuiz(text) {
 if (typeof text !== 'string' || !text.trim()) throw new Error('Add at least one question.');
 const blocks = [], lines = text.replace(/\r\n?/g, '\n').split('\n');
 let current = null;
 lines.forEach((raw, index) => {
  const line = raw.trim(), number = index + 1;
  if (!line) { current = null; return; }
  let m;
  if ((m = /^q[:.)]\s*(.+)$/i.exec(line))) { current = { prompt: m[1].trim(), options: [], line: number }; blocks.push(current); return; }
  if ((m = /^([-*])\s+(.+)$/.exec(line))) {
   if (!current) throw new Error(`Line ${number}: an option must follow a “Q:” line.`);
   current.options.push({ text: m[2].trim(), correct: m[1] === '*' });
   return;
  }
  if (current && !current.options.length) { current.prompt += `\n${line}`; return; }
  throw new Error(`Line ${number}: start questions with “Q:” and options with “-” or “*”.`);
 });
 if (!blocks.length) throw new Error('Add at least one question starting with “Q:”.');
 if (blocks.length > MAX_QUESTIONS) throw new Error(`A quiz can have at most ${MAX_QUESTIONS} questions.`);
 return blocks.map(block => {
  if (block.options.length < 2) throw new Error(`Question on line ${block.line} needs at least two options.`);
  if (block.options.length > MAX_OPTIONS) throw new Error(`Question on line ${block.line} has more than ${MAX_OPTIONS} options.`);
  if (!block.options.some(option => option.correct)) throw new Error(`Question on line ${block.line} needs at least one correct option marked with “*”.`);
  if (new Set(block.options.map(o => o.text.toLowerCase())).size !== block.options.length) throw new Error(`Question on line ${block.line} repeats an option.`);
  return { prompt: block.prompt, options: block.options, multiple: block.options.filter(o => o.correct).length > 1 };
 });
}
export function validate(record) {
 const title = requiredText(record.title, 'Quiz title');
 const questions = requiredText(record.questions, 'Questions', 20000);
 parseQuiz(questions);
 const attempts = Number(record.attempts ?? 0), best = record.best ?? null;
 if (!Number.isInteger(attempts) || attempts < 0 || attempts > 100000) throw new Error('Invalid attempt count.');
 if (best !== null && !(typeof best === 'number' && best >= 0 && best <= 100)) throw new Error('Invalid best score.');
 return { title, questions, attempts, best };
}
// All-or-nothing per question: the selected set must equal the correct set.
export function scoreQuiz(questions, answers) {
 const results = questions.map((question, index) => {
  const chosen = [...new Set(answers[index] || [])].sort((a, b) => a - b);
  const correct = question.options.map((o, i) => o.correct ? i : -1).filter(i => i >= 0);
  return { chosen, correct, right: chosen.length === correct.length && chosen.every((value, i) => value === correct[i]) };
 });
 const right = results.filter(r => r.right).length;
 return { results, right, total: questions.length, percent: Math.round(right / questions.length * 1000) / 10 };
}
export function shuffled(length, random = Math.random) {
 const order = Array.from({ length }, (_, i) => i);
 for (let i = length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
 return order;
}
