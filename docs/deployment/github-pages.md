# GitHub Pages deployment requirements

The Vite build is configured with base `/ClickHub/` and generates `dist/`. Hash routing is implemented. The repository includes `.github/workflows/pages.yml`, which builds and publishes `dist/` to GitHub Pages after pushes to `main`, and can also be started manually. `.github/workflows/ci.yml` validates pushes and pull requests.

## Paths

The default project site is typically `https://<owner>.github.io/ClickHub/`. Keep the repository root clean by generating the published site into `dist/` and deploying that directory through GitHub Actions.

- Configure the build base path for `/ClickHub/` on a project site, or `/` on a root-domain site.
- Derive asset, worker, and data URLs from the configured base; do not hardcode root-relative paths such as `/assets/...`.
- Prefer hash routing initially so tool navigation and refreshed links work without server rewrite rules.
- Scope any future service worker to the deployed site base.
- Verify production output under the project subpath, not only at the local server root.

## Boundaries

GitHub Pages serves static files; it does not run a backend or store secrets. Published site assets are accessible to visitors. Personal use does not automatically make a Pages site private.

Default to browser-local processing. External integrations must disclose their dependency, rate limits, privacy implications, and CORS requirements. Never embed private API keys or GitHub tokens in the frontend.

Offline support requires an explicit caching implementation; storing data locally alone does not make the application load offline. Advanced WebAssembly tools must be checked for browser support and required security headers before adoption.
