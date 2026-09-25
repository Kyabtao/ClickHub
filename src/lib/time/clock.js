export function formatDuration(ms, fractions=false) {
 const total=Math.max(0,Math.floor(ms/(fractions?10:1000)));
 const seconds=fractions?Math.floor(total/100):total;
 const h=Math.floor(seconds/3600),m=Math.floor(seconds/60)%60,s=seconds%60;
 return `${h?String(h).padStart(2,'0')+':':''}${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}${fractions?'.'+String(total%100).padStart(2,'0'):''}`;
}
export function durationMinutes(value) {
 const n=Number(value);if(!Number.isInteger(n)||n<1||n>180)throw new Error('Duration must be a whole number from 1 to 180 minutes.');return n*60000;
}
export function stopwatch(now=()=>performance.now()) {
 let elapsed=0,started=null;
 return { get running(){return started!==null;}, value(){return elapsed+(started===null?0:Math.max(0,now()-started));},start(){if(started===null)started=now();},pause(){elapsed=this.value();started=null;},reset(){elapsed=0;started=null;} };
}
export function countdown(duration,now=()=>Date.now()) {
 let remaining=duration,deadline=null;
 return {get running(){return deadline!==null;},value(){return deadline===null?remaining:Math.max(0,deadline-now());},start(){if(deadline===null&&remaining>0)deadline=now()+remaining;},pause(){remaining=this.value();deadline=null;},reset(next=duration){remaining=next;deadline=null;}};
}
