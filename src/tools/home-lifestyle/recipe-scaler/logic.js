import { number, finite } from '../../../lib/validation/numbers.js';
export function scaleRecipe(text,original,target){
 original=number(original,'Original servings',0.01,10000);target=number(target,'Target servings',0.01,10000);
 const lines=text.trim().split('\n');
 if(!text.trim()||lines.length>200)throw new Error('Enter 1–200 ingredient lines.');
 return lines.map((line,i)=>{
 const match=line.trim().match(/^(\d+(?:\.\d+)?|\.\d+)\s+(.+)$/);
 if(!match)throw new Error(`Line ${i+1}: start with a decimal quantity, then unit and ingredient.`);
 const quantity=number(match[1],'Ingredient quantity',0,1e9);
 return {quantity:finite(quantity*target/original),ingredient:match[2]};
 });
}
