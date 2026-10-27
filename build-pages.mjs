// Generate complete static pages from preserved, editable portfolio content.
import { readFile, writeFile } from 'node:fs/promises';
import { PAGES, SITE_URL } from './site-pages.mjs';
const source = await readFile('content/portfolio.html','utf8');
const sectionMatches = [...source.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/g)];
const sections = new Map(sectionMatches.map(match=>[match[0].match(/\bid="([^"]+)"/)?.[1],match[0]]));
const intro = sectionMatches.find(match=>match[0].includes('class="editorial-intro"'))[0];
const originalHead = source.slice(0,source.indexOf('<body>'));
const originalHeader = source.match(/<header\b[\s\S]*?<\/header>/)[0];
const originalFooter = source.match(/<footer\b[\s\S]*?<\/footer>/)[0];
const escape = value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const routes = new Map(PAGES.flatMap(page=>page.sections.map(id=>[id,page.file])));
const navigation = [['home','Home'],['about','About'],['representation','Representation'],['authors','For Authors'],['accreditation','Accreditation'],['contact','Let’s talk']];
const servicePages = PAGES.filter(page=>['representation','rights','film'].includes(page.key));
const cta = `<section class="chapter-cta"><div class="wrap"><div><p class="eyebrow">THE NEXT CHAPTER</p><h2>Let’s talk about<br><em>your work.</em></h2></div><div><p>Begin with an introduction to your manuscript, your goals, and the rights you control.</p><a class="button gold" href="contact.html">Contact Mike <span aria-hidden="true">↗</span></a></div></div></section>`;
const overview = `<section class="section home-overview"><div class="wrap"><div class="section-heading reveal"><div><p class="eyebrow">EXPLORE REPRESENTATION</p><h2>A wider life<br><em>for the work.</em></h2></div><p>Publishing, international editions, new formats, and potential screen opportunities. Explore each area of representation.</p></div><div class="overview-links">${[
  ['representation.html','01','Literary representation','Positioning, submissions, and a publishing strategy specific to the manuscript.'],
  ['global-rights.html','02','Global & subsidiary rights','International editions, translation, audio, and applicable licensing opportunities.'],
  ['film-television.html','03','Film & television','Consideration of literary properties for potential adaptation.']
].map(([file,number,title,description])=>`<a class="overview-link reveal" href="${file}"><span class="number">${number}</span><h3>${title}</h3><p>${description}</p><span aria-hidden="true">↗</span></a>`).join('')}</div></div></section>`;
const accreditation = await readFile('content/accreditation.html','utf8');
for(const page of PAGES){
  const canonical = SITE_URL+(page.key==='home'?'':page.file);
  let head=originalHead.replace(/<title>[\s\S]*?<\/title>/,`<title>${escape(page.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]+/,`$1${escape(page.description)}`)
    .replace(/(<link rel="canonical" href=")[^"]+/,`$1${canonical}`)
    .replace(/(<meta property="og:url" content=")[^"]+/,`$1${canonical}`)
    .replace(/(<meta property="og:title" content=")[^"]+/,`$1${escape(page.title)}`)
    .replace(/(<meta property="og:description" content=")[^"]+/,`$1${escape(page.description)}`)
    .replace(/(<meta name="twitter:title" content=")[^"]+/,`$1${escape(page.title)}`)
    .replace(/(<meta name="twitter:description" content=")[^"]+/,`$1${escape(page.description)}`);
  const nav = navigation.map(([key,label])=>{
    const target=PAGES.find(candidate=>candidate.key===key);
    return `<a href="${target.file}"${key===page.key?' aria-current="page"':''}${key==='contact'?' class="nav-contact"':''}>${label}${key==='contact'?' <span aria-hidden="true">↗</span>':''}</a>`;
  }).join('');
  const header=originalHeader.replace(/(<nav id="primary-nav"[^>]*>)[\s\S]*?(<\/nav>)/,`$1${nav}$2`).replace('href="#home"','href="index.html"');
  const footerLinks=PAGES.map(target=>`<a href="${target.file}"${target.key===page.key?' aria-current="page"':''}>${target.label}</a>`).join('')+'<a href="for-authors.html#process">The Process</a><a href="for-authors.html#faq">FAQs</a>';
  const footer=originalFooter.replace(/(<nav class="footer-nav"[^>]*>)[\s\S]*?(<\/nav>)/,`$1${footerLinks}$2`).replaceAll('href="#home"','href="#top"').replace(/(<a class="brand" )href="#top"/,'$1href="index.html"');
  let content=page.sections.map(id=>{
    if(!sections.has(id))throw new Error(`Missing source section ${id}`);
    return sections.get(id);
  }).join('\n');
  if(page.key==='representation')content=content.replace('Your manuscript is<br><em>the beginning.</em>','Your manuscript<br><em>is the beginning.</em>');
  if(page.key==='home') content+=`\n${intro}\n${overview}`;
  else content=`<section class="page-intro"><div class="wrap"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span aria-hidden="true">/</span><span aria-current="page">${page.label}</span></nav><p class="eyebrow">MIKE PETRO / INDEPENDENT REPRESENTATION</p><h1>${page.heading}</h1></div></section>\n${content}`;
  if(servicePages.includes(page)) content=content.replace('</section>',`</section><nav class="service-navigation wrap" aria-label="Representation areas">${servicePages.map(target=>`<a href="${target.file}"${target===page?' aria-current="page"':''}>${target.label}</a>`).join('')}</nav>`);
  if(page.key==='accreditation') content+=accreditation;
  if(page.key!=='contact')content+=cta;
  // Keep local fragments local; route links to moved sections to their own page.
  content=content.replace(/href="#([^"]+)"/g,(match,id)=>{
    if(id==='main'||id==='top'||page.sections.includes(id))return match;
    return routes.has(id)?`href="${routes.get(id)}#${id}"`:match;
  });
  await writeFile(page.file,`${head}<body id="top" data-page="${page.key}">\n<a class="skip-link" href="#main">Skip to content</a>\n${header}\n<main id="main">${content}</main>\n${footer}\n<a class="back-top" href="#top" aria-label="Back to top" hidden>↑</a>\n</body>\n</html>\n`);
}
await writeFile('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${PAGES.map(page=>`  <url><loc>${SITE_URL}${page.key==='home'?'':page.file}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`Generated ${PAGES.length} standalone pages and sitemap.`);
