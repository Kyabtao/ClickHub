# ClickHub

A personal, browser-first toolbox planned for free hosting on GitHub Pages.

## Project status

The first browser-only release includes a responsive tool dashboard, search, category filters, favorites, recent tools, light/dark themes, and **42 working tools**:

- **Text Workbench:** counts words, characters (UTF-16 code units), and lines; converts case; cleans spaces; removes duplicate lines.
- **JSON Formatter:** validates, formats, and minifies JSON. Uses JavaScript JSON parsing; numbers beyond JavaScript’s safe precision may lose precision and duplicate keys collapse.
- **Password Generator:** generates 8–128 character passwords using Web Crypto with unbiased character selection. Character classes are not guaranteed in every output.
- **Encoding Converter:** UTF-8 Base64 and URL component encoding/decoding; malformed input is rejected.
- **UUID Generator:** generates 1–500 cryptographically random version 4 UUIDs.
- **Timestamp Converter:** Unix seconds/milliseconds to dates, and explicit UTC ISO dates to timestamps.
- **Unit Converter:** length, mass, temperature, and time; rejects temperatures below absolute zero.

- **Percentage Calculator:** percent-of, ratio, and percentage change.
- **Discount Calculator:** savings and tax applied after discount.
- **Compound Interest:** fixed-rate growth with yearly, quarterly, monthly, or daily compounding.
- **Loan / EMI Calculator:** fixed-rate monthly payments, total cost, and interest.
- **BMI Calculator:** adult BMI reference estimate, with health limitations disclosed.
- **Aspect Ratio Calculator:** reduced ratios and proportional image dimensions.
- **Color Converter:** HEX to RGB and HSL.
- **Hash Calculator:** SHA-256, SHA-384, and SHA-512 for UTF-8 text or local files up to 25 MiB.
- **URL Inspector:** HTTP(S) components, repeated query parameters, and credential presence without fetching a URL.
- **Number Base Converter:** exact signed integer conversion across binary, octal, decimal, and hexadecimal.

- **CSV / JSON Converter:** CSV and JSON row arrays; preserves string values and quoted multiline fields.
- **JWT Inspector:** local header/payload decoding only; no signature verification.
- **URL Slug Generator:** ASCII or Unicode slugs with normalized separators.
- **Contrast Checker:** opaque HEX color contrast and WCAG text threshold checks.
- **Date Difference:** UTC calendar-day differences with optional inclusive counting.
- **Statistics Calculator:** mean, median, extrema, population/sample variance, and standard deviation.
- **Resistor Color Calculator:** four-band resistor values and tolerance ranges.
- **Tip & Bill Splitter:** tip totals and exact distribution of rounded cents.
- **Recipe Scaler:** decimal ingredient quantities scaled by servings without unit conversion.
- **Morse Code Translator:** A–Z and digits, with text/Morse conversion.

- **Notes:** create, edit, search, delete, and back up local text notes.
- **Tasks:** task titles, optional due dates, and completion status.
- **Habit Tracker:** manually record and undo completions on selected dates.
- **Bookmark Manager:** saved HTTP(S) links with search and safe external opening.
- **Expense Tracker:** dated expenses with separate INR, USD, EUR, and GBP totals.

- **QR Code Generator:** local UTF-8 QR generation with correction levels M/Q/H and PNG download.
- **Image Resizer:** resize PNG/JPEG/WebP images with optional aspect-ratio locking.
- **Image Format Converter:** export PNG, JPEG, or WebP; adjustable JPEG/WebP quality.
- **Pomodoro Timer:** configurable focus and break sessions with start, pause, and reset.
- **Stopwatch:** elapsed time, pause/resume, reset, and up to 100 cumulative laps.

- **PDF Merger:** combine local PDFs in a selected file order.
- **PDF Page Extractor:** copy selected page numbers/ranges into a new PDF.
- **PDF Page Organizer:** reorder, omit, duplicate, and rotate pages.
- **Images to PDF:** fit local raster images onto portrait or landscape A4 pages.
- **CSV Table Viewer:** read-only table with filtering, text/numeric sorting, pagination, and filtered CSV export.

Favorites, recents, and theme preferences are saved locally when browser storage is available. The original calculation/conversion tools do not save inputs or passwords. The five workspace tools save records only after an explicit Add/Save action; their privacy notice says so. Workspace data and JSON backups are **not encrypted**, and there is no cloud sync. Export backups regularly; clearing browser data removes local records. Empty planned folders retain `.gitkeep` files. Deployment automation is not configured yet.

## Homepage tool status

The homepage includes a searchable status table generated from the tool registry:

- **42 Available:** each implemented tool, its category, storage behavior, and an Open link.
- **12 Planned:** selected upcoming tools, clearly marked as not implemented and without launch links.
- Five tools support local saving and JSON backups.

Status describes implementation progress, not live uptime or universal browser compatibility. Roadmap entries are not delivery commitments. Publishing and offline caching remain pending.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
# Open the printed URL at /ClickHub/
npm test
npm run build
npm run preview
```

Production files are generated in ignored `dist/`. Hash-based tool links work under `/ClickHub/` without server rewrites. This app is not yet an offline PWA.

## Repository layout

```text
ClickHub/
├── .github/             # Notes for future CI and Pages workflows
├── docs/               # Architecture, roadmap, and hosting notes
├── public/             # Static icons, fonts, and images
├── scripts/            # Build and maintenance helpers
├── src/                # Application and tool source code
│   ├── app/            # Shell, navigation, routes, and tool registry
│   ├── components/     # Shared layout and UI components
│   ├── data/           # Bundled reference data
│   ├── lib/            # Shared storage, file, and validation helpers
│   ├── styles/         # Global styles and design tokens
│   ├── tools/          # Category folders containing individual tools
│   └── workers/        # Background processing for expensive operations
└── tests/              # Unit, integration, and browser tests
```

Keep root files limited to project metadata and required configuration. Put tools inside `src/tools/<category>/<tool-slug>/`, not at the repository root.

## Documentation

- [Document tools validation](docs/audits/documents.md)
- [Media and timer validation](docs/audits/media-timers.md)
- [Workspace guide and validation](docs/audits/workspace.md)
- [Batch four validation](docs/audits/batch-four.md)
- [Audit report](docs/audits/2026-09-25.md)
- [Folder conventions](docs/architecture/folder-structure.md)
- [Implementation roadmap](docs/planning/roadmap.md)
- [GitHub Pages requirements](docs/deployment/github-pages.md)

## Browser tests

```sh
npx playwright install chromium
npm run test:e2e
```

The Playwright suite tests production output at `/ClickHub/` in desktop and mobile-emulated Chromium. It covers all 42 tools, navigation, persistence, input errors, and automated accessibility checks. These checks do not replace manual assistive-technology testing or testing on real mobile devices.

For an existing Chromium installation, set `CHROMIUM_EXECUTABLE=/path/to/chromium` when running `npm run test:e2e`. Linux may require `npx playwright install-deps chromium`. See the audit report for the sandbox workaround and results.

## Third-party code

QR generation bundles `qrcode` and its `dijkstrajs` dependency locally; it does not use a hosted QR service. Their license notices ship in `public/licenses/`. The `jsqr` decoder is a development-only test dependency.

PDF processing uses a locally bundled, dynamically imported `pdf-lib` chunk. License notices for it and its dependencies ship in `public/licenses/`. Encrypted PDFs are unsupported; keep originals and review exported documents before replacing them.
