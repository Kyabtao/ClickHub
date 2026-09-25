export function load(key, fallback) { try { const value = JSON.parse(localStorage.getItem(`clickhub:${key}`)); return value ?? fallback; } catch { return fallback; } }
export function save(key, value) { try { localStorage.setItem(`clickhub:${key}`, JSON.stringify(value)); return true; } catch { return false; } }
