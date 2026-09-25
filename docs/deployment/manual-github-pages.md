# Manual GitHub Pages demo

Use this when GitHub blocks the automated workflow upload because the connected App does not have `workflows` permission.

## 1. Add the workflow manually

On GitHub, open the repository and choose **Add file → Create new file**. Create this path:

```text
.github/workflows/pages.yml
```

Paste the contents of the existing local file [`../../.github/workflows/pages.yml`](../../.github/workflows/pages.yml), then choose **Commit changes**. This manual commit is allowed even when API-based workflow updates are restricted.

## 2. Enable Pages

Open **Settings → Pages** and set **Source** to **GitHub Actions**. The workflow already requests the required `pages: write` and `id-token: write` permissions.

## 3. Run the demo

1. Open the repository's **Actions** tab.
2. Select **Deploy to GitHub Pages**.
3. Choose **Run workflow** and select `main`.
4. Open the URL shown in the completed `github-pages` deployment.

For this repository the expected project-site URL is:

```text
https://kyabtao.github.io/ClickHub/
```

## 4. Add CI manually (optional)

Repeat **Add file → Create new file** with:

```text
.github/workflows/ci.yml
```

Paste the contents of the existing local file [`../../.github/workflows/ci.yml`](../../.github/workflows/ci.yml). It runs unit tests, the production build, and Chromium browser tests for pushes and pull requests.

## Local fallback

To demonstrate the site without GitHub Pages, run:

```sh
npm ci
npm run build
npm run preview
```

Then open the printed preview URL at `/ClickHub/`.
