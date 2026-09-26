import {test,expect} from '@playwright/test';
import {tools} from '../../src/app/registry.js';
import {plannedTools} from '../../src/app/tool-status.js';
test('home status lists every available tool and keeps planned entries non-launchable',async({page})=>{
 await page.goto('./#tool-status');
 await expect(page.locator('#status-rows tr')).toHaveCount(tools.length+plannedTools.length);
 await expect(page.locator('#status-summary')).toHaveText('51 available · 3 planned · 6 with local saving');
 await page.locator('#status-filter').selectOption('Available');await expect(page.locator('#status-rows tr')).toHaveCount(tools.length);
 for(const tool of tools)await expect(page.locator(`#status-rows a[href="#tool/${tool.id}"]`)).toHaveCount(1);
 await page.locator('#status-filter').selectOption('Planned');await expect(page.locator('#status-rows tr')).toHaveCount(plannedTools.length);await expect(page.locator('#status-rows a')).toHaveCount(0);
 await page.locator('#status-search').fill('does not exist');await expect(page.locator('#status-rows')).toContainText('No tools match');
});
test('status search filters by name/category and open links launch tools',async({page})=>{
 await page.goto('./#tool-status');await page.locator('#status-search').fill('Notes');await expect(page.locator('#status-rows tr')).toHaveCount(1);await expect(page.locator('#status-rows')).toContainText('Saved locally');
 await page.getByRole('link',{name:'Open Notes',exact:true}).click();await expect(page.locator('#tool-title')).toHaveText('Notes');await page.locator('#close').click();
 await page.locator('#status-search').fill('Developer');await expect(page.locator('#status-rows')).toContainText('JSON Formatter');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
