# Document tools — five additions

ClickHub now contains **42 tools**. Shared PDF processing resides in `src/lib/pdf/`, shared PDF form behavior in `src/components/documents/`, and individual views under category/tool subfolders.

## Behavior and limits

| Tool | Supported behavior | Boundaries |
| --- | --- | --- |
| PDF Merger | Combine files in displayed order; move files up/down | Up to 20 files, 25 MiB combined, 200 total output pages |
| PDF Page Extractor | Copy `all`, individual pages, or ascending ranges, in requested order | Page numbering starts at 1. Duplicates repeat pages. Produces one new PDF, not a ZIP of individual pages |
| PDF Page Organizer | Same selection plus 0/90/180/270° clockwise rotation on every output page | Rotation is added to existing page rotation. Omitted pages are excluded; no drag-and-drop thumbnails or page-content editing |
| Images to PDF | One image per A4 page, portrait/landscape, 24-point margins | Images re-encoded as JPEG on white. Up to 20 PNG/JPEG/WebP images, 25 MiB combined; per-image limits from image tools also apply |
| CSV Table Viewer | Paste/upload, heading row, filter, sort, 50-row pagination, filtered CSV export | UTF-8 comma-separated data; rectangular rows. Up to 1 MiB upload, 1 million parsed characters, 100 columns, 5,000 data rows, 200,000 total cells |

PDF input documents must contain 1–200 pages each. Encrypted, unreadable, and unsupported files produce errors. Limits reduce accidental overload but do not make parsing adversarial files safe: parsing and image decoding occur in the browser and can still consume substantial memory/CPU. Use trusted inputs.

PDF page copying is not a full-document archival operation. Forms, outlines/bookmarks, attachments, metadata, and digital signatures may not survive or remain valid. The tools are not redaction or sanitization utilities and do not promise removal of active content or hidden information. Keep originals and review exports. No PDF rendering preview or OCR is included.

Images inherit the existing 10 MiB input-file, 24 MP decoded-source, 16 MP/8192-pixel output limits. Images-to-PDF does not downsample automatically; resize large images first. Alpha is flattened onto white and animation becomes one frame.

CSV values are displayed with DOM text assignment, not interpreted as HTML. Blank headings are named `Column N`; duplicate headings are allowed. Sorting is stable and numeric mode puts blanks/non-numeric values after numbers. Export includes all filtered rows in current sort order. An enabled-by-default option prefixes formula-like cells with an apostrophe; this changes values (including negative numbers) and is not a universal spreadsheet security guarantee. Uncheck it only when exact text preservation is appropriate for trusted data. Viewer is read-only; use the CSV/JSON converter for format conversion.

## Implementation and privacy

- No document uploads, external APIs, persistence, or remote processing.
- `pdf-lib` is dynamically imported from the site's own static assets on first PDF processing. Its chunk is separate from initial application JavaScript. Loading this chunk is a normal local-site asset request, not an upload.
- PDF actions lock their settings during processing. Input changes invalidate old downloads. Closing a tool suppresses later UI updates and releases output URLs; it does not forcibly interrupt an already-running parser.
- CSV file reads use operation tokens to reject stale asynchronous results.
- `pdf-lib`, `@pdf-lib/standard-fonts`, `@pdf-lib/upng`, `pako`, and `tslib` license notices are included in `public/licenses/`.

## Validation

- **55 unit tests passed**, including page-selection bounds/order/duplicates, merged page sizes, additive rotations, rejection of damaged/encrypted/over-200-page PDFs, A4 fitting, CSV rectangularity/limits, stable numeric sorting, and formula-prefix export.
- **112 browser tests passed** across desktop and mobile-emulated Chromium against production output. Existing tool and workspace regressions remain included.
- New browser tests download and reopen generated PDFs, verifying page counts, ordering via source dimensions, rotation, A4 dimensions, and image-page content streams.
- CSV browser coverage tests upload/paste, pagination, numeric sorting, filtering, filtered download, stale-table clearing, and inert markup rendering.
- Axe checks cover a populated CSV table, organizer, and images-to-PDF forms; earlier accessibility tests still pass. This is automated sampling, not full accessibility certification.
- `npm run build` succeeds under `/ClickHub/`; PDF code is emitted as a separate dynamically loaded chunk. Dependency audit reports no known vulnerabilities at verification time.

Known limits remain: tests are Chromium plus device emulation, not all real browsers/devices; complex real-world PDFs may contain unsupported features. GitHub Pages publishing and offline caching remain unconfigured. No push or deployment is implied by these local results.
