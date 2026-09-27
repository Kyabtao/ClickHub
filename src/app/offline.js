// Registers the service worker (production builds only) and shows offline/update status.
// Updates never activate behind the user's back: a waiting worker is announced with a
// Reload button, so an open tool is never left requesting files a newer build removed.
export const OFFLINE_MESSAGES = {
 ready: 'ClickHub is ready to work offline. OCR languages are saved for offline use after their first run.',
 offline: 'You’re offline. Tools that have already loaded keep working.',
 update: 'A new version of ClickHub is ready.',
};
export function mountOffline({ notice, banner, base = import.meta.env.BASE_URL, enabled = import.meta.env.PROD, sw = globalThis.navigator?.serviceWorker, win = globalThis.window } = {}) {
 if (!win) return null;
 let offlineShown = false;
 const say = text => { notice.hidden = false; notice.textContent = text; };
 const onOffline = () => { offlineShown = true; say(OFFLINE_MESSAGES.offline); };
 const onOnline = () => { if (offlineShown && notice.textContent === OFFLINE_MESSAGES.offline) { notice.hidden = true; notice.textContent = ''; } offlineShown = false; };
 win.addEventListener('offline', onOffline); win.addEventListener('online', onOnline);
 if (win.navigator && win.navigator.onLine === false) onOffline();
 if (!enabled || !sw || !win.isSecureContext) return null;
 let reloading = false;
 function offerUpdate(worker) {
  banner.hidden = false;
  banner.replaceChildren();
  const text = document.createElement('span'); text.textContent = OFFLINE_MESSAGES.update;
  const button = document.createElement('button'); button.type = 'button'; button.id = 'app-update-reload'; button.textContent = 'Reload to update';
  const later = document.createElement('button'); later.type = 'button'; later.textContent = 'Later';
  button.onclick = () => { reloading = true; button.disabled = true; button.textContent = 'Updating…'; worker.postMessage({ type: 'SKIP_WAITING' }); };
  later.onclick = () => { banner.hidden = true; };
  banner.append(text, button, later);
 }
 sw.addEventListener('controllerchange', () => { if (reloading) win.location.reload(); });
 const firstInstall = !sw.controller;
 const ready = sw.register(`${base}sw.js`, { scope: base }).then(registration => {
  let announced = false;
  const announceReady = () => { if (firstInstall && !announced && !reloading) { announced = true; say(OFFLINE_MESSAGES.ready); } };
  const tracked = new WeakSet();
  // Follow a worker through install/activation. Called for a worker that is already installing when
  // register() resolves (on a busy device install can start before an updatefound listener exists)
  // and for any later update.
  function track(worker) {
   if (!worker || tracked.has(worker)) return;
   tracked.add(worker);
   const check = () => {
    if (worker.state === 'installed' && sw.controller && registration.active && registration.active !== worker) offerUpdate(worker);
    if (worker.state === 'activated') announceReady();
   };
   worker.addEventListener('statechange', check);
   check();
  }
  if (registration.waiting && sw.controller) offerUpdate(registration.waiting);
  track(registration.installing);
  if (!registration.installing && !registration.waiting && registration.active?.state === 'activated') announceReady();
  registration.addEventListener('updatefound', () => track(registration.installing));
  // Look for a new version when the tab comes back into view (at most every 30 minutes).
  let lastCheck = Date.now();
  win.document.addEventListener('visibilitychange', () => {
   if (win.document.visibilityState === 'visible' && Date.now() - lastCheck > 30 * 60 * 1000) { lastCheck = Date.now(); registration.update().catch(() => {}); }
  });
  return registration;
 }).catch(error => { console.warn('Offline support is unavailable:', error); return null; });
 return ready;
}
