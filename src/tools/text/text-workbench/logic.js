export function stats(text) { return { words: text.trim() ? text.trim().split(/\s+/u).length : 0, characters: text.length, lines: text ? text.split('\n').length : 0 }; }
export function transform(text, mode) {
 if (mode === 'upper') return text.toUpperCase();
 if (mode === 'lower') return text.toLowerCase();
 if (mode === 'clean') return text.split('\n').map(line => line.trim().replace(/[\t ]+/g, ' ')).join('\n').trim();
 if (mode === 'unique') return [...new Set(text.split('\n'))].join('\n');
 return text;
}
