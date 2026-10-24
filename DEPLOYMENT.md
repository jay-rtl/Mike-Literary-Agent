# GitHub Pages deployment

The user authorized deployment after supplying the repository URL. GitHub confirmed this is an empty public repository with push and administration access.

- Repository: https://github.com/jay-rtl/Mike-Literary-Agent
- Public website: https://jay-rtl.github.io/Mike-Literary-Agent/
- Publishing source: `main`, `/docs`
- HTTPS: enforced in the GitHub Pages API response
- No custom domain or DNS changes

`publish.mjs` copies only the public HTML, CSS, JavaScript, configuration, robots, sitemap, and portrait assets into `docs/`. `.nojekyll` disables Jekyll processing. Source, tests, screenshots, development tooling, and audit notes are not served.

Canonical, Open Graph URL, absolute social-image URLs, robots sitemap reference, and one-page sitemap now use the confirmed GitHub Pages URL. These supersede the domain-related pending items in the original local audit (`AUDIT.md`).

The user subsequently supplied `mike.petro@lexiconinkhouse.com`. It is configured in `config.js` and `docs/config.js` for manually sendable email drafts. Visitors must review and send their own message; the copy fallback remains available. No email sending service or database was introduced. This supersedes the missing-recipient item in the original local audit.

Current local validation: 31 Chrome assertions, including the user-supplied inquiry recipient, plus JavaScript syntax checks. Prior checks include eight sampled contrast checks and representative responsive screenshot review. Actual email-application handoff, screen readers, physical-device/cross-browser validation, Lighthouse/field Core Web Vitals, and jurisdiction-specific legal review remain untested as documented in `AUDIT.md`.

## Recipient update audit

- Implemented: configured the supplied address in source and published configuration; updated documentation and deployment verification.
- Design review: no visual change requested; existing responsive design retained.

| Category | Status | Evidence |
| --- | --- | --- |
| Functionality | PASS | Browser draft recipient equals the supplied address; validation and both copy fallbacks pass. |
| SEO | PASS | Existing title, description, anchors, and structured-data parsing still pass. |
| Responsive/Visual | PASS | Browser overflow checks pass at five widths, 320–1440px; no layout edits. |
| Accessibility | PASS | Scoped keyboard, field-error/focus, and reduced-motion checks pass. Full conformance is not claimed. |
| Security/Privacy | PASS | Draft activation intercepted during testing; no automatic sending or third-party submission requests. |
| Performance | NOT TESTED | No new Lighthouse or Core Web Vitals measurements. |
| Code/Regression | PASS | `npm run check`, `npm run prepare:publish`, and `node tests/browser-audit.mjs` (31 checks, Windows headless Chrome). |

Outstanding: actual email application opening and manual delivery remain NOT TESTED. No test message has been sent. Launch readiness: READY FOR REVIEW. Next action: review a prepared draft using a configured email application and send only if desired.

Status and live HTTP verification are recorded separately in `tests/deployment-results.json` after publication.
