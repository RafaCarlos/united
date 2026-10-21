import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
const config=JSON.parse(await fs.readFile(path.join(root,'release.config.json'),'utf8'));
const report=JSON.parse(await fs.readFile(path.join(root,'reports/production-build.json'),'utf8'));
const errors=[],legacyLinks=new Set(),ids=new Map(),titles=new Set(),descriptions=[];
const descriptionOwners=new Map();
const knownLegacyPaths=new Set(config.legacyPaths||[
 '/blog/ingles-para-negocios/', '/cursos-de-ingles-unitedidiomas',
 '/o-curso/curso-de-ingles-para-carreira', '/o-curso/curso-de-ingles-para-certificacao-toefl',
 '/o-curso/curso-de-ingles-para-empreendedor', '/o-curso/curso-de-ingles-para-viagem',
 '/o-melhor-curso-de-ingles', '/cursos/', '/blog/author/ublogadmin/', '/blog/author/urafael/'
]);
const documents=new Map();
const exists=async name=>{try{return (await fs.stat(path.join(dist,name))).isFile();}catch{return false;}};
const normalizeFile=p=>decodeURIComponent(p).replace(/^\//,'').replace(/\/$/,'/index.html')||'index.html';
for(const [source,route] of Object.entries(report.routes)){
 const file=normalizeFile(route),html=await fs.readFile(path.join(dist,file),'utf8');
 const dom=new JSDOM(html);const d=dom.window.document;documents.set(file,dom);
 ids.set(file,new Set([...d.querySelectorAll('[id]')].map(n=>n.id)));
 const check=(ok,text)=>{if(!ok)errors.push(`${file}: ${text}`);};
 check(d.querySelectorAll('h1').length===1,'expected one H1');
 check(d.documentElement.lang==='pt-BR','missing language');
 check(Boolean(d.title)&&!titles.has(d.title),'missing/duplicate title');titles.add(d.title);
 check(d.querySelector('link[rel=canonical]')?.href===config.origin+route,'canonical mismatch');
 check(d.querySelector('meta[property="og:url"]')?.content===config.origin+route,'OG URL mismatch');
 check(!/noindex/.test(d.querySelector('meta[name=robots]')?.content||''),'noindex in production');
 const description=d.querySelector('meta[name=description]')?.content||'';
 check(Boolean(description),'missing description');descriptions.push({file,length:description.length});
 check(!descriptionOwners.has(description),'duplicate description');descriptionOwners.set(description,file);
 check(d.querySelector('meta[property="og:title"]')?.content===d.title,'OG title mismatch');
 check(d.querySelector('meta[property="og:description"]')?.content===description,'OG description mismatch');
 const allIds=[...d.querySelectorAll('[id]')].map(n=>n.id);
 check(new Set(allIds).size===allIds.length,'duplicate IDs');
 for(const img of d.querySelectorAll('img'))check(img.hasAttribute('alt')&&img.hasAttribute('width')&&img.hasAttribute('height'),'image missing alt/dimensions');
 for(const node of d.querySelectorAll('script[type="application/ld+json"]')){try{JSON.parse(node.textContent);}catch{check(false,'invalid JSON-LD');}}
 check(!/(?:127\.0\.0\.1|localhost|file:\/\/|\/Users\/eduardo)/.test(html),'local development reference in HTML');
}
let checkedReferences=0;
for(const [file,dom] of documents){
 const d=dom.window.document;
 const verify=async(raw,kind)=>{
  if(!raw||/^(?:data:|mailto:|tel:|javascript:)/.test(raw))return;
  const u=new URL(raw,config.origin+'/'+file);
  if(u.origin!==config.origin)return;
  const target=normalizeFile(u.pathname);checkedReferences++;
  if(!await exists(target)){
   // Absolute references to existing WordPress/catalog pages are retained.
   if(kind==='link'&&/^https?:/.test(raw)&&knownLegacyPaths.has(u.pathname)){legacyLinks.add(u.pathname);return;}
   errors.push(`${file}: missing ${kind} ${raw}`);return;
  }
  if(kind==='link'&&u.hash&&!u.hash.startsWith('#:~:text')&&ids.has(target)&&!ids.get(target).has(decodeURIComponent(u.hash.slice(1))))errors.push(`${file}: missing anchor ${raw}`);
 };
 for(const el of d.querySelectorAll('[src],[poster]'))for(const attr of ['src','poster'])if(el.hasAttribute(attr))await verify(el.getAttribute(attr),'asset');
 for(const el of d.querySelectorAll('a[href],link[href]'))await verify(el.getAttribute('href'),el.localName==='a'?'link':el.rel==='canonical'?'link':'asset');
 for(const el of d.querySelectorAll('[srcset],[imagesrcset]'))for(const attr of ['srcset','imagesrcset'])if(el.hasAttribute(attr))for(const src of el.getAttribute(attr).split(','))await verify(src.trim().split(/\s+/)[0],'asset');
 for(const el of d.querySelectorAll('meta[property="og:image"],meta[name="twitter:image"]'))await verify(el.content,'social-image');
}
for(const f of report.inventory){
 if(f.file.endsWith('.js')){const code=await fs.readFile(path.join(dist,f.file),'utf8');try{new vm.Script(code);}catch(e){errors.push(`${f.file}: ${e.message}`);}if(/127\.0\.0\.1|localhost|file:\/\/|\/Users\/eduardo/.test(code))errors.push(`${f.file}: local development URL in production JavaScript`);}
 if(f.file.endsWith('.css')){
  const css=await fs.readFile(path.join(dist,f.file),'utf8');
  for(const [,raw] of css.matchAll(/url\(\s*['"]?([^'"\)]+)['"]?\s*\)/g)){
   if(/^(data:|https?:|#)/.test(raw))continue;
   const u=new URL(raw,config.origin+'/'+f.file);if(!await exists(normalizeFile(u.pathname)))errors.push(`${f.file}: missing CSS asset ${raw}`);
  }
 }
}
for(const dom of documents.values())dom.window.close();
const sitemap=await fs.readFile(path.join(dist,'sitemap-united-pages.xml'),'utf8');
const sitemapDom=new JSDOM(sitemap,{contentType:'text/xml'});
const sitemapURLs=[...sitemapDom.window.document.querySelectorAll('url > loc')].map(node=>node.textContent);
const expectedURLs=new Set(Object.values(report.routes).map(route=>config.origin+route));
if(sitemapURLs.length!==expectedURLs.size||new Set(sitemapURLs).size!==sitemapURLs.length||sitemapURLs.some(url=>!expectedURLs.has(url)))errors.push('Sitemap does not exactly match production page canonicals');
sitemapDom.window.close();
if(await exists('robots.txt')){const robots=await fs.readFile(path.join(dist,'robots.txt'),'utf8');if(/^Disallow:\s*\/$/mi.test(robots))errors.push('Production robots.txt blocks all public pages');}
for(const record of report.inventory){const file=record.file;if(/(^|\/)(?:evidence|node_modules|\.git|editorial|tools|reports)\//.test(file)||/content-source\.json$/.test(file))errors.push(`Private build file in production: ${file}`);}
const result={passed:errors.length===0,pages:documents.size,checkedReferences,errors,legacyProductionPaths:[...legacyLinks].sort(),longDescriptions:descriptions.filter(d=>d.length>220).length,notes:['Long editorial descriptions retained rather than truncating sentences.','This automated validator does not submit leads. The separately authorized real test is recorded in reports/rd-integration.json. Production server/redirects/consent/analytics require integration verification.']};
await fs.writeFile(path.join(root,'reports/validation.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));if(errors.length)process.exitCode=1;
