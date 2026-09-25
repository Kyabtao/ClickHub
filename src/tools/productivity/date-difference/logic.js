function day(value){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new Error('Use dates in YYYY-MM-DD format.');
 const date=new Date(value+'T00:00:00Z');
 if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)throw new Error('Enter a valid calendar date.');
 return date.getTime()/86400000;
}
export function dateDifference(start,end,inclusive){
 const difference=day(end)-day(start);
 if(difference<0)throw new Error('End date must be on or after start date.');
 const days=difference+(inclusive==='yes'?1:0);
 return {days,weeks:Math.floor(days/7),remainingDays:days%7};
}
