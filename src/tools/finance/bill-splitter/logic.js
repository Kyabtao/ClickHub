import { number, finite } from '../../../lib/validation/numbers.js';
export function splitBill(amount,tip,people){
 amount=number(amount,'Bill amount',0,1e12);tip=number(tip,'Tip percent',0,100);people=number(people,'People',1,1000);
 if(!Number.isInteger(people))throw new Error('People must be a whole number.');
 const tipAmount=amount*tip/100,total=finite(amount+tipAmount),cents=Math.round(total*100),base=Math.floor(cents/people),extra=cents%people;
 return {tip:tipAmount,total:cents/100,baseShare:base/100,higherShare:(base+1)/100,peoplePayingExtraCent:extra,peoplePayingBase:people-extra};
}
