# Asset provenance

## Real portraits

The user supplied both portraits. Optimized responsive JPEG exports preserve Mike's face and appearance. They were not replaced or generated.

## Illustrative book image

Generated with the built-in image_gen tool, not the CLI/API fallback. Inspected visually before use. Final project files:

- `assets/editorial-book-1440.jpg` (124,983 bytes)
- `assets/editorial-book-720.jpg` (38,480 bytes)

The image is atmosphere only: not a represented author's book, adaptation credit, client publication, or testimonial. Its empty alt text reflects its decorative use beside complete semantic film-rights content.

Final generation prompt:

> Create a photographic editorial still life for a sophisticated independent literary and film rights agent's website. Wide landscape 3:2 composition. One real-looking unbranded open hardcover book, ivory deckled pages gently arcing, on a deep midnight navy almost black desk. The book occupies the right half, seen from low oblique angle. A narrow shaft of warm late-afternoon window light falls diagonally across the pages and casts long, physical shadows to the left. Subtle dark wood in background, very restrained atmosphere, quiet analog 35mm film quality, realistic paper fibers and binding, tactile and elegant. Left half mostly dark negative space. Rich natural chiaroscuro, restrained champagne highlights, no glowing effects, no floating objects, no fantasy, no people, no cameras, no film reels, no decorative props, no text, no letters, no visible book title, no logos, no watermark. This is supporting illustrative atmosphere, not a book cover or a real literary client's work.

## Fonts

Cormorant Garamond (normal and italic variable Latin WOFF2) and Manrope (normal variable Latin WOFF2) were downloaded from Google's font distribution and are served locally. Original SIL Open Font License files are included in `assets/fonts/`. Combined font payload: 101,736 bytes. No font scripts, external runtime font calls, or new npm packages were added.

## Favicon

Original code-authored MP monogram in SVG, ICO, and Apple touch PNG variants, matching the page palette.

## Independent-profile architectural background

## Local source-reference codes

`assets/caa-company-qr.png` encodes exactly `https://www.caa.com/about-us`; generated locally with the temporary `qrcode` package (296px, four-module margin, medium error correction). `assets/reference-barcode.svg` encodes exactly `BKSTD2357400` in Code 128, generated with temporary `bwip-js` tooling. Both payloads were decoded with ZXing; the barcode was decoded from its Chrome-rendered screenshot. These are reference tools, not credentials or proof of affiliation. Tooling is not shipped as website JavaScript and no production dependency was added.

## Architectural background provenance

Generated with the built-in image_gen tool, not the CLI fallback. The generated output was visually inspected and exported to responsive project assets:

- `assets/profile-atrium-1600.jpg` (176,617 bytes)
- `assets/profile-atrium-800.jpg` (56,731 bytes)

This is an original illustrative office-atrium image, not Mike's actual office or a CAA building. It has no logo, signage, or agency identifiers. The existing real portrait was not regenerated or altered.

Final generation prompt:

> Original architectural editorial photograph, wide 16:9 landscape, generic contemporary professional office atrium at blue hour. Full-height glass curtain walls, dark navy metal mullions, pale textured stone wall, soft recessed downlights, reflective stone floor, quiet sophisticated atmosphere. View across an empty lobby, with dark negative space in left and central two thirds for a white typography overlay. Subtle cool blue daylight in the right third. Realistic restrained photography, no people, no logos, no signage, no text, no seals, no identifiable real company office or landmark, no distinctive trademarked architecture. It should feel like a real architectural magazine photo, not a fantasy render, with natural materials and straight perspective. Intended as an atmospheric background for an independent literary agent's profile, not evidence of a real office or affiliation.
