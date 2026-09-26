export const MAX_REGEX_TEXT = 200000;
export const MAX_MATCHES = 1000;
export function buildRegex(pattern, flags) {
 if (typeof pattern !== 'string' || pattern === '') throw new Error('Enter a regular expression pattern.');
 if (pattern.length > 2000) throw new Error('Pattern limit: 2,000 characters.');
 if (!/^[dgimsuvy]*$/.test(flags)) throw new Error('Flags may only include d, g, i, m, s, u, v, and y.');
 if (new Set(flags).size !== flags.length) throw new Error('Each flag may appear only once.');
 try { return new RegExp(pattern, flags); } catch (error) { throw new Error(`Invalid pattern: ${error.message}`); }
}
export function testRegex(pattern, flags, text, replacement = null) {
 if (typeof text !== 'string') throw new Error('Test text is required.');
 if (text.length > MAX_REGEX_TEXT) throw new Error(`Test text limit: ${MAX_REGEX_TEXT.toLocaleString('en-US')} characters.`);
 const source = buildRegex(pattern, flags);
 // Always scan globally for the match list; the user's flags still govern the replacement preview.
 const scan = new RegExp(source.source, source.flags.includes('g') ? source.flags : source.flags + 'g');
 const matches = [];
 let truncated = false, match;
 while ((match = scan.exec(text)) !== null) {
  if (matches.length === MAX_MATCHES) { truncated = true; break; }
  matches.push({ index: match.index, end: match.index + match[0].length, value: match[0], groups: match.slice(1).map(group => group ?? null), named: match.groups ? { ...match.groups } : null });
  if (match[0] === '') scan.lastIndex += source.unicode || source.unicodeSets ? (text.codePointAt(scan.lastIndex) > 0xffff ? 2 : 1) : 1;
  if (!source.global) break;
 }
 const result = { flags: source.flags, count: matches.length, truncated, matches };
 if (replacement !== null) result.replaced = text.replace(source, replacement);
 return result;
}
export function describeMatches(result) {
 if (!result.count) return 'No matches.';
 const lines = [`${result.count}${result.truncated ? '+' : ''} match${result.count === 1 ? '' : 'es'}${result.truncated ? ` (showing first ${MAX_MATCHES})` : ''}${result.flags.includes('g') ? '' : ' · first match only (add the g flag to find all)'}`];
 result.matches.forEach((match, number) => {
  lines.push(`#${number + 1} [${match.index}–${match.end}] ${JSON.stringify(match.value)}`);
  match.groups.forEach((group, index) => lines.push(`   group ${index + 1}: ${group === null ? '(not matched)' : JSON.stringify(group)}`));
  if (match.named) for (const [name, value] of Object.entries(match.named)) lines.push(`   ${name}: ${value === undefined ? '(not matched)' : JSON.stringify(value)}`);
 });
 return lines.join('\n');
}
