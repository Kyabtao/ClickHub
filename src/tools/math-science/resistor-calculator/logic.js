export const bands=['Black','Brown','Red','Orange','Yellow','Green','Blue','Violet','Gray','White'];
export const multipliers={Black:1,Brown:10,Red:100,Orange:1000,Yellow:10000,Green:100000,Blue:1000000,Violet:10000000,Gray:100000000,White:1000000000,Gold:0.1,Silver:0.01};
export const tolerances={Brown:1,Red:2,Green:0.5,Blue:0.25,Violet:0.1,Gray:0.05,Gold:5,Silver:10};
export function resistor(first,second,multiplier,tolerance){
 const a=bands.indexOf(first),b=bands.indexOf(second);
 if(a<1||b<0||!Object.hasOwn(multipliers,multiplier)||!Object.hasOwn(tolerances,tolerance))throw new Error('Select valid four-band resistor colors; first digit cannot be black.');
 const ohms=(a*10+b)*multipliers[multiplier],percent=tolerances[tolerance];
 return {ohms,tolerance:percent,min:ohms*(1-percent/100),max:ohms*(1+percent/100)};
}
