export const MAX_AUDIO_FILE = 25 * 1024 * 1024;
export const MAX_SOURCE_SECONDS = 30 * 60;
export const MAX_OUTPUT_BYTES = 100 * 1024 * 1024;
// Parses seconds ("75.5") or clock time ("1:15.5", "0:01:15").
export function parseTime(value, label) {
 const text = String(value).trim();
 const match = /^(?:(\d+):)?(?:(\d+):)?(\d+(?:\.\d+)?)$/.exec(text);
 if (!match) throw new Error(`${label}: use seconds (75.5) or m:ss (1:15.5).`);
 const parts = text.split(':').map(Number);
 if (parts.slice(1).some(part => part >= 60)) throw new Error(`${label}: minutes and seconds must be below 60.`);
 return parts.reduce((total, part) => total * 60 + part, 0);
}
export function formatTime(seconds) {
 const m = Math.floor(seconds / 60), s = seconds - m * 60;
 return `${m}:${s.toFixed(2).padStart(5, '0')}`;
}
export function trimRange(start, end, duration, sampleRate, channels = 2) {
 if (!(duration > 0) || !(sampleRate > 0)) throw new Error('Audio has no playable duration.');
 if (start < 0 || end <= start) throw new Error('End time must be after start time.');
 if (end > duration + 1e-6) throw new Error(`End time is beyond the audio length (${formatTime(duration)}).`);
 const first = Math.round(start * sampleRate), last = Math.min(Math.round(end * sampleRate), Math.round(duration * sampleRate));
 const frames = last - first;
 if (frames < 1) throw new Error('Selection is too short.');
 if (44 + frames * channels * 2 > MAX_OUTPUT_BYTES) throw new Error('Selection would exceed the 100 MiB WAV limit. Choose a shorter range.');
 return { first, frames };
}
export function applyFades(samples, sampleRate, fadeIn, fadeOut) {
 const inFrames = Math.min(samples.length, Math.round(fadeIn * sampleRate)), outFrames = Math.min(samples.length, Math.round(fadeOut * sampleRate));
 for (let i = 0; i < inFrames; i++) samples[i] *= i / inFrames;
 for (let i = 0; i < outFrames; i++) samples[samples.length - 1 - i] *= i / outFrames;
 return samples;
}
// 16-bit PCM little-endian WAV with interleaved channels.
export function encodeWAV(channels, sampleRate) {
 if (!channels.length || channels.length > 8) throw new Error('WAV export supports 1–8 channels.');
 const frames = channels[0].length, count = channels.length, dataBytes = frames * count * 2;
 const buffer = new ArrayBuffer(44 + dataBytes), view = new DataView(buffer);
 const ascii = (offset, text) => { for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i)); };
 ascii(0, 'RIFF'); view.setUint32(4, 36 + dataBytes, true); ascii(8, 'WAVE'); ascii(12, 'fmt ');
 view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, count, true); view.setUint32(24, sampleRate, true);
 view.setUint32(28, sampleRate * count * 2, true); view.setUint16(32, count * 2, true); view.setUint16(34, 16, true); ascii(36, 'data'); view.setUint32(40, dataBytes, true);
 let offset = 44;
 for (let i = 0; i < frames; i++) for (let c = 0; c < count; c++) {
  const s = Math.max(-1, Math.min(1, channels[c][i] || 0));
  view.setInt16(offset, s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff), true); offset += 2;
 }
 return buffer;
}
// Min/max envelope for drawing a waveform in `buckets` columns.
export function peaks(samples, buckets) {
 const out = [], size = Math.max(1, Math.floor(samples.length / buckets));
 for (let b = 0; b < buckets && b * size < samples.length; b++) {
  let min = 1, max = -1;
  for (let i = b * size, end = Math.min(samples.length, i + size); i < end; i++) { const v = samples[i]; if (v < min) min = v; if (v > max) max = v; }
  out.push([min, max]);
 }
 return out;
}
