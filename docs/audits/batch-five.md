# Batch five — five roadmap tools

ClickHub now contains **47 tools**. This batch implements five items from the homepage's planned list; seven planned entries remain. Every new tool runs locally and does not save input.

## Behavior and limits

| Tool | Supported behavior | Boundaries |
| --- | --- | --- |
| Text Diff Checker (`src/tools/text/text-diff/`) | Line-based LCS diff, highlighted view, unified text output, optional whitespace/case ignoring | Up to 5,000 lines per side and 4 million comparison cells after common prefix/suffix trimming. Highlighted view shows the first 2,000 lines. No character-level highlighting or moved-block detection |
| Markdown Editor (`src/tools/text/markdown-editor/`) | Headings, paragraphs, bold/italic/strikethrough, inline/fenced code, links, ordered/unordered/task lists, quotes, rules; HTML copy; `.md` download | Subset only — no tables, images, footnotes, nested lists, or raw HTML. Links are limited to `http(s):`, `mailto:`, and `#`. Up to 200,000 characters |
| Regex Tester (`src/tools/developer/regex-tester/`) | Browser JavaScript regex engine; flags `dgimsuvy`; match positions, numbered and named groups; replacement preview | Runs in a module Web Worker (`src/workers/regex.worker.js`) that is terminated after 2 seconds. Up to 200,000 characters of text and 1,000 listed matches. Without the `g` flag only the first match is listed |
| Time Zone Planner (`src/tools/travel/time-zone-planner/`) | Converts one local date/time to up to 30 IANA zones; shows offset, day shift, and a 09:00–17:00 Mon–Fri hint | Depends on the browser's Intl time-zone data. Times skipped by DST are rejected; repeated times use the earlier instant and say so. Holidays are ignored |
| Budget Planner (`src/tools/finance/budget-planner/`) | `Category, amount, need/want/saving` lines; totals, unallocated/over-budget amount, per-line share, 50/30/20 comparison | One currency, non-negative amounts with up to 2 decimals, calculated in whole cents. Up to 200 lines. A rule of thumb, not financial advice |

## Security notes

- Diff lines and Markdown previews are built with DOM text nodes and elements; user text is never assigned as HTML. Generated HTML output escapes all text and attributes.
- Markdown preview links open in a new tab with `rel="noopener noreferrer"`.
- A catastrophic-backtracking pattern cannot freeze the page: the worker is terminated on timeout, and stale worker results are ignored after input changes or closing the tool.

## Validation

- **61 unit tests passed** (`tests/unit/batch-five.test.js` adds 5), covering diff ordering/line numbers/limits, regex groups/zero-length matches/Unicode advancement/truncation/invalid flags, Markdown output and unsafe link rejection, DST gaps and overlaps plus half-hour/45-minute offsets, and exact-cent budget arithmetic.
- **128 browser tests passed** across desktop and mobile-emulated Chromium against the production build (`tests/e2e/batch-five.spec.js` adds 12). They check results, stale-output clearing, inert markup, runaway-regex termination, `.md` download, category filtering, and Axe WCAG A/AA checks in both themes. Earlier regression counts were updated for the larger catalogue.
- `npm run build` succeeds; the regex worker is emitted as its own asset.

Browser tests ran with a locally provided Chromium (`CHROMIUM_EXECUTABLE`), following the sandbox workaround in `docs/audits/2026-09-25.md`. They cover Chromium only, not Safari, Firefox, or real devices.
