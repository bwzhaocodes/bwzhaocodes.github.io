# Bowen Zhao (赵博文) — Personal Homepage

Website: https://bwzhaocodes.github.io/

The site is built from Markdown and YAML into complete static HTML before publication. Visitors and search engines receive the biography, publications, awards and metadata in the initial response; no browser-side Markdown requests or MathJax are needed.

## Editing and local preview

- Edit the biography, publications and awards in `contents/*.md`.
- Edit the page title, description, canonical URL and existing labels in `contents/config.yml`.
- Edit layout and metadata markup in `templates/index.html`.
- Keep photos and certificates in `static/assets/`.

Use Node.js 24 (no npm installation is required):

```sh
node --test
node scripts/build.js
node scripts/build.js --output _site
python3 -m http.server 8000 --bind 127.0.0.1 --directory _site
```

Open `http://127.0.0.1:8000/`. The root `index.html`, `robots.txt` and `sitemap.xml` are generated files; edit their sources and rebuild rather than editing them directly. Commit the updated sources and generated root files together. The deployment artifact in `_site/` contains only the website and its runtime assets.

## Publishing with GitHub Pages

One-time setup: in this repository's **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source. The `Build and deploy GitHub Pages` workflow validates and builds changes on pull requests, then builds and publishes the current Markdown and YAML when `main` is updated. A failed check or build prevents this workflow from deploying. It can also be run manually from Actions.

The checked-in root HTML also permits local previews and retains a usable static page for repositories still publishing from the root of `main`. For future automatic Markdown builds, use the Actions source above.

## Loading and fonts

The banner uses a 1920 × 400 WebP derived from the original `background.jpeg`, which remains as the editable source. Mulish, Newsreader and Kanit Latin fonts are self-hosted with `font-display: swap`; their SIL Open Font Licenses are included next to the WOFF2 files. Chinese text uses system fallback fonts. Section icons are inline SVG, and both runtime scripts are deferred. The site does not depend on Google Fonts, an icon CDN or math libraries to render.

## Page-view counter

The footer uses [Busuanzi](https://busuanzi.ibruce.info/) to display cumulative site page views (PV). The asynchronous script loads only when the hostname matches `site-url`, so localhost and preview domains do not generate requests to the live counter. The label stays hidden until the service returns data, and is hidden if the script fails to load. Previously unrecorded visits cannot be recovered; repeated page loads may count again. Anchor navigation within this one-page site does not reload the counter.

If you change the site's domain, update `site-url` and rebuild. The counter service's data is tied to its own site-identification rules and is not guaranteed to transfer to a new domain. Live counter data must be verified after deployment; local tests do not send production counting requests.

## Credits and license

Based on [Sen Li's academic homepage template](https://github.com/senli1073/academic-homepage-template) and Start Bootstrap New Age. The existing MIT license is preserved. Build-time Markdown and YAML parsing reuse the repository's bundled Marked and js-yaml libraries; their license headers remain intact.
