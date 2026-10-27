import { writeFile } from 'node:fs/promises';
import { PAGES } from '../site-pages.mjs';
const tabs=await(await fetch('http://127.0.0.1:9222/json')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page'&&t.url.startsWith('http://127.0.0.1')).webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map();ws.onmessage=e=>{const v=JSON.parse(e.data);if(v.id){pending.get(v.id)(v.result);pending.delete(v.id)}};
const call=(method,params={})=>new Promise(r=>{pending.set(++id,r);ws.send(JSON.stringify({id,method,params}))});
const run=async expression=>(await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
await call('Page.enable');await call('Runtime.enable');
await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
await call('Page.reload');await new Promise(r=>setTimeout(r,500));
for(const width of [1440,390]){
 await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
 for(const section of ['about','representation','rights','film','authors','process','faq','contact']){
  const page=PAGES.find(page=>page.sections.includes(section));
  await call('Page.navigate',{url:`http://127.0.0.1:4173/${page.file}`});
  await new Promise(r=>setTimeout(r,250));
  await run(`document.getElementById('${section}').scrollIntoView({behavior:'instant'})`);
  await new Promise(r=>setTimeout(r,100));
  const shot=await call('Page.captureScreenshot',{format:'png'});
  await writeFile(`tests/review-${section}-${width}.png`,Buffer.from(shot.data,'base64'));
 }
}
const pairs=[['body','#20242b','#f7f4ec'],['muted','#5e6268','#f7f4ec'],['eyebrow','#79602a','#f7f4ec'],['hero-body','#bfc5cf','#101b2e'],['gold-button','#101b2e','#d1b675'],['form-help','#bfc5cf','#14213d'],['error','#ffd0bd','#14213d'],['muted-soft','#5e6268','#ede9df']];
function lum(hex){const c=hex.match(/[a-f\d]{2}/gi).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722}
const contrast=pairs.map(([name,fg,bg])=>{const a=lum(fg),b=lum(bg);return{name,ratio:Math.round((Math.max(a,b)+.05)/(Math.min(a,b)+.05)*100)/100,AA:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5}});
await writeFile('tests/contrast-results.json',JSON.stringify(contrast,null,2));console.log(contrast);
ws.close();
