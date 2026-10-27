import assert from 'node:assert/strict';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {PAGES} from '../site-pages.mjs';
const base='https://mikepetro.independentliteraryagent.net/';
const root='.local-deploy/hostinger-public';
const hashes=[],cdnImages=[];
async function files(folder,prefix=''){
  const result=[];
  for(const f of await readdir(folder,{withFileTypes:true})){
    if(f.name.startsWith('.'))continue;
    if(f.isDirectory())result.push(...await files(`${folder}/${f.name}`,`${prefix}${f.name}/`));
    else if(!PAGES.some(p=>p.key!=='home'&&p.file===prefix+f.name))result.push(prefix+f.name);
  }
  return result;
}
const digest=b=>createHash('sha256').update(b).digest('hex');
const results=await Promise.allSettled((await files(root)).map(async path=>{
  const response=await fetch(base+path,{cache:'no-store'});
  assert.equal(response.status,200,path);
  const actual=Buffer.from(await response.arrayBuffer());
  const original=await readFile(`${root}/${path}`);
  if(/\.(png|jpg)$/.test(path)){
    assert.ok(actual.length>100,`Nonempty image: ${path}`);
    assert.equal(actual.subarray(0,2).toString('hex'),original.subarray(0,2).toString('hex'),`Image format: ${path}`);
    if(digest(actual)!==digest(original))cdnImages.push(path);
  }else assert.equal(digest(actual),digest(original),`Live bytes: ${path}`);
  hashes.push(path);
}));
for(const r of results)if(r.status==='rejected')throw r.reason;
for(const page of PAGES){
  const response=await fetch(base+page.path);
  const html=await response.text();assert.equal(response.status,200);
  assert.ok(html.includes(`<link rel="canonical" href="${base+page.path}">`));
  if(page.key!=='home'){
    const old=await fetch(base+page.file+'?review=1',{redirect:'manual'});
    assert.equal(old.status,301,page.file);
    assert.equal(new URL(old.headers.get('location'),base).href,base+page.path+'?review=1');
  }
}
for(const path of ['index.html','about/index.html']){
  const r=await fetch(base+path,{redirect:'manual'});assert.equal(r.status,301,path);
}
const plain=await fetch(base.replace('https:','http:'),{redirect:'manual'});
assert.ok([301,302,307,308].includes(plain.status));
assert.ok(plain.headers.get('location').startsWith('https://'));
const report={domain:base,verifiedFiles:hashes.length,pages:8,legacyRedirects:7,indexRedirects:2,httpsRedirect:true,cdnImages,hashes:hashes.sort()};
await writeFile('.local-deploy/hostinger-verification.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
