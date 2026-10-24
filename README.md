# Mike Petro portfolio

A dependency-free, local static website. Nothing has been deployed or pushed.

## Preview

Run `npm start` from this directory, then open http://127.0.0.1:4173.
Alternatively, open `index.html` directly. Clipboard access may be restricted on local files; the select-and-copy fallback remains available.

## Set the recipient

In **config.js**, set the single `recipientEmail` value to Mike's confirmed email address:

```js
window.MIKE_PETRO_CONFIG = Object.freeze({ recipientEmail: "" });
```

The empty value is intentional. No recipient has been invented. Until configured, valid form submission prepares a copyable draft and explains that email inquiries are unavailable, with Mike's telephone number as the alternative.

Once configured, the form validates full name, email, book title, and message; prepares all completed fields; and activates a `mailto:` link. The visitor's email application is responsible for opening the draft. The visitor must review and click Send. Opening an application cannot be reliably detected, so the copyable draft is always provided. Long drafts can exceed some email applications' URI limits; copy the full prepared text in that case.

The website uses no email API, database, analytics, cookies, external font service, or inquiry storage. Form values stay in page memory until the visitor copies them or opens their email application. Browser autofill and the visitor's email provider operate independently. Submission is disabled without JavaScript; the phone link remains available.

## Files

- `index.html`: all public content, metadata, and Person structured data.
- `styles.css`: design tokens, responsive layouts, and motion preferences.
- `script.js`: navigation, reveals, stage disclosures, form validation, email draft, and copy fallback.
- `config.js`: recipient configuration.
- `assets/`: responsive JPEG exports of both supplied portraits, without facial alteration.
- `robots.txt`: allows crawling. No domain or sitemap URL is fabricated.
- `server.mjs`: loopback-only development server; not production hosting.
- `reference-original.html`: untouched supplied HTML for reference. Do not publish it as a second page.
- `tests/`: local browser audit scripts, screenshots, and observed results. Do not publish this directory.
- `AUDIT.md`: scope, evidence, and outstanding verification.

Georgia and Arial provide the editorial serif/sans pairing through system fonts, avoiding third-party font requests and font-loading shifts. The source information has been reorganized and edited; services, author categories, rights caveats, and professional disclaimer are retained. No new affiliations, achievements, testimonials, or adaptation credits are claimed.

## Publication checklist

1. Set and confirm the recipient email address.
2. Supply the production domain. Add the canonical URL and `og:url`; convert social image URLs to absolute public URLs; generate a one-page sitemap and reference it in `robots.txt`.
3. Test the configured inquiry on actual desktop and mobile email applications, including the copy fallback and a longer draft.
4. Review final professional copy and any jurisdiction-specific privacy notice, including the hosting provider's access logs and Mike's email retention/access practices. These have not been supplied.
5. Serve over HTTPS and verify production headers, redirects, crawlability, and social previews.

Publish only `index.html`, `styles.css`, `script.js`, `config.js`, `robots.txt`, and `assets/` to the same public root. Do not publish the full workspace. Deployment requires separate authorization.

## Verification

`npm run check` checks JavaScript syntax. `node tests/browser-audit.mjs` and `node tests/visual-review.mjs` use a local Chrome DevTools endpoint at `127.0.0.1:9222` and the preview server at `127.0.0.1:4173`. They require Chrome to be started separately with a dedicated test profile and remote debugging enabled. The audit uses an example recipient in browser memory only and intercepts the mailto activation, so no real email application or delivery is tested. No browser or test dependency needs installation.
