# Folder conventions

## Tool organization

Every tool belongs to one primary category under `src/tools/`:

| Folder | Contents |
| --- | --- |
| `text/` | Writing, text cleaning, Markdown |
| `developer/` | Formats, encodings, programming helpers |
| `data/` | CSV, tables, statistics, charts |
| `math-science/` | Mathematics, units, science calculators |
| `finance/` | Budget and financial calculators |
| `productivity/` | Tasks, notes, timers, planning |
| `media-files/` | Images, PDFs, audio, video, archives |
| `design/` | Colors, CSS, typography, SVG |
| `security/` | Random generation, hashes, local security utilities |
| `education/` | Study aids, quizzes, learning tools |
| `language/` | Vocabulary, transliteration, language references |
| `seo-marketing/` | Metadata, schema, campaign helpers |
| `business/` | Documents, invoices, office templates |
| `travel/` | Itineraries, time zones, travel calculators |
| `health-fitness/` | General wellness and workout utilities |
| `home-lifestyle/` | Recipes, household planning, DIY |
| `accessibility/` | Accessibility checking and authoring helpers |
| `games/` | Puzzles, games, entertainment |
| `github/` | README, repository, and open-source helpers |

GitHub Actions automation belongs in `.github/workflows/`, not in a browser tool category. Supporting scripts belong in `scripts/`.

## Individual tool folders

Create tool subfolders when implementing a tool, using lowercase kebab-case:

```text
src/tools/developer/json-formatter/
├── index.js       # Public entry point (illustrative)
├── logic.js       # Pure processing functions
├── metadata.json  # Name, description, category, capability requirements
└── styles.css     # Tool-specific styles when needed
```

This is an organizational convention, not a committed framework choice. File extensions may change with the chosen stack. Do not create empty implementation files or register unfinished tools as usable.

## Shared code and assets

- `src/app/`: application shell, navigation, routing, and tool registry.
- `src/components/layout/`: shared page layout components.
- `src/components/ui/`: reusable controls and feedback components.
- `src/lib/storage/`: local persistence, migrations, import/export.
- `src/lib/files/`: shared file reading, downloading, and format helpers.
- `src/lib/validation/`: shared input checks.
- `src/styles/`: global styles, themes, design tokens.
- `src/workers/`: CPU-intensive background processing.
- `src/data/`: small bundled reference datasets with attribution.
- `public/icons/`, `public/fonts/`, `public/images/`: static assets.
- `tests/unit/`, `tests/integration/`, `tests/e2e/`: mirror tool categories where relevant.
- `scripts/build/`, `scripts/maintenance/`: project automation.

## Clean-root rules

1. No tool pages, datasets, screenshots, or scratch scripts in the root.
2. Keep only the README, repository configuration, and required build/package files there.
3. Build output goes in ignored `dist/`; never mix generated output with source.
4. Never commit personal records, uploaded files, credentials, or browser-data exports.
5. Remove a folder's `.gitkeep` when real files are added directly to it.
6. Combine duplicate ideas into one tool with multiple modes; use registry tags for cross-category discovery.
