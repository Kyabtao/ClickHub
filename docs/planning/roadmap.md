# Implementation roadmap

Current state: Vite/vanilla JavaScript application shell and 47 local tools implemented. Includes search, category filters, favorites, recents, themes, developer utilities, calculators, color and aspect helpers, and local hashing. See README for the full list. Deployment automation and offline caching remain pending.

1. Foundation: choose a static frontend stack; implement search, categories, favorites, recent tools, themes, responsive layout, and Pages deployment.
2. Core utilities: text workbench, JSON formatting, encoding, UUID and password generation, timestamps, units, basic calculators.
3. Personal workspace: notes, tasks, habits, budgets, and planners with local persistence and export/import.
4. Files and creative tools: images, PDFs, CSV, charts, colors, and CSS generators.
5. Advanced tools: OCR, media conversion, education, games, and optional external API integrations.

## Completion criteria

- Tool is functional, not a placeholder.
- Input validation and error handling are implemented.
- Appropriate automated tests cover its core behavior.
- Keyboard interaction and responsive layout are checked.
- Local processing versus external service use is disclosed.
- Persistent personal data has export/import where applicable.
- Browser, memory, permissions, and offline limitations are documented.

Review security-sensitive tools before using real secrets. Health and financial estimates need clear assumptions and limitations. Do not promise reliable reminders while the browser is closed.

Unit and browser tests now run successfully. The 2026-09-25 audit fixed theme colors, contrast, stale outputs, storage-failure messaging, invalid routes, and focus restoration. See `docs/audits/2026-09-25.md`.

Batch four adds ten tools across data, developer, SEO, accessibility, productivity, science, finance, home, and language categories. Regression totals: 31 unit tests and 56 desktop/mobile-emulated Chromium tests. See `docs/audits/batch-four.md`.

The personal workspace now includes Notes, Tasks, Habit Tracker, Bookmark Manager, and Expense Tracker with local persistence and per-tool JSON backups. See `docs/audits/workspace.md`. Offline application loading and reminders are not implemented.

Media/timer batch adds QR generation, image resizing, image format conversion, Pomodoro, and stopwatch. Validation totals: 47 unit tests and 98 browser tests; see `docs/audits/media-timers.md`.

Document batch adds PDF merge/extract/organize, images-to-PDF, and CSV table viewing. Full validation: 55 unit tests and 112 desktop/mobile-emulated browser tests. See `docs/audits/documents.md`.

Batch five implements five roadmap items: Text Diff Checker, Markdown Editor, Regex Tester, Time Zone Planner, and Budget Planner. Seven planned tools remain (Chart Builder, Image Cropper, ZIP, OCR, Audio Trimmer, Flashcards, Quiz Builder). Full validation: 61 unit tests and 128 desktop/mobile-emulated browser tests. See `docs/audits/batch-five.md`.
