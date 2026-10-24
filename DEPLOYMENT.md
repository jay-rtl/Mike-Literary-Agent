# GitHub Pages deployment

The user authorized deployment after supplying the repository URL. GitHub confirmed this is an empty public repository with push and administration access.

- Repository: https://github.com/jay-rtl/Mike-Literary-Agent
- Public website: https://jay-rtl.github.io/Mike-Literary-Agent/
- Publishing source: `main`, `/docs`
- HTTPS: enforced in the GitHub Pages API response
- No custom domain or DNS changes

`publish.mjs` copies only the public HTML, CSS, JavaScript, configuration, robots, sitemap, and portrait assets into `docs/`. `.nojekyll` disables Jekyll processing. Source, tests, screenshots, development tooling, and audit notes are not served.

Canonical, Open Graph URL, absolute social-image URLs, robots sitemap reference, and one-page sitemap now use the confirmed GitHub Pages URL. These supersede the domain-related pending items in the original local audit (`AUDIT.md`).

The recipient address remains intentionally blank in `config.js` and `docs/config.js`. Visitors can prepare/copy drafts or call Mike; recipient-addressed email handoff remains unavailable until the real address is set. No email sending service or database was introduced.

Prior local validation: 30 Chrome assertions, eight sampled contrast checks, representative responsive screenshot review, and JavaScript syntax checks. Actual email-application handoff, screen readers, physical-device/cross-browser validation, Lighthouse/field Core Web Vitals, and jurisdiction-specific legal review remain untested as documented in `AUDIT.md`.

Status and live HTTP verification are recorded separately in `tests/deployment-results.json` after publication.
