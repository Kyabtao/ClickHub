# Design refresh

A visual pass over the home page and the tool dialog, made before merging to `main`. Colours, typography and the dark theme are unchanged.

## Changes

| Area | Before | After |
| --- | --- | --- |
| Tool browsing | One flat grid of 54 tall, identical cards. On phones that was a single column over 50 screens long | With all tools shown and no search, tools are grouped under category headings with counts. A "Jump to a category" chip row sits above them (scrolls sideways on phones), and each chip moves focus to its heading. Search, a category filter, Favorites and Recently used show a flat list with category tags |
| Cards | Headings and paragraphs inside a `<button>` (invalid HTML). Large empty areas | Compact layout: icon, name, two-line description, star. Only the tool name is the button (its accessible name is just the tool name), stretched over the card so the whole card is clickable. On phones cards are about a third of their former height |
| Icons | Encoding Converter's icon `</>` was inserted as HTML and vanished. Six tools shared `◫` and five shared `▤` | Card content is HTML-escaped. Sixteen tools have new, distinct glyphs; multi-letter icons (PDF, OCR, CSV…) use a tighter style |
| Header and hero | Placeholder "CH" avatar and "Personal edition" tagline. Hero copy mentioned only three tools | "Local-first · Works offline" indicator. Live stats (tools, categories, 0 uploads) from the registry. Hero copy covers the whole toolbox and adds a "See tool status" link. Tighter hero on phones so search appears on the first screen |
| Tool dialog | Plain title and a square close button with a heavy focus box. Main action not always highlighted | Tool icon beside the title. Heading stays visible while long tools scroll, with `scroll-padding-top` so focused fields aren't hidden under it. Round close button with a rounded focus ring. Privacy line marked with a dot. "Format JSON" is now the highlighted primary action |
| Small fixes | Full-width "＋" showed as an empty box in some fonts; group count badges would have failed contrast | Plain "+" with the status link aligned right; badges use the surface colour with a border |

## Validation

- `npm test`: 82/82 unit tests pass.
- `npm run test:e2e`: 158/158 tests pass in desktop and Pixel 7-emulated Chromium. The new `tests/e2e/design.spec.js` checks:
  - 16 groups and jump links, with focus moving to the heading;
  - the heading and button structure, and the escaped `</>` icon;
  - flat lists for search and category filters;
  - clicking anywhere on a card, the dialog icon, and the primary action;
  - favourites keeping focus;
  - axe WCAG A/AA checks in both themes, with no horizontal overflow.
- Screenshots were reviewed at 1440×900 (light and dark) and on Pixel 7 for the home page, grouped cards, search results and tool dialogs.
