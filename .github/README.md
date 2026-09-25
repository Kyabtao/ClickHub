# GitHub configuration

Workflows are stored in `workflows/`:

- `ci.yml` runs unit tests and the production build on pushes and pull requests, then runs the Chromium end-to-end suite and uploads its report.
- `pages.yml` builds and publishes `dist/` to GitHub Pages after pushes to `main` (or manually via **Actions → Deploy to GitHub Pages → Run workflow**).

For the first deployment, open repository **Settings → Pages**, choose **GitHub Actions** as the source, and ensure the Pages workflow has permission to write Pages and the `github-pages` environment is available. Pull requests do not deploy.
