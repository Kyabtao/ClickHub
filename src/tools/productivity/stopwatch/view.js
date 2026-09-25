import { stopwatch,formatDuration } from '../../../lib/time/clock.js';
export function mount(container,feedback) {
 container.innerHTML='<p>Elapsed time uses the browser monotonic clock, not interval counts. Closing this tool resets it. Device sleep behavior varies; this is not a precision measurement instrument.</p><div id="stopwatch-display" class="timer-display" role="timer" aria-label="Elapsed time">00:00.00</div><div class="actions"><button id="stopwatch-start" class="primary">Start</button><button id="stopwatch-pause" disabled>Pause</button><button id="stopwatch-lap" disabled>Lap</button><button id="stopwatch-reset">Reset</button></div><h3>Laps (up to 100)</h3><ol id="stopwatch-laps"></ol>';
 const $=selector=>container.querySelector(selector),clock=stopwatch();let laps=0;
 function render(){$('#stopwatch-display').textContent=formatDuration(clock.value(),true);$('#stopwatch-start').disabled=clock.running;$('#stopwatch-pause').disabled=!clock.running;$('#stopwatch-lap').disabled=!clock.running||laps>=100;}
 $('#stopwatch-start').onclick=()=>{clock.start();render();feedback.textContent='Stopwatch running.';};
 $('#stopwatch-pause').onclick=()=>{clock.pause();render();feedback.textContent='Stopwatch paused.';};
 $('#stopwatch-lap').onclick=()=>{if(laps>=100)return;laps++;const item=document.createElement('li');item.textContent=`Lap ${laps}: ${formatDuration(clock.value(),true)} total elapsed`;$('#stopwatch-laps').prepend(item);render();feedback.textContent=`Lap ${laps} recorded.`;};
 $('#stopwatch-reset').onclick=()=>{clock.reset();laps=0;$('#stopwatch-laps').replaceChildren();render();feedback.textContent='Stopwatch reset.';};
 const interval=setInterval(render,50);return ()=>clearInterval(interval);
}
