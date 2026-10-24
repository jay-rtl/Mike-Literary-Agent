# Mike Petro portfolio

A dependency-free static website. Source repository: https://github.com/jay-rtl/Mike-Literary-Agent

GitHub Pages is configured to serve the `docs/` directory from `main` at https://jay-rtl.github.io/Mike-Literary-Agent/.

After editing source files, run `npm run prepare:publish` to refresh `docs/`, review changes, then commit and push when authorized. GitHub Pages deploys pushes to the configured branch automatically.

## Preview

Run `npm start` from this directory, then open http://127.0.0.1:4173.
Alternatively, open `index.html` directly. Clipboard access may be restricted on local files; the select-and-copy fallback remains available.

## Set the recipient

The user-supplied inquiry address is configured in **config.js**:

```js
window.MIKE_PETRO_CONFIG = Object.freeze({ recipientEmail: "mike.petro@lexiconinkhouse.com" });
```

If this setting is ever cleared, valid submission still prepares a copyable draft and explains that the recipient is unavailable, with Mike's telephone number as the alternative.

Once configured, the form validates full name, email, book title, and message; prepares all completed fields; and activates a `mailto:` link. The visitor's email application is responsible for opening the draft. The visitor must review and click Send. Opening an application cannot be reliably detected, so the copyable draft is always provided. Long drafts can exceed some email applications' URI limits; copy the full prepared text in that case.

The website uses no email API, database, analytics, cookies, external font service, or inquiry storage. Form values stay in page memory until the visitor copies them or opens their email application. Browser autofill and the visitor's email provider operate independently. Submission is disabled without JavaScript; the phone link remains available.

## Files

- `index.html`: all public content, metadata, and Person structured data.
- `styles.css`: base design tokens and responsive layouts.
- `editorial.css`: self-hosted typography, editorial refinements, animated menu, interaction styling, and reduced-motion overrides.
- `script.js`: navigation, reveals, stage disclosures, form validation, email draft, and copy fallback.
- `config.js`: recipient configuration.
- `assets/`: responsive JPEG exports of both supplied portraits, without facial alteration.
- `robots.txt` and `sitemap.xml`: public GitHub Pages crawl configuration. Canonical and social URLs use the confirmed Pages address.
- `server.mjs`: loopback-only development server; not production hosting.
- `reference-original.html`: untouched supplied HTML for reference. Do not publish it as a second page.
- `tests/`: local browser audit scripts, screenshots, and observed results. Do not publish this directory.
- `AUDIT.md`: scope, evidence, and outstanding verification.

Cormorant Garamond and Manrope are self-hosted in `assets/fonts/`, with their SIL Open Font Licenses; system fallback fonts remain available. Visitors make no third-party font requests. Two fonts are preloaded. Both real portraits remain unchanged; the film section uses an illustrative generated book still life, documented in `ASSETS.md`. The source information has been reorganized and edited; services, author categories, rights caveats, and professional disclaimer are retained. No new affiliations, achievements, testimonials, or adaptation credits are claimed.

## Publication checklist

1. Confirm any future recipient changes with Mike; the currently supplied address is configured.
2. If moving to a custom domain, update the canonical URL, `og:url`, absolute social image URLs, sitemap, and robots sitemap reference together.
3. Test the configured inquiry on actual desktop and mobile email applications, including the copy fallback and a longer draft.
4. Review final professional copy and any jurisdiction-specific privacy notice, including the hosting provider's access logs and Mike's email retention/access practices. These have not been supplied.
5. Serve over HTTPS and verify production headers, redirects, crawlability, and social previews.

Publish only the contents of `docs/`. The source, tests, audit files, and development server are not part of the served website. Further deployment changes require user authorization.

## Verification

`npm run check` checks JavaScript syntax. `node tests/browser-audit.mjs` and `node tests/visual-review.mjs` use a local Chrome DevTools endpoint at `127.0.0.1:9222` and the preview server at `127.0.0.1:4173`. They require Chrome to be started separately with a dedicated test profile and remote debugging enabled. The audit uses an example recipient in browser memory only and intercepts the mailto activation, so no real email application or delivery is tested. No browser or test dependency needs installation.
