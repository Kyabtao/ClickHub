# Offline support and installable app

ClickHub now works offline and can be installed as an app. This closes the last item the repository listed as pending. Publishing to GitHub Pages was already working: `pages-cli.yml` deploys `main` to <https://kyabtao.github.io/ClickHub/>. That site currently shows the 42-tool version from `main` and will update when this branch is merged.

## How it works

| Piece | Location | Notes |
| --- | --- | --- |
| Service worker template | `src/sw/service-worker.js` | Classic script (works in every browser with service worker support). No dependencies |
| Build step | `scripts/build/pwa.mjs` (Vite plugin, `closeBundle`) | Lists `dist/`, excludes `sw.js`, `ocr/`, source maps, and dotfiles. Hashes the remaining files' paths and contents into the app version, hashes `ocr/VERSIONS.txt` into the OCR version, and writes `dist/sw.js` |
| Registration and UI | `src/app/offline.js` | Production builds only, secure contexts only. First install shows "ready to work offline". Offline/online notices. Update banner with **Reload to update** / **Later**. Re-checks for updates when the tab becomes visible (at most every 30 minutes) |
| Manifest and icons | `public/manifest.webmanifest`, `public/icons/` | Standalone display, 192/512 px icons, a maskable 512 px icon, an SVG icon, and a 180 px Apple touch icon, drawn to match the ✳ logo |

**Caching strategy**

- **Precache (`clickhub-app-<version>`):** 24 files, about 0.8 MB: `index.html`, all JS/CSS chunks (including the lazily loaded `pdf-lib`, tesseract.js wrapper and regex worker), manifest, icons and licence files. They are fetched at install with `cache: 'reload'` so GitHub Pages' HTTP cache can't mix versions. Requests are served cache-first.
- **App shell:** navigations to `/ClickHub/` or `/ClickHub/index.html` (with any query string) get the cached `index.html`, which always matches the cached chunks.
- **OCR (`clickhub-ocr-<version>`):** requests under `/ClickHub/ocr/` are served cache-first and stored after a successful network response (only full 200 same-origin responses). This means a visitor only caches the engine build their browser uses and the languages they run. The cache survives app updates and changes only when tesseract.js or the language data changes.
- **Everything else** (other origins, other paths, non-GET requests) is left to the browser.

**Updates**

- The new worker installs in the background and waits. It takes over only when the user clicks **Reload to update**: the page sends it `SKIP_WAITING` and reloads once it takes control. An open tool is therefore never left asking for chunk files that the new deploy has removed.
- On activation, caches with the `clickhub-` prefix that don't belong to the current version are deleted, and `clients.claim()` lets a first visit work offline without a reload.
- Registration is robust to install finishing before listeners attach: a worker that is already installing or already active when `register()` resolves is still tracked and announced once.

## Image OCR changes

- **Offline message:** if OCR fails while the device is offline, the tool explains that the chosen language or engine hasn't been saved yet and must be run once online.
- **Startup bug worked around:** tesseract.js 7 swallows a language-download failure inside `createWorker()`. The promise then never settles, and the error was re-thrown as an uncaught exception. The tool now:
  - passes an `errorHandler`;
  - races `createWorker()` against that handler;
  - captures the internal Web Worker when it is constructed, so a failed, cancelled or stale start is terminated instead of lingering with the engine loaded.

## Validation

- `npm test`: **82/82** unit tests pass. The new ones cover:
  - precache filtering and version hashing;
  - template placeholders;
  - service worker routing, run in a `vm` sandbox with a fake `self`;
  - the manifest, and that each icon file exists at its declared pixel size;
  - page-side logic with fake service-worker objects: offline/online notices, first-install notice, the update banner (no reload without consent, `SKIP_WAITING` on click, reload on controller change), a waiting worker found at load, and the early-activation race;
  - the OCR `errorHandler` wiring.
- `npm run test:e2e`: **156/156** tests pass in desktop and Pixel 7-emulated Chromium. The existing specs block service workers (`serviceWorkers: 'block'` in the Playwright config) so `page.route`-based tests are unaffected. `tests/e2e/offline.spec.js` allows them and checks:
  - **Install and offline:** installation; that the cache matches the generated precache list exactly and has no OCR files; the manifest. Then, fully offline: reload with all 54 cards, the offline notice, Regex Tester (worker) and PDF Merger (`pdf-lib` chunk), a start URL with a query string, and the notice clearing when back online.
  - **OCR offline:** the first run caches exactly one engine build, the worker and `eng`, but not `deu`. The next run works offline. An uncached language shows the offline explanation and leaves no OCR worker running.
  - **Updates:** a private static server simulates a new deploy by changing `sw.js`, because Playwright can't intercept the browser's own update check. The banner appears and both caches exist until the user acts. It passes axe checks. **Later** hides it and it returns on reload. **Reload to update** switches to the new version and deletes the old cache.
- `tests/e2e/batch-eight.spec.js` now also checks that Cancel and closing the tool terminate the OCR worker.

## Limits

- The first visit must be online. OCR languages must each be run once online before they work offline.
- Tested in Chromium only. Safari (including iOS home-screen apps, which have their own storage and eviction rules) and Firefox are not tested. Browsers may evict caches under storage pressure; the app then simply re-downloads when online.
- `npm run dev` does not register the service worker. Use `npm run build && npm run preview` to try offline behaviour locally.
