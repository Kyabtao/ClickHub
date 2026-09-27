import { defineConfig } from 'vite';
import pwa from './scripts/build/pwa.mjs';
export default defineConfig({ base: '/ClickHub/', plugins: [pwa()], server: { allowedHosts: ['.e2b.app'] }, preview: { allowedHosts: ['.e2b.app'] } });
