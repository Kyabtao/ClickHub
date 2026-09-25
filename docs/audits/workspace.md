# Personal workspace — five new tools

ClickHub now has **32 tools**. New code stays under `src/tools/productivity/` and `src/tools/finance/`, with shared collection UI in `src/components/workspace/` and storage validation in `src/lib/storage/workspace.js`.

## Features

- **Notes:** title and plain-text body, edit, delete, search.
- **Tasks:** title, optional due date, complete/incomplete toggle.
- **Habit Tracker:** habit names with explicit completion dates, undo completion, total completed days and most recent seven dates. This is not a reminder service or streak calculator; historical/future dates may be selected manually.
- **Bookmark Manager:** title and HTTP(S) URL; embedded credentials and other URL schemes are rejected. Opening a bookmark explicitly visits an external website in a new tab with `noopener noreferrer`.
- **Expense Tracker:** description, date, and positive two-decimal amounts in INR/USD/EUR/GBP. Integer cents are stored and totals are grouped by currency, not converted or combined. No bank integration or recurring expenses.

All five support create, edit, search, delete, JSON export, and validated replacement import. Deletions and imports require confirmation. Search narrows displayed records; expense totals cover all saved records.

## Persistence and backup workflow

1. Fill the form and press **Add record**. Use **Edit** and **Save changes** to update a record. Draft edits are not autosaved and are discarded on close/reload.
2. Use **Export JSON backup** regularly. Files are unencrypted and may contain personal information: keep them private.
3. To restore, choose the matching tool's backup file and press **Replace from backup…**. Import replaces the current tool's entire list after confirmation; it does not merge.
4. Import requires version 1 and the correct tool identifier. Every record is validated before a write. Invalid, wrong-tool, duplicate-ID, or oversized data is rejected without overwriting saved data.

Limits: 500 records per tool, 2 MiB serialized data/backup per tool, 200-character titles, 20,000-character note bodies, 3,660 completion dates per habit. Browser-wide storage quotas can be lower than combined per-tool limits. Storage quota failures preserve existing data and form input, with an explicit failure message.

Data is local to the browser profile and origin, not encrypted, synchronized, or protected by login. Other scripts on the same origin can access local storage. Avoid storing credentials or highly sensitive records. Browser cleanup/private sessions can remove data. A changing preview hostname is a different origin; export before moving to the final GitHub Pages URL.

If storage contains corrupt data, the tool stops rather than silently resetting it. Recover the raw `clickhub:workspace:<tool-id>` value through browser developer tools before manually repairing/removing that value. There is no automatic repair feature. Storage-disabled browsers cannot save these tools, but stateless tools remain usable.

The store checks for known changes from another tab before writing and asks you to reopen if detected. This is best-effort stale-write detection, not a cross-tab transactional lock; avoid editing the same collection simultaneously in multiple tabs.

## Validation

- **41 unit tests** pass: previous tool logic plus workspace schemas, export/import round trips, defensive copies, corrupt data, quota failures, oversized backups, stale-tab checks, URL safety, date validation, completion toggles, and exact-cent amounts.
- **84 browser tests** pass in desktop and mobile-emulated Chromium against the production build. Includes all previous tool tests plus all five workspace CRUD/search/reload/download/restore workflows, confirmation cancellation, wrong-tool imports, unsafe URLs, currency totals, blocked/quota-limited storage, oversized imports, two-tab conflicts, and stored markup rendered as text.
- Existing axe scans pass; an additional scan checks a populated Notes workspace. These checks are not a complete accessibility certification or real-device test.
- Production build succeeds under `/ClickHub/`. No server runtime or cloud storage is required. Dependency audit reports no known vulnerabilities at verification time.

## Integration changes

The modal now supports cleanup callbacks for persistent tools. Pending imports do not update a closed or replaced view. Calculator copy controls are wired only when present. Privacy text distinguishes saved workspace records from unsaved calculator inputs.

GitHub Pages deployment, offline service-worker caching, cross-device sync, encryption, automatic backup, and notifications remain outside this release. No PR push or deployment is implied by a successful local build.
