// Prepare the public-only directory served by GitHub Pages.
import { mkdir, copyFile, cp } from 'node:fs/promises';
import { PAGES } from './site-pages.mjs';
import './build-pages.mjs';
await mkdir('docs', { recursive: true });
for (const file of [...PAGES.map(page=>page.file), 'styles.css', 'editorial.css', 'accreditation.css', 'script.js', 'config.js', 'robots.txt', 'sitemap.xml']) {
  try { await copyFile(file, `docs/${file}`); }
  catch (error) { if (file !== 'sitemap.xml' || error.code !== 'ENOENT') throw error; }
}
await cp('assets', 'docs/assets', { recursive: true });
await copyFile('.nojekyll', 'docs/.nojekyll');
console.log('Public website prepared in docs/');
