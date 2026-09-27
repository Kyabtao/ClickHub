# Batch eight — Image OCR (self-hosted)

ClickHub now contains **54 tools**. **Image OCR** was the last planned tool, so every tool from the original roadmap is now available. The status table shows "none planned", hides the Planned filter, and the homepage banner no longer mentions a roadmap backlog.

## Behavior and limits

| Tool | Supported behavior | Boundaries |
| --- | --- | --- |
| Image OCR (`src/tools/media-files/image-ocr/`) | Choose a PNG/JPEG/WebP image or paste a screenshot (Ctrl+V / ⌘V). Pick 1–3 languages: English, Hindi, Spanish, French, German. Progress bar with stages; Cancel stops the worker immediately. Editable text output, "keep line breaks" or "join into paragraphs" (fixes words hyphenated at line ends), Copy, and `.txt` download. Word/line counts and Tesseract's mean confidence with a high/medium/low label | Up to 10 MiB and the shared image-size limits. Images with a longest side under 1,000 px are upscaled (up to 2×, max 2,000 px), and images over 4,000 px are scaled down. Best on clear, straight, printed text. No handwriting, rotation/deskew correction, layout/column detection, table extraction, or searchable-PDF output. Recognition quality depends on image quality, so the UI tells users to review the result. Nothing is saved |

## Self-hosting and privacy

- **Nothing leaves the device.** tesseract.js defaults to loading its worker, engine, and models from `cdn.jsdelivr.net`. `workerOptions()` (in `logic.js`) replaces every path with an absolute same-origin URL under `<base>/ocr/` and refuses a base that resolves to another origin. `workerBlobURL: false` loads the worker directly from the site. `cacheMethod: 'none'` means the models are not copied into IndexedDB; normal HTTP caching still applies.
- **Enforced by tests.** The e2e test records every request from the page and its workers during a real recognition. It fails if any request goes to another origin, and it checks that the worker, an engine build, and `eng.traineddata.gz` were served from `/ClickHub/ocr/`.
- **Build pipeline.** `scripts/build/copy-ocr-assets.mjs` runs as `prebuild` and `predev`. It copies the following from `node_modules` into the git-ignored `public/ocr/` folder, so no binaries are committed and CI rebuilds them after `npm ci`:

| Asset | Size |
| --- | --- |
| `worker.min.js` | 109 KiB |
| `core/tesseract-core-{relaxedsimd-,simd-,}lstm.wasm.js` (browser picks one) | 3.7 MiB each |
| `lang/eng.traineddata.gz` | 2.8 MiB |
| `lang/spa.traineddata.gz` | 2.0 MiB |
| `lang/hin.traineddata.gz` | 1.3 MiB |
| `lang/deu.traineddata.gz` | 1.3 MiB |
| `lang/fra.traineddata.gz` | 0.7 MiB |
| **Total deployed** | **19.4 MiB** |

A first English run downloads about 6.6 MiB: the worker, one engine build, and the English model. The OCR library (`tesseract.esm.min.js`, 63 KB, 18 KB gzip) is dynamically imported, so the main bundle does not grow. `public/ocr/VERSIONS.txt` records the copied versions.

- **Licences.** `public/licenses/` now includes tesseract.js (Apache-2.0), the worker's bundled dependencies, tesseract.js-core (Apache-2.0), the Tesseract/Leptonica engine notice, and the language data notice.

## Implementation notes

- The image is decoded with the shared `readImage` (EXIF orientation applied). It is drawn onto a white canvas at the scale from `ocrScale()`, so transparent PNGs don't turn black, and the canvas is passed to the worker.
- The worker is kept while the tool is open and reused while the language set stays the same. It is terminated when the languages change, on Cancel, on error, and when the tool closes. A revision counter discards late results from cancelled runs.
- The paste listener is registered on the document only while the tool is mounted, and it ignores clipboard items that aren't images.
- The ESM build of tesseract.js has only a default export, so the view uses `(await import(...)).default.createWorker`.

## Validation

- `npm test`: **76/76** unit tests pass. The six new ones cover language validation, same-origin worker options (including rejecting a cross-origin base), scaling, text tidying (including Devanagari), summaries and progress labels, and that every configured model and engine file is installed and wired into `prebuild`/`predev`.
- `npm run test:e2e`: **150/150** tests pass in desktop and Pixel 7-emulated Chromium. New tests:
  - Real OCR on canvas-rendered text (exact match of two lines, including digits).
  - Zero cross-origin requests.
  - Layout switch, `.txt` download, and axe WCAG 2.1 AA checks with no horizontal overflow.
  - Pasting a screenshot, rejecting an invalid file, and validating the language count (0 and 4).
  - Cancelling mid-download (the language request is deliberately held) and then a fresh successful run.
- In a manual check, a serif two-line sample was recognised exactly at 95–96% confidence on both desktop and mobile layouts.
- **Not verified here:** Hindi recognition accuracy. The sandbox browser has no Devanagari font, so a rendered Hindi sample became boxes. A mixed English+Hindi run did load both models and recognised the English line correctly. Test on a real device with Hindi text before relying on it.
- Manual screen-reader testing and real mobile hardware testing are still outstanding, as in earlier batches.
