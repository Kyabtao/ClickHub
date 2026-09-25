# Implementation roadmap

Current state: directory scaffold only. No working tools yet.

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
