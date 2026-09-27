import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import { precacheEntries, versionOf, renderServiceWorker } from '../../scripts/build/pwa.mjs';
import { mountOffline, OFFLINE_MESSAGES } from '../../src/app/offline.js';
const template = readFileSync('src/sw/service-worker.js', 'utf8');
function loadWorker(precache) {
 const listeners = {};
 const self = { location: new URL('https://site.test/ClickHub/sw.js'), registration: { scope: 'https://site.test/ClickHub/' }, addEventListener: (type, fn) => { listeners[type] = fn; } };
 vm.runInNewContext(renderServiceWorker(template, { appVersion: 'abc123', ocrVersion: 'ocr9', precache }), { self, URL, Set, caches: {}, fetch: () => {}, Request: class {} });
 return { api: self.__clickhub, listeners };
}
const req = (url, init = {}) => ({ url, method: 'GET', mode: 'no-cors', ...init });
test('precache list covers app files and skips OCR data, maps, dotfiles, and the worker itself', () => {
 const files = ['index.html', 'sw.js', 'assets/index-1.js', 'assets/index-1.js.map', 'ocr/worker.min.js', 'ocr/lang/eng.traineddata.gz', 'icons/icon.svg', 'fonts/.gitkeep', 'manifest.webmanifest', 'licenses/pako.txt'];
 assert.deepEqual(precacheEntries(files, '/ClickHub/'), ['/ClickHub/assets/index-1.js', '/ClickHub/icons/icon.svg', '/ClickHub/index.html', '/ClickHub/licenses/pako.txt', '/ClickHub/manifest.webmanifest']);
});
test('versions change with file content and the template must contain every placeholder', () => {
 const a = versionOf([['/a.js', 'one']]), b = versionOf([['/a.js', 'two']]);
 assert.match(a, /^[0-9a-f]{12}$/); assert.notEqual(a, b); assert.equal(a, versionOf([['/a.js', 'one']]));
 assert.notEqual(versionOf([['/a', 'bc']]), versionOf([['/ab', 'c']]));
 assert.throws(() => renderServiceWorker('const x = 1;', { appVersion: 'a', ocrVersion: 'b', precache: [] }), /missing __APP_VERSION__/);
});
test('service worker routes the shell, precached files, and OCR assets, and ignores everything else', () => {
 const { api, listeners } = loadWorker(['/ClickHub/index.html', '/ClickHub/assets/app.js']);
 assert.deepEqual(Object.keys(listeners).sort(), ['activate', 'fetch', 'install', 'message']);
 assert.equal(api.APP_CACHE, 'clickhub-app-abc123'); assert.equal(api.OCR_CACHE, 'clickhub-ocr-ocr9'); assert.equal(api.SCOPE, '/ClickHub/');
 assert.equal(api.route(req('https://site.test/ClickHub/', { mode: 'navigate' })), 'shell');
 assert.equal(api.route(req('https://site.test/ClickHub/?utm=1', { mode: 'navigate' })), 'shell');
 assert.equal(api.route(req('https://site.test/ClickHub/index.html', { mode: 'navigate' })), 'shell');
 assert.equal(api.route(req('https://site.test/ClickHub/assets/app.js')), 'precache');
 assert.equal(api.route(req('https://site.test/ClickHub/ocr/lang/eng.traineddata.gz')), 'ocr');
 assert.equal(api.route(req('https://site.test/ClickHub/licenses/unknown.txt', { mode: 'navigate' })), null);
 assert.equal(api.route(req('https://site.test/ClickHub/assets/other.js')), null);
 assert.equal(api.route(req('https://site.test/Other/assets/app.js')), null);
 assert.equal(api.route(req('https://cdn.example/ClickHub/assets/app.js')), null);
 assert.equal(api.route(req('https://site.test/ClickHub/assets/app.js', { method: 'POST' })), null);
});
test('the web manifest and its icons are valid', () => {
 const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));
 assert.equal(manifest.start_url, './'); assert.equal(manifest.scope, './'); assert.equal(manifest.display, 'standalone');
 assert.ok(manifest.icons.some(i => i.sizes === '192x192') && manifest.icons.some(i => i.sizes === '512x512') && manifest.icons.some(i => i.purpose === 'maskable'));
 for (const icon of manifest.icons) {
  const file = `public/${icon.src}`; assert.ok(existsSync(file), file);
  if (icon.type === 'image/png') { const png = readFileSync(file); assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes, file); }
 }
 assert.match(readFileSync('index.html', 'utf8'), /rel="manifest" href="\/manifest.webmanifest"/);
});
// Minimal fakes for the page-side registration logic.
class Emitter { constructor() { this.l = {}; } addEventListener(t, f) { (this.l[t] ||= []).push(f); } emit(t) { for (const f of this.l[t] || []) f(); } }
function el() { return { hidden: true, textContent: '', children: [], replaceChildren(...c) { this.children = c; }, append(...c) { this.children.push(...c); } }; }
function setup({ controller = null, onLine = true } = {}) {
 const win = new Emitter(); win.navigator = { onLine }; win.isSecureContext = true; win.location = { reloads: 0, reload() { this.reloads++; } }; win.document = new Emitter(); win.document.visibilityState = 'visible';
 const registration = new Emitter(); registration.update = async () => {};
 const sw = new Emitter(); sw.controller = controller; sw.register = async (url, options) => { sw.registered = [url, options]; return registration; };
 const notice = el(), banner = el();
 globalThis.document = { createElement: () => ({}) };
 return { win, sw, registration, notice, banner, mount: (extra = {}) => mountOffline({ notice, banner, base: '/ClickHub/', enabled: true, sw, win, ...extra }) };
}
test('offline notices appear and clear with connectivity changes', async () => {
 const t = setup({ onLine: false });
 await t.mount({ enabled: false });
 assert.equal(t.notice.textContent, OFFLINE_MESSAGES.offline); assert.equal(t.notice.hidden, false); assert.equal(t.sw.registered, undefined);
 t.win.emit('online'); assert.equal(t.notice.hidden, true);
 t.notice.textContent = 'Storage full'; t.notice.hidden = false; t.win.emit('offline'); t.win.emit('online'); assert.equal(t.notice.hidden, true);
});
test('first install announces offline readiness; updates wait for the user', async () => {
 const first = setup();
 const reg = await first.mount();
 assert.deepEqual(first.sw.registered, ['/ClickHub/sw.js', { scope: '/ClickHub/' }]);
 const installing = new Emitter(); reg.installing = installing; reg.emit('updatefound');
 installing.state = 'activated'; installing.emit('statechange');
 assert.equal(first.notice.textContent, OFFLINE_MESSAGES.ready); assert.equal(first.banner.hidden, true);
 const later = setup({ controller: {} });
 const reg2 = await later.mount(); reg2.active = {};
 const next = new Emitter(); next.messages = []; next.postMessage = m => next.messages.push(m); reg2.installing = next; reg2.emit('updatefound');
 next.state = 'installed'; next.emit('statechange');
 assert.equal(later.banner.hidden, false); assert.equal(later.banner.children[0].textContent, OFFLINE_MESSAGES.update);
 later.sw.emit('controllerchange'); assert.equal(later.win.location.reloads, 0, 'no reload without consent');
 later.banner.children[1].onclick();
 assert.deepEqual(next.messages, [{ type: 'SKIP_WAITING' }]);
 later.sw.emit('controllerchange'); assert.equal(later.win.location.reloads, 1);
 // A worker that finished activating before the listeners were attached still gets announced, once.
 const fast = setup(); fast.registration.active = { state: 'activated' };
 await fast.mount(); assert.equal(fast.notice.textContent, OFFLINE_MESSAGES.ready);
 const busy = setup(); const early = new Emitter(); early.state = 'installing'; busy.registration.installing = early;
 const busyReg = await busy.mount(); busyReg.emit('updatefound');
 assert.equal(busy.notice.textContent, ''); early.state = 'activated'; early.emit('statechange');
 assert.equal(busy.notice.textContent, OFFLINE_MESSAGES.ready);
 busy.notice.textContent = 'other'; early.emit('statechange'); assert.equal(busy.notice.textContent, 'other');
 const waiting = setup({ controller: {} }); waiting.registration.waiting = new Emitter();
 await waiting.mount(); assert.equal(waiting.banner.hidden, false);
 delete globalThis.document;
});
