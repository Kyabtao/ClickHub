import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('dashboard and calculator meet automated WCAG A/AA checks in both themes',async({page})=>{
 await page.goto('./');
 for(const theme of ['light','dark']) {
  if(theme==='dark') await page.locator('#theme').click();
  const dashboard=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(dashboard.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
  await page.locator('[data-open="discount-calculator"]').click();
  const dialog=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(dialog.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
  await page.locator('#close').click();
 }
});
