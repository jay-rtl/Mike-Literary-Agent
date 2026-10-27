# Clean URLs

## 1. Implemented

Removed `.html` from all public navigation, page links, canonical/social URLs, and sitemap URLs. Pages are now `/`, `/about/`, `/representation/`, `/global-rights/`, `/film-television/`, `/for-authors/`, `/accreditation/`, and `/contact/` under the existing GitHub Pages repository base.

The generator writes real `<route>/index.html` files. It rewrites links, images, responsive sources, fonts, styles, and scripts with route-relative paths. Publishing copies these directories into `docs/`; the local server supports the same routes and adds missing trailing slashes. No hosting migration, DNS change, dependency, or new infrastructure was introduced.

Old flat `.html` documents forward to the corresponding clean route. A small same-origin `routing.js` preserves query parameters and fragment identifiers and normalizes explicit `index.html` aliases. Forwarding documents also have canonical targets, meta-refresh, and a normal destination link. Existing home section-fragment redirects now target clean routes.

Changed: `site-pages.mjs`, `build-pages.mjs`, `publish.mjs`, `server.mjs`, `script.js`, `routing.js`, package checks, generated page directories/legacy forwarding documents/sitemap, verification scripts, README, and public `docs/` output.

## 2. Design review

No visual redesign. Manually reviewed current Representation at 390px and Accreditation at 1440px after route migration; typography, images, and layouts remain intact. Browser measurements cover four widths on all eight pages, plus the homepage at 1024px. The reference document still renders as one A4 page.

## 3. Audit matrix

| Category | Status | Scope/evidence |
| --- | --- | --- |
| Functionality | PASS | 95 multipage checks: clean URLs, all links/fragments, seven old-file redirects retaining query/hash, home and nested index aliases, section bookmarks, images, print controls, one-page PDF, and no runtime errors. 32 existing business-flow/menu/form checks also pass. |
| SEO | PASS | Unique metadata, clean canonical/social/sitemap URLs, canonical targets on old aliases, complete crawlable directory pages. Sitemap excludes legacy `.html` aliases. |
| SEO: indexing/search behavior | NOT TESTED | No indexing or ranking claim. Canonicals/forwarding are configuration checks, not proof of search-engine consolidation. |
| Responsive/Visual | PASS | Four widths across all pages; stated screenshot review; no horizontal overflow and assets load from nested routes. |
| Accessibility: selected regressions | PASS | Existing keyboard menu/FAQ, field errors/focus, reduced motion, and no-JS content/navigation/form safeguards pass. |
| Accessibility: full assessment | NOT TESTED | No new assistive-technology/full WCAG evaluation. |
| Security/Privacy | PASS | Same-origin forwarding only; no third-party runtime requests, new data storage, dependencies, or automatic email delivery. Query/fragment handling does not execute their contents. |
| Performance: implementation review | PASS | Native static directory serving, small routing helper, no framework or proxy service; existing optimized assets reused. |
| Performance: Core Web Vitals | NOT TESTED | No representative new lab/field measurements. |
| Code/Regression | PASS | Syntax/generation/publication checks, 95 multipage assertions, 32 interaction assertions, and no recorded browser exceptions/errors. |

## 4. Tests run

Windows, local preview server, headless Chrome via CDP:

- `npm run check`: shared JS, configuration, routing, and generator syntax checks passed.
- `npm run prepare:publish`: generated clean pages, forwarding documents, sitemap, and refreshed `docs/`.
- `node tests/multipage-audit.mjs`: 95 assertions passed; `tests/multipage-results.json`.
- `node tests/browser-audit.mjs`: 32 checks passed, including manual-draft configuration/encoding, validation, clipboard/manual fallback, keyboard FAQ, menu/Escape, no-JS/reduced-motion, and no form transmission; `tests/audit-results.json`.
- `tools.view_image`: the two representative screenshots stated above.
- `node tests/deployment-audit.mjs`: final public directory pages/assets, clean canonical/sitemap URLs, seven old forwarding documents, slashless representation URL resolution, and email configuration. Results are stored locally in `tests/deployment-results.json` after publication.

## 5. Outstanding items

On GitHub Pages the old `.html` aliases are HTTP 200 forwarding documents with client/meta refresh rather than server-configurable 301 responses. Query/fragment preservation and `index.html` URL normalization require JavaScript; without it, the legacy meta-refresh/link still leads to the clean destination but may not retain parameters. All clean directory pages work directly without JavaScript.

Physical devices/other browsers, actual email delivery, physical printing, full accessibility, and measured performance retain their prior limitations. No content or credential claims changed.

## 6. Launch readiness

READY FOR REVIEW — implementation and local route/regression checks complete; final public HTTP verification recorded separately.

## 7. Next action

Open `/representation/` and use the navigation. Existing `.html` bookmarks should forward automatically; update saved links to the clean URLs when convenient.
