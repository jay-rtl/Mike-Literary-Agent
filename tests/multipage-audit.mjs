import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { PAGES, SITE_URL, ACCREDITATION_URL } from '../site-pages.mjs';
const base='http://127.0.0.1:4173/';
const checks=[];
const check=(name,condition)=>{assert.ok(condition,name);checks.push(name)};
const pageResults=await Promise.allSettled(PAGES.map(async page=>{
  const response=await fetch(base+page.file);
  return {...page,status:response.status,html:await response.text()};
}));
for(const result of pageResults)if(result.status!=='fulfilled')throw result.reason;
const pages=pageResults.map(result=>result.value);
const htmlByFile=new Map(pages.map(page=>[page.file,page.html]));
check('Eight real HTML pages return HTTP 200',pages.length===8&&pages.every(page=>page.status===200));
check('Each page has a unique title',new Set(pages.map(page=>page.html.match(/<title>([^<]+)<\/title>/)[1])).size===8);
check('Each page has a unique description',new Set(pages.map(page=>page.html.match(/name="description" content="([^"]+)"/)[1])).size===8);
const sitemap=await readFile('sitemap.xml','utf8');
for(const page of pages){
  const canonical=SITE_URL+(page.key==='home'?'':page.file);
  check(`${page.file}: correct canonical and sitemap URL`,page.html.includes(`<link rel="canonical" href="${canonical}">`)&&sitemap.includes(`<loc>${canonical}</loc>`));
  for(const match of page.html.matchAll(/href="([^"]+)"/g)){
    const href=match[1];
    if(/^(https?:|mailto:|tel:)/.test(href))continue;
    const url=new URL(href,base+page.file);
    const targetFile=url.pathname.slice(1)||'index.html';
    if(!targetFile.endsWith('.html')&&!url.hash)continue;
    const target=htmlByFile.get(targetFile);
    assert.ok(target,`${page.file}: internal page ${href} exists`);
    if(url.hash)assert.ok(target.includes(`id="${url.hash.slice(1)}"`),`${page.file}: destination fragment ${href} exists`);
  }
}
check('All internal page and fragment links resolve',true);
const accreditation=htmlByFile.get('accreditation.html');
check('Reference is linked without auto-embedding third-party content',accreditation.includes(`href="${ACCREDITATION_URL}" target="_blank" rel="noopener noreferrer"`)&&!accreditation.includes('<iframe'));
check('Reference is not represented as independently verified accreditation',accreditation.includes('not independent verification of accreditation')&&!accreditation.includes('certified by CAA'));
check('Submission form exists only on the Contact page',pages.filter(page=>page.html.includes('id="inquiry-form"')).map(page=>page.key).join()==='contact');
const tabs=await(await fetch('http://127.0.0.1:9222/json')).json();
const ws=new WebSocket(tabs.find(tab=>tab.type==='page'&&!tab.url.startsWith('chrome')).webSocketDebuggerUrl);
await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
let seq=0;const pending=new Map(),errors=[],requests=[];
ws.onmessage=event=>{const data=JSON.parse(event.data);if(data.id){const promise=pending.get(data.id);pending.delete(data.id);data.error?promise.reject(data.error):promise.resolve(data.result)}if(data.method==='Runtime.exceptionThrown')errors.push(data.params.exceptionDetails.text);if(data.method==='Log.entryAdded'&&data.params.entry.level==='error')errors.push(data.params.entry.text);if(data.method==='Network.requestWillBeSent')requests.push(data.params.request.url)};
const cdp=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++seq,{resolve,reject});ws.send(JSON.stringify({id:seq,method,params}))});
const evaluate=async expression=>{const result=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));return result.result.value};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
await cdp('Page.enable');await cdp('Runtime.enable');await cdp('Log.enable');await cdp('Network.enable');
await cdp('Emulation.setScriptExecutionDisabled',{value:false});
await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
const layouts=[];
for(const page of pages){
  await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await cdp('Page.navigate',{url:base+page.file});await wait(300);
  await evaluate('document.fonts.ready');
  check(`${page.file}: JavaScript initializes without form/stage assumptions`,await evaluate(`document.body.dataset.page==='${page.key}' && document.documentElement.classList.contains('js-nav')`));
  check(`${page.file}: page navigation states match real destinations`,await evaluate("[...document.querySelectorAll('a[aria-current=page]')].every(a=>new URL(a.href).pathname===location.pathname)"));
  for(const width of [1440,768,390,320]){
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await wait(80);
    const layout=await evaluate("({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,headerWidth:document.querySelector('.header-inner').getBoundingClientRect().width})");
    layouts.push({page:page.file,...layout});
    check(`${page.file}: no overflow at ${width}px`,layout.scrollWidth<=width);
    if(width===1440||width===390){const shot=await cdp('Page.captureScreenshot',{format:'png'});await writeFile(`tests/multipage-${page.key}-${width}.png`,Buffer.from(shot.data,'base64'))}
  }
  if(page.key==='about'||page.key==='home'||page.key==='film'){
    await evaluate("document.querySelector('main img').scrollIntoView({behavior:'instant'})");await wait(300);
    check(`${page.file}: portrait/supporting image loads`,await evaluate("document.querySelector('main img').complete && document.querySelector('main img').naturalWidth>0"));
  }
}
for(const [fragment,target] of [['about','about.html'],['rights','global-rights.html'],['contact','contact.html'],['process','for-authors.html']]){
  await cdp('Page.navigate',{url:base+'#'+fragment});await wait(400);
  check(`Legacy #${fragment} opens ${target}`,await evaluate(`location.pathname.endsWith('/${target}') && document.getElementById('${fragment}')!==null`));
}
check('No automatic external requests from accreditation or other pages',requests.every(url=>url.startsWith(base)));
check('No browser exceptions or error logs across all pages',errors.length===0);
await writeFile('tests/multipage-results.json',JSON.stringify({environment:'Windows headless Chrome via CDP',checks,layouts,errors},null,2));
console.log(`PASS: ${checks.length} multipage checks; eight pages, four viewport widths, internal fragments, reference presentation, legacy links, and no runtime errors.`);
ws.close();
