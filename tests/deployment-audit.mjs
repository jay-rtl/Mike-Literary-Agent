import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
const credential = spawnSync('git', ['credential', 'fill'], {
  input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf8',
  env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'Never' }
});
if (credential.status !== 0) throw new Error('Existing GitHub credential unavailable');
const auth = Object.fromEntries(credential.stdout.trim().split('\n').map(line => {
  const split = line.indexOf('='); return [line.slice(0, split), line.slice(split + 1)];
}));
const headers = { Authorization: `Bearer ${auth.password}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
const api = 'https://api.github.com/repos/jay-rtl/Mike-Literary-Agent';
async function get(path) {
  const response = await fetch(api + path, { headers });
  const raw = await response.text();
  if (!response.ok) throw new Error(`GitHub ${path}: HTTP ${response.status}`);
  return raw ? JSON.parse(raw) : {};
}
const results = await Promise.allSettled([get('/pages'), get('/actions/runs?per_page=5')]);
for (const result of results) if (result.status === 'rejected') throw result.reason;
const [pages, actions] = results.map(result => result.value);
const head = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
const run = actions.workflow_runs.find(item => item.head_sha === head);
console.log(JSON.stringify({ url: pages.html_url, pagesStatus: pages.status, https: pages.https_enforced, source: pages.source, head, run: run && { status: run.status, conclusion: run.conclusion, url: run.html_url } }));
if (!run || run.status !== 'completed') { process.exitCode = 2; }
else if (run.conclusion !== 'success') { throw new Error('Deployment workflow failed'); }
else {
  const base = pages.html_url;
  const paths = ['', 'styles.css', 'editorial.css', 'script.js', 'config.js', 'robots.txt', 'sitemap.xml', 'assets/mike-petro-hero-1100.jpg', 'assets/mike-petro-hero-550.jpg', 'assets/mike-petro-about-491.jpg', 'assets/mike-petro-about-246.jpg', 'assets/favicon.svg', 'assets/favicon.ico', 'assets/apple-touch-icon.png', 'assets/editorial-book-1440.jpg', 'assets/editorial-book-720.jpg', 'assets/fonts/cormorant-latin.woff2', 'assets/fonts/cormorant-italic-latin.woff2', 'assets/fonts/manrope-latin.woff2'];
  const responses = await Promise.allSettled(paths.map(async path => {
    const response = await fetch(base + path, { cache: 'no-store' });
    const bytes = new Uint8Array(await response.arrayBuffer());
    return { path: path || '/', status: response.status, bytes: bytes.length, contentType: response.headers.get('content-type'), text: /\.(css|js|txt|xml)$/.test(path) || !path ? new TextDecoder().decode(bytes) : undefined };
  }));
  for (const response of responses) if (response.status === 'rejected') throw response.reason;
  const files = responses.map(response => response.value);
  for (const file of files) if (file.status !== 200 || file.bytes === 0) throw new Error(`Live asset failed: ${file.path} HTTP ${file.status}`);
  const html = files[0].text;
  if ((html.match(/href="mailto:mike\.literaryagent@gmail\.com"/g) || []).length !== 2) throw new Error('Live visible email links missing');
  if (!html.includes('href="editorial.css"')) throw new Error('Live editorial stylesheet missing');
  for (const icon of ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png']) if (!html.includes(`href="assets/${icon}"`)) throw new Error(`Live icon link missing: ${icon}`);
  if (!html.includes(`<link rel="canonical" href="${base}">`) || !html.includes(`property="og:url" content="${base}"`)) throw new Error('Live canonical/social URL mismatch');
  if (!files.find(file => file.path === 'sitemap.xml').text.includes(`<loc>${base}</loc>`)) throw new Error('Live sitemap URL mismatch');
  const localConfig = await readFile('config.js', 'utf8');
  if (files.find(file => file.path === 'config.js').text.replace(/\r\n/g, '\n').trim() !== localConfig.replace(/\r\n/g, '\n').trim()) throw new Error('Live recipient configuration differs from source');
  const report = { head, url: base, httpsEnforced: pages.https_enforced, workflow: { conclusion: run.conclusion, url: run.html_url }, files: files.map(({ text, ...file }) => file), checks: ['Deployed workflow succeeded for pushed commit', `All ${paths.length} public page/asset URLs returned HTTP 200`, 'SVG, ICO, and Apple touch icon links present', 'Live canonical and Open Graph URL match confirmed address', 'Live sitemap matches confirmed address', 'Live recipient configuration matches source'] };
  await writeFile('tests/deployment-results.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
