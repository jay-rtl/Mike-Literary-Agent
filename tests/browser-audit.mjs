import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const tabs = await (await fetch('http://127.0.0.1:9222/json')).json();
const ws = new WebSocket(tabs.find(tab => tab.type === 'page' && !tab.url.startsWith('chrome')).webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, {once:true}));
let sequence = 0;
const calls = new Map();
const errors = [];
const requests = [];
ws.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if(message.id) { const call=calls.get(message.id); calls.delete(message.id); message.error ? call.reject(message.error) : call.resolve(message.result); }
  if(message.method==='Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
  if(message.method==='Log.entryAdded' && message.params.entry.level==='error') errors.push(message.params.entry.text);
  if(message.method==='Network.requestWillBeSent') requests.push(message.params.request.url);
});
function cdp(method,params={}) { return new Promise((resolve,reject)=>{const id=++sequence; calls.set(id,{resolve,reject}); ws.send(JSON.stringify({id,method,params}));}); }
async function evaluate(expression) { const result=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true}); if(result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails)); return result.result.value; }
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const result={environment:'Chrome headless, Windows, CDP',checks:[],layouts:[]};
function check(name,value){assert.ok(value,name);result.checks.push(name);}
await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Network.enable'); await cdp('Log.enable');
await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await cdp('Page.navigate',{url:'http://127.0.0.1:4173/'}); await delay(1000);
check('Title and description',await evaluate("document.title.includes('Mike Petro') && document.querySelector('meta[name=description]').content.length>50"));
check('All internal anchor destinations exist',await evaluate("[...document.querySelectorAll('a[href^=\"#\"]')].every(a=>document.getElementById(a.hash.slice(1)))"));
check('Both supplied portraits load',await evaluate("[...document.querySelectorAll('.hero-portrait img,.about-portrait img')].every(i=>i.complete && i.naturalWidth>0) && document.querySelectorAll('.hero-portrait img,.about-portrait img').length===2"));
check('Email displayed in contact and footer with correct mailto links',await evaluate("[...document.querySelectorAll('.email-link,.footer-email')].length===2 && [...document.querySelectorAll('.email-link,.footer-email')].every(a=>a.getAttribute('href')==='mailto:mike.petro@lexiconinkhouse.com' && a.textContent.includes('mike.petro@lexiconinkhouse.com'))"));
check('Phone destinations correct',await evaluate("[...document.querySelectorAll('a[href^=\"tel:\"]')].every(a=>a.getAttribute('href')==='tel:+13322085295')"));
check('Structured data parses',await evaluate("JSON.parse(document.querySelector('script[type=\"application/ld+json\"]').textContent)['@type']==='Person'"));
await evaluate("document.querySelector('#inquiry-form').requestSubmit()");
check('Required fields have associated errors and focus',await evaluate("document.querySelectorAll('[aria-invalid=true]').length===4 && document.activeElement.id==='full-name' && document.getElementById('full-name-error').textContent.length>0"));
await evaluate("document.querySelector('#full-name').value='Test Author';document.querySelector('#email').value='not-an-email';document.querySelector('#book-title').value='A Book & A Screen?';document.querySelector('#message').value='A message with & and # and Unicode — text.';document.querySelector('#inquiry-form').requestSubmit()");
check('Invalid email rejected',await evaluate("document.activeElement.id==='email' && document.querySelector('#email').getAttribute('aria-invalid')==='true'"));
await evaluate("document.querySelector('#email').value='author@example.com';document.querySelector('#open-email').addEventListener('click',e=>e.preventDefault(),{once:true});document.querySelector('#inquiry-form').requestSubmit()");
check('User-supplied recipient used by the inquiry draft',await evaluate("new URL(document.querySelector('#open-email').href).pathname==='mike.petro@lexiconinkhouse.com' && document.querySelector('#prepared-message').value.includes('To: mike.petro@lexiconinkhouse.com')"));
await evaluate("window.MIKE_PETRO_CONFIG={recipientEmail:''};document.querySelector('#inquiry-form').requestSubmit()");
check('Missing recipient gives honest configuration state and draft',await evaluate("!document.querySelector('#email-fallback').hidden && document.querySelector('#form-status').textContent.includes('not been configured') && document.querySelector('#open-email').hidden && document.querySelector('#prepared-message').value.includes('Full Name: Test Author')"));
// Configure only this browser session. Prevent launching an external mail application.
await evaluate("window.MIKE_PETRO_CONFIG={recipientEmail:'qa@example.com'};window.__mailClicks=0;document.querySelector('#open-email').addEventListener('click',e=>{e.preventDefault();window.__mailClicks++});document.querySelector('#inquiry-form').requestSubmit()");
const mail=await evaluate("document.querySelector('#open-email').href");
const parsed=new URL(mail);
check('Configured recipient and correctly encoded subject/body',parsed.pathname==='qa@example.com' && parsed.searchParams.get('subject')==='Literary Representation Inquiry — A Book & A Screen?' && parsed.searchParams.get('body').includes('A message with & and # and Unicode — text.'));
check('Manual email draft link activated',await evaluate('window.__mailClicks===1'));
await cdp('Browser.grantPermissions',{origin:'http://127.0.0.1:4173',permissions:['clipboardReadWrite','clipboardSanitizedWrite']});
await cdp('Page.bringToFront');
await evaluate("document.querySelector('#copy-message').click()"); await delay(300);
check('Clipboard copy succeeds',await evaluate("document.querySelector('#copy-message').textContent==='Message copied'"));
const clipboard=await evaluate('navigator.clipboard.readText()');
check('Clipboard contains full draft',clipboard.includes('To: qa@example.com') && clipboard.includes('Full Name: Test Author'));
await evaluate("window.__clipboard=Object.getOwnPropertyDescriptor(Navigator.prototype,'clipboard');Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined});document.querySelector('#copy-message').click()"); await delay(100);
check('Clipboard unavailable: select-text fallback works',await evaluate("document.activeElement.id==='prepared-message' && document.querySelector('#prepared-message').selectionEnd===document.querySelector('#prepared-message').value.length"));
await evaluate("document.querySelector('#message').value='Revised';document.querySelector('#message').dispatchEvent(new Event('input',{bubbles:true}))");
check('Edits invalidate previous draft',await evaluate("document.querySelector('#email-fallback').hidden"));
await evaluate("document.querySelector('[data-stage=\"03\"]').click()");
check('Interactive stages update state and content',await evaluate("document.querySelector('[data-stage=\"03\"]').getAttribute('aria-expanded')==='true' && !document.querySelector('#process-03').hidden && document.querySelector('#process-01').hidden"));
await evaluate("document.querySelector('summary').focus()");
await cdp('Input.dispatchKeyEvent',{type:'rawKeyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32});
await delay(100);
check('FAQ opens with keyboard',await evaluate("document.querySelector('details').open"));
for(const [width,height] of [[1440,1000],[1024,900],[768,1024],[390,844],[320,740]]){
 await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
 await evaluate("window.scrollTo({top:0,behavior:'instant'})");await delay(400);
 const layout=await evaluate("({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,images:[...document.images].map(i=>({width:i.naturalWidth,loaded:i.complete&&i.naturalWidth>0})),heroHeading:Math.round(document.querySelector('h1').getBoundingClientRect().width)})");
 check(`No horizontal overflow at ${width}px`,layout.scrollWidth<=width);result.layouts.push(layout);
 if(width===1440||width===390||width===768){const shot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(`tests/preview-${width}.png`,Buffer.from(shot.data,'base64'));}
}
await evaluate("document.querySelector('.menu-toggle').click()");
check('Mobile navigation opens',await evaluate("document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='true' && getComputedStyle(document.querySelector('#primary-nav')).display==='flex'"));
check('Mobile toggle has no border and animated icon enters close state',await evaluate("getComputedStyle(document.querySelector('.menu-toggle')).borderTopWidth==='0px' && document.querySelector('.menu-label').textContent==='Close' && document.querySelector('.menu-toggle').getAttribute('aria-label')==='Close navigation menu'"));
await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
check('Escape closes navigation and returns focus',await evaluate("document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='false' && document.activeElement.classList.contains('menu-toggle')"));
await evaluate("document.querySelector('.menu-toggle').click();document.querySelector('#primary-nav a[href=\"#about\"]').click()");await delay(200);
check('Mobile link closes navigation and focuses destination',await evaluate("document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='false' && document.activeElement.id==='about'"));
await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
await delay(150);
check('Reduced motion disables animation and smooth scrolling',await evaluate("getComputedStyle(document.documentElement).scrollBehavior==='auto' && getComputedStyle(document.querySelector('.hero-copy')).animationName==='none' && document.querySelectorAll('.pending').length===0"));
await evaluate("scrollTo({top:2000,behavior:'instant'})");await delay(200);
check('Back to top appears after scrolling',await evaluate("!document.querySelector('.back-top').hidden"));
// No JavaScript: primary content and navigation remain available.
await cdp('Emulation.setScriptExecutionDisabled',{value:true});await cdp('Page.reload');await delay(500);
check('No-JavaScript navigation, content, and all process stages remain visible',await evaluate("getComputedStyle(document.querySelector('#primary-nav')).display!=='none' && [...document.querySelectorAll('.process-panels article')].every(a=>!a.hidden) && getComputedStyle(document.querySelector('.about-copy')).opacity==='1'"));
check('No-JavaScript form cannot submit personal data through a GET request',await evaluate("document.querySelector('#inquiry-form [type=submit]').disabled"));
await cdp('Emulation.setScriptExecutionDisabled',{value:false});
// Production page makes only local static requests; no inquiry transmission.
check('No third-party requests or form network submission',requests.filter(u=>!u.startsWith('http://127.0.0.1:4173/')).length===0);
result.runtimeErrors=errors;
result.requests=[...new Set(requests)];
result.performance=await evaluate("performance.getEntriesByType('navigation').map(e=>({domContentLoadedMs:e.domContentLoadedEventEnd,durationMs:e.duration,transferBytes:e.transferSize}))");
if(errors.length) console.error('Browser errors:',errors);
check('No runtime exceptions or browser error logs',errors.length===0);
await writeFile('tests/audit-results.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
ws.close();

