export function formatJSON(text, compact = false) { return JSON.stringify(JSON.parse(text), null, compact ? undefined : 2); }
