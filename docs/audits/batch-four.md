# Batch four — ten more local tools

Total available tools: **27**. Each new tool has `logic.js` and `view.js` under its category folder.

## Scope and limitations

| Tool | Implemented behavior | Important boundary |
| --- | --- | --- |
| CSV / JSON Converter | Comma-delimited CSV ↔ arrays of string rows; quoted commas, quotes, CRLF, and multiline fields | No type inference or object-key mapping; headers remain rows. Input capped at 1 million characters. Empty JSON rows rejected. Spreadsheet formula text is preserved, with a warning. |
| JWT Inspector | Decodes Base64URL UTF-8 JSON header/payload | No signature or claim verification; no JWE support. Tokens are not uploaded or stored. |
| URL Slug Generator | ASCII/Unicode slug modes, case and separator normalization | Not a transliteration engine. Normalization removes combining marks; review output for your language. |
| Contrast Checker | WCAG relative-luminance ratio and AA/AAA text thresholds | Opaque sRGB HEX only; pass/fail uses unrounded ratio. Not an accessibility certification. |
| Date Difference | Elapsed or inclusive calendar days, weeks, and remainder | UTC date arithmetic, no business-day or holiday calendar. |
| Statistics Calculator | Count, sum, mean, median, min/max, variance, standard deviation | Floating-point precision limits; sample variance needs two observations. Welford accumulation; overflow rejected. |
| Resistor Color Calculator | Four-band resistance and tolerance range | No five/six-band or reverse color encoding. First band cannot be black. |
| Tip & Bill Splitter | Tip and equal shares, with remainder cents distributed explicitly | Two-decimal currencies; tip uses the entered bill amount including any tax. |
| Recipe Scaler | Decimal ingredient quantities scaled to serving counts | 1–200 lines; no fractions, unit conversion, or cooking-time scaling. |
| Morse Code Translator | Text ↔ Morse using spaces between letters and slash between words | Only A–Z and digits, no audio or punctuation; output text is uppercase. |

## Validation

- `npm test`: **31 passing unit tests**, including all prior tests.
- Production build: successful, with `/ClickHub/` asset base.
- Playwright: **56 passing tests** across desktop and Pixel 7 emulation in Chromium.
- New browser tests cover all ten tools, deep-link reloads, malformed input for text parsers, bidirectional conversion, no extra network requests while processing, and viewport overflow.
- Existing navigation, preference persistence, error handling, hashing, and axe accessibility regression tests still pass. Axe scans the dashboard and representative calculator, not every possible tool state.
- Shared field renderer now applies `step="any"` only to number inputs, leaving date inputs on their normal day increment.
- Browser execution used the isolated Chromium setup documented in the earlier audit. No test browser binaries or generated output were added to the repository.

The earlier audit is a historical record of the 17-tool milestone; this document records the expanded test suite. GitHub Pages deployment remains unconfigured, and these checks do not replace real-device, cross-browser, or manual assistive-technology testing.
