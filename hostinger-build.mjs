// Prepare an isolated Hostinger release from the published static website.
import {cp, mkdir, readFile, writeFile, readdir} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {PAGES, SITE_URL} from './site-pages.mjs';
const destination='.local-deploy/hostinger-public';
const domain='https://mikepetro.independentliteraryagent.net/';
await mkdir(destination,{recursive:true});
await cp('docs',destination,{recursive:true});
async function rewrite(folder){
  for(const entry of await readdir(folder,{withFileTypes:true})){
    const file=join(folder,entry.name);
    if(entry.isDirectory())await rewrite(file);
    else if(/\.(html|xml|txt)$/.test(file)){
      const text=await readFile(file,'utf8');
      await writeFile(file,text.replaceAll(SITE_URL,domain));
    }
  }
}
await rewrite(destination);
const routeNames=PAGES.filter(p=>p.key!=='home').map(p=>p.file.replace('.html','')).join('|');
await writeFile(join(destination,'.htaccess'),`DirectoryIndex index.html
Options -Indexes
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteCond %{THE_REQUEST} \\s/+(.*/)?index\\.html[?\\s] [NC]
RewriteRule ^(.*/)?index\\.html$ /$1 [R=301,L]
RewriteCond %{THE_REQUEST} \\s/+(${routeNames})\\.html[?\\s] [NC]
RewriteRule ^(${routeNames})\\.html$ /$1/ [R=301,L]
</IfModule>
<IfModule mod_headers.c>
Header always set X-Content-Type-Options "nosniff"
</IfModule>
`);
for(const page of PAGES){
  const html=await readFile(join(destination,page.output),'utf8');
  assert.ok(html.includes(`<link rel="canonical" href="${domain+page.path}">`),page.path);
  assert.ok(!html.includes(SITE_URL),'No old deployment URL');
}
assert.ok((await readFile(join(destination,'sitemap.xml'),'utf8')).includes(domain));
assert.ok((await readFile(join(destination,'robots.txt'),'utf8')).includes(domain+'sitemap.xml'));
console.log(`PASS: isolated Hostinger build at ${destination}; eight canonical URLs, social URLs, sitemap, robots, and clean-route rules prepared.`);
