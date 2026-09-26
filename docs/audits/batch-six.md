# Batch six — four roadmap tools

ClickHub now contains **51 tools**. This batch implements four more planned items; ZIP Creator / Extractor, Image OCR, and Quiz Builder remain on the roadmap. Flashcards is the sixth tool with local saving.

## Behavior and limits

| Tool | Supported behavior | Boundaries |
| --- | --- | --- |
| Image Cropper (`src/tools/media-files/image-cropper/`) | Drag on a preview or type x/y/width/height; ratio presets (free, 1:1, 4:3, 3:2, 16:9, 3:4, 9:16); centred largest crop; PNG/JPEG/WebP export | Uses the shared image limits: 10 MiB file, 24 MP source, output at most 8192 px per side and 16 MP. Output is re-encoded; metadata is not kept. No rotation or free-form shapes |
| Chart Builder (`src/tools/data/chart-builder/`) | CSV rows of label + 1–5 numeric columns, optional header; bar (grouped, negative values from the zero line), line, and pie charts; SVG and 2× PNG download; data table | Up to 100 rows and 50,000 characters. Pie charts need one non-negative column with a positive total. Values containing commas must be quoted. Labels over 12 characters are shortened on the axis |
| Audio Trimmer (`src/tools/media-files/audio-trimmer/`) | Decode local audio, waveform with selection, start/end in seconds or m:ss, fade in/out, WAV preview and download | Decoding depends on browser codec support and resamples to the browser's audio rate (usually 44.1 or 48 kHz). 25 MiB input, 30-minute source, 100 MiB output. Output is 16-bit PCM WAV only; tags/cover art are dropped |
| Flashcards (`src/tools/education/flashcards/`) | Add/edit/delete/search cards with decks; study due cards by deck; “I knew it” promotes through 5 Leitner boxes (1, 2, 4, 8, 16 days); “Again” returns a card to box 1 for today; JSON backup/restore | Uses the shared workspace store: up to 500 records and 2 MiB per tool, not encrypted or synced. Scheduling uses local calendar dates. No images, audio, or import from other flashcard apps |

## Implementation notes

- `exportImage` in `src/lib/images/process.js` takes an optional source rectangle, so resizing, conversion, and cropping share one export path.
- `mountCollection` accepts an optional `extend` hook. It adds a tool-specific panel that uses the **same** store instance, so study reviews and form edits cannot trip the cross-tab conflict check. Existing workspace tools don't use it and behave as before.
- Chart SVG is built with `createElementNS` and `textContent`. Labels such as `<img …>` stay text. The chart has a white background so exports look the same in both themes.
- The Chart Builder parses CSV leniently (spaces after commas and before quotes are allowed). The strict CSV/JSON converter is unchanged.

## Validation

- **65 unit tests passed** (`tests/unit/batch-six.test.js` adds 4). They cover crop geometry and bounds, ratio-locked dragging, chart parsing and headers, nice-scale ticks, negative bars, full-circle pies, time parsing, trim bounds and the WAV size cap, fade shapes, WAV header and sample encoding, waveform peaks, Leitner scheduling across month/year and leap days, deck filtering, and backup validation.
- **138 browser tests passed** in desktop and mobile-emulated Chromium against the production build (`tests/e2e/batch-six.spec.js` adds 10). They check that cropped pixels come from the chosen region, drag selection, SVG/PNG/WAV downloads with correct headers and sizes, stale-output clearing, decode errors, inert chart labels, flashcard scheduling persisted across reloads, and Axe WCAG A/AA checks in light and dark themes.
- Browser tests ran with a locally provided Chromium (`CHROMIUM_EXECUTABLE`), as described in `docs/audits/2026-09-25.md`. Real Safari/Firefox, audio codec variety, and touch-drag on physical devices were not tested.
