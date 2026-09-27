import { MAX_AUDIO_FILE, MAX_SOURCE_SECONDS, parseTime, formatTime, trimRange, applyFades, encodeWAV, peaks } from './logic.js';
export function mount(container, feedback) {
 let active = true, revision = 0, audio = null, outputURL = null;
 container.innerHTML = '<label class="field-label" for="audio-file">Audio file (MP3, WAV, OGG, M4A, etc.; up to 25 MiB)</label><input id="audio-file" type="file" accept="audio/*,.mp3,.wav,.ogg,.oga,.m4a,.aac,.flac,.webm"><p id="audio-info">No audio loaded.</p><canvas id="audio-wave" class="audio-wave" width="640" height="120" hidden role="img" aria-label="Waveform with selected range highlighted"></canvas><div class="unit-pair"><div><label class="field-label" for="audio-start">Start (seconds or m:ss)</label><input id="audio-start" type="text" inputmode="decimal" value="0"></div><div><label class="field-label" for="audio-end">End (seconds or m:ss)</label><input id="audio-end" type="text" inputmode="decimal"></div></div><div class="unit-pair"><div><label class="field-label" for="audio-fade-in">Fade in (seconds)</label><input id="audio-fade-in" type="number" min="0" max="30" step="0.1" value="0"></div><div><label class="field-label" for="audio-fade-out">Fade out (seconds)</label><input id="audio-fade-out" type="number" min="0" max="30" step="0.1" value="0"></div></div><p>Decoding uses your browser’s audio support, so available formats vary. Output is an uncompressed 16-bit WAV at the decoded sample rate; metadata and cover art are not kept. Source audio is limited to 30 minutes; output to 100 MiB.</p><div class="actions"><button id="process-audio" class="primary" disabled>Trim audio</button><a id="download-audio" hidden>Download WAV</a></div><audio id="audio-preview" controls hidden></audio>';
 const $ = selector => container.querySelector(selector);
 const canvas = $('#audio-wave');
 function clearOutput() { revision++; if (outputURL) URL.revokeObjectURL(outputURL); outputURL = null; $('#download-audio').hidden = true; $('#download-audio').removeAttribute('href'); const player = $('#audio-preview'); player.pause(); player.removeAttribute('src'); player.hidden = true; }
 function range() {
  const start = parseTime($('#audio-start').value, 'Start'), end = parseTime($('#audio-end').value, 'End');
  const fadeIn = Number($('#audio-fade-in').value), fadeOut = Number($('#audio-fade-out').value);
  if (![fadeIn, fadeOut].every(v => Number.isFinite(v) && v >= 0 && v <= 30)) throw new Error('Fades must be between 0 and 30 seconds.');
  if (fadeIn + fadeOut > end - start + 1e-9) throw new Error('Fades are longer than the selection.');
  return { start, end, fadeIn, fadeOut, ...trimRange(start, end, audio.duration, audio.sampleRate, audio.numberOfChannels) };
 }
 function draw() {
  if (!audio) return;
  const context = canvas.getContext('2d'), { width, height } = canvas;
  const styles = getComputedStyle(container), ink = styles.getPropertyValue('--ink').trim() || '#252b29', muted = styles.getPropertyValue('--muted').trim() || '#626c64';
  context.clearRect(0, 0, width, height);
  let selection = null; try { selection = range(); } catch { /* invalid input is reported on submit */ }
  if (selection) { context.fillStyle = 'rgba(142,179,78,0.35)'; context.fillRect(selection.start / audio.duration * width, 0, (selection.end - selection.start) / audio.duration * width, height); }
  const data = peaks(audio.getChannelData(0), width);
  context.fillStyle = selection ? ink : muted;
  data.forEach(([min, max], x) => { const top = (1 - max) / 2 * height, bottom = (1 - min) / 2 * height; context.fillRect(x, top, 1, Math.max(1, bottom - top)); });
 }
 function ready(value) { container.querySelectorAll('input:not(#audio-file),#process-audio').forEach(el => el.disabled = !value); }
 $('#audio-file').onchange = async () => {
  clearOutput(); const current = revision; audio = null; ready(false); canvas.hidden = true; feedback.textContent = ''; $('#audio-info').textContent = 'Decoding…';
  let context;
  try {
   const file = $('#audio-file').files[0];
   if (!file) { $('#audio-info').textContent = 'No audio loaded.'; return; }
   if (file.size > MAX_AUDIO_FILE) throw new Error('Audio file must be no larger than 25 MiB.');
   const Context = window.AudioContext || window.webkitAudioContext;
   if (!Context) throw new Error('This browser does not support audio decoding.');
   context = new Context();
   let decoded;
   try { decoded = await context.decodeAudioData(await file.arrayBuffer()); } catch { throw new Error('This file could not be decoded. Try another format such as WAV or MP3.'); }
   if (!active || revision !== current) return;
   if (decoded.duration > MAX_SOURCE_SECONDS) throw new Error('Audio longer than 30 minutes is not supported.');
   audio = decoded;
   $('#audio-info').textContent = `Length ${formatTime(audio.duration)} · ${audio.numberOfChannels} channel${audio.numberOfChannels === 1 ? '' : 's'} · ${audio.sampleRate.toLocaleString()} Hz`;
   $('#audio-start').value = '0'; $('#audio-end').value = audio.duration.toFixed(2);
   canvas.hidden = false; ready(true); draw(); feedback.textContent = 'Audio loaded. Set the start and end, then trim.';
  } catch (error) { if (active && revision === current) { $('#audio-info').textContent = 'No audio loaded.'; feedback.textContent = error.message; } }
  finally { context?.close?.(); }
 };
 container.oninput = event => { if (event.target.id !== 'audio-file' && audio) { clearOutput(); feedback.textContent = ''; draw(); } };
 $('#process-audio').onclick = () => {
  clearOutput();
  if (!audio) { feedback.textContent = 'Choose an audio file first.'; return; }
  try {
   const selection = range();
   const channels = Array.from({ length: audio.numberOfChannels }, (_, c) => applyFades(audio.getChannelData(c).slice(selection.first, selection.first + selection.frames), audio.sampleRate, selection.fadeIn, selection.fadeOut));
   const blob = new Blob([encodeWAV(channels, audio.sampleRate)], { type: 'audio/wav' });
   outputURL = URL.createObjectURL(blob);
   const link = $('#download-audio'); link.href = outputURL; link.download = 'clickhub-trim.wav'; link.hidden = false;
   const player = $('#audio-preview'); player.src = outputURL; player.hidden = false;
   feedback.textContent = `Ready: ${formatTime(selection.frames / audio.sampleRate)} of audio, ${blob.size.toLocaleString()} bytes.`;
  } catch (error) { feedback.textContent = error.message; }
 };
 ready(false);
 return () => { active = false; revision++; clearOutput(); audio = null; };
}
