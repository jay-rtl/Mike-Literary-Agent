import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { PAGES } from './site-pages.mjs';
const root = process.cwd();
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8' };
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const page = PAGES.find(page=>pathname===`/${page.path}`);
    const missingSlash=PAGES.find(page=>page.path&&pathname===`/${page.path.slice(0,-1)}`);
    if(missingSlash){res.writeHead(301,{Location:`/${missingSlash.path}${new URL(req.url,'http://localhost').search}`}).end();return;}
    const file = resolve(root, page ? page.output : '.'+pathname);
    const relative=file.slice(root.length+1).split(sep).join('/');
    if (!file.startsWith(root + sep) || ![...PAGES.flatMap(page=>[page.file,page.output]), 'styles.css', 'editorial.css', 'accreditation.css', 'config.js', 'script.js', 'routing.js', 'robots.txt', 'sitemap.xml'].includes(relative) && !file.startsWith(resolve(root, 'assets') + sep)) {
      res.writeHead(404).end('Not found'); return;
    }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    res.end(body);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(4173, '127.0.0.1', () => console.log('Local preview: http://127.0.0.1:4173'));
