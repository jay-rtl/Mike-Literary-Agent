# Hostinger deployment

Live site: https://mikepetro.independentliteraryagent.net/

## Implemented

Deployed the existing eight-page static portfolio to the confirmed subdomain directory `/home/u346597028/domains/independentliteraryagent.net/public_html/mikepetro` over SSH/SCP. Other domains and the parent WordPress installation were not modified. The original `default.php` remains; `DirectoryIndex index.html` selects the portfolio.

`hostinger-build.mjs` prepares `.local-deploy/hostinger-public/` from `docs/`, updates canonical/social/sitemap/robots addresses to the custom domain, and adds directory indexing protection and permanent redirects for legacy `.html` links and explicit `index.html` aliases. GitHub Pages output is maintained separately.

Before publication, the existing subdomain folder was backed up outside the web root at `/home/u346597028/deployment-backups/mikepetro.zYD3eAtk.tar.gz`. The uploaded release is retained at `/home/u346597028/deployment-releases/mikepetro.zYD3eAtk`. No database migration or DNS change was needed.

Deployment keys, known hosts, release archive, and machine-readable verification results remain under ignored `.local-deploy/`. They are excluded from the public build. SSH private keys must never be committed or uploaded to the web root.

## Design review

Preserved the existing editorial typography, navy/gold homepage, red reference page, real portraits, borderless menu, and motion fallbacks. Inspected live homepage screenshots at 1440px and 390px and the reference section at desktop/mobile sizes. The visible keyboard focus outline on the menu remains for accessibility.

## Audit matrix

| Category | Status | Scope and evidence |
|---|---|---|
| Functionality | PASS | Eight rendered routes; 34 public file responses; seven 301 legacy-page redirects preserving query strings; two index aliases; mobile menu/Escape; contact email; both print buttons; four-page live A4 PDF. |
| SEO | PASS | Domain-specific canonical URLs, social-image URLs, sitemap, robots, clean routes, HTTP-to-HTTPS redirect. No indexing guarantee. |
| Responsive/Visual | PASS | Eight desktop routes checked for overflow and main-image loading; homepage checked at 768/390px; reference desktop/mobile checks; actual desktop/mobile screenshots inspected. |
| Accessibility | PASS | Scoped keyboard menu/Escape, retained focus outline, semantic reference content, descriptive image/link text, and reduced-motion browser path. |
| Accessibility: full conformance | NOT TESTED | No screen-reader, full WCAG, zoom, or real-device audit in this deployment. |
| Security/Privacy | PASS | Scoped checks: encrypted deployment, ignored private key, backup outside web root, HTTPS, local release files only, nosniff, and reference-page CSP tests blocking external connections/scripts/frames. No server-wide security certification. |
| Performance | NOT TESTED | No Lighthouse or real-user Core Web Vitals measurement. Hostinger CDN processes image responses; original server assets were verified separately. |
| Code/Regression | PASS | Build/syntax checks; all 43 deployed origin files matched SHA-256; live HTML/CSS/JS/font/SVG content matched release; no JavaScript exceptions in the browser audit. |

## Tests run

Windows, Node v24, installed Chrome headless; live custom domain over HTTPS:

- `npm run prepare:publish`, `npm run check`, `node hostinger-build.mjs`, `node --check hostinger-build.mjs`.
- `node tests/hostinger-audit.mjs`: 34 public files, eight routes/canonicals, seven legacy redirects, two index redirects, HTTPS redirect passed.
- `node tests/hostinger-browser.mjs`: eight rendered routes, 768/390px homepage, main image loading, menu/Escape, Gmail link, two print controls, four-page PDF, and no JS exceptions passed.
- `MIKE_REVIEW_URL=https://mikepetro.independentliteraryagent.net/ node tests/reference-details.mjs`: live source context, no form, protected source links, referrer metadata, responsive checks, and CSP probes passed. This is environment-variable notation; set the variable using the appropriate shell syntax on Windows.
- SSH `sha256sum -c` verified all 43 origin files. Public raster-image hashes differed because the CDN served processed versions; formats and browser loading were checked separately. Live QR decoding with ZXing verified the CAA About destination.

Initial remote browser run reached its fixed 600ms assertion before page load completed. Added a bounded readiness wait and reran successfully. Initial exact public-image hash assertion detected CDN processing; origin hash verification confirmed the uploaded originals, and public-image tests were separated from exact static-text/font verification. Archive timestamps ahead of the server clock were normalized after upload.

## Outstanding items and readiness

No known deployment-blocking defect. Supplied historical reference details remain explicitly qualified; CAA company information is not evidence of personal accreditation. Physical printing, other browser engines, screen readers, and performance metrics remain untested. The contact form prepares a draft for the user's own email app; it has no server submission backend.

READY FOR LAUNCH — custom-domain publication and scoped deployment checks passed; remaining verification limits are recorded above.

Next action: review the live custom-domain site. For a future release, run `npm run prepare:publish` and `node hostinger-build.mjs`, archive the isolated public directory, back up the exact target folder, upload, and rerun both Hostinger audits. Keep credentials outside tracked files and public assets.
