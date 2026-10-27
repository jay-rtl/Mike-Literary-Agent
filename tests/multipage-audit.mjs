import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { PAGES, SITE_URL } from '../site-pages.mjs';
const base='http://127.0.0.1:4173/';
const checks=[];
const check=(name,condition)=>{assert.ok(condition,name);checks.push(name)};
const pageResults=await Promise.allSettled(PAGES.map(async page=>{
  const response=await fetch(base+page.path);
  return {...page,status:response.status,html:await response.text()};
}));
for(const result of pageResults)if(result.status!=='fulfilled')throw result.reason;
const pages=pageResults.map(result=>result.value);
const htmlByFile=new Map(pages.map(page=>[page.path,page.html]));
check('Eight real HTML pages return HTTP 200',pages.length===8&&pages.every(page=>page.status===200));
check('Each page has a unique title',new Set(pages.map(page=>page.html.match(/<title>([^<]+)<\/title>/)[1])).size===8);
check('Each page has a unique description',new Set(pages.map(page=>page.html.match(/name="description" content="([^"]+)"/)[1])).size===8);
const sitemap=await readFile('sitemap.xml','utf8');
for(const page of pages){
  const canonical=SITE_URL+page.path;
  check(`${page.file}: correct canonical and sitemap URL`,page.html.includes(`<link rel="canonical" href="${canonical}">`)&&sitemap.includes(`<loc>${canonical}</loc>`));
  for(const match of page.html.matchAll(/href="([^"]+)"/g)){
    const href=match[1];
    if(/^(https?:|mailto:|tel:)/.test(href))continue;
    const url=new URL(href,base+page.path);
    const targetFile=url.pathname.slice(1);
    if(/\.(?:css|js|woff2|ico|svg|png|jpe?g)$/.test(targetFile)&&!url.hash)continue;
    const target=htmlByFile.get(targetFile);
    assert.ok(target,`${page.file}: internal page ${href} exists`);
    if(url.hash)assert.ok(target.includes(`id="${url.hash.slice(1)}"`),`${page.file}: destination fragment ${href} exists`);
  }
}
check('All internal page and fragment links resolve',true);
const accreditation=htmlByFile.get('accreditation/');
check('Accreditation content is native with no Google Sites link or iframe',!accreditation.includes('sites.google.com')&&!accreditation.includes('<iframe')&&accreditation.includes('class="credential-hero"'));
check('Compact page retains written terms, author interests, and independent context',accreditation.includes('WRITTEN TERMS')&&accreditation.includes('AUTHOR INTERESTS')&&accreditation.includes('INDEPENDENT PROFILE'));
check('Supplied reference identifier is contextualized rather than certified',accreditation.includes('BKSTD2357400')&&accreditation.includes('not an independently verified accreditation number'));
check('Industry context distinguishes independent profile from CAA-issued accreditation',accreditation.includes('not a CAA-issued certificate')&&accreditation.includes('https://www.caa.com/about-us'));
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
  await cdp('Page.navigate',{url:base+page.path});await wait(300);
  await evaluate('document.fonts.ready');
  check(`${page.file}: JavaScript initializes without form/stage assumptions`,await evaluate(`document.body.dataset.page==='${page.key}' && document.documentElement.classList.contains('js-nav')`));
  check(`${page.file}: page navigation states match real destinations`,await evaluate("[...document.querySelectorAll('a[aria-current=page]')].every(a=>new URL(a.href).pathname===location.pathname)"));
  check(`${page.key}: navigation uses clean URLs`,await evaluate("[...document.querySelectorAll('a[href]')].filter(a=>a.origin===location.origin).every(a=>!a.pathname.endsWith('.html'))"));
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
  if(page.key==='accreditation'){
    await evaluate("window.__printRequested=0;window.print=()=>{window.__printRequested++};document.querySelectorAll('[data-print-profile]').forEach(button=>button.click())");
    check('Both print buttons invoke the browser print action',await evaluate('window.__printRequested===2'));
    await cdp('Emulation.setEmulatedMedia',{media:'print',features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    check('Print layout hides navigation and preserves profile text',await evaluate("getComputedStyle(document.querySelector('.site-header')).display==='none' && getComputedStyle(document.querySelector('.credential-card')).display!=='none' && getComputedStyle(document.querySelector('.credential-card')).opacity==='1'"));
    const pdf=await cdp('Page.printToPDF',{printBackground:true,preferCSSPageSize:true});
    const bytes=Buffer.from(pdf.data,'base64');
    check('Native profile renders a nonempty printable PDF',bytes.length>5000&&bytes.subarray(0,4).toString()==='%PDF');
    check('Printable reference fits on exactly one A4 page',(bytes.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length===1);
    await writeFile('tests/accreditation-print.pdf',bytes);
    await cdp('Emulation.setEmulatedMedia',{media:'screen',features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  }
}
for(const page of pages.filter(page=>page.key!=='home')){
  await cdp('Page.navigate',{url:base+page.file+'?source=old-link#top'});await wait(350);
  check(`${page.file}: old bookmark redirects without losing query or fragment`,await evaluate(`location.pathname==='/${page.path}' && location.search==='?source=old-link' && location.hash==='#top'`));
}
await cdp('Page.navigate',{url:base+'representation/index.html?source=index#representation'});await wait(350);
check('Explicit nested index.html redirects to its clean directory URL',await evaluate("location.pathname==='/representation/' && location.search==='?source=index' && location.hash==='#representation'"));
await cdp('Page.navigate',{url:base+'index.html?source=home#top'});await wait(350);
check('Explicit home index.html redirects to root',await evaluate("location.pathname==='/' && location.search==='?source=home' && location.hash==='#top'"));
for(const [fragment,target] of [['about','about/'],['rights','global-rights/'],['contact','contact/'],['process','for-authors/']]){
  await cdp('Page.navigate',{url:base+'#'+fragment});await wait(400);
  check(`Legacy #${fragment} opens ${target}`,await evaluate(`location.pathname.endsWith('/${target}') && document.getElementById('${fragment}')!==null`));
}
check('No automatic external requests from accreditation or other pages',requests.every(url=>url.startsWith(base)));
check('No browser exceptions or error logs across all pages',errors.length===0);
await writeFile('tests/multipage-results.json',JSON.stringify({environment:'Windows headless Chrome via CDP',checks,layouts,errors},null,2));
console.log(`PASS: ${checks.length} multipage checks; eight pages, four viewport widths, internal fragments, reference presentation, legacy links, and no runtime errors.`);
ws.close();
