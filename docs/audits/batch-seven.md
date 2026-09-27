# Batch seven — ZIP and quizzes

ClickHub now contains **53 tools**. Only **Image OCR** remains on the planned list. Quiz Builder is the seventh tool with local saving.

## Behavior and limits

| Tool | Supported behavior | Boundaries |
| --- | --- | --- |
| ZIP Creator / Extractor (`src/tools/media-files/zip-tool/`) | **Create:** add files and folders (sub-folder paths kept), remove items, optional deflate compression with automatic store fallback, custom archive name. **Open:** list entries with sizes and dates, filter, download single files | Up to 1,000 entries and 100 MiB input; 200 MiB per extracted entry. Methods: stored (0) and deflate (8). Encrypted, ZIP64, split/multi-disk, and other compression methods (e.g. LZMA, bzip2) are rejected with a clear message. Extracted files download one at a time by base name (no folder recreation) |
| Quiz Builder (`src/tools/education/quiz-builder/`) | Plain-text format (`Q:` question, `-` wrong, `*` correct; several `*` = multiple answers); multi-line prompts; validation with line numbers; take quizzes with optional question/option shuffling; results with correct answers; saved attempts and best score; JSON backup/restore | Up to 100 questions, 10 options each, 20,000 characters per quiz. Scoring is all-or-nothing per question. Editing a quiz's questions resets its attempts and best score. No timers, images, or free-text answers |

## Implementation notes

- The ZIP reader and writer are small, dependency-free implementations of PKWARE APPNOTE using the browser's `CompressionStream`/`DecompressionStream('deflate-raw')`. Names are stored as UTF-8 (flag bit 11). When reading, names are decoded as UTF-8 with a Windows-1252 fallback.
- Entry names are normalised when creating archives: backslashes become `/`, and leading slashes and `.`/`..` segments are removed. Duplicate names get a numeric suffix (case-insensitive). When extracting, only the base name is used for downloads, so archive paths cannot choose where files are saved.
- Every extracted entry's size and CRC-32 are checked against the central directory before download. Declared sizes above 200 MiB are refused before decompression.
- Quiz Builder uses the `mountCollection` `extend` hook added in batch six, like Flashcards. Attempts are saved through the same store as the edit form.

## Validation

- **70 unit tests passed** (`tests/unit/batch-seven.test.js` adds 5). They cover the CRC-32 check value, DOS date round trips, path sanitising and duplicate naming, deflate/store round trips with UTF-8 names, corruption detection, extraction from an archive made by Python's `zipfile`, rejection of encrypted/unknown-method/oversized/ZIP64 input, quiz parse errors with line numbers, all-or-nothing scoring, and backup validation.
- During development, archives from `buildZip` passed `unzip -t`, and Info-ZIP archives (stored entries and directories) extracted correctly.
- **146 browser tests passed** in desktop and mobile-emulated Chromium against the production build (`tests/e2e/batch-seven.spec.js` adds 8). Downloaded ZIPs are reopened and extracted, inert rendering of HTML-like entry names is checked, fake ZIPs are rejected, a full quiz save/take/score/retry/reload/edit flow runs, and Axe WCAG A/AA checks pass in light and dark themes.
- Browser tests ran with a locally provided Chromium (`CHROMIUM_EXECUTABLE`), as described in `docs/audits/2026-09-25.md`. Folder upload (`webkitdirectory`) and real Safari/Firefox were not tested automatically.
