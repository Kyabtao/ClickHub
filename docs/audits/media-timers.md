# Media and timers — five new tools

ClickHub now has **37 tools**. Implementations remain in category/tool folders, with shared browser image code in `src/lib/images/` and clock logic in `src/lib/time/`.

## Features and boundaries

### QR Code Generator

- Generates a local QR matrix from text/URLs using bundled `qrcode` code; PNG preview/download has black modules on white and a four-module quiet zone.
- Supports M, Q, and H error correction; input capped at 1,000 UTF-8 bytes (and 1,000 input code units).
- Generated code content is not encrypted or saved. Verify scanning on the intended device and printed size before distribution.
- `qrcode` and `dijkstrajs` license notices ship in `public/licenses/`. `jsqr` is test-only and is not shipped to visitors.

### Image Resizer and Image Format Converter

- Local PNG, JPEG, and WebP input. Resizer supports independent dimensions or original-aspect-ratio locking; converter keeps source dimensions.
- PNG/JPEG/WebP export. Quality setting affects JPEG/WebP only. JPEG composites transparency onto white. Unsupported browser encoders produce an error, not a falsely labelled file.
- Limit: 10 MiB source file, 24 million decoded source pixels, 16 million output pixels, and each output dimension 1–8192. The pixel-size check occurs after decoding, so a small compressed file with extreme dimensions may still stress device memory during decoding. These are convenience tools, not hardened image-processing sandboxes.
- Animated files are flattened to one frame. Raster export does not promise original metadata, color-profile, animation, or lossless round-trip preservation. Encoded size may increase.
- Output becomes invalid when settings/source change. Async results are discarded after a newer operation or closing the tool. Object URLs and image bitmaps are released when replaced/closed.

### Pomodoro Timer

- Configurable focus and break lengths: 1–180 whole minutes. Start, pause/resume, reset, and manual mode selection.
- Uses a wall-clock deadline, recalculating remaining time after delayed interval callbacks. System clock adjustments can affect it.
- No automatic next session, notification, sound, persistence, or execution after closing the tool. Device/browser suspension can delay visible completion until resume.

### Stopwatch

- Uses `performance.now()` elapsed time rather than incrementing interval counts.
- Start, pause/resume, reset, and up to 100 cumulative elapsed-time laps.
- Closing the tool resets it and cancels updates. OS sleep behavior is browser-dependent; displayed hundredths are not a guarantee of physical timing precision.

## Validation

- **47 unit tests passed**, including all prior tests plus independent QR decoding at each error-correction level, UTF-8 limits, image dimension limits, proportional resizing, duration validation, stopwatch transitions, and countdown deadlines.
- **98 desktop/mobile-emulated Chromium tests passed** against the production build, retaining all earlier tool/workspace tests.
- Browser tests independently decode the rendered QR canvas, validate downloaded PNG signatures/dimensions, inspect JPEG/WebP signatures, and check white JPEG transparency compositing.
- Image tests exercise invalid dimensions, corrupt image bytes, oversized source files, stale-download removal, and local-only conversion with no additional network requests.
- Deterministic browser-clock tests cover stopwatch pause/resume/laps/reset/close cleanup and Pomodoro completion, pause/resume, break selection, reset, and invalid durations. They do not simulate real OS sleep or clock adjustments.
- Additional axe scans cover QR, image-resizer, Pomodoro, and stopwatch dialogs; previous accessibility scans also pass. These scans are not a complete conformance certification.
- Production build succeeds with the `/ClickHub/` base. `npm audit` reports zero known vulnerabilities at verification time.

The executable-path browser setup remains documented in the original audit. Tests use Chromium and mobile emulation, not physical phones or a cross-browser matrix. Deployment, cloud sync, and offline service-worker caching remain pending.
