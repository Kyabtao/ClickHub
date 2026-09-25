import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
 testDir: '../e2e',
 use: { launchOptions: process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE, args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-zygote'] } : {}, baseURL: 'http://127.0.0.1:4173/ClickHub/' },
 webServer: { cwd: fileURLToPath(new URL('../../', import.meta.url)), command: 'npm run preview -- --port 4173', url: 'http://127.0.0.1:4173/ClickHub/', reuseExistingServer: false },
 projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }, { name: 'mobile', use: { ...devices['Pixel 7'] } }],
});
