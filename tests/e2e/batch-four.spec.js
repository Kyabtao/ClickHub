import { test, expect } from '@playwright/test';
const token = `${Buffer.from('{"alg":"none"}').toString('base64url')}.${Buffer.from('{"sub":"example"}').toString('base64url')}.`;
const cases=[
 ['csv-json', 'name,value\na,"b,c"', /"b,c"/, '"unclosed'],
 ['jwt-inspector', token, /NOT VERIFIED/, 'not-a-jwt'],
 ['slug-generator', 'Hello, World!', /hello-world/, null],
 ['contrast-checker', null, /21.00:1/, null],
 ['date-difference', null, /"days": 7/, null],
 ['statistics-calculator', '1, 2, 3', /mean: 2/, 'not numbers'],
 ['resistor-calculator', null, /"ohms": 1000/, null],
 ['bill-splitter', null, /Total: 110.00/, null],
 ['recipe-scaler', '200 g flour\n0.5 tsp salt', /400 g flour\n1 tsp salt/, '1/2 cup sugar'],
 ['morse-translator', 'SOS', /\.\.\. --- \.\.\./, 'Unsupported!'],
];
for(const [id,input,expected,bad] of cases)test(`${id} runs locally and supports deep-link reload`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`./#tool/${id}`);await page.reload();
 const requests=[];page.on('request',r=>requests.push(r.url()));
 if(input!==null)await page.locator('#input').fill(input);
 await page.locator('#run-tool').click();
 await expect(page.locator('#result')).toHaveValue(expected);
 expect(requests).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(bad!==null){await page.locator('#input').fill(bad);await page.locator('#run-tool').click();await expect(page.locator('#result')).toHaveValue('');await expect(page.locator('#feedback')).not.toHaveText('Result ready.');}
 expect(errors).toEqual([]);
});
test('bidirectional CSV and Morse conversion',async({page})=>{
 await page.goto('./#tool/csv-json');
 await page.locator('#input').fill('a,"b,c"');await page.locator('#run-tool').click();
 const json=await page.locator('#result').inputValue();
 await page.locator('#mode').selectOption('csv');await page.locator('#input').fill(json);await page.locator('#run-tool').click();
 await expect(page.locator('#result')).toHaveValue('a,"b,c"');
 await page.locator('#close').click();await page.locator('[data-open="morse-translator"]').click();
 await page.locator('#mode').selectOption('decode');await page.locator('#input').fill('... --- ... / .----');await page.locator('#run-tool').click();
 await expect(page.locator('#result')).toHaveValue('SOS 1');
});
