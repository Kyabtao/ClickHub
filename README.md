# ClickHub

A personal, browser-first toolbox planned for free hosting on GitHub Pages.

## Project status

Folder scaffolding only. Tools, the application shell, build configuration, and deployment automation have not been implemented yet. Empty folders contain `.gitkeep` files so Git preserves the structure.

## Repository layout

```text
ClickHub/
├── .github/workflows/   # Future CI and Pages deployment workflows
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

- [Folder conventions](docs/architecture/folder-structure.md)
- [Implementation roadmap](docs/planning/roadmap.md)
- [GitHub Pages requirements](docs/deployment/github-pages.md)
