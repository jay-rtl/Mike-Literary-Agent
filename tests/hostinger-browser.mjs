import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {PAGES} from '../site-pages.mjs';
const base='https://mikepetro.independentliteraryagent.net/';
const tabs=await(await fetch('http://127.0.0.1:9222/json')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map(),errors=[];
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)(m.result);pending.delete(m.id)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text)};
const cdp=(method,params={})=>new Promise(resolve=>{pending.set(++id,resolve);ws.send(JSON.stringify({id,method,params}))});
const evaluate=async expression=>(await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
async function navigate(path){
  await cdp('Page.navigate',{url:base+path});
  for(let i=0;i<80;i++){
    if(await evaluate(`location.href===${JSON.stringify(base+path)}&&document.readyState==='complete'&&!!document.querySelector('main')`)){await evaluate('document.fonts.ready');return;}
    await new Promise(r=>setTimeout(r,250));
  }throw Error('Load timed out: '+path);
}
await cdp('Page.enable');await cdp('Runtime.enable');
await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
for(const p of PAGES){
  await navigate(p.path);
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,p.path);
  assert.equal(await evaluate(`document.querySelector('link[rel=canonical]').href===${JSON.stringify(base+p.path)}`),true);
  assert.equal(await evaluate("[...document.images].filter(i=>i.loading!=='lazy').every(i=>i.complete&&i.naturalWidth>0)"),true,p.path);
}
await navigate('');
await writeFile('tests/hostinger-home-desktop.png',Buffer.from((await cdp('Page.captureScreenshot',{format:'png'})).data,'base64'));
for(const width of [768,390]){
  await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
}
await evaluate("document.querySelector('.menu-toggle').click()");
assert.equal(await evaluate("document.querySelector('.menu-toggle').getAttribute('aria-expanded')"),'true');
assert.equal(await evaluate("getComputedStyle(document.querySelector('.menu-toggle')).borderTopWidth"),'0px');
await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
assert.equal(await evaluate("document.querySelector('.menu-toggle').getAttribute('aria-expanded')"),'false');
await writeFile('tests/hostinger-home-mobile.png',Buffer.from((await cdp('Page.captureScreenshot',{format:'png'})).data,'base64'));
await navigate('contact/');
assert.ok(await evaluate("!!document.querySelector('a[href=\"mailto:mike.literaryagent@gmail.com\"]')"));
await navigate('accreditation/');
await evaluate("window.__prints=0;window.print=()=>window.__prints++;document.querySelectorAll('[data-print-profile]').forEach(b=>b.click())");
assert.equal(await evaluate('window.__prints'),2);
await cdp('Emulation.setEmulatedMedia',{media:'print'});
const pdf=Buffer.from((await cdp('Page.printToPDF',{printBackground:true,preferCSSPageSize:true})).data,'base64');
const pages=(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length;
assert.equal(pages,4);await writeFile('tests/hostinger-accreditation-print.pdf',pdf);
await cdp('Emulation.setEmulatedMedia',{media:'screen'});
assert.deepEqual(errors,[]);
console.log('PASS: 8 rendered desktop routes, 768/390px homepage, loaded main images, borderless menu and Escape, Gmail link, 2 print controls, 4-page live PDF, no JS exceptions.');
ws.close();
