import { countdown,formatDuration,durationMinutes } from '../../../lib/time/clock.js';
export function mount(container,feedback) {
 container.innerHTML='<div class="unit-pair"><div><label class="field-label" for="focus-minutes">Focus minutes (1–180)</label><input id="focus-minutes" type="number" min="1" max="180" step="1" value="25"></div><div><label class="field-label" for="break-minutes">Break minutes (1–180)</label><input id="break-minutes" type="number" min="1" max="180" step="1" value="5"></div></div><label class="field-label" for="timer-mode">Session</label><select id="timer-mode"><option value="focus">Focus</option><option value="break">Break</option></select><p>Sessions do not advance automatically. Closing this tool discards the timer. Updates may pause while the browser sleeps; remaining time is recalculated from the clock when it resumes. No background notifications or sound.</p><div id="pomodoro-display" class="timer-display" role="timer" aria-label="Time remaining">25:00</div><div class="actions"><button id="pomodoro-start" class="primary">Start</button><button id="pomodoro-pause" disabled>Pause</button><button id="pomodoro-reset">Reset</button></div>';
 const $=selector=>container.querySelector(selector),clock=countdown(25*60000);let valid=true;
 const settings=['#focus-minutes','#break-minutes','#timer-mode'];
 function render(){
  if(clock.running&&clock.value()<=0){clock.pause();feedback.textContent=`${$('#timer-mode').value==='focus'?'Focus':'Break'} session complete. Choose your next session and reset to start again.`;}
  $('#pomodoro-display').textContent=valid?formatDuration(Math.ceil(clock.value()/1000)*1000):'--:--';
  $('#pomodoro-start').disabled=clock.running||!valid||clock.value()<=0;$('#pomodoro-pause').disabled=!clock.running;
  for(const key of settings)$(key).disabled=clock.running;
 }
 function reset(){try{clock.reset(durationMinutes($(`#${$('#timer-mode').value}-minutes`).value));valid=true;feedback.textContent='Timer reset.';}catch(error){clock.pause();valid=false;feedback.textContent=error.message;}render();}
 for(const key of settings)$(key).onchange=reset;
 $('#pomodoro-start').onclick=()=>{try{durationMinutes($(`#${$('#timer-mode').value}-minutes`).value);clock.start();feedback.textContent='Session running.';render();}catch(error){feedback.textContent=error.message;}};
 $('#pomodoro-pause').onclick=()=>{clock.pause();feedback.textContent='Session paused.';render();};
 $('#pomodoro-reset').onclick=reset;
 const interval=setInterval(render,200);render();return ()=>clearInterval(interval);
}
