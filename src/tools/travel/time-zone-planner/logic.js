export const DEFAULT_ZONES = ['UTC', 'America/Los_Angeles', 'America/New_York', 'Europe/London', 'Asia/Kolkata', 'Asia/Tokyo'];
const formatters = new Map();
function formatter(zone) {
 if (!formatters.has(zone)) {
  try {
   formatters.set(zone, new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short' }));
  } catch { throw new Error(`Unknown time zone: ${zone}. Use an IANA name such as Europe/Paris.`); }
 }
 return formatters.get(zone);
}
export function validZone(zone) {
 if (typeof zone !== 'string' || !zone.trim()) throw new Error('Time zone is required.');
 const name = zone.trim();
 return formatter(name).resolvedOptions().timeZone && name;
}
export function wallTime(ms, zone) {
 const parts = Object.fromEntries(formatter(zone).formatToParts(new Date(ms)).map(p => [p.type, p.value]));
 return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day), hour: Number(parts.hour), minute: Number(parts.minute), second: Number(parts.second), weekday: parts.weekday };
}
export function offsetMinutes(ms, zone) {
 const w = wallTime(ms, zone);
 return Math.round((Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second) - Math.floor(ms / 1000) * 1000) / 60000);
}
export function formatOffset(minutes) {
 const sign = minutes < 0 ? '−' : '+', abs = Math.abs(minutes);
 return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}
// Converts a local wall-clock time to instants. DST gaps return [], overlaps return two instants.
export function zonedInstants(date, time, zone) {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Use a date in YYYY-MM-DD format.');
 if (!/^\d{2}:\d{2}$/.test(time)) throw new Error('Use a time in HH:MM format.');
 const [y, mo, d] = date.split('-').map(Number), [h, mi] = time.split(':').map(Number);
 const guess = Date.UTC(y, mo - 1, d, h, mi);
 const check = new Date(guess);
 if (!Number.isFinite(guess) || check.getUTCDate() !== d || check.getUTCMonth() !== mo - 1 || h > 23 || mi > 59) throw new Error('Enter a valid calendar date and time.');
 validZone(zone);
 const candidates = new Set([-86400000, 0, 86400000].map(delta => guess - offsetMinutes(guess + delta, zone) * 60000));
 return [...candidates].filter(ms => { const w = wallTime(ms, zone); return w.year === y && w.month === mo && w.day === d && w.hour === h && w.minute === mi; }).sort((a, b) => a - b);
}
export function planMeeting(date, time, sourceZone, zones, workStart = 9, workEnd = 17) {
 const list = [...new Set(zones.map(z => z.trim()).filter(Boolean))];
 if (!list.length) throw new Error('Add at least one time zone to compare.');
 if (list.length > 30) throw new Error('Compare at most 30 time zones.');
 list.forEach(validZone);
 const instants = zonedInstants(date, time, sourceZone.trim());
 if (!instants.length) throw new Error(`${time} does not exist on ${date} in ${sourceZone.trim()} (daylight-saving clock change). Choose another time.`);
 const instant = instants[0];
 const sourceDay = Date.UTC(...date.split('-').map((v, i) => Number(v) - (i === 1 ? 1 : 0)));
 const rows = list.map(zone => {
  const w = wallTime(instant, zone), offset = offsetMinutes(instant, zone);
  const dayShift = Math.round((Date.UTC(w.year, w.month - 1, w.day) - sourceDay) / 86400000);
  const minutes = w.hour * 60 + w.minute;
  return { zone, date: `${w.year}-${String(w.month).padStart(2, '0')}-${String(w.day).padStart(2, '0')}`, time: `${String(w.hour).padStart(2, '0')}:${String(w.minute).padStart(2, '0')}`, weekday: w.weekday, offset: formatOffset(offset), dayShift, working: minutes >= workStart * 60 && minutes < workEnd * 60 && !['Sat', 'Sun'].includes(w.weekday) };
 });
 return { utc: new Date(instant).toISOString(), ambiguous: instants.length > 1, rows };
}
export function describePlan(plan) {
 const lines = [`UTC instant: ${plan.utc}`];
 if (plan.ambiguous) lines.push('Note: this local time occurs twice (clocks go back). The earlier occurrence is shown.');
 for (const row of plan.rows) lines.push(`${row.zone}: ${row.weekday} ${row.date} ${row.time} (${row.offset})${row.dayShift ? ` ${row.dayShift > 0 ? '+' : ''}${row.dayShift} day` : ''} · ${row.working ? 'working hours' : 'outside 09:00–17:00 Mon–Fri'}`);
 return lines.join('\n');
}
export function availableZones() {
 try { return Intl.supportedValuesOf('timeZone'); } catch { return DEFAULT_ZONES; }
}
